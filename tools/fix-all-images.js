const mongoose = require('mongoose');
const fs = require('fs');
require('dotenv').config();

async function fixAllImages() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    // Read the Cloudinary mapping
    const mapping = JSON.parse(fs.readFileSync('./cloudinary-mapping.json', 'utf-8'));
    console.log(`Loaded ${Object.keys(mapping).length} Cloudinary URLs`);

    const tarmuzDb = mongoose.connection.client.db('tarmuz');
    
    // Fix Settings (Logo)
    console.log('\n🎨 Fixing Settings (Logo)...');
    const settingsCollection = tarmuzDb.collection('settings');
    const settings = await settingsCollection.find({}).toArray();
    
    for (const setting of settings) {
      const updates = {};
      let hasUpdates = false;

      // Fix logoUrl
      if (setting.logoUrl && setting.logoUrl.startsWith('uploads/')) {
        const relativePath = setting.logoUrl.replace('uploads/', '');
        if (mapping[relativePath]) {
          updates.logoUrl = mapping[relativePath];
          hasUpdates = true;
          console.log(`✅ Fixed logo: ${relativePath}`);
        } else {
          console.log(`❌ Logo not found in mapping: ${relativePath}`);
        }
      }

      // Fix logoUrlScrolled
      if (setting.logoUrlScrolled && setting.logoUrlScrolled.startsWith('uploads/')) {
        const relativePath = setting.logoUrlScrolled.replace('uploads/', '');
        if (mapping[relativePath]) {
          updates.logoUrlScrolled = mapping[relativePath];
          hasUpdates = true;
          console.log(`✅ Fixed scrolled logo: ${relativePath}`);
        } else {
          console.log(`❌ Scrolled logo not found in mapping: ${relativePath}`);
        }
      }

      if (hasUpdates) {
        await settingsCollection.updateOne(
          { _id: setting._id },
          { $set: updates }
        );
        console.log(`Updated settings`);
      }
    }

    // Fix Content (Hero Section)
    console.log('\n🖼️ Fixing Content (Hero Section)...');
    const contentCollection = tarmuzDb.collection('contents');
    const contents = await contentCollection.find({}).toArray();
    
    for (const content of contents) {
      const updates = {};
      let hasUpdates = false;

      if (content.image) {
        // Handle comma-separated images
        const imageUrls = content.image.split(',').map(url => url.trim());
        const updatedUrls = imageUrls.map(imageUrl => {
          if (imageUrl.startsWith('uploads/')) {
            const relativePath = imageUrl.replace('uploads/', '');
            if (mapping[relativePath]) {
              console.log(`✅ Fixed content image: ${relativePath}`);
              return mapping[relativePath];
            } else {
              console.log(`❌ Content image not found in mapping: ${relativePath}`);
              return imageUrl;
            }
          }
          return imageUrl;
        });

        const newImageString = updatedUrls.join(',');
        if (newImageString !== content.image) {
          updates.image = newImageString;
          hasUpdates = true;
        }
      }

      if (hasUpdates) {
        await contentCollection.updateOne(
          { _id: content._id },
          { $set: updates }
        );
        console.log(`Updated content: ${content.title_ar || content.title_en || content._id}`);
      }
    }

    console.log('\n✅ All images fixed!');

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
  }
}

fixAllImages();
