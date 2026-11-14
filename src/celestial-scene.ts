import * as THREE from 'three';
import { paintedFinishGLSL } from './painted-finish';

/** A world-space environment: camera motion changes the perspective of the
 * star layers and nebula. No illustration or screen-aligned background image. */
export function createCelestialEnvironment(scene: THREE.Scene, radius: number) {
  const group = new THREE.Group();
  const time = { value: 0 };
  const skyMaterial = new THREE.ShaderMaterial({
    side: THREE.BackSide, depthWrite: false,
    uniforms: { time },
    vertexShader: `varying vec3 place;
      void main(){place=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
    fragmentShader: `
      uniform float time;
      varying vec3 place;
      float hash(vec3 p){p=fract(p*.3183099+vec3(.17,.31,.53));p*=17.;return fract(p.x*p.y*p.z*(p.x+p.y+p.z));}
      float noise(vec3 p){
        vec3 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);
        return mix(mix(mix(hash(i),hash(i+vec3(1,0,0)),f.x),mix(hash(i+vec3(0,1,0)),hash(i+vec3(1,1,0)),f.x),f.y),
          mix(mix(hash(i+vec3(0,0,1)),hash(i+vec3(1,0,1)),f.x),mix(hash(i+vec3(0,1,1)),hash(i+vec3(1,1,1)),f.x),f.y),f.z);
      }
      float cloud(vec3 p){float n=0.;float a=.55;for(int i=0;i<4;i++){n+=a*noise(p);p=p*2.08+vec3(2.3,1.7,3.1);a*=.48;}return n;}
      void main(){
        vec3 direction=normalize(place);
        vec3 p=direction*3.8+vec3(time*.006,0.,time*.003);
        float warp=cloud(p*.85);
        float density=cloud(p+vec3(warp*1.8,warp*.6,warp));
        float band=pow(1.-abs(sin(direction.y*2.7+direction.x*1.4+warp*2.)),2.);
        float mist=floor(smoothstep(.34,.74,density)*(.25+.75*band)*7.)/7.;
        float warm=floor(smoothstep(.48,.72,cloud(p*.62+vec3(4.,2.,7.)))*band*4.)/4.;
        vec3 ink=vec3(.005,.018,.026);
        vec3 teal=vec3(.025,.19,.205);
        vec3 copper=vec3(.46,.19,.055);
        vec3 color=mix(ink,teal,mist*.84);
        color=mix(color,copper,warm*mist*.66);
        float contour=1.-step(.065,abs(fract(density*19.)-.5));
        float strokes=step(.83,fract(dot(p,vec3(39.,23.,17.))));
        color+=vec3(.17,.105,.042)*contour*mist*warm*.5;
        color*=1.-strokes*step(.25,mist)*.16;
        gl_FragColor=vec4(color,1.);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }`,
  });
  const sky = new THREE.Mesh(new THREE.SphereGeometry(radius, 48, 32), skyMaterial);
  sky.renderOrder = -10;
  group.add(sky);

  const positions: number[] = [], colors: number[] = [], sizes: number[] = [], phases: number[] = [];
  const gold = new THREE.Color(0xf2c779), ivory = new THREE.Color(0xffefd0), blue = new THREE.Color(0x7fbdc7);
  // Several finite distances produce real parallax when approaching a world.
  const starCount = 6200;
  for (let i = 0; i < starCount; i++) {
    const y = 1 - 2 * (i + .5) / starCount;
    const angle = i * 2.39996323, ring = Math.sqrt(1 - y * y);
    const distance = radius * (.56 + (i % 29) / 29 * .36);
    positions.push(Math.cos(angle) * ring * distance, y * distance, Math.sin(angle) * ring * distance);
    const color = (i % 7 === 0 ? blue : i % 3 === 0 ? ivory : gold).clone();
    colors.push(color.r, color.g, color.b);
    sizes.push(i % 41 === 0 ? 10 : i % 9 === 0 ? 3.8 : 1.3 + (i % 5) * .3);
    phases.push(i * 1.371);
  }
  const starGeometry = new THREE.BufferGeometry();
  starGeometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  starGeometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
  starGeometry.setAttribute('size', new THREE.Float32BufferAttribute(sizes, 1));
  starGeometry.setAttribute('phase', new THREE.Float32BufferAttribute(phases, 1));
  const starMaterial = new THREE.ShaderMaterial({
    uniforms: { time, pixelRatio: { value: Math.min(devicePixelRatio, 1.65) } }, vertexColors: true, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    vertexShader: `attribute float size;attribute float phase;varying vec3 tint;varying float pulse;uniform float time;uniform float pixelRatio;
      void main(){tint=color;pulse=.76+.24*sin(time*.65+phase);vec4 p=modelViewMatrix*vec4(position,1.);gl_PointSize=size*pixelRatio;gl_Position=projectionMatrix*p;}`,
    fragmentShader: `varying vec3 tint;varying float pulse;
      void main(){vec2 p=gl_PointCoord-.5;float r=length(p);float core=exp(-r*r*45.);
        float rays=(exp(-abs(p.x)*65.)+exp(-abs(p.y)*65.))*pow(max(0.,1.-r*2.),2.);
        float alpha=(core+rays*.36)*pulse;if(alpha<.01)discard;gl_FragColor=vec4(tint,alpha);
        #include <colorspace_fragment>
      }`,
  });
  group.add(new THREE.Points(starGeometry, starMaterial));
  scene.add(group);
  return {
    update(seconds: number) { time.value = seconds; },
    dispose() { scene.remove(group); sky.geometry.dispose(); skyMaterial.dispose(); starGeometry.dispose(); starMaterial.dispose(); },
  };
}

/** Surface texture and craters stay attached to the actual sphere. Light is
 * stepped into painted values, with teal shadows and a thin warm limb. */
export function illustratePlanet(material: THREE.MeshStandardMaterial, warm = true) {
  material.onBeforeCompile = shader => {
    shader.uniforms.limbInk = { value: new THREE.Color(warm ? 0xd6a15e : 0x77c9ca) };
    shader.vertexShader = 'varying vec3 surfacePoint;\n' + shader.vertexShader;
    shader.vertexShader = shader.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\nsurfacePoint=position;');
    shader.fragmentShader = 'varying vec3 surfacePoint; uniform vec3 limbInk;\n' + paintedFinishGLSL + shader.fragmentShader;
    shader.fragmentShader = shader.fragmentShader.replace('#include <opaque_fragment>', `
      vec3 spherePoint=normalize(surfacePoint);
      vec2 marksUV=vec2(atan(spherePoint.z,spherePoint.x),asin(clamp(spherePoint.y,-1.,1.)))*7.;
      float facing=max(0.,dot(normalize(normal),normalize(vViewPosition)));
      outgoingLight=paintedFinish(outgoingLight,marksUV,vec3(.009,.032,.045),limbInk*.8,facing);
      float limb=step(.94,1.-facing);
      outgoingLight+=limbInk*limb*.12;
      #include <opaque_fragment>
    `);
  };
  material.customProgramCacheKey = () => 'celestial-painted-surface-v2';
  return material;
}

export function celestialRim(radius: number, color: number) {
  return new THREE.Mesh(new THREE.SphereGeometry(radius * 1.015, 80, 48), new THREE.ShaderMaterial({
    uniforms: { tint: { value: new THREE.Color(color) } }, side: THREE.BackSide, transparent: true, depthWrite: false,
    vertexShader: `varying vec3 n;varying vec3 p;void main(){n=normalize(normalMatrix*normal);vec4 v=modelViewMatrix*vec4(position,1.);p=v.xyz;gl_Position=projectionMatrix*v;}`,
    fragmentShader: `uniform vec3 tint;varying vec3 n;varying vec3 p;void main(){float edge=pow(1.-abs(dot(normalize(n),normalize(-p))),3.);gl_FragColor=vec4(tint,edge*.38);
      #include <colorspace_fragment>
    }`,
  }));
}
