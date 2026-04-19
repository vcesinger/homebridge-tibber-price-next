import { HAPStatus, PlatformAccessory, Service } from 'homebridge';
import { TibberPriceNextPlatform } from './platform.ts';

export abstract class AccessoryBase {
  protected constructor(
    protected readonly platform: TibberPriceNextPlatform,
    protected readonly accessory: PlatformAccessory,
  ) {
    this.accessory.getService(this.platform.Service.AccessoryInformation)!
      .setCharacteristic(this.platform.Characteristic.Manufacturer, 'volkercesinger/codex-reboot')
      .setCharacteristic(this.platform.Characteristic.Model, 'Tibber Price Next')
      .setCharacteristic(this.platform.Characteristic.SerialNumber, '0.1.0');
  }

  protected toHapError(error: unknown): Error {
    this.platform.log.error(this.describeError(error));
    return new this.platform.api.hap.HapStatusError(HAPStatus.SERVICE_COMMUNICATION_FAILURE);
  }

  protected describeError(error: unknown): string {
    return error instanceof Error ? error.message : String(error);
  }

  protected getOrAddService<T extends Service>(getter: () => T | undefined, factory: () => T): T {
    return getter() ?? factory();
  }

  abstract refresh(): Promise<void>;
}
