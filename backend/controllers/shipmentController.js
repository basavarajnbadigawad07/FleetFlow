const pool = require('../db');

function generateTrackingCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = 'FF-';
  for (let i = 0; i < 8; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

// Admin: create a shipment
async function createShipment(req, res) {
  try {
    const {
      origin_warehouse_id, destination_warehouse_id, destination_address,
      customer_name, customer_phone
    } = req.body;

    if (!origin_warehouse_id || !customer_name) {
      return res.status(400).json({ message: 'origin_warehouse_id and customer_name are required' });
    }

    const tracking_code = generateTrackingCode();

    const result = await pool.query(
      `INSERT INTO shipments
        (tracking_code, origin_warehouse_id, destination_warehouse_id, destination_address, customer_name, customer_phone)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [tracking_code, origin_warehouse_id, destination_warehouse_id || null, destination_address || null, customer_name, customer_phone || null]
    );

    const shipment = result.rows[0];

    // Log initial status
    await pool.query(
      `INSERT INTO delivery_updates (shipment_id, status, note) VALUES ($1, $2, $3)`,
      [shipment.id, 'pending', 'Shipment created']
    );

    res.status(201).json(shipment);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
}

// Admin: assign driver + vehicle to a shipment
async function assignShipment(req, res) {
  try {
    const { driver_id, vehicle_id } = req.body;
    const result = await pool.query(
      `UPDATE shipments SET driver_id = $1, vehicle_id = $2, status = 'assigned', updated_at = NOW()
       WHERE id = $3 RETURNING *`,
      [driver_id, vehicle_id, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ message: 'Shipment not found' });

    await pool.query(
      `INSERT INTO delivery_updates (shipment_id, status, note) VALUES ($1, $2, $3)`,
      [req.params.id, 'assigned', 'Driver and vehicle assigned']
    );

    // Mark driver as on_delivery
    await pool.query(`UPDATE drivers SET availability = 'on_delivery' WHERE id = $1`, [driver_id]);

    const io = req.app.get('io');
    io.emit('shipment_updated', result.rows[0]);

    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
}

// Driver or Admin: update shipment status
async function updateShipmentStatus(req, res) {
  try {
    const { status, lat, lng, note } = req.body;
    const validStatuses = ['pending', 'assigned', 'in_transit', 'delivered', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    const result = await pool.query(
      `UPDATE shipments SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING *`,
      [status, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ message: 'Shipment not found' });

    await pool.query(
      `INSERT INTO delivery_updates (shipment_id, status, lat, lng, note) VALUES ($1, $2, $3, $4, $5)`,
      [req.params.id, status, lat || null, lng || null, note || null]
    );

    // Free up the driver once delivered or cancelled
    if (status === 'delivered' || status === 'cancelled') {
      await pool.query(
        `UPDATE drivers SET availability = 'available' WHERE id = $1`,
        [result.rows[0].driver_id]
      );
    }

    const io = req.app.get('io');
    io.emit('shipment_updated', result.rows[0]);

    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
}

// Admin: get all shipments
async function getShipments(req, res) {
  try {
    const result = await pool.query(`
      SELECT s.*, w1.name as origin_name, w2.name as destination_name,
             u.name as driver_name, v.plate_number
      FROM shipments s
      LEFT JOIN warehouses w1 ON s.origin_warehouse_id = w1.id
      LEFT JOIN warehouses w2 ON s.destination_warehouse_id = w2.id
      LEFT JOIN drivers d ON s.driver_id = d.id
      LEFT JOIN users u ON d.user_id = u.id
      LEFT JOIN vehicles v ON s.vehicle_id = v.id
      ORDER BY s.created_at DESC
    `);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
}

// Driver: get own assigned shipments
async function getMyShipments(req, res) {
  try {
    const result = await pool.query(`
      SELECT s.* FROM shipments s
      JOIN drivers d ON s.driver_id = d.id
      WHERE d.user_id = $1 AND s.status IN ('assigned', 'in_transit')
      ORDER BY s.created_at DESC
    `, [req.user.id]);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
}

// Public: track by tracking code (no auth)
async function trackShipment(req, res) {
  try {
    const result = await pool.query(
      `SELECT s.tracking_code, s.status, s.customer_name, s.created_at, s.updated_at,
              w1.name as origin_name, w2.name as destination_name, s.destination_address
       FROM shipments s
       LEFT JOIN warehouses w1 ON s.origin_warehouse_id = w1.id
       LEFT JOIN warehouses w2 ON s.destination_warehouse_id = w2.id
       WHERE s.tracking_code = $1`,
      [req.params.code]
    );
    if (result.rows.length === 0) return res.status(404).json({ message: 'Shipment not found' });

    const updates = await pool.query(
      `SELECT status, lat, lng, note, created_at FROM delivery_updates
       WHERE shipment_id = (SELECT id FROM shipments WHERE tracking_code = $1)
       ORDER BY created_at ASC`,
      [req.params.code]
    );

    res.json({ shipment: result.rows[0], history: updates.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
}

module.exports = {
  createShipment, assignShipment, updateShipmentStatus,
  getShipments, getMyShipments, trackShipment
};