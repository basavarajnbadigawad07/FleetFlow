const express = require('express');
const router = express.Router();
const { verifyToken, authorize } = require('../middleware/auth');
const {
  createWarehouse, getWarehouses, updateWarehouse, deleteWarehouse
} = require('../controllers/warehouseController');

router.get('/', verifyToken, authorize('admin'), getWarehouses);
router.post('/', verifyToken, authorize('admin'), createWarehouse);
router.put('/:id', verifyToken, authorize('admin'), updateWarehouse);
router.delete('/:id', verifyToken, authorize('admin'), deleteWarehouse);

module.exports = router;