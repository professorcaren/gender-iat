import type { BlockConfig } from '../data/stimuli';

interface BlockIntroProps {
  block: BlockConfig;
  onStart: () => void;
}

export default function BlockIntro({ block, onStart }: BlockIntroProps) {
  return (
    <div
      className="fixed inset-0 flex flex-col items-center justify-center bg-slate-900 cursor-pointer select-none px-6"
      onPointerDown={onStart}
    >
      <div className="max-w-sm w-full animate-fade-in text-center">
        <p className="text-slate-500 text-sm font-medium mb-2 uppercase tracking-wider">
          Round {block.id} of 4
        </p>
        <h2 className="text-3xl font-black text-white mb-8">
          {block.name}
        </h2>

        <div className="flex justify-between items-start mb-10 gap-4">
          {/* Left side */}
          <div className="flex-1 rounded-xl bg-blue-500/10 border border-blue-500/30 p-4">
            <p className="text-blue-400 text-xs font-semibold uppercase tracking-wider mb-2">
              Tap Left
            </p>
            {block.leftLabel.map((label) => (
              <p key={label} className="text-white font-bold text-lg">
                {label}
              </p>
            ))}
          </div>

          {/* Right side */}
          <div className="flex-1 rounded-xl bg-orange-500/10 border border-orange-500/30 p-4">
            <p className="text-orange-400 text-xs font-semibold uppercase tracking-wider mb-2">
              Tap Right
            </p>
            {block.rightLabel.map((label) => (
              <p key={label} className="text-white font-bold text-lg">
                {label}
              </p>
            ))}
          </div>
        </div>

        <p className="text-slate-400 text-sm mb-8">
          {block.trialCount} words &middot; Go fast!
        </p>

        <p className="text-blue-400 font-semibold animate-pulse">
          Tap to begin
        </p>
      </div>
    </div>
  );
}
