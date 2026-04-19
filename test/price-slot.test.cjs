const test = require('node:test');
const assert = require('node:assert/strict');
const {
  calculateGaugePercent,
  calculateRelativePercent,
  findSlotForInstant,
  normalizeSlots,
  resolutionToMinutes,
} = require('../dist/domain/price-slot.js');

test('resolutionToMinutes maps quarter-hourly correctly', () => {
  assert.equal(resolutionToMinutes('QUARTER_HOURLY'), 15);
  assert.equal(resolutionToMinutes('HOURLY'), 60);
});

test('findSlotForInstant resolves quarter-hour slot boundaries', () => {
  const slots = normalizeSlots([
    { startsAt: '2026-04-19T10:00:00+02:00', total: 0.20 },
    { startsAt: '2026-04-19T10:15:00+02:00', total: 0.30 },
  ], 'TOTAL', 'QUARTER_HOURLY');

  const current = findSlotForInstant(slots, new Date('2026-04-19T10:20:00+02:00'));
  assert.ok(current);
  assert.equal(current.value, 0.30);
});

test('relative and gauge percentages stay stable', () => {
  const slots = normalizeSlots([
    { startsAt: '2026-04-19T00:00:00+02:00', total: 0.10 },
    { startsAt: '2026-04-19T00:15:00+02:00', total: 0.20 },
    { startsAt: '2026-04-19T00:30:00+02:00', total: 0.40 },
  ], 'TOTAL', 'QUARTER_HOURLY');

  const current = slots[1];
  assert.equal(calculateRelativePercent(slots, current), 50);
  assert.equal(calculateGaugePercent(slots, current), 33.33333333333333);
});

