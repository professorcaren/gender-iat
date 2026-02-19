interface PrimingIntroProps {
  onContinue: () => void;
}

export default function PrimingIntro({ onContinue }: PrimingIntroProps) {
  return (
    <div
      className="fixed inset-0 flex flex-col items-center justify-center bg-slate-900 cursor-pointer select-none px-6"
      onPointerDown={onContinue}
    >
      <div className="max-w-sm w-full animate-fade-in">
        <p className="text-violet-400 text-sm font-semibold text-center mb-2 uppercase tracking-wider">
          Part 2
        </p>
        <h2 className="text-3xl font-black text-white mb-8 text-center">
          Major Priming
        </h2>

        <div className="space-y-6 mb-10">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-full bg-violet-500/20 flex items-center justify-center flex-shrink-0">
              <span className="text-violet-400 font-bold text-lg">1</span>
            </div>
            <p className="text-slate-300 text-base pt-1.5">
              A <span className="text-violet-400 font-semibold">college major</span> flashes briefly on screen
            </p>
          </div>

          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-full bg-violet-500/20 flex items-center justify-center flex-shrink-0">
              <span className="text-violet-400 font-bold text-lg">2</span>
            </div>
            <p className="text-slate-300 text-base pt-1.5">
              Then a name appears — sort it by tapping
              the <span className="text-blue-400 font-semibold">left</span> (Male)
              or <span className="text-orange-400 font-semibold">right</span> (Female) side
            </p>
          </div>

          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-full bg-violet-500/20 flex items-center justify-center flex-shrink-0">
              <span className="text-violet-400 font-bold text-lg">3</span>
            </div>
            <p className="text-slate-300 text-base pt-1.5">
              Go as <span className="text-white font-bold">fast</span> as you can — the major primes your response
            </p>
          </div>

          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-full bg-violet-500/20 flex items-center justify-center flex-shrink-0">
              <span className="text-violet-400 font-bold text-lg">4</span>
            </div>
            <p className="text-slate-300 text-base pt-1.5">
              60 quick trials, about 2 minutes total
            </p>
          </div>
        </div>

        <p className="text-center text-violet-400 font-semibold animate-pulse">
          Tap to begin
        </p>
      </div>
    </div>
  );
}
