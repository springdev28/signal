import * as THREE from 'three';
import { barrel, metal, rounded, strut, tube, vec, type XYZ } from './geometry';
import { paintModel } from './paint';

const ceramic = metal(0xcbbda2, .24, .78);
const steel = metal(0x3d4d57, .61, .43);
const trim = metal(0x19262d, .34, .59);
const brass = metal(0xb7814e, .54, .47);
const cloth = metal(0x256b70, .02, .96);
cloth.side = THREE.DoubleSide;
const light = new THREE.MeshStandardMaterial({
  color: 0x8edfe0, emissive: 0x489ea7, emissiveIntensity: .73, roughness: .28, metalness: .28,
});
const lens = metal(0x163b47, .45, .18);

function ring(radius: number, thickness: number, material: THREE.Material, location: XYZ) {
  const mesh = new THREE.Mesh(new THREE.TorusGeometry(radius, thickness, 10, 32), material);
  mesh.position.copy(vec(location));
  return mesh;
}

function fabric() {
  const geometry = new THREE.PlaneGeometry(1, 1, 39, 28);
  const positions = geometry.getAttribute('position');
  const shades = [];
  for (let i = 0; i < positions.count; i++) {
    const u = positions.getX(i) + .5, v = .5 - positions.getY(i);
    const angle = .15 * Math.PI + u * Math.PI * 1.82;
    const pleats = (.027 + .047 * v) * Math.sin(angle * 8.7 + v * 4.5) + Math.sin(angle * 15 + v * 6) * .013;
    const breadth = .405 - .185 * Math.sin(v * Math.PI) + .18 * v * v + pleats;
    const depth = .214 + .084 * v * v + pleats;
    const hem = .043 + .09 * Math.sin(angle * 2.7 + .2) + .07 * Math.sin(angle * 6.2);
    positions.setXYZ(i, Math.cos(angle) * breadth + .09 * v * v, 1.55 - v * (1.49 - hem), Math.sin(angle) * depth + v * v * .15);
    const edge = v > .977 ? new THREE.Color(0xb69c67) : new THREE.Color(0xb6d4d2);
    edge.multiplyScalar(.76 + .24 * Math.sin(angle * 8.7 + v * 4.5));
    shades.push(edge.r, edge.g, edge.b);
  }
  geometry.setAttribute('color', new THREE.Float32BufferAttribute(shades, 3));
  geometry.computeVertexNormals();
  const surface = cloth.clone();
  surface.vertexColors = true;
  return new THREE.Mesh(geometry, surface);
}

