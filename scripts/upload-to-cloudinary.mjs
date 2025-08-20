#!/usr/bin/env node
/*
Bulk upload images to Cloudinary and emit a JSON mapping.

Usage:
  # Set env vars (Netlify/Windows PowerShell examples)
  $env:CLOUDINARY_CLOUD_NAME = "your_cloud_name"
  $env:CLOUDINARY_API_KEY = "your_api_key"
  $env:CLOUDINARY_API_SECRET = "your_api_secret"
  # Optional base folder inside Cloudinary
  $env:CLOUDINARY_FOLDER = "tarmuz/uploads"

  # Run (sourceDir is required)
  node scripts/upload-to-cloudinary.mjs --src "./uploads" --out "./cloudinary-mapping.json"

Notes:
- The script finds common image extensions recursively under --src.
- The JSON mapping shape: { "relative/path/to/file.ext": "https://res.cloudinary.com/..." }
- You can use the mapping to update your backend records from local paths to Cloudinary URLs.
*/

import path from 'node:path';
import fs from 'node:fs/promises';
import fg from 'fast-glob';
import { fileURLToPath } from 'node:url';
import process from 'node:process';
import { v2 as cloudinary } from 'cloudinary';

function parseArgs() {
  const args = new Map();
  const argv = process.argv.slice(2);
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--src') args.set('src', argv[++i]);
    else if (a === '--out') args.set('out', argv[++i]);
  }
  return {
    src: args.get('src') || '',
    out: args.get('out') || './cloudinary-mapping.json',
  };
}

async function ensureFileDir(filePath) {
  const dir = path.dirname(filePath);
  await fs.mkdir(dir, { recursive: true });
}

async function main() {
  const { src, out } = parseArgs();
  if (!src) {
    console.error('[cloudinary] --src is required');
    process.exit(1);
  }

  const C_NAME = process.env.CLOUDINARY_CLOUD_NAME || '';
  const C_KEY = process.env.CLOUDINARY_API_KEY || '';
  const C_SECRET = process.env.CLOUDINARY_API_SECRET || '';
  const C_FOLDER = process.env.CLOUDINARY_FOLDER || 'tarmuz/uploads';

  if (!C_NAME || !C_KEY || !C_SECRET) {
    console.error('[cloudinary] Missing CLOUDINARY_* env vars');
    process.exit(1);
  }

  cloudinary.config({ cloud_name: C_NAME, api_key: C_KEY, api_secret: C_SECRET });

  const srcAbs = path.resolve(src);
  const cwd = process.cwd();
  console.log(`[cloudinary] Scanning: ${srcAbs}`);

  const patterns = [
    '**/*.png', '**/*.jpg', '**/*.jpeg', '**/*.webp', '**/*.gif', '**/*.svg', '**/*.bmp'
  ];
  const files = await fg(patterns, { cwd: srcAbs, onlyFiles: true, dot: false });
  console.log(`[cloudinary] Found ${files.length} files`);

  const mapping = {};
  let uploaded = 0;
  for (const rel of files) {
    const abs = path.join(srcAbs, rel);
    // Normalize Windows backslashes
    const relPosix = rel.split('\\').join('/');
    // Create a public_id based on relative path without extension
    const ext = path.extname(relPosix);
    const baseNoExt = relPosix.slice(0, -ext.length);
    const publicId = `${C_FOLDER}/${baseNoExt}`;

    try {
      const res = await cloudinary.uploader.upload(abs, {
        folder: undefined, // included in public_id
        public_id: publicId,
        overwrite: true,
        resource_type: 'image',
      });
      mapping[relPosix] = res.secure_url;
      uploaded++;
      if (uploaded % 25 === 0) {
        console.log(`[cloudinary] Uploaded ${uploaded}/${files.length} ...`);
      }
    } catch (err) {
      console.error(`[cloudinary] Failed: ${relPosix}`, err?.message || err);
    }
  }

  await ensureFileDir(path.resolve(out));
  await fs.writeFile(out, JSON.stringify(mapping, null, 2), 'utf-8');
  console.log(`[cloudinary] Done. Uploaded: ${uploaded}/${files.length}. Mapping written to ${out}`);
}

main().catch((e) => {
  console.error('[cloudinary] Fatal:', e);
  process.exit(1);
});
