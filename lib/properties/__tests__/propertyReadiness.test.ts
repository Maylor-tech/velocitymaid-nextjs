import { describe, it, expect } from 'vitest';
import { evaluateHostPropertyReadiness } from '../propertyReadiness';

const fullBrief = {
  accessType: 'LOCKBOX',
  standingInstructions: 'Reset for next guest, start laundry.',
  linenInstructions: 'Fresh linens in hall closet.',
  supplyStorageLocation: 'Under kitchen sink.',
  trashInstructions: 'Curb on Tuesday.',
};

describe('evaluateHostPropertyReadiness', () => {
  it('is ready when all required + recommended fields are filled', () => {
    const r = evaluateHostPropertyReadiness(fullBrief);
    expect(r.ready).toBe(true);
    expect(r.missingRequired).toHaveLength(0);
    expect(r.missingRecommended).toHaveLength(0);
    expect(r.requiredDone).toBe(r.requiredTotal);
  });

  it('is ready (required met) even when only recommended fields are missing', () => {
    const r = evaluateHostPropertyReadiness({
      accessType: 'KEYPAD',
      standingInstructions: 'Standard turn.',
    });
    expect(r.ready).toBe(true);
    expect(r.missingRequired).toHaveLength(0);
    expect(r.missingRecommended.map((i) => i.key).sort()).toEqual([
      'linens',
      'trash',
    ]);
  });

  it('is not ready when access method is missing', () => {
    const r = evaluateHostPropertyReadiness({
      ...fullBrief,
      accessType: null,
    });
    expect(r.ready).toBe(false);
    expect(r.missingRequired.map((i) => i.key)).toEqual(['access']);
  });

  it('is not ready when standing instructions are missing', () => {
    const r = evaluateHostPropertyReadiness({
      ...fullBrief,
      standingInstructions: '',
    });
    expect(r.ready).toBe(false);
    expect(r.missingRequired.map((i) => i.key)).toEqual(['standingInstructions']);
  });

  it('treats whitespace-only values as empty', () => {
    const r = evaluateHostPropertyReadiness({
      accessType: '   ',
      standingInstructions: '\n\t ',
    });
    expect(r.ready).toBe(false);
    expect(r.missingRequired).toHaveLength(2);
    expect(r.requiredDone).toBe(0);
  });

  it('counts linens as done when either linen or supply info is present', () => {
    const supplyOnly = evaluateHostPropertyReadiness({
      accessType: 'LOCKBOX',
      standingInstructions: 'Turn it.',
      supplyStorageLocation: 'Garage shelf.',
    });
    expect(supplyOnly.missingRecommended.map((i) => i.key)).toEqual(['trash']);

    const linenOnly = evaluateHostPropertyReadiness({
      accessType: 'LOCKBOX',
      standingInstructions: 'Turn it.',
      linenInstructions: 'Closet.',
    });
    expect(linenOnly.missingRecommended.map((i) => i.key)).toEqual(['trash']);
  });

  it('reports both required items missing on an empty property', () => {
    const r = evaluateHostPropertyReadiness({});
    expect(r.ready).toBe(false);
    expect(r.requiredTotal).toBe(2);
    expect(r.requiredDone).toBe(0);
    expect(r.missingRequired.map((i) => i.key).sort()).toEqual([
      'access',
      'standingInstructions',
    ]);
    expect(r.missingRecommended).toHaveLength(2);
  });
});
