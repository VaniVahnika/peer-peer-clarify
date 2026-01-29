const jwt = require('jsonwebtoken');
const User = require('../models/User');

const verifyToken = async (req, res, next) => {
  try {
    const token = req.cookies.token || req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({ msg: 'Access denied' });
    }

    const decoded = jwt.verify(token, process.env.SECRET);
    const user = await User.findById(decoded.id).select('-password');

    if (!user) {
      return res.status(401).json({ msg: 'Invalid token' });
    }

    req.user = user;
    req.session.user = { id: user._id, role: user.role };
    console.log(`[VerifyToken] Success. User: ${user.email}, Role: ${user.role}`);
    next();
  } catch (error) {
    res.status(401).json({ msg: 'Invalid token' });
  }
};

module.exports = verifyToken;