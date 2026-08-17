import React, { useState } from 'react';
import { 
  X, 
  FileEdit, 
  CheckCircle, 
  Clock, 
  Send, 
  Plus, 
  Link2
} from 'lucide-react';
import { TerritoryStatus, ConfidenceLevel, SourceType } from '../../types';
import { submitModerationProposal, approveProposal } from '../../services/api';

interface AdminEditorModalProps {
  onClose: () => void;
  onRefreshMap: () => void;
  pendingProposals: any[];
}

export const AdminEditorModal: React.FC<AdminEditorModalProps> = ({
  onClose,
  onRefreshMap,
  pendingProposals,
}) => {
  const [activeTab, setActiveTab] = useState<'create' | 'moderation'>('create');

  const [name, setName] = useState('Bakhmut Frontline Sector (Update)');
  const [status, setStatus] = useState<TerritoryStatus>('side_b');
  const [notes, setNotes] = useState('Frontline boundary pushed 300m west following verified geolocation video.');
  const [sourceTitle, setSourceTitle] = useState('Geolocated UAV Recon Footage #1502');
  const [sourceUrl, setSourceUrl] = useState('https://t.me/osint_geoconfirm/15020');
  const [sourceType, setSourceType] = useState<SourceType>('video');
  const [confidence, setConfidence] = useState<ConfidenceLevel>('confirmed_high');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const proposal = {
        name,
        status,
        color_hex: status === 'side_a' ? '#3b82f6' : status === 'side_b' ? '#ef4444' : '#eab308',
        geometry: {
          type: 'Polygon',
          coordinates: [
            [
              [38.05, 48.58],
              [38.22, 48.62],
              [38.25, 48.48],
              [38.03, 48.46],
              [38.05, 48.58],
            ],
          ],
        },
        notes,
        author_name: 'OSINT_Analyst_01',
        sources: [
          {
            title: sourceTitle,
            url: sourceUrl,
            source_type: sourceType,
            confidence,
            description: notes,
            author_name: 'OSINT_Analyst_01',
          },
        ],
      };

      await submitModerationProposal(proposal);
      setSuccessMessage('Proposal submitted successfully into Pending Moderation Queue!');
      setTimeout(() => {
        setSuccessMessage('');
        onRefreshMap();
      }, 2000);
    } catch (err: any) {
      alert('Error submitting proposal: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleApprove = async (proposalId: string) => {
    try {
      await approveProposal(proposalId, 'Chief_Moderator');
      alert('Proposal approved and broadcast to all live clients!');
      onRefreshMap();
    } catch (err: any) {
      alert('Approval failed: ' + err.message);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in">
      <div className="relative w-full max-w-2xl bg-[#0f172a] border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden glass-panel">
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/80">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center">
              <FileEdit className="w-5 h-5 text-cyan-400" />
            </div>
            <div>
              <h3 className="font-bold text-slate-100 text-base">
                PWM GIS Editor & Moderation Suite
              </h3>
              <p className="text-xs text-slate-400 font-mono">
                Boundary Manipulation & Verifiable Submission Pipeline
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

        <div className="flex border-b border-slate-800 bg-slate-950/40 text-xs font-medium px-6">
          <button
            onClick={() => setActiveTab('create')}
            className={`py-3 px-4 flex items-center space-x-2 transition ${
              activeTab === 'create'
                ? 'text-cyan-400 border-b-2 border-cyan-400 bg-slate-900/50'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Plus className="w-4 h-4" />
            <span>Propose Territory Shift</span>
          </button>
          <button
            onClick={() => setActiveTab('moderation')}
            className={`py-3 px-4 flex items-center space-x-2 transition ${
              activeTab === 'moderation'
                ? 'text-cyan-400 border-b-2 border-cyan-400 bg-slate-900/50'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Clock className="w-4 h-4 text-amber-400" />
            <span>Moderation Queue ({pendingProposals.length})</span>
          </button>
        </div>

        <div className="p-6 max-h-[70vh] overflow-y-auto">
          {successMessage && (
            <div className="mb-4 p-3 rounded-xl bg-emerald-950/60 border border-emerald-800/80 text-emerald-300 text-xs flex items-center space-x-2">
              <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}

          {activeTab === 'create' && (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-mono uppercase text-slate-400 mb-1">
                    Sector / Territory Name
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-cyan-500 font-sans"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono uppercase text-slate-400 mb-1">
                    Control Status
                  </label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as TerritoryStatus)}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-cyan-500 font-sans"
                  >
                    <option value="side_a">Side A (Friendly / Blue)</option>
                    <option value="side_b">Side B (Adversary / Red)</option>
                    <option value="contested">Contested / Grey Zone (Yellow)</option>
                    <option value="unconfirmed">Unconfirmed (Gray)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-mono uppercase text-slate-400 mb-1">
                  Change Rationale & Tactical Notes
                </label>
                <textarea
                  rows={2}
                  required
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-cyan-500 font-sans"
                  placeholder="Describe why this boundary moved..."
                />
              </div>

              <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-3">
                <h4 className="text-xs font-mono uppercase tracking-wider text-cyan-400 flex items-center space-x-1.5">
                  <Link2 className="w-3.5 h-3.5" />
                  <span>Attach Verifiable OSINT Evidence</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-mono text-slate-400 mb-1">
                      Evidence Title
                    </label>
                    <input
                      type="text"
                      required
                      value={sourceTitle}
                      onChange={(e) => setSourceTitle(e.target.value)}
                      className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-mono text-slate-400 mb-1">
                      Primary URL (Video / Geo-thread)
                    </label>
                    <input
                      type="url"
                      required
                      value={sourceUrl}
                      onChange={(e) => setSourceUrl(e.target.value)}
                      className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-mono text-slate-400 mb-1">
                      Evidence Type
                    </label>
                    <select
                      value={sourceType}
                      onChange={(e) => setSourceType(e.target.value as SourceType)}
                      className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
                    >
                      <option value="video">Geolocated Video</option>
                      <option value="sat_imagery">Satellite Imagery</option>
                      <option value="geolocated_photo">Geolocated Photo</option>
                      <option value="official_report">Official Statement</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-mono text-slate-400 mb-1">
                      Confidence Level
                    </label>
                    <select
                      value={confidence}
                      onChange={(e) => setConfidence(e.target.value as ConfidenceLevel)}
                      className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
                    >
                      <option value="confirmed_high">High (Strict Geolocation)</option>
                      <option value="medium">Medium (Single Reliable Report)</option>
                      <option value="unconfirmed">Unconfirmed Rumor</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-medium text-xs transition shadow-lg shadow-cyan-600/30 disabled:opacity-50"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{isSubmitting ? 'Submitting...' : 'Submit to Moderation Pipeline'}</span>
                </button>
              </div>
            </form>
          )}

          {activeTab === 'moderation' && (
            <div className="space-y-3">
              {pendingProposals.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-400 border border-dashed border-slate-800 rounded-xl">
                  No pending proposals in review queue. All boundary changes are verified!
                </div>
              ) : (
                pendingProposals.map((prop) => (
                  <div
                    key={prop.id}
                    className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2.5"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="text-sm font-semibold text-slate-100">{prop.notes || 'Boundary Shift Proposal'}</h4>
                        <span className="text-[11px] font-mono text-cyan-400">Author: {prop.author_name}</span>
                      </div>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-amber-500/10 text-amber-300 border border-amber-500/30">
                        Pending Moderator Review
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-slate-800/80">
                      <span>Area Delta: +{prop.delta_area_sqkm?.toFixed(1) || '3.5'} km²</span>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleApprove(prop.id)}
                          className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium transition"
                        >
                          Approve & Publish to Map
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
