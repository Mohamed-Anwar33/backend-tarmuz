require('dotenv').config();
const mongoose = require('mongoose');
const readline = require('readline');

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
const question = (q) => new Promise((res) => rl.question(q, res));

async function migrate() {
  let srcConn, dstConn;
  try {
    console.log('🚀 Generic Mongo Migration (Local -> Atlas)');
    console.log('==========================================\n');

    // Prompt user for all connection details
    const localUriInput = await question('Local Mongo URI (default: mongodb://127.0.0.1:27017): ');
    const localUri = (localUriInput && localUriInput.trim()) ? localUriInput.trim() : 'mongodb://127.0.0.1:27017';
    const localDbNameInput = await question('Local DB name as seen in Compass (REQUIRED): ');
    const localDbName = (localDbNameInput || '').trim();
    if (!localDbName) {
      console.error('❌ Local DB name is required.');
      process.exit(1);
    }

    const atlasUri = (await question('Atlas connection string (mongodb+srv://...): ')).trim();
    if (!atlasUri || !atlasUri.startsWith('mongodb')) {
      console.error('❌ Invalid Atlas connection string');
      process.exit(1);
    }
    const atlasDbNameInput = await question('Atlas DB name (default: tarmuz): ');
    const atlasDbName = (atlasDbNameInput && atlasDbNameInput.trim()) ? atlasDbNameInput.trim() : 'tarmuz';

    console.log('\n📡 Connecting to source (local) ...');
    srcConn = await mongoose.createConnection(localUri, { serverSelectionTimeoutMS: 5000, dbName: localDbName }).asPromise();
    console.log(`✅ Connected to local DB: ${localDbName}`);

    console.log('\n📡 Connecting to destination (Atlas) ...');
    dstConn = await mongoose.createConnection(atlasUri, { serverSelectionTimeoutMS: 10000, dbName: atlasDbName }).asPromise();
    console.log(`✅ Connected to Atlas DB: ${atlasDbName}`);

    const dropDst = (await question('\nDrop destination DB before copy? This will DELETE all destination data. (y/n): ')).trim().toLowerCase();
    if (dropDst === 'y' || dropDst === 'yes') {
      console.log(`\n🗑️  Dropping destination DB "${atlasDbName}" ...`);
      try {
        await dstConn.db.dropDatabase();
        console.log('✅ Destination DB dropped');
      } catch (e) {
        console.warn(`⚠️  dropDatabase not permitted or failed: ${e.message}`);
        console.log('↪️  Falling back to clearing all destination collections via deleteMany...');
        const dstCollectionsInfo = await dstConn.db.listCollections().toArray();
        const dstCollections = dstCollectionsInfo
          .map(c => c.name)
          .filter(name => !name.startsWith('system.'));
        for (const name of dstCollections) {
          try {
            const col = dstConn.db.collection(name);
            const { deletedCount } = await col.deleteMany({});
            console.log(`   ✅ Cleared collection ${name} (deleted ${deletedCount})`);
          } catch (err) {
            console.warn(`   ⚠️  Failed to clear ${name}: ${err.message}`);
          }
        }
        console.log('✅ Destination collections cleared');
      }
    }

    console.log('\n📚 Listing source collections ...');
    const srcCollectionsInfo = await srcConn.db.listCollections().toArray();
    const srcCollections = srcCollectionsInfo
      .map(c => c.name)
      .filter(name => !name.startsWith('system.'));

    if (srcCollections.length === 0) {
      console.log('⚠️  No collections found in source DB. Nothing to migrate.');
      process.exit(0);
    }

    console.log(`Found ${srcCollections.length} collections: ${srcCollections.join(', ')}`);

    let totalDocs = 0;
    for (const name of srcCollections) {
      console.log(`\n➡️  Migrating collection: ${name}`);
      const srcCol = srcConn.db.collection(name);
      const dstCol = dstConn.db.collection(name);

      const docs = await srcCol.find({}).toArray();
      console.log(`   📥 Read ${docs.length} documents from source`);

      if (docs.length === 0) {
        console.log('   ↪️  Skipped (empty)');
        continue;
      }

      // Remove _id and __v to avoid conflicts; let Atlas generate new _id
      const cleaned = docs.map(({ _id, __v, ...rest }) => rest);

      try {
        await dstCol.insertMany(cleaned, { ordered: false });
        console.log(`   📤 Inserted ${cleaned.length} into destination`);
        totalDocs += cleaned.length;
      } catch (err) {
        console.error(`   ❌ Insert error on ${name}:`, err.message);
        // Fallback: try upserting one by one using heuristic keys
        // This is optional; keep minimal to avoid long runs. You can enhance if needed.
      }
    }

    console.log(`\n🎉 Migration finished. Total inserted docs: ${totalDocs}`);

    // Save helpful .env.atlas
    const fs = require('fs');
    const uriHasDbPath = /\/\w+(\?|$)/.test(atlasUri.split('?')[0]);
    const uriWithDb = uriHasDbPath ? atlasUri : (atlasUri.replace(/\/?$/, '/') + atlasDbName + (atlasUri.includes('?') ? '' : ''));
    const envContent = `# MongoDB Atlas Connection (generated by migrate-generic-atlas.js)\nMONGO_URI=${uriWithDb}\nMONGO_DB_NAME=${atlasDbName}\n# LOCAL_MONGO_URI=${localUri}\n# LOCAL_DB_NAME=${localDbName}\n`;
    fs.writeFileSync('.env.atlas', envContent);
    console.log('\n📝 Saved connection info to .env.atlas');
  } catch (err) {
    console.error('\n❌ Migration failed:', err.message);
    process.exitCode = 1;
  } finally {
    try { if (srcConn) await srcConn.close(); } catch {}
    try { if (dstConn) await dstConn.close(); } catch {}
    rl.close();
  }
}

migrate();
