const express = require('express');
const router = express.Router();
const { getUserNotifications, markAsRead, markAllAsRead } = require('../controllers/notificationController');
const verifyToken = require('../../middlewares/verifyToken');

router.get('/', verifyToken, getUserNotifications);
router.put('/:id/read', verifyToken, markAsRead);
router.put('/read-all', verifyToken, markAllAsRead);

module.exports = router;
