/**
 * Test script for SaaS flow
 * Run with: node test-saas-flow.js
 */

const BASE_URL = process.env.TEST_URL || 'http://localhost:3000';

async function testEndpoint(method, path, body = null) {
  const url = `${BASE_URL}${path}`;
  const options = {
    method,
    headers: {
      'Content-Type': 'application/json',
    },
  };

  if (body) {
    options.body = JSON.stringify(body);
  }

  try {
    const response = await fetch(url, options);
    const data = await response.json();
    return { status: response.status, data, ok: response.ok };
  } catch (error) {
    return { error: error.message };
  }
}

async function runTests() {
  console.log('🧪 Testing SaaS Flow\n');
  console.log('='.repeat(50));

  // Test 1: Registration
  console.log('\n1️⃣ Testing Registration...');
  const testEmail = `test-${Date.now()}@example.com`;
  const registerData = {
    name: 'Test User',
    email: testEmail,
    companyName: 'Test Cleaning Co',
    phone: '(555) 123-4567',
  };

  const registerResult = await testEndpoint('POST', '/api/saas/register', registerData);
  if (registerResult.ok) {
    console.log('✅ Registration successful');
    console.log('   Tenant ID:', registerResult.data.tenant?.id);
    console.log('   User ID:', registerResult.data.user?.id);
  } else {
    console.log('❌ Registration failed:', registerResult.data?.error || registerResult.error);
    return;
  }

  // Test 2: Login
  console.log('\n2️⃣ Testing Login...');
  const loginResult = await testEndpoint('POST', '/api/saas/login', { email: testEmail });
  if (loginResult.ok) {
    console.log('✅ Login successful');
    console.log('   User:', loginResult.data.user?.email);
  } else {
    console.log('❌ Login failed:', loginResult.data?.error || loginResult.error);
  }

  // Test 3: Get Current User (would need cookies in real test)
  console.log('\n3️⃣ Testing /api/saas/me (requires session cookie)...');
  console.log('   ⚠️  This requires a session cookie - test manually in browser');

  // Test 4: Check if pages exist
  console.log('\n4️⃣ Testing Page Routes...');
  const pages = ['/saas', '/saas/signup', '/saas/login', '/saas/dashboard', '/saas/billing'];
  for (const page of pages) {
    const pageResult = await testEndpoint('GET', page);
    if (pageResult.status === 200 || pageResult.status === 307 || pageResult.status === 308) {
      console.log(`   ✅ ${page} - accessible`);
    } else {
      console.log(`   ⚠️  ${page} - status: ${pageResult.status}`);
    }
  }

  console.log('\n' + '='.repeat(50));
  console.log('\n✅ Basic API tests complete!');
  console.log('\n📝 Next steps:');
  console.log('   1. Test signup flow in browser: http://localhost:3000/saas/signup');
  console.log('   2. Test login flow: http://localhost:3000/saas/login');
  console.log('   3. Test dashboard: http://localhost:3000/saas/dashboard');
  console.log('   4. Test billing: http://localhost:3000/saas/billing');
}

// Check if fetch is available (Node 18+)
if (typeof fetch === 'undefined') {
  console.error('❌ This script requires Node.js 18+ with native fetch support');
  console.log('   Or install node-fetch: npm install node-fetch');
  process.exit(1);
}

runTests().catch(console.error);

