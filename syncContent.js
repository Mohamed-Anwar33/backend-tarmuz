const mongoose = require('mongoose');
require('dotenv').config();

// Import models
const Project = require('./src/models/Project');
const BlogPost = require('./src/models/BlogPost');
const Client = require('./src/models/Client');
const Testimonial = require('./src/models/Testimonial');
const Content = require('./src/models/Content');

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const syncContent = async () => {
  try {
    console.log('🔄 Starting content synchronization...');

    // 1. Sync Projects - Sample projects from frontend
    const sampleProjects = [
      {
        id: 'villa-modern-design',
        title_ar: 'فيلا عصرية بتصميم مودرن',
        title_en: 'Modern Villa Design',
        description_ar: 'تصميم فيلا عصرية بطراز مودرن يجمع بين الأناقة والوظائف العملية',
        description_en: 'Modern villa design combining elegance with practical functionality',
        category: 'exterior',
        cover: '/images/projects/villa-1.jpg',
        images: ['/images/projects/villa-1.jpg', '/images/projects/villa-2.jpg'],
        status: 'active'
      },
      {
        id: 'office-interior',
        title_ar: 'تصميم داخلي لمكتب إداري',
        title_en: 'Office Interior Design',
        description_ar: 'تصميم داخلي عصري لمكتب إداري يعزز الإنتاجية والراحة',
        description_en: 'Modern interior design for office space enhancing productivity and comfort',
        category: 'interior',
        cover: '/images/projects/office-1.jpg',
        images: ['/images/projects/office-1.jpg', '/images/projects/office-2.jpg'],
        status: 'active'
      },
      {
        id: 'landscape-garden',
        title_ar: 'تنسيق حديقة منزلية',
        title_en: 'Residential Garden Landscape',
        description_ar: 'تنسيق حديقة منزلية بتصميم طبيعي يوفر مساحة استرخاء مثالية',
        description_en: 'Residential garden landscape with natural design providing perfect relaxation space',
        category: 'landscape',
        cover: '/images/projects/garden-1.jpg',
        images: ['/images/projects/garden-1.jpg', '/images/projects/garden-2.jpg'],
        status: 'active'
      }
    ];

    for (const projectData of sampleProjects) {
      const existingProject = await Project.findOne({ id: projectData.id });
      if (!existingProject) {
        await Project.create(projectData);
        console.log(`✅ Created project: ${projectData.title_en}`);
      }
    }

    // 2. Sync Clients - Sample clients
    const sampleClients = [
      {
        name_ar: 'شركة الرؤية للتطوير العقاري',
        name_en: 'Vision Real Estate Development',
        description_ar: 'شركة رائدة في مجال التطوير العقاري والاستثمار',
        description_en: 'Leading company in real estate development and investment',
        logo: '/images/clients/vision-logo.png',
        website: 'https://vision-realestate.com',
        status: 'active'
      },
      {
        name_ar: 'مجموعة الأمل التجارية',
        name_en: 'Al-Amal Commercial Group',
        description_ar: 'مجموعة تجارية متنوعة تعمل في عدة قطاعات',
        description_en: 'Diversified commercial group operating in multiple sectors',
        logo: '/images/clients/alamal-logo.png',
        website: 'https://alamal-group.com',
        status: 'active'
      }
    ];

    for (const clientData of sampleClients) {
      const existingClient = await Client.findOne({ name_en: clientData.name_en });
      if (!existingClient) {
        await Client.create(clientData);
        console.log(`✅ Created client: ${clientData.name_en}`);
      }
    }

    // 3. Sync Testimonials - Sample testimonials
    const sampleTestimonials = [
      {
        quote_ar: 'خدمة ممتازة وتصميم رائع. فريق محترف جداً وملتزم بالمواعيد.',
        quote_en: 'Excellent service and amazing design. Very professional team and committed to deadlines.',
        clientName_ar: 'أحمد محمد علي',
        clientName_en: 'Ahmed Mohamed Ali',
        position_ar: 'مدير التطوير',
        position_en: 'Development Manager',
        company_ar: 'شركة الرؤية للتطوير',
        company_en: 'Vision Development Company',
        avatar: '/images/testimonials/ahmed.jpg',
        rating: 5,
        status: 'active'
      },
      {
        quote_ar: 'تجربة رائعة في التعامل. النتيجة فاقت التوقعات بكثير.',
        quote_en: 'Amazing experience working with them. The result exceeded expectations by far.',
        clientName_ar: 'سارة أحمد',
        clientName_en: 'Sara Ahmed',
        position_ar: 'مديرة المشاريع',
        position_en: 'Project Manager',
        company_ar: 'مجموعة الأمل',
        company_en: 'Al-Amal Group',
        avatar: '/images/testimonials/sara.jpg',
        rating: 5,
        status: 'active'
      }
    ];

    for (const testimonialData of sampleTestimonials) {
      const existingTestimonial = await Testimonial.findOne({ clientName_en: testimonialData.clientName_en });
      if (!existingTestimonial) {
        await Testimonial.create(testimonialData);
        console.log(`✅ Created testimonial: ${testimonialData.clientName_en}`);
      }
    }

    // 4. Sync Site Content - Main site sections
    const siteContent = [
      {
        type: 'hero',
        title_ar: 'ترميز - تصميم معماري وهندسي متميز',
        title_en: 'Tarmiz - Distinguished Architectural & Engineering Design',
        description_ar: 'نحن متخصصون في التصميم المعماري والهندسي والتخطيط العمراني وتصميم الهويات البصرية',
        description_en: 'We specialize in architectural design, engineering, urban planning, and visual identity design',
        content_ar: 'شركة ترميز للاستشارات الهندسية والمعمارية، نقدم خدمات متكاملة في التصميم والتخطيط',
        content_en: 'Tarmiz Engineering and Architectural Consultancy, providing integrated design and planning services'
      },
      {
        type: 'about',
        title_ar: 'من نحن',
        title_en: 'About Us',
        description_ar: 'شركة رائدة في مجال الاستشارات الهندسية والمعمارية',
        description_en: 'Leading company in engineering and architectural consultancy',
        content_ar: 'نحن فريق من المهندسين والمصممين المتخصصين في تقديم حلول إبداعية ومبتكرة في مجال العمارة والتصميم',
        content_en: 'We are a team of specialized engineers and designers providing creative and innovative solutions in architecture and design'
      },
      {
        type: 'services',
        title_ar: 'خدماتنا',
        title_en: 'Our Services',
        description_ar: 'نقدم مجموعة شاملة من الخدمات الهندسية والمعمارية',
        description_en: 'We provide a comprehensive range of engineering and architectural services',
        content_ar: 'التصميم المعماري، التصميم الداخلي، التخطيط العمراني، تصميم الهويات البصرية',
        content_en: 'Architectural Design, Interior Design, Urban Planning, Visual Identity Design'
      }
    ];

    for (const contentData of siteContent) {
      const existingContent = await Content.findOne({ type: contentData.type });
      if (!existingContent) {
        await Content.create(contentData);
        console.log(`✅ Created content section: ${contentData.type}`);
      }
    }

    // 5. Create Blog Section (Inactive by default)
    const blogContent = {
      type: 'blog',
      title_ar: 'المدونة',
      title_en: 'Blog',
      description_ar: 'اقرأ آخر المقالات والأخبار في مجال العمارة والتصميم',
      description_en: 'Read the latest articles and news in architecture and design',
      content_ar: 'مدونة ترميز - مقالات متخصصة في العمارة والتصميم',
      content_en: 'Tarmiz Blog - Specialized articles in architecture and design',
      isActive: false // Blog is inactive by default
    };

    const existingBlogContent = await Content.findOne({ type: 'blog' });
    if (!existingBlogContent) {
      await Content.create(blogContent);
      console.log('✅ Created blog section (inactive by default)');
    }

    console.log('🎉 Content synchronization completed successfully!');
    console.log('📋 Summary:');
    console.log(`- Projects: ${await Project.countDocuments()}`);
    console.log(`- Clients: ${await Client.countDocuments()}`);
    console.log(`- Testimonials: ${await Testimonial.countDocuments()}`);
    console.log(`- Content Sections: ${await Content.countDocuments()}`);
    console.log(`- Blog Posts: ${await BlogPost.countDocuments()}`);

  } catch (error) {
    console.error('❌ Error syncing content:', error);
  } finally {
    mongoose.connection.close();
  }
};

// Run the sync
syncContent();
