const {
  calculateGaugePercent,
  calculateRelativePercent,
} = require('../domain/price-slot.js');
const { AccessoryBase } = require('./accessory-base.js');

class RelativePriceSensor extends AccessoryBase {
  constructor(platform, accessory, mode) {
    super(platform, accessory);
    this.mode = mode;

    this.service = this.getOrAddService(
      () => this.accessory.getService(this.platform.Service.HumiditySensor) ?? undefined,
      () => this.accessory.addService(this.platform.Service.HumiditySensor),
    );

    this.service.getCharacteristic(this.platform.Characteristic.CurrentRelativeHumidity)
      .onGet(async () => {
        try {
          return await this.calculate();
        } catch (error) {
          throw this.toHapError(error);
        }
      });
  }

  async refresh() {
    this.service.updateCharacteristic(
      this.platform.Characteristic.CurrentRelativeHumidity,
      await this.calculate(),
    );
  }

  async calculate() {
    const [todaySlots, current] = await Promise.all([
      this.platform.priceClient.getTodaySlots(),
      this.platform.priceClient.getCurrentSlot(),
    ]);

    return this.mode === 'gauge'
      ? calculateGaugePercent(todaySlots, current)
      : calculateRelativePercent(todaySlots, current);
  }
}

module.exports = {
  RelativePriceSensor,
};

