import React, { useState, useEffect } from 'react';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  Calendar, 
  Clock
} from 'lucide-react';

interface TimelineProps {
  currentDateIndex: number;
  dates: string[];
  onSelectDateIndex: (index: number) => void;
  isLive: boolean;
  onSetLive: () => void;
}

export const Timeline: React.FC<TimelineProps> = ({
  currentDateIndex,
  dates,
  onSelectDateIndex,
  isLive,
  onSetLive,
}) => {
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    let interval: any = null;
    if (isPlaying) {
      interval = setInterval(() => {
        if (currentDateIndex < dates.length - 1) {
          onSelectDateIndex(currentDateIndex + 1);
        } else {
          setIsPlaying(false);
          onSetLive();
        }
      }, 1800);
    }
    return () => clearInterval(interval);
  }, [isPlaying, currentDateIndex, dates.length, onSelectDateIndex, onSetLive]);

  const activeDate = dates[currentDateIndex] || dates[dates.length - 1];

  return (
    <div className="fixed bottom-0 left-0 right-0 h-16 z-20 glass-panel border-t border-slate-800/90 bg-[#0c101a]/95 backdrop-blur-md px-4 sm:px-8 flex items-center justify-between select-none">
      <div className="flex items-center space-x-2 shrink-0">
        <button
          onClick={() => setIsPlaying(!isPlaying)}
          className={`w-9 h-9 rounded-lg flex items-center justify-center transition shadow-md ${
            isPlaying
              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 hover:bg-amber-500/30'
              : 'bg-cyan-600 hover:bg-cyan-500 text-white shadow-cyan-600/30'
          }`}
          title={isPlaying ? 'Pause Time Travel' : 'Play Historical Progression'}
        >
          {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
        </button>

        <button
          onClick={() => onSelectDateIndex(0)}
          className="w-8 h-8 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 flex items-center justify-center transition"
          title="Jump to Earliest Archive"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>

        <button
          onClick={onSetLive}
          className={`px-3 py-1.5 rounded-lg text-xs font-mono font-medium transition flex items-center space-x-1.5 border ${
            isLive
              ? 'bg-emerald-950/60 text-emerald-300 border-emerald-500/40 shadow-sm shadow-emerald-500/20'
              : 'bg-slate-800/60 text-slate-400 border-slate-700 hover:text-slate-200'
          }`}
        >
          <span className={`w-2 h-2 rounded-full ${isLive ? 'bg-emerald-400 animate-ping' : 'bg-slate-500'}`} />
          <span>LIVE</span>
        </button>
      </div>

      <div className="flex-1 mx-6 flex flex-col justify-center max-w-4xl">
        <div className="flex justify-between items-center text-[11px] font-mono text-slate-400 mb-1.5">
          <div className="flex items-center space-x-1.5">
            <Calendar className="w-3.5 h-3.5 text-cyan-400" />
            <span className="text-slate-200 font-semibold">{activeDate}</span>
          </div>
          <span className="text-[10px] text-slate-500 hidden sm:inline">
            Step {currentDateIndex + 1} of {dates.length} • Drag slider to scrub history
          </span>
        </div>

        <div className="relative flex items-center">
          <input
            type="range"
            min="0"
            max={dates.length - 1}
            value={currentDateIndex}
            onChange={(e) => onSelectDateIndex(Number(e.target.value))}
            className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400 focus:outline-none ring-1 ring-slate-700"
          />
          <div className="absolute inset-x-0 flex justify-between pointer-events-none px-1">
            {dates.map((_, i) => (
              <div
                key={i}
                className={`w-1.5 h-1.5 rounded-full transition ${
                  i <= currentDateIndex ? 'bg-cyan-400' : 'bg-slate-700'
                }`}
              />
            ))}
          </div>
        </div>
      </div>

      <div className="hidden lg:flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-slate-900/90 border border-slate-800 text-xs font-mono text-cyan-300">
        <Clock className="w-3.5 h-3.5 text-cyan-400" />
        <span>2026 UTC Temporal View</span>
      </div>
    </div>
  );
};
