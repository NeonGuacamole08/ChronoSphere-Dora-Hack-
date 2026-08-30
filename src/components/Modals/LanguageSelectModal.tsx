import React, { useState, useEffect } from 'react';
import { Globe, Check, Sparkles, ArrowRight, X } from 'lucide-react';
import { LANGUAGES, SupportedLanguage, LanguageOption, translate } from '../../utils/i18n';

interface LanguageSelectModalProps {
  isOpen: boolean;
  currentLanguage: SupportedLanguage;
  onSelectLanguage: (lang: SupportedLanguage) => void;
  onClose?: () => void;
  isInitialSetup?: boolean;
}

export const LanguageSelectModal: React.FC<LanguageSelectModalProps> = ({
  isOpen,
  currentLanguage,
  onSelectLanguage,
  onClose,
  isInitialSetup = false,
}) => {
  const [selectedLang, setSelectedLang] = useState<SupportedLanguage>(currentLanguage);

  useEffect(() => {
    setSelectedLang(currentLanguage);
  }, [currentLanguage, isOpen]);

  if (!isOpen) return null;

  const handleConfirm = () => {
    onSelectLanguage(selectedLang);
    if (onClose) onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg rounded-3xl bg-gradient-to-b from-[#0c1b2f] via-[#091524] to-[#050b14] border border-cyan-500/40 shadow-[0_25px_60px_rgba(0,0,0,0.85)] p-6 sm:p-8 text-white overflow-hidden">
        {/* Close Button only if NOT mandatory initial setup */}
        {!isInitialSetup && onClose && (
          <button
            type="button"
            onClick={onClose}
            className="absolute top-5 right-5 p-2 rounded-full hover:bg-cyan-950/60 text-cyan-300 hover:text-white transition cursor-pointer"
            title={translate('close', selectedLang)}
          >
            <X className="w-5 h-5" />
          </button>
        )}

        {/* Subtle decorative background glow */}
        <div className="absolute -top-24 -right-24 w-60 h-60 rounded-full bg-cyan-500/15 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-60 h-60 rounded-full bg-purple-600/15 blur-3xl pointer-events-none" />

        {/* Modal Header */}
        <div className="relative text-center mb-6">
          {/* Step 1 badge if initial onboarding */}
          {isInitialSetup && (
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-950/90 border border-cyan-400/60 text-cyan-300 font-mono text-[10px] sm:text-xs font-bold uppercase tracking-wider mb-3 shadow-[0_0_12px_rgba(6,182,212,0.3)]">
              <Sparkles className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
              <span>{translate('stepChooseLanguage', selectedLang)}</span>
            </div>
          )}

          <div className="w-14 h-14 mx-auto mb-3.5 rounded-2xl bg-gradient-to-tr from-cyan-900/80 to-cyan-500/30 border border-cyan-400/50 flex items-center justify-center text-cyan-300 shadow-[0_0_25px_rgba(6,182,212,0.4)]">
            <Globe className="w-7 h-7" />
          </div>

          <h2 className="font-serif text-xl sm:text-2xl font-bold text-white tracking-tight">
            {translate('welcomeSelectLanguage', selectedLang)}
          </h2>
          <p className="text-xs sm:text-sm text-cyan-200/75 mt-1.5 max-w-sm mx-auto leading-relaxed">
            {translate('languageSelectSubtitle', selectedLang)}
          </p>
        </div>

        {/* Language Grid */}
        <div className="grid grid-cols-2 gap-2.5 sm:gap-3 my-4">
          {LANGUAGES.map((lang: LanguageOption) => {
            const isChosen = selectedLang === lang.code;
            return (
              <button
                key={lang.code}
                type="button"
                onClick={() => setSelectedLang(lang.code)}
                className={`relative flex items-center justify-between p-3 sm:p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
                  isChosen
                    ? 'bg-cyan-950/90 border-cyan-400 text-white shadow-[0_0_18px_rgba(6,182,212,0.35)] ring-1 ring-cyan-400'
                    : 'bg-[#101e33]/60 hover:bg-[#142640] border-cyan-500/20 text-cyan-100 hover:border-cyan-500/40'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="text-2xl shrink-0" role="img" aria-label={lang.name}>
                    {lang.flag}
                  </span>
                  <div className="truncate">
                    <div className="font-bold text-xs sm:text-sm text-white truncate">
                      {lang.nativeName}
                    </div>
                    <div className="text-[10px] text-cyan-300/60 truncate">
                      {lang.name}
                    </div>
                  </div>
                </div>

                {isChosen && (
                  <div className="w-5 h-5 rounded-full bg-cyan-400 text-stone-950 flex items-center justify-center shrink-0 ml-1.5 shadow-sm">
                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {/* Action Button */}
        <div className="mt-6 pt-2">
          <button
            type="button"
            onClick={handleConfirm}
            className="w-full py-3 sm:py-3.5 px-4 rounded-2xl bg-gradient-to-r from-cyan-500 to-teal-400 hover:from-cyan-400 hover:to-teal-300 text-stone-950 font-bold text-xs sm:text-sm md:text-base shadow-[0_0_20px_rgba(6,182,212,0.5)] transition-all cursor-pointer flex items-center justify-center gap-2 active:scale-98"
          >
            <span className="whitespace-nowrap truncate max-w-[90%]">
              {isInitialSetup
                ? translate('continueToTutorial', selectedLang)
                : translate('continue', selectedLang)}
            </span>
            <ArrowRight className="w-4 h-4 text-stone-950 stroke-[2.5] shrink-0" />
          </button>
        </div>
      </div>
    </div>
  );
};

