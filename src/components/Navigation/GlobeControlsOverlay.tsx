import React, { useState, useEffect } from 'react';
import {
  Clock,
  MapPin,
  RotateCcw,
} from 'lucide-react';
import { Capsule } from '../../types';
import { CuteExplorerMascot } from './CuteExplorerMascot';
import { SupportedLanguage, translate } from '../../utils/i18n';

interface GlobeControlsOverlayProps {
  onFastForward: (hours: number) => void;
  onResetTime: () => void;
  simulatedTimeOffsetMs: number;
  isPlantingMode: boolean;
  onTogglePlantingMode: () => void;
  capsules: Capsule[];
  onSelectCapsule: (capsule: Capsule) => void;
  onFocusUserLocation?: () => void;
  language?: SupportedLanguage;
}

export const GlobeControlsOverlay: React.FC<GlobeControlsOverlayProps> = ({
  onFastForward,
  onResetTime,
  simulatedTimeOffsetMs,
  isPlantingMode,
  onTogglePlantingMode,
  onFocusUserLocation,
  language = 'en',
}) => {
  // Live ticking real-time clock
  const [currentTimestamp, setCurrentTimestamp] = useState<Date>(
    new Date(Date.now() + simulatedTimeOffsetMs)
  );

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTimestamp(new Date(Date.now() + simulatedTimeOffsetMs));
    }, 1000);
    return () => clearInterval(interval);
  }, [simulatedTimeOffsetMs]);

  // Format date and time as: DD/MM/YYYY HH:MM:SS
  const formatDateTime = (d: Date) => {
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    const seconds = String(d.getSeconds()).padStart(2, '0');
    return `${day}/${month}/${year}  ${hours}:${minutes}:${seconds}`;
  };

  const isFastForwarded = simulatedTimeOffsetMs > 0;

  return (
    <>
      {/* 1. BOTTOM-LEFT CORNER: Real-time Clock & Fast-Forward Control Box (bottom: 20px, left: 20px) */}
      <div
        id="map-time-control-box"
        className="fixed sm:absolute bottom-5 left-5 z-40 pointer-events-auto select-none max-w-[calc(100vw-120px)] sm:max-w-sm pb-[env(safe-area-inset-bottom,0px)]"
      >
        <div className="flex flex-col gap-2 p-2 sm:p-2.5 rounded-2xl bg-[#0c1626]/95 backdrop-blur-md border border-cyan-500/40 shadow-[0_8px_30px_rgba(0,0,0,0.7)]">
          {/* Realtime / Simulated Time Clock Badge */}
          <div className="flex items-center gap-2 sm:gap-2.5 px-2.5 sm:px-3 py-1.5 rounded-xl bg-gradient-to-r from-[#3e135e] to-[#250d40] border border-purple-500/40 shadow-inner">
            <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-fuchsia-300 shrink-0" />
            <div className="flex flex-col min-w-0">
              <span className="text-[8px] sm:text-[9px] font-mono font-bold text-fuchsia-300/90 tracking-wider uppercase leading-none truncate">
                {isFastForwarded ? translate('simulatedTime', language) : translate('realtime', language)}
              </span>
              <span className="text-[10px] sm:text-xs font-mono font-bold text-white tracking-wider mt-0.5 whitespace-pre truncate">
                {formatDateTime(currentTimestamp)}
              </span>
            </div>
          </div>

          {/* Quick Time Travel Fast-Forward Buttons: +1h, +1d, +1w, +1y */}
          <div className="flex items-center gap-1 sm:gap-1.5 flex-wrap sm:flex-nowrap">
            <button
              type="button"
              onClick={() => onFastForward(1)}
              className="px-2 py-1 rounded-lg bg-[#101c2e] hover:bg-cyan-950/80 text-cyan-200 border border-cyan-500/30 text-[10px] sm:text-xs font-mono font-bold transition cursor-pointer hover:border-cyan-400 shadow-sm"
              title="Advance time by +1 Hour"
            >
              +1h
            </button>
            <button
              type="button"
              onClick={() => onFastForward(24)}
              className="px-2 py-1 rounded-lg bg-[#101c2e] hover:bg-cyan-950/80 text-cyan-200 border border-cyan-500/30 text-[10px] sm:text-xs font-mono font-bold transition cursor-pointer hover:border-cyan-400 shadow-sm"
              title="Advance time by +1 Day (24 Hours)"
            >
              +1d
            </button>
            <button
              type="button"
              onClick={() => onFastForward(24 * 7)}
              className="px-2 py-1 rounded-lg bg-[#101c2e] hover:bg-cyan-950/80 text-cyan-200 border border-cyan-500/30 text-[10px] sm:text-xs font-mono font-bold transition cursor-pointer hover:border-cyan-400 shadow-sm"
              title="Advance time by +1 Week"
            >
              +1w
            </button>
            <button
              type="button"
              onClick={() => onFastForward(24 * 365)}
              className="px-2 py-1 rounded-lg bg-[#101c2e] hover:bg-cyan-950/80 text-cyan-200 border border-cyan-500/30 text-[10px] sm:text-xs font-mono font-bold transition cursor-pointer hover:border-cyan-400 shadow-sm"
              title="Advance time by +1 Year"
            >
              +1y
            </button>

            {/* Reset Button (Visible when time is offset) */}
            {isFastForwarded && (
              <button
                type="button"
                onClick={onResetTime}
                className="p-1 sm:p-1.5 rounded-lg bg-red-950/80 hover:bg-red-900 text-red-200 border border-red-500/60 transition cursor-pointer shadow-sm ml-auto sm:ml-0.5"
                title="Reset simulated time to Realtime"
              >
                <RotateCcw className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 2. BOTTOM-RIGHT CORNER: Vertically Stacked Action Buttons (shifted away from Leaflet logo & attribution) */}
      <div
        id="map-action-buttons-stack"
        className="fixed sm:absolute bottom-16 sm:bottom-20 right-4 sm:right-6 z-40 pointer-events-auto select-none flex flex-col items-end gap-2.5 pb-[env(safe-area-inset-bottom,0px)]"
      >
        {/* Top Button in Stack: 'Drop Pin' / 'Plant Capsule' */}
        <button
          type="button"
          onClick={onTogglePlantingMode}
          className={`flex items-center gap-2 px-3.5 py-2 sm:px-4 sm:py-2.5 rounded-2xl text-xs sm:text-sm font-bold transition shadow-2xl cursor-pointer border ${
            isPlantingMode
              ? 'bg-cyan-500 text-stone-950 border-cyan-300 ring-2 ring-cyan-400 shadow-[0_0_20px_rgba(6,182,212,0.6)]'
              : 'bg-[#0c1626]/95 hover:bg-[#13233a] text-white border-cyan-500/40 backdrop-blur-md'
          }`}
          title="Click on the map or globe to plant a capsule at precise coordinates"
        >
          <MapPin className={`w-4 h-4 ${isPlantingMode ? 'text-stone-950' : 'text-cyan-400'}`} />
          <span>{isPlantingMode ? translate('clickOnGlobe', language) : translate('dropPin', language)}</span>
        </button>

        {/* Bottom Button in Stack: Character Avatar / 'My Location' Button (ONLY ONE on map screen) */}
        {onFocusUserLocation && (
          <button
            type="button"
            onClick={onFocusUserLocation}
            className="flex items-center gap-2 px-3.5 py-2 sm:px-4 sm:py-2.5 rounded-2xl bg-[#0c1626]/95 hover:bg-[#13233a] text-cyan-200 hover:text-white border border-cyan-500/40 backdrop-blur-md text-xs sm:text-sm font-bold transition-all duration-200 shadow-2xl cursor-pointer active:scale-95 group"
            title="Focus map on My Live Location"
          >
            <div className="w-5 h-5 rounded-lg bg-cyan-950/90 border border-cyan-400/60 flex items-center justify-center text-cyan-300 group-hover:scale-110 transition-transform">
              <CuteExplorerMascot size={18} animate={false} />
            </div>
            <span className="font-mono">{translate('myLocation', language)}</span>
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse ml-0.5" />
          </button>
        )}
      </div>
    </>
  );
};
