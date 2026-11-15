// Flight must bounce off the authored canyon walls instead of clipping through them.
import assert from 'node:assert/strict';
import {clearPosition, flightRidges} from '../src/odyssey/clearance.ts';

const corridor = clearPosition(0, 74, 24);
assert.equal(corridor.hit, false, 'The starting canyon corridor must stay flyable.');
assert.equal(corridor.x, 0);
assert.equal(corridor.z, 74);

const high = clearPosition(-58, 29, 80);
assert.equal(high.hit, false, 'Above a ridge plus 3 m the envelope must not collide.');

const inside = clearPosition(-58, 29, 10);
assert.equal(inside.hit, true);
assert.ok(Math.hypot(inside.x + 58, inside.z - 29) > 20, 'A ship inside a ridge must be pushed to the envelope.');

const spire = clearPosition(27, -106, 8);
assert.equal(spire.hit, true);
assert.ok(Math.hypot(spire.x - 27, spire.z + 106) >= 4, 'The sunlit spire must remain a solid obstacle at low altitude.');

const afterPush = clearPosition(inside.x, inside.z, 10);
assert.equal(afterPush.hit, false, 'A resolved position must not keep colliding.');

assert.equal(flightRidges.length, 8);
console.log(JSON.stringify({corridor, inside, spire}, null, 2));
