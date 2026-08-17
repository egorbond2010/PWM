import React, { useState, useEffect, useMemo } from 'react';
import { 
  Search, 
  ChevronRight, 
  ChevronDown,
  Check,
  Link as LinkIcon,
  Eye,
  MapPin,
  X
} from 'lucide-react';
import { GeoJSONFeature, TerritoryHistory } from '../../types';
import { fetchViewsCount } from '../../services/api';

interface SidebarProps {
  features: GeoJSONFeature[];
  folderStats: Record<string, number>;
  history: TerritoryHistory[];
  selectedFeatureId: string | null;
  onSelectFeature: (featureId: string) => void;
  visibleFolders: Record<string, boolean>;
  onToggleFolder: (folderName: string) => void;
  visibleBaseLayers: Record<string, boolean>;
  onToggleBaseLayer: (layerKey: string) => void;
  onOpenSourceModal: (featureId: string) => void;
  basemapType: 'satellite' | 'dark' | 'streets';
  onChangeBasemap: (type: 'satellite' | 'dark' | 'streets') => void;
  isOpen?: boolean;
  onClose?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  features,
  folderStats,
  selectedFeatureId,
  onSelectFeature,
  visibleFolders,
  onToggleFolder,
  isOpen = true,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [viewsCount, setViewsCount] = useState<number>(0);

  // Real visit counter from backend API
  useEffect(() => {
    const loadViews = async () => {
      try {
        const count = await fetchViewsCount();
        setViewsCount(count);
      } catch (err) {
        setViewsCount((prev) => prev + 1);
      }
    };
    loadViews();
  }, []);

  // Expand state for each folder
  const [expandedFolders, setExpandedFolders] = useState<Record<string, boolean>>({
    'Основна Карта': true,
    'Будинки амбасадорів каналу': false,
    'Території, які контролювали ЗСУ в Росії': true,
    'Звільнені території': true,
    'Позиції, Червоне - ЗСРФ, Синє - ЗСУ': false,
    'Шар далеких ударів': false,
    'Україна': false,
    '(Рекомендовано для детальності) Райони, мікрорайони, річки, адміністративі кордони': false,
    'Міста': false,
    'Денере і Ленере': false,
  });

  const toggleFolderExpand = (folder: string) => {
    setExpandedFolders((prev) => ({ ...prev, [folder]: !prev[folder] }));
  };

  // Group features by folder
  const featuresByFolder = useMemo(() => {
    const map: Record<string, GeoJSONFeature[]> = {};
    features.forEach((f) => {
      const folder = f.properties?.folder || 'Інше';
      if (!map[folder]) map[folder] = [];
      map[folder].push(f);
    });
    return map;
  }, [features]);

  // All known folders sorted in logical order matching PWM
  const folderOrder = [
    'Основна Карта',
    'Будинки амбасадорів каналу',
    'Території, які контролювали ЗСУ в Росії',
    'Звільнені території',
    'Позиції, Червоне - ЗСРФ, Синє - ЗСУ',
    'Шар далеких ударів',
    'Україна',
    '(Рекомендовано для детальності) Райони, мікрорайони, річки, адміністративі кордони',
    'Міста',
    'Денере і Ленере'
  ];

  const allFolders = useMemo(() => {
    const existingKeys = new Set([...Object.keys(visibleFolders), ...Object.keys(folderStats), ...Object.keys(featuresByFolder)]);
    const ordered: string[] = [];
    folderOrder.forEach((f) => {
      if (existingKeys.has(f)) ordered.push(f);
    });
    existingKeys.forEach((f) => {
      if (!ordered.includes(f) && f !== 'Інше') ordered.push(f);
    });
    return ordered;
  }, [visibleFolders, folderStats, featuresByFolder]);

  // Fallback demo items if backend features are loading or empty
  const defaultFolderItems: Record<string, Array<{ name: string; type: 'red-square' | 'red-polygon' | 'yellow-pin' | 'blue-pin' | 'green-polygon' }>> = {
    'Основна Карта': [
      { name: 'Окуповано', type: 'red-square' },
      { name: 'Polygon 35', type: 'red-polygon' },
      { name: 'Виведення військ з Кінбурнської коси', type: 'yellow-pin' },
      { name: 'Polygon 63', type: 'red-polygon' },
    ],
    'Території, які контролювали ЗСУ в Росії': [
      { name: 'Тьоткіно', type: 'blue-pin' },
      { name: 'Суджа', type: 'blue-pin' },
      { name: 'Демидівка', type: 'blue-pin' },
      { name: 'Грайворон', type: 'blue-pin' },
    ],
    'Звільнені території': [
      { name: 'Звільнено (Північ)', type: 'green-polygon' },
    ]
  };

