import type { TrialResult } from '../utils/scoring';

interface BlockStatsProps {
  blockId: number;
  blockName: string;
  results: TrialResult[];
  onContinue: () => void;
}

export default function BlockStats({ blockId, blockName, results, onContinue }: BlockStatsProps) {
  const blockResults = results.filter(r => r.blockId === blockId);
  const avgRT = Math.round(
    blockResults.reduce((sum, r) => sum + r.rt, 0) / blockResults.length
  );
  const accuracy = Math.round(
    (blockResults.filter(r => r.correct).length / blockResults.length) * 100
  );

  let encouragement: string;
  if (avgRT < 600) encouragement = 'Lightning fast!';
  else if (avgRT < 800) encouragement = 'Nice speed!';
  else if (avgRT < 1000) encouragement = 'Solid!';
  else encouragement = 'Keep it up!';

  return (
    <div
      className="fixed inset-0 flex flex-col items-center justify-center bg-slate-900 cursor-pointer select-none px-6"
      onPointerDown={onContinue}
    >
      <div className="max-w-sm w-full text-center animate-fade-in">
        <p className="text-slate-500 text-sm uppercase tracking-wider mb-2">
          Round {blockId} Complete
        </p>
        <h2 className="text-2xl font-black text-white mb-8">
          {blockName}
        </h2>

        <div className="flex justify-center gap-8 mb-6">
          <div>
            <p className="text-4xl font-black text-blue-400 animate-count-up">
              {avgRT}<span className="text-lg">ms</span>
            </p>
            <p className="text-slate-500 text-sm mt-1">Avg Speed</p>
          </div>
          <div>
            <p className="text-4xl font-black text-green-400">
              {accuracy}<span className="text-lg">%</span>
            </p>
            <p className="text-slate-500 text-sm mt-1">Accuracy</p>
          </div>
        </div>

        <p className="text-xl text-white font-semibold mb-10">
          {encouragement}
        </p>

        <p className="text-blue-400 font-semibold animate-pulse">
          {blockId < 4 ? 'Tap for next round' : 'Tap to see your results'}
        </p>
      </div>
    </div>
  );
}
