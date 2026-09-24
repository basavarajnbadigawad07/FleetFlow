const express = require('express');
const router = express.Router();
const { verifyToken, authorize } = require('../middleware/auth');
const {
  getDrivers, assignVehicle, updateAvailability, updateLocation, getLiveLocations
} = require('../controllers/driverController');

router.get('/', verifyToken, authorize('admin'), getDrivers);
router.put('/:id/assign-vehicle', verifyToken, authorize('admin'), assignVehicle);
router.put('/availability', verifyToken, authorize('driver'), updateAvailability);
router.put('/location', verifyToken, authorize('driver'), updateLocation);
router.get('/live-locations', verifyToken, authorize('admin'), getLiveLocations);

module.exports = router;