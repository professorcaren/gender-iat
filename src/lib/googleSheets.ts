import type { ScoreResult } from '../utils/scoring';
import type { PrimingMajorScore } from '../utils/primingScoring';

export interface ClassSummary {
  count: number;
  avgDScore: number | null;
  avgCongruentMs: number | null;
  avgIncongruentMs: number | null;
  congruentFasterPct: number | null;
  generatedAt: string | null;
}

type SubmitOutcome = 'submitted' | 'disabled';

function getScriptUrl(): string | null {
  const rawValue = import.meta.env.VITE_GOOGLE_SCRIPT_URL;
  if (!rawValue || typeof rawValue !== 'string') return null;
  const trimmed = rawValue.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function toNumberOrNull(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string' && value.trim().length > 0) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

export async function submitScoreToSheet(score: ScoreResult): Promise<SubmitOutcome> {
  const scriptUrl = getScriptUrl();
  if (!scriptUrl) return 'disabled';

  const payload = {
    app: 'gender-iat',
    completedAt: new Date().toISOString(),
    score,
  };

  await fetch(scriptUrl, {
    method: 'POST',
    mode: 'no-cors',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify(payload),
    keepalive: true,
  });

  return 'submitted';
}

export async function submitPrimingScoreToSheet(scores: PrimingMajorScore[]): Promise<SubmitOutcome> {
  const scriptUrl = getScriptUrl();
  if (!scriptUrl) return 'disabled';

  const payload = {
    app: 'gender-iat-priming',
    completedAt: new Date().toISOString(),
    scores,
  };

  await fetch(scriptUrl, {
    method: 'POST',
    mode: 'no-cors',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify(payload),
    keepalive: true,
  });

  return 'submitted';
}

export interface PrimingClassMajor {
  major: string;
  avgDiff: number;
  count: number;
}

export interface PrimingClassSummary {
  responseCount: number;
  majors: PrimingClassMajor[];
  generatedAt: string | null;
}

export async function fetchPrimingSummaryFromSheet(): Promise<PrimingClassSummary> {
  const scriptUrl = getScriptUrl();
  if (!scriptUrl) {
    throw new Error('Missing VITE_GOOGLE_SCRIPT_URL');
  }

  const separator = scriptUrl.includes('?') ? '&' : '?';
  const response = await fetch(`${scriptUrl}${separator}action=priming_summary`, {
    method: 'GET',
    cache: 'no-store',
  });

  if (!response.ok) {
    throw new Error(`Priming summary request failed (${response.status})`);
  }

  const data = await response.json() as Record<string, unknown>;
  const rawMajors = Array.isArray(data.majors) ? data.majors : [];

  return {
    responseCount: Math.max(0, Math.round(toNumberOrNull(data.responseCount) ?? 0)),
    majors: rawMajors.map((m: Record<string, unknown>) => ({
      major: String(m.major || ''),
      avgDiff: toNumberOrNull(m.avgDiff) ?? 0,
      count: Math.round(toNumberOrNull(m.count) ?? 0),
    })).sort((a: PrimingClassMajor, b: PrimingClassMajor) => b.avgDiff - a.avgDiff),
    generatedAt: typeof data.generatedAt === 'string' ? data.generatedAt : null,
  };
}

export async function fetchClassSummaryFromSheet(): Promise<ClassSummary> {
  const scriptUrl = getScriptUrl();
  if (!scriptUrl) {
    throw new Error('Missing VITE_GOOGLE_SCRIPT_URL');
  }

  const separator = scriptUrl.includes('?') ? '&' : '?';
  const response = await fetch(`${scriptUrl}${separator}action=summary`, {
    method: 'GET',
    cache: 'no-store',
  });

  if (!response.ok) {
    throw new Error(`Summary request failed (${response.status})`);
  }

  const data = await response.json() as Record<string, unknown>;

  return {
    count: Math.max(0, Math.round(toNumberOrNull(data.count) ?? 0)),
    avgDScore: toNumberOrNull(data.avgDScore),
    avgCongruentMs: toNumberOrNull(data.avgCongruentMs),
    avgIncongruentMs: toNumberOrNull(data.avgIncongruentMs),
    congruentFasterPct: toNumberOrNull(data.congruentFasterPct),
    generatedAt: typeof data.generatedAt === 'string' ? data.generatedAt : null,
  };
}
