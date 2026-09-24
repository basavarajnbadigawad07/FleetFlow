require('dotenv').config();
const express = require('express');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
const pool = require('./db');

const app = express();
app.use(cors());
app.use(express.json());

const authRoutes = require('./routes/authRoutes');
app.use('/api/auth', authRoutes);

const vehicleRoutes = require('./routes/vehicleRoutes');
app.use('/api/vehicles', vehicleRoutes);

const driverRoutes = require('./routes/driverRoutes');
app.use('/api/drivers', driverRoutes);

const warehouseRoutes = require('./routes/warehouseRoutes');
app.use('/api/warehouses', warehouseRoutes);

const shipmentRoutes = require('./routes/shipmentRoutes');
app.use('/api/shipments', shipmentRoutes);

const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: '*' }
});

app.set('io', io);

// Health check
app.get('/api/health', async (req, res) => {
  try {
    const result = await pool.query('SELECT NOW()');
    res.json({ status: 'ok', dbTime: result.rows[0].now });
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
});

io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);
  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

const PORT = process.env.PORT || 5002;
server.listen(PORT, () => {
  console.log(`FleetFlow backend running on port ${PORT}`);
});