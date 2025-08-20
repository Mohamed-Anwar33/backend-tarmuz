const https = require('https');
const http = require('http');

console.log('🔍 فحص شامل للموقع...\n');

// قائمة الـ endpoints للاختبار
const tests = [
  { name: 'Contact Form', endpoint: '/api/contact', method: 'POST', data: { name: 'Test User', email: 'test@example.com', phone: '123456789', message: 'Test message from health check' } },
  { name: 'Get Content', endpoint: '/api/content', method: 'GET' },
  { name: 'Get Projects', endpoint: '/api/projects', method: 'GET' },
  { name: 'Get Testimonials', endpoint: '/api/testimonials', method: 'GET' },
  { name: 'Get Categories', endpoint: '/api/categories', method: 'GET' },
  { name: 'Get Blog Posts', endpoint: '/api/blog', method: 'GET' },
  { name: 'Get Settings (Branding)', endpoint: '/api/settings/branding/public', method: 'GET' },
  { name: 'Get Settings (Login)', endpoint: '/api/settings/login/public', method: 'GET' },
  { name: 'Upload Endpoint', endpoint: '/api/upload', method: 'GET' }
];

const baseUrl = 'https://backend-tarmuz-production.up.railway.app';

async function testEndpoint(test) {
  return new Promise((resolve) => {
    const url = new URL(baseUrl + test.endpoint);
    const options = {
      hostname: url.hostname,
      port: url.port || 443,
      path: url.pathname,
      method: test.method,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Website-Health-Check/1.0'
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        const status = res.statusCode;
        const success = status >= 200 && status < 400;
        console.log(`${success ? '✅' : '❌'} ${test.name}: ${status} ${success ? 'OK' : 'FAILED'}`);
        if (!success && data) {
          try {
            const parsed = JSON.parse(data);
            console.log(`   Error: ${parsed.msg || parsed.message || 'Unknown error'}`);
          } catch (e) {
            console.log(`   Error: ${data.substring(0, 100)}`);
          }
        }
        resolve({ name: test.name, status, success, data });
      });
    });

    req.on('error', (err) => {
      console.log(`❌ ${test.name}: Connection failed - ${err.message}`);
      resolve({ name: test.name, status: 0, success: false, error: err.message });
    });

    if (test.data) {
      req.write(JSON.stringify(test.data));
    }
    req.end();
  });
}

async function runTests() {
  console.log(`🌐 Testing backend: ${baseUrl}\n`);
  
  const results = [];
  for (const test of tests) {
    const result = await testEndpoint(test);
    results.push(result);
  }

  console.log('\n📊 ملخص النتائج:');
  console.log('='.repeat(50));
  
  const successful = results.filter(r => r.success).length;
  const failed = results.filter(r => !r.success).length;
  
  console.log(`✅ نجح: ${successful}`);
  console.log(`❌ فشل: ${failed}`);
  console.log(`📈 معدل النجاح: ${Math.round((successful / results.length) * 100)}%`);

  if (failed > 0) {
    console.log('\n🔧 المشاكل المكتشفة:');
    results.filter(r => !r.success).forEach(r => {
      console.log(`   - ${r.name}: ${r.error || 'HTTP ' + r.status}`);
    });
  } else {
    console.log('\n🎉 جميع الاختبارات نجحت! الموقع يعمل بشكل سليم.');
  }
}

runTests().catch(console.error);
