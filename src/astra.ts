import * as THREE from 'three';
import { barrel, metal, rounded, strut, tube, vec, type XYZ } from './geometry';
import { paintModel } from './paint';
import { astraMaterial } from './astra-materials';

const ceramic = astraMaterial(0xcbbda2, 'enamel', .24);
const steel = astraMaterial(0x63717a, 'steel', .68);
const trim = astraMaterial(0x26343b, 'rubber', .04);
const brass = astraMaterial(0xc29761, 'brass', .65);
const cloth = astraMaterial(0xe0d0ad, 'canvas', 0);
cloth.side = THREE.DoubleSide;
const chassis = astraMaterial(0x777b76, 'steel', .68);
const armor = astraMaterial(0xb6ad94, 'enamel', .42);
const piston = astraMaterial(0xb9bbb8, 'steel', .83, .65);
const cableRubber = astraMaterial(0x3b3430, 'rubber', .02);
const light = new THREE.MeshStandardMaterial({
  color: 0x8edfe0, emissive: 0x489ea7, emissiveIntensity: .73, roughness: .28, metalness: .28,
});
const lens = metal(0x163b47, .45, .18);

function ring(radius: number, thickness: number, material: THREE.Material, location: XYZ) {
  const mesh = new THREE.Mesh(new THREE.TorusGeometry(radius, thickness, 10, 32), material);
  mesh.position.copy(vec(location));
  return mesh;
}

function ball(radius: number, material: THREE.Material, location: XYZ) {
  const mesh = new THREE.Mesh(new THREE.SphereGeometry(radius, 16, 12), material);
  mesh.position.copy(vec(location)); return mesh;
}

function angularAntenna(points: XYZ[]) {
  const antenna = new THREE.Group();
  for (let i = 1; i < points.length; i++) {
    antenna.add(strut(points[i - 1], points[i], .013, steel, 10));
    if (i < points.length - 1) antenna.add(ball(.014, steel, points[i]));
  }
  antenna.add(ball(.032, light, points.at(-1)!));
  return antenna;
}

