const { dirname } = require('node:path');
const { mkdir, writeFile } = require('node:fs/promises');
const { formatChartLabel } = require('../domain/price-slot.js');

class QuickChartRenderer {
  constructor(outputFile) {
    this.outputFile = outputFile;
  }

  async render(today, tomorrow) {
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

module.exports = {
  QuickChartRenderer,
};

