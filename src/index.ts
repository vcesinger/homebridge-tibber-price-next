import { API } from 'homebridge';
import { PLATFORM_NAME } from './settings';
import { TibberPriceNextPlatform } from './homebridge/platform';

export = (api: API) => {
  api.registerPlatform(PLATFORM_NAME, TibberPriceNextPlatform);
};

