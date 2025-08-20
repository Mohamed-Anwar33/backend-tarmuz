const mongoose = require('mongoose');
const fs = require('fs');
const { v2: cloudinary } = require('cloudinary');
require('dotenv').config();

// Configure Cloudinary
cloudinary.config({
  cloudinary_url: process.env.CLOUDINARY_URL || 'cloudinary://693958361264978:ouRfBFDF-05AFts5VNF-vExDgVI@dvhse3qgv'
});

async function main() {
  try {
    // Test Cloudinary connection
    console.log('Testing Cloudinary connection...');
    const cloudinaryInfo = await cloudinary.api.ping();
    console.log('✅ Cloudinary connected successfully:', cloudinaryInfo);
    console.log('Cloud name:', cloudinary.config().cloud_name);
    
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    // Read the Cloudinary mapping
    const mapping = JSON.parse(fs.readFileSync('./cloudinary-mapping.json', 'utf-8'));
    console.log(`Loaded ${Object.keys(mapping).length} Cloudinary URLs`);

    // Get the raw collection to bypass Mongoose - use tarmuz database
    const db = mongoose.connection.db;
    console.log('Current database:', db.databaseName);
    
    // Switch to tarmuz database
    const tarmuzDb = mongoose.connection.client.db('tarmuz');
    const projectsCollection = tarmuzDb.collection('projects');

    // Get all projects
    const projects = await projectsCollection.find({}).toArray();
    console.log(`Found ${projects.length} projects in database`);

    let updated = 0;
    for (const project of projects) {
      const updates = {};
      let hasUpdates = false;
      
      // Update images array
      if (project.images && Array.isArray(project.images)) {
        const updatedImages = project.images.map(imagePath => {
          // Handle both /uploads/ paths and existing cloudinary URLs
          if (imagePath.startsWith('/uploads/')) {
            // Remove /uploads/ prefix to match mapping keys
            const relativePath = imagePath.replace('/uploads/', '');
            if (mapping[relativePath]) {
              console.log(`Mapping found for: ${relativePath}`);
              return mapping[relativePath];
            }
          } else if (imagePath.includes('cloudinary.com') && imagePath.includes('v1755647000')) {
            // This is an old generated cloudinary URL, try to find the real one
            const pathParts = imagePath.split('/');
            const filename = pathParts[pathParts.length - 1];
            const category = decodeURIComponent(pathParts[pathParts.length - 2]);
            const relativePath = `${category}/${filename}`;
            if (mapping[relativePath]) {
              console.log(`Replacing old cloudinary URL for: ${relativePath}`);
              return mapping[relativePath];
            }
          }
          return imagePath;
        });
        
        // Check if any images were updated
        if (JSON.stringify(updatedImages) !== JSON.stringify(project.images)) {
          updates.images = updatedImages;
          hasUpdates = true;
        }
      }
      
      // Update cover image
      if (project.cover) {
        if (project.cover.startsWith('/uploads/')) {
          const relativePath = project.cover.replace('/uploads/', '');
          if (mapping[relativePath]) {
            updates.cover = mapping[relativePath];
            hasUpdates = true;
          }
        } else if (project.cover.includes('cloudinary.com') && project.cover.includes('v1755647000')) {
          // This is an old generated cloudinary URL, try to find the real one
          const pathParts = project.cover.split('/');
          const filename = pathParts[pathParts.length - 1];
          const category = decodeURIComponent(pathParts[pathParts.length - 2]);
          const relativePath = `${category}/${filename}`;
          if (mapping[relativePath]) {
            console.log(`Replacing old cloudinary cover URL for: ${relativePath}`);
            updates.cover = mapping[relativePath];
            hasUpdates = true;
          }
        }
      }
      
      if (hasUpdates) {
        await projectsCollection.updateOne(
          { _id: project._id },
          { $set: updates }
        );
        console.log(`Updated project: ${project.title_ar || project.title_en || project.id}`);
        updated++;
      }
    }

    console.log(`Successfully updated ${updated} projects with real Cloudinary URLs`);
    
    // Show sample of updated project
    if (updated > 0) {
      const sampleProject = await projectsCollection.findOne({});
      if (sampleProject) {
        console.log('Sample project images:', sampleProject.images?.slice(0, 2));
        console.log('Sample project cover:', sampleProject.cover);
      }
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
  }
}

main();
