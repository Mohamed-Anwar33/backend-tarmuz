const https = require('https');

console.log('🔍 اختبار الـ domain الجديد tarmuz.netlify.app...\n');

async function testNewDomain() {
  return new Promise((resolve) => {
    const options = {
      hostname: 'tarmuz.netlify.app',
      port: 443,
      path: '/',
      method: 'GET',
      headers: {
        'User-Agent': 'Domain-Test/1.0'
      }
    };

    const req = https.request(options, (res) => {
      const status = res.statusCode;
      const success = status >= 200 && status < 400;
      console.log(`${success ? '✅' : '❌'} https://tarmuz.netlify.app: ${status}`);
      
      if (status === 301 || status === 302) {
        console.log(`   ↗️  Redirected to: ${res.headers.location}`);
      }
      
      if (success) {
        console.log('✅ الـ domain الجديد يعمل بشكل صحيح!');
        console.log('\n🔧 الآن يمكنك:');
        console.log('1. تغيير اسم المشروع على Netlify لـ "tarmuz"');
        console.log('2. استخدام الـ domain الجديد: https://tarmuz.netlify.app');
        console.log('3. اختبار الفورم والإيميلات');
      } else {
        console.log('❌ الـ domain الجديد لم يتم إنشاؤه بعد');
        console.log('💡 تأكد من تغيير اسم المشروع على Netlify أولاً');
      }
      
      resolve({ success, status });
    });

    req.on('error', (err) => {
      console.log(`❌ https://tarmuz.netlify.app: ${err.message}`);
      console.log('💡 الـ domain لم يتم إنشاؤه بعد، غير اسم المشروع على Netlify أولاً');
      resolve({ success: false, error: err.message });
    });

    req.setTimeout(10000, () => {
      req.destroy();
      console.log('⏱️  Timeout - الـ domain قد يحتاج وقت أكثر للتفعيل');
      resolve({ success: false, error: 'Timeout' });
    });

    req.end();
  });
}

testNewDomain().catch(console.error);
