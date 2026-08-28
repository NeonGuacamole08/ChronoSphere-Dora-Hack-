import React from 'react';
import { Trophy, Medal, Clock, Sparkles, X, CheckCircle, Flame } from 'lucide-react';
import { ScavengerEvent, LeaderboardParticipant } from '../../types';

interface EventLeaderboardModalProps {
  isOpen: boolean;
  onClose: () => void;
  event: ScavengerEvent;
  leaderboard: LeaderboardParticipant[];
  currentUsername: string;
}

export const EventLeaderboardModal: React.FC<EventLeaderboardModalProps> = ({
  isOpen,
  onClose,
  event,
  leaderboard,
  currentUsername,
}) => {
  if (!isOpen) return null;

  const totalCapsules = event.capsule_ids.length;

  const formatElapsed = (seconds?: number) => {
    if (!seconds) return '—';
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    if (hrs > 0) {
      return `${hrs}h ${mins}m ${secs}s`;
    }
    return `${mins}m ${secs}s`;
  };

  const getRankBadge = (index: number) => {
    if (index === 0) {
      return (
        <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-amber-500 to-yellow-300 text-stone-950 font-bold flex items-center justify-center text-sm shadow-[0_0_12px_rgba(245,158,11,0.6)]">
          🥇
        </div>
      );
    }
    if (index === 1) {
      return (
        <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-slate-400 to-slate-200 text-stone-950 font-bold flex items-center justify-center text-sm shadow-md">
          🥈
        </div>
      );
    }
    if (index === 2) {
      return (
        <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-amber-800 to-amber-600 text-amber-100 font-bold flex items-center justify-center text-sm shadow-md">
          🥉
        </div>
      );
    }
    return (
      <div className="w-7 h-7 rounded-full bg-stone-800 text-stone-400 font-mono font-bold flex items-center justify-center text-xs">
        #{index + 1}
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl rounded-3xl bg-gradient-to-b from-[#1a0e05] via-[#120a03] to-[#0a0502] border border-amber-500/50 shadow-[0_25px_70px_rgba(0,0,0,0.9)] p-5 sm:p-7 text-amber-100 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Glow effect */}
        <div className="absolute -top-24 -right-24 w-60 h-60 rounded-full bg-amber-500/10 blur-3xl pointer-events-none" />

        {/* Modal Header */}
        <div className="flex items-center justify-between pb-4 border-b border-amber-500/30 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-amber-600 to-yellow-400 text-stone-950 flex items-center justify-center shadow-[0_0_20px_rgba(245,158,11,0.5)]">
              <Trophy className="w-6 h-6" />
            </div>
            <div>
              <h2 className="font-serif text-lg sm:text-xl font-bold text-white tracking-tight">
                Live Hunt Leaderboard
              </h2>
              <p className="text-xs text-amber-300/70 truncate max-w-xs sm:max-w-md">
                {event.title}
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

        {/* Scoring Rule Badge */}
        <div className="mt-4 px-3.5 py-2 rounded-xl bg-amber-950/40 border border-amber-500/20 text-xs text-amber-200/80 flex items-center justify-between shrink-0">
          <span>Ranking: Total Discovered (Primary) & Speed (Secondary)</span>
          <span className="font-mono text-amber-400 font-bold">{totalCapsules} Vaults Total</span>
        </div>

        {/* Participant List */}
        <div className="mt-4 space-y-2.5 overflow-y-auto pr-1 flex-1">
          {leaderboard.map((player, idx) => {
            const isFinished = player.capsules_found >= totalCapsules && totalCapsules > 0;
            return (
              <div
                key={player.username}
                className={`flex items-center justify-between p-3 sm:p-3.5 rounded-2xl border transition-all ${
                  player.is_current_user
                    ? 'bg-amber-950/70 border-amber-400 ring-1 ring-amber-400/50 shadow-[0_0_15px_rgba(245,158,11,0.25)]'
                    : 'bg-[#1e1106]/70 border-amber-500/20 hover:border-amber-500/40'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  {getRankBadge(idx)}

                  <img
                    src={player.avatar_url || `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(player.username)}`}
                    alt={player.username}
                    className="w-9 h-9 rounded-xl bg-stone-900 border border-amber-500/40 p-0.5 shrink-0"
                  />

                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-xs sm:text-sm text-white truncate">
                        {player.username}
                      </span>
                      {player.is_current_user && (
                        <span className="px-1.5 py-0.2 rounded-full bg-amber-400 text-stone-950 text-[9px] font-bold uppercase">
                          You
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-[11px] text-amber-300/60 font-mono">
                      <Clock className="w-3 h-3 text-amber-400/70" />
                      <span>{formatElapsed(player.completion_time_seconds)}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <div className="text-right">
                    <div className="text-xs sm:text-sm font-mono font-bold text-amber-200">
                      {player.capsules_found} / {totalCapsules}
                    </div>
                    <div className="text-[10px] text-amber-400/60 uppercase font-mono">
                      {isFinished ? 'Complete' : 'Searching'}
                    </div>
                  </div>

                  {isFinished ? (
                    <div className="w-7 h-7 rounded-xl bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 flex items-center justify-center">
                      <CheckCircle className="w-4 h-4" />
                    </div>
                  ) : player.capsules_found > 0 ? (
                    <div className="w-7 h-7 rounded-xl bg-amber-500/20 border border-amber-400/40 text-amber-300 flex items-center justify-center">
                      <Flame className="w-4 h-4 text-orange-400" />
                    </div>
                  ) : (
                    <div className="w-7 h-7 rounded-xl bg-stone-900 border border-stone-800 text-stone-600 flex items-center justify-center">
                      <Sparkles className="w-3.5 h-3.5" />
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="mt-5 pt-3 border-t border-amber-500/30 flex justify-end shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-stone-950 font-bold text-xs sm:text-sm shadow-lg transition cursor-pointer"
          >
            Close Leaderboard
          </button>
        </div>
      </div>
    </div>
  );
};
