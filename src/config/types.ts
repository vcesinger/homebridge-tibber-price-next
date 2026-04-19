export type TibberPriceResolution = 'HOURLY' | 'QUARTER_HOURLY';
export type TibberPriceMode = 'TOTAL' | 'ENERGY';

export interface PluginConfig {
  accessToken: string;
  homeId?: string;
  priceMode: TibberPriceMode;
  priceResolution: TibberPriceResolution;
  activatePriceSensor: boolean;
  activateRelativePriceSensor: boolean;
  activateGaugePriceSensor: boolean;
  activatePriceGraphing: boolean;
  chartOutputFile: string;
  refreshIntervalSeconds: number;
}

