require('dotenv').config();
const mongoose = require('mongoose');
const readline = require('readline');
const Content = require('../src/models/Content');

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
const ask = (q) => new Promise((r) => rl.question(q, r));

async function main() {
  try {
    const uri = process.env.MONGO_URI;
    if (!uri) {
      console.error('❌ MONGO_URI is missing. Put your Atlas URI into tramz-backend/.env');
      process.exit(1);
    }
    console.log('📡 Connecting to DB ...');
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 10000, dbName: process.env.MONGO_DB_NAME });
    console.log('✅ Connected');

    const docs = await Content.find({}, { type: 1, title_ar: 1, title_en: 1 }).lean();
    console.log(`\n📊 Contents (${docs.length})`);
    for (const d of docs) {
      console.log(` - type: ${d.type} | title_ar: ${d.title_ar || ''} | title_en: ${d.title_en || ''}`);
    }

    const required = ['hero', 'about', 'services', 'contact'];
    const existing = new Set(docs.map(d => d.type));
    const missing = required.filter(t => !existing.has(t));

    if (missing.length === 0) {
      console.log('\n✅ All required types exist: hero, about, services, contact');
    } else {
      console.log(`\n⚠️ Missing types: ${missing.join(', ')}`);
      const doUpsert = (await ask('Upsert placeholders for missing types? (y/n): ')).trim().toLowerCase();
      if (doUpsert === 'y' || doUpsert === 'yes') {
        for (const t of missing) {
          const payload = {
            type: t,
            title_ar: t,
            title_en: t,
            description_ar: '',
            description_en: '',
            isActive: true,
            updatedAt: new Date(),
          };
          await Content.updateOne({ type: t }, { $set: payload }, { upsert: true });
          console.log(`   ✅ Upserted placeholder for ${t}`);
        }
        console.log('\n🎉 Done. Try your site again.');
      }
    }
  } catch (e) {
    console.error('❌ Error:', e.message);
    process.exitCode = 1;
  } finally {
    try { await mongoose.disconnect(); } catch {}
    rl.close();
  }
}

main();
