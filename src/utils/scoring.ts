export interface TrialResult {
  stimulus: string;
  category: string;
  response: 'left' | 'right';
  rt: number;
  correct: boolean;
  blockId: number;
}

export interface ScoreResult {
  meanCongruent: number;
  meanIncongruent: number;
  dScore: number;
  diffMs: number;
  interpretation: string;
  description: string;
  fasterPairing: 'congruent' | 'incongruent' | 'none';
}

function mean(values: number[]): number {
  return values.reduce((a, b) => a + b, 0) / values.length;
}

function stdDev(values: number[]): number {
  const m = mean(values);
  const variance = values.reduce((sum, v) => sum + (v - m) ** 2, 0) / values.length;
  return Math.sqrt(variance);
}

// Trim outliers: drop trials < 300ms (accidental taps) and cap at 3000ms
// Follows Greenwald et al. (2003) improved scoring conventions
function trimRTs(rts: number[]): number[] {
  return rts
    .filter(rt => rt >= 300)
    .map(rt => Math.min(rt, 3000));
}

// Association strength bands, keyed on |D|. Shared so the student results screen
// and the instructor dashboard never drift apart.
export function interpretAssociation(absD: number): string {
  if (absD < 0.15) return 'Little to no association';
  if (absD < 0.35) return 'Slight association';
  if (absD < 0.65) return 'Moderate association';
  return 'Strong association';
}

export function calculateScore(trials: TrialResult[]): ScoreResult {
  // Block 3 = congruent (Male+Boss / Female+Care)
  // Block 4 = incongruent (Female+Boss / Male+Care)
  const congruentRTs = trimRTs(
    trials.filter(t => t.blockId === 3).map(t => t.rt)
  );

  const incongruentRTs = trimRTs(
    trials.filter(t => t.blockId === 4).map(t => t.rt)
  );

  // A block can be emptied by trimming (e.g. every tap under 300ms), which would
  // make mean() return NaN. Fall back to a neutral "no data" score in that case.
  const rawCongruent = congruentRTs.length > 0 ? mean(congruentRTs) : NaN;
  const rawIncongruent = incongruentRTs.length > 0 ? mean(incongruentRTs) : NaN;
  const hasData = Number.isFinite(rawCongruent) && Number.isFinite(rawIncongruent);

  const meanCongruent = hasData ? Math.round(rawCongruent) : 0;
  const meanIncongruent = hasData ? Math.round(rawIncongruent) : 0;

  // Pooled SD across both blocks
  const allComboRTs = [...congruentRTs, ...incongruentRTs];
  const pooledSD = stdDev(allComboRTs);

  // D-score: positive = faster when congruent (Male+Boss)
  const dScore = hasData && pooledSD > 0
    ? (rawIncongruent - rawCongruent) / pooledSD
    : 0;

  const diffMs = hasData ? meanIncongruent - meanCongruent : 0;
  const absDiff = Math.abs(diffMs);
  const absD = Math.abs(dScore);

  const interpretation = interpretAssociation(absD);

  let fasterPairing: 'congruent' | 'incongruent' | 'none';
  let description: string;

  if (absD < 0.15) {
    fasterPairing = 'none';
    description = `Your sorting speeds were about the same for both pairings — a ${absDiff}ms difference, small enough to reflect chance rather than a real association. You showed little to no implicit association between gender and these roles.`;
  } else if (dScore > 0) {
    fasterPairing = 'congruent';
    description = `You sorted ${absDiff}ms faster when Male was paired with Boss Mode and Female with Care Mode. This suggests a ${interpretation.toLowerCase()} between male and career/leadership and female and caregiving.`;
  } else {
    fasterPairing = 'incongruent';
    description = `You sorted ${absDiff}ms faster when Female was paired with Boss Mode and Male with Care Mode. This suggests a ${interpretation.toLowerCase()} running counter to the typical cultural pattern.`;
  }

  return {
    meanCongruent,
    meanIncongruent,
    dScore: Math.round(dScore * 100) / 100,
    diffMs,
    interpretation,
    description,
    fasterPairing,
  };
}
