const pool = require('../db');

async function createWarehouse(req, res) {
  try {
    const { name, address, lat, lng } = req.body;
    if (!name || !address) {
      return res.status(400).json({ message: 'name and address are required' });
    }
    const result = await pool.query(
      `INSERT INTO warehouses (name, address, lat, lng) VALUES ($1, $2, $3, $4) RETURNING *`,
      [name, address, lat || null, lng || null]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
}

async function getWarehouses(req, res) {
  try {
    const result = await pool.query(`SELECT * FROM warehouses ORDER BY created_at DESC`);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
}

async function updateWarehouse(req, res) {
  try {
    const { name, address, lat, lng } = req.body;
    const result = await pool.query(
      `UPDATE warehouses SET
        name = COALESCE($1, name),
        address = COALESCE($2, address),
        lat = COALESCE($3, lat),
        lng = COALESCE($4, lng)
       WHERE id = $5 RETURNING *`,
      [name, address, lat, lng, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ message: 'Warehouse not found' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
}

async function deleteWarehouse(req, res) {
  try {
    const result = await pool.query(`DELETE FROM warehouses WHERE id = $1 RETURNING id`, [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ message: 'Warehouse not found' });
    res.json({ message: 'Warehouse deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
}

module.exports = { createWarehouse, getWarehouses, updateWarehouse, deleteWarehouse };