import { PlatformAccessory, Service } from 'homebridge';
import { calculateGaugePercent, calculateRelativePercent } from '../domain/price-slot';
import { AccessoryBase } from './accessory-base';
import { TibberPriceNextPlatform } from './platform';

export class RelativePriceSensor extends AccessoryBase {
  private readonly service: Service;

  constructor(
    platform: TibberPriceNextPlatform,
    accessory: PlatformAccessory,
    private readonly mode: 'relative' | 'gauge',
  ) {
    super(platform, accessory);

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

  async refresh(): Promise<void> {
    this.service.updateCharacteristic(
      this.platform.Characteristic.CurrentRelativeHumidity,
      await this.calculate(),
    );
  }

  private async calculate(): Promise<number> {
    const [todaySlots, current] = await Promise.all([
      this.platform.priceClient.getTodaySlots(),
      this.platform.priceClient.getCurrentSlot(),
    ]);

    return this.mode === 'gauge'
      ? calculateGaugePercent(todaySlots, current)
      : calculateRelativePercent(todaySlots, current);
  }
}

