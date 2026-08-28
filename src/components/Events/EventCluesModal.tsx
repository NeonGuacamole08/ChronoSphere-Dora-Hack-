import React from 'react';
import { HelpCircle, Radio, Sparkles, X, Clock, MapPin } from 'lucide-react';
import { ScavengerEvent, Capsule } from '../../types';

interface EventCluesModalProps {
  isOpen: boolean;
  onClose: () => void;
  event: ScavengerEvent;
  capsules: Capsule[];
}

export const EventCluesModal: React.FC<EventCluesModalProps> = ({
  isOpen,
  onClose,
  event,
  capsules,
}) => {
  if (!isOpen) return null;

  const broadcastedHints = event.hints_broadcasted || [];
  const eventCapsules = capsules.filter((c) => event.capsule_ids.includes(c.id));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg rounded-3xl bg-gradient-to-b from-[#1c1007] via-[#140b04] to-[#0a0502] border border-amber-500/50 shadow-[0_25px_60px_rgba(0,0,0,0.9)] p-5 sm:p-7 text-amber-100 overflow-hidden flex flex-col max-h-[85vh]">
        {/* Glow */}
        <div className="absolute -top-20 -right-20 w-52 h-52 rounded-full bg-amber-500/10 blur-3xl pointer-events-none" />

        {/* Header */}
        <div className="flex items-center justify-between pb-3.5 border-b border-amber-500/30 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500 text-stone-950 flex items-center justify-center font-bold shadow-md">
              <Radio className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h2 className="font-serif text-lg font-bold text-white tracking-tight">
                Dispatched Clues & Hints
              </h2>
              <p className="text-xs text-amber-300/70 truncate max-w-xs">
                {event.title}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-stone-400 hover:text-white transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content list */}
        <div className="mt-4 flex-1 overflow-y-auto pr-1 space-y-3">
          {broadcastedHints.length === 0 ? (
            <div className="p-6 text-center rounded-2xl bg-black/40 border border-amber-500/20 text-amber-300/70 space-y-1">
              <HelpCircle className="w-8 h-8 mx-auto text-amber-400/50 mb-2" />
              <p className="text-sm font-serif font-bold text-white">No broadcasted hints yet</p>
              <p className="text-xs">
                The event host can send real-time clues from Mission Control during the expedition.
              </p>
            </div>
          ) : (
            broadcastedHints.map((hint, idx) => (
              <div
                key={hint.id || idx}
                className="p-3.5 rounded-2xl bg-[#231409]/80 border border-amber-500/40 space-y-1.5 shadow-sm"
              >
                <div className="flex items-center justify-between text-[11px] font-mono text-amber-400">
                  <span className="flex items-center gap-1 font-bold truncate max-w-[240px]">
                    <Sparkles className="w-3 h-3 text-amber-400 shrink-0" />
                    {hint.capsule_title}
                  </span>
                  <span className="text-stone-400 shrink-0">
                    {new Date(hint.sent_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>

                <p className="text-xs sm:text-sm text-amber-100/95 italic bg-black/40 p-2.5 rounded-xl border border-amber-500/20 leading-relaxed">
                  "{hint.hint_text}"
                </p>
              </div>
            ))
          )}

          {/* Default Riddles for Event Capsules */}
          <div className="pt-2">
            <h4 className="text-xs font-mono font-bold text-amber-400 uppercase tracking-wider mb-2">
              Ancient Capsule Inscriptions
            </h4>
            <div className="space-y-2">
              {eventCapsules.map((cap, i) => (
                <div key={cap.id} className="p-3 rounded-xl bg-black/30 border border-amber-500/20 text-xs">
                  <div className="font-bold text-amber-200 flex items-center gap-1.5">
                    <MapPin className="w-3 h-3 text-amber-400" />
                    <span>#{i + 1} {cap.title}</span>
                  </div>
                  {cap.event_hint ? (
                    <p className="text-amber-300/80 mt-1 italic">"{cap.event_hint}"</p>
                  ) : (
                    <p className="text-stone-400 mt-1 italic">Location hidden until approached.</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-4 pt-3 border-t border-amber-500/30 flex justify-end shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-xs shadow-md transition cursor-pointer"
          >
            Back to Hunt
          </button>
        </div>
      </div>
    </div>
  );
};
