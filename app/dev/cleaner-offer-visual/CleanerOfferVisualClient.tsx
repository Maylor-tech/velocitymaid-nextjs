'use client';

import { useState } from 'react';
import { CleanerPortalChrome } from '@/components/cleaner/CleanerPortalChrome';
import { CleanerOfferCard } from '@/components/cleaner/CleanerOfferCard';

export function CleanerOfferVisualClient() {
  const [declineReason, setDeclineReason] = useState('');
  const [processing, setProcessing] = useState(false);

  return (
    <CleanerPortalChrome activeNav="Offers">
      <CleanerOfferCard
        title="Fern Hill · Nov 18"
        respondByLabel="Respond by 6 pm"
        compensationDisplay="$269.75"
        compensationBasisLabel="Flat rate"
        scheduleText="Check-out 10:00 · next check-in 16:00"
        jobTypeText="Vacation-rental turnover · 4 bed / 2.5 bath · checklist and photos required"
        lifecycleLabel="Offer created · notification unknown · not yet accepted"
        processing={processing}
        declineReason={declineReason}
        onDeclineReasonChange={setDeclineReason}
        onAccept={() => {
          setProcessing(true);
          setTimeout(() => setProcessing(false), 800);
        }}
        onDecline={() => {
          setProcessing(true);
          setTimeout(() => setProcessing(false), 800);
        }}
        sampleNote
      />
    </CleanerPortalChrome>
  );
}
