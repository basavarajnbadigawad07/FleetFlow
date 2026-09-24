const pool = require('../db');

async function createVehicle(req, res) {
  try {
    const { plate_number, type, capacity_kg } = req.body;
    if (!plate_number || !type) {
      return res.status(400).json({ message: 'plate_number and type are required' });
    }
    const result = await pool.query(
      `INSERT INTO vehicles (plate_number, type, capacity_kg) VALUES ($1, $2, $3) RETURNING *`,
      [plate_number, type, capacity_kg || null]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    if (err.code === '23505') return res.status(409).json({ message: 'Plate number already exists' });
    res.status(500).json({ message: 'Server error' });
  }
}

async function getVehicles(req, res) {
  try {
    const result = await pool.query(`SELECT * FROM vehicles ORDER BY created_at DESC`);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
}

async function getVehicleById(req, res) {
  try {
    const result = await pool.query(`SELECT * FROM vehicles WHERE id = $1`, [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ message: 'Vehicle not found' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
}

async function updateVehicle(req, res) {
  try {
    const { plate_number, type, capacity_kg, status } = req.body;
    const result = await pool.query(
      `UPDATE vehicles SET
        plate_number = COALESCE($1, plate_number),
        type = COALESCE($2, type),
        capacity_kg = COALESCE($3, capacity_kg),
        status = COALESCE($4, status)
       WHERE id = $5 RETURNING *`,
      [plate_number, type, capacity_kg, status, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ message: 'Vehicle not found' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
}

async function deleteVehicle(req, res) {
  try {
    const result = await pool.query(`DELETE FROM vehicles WHERE id = $1 RETURNING id`, [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ message: 'Vehicle not found' });
    res.json({ message: 'Vehicle deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
}

module.exports = { createVehicle, getVehicles, getVehicleById, updateVehicle, deleteVehicle };