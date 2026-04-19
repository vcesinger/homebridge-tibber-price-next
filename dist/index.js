const { PLATFORM_NAME } = require('./settings.js');
const { TibberPriceNextPlatform } = require('./homebridge/platform.js');

module.exports = (api) => {
  api.registerPlatform(PLATFORM_NAME, TibberPriceNextPlatform);
};