  // Helper to render distinct item icon
  const renderItemIcon = (name: string, folderName: string, geomType?: string) => {
    const lower = name.toLowerCase();

    if (lower.includes('окуповано')) {
      return (
        <span className="w-3.5 h-3.5 border-2 border-[#ef4444] rounded-xs bg-[#ef4444]/15 inline-block shrink-0" />
      );
    }
    if (lower.includes('polygon') || lower.includes('полігон') || lower.includes('сектор')) {
      return (
        <svg className="w-3.5 h-3.5 text-[#ef4444] shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <polygon points="3,6 12,2 21,7 18,21 6,19" />
        </svg>
      );
    }
    if (lower.includes('кінбурн') || lower.includes('виведення')) {
      return (
        <MapPin className="w-3.5 h-3.5 text-amber-500 fill-amber-500/20 shrink-0" />
      );
    }
    if (folderName.includes('Росії') || lower.includes('тьоткіно') || lower.includes('суджа') || lower.includes('демидівка') || lower.includes('грайворон')) {
      return (
        <MapPin className="w-3.5 h-3.5 text-[#1a73e8] fill-[#1a73e8]/20 shrink-0" />
      );
    }
    if (folderName.includes('Звільнені') || lower.includes('звільнено') || lower.includes('деокупація')) {
      return (
        <svg className="w-3.5 h-3.5 text-emerald-600 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <polygon points="12,2 22,8.5 12,22 2,8.5" />
        </svg>
      );
    }
    if (geomType === 'Point' || lower.includes('село') || lower.includes('місто') || lower.includes('н.п.')) {
      return (
        <MapPin className="w-3.5 h-3.5 text-[#1a73e8] fill-[#1a73e8]/20 shrink-0" />
      );
    }
    return (
      <svg className="w-3.5 h-3.5 text-[#ef4444] shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
        <polygon points="3,6 12,2 21,7 18,21 6,19" />
      </svg>
    );
  };

  if (!isOpen) {
    return null;
  }

  // Format view count with spaces (e.g. 470 293)
  const formattedViews = viewsCount.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');

