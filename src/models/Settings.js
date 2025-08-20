const mongoose = require('mongoose');

const SettingsSchema = new mongoose.Schema({
  contactRecipient: {
    type: String,
    trim: true,
    default: '',
  },
  // Login form options
  loginShowEmail: {
    type: Boolean,
    default: false,
  },
  loginEnableEmail: {
    type: Boolean,
    default: true,
  },
  // Branding
  logoUrl: {
    type: String,
    trim: true,
    default: '',
  },
  logoUrlScrolled: {
    type: String,
    trim: true,
    default: '',
  },
  // Team section settings
  showTeamSection: {
    type: Boolean,
    default: true,
  },
}, { timestamps: true });

module.exports = mongoose.model('Settings', SettingsSchema);
