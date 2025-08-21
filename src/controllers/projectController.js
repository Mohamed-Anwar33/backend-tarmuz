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

// Extract Cloudinary public_id from a secure_url. Assumes uploads under baseFolder.
const publicIdFromUrl = (url) => {
  try {
    // Example: https://res.cloudinary.com/<cloud>/image/upload/v1699999999/tarmuz/uploads/general/name.jpg
    const u = new URL(url);
    const parts = u.pathname.split('/');
    const uploadIdx = parts.findIndex((p) => p === 'upload');
    if (uploadIdx === -1) return null;
    const afterUpload = parts.slice(uploadIdx + 1).join('/');
    // Remove version segment if present (v123456)
    const after = afterUpload.replace(/^v\d+\//, '');
    const noExt = after.replace(/\.[a-zA-Z0-9]+$/, '');
    return noExt;
  } catch {
    return null;
  }
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

    // Normalize existingImages from multipart form: can be JSON string or repeated fields
    let existingImages = undefined;
    if (req.body.existingImages !== undefined) {
      if (typeof req.body.existingImages === 'string') {
        try { existingImages = JSON.parse(req.body.existingImages); } catch { existingImages = []; }
      } else if (Array.isArray(req.body.existingImages)) {
        existingImages = req.body.existingImages;
      }
      if (!Array.isArray(existingImages)) existingImages = [];
    }

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
      // If client sent existingImages, merge with uploads, else keep default behavior (replace)
      if (existingImages) {
        updateData.images = [...existingImages, ...uploadedUrls];
      } else {
        updateData.images = uploadedUrls;
      }
      if (!updateData.cover && (updateData.images?.length || 0) > 0) {
        updateData.cover = updateData.images[0];
      }
    }

    // If existingImages provided, compute deletions compared to current project and remove from Cloudinary
    let project;
    if (existingImages) {
      const current = await Project.findById(req.params.id);
      if (!current) return res.status(404).json({ msg: 'Project not found' });
      const toKeep = new Set(existingImages);
      const removed = (current.images || []).filter((img) => !toKeep.has(img));
      for (const url of removed) {
        const pid = publicIdFromUrl(url);
        if (pid) {
          try { await cloudinary.uploader.destroy(pid); } catch (_) {}
        }
      }
      // If no new uploads were provided but existingImages is, ensure updateData.images is set
      if (!updateData.images) updateData.images = existingImages;
      // Adjust cover if necessary
      if (updateData.images?.length > 0 && (!updateData.cover || !toKeep.has(updateData.cover))) {
        updateData.cover = updateData.images[0];
      }
      project = await Project.findByIdAndUpdate(
        req.params.id,
        updateData,
        { new: true, runValidators: true }
      );
    } else {
      project = await Project.findByIdAndUpdate(
        req.params.id,
        updateData,
        { new: true, runValidators: true }
      );
    }

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