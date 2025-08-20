const https = require('https');

console.log('🔍 اختبار إرسال الإيميل على السيرفر...\n');

// اختبار إرسال رسالة contact form
const testData = {
  name: 'اختبار من السيرفر',
  email: 'test@example.com',
  phone: '123456789',
  message: 'هذه رسالة اختبار للتأكد من وصول الإيميلات'
};

const postData = JSON.stringify(testData);

const options = {
  hostname: 'backend-tarmuz-production.up.railway.app',
  port: 443,
  path: '/api/contact',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(postData)
  }
};

const req = https.request(options, (res) => {
  let data = '';
  
  console.log(`📡 Status Code: ${res.statusCode}`);
  
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    try {
      const response = JSON.parse(data);
      console.log('📨 Server Response:', response);
      
      if (res.statusCode === 201) {
        if (response.msg === 'Message sent') {
          console.log('✅ الرسالة تم إرسالها بنجاح للإيميل');
        } else if (response.msg === 'Message received (email pending)') {
          console.log('⚠️  الرسالة تم حفظها لكن الإيميل لم يُرسل - مشكلة في إعدادات الإيميل');
        }
      } else {
        console.log('❌ فشل في إرسال الرسالة');
      }
    } catch (e) {
      console.log('📄 Raw Response:', data);
    }
  });
});

req.on('error', (e) => {
  console.error('❌ خطأ في الاتصال:', e.message);
});

req.write(postData);
req.end();

// اختبار endpoint اختبار الإيميل
setTimeout(() => {
  console.log('\n🔧 اختبار endpoint اختبار الإيميل...');
  
  const testOptions = {
    hostname: 'backend-tarmuz-production.up.railway.app',
    port: 443,
    path: '/api/settings/test-email',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    }
  };

  const testReq = https.request(testOptions, (res) => {
    let data = '';
    
    res.on('data', (chunk) => {
      data += chunk;
    });
    
    res.on('end', () => {
      console.log(`📡 Test Email Status: ${res.statusCode}`);
      try {
        const response = JSON.parse(data);
        console.log('🧪 Test Response:', response);
      } catch (e) {
        console.log('📄 Raw Response:', data);
      }
    });
  });

  testReq.on('error', (e) => {
    console.error('❌ خطأ في اختبار الإيميل:', e.message);
  });

  testReq.end();
}, 2000);
