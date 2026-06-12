import Stripe from 'stripe';
import { config } from 'dotenv';
config({ path: '.env.local' });

async function main() {
  const key = process.env.STRIPE_SECRET_KEY ?? '';
  const pk = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? '';
  const wh = process.env.STRIPE_WEBHOOK_SECRET ?? '';

  if (!key.startsWith('sk_test_') || !pk.startsWith('pk_test_')) {
    console.log(JSON.stringify({ ok: false, issue: 'Expected test keys' }));
    return;
  }

  const stripe = new Stripe(key);
  const account = await stripe.accounts.retrieve();
  await stripe.balance.retrieve();
  console.log(
    JSON.stringify({
      ok: true,
      mode: 'test',
      accountId: account.id,
      displayName:
        account.settings?.dashboard?.display_name ??
        account.business_profile?.name ??
        null,
      secretPrefix: key.slice(0, 20),
      publishablePrefix: pk.slice(0, 20),
      webhookConfigured: wh.startsWith('whsec_') && !wh.includes('REPLACE'),
    })
  );
}

main().catch((e) =>
  console.log(JSON.stringify({ ok: false, issue: e instanceof Error ? e.message : String(e) }))
);
