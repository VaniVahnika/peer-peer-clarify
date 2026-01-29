const express = require('express');
const { createRequest, getRequests, getRequestById, updateRequest, deleteRequest } = require('../controllers/sessionRequestController');
const verifyToken = require('../../middlewares/verifyToken');
const roleAccess = require('../../middlewares/roleAccess');
const router = express.Router();

router.post('/', verifyToken, roleAccess('student', 'instructor'), createRequest);
router.get('/', verifyToken, getRequests);
router.get('/:id', verifyToken, getRequestById);
router.put('/:id', verifyToken, roleAccess('instructor'), updateRequest);
router.delete('/:id', verifyToken, roleAccess('instructor'), deleteRequest);

module.exports = router;