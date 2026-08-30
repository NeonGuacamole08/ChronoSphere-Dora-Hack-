import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  User,
  Bell,
  Sparkles,
  Layers,
  MapPin,
  Lock,
  Unlock,
  Clock,
  ShieldCheck,
  Trophy,
  Compass,
  Play,
  CheckCircle2,
  Package,
  Mic,
  Music,
  ExternalLink,
  Flame,
  Volume2,
  Info,
  Calendar,
  Key,
  LogOut,
  RefreshCw,
} from 'lucide-react';
import { Capsule } from '../../types';
import { AppUser } from '../../utils/supabase';
import { SupportedLanguage, translate } from '../../utils/i18n';

interface UserDashboardModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: AppUser | null;
  capsules: Capsule[];
  vaultCapsules: Capsule[];
  onOpenPlantModal?: () => void;
  onOpenVault?: () => void;
  onOpenEvents?: () => void;
  onOpenDemo?: () => void;
  onOpenHeatmapArchive?: () => void;
  onOpenSecurityKeys?: () => void;
  onSelectCapsuleOnGlobe?: (capsule: Capsule) => void;
  onOpenCapsuleModal?: (capsule: Capsule) => void;
  onSignOut?: () => void;
  language?: SupportedLanguage;
}

interface NotificationItem {
  id: string;
  type: 'unlock' | 'event' | 'system' | 'badge' | 'reaction';
  title: string;
  description: string;
  timestamp: string;
  read: boolean;
  capsuleId?: string;
  actionLabel?: string;
}

interface ReleaseUpdate {
  version: string;
  date: string;
  tag: string;
  title: string;
  highlights: string[];
  isNew?: boolean;
}

const RELEASE_UPDATES: ReleaseUpdate[] = [
  {
    version: 'v2.4',
    date: 'August 2026',
    tag: 'Interactive Feature Demo',
    title: 'Visual Feature Demo & Screencast Walkthrough',
    isNew: true,
    highlights: [
      'Interactive animated video walkthrough demonstrating all 7 core features in action.',
      'Sleek video player controls with chapter scrubbers, autoplay, and skip options.',
      'Instant access anytime via the (?) Help button in the top navigation bar.',
      'Comprehensive User Dashboard with real-time notifications & update feed.',
    ],
  },
  {
    version: 'v2.3',
    date: 'August 2026',
    tag: '3D Heatmap',
    title: '3D Glowing Earth Memory Heatmap & Global Archive',
    highlights: [
      'Visualized memory density across the globe with glowing atmospheric heat shaders.',
      'Complete searchable directory of every time capsule worldwide with instant fly-to navigation.',
      'Quick jump shortcuts for memory clusters in Tokyo, Paris, London, New York, Cairo, and Sydney.',
    ],
  },
  {
    version: 'v2.2',
    date: 'July 2026',
    tag: 'Ambient Audio',
    title: 'Procedural 4-Theme Adaptive Ambient Audio Synthesizer',
    highlights: [
      'Real-time Web Audio synthesizer with 4 distinct moods: Nostalgic, Haunting, Upbeat, and Sad.',
      'Seamless harmonic chords and dynamic pentatonic bells generated mathematically in your browser.',
      'Independent soundscape controls and quick mute/theme toggling.',
    ],
  },
  {
    version: 'v2.1',
    date: 'July 2026',
    tag: 'Scavenger Hunts',
    title: 'Interactive Scavenger Hunts & Proximity Distance Radar',
    highlights: [
      'Global puzzle missions and historical treasure hunts across world landmarks.',
      'Live GPS distance meter displaying exact distance to hidden puzzle checkpoints.',
      'Clue unlocking system with rewards and explorer achievements.',
    ],
  },
  {
    version: 'v2.0',
    date: 'June 2026',
    tag: 'Dual Engine Maps',
    title: 'Dual-Engine 3D Globe & Mapbox Street Map View',
    highlights: [
      'Seamless switching between Three.js 3D Celestial Globe and Mapbox Street Map.',
      'High-precision reverse geocoding powered by Mapbox search API.',
      'Real-time country facts drawer querying live REST Countries API.',
    ],
  },
];

