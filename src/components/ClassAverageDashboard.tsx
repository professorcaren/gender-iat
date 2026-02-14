import { useCallback, useEffect, useMemo, useState } from 'react';
import { fetchClassSummaryFromSheet, type ClassSummary } from '../lib/googleSheets';

const REFRESH_INTERVAL_MS = 20000;

function formatMs(value: number | null): string {
  if (value === null) return '--';
  return `${Math.round(value)} ms`;
}

function formatDScore(value: number | null): string {
  if (value === null) return '--';
  return value.toFixed(2);
}

function formatPercent(value: number | null): string {
  if (value === null) return '--';
  return `${value.toFixed(1)}%`;
}

function describeAssociation(value: number | null): string {
  if (value === null) return 'No data yet';
  const absValue = Math.abs(value);
  if (absValue < 0.15) return 'Little to no association';
  if (absValue < 0.35) return 'Slight association';
  if (absValue < 0.65) return 'Moderate association';
  return 'Strong association';
}

function toWidth(value: number, maxValue: number): number {
  if (maxValue <= 0) return 0;
  return Math.max(12, (value / (maxValue * 1.15)) * 100);
}

export default function ClassAverageDashboard() {
  const [summary, setSummary] = useState<ClassSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const loadSummary = useCallback(async () => {
    try {
      const data = await fetchClassSummaryFromSheet();
      setSummary(data);
      setErrorMessage(null);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Could not load summary');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadSummary();
    const timer = window.setInterval(() => {
      void loadSummary();
    }, REFRESH_INTERVAL_MS);

    return () => window.clearInterval(timer);
  }, [loadSummary]);

  const diffMs = useMemo(() => {
    if (!summary || summary.avgCongruentMs === null || summary.avgIncongruentMs === null) {
      return null;
    }
    return Math.round(summary.avgIncongruentMs - summary.avgCongruentMs);
  }, [summary]);

  const maxMean = useMemo(() => {
    if (!summary || summary.avgCongruentMs === null || summary.avgIncongruentMs === null) {
      return 0;
    }
    return Math.max(summary.avgCongruentMs, summary.avgIncongruentMs);
  }, [summary]);

  const congruentMean = summary?.avgCongruentMs ?? null;
  const incongruentMean = summary?.avgIncongruentMs ?? null;

  return (
    <div className="fixed inset-0 bg-slate-900 overflow-y-auto">
      <div className="max-w-2xl mx-auto px-6 py-10">
        <div className="mb-8">
          <p className="text-slate-400 text-xs uppercase tracking-wider mb-2">Instructor View</p>
          <h1 className="text-3xl font-black text-white">Class Average Dashboard</h1>
          <p className="text-slate-400 mt-3">
            Aggregates only. No individual student responses are shown here.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-slate-800 rounded-2xl p-4">
            <p className="text-slate-400 text-xs uppercase tracking-wider mb-1">Responses</p>
            <p className="text-white text-3xl font-black">{summary?.count ?? '--'}</p>
          </div>
          <div className="bg-slate-800 rounded-2xl p-4">
            <p className="text-slate-400 text-xs uppercase tracking-wider mb-1">Average D-Score</p>
            <p className="text-white text-3xl font-black">{formatDScore(summary?.avgDScore ?? null)}</p>
          </div>
        </div>

        <div className="bg-slate-800/60 rounded-2xl p-5 mb-6">
          <p className="text-slate-400 text-xs uppercase tracking-wider mb-2">Average Interpretation</p>
          <p className="text-white text-xl font-bold">{describeAssociation(summary?.avgDScore ?? null)}</p>
          {diffMs !== null && (
            <p className="text-slate-300 text-sm mt-2">
              Mean difference (Incongruent - Congruent): {diffMs} ms
            </p>
          )}
          <p className="text-slate-300 text-sm mt-2">
            Faster on congruent pairing: {formatPercent(summary?.congruentFasterPct ?? null)}
          </p>
        </div>

        <div className="bg-slate-800/60 rounded-2xl p-5 mb-6">
          <h2 className="text-white text-sm font-bold mb-3">Average Sorting Speed (Overlap)</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
            <div className="rounded-xl bg-slate-800 p-3">
              <p className="text-blue-300 text-xs mb-1">Male+Boss / Female+Care</p>
              <p className="text-white font-bold">{formatMs(summary?.avgCongruentMs ?? null)}</p>
            </div>
            <div className="rounded-xl bg-slate-800 p-3">
              <p className="text-orange-300 text-xs mb-1">Female+Boss / Male+Care</p>
              <p className="text-white font-bold">{formatMs(summary?.avgIncongruentMs ?? null)}</p>
            </div>
          </div>

          <div className="relative h-16 rounded-xl overflow-hidden bg-slate-700/40 border border-slate-600/60">
            <div
              className="absolute left-0 top-0 h-full bg-blue-500/70 transition-all duration-500"
              style={{
                width: congruentMean !== null && maxMean > 0
                  ? `${toWidth(congruentMean, maxMean)}%`
                  : '0%',
              }}
            />
            <div
              className="absolute left-0 top-0 h-full bg-orange-500/60 transition-all duration-500 mix-blend-screen"
              style={{
                width: incongruentMean !== null && maxMean > 0
                  ? `${toWidth(incongruentMean, maxMean)}%`
                  : '0%',
              }}
            />
            <div className="absolute inset-0 pointer-events-none bg-gradient-to-r from-transparent via-white/5 to-transparent" />
          </div>
          <div className="flex justify-between text-[11px] text-slate-400 mt-2">
            <span>0 ms</span>
            <span>{maxMean > 0 ? `${Math.round(maxMean)} ms` : '--'}</span>
          </div>
        </div>

        <div className="flex items-center justify-between gap-4">
          <a
            href="#/"
            className="inline-block bg-slate-700 hover:bg-slate-600 text-white text-sm font-semibold px-4 py-3 rounded-xl transition-colors"
          >
            Back To Student View
          </a>
          <button
            onClick={() => void loadSummary()}
            className="bg-blue-500 hover:bg-blue-600 text-white text-sm font-semibold px-4 py-3 rounded-xl transition-colors"
          >
            Refresh
          </button>
        </div>

        {isLoading && (
          <p className="text-slate-500 text-sm mt-4">Loading class summary...</p>
        )}
        {errorMessage && (
          <p className="text-red-300 text-sm mt-4">
            {errorMessage}. Check your `VITE_GOOGLE_SCRIPT_URL` and Apps Script deployment.
          </p>
        )}
        {!isLoading && summary?.generatedAt && (
          <p className="text-slate-500 text-xs mt-4">
            Updated {new Date(summary.generatedAt).toLocaleTimeString()}
          </p>
        )}
      </div>
    </div>
  );
}
