import React, { useState } from 'react';
import { 
  X, 
  ShieldCheck, 
  ExternalLink, 
  Video, 
  Satellite, 
  FileText, 
  CheckCircle2, 
  AlertCircle, 
  GitCompare, 
  Copy, 
  Check, 
  User, 
  MapPin, 
  Sparkles, 
  Archive 
} from 'lucide-react';
import { GeoJSONFeature, Source, TerritoryHistory } from '../../types';

interface VerificationModalProps {
  feature: GeoJSONFeature | null;
  source: Source | null;
  historyItem: TerritoryHistory | null;
  onClose: () => void;
  onToggleDiffView: () => void;
  isDiffActive: boolean;
}

export const VerificationModal: React.FC<VerificationModalProps> = ({
  feature,
  source,
  historyItem,
  onClose,
  onToggleDiffView,
  isDiffActive,
}) => {
  const [copied, setCopied] = useState(false);

  if (!feature) return null;

  const copyCoordinates = () => {
    if (source?.coordinates) {
      navigator.clipboard.writeText(`${source.coordinates[1]}, ${source.coordinates[0]}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const confidenceBadge = (level?: string) => {
    switch (level) {
      case 'confirmed_high':
        return (
          <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center space-x-1">
            <CheckCircle2 className="w-3 h-3 text-emerald-400" />
            <span>High Confidence (Multi-Source Verified)</span>
          </span>
        );
      case 'medium':
        return (
          <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-amber-500/10 text-amber-400 border border-amber-500/30 flex items-center space-x-1">
            <AlertCircle className="w-3 h-3 text-amber-400" />
            <span>Medium Confidence (Cross-Referencing)</span>
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-slate-700/50 text-slate-300 border border-slate-600 flex items-center space-x-1">
            <span>Unconfirmed Field Report</span>
          </span>
        );
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-[#0f172a] border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden glass-panel">
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/80">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5 text-cyan-400" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="font-bold text-slate-100 text-base font-sans">
                  {feature.properties.name}
                </h3>
                <span
                  className="w-2.5 h-2.5 rounded-full"
                  style={{ backgroundColor: feature.properties.color_hex }}
                />
              </div>
              <p className="text-xs text-slate-400 font-mono">
                Verified Provenance & Change Audit Card
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

        <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
          <div className="flex flex-wrap items-center justify-between gap-2 p-3 rounded-xl bg-slate-900/60 border border-slate-800">
            <div className="flex items-center space-x-2">
              <span className="text-xs text-slate-400 font-mono">Status:</span>
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-200">
                {feature.properties.status.replace('_', ' ')}
              </span>
              <span className="text-slate-600">•</span>
              <span className="text-xs text-slate-400 font-mono">Area: {feature.properties.area_sqkm.toFixed(1)} km²</span>
            </div>
            {confidenceBadge(source?.confidence || feature.properties.confidence)}
          </div>

          {source ? (
            <div className="space-y-3">
              <h4 className="text-xs font-mono uppercase tracking-wider text-slate-400 flex items-center space-x-1.5">
                <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                <span>Primary Verification Source</span>
              </h4>

              <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/90 space-y-3">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <h5 className="text-sm font-semibold text-slate-100 flex items-center space-x-2">
                      {source.source_type === 'video' && <Video className="w-4 h-4 text-rose-400" />}
                      {source.source_type === 'sat_imagery' && <Satellite className="w-4 h-4 text-cyan-400" />}
                      {source.source_type === 'official_report' && <FileText className="w-4 h-4 text-amber-400" />}
                      <span>{source.title}</span>
                    </h5>
                    <p className="text-xs text-slate-300 leading-relaxed font-sans">
                      {source.description}
                    </p>
                  </div>
                </div>

                {source.media_url && (
                  <div className="relative rounded-lg overflow-hidden border border-slate-800 h-40 group">
                    <img
                      src={source.media_url}
                      alt="Verification evidence preview"
                      className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex items-end p-2.5">
                      <span className="text-[11px] text-slate-300 font-mono">
                        OSINT Evidence Imagery Preview
                      </span>
                    </div>
                  </div>
                )}

                <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-800/80">
                  <a
                    href={source.url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-cyan-600/20 hover:bg-cyan-600/30 text-cyan-300 border border-cyan-500/30 text-xs font-medium transition"
                  >
                    <span>View Primary Source</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>

                  {source.archive_url && (
                    <a
                      href={source.archive_url}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs font-medium transition"
                    >
                      <Archive className="w-3 h-3 text-slate-400" />
                      <span>Archive Snapshot</span>
                    </a>
                  )}

                  {source.coordinates && (
                    <button
                      onClick={copyCoordinates}
                      className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs font-mono transition"
                    >
                      <MapPin className="w-3 h-3 text-emerald-400" />
                      <span>{source.coordinates[1].toFixed(4)}, {source.coordinates[0].toFixed(4)}</span>
                      {copied ? <Check className="w-3 h-3 text-emerald-400 ml-1" /> : <Copy className="w-3 h-3 text-slate-400 ml-1" />}
                    </button>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="p-4 rounded-xl bg-slate-900/40 border border-slate-800 text-center text-xs text-slate-400">
              No direct primary OSINT video attached for this baseline boundary layer.
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 space-y-1">
              <span className="text-[10px] font-mono uppercase text-slate-500 flex items-center space-x-1">
                <User className="w-3 h-3" />
                <span>Author / OSINT Mapper</span>
              </span>
              <p className="text-xs font-medium text-slate-200 font-mono">
                {source?.author_name || historyItem?.author_name || 'System / Auto-KML Sync'}
              </p>
            </div>

            <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 space-y-1">
              <span className="text-[10px] font-mono uppercase text-slate-500 flex items-center space-x-1">
                <ShieldCheck className="w-3 h-3 text-cyan-400" />
                <span>Verified By Moderator</span>
              </span>
              <p className="text-xs font-medium text-cyan-300 font-mono">
                {historyItem?.moderator_name || 'Chief_Moderator (Approved)'}
              </p>
            </div>
          </div>
        </div>

        <div className="px-6 py-4 border-t border-slate-800 bg-slate-900/80 flex items-center justify-between">
          <button
            onClick={onToggleDiffView}
            className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-medium transition border ${
              isDiffActive
                ? 'bg-emerald-600 text-white border-emerald-500 shadow-lg shadow-emerald-500/20'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
            }`}
          >
            <GitCompare className="w-4 h-4 text-emerald-400" />
            <span>{isDiffActive ? 'Hide Boundary Diff (Before / After)' : 'Compare with Previous Boundary'}</span>
          </button>

          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition border border-slate-700"
          >
            Close Card
          </button>
        </div>
      </div>
    </div>
  );
};
