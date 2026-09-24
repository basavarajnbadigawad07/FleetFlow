const express = require('express');
const router = express.Router();
const { verifyToken, authorize } = require('../middleware/auth');
const {
  createShipment, assignShipment, updateShipmentStatus,
  getShipments, getMyShipments, trackShipment
} = require('../controllers/shipmentController');

router.get('/track/:code', trackShipment); // public, no auth
router.get('/mine', verifyToken, authorize('driver'), getMyShipments);
router.get('/', verifyToken, authorize('admin'), getShipments);
router.post('/', verifyToken, authorize('admin'), createShipment);
router.put('/:id/assign', verifyToken, authorize('admin'), assignShipment);
router.put('/:id/status', verifyToken, authorize('admin', 'driver'), updateShipmentStatus);

module.exports = router;