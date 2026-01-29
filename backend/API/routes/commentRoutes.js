const express = require('express');
const { addComment, getComments } = require('../controllers/commentController');
const verifyToken = require('../../middlewares/verifyToken');
const router = express.Router();

router.post('/:doubtId', verifyToken, addComment);
router.get('/:doubtId', verifyToken, getComments);

module.exports = router;