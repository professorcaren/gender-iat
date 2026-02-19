import type { PrimingTrialResult } from '../data/primingStimuli';

export interface PrimingMajorScore {
  major: string;
  meanMaleRT: number;
  meanFemaleRT: number;
  diff: number; // positive = male-associated (faster female RT → higher diff)
}

function mean(values: number[]): number {
  return values.reduce((a, b) => a + b, 0) / values.length;
}

function trimRT(rt: number): number | null {
  if (rt < 300) return null; // accidental tap
  return Math.min(rt, 3000);   // cap outliers
}

export function calculatePrimingScores(results: PrimingTrialResult[]): PrimingMajorScore[] {
  const byMajor = new Map<string, { maleRTs: number[]; femaleRTs: number[] }>();

  for (const r of results) {
    if (!r.correct) continue;

    const trimmed = trimRT(r.rt);
    if (trimmed === null) continue;

    let entry = byMajor.get(r.major);
    if (!entry) {
      entry = { maleRTs: [], femaleRTs: [] };
      byMajor.set(r.major, entry);
    }

    if (r.targetCategory === 'male') {
      entry.maleRTs.push(trimmed);
    } else {
      entry.femaleRTs.push(trimmed);
    }
  }

  const scores: PrimingMajorScore[] = [];

  for (const [major, { maleRTs, femaleRTs }] of byMajor) {
    if (maleRTs.length === 0 || femaleRTs.length === 0) continue;

    const meanMaleRT = Math.round(mean(maleRTs));
    const meanFemaleRT = Math.round(mean(femaleRTs));
    const diff = meanFemaleRT - meanMaleRT; // positive = male-associated

    scores.push({ major, meanMaleRT, meanFemaleRT, diff });
  }

  scores.sort((a, b) => b.diff - a.diff);

  return scores;
}
