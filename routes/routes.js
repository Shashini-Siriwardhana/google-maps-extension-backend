const express = require('express');
const { getRoutes, addRoute, addDestination, updateRoute, updateStartingPoint, updateTransportationMode, updateDestination,  deleteRoute } = require('../controllers/mapControllers');

const router = express.Router();

// Routes
router.get('/routes', getRoutes);
router.post('/add_route', addRoute);
router.post('/add_destination', addDestination);
router.put('/update_route', updateRoute);
router.put('/update_starting_point', updateStartingPoint)
router.put('/update_transportation_mode', updateTransportationMode)
router.put('/update_destination', updateDestination)
router.delete('/delete_route', deleteRoute);

module.exports = router;