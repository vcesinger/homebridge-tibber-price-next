import {
  API,
  Characteristic,
  DynamicPlatformPlugin,
  Logger,
  PlatformAccessory,
  PlatformConfig,
  Service,
} from 'homebridge';
import path from 'node:path';
import { parseConfig } from '../config/parseConfig';
import { PluginConfig } from '../config/types';
import { QuickChartRenderer } from '../charting/quick-chart';
import { TibberPriceClient } from '../tibber/client';
import { CurrentPriceSensor } from './current-price-sensor';
import { RelativePriceSensor } from './relative-price-sensor';
import { PLATFORM_NAME, PLUGIN_NAME } from '../settings';

interface Refreshable {
  refresh(): Promise<void>;
}

export class TibberPriceNextPlatform implements DynamicPlatformPlugin {
  public readonly Service: typeof Service = this.api.hap.Service;
  public readonly Characteristic: typeof Characteristic = this.api.hap.Characteristic;
  public readonly accessories: PlatformAccessory[] = [];
  public readonly refreshables: Refreshable[] = [];
  public readonly parsedConfig: PluginConfig;
  public readonly priceClient: TibberPriceClient;
  private readonly chartRenderer: QuickChartRenderer;

  constructor(
    public readonly log: Logger,
    public readonly config: PlatformConfig,
    public readonly api: API,
  ) {
    this.parsedConfig = parseConfig(config);
    this.priceClient = new TibberPriceClient(log, api.user.storagePath(), this.parsedConfig);
    this.chartRenderer = new QuickChartRenderer(this.resolveChartOutputFile());

    this.api.on('didFinishLaunching', () => {
      void this.bootstrap();
    });
  }

  configureAccessory(accessory: PlatformAccessory): void {
    this.accessories.push(accessory);
  }

  private async bootstrap(): Promise<void> {
    await this.priceClient.init();
    this.registerAccessories();
    this.startPolling();
    await this.runBackgroundRefresh();
  }

  private registerAccessories(): void {
    this.registerCurrentPriceSensor();
    this.registerRelativeSensor();
    this.registerGaugeSensor();
  }

  private registerCurrentPriceSensor(): void {
    const uuid = this.api.hap.uuid.generate('tibber-price-next-current');

    if (this.parsedConfig.activatePriceSensor) {
      const accessory = this.ensureAccessory('Electricity price', uuid);
      this.refreshables.push(new CurrentPriceSensor(this, accessory));
    } else {
      this.unregisterAccessoryIfPresent(uuid);
    }
  }

  private registerRelativeSensor(): void {
    const uuid = this.api.hap.uuid.generate('tibber-price-next-relative');

    if (this.parsedConfig.activateRelativePriceSensor) {
      const accessory = this.ensureAccessory('Relative electricity price', uuid);
      this.refreshables.push(new RelativePriceSensor(this, accessory, 'relative'));
    } else {
      this.unregisterAccessoryIfPresent(uuid);
    }
  }

  private registerGaugeSensor(): void {
    const uuid = this.api.hap.uuid.generate('tibber-price-next-gauge');

    if (this.parsedConfig.activateGaugePriceSensor) {
      const accessory = this.ensureAccessory('Electricity price gauge', uuid);
      this.refreshables.push(new RelativePriceSensor(this, accessory, 'gauge'));
    } else {
      this.unregisterAccessoryIfPresent(uuid);
    }
  }

  private ensureAccessory(name: string, uuid: string): PlatformAccessory {
    const existing = this.accessories.find((entry) => entry.UUID === uuid);
    if (existing) {
      return existing;
    }

    const accessory = new this.api.platformAccessory(name, uuid);
    this.accessories.push(accessory);
    this.api.registerPlatformAccessories(PLUGIN_NAME, PLATFORM_NAME, [accessory]);
    return accessory;
  }

  private unregisterAccessory(accessory: PlatformAccessory): void {
    this.api.unregisterPlatformAccessories(PLUGIN_NAME, PLATFORM_NAME, [accessory]);
  }

  private unregisterAccessoryIfPresent(uuid: string): void {
    const accessory = this.accessories.find((entry) => entry.UUID === uuid);
    if (!accessory) {
      return;
    }

    this.unregisterAccessory(accessory);
  }

  private startPolling(): void {
    setInterval(() => {
      void this.runBackgroundRefresh();
    }, this.parsedConfig.refreshIntervalSeconds * 1000);
  }

  private async runBackgroundRefresh(): Promise<void> {
    for (const refreshable of this.refreshables) {
      try {
        await refreshable.refresh();
      } catch (error) {
        this.log.error(error instanceof Error ? error.message : String(error));
      }
    }

    if (this.parsedConfig.activatePriceGraphing) {
      try {
        const [today, tomorrow] = await Promise.all([
          this.priceClient.getTodaySlots(),
          this.priceClient.getTomorrowSlots(),
        ]);
        await this.chartRenderer.render(today, tomorrow);
      } catch (error) {
        this.log.error(`Chart konnte nicht erzeugt werden: ${error instanceof Error ? error.message : String(error)}`);
      }
    }
  }

  private resolveChartOutputFile(): string {
    const configuredPath = this.parsedConfig.chartOutputFile;
    if (path.isAbsolute(configuredPath)) {
      return configuredPath;
    }

    return path.join(process.cwd(), configuredPath);
  }
}
