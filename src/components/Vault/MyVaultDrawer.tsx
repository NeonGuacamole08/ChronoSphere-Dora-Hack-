import React, { useState, useMemo, useEffect } from 'react';
import {
  X,
  Lock,
  Unlock,
  Globe2,
  Calendar,
  Clock,
  Mic,
  Music,
  Image as ImageIcon,
  FileText,
  ShieldCheck,
  Search,
  ExternalLink,
  Sparkles,
  MapPin,
  Eye,
  EyeOff,
  Compass,
  Trash2,
  AlertTriangle,
  Bookmark,
  FileEdit,
} from 'lucide-react';
import { Capsule } from '../../types';

interface MyVaultDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  capsules: Capsule[];
  simulatedTimeOffsetMs?: number;
  initialTab?: 'locked' | 'unlocked' | 'drafts';
  onSelectCapsuleOnGlobe: (capsule: Capsule) => void;
  onOpenCapsuleModal: (capsule: Capsule) => void;
  onResumeDraft?: (draft: Capsule) => void;
  onDeleteCapsule?: (capsuleId: string) => void;
}

// Convert 2-letter country code into flag emoji
function getCountryFlagEmoji(countryCode?: string): string {
  if (!countryCode || countryCode.length !== 2 || countryCode === 'GL') return '🌍';
  try {
    const codePoints = countryCode
      .toUpperCase()
      .split('')
      .map((char) => 127397 + char.charCodeAt(0));
    return String.fromCodePoint(...codePoints);
  } catch {
    return '🌍';
  }
}

// Format countdown remaining until unlock
function getCountdownText(unlockIso: string, simulatedOffset: number): { isUnlocked: boolean; text: string } {
  const targetTime = new Date(unlockIso).getTime();
  const currentTime = Date.now() + simulatedOffset;
  const diffMs = targetTime - currentTime;

  if (diffMs <= 0) {
    return { isUnlocked: true, text: 'Unlocked & Ready' };
  }

  const seconds = Math.floor((diffMs / 1000) % 60);
  const minutes = Math.floor((diffMs / (1000 * 60)) % 60);
  const hours = Math.floor((diffMs / (1000 * 60 * 60)) % 24);
  const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (days > 365) {
    const years = (days / 365.25).toFixed(1);
    return { isUnlocked: false, text: `${years}y (${days}d remaining)` };
  }
  if (days > 0) {
    return { isUnlocked: false, text: `${days}d ${hours}h ${minutes}m` };
  }
  if (hours > 0) {
    return { isUnlocked: false, text: `${hours}h ${minutes}m ${seconds}s` };
  }
  return { isUnlocked: false, text: `${minutes}m ${seconds}s` };
}

