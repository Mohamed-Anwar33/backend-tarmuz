const Category = require('../models/Category');
const Project = require('../models/Project');

// Get all categories
exports.getCategories = async (req, res) => {
  try {
    const categories = await Category.find({ isActive: true }).sort({ name: 1 });
    res.json(categories);
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
};

// Get all unique categories from projects (for backward compatibility)
exports.getProjectCategories = async (req, res) => {
  try {
    const categories = await Project.distinct('category');
    const filteredCategories = categories.filter(cat => cat && cat.trim() !== '');
    res.json(filteredCategories);
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
};

// Create or get existing category
exports.createOrGetCategory = async (categoryName, categoryNameAr = null) => {
  try {
    // Check if category already exists
    let category = await Category.findOne({ name: categoryName });
    
    if (!category) {
      // Create new category
      category = new Category({
        name: categoryName,
        name_ar: categoryNameAr || categoryName
      });
      await category.save();
    }
    
    return category;
  } catch (err) {
    throw new Error(`Error creating/getting category: ${err.message}`);
  }
};

// Create category manually (admin)
exports.createCategory = async (req, res) => {
  try {
    const { name, name_ar, description, description_ar } = req.body;
    
    // Check if category already exists
    const existingCategory = await Category.findOne({ name });
    if (existingCategory) {
      return res.status(400).json({ msg: 'Category already exists' });
    }
    
    const category = new Category({
      name,
      name_ar: name_ar || name,
      description,
      description_ar
    });
    
    await category.save();
    res.status(201).json(category);
  } catch (err) {
    res.status(400).json({ msg: err.message });
  }
};

// Update category
exports.updateCategory = async (req, res) => {
  try {
    const category = await Category.findByIdAndUpdate(
      req.params.id,
      { ...req.body, updatedAt: Date.now() },
      { new: true, runValidators: true }
    );
    
    if (!category) {
      return res.status(404).json({ msg: 'Category not found' });
    }
    
    res.json(category);
  } catch (err) {
    res.status(400).json({ msg: err.message });
  }
};

// Delete category
exports.deleteCategory = async (req, res) => {
  try {
    // Check if category is used in any projects
    const projectsUsingCategory = await Project.countDocuments({ category: req.params.name });
    
    if (projectsUsingCategory > 0) {
      return res.status(400).json({ 
        msg: `Cannot delete category. It is used in ${projectsUsingCategory} project(s)` 
      });
    }
    
    const category = await Category.findByIdAndDelete(req.params.id);
    
    if (!category) {
      return res.status(404).json({ msg: 'Category not found' });
    }
    
    res.json({ msg: 'Category deleted successfully' });
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
};
