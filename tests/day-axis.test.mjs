import assert from 'node:assert/strict';
import { test } from 'node:test';
import { dayAxisMinutes, dayAxisTicks, formatDayAxisTick } from '../src/components/temperature-data.ts';

test('uses actual local clock minutes, including seconds, instead of record indices', () => {
  assert.equal(dayAxisMinutes(new Date(2026, 9, 18, 0, 0).toISOString()), 0);
  assert.equal(dayAxisMinutes(new Date(2026, 9, 18, 2, 33, 30).toISOString()), 153.5);
  assert.equal(dayAxisMinutes(new Date(2026, 9, 18, 13, 24).toISOString()), 804);
  assert.equal(dayAxisMinutes(new Date(2026, 9, 18, 23, 59, 59).toISOString()), 1439 + 59 / 60);
});

test('keeps fixed hourly ticks from midnight to 24:00 regardless of available readings', () => {
  assert.deepEqual(dayAxisTicks(), Array.from({ length: 25 }, (_, hour) => hour * 60));
  assert.equal(formatDayAxisTick(0), '00:00');
  assert.equal(formatDayAxisTick(60), '01:00');
  assert.equal(formatDayAxisTick(720), '12:00');
  assert.equal(formatDayAxisTick(1440), '24:00');
});

test('supports a regular four-hour mobile tick interval while preserving both endpoints', () => {
  assert.deepEqual(dayAxisTicks(4), [0, 240, 480, 720, 960, 1200, 1440]);
});
