import React from 'react';
import { X, Sparkles, MapPin, Lock, Unlock, Clock, ShieldCheck, Zap } from 'lucide-react';

interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const HelpModal: React.FC<HelpModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl max-h-[90vh] flex flex-col rounded-2xl parchment-card border-2 border-amber-800/40 shadow-2xl overflow-hidden">
        {/* Tree Bark Wood Header */}
        <div className="tree-bark-banner px-6 py-4 flex items-center justify-between text-amber-50 shadow-md">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-cyan-500 to-blue-700 flex items-center justify-center text-white shadow-md ring-2 ring-cyan-400/60">
              <Sparkles className="w-5 h-5 text-cyan-200" />
            </div>
            <div>
              <h2 className="font-serif font-bold text-lg carved-wood-text leading-tight">
                ChronoSpheres Protocol
              </h2>
              <p className="text-[11px] carved-wood-subtext">
                DoraHacks Earth Time Capsule Network Guide
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-amber-950/60 text-amber-200 hover:text-white transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4 text-xs text-stone-800">
          <div className="p-4 rounded-xl bg-amber-50 border border-amber-300 space-y-2">
            <h3 className="font-serif font-bold text-sm text-amber-950 flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-amber-700" />
              1. 3D Global Pinning & Mapbox Precision Search
            </h3>
            <p className="text-stone-700 leading-relaxed">
              Use the top search bar to search any address, city, or world landmark (e.g. <em>Tokyo</em>, <em>Paris</em>, <em>Greenland</em>, <em>Kenya</em>). The camera will smoothly fly to the coordinates. You can also click directly on the Earth globe or click <strong>Drop Pin on Globe</strong> to plant a capsule anywhere.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-300 space-y-2">
            <h3 className="font-serif font-bold text-sm text-emerald-950 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-emerald-700" />
              2. Set Your Vibe & Sound Atmosphere
            </h3>
            <p className="text-stone-700 leading-relaxed">
              Background music is enabled by default to enhance your journey. Click the audio icon in the top toolbar to open the sound menu. You can mute/unmute or choose between <strong>Nostalgic</strong> (Harp & Flute), <strong>Haunting</strong> (Ethereal Glass Bells), <strong>Upbeat</strong> (Acoustic Marimba), and <strong>Sad</strong> (Melancholic Cello & Piano) to match your time capsule mood.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-amber-50 border border-amber-300 space-y-2">
            <h3 className="font-serif font-bold text-sm text-amber-950 flex items-center gap-1.5">
              <Lock className="w-4 h-4 text-amber-700" />
              3. Cryptographic Time-Lock & Arweave Storage
            </h3>
            <p className="text-stone-700 leading-relaxed">
              Every planted capsule is sealed with Ed25519 signatures and Arweave permaweb identifiers. Memories, voice notes, photos, and Spotify tracks remain encrypted until the scheduled unlock timestamp.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-purple-50 border border-purple-200 space-y-2">
            <h3 className="font-serif font-bold text-sm text-purple-950 flex items-center gap-1.5">
              <Zap className="w-4 h-4 text-purple-700" />
              4. DoraHacks Judge Fast-Forward Mode
            </h3>
            <p className="text-stone-700 leading-relaxed">
              Use the bottom time-travel buttons (<strong>[+1h]</strong>, <strong>[+1d]</strong>, <strong>[+1w]</strong>, <strong>[+1y]</strong>) to advance the internal world clock and test real-time unlocking of sealed capsules.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-blue-50 border border-blue-200 space-y-2">
            <h3 className="font-serif font-bold text-sm text-blue-950 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-blue-700" />
              5. REST Countries Live Data
            </h3>
            <p className="text-stone-700 leading-relaxed">
              Clicking any territory on Earth queries the REST Countries API dynamically to display real-time capital, population, currencies, languages, and timezones in the country drawer.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-stone-100 border-t border-amber-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-amber-800 hover:bg-amber-900 text-amber-100 font-bold text-xs transition cursor-pointer"
          >
            Got it, Explore Globe
          </button>
        </div>
      </div>
    </div>
  );
};
