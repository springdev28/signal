import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { asset } from './catalog';
import { missionSite, type PartId } from './mission';
import { box, instrument, vec } from './geometry';

export { box };
const unit = 1.67;
const armMaterial = 'tex_arm';
const wheelMaterial = 'tex_suspension_n';
const instrumentMaterial = 'tex_instruments';
type MerMesh = THREE.Mesh<THREE.BufferGeometry, THREE.MeshStandardMaterial>;

function subset(mesh: MerMesh, filter: (x: number, y: number, z: number) => boolean, keep = true): MerMesh | null {
  const original = mesh.geometry;
  const index = original.getIndex();
  const vertices = original.getAttribute('position');
  if (!index) return keep ? null : mesh;
  const faces: number[] = [];
  for (let i = 0; i < index.count; i += 3) {
    const face = [index.getX(i), index.getX(i + 1), index.getX(i + 2)];
    const selected = face.every(v => filter(vertices.getX(v), vertices.getY(v), vertices.getZ(v)));
    if (selected === keep) faces.push(...face);
  }
  if (!faces.length) return null;
  const geometry = new THREE.BufferGeometry();
  for (const [key, value] of Object.entries(original.attributes)) geometry.setAttribute(key, value);
  geometry.setIndex(faces);
  const result = new THREE.Mesh(geometry, mesh.material);
  return result;
}

// These bounds isolate the right middle wheel and the cameras from the original
// material primitives. The geometry and UVs stay identical in the exhibit and game.
const middleWheel = (x: number, y: number, z: number) => x < -.385 && x > -.568 && y < .265 && z > -.244 && z < .032;
const mastHeads = (x: number, y: number, z: number) => y > 1.08 && x > -.29 && x < .23 && z > .245 && z < .51;
const pivots = {
  camera: [0, .681, .362],
  solar: [0, .674, 0],
  wheel: [-.477, .128, -.105],
} as const;

function placePrimitives(primitives: MerMesh[], pivot: keyof typeof pivots | null = null) {
  const group = new THREE.Group();
  const meshes = new THREE.Group();
  for (const item of primitives) meshes.add(item.clone());
  meshes.scale.setScalar(unit);
  meshes.rotation.y = Math.PI;
  if (pivot) meshes.position.copy(vec(pivots[pivot]).multiplyScalar(-unit).applyAxisAngle(new THREE.Vector3(0, 1, 0), Math.PI));
  group.add(meshes);
  return group;
}

export type OpportunityModel = Awaited<ReturnType<typeof prepareOpportunity>>;
let pending: Promise<OpportunityModel> | undefined;

async function prepareOpportunity() {
  const gltf = await new GLTFLoader().loadAsync(asset('mer-vtad.glb'));
  const body: MerMesh[] = [], camera: MerMesh[] = [], solar: MerMesh[] = [], wheel: MerMesh[] = [];
  gltf.scene.traverse(object => {
    if (!(object instanceof THREE.Mesh) || !(object.material instanceof THREE.MeshStandardMaterial)) return;
    const mesh = object as MerMesh;
    const material = mesh.material;
    material.metalness = .31;
    material.roughness = Math.max(.42, material.roughness);
    if (material.name === 'tex_mast' || material.name === 'foil_silver') camera.push(mesh);
    else if (material.name.startsWith('tex_panels')) solar.push(mesh);
    else if (material.name === wheelMaterial || material.name === instrumentMaterial) {
      const isWheel = material.name === wheelMaterial;
      const filter = isWheel ? middleWheel : mastHeads;
      const removed = subset(mesh, filter);
      const retained = subset(mesh, filter, false);
      if (removed) (isWheel ? wheel : camera).push(removed);
      if (retained) body.push(retained);
    } else body.push(mesh);
  });
  const parts: Record<PartId, MerMesh[]> = { camera, solar, wheel };
  if (!body.length || !camera.length || !solar.length || !wheel.length) throw new Error('Incomplete Opportunity model');
  function part(id: PartId) {
    const group = new THREE.Group();
    const piece = placePrimitives(parts[id], id);
    piece.rotation.y = -missionSite.parts.find(item => item.id === id)!.angle * Math.PI / 180;
    group.add(piece);
    return instrument(group, id);
  }
  function frame() {
    const chassis = new THREE.Group();
    for (const mesh of body) {
      const id = mesh.material.name === armMaterial ? 'arm' : mesh.material.name === wheelMaterial ? 'wheel' : '';
      const piece = placePrimitives([mesh]);
      chassis.add(id ? instrument(piece, id) : piece);
    }
    return chassis;
  }
  function assembled() {
    const rover = frame();
    for (const item of missionSite.parts) {
      const group = part(item.id);
      group.position.copy(vec(item.contact));
      group.rotation.y = item.angle * Math.PI / 180;
      rover.add(group);
    }
    return rover;
  }
  return { part, frame, assembled };
}

export function loadOpportunity() {
  pending ??= prepareOpportunity().catch(error => {
    pending = undefined;
    throw error;
  });
  return pending;
}
