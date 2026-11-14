import * as THREE from 'three';

type Finish = 'canvas' | 'enamel' | 'steel' | 'brass' | 'rubber';
type Maps = { map: THREE.DataTexture; roughnessMap: THREE.DataTexture; bumpMap: THREE.DataTexture };
const maps = new Map<Finish, Maps>();
const materials: {material:THREE.MeshStandardMaterial;finish:Finish}[]=[];
const size = 512;

function hash(x: number, y: number) {
  let n = Math.imul(x + 3917, 374761393) ^ Math.imul(y + 7219, 668265263);
  n = Math.imul(n ^ n >>> 13, 1274126177);
  return ((n ^ n >>> 16) >>> 0) / 4294967295;
}

function noise(x: number, y: number, cells: number) {
  x = x / size * cells; y = y / size * cells;
  const ix = Math.floor(x), iy = Math.floor(y);
  const a = x - ix, b = y - iy;
  const u = a * a * (3 - 2 * a), v = b * b * (3 - 2 * b);
  const at = (dx: number, dy: number) => hash((ix + dx) % cells, (iy + dy) % cells);
  return THREE.MathUtils.lerp(THREE.MathUtils.lerp(at(0, 0), at(1, 0), u), THREE.MathUtils.lerp(at(0, 1), at(1, 1), u), v);
}

function texture(data: Uint8Array, color = false) {
  const value = new THREE.DataTexture(data, size, size, THREE.RGBAFormat);
  value.colorSpace = color ? THREE.SRGBColorSpace : THREE.NoColorSpace;
  value.wrapS = value.wrapT = THREE.RepeatWrapping;
  value.minFilter = THREE.LinearMipmapLinearFilter;
  value.magFilter = THREE.LinearFilter;
  value.generateMipmaps = true;
  value.anisotropy = 4;
  value.needsUpdate = true;
  return value;
}

/** Separate colour, roughness and height maps, shared by every instance. */
function surfaceMaps(finish: Finish): Maps {
  const cached = maps.get(finish); if (cached) return cached;
  const color = new Uint8Array(size * size * 4);
  const rough = new Uint8Array(color.length), height = new Uint8Array(color.length);
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
    const broad = noise(x, y, 7), medium = noise(x, y, 31), grain = hash(x, y);
    let value = 1, relief = .5, gloss = .8, warm = 0;
    if (finish === 'canvas') {
      const warp = Math.sin(x * Math.PI / 2.5), weft = Math.sin(y * Math.PI / 2.5);
      const twill = ((Math.floor(x / 5) + Math.floor(y / 5)) % 4) < 2;
      const weave = (twill ? warp : weft) * .5 + (twill ? weft : warp) * .18;
      const dirt = THREE.MathUtils.smoothstep(.53 - broad, 0, .33);
      value = .86 + broad * .06 + medium * .035 + weave * .085 + grain * .025 - dirt * .035;
      relief = .5 + weave * .32 + (medium - .5) * .07;
      gloss = .89 + grain * .1;
      warm = dirt * .025;
      // A visible double seam, individual stitches and an irregular dirty hem.
      const border = Math.min(x, size - 1 - x);
      const stitch = (Math.abs(border - 12) < 1.3 || Math.abs(border - 21) < 1.3) && y % 13 < 8;
      if (stitch) { value = 1.03; relief = .82; }
      if (border < 6 || y < 26 + 12 * medium) { value *= .72; relief -= .07; }
    } else if (finish === 'rubber') {
      const ribs = Math.sin(y * Math.PI / 3);
      value = .7 + broad * .16 + grain * .04 + ribs * .07;
      relief = .5 + ribs * .18; gloss = .78 + medium * .18;
    } else {
      const brushed = hash(x, Math.floor(y / 37)) * .055;
      const scratch = hash(Math.floor(x / 2), 41) > .985 && noise(x, y, 21) > .43;
      const edge = Math.min(x, y, size - 1 - x, size - 1 - y);
      const chipped = finish === 'enamel' && edge < 2 + 5 * medium && grain > .65;
      value = .88 + broad * .07 + grain * .02 + brushed;
      relief = .5 + (grain - .5) * .06;
      gloss = finish === 'enamel' ? .63 : finish === 'brass' ? .52 : .42;
      gloss += (1 - broad) * .20;
      if (scratch) { value = 1; relief = .29; gloss = .34; }
      if (chipped) { value = .55 + medium * .12; relief = .35; gloss = .48; }
      const patina = Math.max(0, .45 - broad);
      value -= patina * (finish === 'enamel' ? .06 : .18);
      warm = patina * (finish === 'brass' ? -.06 : .06);
    }
    const i = (y * size + x) * 4;
    color[i] = Math.min(255, (value + warm) * 255);
    color[i + 1] = Math.min(255, value * 255);
    color[i + 2] = Math.min(255, (value - warm) * 255);
    color[i + 3] = rough[i + 3] = height[i + 3] = 255;
    rough[i] = rough[i + 1] = rough[i + 2] = gloss * 255;
    height[i] = height[i + 1] = height[i + 2] = relief * 255;
  }
  const result = { map: texture(color, true), roughnessMap: texture(rough), bumpMap: texture(height) };
  maps.set(finish, result);
  return result;
}

export function astraMaterial(color: number, finish: Finish, metalness: number, roughness = 1) {
  const material = new THREE.MeshStandardMaterial({ color, metalness, roughness });
  material.bumpScale = finish === 'canvas' ? .009 : finish === 'rubber' ? .003 : .0014;
  material.userData.surfaceFinish = finish;
  materials.push({material,finish});
  return material;
}

/** Atlas and landing-page imports do not need to generate character textures. */
export function prepareAstraMaterials(){
  for(const {material,finish}of materials){
    if(material.map)continue;
    Object.assign(material,surfaceMaps(finish));material.needsUpdate=true;
  }
}
