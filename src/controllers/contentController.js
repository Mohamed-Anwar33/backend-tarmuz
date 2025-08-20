const Content = require('../models/Content');
const multer = require('multer');
const path = require('path');

// Get all content sections
exports.getAllContent = async (req, res) => {
  try {
    const content = await Content.find();
    res.json(content);
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
};

// Get content by type
exports.getContent = async (req, res) => {
  const { type } = req.params;
  try {
    const content = await Content.findOne({ type });
    if (!content) return res.status(404).json({ msg: 'Content not found' });
    res.json(content);
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
};

// Update content by type
exports.updateContent = async (req, res) => {
  const { type } = req.params;
  try {
    // Handle file uploads
    const updateData = { ...req.body, updatedAt: Date.now() };
    
    // Handle multiple image uploads
    if (req.files && req.files.length > 0) {
      updateData.images = req.files.map(file => `/uploads/content/${file.filename}`);
    }
    
    // Handle single image upload
    if (req.file) {
      updateData.image = `/uploads/content/${req.file.filename}`;
    }
    
    const content = await Content.findOneAndUpdate(
      { type }, 
      updateData, 
      { new: true, upsert: true, runValidators: true }
    );
    res.json(content);
  } catch (err) {
    if (err.name === 'ValidationError') {
      const errors = Object.values(err.errors).map(e => e.message);
      return res.status(400).json({ msg: errors.join(', ') });
    }
    res.status(500).json({ msg: err.message });
  }
};

// Create new content section
exports.createContent = async (req, res) => {
  try {
    const contentData = { ...req.body };
    
    // Handle multiple image uploads
    if (req.files && req.files.length > 0) {
      contentData.images = req.files.map(file => `/uploads/content/${file.filename}`);
    }
    
    // Handle single image upload
    if (req.file) {
      contentData.image = `/uploads/content/${req.file.filename}`;
    }
    
    const content = new Content(contentData);
    await content.save();
    res.status(201).json(content);
  } catch (err) {
    if (err.name === 'ValidationError') {
      const errors = Object.values(err.errors).map(e => e.message);
      return res.status(400).json({ msg: errors.join(', ') });
    }
    res.status(400).json({ msg: err.message });
  }
};

// Delete content section
exports.deleteContent = async (req, res) => {
  try {
    const content = await Content.findByIdAndDelete(req.params.id);
    if (!content) {
      return res.status(404).json({ msg: 'Content not found' });
    }
    res.json({ msg: 'Content deleted successfully' });
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
};