const express = require('express');
const fs = require('fs');
const path = require('path');
const router = express.Router();
const upload = require('../middlewares/uploadMiddleware');
const { protect } = require('../middlewares/authMiddleware');
const { v2: cloudinary } = require('cloudinary');

// Configure Cloudinary from environment
// Required: CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET
if (process.env.CLOUDINARY_URL) {
  // Use single URL config; set secure URLs
  cloudinary.config({ secure: true });
} else {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true,
  });
}

const readBytes = async (filePath, n = 12) => {
  const fh = await fs.promises.open(filePath, 'r');
  try {
    const { buffer } = await fh.read(Buffer.alloc(n), 0, n, 0);
    return buffer;
  } finally {
    await fh.close();
  }
};

const detectImageMime = async (filePath) => {
  const b = await readBytes(filePath, 12);
  // JPEG: FF D8 FF
  if (b[0] === 0xFF && b[1] === 0xD8 && b[2] === 0xFF) return 'image/jpeg';
  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (
    b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4E && b[3] === 0x47 &&
    b[4] === 0x0D && b[5] === 0x0A && b[6] === 0x1A && b[7] === 0x0A
  ) return 'image/png';
  // GIF: 'GIF87a' or 'GIF89a'
  const sig6 = b.slice(0, 6).toString('ascii');
  if (sig6 === 'GIF87a' || sig6 === 'GIF89a') return 'image/gif';
  // WEBP: 'RIFF'....'WEBP'
  const riff = b.slice(0, 4).toString('ascii');
  const webp = b.slice(8, 12).toString('ascii');
  if (riff === 'RIFF' && webp === 'WEBP') return 'image/webp';
  return null;
};

const unlinkSafe = async (p) => {
  try { await fs.promises.unlink(p); } catch (_) { /* ignore */ }
};

// Upload single image
router.post('/', protect, upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ msg: 'No file uploaded' });
    }
    const absPath = path.resolve(req.file.path);
    const detected = await detectImageMime(absPath);
    if (!detected || detected !== req.file.mimetype) {
      await unlinkSafe(absPath);
      return res.status(400).json({ msg: 'Suspicious or invalid image file' });
    }
    // Determine Cloudinary folder
    const baseFolder = process.env.CLOUDINARY_FOLDER || 'tarmuz/uploads';
    const subFolder = path.basename(path.dirname(absPath)); // e.g., 'general'
    const folder = `${baseFolder}/${subFolder}`;

    // Public ID without extension for deterministic naming
    const nameNoExt = path.basename(req.file.filename, path.extname(req.file.filename));
    const publicId = `${folder}/${nameNoExt}`;

    const result = await cloudinary.uploader.upload(absPath, {
      public_id: publicId,
      overwrite: true,
      resource_type: 'image',
    });
    // Cleanup local temp file
    await unlinkSafe(absPath);

    res.json({
      msg: 'File uploaded successfully',
      secure_url: result.secure_url,
      url: result.secure_url,
      filename: result.public_id,
      original_filename: req.file.originalname,
      size: req.file.size,
      format: result.format,
      width: result.width,
      height: result.height,
    });
  } catch (error) {
    res.status(500).json({ msg: error.message });
  }
});

// Upload multiple images
router.post('/multiple', protect, upload.array('images', 10), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ msg: 'No files uploaded' });
    }
    const uploaded = [];
    for (const f of req.files) {
      const absPath = path.resolve(f.path);
      const detected = await detectImageMime(absPath);
      if (!detected || detected !== f.mimetype) {
        await unlinkSafe(absPath);
        continue; // skip unsafe file
      }
      const baseFolder = process.env.CLOUDINARY_FOLDER || 'tarmuz/uploads';
      const subFolder = path.basename(path.dirname(absPath));
      const folder = `${baseFolder}/${subFolder}`;
      const nameNoExt = path.basename(f.filename, path.extname(f.filename));
      const publicId = `${folder}/${nameNoExt}`;
      try {
        const result = await cloudinary.uploader.upload(absPath, {
          public_id: publicId,
          overwrite: true,
          resource_type: 'image',
        });
        uploaded.push({
          secure_url: result.secure_url,
          url: result.secure_url,
          filename: result.public_id,
          original_filename: f.originalname,
          size: f.size,
          format: result.format,
          width: result.width,
          height: result.height,
        });
      } finally {
        await unlinkSafe(absPath);
      }
    }
    if (uploaded.length === 0) {
      return res.status(400).json({ msg: 'All files were invalid' });
    }
    res.json({ msg: 'Files uploaded successfully', files: uploaded });
  } catch (error) {
    res.status(500).json({ msg: error.message });
  }
});

module.exports = router;
