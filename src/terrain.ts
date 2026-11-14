import * as THREE from 'three';
import { paintMaterial, rockMaterial, stars } from './paint';
import type { WorldId } from './catalog';

function hash(x:number,z:number){const n=Math.sin(x*127.1+z*311.7)*43758.5453;return n-Math.floor(n);}
function noise(x:number,z:number){const a=Math.floor(x),b=Math.floor(z);let u=x-a,v=z-b;u=u*u*(3-2*u);v=v*v*(3-2*v);return THREE.MathUtils.lerp(THREE.MathUtils.lerp(hash(a,b),hash(a+1,b),u),THREE.MathUtils.lerp(hash(a,b+1),hash(a+1,b+1),u),v);}
export function terrainHeight(x:number,z:number,world:WorldId='mars'){
  const r=Math.hypot(x-19,z+19),crater=-1.35*Math.exp(-((r/7)**2))+.58*Math.exp(-(((r-9)/2.4)**2));
  const basin=.22*Math.sin(x*.14+z*.065)+.28*(noise(x*.11,z*.11)-.5)+.09*(noise(x*.52,z*.52)-.5);
  const shoulder=(Math.exp(-(((x+39+Math.sin(z*.04)*7)/13)**2))+Math.exp(-(((x-43+Math.sin(z*.04)*10)/17)**2)))*(3+noise(x*.065,z*.07)*8);
  const farRidge=Math.exp(-(((z+83)/17)**2))*(7+noise(x*.045,0)*15);
  return crater+basin+shoulder+farRidge+(world==='moon'?.25*Math.cos(x*.17-z*.12):0);
}

/** Authored geological interpretation of the NASA scene photographs. Ridges
 * are deliberately composed around the playable valley, not a surveyed site. */
