import React, { useState, useRef, useEffect } from 'react';
import { 
  Menu, 
  Settings, 
  Moon, 
  Sun, 
  Globe, 
  Maximize2,
  Minimize2
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
  isCleanMode?: boolean;
  onToggleCleanMode?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  onToggleSidebar,
  isSidebarOpen,
  basemapType = 'satellite',
  onChangeBasemap,
  isCleanMode = false,
  onToggleCleanMode,
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

  const handleCycleBasemap = () => {
    if (!onChangeBasemap) return;
    if (basemapType === 'satellite') onChangeBasemap('dark');
    else if (basemapType === 'dark') onChangeBasemap('streets');
    else onChangeBasemap('satellite');
  };

  const getBasemapIcon = () => {
    if (basemapType === 'dark') return <Moon className="w-4 h-4 text-amber-300" />;
    if (basemapType === 'streets') return <Sun className="w-4 h-4 text-yellow-300" />;
    return <Globe className="w-4 h-4 text-cyan-200" />;
  };

  const getBasemapTitle = () => {
    if (basemapType === 'dark') return 'Темна тема (Місяць)';
    if (basemapType === 'streets') return 'Світла тема (Сонце)';
    return 'Супутник';
  };

  return (
    <header className="h-14 bg-[#d71920] text-white px-3 sm:px-4 flex items-center justify-between z-30 select-none shadow-md shrink-0">
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
            src="./pwm-avatar.png" 
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

      {/* Right side: Clean Mode, Theme Toggle, Telegram, Settings */}
      <div className="flex items-center space-x-2 sm:space-x-2.5" ref={menuRef}>
        {/* Quick Theme Switcher (Moon / Sun / Satellite) */}
        {onChangeBasemap && (
          <button
            onClick={handleCycleBasemap}
            className="flex items-center space-x-1.5 px-2.5 py-1.5 rounded-full bg-black/20 hover:bg-black/30 border border-white/20 text-white text-xs font-medium transition shadow-xs"
            title={`Перемкнути тему карти (зараз: ${getBasemapTitle()})`}
          >
            {getBasemapIcon()}
            <span className="hidden md:inline text-[11px] font-medium tracking-tight">
              {getBasemapTitle()}
            </span>
          </button>
        )}

        {/* Clean Map Mode Toggle */}
        {onToggleCleanMode && (
          <button
            onClick={onToggleCleanMode}
            className="flex items-center space-x-1.5 px-2.5 py-1.5 rounded-full bg-black/20 hover:bg-black/30 border border-white/20 text-white text-xs font-medium transition shadow-xs"
            title={isCleanMode ? "Повернути панелі" : "Лише карта (приховати всі панелі)"}
          >
            {isCleanMode ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
            <span className="hidden sm:inline text-[11px] font-medium tracking-tight">
              {isCleanMode ? "Панелі" : "Лише карта"}
            </span>
          </button>
        )}

        {/* Telegram Link */}
        <a
          href="https://t.me/PWMmap"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center space-x-1.5 px-3 py-1.5 rounded-full bg-black/20 hover:bg-black/30 border border-white/20 text-white text-xs font-medium transition shadow-xs"
          title="Відкрити Telegram канал @PWMmap"
        >
          <svg className="w-3.5 h-3.5 fill-white" viewBox="0 0 24 24">
            <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221l-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.446 1.394c-.16.16-.295.295-.605.295l.213-3.053 5.56-5.023c.242-.213-.054-.333-.373-.121l-6.871 4.326-2.962-.924c-.643-.204-.657-.643.136-.953l11.57-4.458c.538-.196 1.006.128.832.939z" />
          </svg>
          <span className="hidden xs:inline tracking-tight">t.me/PWMmap</span>
        </a>

        {/* Settings button & dropdown */}
        <div className="relative">
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="w-8 h-8 rounded-full bg-black/20 hover:bg-black/30 border border-white/20 flex items-center justify-center text-white transition focus:outline-none"
            title="Тип карти"
          >
            <Settings className="w-4 h-4" />
          </button>

          {isMenuOpen && (
            <div className="absolute right-0 mt-2 w-56 rounded-xl bg-white text-slate-800 shadow-2xl border border-slate-200 py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
              {onChangeBasemap && (
                <>
                  <div className="px-3 py-1.5 border-b border-slate-100 mb-1.5">
                    <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                      Тип карти
                    </span>
                  </div>
                  <div className="px-2 py-1 grid grid-cols-3 gap-1">
                    <button
                      onClick={() => {
                        onChangeBasemap('satellite');
                        setIsMenuOpen(false);
                      }}
                      className={`px-2 py-1.5 text-xs font-medium rounded-lg transition text-center ${
                        basemapType === 'satellite'
                          ? 'bg-red-600 text-white font-semibold shadow-xs'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      }`}
                    >
                      Супутник
                    </button>
                    <button
                      onClick={() => {
                        onChangeBasemap('streets');
                        setIsMenuOpen(false);
                      }}
                      className={`px-2 py-1.5 text-xs font-medium rounded-lg transition text-center ${
                        basemapType === 'streets'
                          ? 'bg-red-600 text-white font-semibold shadow-xs'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      }`}
                    >
                      Світла
                    </button>
                    <button
                      onClick={() => {
                        onChangeBasemap('dark');
                        setIsMenuOpen(false);
                      }}
                      className={`px-2 py-1.5 text-xs font-medium rounded-lg transition text-center ${
                        basemapType === 'dark'
                          ? 'bg-red-600 text-white font-semibold shadow-xs'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      }`}
                    >
                      Темна
                    </button>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
