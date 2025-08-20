const mongoose = require('mongoose');
require('dotenv').config();

async function checkAllProjects() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    // Connect to tarmuz database
    const tarmuzDb = mongoose.connection.client.db('tarmuz');
    const projectsCollection = tarmuzDb.collection('projects');

    // Get all projects
    const projects = await projectsCollection.find({}).toArray();
    console.log(`\n📊 Found ${projects.length} total projects in database\n`);

    let oldUrlCount = 0;
    let fixedUrlCount = 0;
    let projectsWithOldUrls = [];

    for (const project of projects) {
      let hasOldUrls = false;
      let oldUrls = [];

      // Check images array
      if (project.images && Array.isArray(project.images)) {
        for (const imagePath of project.images) {
          if (imagePath.includes('v1755647000')) {
            hasOldUrls = true;
            oldUrls.push(imagePath);
            oldUrlCount++;
          } else if (imagePath.includes('cloudinary.com')) {
            fixedUrlCount++;
          }
        }
      }

      // Check cover image
      if (project.cover && project.cover.includes('v1755647000')) {
        hasOldUrls = true;
        oldUrls.push(`COVER: ${project.cover}`);
        oldUrlCount++;
      } else if (project.cover && project.cover.includes('cloudinary.com')) {
        fixedUrlCount++;
      }

      if (hasOldUrls) {
        projectsWithOldUrls.push({
          title: project.title_ar || project.title_en || project._id,
          oldUrls: oldUrls
        });
      }
    }

    console.log(`✅ Fixed URLs: ${fixedUrlCount}`);
    console.log(`❌ Old URLs still present: ${oldUrlCount}`);
    console.log(`📋 Projects with old URLs: ${projectsWithOldUrls.length}\n`);

    if (projectsWithOldUrls.length > 0) {
      console.log('🔍 Projects that still need fixing:');
      projectsWithOldUrls.forEach((project, index) => {
        console.log(`${index + 1}. ${project.title}`);
        project.oldUrls.slice(0, 2).forEach(url => {
          console.log(`   - ${url.substring(0, 100)}...`);
        });
        if (project.oldUrls.length > 2) {
          console.log(`   ... and ${project.oldUrls.length - 2} more`);
        }
        console.log('');
      });
    } else {
      console.log('🎉 All projects have been fixed!');
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
  }
}

checkAllProjects();
