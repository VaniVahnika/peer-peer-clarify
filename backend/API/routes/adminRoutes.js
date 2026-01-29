const express = require('express');
const { getPendingInstructors, verifyInstructor, getDashboardStats, getAllInstructors, deleteInstructor } = require('../controllers/adminController');
const verifyToken = require('../../middlewares/verifyToken');
const roleAccess = require('../../middlewares/roleAccess');
const router = express.Router();

router.get('/dashboard', verifyToken, roleAccess('admin'), getDashboardStats);
router.get('/pending-instructors', verifyToken, roleAccess('admin'), getPendingInstructors);
router.put('/verify-instructor/:instructorId', verifyToken, roleAccess('admin'), verifyInstructor);
router.get('/instructors', verifyToken, roleAccess('admin'), getAllInstructors);
router.delete('/instructor/:id', verifyToken, roleAccess('admin'), deleteInstructor);

module.exports = router;