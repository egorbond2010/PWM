import React, { useState } from 'react';
import { 
  X, 
  UploadCloud, 
  CheckCircle, 
  ExternalLink 
} from 'lucide-react';
import { importKML } from '../../services/api';

interface KmlImporterModalProps {
  onClose: () => void;
  onRefreshMap: () => void;
}

const sampleKmlSnippet = `<?xml version="1.0" encoding="UTF-8"?>
<kml xmlns="http://www.opengis.net/kml/2.2">
  <Document>
    <name>Frontline Sync Layer - Google My Maps Export</name>
    <Placemark>
      <name>Northern Canal Redoubt (Side A Advance)</name>
      <description>Status=side_a; Confidence=High; Source=Sentinel2</description>
      <styleUrl>#bluePoly</styleUrl>
      <Polygon>
        <outerBoundaryIs>
          <LinearRing>
            <coordinates>
              37.85,48.65,0 38.02,48.68,0 38.05,48.58,0 37.92,48.56,0 37.85,48.65,0
            </coordinates>
          </LinearRing>
        </outerBoundaryIs>
      </Polygon>
    </Placemark>
  </Document>
</kml>`;

export const KmlImporterModal: React.FC<KmlImporterModalProps> = ({
  onClose,
  onRefreshMap,
}) => {
  const [kmlText, setKmlText] = useState(sampleKmlSnippet);
  const [author, setAuthor] = useState('GoogleMyMaps_Sync_Operator');
  const [isImporting, setIsImporting] = useState(false);
  const [result, setResult] = useState<{ success: boolean; count: number } | null>(null);

  const handleImport = async () => {
    setIsImporting(true);
    try {
      const res = await importKML(kmlText, author);
      setResult({ success: true, count: res.imported_count });
      setTimeout(() => {
        onRefreshMap();
      }, 1500);
    } catch (err: any) {
      alert('KML parsing failed: ' + err.message);
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in">
      <div className="relative w-full max-w-2xl bg-[#0f172a] border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden glass-panel">
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/80">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center">
              <UploadCloud className="w-5 h-5 text-cyan-400" />
            </div>
            <div>
              <h3 className="font-bold text-slate-100 text-base">
                Google My Maps KML → PostGIS Sync Hub
              </h3>
              <p className="text-xs text-slate-400 font-mono">
                Import Placemarks, Polygons & Topological Layers
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
          {result && (
            <div className="p-3.5 rounded-xl bg-emerald-950/60 border border-emerald-800/80 text-emerald-300 text-xs flex items-center space-x-2">
              <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Successfully parsed and imported {result.count} GIS features into the database!</span>
            </div>
          )}

          <div className="text-xs text-slate-300 space-y-1">
            <p>
              Paste the exported KML file from Google My Maps below. PWM automatically extracts polygon coordinates, infers control status from styles and descriptions, and registers new historical diff records.
            </p>
          </div>

          <div>
            <label className="block text-xs font-mono uppercase text-slate-400 mb-1">
              Author / Operator
            </label>
            <input
              type="text"
              value={author}
              onChange={(e) => setAuthor(e.target.value)}
              className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-cyan-500 font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-mono uppercase text-slate-400 mb-1">
              KML / XML Source Payload
            </label>
            <textarea
              rows={9}
              value={kmlText}
              onChange={(e) => setKmlText(e.target.value)}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-xs font-mono text-cyan-300 focus:outline-none focus:border-cyan-500 leading-relaxed"
            />
          </div>

          <div className="flex items-center justify-between pt-2">
            <a
              href="https://www.google.com/maps/d/"
              target="_blank"
              rel="noreferrer"
              className="text-xs text-cyan-400/90 hover:text-cyan-300 flex items-center space-x-1 underline decoration-dotted"
            >
              <span>Open Google My Maps Editor</span>
              <ExternalLink className="w-3 h-3" />
            </a>

            <button
              onClick={handleImport}
              disabled={isImporting}
              className="flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-medium text-xs transition shadow-lg shadow-cyan-600/30 disabled:opacity-50"
            >
              <UploadCloud className="w-4 h-4" />
              <span>{isImporting ? 'Parsing KML & Differencing...' : 'Execute KML Ingestion'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
