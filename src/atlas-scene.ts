import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { asset, type WorldId, type AtlasSite } from './catalog';
import { bindOrbitButtons, fitDistance, mountViewport } from './scene';
import { celestialRim, createCelestialEnvironment, illustratePlanet } from './celestial-scene';

const radius = 1;
const worldViews = {
  moon: { latitude: 10, longitude: -8, sun: [.43, .37, .82], key: 0xfff3df, fill: 0x9caebb, exposure: 1.10 },
  mars: { latitude: 12, longitude: -35, sun: [.34, .40, .83], key: 0xffecdc, fill: 0xa8b1c3, exposure: 1.06 },
} as const;

// The maps are equirectangular, north up, with the prime meridian in the center.
// SphereGeometry starts its UV seam at -X and increases u toward +Z.
export function geographicNormal(latitude: number, longitude: number) {
  const lat = THREE.MathUtils.degToRad(latitude);
  const lon = THREE.MathUtils.degToRad(longitude);
  return new THREE.Vector3(Math.cos(lat) * Math.cos(lon), Math.sin(lat), -Math.cos(lat) * Math.sin(lon));
}

function formatCoordinates(direction: THREE.Vector3) {
  const latitude = THREE.MathUtils.radToDeg(Math.asin(THREE.MathUtils.clamp(direction.y, -1, 1)));
  const longitude = THREE.MathUtils.radToDeg(Math.atan2(-direction.z, direction.x));
  return `${Math.abs(latitude).toFixed(1)}° ${latitude < 0 ? 'S' : 'N'} · ${Math.abs(longitude).toFixed(1)}° ${longitude < 0 ? 'W' : 'E'}`;
}

