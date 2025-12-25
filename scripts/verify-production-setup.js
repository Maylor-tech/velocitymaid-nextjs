/**
 * Production Setup Verification Script
 * 
 * Run this script to verify your production environment is configured correctly.
 * 
 * Usage:
 *   node scripts/verify-production-setup.js
 */

const requiredEnvVars = [
  'DATABASE_URL',
  'STRIPE_SECRET_KEY',
  'NEXT_PUBLIC_BASE_URL',
  'RESEND_API_KEY',
];

const optionalEnvVars = [
  'STRIPE_WEBHOOK_SECRET',
  'CRON_SECRET',
  'NEXT_PUBLIC_GA_MEASUREMENT_ID',
  'RESEND_FROM_EMAIL',
];

function checkEnvVar(name, required = true) {
  const value = process.env[name];
  const exists = !!value;
  
  if (required && !exists) {
    console.error(`❌ ${name}: MISSING (REQUIRED)`);
    return false;
  }
  
  if (!exists) {
    console.log(`⚠️  ${name}: Not set (optional)`);
    return true;
  }
  
  // Special validation for specific vars
  if (name === 'STRIPE_SECRET_KEY') {
    if (value.startsWith('sk_test_')) {
      console.warn(`⚠️  ${name}: Using TEST key (use sk_live_ for production)`);
    } else if (value.startsWith('sk_live_')) {
      console.log(`✅ ${name}: Using LIVE key`);
    } else {
      console.error(`❌ ${name}: Invalid format (should start with sk_test_ or sk_live_)`);
      return false;
    }
  }
  
  if (name === 'NEXT_PUBLIC_BASE_URL') {
    if (!value.startsWith('http')) {
      console.error(`❌ ${name}: Must start with http:// or https://`);
      return false;
    }
    if (value.includes('localhost') && process.env.NODE_ENV === 'production') {
      console.warn(`⚠️  ${name}: Using localhost in production (should be production domain)`);
    } else {
      console.log(`✅ ${name}: ${value}`);
    }
  }
  
  if (name === 'STRIPE_WEBHOOK_SECRET' && value) {
    if (!value.startsWith('whsec_')) {
      console.warn(`⚠️  ${name}: Should start with whsec_`);
    } else {
      console.log(`✅ ${name}: Set`);
    }
  }
  
  if (exists && !name.includes('SECRET') && !name.includes('KEY') && !name.includes('PASSWORD')) {
    console.log(`✅ ${name}: Set`);
  } else if (exists) {
    console.log(`✅ ${name}: Set (hidden)`);
  }
  
  return true;
}

function main() {
  console.log('\n🔍 Production Setup Verification\n');
  console.log('=' .repeat(50));
  
  let allPassed = true;
  
  console.log('\n📋 Required Environment Variables:');
  console.log('-'.repeat(50));
  requiredEnvVars.forEach(varName => {
    if (!checkEnvVar(varName, true)) {
      allPassed = false;
    }
  });
  
  console.log('\n📋 Optional Environment Variables:');
  console.log('-'.repeat(50));
  optionalEnvVars.forEach(varName => {
    checkEnvVar(varName, false);
  });
  
  console.log('\n' + '='.repeat(50));
  
  if (allPassed) {
    console.log('\n✅ All required environment variables are set!');
    console.log('\n📝 Next Steps:');
    console.log('   1. Verify Stripe webhook endpoint is configured');
    console.log('   2. Test complete booking flow end-to-end');
    console.log('   3. Verify email delivery is working');
    console.log('   4. Check Vercel deployment logs for errors');
  } else {
    console.log('\n❌ Some required environment variables are missing!');
    console.log('\n📝 Action Required:');
    console.log('   1. Add missing variables to Vercel Dashboard');
    console.log('   2. Redeploy your application');
    console.log('   3. Run this script again to verify');
  }
  
  console.log('\n');
}

// Only run if called directly
if (require.main === module) {
  main();
}

module.exports = { checkEnvVar, requiredEnvVars, optionalEnvVars };



