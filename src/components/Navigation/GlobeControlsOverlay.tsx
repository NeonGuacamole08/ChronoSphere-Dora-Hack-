import React, { useState, useEffect } from 'react';
import {
  Clock,
  MapPin,
  RotateCcw,
} from 'lucide-react';
import { Capsule } from '../../types';

interface GlobeControlsOverlayProps {
  onFastForward: (hours: number) => void;
  onResetTime: () => void;
  simulatedTimeOffsetMs: number;
  isPlantingMode: boolean;
  onTogglePlantingMode: () => void;
  capsules: Capsule[];
  onSelectCapsule: (capsule: Capsule) => void;
}

export const GlobeControlsOverlay: React.FC<GlobeControlsOverlayProps> = ({
  onFastForward,
  onResetTime,
  simulatedTimeOffsetMs,
  isPlantingMode,
  onTogglePlantingMode,
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
      {/* 1. CENTER BOTTOM: Real-time Clock & Judge Fast-Forward Toolbar (matching image.png) */}
      <div className="absolute bottom-5 left-1/2 -translate-x-1/2 z-40 pointer-events-auto flex items-center shadow-2xl select-none">
        <div className="flex items-center gap-2.5 p-1.5 rounded-2xl bg-[#0c1626]/90 backdrop-blur-md border border-cyan-500/40 shadow-2xl">
          {/* Purple/Magenta Realtime Clock Badge */}
          <div className="flex items-center gap-2.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-[#3e135e] to-[#250d40] border border-purple-500/40 shadow-inner">
            <Clock className="w-4 h-4 text-fuchsia-300 shrink-0" />
            <div className="flex flex-col">
              <span className="text-[9px] font-mono font-bold text-fuchsia-300/90 tracking-wider uppercase leading-none">
                {isFastForwarded ? 'SIMULATED TIME' : 'REALTIME'}
              </span>
              <span className="text-xs font-mono font-bold text-white tracking-wider mt-0.5 whitespace-pre">
                {formatDateTime(currentTimestamp)}
              </span>
            </div>
          </div>

          {/* Quick Time Travel Fast-Forward Buttons: +1h, +1d, +1w, +1y */}
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => onFastForward(1)}
              className="px-2.5 py-1 rounded-lg bg-[#101c2e] hover:bg-cyan-950/80 text-cyan-200 border border-cyan-500/30 text-xs font-mono font-bold transition cursor-pointer hover:border-cyan-400 shadow-sm"
              title="Advance time by +1 Hour"
            >
              +1h
            </button>
            <button
              type="button"
              onClick={() => onFastForward(24)}
              className="px-2.5 py-1 rounded-lg bg-[#101c2e] hover:bg-cyan-950/80 text-cyan-200 border border-cyan-500/30 text-xs font-mono font-bold transition cursor-pointer hover:border-cyan-400 shadow-sm"
              title="Advance time by +1 Day (24 Hours)"
            >
              +1d
            </button>
            <button
              type="button"
              onClick={() => onFastForward(24 * 7)}
              className="px-2.5 py-1 rounded-lg bg-[#101c2e] hover:bg-cyan-950/80 text-cyan-200 border border-cyan-500/30 text-xs font-mono font-bold transition cursor-pointer hover:border-cyan-400 shadow-sm"
              title="Advance time by +1 Week"
            >
              +1w
            </button>
            <button
              type="button"
              onClick={() => onFastForward(24 * 365)}
              className="px-2.5 py-1 rounded-lg bg-[#101c2e] hover:bg-cyan-950/80 text-cyan-200 border border-cyan-500/30 text-xs font-mono font-bold transition cursor-pointer hover:border-cyan-400 shadow-sm"
              title="Advance time by +1 Year"
            >
              +1y
            </button>

            {/* Reset Button (Visible when time is offset) */}
            {isFastForwarded && (
              <button
                type="button"
                onClick={onResetTime}
                className="p-1 rounded-lg bg-red-950/80 hover:bg-red-900 text-red-200 border border-red-500/60 transition cursor-pointer"
                title="Reset simulated time to Realtime"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 2. BOTTOM RIGHT: 'Drop Pin on Globe' Action Button (matching image.png) */}
      <div className="absolute bottom-5 right-5 z-40 pointer-events-auto select-none">
        <button
          type="button"
          onClick={onTogglePlantingMode}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold transition shadow-2xl cursor-pointer border ${
            isPlantingMode
              ? 'bg-cyan-500 text-stone-950 border-cyan-300 ring-2 ring-cyan-400 shadow-[0_0_20px_rgba(6,182,212,0.6)]'
              : 'bg-[#0c1626]/90 hover:bg-[#13233a] text-white border-cyan-500/40'
          }`}
          title="Click anywhere on the 3D globe to plant a capsule at precise coordinates"
        >
          <MapPin className={`w-4 h-4 ${isPlantingMode ? 'text-stone-950' : 'text-cyan-400'}`} />
          <span>{isPlantingMode ? 'Click on Globe to Drop' : 'Drop Pin on Globe'}</span>
        </button>
      </div>
    </>
  );
};
