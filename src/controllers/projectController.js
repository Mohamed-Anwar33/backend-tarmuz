const Project = require('../models/Project');
const { createOrGetCategory } = require('./categoryController');

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
    if (req.files) {
      // Use the full path including the category subdirectory
      project.images = req.files.map(f => '/' + f.path.replace(/\\/g, '/'));
      // If cover is not set and we have files, use the first image as cover
      if (!project.cover && req.files.length > 0) {
        project.cover = '/' + req.files[0].path.replace(/\\/g, '/');
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
    
    // Handle new uploaded images
    if (req.files && req.files.length > 0) {
      updateData.images = req.files.map(f => '/' + f.path.replace(/\\/g, '/'));
      // If cover is not set and we have files, use the first image as cover
      if (!updateData.cover) {
        updateData.cover = '/' + req.files[0].path.replace(/\\/g, '/');
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