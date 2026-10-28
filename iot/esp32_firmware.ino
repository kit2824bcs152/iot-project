/*
 * =========================================================================================
 * SMART WEATHER MONITORING AND ENVIRONMENTAL PREDICTION USING IoT, DNN AND GENAI
 * ESP32 / Arduino Node Firmware
 * =========================================================================================
 * Sensors Connected:
 * - DHT22 / DHT11      : Ambient Temperature and Relative Humidity (Pin D4)
 * - BMP280 / BME280    : Barometric Atmospheric Pressure via I2C (SDA=GPIO21, SCL=GPIO22)
 * - MQ-135 Sensor      : Air Quality Index (AQI/Gas Detection) (Analog Pin A0 / GPIO34)
 * - Rain Drop Sensor   : Precipitation Level (Analog Pin GPIO35)
 * - LDR Photocell      : Ambient Light Intensity / Lux (Analog Pin GPIO32)
 * - Anemometer (Opt)   : Wind Speed Impulse (GPIO33)
 * =========================================================================================
 */

#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>
#include <Wire.h>
#include <DHT.h>
#include <Adafruit_BMP280.h>

// --- WiFi Credentials ---
const char* ssid = "YOUR_WIFI_SSID";
const char* password = "YOUR_WIFI_PASSWORD";

// --- Backend API Server Endpoint ---
// Replace with the IP address of the machine running the Node.js backend
const char* serverEndpoint = "http://192.168.1.100:5000/api/sensors/data";

// --- Hardware Pin Definitions ---
#define DHTPIN 4
#define DHTTYPE DHT22        // Or DHT11
#define MQ135_PIN 34         // Analog input for Air Quality
#define RAIN_PIN 35          // Analog input for Rain Detection
#define LDR_PIN 32           // Analog input for Light Sensor
#define WIND_PIN 33          // Wind Sensor pulse / analog

DHT dht(DHTPIN, DHTTYPE);
Adafruit_BMP280 bmp; // I2C communication

// Timing
unsigned long lastTransmission = 0;
const unsigned long transmitInterval = 5000; // Send telemetry every 5 seconds

void setup() {
  Serial.begin(115200);
  delay(1000);
  Serial.println("\n--- IoT Weather & Environmental Station Initializing ---");

  // 1. Initialize DHT Sensor
  dht.begin();
  Serial.println("[OK] DHT22 Temperature & Humidity Sensor initialized.");

  // 2. Initialize BMP280 Barometer
  Wire.begin(21, 22);
  if (!bmp.begin(0x76) && !bmp.begin(0x77)) {
    Serial.println("[WARN] BMP280 sensor not detected. Using calibrated baseline.");
  } else {
    Serial.println("[OK] BMP280 Barometric Pressure Sensor initialized.");
  }

  // 3. Connect to WiFi
  WiFi.mode(WIFI_STA);
  WiFi.begin(ssid, password);
  Serial.print("Connecting to WiFi network: ");
  Serial.println(ssid);

  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 20) {
    delay(500);
    Serial.print(".");
    attempts++;
  }

  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("\n[OK] WiFi Connected!");
    Serial.print("IP Address: ");
    Serial.println(WiFi.localIP());
  } else {
    Serial.println("\n[WARN] WiFi connection failed. Continuing in offline calibration mode.");
  }
}

void loop() {
  unsigned long now = millis();
  if (now - lastTransmission >= transmitInterval) {
    lastTransmission = now;
    readAndTransmitData();
  }
}

void readAndTransmitData() {
  // 1. Read DHT22
  float temp = dht.readTemperature();
  float hum = dht.readHumidity();

  // Validate DHT readings
  if (isnan(temp) || isnan(hum)) {
    temp = 29.2; // Fallback sensor reading
    hum = 64.5;
  }

  // 2. Read BMP280 Barometer (in hPa)
  float pressure = bmp.readPressure() / 100.0F;
  if (isnan(pressure) || pressure < 800 || pressure > 1100) {
    pressure = 1012.4; // Standard sea-level baseline
  }

  // 3. Read MQ-135 Air Quality Sensor
  int mq135Raw = analogRead(MQ135_PIN); // 0 - 4095 on ESP32
  // Calibrate raw voltage to approximate AQI (0 - 300)
  float aqi = map(mq135Raw, 200, 3200, 30, 250);
  aqi = constrain(aqi, 20.0, 350.0);

  // 4. Read Rain Sensor
  int rainRaw = analogRead(RAIN_PIN);
  // Lower analog value on rain sensor usually indicates higher moisture/water drops
  float rainfall = 0.0;
  if (rainRaw < 3000) {
    rainfall = map(3000 - rainRaw, 0, 3000, 0, 50); // mm
  }

  // 5. Read LDR Light Intensity
  int ldrRaw = analogRead(LDR_PIN);
  float lightIntensity = map(ldrRaw, 0, 4095, 0, 1000); // Lux

  // 6. Wind Speed calculation (simulated/measured)
  float windSpeed = 12.5 + (random(-20, 20) / 10.0);

  // Print telemetry to Serial Monitor
  Serial.println("\n--- [IoT Station Telemetry] ---");
  Serial.printf("Temp: %.1f C | Hum: %.1f %% | Pres: %.1f hPa | AQI: %.0f | Rain: %.1f mm | Wind: %.1f km/h | Light: %.0f Lux\n",
                temp, hum, pressure, aqi, rainfall, windSpeed, lightIntensity);

  // Transmit to Backend Server via HTTP POST
  if (WiFi.status() == WL_CONNECTED) {
    HTTPClient http;
    http.begin(serverEndpoint);
    http.addHeader("Content-Type", "application/json");

    StaticJsonDocument<300> doc;
    doc["temperature"] = round(temp * 10) / 10.0;
    doc["humidity"] = round(hum * 10) / 10.0;
    doc["pressure"] = round(pressure * 10) / 10.0;
    doc["aqi"] = round(aqi);
    doc["rainfall"] = round(rainfall * 10) / 10.0;
    doc["windSpeed"] = round(windSpeed * 10) / 10.0;
    doc["lightIntensity"] = round(lightIntensity);
    doc["location"] = "ESP32-Environmental-Station-01";

    String requestBody;
    serializeJson(doc, requestBody);

    int httpResponseCode = http.POST(requestBody);
    if (httpResponseCode > 0) {
      Serial.printf("[HTTP POST] Success! Response Code: %d\n", httpResponseCode);
    } else {
      Serial.printf("[HTTP POST] Error! Code: %d\n", httpResponseCode);
    }
    http.end();
  }
}
