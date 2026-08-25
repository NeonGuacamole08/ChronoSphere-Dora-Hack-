import React, { useEffect } from 'react';
import { Compass, AlertTriangle, X } from 'lucide-react';

interface LandWarningToastProps {
  isOpen: boolean;
  onClose: () => void;
}

export const LandWarningToast: React.FC<LandWarningToastProps> = ({ isOpen, onClose }) => {
  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        onClose();
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      id="ocean-warning-toast"
      className="fixed bottom-24 sm:bottom-20 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2.5 px-4 py-2.5 rounded-2xl bg-[#140b07]/95 border border-amber-500/80 text-amber-100 shadow-[0_0_25px_rgba(245,158,11,0.35)] backdrop-blur-md animate-in fade-in slide-in-from-bottom-3 duration-200 select-none max-w-[92vw]"
    >
      <div className="w-7 h-7 rounded-xl bg-amber-950/90 border border-amber-500/60 flex items-center justify-center text-amber-400 shrink-0">
        <Compass className="w-4 h-4 text-amber-400 animate-spin" style={{ animationDuration: '6s' }} />
      </div>
      <div className="flex flex-col min-w-0 pr-1">
        <div className="flex items-center gap-1 text-xs font-bold text-amber-300">
          <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
          <span>Ocean Click Detected</span>
        </div>
        <span className="text-[11px] text-amber-200/80 leading-tight">
          Pins must be land-locked to dry land or city territories. Please click on a landmass!
        </span>
      </div>
      <button
        type="button"
        onClick={onClose}
        className="p-1 rounded-lg text-amber-400/70 hover:text-amber-200 hover:bg-amber-900/40 transition cursor-pointer shrink-0 ml-1"
        title="Dismiss warning"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
};
