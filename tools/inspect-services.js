require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('../src/config/db');
const Content = require('../src/models/Content');

(async () => {
  try {
    await connectDB();
    const conn = mongoose.connection;
    const dbName = conn && (conn.name || (conn.db && conn.db.databaseName));
    console.log(`Connected to MongoDB. Database name: ${dbName || 'unknown'}`);

    const servicesDoc = await Content.findOne({ type: 'services' }).lean();
    if (!servicesDoc) {
      console.log('No services content found (type="services").');
    } else {
      const services = Array.isArray(servicesDoc.services) ? servicesDoc.services : [];
      console.log(`Services doc _id: ${servicesDoc._id}`);
      console.log(`Services count: ${services.length}`);
      if (services.length) {
        for (const [i, s] of services.entries()) {
          console.log(`${i + 1}. ${s.name_ar || ''} | ${s.name_en || ''}`);
        }
      }
    }
  } catch (err) {
    console.error('Error inspecting services:', err);
    process.exitCode = 1;
  } finally {
    await mongoose.connection.close();
  }
})();
