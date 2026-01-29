const express = require('express');
const { register, login, logout, getMe } = require('../controllers/authController');
const verifyToken = require('../../middlewares/verifyToken');
const router = express.Router();

const upload = require('../../middlewares/multer'); // Import multer configuration

router.post('/register', upload.single('resume'), register);
router.post('/login', login);
router.post('/logout', logout);
router.get('/me', verifyToken, getMe);

module.exports = router;