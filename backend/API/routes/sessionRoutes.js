const express = require('express');
const { createSession, getSessions, endSession } = require('../controllers/sessionController');
const { submitFeedback, getFeedback } = require('../controllers/feedbackController');
const verifyToken = require('../../middlewares/verifyToken');
const router = express.Router();

router.post('/', verifyToken, createSession);
router.get('/', verifyToken, getSessions);
router.put('/:id/end', verifyToken, endSession);
router.post('/feedback', verifyToken, submitFeedback);
router.get('/:sessionId/feedback', verifyToken, getFeedback);

module.exports = router;