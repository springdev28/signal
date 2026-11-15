// Collision envelope for the authored canyon. Distant decorative ridges are omitted.
export const flightRidges = [
  [-58, 29, 25, 49, 51],
  [65, 0, 28, 55, 46],
  [-71, -75, 37, 62, 58],
  [78, -106, 34, 55, 60],
  [-95, -184, 44, 66, 67],
  [92, -229, 52, 74, 58],
  [27, -106, 4, 28, 4.2],
  [35, -111, 3, 18, 3],
] as const;

export function clearPosition(x: number, z: number, altitude: number) {
  let hit = false;
  for (const [cx, cz, w, h, d] of flightRidges) {
    if (altitude > h + 3) continue;
    const f = Math.pow(Math.max(.05, 1 - altitude / h), .38);
    const rx = w * f + 2;
    const rz = d * f + 2;
    const dx = (x - cx) / rx;
    const dz = (z - cz) / rz;
    const n = Math.hypot(dx, dz);
    if (n < 1) {
      x = cx + (n ? dx / n : 1) * rx;
      z = cz + (n ? dz / n : 0) * rz;
      hit = true;
    }
  }
  return { x, z, hit };
}
