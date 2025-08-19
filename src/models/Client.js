const mongoose = require('mongoose');

const clientSchema = new mongoose.Schema({
  name_ar: { type: String, required: true },
  name_en: { type: String, required: true },
  description_ar: String,
  description_en: String,
  logo: String,
  website: String,
  status: { 
    type: String, 
    default: 'active',
    enum: ['active', 'inactive']
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Update the updatedAt field before saving
clientSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Client', clientSchema);