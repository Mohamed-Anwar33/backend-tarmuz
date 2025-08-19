const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true }, // Project slug/identifier
  title_ar: { type: String, required: true },
  title_en: { type: String, required: true },
  description_ar: String,
  description_en: String,
  category: { 
    type: String, 
    required: true
  },
  cover: String, // Cover image path
  images: [String], // Additional images array
  status: { 
    type: String, 
    default: 'active',
    enum: ['active', 'inactive']
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Update the updatedAt field before saving
projectSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Project', projectSchema);