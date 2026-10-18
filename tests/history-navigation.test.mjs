import assert from 'node:assert/strict';
import { test } from 'node:test';
import { dateInputValue, periodKey, shiftPeriod, parsePeriodInput, formatPeriodTitle, chartPointsForPeriod } from '../src/components/temperature-data.ts';

test('serializes local dates rather than shifting them through UTC', () => {
  assert.equal(dateInputValue(new Date(2026, 9, 18, 0, 5)), '2026-10-18');
});

test('moves one calendar day across month, leap-year, and daylight-saving boundaries', () => {
  assert.equal(shiftPeriod('2026-03-01', 'day', -1), '2026-02-28');
  assert.equal(shiftPeriod('2024-03-01', 'day', -1), '2024-02-29');
  assert.equal(shiftPeriod('2026-03-29', 'day', 1), '2026-03-30');
});

test('moves whole months and years without overflowing the selected day', () => {
  assert.equal(shiftPeriod('2026-03-31', 'month', -1), '2026-02-01');
  assert.equal(shiftPeriod('2026-12-31', 'month', 1), '2027-01-01');
  assert.equal(shiftPeriod('2024-02-29', 'year', 1), '2025-01-01');
});

test('compares calendar periods rather than their reference day', () => {
  assert.equal(periodKey('2026-10-01', 'month'), periodKey('2026-10-18', 'month'));
  assert.equal(periodKey('2026-01-01', 'year'), periodKey('2026-10-18', 'year'));
});

test('parses each picker format and rejects invalid or future periods', () => {
  const today = '2026-10-18';
  assert.equal(parsePeriodInput('2026-10-17', 'day', today), '2026-10-17');
  assert.equal(parsePeriodInput('2026-10', 'month', today), '2026-10-01');
  assert.equal(parsePeriodInput('2026', 'year', today), '2026-01-01');
  for (const value of ['', 'bad', '2026-02-30', '2026-10-19']) {
    assert.equal(parsePeriodInput(value, 'day', today), null);
  }
  assert.equal(parsePeriodInput('2026-11', 'month', today), null);
  assert.equal(parsePeriodInput('2027', 'year', today), null);
});

test('formats selected periods for the German chart heading', () => {
  assert.equal(formatPeriodTitle('2026-10-17', 'day'), 'Samstag, 17. Oktober 2026');
  assert.equal(formatPeriodTitle('2026-10-01', 'month'), 'Oktober 2026');
  assert.equal(formatPeriodTitle('2026-01-01', 'year'), 'Jahr 2026');
});

test('never displays current data as history when an old backend ignores date', () => {
  const points = [{ date: new Date(2026, 9, 18, 12).toISOString(), solar: 20, pump: 60, security: 70 }];
  assert.deepEqual(chartPointsForPeriod(points, 'day', '2026-10-17'), []);
  assert.deepEqual(chartPointsForPeriod(points, 'day', '2026-10-18'), points);
  assert.deepEqual(chartPointsForPeriod([{ ...points[0], date: '2026-10-18' }], 'month', '2026-09-01'), []);
  assert.deepEqual(chartPointsForPeriod([{ ...points[0], date: '2026-10' }], 'year', '2025-01-01'), []);
});
