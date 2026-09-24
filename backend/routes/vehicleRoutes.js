const express = require('express');
const router = express.Router();
const { verifyToken, authorize } = require('../middleware/auth');
const {
  createVehicle, getVehicles, getVehicleById, updateVehicle, deleteVehicle
} = require('../controllers/vehicleController');

router.get('/', verifyToken, authorize('admin'), getVehicles);
router.get('/:id', verifyToken, authorize('admin'), getVehicleById);
router.post('/', verifyToken, authorize('admin'), createVehicle);
router.put('/:id', verifyToken, authorize('admin'), updateVehicle);
router.delete('/:id', verifyToken, authorize('admin'), deleteVehicle);

module.exports = router;