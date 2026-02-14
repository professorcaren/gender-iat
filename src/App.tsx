import { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { getBlocks } from './data/stimuli';
import { calculateScore } from './utils/scoring';
import type { TrialResult } from './utils/scoring';
import type { BlockConfig } from './data/stimuli';
import SplashScreen from './components/SplashScreen';
import HowItWorks from './components/HowItWorks';
import BlockIntro from './components/BlockIntro';
import TrialScreen from './components/TrialScreen';
import BlockStats from './components/BlockStats';
import ResultsScreen from './components/ResultsScreen';
import ClassAverageDashboard from './components/ClassAverageDashboard';
import { submitScoreToSheet } from './lib/googleSheets';

type Screen =
  | 'splash'
  | 'how_it_works'
  | 'block_intro'
  | 'block_trials'
  | 'block_stats'
  | 'results';

function isAdminHash(hash: string): boolean {
  return hash === '#/admin' || hash.startsWith('#/admin?');
}

function App() {
  const [isAdminView, setIsAdminView] = useState(() => isAdminHash(window.location.hash));
  const [screen, setScreen] = useState<Screen>('splash');
  const [currentBlockIndex, setCurrentBlockIndex] = useState(0);
  const [allResults, setAllResults] = useState<TrialResult[]>([]);
  const [blocks, setBlocks] = useState<BlockConfig[]>(() => getBlocks());
  const [attemptNumber, setAttemptNumber] = useState(0);
  const lastSubmittedAttemptRef = useRef<number>(0);

  const currentBlock = blocks[currentBlockIndex];

  useEffect(() => {
    const onHashChange = () => {
      setIsAdminView(isAdminHash(window.location.hash));
    };

    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  const handleStart = useCallback(() => {
    setScreen('how_it_works');
  }, []);

  const handleHowItWorksDone = useCallback(() => {
    setScreen('block_intro');
  }, []);

  const handleBlockIntroStart = useCallback(() => {
    setScreen('block_trials');
  }, []);

  const handleBlockComplete = useCallback((results: TrialResult[]) => {
    setAllResults(prev => [...prev, ...results]);
    setScreen('block_stats');
  }, []);

  const handleBlockStatsContinue = useCallback(() => {
    if (currentBlockIndex < 3) {
      setCurrentBlockIndex(i => i + 1);
      setScreen('block_intro');
    } else {
      setAttemptNumber(n => n + 1);
      setScreen('results');
    }
  }, [currentBlockIndex]);

  const handleRetry = useCallback(() => {
    setBlocks(getBlocks());
    setCurrentBlockIndex(0);
    setAllResults([]);
    setScreen('splash');
  }, []);

  const score = useMemo(() => {
    if (screen !== 'results') return null;
    return calculateScore(allResults);
  }, [screen, allResults]);

  useEffect(() => {
    if (screen !== 'results' || !score || attemptNumber === 0) return;
    if (lastSubmittedAttemptRef.current === attemptNumber) return;

    lastSubmittedAttemptRef.current = attemptNumber;
    void submitScoreToSheet(score);
  }, [screen, score, attemptNumber]);

  if (isAdminView) {
    return <ClassAverageDashboard />;
  }

  return (
    <>
      {screen === 'splash' && (
        <SplashScreen onStart={handleStart} />
      )}
      {screen === 'how_it_works' && (
        <HowItWorks onContinue={handleHowItWorksDone} />
      )}
      {screen === 'block_intro' && currentBlock && (
        <BlockIntro block={currentBlock} onStart={handleBlockIntroStart} />
      )}
      {screen === 'block_trials' && currentBlock && (
        <TrialScreen
          key={currentBlock.id}
          block={currentBlock}
          onBlockComplete={handleBlockComplete}
        />
      )}
      {screen === 'block_stats' && currentBlock && (
        <BlockStats
          blockId={currentBlock.id}
          blockName={currentBlock.name}
          results={allResults}
          onContinue={handleBlockStatsContinue}
        />
      )}
      {screen === 'results' && score && (
        <ResultsScreen score={score} onRetry={handleRetry} />
      )}
    </>
  );
}

export default App;
