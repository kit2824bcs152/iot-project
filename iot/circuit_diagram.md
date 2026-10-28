# IoT Hardware Circuit & Pinout Guide

## Project: Smart Weather Monitoring and Environmental Prediction Using IoT, DNN & GenAI

This guide details the physical hardware integration using ESP32, Arduino, and environmental sensors.

---

### Hardware Bill of Materials (BOM)

| Component | Sensor Model | Interface | Operating Voltage | Function |
|---|---|---|---|---|
| **Microcontroller** | ESP32-WROOM-32 | WiFi / BLE / Dual Core | 3.3V / 5V USB | Telemetry collection, HTTP client, WiFi stack |
| **Temp & Humidity** | DHT22 (AM2302) | Single-bus Digital | 3.3V – 5.0V | High accuracy ambient temperature (-40~80°C) and relative humidity (0~100%) |
| **Barometric Pressure** | BMP280 / BME280 | I2C (SDA/SCL) | 3.3V | High precision atmospheric pressure (300~1100 hPa) & elevation estimation |
| **Air Quality** | MQ-135 Gas Sensor | Analog (A0) | 5.0V | Detects NH3, NOx, Alcohol, Benzene, Smoke, CO2 for AQI calculation |
| **Rainfall Detection** | FC-37 Rain Drop Sensor | Analog (A0) + Comparator | 3.3V – 5.0V | Detects precipitation volume and surface moisture |
| **Light Sensor** | LDR Photoresistor (5528) | Analog with 10kΩ divider | 3.3V | Measures ambient daylight intensity in Lux |
| **Power Supply** | 5V 2A Adapter / Li-ion Battery | Micro-USB or Vin | 5V DC | Stable power supply for ESP32 and gas heating element |

---

### ESP32 Pin Connection Table

| Sensor Pin | ESP32 Pin | Description |
|---|---|---|
| **DHT22 DATA** | GPIO 4 (D4) | 1-Wire Digital Signal (with 4.7k pull-up resistor to 3.3V) |
| **DHT22 VCC** | 3.3V | Power supply |
| **DHT22 GND** | GND | Ground reference |
| **BMP280 SDA** | GPIO 21 | I2C Serial Data |
| **BMP280 SCL** | GPIO 22 | I2C Serial Clock |
| **BMP280 VCC** | 3.3V | Power supply |
| **BMP280 GND** | GND | Ground reference |
| **MQ-135 AOUT** | GPIO 34 (ADC1_CH6)| Analog output for Air Quality Index (0 - 4095) |
| **MQ-135 VCC** | 5V (Vin) | Heater coil requires 5V supply |
| **MQ-135 GND** | GND | Ground reference |
| **Rain Sensor AOUT**| GPIO 35 (ADC1_CH7)| Analog output (inverted: lower value = more water) |
| **Rain Sensor VCC**| 3.3V | Power supply |
| **Rain Sensor GND**| GND | Ground reference |
| **LDR Pin 1** | 3.3V | Voltage rail |
| **LDR Pin 2** | GPIO 32 (ADC1_CH4)| Analog voltage divider (with 10kΩ resistor to GND) |

---

### Circuit Wiring Schematic (ASCII Diagram)

```
        +-----------------------------------------------+
        |                  ESP32 DEVKIT                 |
        |                                               |
        | 3.3V  -----------------+--------+------+      |
        | GND   ---+---------+---|----+---|----+ |      |
        | Vin   ---|-----+   |   |    |   |    | |      |
        |          |     |   |   |    |   |    | |      |
        | GPIO21 --|-----|---|---|----|---|-SDA| | (I2C)|
        | GPIO22 --|-----|---|---|----|---|-SCL| |      |
        | GPIO4  --|-----|---|---|-DATA   |    | |      |
        | GPIO34 --|-----|-AOUT  |        |    | |      |
        | GPIO35 --|-----|-------|--AOUT  |    | |      |
        | GPIO32 --|-AOUT|       |        |    | |      |
        +----------|-----|-------|--------|----+--------+
                   |     |       |        |    |
                   |     |       |        |    +--> BMP280 Barometer (3.3V, GND, SDA, SCL)
                   |     |       |        +-------> DHT22 Temp/Humidity (3.3V, GND, GPIO4)
                   |     |       +----------------> Rain Sensor (3.3V, GND, GPIO35)
                   |     +------------------------> MQ-135 Air Quality (5V, GND, GPIO34)
                   +------------------------------> LDR Light Divider (3.3V, 10k Resistor, GPIO32)
```

---

### Telemetry Payload Format

The ESP32 sends a `HTTP POST` request to `http://<BACKEND_HOST>:5000/api/sensors/data`:

```json
{
  "temperature": 29.4,
  "humidity": 63.8,
  "pressure": 1012.2,
  "aqi": 68.0,
  "rainfall": 0.0,
  "windSpeed": 14.5,
  "lightIntensity": 720,
  "location": "ESP32-Environmental-Station-01"
}
```
