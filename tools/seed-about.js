/*
  One-time seed script to upsert About content into MongoDB (DB name: tarmuz)
  Usage:
    - Ensure .env has MONGO_URI and (optionally) MONGO_DB_NAME=tarmuz
    - Run: node tools/seed-about.js
*/

require('dotenv').config();
const connectDB = require('../src/config/db');
const Content = require('../src/models/Content');

(async () => {
  try {
    await connectDB();

    const data = {
      type: 'about',
      title_ar: 'عن تَرْمُز',
      title_en: 'About TARMUZ',
      description_ar:
        'شركة رائدة وطموحة في قطاع التطوير والاستشارات في مجال المطاعم والمقاهي بشكل خاص وفي المجالات الأخرى بشكل عام. انطلقت ترمُز من الرياض وذاع صيتها في مناطق المملكة حتى تمكنت من تحقيق نجاحات وبناء علاقات مميزة مع عملائها. نتميز بفريق مختار بعناية يجمع بين الخبرة والمرونة والإبداع.',
      description_en:
        'An ambitious leading company in the development and consulting sector — specializing in restaurants and cafés in particular, and in other fields in general. TARMUZ started in Riyadh and its reputation spread across the Kingdom, enabling notable successes and strong client relationships. We are distinguished by a carefully selected team that combines experience, agility, and creativity.',
      about_features: {
        vision: {
          title_ar: 'الرؤية',
          title_en: 'Vision',
          description_ar: 'إنشاء مساحات مبتكرة تُلهم وتحوّل المجتمعات',
          description_en: 'Creating innovative spaces that inspire and transform communities',
        },
        mission: {
          title_ar: 'رسالتنا',
          title_en: 'Our Mission',
          description_ar:
            'الاستفادة من العقول والأفكار والخطط الفريدة من قبل فريق ترمُز لكسب ثقة العميل وتقديم حلول خلاقة تقودنا وإياهم إلى النجاح',
          description_en:
            'Leverage unique minds, ideas, and plans by the Tarmuz team to gain client trust and deliver creative solutions that lead us together to success.',
        },
        goal: {
          title_ar: 'هدفنا',
          title_en: 'Our Goal',
          description_ar:
            'تقديم الخدمات التي تلبي رضا عملائنا وتؤسس لعلاقة نجاح طويلة المدى معهم.',
          description_en:
            'Provide services that satisfy our clients and establish long-term successful relationships.',
        },
        values: {
          title_ar: 'قيمنا',
          title_en: 'Our Values',
          items_ar: [
            'الالتزام بالوقت والوعود وتقديم الأعمال بكل إخلاص وأمانة.',
            'الجودة ثقافة عامة نحرص على تقديمها في أعلى مستوى.',
            'الإبداع والابتكار لترك بصمة مميزة.',
            'تسهيل أعمال عملائنا بحلول مبتكرة وذكية.',
          ],
          items_en: [
            'Commitment to time and promises; work with integrity and honesty.',
            'Quality as a culture delivered at the highest level.',
            'Creativity and innovation to leave a distinctive mark.',
            'Facilitating our clients’ work with smart, innovative solutions.',
          ],
        },
        team: {
          title_ar: 'الفريق',
          title_en: 'Team',
          description_ar: 'مهندسون معماريون ومصممون وخبراء يعملون معاً',
          description_en: 'Expert architects, designers, and engineers working together',
        },
        excellence: {
          title_ar: 'التميز',
          title_en: 'Excellence',
          description_ar: 'مشاريع حائزة على جوائز تضع معايير جديدة في الصناعة',
          description_en: 'Award-winning projects that set new industry standards',
        },
      },
    };

    const result = await Content.findOneAndUpdate(
      { type: 'about' },
      { $set: data, updatedAt: Date.now() },
      { upsert: true, new: true, runValidators: true }
    );

    console.log('About content upserted:', {
      id: result._id.toString(),
      updatedAt: result.updatedAt,
    });
  } catch (err) {
    console.error('Seed failed:', err);
    process.exitCode = 1;
  } finally {
    // Close Mongoose connection
    const mongoose = require('mongoose');
    await mongoose.connection.close();
  }
})();
