const express = require('express');
const router = express.Router();
const Team = require('../models/Team');
const auth = require('../middlewares/auth');
const multer = require('multer');
const path = require('path');

// Configure multer for team member images
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/team/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'team-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  }
});

// @route   GET /api/team
// @desc    Get all active team members
// @access  Public
router.get('/', async (req, res) => {
  try {
    const teamMembers = await Team.find({ isActive: true })
      .sort({ order: 1, createdAt: 1 });
    res.json(teamMembers);
  } catch (error) {
    console.error('Error fetching team members:', error);
    res.status(500).json({ msg: 'Server error' });
  }
});

// @route   GET /api/team/admin
// @desc    Get all team members (including inactive) for admin
// @access  Private
router.get('/admin', auth, async (req, res) => {
  try {
    const teamMembers = await Team.find()
      .sort({ order: 1, createdAt: 1 });
    res.json(teamMembers);
  } catch (error) {
    console.error('Error fetching team members for admin:', error);
    res.status(500).json({ msg: 'Server error' });
  }
});

// @route   GET /api/team/:id
// @desc    Get single team member
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    const teamMember = await Team.findById(req.params.id);
    if (!teamMember) {
      return res.status(404).json({ msg: 'Team member not found' });
    }
    res.json(teamMember);
  } catch (error) {
    console.error('Error fetching team member:', error);
    if (error.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Team member not found' });
    }
    res.status(500).json({ msg: 'Server error' });
  }
});

// @route   POST /api/team
// @desc    Create new team member
// @access  Private
router.post('/', auth, upload.single('image'), async (req, res) => {
  try {
    const {
      name,
      name_ar,
      position,
      position_ar,
      bio,
      bio_ar,
      email,
      phone,
      linkedin,
      twitter,
      instagram,
      order,
      isActive
    } = req.body;

    if (!req.file) {
      return res.status(400).json({ msg: 'Team member image is required' });
    }

    const teamMember = new Team({
      name,
      name_ar,
      position,
      position_ar,
      bio,
      bio_ar,
      image: `uploads/team/${req.file.filename}`,
      email,
      phone,
      linkedin,
      twitter,
      instagram,
      order: order || 0,
      isActive: isActive !== undefined ? isActive : true
    });

    await teamMember.save();
    res.status(201).json(teamMember);
  } catch (error) {
    console.error('Error creating team member:', error);
    res.status(500).json({ msg: 'Server error' });
  }
});

// @route   PUT /api/team/:id
// @desc    Update team member
// @access  Private
router.put('/:id', auth, upload.single('image'), async (req, res) => {
  try {
    const {
      name,
      name_ar,
      position,
      position_ar,
      bio,
      bio_ar,
      email,
      phone,
      linkedin,
      twitter,
      instagram,
      order,
      isActive
    } = req.body;

    const teamMember = await Team.findById(req.params.id);
    if (!teamMember) {
      return res.status(404).json({ msg: 'Team member not found' });
    }

    // Update fields
    teamMember.name = name || teamMember.name;
    teamMember.name_ar = name_ar || teamMember.name_ar;
    teamMember.position = position || teamMember.position;
    teamMember.position_ar = position_ar || teamMember.position_ar;
    teamMember.bio = bio !== undefined ? bio : teamMember.bio;
    teamMember.bio_ar = bio_ar !== undefined ? bio_ar : teamMember.bio_ar;
    teamMember.email = email !== undefined ? email : teamMember.email;
    teamMember.phone = phone !== undefined ? phone : teamMember.phone;
    teamMember.linkedin = linkedin !== undefined ? linkedin : teamMember.linkedin;
    teamMember.twitter = twitter !== undefined ? twitter : teamMember.twitter;
    teamMember.instagram = instagram !== undefined ? instagram : teamMember.instagram;
    teamMember.order = order !== undefined ? order : teamMember.order;
    teamMember.isActive = isActive !== undefined ? isActive : teamMember.isActive;

    // Update image if new one is uploaded
    if (req.file) {
      teamMember.image = `uploads/team/${req.file.filename}`;
    }

    await teamMember.save();
    res.json(teamMember);
  } catch (error) {
    console.error('Error updating team member:', error);
    if (error.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Team member not found' });
    }
    res.status(500).json({ msg: 'Server error' });
  }
});

// @route   DELETE /api/team/:id
// @desc    Delete team member
// @access  Private
router.delete('/:id', auth, async (req, res) => {
  try {
    const teamMember = await Team.findById(req.params.id);
    if (!teamMember) {
      return res.status(404).json({ msg: 'Team member not found' });
    }

    await Team.findByIdAndDelete(req.params.id);
    res.json({ msg: 'Team member deleted successfully' });
  } catch (error) {
    console.error('Error deleting team member:', error);
    if (error.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Team member not found' });
    }
    res.status(500).json({ msg: 'Server error' });
  }
});

// @route   PUT /api/team/:id/toggle
// @desc    Toggle team member active status
// @access  Private
router.put('/:id/toggle', auth, async (req, res) => {
  try {
    const teamMember = await Team.findById(req.params.id);
    if (!teamMember) {
      return res.status(404).json({ msg: 'Team member not found' });
    }

    teamMember.isActive = !teamMember.isActive;
    await teamMember.save();
    
    res.json(teamMember);
  } catch (error) {
    console.error('Error toggling team member status:', error);
    if (error.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Team member not found' });
    }
    res.status(500).json({ msg: 'Server error' });
  }
});

module.exports = router;
