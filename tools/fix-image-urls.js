const mongoose = require('mongoose');
require('dotenv').config();

async function main() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    // Get the raw collection to bypass Mongoose - use tarmuz database
    const db = mongoose.connection.db;
    console.log('Current database:', db.databaseName);
    
    // Switch to tarmuz database if needed
    const tarmuzDb = mongoose.connection.client.db('tarmuz');
    const projectsCollection = tarmuzDb.collection('projects');

    // First, let's see what we have in the database
    const allProjects = await projectsCollection.find({}).toArray();
    console.log(`Total projects in database: ${allProjects.length}`);
    
    if (allProjects.length > 0) {
      console.log('Sample project structure:');
      console.log('Images:', allProjects[0].images?.slice(0, 2));
      console.log('Cover:', allProjects[0].cover);
    }

    // Find all projects with /uploads/ paths
    const projects = await projectsCollection.find({
      $or: [
        { "images": { $elemMatch: { $regex: "/uploads/" } } },
        { "cover": { $regex: "/uploads/" } }
      ]
    }).toArray();

    console.log(`Found ${projects.length} projects to update`);

    let updated = 0;
    for (const project of projects) {
      const updates = {};
      
      // Fix images array
      if (project.images && Array.isArray(project.images)) {
        updates.images = project.images.map(img => {
          if (img && img.startsWith('/uploads/')) {
            const filename = img.split('/').pop();
            return `https://res.cloudinary.com/dvhse3qgv/image/upload/v1755647000/tarmuz/uploads/تصميم%20خارجي/${filename}`;
          }
          return img;
        });
      }

      // Fix cover image
      if (project.cover && project.cover.startsWith('/uploads/')) {
        const filename = project.cover.split('/').pop();
        updates.cover = `https://res.cloudinary.com/dvhse3qgv/image/upload/v1755647000/tarmuz/uploads/تصميم%20خارجي/${filename}`;
      }

      if (Object.keys(updates).length > 0) {
        await projectsCollection.updateOne(
          { _id: project._id },
          { $set: updates }
        );
        updated++;
        console.log(`Updated project: ${project.title_en || project.title_ar}`);
      }
    }

    console.log(`Successfully updated ${updated} projects`);
    
    // Verify the update
    const sampleProject = await projectsCollection.findOne({});
    if (sampleProject) {
      console.log('Sample project images:', sampleProject.images?.slice(0, 2));
      console.log('Sample project cover:', sampleProject.cover);
    }

    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

main();
