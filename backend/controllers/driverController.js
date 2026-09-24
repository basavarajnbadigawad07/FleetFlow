const pool = require('../db');
const redisClient = require('../redisClient');

// Admin: list all drivers with their user info + vehicle
async function getDrivers(req, res) {
  try {
    const result = await pool.query(`
      SELECT d.id, d.availability, d.license_number, d.current_lat, d.current_lng,
             u.id as user_id, u.name, u.email, u.phone,
             v.id as vehicle_id, v.plate_number, v.type as vehicle_type
      FROM drivers d
      JOIN users u ON d.user_id = u.id
      LEFT JOIN vehicles v ON d.vehicle_id = v.id
      ORDER BY d.id
    `);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
}

// Admin: assign a vehicle to a driver
async function assignVehicle(req, res) {
  try {
    const { vehicle_id } = req.body;
    const result = await pool.query(
      `UPDATE drivers SET vehicle_id = $1 WHERE id = $2 RETURNING *`,
      [vehicle_id, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ message: 'Driver not found' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
}

// Driver: update own availability
async function updateAvailability(req, res) {
  try {
    const { availability } = req.body;
    if (!['available', 'on_delivery', 'off_duty'].includes(availability)) {
      return res.status(400).json({ message: 'Invalid availability value' });
    }
    const result = await pool.query(
      `UPDATE drivers SET availability = $1 WHERE user_id = $2 RETURNING *`,
      [availability, req.user.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ message: 'Driver profile not found' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
}

// Driver: update own location (used for live tracking pings)
async function updateLocation(req, res) {
  try {
    const { lat, lng } = req.body;
    const result = await pool.query(
      `UPDATE drivers SET current_lat = $1, current_lng = $2 WHERE user_id = $3 RETURNING *`,
      [lat, lng, req.user.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ message: 'Driver profile not found' });

    const driver = result.rows[0];

    // Cache latest location in Redis (fast reads for dashboard, avoids hammering Postgres)
    await redisClient.set(
      `driver:${driver.id}:location`,
      JSON.stringify({ lat, lng, updatedAt: new Date().toISOString() })
    );

    // Emit live location to admin dashboard via socket
    const io = req.app.get('io');
    io.emit('driver_location_update', { driverId: driver.id, lat, lng });

    res.json(driver);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
}

// Admin: get all drivers' latest cached locations from Redis
async function getLiveLocations(req, res) {
  try {
    const keys = await redisClient.keys('driver:*:location');
    const locations = {};
    for (const key of keys) {
      const driverId = key.split(':')[1];
      const data = await redisClient.get(key);
      locations[driverId] = JSON.parse(data);
    }
    res.json(locations);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
}

module.exports = { getDrivers, assignVehicle, updateAvailability, updateLocation, getLiveLocations };