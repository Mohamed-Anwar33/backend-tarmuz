const mongoose = require('mongoose');
require('dotenv').config();

async function checkAllImages() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    const tarmuzDb = mongoose.connection.client.db('tarmuz');
    
    // Check Projects (already fixed)
    const projectsCollection = tarmuzDb.collection('projects');
    const projects = await projectsCollection.find({}).toArray();
    console.log(`\n📋 PROJECTS: ${projects.length} found`);
    
    // Check Settings (logo)
    const settingsCollection = tarmuzDb.collection('settings');
    const settings = await settingsCollection.find({}).toArray();
    console.log(`\n🎨 SETTINGS (Logo): ${settings.length} found`);
    settings.forEach(setting => {
      if (setting.logoUrl) {
        console.log(`  Logo URL: ${setting.logoUrl}`);
        if (setting.logoUrl.includes('v1755647000')) {
          console.log(`  ❌ OLD VERSION DETECTED in logo`);
        }
      }
      if (setting.logoUrlScrolled) {
        console.log(`  Logo Scrolled URL: ${setting.logoUrlScrolled}`);
        if (setting.logoUrlScrolled.includes('v1755647000')) {
          console.log(`  ❌ OLD VERSION DETECTED in logoScrolled`);
        }
      }
    });

    // Check Content (hero section)
    const contentCollection = tarmuzDb.collection('contents');
    const contents = await contentCollection.find({}).toArray();
    console.log(`\n🖼️ CONTENT (Hero): ${contents.length} found`);
    contents.forEach(content => {
      if (content.image) {
        console.log(`  Content Image: ${content.image}`);
        if (content.image.includes('v1755647000')) {
          console.log(`  ❌ OLD VERSION DETECTED in content`);
        }
      }
    });

    // Check Clients (About Us)
    const clientsCollection = tarmuzDb.collection('clients');
    const clients = await clientsCollection.find({}).toArray();
    console.log(`\n👥 CLIENTS (About Us): ${clients.length} found`);
    clients.forEach(client => {
      if (client.logo) {
        console.log(`  Client Logo: ${client.logo}`);
        if (client.logo.includes('v1755647000')) {
          console.log(`  ❌ OLD VERSION DETECTED in client logo`);
        }
      }
    });

    // Check for any other collections with images
    const collections = await tarmuzDb.listCollections().toArray();
    console.log(`\n📚 All collections in database:`);
    collections.forEach(col => {
      console.log(`  - ${col.name}`);
    });

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
  }
}

checkAllImages();
