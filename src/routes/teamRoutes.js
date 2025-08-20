const express = require('express');
const router = express.Router();
const Team = require('../models/Team');
const { protect, admin } = require('../middlewares/authMiddleware');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, '../../uploads/team');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

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
router.get('/admin', protect, admin, async (req, res) => {
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
router.post('/', protect, admin, upload.single('image'), async (req, res) => {
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

    // Validate required fields
    if (!name || !name_ar || !position || !position_ar) {
      return res.status(400).json({ msg: 'Name and position are required in both languages' });
    }

    if (!req.file) {
      return res.status(400).json({ msg: 'Team member image is required' });
    }

    const teamMember = new Team({
      name: name.trim(),
      name_ar: name_ar.trim(),
      position: position.trim(),
      position_ar: position_ar.trim(),
      bio: bio ? bio.trim() : '',
      bio_ar: bio_ar ? bio_ar.trim() : '',
      image: `uploads/team/${req.file.filename}`,
      email: email ? email.trim() : '',
      phone: phone ? phone.trim() : '',
      linkedin: linkedin ? linkedin.trim() : '',
      twitter: twitter ? twitter.trim() : '',
      instagram: instagram ? instagram.trim() : '',
      order: parseInt(order) || 0,
      isActive: isActive === 'true' || isActive === true
    });

    await teamMember.save();
    console.log('Team member created successfully:', teamMember._id);
    res.status(201).json(teamMember);
  } catch (error) {
    console.error('Error creating team member:', error);
    res.status(500).json({ msg: 'Server error', error: error.message });
  }
});

// @route   PUT /api/team/:id
// @desc    Update team member
// @access  Private
router.put('/:id', protect, admin, upload.single('image'), async (req, res) => {
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

    // Update fields with proper validation
    if (name) teamMember.name = name.trim();
    if (name_ar) teamMember.name_ar = name_ar.trim();
    if (position) teamMember.position = position.trim();
    if (position_ar) teamMember.position_ar = position_ar.trim();
    teamMember.bio = bio !== undefined ? bio.trim() : teamMember.bio;
    teamMember.bio_ar = bio_ar !== undefined ? bio_ar.trim() : teamMember.bio_ar;
    teamMember.email = email !== undefined ? email.trim() : teamMember.email;
    teamMember.phone = phone !== undefined ? phone.trim() : teamMember.phone;
    teamMember.linkedin = linkedin !== undefined ? linkedin.trim() : teamMember.linkedin;
    teamMember.twitter = twitter !== undefined ? twitter.trim() : teamMember.twitter;
    teamMember.instagram = instagram !== undefined ? instagram.trim() : teamMember.instagram;
    teamMember.order = order !== undefined ? parseInt(order) || 0 : teamMember.order;
    teamMember.isActive = isActive !== undefined ? (isActive === 'true' || isActive === true) : teamMember.isActive;

    // Update image if new one is uploaded
    if (req.file) {
      // Delete old image file if it exists
      if (teamMember.image && teamMember.image.startsWith('uploads/team/')) {
        const oldImagePath = path.join(__dirname, '../../', teamMember.image);
        if (fs.existsSync(oldImagePath)) {
          try {
            fs.unlinkSync(oldImagePath);
          } catch (err) {
            console.warn('Could not delete old image:', err.message);
          }
        }
      }
      teamMember.image = `uploads/team/${req.file.filename}`;
    }

    await teamMember.save();
    console.log('Team member updated successfully:', teamMember._id);
    res.json(teamMember);
  } catch (error) {
    console.error('Error updating team member:', error);
    if (error.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Team member not found' });
    }
    res.status(500).json({ msg: 'Server error', error: error.message });
  }
});

// @route   DELETE /api/team/:id
// @desc    Delete team member
// @access  Private
router.delete('/:id', protect, admin, async (req, res) => {
  try {
    const teamMember = await Team.findById(req.params.id);
    if (!teamMember) {
      return res.status(404).json({ msg: 'Team member not found' });
    }

    // Delete associated image file
    if (teamMember.image && teamMember.image.startsWith('uploads/team/')) {
      const imagePath = path.join(__dirname, '../../', teamMember.image);
      if (fs.existsSync(imagePath)) {
        try {
          fs.unlinkSync(imagePath);
          console.log('Deleted image file:', imagePath);
        } catch (err) {
          console.warn('Could not delete image file:', err.message);
        }
      }
    }

    await Team.findByIdAndDelete(req.params.id);
    console.log('Team member deleted successfully:', req.params.id);
    res.json({ msg: 'Team member deleted successfully' });
  } catch (error) {
    console.error('Error deleting team member:', error);
    if (error.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Team member not found' });
    }
    res.status(500).json({ msg: 'Server error', error: error.message });
  }
});

// @route   PUT /api/team/:id/toggle
// @desc    Toggle team member active status
// @access  Private
router.put('/:id/toggle', protect, admin, async (req, res) => {
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
