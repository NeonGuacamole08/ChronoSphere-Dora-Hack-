import React, { useState, useMemo, useEffect } from 'react';
import {
  X,
  Layers,
  Flame,
  Search,
  Lock,
  Unlock,
  MapPin,
  Calendar,
  Clock,
  Mic,
  Music,
  Image as ImageIcon,
  Sparkles,
  Trophy,
  ShieldCheck,
  Compass,
  ArrowRight,
  ExternalLink,
  Filter,
  CheckCircle2,
  Globe2,
  Radio,
} from 'lucide-react';
import { Capsule } from '../../types';
import { SupportedLanguage, translate } from '../../utils/i18n';

interface AllCapsulesModalProps {
  isOpen: boolean;
  onClose: () => void;
  capsules: Capsule[];
  simulatedTimeOffsetMs?: number;
  showHeatmap: boolean;
  onToggleHeatmap: () => void;
  onSelectCapsuleOnGlobe: (capsule: Capsule) => void;
  onOpenCapsuleModal: (capsule: Capsule) => void;
  language?: SupportedLanguage;
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
function getCountdownInfo(unlockIso: string, simulatedOffset: number): { isUnlocked: boolean; text: string } {
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

export const AllCapsulesModal: React.FC<AllCapsulesModalProps> = ({
  isOpen,
  onClose,
  capsules,
  simulatedTimeOffsetMs = 0,
  showHeatmap,
  onToggleHeatmap,
  onSelectCapsuleOnGlobe,
  onOpenCapsuleModal,
  language = 'en',
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState<
    'all' | 'unlocked' | 'locked' | 'events' | 'audio' | 'photos' | 'encrypted'
  >('all');
  const [sortBy, setSortBy] = useState<'newest' | 'soonest' | 'unlocked' | 'title'>('newest');

  // Live timer tick for countdown displays
  const [, setTick] = useState(0);
  useEffect(() => {
    if (!isOpen) return;
    const interval = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(interval);
  }, [isOpen]);

  // Compute breakdown statistics
  const stats = useMemo(() => {
    const effectiveNow = Date.now() + simulatedTimeOffsetMs;
    let unlocked = 0;
    let locked = 0;
    let eventsCount = 0;
    let audioCount = 0;
    let photosCount = 0;
    let encryptedCount = 0;
    const countries = new Set<string>();

    capsules.forEach((c) => {
      const isUn = new Date(c.unlock_timestamp).getTime() <= effectiveNow || c.is_encrypted === false;
      if (isUn) unlocked++;
      else locked++;

      if (c.event_id) eventsCount++;
      if (c.audio_url || c.spotify_track_id || c.attachments?.some((a) => a.type === 'audio')) audioCount++;
      if (c.photo_url || (c.attachments && c.attachments.length > 0)) photosCount++;
      if (c.is_encrypted) encryptedCount++;
      if (c.country_name) countries.add(c.country_name);
    });

    return {
      total: capsules.length,
      unlocked,
      locked,
      eventsCount,
      audioCount,
      photosCount,
      encryptedCount,
      countriesCount: countries.size,
    };
  }, [capsules, simulatedTimeOffsetMs]);

  // Filter & sort capsules
  const displayedCapsules = useMemo(() => {
    const effectiveNow = Date.now() + simulatedTimeOffsetMs;
    const q = searchQuery.toLowerCase().trim();

    return capsules
      .filter((c) => {
        // Exclude in-progress drafts
        if (c.is_draft) return false;

        const isUn = new Date(c.unlock_timestamp).getTime() <= effectiveNow || c.is_encrypted === false;

        // Category filter
        if (filterCategory === 'unlocked' && !isUn) return false;
        if (filterCategory === 'locked' && isUn) return false;
        if (filterCategory === 'events' && !c.event_id) return false;
        if (
          filterCategory === 'audio' &&
          !c.audio_url &&
          !c.spotify_track_id &&
          !c.attachments?.some((a) => a.type === 'audio')
        )
          return false;
        if (filterCategory === 'photos' && !c.photo_url && (!c.attachments || c.attachments.length === 0))
          return false;
        if (filterCategory === 'encrypted' && !c.is_encrypted) return false;

        // Text search
        if (!q) return true;
        return (
          c.title.toLowerCase().includes(q) ||
          c.location_name.toLowerCase().includes(q) ||
          c.country_name.toLowerCase().includes(q) ||
          c.creator_username.toLowerCase().includes(q) ||
          c.message.toLowerCase().includes(q) ||
          c.tags?.some((t) => t.toLowerCase().includes(q))
        );
      })
      .sort((a, b) => {
        if (sortBy === 'newest') {
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        }
        if (sortBy === 'soonest') {
          return new Date(a.unlock_timestamp).getTime() - new Date(b.unlock_timestamp).getTime();
        }
        if (sortBy === 'unlocked') {
          const aUn = new Date(a.unlock_timestamp).getTime() <= effectiveNow;
          const bUn = new Date(b.unlock_timestamp).getTime() <= effectiveNow;
          if (aUn && !bUn) return -1;
          if (!aUn && bUn) return 1;
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        }
        if (sortBy === 'title') {
          return a.title.localeCompare(b.title);
        }
        return 0;
      });
  }, [capsules, searchQuery, filterCategory, sortBy, simulatedTimeOffsetMs]);

  // Hotspot Quick Centers
  const hotspots = [
    { name: 'Tokyo 🇯🇵', lat: 35.6762, lng: 139.6503 },
    { name: 'Paris 🇫🇷', lat: 48.8566, lng: 2.3522 },
    { name: 'London 🇬🇧', lat: 51.5074, lng: -0.1278 },
    { name: 'New York 🇺🇸', lat: 40.7128, lng: -74.006 },
    { name: 'Cairo 🇪🇬', lat: 30.0444, lng: 31.2357 },
    { name: 'Sydney 🇦🇺', lat: -33.8688, lng: 151.2093 },
  ];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6 bg-black/75 backdrop-blur-sm animate-fade-in">
      <div
        id="all-capsules-global-archive-modal"
        className="relative w-full max-w-5xl max-h-[92vh] parchment-card border-2 border-amber-800/40 rounded-2xl sm:rounded-3xl shadow-[0_25px_80px_rgba(0,0,0,0.6)] flex flex-col overflow-hidden text-amber-950 font-sans"
      >
        {/* 1. MODAL HEADER & HEATMAP CONTROLLER (Tree Bark Banner) */}
        <div className="tree-bark-banner flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-4 sm:px-6 py-3.5 sm:py-4 border-b border-amber-800/40 text-amber-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 to-yellow-400 text-stone-950 flex items-center justify-center shadow-md shrink-0">
              <Layers className="w-5 h-5 text-stone-950 stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="font-serif font-bold text-lg sm:text-xl text-amber-100 tracking-tight leading-tight">
                  Global Capsule Archive & Memory Heatmap
                </h2>
                <span className="px-2 py-0.5 rounded-full bg-amber-950/80 border border-amber-400/50 text-[10px] sm:text-xs font-mono font-bold text-amber-300 shadow-inner">
                  {stats.total} Total Capsules
                </span>
              </div>
              <p className="text-[11px] sm:text-xs text-amber-200/80 mt-0.5">
                Explore every time capsule buried worldwide across {stats.countriesCount} countries.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
            {/* Heatmap Toggle Action in Header */}
            <button
              type="button"
              onClick={onToggleHeatmap}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-bold transition cursor-pointer shadow-md ${
                showHeatmap
                  ? 'bg-gradient-to-r from-amber-500 to-yellow-400 text-stone-950 border-amber-300 ring-2 ring-amber-400/60 shadow-[0_0_20px_rgba(245,158,11,0.6)]'
                  : 'bg-black/30 hover:bg-black/50 text-amber-200 border-amber-500/40'
              }`}
              title="Toggle 3D Glowing Heatmap of Memory Density on Earth"
            >
              <Flame className={`w-4 h-4 ${showHeatmap ? 'text-stone-950 animate-pulse stroke-[2.5]' : 'text-amber-400'}`} />
              <span>3D Heatmap: {showHeatmap ? 'ACTIVE' : 'OFF'}</span>
            </button>

            {/* Close Button */}
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 sm:p-2 rounded-xl bg-black/30 hover:bg-black/50 text-amber-200 hover:text-white transition cursor-pointer border border-amber-500/40"
              aria-label="Close modal"
            >
              <X className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          </div>
        </div>

        {/* 2. SUMMARY METRICS & QUICK HOTSPOTS BAR */}
        <div className="px-4 sm:px-6 py-2.5 bg-amber-900/10 border-b border-amber-800/20 flex flex-col md:flex-row md:items-center justify-between gap-2.5 text-xs text-amber-950">
          {/* Quick Metrics */}
          <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
            <span className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-emerald-100 text-emerald-800 border border-emerald-300 text-[11px] font-medium font-mono">
              <Unlock className="w-3 h-3 text-emerald-700" />
              {stats.unlocked} Unlocked
            </span>
            <span className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-amber-100 text-amber-900 border border-amber-300 text-[11px] font-medium font-mono">
              <Lock className="w-3 h-3 text-amber-700" />
              {stats.locked} Locked
            </span>
            <span className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-purple-100 text-purple-900 border border-purple-300 text-[11px] font-medium font-mono">
              <Trophy className="w-3 h-3 text-purple-700" />
              {stats.eventsCount} Events
            </span>
            <span className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-amber-100 text-amber-900 border border-amber-300 text-[11px] font-medium font-mono">
              <Mic className="w-3 h-3 text-amber-700" />
              {stats.audioCount} Audio
            </span>
          </div>

          {/* Quick Hotspot Fly-to shortcuts */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
            <span className="text-[10px] text-amber-900/80 font-mono uppercase tracking-wider shrink-0 mr-1 flex items-center gap-1">
              <Compass className="w-3 h-3 text-amber-700" />
              Hotspots:
            </span>
            {hotspots.map((h) => (
              <button
                key={h.name}
                type="button"
                onClick={() => {
                  onSelectCapsuleOnGlobe({
                    id: `hotspot_${h.name}`,
                    title: `${h.name} Memory Cluster`,
                    message: `Explore time capsules and memory density around ${h.name}.`,
                    creator_username: 'ChronoSpheres',
                    creator_email: 'explorer@chronospheres.io',
                    location_name: h.name,
                    country_name: h.name,
                    country_code: 'GL',
                    lat: h.lat,
                    lng: h.lng,
                    created_at: new Date().toISOString(),
                    unlock_timestamp: new Date().toISOString(),
                    is_encrypted: false,
                    is_draft: false,
                    access_type: 'public',
                    arweave_tx_id: `ARW_CLUSTER_${h.name.replace(/\s+/g, '_').toUpperCase()}`,
                    encryption_signature: 'ED25519_CLUSTER_SIG',
                    notified: false,
                  });
                  onClose();
                }}
                className="px-2 py-0.5 rounded-lg bg-white hover:bg-amber-100 text-amber-950 border border-amber-700/30 text-[10px] font-medium transition cursor-pointer shrink-0 whitespace-nowrap shadow-xs"
              >
                {h.name}
              </button>
            ))}
          </div>
        </div>

        {/* 3. SEARCH, FILTERS & SORTING CONTROLS */}
        <div className="p-3 sm:p-4 bg-white/80 border-b border-amber-800/20 flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
          {/* Search bar */}
          <div className="relative flex-1 min-w-0">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-amber-700/80" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by title, location, country, creator @username, tag, or story..."
              className="w-full pl-9 pr-3 py-1.5 sm:py-2 rounded-xl bg-white border border-amber-800/30 text-amber-950 placeholder:text-amber-900/40 text-xs sm:text-sm focus:outline-none focus:border-amber-600 shadow-xs font-sans"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-amber-700 hover:text-amber-950 text-xs cursor-pointer font-bold"
              >
                Clear
              </button>
            )}
          </div>

          {/* Category Tabs & Sort */}
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar shrink-0">
            {/* Filter pills */}
            <div className="flex items-center bg-[#f5ecdc] p-1 rounded-xl border border-amber-800/20 gap-1 shrink-0">
              {(
                [
                  { id: 'all', label: 'All', count: stats.total },
                  { id: 'unlocked', label: 'Unlocked', count: stats.unlocked },
                  { id: 'locked', label: 'Locked', count: stats.locked },
                  { id: 'events', label: 'Events', count: stats.eventsCount },
                  { id: 'audio', label: 'Audio', count: stats.audioCount },
                ] as const
              ).map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setFilterCategory(tab.id)}
                  className={`px-2 sm:px-2.5 py-1 rounded-lg text-[11px] font-bold transition cursor-pointer whitespace-nowrap flex items-center gap-1 ${
                    filterCategory === tab.id
                      ? 'bg-gradient-to-r from-amber-700 to-amber-900 text-amber-100 shadow-xs'
                      : 'text-amber-950/80 hover:text-amber-950 hover:bg-amber-200/50'
                  }`}
                >
                  <span>{tab.label}</span>
                  <span
                    className={`text-[9px] px-1 rounded-full font-mono ${
                      filterCategory === tab.id ? 'bg-amber-950 text-amber-300' : 'bg-amber-200 text-amber-900'
                    }`}
                  >
                    {tab.count}
                  </span>
                </button>
              ))}
            </div>

            {/* Sort Select */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-2 sm:px-2.5 py-1.5 rounded-xl bg-white border border-amber-800/30 text-amber-950 text-[11px] font-medium focus:outline-none cursor-pointer shadow-xs"
            >
              <option value="newest">Newest First</option>
              <option value="soonest">Unlocking Soonest</option>
              <option value="unlocked">Unlocked First</option>
              <option value="title">Alphabetical</option>
            </select>
          </div>
        </div>

        {/* 4. CAPSULES DIRECTORY LIST */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-5 space-y-3 bg-[#faf5ec]/60 custom-scrollbar">
          {displayedCapsules.length === 0 ? (
            <div className="py-12 text-center text-amber-950/60 flex flex-col items-center justify-center gap-2">
              <MapPin className="w-10 h-10 text-amber-600 animate-bounce" />
              <p className="font-bold text-sm text-amber-950">No capsules matched your current search or filter.</p>
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setFilterCategory('all');
                }}
                className="mt-2 px-3 py-1.5 rounded-xl bg-amber-800 hover:bg-amber-900 border border-amber-600 text-xs font-bold text-amber-100 transition cursor-pointer shadow-xs"
              >
                Reset Filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
              {displayedCapsules.map((cap) => {
                const countdown = getCountdownInfo(cap.unlock_timestamp, simulatedTimeOffsetMs);
                const flag = getCountryFlagEmoji(cap.country_code);

                return (
                  <div
                    key={cap.id}
                    className="relative group p-3.5 sm:p-4 rounded-2xl bg-white hover:bg-amber-50/70 border border-amber-800/25 hover:border-amber-700 transition-all duration-200 shadow-xs hover:shadow-md flex flex-col justify-between gap-3 text-amber-950"
                  >
                    {/* Top Row: Country flag + Location & Status Pill */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-xl shrink-0" role="img" aria-label="Country flag">
                          {flag}
                        </span>
                        <div className="min-w-0">
                          <h4 className="font-bold text-sm sm:text-base text-amber-950 font-serif tracking-tight truncate group-hover:text-amber-800 transition">
                            {cap.title}
                          </h4>
                          <p className="text-[11px] text-amber-900/75 flex items-center gap-1 truncate">
                            <MapPin className="w-3 h-3 text-amber-700 shrink-0" />
                            <span className="truncate">{cap.location_name || `${cap.lat.toFixed(2)}°, ${cap.lng.toFixed(2)}°`}</span>
                          </p>
                        </div>
                      </div>

                      {/* Status badge */}
                      <div className="shrink-0">
                        {countdown.isUnlocked ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 text-[10px] font-bold font-mono shadow-xs">
                            <Unlock className="w-2.5 h-2.5 text-emerald-700" />
                            Ready
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300 text-[10px] font-bold font-mono shadow-xs">
                            <Lock className="w-2.5 h-2.5 text-amber-700" />
                            {countdown.text}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Capsule Story Snippet / Message preview */}
                    {cap.message && (
                      <p className="text-xs text-amber-950/85 line-clamp-2 italic font-sans pl-2 border-l-2 border-amber-600/50">
                        "{cap.message}"
                      </p>
                    )}

                    {/* Meta info & Badges row */}
                    <div className="flex items-center justify-between gap-2 pt-1 border-t border-amber-800/15 text-[11px] text-amber-900/70">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-medium text-amber-950">
                          @{cap.creator_username.replace('@', '')}
                        </span>
                        <span>•</span>
                        <span>{new Date(cap.created_at).toLocaleDateString()}</span>
                      </div>

                      {/* Feature icons */}
                      <div className="flex items-center gap-1.5">
                        {(cap.audio_url || cap.attachments?.some((a) => a.type === 'audio')) && (
                          <span title="Contains Voice Recording" className="p-1 rounded bg-amber-100 text-amber-800 border border-amber-300">
                            <Mic className="w-3 h-3" />
                          </span>
                        )}
                        {cap.spotify_track_id && (
                          <span title="Contains Spotify Soundtrack" className="p-1 rounded bg-emerald-100 text-emerald-800 border border-emerald-300">
                            <Music className="w-3 h-3" />
                          </span>
                        )}
                        {cap.photo_url && (
                          <span title="Contains Photo Attachment" className="p-1 rounded bg-amber-100 text-amber-800 border border-amber-300">
                            <ImageIcon className="w-3 h-3" />
                          </span>
                        )}
                        {cap.is_encrypted && (
                          <span title="AES-256 GCM Encrypted" className="p-1 rounded bg-purple-100 text-purple-800 border border-purple-300">
                            <ShieldCheck className="w-3 h-3" />
                          </span>
                        )}
                        {cap.event_id && (
                          <span title="Scavenger Hunt Event Quest" className="p-1 rounded bg-rose-100 text-rose-800 border border-rose-300">
                            <Trophy className="w-3 h-3" />
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div className="flex items-center gap-2 pt-1">
                      {/* View on globe / map */}
                      <button
                        type="button"
                        onClick={() => {
                          onSelectCapsuleOnGlobe(cap);
                          onClose();
                        }}
                        className="flex-1 py-1.5 px-2.5 rounded-xl bg-amber-100 hover:bg-amber-200 text-amber-950 border border-amber-800/30 text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                      >
                        <Compass className="w-3.5 h-3.5 text-amber-800" />
                        <span>Fly to on Globe</span>
                      </button>

                      {/* Inspect / Open Modal */}
                      <button
                        type="button"
                        onClick={() => {
                          onOpenCapsuleModal(cap);
                        }}
                        className="flex-1 py-1.5 px-2.5 rounded-xl bg-gradient-to-r from-amber-700 to-amber-900 hover:from-amber-600 hover:to-amber-800 text-amber-100 text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer shadow-xs border border-amber-500/40"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-amber-300 stroke-[2.5]" />
                        <span>Inspect Capsule</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* 5. MODAL FOOTER (Tree Bark Banner) */}
        <div className="tree-bark-banner px-4 sm:px-6 py-3 border-t border-amber-800/40 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-amber-100">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
            <span>
              All {capsules.length} time capsules are indexed in realtime via Supabase & localized in 3D.
            </span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="self-end sm:self-auto px-4 py-1.5 rounded-xl bg-black/30 hover:bg-black/50 text-amber-100 font-bold transition cursor-pointer border border-amber-500/40 shadow-xs"
          >
            Close Archive
          </button>
        </div>
      </div>
    </div>
  );
};
