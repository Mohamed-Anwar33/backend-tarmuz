const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ msg: 'No token' });

  try {
    const opts = {
      issuer: process.env.JWT_ISSUER || 'tramz-backend',
      audience: process.env.JWT_AUDIENCE || 'tramz-users',
    };
    const decoded = jwt.verify(token, process.env.JWT_SECRET, opts);
    // Ensure role is present for admin checks
    if (!decoded.role && decoded.id) {
      try {
        const user = await User.findById(decoded.id).select('role');
        req.user = { ...decoded, role: user?.role };
      } catch (_) {
        req.user = decoded;
      }
    } else {
      req.user = decoded;
    }
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ msg: 'Token expired' });
    }
    return res.status(401).json({ msg: 'Invalid token' });
  }
};

const admin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    res.status(403).json({ msg: 'Admin access required' });
  }
};

module.exports = { protect, admin };