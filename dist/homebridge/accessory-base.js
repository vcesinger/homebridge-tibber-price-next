class AccessoryBase {
  constructor(platform, accessory) {
    this.platform = platform;
    this.accessory = accessory;

    this.accessory.getService(this.platform.Service.AccessoryInformation)
      .setCharacteristic(this.platform.Characteristic.Manufacturer, 'Volker Cesinger')
      .setCharacteristic(this.platform.Characteristic.Model, 'Tibber Price Next')
      .setCharacteristic(this.platform.Characteristic.SerialNumber, '0.1.0');
  }

  toHapError(error) {
    this.platform.log.error(this.describeError(error));
    return new this.platform.api.hap.HapStatusError(-70402);
  }

  describeError(error) {
    return error instanceof Error ? error.message : String(error);
  }

  getOrAddService(getter, factory) {
    return getter() ?? factory();
  }
}

module.exports = {
  AccessoryBase,
};
