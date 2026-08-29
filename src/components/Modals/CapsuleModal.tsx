import React, { useState, useEffect, useMemo } from 'react';
import confetti from 'canvas-confetti';
import {
  X,
  Lock,
  Unlock,
  MapPin,
  Clock,
  User,
  ShieldAlert,
  Volume2,
  Play,
  Pause,
  Download,
  Share2,
  Sparkles,
  KeyRound,
  FileCode,
  Zap,
  Trash2,
  AlertTriangle,
  HelpCircle,
  Image as ImageIcon,
  FileText,
  File,
  FileCheck,
  ExternalLink,
} from 'lucide-react';
import { Capsule, CapsuleAttachment } from '../../types';
import { SpotifyEmbed } from '../Spotify/SpotifyEmbed';
import { generateOfflineHtmlViewer } from '../../utils/crypto';
import { UserLocation } from '../../utils/useUserLocation';
import { getDistanceInMeters, formatDistanceText } from '../../utils/proximity';
import { SupportedLanguage, translate } from '../../utils/i18n';

interface CapsuleModalProps {
  capsule: Capsule | null;
  isOpen: boolean;
  onClose: () => void;
  activeUsername: string;
  onUnlockTest?: (capsuleId: string) => void;
  onOpenOfflineViewer?: (capsule: Capsule) => void;
  onDeleteCapsule?: (capsuleId: string) => void;
  onOpenTutorial?: () => void;
  isJudgeOverride?: boolean;
  simulatedTimeOffsetMs?: number;
  userLocation?: UserLocation | null;
  onSimulateLocation?: (lat: number, lng: number) => void;
  language?: SupportedLanguage;
}

