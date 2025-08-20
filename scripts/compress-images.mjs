#!/usr/bin/env node
/*
Compress images while maintaining quality using sharp

Usage:
  node scripts/compress-images.mjs --src "./uploads" --out "./uploads-compressed"
*/

import path from 'node:path';
import fs from 'node:fs/promises';
import fg from 'fast-glob';
import sharp from 'sharp';
import process from 'node:process';

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
    out: args.get('out') || './uploads-compressed',
  };
}

async function ensureDir(dirPath) {
  await fs.mkdir(dirPath, { recursive: true });
}

async function compressImage(inputPath, outputPath) {
  const ext = path.extname(inputPath).toLowerCase();
  
  try {
    let pipeline = sharp(inputPath);
    
    // Get image info
    const metadata = await pipeline.metadata();
    
    // Resize if too large (max 1920px width)
    if (metadata.width > 1920) {
      pipeline = pipeline.resize(1920, null, {
        withoutEnlargement: true,
        fit: 'inside'
      });
    }
    
    // Apply compression based on format
    if (ext === '.jpg' || ext === '.jpeg') {
      pipeline = pipeline.jpeg({ quality: 85, progressive: true });
    } else if (ext === '.png') {
      pipeline = pipeline.png({ quality: 85, compressionLevel: 8 });
    } else if (ext === '.webp') {
      pipeline = pipeline.webp({ quality: 85 });
    }
    
    await pipeline.toFile(outputPath);
    return true;
  } catch (error) {
    console.error(`Failed to compress ${inputPath}:`, error.message);
    return false;
  }
}

async function main() {
  const { src, out } = parseArgs();
  if (!src) {
    console.error('[compress] --src is required');
    process.exit(1);
  }

  const srcAbs = path.resolve(src);
  const outAbs = path.resolve(out);
  
  console.log(`[compress] Scanning: ${srcAbs}`);
  console.log(`[compress] Output: ${outAbs}`);

  const patterns = [
    '**/*.png', '**/*.jpg', '**/*.jpeg', '**/*.webp', '**/*.gif', '**/*.bmp'
  ];
  const files = await fg(patterns, { cwd: srcAbs, onlyFiles: true, dot: false });
  console.log(`[compress] Found ${files.length} files`);

  let compressed = 0;
  let totalSizeBefore = 0;
  let totalSizeAfter = 0;

  for (const rel of files) {
    const inputPath = path.join(srcAbs, rel);
    const outputPath = path.join(outAbs, rel);
    
    // Ensure output directory exists
    await ensureDir(path.dirname(outputPath));
    
    // Get original size
    const statsBefore = await fs.stat(inputPath);
    totalSizeBefore += statsBefore.size;
    
    const success = await compressImage(inputPath, outputPath);
    
    if (success) {
      // Get compressed size
      const statsAfter = await fs.stat(outputPath);
      totalSizeAfter += statsAfter.size;
      
      compressed++;
      const reduction = ((statsBefore.size - statsAfter.size) / statsBefore.size * 100).toFixed(1);
      
      if (compressed % 10 === 0) {
        console.log(`[compress] Processed ${compressed}/${files.length} (${reduction}% reduction for ${rel})`);
      }
    }
  }

  const totalReduction = ((totalSizeBefore - totalSizeAfter) / totalSizeBefore * 100).toFixed(1);
  const sizeMB = (size) => (size / 1024 / 1024).toFixed(2);
  
  console.log(`[compress] Done!`);
  console.log(`[compress] Compressed: ${compressed}/${files.length} files`);
  console.log(`[compress] Size before: ${sizeMB(totalSizeBefore)} MB`);
  console.log(`[compress] Size after: ${sizeMB(totalSizeAfter)} MB`);
  console.log(`[compress] Total reduction: ${totalReduction}%`);
}

main().catch((e) => {
  console.error('[compress] Fatal:', e);
  process.exit(1);
});
