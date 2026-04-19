import { existsSync } from 'node:fs';

const requiredFiles = [
  'dist/index.js',
  'dist/homebridge/platform.js',
  'dist/tibber/client.js',
  'config.schema.json',
];

for (const file of requiredFiles) {
  if (!existsSync(new URL(`../${file}`, import.meta.url))) {
    throw new Error(`Required runtime file is missing: ${file}`);
  }
}

console.log('Runtime files are present.');
