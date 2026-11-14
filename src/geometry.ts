import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

export type XYZ = readonly [number, number, number];
export const vec = (point: XYZ) => new THREE.Vector3(point[0], point[1], point[2]);

export function metal(color: number, metalness = .38, roughness = .49) {
  return new THREE.MeshStandardMaterial({ color, metalness, roughness });
}

export function box(w: number, h: number, d: number, material: THREE.Material, x = 0, y = 0, z = 0) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), material);
  mesh.position.set(x, y, z);
  return mesh;
}

export function rounded(size: XYZ, edge: number, material: THREE.Material, position: XYZ = [0, 0, 0]) {
  const mesh = new THREE.Mesh(new RoundedBoxGeometry(...size, 2, edge), material);
  mesh.position.copy(vec(position));
  return mesh;
}

export function strut(from: XYZ, to: XYZ, radius: number, material: THREE.Material, sides = 8) {
  const a = vec(from), b = vec(to);
  const mesh = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, a.distanceTo(b), sides), material);
  mesh.position.copy(a).lerp(b, .5);
  mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), b.sub(a).normalize());
  return mesh;
}

export function tube(points: XYZ[], radius: number, material: THREE.Material, segments = 24) {
  const curve = new THREE.CatmullRomCurve3(points.map(vec));
  return new THREE.Mesh(new THREE.TubeGeometry(curve, segments, radius, 6, false), material);
}

export function barrel(radius: number, depth: number, material: THREE.Material, position: XYZ, axis: 'x' | 'y' | 'z' = 'y', sides = 24) {
  const mesh = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, depth, sides), material);
  if (axis === 'x') mesh.rotation.z = Math.PI / 2;
  if (axis === 'z') mesh.rotation.x = Math.PI / 2;
  mesh.position.copy(vec(position));
  return mesh;
}

export function instrument(model: THREE.Object3D, id: string) {
  model.userData.instrument = id;
  return model;
}
