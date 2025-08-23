require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('../src/config/db');
const Content = require('../src/models/Content');

// New services to add/merge (Arabic primary)
const NEW_SERVICES = [
  {
    icon: 'technical_consulting',
    name_ar: 'استشارات تقنية',
    name_en: 'Technical Consulting',
    description_ar: 'تصميم وتنفيذ حلول تقنية متكاملة وفعالة من حيث التكلفة لتبسيط العمليات وتحسين تجربة العملاء.',
    description_en: ''
  },
  {
    icon: 'training',
    name_ar: 'توظيف وتدريب',
    name_en: 'Recruitment & Training',
    description_ar: 'تطوير وإدارة برامج تدريب حديثة ترفع من كفاءة الموظفين وتزيد من رضا العملاء.',
    description_en: ''
  },
  {
    icon: 'contracts',
    name_ar: 'إدارة العقود',
    name_en: 'Contract Management',
    description_ar: 'إدارة العقود من صياغتها حتى تدقيقها بما يضمن الأمان القانوني والمالي للمشاريع.',
    description_en: ''
  },
  {
    icon: 'feasibility',
    name_ar: 'دراسة الجدوى والتخطيط الاستراتيجي',
    name_en: 'Feasibility & Strategic Planning',
    description_ar: 'إعداد دراسات جدوى اقتصادية متكاملة تشمل السوق، المنافسين، العملاء، والعوائد المتوقعة.',
    description_en: ''
  },
  {
    icon: 'interior',
    name_ar: 'التصميم الداخلي',
    name_en: 'Interior Design',
    description_ar: 'حلول داخلية تجمع بين الوظيفة والجمال.',
    description_en: ''
  },
  {
    icon: 'exterior',
    name_ar: 'التصميم الخارجي',
    name_en: 'Exterior Design',
    description_ar: 'واجهات وهياكل حديثة ومستدامة.',
    description_en: ''
  },
  {
    icon: 'landscape',
    name_ar: 'تصميم المناظر الطبيعية',
    name_en: 'Landscape Design',
    description_ar: 'إنشاء مساحات خضراء ملهمة.',
    description_en: ''
  },
  {
    icon: 'urban',
    name_ar: 'التخطيط الحضري',
    name_en: 'Urban Planning',
    description_ar: 'بناء تجارب حضرية تتمحور حول الإنسان.',
    description_en: ''
  },
  {
    icon: 'corporate_relations',
    name_ar: 'إدارة علاقات الشركات',
    name_en: 'Corporate Relations Management',
    description_ar: 'تطوير استراتيجيات لبناء روابط قوية مع العملاء والشركاء والمستثمرين.',
    description_en: ''
  }
];

(async () => {
  try {
    await connectDB();

    // Ensure services content exists
    let content = await Content.findOne({ type: 'services' });
    if (!content) {
      content = await Content.create({ type: 'services', title_ar: 'خدماتنا', title_en: 'Our Services', services: [] });
    }

    const existing = Array.isArray(content.services) ? content.services : [];

    const norm = (s) => (s || '').toString().trim();

    let added = 0;
    let updated = 0;

    for (const svc of NEW_SERVICES) {
      const byIcon = existing.find((e) => norm(e.icon).toLowerCase() === norm(svc.icon).toLowerCase());
      const byNameAr = existing.find((e) => norm(e.name_ar) === norm(svc.name_ar));
      const match = byIcon || byNameAr;
      if (match) {
        // Update missing fields only, don't overwrite existing non-empty values
        const before = JSON.stringify(match);
        if (!norm(match.name_ar) && norm(svc.name_ar)) match.name_ar = svc.name_ar;
        if (!norm(match.name_en) && norm(svc.name_en)) match.name_en = svc.name_en;
        if (!norm(match.icon) && norm(svc.icon)) match.icon = svc.icon;
        if (!norm(match.description_ar) && norm(svc.description_ar)) match.description_ar = svc.description_ar;
        if (!norm(match.description_en) && norm(svc.description_en)) match.description_en = svc.description_en;
        const after = JSON.stringify(match);
        if (before !== after) updated++;
      } else {
        existing.push({
          icon: svc.icon,
          name_ar: svc.name_ar,
          name_en: svc.name_en,
          description_ar: svc.description_ar,
          description_en: svc.description_en,
        });
        added++;
      }
    }

    content.services = existing;
    await content.save();

    console.log('Merge complete.');
    console.log(`DB: ${mongoose.connection.name}`);
    console.log(`Services doc id: ${content._id}`);
    console.log(`Added: ${added}, Updated: ${updated}, Total now: ${content.services.length}`);

  } catch (err) {
    console.error('Error merging services:', err);
    process.exitCode = 1;
  } finally {
    await mongoose.connection.close();
  }
})();
