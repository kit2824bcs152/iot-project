require('dotenv').config();
const http = require('http');
const express = require('express');
const cors = require('cors');
const { Server } = require('socket.io');

const connectDB = require('./config/db');
const SensorData = require('./models/SensorData');
const Prediction = require('./models/Prediction');
const Alert = require('./models/Alert');
const simulator = require('./services/simulator');

// Route imports
const sensorRoutes = require('./routes/sensorRoutes');
const predictionRoutes = require('./routes/predictionRoutes');
const aiRoutes = require('./routes/aiRoutes');
const alertRoutes = require('./routes/alertRoutes');

const app = express();
const server = http.createServer(app);

// Setup Socket.IO for real-time sensor updates
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
  },
});

app.set('io', io);
simulator.setSocketIO(io);

// Middleware
app.use(cors());
app.use(express.json());

// Request logging in dev
app.use((req, res, next) => {
  if (!req.url.startsWith('/api/sensors/latest')) {
    console.log(`[HTTP] ${req.method} ${req.url}`);
  }
  next();
});

// API Routes
app.use('/api/sensors', sensorRoutes);
app.use('/api/predictions', predictionRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/alerts', alertRoutes);

// System Health & Diagnostics Endpoint
app.get('/api/health', async (req, res) => {
  const sensorCount = await SensorData.countDocuments().catch(() => 0);
  const predictionCount = await Prediction.countDocuments().catch(() => 0);
  const activeAlerts = await Alert.countDocuments({ status: 'active' }).catch(() => 0);

  return res.json({
    status: 'ONLINE',
    system: 'Smart Weather Monitoring and Environmental Prediction Using IoT, DNN & GenAI',
    timestamp: new Date(),
    database: {
      sensorsRecorded: sensorCount,
      predictionsMade: predictionCount,
      activeAlertsCount: activeAlerts,
    },
    simulator: simulator.getStatus(),
  });
});

// Socket.io Connection
io.on('connection', (socket) => {
  console.log(`[Socket.io] Client connected: ${socket.id}`);
  socket.on('disconnect', () => {
    // Client disconnected
  });
});

// Seed initial history if DB has fewer than 20 readings
async function seedInitialDataIfNeeded() {
  try {
    const count = await SensorData.countDocuments();
    if (count < 20) {
      console.log(`[DB] Seeding initial historical records (${count} found)...`);
      const now = Date.now();
      const seedBatch = [];
      for (let i = 25; i >= 1; i--) {
        const t = new Date(now - i * 60 * 1000); // 1-minute intervals backwards
        const temp = 27.5 + Math.sin(i / 3) * 3.5 + (Math.random() - 0.5) * 0.5;
        const hum = 68 - (temp - 27.5) * 2.2 + (Math.random() - 0.5) * 1.5;
        const press = 1012 + Math.cos(i / 4) * 2.5;
        const aqi = 55 + Math.sin(i / 2) * 18 + (Math.random() - 0.5) * 4;
        const rain = i === 12 || i === 13 ? 4.5 : 0;
        const wind = 12 + Math.random() * 8;
        const light = 500 + Math.sin(i / 5) * 300;

        seedBatch.push({
          temperature: Number(temp.toFixed(2)),
          humidity: Number(Math.max(30, Math.min(95, hum)).toFixed(2)),
          pressure: Number(press.toFixed(2)),
          aqi: Number(Math.max(20, Math.min(250, aqi)).toFixed(1)),
          rainfall: Number(rain.toFixed(2)),
          windSpeed: Number(wind.toFixed(2)),
          lightIntensity: Math.round(light),
          location: 'IoT-Station-01 (Environmental Lab)',
          timestamp: t,
        });
      }
      await SensorData.insertMany(seedBatch);
      console.log(`[DB] Successfully seeded ${seedBatch.length} historical records.`);
    }
  } catch (err) {
    console.warn('[DB] Seeding note:', err.message);
  }
}

// Start Server
const PORT = process.env.PORT || 5000;

connectDB().then(async () => {
  await seedInitialDataIfNeeded();

  server.listen(PORT, () => {
    console.log(`=======================================================`);
    console.log(`🚀 IoT Weather & Environmental DNN API Server Running`);
    console.log(`🌐 REST API: http://localhost:${PORT}`);
    console.log(`📡 WebSocket: ws://localhost:${PORT}`);
    console.log(`=======================================================`);

    // Automatically start IoT Sensor Simulator
    simulator.start(3000);
  });
});
