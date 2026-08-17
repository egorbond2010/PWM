import React, { useState, useEffect, useMemo } from 'react';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar/Sidebar';
import { Timeline } from './components/Timeline/Timeline';
import { MapComponent } from './components/Map/MapComponent';
import { VerificationModal } from './components/VerificationModal/VerificationModal';
import { AdminEditorModal } from './components/AdminEditor/AdminEditorModal';
import { DiffInspectorModal } from './components/DiffInspector/DiffInspectorModal';
import { KmlImporterModal } from './components/KmlImporter/KmlImporterModal';

import { 
  GeoJSONFeatureCollection, 
  TerritoryHistory, 
  Source, 
  GeoJSONFeature
} from './types';
import { 
  fetchMapFeatures, 
  fetchHistory, 
  fetchDiffs, 
  fetchSources, 
  wsService 
} from './services/api';
import { initialMapFeatures, initialDiffs, initialSources } from './data/defaultMapData';

export const App: React.FC = () => {
  const [mapFeatures, setMapFeatures] = useState<GeoJSONFeatureCollection>(initialMapFeatures);
  const [folderStats, setFolderStats] = useState<Record<string, number>>({});
  const [history, setHistory] = useState<TerritoryHistory[]>(initialDiffs);
  const [diffs, setDiffs] = useState<TerritoryHistory[]>(initialDiffs);
  const [sources, setSources] = useState<Source[]>(initialSources);

  const [activeViewMode, setActiveViewMode] = useState<'public' | 'osint' | 'editor'>('public');
  const [isWsConnected, setIsWsConnected] = useState(false);
  const [basemapType, setBasemapType] = useState<'satellite' | 'dark' | 'streets'>('satellite');
  const [isSidebarOpen, setIsSidebarOpen] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth >= 768;
    }
    return false;
  });

  const [visibleFolders, setVisibleFolders] = useState<Record<string, boolean>>({
    'Основна Карта': true,
    'Будинки амбасадорів каналу': false,
    'Території, які контролювали ЗСУ в Росії': true,
    'Звільнені території': true,
    'Позиції, Червоне - ЗСРФ, Синє - ЗСУ': true,
    'Шар далеких ударів': true,
    'Україна': true,
    '(Рекомендовано для детальності) Райони, мікрорайони, річки, адміністративі кордони': false,
    'Міста': false,
    'Денере і Ленере': true,
    'Сіра зона': true,
  });

  const [visibleBaseLayers, setVisibleBaseLayers] = useState<Record<string, boolean>>({
    cities: true,
    roads: true,
    borders: true,
    frontline: true,
    diffs: true,
  });

  const [selectedFeatureId, setSelectedFeatureId] = useState<string | null>(null);
  const [isVerificationModalOpen, setIsVerificationModalOpen] = useState(false);
  const [isEditorModalOpen, setIsEditorModalOpen] = useState(false);
  const [isDiffModalOpen, setIsDiffModalOpen] = useState(false);
  const [isKmlModalOpen, setIsKmlModalOpen] = useState(false);
  const [isDiffHighlightActive, setIsDiffHighlightActive] = useState(true);
  const [selectedDiff, setSelectedDiff] = useState<TerritoryHistory | null>(null);

  const timelineDates = useMemo(() => [
    '2022 (Початок вторгнення)',
    '2022 (Харківський / Херсонський контрнаступ)',
    '2023 (Битва за Бахмут)',
    '2024 (Курський плацдарм ЗСУ)',
    '2026 (Поточна лінія фронту LIVE)'
  ], []);
  const [currentDateIndex, setCurrentDateIndex] = useState(timelineDates.length - 1);
  const [isLive, setIsLive] = useState(true);

  const loadData = async () => {
    try {
      let kmlRes = await fetch('./data/pwm_kml_parsed.geojson').catch(() => null);
      if (!kmlRes || !kmlRes.ok) {
        kmlRes = await fetch('/data/pwm_kml_parsed.geojson').catch(() => null);
      }
      if (kmlRes && kmlRes.ok) {
        const kmlData = await kmlRes.json();
        if (kmlData?.features?.length > 0) {
          setMapFeatures(kmlData);
        }
      }

      let statsRes = await fetch('./data/pwm_folder_stats.json').catch(() => null);
      if (!statsRes || !statsRes.ok) {
        statsRes = await fetch('/data/pwm_folder_stats.json').catch(() => null);
      }
      if (statsRes && statsRes.ok) {
        const statsData = await statsRes.json();
        setFolderStats(statsData);
      }

      const [histRes, diffRes, srcRes] = await Promise.all([
        fetchHistory(),
        fetchDiffs(),
        fetchSources(),
      ]);
      if (histRes) setHistory(histRes);
      if (diffRes) setDiffs(diffRes);
      if (srcRes) setSources(srcRes);
    } catch (e) {
      console.warn(e);
    }
  };

  useEffect(() => {
    loadData();

    wsService.connect();
    setIsWsConnected(true);

    const unsubscribe = wsService.subscribe((msg) => {
      if (msg.event === 'territory_updated' || msg.event === 'map_reloaded') {
        loadData();
      }
    });

    return () => {
      unsubscribe();
    };
  }, []);

  const handleToggleFolder = (folderName: string) => {
    setVisibleFolders((prev) => ({ ...prev, [folderName]: !prev[folderName] }));
  };

  const handleToggleBaseLayer = (layerKey: string) => {
    setVisibleBaseLayers((prev) => ({ ...prev, [layerKey]: !prev[layerKey] }));
  };

  const handleSelectFeature = (featureId: string) => {
    setSelectedFeatureId(featureId);
  };

  const selectedFeature = useMemo<GeoJSONFeature | null>(() => {
    if (!selectedFeatureId) return null;
    return mapFeatures.features.find((f) => f.properties.id === selectedFeatureId) || null;
  }, [selectedFeatureId, mapFeatures]);

  const selectedSource = useMemo<Source | null>(() => {
    if (!selectedFeature?.properties?.last_source_id) return sources[0] || null;
    return sources.find((s) => s.id === selectedFeature.properties.last_source_id) || sources[0] || null;
  }, [selectedFeature, sources]);

  const selectedHistoryItem = useMemo<TerritoryHistory | null>(() => {
    if (!selectedFeatureId) return null;
    return history.find((h) => h.territory_id === selectedFeatureId) || null;
  }, [selectedFeatureId, history]);

  const [isCleanMode, setIsCleanMode] = useState(false);

  return (
    <div className="flex flex-col h-screen w-screen bg-[#0a0d14] text-slate-100 overflow-hidden font-sans select-none">
      {!isCleanMode && (
        <Header
          activeViewMode={activeViewMode}
          setActiveViewMode={setActiveViewMode}
          onOpenKmlModal={() => setIsKmlModalOpen(true)}
          onOpenDiffModal={() => setIsDiffModalOpen(true)}
          onOpenEditorModal={() => setIsEditorModalOpen(true)}
          isWsConnected={isWsConnected}
          onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
          isSidebarOpen={isSidebarOpen}
          basemapType={basemapType}
          onChangeBasemap={(type) => setBasemapType(type)}
          isCleanMode={isCleanMode}
          onToggleCleanMode={() => setIsCleanMode(true)}
        />
      )}

      <main className="relative flex-1 w-full h-full overflow-hidden">
        <MapComponent
          features={mapFeatures}
          diffs={diffs}
          selectedFeatureId={selectedFeatureId}
          onSelectFeature={handleSelectFeature}
          visibleFolders={visibleFolders}
          visibleBaseLayers={visibleBaseLayers}
          isDiffHighlightActive={isDiffHighlightActive}
          selectedDiff={selectedDiff}
          basemapType={basemapType}
        />

        {!isCleanMode && (
          <Sidebar
            features={mapFeatures.features}
            folderStats={folderStats}
            history={history}
            selectedFeatureId={selectedFeatureId}
            onSelectFeature={handleSelectFeature}
            visibleFolders={visibleFolders}
            onToggleFolder={handleToggleFolder}
            visibleBaseLayers={visibleBaseLayers}
            onToggleBaseLayer={handleToggleBaseLayer}
            onOpenSourceModal={(id) => {
              setSelectedFeatureId(id);
              setIsVerificationModalOpen(true);
            }}
            basemapType={basemapType}
            onChangeBasemap={(type) => setBasemapType(type)}
            isOpen={isSidebarOpen}
            onClose={() => setIsSidebarOpen(false)}
          />
        )}

        {/* Floating Layers Button for Mobile when Sidebar is Closed */}
        {!isSidebarOpen && !isCleanMode && (
          <button
            onClick={() => setIsSidebarOpen(true)}
            className="md:hidden absolute bottom-5 left-3.5 z-20 flex items-center space-x-2 bg-[#1a73e8] hover:bg-[#1557b0] active:scale-95 text-white px-3.5 py-2 rounded-full shadow-2xl border border-white/20 text-xs font-semibold transition"
            title="Відкрити налаштування шарів"
          >
            <span className="text-sm">📁</span>
            <span>Шари карти</span>
          </button>
        )}

        {/* Floating Return Button when in Clean Map Mode */}
        {isCleanMode && (
          <div className="absolute top-3 right-3 z-30 flex items-center space-x-2 bg-slate-900/85 backdrop-blur-md px-3 py-2 rounded-xl border border-slate-700/60 shadow-xl">
            <button
              onClick={() => {
                if (basemapType === 'satellite') setBasemapType('dark');
                else if (basemapType === 'dark') setBasemapType('streets');
                else setBasemapType('satellite');
              }}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white transition text-xs flex items-center space-x-1"
              title="Змінити тему карти"
            >
              {basemapType === 'dark' ? '🌙' : basemapType === 'streets' ? '☀️' : '🛰️'}
            </button>

            <button
              onClick={() => setIsCleanMode(false)}
              className="px-2.5 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white font-medium text-xs transition shadow-xs flex items-center space-x-1.5"
              title="Повернути панелі та меню"
            >
              <span>Показати меню</span>
            </button>
          </div>
        )}
      </main>

      {isVerificationModalOpen && selectedFeature && (
        <VerificationModal
          feature={selectedFeature}
          source={selectedSource}
          historyItem={selectedHistoryItem}
          onClose={() => setIsVerificationModalOpen(false)}
          onToggleDiffView={() => setIsDiffHighlightActive(!isDiffHighlightActive)}
          isDiffActive={isDiffHighlightActive}
        />
      )}

      {isEditorModalOpen && (
        <AdminEditorModal
          onClose={() => setIsEditorModalOpen(false)}
          onRefreshMap={loadData}
          pendingProposals={history.filter((h) => h.moderation_status === 'pending')}
        />
      )}

      {isDiffModalOpen && (
        <DiffInspectorModal
          diffs={diffs}
          onClose={() => setIsDiffModalOpen(false)}
          onSelectDiff={(diff) => setSelectedDiff(diff)}
        />
      )}

      {isKmlModalOpen && (
        <KmlImporterModal
          onClose={() => setIsKmlModalOpen(false)}
          onRefreshMap={loadData}
        />
      )}
    </div>
  );
};

export default App;
