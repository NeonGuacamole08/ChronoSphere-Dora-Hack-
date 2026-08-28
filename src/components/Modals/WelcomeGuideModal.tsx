import React, { useState, useEffect } from 'react';
import {
  X,
  Globe,
  Globe2,
  MapPin,
  Lock,
  Clock,
  Compass,
  Layers,
  Sparkles,
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
import { LANGUAGES, SupportedLanguage, translate } from '../../utils/i18n';

interface WelcomeGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenPlantModal?: () => void;
  onOpenBackendHub?: () => void;
  language?: SupportedLanguage;
  onSelectLanguage?: (lang: SupportedLanguage) => void;
}

export const WelcomeGuideModal: React.FC<WelcomeGuideModalProps> = ({
  isOpen,
  onClose,
  onOpenPlantModal,
  language = 'en',
  onSelectLanguage,
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
                {translate('appName', language)}
              </h2>
              <p className="text-[10px] sm:text-xs text-amber-200/80 font-sans">
                {translate('appTagline', language)}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {onSelectLanguage && (
              <div className="flex items-center gap-1.5 bg-[#170e07] border border-amber-500/40 rounded-xl px-2.5 py-1 text-xs text-amber-200 shadow-inner">
                <Globe className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <select
                  value={language}
                  onChange={(e) => onSelectLanguage(e.target.value as SupportedLanguage)}
                  className="bg-transparent text-amber-200 font-bold text-xs focus:outline-none cursor-pointer pr-1"
                  title={translate('switchLanguage', language)}
                >
                  {LANGUAGES.map((lang) => (
                    <option key={lang.code} value={lang.code} className="bg-[#2c1d11] text-amber-100">
                      {lang.flag} {lang.nativeName}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <button
              onClick={handleDismiss}
              className="p-1.5 rounded-full hover:bg-amber-950/80 text-amber-200 hover:text-white transition cursor-pointer"
              title={translate('close', language)}
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Parchment Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-4 bg-[#f7f2e7]">
          {/* Welcome Intro Callout */}
          <div className="p-3.5 rounded-xl bg-[#ede2cf] border border-[#d6c2a2] text-stone-800 text-xs leading-relaxed space-y-1.5 shadow-xs">
            <p className="font-serif font-bold text-sm text-[#4a3018] flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-amber-700" />
              {translate('tutorialIntroTitle', language)}
            </p>
            <p className="text-[#5c4632] text-[11px] sm:text-xs">
              {translate('tutorialIntroDesc', language)}
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
                    {translate('atmosphereMusic', language)}
                    <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                      {translate('proceduralSynth', language)}
                    </span>
                  </h3>
                  <p className="text-[10px] text-amber-300/80">
                    {translate('soundSelectSubtitle', language)}
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
                title={isPlaying ? translate('soundOn', language) : translate('soundMuted', language)}
              >
                {isPlaying ? (
                  <>
                    <Volume2 className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
                    <span>{translate('soundOn', language)}</span>
                  </>
                ) : (
                  <>
                    <VolumeX className="w-3.5 h-3.5 text-stone-400" />
                    <span>{translate('soundMuted', language)}</span>
                  </>
                )}
              </button>
            </div>

            {/* 4 Procedural Sound Themes Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {SOUND_THEMES.map((theme) => {
                const isSelected = activeTheme === theme.id;
                const themeKey = theme.id === 'nostalgic' ? 'themeNostalgic'
                  : theme.id === 'haunting' ? 'themeHaunting'
                  : theme.id === 'upbeat' ? 'themeUpbeat'
                  : 'themeSad';
                const tagKey = theme.id === 'nostalgic' ? 'themeNostalgicTag'
                  : theme.id === 'haunting' ? 'themeHauntingTag'
                  : theme.id === 'upbeat' ? 'themeUpbeatTag'
                  : 'themeSadTag';

                return (
                  <button
                    key={theme.id}
                    type="button"
                    onClick={() => ambientSound.setTheme(theme.id)}
                    className={`p-2 rounded-xl text-left transition flex flex-col justify-between border cursor-pointer ${
                      isSelected
                        ? 'bg-amber-900/80 border-amber-400 text-amber-50 ring-1 ring-amber-400 shadow-sm'
                        : 'bg-[#180e06]/80 hover:bg-[#251509] border-amber-800/40 text-amber-200/90'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <div className="w-6 h-6 rounded-md bg-black/40 border border-amber-700/60 flex items-center justify-center">
                        {getThemeIcon(theme.id)}
                      </div>
                      {isSelected && isPlaying && (
                        <Radio className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
                      )}
                    </div>
                    <div>
                      <span className="font-bold text-xs block truncate text-amber-100">
                        {translate(themeKey, language)}
                      </span>
                      <span className="text-[9px] text-amber-300/70 block truncate">
                        {translate(tagKey, language)}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Quick Guide Points */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {/* 1. Explore 3D Earth */}
            <div className="p-3 rounded-xl bg-white/80 border border-[#dfd2bc] hover:border-amber-600/50 transition shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-6 h-6 rounded-lg bg-cyan-100 border border-cyan-300 flex items-center justify-center text-cyan-800 shrink-0">
                    <Compass className="w-3.5 h-3.5" />
                  </div>
                  <h3 className="font-bold text-xs text-[#3d2714]">
                    {translate('tutorialStep1Title', language)}
                  </h3>
                </div>
                <p className="text-[11px] text-stone-600 leading-relaxed">
                  {translate('tutorialStep1Desc', language)}
                </p>
              </div>
            </div>

            {/* 2. Unearth Unlocked Capsules */}
            <div className="p-3 rounded-xl bg-white/80 border border-[#dfd2bc] hover:border-amber-600/50 transition shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-6 h-6 rounded-lg bg-emerald-100 border border-emerald-300 flex items-center justify-center text-emerald-800 shrink-0">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  </div>
                  <h3 className="font-bold text-xs text-[#3d2714]">
                    {translate('tutorialStep2Title', language)}
                  </h3>
                </div>
                <p className="text-[11px] text-stone-600 leading-relaxed">
                  {translate('tutorialStep2Desc', language)}
                </p>
              </div>
            </div>

            {/* 3. Plant Sealed Capsules */}
            <div className="p-3 rounded-xl bg-white/80 border border-[#dfd2bc] hover:border-amber-600/50 transition shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-6 h-6 rounded-lg bg-amber-100 border border-amber-300 flex items-center justify-center text-amber-800 shrink-0">
                    <MapPin className="w-3.5 h-3.5" />
                  </div>
                  <h3 className="font-bold text-xs text-[#3d2714]">
                    {translate('tutorialStep3Title', language)}
                  </h3>
                </div>
                <p className="text-[11px] text-stone-600 leading-relaxed">
                  {translate('tutorialStep3Desc', language)}
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
                    {translate('tutorialStep4Title', language)}
                  </h3>
                </div>
                <p className="text-[11px] text-stone-600 leading-relaxed">
                  {translate('tutorialStep4Desc', language)}
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
                {translate('tutorialStep5Title', language)}
              </h4>
              <p className="text-amber-900 leading-relaxed text-[11px]">
                {translate('tutorialStep5Desc', language)}
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
            <span>{translate('dontShowAgain', language)}</span>
          </label>

          <div className="flex items-center gap-2.5 w-full sm:w-auto">
            <button
              type="button"
              onClick={handlePlantClick}
              className="flex-1 sm:flex-none px-4 py-2 rounded-xl bg-white hover:bg-stone-50 border border-stone-300 text-stone-800 text-xs font-bold transition cursor-pointer shadow-xs"
            >
              {translate('plantCapsule', language)}
            </button>

            <button
              type="button"
              onClick={handleDismiss}
              className="flex-1 sm:flex-none px-5 py-2 rounded-xl bg-gradient-to-r from-amber-800 to-amber-900 hover:from-amber-700 hover:to-amber-800 text-amber-50 text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-md cursor-pointer"
            >
              <span>{translate('startExploring', language)}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
