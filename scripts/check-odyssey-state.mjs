// Regression checks for PlayCanvas Odyssey save, scan, lock and collection rules.
import assert from 'node:assert/strict';

const store = new Map();
globalThis.localStorage = {
  getItem: key => store.has(key) ? store.get(key) : null,
  setItem: (key, value) => { store.set(String(key), String(value)); },
  removeItem: key => { store.delete(key); },
  clear: () => { store.clear(); },
  get length() { return store.size; },
  key: index => [...store.keys()][index] ?? null,
};

const {fresh, load, persist, scan, lockable, award, hasLunar, saveKey} = await import('../src/odyssey/state.ts');

function reset() { store.clear(); }

reset();
const mars = fresh('mars');
assert.equal(mars.version, 2);
assert.equal(mars.chapter, 'mars');
assert.equal(mars.stage, 'flight');
assert.equal(mars.contacts.length, 3);
assert.equal(mars.contacts[0].name, 'Camera mast');
assert.equal(fresh('moon').contacts[0].name, 'Navigation camera');
assert.deepEqual(mars.contacts.map(c => [c.locked, c.recovered, c.fitted, c.samples.length, c.radius]), [
  [false, false, false, 0, 36],
  [false, false, false, 0, 36],
  [false, false, false, 0, 36],
]);

const camera = mars.contacts[0];
mars.x = 0; mars.z = 74;
assert.equal(scan(mars, camera), 'rough');
assert.equal(camera.samples.length, 1);
assert.equal(typeof camera.samples[0].radius, 'number');
assert.equal(lockable(camera), false);
assert.equal(JSON.parse(store.get(saveKey('mars'))).contacts[0].samples.length, 1);

mars.x = 3; mars.z = 75;
assert.equal(scan(mars, camera), 'same', 'A scan within 12 m must not add a repeated bearing.');
assert.equal(camera.samples.length, 1);

mars.x = 0; mars.z = 60;
assert.equal(scan(mars, camera), 'refined');
assert.equal(camera.samples.length, 2);
assert.equal(lockable(camera), false, 'A short baseline must keep uncertainty above the 5 m lock.');

mars.x = 80; mars.z = -20;
assert.equal(scan(mars, camera), 'refined');
assert.ok(camera.radius <= 5, `Wide baseline should lock, radius=${camera.radius}`);
assert.equal(lockable(camera), true);
assert.equal(lockable({...camera, samples: camera.samples.slice(0, 1)}), false);

reset();
assert.deepEqual(load('mars').contacts.map(c => c.id), ['camera', 'solar', 'wheel']);
assert.equal(load('mars').z, 74);

store.set(saveKey('mars'), '{not json');
assert.equal(load('mars').stage, 'flight');

store.set(saveKey('mars'), JSON.stringify({version: 1, chapter: 'mars', stage: 'walk'}));
assert.equal(load('mars').stage, 'flight');

store.set(saveKey('mars'), JSON.stringify({version: 2, chapter: 'moon', stage: 'walk'}));
assert.equal(load('mars').stage, 'flight');

store.set(saveKey('mars'), JSON.stringify({version: 2, chapter: 'mars', stage: 'hacked'}));
assert.equal(load('mars').stage, 'flight');

store.set(saveKey('mars'), JSON.stringify({
  version: 2, chapter: 'mars', stage: 'descent',
  x: 12.5, z: 'nope', altitude: 9, heading: Number.NaN, playerX: -3, playerZ: -80,
  history: [1, 'keep', ...Array.from({length: 40}, (_, i) => 'h' + i)],
  contacts: [
    {id: 'camera', locked: false, recovered: true, fitted: true, samples: [{x: 'bad', z: 1}, {x: 4, z: 5}], radius: 0.2},
    {id: 'solar', locked: true, recovered: true, fitted: true, samples: [{x: 1, z: 2}, {x: 21, z: 2}], radius: 3},
    {id: 'wheel', locked: true, recovered: false, fitted: true, samples: [{x: 8, z: 9}], radius: Number.NaN},
  ],
}));
const restored = load('mars');
assert.equal(restored.stage, 'approach', 'Mid-descent must resume as a flyable approach.');
assert.equal(restored.x, 12.5);
assert.equal(restored.z, 74, 'Non-finite coordinates must keep the fresh spawn.');
assert.equal(restored.altitude, 9);
assert.equal(restored.heading, 0);
assert.equal(restored.playerX, -3);
assert.equal(restored.history.length, 30);
assert.ok(restored.history.every(item => typeof item === 'string'));
assert.ok(!restored.history.includes('1'));
const [loadedCamera, loadedSolar, loadedWheel] = restored.contacts;
assert.deepEqual(loadedCamera.samples, [{x: 4, z: 5}]);
assert.equal(loadedCamera.radius, 1.1);
assert.equal(loadedCamera.locked, false);
assert.equal(loadedCamera.recovered, false, 'Recovery cannot precede a lock.');
assert.equal(loadedCamera.fitted, false);
assert.equal(loadedSolar.locked, true);
assert.equal(loadedSolar.recovered, true);
assert.equal(loadedSolar.fitted, true);
assert.equal(loadedWheel.recovered, false);
assert.equal(loadedWheel.fitted, false);
assert.equal(loadedWheel.radius, 36);

store.set(saveKey('mars'), JSON.stringify({version: 2, chapter: 'mars', stage: 'exit'}));
assert.equal(load('mars').stage, 'approach');
store.set(saveKey('mars'), JSON.stringify({version: 2, chapter: 'mars', stage: 'recovery'}));
assert.equal(load('mars').stage, 'walk');

reset();
award('mars');
assert.deepEqual(JSON.parse(store.get('signal-pc-collection-v1')), ['opportunity']);
assert.deepEqual(JSON.parse(store.get('omnecarta-collection-v1')), ['opportunity']);
assert.equal(hasLunar(), false);
award('moon');
assert.deepEqual(JSON.parse(store.get('signal-pc-collection-v1')), ['opportunity', 'lunar']);
assert.equal(hasLunar(), true);
award('moon');
assert.deepEqual(JSON.parse(store.get('signal-pc-collection-v1')), ['opportunity', 'lunar']);

store.set('signal-pc-collection-v1', '{');
assert.equal(hasLunar(), false);

reset();
const live = fresh('mars');
persist(live);
live.stage = 'walk';
assert.equal(JSON.parse(store.get(saveKey('mars'))).stage, 'flight');
persist(live);
assert.equal(load('mars').stage, 'walk');

console.log(JSON.stringify({
  scans: camera.samples.length,
  lockRadius: camera.radius,
  restoredStage: restored.stage,
  collection: ['opportunity', 'lunar'],
}, null, 2));
