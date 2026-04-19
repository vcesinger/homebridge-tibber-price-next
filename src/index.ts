import { API } from 'homebridge';
import { PLATFORM_NAME } from './settings.ts';
import { TibberPriceNextPlatform } from './homebridge/platform.ts';

export = (api: API) => {
  api.registerPlatform(PLATFORM_NAME, TibberPriceNextPlatform);
};
