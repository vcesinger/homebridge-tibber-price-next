const path = require('node:path');
const {
  findSlotForInstant,
  normalizeSlots,
} = require('../domain/price-slot.js');
const { PriceCacheStore } = require('./cache-store.js');
const { buildVariables, PRICE_QUERY } = require('./query.js');

class TibberPriceClient {
  constructor(log, storagePath, config) {
    this.log = log;
    this.storagePath = storagePath;
    this.config = config;
    this.endpoint = 'https://api.tibber.com/v1-beta/gql';
    this.memoryCache = new Map();
    this.fileCache = new PriceCacheStore(path.join(storagePath, 'tibber-price-next'));
    this.homeId = undefined;
  }

  async init() {
    await this.fileCache.ensureReady();
  }

  async getTimeline(now = new Date()) {
    const cacheKey = this.buildCacheKey(now);
    const fromMemory = this.memoryCache.get(cacheKey);
    if (fromMemory && this.timelineHasCurrentCoverage(fromMemory, now)) {
      return fromMemory;
    }

    const fromFile = await this.fileCache.read(cacheKey);
    if (fromFile && this.timelineHasCurrentCoverage(fromFile, now)) {
      this.memoryCache.set(cacheKey, fromFile);
      return fromFile;
    }

    const fromApi = await this.fetchTimeline();
    this.memoryCache.set(cacheKey, fromApi);
    await this.fileCache.write(cacheKey, fromApi);
    return fromApi;
  }

  async getCurrentSlot(now = new Date()) {
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

  async getTodaySlots(now = new Date()) {
    const timeline = await this.getTimeline(now);
    return normalizeSlots(timeline.today, this.config.priceMode, this.config.priceResolution);
  }

  async getTomorrowSlots(now = new Date()) {
    const timeline = await this.getTimeline(now);
    return normalizeSlots(timeline.tomorrow, this.config.priceMode, this.config.priceResolution);
  }

  buildCacheKey(now) {
    const day = [
      now.getFullYear(),
      `${now.getMonth() + 1}`.padStart(2, '0'),
      `${now.getDate()}`.padStart(2, '0'),
    ].join('-');

    return `${day}-${this.config.priceResolution}`;
  }

  async fetchTimeline() {
    const response = await fetch(this.endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.config.accessToken}`,
        'User-Agent': 'homebridge-tibber-price-next/0.1.0',
      },
      signal: AbortSignal.timeout(20_000),
      body: JSON.stringify({
        query: PRICE_QUERY,
        variables: buildVariables(this.config.priceResolution),
      }),
    });

    if (!response.ok) {
      const body = await response.text().catch(() => '');
      throw new Error(`Tibber API Fehler ${response.status}${body ? `: ${body}` : ''}`);
    }

    const body = await response.json();
    if (body.errors?.length) {
      throw new Error(body.errors.map((entry) => entry.message ?? 'Unbekannter Tibber Fehler').join('; '));
    }

    const homes = body.data?.viewer?.homes ?? [];
    const home = this.pickHome(homes);
    const priceInfo = home.currentSubscription?.priceInfo;

    if (!priceInfo) {
      throw new Error(`Tibber priceInfo fehlt in der Antwort${home.currentSubscription?.status ? ` (subscription status: ${home.currentSubscription.status})` : ''}`);
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

  pickHome(homes) {
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

  timelineHasCurrentCoverage(timeline, now) {
    if (timeline.current) {
      return true;
    }

    const today = normalizeSlots(timeline.today, this.config.priceMode, this.config.priceResolution);
    return findSlotForInstant(today, now) !== null;
  }
}

module.exports = {
  TibberPriceClient,
};

