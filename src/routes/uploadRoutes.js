const express = require('express');
const fs = require('fs');
const path = require('path');
const router = express.Router();
const upload = require('../middlewares/uploadMiddleware');
const { protect } = require('../middlewares/authMiddleware');

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
    const filePath = req.file.path.replace(/\\/g, '/'); // Normalize path for Windows
    res.json({
      msg: 'File uploaded successfully',
      filePath,
      filename: req.file.filename,
      originalName: req.file.originalname,
      size: req.file.size
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
    const safe = [];
    for (const f of req.files) {
      const absPath = path.resolve(f.path);
      const detected = await detectImageMime(absPath);
      if (!detected || detected !== f.mimetype) {
        await unlinkSafe(absPath);
        continue; // skip unsafe file
      }
      safe.push({
        filePath: f.path.replace(/\\/g, '/'),
        filename: f.filename,
        originalName: f.originalname,
        size: f.size
      });
    }
    if (safe.length === 0) {
      return res.status(400).json({ msg: 'All files were invalid' });
    }
    res.json({ msg: 'Files uploaded successfully', files: safe });
  } catch (error) {
    res.status(500).json({ msg: error.message });
  }
});

module.exports = router;
