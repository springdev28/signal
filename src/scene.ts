import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

export function addLighting(scene: THREE.Scene, color = 0xd8ebf7) {
  const key = new THREE.DirectionalLight(color, 3.1);
  key.position.set(4, 7, 5);
  const rim = new THREE.DirectionalLight(0x9fc7e3, 1.9);
  rim.position.set(-4, 3, -5);
  scene.add(key, rim, new THREE.HemisphereLight(0xbecfe0, 0x9f785d, 1.55));
}

/** Uses the narrower of the two camera fields of view, including in portrait layouts. */
export function fitDistance(camera: THREE.PerspectiveCamera, radius: number, coverage: number) {
  const vertical = THREE.MathUtils.degToRad(camera.fov / 2);
  const horizontal = Math.atan(Math.tan(vertical) * camera.aspect);
  return radius / Math.sin(Math.min(vertical, horizontal)) / coverage;
}

export function mountViewport(
  host: HTMLElement,
  camera: THREE.PerspectiveCamera,
  onResize: () => void,
) {
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: false });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.65));
  renderer.domElement.setAttribute('aria-hidden', 'true');
  host.append(renderer.domElement);
  const resize = () => {
    const { clientWidth: width, clientHeight: height } = host;
    if (!width || !height) return;
    camera.aspect = width / height;
    if(width<=900&&document.querySelector('#detail-drawer[open]')) camera.setViewOffset(width,height,0,height*.23,width,height);
    else camera.clearViewOffset();
    camera.updateProjectionMatrix();
    renderer.setSize(width, height, false);
    onResize();
  };
  new ResizeObserver(resize).observe(host);
  const drawer=document.querySelector('#detail-drawer');
  if(drawer)new MutationObserver(resize).observe(drawer,{attributes:true,attributeFilter:['open']});
  resize();
  return renderer;
}

export function bindOrbitButtons(container: HTMLElement, controls: OrbitControls, reset: () => void, cancel?: () => void) {
  const camera = controls.object;
  const rotation = new THREE.Spherical();
  const offset = new THREE.Vector3();
  for (const button of container.querySelectorAll<HTMLButtonElement>('[data-view]')) {
    button.addEventListener('click', () => {
      cancel?.();
      const action = button.dataset.view;
      if (action === 'reset') {
        reset();
        return;
      }
      rotation.setFromVector3(offset.copy(camera.position).sub(controls.target));
      if (action === 'left' || action === 'right') rotation.theta += action === 'left' ? -.35 : .35;
      if (action === 'up' || action === 'down') rotation.phi = THREE.MathUtils.clamp(
        rotation.phi + (action === 'up' ? -.25 : .25), controls.minPolarAngle, controls.maxPolarAngle,
      );
      if (action === 'in' || action === 'out') {
        rotation.radius = THREE.MathUtils.clamp(
          rotation.radius * (action === 'in' ? .8 : 1.25), controls.minDistance, controls.maxDistance,
        );
      }
      camera.position.copy(offset.setFromSpherical(rotation).add(controls.target));
      controls.update();
      controls.dispatchEvent({ type: 'change' });
    });
  }
}
