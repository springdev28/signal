import * as THREE from 'three';

type Activity = { scan: number; pickup: number; assemble: number; talk: number; walking: number };
const looks = [[0,0,0],[.55,-.27,.12],[2.7,.27,.06],[4.6,.08,-.19],[6.7,-.25,.07],[9,0,.14],[11,0,0]] as const;

function blinkAt(time:number,start:number){
  const t=time-start;
  if(t<0||t>.24)return 0;
  return t<.07?THREE.MathUtils.smoothstep(t,0,.07):1-THREE.MathUtils.smoothstep(t,.115,.24);
}

export function digitalEyeState(time:number,activity:Activity,reducedMotion=false){
  const t=reducedMotion?0:((time%13)+13)%13;
  let index=0;for(let i=1;i<looks.length;i++)if(t>=looks[i][0])index=i;
  const current=looks[index],prior=looks[Math.max(0,index-1)];
  const transition=THREE.MathUtils.smoothstep(t-current[0],0,.22);
  const idle=1-activity.walking*.82;
  let x=THREE.MathUtils.lerp(prior[1],current[1],transition)*idle;
  let y=THREE.MathUtils.lerp(prior[2],current[2],transition)*idle;
  x=THREE.MathUtils.lerp(x,reducedMotion?0:Math.sin(time*1.35)*.31,activity.scan);
  y=THREE.MathUtils.lerp(y,-.23,Math.max(activity.pickup,activity.assemble));
  const closure=Math.max(...[1.55,5.6,5.96,10.4].map(start=>blinkAt(t,start)));
  return {x,y,open:1-closure,scan:activity.scan,time:reducedMotion?0:time,talk:activity.talk};
}

const fragmentShader = /* glsl */`
  varying vec2 vUv;
  uniform float clockTime;
  uniform vec2 gaze;
  uniform float openness;
  uniform float scanning;
  uniform float talking;
  uniform vec3 phosphor;
  uniform vec3 darkGlass;
  float box(vec2 p,vec2 halfSize,float radius){
    vec2 q=abs(p)-halfSize+radius;
    return min(max(q.x,q.y),0.)+length(max(q,0.))-radius;
  }
  float ink(float distance){return 1.-smoothstep(-.012,.012,distance);}
  void main(){
    vec2 p=vUv*2.-1.;
    // Shapes are evaluated at LED centres. The pixel matrix stays attached
    // to the glass while the pupil moves across it.
    vec2 pixel=(floor(p*16.)+.5)/16.;
    vec2 within=fract(p*16.);
    vec2 edges=smoothstep(vec2(.06),vec2(.14),within)*(1.-smoothstep(vec2(.86),vec2(.94),within));
    float led=edges.x*edges.y;
    vec2 q=pixel-vec2(gaze.x,gaze.y*openness);
    float eye=ink(box(q,vec2(.35,.045+.44*openness),.035+.10*openness));
    float inner=ink(box(q,vec2(.225,.026+.32*openness),.025+.06*openness));
    float pupil=ink(box(q-vec2(.012,-.015),vec2(.105,.21*openness+.01),.025))*smoothstep(.18,.5,openness);
    float shine=ink(box(q-vec2(-.14,.23*openness),vec2(.038),.008))*smoothstep(.25,.6,openness);
    float eyeLight=eye*(.38+.62*(1.-inner))*(1.-pupil);
    float line=1.-smoothstep(.025,.07,abs(p.y-(fract(clockTime*.17)*2.-1.)));
    float telemetry=step(abs(pixel.y+.78),.035)*step(abs(pixel.x),.42);
    telemetry*=mix(.12,.6,step(abs(pixel.x+.3-mod(floor(clockTime*1.6),6.)*.12),.04));
    vec2 corners=abs(pixel)-vec2(.57,.61);
    float brackets=max(ink(box(corners,vec2(.12,.025),.008)),ink(box(corners,vec2(.025,.12),.008)));
    float scanRow=step(abs(pixel.y-(fract(clockTime*.34)*1.2-.6)),.035)*step(abs(pixel.x),.62);
    vec3 color=darkGlass+phosphor*(.011+.018*led);
    color+=phosphor*led*(eyeLight*(.86+.08*line)+telemetry*.36+(brackets*.58+scanRow*.20)*scanning);
    color+=vec3(.65,.94,.88)*shine*led*.70;
    color+=phosphor*eye*.035; // Light bleeding between adjacent LED cells.
    color+=phosphor*led*eyeLight*talking*.06*(.5+.5*sin(clockTime*3.));
    float reflection=exp(-pow((p.y-.55+p.x*.22)*18.,2.))*.025;
    color+=vec3(.38,.58,.65)*reflection;
    gl_FragColor=vec4(color,1.);
    #include <colorspace_fragment>
  }
`;

export function createDigitalEyes(){
  const model=new THREE.Group();model.name='Digital eye displays';
  const displays=[-.218,.218].map((x,index)=>{
    const material=new THREE.ShaderMaterial({
      toneMapped:false,
      uniforms:{clockTime:{value:0},gaze:{value:new THREE.Vector2()},openness:{value:1},scanning:{value:0},talking:{value:0},phosphor:{value:new THREE.Color(0x67e9df)},darkGlass:{value:new THREE.Color(0x030d16)}},
      vertexShader:'varying vec2 vUv; void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
      fragmentShader,
    });
    const screen=new THREE.Mesh(new THREE.CircleGeometry(.143,64),material);
    screen.name=`${index===0?'Left':'Right'} digital display`;
    screen.position.set(x,0,-.262);screen.rotation.y=Math.PI;
    model.add(screen);return screen;
  });
  function update(time:number,activity:Activity,reducedMotion=false){
    const state=digitalEyeState(time,activity,reducedMotion);
    for(const screen of displays){
      const u=screen.material.uniforms;
      u.clockTime.value=state.time;u.gaze.value.set(state.x,state.y);
      u.openness.value=state.open;u.scanning.value=state.scan;u.talking.value=state.talk;
    }
  }
  return {model,update};
}
