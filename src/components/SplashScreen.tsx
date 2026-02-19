interface SplashScreenProps {
  onStart: () => void;
  onStartPriming?: () => void;
}

export default function SplashScreen({ onStart, onStartPriming }: SplashScreenProps) {
  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center bg-slate-900 select-none">
      <div
        className="text-center px-8 animate-fade-in cursor-pointer flex-1 flex flex-col items-center justify-center"
        onPointerDown={onStart}
      >
        <h1 className="text-5xl font-black text-white mb-4 tracking-tight">
          Gender IAT
        </h1>
        <p className="text-xl text-slate-400 mb-2 font-medium">
          Implicit Association Test
        </p>
        <p className="text-slate-500 text-sm mb-12 max-w-xs mx-auto">
          A speed-sorting game that reveals hidden patterns in how we associate gender with roles
        </p>

        <div className="animate-pulse">
          <p className="text-blue-400 text-lg font-semibold">
            Tap anywhere to start
          </p>
        </div>
      </div>

      {onStartPriming && (
        <button
          onPointerDown={(e) => { e.stopPropagation(); onStartPriming(); }}
          className="mb-4 text-violet-400 hover:text-violet-300 text-sm font-medium transition-colors"
        >
          Skip to Major Priming →
        </button>
      )}

      <p className="absolute bottom-8 text-slate-600 text-xs">
        SOCI 101
      </p>
    </div>
  );
}
