import * as THREE from 'three';
import { barrel, metal, rounded, strut, tube, vec, type XYZ } from './geometry';

const ceramic = metal(0xc5d2cd, .44, .48);
const steel = metal(0x3d4d57, .61, .43);
const trim = metal(0x19262d, .34, .59);
const brass = metal(0xb7814e, .54, .47);
const cloth = metal(0x3f7276, .08, .93);
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
  const geometry = new THREE.PlaneGeometry(1, 1, 52, 25);
  const positions = geometry.getAttribute('position');
  const shades = [];
  for (let i = 0; i < positions.count; i++) {
    const u = positions.getX(i) + .5, v = .5 - positions.getY(i);
    const angle = .15 * Math.PI + u * Math.PI * 1.82;
    const pleats = (.027 + .047 * v) * Math.sin(angle * 8.7 + v * 4.5) + Math.sin(angle * 15 + v * 6) * .013;
    const breadth = .355 - .175 * Math.sin(v * Math.PI) + .13 * v * v + pleats;
    const depth = .214 + .084 * v * v + pleats;
    const hem = .043 + .07 * Math.sin(angle * 2.7 + .2) + .047 * Math.sin(angle * 6.2);
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
  model.add(body);
  body.add(
    fabric(),
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
  body.add(new THREE.Mesh(new THREE.TubeGeometry(spine, 25, .054, 12, false), trim));
  for (let i = 0; i < 12; i++) {
    const t = i / 11;
    const collar = barrel(.081 - t * .011, .049, i % 4 === 0 ? brass : steel, [0,0,0], 'y', 18);
    collar.position.copy(spine.getPointAt(t));
    collar.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), spine.getTangentAt(t).normalize());
    body.add(collar);
  }

  head.position.set(.046,2.25,-.1);
  head.add(rounded([.52,.21,.24], .06, steel, [0,-.03,.058]));
  for (const x of [-.218,.218]) {
    head.add(
      barrel(.204,.39,ceramic,[x,0,.02],'z',28),
      barrel(.187,.1,steel,[x,0,.243],'z'),
      barrel(.211,.072,steel,[x,0,-.19],'z'),
      ring(.165,.017,brass,[x,0,-.235]),
      barrel(.154,.028,trim,[x,0,-.227],'z'),
      barrel(.126,.015,lens,[x,0,-.247],'z'),
      ring(.107,.007,light,[x,0,-.256]),
      barrel(.045,.015,light,[x+.019,.014,-.258],'z'),
      rounded([.12,.028,.11], .008, trim, [x,.198,.048]),
    );
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
  body.add(head);

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

  function pose(time: number, walking: boolean, action: 'idle'|'scan'|'pickup'|'assemble', amount: number) {
    const stride = walking ? Math.sin(time * 11) : 0;
    body.position.y = Math.abs(stride) * .045;
    body.rotation.x = walking ? -.08 : 0;
    body.rotation.z = stride * .046;
    head.rotation.y = stride * .063;
    head.rotation.x = 0;
    cable.rotation.y = stride * .11;
    for (const [i, leg] of legs.entries()) leg.rotation.x = stride * (i === 0 ? .64 : -.64);
    arm.rotation.x = stride * .28;
    if (action === 'scan') {
      head.rotation.y = Math.sin(time * 11) * amount * .42;
      arm.rotation.x = amount * 1.1;
    }
    if (action === 'pickup') {
      body.position.y = -amount * .31;
      body.rotation.x = -amount * .27;
      head.rotation.x = -amount * .31;
      arm.rotation.x = amount * .8;
    }
    if (action === 'assemble') {
      head.rotation.x = -amount * .16;
      body.rotation.x = -amount * .14;
      arm.rotation.x = amount * 1.14;
    }
  }
  return { model, pose };
}
