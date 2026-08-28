import React, { useEffect, useState } from 'react';
import { Radio, Sparkles, X, ChevronRight } from 'lucide-react';
import { EventBroadcastHint } from '../../types';

interface EventHintNotificationProps {
  hint: EventBroadcastHint | null;
  onDismiss: () => void;
  onOpenClues: () => void;
}

export const EventHintNotification: React.FC<EventHintNotificationProps> = ({
  hint,
  onDismiss,
  onOpenClues,
}) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (hint) {
      setIsVisible(true);
      const timer = setTimeout(() => {
        setIsVisible(false);
        onDismiss();
      }, 10000); // auto-dismiss after 10s
      return () => clearTimeout(timer);
    } else {
      setIsVisible(false);
    }
  }, [hint, onDismiss]);

  if (!hint || !isVisible) return null;

  return (
    <div className="fixed top-28 sm:top-32 left-4 right-4 sm:left-auto sm:right-6 sm:max-w-md z-50 pointer-events-auto animate-in slide-in-from-top-4 duration-300">
      <div className="p-4 rounded-2xl bg-gradient-to-br from-[#2a1305]/98 via-[#1f0e04]/98 to-[#150902]/98 border-2 border-amber-400 shadow-[0_15px_40px_rgba(245,158,11,0.35)] backdrop-blur-2xl text-amber-100 space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-amber-500 text-stone-950 flex items-center justify-center font-bold shadow-md">
              <Radio className="w-4 h-4 animate-ping" />
            </div>
            <div>
              <span className="text-[10px] uppercase font-mono font-bold tracking-widest text-amber-400">
                New Clue Broadcasted
              </span>
              <h4 className="text-xs font-serif font-bold text-white truncate max-w-[220px]">
                {hint.capsule_title}
              </h4>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              setIsVisible(false);
              onDismiss();
            }}
            className="p-1 rounded-lg text-stone-400 hover:text-white transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <p className="text-xs sm:text-sm text-amber-100/90 italic bg-black/40 p-2.5 rounded-xl border border-amber-500/30 leading-relaxed">
          "{hint.hint_text}"
        </p>

        <div className="flex items-center justify-end pt-1">
          <button
            type="button"
            onClick={onOpenClues}
            className="text-[11px] font-bold text-amber-300 hover:text-amber-200 flex items-center gap-1 cursor-pointer"
          >
            <span>View all clues</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
