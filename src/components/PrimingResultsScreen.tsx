import { useState, useEffect } from 'react';
import type { PrimingMajorScore } from '../utils/primingScoring';

interface PrimingResultsScreenProps {
  scores: PrimingMajorScore[];
  onStartOver: () => void;
}

export default function PrimingResultsScreen({ scores, onStartOver }: PrimingResultsScreenProps) {
  const [animated, setAnimated] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setAnimated(true), 300);
    return () => clearTimeout(t);
  }, []);

  const maxAbsDiff = Math.max(...scores.map(s => Math.abs(s.diff)), 1);

  return (
    <div className="fixed inset-0 bg-slate-900 overflow-y-auto select-none">
      <div className="max-w-md mx-auto px-6 py-12">
        <p className="text-violet-400 text-sm font-semibold text-center mb-2 uppercase tracking-wider animate-fade-in">
          Part 2 Results
        </p>
        <h2 className="text-3xl font-black text-white text-center mb-2 animate-fade-in">
          Major Priming
        </h2>
        <p className="text-slate-500 text-sm text-center mb-8 animate-fade-in">
          Implicit gender associations with college majors
        </p>

        {/* Legend */}
        <div className="flex items-center justify-center gap-6 mb-6 animate-fade-in">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-sm bg-blue-500" />
            <span className="text-slate-400 text-xs">Male-associated</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-sm bg-orange-500" />
            <span className="text-slate-400 text-xs">Female-associated</span>
          </div>
        </div>

        {/* Diverging bar chart */}
        <div className="space-y-2 mb-8">
          {scores.map((s, i) => {
            const barPct = Math.abs(s.diff) / maxAbsDiff * 45;
            const isMale = s.diff > 0;

            return (
              <div key={s.major} className="flex items-center gap-2">
                {/* Major label */}
                <div className="w-[140px] flex-shrink-0 text-right">
                  <p className="text-slate-300 text-xs truncate">{s.major}</p>
                </div>

                {/* Bar area */}
                <div className="flex-1 flex items-center h-6 relative">
                  {/* Center line */}
                  <div className="absolute left-1/2 top-0 bottom-0 w-px bg-slate-700" />

                  {/* Bar */}
                  <div className="w-full flex items-center" style={{ justifyContent: isMale ? 'flex-end' : 'flex-start' }}>
                    {/* Left half (female-associated, extends left from center) */}
                    {!isMale && (
                      <div className="w-1/2 flex justify-end">
                        <div
                          className="h-5 rounded-l-sm bg-orange-500 transition-all duration-700 ease-out"
                          style={{
                            width: animated ? `${barPct}%` : '0%',
                            transitionDelay: `${i * 40}ms`,
                          }}
                        />
                      </div>
                    )}
                    {/* Spacer for right side */}
                    {!isMale && <div className="w-1/2" />}

                    {/* Left spacer for right side */}
                    {isMale && <div className="w-1/2" />}
                    {/* Right half (male-associated, extends right from center) */}
                    {isMale && (
                      <div className="w-1/2 flex justify-start">
                        <div
                          className="h-5 rounded-r-sm bg-blue-500 transition-all duration-700 ease-out"
                          style={{
                            width: animated ? `${barPct}%` : '0%',
                            transitionDelay: `${i * 40}ms`,
                          }}
                        />
                      </div>
                    )}
                  </div>
                </div>

                {/* Diff value */}
                <div className="w-[50px] flex-shrink-0">
                  <p className="text-slate-500 text-xs font-mono">
                    {s.diff > 0 ? '+' : ''}{s.diff}ms
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Explanation */}
        <div className="bg-slate-800/50 rounded-xl p-5 mb-10 animate-fade-in">
          <h3 className="text-white font-bold text-sm mb-3">
            What does this show?
          </h3>
          <div className="space-y-3 text-slate-400 text-sm leading-relaxed">
            <p>
              When a major primes you to think "male," you sort male names faster
              (and vice versa for female names). Bars show the difference in
              reaction time: blue bars mean you were faster sorting male names
              after seeing that major, orange bars mean faster for female names.
            </p>
            <p>
              These patterns reflect <span className="text-white font-medium">implicit associations</span> between
              gender and academic fields — shaped by cultural stereotypes about
              who "belongs" in each major, not your conscious beliefs.
            </p>
          </div>
        </div>

        <div className="text-center animate-fade-in">
          <button
            onPointerDown={onStartOver}
            className="bg-violet-500 hover:bg-violet-600 active:bg-violet-700 text-white font-bold text-lg px-8 py-4 rounded-xl transition-colors"
          >
            Start Over
          </button>
        </div>
      </div>
    </div>
  );
}
