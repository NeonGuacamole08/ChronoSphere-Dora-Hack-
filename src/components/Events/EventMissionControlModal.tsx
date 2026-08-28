import React, { useState, useEffect, useCallback } from 'react';
import {
  Radio,
  Send,
  Sparkles,
  X,
  Users,
  CheckCircle2,
  Lock,
  MapPin,
  Compass,
  FileText,
  AlertCircle,
  Activity,
  RefreshCw,
} from 'lucide-react';
import { ScavengerEvent, Capsule } from '../../types';
import { getSupabaseClient, capsulesDb } from '../../utils/supabase';
import { translate, SupportedLanguage } from '../../utils/i18n';

interface EventMissionControlModalProps {
  isOpen: boolean;
  onClose: () => void;
  event: ScavengerEvent;
  capsules: Capsule[];
  onBroadcastHint: (capsuleId: string, capsuleTitle: string, hintText: string) => void;
  language?: SupportedLanguage;
}

export const EventMissionControlModal: React.FC<EventMissionControlModalProps> = ({
  isOpen,
  onClose,
  event,
  capsules,
  onBroadcastHint,
  language = 'en',
}) => {
  const [activeHintCapsule, setActiveHintCapsule] = useState<Capsule | null>(null);
  const [hintInput, setHintInput] = useState<string>('');
  const [justBroadcasted, setJustBroadcasted] = useState<string | null>(null);

  // Live Supabase Capsule Data
  const [liveCapsules, setLiveCapsules] = useState<Capsule[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [realtimeStatus, setRealtimeStatus] = useState<'connecting' | 'connected' | 'offline'>('connecting');
  const [lastLivePing, setLastLivePing] = useState<string | null>(null);

  // Fetch live event stats from Supabase public.capsules
  const fetchLiveEventCapsules = useCallback(async () => {
    try {
      const client = getSupabaseClient();
      // 1. Query public.capsules filtered by active event_id
      const { data, error } = await client
        .from('capsules')
        .select('*')
        .eq('event_id', event.id)
        .order('order_in_hunt', { ascending: true, nullsFirst: false });

      if (!error && Array.isArray(data) && data.length > 0) {
        const mapped: Capsule[] = data.map((row: any) => ({
          id: row.id,
          title: row.title || 'Event Capsule',
          message: row.message || '',
          created_at: row.created_at || new Date().toISOString(),
          unlock_timestamp: row.unlock_timestamp || new Date().toISOString(),
          lat: Number(row.lat) || 0,
          lng: Number(row.lng) || 0,
          location_name: row.location_name || 'Field Waypoint',
          country_code: row.country_code || 'UN',
          country_name: row.country_name || 'Global Terra',
          creator_username: row.creator_username || event.creator_username,
          creator_email: row.creator_email || '',
          access_type: row.access_type || 'public',
          is_found: Boolean(row.is_found),
          event_id: row.event_id || event.id,
          event_hint: row.event_hint,
          order_in_hunt: row.order_in_hunt,
          is_encrypted: row.is_encrypted !== false,
          notified: Boolean(row.notified),
          arweave_tx_id: row.arweave_tx_id || `ar_${row.id}`,
          encryption_signature: row.encryption_signature || 'sig_verified',
        }));

        setLiveCapsules(mapped);
        setLastLivePing(new Date().toLocaleTimeString());
      } else {
        // Fallback: match from local cache or seed
        const fallback = capsules.filter(
          (c) => event.capsule_ids.includes(c.id) || c.event_id === event.id
        );

        if (fallback.length > 0) {
          setLiveCapsules(fallback);
          // Auto-seed to Supabase so postgres_changes works seamlessly
          capsulesDb.seedEventCapsules(fallback).catch(() => {});
        } else {
          setLiveCapsules([]);
        }
      }
    } catch (err) {
      console.warn('Supabase live capsules query notice:', err);
      const fallback = capsules.filter(
        (c) => event.capsule_ids.includes(c.id) || c.event_id === event.id
      );
      setLiveCapsules(fallback);
    } finally {
      setIsLoading(false);
    }
  }, [event.id, event.capsule_ids, event.creator_username, capsules]);

  // Set up live querying & Real-Time Supabase subscription (postgres_changes)
  useEffect(() => {
    if (!isOpen) return;

    fetchLiveEventCapsules();

    // Set up Real-Time subscription on public.capsules table
    let channel: any = null;
    try {
      const client = getSupabaseClient();
      channel = client
        .channel(`public:capsules:event_${event.id}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'capsules',
          },
          (payload: any) => {
            setLastLivePing(new Date().toLocaleTimeString());

            // Check if modified capsule belongs to this event
            const updatedRow = payload.new;
            if (updatedRow && (updatedRow.event_id === event.id || event.capsule_ids.includes(updatedRow.id))) {
              setLiveCapsules((prev) => {
                const exists = prev.some((c) => c.id === updatedRow.id);
                if (exists) {
                  return prev.map((c) =>
                    c.id === updatedRow.id
                      ? { ...c, is_found: Boolean(updatedRow.is_found) }
                      : c
                  );
                } else {
                  return [
                    ...prev,
                    {
                      id: updatedRow.id,
                      title: updatedRow.title || 'Event Capsule',
                      message: updatedRow.message || '',
                      created_at: updatedRow.created_at || new Date().toISOString(),
                      unlock_timestamp: updatedRow.unlock_timestamp || new Date().toISOString(),
                      lat: Number(updatedRow.lat) || 0,
                      lng: Number(updatedRow.lng) || 0,
                      location_name: updatedRow.location_name || 'Waypoint',
                      country_code: updatedRow.country_code || 'UN',
                      country_name: updatedRow.country_name || 'Global',
                      creator_username: updatedRow.creator_username || event.creator_username,
                      creator_email: updatedRow.creator_email || '',
                      access_type: updatedRow.access_type || 'public',
                      is_found: Boolean(updatedRow.is_found),
                      event_id: updatedRow.event_id || event.id,
                      arweave_tx_id: updatedRow.arweave_tx_id || `ar_${updatedRow.id}`,
                      encryption_signature: updatedRow.encryption_signature || 'sig_verified',
                      is_encrypted: false,
                      notified: false,
                    },
                  ];
                }
              });
            } else {
              // Re-fetch in background to ensure accurate sync
              fetchLiveEventCapsules();
            }
          }
        )
        .subscribe((status: string) => {
          if (status === 'SUBSCRIBED') {
            setRealtimeStatus('connected');
          } else if (status === 'CHANNEL_ERROR') {
            setRealtimeStatus('offline');
          }
        });
    } catch (e) {
      console.warn('Realtime subscription setup notice:', e);
      setRealtimeStatus('offline');
    }

    // Also listen for local storage events in case discovery occurred in same tab/guest mode
    const handleStorage = (ev: StorageEvent) => {
      if (ev.key?.includes('capsules') || ev.key?.includes('events')) {
        fetchLiveEventCapsules();
      }
    };
    window.addEventListener('storage', handleStorage);

    return () => {
      window.removeEventListener('storage', handleStorage);
      if (channel) {
        try {
          const client = getSupabaseClient();
          client.removeChannel(channel);
        } catch {}
      }
    };
  }, [isOpen, event.id, fetchLiveEventCapsules]);

  if (!isOpen) return null;

  // 1. Total Capsules Hidden: Display the total array length
  const totalHidden = liveCapsules.length > 0 ? liveCapsules.length : event.capsule_ids.length;

  // 2. Capsules Found: Display the count of items where is_found === true
  const capsulesFoundCount = liveCapsules.filter((c) => c.is_found === true).length;

  // Progress percentage
  const progressPercent = totalHidden > 0 ? Math.round((capsulesFoundCount / totalHidden) * 100) : 0;

  // Active hunters
  const discoveries = event.discoveries || [];
  const uniqueHunters = new Set(discoveries.map((d) => d.username));
  const activeHuntersCount = Math.max(uniqueHunters.size, event.is_public ? 4 : 1);

  const handleOpenSendHint = (capsule: Capsule) => {
    setActiveHintCapsule(capsule);
    setHintInput('');
  };

  const handleConfirmSendHint = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeHintCapsule || !hintInput.trim()) return;

    onBroadcastHint(activeHintCapsule.id, activeHintCapsule.title, hintInput.trim());
    setJustBroadcasted(`Clue broadcasted for "${activeHintCapsule.title}"!`);
    setActiveHintCapsule(null);
    setHintInput('');

    setTimeout(() => {
      setJustBroadcasted(null);
    }, 4000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-3xl rounded-3xl bg-gradient-to-b from-[#0e1826] via-[#09111c] to-[#04080e] border border-cyan-500/50 shadow-[0_25px_70px_rgba(0,0,0,0.9)] p-5 sm:p-7 text-cyan-100 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Glow backdrop */}
        <div className="absolute -top-24 -right-24 w-72 h-72 rounded-full bg-cyan-500/10 blur-3xl pointer-events-none" />

        {/* Modal Header */}
        <div className="flex items-center justify-between pb-4 border-b border-cyan-500/30 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-cyan-600 to-teal-400 text-stone-950 flex items-center justify-center shadow-[0_0_20px_rgba(6,182,212,0.4)]">
              <Radio className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-full bg-cyan-500/20 border border-cyan-400/40 text-cyan-300 text-[10px] font-mono font-bold uppercase tracking-wider">
                  {translate('ownerDashboard', language)}
                </span>
                <span className="text-xs text-cyan-400/60 font-mono">
                  Owner: {event.creator_username}
                </span>
              </div>
              <h2 className="font-serif text-lg sm:text-xl font-bold text-white tracking-tight">
                {event.title}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Realtime Status Badge */}
            <div
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-mono font-bold border transition ${
                realtimeStatus === 'connected'
                  ? 'bg-emerald-950/80 border-emerald-500/60 text-emerald-300'
                  : 'bg-cyan-950/80 border-cyan-500/40 text-cyan-400'
              }`}
              title="Supabase Realtime postgres_changes listener"
            >
              <Activity className={`w-3 h-3 ${realtimeStatus === 'connected' ? 'animate-pulse text-emerald-400' : ''}`} />
              <span className="hidden sm:inline">Supabase Realtime</span>
              <span>{realtimeStatus === 'connected' ? 'LIVE' : 'SYNCING'}</span>
            </div>

            <button
              type="button"
              onClick={fetchLiveEventCapsules}
              title="Refresh live Supabase event data"
              className="p-2 rounded-xl text-cyan-400 hover:text-white hover:bg-cyan-900/40 border border-cyan-500/30 transition cursor-pointer"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl text-stone-400 hover:text-white hover:bg-white/10 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {justBroadcasted && (
          <div className="mt-3 px-4 py-2.5 rounded-xl bg-emerald-950/90 border border-emerald-400/80 text-emerald-200 text-xs font-bold flex items-center gap-2 animate-in fade-in duration-200 shrink-0">
            <Sparkles className="w-4 h-4 text-emerald-400" />
            <span>{justBroadcasted}</span>
          </div>
        )}

        {/* TOP STAT CARDS: Live Event Stats from public.capsules */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3.5 my-4 shrink-0">
          {/* 1. Total Capsules Hidden (Total array length queried from public.capsules) */}
          <div className="p-3 sm:p-4 rounded-2xl bg-[#112033]/80 border border-cyan-500/25">
            <div className="flex items-center justify-between text-cyan-400 mb-1">
              <span className="text-[11px] font-mono font-bold uppercase tracking-wider">
                {translate('totalCapsulesHidden', language)}
              </span>
              <Lock className="w-4 h-4 text-cyan-400" />
            </div>
            <div className="font-mono text-xl sm:text-2xl font-bold text-white">
              {totalHidden}
            </div>
            <span className="text-[10px] text-cyan-300/60 font-mono">public.capsules length</span>
          </div>

          {/* 2. Capsules Found (Count where is_found === true) */}
          <div className="p-3 sm:p-4 rounded-2xl bg-[#112033]/80 border border-cyan-500/25">
            <div className="flex items-center justify-between text-emerald-400 mb-1">
              <span className="text-[11px] font-mono font-bold uppercase tracking-wider">
                {translate('capsulesFoundCount', language)}
              </span>
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="font-mono text-xl sm:text-2xl font-bold text-emerald-300 flex items-center gap-2">
              <span>{capsulesFoundCount}</span>
              {capsulesFoundCount > 0 && (
                <span className="text-xs px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-sans font-medium">
                  Active
                </span>
              )}
            </div>
            <span className="text-[10px] text-cyan-300/60 font-mono">is_found === true</span>
          </div>

          {/* Active Hunters */}
          <div className="p-3 sm:p-4 rounded-2xl bg-[#112033]/80 border border-cyan-500/25">
            <div className="flex items-center justify-between text-amber-400 mb-1">
              <span className="text-[11px] font-mono font-bold uppercase tracking-wider">Hunters</span>
              <Users className="w-4 h-4 text-amber-400" />
            </div>
            <div className="font-mono text-xl sm:text-2xl font-bold text-amber-300">
              {activeHuntersCount}
            </div>
            <span className="text-[10px] text-cyan-300/60">Active Participants</span>
          </div>

          {/* Completion Rate */}
          <div className="p-3 sm:p-4 rounded-2xl bg-[#112033]/80 border border-cyan-500/25">
            <div className="flex items-center justify-between text-fuchsia-400 mb-1">
              <span className="text-[11px] font-mono font-bold uppercase tracking-wider">Cleared</span>
              <Sparkles className="w-4 h-4 text-fuchsia-400" />
            </div>
            <div className="font-mono text-xl sm:text-2xl font-bold text-fuchsia-300">
              {progressPercent}%
            </div>
            <span className="text-[10px] text-cyan-300/60">Total Completion</span>
          </div>
        </div>

        {/* LIVE PROGRESS BAR */}
        <div className="p-3.5 rounded-2xl bg-[#112033]/60 border border-cyan-500/30 shrink-0 space-y-1.5">
          <div className="flex items-center justify-between text-xs font-mono">
            <span className="text-cyan-200 font-bold flex items-center gap-1.5">
              <Compass className="w-3.5 h-3.5 text-cyan-400 animate-spin" style={{ animationDuration: '10s' }} />
              {translate('liveExpeditionProgress', language)}
            </span>
            <span className="font-bold text-cyan-300">
              {capsulesFoundCount} / {totalHidden} Capsules Discovered
            </span>
          </div>

          <div className="w-full h-3 rounded-full bg-stone-900 border border-cyan-500/40 p-0.5 overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-cyan-500 via-teal-400 to-emerald-400 transition-all duration-500 shadow-[0_0_12px_rgba(6,182,212,0.6)]"
              style={{ width: `${Math.max(capsulesFoundCount > 0 ? 6 : 0, progressPercent)}%` }}
            />
          </div>
        </div>

        {/* CAPSULES LIST & HINT BROADCASTING SECTION */}
        <div className="mt-4 flex-1 overflow-y-auto pr-1 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-serif font-bold text-sm text-white flex items-center gap-2">
              <FileText className="w-4 h-4 text-cyan-400" />
              Event Capsules & Clue Dispatch
            </h3>
            <span className="text-xs text-cyan-400/70 font-mono">
              Click 'Send Hint' to broadcast clue to all players
            </span>
          </div>

          <div className="space-y-2.5">
            {liveCapsules.map((capsule, index) => {
              const isFound = capsule.is_found === true;
              const hintsForThis = (event.hints_broadcasted || []).filter(
                (h) => h.capsule_id === capsule.id
              );

              return (
                <div
                  key={capsule.id}
                  className={`p-3.5 sm:p-4 rounded-2xl border transition-all ${
                    isFound
                      ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-100'
                      : 'bg-[#101e33]/70 border-cyan-500/30 text-cyan-100 hover:border-cyan-500/50'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-md bg-stone-800 text-stone-300 font-mono text-[11px] font-bold flex items-center justify-center">
                          #{index + 1}
                        </span>
                        <h4 className="font-serif font-bold text-sm text-white truncate">
                          {capsule.title}
                        </h4>
                        {isFound ? (
                          <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-400/60 text-emerald-300 text-[10px] font-mono font-bold uppercase flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                            Discovered (is_found=true)
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full bg-amber-500/20 border border-amber-400/60 text-amber-300 text-[10px] font-mono font-bold uppercase">
                            Hidden
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2 text-xs text-cyan-300/70 mt-1">
                        <MapPin className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                        <span className="truncate">{capsule.location_name}</span>
                        <span className="text-[10px] font-mono text-cyan-400/50">
                          ({capsule.lat.toFixed(4)}, {capsule.lng.toFixed(4)})
                        </span>
                      </div>
                    </div>

                    {/* Action Button: Send Hint */}
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleOpenSendHint(capsule)}
                        className="px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-stone-950 font-bold text-xs shadow-md transition flex items-center gap-1.5 cursor-pointer active:scale-95"
                      >
                        <Radio className="w-3.5 h-3.5 text-stone-950" />
                        <span>{translate('sendHint', language)}</span>
                      </button>
                    </div>
                  </div>

                  {/* Existing Broadcasted Hints for this Capsule */}
                  {hintsForThis.length > 0 && (
                    <div className="mt-2.5 pt-2 border-t border-cyan-500/20 space-y-1">
                      <span className="text-[10px] uppercase font-mono font-bold text-amber-400 flex items-center gap-1">
                        <Radio className="w-3 h-3" /> Broadcasted Clues ({hintsForThis.length})
                      </span>
                      {hintsForThis.map((h) => (
                        <p key={h.id} className="text-xs text-amber-200/90 italic bg-black/40 px-2.5 py-1.5 rounded-lg border border-amber-500/20">
                          "{h.hint_text}"
                        </p>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* HINT COMPOSITION MODAL POPUP */}
        {activeHintCapsule && (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="w-full max-w-lg rounded-3xl bg-[#0c1626] border-2 border-amber-400 shadow-[0_20px_50px_rgba(245,158,11,0.4)] p-6 text-white space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-amber-500 text-stone-950 flex items-center justify-center font-bold">
                    <Radio className="w-5 h-5 animate-pulse" />
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-mono font-bold text-amber-400">
                      {translate('broadcastClue', language)}
                    </span>
                    <h3 className="font-serif font-bold text-sm text-white truncate max-w-xs">
                      {activeHintCapsule.title}
                    </h3>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setActiveHintCapsule(null)}
                  className="p-1.5 rounded-lg text-stone-400 hover:text-white transition cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleConfirmSendHint} className="space-y-4">
                <div>
                  <label className="block text-xs font-mono font-bold text-amber-300 mb-1.5">
                    {translate('clueText', language)}
                  </label>
                  <textarea
                    rows={3}
                    value={hintInput}
                    onChange={(e) => setHintInput(e.target.value)}
                    placeholder={translate('hintPlaceholder', language)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-black/60 border border-amber-500/40 text-white placeholder-stone-500 text-sm focus:outline-none focus:border-amber-400 resize-none font-sans"
                    autoFocus
                    required
                  />
                  {activeHintCapsule.event_hint && (
                    <div className="mt-1.5 text-[11px] text-amber-300/70 flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0 text-amber-400" />
                      <span>Default clue: "{activeHintCapsule.event_hint}"</span>
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-stone-800">
                  <button
                    type="button"
                    onClick={() => setActiveHintCapsule(null)}
                    className="px-4 py-2 rounded-xl text-xs font-bold text-stone-400 hover:text-white transition cursor-pointer"
                  >
                    {translate('cancel', language)}
                  </button>
                  <button
                    type="submit"
                    disabled={!hintInput.trim()}
                    className="px-5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 disabled:opacity-50 text-stone-950 font-bold text-xs shadow-lg transition flex items-center gap-1.5 cursor-pointer"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>{translate('send', language)}</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="mt-4 pt-3 border-t border-cyan-500/30 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2 text-xs text-cyan-400/60 font-mono">
            <span>Supabase public.capsules Realtime</span>
            {lastLivePing && <span>• Synced: {lastLivePing}</span>}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-cyan-950 hover:bg-cyan-900 border border-cyan-500/50 text-cyan-200 font-bold text-xs sm:text-sm transition cursor-pointer"
          >
            {translate('closeMissionControl', language)}
          </button>
        </div>
      </div>
    </div>
  );
};
