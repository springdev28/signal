import * as THREE from 'three';
import { createAstra } from './astra';
import { addLighting } from './scene';

export function renderAstraPortrait(host: HTMLElement) {
  const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, preserveDrawingBuffer: true });
  renderer.setSize(560, 740);
  renderer.setClearColor(0, 0);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.35;
  const scene = new THREE.Scene();
  addLighting(scene);
  const sun = new THREE.DirectionalLight(0xf4ad70, 3);
  sun.position.set(-1, 2, 2);
  scene.add(sun);
  const { model } = createAstra();
  model.rotation.y = .23;
  scene.add(model);
  const camera = new THREE.PerspectiveCamera(28, 560 / 740, .05, 50);
  camera.position.set(3.55, 2.13, -5.5);
  camera.lookAt(.27,1.38,0);
  renderer.render(scene,camera);
  host.append(renderer.domElement);
  return renderer;
}
