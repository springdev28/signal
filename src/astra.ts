import * as THREE from 'three';
import { barrel, metal, rounded, strut, tube, vec, type XYZ } from './geometry';
import { paintModel } from './paint';
import { astraMaterial, prepareAstraMaterials } from './astra-materials';
import { createDigitalEyes } from './astra-eyes';
import { springAngle } from './astra-springs';
import { loadAstraAssets } from './astra-assets';
import { createRobotRig } from './astra-rig';
import { createCapePhysics } from './astra-physics';

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
  antenna.position.copy(vec(points[0]));
  const joints:{node:THREE.Group;x:ReturnType<typeof springAngle>;z:ReturnType<typeof springAngle>}[]=[];
  let parent=antenna;
  for (let i = 1; i < points.length; i++) {
    const joint=new THREE.Group(),end=vec(points[i]).sub(vec(points[i-1]));
    parent.add(joint);joint.add(strut([0,0,0],end.toArray() as [number,number,number],.013,steel,10));
    joint.add(ball(i===points.length-1?.032:.014,i===points.length-1?light:steel,end.toArray() as [number,number,number]));
    joints.push({node:joint,x:springAngle(),z:springAngle()});
    parent=new THREE.Group();parent.position.copy(end);joint.add(parent);
  }
  return {model:antenna,joints};
}