export const UserDashboardModal: React.FC<UserDashboardModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  capsules,
  vaultCapsules,
  onOpenPlantModal,
  onOpenVault,
  onOpenEvents,
  onOpenDemo,
  onOpenHeatmapArchive,
  onOpenSecurityKeys,
  onSelectCapsuleOnGlobe,
  onOpenCapsuleModal,
  onSignOut,
  language = 'en',
}) => {
  const [activeTab, setActiveTab] = useState<'notifications' | 'updates' | 'overview'>('notifications');
  const [filterUnreadOnly, setFilterUnreadOnly] = useState(false);
  const [readNotificationIds, setReadNotificationIds] = useState<Set<string>>(() => {
    try {
      const stored = localStorage.getItem('chronospheres_read_notifications');
      return stored ? new Set(JSON.parse(stored)) : new Set();
    } catch {
      return new Set();
    }
  });

  // Generate dynamic notification items based on capsules and system state
  const notifications: NotificationItem[] = useMemo(() => {
    const list: NotificationItem[] = [];
    const now = new Date();

    // 1. Unlocked capsules notifications
    capsules.forEach((c) => {
      const isUnlocked = new Date(c.unlock_timestamp) <= now;
      if (isUnlocked) {
        list.push({
          id: `unlock_${c.id}`,
          type: 'unlock',
          title: `Capsule Ready to Unseal: "${c.title}"`,
          description: `Located in ${c.location_name || `${c.lat.toFixed(2)}°, ${c.lng.toFixed(2)}°`}. Planted by @${c.creator_username}. Memory is unsealed and ready for inspection.`,
          timestamp: c.unlock_timestamp,
          read: readNotificationIds.has(`unlock_${c.id}`),
          capsuleId: c.id,
          actionLabel: 'Inspect Memory',
        });
      }
    });

    // 2. Active Events Notification
    list.push({
      id: 'event_pharaohs_hunt',
      type: 'event',
      title: 'Global Scavenger Hunt: Secrets of the Pharaohs',
      description: 'A global historical puzzle hunt is currently live in Cairo, Egypt. Solve 3 geographic clues to unlock the secret pyramid seal!',
      timestamp: new Date(Date.now() - 3600000 * 4).toISOString(),
      read: readNotificationIds.has('event_pharaohs_hunt'),
      actionLabel: 'Open Hunt Quests',
    });

    // 3. New Feature Demo Walkthrough Notification
    list.push({
      id: 'system_demo_walkthrough',
      type: 'system',
      title: 'New: Interactive Feature Video Demo Available',
      description: 'Explore the new interactive animated video walkthrough that demonstrates every major capability across the Earth globe.',
      timestamp: new Date(Date.now() - 3600000 * 8).toISOString(),
      read: readNotificationIds.has('system_demo_walkthrough'),
      actionLabel: 'Watch Feature Demo',
    });

    // 4. Heatmap Notification
    list.push({
      id: 'system_heatmap_active',
      type: 'badge',
      title: '3D Glowing Earth Heatmap Online',
      description: 'Global memory density tracking is active across 12 countries. Explore the brightest memory hotspots in Tokyo and Paris.',
      timestamp: new Date(Date.now() - 3600000 * 24).toISOString(),
      read: readNotificationIds.has('system_heatmap_active'),
      actionLabel: 'View 3D Heatmap',
    });

    // 5. Encrypted Vault Storage Seal
    list.push({
      id: 'system_vault_seal',
      type: 'system',
      title: 'Decentralized Vault Seed Active',
      description: 'Your private safe is secured with AES-256 GCM client-side cryptography and Ed25519 signatures.',
      timestamp: new Date(Date.now() - 3600000 * 48).toISOString(),
      read: readNotificationIds.has('system_vault_seal'),
      actionLabel: 'Open My Safe',
    });

    return list.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }, [capsules, readNotificationIds]);

  const unreadCount = useMemo(() => {
    return notifications.filter((n) => !n.read).length;
  }, [notifications]);

  const displayedNotifications = useMemo(() => {
    if (filterUnreadOnly) {
      return notifications.filter((n) => !n.read);
    }
    return notifications;
  }, [notifications, filterUnreadOnly]);

  const handleMarkAllRead = () => {
    const allIds = new Set(notifications.map((n) => n.id));
    setReadNotificationIds(allIds);
    try {
      localStorage.setItem('chronospheres_read_notifications', JSON.stringify(Array.from(allIds)));
    } catch (e) {
      console.warn(e);
    }
  };

  const handleNotificationClick = (n: NotificationItem) => {
    // Mark as read
    const newRead = new Set(readNotificationIds);
    newRead.add(n.id);
    setReadNotificationIds(newRead);
    try {
      localStorage.setItem('chronospheres_read_notifications', JSON.stringify(Array.from(newRead)));
    } catch (e) {
      console.warn(e);
    }

    if (n.capsuleId) {
      const cap = capsules.find((c) => c.id === n.capsuleId);
      if (cap) {
        if (onOpenCapsuleModal) {
          onOpenCapsuleModal(cap);
        } else if (onSelectCapsuleOnGlobe) {
          onSelectCapsuleOnGlobe(cap);
        }
        onClose();
        return;
      }
    }

    if (n.id === 'event_pharaohs_hunt') {
      if (onOpenEvents) {
        onOpenEvents();
        onClose();
      }
    } else if (n.id === 'system_demo_walkthrough') {
      if (onOpenDemo) {
        onOpenDemo();
        onClose();
      }
    } else if (n.id === 'system_heatmap_active') {
      if (onOpenHeatmapArchive) {
        onOpenHeatmapArchive();
        onClose();
      }
    } else if (n.id === 'system_vault_seal') {
      if (onOpenVault) {
        onOpenVault();
        onClose();
      }
    }
  };

  if (!isOpen) return null;

  const username = currentUser?.username || 'Explorer';
  const email = currentUser?.email || 'guest@chronospheres.io';
  const isGuest = currentUser?.isGuest ?? true;

  // Stats calculation
  const totalBuried = vaultCapsules.length;
  const readyToUnseal = vaultCapsules.filter((c) => new Date(c.unlock_timestamp) <= new Date()).length;
  const lockedCount = vaultCapsules.filter((c) => new Date(c.unlock_timestamp) > new Date()).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        id="user-dashboard-modal-container"
        className="relative w-full max-w-4xl max-h-[92vh] parchment-card border-2 border-amber-800/40 rounded-2xl sm:rounded-3xl shadow-[0_25px_80px_rgba(0,0,0,0.6)] flex flex-col overflow-hidden text-amber-950 font-sans"
      >
        {/* 1. TOP HEADER (Tree Bark Banner) */}
        <div className="tree-bark-banner px-4 sm:px-6 py-3.5 sm:py-4 flex items-center justify-between border-b border-amber-800/40 shrink-0 text-amber-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 to-yellow-400 text-stone-950 flex items-center justify-center shadow-md shrink-0">
              <User className="w-5 h-5 text-stone-950 stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="font-serif font-bold text-base sm:text-lg text-amber-100 tracking-tight leading-tight">
                  Explorer Dashboard & Feed
                </h2>
                <span className="px-2 py-0.5 rounded-full bg-amber-950/80 border border-amber-400/50 text-[10px] sm:text-xs font-mono font-bold text-amber-300">
                  {isGuest ? 'Guest Session' : 'Verified Pioneer'}
                </span>
              </div>
              <p className="text-[11px] sm:text-xs text-amber-200/80 mt-0.5">
                Manage your time travel missions, activity feed, notifications, and platform updates.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 sm:p-2 rounded-xl bg-black/30 hover:bg-black/50 text-amber-200 hover:text-white transition cursor-pointer border border-amber-500/30"
            aria-label="Close dashboard"
          >
            <X className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        </div>

        {/* 2. USER PROFILE BANNER & QUICK STATS */}
        <div className="p-4 sm:p-5 bg-amber-900/5 border-b border-amber-800/20 shrink-0">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            {/* User Profile Card */}
            <div className="flex items-center gap-3.5 min-w-0">
              <img
                src={currentUser?.avatar_url || 'https://api.dicebear.com/7.x/bottts/svg?seed=explorer'}
                alt={username}
                className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl border-2 border-amber-700/60 object-cover bg-amber-950 shadow-md shrink-0"
              />
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-sm sm:text-base text-amber-950 truncate">
                    @{username.replace('@', '')}
                  </h3>
                  {!isGuest && (
                    <span className="p-0.5 rounded-full bg-emerald-100 border border-emerald-600 text-emerald-800" title="Cryptographically Verified">
                      <ShieldCheck className="w-3.5 h-3.5" />
                    </span>
                  )}
                </div>
                <p className="text-xs text-amber-900/70 truncate">{email}</p>
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  <span className="text-[10px] px-2 py-0.5 rounded-md bg-amber-100/90 text-amber-900 border border-amber-700/30 font-mono font-medium">
                    🏆 Rank: Chronos Voyager (Lv. 4)
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded-md bg-white/80 text-stone-700 border border-amber-700/20 font-mono">
                    🌐 Earth Network ID: #{currentUser?.id?.slice(0, 8) || 'GUEST-01'}
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Action Badges */}
            <div className="flex items-center gap-2 flex-wrap">
              {onOpenSecurityKeys && !isGuest && (
                <button
                  type="button"
                  onClick={() => {
                    onOpenSecurityKeys();
                    onClose();
                  }}
                  className="px-3 py-1.5 rounded-xl bg-white hover:bg-amber-50 text-amber-900 border border-amber-700/40 text-xs font-bold transition cursor-pointer flex items-center gap-1.5 shadow-xs"
                >
                  <Key className="w-3.5 h-3.5 text-amber-700" />
                  <span>Security Keys</span>
                </button>
              )}

              {onOpenDemo && (
                <button
                  type="button"
                  onClick={() => {
                    onOpenDemo();
                    onClose();
                  }}
                  className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-700 to-amber-900 hover:from-amber-600 hover:to-amber-800 text-amber-100 text-xs font-bold transition cursor-pointer flex items-center gap-1.5 shadow-md border border-amber-500/40"
                >
                  <Play className="w-3.5 h-3.5 fill-amber-200 stroke-none" />
                  <span>Watch Feature Demo</span>
                </button>
              )}

              {onSignOut && !isGuest && (
                <button
                  type="button"
                  onClick={() => {
                    onSignOut();
                    onClose();
                  }}
                  className="p-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-300 transition cursor-pointer"
                  title="Sign Out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 mt-4 pt-3 border-t border-amber-800/20 text-xs">
            <div className="p-2.5 rounded-xl bg-white/80 border border-amber-700/20 shadow-xs flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-amber-100 border border-amber-700/30 flex items-center justify-center text-amber-900 shrink-0">
                <MapPin className="w-4 h-4" />
              </div>
              <div>
                <div className="font-bold text-sm text-amber-950 font-mono">{totalBuried}</div>
                <div className="text-[10px] text-amber-900/70">My Capsules</div>
              </div>
            </div>

            <div className="p-2.5 rounded-xl bg-white/80 border border-emerald-700/20 shadow-xs flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-emerald-100 border border-emerald-600/30 flex items-center justify-center text-emerald-800 shrink-0">
                <Unlock className="w-4 h-4" />
              </div>
              <div>
                <div className="font-bold text-sm text-emerald-950 font-mono">{readyToUnseal}</div>
                <div className="text-[10px] text-emerald-900/70">Unsealed & Ready</div>
              </div>
            </div>

            <div className="p-2.5 rounded-xl bg-white/80 border border-amber-700/20 shadow-xs flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-yellow-100 border border-amber-600/30 flex items-center justify-center text-amber-900 shrink-0">
                <Lock className="w-4 h-4" />
              </div>
              <div>
                <div className="font-bold text-sm text-amber-950 font-mono">{lockedCount}</div>
                <div className="text-[10px] text-amber-900/70">Time-Locked</div>
              </div>
            </div>

            <div className="p-2.5 rounded-xl bg-white/80 border border-purple-700/20 shadow-xs flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-purple-100 border border-purple-600/30 flex items-center justify-center text-purple-900 shrink-0">
                <Flame className="w-4 h-4" />
              </div>
              <div>
                <div className="font-bold text-sm text-purple-950 font-mono">{capsules.length}</div>
                <div className="text-[10px] text-purple-900/70">Global Density</div>
              </div>
            </div>
          </div>
        </div>

        {/* 3. NAVIGATION TABS */}
        <div className="px-4 sm:px-6 py-2.5 bg-amber-900/10 border-b border-amber-800/20 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setActiveTab('notifications')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'notifications'
                  ? 'bg-gradient-to-r from-amber-700 to-amber-900 text-amber-100 shadow-sm border border-amber-500/40'
                  : 'text-amber-950/70 hover:text-amber-950 hover:bg-amber-900/10'
              }`}
            >
              <Bell className="w-3.5 h-3.5" />
              <span>Notifications</span>
              {unreadCount > 0 && (
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono font-bold ${
                    activeTab === 'notifications' ? 'bg-amber-950 text-amber-300' : 'bg-rose-600 text-white'
                  }`}
                >
                  {unreadCount}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('updates')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'updates'
                  ? 'bg-gradient-to-r from-amber-700 to-amber-900 text-amber-100 shadow-sm border border-amber-500/40'
                  : 'text-amber-950/70 hover:text-amber-950 hover:bg-amber-900/10'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Platform Updates</span>
              <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-amber-200 text-amber-950 font-mono border border-amber-700/30">
                v2.4
              </span>
            </button>
          </div>

          {activeTab === 'notifications' && (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setFilterUnreadOnly(!filterUnreadOnly)}
                className={`text-[11px] px-2.5 py-1 rounded-lg border transition cursor-pointer font-medium ${
                  filterUnreadOnly
                    ? 'bg-amber-900 text-amber-100 border-amber-900 font-bold'
                    : 'bg-white text-amber-950/80 border-amber-800/30 hover:bg-amber-50'
                }`}
              >
                {filterUnreadOnly ? 'Showing Unread' : 'All Notifications'}
              </button>

              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={handleMarkAllRead}
                  className="text-[11px] px-2.5 py-1 rounded-lg bg-white hover:bg-amber-50 text-amber-900 border border-amber-800/30 transition cursor-pointer font-semibold shadow-xs"
                >
                  Mark All Read
                </button>
              )}
            </div>
          )}
        </div>

        {/* 4. TAB CONTENT */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 custom-scrollbar bg-[#faf5ec]/60">
          {/* TAB 1: NOTIFICATIONS FEED */}
          {activeTab === 'notifications' && (
            <div className="space-y-3">
              {displayedNotifications.length === 0 ? (
                <div className="py-16 text-center text-amber-900/60 flex flex-col items-center justify-center gap-2">
                  <CheckCircle2 className="w-12 h-12 text-emerald-600 animate-pulse" />
                  <p className="font-bold text-sm text-amber-950">You're all caught up!</p>
                  <p className="text-xs text-amber-900/60">No pending notifications at this moment.</p>
                </div>
              ) : (
                displayedNotifications.map((item) => {
                  return (
                    <div
                      key={item.id}
                      onClick={() => handleNotificationClick(item)}
                      className={`relative group p-3.5 sm:p-4 rounded-2xl border transition-all duration-150 cursor-pointer flex items-start gap-3.5 shadow-xs ${
                        item.read
                          ? 'bg-white/80 hover:bg-white border-amber-800/20'
                          : 'bg-white hover:bg-amber-50/80 border-amber-600 ring-1 ring-amber-600/30 shadow-sm'
                      }`}
                    >
                      {/* Icon */}
                      <div
                        className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                          item.type === 'unlock'
                            ? 'bg-emerald-100 border border-emerald-500/40 text-emerald-800'
                            : item.type === 'event'
                            ? 'bg-purple-100 border border-purple-500/40 text-purple-800'
                            : item.type === 'badge'
                            ? 'bg-amber-100 border border-amber-500/40 text-amber-900'
                            : 'bg-cyan-100 border border-cyan-500/40 text-cyan-800'
                        }`}
                      >
                        {item.type === 'unlock' && <Unlock className="w-4 h-4" />}
                        {item.type === 'event' && <Trophy className="w-4 h-4" />}
                        {item.type === 'badge' && <Flame className="w-4 h-4" />}
                        {item.type === 'system' && <Sparkles className="w-4 h-4" />}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <h4 className="font-bold text-xs sm:text-sm text-amber-950 truncate group-hover:text-amber-800 transition">
                            {item.title}
                          </h4>
                          <span className="text-[10px] text-amber-900/60 font-mono shrink-0">
                            {new Date(item.timestamp).toLocaleDateString(undefined, {
                              month: 'short',
                              day: 'numeric',
                            })}
                          </span>
                        </div>
                        <p className="text-xs text-amber-900/80 mt-1 leading-relaxed">{item.description}</p>

                        {/* Action link */}
                        {item.actionLabel && (
                          <div className="flex items-center gap-1 text-[11px] font-bold text-amber-800 hover:text-amber-950 mt-2">
                            <span>{item.actionLabel}</span>
                            <ExternalLink className="w-3 h-3" />
                          </div>
                        )}
                      </div>

                      {/* Unread indicator */}
                      {!item.read && (
                        <span className="w-2.5 h-2.5 rounded-full bg-amber-600 shadow-[0_0_8px_rgba(217,119,6,0.8)] shrink-0 mt-1.5" />
                      )}
                    </div>
                  );
                })
              )}
            </div>
          )}

          {/* TAB 2: PLATFORM UPDATES (CHANGELOG) */}
          {activeTab === 'updates' && (
            <div className="space-y-4">
              {RELEASE_UPDATES.map((update) => (
                <div
                  key={update.version}
                  className="p-4 sm:p-5 rounded-2xl bg-white border border-amber-800/25 hover:border-amber-700/50 transition shadow-xs space-y-3"
                >
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-0.5 rounded-lg bg-amber-100 border border-amber-700/40 font-mono font-bold text-xs text-amber-950">
                        {update.version}
                      </span>
                      <span className="px-2 py-0.5 rounded-md bg-stone-100 text-stone-700 border border-stone-300 text-[10px] font-mono">
                        {update.date}
                      </span>
                      {update.isNew && (
                        <span className="px-2 py-0.5 rounded-full bg-amber-700 text-amber-100 text-[10px] font-extrabold shadow-xs">
                          NEW RELEASE
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-amber-800 font-mono font-bold">{update.tag}</span>
                  </div>

                  <div>
                    <h4 className="font-bold text-sm sm:text-base text-amber-950 font-serif">{update.title}</h4>
                  </div>

                  <ul className="space-y-1.5 text-xs text-amber-950/80">
                    {update.highlights.map((h, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <CheckCircle2 className="w-3.5 h-3.5 text-amber-700 shrink-0 mt-0.5" />
                        <span>{h}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 5. FOOTER SHORTCUTS */}
        <div className="tree-bark-banner px-4 sm:px-6 py-3 border-t border-amber-800/40 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs text-amber-100">
          <div className="flex items-center gap-2 text-amber-200/80 text-[11px]">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Earth Time Capsule Protocol • DoraHacks Global Network</span>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto">
            {onOpenDemo && (
              <button
                type="button"
                onClick={() => {
                  onOpenDemo();
                  onClose();
                }}
                className="px-3 py-1.5 rounded-xl bg-black/30 hover:bg-black/50 text-amber-200 hover:text-white border border-amber-500/30 font-bold transition cursor-pointer flex items-center gap-1.5"
              >
                <Play className="w-3.5 h-3.5 fill-amber-300 stroke-none" />
                <span>Feature Demo</span>
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="px-4 py-1.5 rounded-xl bg-gradient-to-r from-amber-700 to-amber-900 hover:from-amber-600 hover:to-amber-800 text-amber-100 font-bold transition cursor-pointer border border-amber-500/40 shadow-sm"
            >
              Close Dashboard
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
