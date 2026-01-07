/**
 * Production Readiness Test Script
 * 
 * Tests all SaaS endpoints for production readiness
 * Run with: node scripts/test-saas-production.js
 */

const BASE_URL = process.env.TEST_URL || 'http://localhost:3000';

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function testEndpoint(method, path, body = null, expectedStatus = 200) {
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
    const data = await response.json().catch(() => ({ error: 'Invalid JSON response' }));
    
    const passed = response.status === expectedStatus;
    return {
      passed,
      status: response.status,
      expectedStatus,
      data,
      error: passed ? null : `Expected ${expectedStatus}, got ${response.status}`,
    };
  } catch (error) {
    return {
      passed: false,
      status: null,
      expectedStatus,
      error: error.message,
    };
  }
}

async function runTests() {
  log('\n🧪 SaaS Production Readiness Tests\n', 'blue');
  log('='.repeat(60), 'blue');

  const results = [];
  let passed = 0;
  let failed = 0;

  // Test 1: Health Check
  log('\n1️⃣ Testing Health Check...', 'yellow');
  const healthResult = await testEndpoint('GET', '/api/health', null, 200);
  results.push({ name: 'Health Check', ...healthResult });
  if (healthResult.passed) {
    log('   ✅ Health check passed', 'green');
    passed++;
  } else {
    log(`   ❌ Health check failed: ${healthResult.error}`, 'red');
    failed++;
  }

  // Test 2: Registration - Valid Data
  log('\n2️⃣ Testing Registration (Valid Data)...', 'yellow');
  const testEmail = `test-${Date.now()}@example.com`;
  const registerResult = await testEndpoint('POST', '/api/saas/register', {
    name: 'Test User',
    email: testEmail,
    companyName: 'Test Cleaning Co',
    phone: '(555) 123-4567',
  }, 200);
  results.push({ name: 'Registration (Valid)', ...registerResult });
  if (registerResult.passed) {
    log('   ✅ Registration successful', 'green');
    passed++;
  } else {
    log(`   ❌ Registration failed: ${registerResult.error}`, 'red');
    failed++;
  }

  // Test 3: Registration - Invalid Email
  log('\n3️⃣ Testing Registration (Invalid Email)...', 'yellow');
  const invalidEmailResult = await testEndpoint('POST', '/api/saas/register', {
    name: 'Test User',
    email: 'invalid-email',
    companyName: 'Test Co',
  }, 400);
  results.push({ name: 'Registration (Invalid Email)', ...invalidEmailResult });
  if (invalidEmailResult.passed) {
    log('   ✅ Correctly rejected invalid email', 'green');
    passed++;
  } else {
    log(`   ❌ Should have rejected invalid email: ${invalidEmailResult.error}`, 'red');
    failed++;
  }

  // Test 4: Registration - Missing Fields
  log('\n4️⃣ Testing Registration (Missing Fields)...', 'yellow');
  const missingFieldsResult = await testEndpoint('POST', '/api/saas/register', {
    name: 'Test User',
    // Missing email and companyName
  }, 400);
  results.push({ name: 'Registration (Missing Fields)', ...missingFieldsResult });
  if (missingFieldsResult.passed) {
    log('   ✅ Correctly rejected missing fields', 'green');
    passed++;
  } else {
    log(`   ❌ Should have rejected missing fields: ${missingFieldsResult.error}`, 'red');
    failed++;
  }

  // Test 5: Registration - Duplicate Email
  log('\n5️⃣ Testing Registration (Duplicate Email)...', 'yellow');
  const duplicateResult = await testEndpoint('POST', '/api/saas/register', {
    name: 'Test User 2',
    email: testEmail, // Use same email as test 2
    companyName: 'Another Co',
  }, 409);
  results.push({ name: 'Registration (Duplicate)', ...duplicateResult });
  if (duplicateResult.passed) {
    log('   ✅ Correctly rejected duplicate email', 'green');
    passed++;
  } else {
    log(`   ❌ Should have rejected duplicate email: ${duplicateResult.error}`, 'red');
    failed++;
  }

  // Test 6: Login - Valid Email
  log('\n6️⃣ Testing Login (Valid Email)...', 'yellow');
  const loginResult = await testEndpoint('POST', '/api/saas/login', {
    email: testEmail,
  }, 200);
  results.push({ name: 'Login (Valid)', ...loginResult });
  if (loginResult.passed) {
    log('   ✅ Login successful', 'green');
    passed++;
  } else {
    log(`   ❌ Login failed: ${loginResult.error}`, 'red');
    failed++;
  }

  // Test 7: Login - Invalid Email
  log('\n7️⃣ Testing Login (Invalid Email)...', 'yellow');
  const invalidLoginResult = await testEndpoint('POST', '/api/saas/login', {
    email: 'nonexistent@example.com',
  }, 401);
  results.push({ name: 'Login (Invalid)', ...invalidLoginResult });
  if (invalidLoginResult.passed) {
    log('   ✅ Correctly rejected invalid login', 'green');
    passed++;
  } else {
    log(`   ❌ Should have rejected invalid login: ${invalidLoginResult.error}`, 'red');
    failed++;
  }

  // Test 8: Get Current User (Unauthenticated)
  log('\n8️⃣ Testing /api/saas/me (Unauthenticated)...', 'yellow');
  const unauthenticatedResult = await testEndpoint('GET', '/api/saas/me', null, 401);
  results.push({ name: 'Get User (Unauthenticated)', ...unauthenticatedResult });
  if (unauthenticatedResult.passed) {
    log('   ✅ Correctly requires authentication', 'green');
    passed++;
  } else {
    log(`   ❌ Should require authentication: ${unauthenticatedResult.error}`, 'red');
    failed++;
  }

  // Summary
  log('\n' + '='.repeat(60), 'blue');
  log(`\n📊 Test Results: ${passed} passed, ${failed} failed`, failed > 0 ? 'red' : 'green');
  
  if (failed > 0) {
    log('\n❌ Failed Tests:', 'red');
    results.filter(r => !r.passed).forEach(r => {
      log(`   - ${r.name}: ${r.error}`, 'red');
    });
  }

  log('\n✅ Production Readiness Check Complete!\n', failed === 0 ? 'green' : 'yellow');
  
  return { passed, failed, total: passed + failed };
}

// Check if fetch is available
if (typeof fetch === 'undefined') {
  log('❌ This script requires Node.js 18+ with native fetch support', 'red');
  log('   Or install node-fetch: npm install node-fetch', 'yellow');
  process.exit(1);
}

runTests()
  .then(({ passed, failed }) => {
    process.exit(failed > 0 ? 1 : 0);
  })
  .catch(error => {
    log(`\n❌ Test script error: ${error.message}`, 'red');
    console.error(error);
    process.exit(1);
  });

