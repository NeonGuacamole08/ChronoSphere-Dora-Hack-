import React, { useState } from 'react';
import {
  Trophy,
  Globe,
  Lock,
  Key,
  Plus,
  Users,
  Clock,
  Sparkles,
  X,
  Compass,
  ArrowRight,
  ShieldCheck,
  AlertCircle,
  Radio,
  HelpCircle,
  CheckCircle2
} from 'lucide-react';
import { ScavengerEvent, Capsule } from '../../types';
import { eventsStorage } from '../../utils/eventsStorage';
import { SupportedLanguage, translate } from '../../utils/i18n';

interface EventsDashboardModalProps {
  isOpen: boolean;
  onClose: () => void;
  events: ScavengerEvent[];
  allCapsules: Capsule[];
  currentUsername: string;
  activeEventId: string | null;
  onStartHunt: (event: ScavengerEvent) => void;
  onOpenLeaderboard: (event: ScavengerEvent) => void;
  onOpenMissionControl: (event: ScavengerEvent) => void;
  onCreateEvent: (newEvent: Omit<ScavengerEvent, 'id' | 'hints_broadcasted' | 'discoveries' | 'created_at'>) => void;
  language?: SupportedLanguage;
}

export const EventsDashboardModal: React.FC<EventsDashboardModalProps> = ({
  isOpen,
  onClose,
  events,
  allCapsules,
  currentUsername,
  activeEventId,
  onStartHunt,
  onOpenLeaderboard,
  onOpenMissionControl,
  onCreateEvent,
  language = 'en',
}) => {
  const [activeTab, setActiveTab] = useState<'global' | 'my_events'>('global');
  const [secretCodeInput, setSecretCodeInput] = useState<string>('');
  const [codeFeedback, setCodeFeedback] = useState<{ message: string; success: boolean } | null>(null);
  const [isCreatingEvent, setIsCreatingEvent] = useState(false);

  // New Event Form State
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newIsPublic, setNewIsPublic] = useState(true);
  const [newSecretCode, setNewSecretCode] = useState('');
  const [newInvitedHandles, setNewInvitedHandles] = useState('');
  const [newDurationDays, setNewDurationDays] = useState(7);
  const [newSelectedCapsuleIds, setNewSelectedCapsuleIds] = useState<string[]>([]);

  if (!isOpen) return null;

  const handleVerifyCode = (e: React.FormEvent) => {
    e.preventDefault();
    if (!secretCodeInput.trim()) return;

    const result = eventsStorage.verifyAccessCode(secretCodeInput);
    if (result.success && result.event) {
      setCodeFeedback({ message: result.message, success: true });
      setActiveTab('my_events');
      setSecretCodeInput('');
    } else {
      setCodeFeedback({ message: result.message, success: false });
    }
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const now = new Date();
    const end = new Date(now.getTime() + newDurationDays * 24 * 60 * 60 * 1000);

    // If no capsules selected, pick first 2-3 capsules as default
    const capsuleIds = newSelectedCapsuleIds.length > 0
      ? newSelectedCapsuleIds
      : allCapsules.slice(0, 3).map((c) => c.id);

    const handles = newInvitedHandles
      .split(/[\s,]+/)
      .map((h) => (h.startsWith('@') ? h : `@${h}`))
      .filter((h) => h.length > 1);

    onCreateEvent({
      title: newTitle.trim(),
      description: newDesc.trim() || 'Exciting competitive scavenger hunt across hidden coordinate vaults.',
      creator_id: 'user_active',
      creator_username: currentUsername.startsWith('@') ? currentUsername : `@${currentUsername}`,
      is_public: newIsPublic,
      secret_access_code: newIsPublic ? undefined : (newSecretCode.trim().toUpperCase() || 'TREASURE'),
      invited_handles: handles.length > 0 ? handles : [currentUsername, '@guest', '@explorer'],
      start_timestamp: now.toISOString(),
      end_timestamp: end.toISOString(),
      capsule_ids: capsuleIds,
      banner_url: 'https://images.unsplash.com/photo-1519681393784-d120267933ba?w=1200&auto=format&fit=crop&q=80',
      theme_color: newIsPublic ? 'amber' : 'purple',
    });

    setIsCreatingEvent(false);
    setActiveTab(newIsPublic ? 'global' : 'my_events');
  };

  // Filter events by tab
  const globalEvents = events.filter((e) => e.is_public);
  const myEvents = events.filter((e) => {
    if (!e.is_public) return true;
    return e.creator_username.toLowerCase() === currentUsername.toLowerCase();
  });

  const displayedEvents = activeTab === 'global' ? globalEvents : myEvents;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl rounded-3xl bg-gradient-to-b from-[#160d05] via-[#100803] to-[#080401] border border-amber-500/50 shadow-[0_25px_80px_rgba(0,0,0,0.95)] p-4 sm:p-7 text-amber-100 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Glow */}
        <div className="absolute -top-24 -right-24 w-80 h-80 rounded-full bg-amber-500/10 blur-3xl pointer-events-none" />

        {/* Modal Header */}
        <div className="flex items-center justify-between pb-4 border-b border-amber-500/30 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-600 to-yellow-400 text-stone-950 flex items-center justify-center shadow-[0_0_25px_rgba(245,158,11,0.5)]">
              <Trophy className="w-6 h-6" />
            </div>
            <div>
              <h2 className="font-serif text-xl sm:text-2xl font-bold text-white tracking-tight">
                {translate('events', language)}
              </h2>
              <p className="text-xs sm:text-sm text-amber-300/70">
                Competitive Scavenger Hunts, Private Parties & Timed Expeditions
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-stone-400 hover:text-white hover:bg-white/10 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs & Secret Code Access Bar */}
        <div className="mt-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 shrink-0">
          {/* Tabs */}
          <div className="flex items-center p-1 rounded-2xl bg-black/50 border border-amber-500/30">
            <button
              type="button"
              onClick={() => {
                setActiveTab('global');
                setIsCreatingEvent(false);
              }}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-xs sm:text-sm transition cursor-pointer ${
                activeTab === 'global' && !isCreatingEvent
                  ? 'bg-amber-500 text-stone-950 shadow-md'
                  : 'text-amber-300/70 hover:text-white'
              }`}
            >
              <Globe className="w-4 h-4" />
              <span>{translate('globalEvents', language)}</span>
              <span className="px-1.5 py-0.2 rounded-full bg-black/20 text-[10px] font-mono">
                {globalEvents.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveTab('my_events');
                setIsCreatingEvent(false);
              }}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-xs sm:text-sm transition cursor-pointer ${
                activeTab === 'my_events' && !isCreatingEvent
                  ? 'bg-amber-500 text-stone-950 shadow-md'
                  : 'text-amber-300/70 hover:text-white'
              }`}
            >
              <Lock className="w-4 h-4" />
              <span>{translate('myEvents', language)}</span>
              <span className="px-1.5 py-0.2 rounded-full bg-black/20 text-[10px] font-mono">
                {myEvents.length}
              </span>
            </button>
          </div>

          {/* Action Buttons: Enter Code & Create Event */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsCreatingEvent((prev) => !prev)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-stone-950 font-bold text-xs sm:text-sm shadow-md transition cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>{isCreatingEvent ? 'Back to Hunts' : 'Host Hunt'}</span>
            </button>
          </div>
        </div>

        {/* SECRET ACCESS CODE INPUT ROW */}
        <div className="mt-3 p-3 rounded-2xl bg-[#1f1207]/70 border border-amber-500/30 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            <Key className="w-4 h-4 text-amber-400 shrink-0" />
            <span className="text-xs font-mono font-bold text-amber-200 truncate">
              {translate('enterSecretCode', language)}
            </span>
          </div>

          <form onSubmit={handleVerifyCode} className="flex items-center gap-2">
            <input
              type="text"
              value={secretCodeInput}
              onChange={(e) => setSecretCodeInput(e.target.value)}
              placeholder={translate('codePlaceholder', language)}
              className="px-3 py-1.5 rounded-xl bg-black/60 border border-amber-500/40 text-amber-100 placeholder-amber-400/40 text-xs font-mono uppercase focus:outline-none focus:border-amber-400 w-36 sm:w-44"
            />
            <button
              type="submit"
              className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-xs transition cursor-pointer"
            >
              Unlock
            </button>
          </form>
        </div>

        {codeFeedback && (
          <div
            className={`mt-2 px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 shrink-0 ${
              codeFeedback.success
                ? 'bg-emerald-950/80 border border-emerald-400/70 text-emerald-200'
                : 'bg-red-950/80 border border-red-400/70 text-red-200'
            }`}
          >
            {codeFeedback.success ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <AlertCircle className="w-4 h-4 text-red-400" />}
            <span>{codeFeedback.message}</span>
          </div>
        )}

        {/* MAIN BODY: CREATE EVENT FORM OR EVENT LIST */}
        {isCreatingEvent ? (
          <form onSubmit={handleCreateSubmit} className="mt-4 flex-1 overflow-y-auto pr-1 space-y-4">
            <div className="p-4 rounded-2xl bg-[#1e1005]/80 border border-amber-500/40 space-y-3.5">
              <h3 className="font-serif font-bold text-base text-white flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-400" />
                Host a New Scavenger Hunt Expedition
              </h3>

              <div>
                <label className="block text-xs font-mono font-bold text-amber-300 mb-1">
                  Hunt Title
                </label>
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. Kyoto Cherry Blossom Secret Treasure Hunt"
                  className="w-full px-3.5 py-2 rounded-xl bg-black/60 border border-amber-500/40 text-white text-sm focus:outline-none focus:border-amber-400"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-mono font-bold text-amber-300 mb-1">
                  Expedition Description
                </label>
                <textarea
                  rows={2}
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  placeholder="Rules, theme, hints, and story for competitors..."
                  className="w-full px-3.5 py-2 rounded-xl bg-black/60 border border-amber-500/40 text-white text-sm focus:outline-none focus:border-amber-400 resize-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-mono font-bold text-amber-300 mb-1">
                    Hunt Access Type
                  </label>
                  <div className="flex items-center gap-2 p-1 rounded-xl bg-black/50 border border-amber-500/30">
                    <button
                      type="button"
                      onClick={() => setNewIsPublic(true)}
                      className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition ${
                        newIsPublic ? 'bg-amber-500 text-stone-950' : 'text-amber-300/70 hover:text-white'
                      }`}
                    >
                      Public Global
                    </button>
                    <button
                      type="button"
                      onClick={() => setNewIsPublic(false)}
                      className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition ${
                        !newIsPublic ? 'bg-amber-500 text-stone-950' : 'text-amber-300/70 hover:text-white'
                      }`}
                    >
                      Private Party
                    </button>
                  </div>
                </div>

                {!newIsPublic && (
                  <div>
                    <label className="block text-xs font-mono font-bold text-amber-300 mb-1">
                      Secret Access Code
                    </label>
                    <input
                      type="text"
                      value={newSecretCode}
                      onChange={(e) => setNewSecretCode(e.target.value.toUpperCase())}
                      placeholder="e.g. CIPHER99"
                      className="w-full px-3.5 py-2 rounded-xl bg-black/60 border border-amber-500/40 text-white text-sm font-mono uppercase focus:outline-none focus:border-amber-400"
                    />
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-mono font-bold text-amber-300 mb-1">
                  Invited Player Handles (comma or space separated)
                </label>
                <input
                  type="text"
                  value={newInvitedHandles}
                  onChange={(e) => setNewInvitedHandles(e.target.value)}
                  placeholder="@carl_sagan_vault, @kai_traveler, @elena_star"
                  className="w-full px-3.5 py-2 rounded-xl bg-black/60 border border-amber-500/40 text-white text-sm focus:outline-none focus:border-amber-400 font-mono"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsCreatingEvent(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-stone-400 hover:text-white transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-400 text-stone-950 font-bold text-xs shadow-lg transition cursor-pointer"
                >
                  Publish & Open Event
                </button>
              </div>
            </div>
          </form>
        ) : (
          /* EVENT CARDS LIST */
          <div className="mt-4 flex-1 overflow-y-auto pr-1 space-y-3.5">
            {displayedEvents.length === 0 ? (
              <div className="p-8 text-center rounded-2xl bg-[#1a0e05]/50 border border-amber-500/20 text-amber-300/70">
                <Compass className="w-10 h-10 mx-auto mb-2 text-amber-400/50" />
                <p className="font-serif text-sm font-bold text-white">No events found in this category</p>
                <p className="text-xs mt-1">
                  {activeTab === 'my_events'
                    ? 'Enter a secret access code above or click "Host Hunt" to create a private party competition!'
                    : 'Check back soon or create your own global scavenger hunt.'}
                </p>
              </div>
            ) : (
              displayedEvents.map((event) => {
                const isCurrentActive = activeEventId === event.id;
                const isOwner =
                  event.creator_username.toLowerCase() === currentUsername.toLowerCase() ||
                  event.creator_id === 'user_active';
                const totalCapsules = event.capsule_ids.length;
                const discoveriesCount = (event.discoveries || []).length;

                return (
                  <div
                    key={event.id}
                    className={`relative rounded-2xl border transition-all overflow-hidden p-4 sm:p-5 ${
                      isCurrentActive
                        ? 'bg-gradient-to-r from-[#2c1607] to-[#1c0f05] border-amber-400 ring-2 ring-amber-400/40 shadow-[0_0_25px_rgba(245,158,11,0.3)]'
                        : 'bg-[#180e05]/90 border-amber-500/30 hover:border-amber-500/50'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      {/* Left: Info */}
                      <div className="min-w-0 space-y-1.5 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider ${
                              event.is_public
                                ? 'bg-amber-500/20 border border-amber-500/40 text-amber-300'
                                : 'bg-purple-500/20 border border-purple-500/40 text-purple-300'
                            }`}
                          >
                            {event.is_public ? 'Global Public Hunt' : 'Private Party Hunt'}
                          </span>

                          {event.secret_access_code && (
                            <span className="px-2 py-0.5 rounded-full bg-stone-900 border border-stone-700 text-stone-300 text-[10px] font-mono">
                              Code: {event.secret_access_code}
                            </span>
                          )}

                          <span className="text-xs text-amber-300/70 font-mono">
                            Host: {event.creator_username}
                          </span>
                        </div>

                        <h3 className="font-serif text-base sm:text-lg font-bold text-white tracking-tight">
                          {event.title}
                        </h3>

                        <p className="text-xs text-amber-200/80 leading-relaxed max-w-2xl line-clamp-2">
                          {event.description}
                        </p>

                        {/* Metadata tags */}
                        <div className="flex flex-wrap items-center gap-3 pt-1 text-xs text-amber-300/70 font-mono">
                          <span className="flex items-center gap-1">
                            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                            {totalCapsules} Vaults Hidden
                          </span>
                          <span className="flex items-center gap-1">
                            <Users className="w-3.5 h-3.5 text-amber-400" />
                            {Math.max(discoveriesCount, event.is_public ? 8 : 2)} Discoveries
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5 text-emerald-400" />
                            Active Now
                          </span>
                        </div>
                      </div>

                      {/* Right: Actions */}
                      <div className="flex flex-wrap sm:flex-col items-center sm:items-end gap-2 shrink-0">
                        {/* Start / Resume Hunt */}
                        <button
                          type="button"
                          onClick={() => onStartHunt(event)}
                          className={`px-4 py-2 sm:px-5 sm:py-2.5 rounded-xl font-bold text-xs sm:text-sm transition cursor-pointer flex items-center gap-1.5 shadow-md ${
                            isCurrentActive
                              ? 'bg-emerald-500 hover:bg-emerald-400 text-stone-950 ring-2 ring-emerald-400/50'
                              : 'bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-stone-950'
                          }`}
                        >
                          <Trophy className="w-4 h-4" />
                          <span>{isCurrentActive ? 'Active Hunt' : 'Join Hunt'}</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>

                        <div className="flex items-center gap-1.5">
                          {/* Leaderboard */}
                          <button
                            type="button"
                            onClick={() => onOpenLeaderboard(event)}
                            className="px-3 py-1.5 rounded-xl bg-stone-900/80 hover:bg-stone-800 border border-amber-500/40 text-amber-300 text-xs font-bold transition cursor-pointer"
                          >
                            Leaderboard
                          </button>

                          {/* Mission Control (Owner or demo preview) */}
                          <button
                            type="button"
                            onClick={() => onOpenMissionControl(event)}
                            className="px-3 py-1.5 rounded-xl bg-cyan-950/80 hover:bg-cyan-900 border border-cyan-400/50 text-cyan-200 text-xs font-bold transition cursor-pointer"
                            title="Event Owner Mission Control & Clue Dispatch"
                          >
                            Mission Control
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* Footer */}
        <div className="mt-4 pt-3 border-t border-amber-500/30 flex items-center justify-between shrink-0">
          <span className="text-xs text-amber-400/60 font-mono">
            TreasureFest Competitions Engine
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-stone-900 hover:bg-stone-800 border border-amber-500/40 text-amber-200 font-bold text-xs sm:text-sm transition cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
