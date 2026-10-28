# SMART WEATHER MONITORING AND ENVIRONMENTAL PREDICTION USING IoT, DNN AND GENAI

A production-grade, full-stack Environmental Intelligence and Weather Monitoring Platform developed with **IoT Sensor Ingestion**, a **TensorFlow/Keras Deep Neural Network (DNN)** for predictive forecasting, and a **Generative AI (GenAI)** narrative engine for automated risk analysis and operational recommendations.

Designed for college final-year engineering projects, research prototypes, and real-world environmental testbeds.

---

## 🌟 Key System Capabilities

1. **Real-Time IoT Sensor Ingestion & Dual Mode Operation**
   - Direct REST API input for physical **ESP32 / Arduino** microcontrollers with DHT22, BMP280, MQ-135, FC-37 Rain, and LDR sensors.
   - Built-in **Physics-Correlated IoT Simulator** generating continuous real-time readings every 3 seconds with smooth Markov drift (not random noise).
   - Interactive Scenario Switcher: **Normal Baseline**, **Heatwave (>40°C)**, **Severe Storm (<985 hPa)**, **Hazardous AQI (>160)**, and **Rainy Front (18mm)**.

2. **Multilayer Deep Neural Network (DNN) Predictor**
   - Implemented in **Python 3.11 with TensorFlow / Keras 3.x**.
   - Input Layer (7 Features: Temp, Humidity, Pressure, AQI, Rain, Wind, Light)
   - Dense(128, ReLU) → Dropout(0.2) → Dense(64, ReLU) → Dropout(0.2) → Dense(32, ReLU) → Output(4, Linear).
   - Generates +1 Hour predictive forecasts for **Future Temperature**, **Future Humidity**, **Future Pressure**, and **Future AQI**.
   - Validated on 5,000 continuous time-series records with metrics: **MAE, MSE, RMSE, and R² scores**.

3. **Generative AI Environmental Analysis & Advisory**
   - Powered by Google Gemini (`@google/generative-ai` / `gemini-1.5-flash`) with dynamic physics-contextual fallback.
   - Synthesizes comprehensive reports:
     - **Real-Time Condition Summary**
     - **DNN Predictive Trajectory Interpretation**
     - **Environmental Risk Hazard Assessment (Heat Index, Moisture, AQI, Storms)**
     - **Actionable Safeguards & Operational Directives**
     - **60-Minute Future Outlook**

4. **Intelligent Alert & Threshold Engine**
   - High Temperature Alert (`> 40°C`)
   - High Humidity Alert (`> 85%`)
   - Poor / Hazardous Air Quality Alert (`> 150 AQI` / `> 200 AQI`)
   - Barometric Pressure Anomaly & Depression (`< 985 hPa` / `> 1035 hPa`)
   - Heavy Precipitation Alert (`> 25 mm`)
   - High Wind Gale Warning (`> 40 km/h`)
   - Stored in MongoDB with severity levels (`critical`, `warning`, `info`) and interactive acknowledgment.

5. **Executive Dark-Mode Dashboard (React 18 + Vite)**
   - Cyber-meteorology glassmorphism UI with Outfit, Inter, and JetBrains Mono fonts.
   - 6 Key Summary Cards with status badges, icons, and real-time deltas.
   - Live Biometeorological gauges computing **Dew Point** and **Heat Index (Feels Like)**.
   - Dynamic **Recharts** visualizations with Actual vs DNN Predicted trajectory comparison.
   - Zero-latency WebSocket synchronization via **Socket.IO**.

---

## 🏛️ System Architecture