function fabric() {
  const geometry = new THREE.PlaneGeometry(1, 1, 26, 30);
  const positions = geometry.getAttribute('position');
  const shades = [];
  for (let i = 0; i < positions.count; i++) {
    const u = positions.getX(i) + .5, v = .5 - positions.getY(i);
    // The open front exposes the chest, waist cables, hands, and legs. Cloth
    // grows from the collar across the shoulders, then falls behind the body.
    const shoulder=Math.min(1,v/.18),fall=Math.max(0,(v-.18)/.82);
    // Below the shoulders the edges recede behind the arms, leaving proper
    // arm openings instead of wrapping the hands inside a closed cylinder.
    const opening = THREE.MathUtils.smoothstep(fall, 0, .32);
    const start = -.36 + .82 * opening;
    const angle = start + u * (Math.PI - 2 * start);
    const pleats=(.012+.028*fall)*Math.sin(angle*8.5+fall*3)+Math.sin(angle*16+fall*5)*.009;
    const breadth=.105+shoulder*.26+fall*.075+pleats;
    const depth=.10+shoulder*.14+fall*.09+pleats;
    const rag=.07*Math.sin(u*37)+.035*Math.sin(u*89)+.025*Math.sin(u*143);
    const length=1.18+.17*Math.sin(angle)+.10*Math.cos(angle);
    positions.setXYZ(i,Math.cos(angle)*breadth,1.79-shoulder*.07-fall*length+rag*fall**6,Math.sin(angle)*depth+.13*fall);
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
  prepareAstraMaterials();
  const model = new THREE.Group();
  model.name = 'Astra';
  const body = new THREE.Group();
  const head = new THREE.Group();
  const neck = new THREE.Group();
  const drape = fabric(), hem = drape.geometry.getAttribute('position');
  drape.name = 'Shoulder cape';
  const eyes=createDigitalEyes();
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
  body.add(barrel(.053,.036,brass,[-.28,1.67,-.130],'z',20),ring(.037,.007,trim,[-.28,1.67,-.154]));
  const flapGeometry=new THREE.PlaneGeometry(1,1,10,12);
  const fold=flapGeometry.getAttribute('position');
  for(let i=0;i<fold.count;i++){
    const u=fold.getX(i)+.5,v=.5-fold.getY(i);
    fold.setXYZ(i,THREE.MathUtils.lerp(-.10-.29*u,-.25+(.5-u)*.04,v),
      THREE.MathUtils.lerp(1.80-u*.11,1.41+Math.abs(u-.5)*.09,v),
      THREE.MathUtils.lerp(-.07-u*.005,-.20,v)-Math.sin(u*Math.PI)*Math.sin(v*Math.PI)*.02);
  }
  fold.setXYZ(28,-.28,1.67,-.112);
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
    for (let index=0;index<8;index++) {
      const a=index*Math.PI/4;
      head.add(barrel(.013,.014,ceramic,[x+Math.cos(a)*.178,Math.sin(a)*.178,-.233],'z',8));
    }
  }
  head.add(eyes.model);
  const antennae=[
    angularAntenna([[-.075,.102,.07],[-.14,.27,.067],[-.29,.31,.06],[-.24,.435,.05],[-.43,.46,.035],[-.40,.59,.025],[-.56,.65,.015]]),
    angularAntenna([[.054,.103,.065],[.14,.30,.07],[.29,.355,.06],[.24,.49,.04],[.41,.54,.015],[.37,.67,-.015],[.48,.73,-.03]]),
  ];
  antennae.forEach((a,i)=>{a.model.name=`${i===0?'Left':'Right'} flexible antenna`;head.add(a.model);});
  head.add(
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
  const tailRest=tailCurve.points.map(p=>p.clone()),tailVelocity=tailRest.map(()=>new THREE.Vector3());
  // Finish vertically above the sample: the jaws straddle it without passing
  // through the ground. These coordinates share the body's joint frame.
  const tailReach=[[0,0,0],[.025,-.20,.04],[.15,-.38,.02],[.38,-.43,-.15],[.58,-.35,-.40],[.58,-.39,-.63],[.42,-.43,-.78],[.26,-.46,-.87],[.20,-.50,-.87],[.20,-.66,-.87]].map(p=>new THREE.Vector3(...p as [number,number,number]));
  const tailSurface=new THREE.Mesh(new THREE.TubeGeometry(tailCurve,72,.028,10,false),cableRubber);tailSurface.name='Flexible tail cable';cable.add(tailSurface);
  const tailBands:THREE.Mesh[]=[];
  for(let i=0;i<30;i++){
    const t=i/29, band=barrel(.032,.013,i%5===0?brass:steel,[0,0,0],'y',12);
    band.position.copy(tailCurve.getPointAt(t));band.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),tailCurve.getTangentAt(t));cable.add(band);tailBands.push(band);
  }
  const claw=new THREE.Group();claw.name='Three-finger tail claw';
  claw.position.copy(tailCurve.getPointAt(1));claw.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),tailCurve.getTangentAt(1));
  claw.add(barrel(.048,.09,steel,[0,.028,0]),barrel(.061,.027,brass,[0,.078,0]),barrel(.045,.05,chassis,[0,.108,0]));
  const tailFingers:THREE.Group[]=[],jawSprings=[springAngle(),springAngle(),springAngle()];
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
  const tailMarkers=Array.from({length:11},(_,i)=>{const marker=new THREE.Object3D();marker.position.copy(tailCurve.getPointAt(i/10));cable.add(marker);return marker;});

  // The downloaded GLB provides the articulated limbs and skinned hands.
  let rig:ReturnType<typeof createRobotRig>|undefined;
  let physics:ReturnType<typeof createCapePhysics>|undefined;
  let disposed=false;
  body.visible=false;
  const colliders:{node:THREE.Object3D;start:THREE.Vector3;end:THREE.Vector3;radius:number}[]=[];
  const inverseBody=new THREE.Matrix4(),axis=new THREE.Vector3(),closest=new THREE.Vector3(),separation=new THREE.Vector3();
  function updateColliders(){
    if(!rig)return;
    model.updateMatrixWorld(true);inverseBody.copy(body.matrixWorld).invert();
    rig.segments.forEach((s,i)=>{s.a.getWorldPosition(colliders[i].start).applyMatrix4(inverseBody);s.b.getWorldPosition(colliders[i].end).applyMatrix4(inverseBody);});
  }
  function distanceTo(c:typeof colliders[number],p:THREE.Vector3){
    axis.subVectors(c.end,c.start);const length=axis.lengthSq();
    const t=length?THREE.MathUtils.clamp(separation.subVectors(p,c.start).dot(axis)/length,0,1):0;
    closest.copy(c.start).addScaledVector(axis,t);separation.subVectors(p,closest);return separation.length();
  }
  const ready=loadAstraAssets().then(({robot,Ammo})=>{
    if(disposed)return;
    rig=createRobotRig(robot);model.add(rig.model);prepareAstraMaterials();
    rig.segments.forEach(s=>colliders.push({node:s.a,start:new THREE.Vector3(),end:new THREE.Vector3(),radius:s.radius}));
    rig.update(0,0,0,'idle',0);body.position.copy(rig.bodyPosition);model.updateMatrixWorld(true);
    physics=createCapePhysics(Ammo,model,[
      // The reinforced mantle is attached across the collar and shoulders;
      // the remaining 26 rows hang freely under Bullet cloth simulation.
      {mesh:drape,pins:Array.from({length:27*5},(_,i)=>i)},
      {mesh:flap,pins:[...Array.from({length:11},(_,i)=>i),28]},
    ],[
      {node:body,center:vec([0,1.66,0]),half:vec([.252,.080,.163])},
      {node:body,center:vec([0,1.49,.015]),half:vec([.200,.160,.145])},
      {node:body,center:vec([0,1.04,.015]),half:vec([.16,.075,.12])},
    ],[...rig.segments,...tailMarkers.slice(1).map((b,i)=>({a:tailMarkers[i],b,radius:.034}))]);
    paintModel(model,2.2);body.visible=true;physics.update(1/60);
    model.userData.ready=true;model.userData.modelSource='RobotExpressive.glb';model.userData.physics='Bullet / Ammo WASM';
  });
  const reduced=matchMedia('(prefers-reduced-motion: reduce)');
  let priorTime=0,gait=0,walkBlend=0;
  let lastHeadX=0,lastHeadY=0,pickupStarted=0,pickupElapsed=0,pickupPulse=false,clampClosed=0;
  const actionBlend={scan:0,pickup:0,assemble:0,talk:0};
  const tailTarget=new THREE.Vector3(),tailNormal=new THREE.Vector3(),tailPoint=new THREE.Vector3(),up=new THREE.Vector3(0,1,0);
  const clawBounds=new THREE.Box3(),groundOrigin=new THREE.Vector3(),modelScale=new THREE.Vector3();
  function updateTail(time:number,dt:number,reach:number,grip:number,idle:number){
    const substeps=Math.max(1,Math.ceil(dt/.008)),h=dt/substeps;
    for(let i=1;i<tailCurve.points.length;i++){
      const weight=i/(tailCurve.points.length-1);
      tailTarget.lerpVectors(tailRest[i],tailReach[i],reach);
      tailTarget.x+=Math.sin(time*1.35-weight*2.4)*idle*.055*weight+Math.sin(gait-weight*2)*walkBlend*.10*weight;
      tailTarget.y+=Math.sin(time*1.8-weight*3)*idle*.035*weight+Math.sin(gait*2-weight*2)*walkBlend*.065*weight;
      tailTarget.z+=Math.sin(time*1.1-weight*2)*idle*.06*weight+walkBlend*.13*weight;
      for(let step=0;step<substeps;step++){
        tailVelocity[i].addScaledVector(tailNormal.subVectors(tailTarget,tailCurve.points[i]).multiplyScalar(100).addScaledVector(tailVelocity[i],-15),h);
        tailCurve.points[i].addScaledVector(tailVelocity[i],h);
      }
      if(i>1){
        tailPoint.copy(tailCurve.points[i]).add(cable.position);
        for(const c of colliders){
          if(c.node===cable||c.node===body)continue;
          const distance=distanceTo(c,tailPoint),clearance=c.radius+.036;
          if(distance<clearance){tailPoint.copy(closest).addScaledVector(separation.normalize(),clearance);tailVelocity[i].multiplyScalar(.6);}
        }
        tailCurve.points[i].copy(tailPoint).sub(cable.position);
      }
    }
    tailCurve.updateArcLengths();
    clampClosed=grip;
    tailFingers.forEach((finger,i)=>{const target=grip>.05?THREE.MathUtils.lerp(-.43,.025,grip):reach>.1?-.43:-.12+Math.sin(time*1.1+i*.7)*idle*.055;finger.rotation.z=jawSprings[i](target,dt,20,.78);});
    // Constrain the entire articulated gripper, including open fingertips, to
    // the contact plane. Correct the connected cable as well as its end effector.
    model.getWorldPosition(groundOrigin);model.getWorldScale(modelScale);
    for(let pass=0;pass<3;pass++){
      claw.position.copy(tailCurve.getPointAt(1));claw.quaternion.setFromUnitVectors(up,tailCurve.getTangentAt(1));claw.rotateY(Math.sin(time*.9)*idle*.18+actionBlend.scan*.45);
      claw.updateWorldMatrix(true,true);clawBounds.setFromObject(claw,true);
      const lift=(groundOrigin.y+.015*modelScale.y-clawBounds.min.y)/modelScale.y;
      if(lift<=0)break;
      for(let i=tailCurve.points.length-4;i<tailCurve.points.length;i++){
        const strength=i>=tailCurve.points.length-2?1:i===tailCurve.points.length-3?.65:.25;
        tailCurve.points[i].y+=lift*strength;tailVelocity[i].y=Math.max(0,tailVelocity[i].y);
      }
      tailCurve.updateArcLengths();
    }
    tailMarkers.forEach((marker,i)=>marker.position.copy(tailCurve.getPointAt(i/10)));
    const frames=tailCurve.computeFrenetFrames(72,false),positions=tailSurface.geometry.getAttribute('position'),normals=tailSurface.geometry.getAttribute('normal');
    for(let i=0;i<=72;i++){
      tailPoint.copy(tailCurve.getPointAt(i/72));
      for(let j=0;j<=10;j++){
        const a=j/10*Math.PI*2,index=i*11+j;
        tailNormal.copy(frames.normals[i]).multiplyScalar(-Math.cos(a)).addScaledVector(frames.binormals[i],Math.sin(a));
        normals.setXYZ(index,tailNormal.x,tailNormal.y,tailNormal.z);tailNormal.multiplyScalar(.028).add(tailPoint);positions.setXYZ(index,tailNormal.x,tailNormal.y,tailNormal.z);
      }
    }
    positions.needsUpdate=normals.needsUpdate=true;tailSurface.geometry.computeBoundingSphere();
    tailBands.forEach((band,i)=>{band.position.copy(tailCurve.getPointAt(i/29));band.quaternion.setFromUnitVectors(up,tailCurve.getTangentAt(i/29));});
    claw.position.copy(tailCurve.getPointAt(1));claw.quaternion.setFromUnitVectors(up,tailCurve.getTangentAt(1));claw.rotateY(Math.sin(time*.9)*idle*.18+actionBlend.scan*.45);
  }
  function pose(time: number, walking: boolean|number, action: 'idle'|'scan'|'pickup'|'assemble'|'talk', amount: number) {
    if(!rig||!physics||disposed)return;
    const dt=priorTime?Math.min(.1,Math.max(0,time-priorTime)):1/60;
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
    const pulse=action==='pickup'&&amount>.015;
    if(pulse&&!pickupPulse)pickupStarted=time;
    pickupElapsed=pulse?Math.max(0,time-pickupStarted):0;
    pickupPulse=pulse;
    const pickupReach=pulse?(pickupElapsed<.62?THREE.MathUtils.smoothstep(pickupElapsed,0,.62):1-THREE.MathUtils.smoothstep(pickupElapsed,1.12,1.88)):0;
    const grip=pulse?THREE.MathUtils.smoothstep(pickupElapsed,.82,1.06):actionBlend.assemble*.8;
    const idle=reduced.matches?0:1-walkBlend;
    const stride=Math.sin(gait)*walkBlend;
    const breath=Math.sin(time*1.65)*idle;
    const glance=Math.sin(time*.54)*Math.sin(time*.21)*idle;
    rig.update(dt,time,walkBlend,action,amount);
    body.position.copy(rig.bodyPosition);
    body.quaternion.copy(rig.bodyQuaternion);
    head.rotation.y = stride*.045+glance*.18+Math.sin(time*3)*actionBlend.scan*.38;
    head.rotation.x = breath*.012-actionBlend.pickup*.31-actionBlend.assemble*.16;
    head.rotation.z = Math.sin(time*2)*actionBlend.talk*.05;
    neck.rotation.x=-walkBlend*.045+breath*.012+Math.sin(time*3)*actionBlend.talk*.03;
    neck.rotation.z=stride*.03+glance*.025;
    const headSpeedX=dt?(head.rotation.x-lastHeadX)/dt:0,headSpeedY=dt?(head.rotation.y-lastHeadY)/dt:0;lastHeadX=head.rotation.x;lastHeadY=head.rotation.y;
    antennae.forEach((antenna,side)=>antenna.joints.forEach((joint,i)=>{
      const flexibility=.35+i*.17;
      const x=THREE.MathUtils.clamp(-headSpeedX*.035+Math.sin(time*1.9+i*.6+side)*idle*.035+stride*.07,-.22,.22)*flexibility;
      const z=THREE.MathUtils.clamp(headSpeedY*.035+Math.sin(time*1.25+i*.55+side*2)*idle*.045+Math.cos(gait+i*.35)*walkBlend*.075,-.22,.22)*flexibility;
      joint.node.rotation.x=joint.x(x,dt,13-i*.7,.55);joint.node.rotation.z=joint.z(z,dt,12-i*.6,.58);
    }));
    eyes.update(time,{...actionBlend,walking:walkBlend},reduced.matches);
    model.updateMatrixWorld(true);updateColliders();
    updateTail(time,dt,Math.max(pickupReach,actionBlend.assemble*.65,actionBlend.scan*.16),grip,idle*(1-pickupReach));
    model.updateMatrixWorld(true);physics.update(dt);
  }
  function inspectRig(){
    return {rig:rig?.inspect(),physics:physics?.inspect(),clampClosed,pickupElapsed,ready:!!rig&&!!physics,
      floorClearance:rig?Math.min(...rig.feet.map(f=>f.position.y)):null};
  }
  function gripPoint(target=new THREE.Vector3()){claw.updateWorldMatrix(true,false);return target.set(0,.29,0).applyMatrix4(claw.matrixWorld);}
  function dispose(){disposed=true;physics?.dispose();rig?.dispose();model.traverse(node=>{if(node instanceof THREE.Mesh)node.geometry.dispose();});}
  return { model, pose, inspectRig, gripPoint, ready, dispose };
}
