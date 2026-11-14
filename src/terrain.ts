import * as THREE from 'three';
import { paintMaterial, stars } from './paint';
import type { WorldId } from './catalog';

export function terrainHeight(x: number, z: number, world: WorldId = 'mars') {
  const radius = Math.hypot(x - 19, z + 19);
  const crater = -1.7 * Math.exp(-((radius / 7) ** 2)) + .68 * Math.exp(-(((radius - 9) / 2.4) ** 2));
  const fold = .37 * Math.sin(x * .21 + z * .08) * Math.cos(z * .16) + .15 * Math.sin((x + z) * .51);
  const ridge = Math.exp(-(((Math.hypot(x,z)-65)/19)**2)) * (2.2 + 1.5*Math.sin(z*.13) + 1.2*Math.cos(x*.17+z*.12));
  return crater + fold + ridge + (world === 'moon' ? -.25 * Math.cos(x * .18 - z * .13) : 0);
}

export function createTerrain(scene: THREE.Scene, world: WorldId) {
  const moon = world === 'moon';
  const group = new THREE.Group();
  const atmosphere = new THREE.Group();
  const fog = new THREE.FogExp2(moon ? 0x101b2c : 0x7c7c80, moon ? .003 : .007);
  const sky = new THREE.Mesh(new THREE.SphereGeometry(225, 32, 20), new THREE.ShaderMaterial({
    side: THREE.BackSide, depthWrite: false,
    uniforms: { lunar: { value: moon ? 1 : 0 } },
    vertexShader: 'varying vec3 vPosition; void main(){vPosition=position; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
    fragmentShader: `varying vec3 vPosition; uniform float lunar;
      void main(){
        vec3 d=normalize(vPosition);
        float horizon=exp(-abs(d.y)*5.0);
        vec3 color=mix(vec3(.017,.034,.061),vec3(.26,.30,.32),horizon);
        vec3 sunDirection=normalize(vec3(-.68,.21,-.70));
        float sun=pow(max(0.,dot(d,sunDirection)),12.);
        color+=vec3(.50,.23,.10)*sun;
        color=mix(color,vec3(.003,.007,.016),lunar);
        float disk=smoothstep(.99976,.99989,dot(d,sunDirection));
        color+=vec3(1.4,1.14,.75)*disk;
        gl_FragColor=vec4(color,1.);
        #include <colorspace_fragment>
      }`,
  }));
  atmosphere.add(sky);
  if (moon) stars(atmosphere, 210, 650);
  const sun = new THREE.DirectionalLight(moon ? 0xd8e9ff : 0xffd5a6, moon ? 3.5 : 2.7);
  sun.position.set(-35, 25, -32);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  Object.assign(sun.shadow.camera, { left: -45, right: 45, top: 45, bottom: -45, near: .5, far: 130 });
  sun.shadow.bias = -.00015;
  sun.shadow.normalBias = .025;
  sun.shadow.radius = 2;
  const fill = new THREE.DirectionalLight(0xb1cbd5, moon ? .9 : 1.35);
  fill.position.set(13, 12, 18);
  scene.add(group, atmosphere, sun, fill, new THREE.HemisphereLight(0xabc1cf, moon ? 0x343846 : 0x685146, moon ? .85 : 1.05));

  const geometry = new THREE.PlaneGeometry(290, 290, 220, 220);
  geometry.rotateX(-Math.PI / 2);
  const positions = geometry.getAttribute('position'), colors: number[] = [];
  const dark = new THREE.Color(moon ? 0x646975 : 0x795d4e);
  const light = new THREE.Color(moon ? 0xa3a4a8 : 0xb49178);
  for (let i = 0; i < positions.count; i++) {
    const x = positions.getX(i), z = positions.getZ(i);
    positions.setY(i, terrainHeight(x, z, world));
    const variation = .55 + Math.sin(x * .36 + z * .19) * .17 + Math.sin(x * 1.16 - z * .39) * .11;
    const color = dark.clone().lerp(light, variation);
    colors.push(color.r, color.g, color.b);
  }
  geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
  geometry.computeVertexNormals();
  const ground = new THREE.Mesh(geometry, paintMaterial(new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 1 }), .11));
  ground.receiveShadow = true;
  group.add(ground);

  const rockMaterial = paintMaterial(new THREE.MeshStandardMaterial({ color: moon ? 0x8d91a3 : 0x927c70, roughness: 1, flatShading: true }), .36);
  const rockGeometry = new THREE.DodecahedronGeometry(1, 1);
  const rocks = new THREE.InstancedMesh(rockGeometry, rockMaterial, 430);
  const transform = new THREE.Object3D();
  for (let i = 0; i < 430; i++) {
    const x = 112 * Math.sin(i * 237.1), z = 112 * Math.cos(i * 719.13);
    const near = Math.abs(x) < 25 && Math.abs(z) < 25;
    const size = near ? .10 + i % 7 * .075 : .45 + i % 13 * .27;
    transform.position.set(x, terrainHeight(x, z, world) - size * .16, z);
    transform.rotation.set(i * .19, i * .77, Math.sin(i) * .25);
    transform.scale.set(size * (1.1 + i % 3 * .23), size * (near ? .5 : .7 + i % 4 * .23), size * .74);
    transform.updateMatrix();
    rocks.setMatrixAt(i, transform.matrix);
  }
  rocks.castShadow = rocks.receiveShadow = true;
  group.add(rocks);
  // Sculpted strata, tapering shoulders, and a broken skyline; no floating blocks.
  for (let i = 0; i < 42; i++) {
    const angle = i / 42 * Math.PI * 2;
    const distance = 92 + Math.sin(i * 28.1) * 18;
    const x = Math.cos(angle) * distance, z = Math.sin(angle) * distance;
    const height = (moon ? 7 : 9) + (i % 6) * 1.9;
    const width = 7 + i % 5 * 2.5;
    const vertices:number[]=[], tones:number[]=[];
    const sides=11, levels=8;
    const point=(level:number,side:number)=>{
      const a=side/sides*Math.PI*2, t=level/(levels-1);
      const taper=1-t*.7 + .07*Math.sin(level*2.8+i);
      const broken=1+.2*Math.sin(side*17.2+i*2);
      return [Math.cos(a)*width*taper*broken+t*3*Math.sin(i),height*t*(1+.025*Math.sin(side*3+i)),Math.sin(a)*width*.6*taper*broken];
    };
    for(let level=0;level<levels-1;level++)for(let side=0;side<sides;side++){
      const a=point(level,side),b=point(level,(side+1)%sides),c=point(level+1,side),d=point(level+1,(side+1)%sides);
      const shade=new THREE.Color(moon?0x8b91a2:0xb39484).multiplyScalar(.64+.3*(level%3)/2);
      for(const v of [a,b,c,b,d,c]){vertices.push(...v);tones.push(shade.r,shade.g,shade.b);}
    }
    for(let side=0;side<sides;side++){
      vertices.push(...point(levels-1,side),...point(levels-1,(side+1)%sides),3*Math.sin(i),height,0);
      for(let j=0;j<3;j++)tones.push(.31,.32,.35);
    }
    const ridgeGeometry=new THREE.BufferGeometry();
    ridgeGeometry.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));
    ridgeGeometry.setAttribute('color',new THREE.Float32BufferAttribute(tones,3));ridgeGeometry.computeVertexNormals();
    const ridge=new THREE.Mesh(ridgeGeometry,paintMaterial(new THREE.MeshStandardMaterial({vertexColors:true,roughness:1,flatShading:true,side:THREE.DoubleSide}),.15));
    ridge.position.set(x,terrainHeight(x,z,world)-.3,z);ridge.rotation.y=angle;
    ridge.castShadow=ridge.receiveShadow=true;group.add(ridge);
  }
  return { group, atmosphere, ground, fog, sun, height: (x: number, z: number) => terrainHeight(x, z, world) };
}
