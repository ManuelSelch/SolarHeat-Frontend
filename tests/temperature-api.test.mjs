import assert from 'node:assert/strict';
import { test } from 'node:test';
import axios from 'axios';
import { getHistory, getLive, saveDifference } from '../src/components/temperature-api.ts';

function mockApi(t, respond) {
  const original = axios.defaults.adapter;
  axios.defaults.adapter = async (config) => ({
    data: respond(config), status: 200, statusText: 'OK', headers: {}, config,
  });
  t.after(() => { axios.defaults.adapter = original; });
}

test('sends range and date for day, month and year requests', async (t) => {
  const requests = [];
  mockApi(t, (config) => { requests.push(config); return []; });
  const controller = new AbortController();
  for (const range of ['day', 'month', 'year']) {
    await getHistory(range, '2026-10-17', controller.signal);
    assert.deepEqual(requests.at(-1).params, { range, date: '2026-10-17' });
    assert.equal(requests.at(-1).signal, controller.signal);
  }
});

test('loads live readings independently of the historical date and chooses the latest timestamp', async (t) => {
  const earlier = { timestamp: '2026-10-18T09:00:00Z', solar: 20 };
  const latest = { timestamp: '2026-10-18T10:00:00Z', solar: 28 };
  mockApi(t, (config) => {
    if (config.url.endsWith('/status')) return { time: 1234, dif: 5 };
    assert.deepEqual(config.params, { range: 'day', date: '2026-10-18' });
    return [latest, earlier];
  });
  const result = await getLive('2026-10-18');
  assert.deepEqual(result, { temperature: latest, status: { time: 1234, dif: 5 } });
});

test('does not invent a zero-temperature reading when the day is empty', async (t) => {
  mockApi(t, (config) => config.url.endsWith('/status') ? { time: 1234, dif: 5 } : []);
  assert.equal((await getLive('2026-10-18')).temperature, null);
});

test('saves only the difference to the existing endpoint', async (t) => {
  mockApi(t, (config) => {
    assert.equal(config.method, 'post');
    assert.ok(config.url.endsWith('/temperatures/dif'));
    assert.deepEqual(JSON.parse(config.data), { dif: 7 });
    return {};
  });
  await saveDifference(7);
});

test('rejects invalid differences without making a request', async (t) => {
  mockApi(t, () => assert.fail('invalid difference must not be sent'));
  for (const value of [-1, 21, 2.5, NaN]) {
    await assert.rejects(saveDifference(value));
  }
});
