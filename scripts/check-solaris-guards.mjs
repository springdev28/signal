// Guard the Solaris endpoint: origin, body shape, rate limit, sanitization and provider failures.
import assert from 'node:assert/strict';
import {createSolaris} from '../server/solaris.mjs';

process.env.CLOUDFLARE_ACCOUNT_ID = 'a'.repeat(32);
process.env.CLOUDFLARE_API_TOKEN = 'test-only-not-a-provider-key';
delete process.env.SOLARIS_DAILY_LIMIT;

function capture() {
  const out = {status: 200, body: undefined};
  return {
    out,
    response: {
      set() { return this; },
      status(code) { out.status = code; return this; },
      json(body) { out.body = body; return this; },
    },
  };
}

let lastRequest;
const api = createSolaris({
  fetchProvider: async (_url, options) => {
    lastRequest = JSON.parse(options.body);
    return {
      ok: true,
      json: async () => ({result: {response: JSON.stringify({reply: 'Stay with the bearings.', citations: []})}}),
    };
  },
});

function request(overrides = {}) {
  return {
    ip: overrides.ip ?? 'solaris-guard',
    get(name) {
      if (name === 'Origin') return overrides.origin;
      if (name === 'Host') return overrides.host ?? '127.0.0.1:4173';
      return undefined;
    },
    body: overrides.body ?? {
      view: 'story',
      history: [{role: 'user', text: 'Where should I scan?'}],
    },
  };
}

{
  const {out, response} = capture();
  await api.reply(request({origin: 'https://evil.example', host: 'signal.example'}), response);
  assert.equal(out.status, 403);
  assert.deepEqual(out.body, {error: 'origin'});
}

{
  const {out, response} = capture();
  await api.reply(request({origin: 'not a url', host: '127.0.0.1:4173'}), response);
  assert.equal(out.status, 403);
}

{
  const {out, response} = capture();
  await api.reply(request({body: {view: 'not-a-view', history: [{role: 'user', text: 'Hi'}]}}), response);
  assert.equal(out.status, 400);
  assert.deepEqual(out.body, {error: 'invalid request'});
}

{
  const {out, response} = capture();
  await api.reply(request({body: {view: 'story', history: 'nope'}}), response);
  assert.equal(out.status, 400);
}

{
  const {out, response} = capture();
  await api.reply(request({
    body: {view: 'story', history: Array.from({length: 8}, () => ({role: 'user', text: 'Again'}))},
  }), response);
  assert.equal(out.status, 400);
}

{
  const {out, response} = capture();
  await api.reply(request({body: {view: 'story', history: [{role: 'assistant', text: 'Hello'}]}}), response);
  assert.equal(out.status, 400);
  assert.deepEqual(out.body, {error: 'message required'});
}

{
  process.env.CLOUDFLARE_ACCOUNT_ID = 'not-an-account-id';
  const {out, response} = capture();
  await api.reply(request({ip: 'offline-client'}), response);
  assert.equal(out.status, 503);
  assert.deepEqual(out.body, {error: 'offline'});
  process.env.CLOUDFLARE_ACCOUNT_ID = 'a'.repeat(32);
}

{
  const limited = request({ip: 'rate-limit-client'});
  for (let i = 0; i < 6; i++) {
    const {out, response} = capture();
    await api.reply(limited, response);
    assert.equal(out.status, 200, `request ${i + 1} should pass`);
  }
  const {out, response} = capture();
  await api.reply(limited, response);
  assert.equal(out.status, 429);
  assert.deepEqual(out.body, {error: 'rate limit'});
}

{
  lastRequest = undefined;
  const {out, response} = capture();
  await api.reply(request({
    ip: 'sanitized-mission',
    body: {
      view: 'story',
      history: [{role: 'user', text: 'Hint please'}],
      mission: {
        phase: 'assemble',
        observed: [0, 1, 'nope'],
        collected: ['camera', 'injected', 'wheel'],
        fitted: ['solar', 'camera'],
        attempts: 99,
        hints: -2,
        selection: 'not-a-part',
        cutscene: true,
      },
    },
  }), response);
  assert.equal(out.status, 200);
  const system = lastRequest.messages[0].content;
  assert.match(system, /"phase":"assemble"/);
  assert.match(system, /"collected":\["camera","wheel"\]/);
  assert.match(system, /"fitted":\["solar","camera"\]/);
  assert.match(system, /"attempts":30/);
  assert.match(system, /"hints":0/);
  assert.doesNotMatch(system, /injected|nope|not-a-part|"attempts":99/);
}

{
  const failing = createSolaris({
    fetchProvider: async () => ({ok: false, status: 500, json: async () => ({})}),
  });
  const {out, response} = capture();
  await failing.reply(request({ip: 'provider-down'}), response);
  assert.equal(out.status, 502);
  assert.deepEqual(out.body, {error: 'provider unavailable'});
}

{
  const empty = createSolaris({
    fetchProvider: async () => ({
      ok: true,
      json: async () => ({result: {response: JSON.stringify({reply: 'See https://evil.example/drop', citations: ['mer', 'injected']})}}),
    }),
  });
  const {out, response} = capture();
  await empty.reply(request({
    ip: 'strip-urls',
    body: {view: 'story', history: [{role: 'user', text: 'Any links?'}]},
  }), response);
  assert.equal(out.status, 200);
  assert.equal(out.body.reply.includes('http'), false);
  assert.deepEqual(out.body.citations, ['mer']);
}

{
  const statusOut = {status: 200, body: undefined};
  const statusResponse = {
    set() { return this; },
    json(body) { statusOut.body = body; return this; },
  };
  api.status({}, statusResponse);
  assert.deepEqual(statusOut.body, {live: true});
}

console.log('Solaris origin, body, offline, rate-limit, sanitization and provider guards passed.');
