import axios from 'axios';
import { io } from 'socket.io-client';

const API_BASE_URL = 'http://localhost:5000/api';

const client = axios.create({
  baseURL: API_BASE_URL,
  timeout: 8000,
});

// Socket.io singleton connection
let socketInstance = null;

export const getSocket = () => {
  if (!socketInstance) {
    socketInstance = io('http://localhost:5000', {
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 10,
      reconnectionDelay: 2000,
    });
  }
  return socketInstance;
};

// API calls
export const getLatestSensorData = async () => {
  const res = await client.get('/sensors/latest');
  return res.data;
};

export const getSensorHistory = async (limit = 35) => {
  const res = await client.get(`/sensors/history?limit=${limit}`);
  return res.data;
};

export const getCurrentPrediction = async () => {
  const res = await client.get('/predictions/current');
  return res.data;
};

export const getPredictionHistory = async (limit = 15) => {
  const res = await client.get(`/predictions/history?limit=${limit}`);
  return res.data;
};

export const getModelMetrics = async () => {
  const res = await client.get('/predictions/metrics');
  return res.data;
};

export const getAIInsights = async () => {
  const res = await client.get('/ai/insights');
  return res.data;
};

export const getActiveAlerts = async () => {
  const res = await client.get('/alerts/active');
  return res.data;
};

export const getAllAlerts = async (limit = 30) => {
  const res = await client.get(`/alerts/all?limit=${limit}`);
  return res.data;
};

export const acknowledgeAlert = async (id) => {
  const res = await client.put(`/alerts/${id}/acknowledge`);
  return res.data;
};

export const clearAlerts = async () => {
  const res = await client.post('/alerts/clear');
  return res.data;
};

export const getSimulatorStatus = async () => {
  const res = await client.get('/sensors/simulator/status');
  return res.data;
};

export const setSimulatorScenario = async (scenario) => {
  const res = await client.post('/sensors/simulator/scenario', { scenario });
  return res.data;
};

export const toggleSimulator = async (running) => {
  const res = await client.post('/sensors/simulator/toggle', { running });
  return res.data;
};

export const getSystemHealth = async () => {
  const res = await axios.get('http://localhost:5000/api/health');
  return res.data;
};
