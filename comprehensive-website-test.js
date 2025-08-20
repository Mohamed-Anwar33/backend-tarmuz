const https = require('https');
const http = require('http');

console.log('🔍 فحص شامل للموقع والتطبيق...\n');

// قائمة شاملة للاختبارات
const backendTests = [
  { name: 'Contact Form', endpoint: '/api/contact', method: 'POST', data: { name: 'Test User', email: 'test@example.com', phone: '123456789', message: 'Test message' } },
  { name: 'Get Content', endpoint: '/api/content', method: 'GET' },
  { name: 'Get Projects', endpoint: '/api/projects', method: 'GET' },
  { name: 'Get Testimonials', endpoint: '/api/testimonials', method: 'GET' },
  { name: 'Get Categories', endpoint: '/api/categories', method: 'GET' },
  { name: 'Get Blog Posts', endpoint: '/api/blog', method: 'GET' },
  { name: 'Get Clients', endpoint: '/api/clients', method: 'GET' },
  { name: 'Settings - Branding Public', endpoint: '/api/settings/branding/public', method: 'GET' },
  { name: 'Settings - Login Public', endpoint: '/api/settings/login/public', method: 'GET' },
  { name: 'Settings - Contact Recipient', endpoint: '/api/settings/contact-recipient', method: 'GET' },
  { name: 'Health Check', endpoint: '/healthz', method: 'GET' },
  { name: 'Ready Check', endpoint: '/readyz', method: 'GET' }
];

const frontendTests = [
  { name: 'Frontend Home Page', url: 'https://elegant-choux-cf7784.netlify.app/' },
  { name: 'Admin Panel', url: 'https://elegant-choux-cf7784.netlify.app/admin' }
];

const baseUrl = 'https://backend-tarmuz-production.up.railway.app';

async function testBackendEndpoint(test) {
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
        console.log(`${success ? '✅' : '❌'} Backend - ${test.name}: ${status}`);
        
        if (!success && data) {
          try {
            const parsed = JSON.parse(data);
            console.log(`   Error: ${parsed.msg || parsed.message || 'Unknown error'}`);
          } catch (e) {
            console.log(`   Error: ${data.substring(0, 100)}`);
          }
        }
        
        // Check for specific issues
        if (success && data) {
          try {
            const parsed = JSON.parse(data);
            if (test.name === 'Contact Form' && parsed.msg === 'Message received (email pending)') {
              console.log('   ⚠️  Email configuration missing on server');
            }
            if (Array.isArray(parsed) && parsed.length === 0) {
              console.log(`   ℹ️  No data found (empty array)`);
            }
          } catch (e) {
            // Not JSON, that's fine
          }
        }
        
        resolve({ name: test.name, status, success, data });
      });
    });

    req.on('error', (err) => {
      console.log(`❌ Backend - ${test.name}: Connection failed - ${err.message}`);
      resolve({ name: test.name, status: 0, success: false, error: err.message });
    });

    if (test.data) {
      req.write(JSON.stringify(test.data));
    }
    req.end();
  });
}

async function testFrontendUrl(test) {
  return new Promise((resolve) => {
    const url = new URL(test.url);
    const options = {
      hostname: url.hostname,
      port: url.port || 443,
      path: url.pathname,
      method: 'GET',
      headers: {
        'User-Agent': 'Website-Health-Check/1.0'
      }
    };

    const req = https.request(options, (res) => {
      const status = res.statusCode;
      const success = status >= 200 && status < 400;
      console.log(`${success ? '✅' : '❌'} Frontend - ${test.name}: ${status}`);
      
      if (status === 301 || status === 302) {
        console.log(`   ↗️  Redirected to: ${res.headers.location}`);
      }
      
      resolve({ name: test.name, status, success });
    });

    req.on('error', (err) => {
      console.log(`❌ Frontend - ${test.name}: Connection failed - ${err.message}`);
      resolve({ name: test.name, status: 0, success: false, error: err.message });
    });

    req.end();
  });
}

async function runComprehensiveTests() {
  console.log(`🌐 Testing Backend: ${baseUrl}`);
  console.log(`🎨 Testing Frontend: https://elegant-choux-cf7784.netlify.app\n`);
  
  console.log('📡 Backend API Tests:');
  console.log('='.repeat(50));
  
  const backendResults = [];
  for (const test of backendTests) {
    const result = await testBackendEndpoint(test);
    backendResults.push(result);
  }

  console.log('\n🎨 Frontend Tests:');
  console.log('='.repeat(50));
  
  const frontendResults = [];
  for (const test of frontendTests) {
    const result = await testFrontendUrl(test);
    frontendResults.push(result);
  }

  console.log('\n📊 ملخص شامل للنتائج:');
  console.log('='.repeat(50));
  
  const backendSuccess = backendResults.filter(r => r.success).length;
  const backendFailed = backendResults.filter(r => !r.success).length;
  const frontendSuccess = frontendResults.filter(r => r.success).length;
  const frontendFailed = frontendResults.filter(r => !r.success).length;
  
  console.log(`🔧 Backend:`);
  console.log(`   ✅ نجح: ${backendSuccess}/${backendResults.length}`);
  console.log(`   ❌ فشل: ${backendFailed}/${backendResults.length}`);
  console.log(`   📈 معدل النجاح: ${Math.round((backendSuccess / backendResults.length) * 100)}%`);
  
  console.log(`\n🎨 Frontend:`);
  console.log(`   ✅ نجح: ${frontendSuccess}/${frontendResults.length}`);
  console.log(`   ❌ فشل: ${frontendFailed}/${frontendResults.length}`);
  console.log(`   📈 معدل النجاح: ${Math.round((frontendSuccess / frontendResults.length) * 100)}%`);

  const totalFailed = backendFailed + frontendFailed;
  if (totalFailed > 0) {
    console.log('\n🔧 المشاكل المكتشفة:');
    [...backendResults, ...frontendResults].filter(r => !r.success).forEach(r => {
      console.log(`   - ${r.name}: ${r.error || 'HTTP ' + r.status}`);
    });
    
    console.log('\n💡 توصيات للإصلاح:');
    if (backendResults.some(r => r.name.includes('Settings') && !r.success)) {
      console.log('   - إضافة routes مفقودة في settingsRoutes.js');
    }
    if (backendResults.some(r => r.name === 'Contact Form' && r.data && r.data.includes('email pending'))) {
      console.log('   - إضافة متغيرات الإيميل على Railway server');
    }
  } else {
    console.log('\n🎉 جميع الاختبارات نجحت! الموقع يعمل بشكل مثالي.');
  }
}

runComprehensiveTests().catch(console.error);
