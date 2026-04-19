# Homebridge Tibber Price Next

Neuaufbau des bestehenden Plugins mit einer Architektur, die nicht mehr davon ausgeht, dass Tibber nur Stundenpreise liefert.

## Ziele

- gleiche Kernfunktionen wie das Altprojekt abbilden
- Preis-Slots generisch behandeln, damit `HOURLY` und `QUARTER_HOURLY` moeglich sind
- API-Integration, Homebridge-Zubehoer und Charting sauber trennen
- spaetere Erweiterungen wie "beste Zeitfenster" oder Preisstufen leicht machen

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

## Offene Punkte

- die exakte Tibber-GraphQL-Antwort sollte einmal live gegen einen echten Token verifiziert werden
- fuer Publishing fehlen noch CI, Tests und Paket-Metadaten
- optional kann spaeter ein eigener Renderer statt QuickChart gebaut werden
