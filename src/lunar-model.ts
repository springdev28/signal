import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { barrel, box, instrument, metal, rounded, strut, tube, type XYZ } from './geometry';

const alloy = metal(0xaaaeb1);
const edge = metal(0x676d72, .49, .44);
const dark = metal(0x353d42, .32, .71);
const meshMetal = metal(0x989d9e, .49, .51);
const canvas = metal(0xc5b698, .04, .94);
const gold = metal(0xc0a363, .56, .52);
const fender = metal(0x9e542a, .24, .62);
const black = metal(0x141d23, .2, .56);

function batch(segments: THREE.Mesh[], material: THREE.Material) {
  const geometries = segments.map(segment => {
    segment.updateMatrix();
    return segment.geometry.applyMatrix4(segment.matrix);
  });
  const joined = mergeGeometries(geometries);
  for (const geometry of geometries) geometry.dispose();
  return new THREE.Mesh(joined, material);
}

function tire() {
  const group = new THREE.Group();
  const wire: THREE.Mesh[] = [];
  for (const direction of [-1, 1]) {
    for (let row = 0; row < 36; row++) {
      const points: XYZ[] = [];
      for (let step = 0; step <= 8; step++) {
        const position = step / 8;
        const angle = row * Math.PI / 18 + direction * position * .68;
        const radius = .34 + Math.sin(position * Math.PI) * .064;
        points.push([.205 * (position - .5), Math.cos(angle) * radius, Math.sin(angle) * radius]);
      }
      wire.push(tube(points, .0047, meshMetal, 10));
    }
  }
  group.add(batch(wire, meshMetal));
  const cleats: THREE.Mesh[] = [];
  for (let i = 0; i < 20; i++) {
    const angle = i * Math.PI / 10;
    const at = (x: number, twist: number): XYZ => [x, Math.cos(angle + twist) * .411, Math.sin(angle + twist) * .411];
    cleats.push(strut(at(-.077, 0), at(0, .10), .010, alloy), strut(at(0, .10), at(.077, 0), .010, alloy));
  }
  group.add(batch(cleats, alloy));
  for (const x of [-.102, .102]) {
    const hoop = new THREE.Mesh(new THREE.TorusGeometry(.337, .016, 8, 52), alloy);
    hoop.rotation.y = Math.PI / 2;
    hoop.position.x = x;
    group.add(hoop);
  }
  group.add(barrel(.165, .21, edge, [0, 0, 0], 'x'), barrel(.119, .238, alloy, [0, 0, 0], 'x'));
  const spokes: THREE.Mesh[] = [];
  for (let i = 0; i < 8; i++) {
    const a = i * Math.PI / 4;
    for (const sign of [-1, 1]) {
      spokes.push(strut([sign * .116, Math.cos(a) * .134, Math.sin(a) * .134], [sign * .094, Math.cos(a + .12) * .338, Math.sin(a + .12) * .338], .012, alloy));
    }
  }
  group.add(batch(spokes, alloy));
  return group;
}

function seat(x: number) {
  const group = new THREE.Group();
  const rods: THREE.Mesh[] = [
    tube([[-.23,.72,-.17],[-.24,.75,.31],[-.23,.88,.39],[-.22,1.23,.47]],.021,alloy),
    tube([[.23,.72,-.17],[.24,.75,.31],[.23,.88,.39],[.22,1.23,.47]],.021,alloy),
    strut([-.22,1.23,.47],[.22,1.23,.47],.021,alloy),
    strut([-.23,.72,-.17],[.23,.72,-.17],.021,alloy),
    strut([-.21,.46,.29],[-.23,.73,.32],.017,alloy),
    strut([.21,.46,.29],[.23,.73,.32],.017,alloy),
  ];
  group.add(batch(rods, alloy));
  for (let i = 0; i < 6; i++) {
    const x = -.184 + i * .074;
    group.add(tube([[x,.733,-.155],[x,.699,.06],[x,.746,.333],[x,.904,.391],[x,1.224,.46]],.022,canvas,19));
  }
  for (let i = 0; i < 4; i++) group.add(box(.44,.037,.026,canvas,0,.916+i*.086,.395+i*.018));
  group.add(box(.36,.023,.043,edge,0,.779,.12));
  group.position.x=x;
  return group;
}

