import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  fetchClassSummaryFromSheet,
  fetchPrimingSummaryFromSheet,
  type ClassSummary,
  type PrimingClassSummary,
} from '../lib/googleSheets';
import { interpretAssociation } from '../utils/scoring';

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
  return interpretAssociation(Math.abs(value));
}

// The four combined-block pairing cells, congruent pair first. `pairing` drives
// the dot colour so the two stereotype-consistent cells read together.
const CELLS = [
  { key: 'maleBoss', label: 'Male + Boss', pairing: 'congruent' },
  { key: 'femaleCare', label: 'Female + Care', pairing: 'congruent' },
  { key: 'femaleBoss', label: 'Female + Boss', pairing: 'incongruent' },
  { key: 'maleCare', label: 'Male + Care', pairing: 'incongruent' },
] as const;

export default function ClassAverageDashboard() {
  const [tab, setTab] = useState<Tab>('iat');
  const [summary, setSummary] = useState<ClassSummary | null>(null);
  const [primingSummary, setPrimingSummary] = useState<PrimingClassSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const loadSummary = useCallback(async () => {
    // Fetch both summaries independently so a failure in one tab (e.g. a missing
    // Priming sheet) doesn't blank the other tab's data.
    const [iatResult, primingResult] = await Promise.allSettled([
      fetchClassSummaryFromSheet(),
      fetchPrimingSummaryFromSheet(),
    ]);

    if (iatResult.status === 'fulfilled') setSummary(iatResult.value);
    if (primingResult.status === 'fulfilled') setPrimingSummary(primingResult.value);

    const failure = [iatResult, primingResult].find(r => r.status === 'rejected') as
      | PromiseRejectedResult
      | undefined;
    if (failure) {
      const reason = failure.reason;
      setErrorMessage(reason instanceof Error ? reason.message : 'Could not load summary');
    } else {
      setErrorMessage(null);
    }

    setIsLoading(false);
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

  // Per-cell dot-plot rows (median + IQR) sharing one x-scale. Null when the
  // Apps Script deployment predates the cell columns (no `cells` in the payload).
  const cellChart = useMemo(() => {
    const cells = summary?.cells;
    if (!cells) return null;
    const rows = CELLS.map(c => ({ ...c, ...cells[c.key] }));
    const hasData = rows.some(r => r.median !== null);
    const xMax = Math.max(...rows.flatMap(r => [r.median ?? 0, r.p75 ?? 0]), 1);
    return { rows, hasData, xMax };
  }, [summary]);

  const chanceExcess = summary?.congruentFasterPct != null
    ? summary.congruentFasterPct - 50
    : null;

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
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="bg-slate-800 rounded-2xl p-4">
                <p className="text-slate-400 text-xs uppercase tracking-wider mb-1">Responses</p>
                <p className="text-white text-3xl font-black">{summary?.count ?? '--'}</p>
              </div>
              <div className="bg-slate-800 rounded-2xl p-4">
                <p className="text-slate-400 text-xs uppercase tracking-wider mb-1">Median D-Score</p>
                <p className="text-white text-3xl font-black">{formatDScore(summary?.avgDScore ?? null)}</p>
              </div>
              <div className="bg-slate-800 rounded-2xl p-4">
                <p className="text-slate-400 text-xs uppercase tracking-wider mb-1">% Faster on Congruent</p>
                <p className="text-white text-3xl font-black">{formatPercent(summary?.congruentFasterPct ?? null)}</p>
                <p className="text-slate-500 text-[11px] mt-1">50% = chance</p>
              </div>
            </div>

            <div className="bg-slate-800/60 rounded-2xl p-5 mb-6">
              <p className="text-slate-400 text-xs uppercase tracking-wider mb-2">Median Interpretation</p>
              <p className="text-white text-xl font-bold">{describeAssociation(summary?.avgDScore ?? null)}</p>
              {diffMs !== null && (
                <p className="text-slate-300 text-sm mt-2">
                  Difference of median RTs (Incongruent − Congruent): {diffMs} ms
                </p>
              )}
              {summary?.congruentFasterPct != null && chanceExcess !== null && (
                <p className="text-slate-300 text-sm mt-2">
                  {formatPercent(summary.congruentFasterPct)} of students sorted the congruent pairing
                  faster{' '}
                  <span className="text-slate-400">
                    ({chanceExcess >= 0 ? '+' : ''}{chanceExcess.toFixed(1)} pts vs. the 50% expected by chance).
                  </span>
                </p>
              )}
            </div>

            <div className="bg-slate-800/60 rounded-2xl p-5 mb-6">
              <h2 className="text-white text-sm font-bold mb-1">Median Sorting Speed by Pairing</h2>
              <p className="text-slate-500 text-xs mb-4">
                Dot = class median · bar = middle 50% of students (IQR). Slower cells sit further right.
              </p>

              {cellChart && cellChart.hasData ? (
                <>
                  <div className="space-y-3">
                    {cellChart.rows.map((row) => {
                      const scale = cellChart.xMax * 1.1;
                      const pct = (v: number | null) =>
                        v === null ? null : Math.min(100, Math.max(0, (v / scale) * 100));
                      const medianPct = pct(row.median);
                      const p25Pct = pct(row.p25);
                      const p75Pct = pct(row.p75);
                      const isCongruent = row.pairing === 'congruent';
                      const dotColor = isCongruent ? 'bg-blue-400' : 'bg-orange-400';
                      const barColor = isCongruent ? 'bg-blue-500/40' : 'bg-orange-500/40';

                      return (
                        <div key={row.key} className="flex items-center gap-3">
                          <div className="w-[110px] flex-shrink-0 text-right">
                            <p className="text-slate-200 text-xs font-medium truncate">{row.label}</p>
                            <p className="text-slate-500 text-[10px]">n={row.count}</p>
                          </div>
                          <div className="flex-1 relative h-6">
                            {/* baseline track */}
                            <div className="absolute inset-x-0 top-1/2 h-px bg-slate-700" />
                            {medianPct === null ? (
                              <p className="absolute left-0 top-1/2 -translate-y-1/2 text-slate-600 text-[11px]">
                                no data
                              </p>
                            ) : (
                              <>
                                {p25Pct !== null && p75Pct !== null && (
                                  <div
                                    className={`absolute top-1/2 -translate-y-1/2 h-1.5 rounded-full ${barColor}`}
                                    style={{ left: `${p25Pct}%`, width: `${Math.max(0, p75Pct - p25Pct)}%` }}
                                  />
                                )}
                                <div
                                  className={`absolute top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full ring-2 ring-slate-900 ${dotColor}`}
                                  style={{ left: `${medianPct}%` }}
                                />
                              </>
                            )}
                          </div>
                          <div className="w-[48px] flex-shrink-0 text-right">
                            <p className="text-slate-300 text-xs font-mono">{formatMs(row.median)}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <div className="flex justify-between text-[11px] text-slate-500 mt-3 pl-[122px]">
                    <span>0 ms</span>
                    <span>{Math.round(cellChart.xMax * 1.1)} ms</span>
                  </div>
                  <div className="flex items-center gap-5 mt-3">
                    <div className="flex items-center gap-2">
                      <span className="h-2.5 w-2.5 rounded-full bg-blue-400" />
                      <span className="text-slate-400 text-[11px]">Congruent pairing</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="h-2.5 w-2.5 rounded-full bg-orange-400" />
                      <span className="text-slate-400 text-[11px]">Incongruent pairing</span>
                    </div>
                  </div>
                </>
              ) : (
                <p className="text-slate-400 text-sm">
                  {cellChart
                    ? 'No per-cell data yet. Students need to submit responses from the updated app.'
                    : 'Per-cell speed needs the updated Apps Script deployment (it now returns each pairing’s median).'}
                </p>
              )}
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
                <h2 className="text-white text-sm font-bold mb-2">Class Median: Gender Association by Major</h2>
                <p className="text-slate-500 text-xs mb-4">
                  Positive (blue) = class median faster sorting male names after this major.
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
