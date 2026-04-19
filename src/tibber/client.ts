import path from 'node:path';
import { Logger } from 'homebridge';
import { PluginConfig } from '../config/types';
import { findSlotForInstant, normalizeSlots, PriceSlot, PriceTimeline, ValuedPriceSlot } from '../domain/price-slot';
import { PriceCacheStore } from './cache-store';
import { buildVariables, PRICE_QUERY } from './query';

interface TibberGraphQlResponse {
  data?: {
    viewer?: {
      homes?: Array<{
        id: string;
        currentSubscription?: {
          status?: string;
          priceInfo?: {
            current?: PriceSlot | null;
            today?: PriceSlot[];
            tomorrow?: PriceSlot[];
          };
        };
      }>;
    };
  };
  errors?: Array<{ message?: string }>;
}

export class TibberPriceClient {
  private readonly endpoint = 'https://api.tibber.com/v1-beta/gql';
  private readonly memoryCache = new Map<string, PriceTimeline>();
  private readonly fileCache: PriceCacheStore;
  private homeId?: string;

  constructor(
    private readonly log: Logger,
    private readonly storagePath: string,
    private readonly config: PluginConfig,
  ) {
    this.fileCache = new PriceCacheStore(path.join(storagePath, 'tibber-price-next'));
  }

  async init(): Promise<void> {
    await this.fileCache.ensureReady();
  }

  async getTimeline(now: Date = new Date()): Promise<PriceTimeline> {
    const cacheKey = this.buildCacheKey(now);
    const fromMemory = this.memoryCache.get(cacheKey);
    if (fromMemory) {
      return fromMemory;
    }

    const fromFile = await this.fileCache.read(cacheKey);
    if (fromFile) {
      this.memoryCache.set(cacheKey, fromFile);
      return fromFile;
    }

    const fromApi = await this.fetchTimeline();
    this.memoryCache.set(cacheKey, fromApi);
    await this.fileCache.write(cacheKey, fromApi);
    return fromApi;
  }

  async getCurrentSlot(now: Date = new Date()): Promise<ValuedPriceSlot> {
    const timeline = await this.getTimeline(now);
    const slots = normalizeSlots(timeline.today, this.config.priceMode, this.config.priceResolution);
    const current = findSlotForInstant(slots, now);

    if (current) {
      return current;
    }

    if (timeline.current) {
      const [fallback] = normalizeSlots([timeline.current], this.config.priceMode, this.config.priceResolution);
      return fallback;
    }

    throw new Error('Kein aktueller Preis-Slot verfuegbar');
  }

  async getTodaySlots(now: Date = new Date()): Promise<ValuedPriceSlot[]> {
    const timeline = await this.getTimeline(now);
    return normalizeSlots(timeline.today, this.config.priceMode, this.config.priceResolution);
  }

  async getTomorrowSlots(now: Date = new Date()): Promise<ValuedPriceSlot[]> {
    const timeline = await this.getTimeline(now);
    return normalizeSlots(timeline.tomorrow, this.config.priceMode, this.config.priceResolution);
  }

  private buildCacheKey(now: Date): string {
    const day = now.toISOString().slice(0, 10);
    return `${day}-${this.config.priceResolution}`;
  }

  private async fetchTimeline(): Promise<PriceTimeline> {
    const response = await fetch(this.endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.config.accessToken}`,
        'User-Agent': 'homebridge-tibber-price-next/0.1.0',
      },
      body: JSON.stringify({
        query: PRICE_QUERY,
        variables: buildVariables(this.config.priceResolution),
      }),
    });

    if (!response.ok) {
      throw new Error(`Tibber API Fehler ${response.status}`);
    }

    const body = await response.json() as TibberGraphQlResponse;
    if (body.errors?.length) {
      throw new Error(body.errors.map((entry) => entry.message ?? 'Unbekannter Tibber Fehler').join('; '));
    }

    const homes = body.data?.viewer?.homes ?? [];
    const home = this.pickHome(homes);
    const priceInfo = home.currentSubscription?.priceInfo;

    if (!priceInfo) {
      throw new Error('Tibber priceInfo fehlt in der Antwort');
    }

    this.homeId = home.id;
    this.log.debug(`Tibber home resolved to ${home.id}`);

    return {
      resolution: this.config.priceResolution,
      current: priceInfo.current ?? null,
      today: priceInfo.today ?? [],
      tomorrow: priceInfo.tomorrow ?? [],
    };
  }

  private pickHome(homes: Array<{ id: string; currentSubscription?: { priceInfo?: unknown } }>): { id: string; currentSubscription?: { priceInfo?: unknown } } {
    if (!homes.length) {
      throw new Error('Tibber hat keine Homes zurueckgeliefert');
    }

    const desiredId = this.config.homeId ?? this.homeId;
    if (!desiredId) {
      return homes[0];
    }

    const home = homes.find((entry) => entry.id === desiredId);
    if (!home) {
      throw new Error(`Home ${desiredId} wurde in Tibber nicht gefunden`);
    }

    return home;
  }
}
