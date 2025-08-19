const mongoose = require('mongoose');
const Project = require('./src/models/Project');
require('dotenv').config();

async function fixImagePaths() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    // Find all projects
    const projects = await Project.find();
    console.log(`Found ${projects.length} projects`);

    for (const project of projects) {
      let updated = false;

      // Fix cover path if it doesn't start with /
      if (project.cover && !project.cover.startsWith('/')) {
        project.cover = '/' + project.cover;
        updated = true;
        console.log(`Fixed cover for project: ${project.title_en}`);
      }

      // Fix images paths if they don't start with /
      if (project.images && project.images.length > 0) {
        const fixedImages = project.images.map(img => {
          if (!img.startsWith('/')) {
            return '/' + img;
          }
          return img;
        });
        
        if (JSON.stringify(fixedImages) !== JSON.stringify(project.images)) {
          project.images = fixedImages;
          updated = true;
          console.log(`Fixed images for project: ${project.title_en}`);
        }
      }

      // Save if updated
      if (updated) {
        await project.save();
        console.log(`✅ Updated project: ${project.title_en}`);
      }
    }

    console.log('✅ All image paths fixed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error fixing image paths:', error);
    process.exit(1);
  }
}

fixImagePaths();
