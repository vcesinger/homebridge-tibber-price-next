import { TibberPriceMode, TibberPriceResolution } from '../config/types';

export interface PriceSlot {
  startsAt: string;
  total: number;
  energy?: number;
  tax?: number;
  currency?: string;
  level?: string;
}

export interface PriceTimeline {
  resolution: TibberPriceResolution;
  current: PriceSlot | null;
  today: PriceSlot[];
  tomorrow: PriceSlot[];
}

export interface ValuedPriceSlot extends PriceSlot {
  durationMinutes: number;
  value: number;
  startsAtDate: Date;
}

export function resolutionToMinutes(resolution: TibberPriceResolution): number {
  return resolution === 'QUARTER_HOURLY' ? 15 : 60;
}

export function resolveSlotValue(slot: PriceSlot, mode: TibberPriceMode): number {
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

export function normalizeSlots(slots: PriceSlot[], mode: TibberPriceMode, resolution: TibberPriceResolution): ValuedPriceSlot[] {
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

export function findSlotForInstant(slots: ValuedPriceSlot[], instant: Date): ValuedPriceSlot | null {
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

export function calculateRelativePercent(slots: ValuedPriceSlot[], current: ValuedPriceSlot): number {
  const values = slots.map((slot) => slot.value);
  const max = Math.max(...values);

  if (max <= 0) {
    return 0;
  }

  return (current.value / max) * 100;
}

export function calculateGaugePercent(slots: ValuedPriceSlot[], current: ValuedPriceSlot): number {
  const values = slots.map((slot) => slot.value);
  const min = Math.min(...values);
  const max = Math.max(...values);

  if (max === min) {
    return 0;
  }

  return ((current.value - min) / (max - min)) * 100;
}

export function formatChartLabel(slot: ValuedPriceSlot): string {
  const hours = slot.startsAtDate.getHours().toString().padStart(2, '0');
  const minutes = slot.startsAtDate.getMinutes().toString().padStart(2, '0');
  return `${hours}:${minutes}`;
}

