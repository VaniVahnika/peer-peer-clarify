const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../../models/User');

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.SECRET, { expiresIn: '7d' });
};

const register = async (req, res) => {
  try {
    const { name, email, password, role = 'student', domains, experience, bio } = req.body;
    console.log('Register attempt:', { email, role, domains, experience, github: req.body.github, hasFile: !!req.file });

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ msg: 'User already exists' });
    }

    // Prevent direct admin registration
    if (role === 'admin') {
      return res.status(403).json({ msg: 'Admin registration is restricted.' });
    }

    // Validate instructor requirements
    if (role === 'instructor') {
      if (!domains || domains.length === 0) {
        return res.status(400).json({ msg: 'Domains/skills required for instructors' });
      }
      if (!experience) {
        return res.status(400).json({ msg: 'Experience required for instructors' });
      }
      if (!req.body.github) {
        return res.status(400).json({ msg: 'GitHub profile required for instructors' });
      }
      if (!req.file) {
        return res.status(400).json({ msg: 'Resume upload required for instructors' });
      }
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const userData = {
      name,
      email,
      password: hashedPassword,
      role
    };

    // Add instructor-specific fields
    if (role === 'instructor') {
      userData.domains = domains;
      userData.experience = experience;
      userData.bio = bio;
      userData.github = req.body.github;
      userData.resume = req.file.path; // Store file path
      userData.isVerified = true; // Auto-approve instructors
    }

    const user = await User.create(userData);

    const token = generateToken(user._id);

    res.cookie('token', token, {
      httpOnly: true,
      secure: true, // Required for SameSite: 'none'
      sameSite: 'none', // Required for cross-site cookie usage
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    req.session.user = { id: user._id, role: user.role };

    res.status(201).json({
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        sessionsAttended: user.sessionsAttended,
        sessionsTaken: user.sessionsTaken,
        statusForSession: user.statusForSession
      },
      token
    });
  } catch (error) {
    res.status(500).json({ msg: error.message });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ msg: 'Invalid credentials' });
    }



    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ msg: 'Invalid credentials' });
    }

    const token = generateToken(user._id);

    res.cookie('token', token, {
      httpOnly: true,
      secure: true, // Required for SameSite: 'none'
      sameSite: 'none', // Required for cross-site cookie usage
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    req.session.user = { id: user._id, role: user.role };

    res.json({
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        sessionsAttended: user.sessionsAttended,
        sessionsTaken: user.sessionsTaken,
        statusForSession: user.statusForSession
      },
      token
    });
  } catch (error) {
    res.status(500).json({ msg: error.message });
  }
};

const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    res.json(user);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};

const logout = (req, res) => {
  res.clearCookie('token', {
    httpOnly: true,
    secure: true,
    sameSite: 'none'
  });
  req.session.destroy();
  res.json({ msg: 'Logged out successfully' });
};

module.exports = { register, login, logout, getMe };