```
[ PHYSICAL HARDWARE ]              [ IOT SIMULATOR ]
 ESP32 + DHT22 + BMP280              Correlated Random Walk Engine
 + MQ135 + Rain + LDR                (Normal, Heatwave, Storm, etc.)
         |                                         |
         +--------------------+--------------------+
                              | HTTP POST / WebSocket
                              v
                +----------------------------+
                |    Node.js + Express API   | :5000
                +----------------------------+
                     |         |          |
         Persist /   |         | Predict  | Synthesize
         Query       |         |          |
                     v         v          v
          +------------+  +---------+  +-------------------+
          |  MongoDB   |  | Python  |  |  Generative AI    |
          |  Database  |  | DNN ML  |  |  Gemini 1.5 Flash |
          |  :27017    |  | :5001   |  |  Service          |
          +------------+  +---------+  +-------------------+
                     ^         ^          ^
                     |         |          |
                     +---------+----------+
                               | REST & Socket.io
                               v
                +----------------------------+
                |   React 18 + Vite Web UI   | :3000
                |  (Dashboard & Visualizer)  |
                +----------------------------+
```

---

## 📂 Project Structure

```
iot-project/
├── backend/
│   ├── config/
│   │   └── db.js                 # MongoDB connection & fallback handler
│   ├── controllers/
│   │   ├── sensorController.js   # Sensor ingest, latest, history, simulator control
│   │   ├── predictionController.js # Triggers DNN inference & stores in DB
│   │   ├── aiController.js       # GenAI insights, environmental risk report
│   │   └── alertController.js    # Alert threshold checks, acknowledge, resolve
│   ├── models/
│   │   ├── SensorData.js         # Mongoose schema for SensorData
│   │   ├── Prediction.js         # Mongoose schema for DNN predictions
│   │   └── Alert.js              # Mongoose schema for threshold alerts
│   ├── routes/
│   │   ├── sensorRoutes.js       # /api/sensors endpoints
│   │   ├── predictionRoutes.js   # /api/predictions endpoints
│   │   ├── aiRoutes.js           # /api/ai endpoints
│   │   └── alertRoutes.js        # /api/alerts endpoints
│   ├── services/
│   │   ├── simulator.js          # Realistic continuous IoT simulator with presets
│   │   ├── alertEngine.js        # Rule engine checking thresholds & rate limiting
│   │   ├── dnnClient.js          # Bridge to Python ML microservice
│   │   └── genaiService.js       # Google Gemini integration & narrative generator
│   ├── .env                      # Server configuration
│   ├── package.json
│   └── server.js                 # Express server with REST APIs & Socket.IO
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Header.jsx        # Branding, live clock, IoT status, sync
│   │   │   ├── SimulationControls.jsx # Weather preset pills (Heatwave, Storm, etc.)
│   │   │   ├── SummaryCards.jsx  # 6 Metric cards with trends, status, and units
│   │   │   ├── LiveGaugeSection.jsx # Dew point, Feels-like, Solar Lux gauges
│   │   │   ├── SensorCharts.jsx  # Recharts multi-metric & Actual vs Predicted
│   │   │   ├── PredictionCard.jsx # DNN forecast, neural architecture & R2 scores
│   │   │   ├── GenAIReport.jsx   # AI Weather summary, hazards & recommendations
│   │   │   ├── AlertsPanel.jsx   # Live alerts with acknowledge actions
│   │   │   └── HardwareGuideModal.jsx # ESP32 pinout table & wiring schematic
│   │   ├── services/
│   │   │   └── api.js            # Axios client & Socket.IO singleton
│   │   ├── styles/
│   │   │   └── App.css           # Premium cyber-meteorology styling
│   │   ├── App.jsx               # Master dashboard application
│   │   └── main.jsx
│   ├── index.html
│   ├── package.json
│   └── vite.config.js
│
├── ml/
│   ├── dataset/
│   │   ├── generate_dataset.py   # Synthesizes 5,000 continuous diurnal records
│   │   └── weather_data.csv      # Generated training time-series dataset
│   ├── model/
│   │   ├── weather_dnn.keras     # Trained TensorFlow/Keras DNN model
│   │   ├── weather_dnn.h5        # HDF5 model artifact
│   │   ├── scaler_X.pkl          # Input feature scaler
│   │   ├── scaler_y.pkl          # Target variable scaler
│   │   └── metrics.json          # Evaluation metrics (MAE, MSE, RMSE, R2)
│   ├── preprocessing.py          # Data scaling, train/test split, windowing
│   ├── train_model.py            # Complete training pipeline with early stopping
│   ├── predict.py                # Standalone prediction module & CLI test
│   ├── app.py                    # Flask microservice on port 5001
│   └── requirements.txt
│
└── iot/
    ├── esp32_firmware.ino        # Full Arduino C++ firmware for ESP32 + 5 sensors
    └── circuit_diagram.md        # Hardware wiring guide & pinout connection table
```

