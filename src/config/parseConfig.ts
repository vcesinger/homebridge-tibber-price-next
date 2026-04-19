import { PlatformConfig } from 'homebridge';
import { PluginConfig, TibberPriceMode, TibberPriceResolution } from './types.ts';

const DEFAULT_CONFIG: Omit<PluginConfig, 'accessToken' | 'homeId'> = {
  priceMode: 'TOTAL',
  priceResolution: 'QUARTER_HOURLY',
  activatePriceSensor: true,
  activateRelativePriceSensor: true,
  activateGaugePriceSensor: true,
  activatePriceGraphing: true,
  chartOutputFile: '.homebridge/tibber-price-next/price-chart.png',
  refreshIntervalSeconds: 60,
};

function toResolution(value: unknown): TibberPriceResolution {
  return value === 'HOURLY' ? 'HOURLY' : 'QUARTER_HOURLY';
}

function toPriceMode(value: unknown): TibberPriceMode {
  return value === 'ENERGY' ? 'ENERGY' : 'TOTAL';
}

export function parseConfig(config: PlatformConfig): PluginConfig {
  const accessToken = typeof config['accessToken'] === 'string' ? config['accessToken'].trim() : '';

  if (!accessToken) {
    throw new Error('accessToken ist erforderlich');
  }

  return {
    accessToken,
    homeId: typeof config['homeId'] === 'string' && config['homeId'].trim()
      ? config['homeId'].trim()
      : undefined,
    priceMode: toPriceMode(config['priceMode']),
    priceResolution: toResolution(config['priceResolution']),
    activatePriceSensor: config['activatePriceSensor'] ?? DEFAULT_CONFIG.activatePriceSensor,
    activateRelativePriceSensor: config['activateRelativePriceSensor'] ?? DEFAULT_CONFIG.activateRelativePriceSensor,
    activateGaugePriceSensor: config['activateGaugePriceSensor'] ?? DEFAULT_CONFIG.activateGaugePriceSensor,
    activatePriceGraphing: config['activatePriceGraphing'] ?? DEFAULT_CONFIG.activatePriceGraphing,
    chartOutputFile: typeof config['chartOutputFile'] === 'string' && config['chartOutputFile'].trim()
      ? config['chartOutputFile'].trim()
      : DEFAULT_CONFIG.chartOutputFile,
    refreshIntervalSeconds: typeof config['refreshIntervalSeconds'] === 'number' && config['refreshIntervalSeconds'] >= 15
      ? config['refreshIntervalSeconds']
      : DEFAULT_CONFIG.refreshIntervalSeconds,
  };
}
