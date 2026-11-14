import * as THREE from 'three';

type Segment = {a:THREE.Object3D;b:THREE.Object3D;radius:number};
type Box = {node:THREE.Object3D;center:THREE.Vector3;half:THREE.Vector3};
type Fabric = {mesh:THREE.Mesh;pins:number[]};

/** Bullet soft bodies, simulated at 120 Hz against animated rigid colliders.
 * A moving local frame preserves world-space cloth inertia during turns and
 * locomotion; scene teleports reset the cloth instead of stretching it.
 */
export function createCapePhysics(Ammo:any,root:THREE.Object3D,fabrics:Fabric[],boxes:Box[],segments:Segment[]){
  const owned:any[]=[];const keep=(object:any)=>{owned.push(object);return object;};
  const v=keep(new Ammo.btVector3(0,0,0)),q=keep(new Ammo.btQuaternion(0,0,0,1));
  const transform=keep(new Ammo.btTransform());transform.setIdentity();
  const config=keep(new Ammo.btSoftBodyRigidBodyCollisionConfiguration());
  const dispatcher=keep(new Ammo.btCollisionDispatcher(config));
  const broadphase=keep(new Ammo.btDbvtBroadphase());
  const solver=keep(new Ammo.btSequentialImpulseConstraintSolver());
  const softSolver=keep(new Ammo.btDefaultSoftBodySolver());
  const world=new Ammo.btSoftRigidDynamicsWorld(dispatcher,broadphase,solver,config,softSolver);
  v.setValue(0,-9.81,0);world.setGravity(v);world.getWorldInfo().set_m_gravity(v);
  const helper=keep(new Ammo.btSoftBodyHelpers());
  const inverse=new THREE.Matrix4(),matrix=new THREE.Matrix4(),toMesh=new THREE.Matrix4();
  const p=new THREE.Vector3(),b=new THREE.Vector3(),scale=new THREE.Vector3(),rotation=new THREE.Quaternion(),up=new THREE.Vector3(0,1,0);
  root.updateWorldMatrix(true,true);inverse.copy(root.matrixWorld).invert();
  const rigid:any[]=[];
  function rigidBody(shape:any){
    keep(shape);shape.setMargin(.004);transform.setIdentity();
    const motion=keep(new Ammo.btDefaultMotionState(transform));v.setValue(0,0,0);
    const info=keep(new Ammo.btRigidBodyConstructionInfo(0,motion,shape,v));
    const body=new Ammo.btRigidBody(info);body.setCollisionFlags(2);body.setActivationState(4);body.setFriction(.65);world.addRigidBody(body);rigid.push(body);return body;
  }
  const boxBodies=boxes.map(box=>{v.setValue(box.half.x,box.half.y,box.half.z);return {...box,body:rigidBody(new Ammo.btBoxShape(v))};});
  const segmentBodies=segments.map(s=>{
    s.a.getWorldPosition(p).applyMatrix4(inverse);s.b.getWorldPosition(b).applyMatrix4(inverse);
    return {...s,body:rigidBody(new Ammo.btCapsuleShape(s.radius,Math.max(.005,p.distanceTo(b)-s.radius*2)))};
  });
  v.setValue(6,.05,6);const floor=rigidBody(new Ammo.btBoxShape(v));
  function place(body:any,position:THREE.Vector3,quaternion:THREE.Quaternion){
    transform.setIdentity();v.setValue(position.x,position.y,position.z);q.setValue(quaternion.x,quaternion.y,quaternion.z,quaternion.w);
    transform.setOrigin(v);transform.setRotation(q);body.setWorldTransform(transform);body.getMotionState().setWorldTransform(transform);
    world.updateSingleAabb(body);
  }
  place(floor,new THREE.Vector3(0,-.055,0),new THREE.Quaternion());
  function moveColliders(){
    root.updateWorldMatrix(true,true);inverse.copy(root.matrixWorld).invert();
    for(const box of boxBodies){matrix.multiplyMatrices(inverse,box.node.matrixWorld);p.copy(box.center).applyMatrix4(matrix);matrix.decompose(b,rotation,scale);place(box.body,p,rotation);}
    for(const s of segmentBodies){s.a.getWorldPosition(p).applyMatrix4(inverse);s.b.getWorldPosition(b).applyMatrix4(inverse);rotation.setFromUnitVectors(up,b.clone().sub(p).normalize());p.add(b).multiplyScalar(.5);place(s.body,p,rotation);}
  }
  moveColliders();
  const cloth=fabrics.map(({mesh,pins})=>{
    const attr=mesh.geometry.getAttribute('position'),rest=Array.from({length:attr.count},(_,i)=>new THREE.Vector3().fromBufferAttribute(attr,i));
    matrix.multiplyMatrices(inverse,mesh.matrixWorld);const vertices:number[]=[];
    for(const point of rest){p.copy(point).applyMatrix4(matrix);vertices.push(p.x,p.y,p.z);}
    const indices=Array.from(mesh.geometry.index!.array);
    const body=helper.CreateFromTriMesh(world.getWorldInfo(),vertices,indices,indices.length/3,false);
    const cfg=body.get_m_cfg();cfg.set_viterations(10);cfg.set_piterations(32);cfg.set_kDP(.035);cfg.set_kDF(.65);cfg.set_kCHR(1);cfg.set_kKHR(1);cfg.set_collisions(1);
    body.get_m_materials().at(0).set_m_kLST(.92);body.get_m_materials().at(0).set_m_kAST(.75);
    body.generateBendingConstraints(2,body.get_m_materials().at(0));body.setTotalMass(.24,false);
    for(const i of pins)body.setMass(i,0);
    Ammo.castObject(body,Ammo.btCollisionObject).getCollisionShape().setMargin(.012);
    world.addSoftBody(body,1,-1);body.setActivationState(4);mesh.frustumCulled=false;
    const links:{a:number;b:number;length:number}[]=[];
    for(let i=0;i<indices.length;i+=3)for(let j=0;j<3;j++){const a=indices[i+j],b=indices[i+(j+1)%3];links.push({a,b,length:rest[a].distanceTo(rest[b])});}
    return {mesh,attr,rest,pins,body,links};
  });
  let steps=0,accumulator=0,disposed=false,settled=false;
  const previousRoot=root.matrixWorld.clone(),frameDelta=new THREE.Matrix4();
  const oldPoint=new THREE.Vector3(),newPoint=new THREE.Vector3(),linearVelocity=new THREE.Vector3();
  function transport(){
    frameDelta.multiplyMatrices(inverse,previousRoot);
    const teleport=new THREE.Vector3().setFromMatrixPosition(frameDelta).length()>2;
    for(const c of cloth){const nodes=c.body.get_m_nodes();matrix.multiplyMatrices(inverse,c.mesh.matrixWorld);
      for(let i=0;i<c.attr.count;i++){
        const node=nodes.at(i),x=node.get_m_x(),q=node.get_m_q(),v=node.get_m_v();
        if(teleport){newPoint.copy(c.rest[i]).applyMatrix4(matrix);oldPoint.copy(newPoint);linearVelocity.set(0,0,0);}
        else {
          newPoint.set(x.x(),x.y(),x.z()).applyMatrix4(frameDelta);oldPoint.set(q.x(),q.y(),q.z()).applyMatrix4(frameDelta);
          linearVelocity.set(v.x(),v.y(),v.z());const speed=linearVelocity.length();linearVelocity.transformDirection(frameDelta).multiplyScalar(speed);
        }
        x.setValue(newPoint.x,newPoint.y,newPoint.z);q.setValue(oldPoint.x,oldPoint.y,oldPoint.z);v.setValue(linearVelocity.x,linearVelocity.y,linearVelocity.z);
      }
    }
    previousRoot.copy(root.matrixWorld);
  }
  function pin(){
    for(const c of cloth){matrix.multiplyMatrices(inverse,c.mesh.matrixWorld);const nodes=c.body.get_m_nodes();
      for(const i of c.pins){p.copy(c.rest[i]).applyMatrix4(matrix);const n=nodes.at(i);n.get_m_x().setValue(p.x,p.y,p.z);n.get_m_q().setValue(p.x,p.y,p.z);n.get_m_v().setValue(0,0,0);}
    }
  }
  function syncMesh(){
    for(const c of cloth){toMesh.copy(c.mesh.matrixWorld).invert().multiply(root.matrixWorld);const nodes=c.body.get_m_nodes();
      for(let i=0;i<c.attr.count;i++){const n=nodes.at(i).get_m_x();p.set(n.x(),n.y(),n.z()).applyMatrix4(toMesh);c.attr.setXYZ(i,p.x,p.y,p.z);}
      c.attr.needsUpdate=true;c.mesh.geometry.computeVertexNormals();c.mesh.geometry.computeBoundingSphere();
    }
  }
  function update(dt:number){
    if(disposed)return;moveColliders();
    transport();
    accumulator+=Math.min(dt,.1);
    // Pre-roll once under gravity so the first visible frame already drapes.
    if(!settled){accumulator=.85;settled=true;}
    const h=1/120;
    while(accumulator>=h){pin();world.stepSimulation(h,0);accumulator-=h;steps++;}
    pin();syncMesh();
  }
  function inspect(){return {engine:'Bullet / Ammo WASM',steps,softBodies:cloth.length,rigidColliders:rigid.length,cloth:cloth.map(c=>{
    let anchorError=0,maxStretch=0,maxExtension=0,maxCompression=0,maxEdgeError=0;let worstEdge:unknown=null;
    matrix.multiplyMatrices(inverse,c.mesh.matrixWorld);const nodes=c.body.get_m_nodes();
    for(const i of c.pins){const n=nodes.at(i).get_m_x();p.copy(c.rest[i]).applyMatrix4(matrix);anchorError=Math.max(anchorError,p.distanceTo(b.set(n.x(),n.y(),n.z())));}
    for(const link of c.links){const a=nodes.at(link.a).get_m_x(),end=nodes.at(link.b).get_m_x();p.set(a.x(),a.y(),a.z());b.set(end.x(),end.y(),end.z());const length=p.distanceTo(b),strain=length/link.length-1;
      if(Math.abs(strain)>maxStretch){maxStretch=Math.abs(strain);worstEdge={a:link.a,b:link.b,rest:link.length,length};}
      maxExtension=Math.max(maxExtension,strain);maxCompression=Math.max(maxCompression,-strain);maxEdgeError=Math.max(maxEdgeError,Math.abs(length-link.length));}
    return {name:c.mesh.name,particles:c.attr.count,anchorError,maxStretch,maxExtension,maxCompression,maxEdgeError,worstEdge};
  })};}
  function dispose(){if(disposed)return;disposed=true;for(const c of cloth){world.removeSoftBody(c.body);Ammo.destroy(c.body);}for(const body of rigid){world.removeRigidBody(body);Ammo.destroy(body);}Ammo.destroy(world);for(const object of owned.reverse())Ammo.destroy(object);}
  return {update,inspect,dispose};
}
