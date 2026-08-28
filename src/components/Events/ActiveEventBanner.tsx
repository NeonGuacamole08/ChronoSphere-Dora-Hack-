import React, { useState, useEffect } from 'react';
import { Trophy, Clock, Sparkles, HelpCircle, X, ChevronRight, CheckCircle2 } from 'lucide-react';
import { ScavengerEvent, Capsule } from '../../types';

interface ActiveEventBannerProps {
  event: ScavengerEvent;
  capsules: Capsule[];
  userDiscoveredCount: number;
  onOpenLeaderboard: () => void;
  onOpenHints: () => void;
  onExitHunt: () => void;
  onOpenMissionControl?: () => void;
  isOwner?: boolean;
}

export const ActiveEventBanner: React.FC<ActiveEventBannerProps> = ({
  event,
  capsules,
  userDiscoveredCount,
  onOpenLeaderboard,
  onOpenHints,
  onExitHunt,
  onOpenMissionControl,
  isOwner = false,
}) => {
  const [timeLeftStr, setTimeLeftStr] = useState<string>('');
  const totalCapsules = event.capsule_ids.length;
  const isCompleted = userDiscoveredCount >= totalCapsules && totalCapsules > 0;

  useEffect(() => {
    const updateCountdown = () => {
      const end = new Date(event.end_timestamp).getTime();
      const now = Date.now();
      const diff = end - now;

      if (diff <= 0) {
        setTimeLeftStr('Ended');
        return;
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
      const minutes = Math.floor((diff / (1000 * 60)) % 60);
      const seconds = Math.floor((diff / 1000) % 60);

      if (days > 0) {
        setTimeLeftStr(`${days}d ${hours.toString().padStart(2, '0')}h ${minutes.toString().padStart(2, '0')}m`);
      } else {
        setTimeLeftStr(
          `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds
            .toString()
            .padStart(2, '0')}`
        );
      }
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [event.end_timestamp]);

  const hintsCount = event.hints_broadcasted?.length || 0;

  return (
    <div
      id="active-event-countdown-banner"
      className="fixed top-14 sm:top-16 left-0 right-0 z-30 pointer-events-auto px-2.5 sm:px-4 pt-1.5 pb-1 flex justify-center animate-in slide-in-from-top-3 duration-300"
    >
      <div className="w-full max-w-5xl rounded-2xl bg-gradient-to-r from-[#1c0f05]/95 via-[#2b170a]/95 to-[#1c0f05]/95 border border-amber-500/60 shadow-[0_10px_35px_rgba(0,0,0,0.8)] backdrop-blur-xl px-3 sm:px-5 py-2 sm:py-2.5 flex flex-wrap items-center justify-between gap-2.5 sm:gap-4 text-amber-100">
        {/* Event Title & Mode */}
        <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-tr from-amber-600 to-amber-400 text-stone-950 flex items-center justify-center font-bold shadow-[0_0_15px_rgba(245,158,11,0.5)] shrink-0">
            <Trophy className="w-5 h-5" />
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="px-1.5 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 text-[9px] sm:text-[10px] font-mono font-bold uppercase tracking-wider">
                {event.is_public ? 'Global Public Hunt' : 'Private Party Hunt'}
              </span>
              <span className="text-[10px] sm:text-xs text-amber-300/70 font-mono hidden md:inline">
                Host: {event.creator_username}
              </span>
            </div>

            <h3 className="font-serif font-bold text-xs sm:text-sm text-white truncate max-w-xs sm:max-w-md">
              {event.title}
            </h3>
          </div>
        </div>

        {/* Progress & Live Timer */}
        <div className="flex items-center gap-3 sm:gap-5 shrink-0">
          {/* Found Count */}
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-black/40 border border-amber-500/30">
            {isCompleted ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            ) : (
              <Sparkles className="w-4 h-4 text-amber-400 shrink-0 animate-pulse" />
            )}
            <span className="text-[11px] sm:text-xs font-mono font-bold">
              <span className={isCompleted ? 'text-emerald-300' : 'text-amber-300'}>
                {userDiscoveredCount}
              </span>
              <span className="text-amber-400/60"> / {totalCapsules} Found</span>
            </span>
          </div>

          {/* Countdown Clock */}
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-amber-950/60 border border-amber-500/40 text-amber-200">
            <Clock className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
            <span className="text-[11px] sm:text-xs font-mono font-bold tracking-wider">
              {timeLeftStr || 'Calculating...'}
            </span>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0 ml-auto sm:ml-0">
          {/* Hints Button */}
          <button
            type="button"
            onClick={onOpenHints}
            className="relative px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-xl bg-amber-950/70 hover:bg-amber-900 border border-amber-500/40 text-amber-200 text-xs font-bold transition flex items-center gap-1 cursor-pointer"
            title="View hints broadcasted by host"
          >
            <HelpCircle className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden sm:inline">Hints</span>
            {hintsCount > 0 && (
              <span className="w-4 h-4 rounded-full bg-amber-400 text-stone-950 text-[10px] font-mono font-bold flex items-center justify-center">
                {hintsCount}
              </span>
            )}
          </button>

          {/* Leaderboard Button */}
          <button
            type="button"
            onClick={onOpenLeaderboard}
            className="px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 text-xs font-bold transition flex items-center gap-1 cursor-pointer shadow-md"
            title="Open Live Leaderboard"
          >
            <Trophy className="w-3.5 h-3.5 text-stone-950" />
            <span className="hidden sm:inline">Leaderboard</span>
          </button>

          {/* Mission Control Button (if creator or test mode) */}
          {onOpenMissionControl && (
            <button
              type="button"
              onClick={onOpenMissionControl}
              className="px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-xl bg-cyan-950/80 hover:bg-cyan-900 border border-cyan-400 text-cyan-200 text-xs font-bold transition flex items-center gap-1 cursor-pointer"
              title="Open Event Owner Mission Control"
            >
              <span className="text-[11px]">⚡ Mission Control</span>
            </button>
          )}

          {/* Exit Hunt */}
          <button
            type="button"
            onClick={onExitHunt}
            className="p-1 sm:p-1.5 rounded-xl bg-black/40 hover:bg-red-950/80 text-stone-400 hover:text-red-300 border border-stone-700/60 hover:border-red-500/50 transition cursor-pointer"
            title="Leave this Scavenger Hunt"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
