import React, { useState, useEffect } from 'react';
import { Sparkles, X, Hand } from 'lucide-react';
import { SupportedLanguage, translate } from '../../utils/i18n';

interface GestureTutorialOverlayProps {
  isVisible: boolean;
  onDismiss: () => void;
  language?: SupportedLanguage;
}

export const GestureTutorialOverlay: React.FC<GestureTutorialOverlayProps> = ({
  isVisible,
  onDismiss,
  language = 'en',
}) => {
  const [hasInteracted, setHasInteracted] = useState(false);

  useEffect(() => {
    // If dismissed or hidden, mark interacted
    if (!isVisible) {
      setHasInteracted(true);
    }
  }, [isVisible]);

  if (!isVisible || hasInteracted) return null;

  return (
    <div
      className="absolute bottom-28 sm:bottom-24 left-1/2 -translate-x-1/2 z-30 pointer-events-auto select-none animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-[90vw]"
      onClick={onDismiss}
    >
      <div className="flex items-center gap-3 px-3.5 py-2.5 sm:px-4 sm:py-3 rounded-2xl bg-[#0c1626]/90 backdrop-blur-xl border border-cyan-400/60 shadow-[0_8px_32px_rgba(6,182,212,0.3)] text-white">
        {/* Animated Pinch & Touch SVG Icon */}
        <div className="relative w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-cyan-950 to-[#0c1e36] border border-cyan-400/50 flex items-center justify-center shrink-0 shadow-inner overflow-hidden">
          {/* Animated Pinch Target Circles */}
          <div className="absolute w-7 h-7 rounded-full border border-cyan-300/40 animate-ping pointer-events-none" />
          <div className="absolute w-4 h-4 rounded-full bg-cyan-400/20 animate-pulse pointer-events-none" />

          {/* Pinch Graphic SVG */}
          <svg
            className="w-6 h-6 text-cyan-300 transform -rotate-12 animate-pulse"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            {/* Left finger indicator */}
            <circle cx="6" cy="7" r="2" className="fill-cyan-400/40" />
            {/* Right finger indicator */}
            <circle cx="18" cy="7" r="2" className="fill-cyan-400/40" />
            {/* Pinch arrows */}
            <path d="M9 7h2m4 0h-2" strokeDasharray="1 1" />
            <path d="M12 12v6a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2v-4" />
            <path d="M12 12a2 2 0 0 1 2 2v4a2 2 0 0 1-2 2" />
          </svg>
        </div>

        {/* Tutorial Text Badge */}
        <div className="flex flex-col text-left pr-1">
          <div className="flex items-center gap-1.5 text-[10px] sm:text-[11px] font-mono uppercase tracking-wider text-cyan-300 font-bold">
            <Sparkles className="w-3 h-3 text-cyan-400 animate-spin" style={{ animationDuration: '4s' }} />
            <span>{translate('interactiveZoom', language)}</span>
          </div>
          <p className="text-xs sm:text-sm font-sans font-semibold text-white leading-snug">
            {translate('pinchOrDoubleTap', language)}
          </p>
        </div>

        {/* Quick Close Button */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onDismiss();
          }}
          className="p-1 rounded-lg text-cyan-300/70 hover:text-white hover:bg-cyan-950/80 transition cursor-pointer shrink-0 ml-1"
          title="Dismiss tutorial"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};

