const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Category = require('./src/models/Category');

dotenv.config();

const categories = [
  {
    name: 'interior',
    name_ar: 'تصميم داخلي',
    description: 'Interior design and decoration projects',
    description_ar: 'مشاريع التصميم الداخلي والديكور'
  },
  {
    name: 'exterior',
    name_ar: 'تصميم خارجي',
    description: 'Exterior design and facade projects',
    description_ar: 'مشاريع التصميم الخارجي والواجهات'
  },
  {
    name: 'landscape',
    name_ar: 'تنسيق حدائق',
    description: 'Landscape and garden design projects',
    description_ar: 'مشاريع تنسيق الحدائق والمناظر الطبيعية'
  },
  {
    name: 'identity',
    name_ar: 'هوية بصرية',
    description: 'Brand identity and visual design projects',
    description_ar: 'مشاريع الهوية البصرية والتصميم الجرافيكي'
  }
];

const seedCategories = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    // Clear existing categories
    await Category.deleteMany({});
    console.log('Cleared existing categories');

    // Insert new categories
    const insertedCategories = await Category.insertMany(categories);
    console.log(`Inserted ${insertedCategories.length} categories:`);
    insertedCategories.forEach(cat => {
      console.log(`- ${cat.name} (${cat.name_ar})`);
    });

    console.log('Categories seeded successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding categories:', error);
    process.exit(1);
  }
};

seedCategories();
