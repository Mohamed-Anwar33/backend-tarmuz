const mongoose = require('mongoose');

const testimonialSchema = new mongoose.Schema({
  quote_ar: { type: String, required: true },
  quote_en: { type: String, required: true },
  clientName_ar: { type: String, required: true },
  clientName_en: String,
  position_ar: String,
  position_en: String,
  company_ar: String,
  company_en: String,
  avatar: String,
  rating: { 
    type: Number, 
    min: 1, 
    max: 5, 
    default: 5 
  },
  status: { 
    type: String, 
    default: 'active',
    enum: ['active', 'inactive']
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Update the updatedAt field before saving
testimonialSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Testimonial', testimonialSchema);