export const MyVaultDrawer: React.FC<MyVaultDrawerProps> = ({
  isOpen,
  onClose,
  capsules,
  simulatedTimeOffsetMs = 0,
  initialTab = 'locked',
  onSelectCapsuleOnGlobe,
  onOpenCapsuleModal,
  onResumeDraft,
  onDeleteCapsule,
}) => {
  const [activeTab, setActiveTab] = useState<'locked' | 'unlocked' | 'drafts'>(initialTab);
  const [vaultSearch, setVaultSearch] = useState('');
  const [deletingCapsuleId, setDeletingCapsuleId] = useState<string | null>(null);

  // Sync initialTab if passed
  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab, isOpen]);

  // Partition capsules into locked, unlocked, and drafts according to current simulated time
  const { lockedCapsules, unlockedCapsules, draftsCapsules } = useMemo(() => {
    const currentTime = Date.now() + simulatedTimeOffsetMs;
    const locked: Capsule[] = [];
    const unlocked: Capsule[] = [];
    const drafts: Capsule[] = [];

    capsules.forEach((cap) => {
      if (cap.is_draft) {
        drafts.push(cap);
      } else {
        const unlockTime = new Date(cap.unlock_timestamp).getTime();
        if (unlockTime > currentTime && cap.is_encrypted !== false) {
          locked.push(cap);
        } else {
          unlocked.push(cap);
        }
      }
    });

    return { lockedCapsules: locked, unlockedCapsules: unlocked, draftsCapsules: drafts };
  }, [capsules, simulatedTimeOffsetMs]);

  // Current list based on active tab and search query
  const displayedCapsules = useMemo(() => {
    const baseList =
      activeTab === 'locked'
        ? lockedCapsules
        : activeTab === 'unlocked'
        ? unlockedCapsules
        : draftsCapsules;
    const q = vaultSearch.toLowerCase().trim();
    if (!q) return baseList;

    return baseList.filter(
      (c) =>
        c.title.toLowerCase().includes(q) ||
        c.location_name.toLowerCase().includes(q) ||
        c.country_name.toLowerCase().includes(q) ||
        c.creator_username.toLowerCase().includes(q) ||
        c.message.toLowerCase().includes(q) ||
        c.spotify_title?.toLowerCase().includes(q) ||
        c.tags?.some((t) => t.toLowerCase().includes(q))
    );
  }, [activeTab, lockedCapsules, unlockedCapsules, draftsCapsules, vaultSearch]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden animate-in fade-in duration-200">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-xs transition-opacity cursor-pointer"
        onClick={onClose}
      />

      {/* Slide-out Drawer */}
      <div className="fixed inset-y-0 right-0 max-w-full flex pl-6 sm:pl-10">
        <div className="w-screen max-w-md sm:max-w-lg lg:max-w-xl parchment-card border-l-2 border-amber-800/40 shadow-2xl flex flex-col justify-between text-stone-900 animate-in slide-in-from-right duration-300">
          {/* 1. Wood Header Bar */}
          <div className="wood-trim px-4 py-3.5 sm:px-6 sm:py-4 flex items-center justify-between text-amber-50 shadow-md shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-amber-950/80 border border-amber-400/60 flex items-center justify-center text-amber-300 shadow-inner">
                <Lock className="w-4.5 h-4.5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="font-serif font-bold text-base sm:text-lg text-amber-100 tracking-wide">
                    My Vault
                  </h2>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-900/80 text-amber-300 border border-amber-700/60 font-mono font-bold">
                    {capsules.length} Capsules
                  </span>
                </div>
                <p className="text-[11px] text-amber-300/80">
                  Decentralized Chronosphere Time Capsule Inventory
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-amber-200/80 hover:text-white hover:bg-amber-900/50 transition cursor-pointer"
              title="Close Vault Drawer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* 2. Subheader Tabs & Search */}
          <div className="p-3 sm:p-4 bg-amber-950/10 border-b border-amber-800/20 space-y-3 shrink-0">
            {/* Tabs: Locked vs Unlocked vs Drafts */}
            <div className="grid grid-cols-3 gap-1.5 p-1 rounded-xl bg-black/20 border border-amber-900/30">
              <button
                type="button"
                onClick={() => setActiveTab('locked')}
                className={`py-1.5 px-2 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                  activeTab === 'locked'
                    ? 'bg-gradient-to-r from-amber-700 to-amber-900 text-amber-100 shadow-md border border-amber-400/50'
                    : 'text-amber-950/70 hover:text-amber-950 hover:bg-amber-900/10'
                }`}
              >
                <Lock className="w-3 h-3 text-amber-300" />
                <span>Locked</span>
                <span className="text-[9px] px-1 py-0.2 rounded-full bg-amber-950/60 text-amber-300 font-mono">
                  {lockedCapsules.length}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('unlocked')}
                className={`py-1.5 px-2 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                  activeTab === 'unlocked'
                    ? 'bg-gradient-to-r from-emerald-800 to-teal-900 text-emerald-100 shadow-md border border-emerald-400/50'
                    : 'text-amber-950/70 hover:text-amber-950 hover:bg-amber-900/10'
                }`}
              >
                <Unlock className="w-3 h-3 text-emerald-300" />
                <span>Unlocked</span>
                <span className="text-[9px] px-1 py-0.2 rounded-full bg-emerald-950/60 text-emerald-300 font-mono">
                  {unlockedCapsules.length}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('drafts')}
                className={`py-1.5 px-2 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                  activeTab === 'drafts'
                    ? 'bg-gradient-to-r from-purple-800 to-indigo-900 text-purple-100 shadow-md border border-purple-400/50'
                    : 'text-amber-950/70 hover:text-amber-950 hover:bg-amber-900/10'
                }`}
              >
                <Bookmark className="w-3 h-3 text-purple-300" />
                <span className="truncate">Drafts</span>
                <span className="text-[9px] px-1 py-0.2 rounded-full bg-purple-950/60 text-purple-300 font-mono">
                  {draftsCapsules.length}
                </span>
              </button>
            </div>

            {/* Quick Search */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-amber-800/60 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={vaultSearch}
                onChange={(e) => setVaultSearch(e.target.value)}
                placeholder={`Search ${activeTab} capsules by title, country, location...`}
                className="w-full text-xs pl-8 pr-3 py-2 rounded-xl bg-white/80 border border-amber-800/30 text-amber-950 placeholder-stone-400 focus:outline-none focus:ring-1 focus:ring-amber-600 focus:bg-white"
              />
              {vaultSearch && (
                <button
                  type="button"
                  onClick={() => setVaultSearch('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700 text-xs font-bold"
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          {/* 3. Cards Scrollable Container */}
          <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-3.5 custom-scrollbar">
            {displayedCapsules.length === 0 ? (
              <div className="text-center py-12 px-4 space-y-3">
                <div className="w-12 h-12 rounded-full bg-amber-900/10 border border-amber-800/30 flex items-center justify-center mx-auto text-amber-800/60">
                  {activeTab === 'locked' ? (
                    <Lock className="w-6 h-6" />
                  ) : activeTab === 'unlocked' ? (
                    <Unlock className="w-6 h-6" />
                  ) : (
                    <Bookmark className="w-6 h-6" />
                  )}
                </div>
                <h3 className="font-serif font-bold text-sm text-amber-950">
                  {vaultSearch
                    ? 'No matching capsules found'
                    : activeTab === 'locked'
                    ? 'No locked capsules in vault'
                    : activeTab === 'unlocked'
                    ? 'No unlocked capsules yet'
                    : 'No in-progress drafts'}
                </h3>
                <p className="text-xs text-stone-600 max-w-xs mx-auto leading-relaxed">
                  {vaultSearch
                    ? 'Try adjusting your search keywords.'
                    : activeTab === 'locked'
                    ? 'Plant a new time capsule anywhere on Earth to seal memories into the permaweb.'
                    : activeTab === 'unlocked'
                    ? 'Fast-forward time with the bottom controls [+1y] to test unlocking sealed capsules!'
                    : 'When creating a capsule, choose "Save as Draft" to work on it and bury it later.'}
                </p>
              </div>
            ) : (
              displayedCapsules.map((capsule) => {
                const isDraft = !!capsule.is_draft;
                const countdown = getCountdownText(capsule.unlock_timestamp, simulatedTimeOffsetMs);
                const flagEmoji = getCountryFlagEmoji(capsule.country_code);

                return (
                  <div
                    key={capsule.id}
                    className={`p-3.5 sm:p-4 rounded-xl border transition shadow-xs space-y-3 relative group ${
                      isDraft
                        ? 'bg-purple-50/70 border-purple-300/80 hover:border-purple-500'
                        : countdown.isUnlocked
                        ? 'bg-emerald-50/50 border-emerald-300/80 hover:border-emerald-500'
                        : 'bg-amber-50/50 border-amber-300/80 hover:border-amber-500'
                    }`}
                  >
                    {/* Top Row: Location & Flag + Status Badge */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-lg leading-none shrink-0" title={capsule.country_name}>
                          {flagEmoji}
                        </span>
                        <div className="min-w-0">
                          <h4 className="font-serif font-bold text-xs sm:text-sm text-amber-950 truncate flex items-center gap-1.5">
                            <span>{capsule.title}</span>
                          </h4>
                          <p className="text-[11px] text-stone-600 truncate flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-amber-700 shrink-0" />
                            <span>{capsule.location_name}</span>
                            <span className="text-stone-400">({capsule.lat.toFixed(1)}°, {capsule.lng.toFixed(1)}°)</span>
                          </p>
                        </div>
                      </div>

                      {/* Locked / Unlocked / Draft Pill */}
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-full font-mono font-bold shrink-0 flex items-center gap-1 border ${
                          isDraft
                            ? 'bg-purple-100 text-purple-900 border-purple-400'
                            : countdown.isUnlocked
                            ? 'bg-emerald-100 text-emerald-900 border-emerald-400'
                            : 'bg-amber-100 text-amber-900 border-amber-400'
                        }`}
                      >
                        {isDraft ? (
                          <>
                            <Bookmark className="w-2.5 h-2.5 text-purple-700" />
                            <span>DRAFT</span>
                          </>
                        ) : countdown.isUnlocked ? (
                          <>
                            <Unlock className="w-2.5 h-2.5 text-emerald-700" />
                            <span>UNLOCKED</span>
                          </>
                        ) : (
                          <>
                            <Lock className="w-2.5 h-2.5 text-amber-700" />
                            <span>LOCKED</span>
                          </>
                        )}
                      </span>
                    </div>

                    {/* Middle Row: Countdown Timer & Creation Date */}
                    <div className="grid grid-cols-2 gap-2 p-2 rounded-lg bg-black/5 border border-amber-900/15 text-[11px]">
                      <div>
                        <div className="text-[10px] uppercase font-mono text-stone-500 flex items-center gap-1">
                          <Calendar className="w-2.5 h-2.5 text-amber-700" />
                          <span>Saved</span>
                        </div>
                        <div className="font-medium text-stone-800 text-[11px]">
                          {new Date(capsule.created_at).toLocaleDateString(undefined, {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })}
                        </div>
                      </div>

                      <div>
                        <div className="text-[10px] uppercase font-mono text-stone-500 flex items-center gap-1">
                          <Clock className="w-2.5 h-2.5 text-amber-700" />
                          <span>{isDraft ? 'Status' : countdown.isUnlocked ? 'Status' : 'Countdown'}</span>
                        </div>
                        <div
                          className={`font-mono font-bold text-[11px] truncate ${
                            isDraft
                              ? 'text-purple-800'
                              : countdown.isUnlocked
                              ? 'text-emerald-800'
                              : 'text-amber-900'
                          }`}
                        >
                          {isDraft ? 'In-Progress' : countdown.text}
                        </div>
                      </div>
                    </div>

                    {/* Item Summary Badges */}
                    <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                      {/* Message Badge */}
                      {capsule.message && (
                        <span className="text-[10px] px-2 py-0.5 rounded-md bg-stone-200 text-stone-800 border border-stone-300 font-medium flex items-center gap-1">
                          <FileText className="w-2.5 h-2.5 text-stone-600" />
                          <span>Letter</span>
                        </span>
                      )}

                      {/* Photo Badge */}
                      {capsule.photo_url && (
                        <span className="text-[10px] px-2 py-0.5 rounded-md bg-purple-100 text-purple-900 border border-purple-300 font-medium flex items-center gap-1">
                          <ImageIcon className="w-2.5 h-2.5 text-purple-700" />
                          <span>Memory Photo</span>
                        </span>
                      )}

                      {/* Voice Note Badge */}
                      {capsule.audio_url && (
                        <span className="text-[10px] px-2 py-0.5 rounded-md bg-amber-100 text-amber-900 border border-amber-300 font-medium flex items-center gap-1">
                          <Mic className="w-2.5 h-2.5 text-amber-700" />
                          <span>
                            {capsule.audio_duration ? `${capsule.audio_duration}s Voice Note` : 'Voice Note'}
                          </span>
                        </span>
                      )}

                      {/* Spotify Track Badge */}
                      {(capsule.spotify_title || capsule.spotify_uri) && (
                        <span className="text-[10px] px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-950 border border-emerald-300 font-medium flex items-center gap-1">
                          <Music className="w-2.5 h-2.5 text-emerald-700" />
                          <span className="max-w-[130px] truncate">
                            {capsule.spotify_title ? `Spotify: ${capsule.spotify_title}` : 'Spotify Track'}
                          </span>
                        </span>
                      )}

                      {/* Privacy Badge */}
                      <span className="text-[10px] px-2 py-0.5 rounded-md bg-stone-100 text-stone-700 border border-stone-300 font-medium flex items-center gap-1">
                        {capsule.access_type === 'private' ? (
                          <>
                            <EyeOff className="w-2.5 h-2.5 text-stone-500" />
                            <span>Private Vault</span>
                          </>
                        ) : (
                          <>
                            <Eye className="w-2.5 h-2.5 text-stone-500" />
                            <span>Public</span>
                          </>
                        )}
                      </span>

                      {/* Arweave Badge */}
                      {!isDraft && (
                        <span className="text-[10px] px-2 py-0.5 rounded-md bg-amber-950/10 text-amber-950 border border-amber-800/20 font-mono flex items-center gap-1 ml-auto">
                          <ShieldCheck className="w-2.5 h-2.5 text-amber-800" />
                          <span>Arweave</span>
                        </span>
                      )}
                    </div>

                    {/* Delete Confirmation Warning inside card */}
                    {deletingCapsuleId === capsule.id && (
                      <div className="p-3 rounded-lg bg-rose-50 border border-rose-300 text-rose-950 space-y-2 animate-in fade-in">
                        <div className="flex items-start gap-2 text-xs">
                          <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                          <div>
                            <span className="font-bold">
                              {isDraft ? 'Delete In-Progress Draft?' : 'Permanently Delete Pin?'}
                            </span>
                            <p className="text-[11px] text-rose-800">
                              {isDraft
                                ? 'This draft will be removed from your vault.'
                                : 'This capsule will be removed from the 3D globe immediately.'}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center justify-end gap-2 pt-1">
                          <button
                            type="button"
                            onClick={() => setDeletingCapsuleId(null)}
                            className="px-2.5 py-1 rounded-md bg-stone-200 hover:bg-stone-300 text-stone-800 text-[11px] font-semibold transition cursor-pointer"
                          >
                            Cancel
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              if (onDeleteCapsule) {
                                onDeleteCapsule(capsule.id);
                              }
                              setDeletingCapsuleId(null);
                            }}
                            className="px-3 py-1 rounded-md bg-rose-600 hover:bg-rose-700 text-white text-[11px] font-bold transition flex items-center gap-1 cursor-pointer shadow-xs"
                          >
                            <Trash2 className="w-3 h-3" />
                            <span>Confirm Delete</span>
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Action Buttons: View on Globe / Resume Draft vs Inspect vs Delete */}
                    <div className="flex items-center gap-2 pt-1 border-t border-amber-800/15">
                      {isDraft ? (
                        <button
                          type="button"
                          onClick={() => {
                            onClose();
                            if (onResumeDraft) {
                              onResumeDraft(capsule);
                            }
                          }}
                          className="flex-1 py-1.5 px-3 rounded-lg bg-gradient-to-r from-purple-700 to-indigo-800 hover:from-purple-600 hover:to-indigo-700 text-purple-100 font-bold text-xs transition shadow-xs flex items-center justify-center gap-1.5 border border-purple-400/50 cursor-pointer"
                          title="Resume editing draft and plant on Earth"
                        >
                          <FileEdit className="w-3.5 h-3.5 text-purple-200" />
                          <span>Resume & Plant</span>
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => {
                            onClose();
                            onSelectCapsuleOnGlobe(capsule);
                          }}
                          className="flex-1 py-1.5 px-3 rounded-lg bg-cyan-900 hover:bg-cyan-800 text-cyan-100 font-bold text-xs transition shadow-xs flex items-center justify-center gap-1.5 border border-cyan-500/50 cursor-pointer"
                          title="Fly 3D Camera direct to coordinates on Earth"
                        >
                          <Compass className="w-3.5 h-3.5 text-cyan-300" />
                          <span>View on Globe</span>
                        </button>
                      )}

                      {!isDraft && (
                        <button
                          type="button"
                          onClick={() => {
                            onClose();
                            onOpenCapsuleModal(capsule);
                          }}
                          className="py-1.5 px-3 rounded-lg bg-amber-100 hover:bg-amber-200 text-amber-950 font-semibold text-xs transition border border-amber-300 cursor-pointer flex items-center gap-1"
                          title="Open capsule inspector dialog"
                        >
                          <span>Inspect</span>
                          <ExternalLink className="w-3 h-3 text-amber-800" />
                        </button>
                      )}

                      {onDeleteCapsule && (
                        <button
                          type="button"
                          onClick={() => setDeletingCapsuleId(capsule.id)}
                          className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 transition cursor-pointer"
                          title={isDraft ? 'Delete in-progress draft' : 'Delete capsule pin from globe'}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* 4. Vault Footer */}
          <div className="wood-trim px-4 py-3 sm:px-6 flex items-center justify-between text-[11px] text-amber-200/90 border-t border-amber-800/40 shrink-0">
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
              <span>Ed25519 Cryptographic Verification</span>
            </div>
            <span className="font-mono text-amber-300">
              {displayedCapsules.length} / {capsules.length} shown
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
