# Homebridge Tibber Price Next

Neuaufbau des bestehenden Plugins mit einer Architektur, die nicht mehr davon ausgeht, dass Tibber nur Stundenpreise liefert.

Dieses Repo ist auf die aktuelle Tibber-GraphQL-Antwort fuer `QUARTER_HOURLY` abgeglichen und fuer echte Homebridge-Installation vorbereitet.

## Ziele

- gleiche Kernfunktionen wie das Altprojekt abbilden
- Preis-Slots generisch behandeln, damit `HOURLY` und `QUARTER_HOURLY` moeglich sind
- API-Integration, Homebridge-Zubehoer und Charting sauber trennen
- spaetere Erweiterungen wie "beste Zeitfenster" oder Preisstufen leicht machen

## Laufzeitstatus

Das Repository ist als lauffaehiges Plugin vorbereitet:

- `package.json` zeigt auf [dist/index.js](/Users/volkercesinger/Downloads/homebridge-tibber-price-1.1.0/homebridge-tibber-price-next/dist/index.js)
- die auslieferbare Runtime liegt in `dist/` als CommonJS
- die TypeScript-Dateien unter `src/` bleiben die lesbare Quellbasis fuer die Weiterentwicklung
- `node --test test/*.test.cjs` laeuft lokal gruen fuer die Kernberechnungen

Solange wir hier keinen Paketmanager in der Umgebung haben, wird `dist/` bewusst mitversioniert.

## Installation

Lokale Entwicklung oder manueller Test in Homebridge:

```bash
git clone https://github.com/vcesinger/homebridge-tibber-price-next.git
cd homebridge-tibber-price-next
npm install
```

Falls du das Plugin lokal in eine bestehende Homebridge-Installation linken willst:

```bash
npm link
homebridge -D
```

Fuer eine spaetere Veroeffentlichung nach npm ist die Runtime bereits unter `dist/` enthalten.

## Enthaltene Funktionen

- aktueller Preis als Light Sensor
- relativer Preis als Humidity Sensor
- Gauge-Sensor von Tagestief bis Tageshoch
- PNG-Chart fuer heute und morgen
- Dateicache fuer Preis-Snapshots

## Architektur

- `src/tibber`: API-Client, Query-Aufbau und Caching
- `src/domain`: Preis-Slot-Modell und Berechnungen
- `src/homebridge`: Sensoren und Plattform-Glue
- `src/charting`: Rendern des PNG-Charts ueber QuickChart
- `src/config`: Parsing und Defaults fuer die Plugin-Konfiguration

## Tibber-Aufloesung

Das Reboot-Projekt behandelt Preise als generische Slots mit `startsAt` und `durationMinutes`.
Damit kann dieselbe Berechnungslogik sowohl mit Stunden- als auch mit Viertelstundenpreisen arbeiten.

Standardmaessig ist `QUARTER_HOURLY` konfiguriert.

Laut offizieller Tibber-Referenz laeuft das ueber `Subscription.priceInfo(resolution: QUARTER_HOURLY)`.
Die Referenz beschreibt ausserdem:

- `PriceInfoResolution`: `HOURLY`, `QUARTER_HOURLY`
- `priceInfo.today` und `priceInfo.tomorrow` als aktuelle Tageslisten
- `Subscription.priceInfoRange` als Nachfolger von `priceInfo.range`

Quelle:
- [Tibber GraphQL Schema Reference](https://developer.tibber.com/docs/reference)
- Direkt geladene Referenzdatei: [reference.md](https://developer.tibber.com/api/reference.md)

## Beispielkonfiguration

```json
{
  "platform": "HomebridgeTibberPriceNext",
  "accessToken": "TIBBER_TOKEN",
  "priceResolution": "QUARTER_HOURLY",
  "priceMode": "TOTAL",
  "activatePriceSensor": true,
  "activateRelativePriceSensor": true,
  "activateGaugePriceSensor": true,
  "activatePriceGraphing": true
}
```

Mit fest gesetzter `homeId`:

```json
{
  "platform": "HomebridgeTibberPriceNext",
  "accessToken": "TIBBER_TOKEN",
  "homeId": "4497ca6f-38d2-46c4-a83f-bf33c47e6c89",
  "priceResolution": "QUARTER_HOURLY",
  "priceMode": "TOTAL"
}
```

## Verifiziert

Gegen deine echte Tibber-Antwort ist bestaetigt:

- `priceInfo(resolution: QUARTER_HOURLY)` liefert 15-Minuten-Slots
- `today` enthaelt bei dir Viertelstundenwerte ueber den ganzen Tag
- `tomorrow` kann leer sein und wird vom Client toleriert
- `current` passt zum gleichen Slot-Modell wie `today`

Damit ist die Grundannahme des Reboots technisch bestaetigt.

## Offene Punkte

- fuer Publishing fehlen noch CI und erweiterte Integrationstests
- optional kann spaeter ein eigener Renderer statt QuickChart gebaut werden
