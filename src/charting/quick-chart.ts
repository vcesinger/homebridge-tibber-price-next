import { dirname } from 'node:path';
import { mkdir, writeFile } from 'node:fs/promises';
import { ValuedPriceSlot, formatChartLabel } from '../domain/price-slot.ts';

export class QuickChartRenderer {
  constructor(private readonly outputFile: string) {}

  async render(today: ValuedPriceSlot[], tomorrow: ValuedPriceSlot[]): Promise<void> {
    await mkdir(dirname(this.outputFile), { recursive: true });

    const chartDefinition = {
      type: 'line',
      data: {
        labels: today.map((slot) => formatChartLabel(slot)),
        datasets: [
          {
            label: 'Today',
            data: today.map((slot) => slot.value),
            borderColor: '#c2410c',
            borderWidth: 3,
            fill: false,
          },
          ...(tomorrow.length ? [{
            label: 'Tomorrow',
            data: tomorrow.map((slot) => slot.value),
            borderColor: '#0284c7',
            borderWidth: 2,
            fill: false,
          }] : []),
        ],
      },
      options: {
        responsive: true,
        plugins: {
          legend: {
            display: true,
          },
        },
      },
    };

    const response = await fetch('https://quickchart.io/chart', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      signal: AbortSignal.timeout(20_000),
      body: JSON.stringify({
        width: 1280,
        height: 720,
        backgroundColor: 'white',
        format: 'png',
        chart: chartDefinition,
      }),
    });

    if (!response.ok) {
      throw new Error(`QuickChart Fehler ${response.status}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    await writeFile(this.outputFile, Buffer.from(arrayBuffer));
  }
}
