import { useState, useEffect, useRef, useCallback } from 'react';
import type { PrimingTrial, PrimingTrialResult } from '../data/primingStimuli';

interface PrimingTrialScreenProps {
  trials: PrimingTrial[];
  onComplete: (results: PrimingTrialResult[]) => void;
}

type Phase = 'prime' | 'fixation' | 'target';
type Feedback = 'correct' | 'incorrect' | null;

const PRIME_DURATION = 650;
const FIXATION_DURATION = 200;
const ERROR_PENALTY_MS = 600;

export default function PrimingTrialScreen({ trials, onComplete }: PrimingTrialScreenProps) {
  const [trialIndex, setTrialIndex] = useState(0);
  const [phase, setPhase] = useState<Phase>('prime');
  const [feedback, setFeedback] = useState<Feedback>(null);
  const [waitingCorrect, setWaitingCorrect] = useState(false);
  const [results, setResults] = useState<PrimingTrialResult[]>([]);
  const targetStartRef = useRef<number>(0);
  const phaseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const feedbackTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const totalTrials = trials.length;
  const currentTrial = trials[trialIndex];
  const progress = trialIndex / totalTrials;

  // Run prime → fixation → target sequence
  useEffect(() => {
    setPhase('prime');
    setFeedback(null);
    setWaitingCorrect(false);

    phaseTimerRef.current = setTimeout(() => {
      setPhase('fixation');
      phaseTimerRef.current = setTimeout(() => {
        setPhase('target');
        targetStartRef.current = performance.now();
      }, FIXATION_DURATION);
    }, PRIME_DURATION);

    return () => {
      if (phaseTimerRef.current) clearTimeout(phaseTimerRef.current);
    };
  }, [trialIndex]);

  // Cleanup feedback timer on unmount
  useEffect(() => {
    return () => {
      if (feedbackTimerRef.current) clearTimeout(feedbackTimerRef.current);
    };
  }, []);

  const advanceToNext = useCallback((updatedResults: PrimingTrialResult[]) => {
    if (trialIndex + 1 >= totalTrials) {
      onComplete(updatedResults);
    } else {
      setTrialIndex(i => i + 1);
    }
  }, [trialIndex, totalTrials, onComplete]);

  const handleTap = useCallback((side: 'left' | 'right') => {
    if (phase !== 'target') return;
    if (feedback === 'correct') return;

    const trial = trials[trialIndex];
    if (!trial) return;

    if (waitingCorrect) {
      if (side === trial.correctSide) {
        setWaitingCorrect(false);
        setFeedback('correct');
        if (navigator.vibrate) navigator.vibrate(30);

        feedbackTimerRef.current = setTimeout(() => {
          setFeedback(null);
          advanceToNext(results);
        }, 200);
      } else {
        setFeedback('incorrect');
        if (navigator.vibrate) navigator.vibrate([50, 30, 50]);
        feedbackTimerRef.current = setTimeout(() => {
          setFeedback(null);
        }, 300);
      }
      return;
    }

    const rt = performance.now() - targetStartRef.current;
    const correct = side === trial.correctSide;

    const result: PrimingTrialResult = {
      major: trial.major,
      targetWord: trial.target.word,
      targetCategory: trial.target.category as 'male' | 'female',
      response: side,
      rt: correct ? rt : rt + ERROR_PENALTY_MS,
      correct,
    };

    const newResults = [...results, result];
    setResults(newResults);

    if (correct) {
      setFeedback('correct');
      if (navigator.vibrate) navigator.vibrate(30);

      feedbackTimerRef.current = setTimeout(() => {
        setFeedback(null);
        advanceToNext(newResults);
      }, 200);
    } else {
      setFeedback('incorrect');
      setWaitingCorrect(true);
      if (navigator.vibrate) navigator.vibrate([50, 30, 50]);

      feedbackTimerRef.current = setTimeout(() => {
        setFeedback(null);
      }, 400);
    }
  }, [phase, feedback, waitingCorrect, trialIndex, trials, results, advanceToNext]);

  if (!currentTrial) return null;

  return (
    <div className="fixed inset-0 bg-slate-900 select-none touch-none">
      {/* Progress bar */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-slate-800 z-20">
        <div
          className="h-full bg-violet-500 transition-all duration-200"
          style={{ width: `${progress * 100}%` }}
        />
      </div>

      {/* Labels (only visible during target phase) */}
      {phase === 'target' && (
        <div className="absolute top-4 left-4 right-4 flex justify-between z-20 pointer-events-none">
          <p className="text-blue-400 font-bold text-sm">Male</p>
          <p className="text-orange-400 font-bold text-sm">Female</p>
        </div>
      )}

      {/* Tap zones (only active during target phase) */}
      <div className="absolute inset-0 flex">
        <div
          className="flex-1 cursor-pointer active:bg-blue-500/10 transition-colors duration-75"
          onPointerDown={() => handleTap('left')}
        />
        <div className="w-px bg-slate-800" />
        <div
          className="flex-1 cursor-pointer active:bg-orange-500/10 transition-colors duration-75"
          onPointerDown={() => handleTap('right')}
        />
      </div>

      {/* Center content */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
        {phase === 'prime' && (
          <p className="text-2xl font-black tracking-tight text-violet-400">
            {currentTrial.major}
          </p>
        )}
        {phase === 'fixation' && (
          <p className="text-slate-600 text-2xl">+</p>
        )}
        {phase === 'target' && (
          <p className="text-4xl font-black tracking-tight text-slate-200">
            {currentTrial.target.word}
          </p>
        )}
      </div>

      {/* Feedback overlays */}
      {feedback === 'correct' && (
        <div className="absolute inset-0 bg-green-500/10 pointer-events-none z-30 animate-flash" />
      )}
      {feedback === 'incorrect' && (
        <div className="absolute inset-0 bg-red-500/20 pointer-events-none z-30 flex items-center justify-center animate-flash">
          <span className="text-red-500 text-7xl font-black">X</span>
        </div>
      )}

      {/* Trial counter */}
      <div className="absolute bottom-4 left-0 right-0 text-center z-20 pointer-events-none">
        <p className="text-slate-600 text-xs font-mono">
          {trialIndex + 1} / {totalTrials}
        </p>
      </div>
    </div>
  );
}
