// The NASA mission library must keep 13 groups, live source URLs, and fallback mesh names.
import assert from 'node:assert/strict';
import {access, readFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {destinations, exhibits, paths} from '../src/catalog.ts';
import {originalInstrument} from '../src/library-models.ts';
import {sources} from '../src/references.mjs';

const source = await readFile(new URL('../src/library-data.ts', import.meta.url), 'utf8');
const ids = [...source.matchAll(/\{id:'(\w+)'/g)].map(match => match[1]);
assert.equal(ids.length, 13);
assert.equal(new Set(ids).size, 13);
assert.deepEqual(ids, [
  'apollo', 'lunarRover', 'alsep', 'surveyor', 'sojourner', 'mer',
  'viking', 'insight', 'ingenuity', 'dawn', 'near', 'pioneer', 'kepler',
]);
for (const id of ids) {
  assert.equal(typeof sources[id], 'string', `${id} must have a NASA record URL`);
  assert.match(sources[id], /^https:\/\/(?:science\.nasa\.gov|nssdc\.gsfc\.nasa\.gov)\//);
}

assert.match(source, /route:'lunar'/);
assert.match(source, /route:'opportunity'/);
assert.ok(paths.lunar);
assert.ok(paths.opportunity);

const apollo = destinations.moon.sites[0];
assert.equal(apollo.id, 'apollo15');
assert.equal(apollo.latitude, 26.13239);
assert.equal(apollo.longitude, 3.63330);
assert.equal(destinations.moon.gravity, 17);
assert.equal(destinations.mars.sites[0].id, 'eagle');
assert.equal(destinations.mars.gravity, 38);
assert.equal(exhibits.opportunity.world, 'mars');
assert.equal(exhibits.lunar.world, 'moon');

const fallbackParts = {
  sojourner: [
    {name: 'Alpha proton X-ray spectrometer', match: 'spectrometer'},
    {name: 'Solar deck', match: 'solar'},
    {name: 'Wheels and suspension', match: 'wheel|suspension'},
  ],
  surveyor: [
    {name: 'Television camera', match: 'camera'},
    {name: 'Surface sampler', match: 'sampler'},
    {name: 'Landing structure', match: 'landing'},
  ],
  alsep: [
    {name: 'Seismometer', match: 'seismometer'},
    {name: 'Radioisotope generator', match: 'generator'},
    {name: 'Magnetometer', match: 'magnetometer'},
  ],
};
for (const [id, parts] of Object.entries(fallbackParts)) {
  const root = originalInstrument(id);
  const names = [];
  root.traverse(node => { if (node.name) names.push(node.name); });
  for (const part of parts) {
    assert.ok(source.includes(`match:'${part.match}'`), `${id} ${part.name} pattern missing from library-data`);
    const pattern = new RegExp(part.match, 'i');
    assert.ok(names.some(name => pattern.test(name) || pattern.test(name.replaceAll('_', ''))),
      `${id} fallback must include a mesh for ${part.name} (${part.match}); have ${names.join(', ')}`);
  }
}

const publicRoot = fileURLToPath(new URL('../public/', import.meta.url));
for (const id of ids) {
  if (id === 'lunarRover' || id === 'mer') continue;
  await access(publicRoot + 'media/library-' + id + '.png');
}
for (const model of ['apollo', 'viking', 'insight', 'ingenuity', 'dawn', 'near', 'pioneer', 'kepler']) {
  await access(publicRoot + 'models/nasa/' + model + '.glb');
}

console.log(JSON.stringify({groups: ids, fallback: Object.keys(fallbackParts)}, null, 2));
