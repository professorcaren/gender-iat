import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  fetchClassSummaryFromSheet,
  fetchPrimingSummaryFromSheet,
  type ClassSummary,
  type PrimingClassSummary,
} from '../lib/googleSheets';

const REFRESH_INTERVAL_MS = 20000;

type Tab = 'iat' | 'priming';

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
  const [tab, setTab] = useState<Tab>('iat');
  const [summary, setSummary] = useState<ClassSummary | null>(null);
  const [primingSummary, setPrimingSummary] = useState<PrimingClassSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const loadSummary = useCallback(async () => {
    try {
      const [iatData, primingData] = await Promise.all([
        fetchClassSummaryFromSheet(),
        fetchPrimingSummaryFromSheet(),
      ]);
      setSummary(iatData);
      setPrimingSummary(primingData);
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

  const maxAbsDiff = useMemo(() => {
    if (!primingSummary || primingSummary.majors.length === 0) return 1;
    return Math.max(...primingSummary.majors.map(m => Math.abs(m.avgDiff)), 1);
  }, [primingSummary]);

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

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setTab('iat')}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
              tab === 'iat'
                ? 'bg-blue-500 text-white'
                : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            Gender IAT
          </button>
          <button
            onClick={() => setTab('priming')}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
              tab === 'priming'
                ? 'bg-violet-500 text-white'
                : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            Major Priming
          </button>
        </div>

        {/* IAT Tab */}
        {tab === 'iat' && (
          <>
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
          </>
        )}

        {/* Priming Tab */}
        {tab === 'priming' && (
          <>
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-slate-800 rounded-2xl p-4">
                <p className="text-slate-400 text-xs uppercase tracking-wider mb-1">Responses</p>
                <p className="text-white text-3xl font-black">{primingSummary?.responseCount ?? '--'}</p>
              </div>
              <div className="bg-slate-800 rounded-2xl p-4">
                <p className="text-slate-400 text-xs uppercase tracking-wider mb-1">Majors Tracked</p>
                <p className="text-white text-3xl font-black">{primingSummary?.majors.length ?? '--'}</p>
              </div>
            </div>

            {primingSummary && primingSummary.majors.length > 0 ? (
              <div className="bg-slate-800/60 rounded-2xl p-5 mb-6">
                <h2 className="text-white text-sm font-bold mb-2">Class Average: Gender Association by Major</h2>
                <p className="text-slate-500 text-xs mb-4">
                  Positive (blue) = class averaged faster sorting male names after this major.
                  Negative (orange) = faster sorting female names.
                </p>

                {/* Legend */}
                <div className="flex items-center gap-6 mb-4">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-sm bg-blue-500" />
                    <span className="text-slate-400 text-xs">Male-associated</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-sm bg-orange-500" />
                    <span className="text-slate-400 text-xs">Female-associated</span>
                  </div>
                </div>

                <div className="space-y-2">
                  {primingSummary.majors.map((m) => {
                    const barPct = Math.abs(m.avgDiff) / maxAbsDiff * 45;
                    const isMale = m.avgDiff > 0;

                    return (
                      <div key={m.major} className="flex items-center gap-2">
                        <div className="w-[140px] flex-shrink-0 text-right">
                          <p className="text-slate-300 text-xs truncate">{m.major}</p>
                        </div>
                        <div className="flex-1 flex items-center h-6 relative">
                          <div className="absolute left-1/2 top-0 bottom-0 w-px bg-slate-600" />
                          <div className="w-full flex items-center" style={{ justifyContent: isMale ? 'flex-end' : 'flex-start' }}>
                            {!isMale && (
                              <>
                                <div className="w-1/2 flex justify-end">
                                  <div
                                    className="h-5 rounded-l-sm bg-orange-500"
                                    style={{ width: `${barPct}%` }}
                                  />
                                </div>
                                <div className="w-1/2" />
                              </>
                            )}
                            {isMale && (
                              <>
                                <div className="w-1/2" />
                                <div className="w-1/2 flex justify-start">
                                  <div
                                    className="h-5 rounded-r-sm bg-blue-500"
                                    style={{ width: `${barPct}%` }}
                                  />
                                </div>
                              </>
                            )}
                          </div>
                        </div>
                        <div className="w-[55px] flex-shrink-0">
                          <p className="text-slate-500 text-xs font-mono">
                            {m.avgDiff > 0 ? '+' : ''}{m.avgDiff}ms
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="bg-slate-800/60 rounded-2xl p-5 mb-6">
                <p className="text-slate-400 text-sm">No priming data yet. Students need to complete the Major Priming task.</p>
              </div>
            )}
          </>
        )}

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
