import * as THREE from 'three';
import { clone } from 'three/addons/utils/SkeletonUtils.js';
import type { GLTF } from 'three/addons/loaders/GLTFLoader.js';
import { astraMaterial } from './astra-materials';

/** Imported meshes and skinned hands, fitted to Astra's mechanical proportions.
 * Feet in the source rig are independent IK controls. Solve the legs to those
 * contacts instead of scaling the entire donor and bridging the resulting gaps.
 */
export function createRobotRig(source: GLTF) {
  const model = new THREE.Group(); model.name = 'Astra fitted RobotExpressive rig';
  const asset = clone(source.scene); model.add(asset);
  const armor = astraMaterial(0xb6ad94, 'enamel', .42);
  const steel = astraMaterial(0x65716e, 'steel', .72);
  const brass = astraMaterial(0xb29b70, 'brass', .62);
  const imported: THREE.Mesh[] = [];
  const bone = (name: string) => {
    const node = asset.getObjectByName(name);
    if (!node) throw new Error(`Missing robot joint: ${name}`);
    return node;
  };
  asset.traverse(node => {
    if (!(node instanceof THREE.Mesh)) return;
    if (node.name.startsWith('Head_') || node.name.startsWith('Torso_')) { node.visible = false; return; }
    node.geometry = node.geometry.clone();
    node.geometry.computeBoundingBox();
    const box = node.geometry.boundingBox!, size = box.getSize(new THREE.Vector3());
    const p = node.geometry.getAttribute('position'), uv: number[] = [];
    for (let i = 0; i < p.count; i++) uv.push(
      (p.getX(i) - box.min.x) / Math.max(size.x, .001),
      (p.getY(i) - box.min.y) / Math.max(size.y, .001) + (p.getZ(i) - box.min.z) / Math.max(size.z, .001) * .35,
    );
    node.geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
    node.material = (node.material as THREE.Material).name === 'Grey' ? steel : armor;
    node.castShadow = node.receiveShadow = true; node.frustumCulled = false;
    imported.push(node);
  });
  const mixer = new THREE.AnimationMixer(asset);
  const clips = source.animations.map(c => new THREE.AnimationClip(c.name, c.duration,
    c.tracks.filter(t => !t.name.includes('morphTarget')).map(t => t.clone())));
  const idle = mixer.clipAction(clips.find(c => c.name === 'Idle')!).play();
  const walking = mixer.clipAction(clips.find(c => c.name === 'Walking')!).play();
  walking.setEffectiveWeight(0); mixer.update(0); model.updateMatrixWorld(true);

  // Bake rigid imported pieces into their joint frame, then fit the cross-section
  // without changing joint spacing or distorting the hand's skin bind matrices.
  function fitPiece(name: string, length: number, width: number, depth: number, centered = false) {
    const mesh = bone(name) as THREE.Mesh;
    mesh.updateMatrix(); mesh.geometry.applyMatrix4(mesh.matrix); mesh.geometry.computeBoundingBox();
    const bounds = mesh.geometry.boundingBox!, s = bounds.getSize(new THREE.Vector3()), c = bounds.getCenter(new THREE.Vector3());
    const p = mesh.geometry.getAttribute('position');
    for (let i = 0; i < p.count; i++) p.setXYZ(i,
      (p.getX(i) - c.x) / s.x * width / 100,
      ((p.getY(i) - bounds.min.y) / s.y * (length - .035) + .0175 - (centered ? length / 2 : 0)) / 100,
      (p.getZ(i) - c.z) / s.z * depth / 100);
    p.needsUpdate = true; mesh.geometry.computeVertexNormals(); mesh.geometry.computeBoundingSphere();
    mesh.position.set(0, 0, 0); mesh.quaternion.identity(); mesh.scale.setScalar(1);
  }
  for (const side of ['L', 'R']) {
    fitPiece(`Shoulder${side}_1`, .115, .12, .12, true);
    fitPiece(`Arm${side}`, .35, .065, .075);
    fitPiece(`Leg${side}`, .46, .095, .10);
    fitPiece(`LowerLeg${side}_1`, .48, .085, .09);
  }
  const footMeshes = ['L', 'R'].map(s => bone(`Foot${s}_1`) as THREE.Mesh);
  const inverse = new THREE.Matrix4().copy(model.matrixWorld).invert();
  const feet = footMeshes.map((mesh, i) => {
    const matrix = new THREE.Matrix4().multiplyMatrices(inverse, mesh.matrixWorld);
    mesh.geometry.applyMatrix4(matrix); mesh.geometry.computeBoundingBox();
    const bounds = mesh.geometry.boundingBox!, size = bounds.getSize(new THREE.Vector3()), c = bounds.getCenter(new THREE.Vector3());
    const p = mesh.geometry.getAttribute('position');
    for (let j = 0; j < p.count; j++) p.setXYZ(j,
      (p.getX(j) - c.x) / size.x * .145,
      (p.getY(j) - bounds.min.y) / size.y * .105,
      (p.getZ(j) - c.z) / size.z * .27 - .025);
    p.needsUpdate = true; mesh.geometry.computeVertexNormals(); mesh.geometry.computeBoundingSphere();
    const marker = new THREE.Group(); marker.name = i === 0 ? 'Left foot' : 'Right foot';
    model.add(marker); marker.add(mesh); mesh.position.set(0, 0, 0); mesh.quaternion.identity(); mesh.scale.setScalar(1);
    return marker;
  });
  const fingerNames = ['Middle1', 'Middle2', 'Index', 'Index2', 'Ring1', 'Ring2', 'Thumb2'];
  const fingers = ['L', 'R'].flatMap((s, side) => fingerNames.map((name, index) => {
    const node = bone(name + s); return { node, rest: node.quaternion.clone(), side, index };
  }));
  const bodyPosition = new THREE.Vector3(), bodyQuaternion = new THREE.Quaternion();
  const bodyEuler = new THREE.Euler();
  const worldPoint = new THREE.Vector3(), worldEnd = new THREE.Vector3(), parentScale = new THREE.Vector3(), modelScale = new THREE.Vector3();
  const direction = new THREE.Vector3(), up = new THREE.Vector3(0, 1, 0), parentQ = new THREE.Quaternion(), worldQ = new THREE.Quaternion(), modelQ = new THREE.Quaternion();
  function joint(node: THREE.Object3D, point: THREE.Vector3, end: THREE.Vector3, units = 100) {
    model.updateWorldMatrix(true, false); node.parent!.updateWorldMatrix(true, false);
    worldPoint.copy(point).applyMatrix4(model.matrixWorld);
    node.position.copy(node.parent!.worldToLocal(worldPoint));
    direction.subVectors(end, point).normalize(); worldQ.setFromUnitVectors(up, direction);
    model.getWorldQuaternion(modelQ); worldQ.premultiply(modelQ);
    node.parent!.getWorldQuaternion(parentQ); node.quaternion.copy(parentQ.invert()).multiply(worldQ);
    model.getWorldScale(modelScale); node.parent!.getWorldScale(parentScale);
    node.scale.set(units * modelScale.x / parentScale.x, units * modelScale.y / parentScale.y, units * modelScale.z / parentScale.z);
    node.updateWorldMatrix(false, true);
  }
  const ankleNodes = feet.map((f, i) => { const node = new THREE.Object3D(); node.name = `Ankle ${i}`; f.add(node); node.position.set(0, .12, .025); return node; });
  const segments = ['L', 'R'].flatMap((s, i) => [
    { a: bone(`Shoulder${s}`), b: bone(`LowerArm${s}`), radius: .060 },
    { a: bone(`LowerArm${s}`), b: bone(`Palm2${s}`), radius: .058 },
    { a: bone(`UpperLeg${s}`), b: bone(`LowerLeg${s}`), radius: .055 },
    { a: bone(`LowerLeg${s}`), b: ankleNodes[i], radius: .052 },
  ]);
  const joints = Array.from({length: 6}, (_, i) => {
    const mesh = new THREE.Mesh(new THREE.SphereGeometry(i < 2 ? .06 : .052, 16, 12), i < 2 ? brass : steel);
    mesh.name = ['Left hip', 'Right hip', 'Left knee', 'Right knee', 'Left ankle', 'Right ankle'][i];
    mesh.castShadow = true; model.add(mesh); return mesh;
  });
  const hip = new THREE.Vector3(), knee = new THREE.Vector3(), ankle = new THREE.Vector3();
  const shoulder = new THREE.Vector3(), elbow = new THREE.Vector3(), wrist = new THREE.Vector3();
  const line = new THREE.Vector3(), bend = new THREE.Vector3();
  function bodyPoint(x: number, y: number, z: number, target: THREE.Vector3) {
    return target.set(x, y, z).applyQuaternion(bodyQuaternion).add(bodyPosition);
  }
  let weight = 0, gait = 0, maxJointError = 0;
  const gestures = {scan: 0, assemble: 0};
  function update(dt: number, time: number, speed: number, action: string, amount: number) {
    weight = THREE.MathUtils.damp(weight, speed, 8, dt);
    if (weight < .0001) weight = 0;
    gestures.scan = THREE.MathUtils.damp(gestures.scan, action === 'scan' ? amount : 0, 7, dt);
    gestures.assemble = THREE.MathUtils.damp(gestures.assemble, action === 'assemble' ? amount : 0, 7, dt);
    idle.setEffectiveWeight(1 - weight); walking.setEffectiveWeight(weight);
    mixer.update(dt);
    gait += dt * 1.15 * weight;
    const sway = Math.sin(gait * Math.PI * 2), breath = Math.sin(time * 1.55);
    bodyPosition.set(sway * weight * .018, -.006 * (1 - weight) * (1 + breath) - .014 * weight * (1 - Math.cos(gait * Math.PI * 4)), 0);
    bodyEuler.set(-.025 * weight, 0, sway * weight * .018 + Math.sin(time * .7) * (1 - weight) * .003);
    bodyQuaternion.setFromEuler(bodyEuler);
    model.updateWorldMatrix(true, true);
    for (let i = 0; i < 2; i++) {
      const side = i === 0 ? -1 : 1, suffix = i === 0 ? 'L' : 'R';
      const phase = (gait + i * .5) % 1, stance = phase < .62;
      const u = stance ? phase / .62 : (phase - .62) / .38;
      const z = stance ? THREE.MathUtils.lerp(-.19, .19, u) : THREE.MathUtils.lerp(.19, -.19, u * u * (3 - 2 * u));
      const lift = stance ? 0 : .095 * Math.sin(u * Math.PI) ** 2;
      feet[i].position.set(side * .19, lift * weight, z * weight - .015);
      feet[i].rotation.set(0, side * -.045, 0);
      ankle.copy(feet[i].position).add(worldEnd.set(0, .12, .025));
      bodyPoint(side * .17, 1.015, 0, hip);
      line.subVectors(ankle, hip); const distance = line.length(); line.normalize();
      const lengthA = .46, lengthB = .48, d = THREE.MathUtils.clamp(distance, .01, lengthA + lengthB - .0001);
      const along = (lengthA * lengthA - lengthB * lengthB + d * d) / (2 * d);
      bend.set(0, 0, -1).addScaledVector(line, line.z).normalize();
      knee.copy(hip).addScaledVector(line, along).addScaledVector(bend, Math.sqrt(Math.max(0, lengthA * lengthA - along * along)));
      joint(bone(`UpperLeg${suffix}`), hip, knee);
      joint(bone(`LowerLeg${suffix}`), knee, ankle);
      joints[i].position.copy(hip); joints[i + 2].position.copy(knee); joints[i + 4].position.copy(ankle);
      maxJointError = Math.max(Math.abs(hip.distanceTo(knee) - lengthA), Math.abs(knee.distanceTo(ankle) - lengthB));
      const swing = Math.sin((gait + i * .5) * Math.PI * 2) * weight;
      const restSway = Math.sin(time * 1.25 + i * 2.1) * (1 - weight);
      bodyPoint(side * .30, 1.62, 0, shoulder);
      bodyPoint(side * (.33 + .008 * restSway), 1.274, -.025 + .10 * swing + .009 * restSway, elbow);
      bodyPoint(side * (.345 + .012 * restSway), .91, -.05 + .18 * swing + .015 * restSway, wrist);
      if (i === 1) { wrist.y += gestures.scan * .18; wrist.z -= gestures.scan * .24; }
      wrist.z -= .20 * gestures.assemble; wrist.y += .12 * gestures.assemble;
      // Keep the mechanical upper arm and forearm at fixed lengths in every
      // gesture, with an outward elbow pole to clear the torso and cape.
      line.subVectors(wrist, shoulder); const armDistance = Math.min(line.length(), .7199); line.normalize();
      const armAlong = (.35 ** 2 - .37 ** 2 + armDistance ** 2) / (2 * armDistance);
      bend.set(side * .65, 0, -.4); bend.addScaledVector(line, -bend.dot(line)).normalize();
      elbow.copy(shoulder).addScaledVector(line, armAlong).addScaledVector(bend, Math.sqrt(Math.max(0, .35 ** 2 - armAlong ** 2)));
      wrist.copy(shoulder).addScaledVector(line, armDistance);
      maxJointError = Math.max(maxJointError, Math.abs(shoulder.distanceTo(elbow) - .35), Math.abs(elbow.distanceTo(wrist) - .37));
      joint(bone(`Shoulder${suffix}`), shoulder, elbow);
      joint(bone(`UpperArm${suffix}`), shoulder, elbow);
      // The entire forearm/hand has one uniform scale. Skinning then retains
      // the imported palm and finger shapes at the new wrist location.
      joint(bone(`LowerArm${suffix}`), elbow, wrist, elbow.distanceTo(wrist) / (i === 0 ? .0136820003390312 : .0137971695512533));
    }
    for (const f of fingers) {
      f.node.quaternion.copy(f.rest);
      f.node.rotateZ((f.side ? 1 : -1) * (.025 * Math.sin(time * 1.3 + f.index * .45) + .05 * weight));
    }
    model.updateWorldMatrix(true, true);
  }
  function localPosition(name: string, target = new THREE.Vector3()) {
    model.updateWorldMatrix(true, true); bone(name).getWorldPosition(target); return model.worldToLocal(target);
  }
  update(0, 0, 0, 'idle', 0);
  return {
    model, asset, bone, feet, segments, update, bodyPosition, bodyQuaternion, localPosition,
    inspect() { return { source: 'RobotExpressive.glb', importedMeshes: imported.length, animations: clips.map(c => c.name), walkWeight: weight, feet: feet.map(f => f.position.y), maxJointError }; },
    dispose() { mixer.stopAllAction(); mixer.uncacheRoot(asset); imported.forEach(m => m.geometry.dispose()); },
  };
}
