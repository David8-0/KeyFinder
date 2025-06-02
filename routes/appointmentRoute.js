const express = require('express');
const router = express.Router();
const appointmentController = require('../controllers/appointmentController');
const { protect } = require('../controllers/authController');

// Protect all appointment routes
// router.use(protect);

// Get all appointments
router.get('/', appointmentController.getAllAppointments);

// Get appointment by ID
router.get('/:id', appointmentController.getAppointmentById);

// Create new appointment
router.post('/', appointmentController.createAppointment);

// Update appointment
router.patch('/:id', appointmentController.updateAppointment);

// Delete appointment
router.delete('/:id', appointmentController.deleteAppointment);

// Add feedback to appointment
router.post('/:id/feedback', appointmentController.addFeedback);

module.exports = router; 