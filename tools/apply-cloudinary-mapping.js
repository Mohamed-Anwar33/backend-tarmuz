/*
Apply Cloudinary mapping to existing DB records.

Usage (Windows PowerShell):
  $env:MONGO_URI = "mongodb+srv://..."
  node tools/apply-cloudinary-mapping.js --map "..\\..\\tarmuz-visual-opus\\cloudinary-mapping.json"

Mapping JSON shape (from scripts/upload-to-cloudinary.mjs):
  {
    "تصميم داخلي/images-abc.webp": "https://res.cloudinary.com/.../images-abc.webp",
    "general/file-123.jpg": "https://res.cloudinary.com/.../file-123.jpg",
    ...
  }

This script updates:
- Project.cover (String)
- Project.images (String[])
- Content.image (String)
- Settings.logoUrl, Settings.logoUrlScrolled (String)

Notes:
- If a field already has an absolute URL (http/https), it is left unchanged.
- For DB values like "/uploads/تصميم داخلي/..", the script strips leading "/uploads/" and looks up the remainder in the mapping.
*/

const fs = require('fs');
const fsp = require('fs/promises');
const path = require('path');
const mongoose = require('mongoose');
require('dotenv').config();

const Project = require('../src/models/Project');
const Content = require('../src/models/Content');
const Settings = require('../src/models/Settings');

function parseArgs() {
  const args = process.argv.slice(2);
  const out = { map: '' };
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--map') out.map = args[++i];
  }
  return out;
}

function isAbsoluteUrl(u = '') {
  return /^https?:\/\//i.test(String(u));
}

function normalizeKeyFromDb(value = '') {
  if (!value) return '';
  let v = String(value).trim();
  try { v = decodeURI(v); } catch {}
  v = v.replace(/\\/g, '/');
  v = v.replace(/^\/+/, ''); // remove leading '/'
  if (v.toLowerCase().startsWith('uploads/')) v = v.slice(8);
  return v;
}

function mapValue(mapping, value) {
  if (!value) return value;
  if (isAbsoluteUrl(value)) return value;
  const key = normalizeKeyFromDb(value);
  return mapping[key] || value;
}

function mapArray(mapping, arr) {
  if (!Array.isArray(arr)) return arr;
  return arr.map((v) => mapValue(mapping, v));
}

async function main() {
  const { map } = parseArgs();
  if (!map) {
    console.error('Usage: node tools/apply-cloudinary-mapping.js --map <mapping.json>');
    process.exit(1);
  }
  const mapPath = path.resolve(map);
  if (!fs.existsSync(mapPath)) {
    console.error('Mapping file not found:', mapPath);
    process.exit(1);
  }

  const mapping = JSON.parse(await fsp.readFile(mapPath, 'utf8'));
  console.log('[migrate] Loaded mapping entries =', Object.keys(mapping).length);

  const mongoUri = process.env.MONGO_URI;
  if (!mongoUri) {
    console.error('MONGO_URI env var is required');
    process.exit(1);
  }
  await mongoose.connect(mongoUri);
  console.log('[migrate] Connected to MongoDB');

  // Projects
  const projects = await Project.find();
  let projUpdated = 0;
  for (const p of projects) {
    const newCover = mapValue(mapping, p.cover);
    const newImages = mapArray(mapping, p.images);
    const changed = (newCover !== p.cover) || JSON.stringify(newImages) !== JSON.stringify(p.images);
    if (changed) {
      p.cover = newCover;
      p.images = newImages;
      await p.save();
      projUpdated++;
    }
  }
  console.log(`[migrate] Projects updated: ${projUpdated}/${projects.length}`);

  // Content (we only touch .image top-level if present)
  const contents = await Content.find();
  let contentUpdated = 0;
  for (const c of contents) {
    const newImage = mapValue(mapping, c.image);
    if (newImage !== c.image) {
      c.image = newImage;
      await c.save();
      contentUpdated++;
    }
  }
  console.log(`[migrate] Content docs updated: ${contentUpdated}/${contents.length}`);

  // Settings (logo fields)
  const settingsDocs = await Settings.find();
  let settingsUpdated = 0;
  for (const s of settingsDocs) {
    const newLogo = mapValue(mapping, s.logoUrl);
    const newLogoScrolled = mapValue(mapping, s.logoUrlScrolled);
    const changed = (newLogo !== s.logoUrl) || (newLogoScrolled !== s.logoUrlScrolled);
    if (changed) {
      s.logoUrl = newLogo;
      s.logoUrlScrolled = newLogoScrolled;
      await s.save();
      settingsUpdated++;
    }
  }
  console.log(`[migrate] Settings docs updated: ${settingsUpdated}/${settingsDocs.length}`);

  await mongoose.disconnect();
  console.log('[migrate] Done.');
}

main().catch((e) => { console.error('[migrate] Fatal:', e); process.exit(1); });