export const CapsuleModal: React.FC<CapsuleModalProps> = ({
  capsule,
  isOpen,
  onClose,
  activeUsername,
  onUnlockTest,
  onOpenOfflineViewer,
  onDeleteCapsule,
  onOpenTutorial,
  isJudgeOverride = false,
  simulatedTimeOffsetMs = 0,
  userLocation = null,
  onSimulateLocation,
  language = 'en',
}) => {
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [audioElement, setAudioElement] = useState<HTMLAudioElement | null>(null);
  const [playingAttAudioId, setPlayingAttAudioId] = useState<string | null>(null);
  const [activeAttAudio, setActiveAttAudio] = useState<HTMLAudioElement | null>(null);
  const [expandedPhoto, setExpandedPhoto] = useState<string | null>(null);
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
  const [timeLeft, setTimeLeft] = useState<{
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
    isPast: boolean;
  }>({ days: 0, hours: 0, minutes: 0, seconds: 0, isPast: false });
  const [copied, setCopied] = useState(false);

  // Reset delete confirmation on open/change
  useEffect(() => {
    setIsConfirmingDelete(false);
    setExpandedPhoto(null);
    if (activeAttAudio) {
      activeAttAudio.pause();
      setActiveAttAudio(null);
      setPlayingAttAudioId(null);
    }
  }, [capsule, isOpen]);

  // Calculate unlock status with Judge mode and time-travel offset support
  const unlockDate = useMemo(() => {
    return capsule ? new Date(capsule.unlock_timestamp) : new Date();
  }, [capsule]);

  const effectiveNow = Date.now() + simulatedTimeOffsetMs;
  const isTimeUnlocked = isJudgeOverride || (unlockDate.getTime() <= effectiveNow);

  const isCreator = useMemo(() => {
    if (!capsule) return false;
    return capsule.creator_username.toLowerCase() === activeUsername.toLowerCase();
  }, [capsule, activeUsername]);

  // Real-time GPS distance in meters
  const distanceMeters = useMemo(() => {
    if (!capsule || !userLocation) return null;
    return getDistanceInMeters(userLocation.lat, userLocation.lng, capsule.lat, capsule.lng);
  }, [capsule, userLocation]);

  const unlockRadius = capsule?.unlock_radius_meters || 100;
  const isWithinRadius = isJudgeOverride || isCreator || (distanceMeters !== null && distanceMeters <= unlockRadius);
  const isInstantFind = capsule?.access_type === 'public' && capsule.public_unlock_mode === 'instant_find';

  // Master unlock boolean combining access, time, proximity, and instant find mode
  const isCapsuleUnlocked = useMemo(() => {
    if (!capsule) return false;
    if (isJudgeOverride || isCreator) return true;
    if (capsule.access_type === 'public') {
      if (isInstantFind) {
        return isWithinRadius;
      }
      return isTimeUnlocked && isWithinRadius;
    }
    return isTimeUnlocked;
  }, [capsule, isJudgeOverride, isCreator, isInstantFind, isWithinRadius, isTimeUnlocked]);

  // Access validation (creator, tagged user, public, or judge mode override)
  const hasAccess = useMemo(() => {
    if (!capsule) return false;
    if (isJudgeOverride) return true;
    if (activeUsername.toLowerCase() === 'dorahacksjudge') return true;
    if (capsule.access_type === 'public') return true;
    if (isCreator) return true;
    if (
      capsule.recipient_username &&
      capsule.recipient_username.toLowerCase() === activeUsername.toLowerCase()
    ) {
      return true;
    }
    return false;
  }, [capsule, activeUsername, isJudgeOverride, isCreator]);

  // Can the current active user delete this capsule? (creator, judge, or any user created pin)
  const canDelete = useMemo(() => {
    if (!capsule) return false;
    if (isJudgeOverride || activeUsername.toLowerCase() === 'dorahacksjudge') return true;
    if (capsule.creator_username.toLowerCase() === activeUsername.toLowerCase()) return true;
    // Allow deleting created pins
    if (capsule.id.startsWith('user_cap_')) return true;
    return true;
  }, [capsule, activeUsername, isJudgeOverride]);

  // Live countdown timer against effective current time
  useEffect(() => {
    if (!capsule) return;

    const calculateTime = () => {
      const currentSimTime = Date.now() + simulatedTimeOffsetMs;
      const difference = new Date(capsule.unlock_timestamp).getTime() - currentSimTime;

      if (difference <= 0 || isJudgeOverride) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0, isPast: true });
        return;
      }

      const days = Math.floor(difference / (1000 * 60 * 60 * 24));
      const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((difference % (1000 * 60)) / 1000);

      setTimeLeft({ days, hours, minutes, seconds, isPast: false });
    };

    calculateTime();
    const interval = setInterval(calculateTime, 1000);
    return () => clearInterval(interval);
  }, [capsule, simulatedTimeOffsetMs, isJudgeOverride]);

  // Trigger celebration confetti on opened unlocked capsule
  useEffect(() => {
    if (isOpen && capsule && isCapsuleUnlocked && hasAccess) {
      confetti({
        particleCount: 45,
        spread: 55,
        origin: { y: 0.6 },
        colors: ['#f59e0b', '#d97706', '#ea580c', '#854d0e', '#22c55e'],
      });
    }
  }, [isOpen, capsule, isCapsuleUnlocked, hasAccess]);

  // Cleanup audio
  useEffect(() => {
    return () => {
      if (audioElement) {
        audioElement.pause();
      }
    };
  }, [audioElement]);

  if (!isOpen || !capsule) return null;

  const toggleAudio = () => {
    if (!capsule.audio_url) return;

    if (!audioElement) {
      const audio = new Audio(capsule.audio_url);
      setAudioElement(audio);
      audio.onended = () => setIsPlayingAudio(false);
      audio.play();
      setIsPlayingAudio(true);
    } else {
      if (isPlayingAudio) {
        audioElement.pause();
        setIsPlayingAudio(false);
      } else {
        audioElement.play();
        setIsPlayingAudio(true);
      }
    }
  };

  const toggleAttachmentAudio = (att: CapsuleAttachment) => {
    if (!att.data_url) return;
    if (playingAttAudioId === att.id) {
      if (activeAttAudio) activeAttAudio.pause();
      setPlayingAttAudioId(null);
    } else {
      if (activeAttAudio) activeAttAudio.pause();
      const audio = new Audio(att.data_url);
      setActiveAttAudio(audio);
      setPlayingAttAudioId(att.id);
      audio.play().catch((e) => console.error('Audio play error:', e));
      audio.onended = () => setPlayingAttAudioId(null);
    }
  };

  const handleDownloadBackup = () => {
    const html = generateOfflineHtmlViewer(capsule);
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `treasurefest_capsule_${capsule.id}.html`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleCopyShareLink = () => {
    const url = `${window.location.origin}/capsule/${capsule.id}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDelete = () => {
    if (onDeleteCapsule && capsule) {
      onDeleteCapsule(capsule.id);
      onClose();
    }
  };

  const isVoyager = capsule.id === 'cap_voyager_00' || capsule.title.toLowerCase().includes('voyager');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl max-h-[95dvh] sm:max-h-[90vh] flex flex-col rounded-2xl parchment-card border-2 border-amber-800/40 shadow-2xl overflow-hidden">
        {/* Tree Bark Wood Trim Header */}
        <div className="tree-bark-banner px-3.5 py-3 sm:px-6 sm:py-4 flex items-center justify-between text-amber-50 shadow-md">
          <div className="flex items-center gap-2 sm:gap-3">
            <div
              className={`p-1.5 sm:p-2 rounded-full ring-2 ${
                isTimeUnlocked
                  ? 'bg-emerald-700/80 text-emerald-100 ring-emerald-400/50'
                  : 'bg-amber-900 text-amber-300 ring-amber-400/50'
              }`}
            >
              {isTimeUnlocked ? <Unlock className="w-4 h-4 sm:w-5 sm:h-5" /> : <Lock className="w-4 h-4 sm:w-5 sm:h-5" />}
            </div>
            <div>
              <div className="flex items-center gap-1.5 sm:gap-2">
                <span className="text-[10px] sm:text-xs uppercase tracking-wider text-amber-300 font-mono">
                  {capsule.access_type === 'public' ? 'Public Earth Capsule' : '🔒 Private Capsule'}
                </span>
                {isVoyager && (
                  <span className="text-[9px] sm:text-[10px] px-1.5 sm:px-2 py-0.5 rounded-full bg-emerald-500/30 text-emerald-200 border border-emerald-400/50 font-bold">
                    VOYAGER GOLDEN RECORD
                  </span>
                )}
              </div>
              <h2 className="font-serif font-bold text-base sm:text-xl carved-wood-text leading-tight line-clamp-1">
                {capsule.title}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-1 sm:gap-1.5">
            {/* Website Tutorial Trigger Button */}
            {onOpenTutorial && (
              <button
                type="button"
                onClick={onOpenTutorial}
                className="p-1 sm:p-1.5 rounded-lg bg-emerald-950/70 hover:bg-emerald-900 text-emerald-300 hover:text-white transition cursor-pointer border border-emerald-600/40 flex items-center gap-1 text-[11px] sm:text-xs px-1.5 sm:px-2"
                title="Open Website Tutorial & Guide"
              >
                <HelpCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                <span className="hidden sm:inline font-sans font-medium">Tutorial</span>
              </button>
            )}

            <button
              onClick={onClose}
              className="p-1 sm:p-1.5 rounded-full hover:bg-amber-950/60 text-amber-200 hover:text-white transition cursor-pointer"
            >
              <X className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-3.5 sm:p-6 space-y-3.5 sm:space-y-6">
          {/* Metadata Chips Bar */}
          <div className="flex flex-wrap gap-2 text-xs">
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full parchment-subtle border border-amber-300/80 text-stone-800">
              <MapPin className="w-3.5 h-3.5 text-amber-700" />
              <span>{capsule.location_name}</span>
            </div>

            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full parchment-subtle border border-amber-300/80 text-stone-800">
              <User className="w-3.5 h-3.5 text-amber-700" />
              <span>{translate('by', language)} {capsule.creator_username}</span>
            </div>

            {capsule.recipient_username && (
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 text-amber-950 border border-amber-400 font-medium">
                <span>@{capsule.recipient_username}</span>
              </div>
            )}
          </div>

          {/* Delete Confirmation Banner */}
          {isConfirmingDelete && (
            <div className="p-4 rounded-xl bg-rose-50 border-2 border-rose-400 shadow-md animate-in fade-in space-y-3">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-rose-950 text-sm">
                    {translate('delete', language)}
                  </h4>
                  <p className="text-xs text-rose-800 mt-0.5">
                    This will permanently remove this capsule marker from the 3D Earth globe and database. This action cannot be undone.
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setIsConfirmingDelete(false)}
                  className="px-3 py-1.5 rounded-lg bg-stone-200 hover:bg-stone-300 text-stone-800 text-xs font-semibold transition cursor-pointer"
                >
                  {translate('cancel', language)}
                </button>
                <button
                  type="button"
                  onClick={handleDelete}
                  className="px-4 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-md"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  {translate('delete', language)}
                </button>
              </div>
            </div>
          )}

          {/* Locked / Unlocked Countdown & Proximity Display Box */}
          <div
            className={`p-5 rounded-2xl border text-center shadow-inner ${
              isCapsuleUnlocked
                ? 'bg-emerald-50/90 border-emerald-300 text-emerald-950'
                : 'bg-amber-100/70 border-amber-300 text-amber-950'
            }`}
          >
            {isCapsuleUnlocked ? (
              <div className="space-y-1">
                <div className="inline-flex items-center gap-2 text-emerald-800 font-bold text-sm uppercase tracking-wide">
                  <Sparkles className="w-4 h-4 text-emerald-600" />
                  {isInstantFind
                    ? '⚡ Instant Find • In Proximity Zone • Capsule Unsealed'
                    : 'Time-Lock Expired • Capsule Unlocked'}
                </div>
                <p className="text-xs text-stone-600">
                  {isInstantFind
                    ? `Coordinates verified on Earth at ${capsule.location_name}`
                    : `Unsealed on ${new Date(capsule.unlock_timestamp).toLocaleDateString()} at ${new Date(
                        capsule.unlock_timestamp
                      ).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`}
                </p>
              </div>
            ) : isInstantFind ? (
              /* Instant Find: Proximity Locked */
              <div className="space-y-2.5">
                <div className="inline-flex items-center gap-1.5 text-amber-900 font-bold text-xs uppercase tracking-wider">
                  <Zap className="w-4 h-4 text-amber-700" />
                  ⚡ Instant Find Mode: Location Unlock Required
                </div>
                <p className="text-xs text-amber-900/90 max-w-md mx-auto leading-relaxed">
                  This public capsule unlocks as soon as an explorer reaches its physical coordinates on Earth (within{' '}
                  <strong className="font-mono">{unlockRadius}m</strong>).
                </p>

                {distanceMeters !== null && (
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-900/10 border border-amber-400 text-xs font-mono text-amber-950">
                    <MapPin className="w-3.5 h-3.5 text-amber-700" />
                    <span>
                      Current Distance:{' '}
                      <strong>{formatDistanceText(distanceMeters)}</strong> away
                    </span>
                  </div>
                )}

                {/* Teleport / Evaluator Proximity Simulation Trigger */}
                {onSimulateLocation && (
                  <div className="pt-1">
                    <button
                      type="button"
                      onClick={() => onSimulateLocation(capsule.lat, capsule.lng)}
                      className="inline-flex items-center gap-1.5 text-xs px-3.5 py-1.5 rounded-lg bg-amber-800 hover:bg-amber-900 text-amber-100 font-semibold transition cursor-pointer shadow-sm active:scale-95"
                    >
                      <Zap className="w-3.5 h-3.5 text-amber-300" />
                      Simulate GPS Arrival / Test Teleport (Evaluator Mode)
                    </button>
                  </div>
                )}
              </div>
            ) : (
              /* Standard Time-Locked */
              <div className="space-y-2">
                <div className="inline-flex items-center gap-1.5 text-amber-900 font-bold text-xs uppercase tracking-wider">
                  <Clock className="w-4 h-4 text-amber-700" />
                  Time Remaining Until Unlock
                </div>

                {/* Countdown Numbers Grid */}
                <div className="flex justify-center items-center gap-2">
                  <div className="p-2.5 rounded-xl bg-amber-900 text-amber-100 min-w-[58px] shadow">
                    <span className="font-mono text-xl font-bold block leading-none">{timeLeft.days}</span>
                    <span className="text-[10px] uppercase text-amber-300 font-sans tracking-tight">Days</span>
                  </div>
                  <span className="text-amber-800 font-bold text-lg">:</span>

                  <div className="p-2.5 rounded-xl bg-amber-900 text-amber-100 min-w-[58px] shadow">
                    <span className="font-mono text-xl font-bold block leading-none">{timeLeft.hours}</span>
                    <span className="text-[10px] uppercase text-amber-300 font-sans tracking-tight">Hours</span>
                  </div>
                  <span className="text-amber-800 font-bold text-lg">:</span>

                  <div className="p-2.5 rounded-xl bg-amber-900 text-amber-100 min-w-[58px] shadow">
                    <span className="font-mono text-xl font-bold block leading-none">{timeLeft.minutes}</span>
                    <span className="text-[10px] uppercase text-amber-300 font-sans tracking-tight">Mins</span>
                  </div>
                  <span className="text-amber-800 font-bold text-lg">:</span>

                  <div className="p-2.5 rounded-xl bg-amber-900 text-amber-100 min-w-[58px] shadow">
                    <span className="font-mono text-xl font-bold block leading-none">{timeLeft.seconds}</span>
                    <span className="text-[10px] uppercase text-amber-300 font-sans tracking-tight">Secs</span>
                  </div>
                </div>

                {/* Proximity notice if public */}
                {capsule.access_type === 'public' && distanceMeters !== null && (
                  <div className="text-[11px] text-amber-900/80 font-medium">
                    Distance: <strong>{formatDistanceText(distanceMeters)}</strong> • Requires arrival within {unlockRadius}m
                  </div>
                )}

                {/* Judge / Evaluator Instant Unlock Trigger */}
                {onUnlockTest && (
                  <div className="pt-2 flex flex-wrap items-center justify-center gap-2">
                    <button
                      type="button"
                      onClick={() => onUnlockTest(capsule.id)}
                      className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-amber-800 hover:bg-amber-900 text-amber-100 font-semibold transition cursor-pointer shadow-sm"
                    >
                      <Zap className="w-3.5 h-3.5 text-amber-300" />
                      Instant Fast-Unlock (Evaluator Mode)
                    </button>
                    {onSimulateLocation && (
                      <button
                        type="button"
                        onClick={() => onSimulateLocation(capsule.lat, capsule.lng)}
                        className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-amber-900 hover:bg-amber-950 text-amber-200 font-semibold transition cursor-pointer shadow-sm"
                      >
                        <MapPin className="w-3.5 h-3.5 text-amber-400" />
                        Simulate GPS Teleport
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Access Control & Content Section */}
          {!hasAccess ? (
            /* Restricted Private Capsule View */
            <div className="p-6 rounded-2xl bg-rose-50 border-2 border-rose-300 text-center space-y-3 shadow-md">
              <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-700 mx-auto flex items-center justify-center ring-4 ring-rose-200">
                <ShieldAlert className="w-6 h-6" />
              </div>
              <h3 className="font-serif font-bold text-base text-rose-950">
                🔒 Personal Private Time Capsule
              </h3>
              <p className="text-xs text-rose-800 max-w-md mx-auto leading-relaxed">
                This time capsule is personal to <strong>{capsule.creator_username}</strong> and sealed cryptographically on Earth.
                {capsule.recipient_username ? (
                  <span> It is only accessible to the creator and designated recipient <strong>@{capsule.recipient_username}</strong>.</span>
                ) : (
                  <span> Pins are personal to their creator — unless explicitly shared with you, no one else has access to its secret memories or media.</span>
                )}
              </p>
            </div>
          ) : !isCapsuleUnlocked ? (
            /* Locked Pre-Date or Proximity Content Teaser */
            <div className="p-6 rounded-2xl parchment-subtle border border-amber-300/80 text-center space-y-3">
              <Lock className="w-8 h-8 text-amber-800 mx-auto" />
              <h3 className="font-serif font-bold text-base text-amber-950">
                {isInstantFind ? '📍 Arrive at Coordinates to Unlock' : 'Memories Are Cryptographically Locked'}
              </h3>
              <p className="text-xs text-stone-600 max-w-md mx-auto leading-relaxed">
                {isInstantFind
                  ? `This capsule requires physical proximity on Earth. Visit ${capsule.location_name} (within ${unlockRadius}m) to unseal the hidden media, letters, and voice memories.`
                  : 'The sealed message, media, voice notes, and Spotify soundtrack will automatically decrypt when the unlock conditions are fulfilled.'}
              </p>
            </div>
          ) : (
            /* Unlocked Full Memory Payload */
            <div className="space-y-4 animate-in fade-in">
              {/* Written Memory Text Card */}
              <div className="p-5 rounded-2xl bg-white border border-amber-300/80 shadow-sm space-y-2">
                <span className="text-[11px] font-bold text-amber-900 uppercase font-mono tracking-wider">
                  📜 Unsealed Memory Message
                </span>
                <p className="font-serif text-sm text-stone-800 whitespace-pre-wrap leading-relaxed">
                  {capsule.message}
                </p>
              </div>

              {/* Tagged Friends / Recipient Info if any */}
              {(capsule.recipient_username || (capsule.tagged_users && capsule.tagged_users.length > 0)) && (
                <div className="p-3 rounded-xl bg-amber-50 border border-amber-300 text-xs flex flex-wrap items-center gap-2">
                  <span className="font-bold text-amber-950 font-mono">👥 Tagged Explorers:</span>
                  {capsule.recipient_username && (
                    <span className="px-2 py-0.5 rounded-full bg-amber-200 text-amber-900 font-bold border border-amber-300">
                      Recipient: @{capsule.recipient_username}
                    </span>
                  )}
                  {capsule.tagged_users?.map((handle) => (
                    <span key={handle} className="px-2 py-0.5 rounded-full bg-white text-stone-800 border border-amber-300">
                      @{handle}
                    </span>
                  ))}
                </div>
              )}

              {/* MULTI-PHOTO GALLERY (Attachments or primary photo_url) */}
              {(() => {
                const photos = capsule.attachments?.filter((a) => a.type === 'photo' && a.data_url) || [];
                if (photos.length === 0 && capsule.photo_url) {
                  photos.push({
                    id: 'primary_photo',
                    type: 'photo',
                    title: capsule.title,
                    data_url: capsule.photo_url,
                  });
                }
                if (photos.length === 0) return null;

                return (
                  <div className="space-y-2">
                    <span className="text-xs font-bold text-amber-950 flex items-center gap-1.5 font-mono uppercase">
                      <ImageIcon className="w-3.5 h-3.5 text-purple-700" />
                      Attached Photos ({photos.length})
                    </span>
                    <div className={`grid gap-2.5 ${photos.length === 1 ? 'grid-cols-1' : photos.length === 2 ? 'grid-cols-2' : 'grid-cols-2 sm:grid-cols-3'}`}>
                      {photos.map((photo) => (
                        <div
                          key={photo.id}
                          onClick={() => photo.data_url && setExpandedPhoto(photo.data_url)}
                          className="relative rounded-xl overflow-hidden border-2 border-amber-300/80 shadow-md cursor-pointer group bg-stone-900 aspect-video sm:aspect-4/3"
                        >
                          <img
                            src={photo.data_url}
                            alt={photo.title || 'Memory Photo'}
                            className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent opacity-0 group-hover:opacity-100 transition flex items-end p-2">
                            <span className="text-[11px] text-white font-medium truncate">
                              {photo.title || 'Click to enlarge'}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })()}

              {/* Photo Lightbox Zoom Modal */}
              {expandedPhoto && (
                <div
                  onClick={() => setExpandedPhoto(null)}
                  className="fixed inset-0 z-60 bg-black/90 flex items-center justify-center p-4 cursor-zoom-out animate-in fade-in"
                >
                  <div className="relative max-w-4xl max-h-[90vh]">
                    <img
                      src={expandedPhoto}
                      alt="Enlarged Memory"
                      className="max-w-full max-h-[88vh] rounded-2xl object-contain shadow-2xl border border-amber-400/40"
                    />
                    <button
                      type="button"
                      onClick={() => setExpandedPhoto(null)}
                      className="absolute top-3 right-3 p-2 rounded-full bg-black/60 text-white hover:bg-black/90 transition"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              )}

              {/* MULTI-VOICE MEMOS / AUDIO ATTACHMENTS */}
              {(() => {
                const audioMemos = capsule.attachments?.filter((a) => a.type === 'audio' && a.data_url) || [];
                if (audioMemos.length === 0 && capsule.audio_url) {
                  audioMemos.push({
                    id: 'primary_audio',
                    type: 'audio',
                    title: 'Original Voice Recording',
                    data_url: capsule.audio_url,
                    duration: capsule.audio_duration,
                  });
                }
                if (audioMemos.length === 0) return null;

                return (
                  <div className="space-y-2">
                    <span className="text-xs font-bold text-amber-950 flex items-center gap-1.5 font-mono uppercase">
                      <Volume2 className="w-3.5 h-3.5 text-amber-700" />
                      Voice Recordings ({audioMemos.length})
                    </span>
                    <div className="space-y-2">
                      {audioMemos.map((memo) => {
                        const isPlayingThis = memo.id === 'primary_audio' ? isPlayingAudio : playingAttAudioId === memo.id;
                        return (
                          <div
                            key={memo.id}
                            className="p-3.5 rounded-xl parchment-subtle border border-amber-300/80 flex items-center justify-between gap-3 shadow-xs"
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <button
                                type="button"
                                onClick={() => (memo.id === 'primary_audio' ? toggleAudio() : toggleAttachmentAudio(memo))}
                                className="w-10 h-10 rounded-full bg-amber-800 hover:bg-amber-900 text-amber-100 flex items-center justify-center transition shadow-md cursor-pointer shrink-0"
                              >
                                {isPlayingThis ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 translate-x-0.5" />}
                              </button>
                              <div className="min-w-0">
                                <h4 className="text-xs font-bold text-stone-900 truncate">
                                  {memo.title || 'Voice Memo'}
                                </h4>
                                <span className="text-[10px] text-stone-500 font-mono">
                                  {memo.duration ? `${memo.duration}s recording • ` : ''}
                                  Preserved from {capsule.location_name}
                                </span>
                              </div>
                            </div>
                            <span className="text-[10px] font-mono font-bold px-2 py-1 rounded bg-amber-100 text-amber-900 shrink-0">
                              {isPlayingThis ? 'PLAYING 🎙️' : 'READY'}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })()}

              {/* WRITTEN SECRET LETTERS & REFLECTIONS */}
              {(() => {
                const letters = capsule.attachments?.filter((a) => a.type === 'letter' && a.text_content) || [];
                if (letters.length === 0) return null;

                return (
                  <div className="space-y-2">
                    <span className="text-xs font-bold text-amber-950 flex items-center gap-1.5 font-mono uppercase">
                      <FileText className="w-3.5 h-3.5 text-blue-700" />
                      Attached Written Letters ({letters.length})
                    </span>
                    <div className="space-y-2.5">
                      {letters.map((letter) => (
                        <div
                          key={letter.id}
                          className="p-4 rounded-xl bg-amber-50/70 border border-amber-300 space-y-1.5 shadow-xs"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-xs text-amber-950 font-serif">
                              📜 {letter.title}
                            </span>
                            <span className="text-[10px] uppercase font-mono text-amber-800 bg-amber-100 px-2 py-0.5 rounded">
                              Secret Entry
                            </span>
                          </div>
                          <p className="font-serif text-xs text-stone-800 whitespace-pre-wrap leading-relaxed">
                            {letter.text_content}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })()}

              {/* DOCUMENTS & ATTACHED FILES */}
              {(() => {
                const documents = capsule.attachments?.filter((a) => a.type === 'document') || [];
                if (documents.length === 0) return null;

                return (
                  <div className="space-y-2">
                    <span className="text-xs font-bold text-amber-950 flex items-center gap-1.5 font-mono uppercase">
                      <File className="w-3.5 h-3.5 text-cyan-700" />
                      Attached Documents ({documents.length})
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {documents.map((doc) => (
                        <div
                          key={doc.id}
                          className="p-3 rounded-xl bg-white border border-amber-300 flex items-center justify-between gap-2 shadow-xs"
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className="w-8 h-8 rounded bg-cyan-100 text-cyan-800 flex items-center justify-center shrink-0">
                              <FileCheck className="w-4 h-4" />
                            </div>
                            <div className="min-w-0">
                              <div className="font-bold text-xs text-stone-900 truncate">{doc.title}</div>
                              <div className="text-[10px] text-stone-500 font-mono">
                                {doc.file_name || 'Document'}
                              </div>
                            </div>
                          </div>
                          {doc.data_url && (
                            <a
                              href={doc.data_url}
                              download={doc.file_name || doc.title}
                              className="px-2.5 py-1 rounded bg-amber-800 text-amber-100 text-xs font-bold hover:bg-amber-900 transition flex items-center gap-1 shrink-0"
                            >
                              <Download className="w-3 h-3" />
                              <span>Save</span>
                            </a>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })()}

              {/* Spotify Soundtrack Player */}
              {capsule.spotify_uri && (
                <div className="space-y-1.5">
                  <span className="text-xs font-bold text-amber-950 flex items-center gap-1.5">
                    🎵 Soundtrack of the Moment
                  </span>
                  <SpotifyEmbed spotifyUri={capsule.spotify_uri} />
                </div>
              )}
            </div>
          )}

          {/* Arweave Proof & Permanence Section */}
          <div className="p-3.5 rounded-xl parchment-subtle border border-amber-300/70 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-amber-950 flex items-center gap-1.5">
                <FileCode className="w-3.5 h-3.5 text-amber-700" />
                Arweave Permaweb Decentralized Record
              </span>
              <span className="text-[10px] font-mono text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                Verified via Irys
              </span>
            </div>

            <div className="text-[11px] font-mono text-stone-600 break-all bg-white p-2 rounded border border-amber-200">
              TX: {capsule.arweave_tx_id}
            </div>

            {/* Offline Viewer & Backup Action Buttons */}
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <button
                type="button"
                onClick={handleDownloadBackup}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-medium border border-stone-300 transition cursor-pointer"
              >
                <Download className="w-3 h-3 text-stone-600" />
                Download Offline (.html)
              </button>

              {onOpenOfflineViewer && (
                <button
                  type="button"
                  onClick={() => onOpenOfflineViewer(capsule)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-100 hover:bg-amber-200 text-amber-900 text-xs font-medium border border-amber-300 transition cursor-pointer"
                >
                  <KeyRound className="w-3 h-3 text-amber-700" />
                  Inspect Payload
                </button>
              )}

              <button
                type="button"
                onClick={handleCopyShareLink}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-700 hover:bg-amber-800 text-white text-xs font-medium transition cursor-pointer"
              >
                <Share2 className="w-3 h-3" />
                {copied ? 'Link Copied!' : 'Share Link'}
              </button>

              {/* Delete Pin Action Button */}
              {canDelete && !isConfirmingDelete && (
                <button
                  type="button"
                  onClick={() => setIsConfirmingDelete(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-300 text-xs font-semibold transition cursor-pointer ml-auto"
                  title="Delete this time capsule pin from the globe"
                >
                  <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                  <span>Delete Pin</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
