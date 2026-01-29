const express = require('express');
const { getRoadmaps, getRoadmap, updateProgress, getUserProgress } = require('../controllers/roadmapController');
const verifyToken = require('../../middlewares/verifyToken');
const roleAccess = require('../../middlewares/roleAccess');
const router = express.Router();

router.use((req, res, next) => {
    console.log(`[RoadmapRoutes] ${req.method} ${req.path}`);
    next();
});

router.get('/', verifyToken, getRoadmaps);
router.get('/my-progress', verifyToken, roleAccess('student'), getUserProgress);
router.put('/progress', verifyToken, roleAccess('student'), updateProgress);
router.get('/:slug', verifyToken, roleAccess('student'), getRoadmap);

module.exports = router;