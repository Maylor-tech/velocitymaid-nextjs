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
        dateText="Wed, Nov 18, 2026"
        timeWindowText="10:00–16:00"
        areaText="Stowe"
        durationText="150 min"
        jobTypeText="Vacation-rental turnover"
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
