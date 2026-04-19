const path = require('node:path');
const { parseConfig } = require('../config/parseConfig.js');
const { QuickChartRenderer } = require('../charting/quick-chart.js');
const { TibberPriceClient } = require('../tibber/client.js');
const { CurrentPriceSensor } = require('./current-price-sensor.js');
const { RelativePriceSensor } = require('./relative-price-sensor.js');
const { PLATFORM_NAME, PLUGIN_NAME } = require('../settings.js');

class TibberPriceNextPlatform {
  constructor(log, config, api) {
    this.log = log;
    this.config = config;
    this.api = api;
    this.Service = this.api.hap.Service;
    this.Characteristic = this.api.hap.Characteristic;
    this.accessories = [];
    this.refreshables = [];

    try {
      this.parsedConfig = parseConfig(config);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.log.error(`Ungueltige Konfiguration: ${message}`);
      throw error;
    }

    this.priceClient = new TibberPriceClient(log, api.user.storagePath(), this.parsedConfig);
    this.chartRenderer = new QuickChartRenderer(this.resolveChartOutputFile());

    this.api.on('didFinishLaunching', () => {
      void this.bootstrap();
    });
  }

  configureAccessory(accessory) {
    this.accessories.push(accessory);
  }

  async bootstrap() {
    try {
      await this.priceClient.init();
      this.registerAccessories();
      this.startPolling();
      await this.runBackgroundRefresh();
    } catch (error) {
      this.log.error(`Bootstrap fehlgeschlagen: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  registerAccessories() {
    this.registerCurrentPriceSensor();
    this.registerRelativeSensor();
    this.registerGaugeSensor();
  }

  registerCurrentPriceSensor() {
    const uuid = this.api.hap.uuid.generate('tibber-price-next-current');

    if (this.parsedConfig.activatePriceSensor) {
      const accessory = this.ensureAccessory('Electricity price', uuid);
      this.refreshables.push(new CurrentPriceSensor(this, accessory));
    } else {
      this.unregisterAccessoryIfPresent(uuid);
    }
  }

  registerRelativeSensor() {
    const uuid = this.api.hap.uuid.generate('tibber-price-next-relative');

    if (this.parsedConfig.activateRelativePriceSensor) {
      const accessory = this.ensureAccessory('Relative electricity price', uuid);
      this.refreshables.push(new RelativePriceSensor(this, accessory, 'relative'));
    } else {
      this.unregisterAccessoryIfPresent(uuid);
    }
  }

  registerGaugeSensor() {
    const uuid = this.api.hap.uuid.generate('tibber-price-next-gauge');

    if (this.parsedConfig.activateGaugePriceSensor) {
      const accessory = this.ensureAccessory('Electricity price gauge', uuid);
      this.refreshables.push(new RelativePriceSensor(this, accessory, 'gauge'));
    } else {
      this.unregisterAccessoryIfPresent(uuid);
    }
  }

  ensureAccessory(name, uuid) {
    const existing = this.accessories.find((entry) => entry.UUID === uuid);
    if (existing) {
      return existing;
    }

    const accessory = new this.api.platformAccessory(name, uuid);
    this.accessories.push(accessory);
    this.api.registerPlatformAccessories(PLUGIN_NAME, PLATFORM_NAME, [accessory]);
    return accessory;
  }

  unregisterAccessory(accessory) {
    this.api.unregisterPlatformAccessories(PLUGIN_NAME, PLATFORM_NAME, [accessory]);
  }

  unregisterAccessoryIfPresent(uuid) {
    const accessory = this.accessories.find((entry) => entry.UUID === uuid);
    if (!accessory) {
      return;
    }

    this.unregisterAccessory(accessory);
  }

  startPolling() {
    setInterval(() => {
      void this.runBackgroundRefresh();
    }, this.parsedConfig.refreshIntervalSeconds * 1000);
  }

  async runBackgroundRefresh() {
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

  resolveChartOutputFile() {
    const configuredPath = this.parsedConfig.chartOutputFile;
    if (path.isAbsolute(configuredPath)) {
      return configuredPath;
    }

    return path.join(process.cwd(), configuredPath);
  }
}

module.exports = {
  TibberPriceNextPlatform,
};
