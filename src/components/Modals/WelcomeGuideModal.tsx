import React, { useState, useEffect } from 'react';
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
  Volume2,
  VolumeX,
  Ghost,
  Sun,
  Heart,
  Radio,
  CheckCircle2,
} from 'lucide-react';
import { ambientSound, SoundTheme, SOUND_THEMES } from '../../utils/audio';

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
  const [activeTheme, setActiveTheme] = useState<SoundTheme>(() => ambientSound.getTheme());
  const [isPlaying, setIsPlaying] = useState<boolean>(() => ambientSound.getIsPlaying());

  useEffect(() => {
    const unsubscribe = ambientSound.subscribe((theme, playing) => {
      setActiveTheme(theme);
      setIsPlaying(playing);
    });
    return unsubscribe;
  }, []);

  if (!isOpen) return null;

  const handleDismiss = () => {
    if (dontShowAgain) {
      try {
        localStorage.setItem('chronospheres_welcome_dismissed', 'true');
      } catch (e) {
        console.warn(e);
      }
    }
    // Ensure sound starts if user interacts
    if (!isPlaying) {
      ambientSound.start();
    }
    onClose();
  };

  const handlePlantClick = () => {
    handleDismiss();
    if (onOpenPlantModal) {
      onOpenPlantModal();
    }
  };

  const handleSelectTheme = (themeId: SoundTheme) => {
    ambientSound.setTheme(themeId);
    if (!isPlaying) {
      ambientSound.start();
    }
  };

  const handleToggleSound = () => {
    ambientSound.toggle();
  };

  const getThemeIcon = (themeId: SoundTheme) => {
    switch (themeId) {
      case 'nostalgic':
        return <Sparkles className="w-4 h-4 text-amber-400" />;
      case 'haunting':
        return <Ghost className="w-4 h-4 text-purple-300" />;
      case 'upbeat':
        return <Sun className="w-4 h-4 text-yellow-400" />;
      case 'sad':
        return <Heart className="w-4 h-4 text-blue-300" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-300">
      {/* Light Brown / Warm Parchment Card Container */}
      <div className="relative w-full max-w-2xl max-h-[92vh] flex flex-col rounded-2xl bg-[#f7f2e7] text-stone-900 border-2 border-[#8b5a2b]/40 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.7)] overflow-hidden">
        {/* Top Header Banner: Deep Warm Oak / Tree Bark */}
        <div className="bg-gradient-to-r from-[#2c1d11] via-[#432b17] to-[#2c1d11] px-5 sm:px-6 py-4 flex items-center justify-between text-amber-100 border-b border-[#8b5a2b]/50 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-[#1b120a] border-2 border-amber-400/80 flex items-center justify-center text-amber-300 shadow-[0_0_15px_rgba(245,158,11,0.3)]">
              <Globe2 className="w-5 h-5 text-amber-300 animate-pulse" />
            </div>
            <div>
              <h2 className="font-serif font-bold text-base sm:text-lg text-amber-50 leading-tight">
                Welcome to ChronoSpheres
              </h2>
              <p className="text-[10px] sm:text-xs text-amber-200/80 font-sans">
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
        <div className="p-4 sm:p-6 overflow-y-auto space-y-4 bg-[#f7f2e7]">
          {/* Welcome Intro Callout */}
          <div className="p-3.5 rounded-xl bg-[#ede2cf] border border-[#d6c2a2] text-stone-800 text-xs leading-relaxed space-y-1.5 shadow-xs">
            <p className="font-serif font-bold text-sm text-[#4a3018] flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-amber-700" />
              Preserving Human Memory Across Time and Space
            </p>
            <p className="text-[#5c4632] text-[11px] sm:text-xs">
              ChronoSpheres is a decentralized 3D Earth archive where travelers, historians, and explorers plant cryptographic time capsules bound to exact global coordinates and locked until future dates.
            </p>
          </div>

          {/* Interactive Music & Atmosphere Selector */}
          <div className="p-3.5 rounded-xl bg-gradient-to-br from-[#20150b] to-[#362111] text-amber-100 border border-amber-600/40 shadow-sm space-y-2.5">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-amber-950 border border-amber-500/50 flex items-center justify-center text-amber-300">
                  <Music className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-xs text-amber-100 flex items-center gap-1.5">
                    Atmosphere & Background Music
                    <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                      Royalty-Free Synth
                    </span>
                  </h3>
                  <p className="text-[10px] text-amber-300/80">
                    Audio is on by default. Choose from 4 procedural soundscapes:
                  </p>
                </div>
              </div>

              {/* Mute/Play Toggle */}
              <button
                type="button"
                onClick={handleToggleSound}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1.5 border cursor-pointer ${
                  isPlaying
                    ? 'bg-emerald-950 text-emerald-300 border-emerald-500/50 shadow-[0_0_8px_rgba(16,185,129,0.3)]'
                    : 'bg-stone-900 text-stone-300 border-stone-700'
                }`}
                title={isPlaying ? 'Mute audio' : 'Play audio'}
              >
                {isPlaying ? (
                  <>
                    <Volume2 className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
                    <span>Sound ON</span>
                  </>
                ) : (
                  <>
                    <VolumeX className="w-3.5 h-3.5 text-stone-400" />
                    <span>Muted</span>
                  </>
                )}
              </button>
            </div>

            {/* 4 Sound Theme Buttons */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-0.5">
              {SOUND_THEMES.map((theme) => {
                const isSelected = activeTheme === theme.id;
                return (
                  <button
                    key={theme.id}
                    type="button"
                    onClick={() => handleSelectTheme(theme.id)}
                    className={`p-2 rounded-xl text-left transition flex flex-col justify-between border cursor-pointer ${
                      isSelected
                        ? 'bg-amber-900/80 border-amber-400 ring-2 ring-amber-400/40 text-amber-50 shadow-md'
                        : 'bg-[#150d07]/80 hover:bg-[#25170d] border-amber-900/60 text-amber-200/90'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-1 mb-1">
                      <div className="flex items-center gap-1.5">
                        {getThemeIcon(theme.id)}
                        <span className="font-bold text-xs">{theme.name}</span>
                      </div>
                      {isSelected && isPlaying && (
                        <Radio className="w-3 h-3 text-emerald-400 animate-spin shrink-0" />
                      )}
                    </div>
                    <span className="text-[9px] text-amber-300/75 line-clamp-1">
                      {theme.tag}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Core Feature Sections */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* 1. Orbit & Explore */}
            <div className="p-3 rounded-xl bg-white/80 border border-[#dfd2bc] hover:border-amber-600/50 transition shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-6 h-6 rounded-lg bg-amber-100 border border-amber-300 flex items-center justify-center text-amber-800 shrink-0">
                    <Compass className="w-3.5 h-3.5" />
                  </div>
                  <h3 className="font-bold text-xs text-[#3d2714]">
                    1. Orbit & Explore Earth
                  </h3>
                </div>
                <p className="text-[11px] text-stone-600 leading-relaxed">
                  Click and drag to rotate the globe. Scroll to zoom in with real-time aerodynamic air-gliding sound effects. Country borders are outlined across continents.
                </p>
              </div>
            </div>

            {/* 2. Country Borders & Live Intel */}
            <div className="p-3 rounded-xl bg-white/80 border border-[#dfd2bc] hover:border-amber-600/50 transition shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-6 h-6 rounded-lg bg-emerald-100 border border-emerald-300 flex items-center justify-center text-emerald-800 shrink-0">
                    <Layers className="w-3.5 h-3.5" />
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
            <div className="p-3 rounded-xl bg-white/80 border border-[#dfd2bc] hover:border-amber-600/50 transition shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-6 h-6 rounded-lg bg-cyan-100 border border-cyan-300 flex items-center justify-center text-cyan-800 shrink-0">
                    <MapPin className="w-3.5 h-3.5" />
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
            <div className="p-3 rounded-xl bg-white/80 border border-[#dfd2bc] hover:border-amber-600/50 transition shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-6 h-6 rounded-lg bg-indigo-100 border border-indigo-300 flex items-center justify-center text-indigo-800 shrink-0">
                    <Lock className="w-3.5 h-3.5" />
                  </div>
                  <h3 className="font-bold text-xs text-[#3d2714]">
                    4. Public vs. Private Vaults
                  </h3>
                </div>
                <p className="text-[11px] text-stone-600 leading-relaxed">
                  Public capsules unlock for anyone worldwide upon unlock date. Private capsules encrypt data strictly to your account or recipient.
                </p>
              </div>
            </div>
          </div>

          {/* 5. Fast-Forward Time Simulator Callout */}
          <div className="p-3 rounded-xl bg-amber-50/90 border border-amber-200 flex items-start gap-2.5 shadow-xs">
            <div className="w-7 h-7 rounded-lg bg-amber-700 text-amber-100 flex items-center justify-center shrink-0 mt-0.5">
              <Clock className="w-3.5 h-3.5" />
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
        <div className="bg-[#ede2cf] px-5 sm:px-6 py-3.5 border-t border-[#d6c2a2] flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
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
