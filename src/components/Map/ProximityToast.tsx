import React, { useEffect } from 'react';
import { Sparkles, MapPin, X, ArrowRight, Zap, Unlock, Compass } from 'lucide-react';
import { Capsule } from '../../types';
import { formatDistanceText } from '../../utils/proximity';
import { ambientSound } from '../../utils/audio';

interface ProximityToastProps {
  capsule: Capsule | null;
  distanceMeters: number | null;
  onOpenCapsule: (capsule: Capsule) => void;
  onClose: () => void;
}

export const ProximityToast: React.FC<ProximityToastProps> = ({
  capsule,
  distanceMeters,
  onOpenCapsule,
  onClose,
}) => {
  useEffect(() => {
    if (capsule) {
      ambientSound.playPinDropSound();
    }
  }, [capsule]);

  if (!capsule) return null;

  const isInstant = capsule.public_unlock_mode === 'instant_find';
  const isTimeUnlocked = new Date(capsule.unlock_timestamp).getTime() <= Date.now();
  const radius = capsule.unlock_radius_meters || 100;
  const isInsideRadius = distanceMeters !== null && distanceMeters <= radius;

  return (
    <div
      id="proximity-notification-popup"
      role="alert"
      className="fixed top-20 sm:top-24 left-3 right-3 sm:left-auto sm:right-6 sm:max-w-md z-50 p-3.5 sm:p-4 rounded-2xl bg-[#180d07]/98 border-2 border-amber-400 text-amber-100 shadow-[0_12px_40px_rgba(0,0,0,0.8),0_0_20px_rgba(245,158,11,0.25)] backdrop-blur-xl animate-in fade-in slide-in-from-top-4 duration-300 pointer-events-auto"
    >
      <div className="flex items-start justify-between gap-2.5">
        <div className="flex items-start gap-2.5 sm:gap-3 min-w-0 flex-1">
          {/* Animated Icon Avatar */}
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-amber-500 to-amber-800 text-amber-950 flex items-center justify-center shrink-0 shadow-lg ring-2 ring-amber-300 animate-pulse">
            {isInstant ? (
              <Zap className="w-5 h-5 fill-amber-950" />
            ) : isTimeUnlocked ? (
              <Unlock className="w-5 h-5" />
            ) : (
              <Sparkles className="w-5 h-5 fill-amber-950" />
            )}
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5 mb-1 flex-wrap">
              <span className="text-[9.5px] sm:text-[10px] uppercase font-mono font-bold tracking-wider px-2 py-0.5 rounded-full bg-amber-500/25 text-amber-300 border border-amber-400/50 whitespace-nowrap">
                {isInstant ? '⚡ Instant Find Alert' : '📍 Nearby Capsule'}
              </span>
              {isInsideRadius && (
                <span className="text-[10px] font-bold text-emerald-400 flex items-center gap-1 bg-emerald-950/60 px-1.5 py-0.2 border border-emerald-500/40 rounded-full whitespace-nowrap">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                  Inside Unlock Zone
                </span>
              )}
            </div>

            <h4 className="font-serif font-bold text-xs sm:text-sm text-amber-100 truncate pr-1">
              {capsule.title}
            </h4>

            <p className="text-[11px] sm:text-xs text-amber-200/80 mt-0.5 leading-snug break-words">
              {distanceMeters !== null ? (
                <>
                  Capsule is{' '}
                  <strong className="text-amber-300 font-mono font-bold">
                    {formatDistanceText(distanceMeters)}
                  </strong>{' '}
                  away in <span className="text-amber-100 font-semibold">{capsule.location_name}</span>!
                </>
              ) : (
                <>Capsule detected near your current location!</>
              )}
            </p>
          </div>
        </div>

        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="p-1 sm:p-1.5 rounded-xl text-amber-400/70 hover:text-amber-100 hover:bg-amber-900/40 transition cursor-pointer shrink-0 active:scale-95"
          title="Dismiss notification"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Footer Actions */}
      <div className="flex items-center justify-between gap-2 mt-2.5 sm:mt-3 pt-2 sm:pt-2.5 border-t border-amber-500/30 text-[11px]">
        <div className="flex items-center gap-1 text-amber-300/70 font-mono text-[10px] sm:text-[11px]">
          <Compass className="w-3 h-3 text-amber-400 shrink-0" />
          <span>Radius: {radius}m</span>
        </div>

        <button
          type="button"
          onClick={() => {
            onOpenCapsule(capsule);
            onClose();
          }}
          className="px-3 py-1.5 sm:px-3.5 sm:py-1.5 rounded-xl bg-gradient-to-r from-amber-600 via-amber-500 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-stone-950 font-bold text-xs shadow-lg transition flex items-center gap-1.5 cursor-pointer active:scale-95 whitespace-nowrap"
        >
          <span>Inspect Capsule</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
