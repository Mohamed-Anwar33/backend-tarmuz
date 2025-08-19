const mongoose = require('mongoose');

const blogPostSchema = new mongoose.Schema({
  title_ar: { type: String, required: true },
  title_en: { type: String, required: true },
  content_ar: { type: String, required: true },
  content_en: String,
  excerpt_ar: String,
  excerpt_en: String,
  featuredImage: String,
  status: { 
    type: String, 
    default: 'draft',
    enum: ['published', 'draft']
  },
  tags: [String],
  author: String,
  publishedAt: Date,
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Update the updatedAt field before saving
blogPostSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('BlogPost', blogPostSchema);