function dish() {
  const group = new THREE.Group();
  const radius = .46;
  const wire: THREE.Mesh[] = [];
  const point = (r: number, a: number): XYZ => [Math.cos(a)*r, Math.sin(a)*r, r*r*.78];
  for (let i=1;i<=12;i++) {
    const r = radius*i/12;
    wire.push(tube(Array.from({length:49},(_,a)=>point(r,a*Math.PI/24)),i===12?.009:.0033,meshMetal,48));
  }
  for (let i=0;i<24;i++) {
    const a=i*Math.PI/12;
    wire.push(tube([point(.026,a),point(.16,a),point(.32,a),point(radius,a)],i%3===0?.008:.0038,meshMetal,12));
  }
  group.add(batch(wire,meshMetal),barrel(.058,.095,gold,[0,0,.02],'z'),barrel(.028,.083,alloy,[0,0,.31],'z'));
  for (const angle of [0,Math.PI*2/3,Math.PI*4/3]) group.add(strut(point(.42,angle),[0,0,.30],.007,alloy));
  group.rotation.set(-.72,.15,-.22);
  group.position.set(-.28,1.62,-.76);
  return group;
}

export function createLunarRover() {
  const rover = new THREE.Group();
  const frame = new THREE.Group(), equipment = new THREE.Group(), suspension = new THREE.Group(), antennas = new THREE.Group();
  const front = -1.47, back = 1.47;
  const tubes: THREE.Mesh[] = [];
  for (const side of [-1,1]) {
    const x = side * .63;
    tubes.push(tube([[x,.52,front],[x,.47,-.75],[x,.42,0],[x,.46,.85],[x,.56,back]],.036,alloy,22));
    tubes.push(tube([[x*.79,.42,front],[x*.86,.31,-.55],[x*.86,.30,.55],[x*.81,.45,back]],.024,alloy));
    for (const z of [-1.15,-.68,.58,1.18]) {
      tubes.push(strut([x,.49,z],[x*.84,.32,z+.12],.022,alloy));
    }
    for (const z of [-1.13,1.13]) {
      const xWheel=side*.94;
      const wheel=tire();
      wheel.position.set(xWheel,.424,z);
      suspension.add(wheel);
      for (const y of [.39,.51]) {
        for (const dz of [-.2,.2]) {
          suspension.add(strut([side*.55,y,z+dz],[xWheel-side*.11,y-.035,z],.022,alloy));
        }
      }
      suspension.add(strut([side*.59,.64,z+.095],[xWheel-side*.13,.39,z],.039,dark));
      suspension.add(strut([side*.63,.56,z+.065],[xWheel-side*.12,.40,z],.023,alloy));
      const mudGuard=new THREE.Mesh(new THREE.CylinderGeometry(.46,.46,.267,25,1,true,Math.PI*.28,Math.PI*.66),fender);
      mudGuard.rotation.set(0,0,Math.PI/2);
      mudGuard.position.copy(wheel.position);
      suspension.add(mudGuard);
    }
  }
  for (const z of [-1.46,-.88,-.35,.34,1.02,1.45]) tubes.push(strut([-.63,.49,z],[.63,.49,z],.026,alloy));
  tubes.push(strut([-.56,.33,-.77],[.56,.34,.83],.016,alloy),strut([.56,.33,-.77],[-.56,.34,.83],.016,alloy));
  frame.add(batch(tubes,alloy),rounded([1.13,.052,.95],.018,edge,[0,.435,-.10]),rounded([1.1,.055,.62],.015,alloy,[0,.515,-1.11]));
  for (const side of [-1,1]) {
    frame.add(rounded([.31,.04,.28],.01,dark,[side*.35,.472,-.56]));
    const battery=rounded([.32,.28,.36],.025,gold,[side*.36,.662,-1.20]);
    equipment.add(battery,box(.34,.037,.373,alloy,side*.36,.805,-1.20));
    equipment.add(tube([[side*.36,.827,-1.22],[side*.52,.84,-1.04],[side*.53,.55,-.86]],.012,black));
  }
  equipment.add(
    rounded([.29,.22,.27],.025,alloy,[.34,.95,-.92]),barrel(.081,.11,black,[.34,.958,-1.094],'z'),
    strut([.34,.54,-.92],[.34,.89,-.92],.026,edge),
    rounded([.58,.29,.49],.043,canvas,[0,.65,1.13]), rounded([.52,.045,.44],.014,gold,[0,.803,1.13]),
    rounded([.22,.12,.32],.02,dark,[0,.7,-.31]),strut([0,.69,-.39],[0,.91,-.46],.023,edge),
    strut([-.077,.914,-.47],[.077,.914,-.47],.021,black),
  );
  for (let i=0;i<7;i++) equipment.add(box(.014,.025,.23,edge,-.233+i*.076,.813,1.10));
  antennas.add(dish(),strut([-.28,.55,-.76],[-.28,1.62,-.76],.026,alloy));
  antennas.add(tube([[.49,.52,1.05],[.49,1.42,.97],[.48,1.65,.84]],.013,edge));
  const seats = new THREE.Group();
  seats.add(seat(-.319),seat(.319));
  rover.add(frame,instrument(suspension,'wheel'),instrument(seats,'seats'),instrument(antennas,'antenna'),instrument(equipment,'equipment'));
  return rover;
}
