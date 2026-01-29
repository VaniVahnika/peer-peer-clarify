const express = require('express');
const { getInstructorsByDomain, updateInstructorStatus, getInstructorStats } = require('../controllers/instructorController');
const { createPost, getPosts } = require('../controllers/instructorPostController');
const verifyToken = require('../../middlewares/verifyToken');
const roleAccess = require('../../middlewares/roleAccess');
const router = express.Router();

router.get('/', verifyToken, getInstructorsByDomain);
router.put('/status', verifyToken, roleAccess('instructor'), updateInstructorStatus);
router.post('/posts', verifyToken, roleAccess('instructor'), createPost);
router.get('/posts', verifyToken, getPosts);
router.get('/stats', verifyToken, roleAccess('instructor'), getInstructorStats);

module.exports = router;