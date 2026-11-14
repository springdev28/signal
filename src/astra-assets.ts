import { GLTFLoader, type GLTF } from 'three/addons/loaders/GLTFLoader.js';

// Both assets are vendored locally; production never depends on a CDN.
const base = `${import.meta.env.BASE_URL}vendor/astra/`;
let pending: Promise<{ robot: GLTF; Ammo: any }> | undefined;
export function loadAstraAssets() {
  return pending ??= Promise.all([
    new GLTFLoader().loadAsync(`${base}RobotExpressive.glb`),
    new Promise<any>((resolve, reject) => {
      const script = document.createElement('script');
      script.src = `${base}ammo.wasm.js`;
      script.onerror = () => reject(new Error('Astra physics runtime could not load.'));
      script.onload = () => {
        const factory = (window as any).Ammo;
        factory({ locateFile: (name: string) => `${base}${name}` }).then(resolve, reject);
      };
      document.head.append(script);
    }),
  ]).then(([robot, Ammo]) => ({robot, Ammo}));
}
