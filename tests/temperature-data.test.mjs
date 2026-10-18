import assert from 'node:assert/strict';
import { test } from 'node:test';
import { formatChartLabel, normalizeChartData } from '../src/components/temperature-data.ts';

const reading = (timestamp) => ({ solar: 27, pump: 60, security: 70, rel: 0, timestamp });
const averages = { avg_solar: '30.1757', avg_pump: '55.1458', avg_security: '68.9604', avg_rel: '0.0271' };

test('maps daily API readings to chronologically sorted chart points without mutating the response', () => {
  const latest = reading('2026-10-18T09:00:00.000Z');
  const earlier = reading('2026-10-18T01:00:00.000Z');
  const data = [latest, earlier];

  assert.deepEqual(normalizeChartData(data), [
    { date: earlier.timestamp, solar: 27, pump: 60, security: 70 },
    { date: latest.timestamp, solar: 27, pump: 60, security: 70 },
  ]);
  assert.deepEqual(data, [latest, earlier]);
});

test('maps monthly daily averages and converts SQL decimal strings to numbers', () => {
  assert.deepEqual(normalizeChartData([{ date: '2026-10-01', ...averages }]), [
    { date: '2026-10-01', solar: 30.1757, pump: 55.1458, security: 68.9604 },
  ]);
});

test('maps yearly monthly averages without discarding the first month', () => {
  assert.deepEqual(normalizeChartData([
    { month: '2026-10', ...averages },
    { month: '2026-09', ...averages },
  ]), [
    { date: '2026-09', solar: 30.1757, pump: 55.1458, security: 68.9604 },
    { date: '2026-10', solar: 30.1757, pump: 55.1458, security: 68.9604 },
  ]);
});

test('formats daily labels as local 24-hour time without seconds', () => {
  assert.equal(formatChartLabel(new Date(2026, 9, 18, 12, 2, 19).toISOString(), 'day'), '12:02');
  assert.equal(formatChartLabel(new Date(2026, 9, 18, 0, 5).toISOString(), 'day'), '00:05');
});

test('preserves month and year labels', () => {
  assert.equal(formatChartLabel('2026-10-18', 'month'), '2026-10-18');
  assert.equal(formatChartLabel('2026-10', 'year'), '2026-10');
});

test('handles an empty range', () => {
  assert.deepEqual(normalizeChartData([]), []);
});
