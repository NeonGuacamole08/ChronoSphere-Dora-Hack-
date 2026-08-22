import React, { useState } from 'react';
import {
  X,
  Globe2,
  MapPin,
  Lock,
  Clock,
  Compass,
  Layers,
  Sparkles,
  ShieldCheck,
  Music,
  Mic,
  ArrowRight,
  CheckCircle2,
} from 'lucide-react';

interface WelcomeGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenPlantModal?: () => void;
  onOpenBackendHub?: () => void;
}

export const WelcomeGuideModal: React.FC<WelcomeGuideModalProps> = ({
  isOpen,
  onClose,
  onOpenPlantModal,
}) => {
  const [dontShowAgain, setDontShowAgain] = useState(false);

  if (!isOpen) return null;

  const handleDismiss = () => {
    if (dontShowAgain) {
      try {
        localStorage.setItem('chronospheres_welcome_dismissed', 'true');
      } catch (e) {
        console.warn(e);
      }
    }
    onClose();
  };

  const handlePlantClick = () => {
    handleDismiss();
    if (onOpenPlantModal) {
      onOpenPlantModal();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-300">
      {/* Light Brown / Warm Parchment Card Container */}
      <div className="relative w-full max-w-2xl max-h-[92vh] flex flex-col rounded-2xl bg-[#f7f2e7] text-stone-900 border-2 border-[#8b5a2b]/40 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.7)] overflow-hidden">
        {/* Top Header Banner: Deep Warm Oak / Tree Bark */}
        <div className="bg-gradient-to-r from-[#2c1d11] via-[#432b17] to-[#2c1d11] px-6 py-4 flex items-center justify-between text-amber-100 border-b border-[#8b5a2b]/50 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#1b120a] border-2 border-amber-400/80 flex items-center justify-center text-amber-300 shadow-[0_0_15px_rgba(245,158,11,0.3)]">
              <Globe2 className="w-5 h-5 text-amber-300 animate-pulse" />
            </div>
            <div>
              <h2 className="font-serif font-bold text-lg text-amber-50 leading-tight">
                Welcome to ChronoSpheres
              </h2>
              <p className="text-xs text-amber-200/80 font-sans">
                Global 3D Earth Time Capsule Archive & Interactive Guide
              </p>
            </div>
          </div>

          <button
            onClick={handleDismiss}
            className="p-1.5 rounded-full hover:bg-amber-950/80 text-amber-200 hover:text-white transition cursor-pointer"
            title="Close Guide"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Parchment Body */}
        <div className="p-6 overflow-y-auto space-y-5 bg-[#f7f2e7]">
          {/* Welcome Intro Callout */}
          <div className="p-4 rounded-xl bg-[#ede2cf] border border-[#d6c2a2] text-stone-800 text-xs leading-relaxed space-y-1.5 shadow-xs">
            <p className="font-serif font-bold text-sm text-[#4a3018] flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-amber-700" />
              Preserving Human Memory Across Time and Space
            </p>
            <p className="text-[#5c4632]">
              ChronoSpheres is a decentralized 3D Earth archive where travelers, historians, and explorers plant cryptographic time capsules bound to exact global coordinates and locked until future dates.
            </p>
          </div>

          {/* 5 Core Feature Sections */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {/* 1. Orbit & Explore */}
            <div className="p-3.5 rounded-xl bg-white/80 border border-[#dfd2bc] hover:border-amber-600/50 transition shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1.5">
                  <div className="w-7 h-7 rounded-lg bg-amber-100 border border-amber-300 flex items-center justify-center text-amber-800 shrink-0">
                    <Compass className="w-4 h-4" />
                  </div>
                  <h3 className="font-bold text-xs text-[#3d2714]">
                    1. Orbit & Explore Earth
                  </h3>
                </div>
                <p className="text-[11px] text-stone-600 leading-relaxed">
                  Click and drag to rotate the 3D globe across all continents. Scroll or pinch to zoom in. 3D country border outlines are rendered across the world.
                </p>
              </div>
            </div>

            {/* 2. Country Borders & Live Intel */}
            <div className="p-3.5 rounded-xl bg-white/80 border border-[#dfd2bc] hover:border-amber-600/50 transition shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1.5">
                  <div className="w-7 h-7 rounded-lg bg-emerald-100 border border-emerald-300 flex items-center justify-center text-emerald-800 shrink-0">
                    <Layers className="w-4 h-4" />
                  </div>
                  <h3 className="font-bold text-xs text-[#3d2714]">
                    2. Country Borders & Live Data
                  </h3>
                </div>
                <p className="text-[11px] text-stone-600 leading-relaxed">
                  Click inside any country outline to open the live REST Countries drawer showing its capital, flag, population, currency, and local capsules.
                </p>
              </div>
            </div>

            {/* 3. Plant Sealed Time Capsules */}
            <div className="p-3.5 rounded-xl bg-white/80 border border-[#dfd2bc] hover:border-amber-600/50 transition shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1.5">
                  <div className="w-7 h-7 rounded-lg bg-cyan-100 border border-cyan-300 flex items-center justify-center text-cyan-800 shrink-0">
                    <MapPin className="w-4 h-4" />
                  </div>
                  <h3 className="font-bold text-xs text-[#3d2714]">
                    3. Plant Sealed Capsules
                  </h3>
                </div>
                <p className="text-[11px] text-stone-600 leading-relaxed">
                  Click <span className="font-bold text-cyan-900">+ Plant Capsule</span> or <span className="font-bold text-cyan-900">Drop Pin</span> to bury messages, voice recordings (<Mic className="w-3 h-3 inline text-emerald-700" />), photo memories, and Spotify tracks (<Music className="w-3 h-3 inline text-emerald-700" />).
                </p>
              </div>
            </div>

            {/* 4. Public vs Private Vaults */}
            <div className="p-3.5 rounded-xl bg-white/80 border border-[#dfd2bc] hover:border-amber-600/50 transition shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1.5">
                  <div className="w-7 h-7 rounded-lg bg-indigo-100 border border-indigo-300 flex items-center justify-center text-indigo-800 shrink-0">
                    <Lock className="w-4 h-4" />
                  </div>
                  <h3 className="font-bold text-xs text-[#3d2714]">
                    4. Public vs. Private Vaults
                  </h3>
                </div>
                <p className="text-[11px] text-stone-600 leading-relaxed">
                  Public capsules unlock for anyone worldwide upon their unlock date. Private capsules encrypt the message and media strictly to your account or recipient.
                </p>
              </div>
            </div>
          </div>

          {/* 5. Fast-Forward Time Simulator Callout */}
          <div className="p-3.5 rounded-xl bg-amber-50/90 border border-amber-200 flex items-start gap-3 shadow-xs">
            <div className="w-8 h-8 rounded-lg bg-amber-700 text-amber-100 flex items-center justify-center shrink-0 mt-0.5">
              <Clock className="w-4 h-4" />
            </div>
            <div className="flex-1 text-xs">
              <h4 className="font-bold text-amber-950 mb-0.5">
                5. Fast-Forward Time Travel Simulator
              </h4>
              <p className="text-amber-900 leading-relaxed text-[11px]">
                Want to test capsule unlocks immediately? Use the bottom control panel buttons (<span className="font-mono font-bold bg-amber-200/80 px-1 py-0.5 rounded text-[10px]">+1h</span>, <span className="font-mono font-bold bg-amber-200/80 px-1 py-0.5 rounded text-[10px]">+1d</span>, <span className="font-mono font-bold bg-amber-200/80 px-1 py-0.5 rounded text-[10px]">+1w</span>, <span className="font-mono font-bold bg-amber-200/80 px-1 py-0.5 rounded text-[10px]">+1y</span>) to simulate future dates and decrypt mature memory tokens!
              </p>
            </div>
          </div>
        </div>

        {/* Bottom Footer Actions */}
        <div className="bg-[#ede2cf] px-6 py-3.5 border-t border-[#d6c2a2] flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <label className="flex items-center gap-2 text-xs text-stone-700 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={dontShowAgain}
              onChange={(e) => setDontShowAgain(e.target.checked)}
              className="w-4 h-4 text-amber-700 rounded border-stone-400 focus:ring-amber-500 accent-amber-800"
            />
            <span>Don't show automatically on startup</span>
          </label>

          <div className="flex items-center gap-2.5 w-full sm:w-auto">
            <button
              type="button"
              onClick={handlePlantClick}
              className="flex-1 sm:flex-none px-4 py-2 rounded-xl bg-white hover:bg-stone-50 border border-stone-300 text-stone-800 text-xs font-bold transition cursor-pointer shadow-xs"
            >
              Plant a Capsule
            </button>

            <button
              type="button"
              onClick={handleDismiss}
              className="flex-1 sm:flex-none px-5 py-2 rounded-xl bg-gradient-to-r from-amber-800 to-amber-900 hover:from-amber-700 hover:to-amber-800 text-amber-50 text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-md cursor-pointer"
            >
              <span>Start Exploring Earth</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
