const { AccessoryBase } = require('./accessory-base.js');

class CurrentPriceSensor extends AccessoryBase {
  constructor(platform, accessory) {
    super(platform, accessory);

    this.service = this.getOrAddService(
      () => this.accessory.getService(this.platform.Service.LightSensor) ?? undefined,
      () => this.accessory.addService(this.platform.Service.LightSensor),
    );

    this.service.getCharacteristic(this.platform.Characteristic.CurrentAmbientLightLevel)
      .onGet(async () => {
        try {
          const current = await this.platform.priceClient.getCurrentSlot();
          return this.toLightLevel(current.value);
        } catch (error) {
          throw this.toHapError(error);
        }
      });
  }

  async refresh() {
    const current = await this.platform.priceClient.getCurrentSlot();
    this.service.updateCharacteristic(
      this.platform.Characteristic.CurrentAmbientLightLevel,
      this.toLightLevel(current.value),
    );
  }

  toLightLevel(priceValue) {
    return Math.max(0.0001, priceValue * 100);
  }
}

module.exports = {
  CurrentPriceSensor,
};

