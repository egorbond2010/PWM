import React, { useState, useRef, useEffect } from 'react';
import { 
  Menu, 
  Settings, 
  GitCompare, 
  UploadCloud, 
  FileEdit, 
  ShieldCheck 
} from 'lucide-react';

interface HeaderProps {
  activeViewMode: 'public' | 'osint' | 'editor';
  setActiveViewMode: (mode: 'public' | 'osint' | 'editor') => void;
  onOpenKmlModal: () => void;
  onOpenDiffModal: () => void;
  onOpenEditorModal: () => void;
  isWsConnected: boolean;
  onToggleSidebar?: () => void;
  isSidebarOpen?: boolean;
  basemapType?: 'satellite' | 'dark' | 'streets';
  onChangeBasemap?: (type: 'satellite' | 'dark' | 'streets') => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeViewMode,
  setActiveViewMode,
  onOpenKmlModal,
  onOpenDiffModal,
  onOpenEditorModal,
  isWsConnected,
  onToggleSidebar,
  isSidebarOpen,
  basemapType = 'satellite',
  onChangeBasemap,
}) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="h-14 bg-[#d71920] text-white px-3 sm:px-4 flex items-center justify-between z-30 select-none shadow-md">
      {/* Left side: Hamburger, Logo badge, Title */}
      <div className="flex items-center space-x-3">
        <button
          onClick={onToggleSidebar}
          className="p-1.5 rounded-lg text-white/90 hover:text-white hover:bg-white/10 transition focus:outline-none"
          title={isSidebarOpen ? "Згорнути меню" : "Розгорнути меню"}
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex items-center space-x-2.5">
          <img 
            src="/pwm-avatar.png" 
            alt="PWM Logo" 
            className="w-9 h-9 rounded-lg object-cover shadow-sm ring-1 ring-black/30 shrink-0" 
          />
          <div className="flex flex-col">
            <h1 className="text-sm sm:text-base font-bold text-white leading-tight tracking-tight">
              Perfect War Map
            </h1>
            <span className="text-[11px] text-white/85 font-normal leading-none">
              Konotopez
            </span>
          </div>
        </div>
      </div>

      {/* Right side: Telegram pill button and Settings gear */}
      <div className="flex items-center space-x-2 sm:space-x-3" ref={menuRef}>
        <a
          href="https://t.me/PWMmap"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center space-x-1.5 px-3 py-1 rounded-full bg-black/20 hover:bg-black/30 border border-white/20 text-white text-xs font-medium transition shadow-xs"
          title="Відкрити Telegram канал @PWMmap"
        >
          {/* Telegram Plane Icon */}
          <svg className="w-3.5 h-3.5 fill-white" viewBox="0 0 24 24">
            <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221l-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.446 1.394c-.16.16-.295.295-.605.295l.213-3.053 5.56-5.023c.242-.213-.054-.333-.373-.121l-6.871 4.326-2.962-.924c-.643-.204-.657-.643.136-.953l11.57-4.458c.538-.196 1.006.128.832.939z" />
          </svg>
          <span className="tracking-tight">t.me/PWMmap</span>
        </a>

        {/* Settings button & dropdown */}
        <div className="relative">
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="w-8 h-8 rounded-full bg-black/20 hover:bg-black/30 border border-white/20 flex items-center justify-center text-white transition focus:outline-none"
            title="Налаштування та інструменти"
          >
            <Settings className="w-4 h-4" />
          </button>

          {isMenuOpen && (
            <div className="absolute right-0 mt-2 w-64 rounded-xl bg-white text-slate-800 shadow-2xl border border-slate-200 py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
              <div className="px-3 py-1.5 border-b border-slate-100 mb-1">
                <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                  Інструменти карти
                </span>
              </div>

              <button
                onClick={() => {
                  setIsMenuOpen(false);
                  onOpenEditorModal();
                }}
                className="w-full px-3.5 py-2 text-left text-xs font-medium text-slate-700 hover:bg-slate-50 hover:text-red-600 flex items-center space-x-2.5 transition"
              >
                <FileEdit className="w-4 h-4 text-slate-500" />
                <span>GIS Редактор меж</span>
              </button>

              <button
                onClick={() => {
                  setIsMenuOpen(false);
                  onOpenKmlModal();
                }}
                className="w-full px-3.5 py-2 text-left text-xs font-medium text-slate-700 hover:bg-slate-50 hover:text-red-600 flex items-center space-x-2.5 transition"
              >
                <UploadCloud className="w-4 h-4 text-slate-500" />
                <span>Синхронізація KML</span>
              </button>

              <button
                onClick={() => {
                  setIsMenuOpen(false);
                  onOpenDiffModal();
                }}
                className="w-full px-3.5 py-2 text-left text-xs font-medium text-slate-700 hover:bg-slate-50 hover:text-red-600 flex items-center space-x-2.5 transition"
              >
                <GitCompare className="w-4 h-4 text-slate-500" />
                <span>Журнал змін (Diffs)</span>
              </button>

              {onChangeBasemap && (
                <>
                  <div className="px-3 py-1.5 border-t border-slate-100 mt-1 mb-1">
                    <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                      Тип карти
                    </span>
                  </div>
                  <div className="px-2 py-1 grid grid-cols-3 gap-1">
                    <button
                      onClick={() => onChangeBasemap('satellite')}
                      className={`px-2 py-1 text-[11px] font-medium rounded transition text-center ${
                        basemapType === 'satellite'
                          ? 'bg-red-600 text-white font-semibold'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      }`}
                    >
                      Супутник
                    </button>
                    <button
                      onClick={() => onChangeBasemap('streets')}
                      className={`px-2 py-1 text-[11px] font-medium rounded transition text-center ${
                        basemapType === 'streets'
                          ? 'bg-red-600 text-white font-semibold'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      }`}
                    >
                      Схема
                    </button>
                    <button
                      onClick={() => onChangeBasemap('dark')}
                      className={`px-2 py-1 text-[11px] font-medium rounded transition text-center ${
                        basemapType === 'dark'
                          ? 'bg-red-600 text-white font-semibold'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      }`}
                    >
                      Темна
                    </button>
                  </div>
                </>
              )}

              <div className="px-3 py-1.5 border-t border-slate-100 mt-1 mb-1">
                <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                  Режим перегляду
                </span>
              </div>
              <div className="px-2 pb-1 flex space-x-1">
                <button
                  onClick={() => setActiveViewMode('public')}
                  className={`flex-1 py-1 text-[11px] font-medium rounded transition text-center ${
                    activeViewMode === 'public'
                      ? 'bg-blue-600 text-white font-semibold'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  Публічний
                </button>
                <button
                  onClick={() => setActiveViewMode('osint')}
                  className={`flex-1 py-1 text-[11px] font-medium rounded transition text-center flex items-center justify-center space-x-1 ${
                    activeViewMode === 'osint'
                      ? 'bg-blue-600 text-white font-semibold'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  <ShieldCheck className="w-3 h-3" />
                  <span>OSINT</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
