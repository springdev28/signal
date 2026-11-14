import * as THREE from 'three';
import { asset } from './catalog';
import { paintedFinishGLSL } from './painted-finish';

let texture: THREE.Texture | undefined;
let textureReady: Promise<THREE.Texture> | undefined;
function brushTexture() {
  if (!texture) {
    textureReady = new Promise((resolve, reject) => {
      texture = new THREE.TextureLoader().load(asset('painted-surface.jpg'), resolve, undefined, reject);
    });
    texture!.wrapS = texture!.wrapT = THREE.RepeatWrapping;
    texture!.colorSpace = THREE.NoColorSpace;
    texture!.anisotropy = 4;
  }
  return texture;
}

export function preparePaint() { brushTexture(); return textureReady!; }

/** Brush grain is evaluated in model space so it stays attached while parts move. */
export function paintMaterial(material: THREE.MeshStandardMaterial, scale = 1) {
  material.userData.painted = true;
  material.userData.paintScale = scale;
  // Keep each material's metal, ceramic, glass, and cloth response intact.
  material.onBeforeCompile = shader => {
    shader.uniforms.paintGrain = { value: brushTexture() };
    shader.uniforms.paintScale = { value: scale };
    shader.vertexShader = 'varying vec3 vPaintPosition;\n' + shader.vertexShader;
    shader.vertexShader = shader.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\nvPaintPosition = position;');
    shader.fragmentShader = 'uniform sampler2D paintGrain; uniform float paintScale; varying vec3 vPaintPosition;\n' + paintedFinishGLSL + shader.fragmentShader;
    shader.fragmentShader = shader.fragmentShader.replace('#include <color_fragment>', `
      #include <color_fragment>
      vec3 paintWeights = pow(abs(normalize(cross(dFdx(vPaintPosition), dFdy(vPaintPosition)))), vec3(3.0));
      paintWeights /= max(dot(paintWeights, vec3(1.0)), 0.001);
      float stroke = dot(vec3(
        texture2D(paintGrain, vPaintPosition.yz * paintScale).r,
        texture2D(paintGrain, vPaintPosition.xz * paintScale).r,
        texture2D(paintGrain, vPaintPosition.xy * paintScale).r), paintWeights);
      diffuseColor.rgb *= mix(.93, 1.07, stroke);
    `);
    shader.fragmentShader = shader.fragmentShader.replace('#include <opaque_fragment>', `
      vec2 marksUV=surfaceStrokeUV(vPaintPosition)*max(paintScale,.75)*2.6;
      float facing=abs(dot(normalize(normal),normalize(vViewPosition)));
      outgoingLight=paintedFinish(outgoingLight,marksUV,vec3(.012,.029,.055),vec3(.12,.48,.52),facing);
      #include <opaque_fragment>
    `);
  };
  material.customProgramCacheKey = () => 'natural-painted-v3-' + scale;
  return material;
}

export function paintModel(root: THREE.Object3D, scale = 1) {
  const converted = new Map<THREE.Material, THREE.Material>();
  root.traverse(object => {
    if (!(object instanceof THREE.Mesh)) return;
    const convert = (material: THREE.Material) => {
      if (!(material instanceof THREE.MeshStandardMaterial)) return material;
      if (!converted.has(material)) converted.set(material, paintMaterial(material.clone(), scale));
      return converted.get(material)!;
    };
    object.material = Array.isArray(object.material) ? object.material.map(convert) : convert(object.material);
    object.castShadow = true;
    object.receiveShadow = true;
  });
}

export function stars(scene: THREE.Object3D, radius = 180, count = 1250) {
  const positions = [], colors = [];
  for (let i = 0; i < count; i++) {
    const a = i * 2.39996323, y = 1 - 2 * (i + .5) / count;
    const r = Math.sqrt(1 - y * y);
    positions.push(radius * r * Math.cos(a), radius * y, radius * r * Math.sin(a));
    const color = new THREE.Color(i % 5 ? 0xa9cbd3 : 0xf1c8a1).multiplyScalar(.35 + (i % 7) * .09);
    colors.push(color.r, color.g, color.b);
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
  const field = new THREE.Points(geometry, new THREE.PointsMaterial({ size: 1.35, sizeAttenuation: false, vertexColors: true, transparent: true, opacity: .8, depthWrite: false }));
  scene.add(field);
  return field;
}
