const Project = require('../models/Project');
const { createOrGetCategory } = require('./categoryController');
const { v2: cloudinary } = require('cloudinary');
const path = require('path');
const fs = require('fs');

// Configure Cloudinary (supports single URL or individual vars)
if (process.env.CLOUDINARY_URL) {
  cloudinary.config({ secure: true });
} else {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true,
  });
}

const unlinkSafe = async (p) => { try { await fs.promises.unlink(p); } catch (_) {} };
const baseFolder = process.env.CLOUDINARY_FOLDER || 'tarmuz/uploads';
const toPublicId = (absPath, filename) => {
  const subFolder = path.basename(path.dirname(absPath)); // e.g., 'general'
  const nameNoExt = path.basename(filename, path.extname(filename));
  return `${baseFolder}/${subFolder}/${nameNoExt}`;
};

// Get all projects
exports.getProjects = async (req, res) => {
  try {
    const projects = await Project.find().sort({ createdAt: -1 });
    res.json(projects);
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
};

// Get single project
exports.getProject = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ msg: 'Project not found' });
    }
    res.json(project);
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
};

// Create project
exports.createProject = async (req, res) => {
  try {
    // Check if project with same id already exists
    const existingProject = await Project.findOne({ id: req.body.id });
    if (existingProject) {
      return res.status(400).json({ msg: 'Project with this ID already exists' });
    }

    // Auto-create category if it doesn't exist
    if (req.body.category) {
      await createOrGetCategory(req.body.category, req.body.category_ar);
    }

    const project = new Project(req.body);

    if (req.files && req.files.length > 0) {
      const uploadedUrls = [];
      for (const f of req.files) {
        const abs = path.resolve(f.path);
        const publicId = toPublicId(abs, f.filename);
        try {
          const result = await cloudinary.uploader.upload(abs, {
            public_id: publicId,
            overwrite: true,
            resource_type: 'image',
          });
          uploadedUrls.push(result.secure_url);
        } finally {
          await unlinkSafe(abs);
        }
      }
      project.images = uploadedUrls;
      if (!project.cover && uploadedUrls.length > 0) {
        project.cover = uploadedUrls[0];
      }
    }

    await project.save();
    res.status(201).json(project);
  } catch (err) {
    if (err.name === 'ValidationError') {
      const errors = Object.values(err.errors).map(e => e.message);
      return res.status(400).json({ msg: errors.join(', ') });
    }
    res.status(400).json({ msg: err.message });
  }
};

// Update project
exports.updateProject = async (req, res) => {
  try {
    const updateData = { ...req.body, updatedAt: Date.now() };

    // Auto-create category if it doesn't exist and category is being updated
    if (updateData.category) {
      await createOrGetCategory(updateData.category, updateData.category_ar);
    }

    // Handle new uploaded images -> upload to Cloudinary
    if (req.files && req.files.length > 0) {
      const uploadedUrls = [];
      for (const f of req.files) {
        const abs = path.resolve(f.path);
        const publicId = toPublicId(abs, f.filename);
        try {
          const result = await cloudinary.uploader.upload(abs, {
            public_id: publicId,
            overwrite: true,
            resource_type: 'image',
          });
          uploadedUrls.push(result.secure_url);
        } finally {
          await unlinkSafe(abs);
        }
      }
      updateData.images = uploadedUrls;
      if (!updateData.cover && uploadedUrls.length > 0) {
        updateData.cover = uploadedUrls[0];
      }
    }

    const project = await Project.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!project) {
      return res.status(404).json({ msg: 'Project not found' });
    }

    res.json(project);
  } catch (err) {
    if (err.name === 'ValidationError') {
      const errors = Object.values(err.errors).map(e => e.message);
      return res.status(400).json({ msg: errors.join(', ') });
    }
    res.status(400).json({ msg: err.message });
  }
};

// Delete project
exports.deleteProject = async (req, res) => {
  try {
    const project = await Project.findByIdAndDelete(req.params.id);
    if (!project) {
      return res.status(404).json({ msg: 'Project not found' });
    }
    res.json({ msg: 'Project deleted successfully' });
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
};