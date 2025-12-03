/**
 * Lead Scoring Service
 * Calculates lead score and tier based on various factors
 */

export interface LeadScoringInput {
  bedrooms?: number;
  bathrooms?: number;
  zip?: string;
  urgency?: string;
  previousService?: boolean;
  homeType?: string;
  referralSource?: string;
}

export interface LeadScoringResult {
  leadScore: number;
  leadTier: 'A' | 'B' | 'C';
  riskFlags: string[];
  reasoning: string[];
}

// Risk ZIP codes (areas with higher cancellation/no-show rates)
const RISK_ZIPS = [
  '07001', '07002', '07003', // Newark area
  '07101', '07102', '07103', // Newark
  '07104', '07105', '07106', // Newark
  '07107', '07108', '07109', // Newark
  '07110', '07111', '07112', // Newark
  '07114', // Newark
];

// High-value ZIP codes (areas with higher conversion and retention)
const HIGH_VALUE_ZIPS = [
  '07030', '07031', '07032', // Hoboken
  '07040', '07041', '07042', // Maplewood
  '07043', // Millburn
  '07052', // Montclair
  '07055', // Nutley
  '07083', // Westfield
  '07960', // Summit
  '07039', // Livingston
];

export function calculateLeadScore(input: LeadScoringInput): LeadScoringResult {
  let score = 0;
  const riskFlags: string[] = [];
  const reasoning: string[] = [];

  // Home Size Scoring (0-30 points)
  if (input.bedrooms && input.bathrooms) {
    const totalRooms = input.bedrooms + input.bathrooms;
    if (totalRooms >= 5) {
      score += 30;
      reasoning.push('Large home (5+ rooms): +30');
    } else if (totalRooms >= 4) {
      score += 20;
      reasoning.push('Medium-large home (4 rooms): +20');
    } else if (totalRooms >= 3) {
      score += 15;
      reasoning.push('Medium home (3 rooms): +15');
    } else {
      score += 10;
      reasoning.push('Small home (1-2 rooms): +10');
    }
  } else if (input.bedrooms) {
    if (input.bedrooms >= 4) {
      score += 25;
      reasoning.push('4+ bedrooms: +25');
    } else if (input.bedrooms >= 3) {
      score += 15;
      reasoning.push('3 bedrooms: +15');
    } else {
      score += 10;
      reasoning.push('1-2 bedrooms: +10');
    }
  }

  // Location Scoring (0-25 points)
  if (input.zip) {
    if (HIGH_VALUE_ZIPS.includes(input.zip)) {
      score += 25;
      reasoning.push(`High-value ZIP (${input.zip}): +25`);
    } else if (RISK_ZIPS.includes(input.zip)) {
      score += 5;
      riskFlags.push('risk_zip');
      reasoning.push(`Risk ZIP (${input.zip}): +5 (flagged)`);
    } else {
      score += 15;
      reasoning.push(`Standard ZIP (${input.zip}): +15`);
    }
  } else {
    score += 10;
    reasoning.push('No ZIP provided: +10');
  }

  // Urgency Scoring (0-20 points)
  if (input.urgency) {
    switch (input.urgency) {
      case 'asap':
        score += 20;
        reasoning.push('ASAP urgency: +20');
        break;
      case 'this_week':
        score += 15;
        reasoning.push('This week urgency: +15');
        break;
      case 'this_month':
        score += 10;
        reasoning.push('This month urgency: +10');
        break;
      case 'exploring':
        score += 5;
        reasoning.push('Exploring (low urgency): +5');
        break;
      default:
        score += 5;
        reasoning.push('Unknown urgency: +5');
    }
  } else {
    score += 5;
    reasoning.push('No urgency specified: +5');
  }

  // Previous Service Experience (0-15 points)
  if (input.previousService) {
    score += 15;
    reasoning.push('Previous cleaning service experience: +15');
  } else {
    score += 5;
    reasoning.push('No previous service: +5');
  }

  // Home Type Scoring (0-10 points)
  if (input.homeType) {
    switch (input.homeType) {
      case 'house':
        score += 10;
        reasoning.push('House: +10');
        break;
      case 'townhouse':
        score += 8;
        reasoning.push('Townhouse: +8');
        break;
      case 'condo':
        score += 6;
        reasoning.push('Condo: +6');
        break;
      case 'apartment':
        score += 5;
        reasoning.push('Apartment: +5');
        break;
      default:
        score += 5;
        reasoning.push('Unknown home type: +5');
    }
  } else {
    score += 5;
    reasoning.push('No home type specified: +5');
  }

  // Referral Source Scoring (0-15 points)
  if (input.referralSource) {
    switch (input.referralSource) {
      case 'referral':
        score += 15;
        reasoning.push('Referral source: +15');
        break;
      case 'google':
        score += 12;
        reasoning.push('Google source: +12');
        break;
      case 'facebook':
        score += 10;
        reasoning.push('Facebook source: +10');
        break;
      case 'direct':
        score += 8;
        reasoning.push('Direct source: +8');
        break;
      default:
        score += 5;
        reasoning.push('Unknown source: +5');
    }
  } else {
    score += 5;
    reasoning.push('No referral source: +5');
  }

  // Determine Tier
  let tier: 'A' | 'B' | 'C';
  if (score >= 80) {
    tier = 'A';
  } else if (score >= 50) {
    tier = 'B';
  } else {
    tier = 'C';
  }

  // Additional risk flags
  if (input.zip && RISK_ZIPS.includes(input.zip)) {
    riskFlags.push('risk_zip');
  }
  if (!input.phone || input.phone.length < 10) {
    riskFlags.push('invalid_phone');
  }
  if (!input.email || !input.email.includes('@')) {
    riskFlags.push('invalid_email');
  }
  if (input.urgency === 'exploring' && score < 50) {
    riskFlags.push('low_urgency');
  }

  return {
    leadScore: Math.min(100, Math.max(0, score)), // Clamp between 0-100
    leadTier: tier,
    riskFlags,
    reasoning,
  };
}

