import { useState, useEffect, useRef, useCallback } from 'react';
import type { BlockConfig, CategoryType } from '../data/stimuli';
import { getCategoryColor } from '../data/stimuli';
import type { TrialResult } from '../utils/scoring';

interface TrialScreenProps {
  block: BlockConfig;
  onBlockComplete: (results: TrialResult[]) => void;
}

type Feedback = 'correct' | 'incorrect' | null;

const ERROR_PENALTY_MS = 600;

export default function TrialScreen({ block, onBlockComplete }: TrialScreenProps) {
  const [trialIndex, setTrialIndex] = useState(0);
  const [feedback, setFeedback] = useState<Feedback>(null);
  const [results, setResults] = useState<TrialResult[]>([]);
  const [waitingCorrect, setWaitingCorrect] = useState(false);
  const trialStartRef = useRef<number>(0);
  const feedbackTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const currentStimulus = block.stimuli[trialIndex];
  const progress = trialIndex / block.trialCount;

  useEffect(() => {
    trialStartRef.current = performance.now();
  }, [trialIndex]);

  useEffect(() => {
    return () => {
      if (feedbackTimeoutRef.current) clearTimeout(feedbackTimeoutRef.current);
    };
  }, []);

  const isCorrectSide = useCallback((side: 'left' | 'right', category: CategoryType): boolean => {
    if (side === 'left') return block.leftCategories.includes(category);
    return block.rightCategories.includes(category);
  }, [block.leftCategories, block.rightCategories]);

  const handleTap = useCallback((side: 'left' | 'right') => {
    if (feedback === 'correct') return; // still showing correct feedback

    const stimulus = block.stimuli[trialIndex];
    if (!stimulus) return;

    if (waitingCorrect) {
      // After an error, they must tap the correct side
      if (isCorrectSide(side, stimulus.category)) {
        setWaitingCorrect(false);
        setFeedback('correct');

        // Haptic
        if (navigator.vibrate) navigator.vibrate(30);

        feedbackTimeoutRef.current = setTimeout(() => {
          setFeedback(null);
          if (trialIndex + 1 >= block.trialCount) {
            onBlockComplete(results);
          } else {
            setTrialIndex(i => i + 1);
          }
        }, 200);
      } else {
        // Still wrong — flash again
        setFeedback('incorrect');
        if (navigator.vibrate) navigator.vibrate([50, 30, 50]);
        feedbackTimeoutRef.current = setTimeout(() => {
          setFeedback(null);
        }, 300);
      }
      return;
    }

    const rt = performance.now() - trialStartRef.current;
    const correct = isCorrectSide(side, stimulus.category);

    const result: TrialResult = {
      stimulus: stimulus.word,
      category: stimulus.category,
      response: side,
      rt: correct ? rt : rt + ERROR_PENALTY_MS,
      correct,
      blockId: block.id,
    };

    const newResults = [...results, result];
    setResults(newResults);

    if (correct) {
      setFeedback('correct');
      if (navigator.vibrate) navigator.vibrate(30);

      feedbackTimeoutRef.current = setTimeout(() => {
        setFeedback(null);
        if (trialIndex + 1 >= block.trialCount) {
          onBlockComplete(newResults);
        } else {
          setTrialIndex(i => i + 1);
        }
      }, 200);
    } else {
      setFeedback('incorrect');
      setWaitingCorrect(true);
      if (navigator.vibrate) navigator.vibrate([50, 30, 50]);

      feedbackTimeoutRef.current = setTimeout(() => {
        setFeedback(null);
      }, 400);
    }
  }, [trialIndex, feedback, waitingCorrect, block, results, isCorrectSide, onBlockComplete]);

  if (!currentStimulus) return null;

  const stimulusColor = getCategoryColor(currentStimulus.category);

  return (
    <div className="fixed inset-0 bg-slate-900 select-none touch-none">
      {/* Progress bar */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-slate-800 z-20">
        <div
          className="h-full bg-blue-500 transition-all duration-200"
          style={{ width: `${progress * 100}%` }}
        />
      </div>

      {/* Category labels */}
      <div className="absolute top-4 left-4 right-4 flex justify-between z-20 pointer-events-none">
        <div className="text-left">
          {block.leftLabel.map((label, i) => (
            <p
              key={label}
              className="text-blue-400 font-bold text-sm leading-tight"
              style={{ opacity: i === 0 ? 1 : 0.7 }}
            >
              {label}
            </p>
          ))}
        </div>
        <div className="text-right">
          {block.rightLabel.map((label, i) => (
            <p
              key={label}
              className="text-orange-400 font-bold text-sm leading-tight"
              style={{ opacity: i === 0 ? 1 : 0.7 }}
            >
              {label}
            </p>
          ))}
        </div>
      </div>

      {/* Tap zones */}
      <div className="absolute inset-0 flex">
        <div
          className="flex-1 cursor-pointer active:bg-blue-500/10 transition-colors duration-75"
          onPointerDown={() => handleTap('left')}
        />
        {/* Thin center divider */}
        <div className="w-px bg-slate-800" />
        <div
          className="flex-1 cursor-pointer active:bg-orange-500/10 transition-colors duration-75"
          onPointerDown={() => handleTap('right')}
        />
      </div>

      {/* Stimulus word */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
        <p
          className="text-4xl font-black tracking-tight transition-opacity duration-100"
          style={{ color: stimulusColor }}
        >
          {currentStimulus.word}
        </p>
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
          {trialIndex + 1} / {block.trialCount}
        </p>
      </div>
    </div>
  );
}
