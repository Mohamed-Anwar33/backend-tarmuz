require('dotenv').config();
const mongoose = require('mongoose');
const readline = require('readline');

// Import all models
const Project = require('./src/models/Project');
const Category = require('./src/models/Category');
const Client = require('./src/models/Client');
const BlogPost = require('./src/models/BlogPost');
const Testimonial = require('./src/models/Testimonial');
const Content = require('./src/models/Content');
const Settings = require('./src/models/Settings');
const User = require('./src/models/User');
const Contact = require('./src/models/Contact');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const question = (query) => new Promise((resolve) => rl.question(query, resolve));

async function migrateData() {
  try {
    console.log('🚀 MongoDB Atlas Migration Tool');
    console.log('================================\n');

    // Get Atlas connection string from user
    const atlasUri = await question('Please enter your MongoDB Atlas connection string:\n');
    const dbNameInput = await question('Enter the Atlas database name to use (default: tarmuz): ');
    const dbName = (dbNameInput && dbNameInput.trim()) ? dbNameInput.trim() : 'tarmuz';
    
    if (!atlasUri || !atlasUri.startsWith('mongodb')) {
      console.error('❌ Invalid MongoDB connection string');
      process.exit(1);
    }

    // Connect to local database
    console.log('\n📡 Connecting to local database...');
    const localDb = await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/tarmuz', {
      serverSelectionTimeoutMS: 5000,
    });
    console.log('✅ Connected to local database');

    // Fetch all data from local database
    console.log('\n📥 Fetching data from local database...');
    const data = {
      projects: await Project.find({}).lean(),
      categories: await Category.find({}).lean(),
      clients: await Client.find({}).lean(),
      blogPosts: await BlogPost.find({}).lean(),
      testimonials: await Testimonial.find({}).lean(),
      contents: await Content.find({}).lean(),
      settings: await Settings.find({}).lean(),
      users: await User.find({}).lean(),
      contacts: await Contact.find({}).lean(),
    };

    // Remove _id fields from all documents to avoid duplicate key errors
    const removeIds = (docs) => docs.map(doc => {
      const { _id, __v, ...cleanDoc } = doc;
      return cleanDoc;
    });

    // Clean all data
    Object.keys(data).forEach(key => {
      data[key] = removeIds(data[key]);
    });

    // Display data summary
    console.log('\n📊 Data Summary:');
    console.log(`  - Projects: ${data.projects.length}`);
    console.log(`  - Categories: ${data.categories.length}`);
    console.log(`  - Clients: ${data.clients.length}`);
    console.log(`  - Blog Posts: ${data.blogPosts.length}`);
    console.log(`  - Testimonials: ${data.testimonials.length}`);
    console.log(`  - Contents: ${data.contents.length}`);
    console.log(`  - Settings: ${data.settings.length}`);
    console.log(`  - Users: ${data.users.length}`);
    console.log(`  - Contacts: ${data.contacts.length}`);

    const totalRecords = Object.values(data).reduce((sum, arr) => sum + arr.length, 0);
    console.log(`\n  Total Records: ${totalRecords}`);

    if (totalRecords === 0) {
      console.log('\n⚠️  No data found in local database to migrate.');
      const proceed = await question('\nDo you want to continue anyway? (y/n): ');
      if (proceed.toLowerCase() !== 'y') {
        console.log('Migration cancelled.');
        process.exit(0);
      }
    }

    // Confirm migration
    const confirm = await question('\n⚠️  Warning: This will overwrite any existing data in Atlas.\nDo you want to proceed? (yes/no): ');
    
    if (confirm.toLowerCase() !== 'yes') {
      console.log('Migration cancelled.');
      process.exit(0);
    }

    // Disconnect from local database
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from local database');

    // Connect to Atlas
    console.log('\n📡 Connecting to MongoDB Atlas...');
    await mongoose.connect(atlasUri, {
      serverSelectionTimeoutMS: 10000,
      dbName,
    });
    console.log('✅ Connected to MongoDB Atlas');

    // Clear existing data in Atlas (optional)
    const clearData = await question('\nDo you want to clear existing data in Atlas before migration? (y/n): ');
    
    if (clearData.toLowerCase() === 'y' || clearData.toLowerCase() === 'yes') {
      console.log(`\n🗑️  Dropping entire database "${dbName}" on Atlas to ensure a clean state...`);
      await mongoose.connection.db.dropDatabase();
      console.log('✅ Database dropped');
      // Wait a moment for database to process
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    // Upload data to Atlas
    console.log('\n📤 Uploading data to MongoDB Atlas...');
    
    if (data.categories.length > 0) {
      await Category.insertMany(data.categories);
      console.log(`  ✅ ${data.categories.length} categories uploaded`);
    }
    
    if (data.projects.length > 0) {
      await Project.insertMany(data.projects);
      console.log(`  ✅ ${data.projects.length} projects uploaded`);
    }
    
    if (data.clients.length > 0) {
      await Client.insertMany(data.clients);
      console.log(`  ✅ ${data.clients.length} clients uploaded`);
    }
    
    if (data.blogPosts.length > 0) {
      await BlogPost.insertMany(data.blogPosts);
      console.log(`  ✅ ${data.blogPosts.length} blog posts uploaded`);
    }
    
    if (data.testimonials.length > 0) {
      await Testimonial.insertMany(data.testimonials);
      console.log(`  ✅ ${data.testimonials.length} testimonials uploaded`);
    }
    
    if (data.contents.length > 0) {
      await Content.insertMany(data.contents);
      console.log(`  ✅ ${data.contents.length} contents uploaded`);
    }
    
    if (data.settings.length > 0) {
      await Settings.insertMany(data.settings);
      console.log(`  ✅ ${data.settings.length} settings uploaded`);
    }
    
    if (data.users.length > 0) {
      await User.insertMany(data.users);
      console.log(`  ✅ ${data.users.length} users uploaded`);
    }
    
    if (data.contacts.length > 0) {
      await Contact.insertMany(data.contacts);
      console.log(`  ✅ ${data.contacts.length} contacts uploaded`);
    }

    console.log('\n🎉 Migration completed successfully!');
    
    // Save Atlas URI to .env.atlas file for reference
    const fs = require('fs');
    // Ensure the saved URI includes the db name path for clarity
    const uriHasDbPath = /\/\w+(\?|$)/.test(atlasUri.split('?')[0]);
    const uriWithDb = uriHasDbPath ? atlasUri : (atlasUri.replace(/\/?$/, '/') + dbName + (atlasUri.includes('?') ? '' : ''));
    const envContent = `# MongoDB Atlas Connection
# Add this to your .env file to connect to Atlas
MONGO_URI=${uriWithDb}
MONGO_DB_NAME=${dbName}

# Keep your local MongoDB URI as backup
# LOCAL_MONGO_URI=${process.env.MONGO_URI || 'mongodb://localhost:27017/tarmuz'}
`;
    
    fs.writeFileSync('.env.atlas', envContent);
    console.log('\n📝 Atlas connection string saved to .env.atlas');
    console.log('   Copy the MONGO_URI from .env.atlas to your .env file to use Atlas');
    
  } catch (error) {
    console.error('\n❌ Migration failed:', error.message);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    rl.close();
    process.exit(0);
  }
}

// Run migration
migrateData();
