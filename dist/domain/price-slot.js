function resolutionToMinutes(resolution) {
  return resolution === 'QUARTER_HOURLY' ? 15 : 60;
}

function resolveSlotValue(slot, mode) {
  if (mode === 'ENERGY' && typeof slot.energy === 'number') {
    return slot.energy;
  }

  if (typeof slot.total === 'number') {
    return slot.total;
  }

  if (typeof slot.energy === 'number' && typeof slot.tax === 'number') {
    return slot.energy + slot.tax;
  }

  throw new Error(`Slot enthaelt keinen verwertbaren Preis fuer ${slot.startsAt}`);
}

function normalizeSlots(slots, mode, resolution) {
  const durationMinutes = resolutionToMinutes(resolution);

  return [...slots]
    .map((slot) => ({
      ...slot,
      durationMinutes,
      value: resolveSlotValue(slot, mode),
      startsAtDate: new Date(slot.startsAt),
    }))
    .sort((left, right) => left.startsAtDate.getTime() - right.startsAtDate.getTime());
}

function findSlotForInstant(slots, instant) {
  const now = instant.getTime();

  for (const slot of slots) {
    const start = slot.startsAtDate.getTime();
    const end = start + slot.durationMinutes * 60_000;
    if (now >= start && now < end) {
      return slot;
    }
  }

  return null;
}

function calculateRelativePercent(slots, current) {
  const values = slots.map((slot) => slot.value);
  const max = Math.max(...values);

  if (max <= 0) {
    return 0;
  }

  return (current.value / max) * 100;
}

function calculateGaugePercent(slots, current) {
  const values = slots.map((slot) => slot.value);
  const min = Math.min(...values);
  const max = Math.max(...values);

  if (max === min) {
    return 0;
  }

  return ((current.value - min) / (max - min)) * 100;
}

function formatChartLabel(slot) {
  const hours = slot.startsAtDate.getHours().toString().padStart(2, '0');
  const minutes = slot.startsAtDate.getMinutes().toString().padStart(2, '0');
  return `${hours}:${minutes}`;
}

module.exports = {
  resolutionToMinutes,
  resolveSlotValue,
  normalizeSlots,
  findSlotForInstant,
  calculateRelativePercent,
  calculateGaugePercent,
  formatChartLabel,
};

