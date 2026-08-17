import React from 'react';
import { 
  X, 
  GitCompare, 
  ArrowRight, 
  Sparkles, 
  TrendingUp 
} from 'lucide-react';
import { TerritoryHistory } from '../../types';

interface DiffInspectorModalProps {
  diffs: TerritoryHistory[];
  onClose: () => void;
  onSelectDiff: (diff: TerritoryHistory) => void;
}

export const DiffInspectorModal: React.FC<DiffInspectorModalProps> = ({
  diffs,
  onClose,
  onSelectDiff,
}) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in">
      <div className="relative w-full max-w-2xl bg-[#0f172a] border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden glass-panel">
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/80">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center">
              <GitCompare className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <h3 className="font-bold text-slate-100 text-base">
                Geometric Diff Engine (PostGIS ST_Difference)
              </h3>
              <p className="text-xs text-slate-400 font-mono">
                Sub-meter boundary delta analysis & gained/lost polygon audit
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition border border-slate-700"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
          <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 text-xs text-slate-300 space-y-1.5 font-sans leading-relaxed">
            <div className="flex items-center space-x-1.5 font-mono text-cyan-400 font-semibold text-[11px]">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Automated Topological Differencing</span>
            </div>
            <p>
              When a new boundary version is approved or synced via Google My Maps, PostGIS computes 
              <code className="text-emerald-400 font-mono ml-1">ST_Difference(new_geom, old_geom)</code>. 
              The gained territorial wedge is isolated, highlighted in neon on the map, and cataloged with linked sources.
            </p>
          </div>

          <h4 className="text-xs font-mono uppercase tracking-wider text-slate-400 pt-1">
            Active Recorded Shifts ({diffs.length})
          </h4>

          <div className="space-y-3">
            {diffs.map((diff) => (
              <div
                key={diff.id}
                onClick={() => {
                  onSelectDiff(diff);
                  onClose();
                }}
                className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 hover:border-emerald-500/50 hover:bg-slate-900/90 transition cursor-pointer space-y-2 group"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="px-2 py-0.5 rounded text-xs font-mono font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center space-x-1">
                      <TrendingUp className="w-3 h-3" />
                      <span>+{diff.delta_area_sqkm.toFixed(1)} km² Delta</span>
                    </span>
                    <span className="text-xs text-slate-400 font-mono">Type: {diff.change_type}</span>
                  </div>
                  <span className="text-[11px] text-slate-500 font-mono">
                    {new Date(diff.valid_from).toLocaleDateString()}
                  </span>
                </div>

                <p className="text-xs text-slate-200 font-sans group-hover:text-cyan-300 transition">
                  {diff.notes || 'Frontline displacement verified by satellite change-detection.'}
                </p>

                <div className="flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-slate-800/80 font-mono">
                  <span>Author: {diff.author_name}</span>
                  <span className="text-emerald-400 flex items-center space-x-1">
                    <span>Inspect on map</span>
                    <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition" />
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
