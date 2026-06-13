/**
 * Quick local test: cleaner login + jobs list
 * Usage: npx dotenv-cli -e .env.local -- npx tsx scripts/test-cleaner-login.ts
 */

const BASE = process.env.TEST_BASE_URL || 'http://localhost:3000';
const EMAIL = process.env.TEST_CLEANER_EMAIL || 'cleaner.nj@velocitymaid.com';

async function main() {
  const loginRes = await fetch(`${BASE}/api/cleaners/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ identifier: EMAIL }),
  });
  const loginBody = await loginRes.json();
  console.log('Login:', loginRes.status, loginBody);

  if (!loginRes.ok) {
    process.exit(1);
  }

  const cookie = loginRes.headers.get('set-cookie');
  if (!cookie) {
    console.error('No set-cookie header on login response');
    process.exit(1);
  }

  const cleanerIdMatch = cookie.match(/cleanerId=([^;]+)/);
  const cleanerId = cleanerIdMatch?.[1];
  console.log('Cookie cleanerId:', cleanerId);

  const jobsRes = await fetch(`${BASE}/api/cleaner/jobs`, {
    headers: { Cookie: `cleanerId=${cleanerId}` },
  });
  const jobsBody = await jobsRes.json();
  console.log('Jobs:', jobsRes.status, JSON.stringify(jobsBody, null, 2));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