export function createAstra() {
  const model = new THREE.Group();
  const body = new THREE.Group();
  const head = new THREE.Group();
  const neck = new THREE.Group();
  const drape = fabric(), hem = drape.geometry.getAttribute('position');
  const rest = Float32Array.from(hem.array);
  const irises:THREE.Group[]=[];
  body.add(neck);neck.position.y=1.51;
  model.add(body);
  body.add(
    drape,
    rounded([.57,.24,.34], .074, trim, [0,1.46,0]),
    rounded([.36,.48,.28], .085, steel, [0,1.19,.025]),
    rounded([.23,.28,.12], .037, brass, [.008,1.28,.235]),
    ring(.121,.022,ceramic,[0,1.54,-.018]),
  );

  const spine = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0,1.51,-.01), new THREE.Vector3(-.037,1.68,.025),
    new THREE.Vector3(-.045,1.85,.03), new THREE.Vector3(.028,2.10,-.095),
    new THREE.Vector3(.044,2.24,-.104),
  ]);
  const spineMesh=new THREE.Mesh(new THREE.TubeGeometry(spine, 25, .054, 12, false), trim);
  spineMesh.position.y=-1.51;neck.add(spineMesh);
  for (let i = 0; i < 12; i++) {
    const t = i / 11;
    const collar = barrel(.081 - t * .011, .049, i % 4 === 0 ? brass : steel, [0,0,0], 'y', 18);
    collar.position.copy(spine.getPointAt(t));
    collar.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), spine.getTangentAt(t).normalize());
    collar.position.y-=1.51;neck.add(collar);
  }

  head.position.set(.046,.74,-.1);
  head.add(rounded([.52,.21,.24], .06, steel, [0,-.03,.058]));
  for (const x of [-.218,.218]) {
    head.add(
      barrel(.204,.39,ceramic,[x,0,.02],'z',28),
      barrel(.187,.1,steel,[x,0,.243],'z'),
      barrel(.211,.072,steel,[x,0,-.19],'z'),
      ring(.165,.017,brass,[x,0,-.235]),
      barrel(.154,.028,trim,[x,0,-.227],'z'),
      barrel(.126,.015,lens,[x,0,-.247],'z'),
      rounded([.12,.028,.11], .008, trim, [x,.198,.048]),
    );
    const iris=new THREE.Group();iris.position.set(x,0,-.256);
    iris.add(ring(.107,.007,light,[0,0,0]),barrel(.045,.015,light,[.019,.014,-.002],'z'));
    head.add(iris);irises.push(iris);
    for (let index=0;index<8;index++) {
      const a=index*Math.PI/4;
      head.add(barrel(.013,.014,ceramic,[x+Math.cos(a)*.178,Math.sin(a)*.178,-.233],'z',8));
    }
  }
  head.add(
    tube([[-.075,.102,.07],[-.18,.292,.067],[-.36,.394,.06],[-.55,.38,.024]],.012,steel),
    tube([[.054,.103,.065],[.18,.405,.07],[.27,.514,.03],[.408,.548,-.028]],.012,steel),
  );
  for (const point of [[-.55,.38,.024],[.408,.548,-.028]] as const) {
    const tip=new THREE.Mesh(new THREE.SphereGeometry(.035,14,10),light);
    tip.position.copy(vec(point));head.add(tip);
  }
  neck.add(head);

  const cable = new THREE.Group();
  cable.position.set(.245,.97,.19);
  cable.add(tube([[0,0,0],[.29,-.4,.19],[.62,-.65,.29],[.85,-.54,.37],[.91,-.29,.39],[.71,-.10,.32],[.58,.085,.26],[.71,.24,.2],[.89,.21,.14]],.025,trim,54));
  cable.add(barrel(.043,.14,steel,[.914,.20,.13],'x'), barrel(.043,.048,brass,[.993,.20,.13],'x'));
  body.add(cable);

  const legs = [-1,1].map(side => {
    const leg = new THREE.Group();
    leg.position.set(side*.17,.64,0);
    leg.add(strut([0,.01,0],[0,-.55,.019],.047,steel));
    leg.add(rounded([.16,.117,.31],.035,trim,[0,-.55,-.082]));
    body.add(leg);
    return leg;
  });
  const arm=new THREE.Group();
  arm.position.set(.294,1.32,-.06);
  arm.add(tube([[0,0,0],[.12,-.23,0],[.07,-.46,-.06]],.045,steel),
    rounded([.15,.11,.18],.026,brass,[.063,-.46,-.076]),
    barrel(.028,.022,light,[.06,-.452,-.17],'z'));
  body.add(arm);
  paintModel(model, 2.2);

  const reduced=matchMedia('(prefers-reduced-motion: reduce)');
  let priorTime=0,gait=0,walkBlend=0;
  const actionBlend={scan:0,pickup:0,assemble:0,talk:0};
  function pose(time: number, walking: boolean|number, action: 'idle'|'scan'|'pickup'|'assemble'|'talk', amount: number) {
    const dt=priorTime?Math.min(.05,Math.max(0,time-priorTime)):1/60;
    priorTime=time;
    const blend=1-Math.exp(-12*dt);
    const speed=typeof walking==='number'?THREE.MathUtils.clamp(walking,0,1):Number(walking);
    walkBlend+=(speed-walkBlend)*blend;
    if(walkBlend<.001)walkBlend=0;
    gait+=dt*(4+7*walkBlend)*walkBlend;
    for(const key of Object.keys(actionBlend) as (keyof typeof actionBlend)[]){
      const target=action===key?(key==='talk'?1:amount):0;
      actionBlend[key]+=(target-actionBlend[key])*blend;
    }
    const idle=reduced.matches?0:1-walkBlend;
    const stride=Math.sin(gait)*walkBlend;
    const breath=Math.sin(time*1.65)*idle;
    const glance=Math.sin(time*.54)*Math.sin(time*.21)*idle;
    body.position.y = Math.abs(stride)*.038+breath*.009-actionBlend.pickup*.31;
    body.rotation.x = -walkBlend*.07-actionBlend.pickup*.27-actionBlend.assemble*.14;
    body.rotation.z = stride*.035+Math.sin(time*.73)*idle*.012;
    head.rotation.y = stride*.045+glance*.18+Math.sin(time*3)*actionBlend.scan*.38;
    head.rotation.x = breath*.012-actionBlend.pickup*.31-actionBlend.assemble*.16;
    head.rotation.z = Math.sin(time*2)*actionBlend.talk*.05;
    neck.rotation.x=-walkBlend*.045+breath*.012+Math.sin(time*3)*actionBlend.talk*.03;
    neck.rotation.z=stride*.03+glance*.025;
    cable.rotation.y = stride*.10+Math.sin(time*1.1)*idle*.04;
    cable.rotation.z = Math.cos(time*1.4)*idle*.025;
    for(const [i,iris] of irises.entries()){
      iris.scale.setScalar(1-actionBlend.scan*.27+Math.sin(time*1.2+i*.3)*idle*.026);
      iris.position.y=glance*.018;
    }
    for(let i=0;i<hem.count;i++){
      const x=rest[i*3],y=rest[i*3+1],z=rest[i*3+2],weight=Math.max(0,1-y/1.55)**2;
      hem.setXYZ(i,x+Math.sin(time*2.8+z*8)*weight*(walkBlend*.055+idle*.014),y,z+Math.sin(time*2.5+x*6)*weight*(walkBlend*.075+idle*.018));
    }
    hem.needsUpdate=true;
    // Recalculate normals as the drape deforms so highlights follow the cloth.
    drape.geometry.computeVertexNormals();
    for (const [i, leg] of legs.entries()) leg.rotation.x = stride * (i === 0 ? .64 : -.64);
    arm.rotation.x = stride*.28+actionBlend.scan*1.1+actionBlend.pickup*.8+actionBlend.assemble*1.14;
  }
  return { model, pose };
}
