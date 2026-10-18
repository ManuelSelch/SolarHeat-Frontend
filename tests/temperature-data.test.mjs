import assert from 'node:assert/strict';
import { test } from 'node:test';
import { filterDataByTimePeriod } from '../src/components/temperature-data.ts';

const now = new Date('2026-10-18T10:00:00.000Z');
const reading = (timestamp) => ({ solar: 27, pump: 60, security: 70, rel: 0, timestamp });

test('keeps API ISO timestamps in the selected day and sorts them chronologically', () => {
  const latest = reading('2026-10-18T09:00:00.000Z');
  const earlier = reading('2026-10-17T11:00:00.000Z');
  const expired = reading('2026-10-17T09:00:00.000Z');
  const data = [latest, expired, earlier];

  assert.deepEqual(filterDataByTimePeriod(data, 'day', now), [earlier, latest]);
  assert.deepEqual(data, [latest, expired, earlier]);
});

test('applies the month and year windows to API timestamps', () => {
  const today = reading('2026-10-18T09:00:00.000Z');
  const lastWeek = reading('2026-10-11T09:00:00.000Z');
  const lastSeason = reading('2026-06-18T09:00:00.000Z');
  const expired = reading('2025-10-17T09:00:00.000Z');
  const data = [today, lastWeek, lastSeason, expired];

  assert.deepEqual(filterDataByTimePeriod(data, 'month', now), [lastWeek, today]);
  assert.deepEqual(filterDataByTimePeriod(data, 'year', now), [lastSeason, lastWeek, today]);
});

test('handles empty data and excludes invalid timestamps', () => {
  assert.deepEqual(filterDataByTimePeriod([], 'day', now), []);
  assert.deepEqual(filterDataByTimePeriod([reading('invalid')], 'day', now), []);
});