export function createTerrain(scene:THREE.Scene,world:WorldId){
  const moon=world==='moon',group=new THREE.Group(),atmosphere=new THREE.Group();
  const fog=new THREE.FogExp2(moon?0x0d1625:0x626d79,moon?.0018:.0032);
  const sky=new THREE.Mesh(new THREE.SphereGeometry(330,32,20),new THREE.ShaderMaterial({side:THREE.BackSide,depthWrite:false,uniforms:{lunar:{value:moon?1:0}},
    vertexShader:'varying vec3 vPosition;void main(){vPosition=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
    fragmentShader:`varying vec3 vPosition;uniform float lunar;void main(){vec3 d=normalize(vPosition);float h=exp(-max(0.,d.y)*6.);vec3 color=mix(vec3(.017,.035,.065),vec3(.38,.255,.18),h);vec3 sunDirection=normalize(vec3(-.64,.32,-.7));float glow=pow(max(0.,dot(d,sunDirection)),24.);color+=vec3(.28,.12,.038)*glow;color=mix(color,vec3(.001,.002,.006),lunar);color+=vec3(1.3,1.1,.84)*smoothstep(.99978,.9999,dot(d,sunDirection));gl_FragColor=vec4(color,1.);#include <colorspace_fragment>}`.replace('#include','\n#include')
  }));atmosphere.add(sky);if(moon)stars(atmosphere,310,400);
  const sun=new THREE.DirectionalLight(moon?0xfff0d9:0xffcf93,moon?3.7:3.5);sun.position.set(-40,29,-46);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);
  Object.assign(sun.shadow.camera,{left:-48,right:48,top:48,bottom:-48,near:.5,far:160});sun.shadow.bias=-.00012;sun.shadow.normalBias=.035;
  const fill=new THREE.DirectionalLight(0x7199c6,moon?.38:1.1);fill.position.set(18,14,25);
  scene.add(group,atmosphere,sun,fill,new THREE.HemisphereLight(0x7091b0,moon?0x141723:0x412923,moon?.45:.95));
  const geo=new THREE.PlaneGeometry(440,440,280,280);geo.rotateX(-Math.PI/2);const p=geo.getAttribute('position'),colors:number[]=[];
  const dark=new THREE.Color(moon?0x585d67:0x735044),light=new THREE.Color(moon?0xa6a8ad:0xbb8c66),wash=new THREE.Color(moon?0x777c88:0xa07556);
  for(let i=0;i<p.count;i++){
    const x=p.getX(i),z=p.getZ(i),y=terrainHeight(x,z,world);p.setY(i,y);
    const blend=.3+noise(x*.035,z*.035)*.5+noise(x*.17,z*.17)*.15;
    const c=dark.clone().lerp(light,blend).lerp(wash,Math.exp(-(((x-4-Math.sin(z*.05)*8)/7)**2))*.27);colors.push(c.r,c.g,c.b);
  }
  geo.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));geo.computeVertexNormals();
  const ground=new THREE.Mesh(geo,paintMaterial(new THREE.MeshStandardMaterial({vertexColors:true,roughness:1}),.035,false));ground.receiveShadow=true;group.add(ground);
  // Each massif has a different length, falloff and tilted stratification.
  const ridges=[[-65,-25,26,17,25,-.5],[-64,28,23,12,17,.2],[67,-22,29,15,30,.4],[64,34,23,18,16,-.5],[-24,-87,45,20,30,.16],[36,-94,36,20,24,-.25],[-87,-49,40,24,34,.7],[94,-66,45,25,38,-.35]];
  for(const [seed,r] of ridges.entries()){
    const [x,z,rx,rz,h,rotation]=r;const vertices:number[]=[],tones:number[]=[],indices:number[]=[];const sides=56,levels=22;
    const base=new THREE.Color(moon?0x8b91a0:0x95755f);
    for(let level=0;level<levels;level++)for(let side=0;side<sides;side++){
      const t=level/(levels-1),a=side/sides*Math.PI*2;
      const cap=Math.max(.035,(1-t)**.38),ledge=1+Math.sin(level*1.7+seed)*.027+Math.sin(level*.62)*.035;
      const broken=1+.1*Math.sin(a*3+seed)+.065*Math.sin(a*7+seed*5)+.04*Math.cos(a*11);
      const xx=Math.cos(a)*rx*cap*broken*ledge+t*t*rx*.22,zz=Math.sin(a)*rz*cap*broken*ledge;
      const yy=h*t*(1+.055*Math.sin(a*3+seed)+.04*Math.cos(a*5))* (1+.08*Math.sin(xx*.11+seed));
      const wx=x+xx*Math.cos(rotation)+zz*Math.sin(rotation),wz=z-xx*Math.sin(rotation)+zz*Math.cos(rotation);
      const blend=Math.pow(1-t,3),baseHeight=terrainHeight(wx,wz,world)*blend+terrainHeight(x,z,world)*(1-blend)-.8;
      vertices.push(xx,yy+baseHeight,zz);
      const strata=.82+.13*Math.sin(level*.83+seed)+.045*Math.cos(side*.68+level*.15);
      const tone=base.clone().multiplyScalar(strata).lerp(new THREE.Color(moon?0xc6c8c5:0xcaa278),Math.max(0,Math.sin(level*.83+seed))*.16);tones.push(tone.r,tone.g,tone.b);
      if(level<levels-1){const a=level*sides+side,b=level*sides+(side+1)%sides;indices.push(a,a+sides,b,b,a+sides,b+sides);}
    }
    const cap=vertices.length/3;vertices.push(rx*.22,h+terrainHeight(x,z,world)-.8,0);tones.push(base.r,base.g,base.b);
    for(let i=0;i<sides;i++)indices.push((levels-1)*sides+i,cap,(levels-1)*sides+(i+1)%sides);
    const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));geometry.setAttribute('color',new THREE.Float32BufferAttribute(tones,3));geometry.setIndex(indices);geometry.computeVertexNormals();
    const ridge=new THREE.Mesh(geometry,rockMaterial(new THREE.MeshStandardMaterial({vertexColors:true,roughness:1,emissive:0x1c2b40,emissiveIntensity:.26}),moon,.06));ridge.position.set(x,0,z);ridge.rotation.y=rotation;ridge.castShadow=ridge.receiveShadow=true;group.add(ridge);
  }
  const rockGeometry=new THREE.IcosahedronGeometry(1,1),rp=rockGeometry.getAttribute('position');
  for(let i=0;i<rp.count;i++){const x=rp.getX(i),y=rp.getY(i),z=rp.getZ(i),rough=1+.13*Math.sin(x*5.2+z*3.3)*Math.cos(y*5.1);rp.setXYZ(i,x*rough,y*rough,z*rough);}rockGeometry.computeVertexNormals();
  const rocks=new THREE.InstancedMesh(rockGeometry,rockMaterial(new THREE.MeshStandardMaterial({color:moon?0x878b94:0x98775f,roughness:1,flatShading:true}),moon,.6),560),transform=new THREE.Object3D();
  for(let i=0;i<560;i++){
    const x=(hash(i,4)-.5)*300,z=(hash(i,9)-.5)*300,near=Math.abs(x)<24&&Math.abs(z)<24,size=near?.09+hash(i,2)*.4:.3+hash(i,2)**3*3.2;
    transform.position.set(x,terrainHeight(x,z,world)-size*.18,z);transform.rotation.set(hash(i,1)*.5,i*.73,hash(i,6)*.4);transform.scale.set(size*1.6,size*.55,size);transform.updateMatrix();rocks.setMatrixAt(i,transform.matrix);
  }rocks.castShadow=rocks.receiveShadow=true;group.add(rocks);
  return {group,atmosphere,ground,fog,sun,height:(x:number,z:number)=>terrainHeight(x,z,world)};
}
