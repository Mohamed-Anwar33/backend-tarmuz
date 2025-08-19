const User = require('../models/User');
const jwt = require('jsonwebtoken');

const isEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(v || ''));
const clean = (v) => String(v || '').trim();

exports.register = async (req, res) => {
  const username = clean(req.body.username);
  const password = String(req.body.password || '');
  const email = clean((req.body.email || '').toLowerCase());
  try {
    // Basic validation
    if (!username || username.length < 3 || username.length > 32) {
      return res.status(400).json({ msg: 'Invalid username' });
    }
    if (!password || password.length < 6 || password.length > 128) {
      return res.status(400).json({ msg: 'Invalid password' });
    }
    if (!email || !isEmail(email) || email.length > 254) {
      return res.status(400).json({ msg: 'Invalid email' });
    }
    
    const existingUser = await User.findOne({ $or: [{ username }, { email }] });
    if (existingUser) {
      return res.status(400).json({ msg: 'User already exists' });
    }
    
    const user = new User({ username, password, email });
    await user.save();
    res.status(201).json({ msg: 'User registered successfully' });
  } catch (err) {
    res.status(400).json({ msg: 'Unable to register user' });
  }
};

exports.login = async (req, res) => {
  const username = clean(req.body.username);
  const password = String(req.body.password || '');
  try {
    if (!username || !password) {
      return res.status(400).json({ msg: 'Invalid credentials' });
    }
    const user = await User.findOne({ username });
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ msg: 'Invalid credentials' });
    }
    
    const jwtOpts = {
      expiresIn: '24h',
      issuer: process.env.JWT_ISSUER || 'tramz-backend',
      audience: process.env.JWT_AUDIENCE || 'tramz-users',
    };
    const token = jwt.sign(
      { id: user._id, username: user.username, role: user.role }, 
      process.env.JWT_SECRET, 
      jwtOpts
    );
    
    res.json({ 
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email
      }
    });
  } catch (err) {
    res.status(500).json({ msg: 'Internal server error' });
  }
};

exports.verifyToken = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }
    res.json({ user });
  } catch (err) {
    res.status(500).json({ msg: 'Internal server error' });
  }
};

// Update profile (username/email)
exports.updateProfile = async (req, res) => {
  try {
    const id = req.user?.id;
    if (!id) return res.status(401).json({ msg: 'Unauthorized' });
    const username = clean(req.body.username);
    const email = clean((req.body.email || '').toLowerCase());

    if (!username || username.length < 3 || username.length > 32) {
      return res.status(400).json({ msg: 'Invalid username' });
    }
    if (!email || !isEmail(email) || email.length > 254) {
      return res.status(400).json({ msg: 'Invalid email' });
    }

    const conflicts = await User.findOne({
      _id: { $ne: id },
      $or: [{ username }, { email }]
    });
    if (conflicts) {
      return res.status(400).json({ msg: 'Username or email already in use' });
    }

    const user = await User.findByIdAndUpdate(
      id,
      { username, email },
      { new: true, runValidators: true, context: 'query' }
    ).select('-password');
    res.json({ msg: 'Profile updated', user });
  } catch (err) {
    res.status(500).json({ msg: 'Unable to update profile' });
  }
};

// Change password (requires currentPassword)
exports.changePassword = async (req, res) => {
  try {
    const id = req.user?.id;
    if (!id) return res.status(401).json({ msg: 'Unauthorized' });
    const currentPassword = String(req.body.currentPassword || '');
    const newPassword = String(req.body.newPassword || '');

    if (!newPassword || newPassword.length < 6 || newPassword.length > 128) {
      return res.status(400).json({ msg: 'Invalid new password' });
    }

    const user = await User.findById(id);
    if (!user) return res.status(404).json({ msg: 'User not found' });

    const ok = await user.comparePassword(currentPassword);
    if (!ok) return res.status(400).json({ msg: 'Current password is incorrect' });

    user.password = newPassword; // will be hashed by pre('save')
    await user.save();
    res.json({ msg: 'Password updated' });
  } catch (err) {
    res.status(500).json({ msg: 'Unable to change password' });
  }
};