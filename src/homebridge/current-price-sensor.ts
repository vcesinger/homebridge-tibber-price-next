import { PlatformAccessory, Service } from 'homebridge';
import { AccessoryBase } from './accessory-base';
import { TibberPriceNextPlatform } from './platform';

export class CurrentPriceSensor extends AccessoryBase {
  private readonly service: Service;

  constructor(platform: TibberPriceNextPlatform, accessory: PlatformAccessory) {
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

  async refresh(): Promise<void> {
    const current = await this.platform.priceClient.getCurrentSlot();
    this.service.updateCharacteristic(
      this.platform.Characteristic.CurrentAmbientLightLevel,
      this.toLightLevel(current.value),
    );
  }

  private toLightLevel(priceValue: number): number {
    return Math.max(0.0001, priceValue * 100);
  }
}
