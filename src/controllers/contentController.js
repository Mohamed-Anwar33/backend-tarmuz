const Content = require('../models/Content');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v2: cloudinary } = require('cloudinary');

// Configure Cloudinary (supports single URL or individual vars)
if (process.env.CLOUDINARY_URL) {
  cloudinary.config({ secure: true });
} else {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true,
  });
}

const unlinkSafe = async (p) => { 
  try { await fs.promises.unlink(p); } catch (_) {} 
};

const detectImageMime = async (filePath) => {
  const fh = await fs.promises.open(filePath, 'r');
  try {
    const { buffer } = await fh.read(Buffer.alloc(12), 0, 12, 0);
    // JPEG: FF D8 FF
    if (buffer[0] === 0xFF && buffer[1] === 0xD8 && buffer[2] === 0xFF) return 'image/jpeg';
    // PNG: 89 50 4E 47 0D 0A 1A 0A
    if (
      buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4E && buffer[3] === 0x47 &&
      buffer[4] === 0x0D && buffer[5] === 0x0A && buffer[6] === 0x1A && buffer[7] === 0x0A
    ) return 'image/png';
    // GIF: 'GIF87a' or 'GIF89a'
    const sig6 = buffer.slice(0, 6).toString('ascii');
    if (sig6 === 'GIF87a' || sig6 === 'GIF89a') return 'image/gif';
    // WEBP: 'RIFF'....'WEBP'
    const riff = buffer.slice(0, 4).toString('ascii');
    const webp = buffer.slice(8, 12).toString('ascii');
    if (riff === 'RIFF' && webp === 'WEBP') return 'image/webp';
    return null;
  } finally {
    await fh.close();
  }
};

