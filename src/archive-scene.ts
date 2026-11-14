import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import type { HardwareId } from './catalog';
import { loadOpportunity } from './hardware';
import { createLunarRover } from './lunar-model';
import { addLighting, bindOrbitButtons, fitDistance, mountViewport } from './scene';

export async function showHardware(panel: HTMLElement, id: HardwareId, onSelect: (id: string) => void) {
  const model = id === 'lunar' ? createLunarRover() : (await loadOpportunity()).assembled();
  const world = new THREE.Scene();
  const bounds = new THREE.Box3().setFromObject(model, true);
  const center = bounds.getCenter(new THREE.Vector3());
  // A box-derived sphere leaves too much room around elongated chassis.
  let radius = 0;
  const vertex = new THREE.Vector3();
  model.traverse(object => {
    if (!(object instanceof THREE.Mesh)) return;
    const positions = object.geometry.getAttribute('position');
    const indices = object.geometry.getIndex();
    for (let i = 0; i < (indices?.count ?? positions.count); i++) {
      vertex.fromBufferAttribute(positions, indices ? indices.getX(i) : i).applyMatrix4(object.matrixWorld);
      radius = Math.max(radius, center.distanceTo(vertex));
    }
  });
  model.position.sub(center);
  model.position.y += radius * .072;
  world.add(model);
  addLighting(world, id === 'lunar' ? 0xe8f1fb : 0xffdec2);

  const records = new Map<string, THREE.Mesh[]>();
  const meshes: { id: string; mesh: THREE.Mesh; original: THREE.Material | THREE.Material[] }[] = [];
  model.traverse(object => {
    if (!(object instanceof THREE.Mesh)) return;
    let node: THREE.Object3D | null = object;
    while (node && !node.userData.instrument) node = node.parent;
    const instrument = node?.userData.instrument as string | undefined;
    if (!instrument) return;
    const entries = records.get(instrument) ?? [];
    entries.push(object);
    records.set(instrument, entries);
    meshes.push({ id: instrument, mesh: object, original: object.material });
  });
  const highlight = new Map<THREE.Material, THREE.Material>();
  function highlighted(material: THREE.Material) {
    let selected = highlight.get(material);
    if (!selected) {
      selected = material.clone();
      if (selected instanceof THREE.MeshStandardMaterial) {
        selected.color.lerp(new THREE.Color(0x91e9eb), .53);
        selected.emissive.setHex(0x3cbdc8);
        selected.emissiveIntensity = .62;
      }
      highlight.set(material, selected);
    }
    return selected;
  }
  const camera = new THREE.PerspectiveCamera(37, 1, .04, 75);
  const angle = new THREE.Vector3(id === 'lunar' ? 1.52 : 1.65, .96, id === 'lunar' ? -1.32 : -1.28).normalize();
  let priorFit = 0;
  let defaultFit = 6;
  let controls: OrbitControls | undefined;
  const host = panel.querySelector<HTMLElement>('.model-canvas')!;
  const renderer = mountViewport(host, camera, resize);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.16;
  controls = new OrbitControls(camera, renderer.domElement);
  controls.enablePan = false;
  controls.rotateSpeed = .68;
  controls.minDistance = radius * 1.14;
  controls.maxDistance = defaultFit * 2.45;
  controls.minPolarAngle = .04;
  controls.maxPolarAngle = Math.PI - .04;
  const ray = new THREE.Raycaster();
  const pointer = new THREE.Vector2();
  let down: THREE.Vector2 | undefined;
  const draw = () => renderer.render(world, camera);

  function resize() {
    const next = fitDistance(camera, radius, camera.aspect >= 1 ? 1.02 : .93);
    camera.position.copy(priorFit ? camera.position.multiplyScalar(next / priorFit) : angle.clone().multiplyScalar(next));
    defaultFit = next;
    priorFit = next;
    if (controls) {
      controls.maxDistance = next * 2.45;
      controls.update();
      renderer.render(world, camera);
    }
  }

  controls.addEventListener('change', draw);
  bindOrbitButtons(panel, controls, () => {
    camera.position.copy(angle).multiplyScalar(defaultFit);
    controls!.update();
    draw();
  });
  renderer.domElement.addEventListener('pointerdown', event => {
    if (event.isPrimary) down = new THREE.Vector2(event.clientX, event.clientY);
  });
  renderer.domElement.addEventListener('pointercancel', () => { down = undefined; });
  renderer.domElement.addEventListener('pointerup', event => {
    if (!event.isPrimary || !down || down.distanceTo(new THREE.Vector2(event.clientX,event.clientY)) > 6) {
      down = undefined;
      return;
    }
    down = undefined;
    const rect = renderer.domElement.getBoundingClientRect();
    pointer.set((event.clientX - rect.left) / rect.width * 2 - 1, 1 - (event.clientY - rect.top) / rect.height * 2);
    ray.setFromCamera(pointer, camera);
    const hit = ray.intersectObject(model, true)[0];
    if (!hit) return;
    let node: THREE.Object3D | null = hit.object;
    while (node && !node.userData.instrument) node = node.parent;
    if (node) onSelect(node.userData.instrument);
  });
  controls.update();
  draw();
  return {
    select(part: string) {
      if (!records.has(part)) return;
      for (const { id, mesh, original } of meshes) {
        mesh.material = id === part
          ? Array.isArray(original) ? original.map(highlighted) : highlighted(original)
          : original;
      }
      host.dataset.highlighted = part;
      draw();
    },
  };
}
