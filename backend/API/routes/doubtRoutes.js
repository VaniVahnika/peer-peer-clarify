const express = require('express');
const { createDoubt, getDoubts, getDoubtById, updateDoubt } = require('../controllers/doubtController');
const verifyToken = require('../../middlewares/verifyToken');
const roleAccess = require('../../middlewares/roleAccess');
const router = express.Router();

router.post('/', verifyToken, roleAccess('student'), createDoubt);
router.get('/', verifyToken, getDoubts);
router.get('/:id', verifyToken, getDoubtById);
router.put('/:id', verifyToken, roleAccess('student'), updateDoubt);

module.exports = router;