function fabric() {
  const geometry = new THREE.PlaneGeometry(1, 1, 52, 38);
  const positions = geometry.getAttribute('position');
  const shades = [];
  for (let i = 0; i < positions.count; i++) {
    const u = positions.getX(i) + .5, v = .5 - positions.getY(i);
    // The open front exposes the chest, waist cables, hands, and legs. Cloth
    // grows from the collar across the shoulders, then falls behind the body.
    const shoulder=Math.min(1,v/.14),fall=Math.max(0,(v-.14)/.86);
    // Below the shoulders the edges recede behind the arms, leaving proper
    // arm openings instead of wrapping the hands inside a closed cylinder.
    const opening = THREE.MathUtils.smoothstep(fall, 0, .32);
    const start = -.36 + .82 * opening;
    const angle = start + u * (Math.PI - 2 * start);
    const pleats=(.012+.028*fall)*Math.sin(angle*8.5+fall*3)+Math.sin(angle*16+fall*5)*.009;
    const breadth=.14+shoulder*.34+fall*.075+pleats;
    const depth=.10+shoulder*.18+fall*.12+pleats;
    const rag=.07*Math.sin(u*37)+.035*Math.sin(u*89)+.025*Math.sin(u*143);
    const length=1.18+.17*Math.sin(angle)+.10*Math.cos(angle);
    positions.setXYZ(i,Math.cos(angle)*breadth,1.83-shoulder*.19-fall*length+rag*fall**6,Math.sin(angle)*depth+.13*fall);
    const edge=new THREE.Color(v>.95?0x847968:v<.025?0xaca08b:0xe0d8c4);
    const stain=.9+.07*Math.sin(angle*7.2+fall*2)+.035*Math.sin(angle*19-fall*8);
    edge.multiplyScalar(stain);
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
  model.name = 'Astra';
  const body = new THREE.Group();
  const head = new THREE.Group();
  const neck = new THREE.Group();
  const drape = fabric(), hem = drape.geometry.getAttribute('position');
  drape.name = 'Shoulder cape';
  const rest = Float32Array.from(hem.array);
  const irises:THREE.Group[]=[];
  body.add(neck);neck.position.y=1.73;
  model.add(body);
  body.add(
    drape,
    rounded([.48,.12,.27], .028, chassis, [0,1.66,0]),
    rounded([.37,.30,.24], .024, chassis, [0,1.49,.015]),
    rounded([.30,.23,.035], .014, armor, [0,1.51,-.125]),
    rounded([.32,.15,.24], .026, chassis, [0,1.04,.015]),
    rounded([.25,.11,.035], .012, armor, [0,1.055,-.12]),
    barrel(.057,.29,piston,[0,1.225,.025]),
    barrel(.085,.06,chassis,[0,1.72,0]),
    barrel(.059,.05,brass,[0,1.752,0]),
  );
  const collar = ring(.087,.014,brass,[0,1.77,0]);collar.rotation.x=Math.PI/2;body.add(collar);
  for(const side of [-1,1]){
    body.add(
      // The shoulder axle is fixed to the chest yoke; the arm rotates on it.
      strut([side*.16,1.62,0],[side*.35,1.62,0],.055,chassis,16),
      barrel(.073,.033,brass,[side*.255,1.62,0],'x',20),
      strut([side*.17,1.35,.05],[side*.14,1.12,.035],.024,piston,12),
      rounded([.09,.26,.12],.018,armor,[side*.185,1.47,.03]),
      tube([[side*.10,1.38,-.13],[side*.16,1.29,-.15],[side*.11,1.15,-.145],[side*.075,1.09,-.11]],.017,cableRubber),
      tube([[side*.05,1.37,-.13],[side*.07,1.23,-.18],[side*.04,1.1,-.13]],.010,brass),
      barrel(.035,.035,brass,[side*.14,1.61,-.152],'z',14),
      barrel(.028,.035,steel,[side*.10,1.375,-.142],'z',12),
      barrel(.024,.035,steel,[side*.075,1.095,-.135],'z',12),
    );
    for(let i=0;i<3;i++)body.add(rounded([.055,.019,.02],.004,trim,[side*.15,1.47-i*.045,-.15]));
  }
  // A small clasp gathers the mantle over one shoulder without hiding the neck.
  body.add(barrel(.053,.036,brass,[-.30,1.68,-.150],'z',20),ring(.037,.007,trim,[-.30,1.68,-.174]));
  const flapGeometry=new THREE.PlaneGeometry(1,1,14,18);
  const fold=flapGeometry.getAttribute('position');
  for(let i=0;i<fold.count;i++){
    const u=fold.getX(i)+.5,v=.5-fold.getY(i);
    fold.setXYZ(i,THREE.MathUtils.lerp(-.13-.30*u,-.25+(.5-u)*.04,v),
      THREE.MathUtils.lerp(1.81-u*.15,1.41+Math.abs(u-.5)*.09,v),
      THREE.MathUtils.lerp(-.085-u*.055,-.22,v)-Math.sin(u*Math.PI)*Math.sin(v*Math.PI)*.02);
  }
  flapGeometry.computeVertexNormals();
  const flap=new THREE.Mesh(flapGeometry,cloth);flap.name='Shoulder fold';body.add(flap);

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

  head.name='Original binocular head';head.position.set(.046,.74,-.1);
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
    angularAntenna([[-.075,.102,.07],[-.14,.27,.067],[-.29,.31,.06],[-.24,.435,.05],[-.43,.46,.035],[-.40,.59,.025],[-.56,.65,.015]]),
    angularAntenna([[.054,.103,.065],[.14,.30,.07],[.29,.355,.06],[.24,.49,.04],[.41,.54,.015],[.37,.67,-.015],[.48,.73,-.03]]),
    barrel(.03,.055,brass,[-.075,.125,.07]),barrel(.03,.055,brass,[.054,.125,.065]),
  );
  neck.add(head);

  const cable = new THREE.Group();
  cable.name='Tail and claw';cable.position.set(.25,1.04,.12);
  body.add(strut([.13,1.04,.085],[.25,1.04,.12],.056,chassis,18),ball(.061,brass,[.25,1.04,.12]));
  // Drop inside the arm's swing envelope before curling out beside the body.
  // The socket and cable stay in front of the cape, so there is no false hole.
  const tailCurve = new THREE.CatmullRomCurve3([
    [0,0,0],[.015,-.20,.035],[.055,-.46,.06],[.32,-.68,.07],[.64,-.63,.08],
    [.88,-.42,.07],[.92,-.13,.035],[.74,.08,-.025],[.80,.31,-.065],[1.01,.31,-.10],
  ].map(p=>new THREE.Vector3(...p as [number,number,number])));
  cable.add(new THREE.Mesh(new THREE.TubeGeometry(tailCurve,72,.028,10,false),cableRubber));
  for(let i=0;i<30;i++){
    const t=i/29, band=barrel(.032,.013,i%5===0?brass:steel,[0,0,0],'y',12);
    band.position.copy(tailCurve.getPointAt(t));band.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),tailCurve.getTangentAt(t));cable.add(band);
  }
  const claw=new THREE.Group();claw.name='Three-finger tail claw';
  claw.position.copy(tailCurve.getPointAt(1));claw.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),tailCurve.getTangentAt(1));
  claw.add(barrel(.048,.09,steel,[0,.028,0]),barrel(.061,.027,brass,[0,.078,0]),barrel(.045,.05,chassis,[0,.108,0]));
  const tailFingers:THREE.Group[]=[];
  for(let i=0;i<3;i++){
    const radial=new THREE.Group();radial.rotation.y=i*Math.PI*2/3;
    const finger=new THREE.Group();finger.position.set(.043,.113,0);
    finger.add(barrel(.026,.042,brass,[0,0,0],'z',12),
      strut([0,0,0],[.065,.11,0],.021,steel,10),
      barrel(.025,.047,chassis,[.065,.11,0],'z',12),
      strut([.065,.11,0],[.045,.205,0],.018,piston,10));
    const tip=new THREE.Mesh(new THREE.ConeGeometry(.02,.072,8),steel);
    tip.position.set(.025,.226,0);tip.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),new THREE.Vector3(-.7,.7,0).normalize());
    finger.add(tip);radial.add(finger);claw.add(radial);tailFingers.push(finger);
  }
  cable.add(claw);
  body.add(cable);

  const legs = [-1,1].map(side => {
    const hip=new THREE.Group(),knee=new THREE.Group(),ankle=new THREE.Group();
    hip.name=`${side<0?'Left':'Right'} hip`;knee.name=`${side<0?'Left':'Right'} knee`;ankle.name=`${side<0?'Left':'Right'} foot`;
    hip.position.set(side*.19,1.04,0);
    hip.add(barrel(.09,.14,chassis,[0,0,0],'x'),barrel(.046,.154,brass,[0,0,0],'x'));
    hip.add(strut([side*.045,-.06,.02],[side*.045,-.39,.01],.027,piston,12),
      strut([-side*.04,-.06,.02],[-side*.04,-.39,.01],.025,chassis,12),
      rounded([.12,.28,.08],.014,armor,[0,-.23,-.06]),
      tube([[side*.06,-.04,.07],[side*.085,-.2,.09],[side*.05,-.43,.06]],.012,cableRubber));
    knee.position.set(0,-.45,0);
    knee.add(barrel(.078,.145,trim,[0,0,0],'x'),barrel(.047,.16,chassis,[0,0,0],'x'),
      rounded([.12,.13,.07],.022,armor,[0,-.015,-.065]),
      strut([0,-.055,.01],[0,-.43,.025],.029,piston,12),
      strut([side*.05,-.075,.04],[side*.05,-.27,.055],.025,chassis,12),
      barrel(.038,.18,chassis,[0,-.24,.025]),barrel(.046,.045,brass,[0,-.355,.025]));
    for(let i=0;i<6;i++)knee.add(barrel(.039,.012,trim,[0,-.15-i*.027,.025]));
    ankle.position.set(0,-.43,.025);
    ankle.add(barrel(.056,.11,chassis,[0,0,0],'x'),barrel(.037,.04,piston,[0,-.039,0]),rounded([.14,.116,.16],.016,armor,[0,-.075,-.02]));
    for(const toe of [-1,0,1]){
      ankle.add(strut([toe*.045,-.08,-.07],[toe*.061,-.11,-.21],.018,piston,10),
        rounded([.034,.03,.065],.007,trim,[toe*.061,-.118,-.221]));
    }
    knee.add(ankle);hip.add(knee);body.add(hip);
    return {hip,knee,ankle};
  });
  const arms=[-1,1].map(side=>{
    const shoulder=new THREE.Group(),elbow=new THREE.Group(),hand=new THREE.Group();
    shoulder.name=`${side<0?'Left':'Right'} shoulder`;elbow.name=`${side<0?'Left':'Right'} elbow`;hand.name=`${side<0?'Left':'Right'} hand`;
    shoulder.position.set(side*.35,1.62,0);
    shoulder.add(barrel(.079,.13,chassis,[0,0,0],'x'),barrel(.046,.148,brass,[0,0,0],'x'),
      strut([0,-.05,.015],[side*.015,-.40,.015],.026,piston,12),
      rounded([.085,.24,.085],.014,armor,[side*.025,-.22,.018]),
      tube([[0,-.035,.065],[-side*.035,-.19,.07],[side*.01,-.38,.06]],.012,cableRubber));
    elbow.position.set(side*.015,-.40,.015);
    elbow.add(barrel(.054,.10,chassis,[0,0,0],'x'),barrel(.029,.113,brass,[0,0,0],'x'),
      strut([side*.025,-.025,0],[side*.025,-.33,0],.021,piston,12),
      strut([-side*.025,-.025,0],[-side*.025,-.33,0],.021,chassis,12),
      rounded([.095,.15,.085],.015,armor,[0,-.15,.01]));
    hand.position.set(0,-.34,0);
    hand.add(barrel(.036,.07,brass,[0,0,0]),rounded([.09,.09,.055],.012,chassis,[0,-.068,0]));
    for(const finger of [-1,0,1]){
      hand.add(tube([[finger*.031,-.105,0],[finger*.045,-.165,-.01],[finger*.037,-.205,-.045]],.012,piston,12),
        barrel(.019,.023,trim,[finger*.035,-.12,0],'x',10));
    }
    hand.add(barrel(.023,.012,light,[0,-.062,-.032],'z',14));
    elbow.add(hand);shoulder.add(elbow);body.add(shoulder);
    return {shoulder,elbow,hand};
  });
  paintModel(model, 2.2);

  // Capsule clearance is solved in the body's local coordinates after every
  // articulated pose. Sleeves and hems can move around limbs, not through them.
  const colliders: {node:THREE.Object3D;a:THREE.Vector3;b:THREE.Vector3;radius:number;start:THREE.Vector3;end:THREE.Vector3}[]=[];
  const collider=(node:THREE.Object3D,a:XYZ,b:XYZ,radius:number)=>colliders.push({node,a:vec(a),b:vec(b),radius,start:new THREE.Vector3(),end:new THREE.Vector3()});
  collider(body,[0,1.20,.015],[0,1.60,.015],.215);
  collider(body,[-.12,1.04,.015],[.12,1.04,.015],.135);
  for(const arm of arms){
    collider(arm.shoulder,[0,0,0],[0,-.06,0],.095);
    collider(arm.shoulder,[0,-.06,.015],[0,-.40,.015],.076);
    collider(arm.elbow,[0,0,0],[0,-.34,0],.068);
    collider(arm.hand,[0,-.03,0],[0,-.20,-.03],.063);
  }
  for(const leg of legs){
    collider(leg.hip,[0,0,0],[0,-.45,0],.103);
    collider(leg.knee,[0,0,.015],[0,-.43,.025],.078);
    collider(leg.ankle,[0,-.07,.025],[0,-.10,-.22],.083);
  }
  for(let i=0;i<18;i++){
    const a=tailCurve.getPointAt(i/18),b=tailCurve.getPointAt((i+1)/18);
    collider(cable,a.toArray() as [number,number,number],b.toArray() as [number,number,number],.038);
  }
  const localInverse=new THREE.Matrix4(),nodeMatrix=new THREE.Matrix4();
  const point=new THREE.Vector3(),axis=new THREE.Vector3(),closest=new THREE.Vector3(),separation=new THREE.Vector3();
  function updateColliders(){
    localInverse.copy(body.matrixWorld).invert();
    for(const c of colliders){nodeMatrix.multiplyMatrices(localInverse,c.node.matrixWorld);c.start.copy(c.a).applyMatrix4(nodeMatrix);c.end.copy(c.b).applyMatrix4(nodeMatrix);}
  }
  function distanceTo(c:typeof colliders[number],p:THREE.Vector3){
    axis.subVectors(c.end,c.start);const length=axis.lengthSq();
    const t=length?THREE.MathUtils.clamp(separation.subVectors(p,c.start).dot(axis)/length,0,1):0;
    closest.copy(c.start).addScaledVector(axis,t);separation.subVectors(p,closest);
    return separation.length();
  }
  function clearClothDepth(c:typeof colliders[number],p:THREE.Vector3,side:number){
    const radius=c.radius+.028;
    if(p.x<Math.min(c.start.x,c.end.x)-radius||p.x>Math.max(c.start.x,c.end.x)+radius||p.y<Math.min(c.start.y,c.end.y)-radius||p.y>Math.max(c.start.y,c.end.y)+radius)return;
    const ax=c.end.x-c.start.x,ay=c.end.y-c.start.y,az=c.end.z-c.start.z;
    const px=p.x-c.start.x,py=p.y-c.start.y,a=ax*ax+ay*ay,b=px*ax+py*ay;
    let t=0;
    if(a<.000001){if(px*px+py*py>radius*radius)return;t=side*az>0?1:0;}
    else{
      const radial=radius*radius-(px*px+py*py-b*b/a);if(radial<0)return;
      const reach=Math.sqrt(radial/a),low=Math.max(0,b/a-reach),high=Math.min(1,b/a+reach);if(low>high)return;
      t=THREE.MathUtils.clamp(b/a+side*az*Math.sqrt(radial/(a*(a+az*az))),low,high);
    }
    const dx=px-ax*t,dy=py-ay*t;
    const depth=c.start.z+az*t+side*Math.sqrt(Math.max(0,radius*radius-dx*dx-dy*dy));
    p.z=side>0?Math.max(p.z,depth):Math.min(p.z,depth);
  }
  const flapVertices=flap.geometry.getAttribute('position'),flapRest=Float32Array.from(flapVertices.array);
  const fabrics=[{vertices:hem,rest,mesh:drape,flutter:1},{vertices:flapVertices,rest:flapRest,mesh:flap,flutter:.06}];
  function settleFabric(time:number,idle:number){
    for(const f of fabrics){
      for(let i=0;i<f.vertices.count;i++){
        const x=f.rest[i*3],y=f.rest[i*3+1],z=f.rest[i*3+2],weight=Math.max(0,(1.8-y)/1.35)**2*f.flutter;
        point.set(x+Math.sin(time*2.8+z*8)*weight*(walkBlend*.055+idle*.012),y,z+weight*walkBlend*.14+Math.sin(time*2.5+x*6)*weight*(walkBlend*.06+idle*.016));
        // Keep all neighbouring cape vertices on the same side of each limb.
        // Radial projection alone lets triangles bridge through a moving arm.
        for(const c of colliders)clearClothDepth(c,point,f.mesh===drape?1:-1);
        f.vertices.setXYZ(i,point.x,point.y,point.z);
      }
      f.vertices.needsUpdate=true;f.mesh.geometry.computeVertexNormals();f.mesh.geometry.computeBoundingSphere();
    }
  }
  // Use the real foot vertices, including the rounded toes, for floor contact.
  const feet:THREE.Mesh[]=[];
  for(const leg of legs)leg.ankle.traverse(node=>{if(node instanceof THREE.Mesh)feet.push(node);});

  const reduced=matchMedia('(prefers-reduced-motion: reduce)');
  let priorTime=0,gait=0,walkBlend=0;
  const actionBlend={scan:0,pickup:0,assemble:0,talk:0};
  const modelInverse=new THREE.Matrix4(),footPoint=new THREE.Vector3();
  const parentOrientation=new THREE.Quaternion(),groundOrientation=new THREE.Quaternion();
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
    body.position.y = Math.abs(stride)*.038+breath*.009-actionBlend.pickup*.10;
    body.rotation.x = -walkBlend*.07-actionBlend.pickup*.18-actionBlend.assemble*.14;
    body.rotation.z = stride*.035+Math.sin(time*.73)*idle*.012;
    head.rotation.y = stride*.045+glance*.18+Math.sin(time*3)*actionBlend.scan*.38;
    head.rotation.x = breath*.012-actionBlend.pickup*.31-actionBlend.assemble*.16;
    head.rotation.z = Math.sin(time*2)*actionBlend.talk*.05;
    neck.rotation.x=-walkBlend*.045+breath*.012+Math.sin(time*3)*actionBlend.talk*.03;
    neck.rotation.z=stride*.03+glance*.025;
    cable.rotation.y = stride*.10+Math.sin(time*1.1)*idle*.04;
    cable.rotation.z = Math.cos(time*1.4)*idle*.025;
    for(const [i,finger]of tailFingers.entries())finger.rotation.z=.12-actionBlend.pickup*.40+Math.sin(time*.9+i*.35)*idle*.035;
    for(const [i,iris] of irises.entries()){
      iris.scale.setScalar(1-actionBlend.scan*.27+Math.sin(time*1.2+i*.3)*idle*.026);
      iris.position.y=glance*.018;
    }
    for(const [i,leg]of legs.entries()){
      const cycle=Math.sin(gait+i*Math.PI);
      leg.hip.position.y=1.04-leg.hip.position.x*Math.tan(body.rotation.z);
      leg.hip.rotation.x=cycle*walkBlend*.45+actionBlend.pickup*.27;
      leg.knee.rotation.x=-Math.max(0,-cycle)*walkBlend*.72-actionBlend.pickup*.65;
    }
    for(const [i,arm]of arms.entries()){
      const acting=i===1?actionBlend.scan*1.1+actionBlend.pickup*.8+actionBlend.assemble*1.14:actionBlend.pickup*.35;
      arm.shoulder.rotation.x=stride*(i===0?-.30:.30)+acting;
      arm.shoulder.rotation.z=(i===0?-.06:.06)+breath*.015;
      arm.elbow.rotation.x=.08+Math.max(0,stride*(i===0?-1:1))*.18+acting*.33;
      arm.hand.rotation.z=glance*.025;
    }
    // The model's parent supplies terrain elevation, jumps and ship-exit motion.
    model.updateMatrixWorld(true);model.getWorldQuaternion(groundOrientation);
    for(const leg of legs){leg.knee.getWorldQuaternion(parentOrientation);leg.ankle.quaternion.copy(parentOrientation.invert()).multiply(groundOrientation);}
    model.updateMatrixWorld(true);modelInverse.copy(model.matrixWorld).invert();
    let sole=Infinity;
    for(const foot of feet){
      nodeMatrix.multiplyMatrices(modelInverse,foot.matrixWorld);const positions=foot.geometry.getAttribute('position');
      for(let i=0;i<positions.count;i++){footPoint.fromBufferAttribute(positions,i).applyMatrix4(nodeMatrix);sole=Math.min(sole,footPoint.y);}
    }
    body.position.y-=sole;
    model.updateMatrixWorld(true);updateColliders();settleFabric(time,idle);
  }
  function inspectRig(sampleFaces=false){
    model.updateMatrixWorld(true);updateColliders();
    let clothClearance=Infinity,tailArmClearance=Infinity;
    const vertex=new THREE.Vector3();
    for(const f of fabrics){
      for(let i=0;i<f.vertices.count;i++){
        point.fromBufferAttribute(f.vertices,i);
        for(const c of colliders)clothClearance=Math.min(clothClearance,distanceTo(c,point)-c.radius);
      }
      const index=f.mesh.geometry.index;
      if(sampleFaces&&index)for(let i=0;i<index.count;i+=3){
        point.set(0,0,0);for(let j=0;j<3;j++)point.add(vertex.fromBufferAttribute(f.vertices,index.getX(i+j)));point.divideScalar(3);
        for(const c of colliders)clothClearance=Math.min(clothClearance,distanceTo(c,point)-c.radius);
      }
    }
    nodeMatrix.multiplyMatrices(localInverse,cable.matrixWorld);
    const armNodes:THREE.Object3D[]=arms.flatMap(a=>[a.shoulder,a.elbow,a.hand]);
    for(let i=0;i<=64;i++){
      point.copy(tailCurve.getPointAt(i/64)).applyMatrix4(nodeMatrix);
      for(const c of colliders)if(armNodes.includes(c.node))tailArmClearance=Math.min(tailArmClearance,distanceTo(c,point)-c.radius-.032);
    }
    modelInverse.copy(model.matrixWorld).invert();let floorClearance=Infinity;
    for(const foot of feet){nodeMatrix.multiplyMatrices(modelInverse,foot.matrixWorld);const p=foot.geometry.getAttribute('position');for(let i=0;i<p.count;i++){footPoint.fromBufferAttribute(p,i).applyMatrix4(nodeMatrix);floorClearance=Math.min(floorClearance,footPoint.y);}}
    return {clothClearance,floorClearance,tailArmClearance};
  }
  return { model, pose, inspectRig };
}
