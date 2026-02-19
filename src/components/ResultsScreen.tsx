import { useState, useEffect } from 'react';
import type { ScoreResult } from '../utils/scoring';

interface ResultsScreenProps {
  score: ScoreResult;
  onRetry: () => void;
  onContinueToPriming?: () => void;
}

export default function ResultsScreen({ score, onRetry, onContinueToPriming }: ResultsScreenProps) {
  const [animationStep, setAnimationStep] = useState(0);

  useEffect(() => {
    const timers = [
      setTimeout(() => setAnimationStep(1), 300),
      setTimeout(() => setAnimationStep(2), 800),
      setTimeout(() => setAnimationStep(3), 1300),
      setTimeout(() => setAnimationStep(4), 1800),
    ];
    return () => timers.forEach(clearTimeout);
  }, []);

  const maxRT = Math.max(score.meanCongruent, score.meanIncongruent);
  const barScale = (rt: number) => Math.max(20, (rt / (maxRT * 1.2)) * 100);

  return (
    <div className="fixed inset-0 bg-slate-900 overflow-y-auto select-none">
      <div className="max-w-sm mx-auto px-6 py-12">
        <h2 className="text-3xl font-black text-white text-center mb-2 animate-fade-in">
          Your Results
        </h2>
        <p className="text-slate-500 text-sm text-center mb-10 animate-fade-in">
          Gender IAT
        </p>

        {/* Bar chart */}
        <div
          className="mb-8 transition-opacity duration-500"
          style={{ opacity: animationStep >= 1 ? 1 : 0 }}
        >
          <div className="mb-4">
            <div className="flex items-center justify-between mb-1">
              <p className="text-slate-400 text-xs font-medium">
                Male + Boss Mode / Female + Care Mode
              </p>
              <p className="text-white font-bold text-sm">{score.meanCongruent}ms</p>
            </div>
            <div className="h-8 bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-blue-500 to-blue-400 rounded-full transition-all duration-1000 ease-out"
                style={{ width: animationStep >= 1 ? `${barScale(score.meanCongruent)}%` : '0%' }}
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <p className="text-slate-400 text-xs font-medium">
                Female + Boss Mode / Male + Care Mode
              </p>
              <p className="text-white font-bold text-sm">{score.meanIncongruent}ms</p>
            </div>
            <div className="h-8 bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-orange-500 to-orange-400 rounded-full transition-all duration-1000 ease-out"
                style={{ width: animationStep >= 1 ? `${barScale(score.meanIncongruent)}%` : '0%' }}
              />
            </div>
          </div>
        </div>

        {/* D-score */}
        <div
          className="text-center mb-6 transition-opacity duration-500"
          style={{ opacity: animationStep >= 2 ? 1 : 0 }}
        >
          <div className="inline-block bg-slate-800 rounded-xl px-6 py-4">
            <p className="text-slate-400 text-xs uppercase tracking-wider mb-1">
              Result
            </p>
            <p className="text-2xl font-black text-white">
              {score.interpretation}
            </p>
            <p className="text-slate-500 text-xs mt-1">
              D-score: {score.dScore}
            </p>
          </div>
        </div>

        {/* Plain language description */}
        <div
          className="mb-8 transition-opacity duration-500"
          style={{ opacity: animationStep >= 3 ? 1 : 0 }}
        >
          <p className="text-slate-300 text-base leading-relaxed text-center">
            {score.description}
          </p>
        </div>

        {/* What does this mean */}
        <div
          className="mb-10 bg-slate-800/50 rounded-xl p-5 transition-opacity duration-500"
          style={{ opacity: animationStep >= 4 ? 1 : 0 }}
        >
          <h3 className="text-white font-bold text-sm mb-3">
            What does this mean?
          </h3>
          <div className="space-y-3 text-slate-400 text-sm leading-relaxed">
            <p>
              The IAT measures the strength of associations between concepts. Most people
              sort faster when male names are paired with career words and female names
              with caregiving words — reflecting widespread cultural associations, not
              personal beliefs.
            </p>
            <p>
              This is what sociologists mean by <span className="text-white font-medium">implicit bias</span>:
              mental shortcuts shaped by the culture we grow up in, not conscious choices
              we make. Recognizing these patterns is the first step toward understanding
              how they shape behavior and institutions.
            </p>
          </div>
        </div>

        <div
          className="transition-opacity duration-500"
          style={{ opacity: animationStep >= 4 ? 1 : 0 }}
        >
          {onContinueToPriming ? (
            <div>
              <p className="text-slate-400 text-sm text-center mb-4">What's next?</p>
              <div className="space-y-3">
                <button
                  onPointerDown={onContinueToPriming}
                  className="w-full bg-slate-800 hover:bg-slate-700 active:bg-slate-600 rounded-xl p-4 text-left transition-colors"
                >
                  <p className="text-violet-400 font-bold text-base">College Major Priming</p>
                  <p className="text-slate-500 text-sm mt-1">
                    See which majors you implicitly associate with each gender
                  </p>
                </button>
                <button
                  onPointerDown={onRetry}
                  className="w-full bg-slate-800 hover:bg-slate-700 active:bg-slate-600 rounded-xl p-4 text-left transition-colors"
                >
                  <p className="text-blue-400 font-bold text-base">Retake Gender IAT</p>
                  <p className="text-slate-500 text-sm mt-1">
                    Try the Boss Mode / Care Mode sorting task again
                  </p>
                </button>
              </div>
            </div>
          ) : (
            <div className="text-center">
              <button
                onPointerDown={onRetry}
                className="bg-blue-500 hover:bg-blue-600 active:bg-blue-700 text-white font-bold text-lg px-8 py-4 rounded-xl transition-colors"
              >
                Try Again
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
