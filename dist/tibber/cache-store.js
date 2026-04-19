const { mkdir, readFile, writeFile } = require('node:fs/promises');
const path = require('node:path');

class PriceCacheStore {
  constructor(basePath) {
    this.basePath = basePath;
  }

  async ensureReady() {
    await mkdir(this.basePath, { recursive: true });
  }

  async read(key) {
    try {
      const filePath = this.toFilePath(key);
      const raw = await readFile(filePath, 'utf8');
      const parsed = JSON.parse(raw);
      return parsed.timeline;
    } catch {
      return null;
    }
  }

  async write(key, timeline) {
    const filePath = this.toFilePath(key);
    const payload = {
      fetchedAt: new Date().toISOString(),
      timeline,
    };

    await writeFile(filePath, JSON.stringify(payload, null, 2), 'utf8');
  }

  toFilePath(key) {
    return path.join(this.basePath, `${key}.json`);
  }
}

module.exports = {
  PriceCacheStore,
};

