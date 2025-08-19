const mongoose = require('mongoose');

const contentSchema = new mongoose.Schema({
  type: { type: String, required: true, unique: true }, // 'hero', 'about', 'services', 'contact', 'blog'
  title_ar: String,
  title_en: String,
  description_ar: String,
  description_en: String,
  content_ar: String, // محتوى إضافي
  content_en: String, // محتوى إضافي
  image: String, // URL للصورة
  video: String, // URL لفيديو (إضافي)
  isActive: { type: Boolean, default: true }, // للتحكم في تفعيل الأقسام (خاصة المدونة)
  services: [{ // لقسم Services
    name_ar: String,
    name_en: String,
    icon: String,
    description_ar: String,
    description_en: String,
  }],
  // نصوص قابلة للتحرير لقسم "نبذة عنا": الرؤية، الفريق، التميز
  about_features: {
    vision: {
      title_ar: String,
      title_en: String,
      description_ar: String,
      description_en: String,
    },
    team: {
      title_ar: String,
      title_en: String,
      description_ar: String,
      description_en: String,
    },
    excellence: {
      title_ar: String,
      title_en: String,
      description_ar: String,
      description_en: String,
    },
  },
  contact: { // بيانات التواصل
    email: String,
    phone: String,
    address_ar: String,
    address_en: String,
  },
  social: { // روابط التواصل الاجتماعي
    instagram: String,
    twitter: String,
    linkedin: String,
    facebook: String,
    youtube: String,
    tiktok: String,
    snapchat: String,
    whatsapp: String,
    telegram: String,
    pinterest: String,
    behance: String,
    dribbble: String,
  },
  location: { lat: Number, lng: Number }, // لـ Google Maps
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Update the updatedAt field before saving
contentSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Content', contentSchema);