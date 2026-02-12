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

export function calculateScore(trials: TrialResult[]): ScoreResult {
  // Block 3 = congruent (Male+Boss / Female+Care)
  // Block 4 = incongruent (Female+Boss / Male+Care)
  const congruentRTs = trimRTs(
    trials.filter(t => t.blockId === 3).map(t => t.rt)
  );

  const incongruentRTs = trimRTs(
    trials.filter(t => t.blockId === 4).map(t => t.rt)
  );

  const meanCongruent = Math.round(mean(congruentRTs));
  const meanIncongruent = Math.round(mean(incongruentRTs));

  // Pooled SD across both blocks
  const allComboRTs = [...congruentRTs, ...incongruentRTs];
  const pooledSD = stdDev(allComboRTs);

  // D-score: positive = faster when congruent (Male+Boss)
  const dScore = pooledSD > 0
    ? (mean(incongruentRTs) - mean(congruentRTs)) / pooledSD
    : 0;

  const diffMs = meanIncongruent - meanCongruent;
  const absDiff = Math.abs(diffMs);
  const absD = Math.abs(dScore);

  let interpretation: string;
  if (absD < 0.15) {
    interpretation = 'Little to no association';
  } else if (absD < 0.35) {
    interpretation = 'Slight association';
  } else if (absD < 0.65) {
    interpretation = 'Moderate association';
  } else {
    interpretation = 'Strong association';
  }

  let fasterPairing: 'congruent' | 'incongruent' | 'none';
  let description: string;

  if (absD < 0.15) {
    fasterPairing = 'none';
    description = `Your sorting speed was about the same for both pairings (${absDiff}ms difference). You showed little to no implicit association between gender and these roles.`;
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
