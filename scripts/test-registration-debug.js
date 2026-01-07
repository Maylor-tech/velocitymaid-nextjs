/**
 * Debug script to test registration and see actual error
 */

const BASE_URL = 'http://localhost:3000';

async function testRegistration() {
  const testEmail = `test-debug-${Date.now()}@example.com`;
  
  console.log('Testing registration with:', testEmail);
  
  try {
    const response = await fetch(`${BASE_URL}/api/saas/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: 'Test User',
        email: testEmail,
        companyName: 'Test Cleaning Co',
        phone: '(555) 123-4567',
      }),
    });

    const data = await response.json();
    
    console.log('\nResponse Status:', response.status);
    console.log('Response Data:', JSON.stringify(data, null, 2));
    
    if (!response.ok) {
      console.error('\n❌ Registration failed');
      console.error('Error:', data.error);
      if (data.details) {
        console.error('Details:', data.details);
      }
    } else {
      console.log('\n✅ Registration successful');
      console.log('Tenant ID:', data.tenant?.id);
      console.log('User ID:', data.user?.id);
    }
  } catch (error) {
    console.error('Request failed:', error.message);
  }
}

testRegistration();