  return (
    <aside className="fixed top-14 left-0 bottom-0 w-80 sm:w-[360px] bg-white text-slate-800 border-r border-slate-200/90 z-20 flex flex-col shadow-xl select-none font-sans overflow-hidden transition-all duration-300">
      
      {/* Top Header Block: Channel Link & Description & Real Views Counter */}
      <div className="p-3.5 pb-2.5 border-b border-slate-100 space-y-2">
        <div>
          <a
            href="https://t.me/PWMmap"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#1a73e8] hover:underline font-medium text-xs flex items-center space-x-1.5"
          >
            <LinkIcon className="w-3.5 h-3.5 text-[#1a73e8] shrink-0" />
            <span>Карта від каналу t.me/PWMmap</span>
          </a>
          <p className="text-xs text-slate-600 mt-1 leading-snug">
            Різні шари типу міст і лінії фронту по рокам можна включати!
          </p>
        </div>

        {/* Real Visit Counter */}
        <div className="flex items-center text-[11px] text-slate-500 pt-0.5">
          <div className="flex items-center space-x-1.5">
            <Eye className="w-3.5 h-3.5 text-slate-400" />
            <span>{formattedViews} переглядів</span>
          </div>
        </div>
      </div>

      {/* Search Input */}
      <div className="px-3.5 py-2.5 border-b border-slate-100">
        <div className="relative flex items-center">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 pointer-events-none" />
          <input
            type="text"
            placeholder="Пошук локацій..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#1a73e8] focus:ring-1 focus:ring-[#1a73e8] transition shadow-2xs"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 text-slate-400 hover:text-slate-600 p-0.5"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Layer Cards List */}
      <div className="flex-1 overflow-y-auto px-3.5 py-3 space-y-2.5 bg-[#ffffff]">
        {allFolders.map((folderName) => {
          const isVisible = visibleFolders[folderName] !== false;
          const isExpanded = expandedFolders[folderName] || searchQuery.length > 0;
          const folderFeatures = featuresByFolder[folderName] || [];
          const totalCount = folderStats[folderName] || folderFeatures.length || 0;

          // Filter features if search query is active
          const displayedFeatures = searchQuery
            ? folderFeatures.filter((f) =>
                (f.properties?.name || '').toLowerCase().includes(searchQuery.toLowerCase())
              )
            : folderFeatures;

          // Fallbacks for screenshot items if geometry is still loading
          const fallbackList = defaultFolderItems[folderName] || [];

          return (
            <div
              key={folderName}
              className="rounded-xl border border-slate-200 bg-white shadow-xs overflow-hidden transition hover:border-slate-300"
            >
              {/* Card Header */}
              <div
                className="p-2.5 sm:p-3 flex items-center justify-between cursor-pointer hover:bg-slate-50/70 transition"
                onClick={() => toggleFolderExpand(folderName)}
              >
                {/* Checkbox and Folder Name */}
                <div className="flex items-center space-x-2.5 min-w-0 flex-1">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleFolder(folderName);
                    }}
                    className="focus:outline-none shrink-0"
                    title={isVisible ? "Вимкнути шар" : "Увімкнути шар"}
                  >
                    {isVisible ? (
                      <div className="w-4 h-4 rounded bg-[#1a73e8] flex items-center justify-center text-white shadow-2xs">
                        <Check className="w-3 h-3 stroke-[3]" />
                      </div>
                    ) : (
                      <div className="w-4 h-4 rounded border-2 border-slate-300 bg-white hover:border-slate-400" />
                    )}
                  </button>

                  <span className="text-xs sm:text-[13px] font-semibold text-slate-800 truncate">
                    {folderName}
                  </span>
                </div>

                {/* Chevron */}
                <div className="ml-2 text-slate-400 shrink-0">
                  {isExpanded ? (
                    <ChevronDown className="w-4 h-4" />
                  ) : (
                    <ChevronRight className="w-4 h-4" />
                  )}
                </div>
              </div>

              {/* Card Expanded Items */}
              {isExpanded && (
                <div className="border-t border-slate-100 px-3 py-2 space-y-1.5 bg-slate-50/20">
                  {/* Real features if available */}
                  {displayedFeatures.length > 0 ? (
                    <>
                      {displayedFeatures.slice(0, 4).map((feat) => {
                        const name = feat.properties?.name || 'Обʼєкт';
                        const geomType = feat.geometry?.type;
                        const isSelected = selectedFeatureId === feat.properties?.id;

                        return (
                          <div
                            key={feat.properties?.id || name}
                            onClick={() => onSelectFeature(feat.properties?.id)}
                            className={`flex items-center space-x-2.5 py-1 px-1 rounded-md cursor-pointer hover:bg-slate-100 transition ${
                              isSelected ? 'bg-blue-50 text-[#1a73e8]' : 'text-slate-700'
                            }`}
                          >
                            <div className="w-3.5 h-3.5 rounded bg-[#1a73e8] flex items-center justify-center text-white shrink-0">
                              <Check className="w-2.5 h-2.5 stroke-[3]" />
                            </div>

                            {renderItemIcon(name, folderName, geomType)}

                            <span className="text-xs font-normal truncate">
                              {name}
                            </span>
                          </div>
                        );
                      })}

                      {totalCount > 4 && (
                        <div className="text-[11px] text-slate-400 italic pl-6 pt-0.5 pb-0.5">
                          і ще {totalCount - 4} об'єктів
                        </div>
                      )}
                    </>
                  ) : fallbackList.length > 0 ? (
                    /* Fallback default sample items matching screenshot */
                    <>
                      {fallbackList.map((item) => (
                        <div
                          key={item.name}
                          className="flex items-center space-x-2.5 py-1 px-1 rounded-md cursor-pointer hover:bg-slate-100 transition text-slate-700"
                        >
                          <div className="w-3.5 h-3.5 rounded bg-[#1a73e8] flex items-center justify-center text-white shrink-0">
                            <Check className="w-2.5 h-2.5 stroke-[3]" />
                          </div>

                          {renderItemIcon(item.name, folderName)}

                          <span className="text-xs font-normal truncate">
                            {item.name}
                          </span>
                        </div>
                      ))}

                      {totalCount > fallbackList.length && (
                        <div className="text-[11px] text-slate-400 italic pl-6 pt-0.5 pb-0.5">
                          і ще {totalCount - fallbackList.length} об'єктів
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="text-[11px] text-slate-400 italic pl-2 py-1">
                      {totalCount > 0 ? `і ще ${totalCount} об'єктів` : 'Шар не містить обʼєктів'}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Sidebar Footer Watermark */}
      <div className="py-2.5 text-center bg-white border-t border-slate-100">
        <span className="text-xs text-slate-400 font-medium">
          @KonotopezPWM
        </span>
      </div>
    </aside>
  );
};
