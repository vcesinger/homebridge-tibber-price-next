import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { PriceTimeline } from '../domain/price-slot';

interface PersistedTimeline {
  fetchedAt: string;
  timeline: PriceTimeline;
}

export class PriceCacheStore {
  constructor(private readonly basePath: string) {}

  async ensureReady(): Promise<void> {
    await mkdir(this.basePath, { recursive: true });
  }

  async read(key: string): Promise<PriceTimeline | null> {
    try {
      const filePath = this.toFilePath(key);
      const raw = await readFile(filePath, 'utf8');
      const parsed = JSON.parse(raw) as PersistedTimeline;
      return parsed.timeline;
    } catch {
      return null;
    }
  }

  async write(key: string, timeline: PriceTimeline): Promise<void> {
    const filePath = this.toFilePath(key);
    const payload: PersistedTimeline = {
      fetchedAt: new Date().toISOString(),
      timeline,
    };

    await writeFile(filePath, JSON.stringify(payload, null, 2), 'utf8');
  }

  private toFilePath(key: string): string {
    return path.join(this.basePath, `${key}.json`);
  }
}

