const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure uploads directory exists
const uploadsDir = 'uploads/';
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // sanitize category to prevent traversal and weird chars
    const raw = String(req.body.category || 'general');
    let safe = raw.toLowerCase().replace(/[^a-z0-9-_]/g, '');
    if (!safe) safe = 'general';
    // ensure no path segments
    const subDir = path.basename(safe).slice(0, 50);
    const fullPath = path.join(uploadsDir, subDir);
    
    if (!fs.existsSync(fullPath)) {
      fs.mkdirSync(fullPath, { recursive: true });
    }
    
    cb(null, fullPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    // Derive a safe extension from mimetype (ignore originalname to prevent double extensions)
    const map = {
      'image/jpeg': '.jpg',
      'image/png': '.png',
      'image/gif': '.gif',
      'image/webp': '.webp',
    };
    const ext = map[file.mimetype] || '';
    cb(null, `file-${uniqueSuffix}${ext}`);
  },
});

const fileFilter = (req, file, cb) => {
  const allowed = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
  if (allowed.includes(file.mimetype)) {
    return cb(null, true);
  }
  const err = new Error('Invalid file type');
  err.code = 'UNSUPPORTED_FILE_TYPE';
  return cb(err);
};

const upload = multer({ 
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB per file
    files: 20, // prevent excessive file counts
  }
});

module.exports = upload;