export async function showAtlas(
  panel: HTMLElement,
  worldId: WorldId,
  sites: readonly AtlasSite[],
  onSelect: (id: string) => void,
) {
  const viewport = panel.querySelector<HTMLElement>('.model-canvas')!;
  const world = worldViews[worldId];
  const loader = new THREE.TextureLoader();
  const [map, relief] = await Promise.all([
    loader.loadAsync(asset(`${worldId}-albedo.jpg`)),
    worldId === 'moon' ? loader.loadAsync(asset('moon-relief.jpg')) : Promise.resolve(null),
  ]);
  map.colorSpace = THREE.SRGBColorSpace;
  map.anisotropy = 8;
  if (relief) relief.anisotropy = 8;

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x06151c);
  const environment = createCelestialEnvironment(scene, 38);
  const camera = new THREE.PerspectiveCamera(34, 1, .04, 80);
  const initial = geographicNormal(world.latitude, world.longitude);
  const geometry = new THREE.SphereGeometry(radius, 144, 96);
  const material = illustratePlanet(new THREE.MeshStandardMaterial({
    map, color: 0xffffff, roughness: 1,
    bumpMap: relief, bumpScale: .018, metalness: 0,
  }));
  scene.add(new THREE.Mesh(geometry, material));
  if(worldId==='mars')scene.add(celestialRim(radius,0xe59356));
  const sun = new THREE.DirectionalLight(world.key, 3.05);
  sun.position.set(world.sun[0], world.sun[1], world.sun[2]);
  scene.add(sun, new THREE.AmbientLight(world.fill, .055));

  const markers = sites.map(site => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'atlas-marker';
    button.dataset.site = site.id;
    button.setAttribute('aria-label', `Focus ${site.mission} on globe`);
    button.setAttribute('aria-pressed', 'false');
    button.innerHTML = `<span class="marker-dot" aria-hidden="true"></span><span class="marker-label">${site.mission}</span>`;
    button.addEventListener('click', () => onSelect(site.id));
    const normal = geographicNormal(site.latitude, site.longitude);
    return { button, normal };
  });
  const coordinates = panel.querySelector<HTMLElement>('[data-coordinates]')!;
  const cameraDirection = new THREE.Vector3();
  const projected = new THREE.Vector3();
  let defaultDistance = 4;
  let previousDistance = 0;
  let active: string | undefined;
  let animation = 0;
  let controls: OrbitControls | undefined;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const renderer = mountViewport(viewport, camera, resize);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = world.exposure;
  controls = new OrbitControls(camera, renderer.domElement);
  controls.enablePan = false;
  controls.minPolarAngle = .055;
  controls.maxPolarAngle = Math.PI - .055;
  controls.rotateSpeed = .64;
  controls.zoomSpeed = .8;
  controls.minDistance = radius * 1.21;
  controls.maxDistance = defaultDistance * 2.25;
  for (const { button } of markers) viewport.append(button);

  function resize() {
    const nextDistance = fitDistance(camera, radius, camera.aspect < 1 ? .76 : .73);
    camera.position.copy(previousDistance
      ? camera.position.multiplyScalar(nextDistance / previousDistance)
      : initial.clone().multiplyScalar(nextDistance));
    defaultDistance = nextDistance;
    previousDistance = nextDistance;
    if (controls) {
      controls.maxDistance = nextDistance * 2.25;
      controls.update();
      draw();
    }
  }

  function draw() {
    cameraDirection.copy(camera.position).normalize();
    coordinates.textContent = formatCoordinates(cameraDirection);
    renderer.render(scene, camera);
    for (const { button, normal } of markers) {
      projected.copy(normal).multiplyScalar(radius * 1.002).project(camera);
      // A surface point is visible only if it lies on the near side of the true limb.
      const visible = normal.dot(cameraDirection) > radius / camera.position.length() + .008;
      button.hidden = !visible || Math.abs(projected.x) > .94 || Math.abs(projected.y) > .94;
      button.style.left = (projected.x + 1) * 50 + '%';
      button.style.top = (1 - projected.y) * 50 + '%';
      button.classList.toggle('marker-left', projected.x > .4);
      button.setAttribute('aria-pressed', String(button.dataset.site === active));
    }
  }

  function stop() {
    cancelAnimationFrame(animation);
    animation = 0;
  }

  function goTo(target: THREE.Vector3, distance: number) {
    stop();
    const from = camera.position.clone();
    const startDistance = from.length();
    from.normalize();
    const rotation = new THREE.Quaternion().setFromUnitVectors(from, target);
    const orientation = new THREE.Quaternion();
    const start = performance.now();
    const step = (now: number) => {
      const time = reduced.matches ? 1 : Math.min(1, (now - start) / 680);
      const ease = time * time * (3 - 2 * time);
      orientation.identity().slerp(rotation, ease);
      camera.position.copy(from).applyQuaternion(orientation).multiplyScalar(
        THREE.MathUtils.lerp(startDistance, distance, ease),
      );
      controls!.update();
      draw();
      if (time < 1) animation = requestAnimationFrame(step);
    };
    animation = requestAnimationFrame(step);
  }

  controls.addEventListener('change', draw);
  controls.addEventListener('start', stop);
  bindOrbitButtons(panel, controls, () => goTo(initial, defaultDistance), stop);
  controls.update();
  draw();
  let ambienceFrame = 0;
  function animateEnvironment(now: number) {
    if (!document.hidden && !document.querySelector('dialog[open]')) {
      environment.update(reduced.matches ? 0 : now * .001);
      draw();
    }
    ambienceFrame = requestAnimationFrame(animateEnvironment);
  }
  if (!reduced.matches) ambienceFrame = requestAnimationFrame(animateEnvironment);
  window.addEventListener('pagehide', () => {
    stop(); cancelAnimationFrame(ambienceFrame); environment.dispose(); controls!.dispose(); renderer.dispose();
  }, { once: true });
  return {
    focus(id: string) {
      const marker = markers.find(item => item.button.dataset.site === id);
      if (!marker) return;
      active = id;
      draw();
      goTo(marker.normal, Math.max(1.7, defaultDistance * .77));
    },
    descend(id: string) {
      const marker = markers.find(item => item.button.dataset.site === id);
      if (marker) goTo(marker.normal, 1.08);
    },
  };
}