---

## 🚀 Step-by-Step Setup & Running Guide

### 1. Prerequisites
- **Node.js**: v18+ (tested on v24)
- **Python**: 3.10+ (tested on Python 3.11)
- **MongoDB**: Installed and running locally on port 27017

---

### 2. Machine Learning Service (Port 5001)

Open a terminal in the project directory:

```bash
# Navigate to ML directory and activate virtual environment
cd ml

# (Optional: If recreating venv)
python -m venv venv
venv\Scripts\activate          # On Windows
# source venv/bin/activate     # On Linux / Mac

# Install ML dependencies
pip install -r requirements.txt

# Generate the 5,000 sample diurnal training dataset
python dataset/generate_dataset.py

# Train the Deep Neural Network
python train_model.py

# Start the Flask DNN Microservice
python app.py
```
> The ML microservice will be available at: `http://127.0.0.1:5001`

---

### 3. Backend API Server (Port 5000)

Open a second terminal:

```bash
# Navigate to backend directory
cd backend

# Install dependencies
npm install

# Start Express & IoT Simulator
npm start
```
> The REST API & WebSocket server will be active at: `http://localhost:5000`

---

### 4. React Dashboard (Port 3000)

Open a third terminal:

```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Start Vite dev server
npm run dev
```
> Open your browser and navigate to: **`http://localhost:3000`**

---

## 📊 Deep Neural Network Model Performance

The model was trained on 5,000 time-series observations using an **Adam optimizer (lr=0.001)** and **EarlyStopping**:

| Target Variable | MAE (Mean Abs Error) | RMSE | R² Score | Convergence |
|---|---|---|---|---|
| **Temperature (°C)** | **1.291 °C** | **1.597 °C** | **0.9311** | Optimal |
| **Relative Humidity (%)** | **3.330 %** | **4.109 %** | **0.8670** | Optimal |
| **Barometric Pressure (hPa)** | **1.320 hPa** | **1.660 hPa** | **0.8582** | Optimal |
| **Air Quality (AQI)** | **6.361 AQI** | **8.060 AQI** | **0.8477** | Optimal |

---

## 📡 REST API Reference

| Endpoint | Method | Description |
|---|---|---|
| `/api/health` | `GET` | System health, database counts, and simulator status |
| `/api/sensors/data` | `POST` | Ingests telemetry from physical ESP32 or simulator |
| `/api/sensors/latest` | `GET` | Returns most recent live environmental reading |
| `/api/sensors/history?limit=35` | `GET` | Returns chronological telemetry for charts |
| `/api/sensors/simulator/scenario`| `POST` | Switches weather scenario (`NORMAL`, `HEATWAVE`, `STORM`, etc.) |
| `/api/sensors/simulator/toggle` | `POST` | Starts or pauses continuous simulation |
| `/api/predictions/current` | `GET` | Executes DNN inference and returns +1 hr forecast |
| `/api/predictions/metrics` | `GET` | Returns DNN validation metrics (MAE, RMSE, R²) |
| `/api/ai/insights` | `GET` | Generates GenAI environmental narrative & hazards |
| `/api/alerts/active` | `GET` | Returns currently triggered environmental alerts |
| `/api/alerts/:id/acknowledge` | `PUT` | Marks a specific alert as acknowledged |
| `/api/alerts/clear` | `POST` | Resolves all active alerts |

---

## 🔌 ESP32 Hardware Integration

The system accepts real hardware sensor inputs via `HTTP POST /api/sensors/data`.
Check `iot/circuit_diagram.md` and `iot/esp32_firmware.ino` for the full wiring diagram, resistor values, and ESP32 pin configuration.
