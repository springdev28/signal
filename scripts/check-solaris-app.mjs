// HTTP surface for Solaris: unknown API routes and oversized JSON bodies.
import assert from 'node:assert/strict';
import {createApp} from '../server/app.mjs';

process.env.CLOUDFLARE_ACCOUNT_ID = 'a'.repeat(32);
process.env.CLOUDFLARE_API_TOKEN = 'test-only-not-a-provider-key';

const app = createApp({
  fetchProvider: async () => ({
    ok: true,
    json: async () => ({result: {response: JSON.stringify({reply: 'Stay with the bearings.', citations: []})}}),
  }),
});
const server = app.listen(0, '127.0.0.1');
await new Promise(resolve => server.once('listening', resolve));
const {port} = server.address();
const root = `http://127.0.0.1:${port}`;

try {
  const missing = await fetch(root + '/api/not-solaris');
  assert.equal(missing.status, 404);
  assert.deepEqual(await missing.json(), {error: 'not found'});

  const live = await fetch(root + '/api/solaris');
  assert.equal(live.status, 200);
  assert.deepEqual(await live.json(), {live: true});

  const oversized = await fetch(root + '/api/solaris', {
    method: 'POST',
    headers: {'content-type': 'application/json'},
    body: JSON.stringify({view: 'story', history: [{role: 'user', text: 'x'.repeat(8000)}]}),
  });
  assert.equal(oversized.status, 413);
  assert.deepEqual(await oversized.json(), {error: 'request too large'});
} finally {
  await new Promise(resolve => server.close(resolve));
}

console.log('Solaris HTTP 404 and 413 guards passed.');