// Get all content sections
exports.getAllContent = async (req, res) => {
  try {
    const content = await Content.find();
    res.json(content);
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
};

// Get content by type
exports.getContent = async (req, res) => {
  const { type } = req.params;
  try {
    const content = await Content.findOne({ type });
    if (!content) return res.status(404).json({ msg: 'Content not found' });
    res.json(content);
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
};

// Update content by type
exports.updateContent = async (req, res) => {
  const { type } = req.params;
  try {
    const updateData = { ...req.body, updatedAt: Date.now() };
    
    // Handle multiple image uploads to Cloudinary
    if (req.files && req.files.length > 0) {
      const uploadedUrls = [];
      const baseFolder = process.env.CLOUDINARY_FOLDER || 'tarmuz/uploads';
      
      for (const file of req.files) {
        const absPath = path.resolve(file.path);
        const detected = await detectImageMime(absPath);
        
        if (!detected || detected !== file.mimetype) {
          await unlinkSafe(absPath);
          continue; // skip unsafe file
        }
        
        const subFolder = 'content';
        const folder = `${baseFolder}/${subFolder}`;
        const nameNoExt = path.basename(file.filename, path.extname(file.filename));
        const publicId = `${folder}/${nameNoExt}`;
        
        try {
          const result = await cloudinary.uploader.upload(absPath, {
            public_id: publicId,
            overwrite: true,
            resource_type: 'image',
          });
          uploadedUrls.push(result.secure_url);
        } catch (uploadErr) {
          console.error('Cloudinary upload error:', uploadErr);
        } finally {
          await unlinkSafe(absPath);
        }
      }
      
      if (uploadedUrls.length > 0) {
        updateData.images = uploadedUrls;
        // Also set the first image as the main image
        if (!updateData.image) {
          updateData.image = uploadedUrls[0];
        }
      }
    }
    
    // Handle single image upload to Cloudinary
    if (req.file) {
      const absPath = path.resolve(req.file.path);
      const detected = await detectImageMime(absPath);
      
      if (detected && detected === req.file.mimetype) {
        const baseFolder = process.env.CLOUDINARY_FOLDER || 'tarmuz/uploads';
        const subFolder = 'content';
        const folder = `${baseFolder}/${subFolder}`;
        const nameNoExt = path.basename(req.file.filename, path.extname(req.file.filename));
        const publicId = `${folder}/${nameNoExt}`;
        
        try {
          const result = await cloudinary.uploader.upload(absPath, {
            public_id: publicId,
            overwrite: true,
            resource_type: 'image',
          });
          updateData.image = result.secure_url;
        } catch (uploadErr) {
          console.error('Cloudinary upload error:', uploadErr);
        }
      }
      
      await unlinkSafe(absPath);
    }
    
    const content = await Content.findOneAndUpdate(
      { type }, 
      updateData, 
      { new: true, upsert: true, runValidators: true }
    );
    res.json(content);
  } catch (err) {
    if (err.name === 'ValidationError') {
      const errors = Object.values(err.errors).map(e => e.message);
      return res.status(400).json({ msg: errors.join(', ') });
    }
    res.status(500).json({ msg: err.message });
  }
};

// Create new content section
exports.createContent = async (req, res) => {
  try {
    const contentData = { ...req.body };
    
    // Handle multiple image uploads to Cloudinary
    if (req.files && req.files.length > 0) {
      const uploadedUrls = [];
      const baseFolder = process.env.CLOUDINARY_FOLDER || 'tarmuz/uploads';
      
      for (const file of req.files) {
        const absPath = path.resolve(file.path);
        const detected = await detectImageMime(absPath);
        
        if (!detected || detected !== file.mimetype) {
          await unlinkSafe(absPath);
          continue; // skip unsafe file
        }
        
        const subFolder = 'content';
        const folder = `${baseFolder}/${subFolder}`;
        const nameNoExt = path.basename(file.filename, path.extname(file.filename));
        const publicId = `${folder}/${nameNoExt}`;
        
        try {
          const result = await cloudinary.uploader.upload(absPath, {
            public_id: publicId,
            overwrite: true,
            resource_type: 'image',
          });
          uploadedUrls.push(result.secure_url);
        } catch (uploadErr) {
          console.error('Cloudinary upload error:', uploadErr);
        } finally {
          await unlinkSafe(absPath);
        }
      }
      
      if (uploadedUrls.length > 0) {
        contentData.images = uploadedUrls;
        // Also set the first image as the main image
        if (!contentData.image) {
          contentData.image = uploadedUrls[0];
        }
      }
    }
    
    // Handle single image upload to Cloudinary
    if (req.file) {
      const absPath = path.resolve(req.file.path);
      const detected = await detectImageMime(absPath);
      
      if (detected && detected === req.file.mimetype) {
        const baseFolder = process.env.CLOUDINARY_FOLDER || 'tarmuz/uploads';
        const subFolder = 'content';
        const folder = `${baseFolder}/${subFolder}`;
        const nameNoExt = path.basename(req.file.filename, path.extname(req.file.filename));
        const publicId = `${folder}/${nameNoExt}`;
        
        try {
          const result = await cloudinary.uploader.upload(absPath, {
            public_id: publicId,
            overwrite: true,
            resource_type: 'image',
          });
          contentData.image = result.secure_url;
        } catch (uploadErr) {
          console.error('Cloudinary upload error:', uploadErr);
        }
      }
      
      await unlinkSafe(absPath);
    }
    
    const content = new Content(contentData);
    await content.save();
    res.status(201).json(content);
  } catch (err) {
    if (err.name === 'ValidationError') {
      const errors = Object.values(err.errors).map(e => e.message);
      return res.status(400).json({ msg: errors.join(', ') });
    }
    res.status(400).json({ msg: err.message });
  }
};

// Delete content section
exports.deleteContent = async (req, res) => {
  try {
    const content = await Content.findByIdAndDelete(req.params.id);
    if (!content) {
      return res.status(404).json({ msg: 'Content not found' });
    }
    res.json({ msg: 'Content deleted successfully' });
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
};