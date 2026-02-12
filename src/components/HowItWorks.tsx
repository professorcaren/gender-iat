interface HowItWorksProps {
  onContinue: () => void;
}

export default function HowItWorks({ onContinue }: HowItWorksProps) {
  return (
    <div
      className="fixed inset-0 flex flex-col items-center justify-center bg-slate-900 cursor-pointer select-none px-6"
      onPointerDown={onContinue}
    >
      <div className="max-w-sm w-full animate-fade-in">
        <h2 className="text-3xl font-black text-white mb-8 text-center">
          How It Works
        </h2>

        <div className="space-y-6 mb-10">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center flex-shrink-0">
              <span className="text-blue-400 font-bold text-lg">1</span>
            </div>
            <p className="text-slate-300 text-base pt-1.5">
              Words appear in the center of the screen, one at a time
            </p>
          </div>

          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center flex-shrink-0">
              <span className="text-blue-400 font-bold text-lg">2</span>
            </div>
            <p className="text-slate-300 text-base pt-1.5">
              Sort each word by tapping the <span className="text-blue-400 font-semibold">left</span> or <span className="text-orange-400 font-semibold">right</span> side of the screen
            </p>
          </div>

          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center flex-shrink-0">
              <span className="text-blue-400 font-bold text-lg">3</span>
            </div>
            <p className="text-slate-300 text-base pt-1.5">
              Go as <span className="text-white font-bold">fast</span> as you can while staying accurate
            </p>
          </div>

          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center flex-shrink-0">
              <span className="text-blue-400 font-bold text-lg">4</span>
            </div>
            <p className="text-slate-300 text-base pt-1.5">
              4 short rounds, about 2 minutes total
            </p>
          </div>
        </div>

        <p className="text-center text-blue-400 font-semibold animate-pulse">
          Tap to continue
        </p>
      </div>
    </div>
  );
}
