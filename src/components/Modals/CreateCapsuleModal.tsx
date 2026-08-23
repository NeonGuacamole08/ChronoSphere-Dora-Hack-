import React, { useState, useEffect } from 'react';
import {
  X,
  MapPin,
  Calendar,
  Lock,
  Globe2,
  Image as ImageIcon,
  ShieldCheck,
  Sparkles,
  User,
  Key,
  Share2,
  Mic,
  Music,
  FileText,
  ArrowLeft,
  CheckCircle2,
  Bookmark,
} from 'lucide-react';
import { Capsule, Coordinates } from '../../types';
import { VoiceRecorder } from '../Audio/VoiceRecorder';
import { SpotifyEmbed } from '../Spotify/SpotifyEmbed';
import { generateArweaveTxId } from '../../utils/crypto';
import { AppUser } from '../../utils/supabase';
import { getCountryCodeFromCoordinates } from '../../utils/countries';

interface CreateCapsuleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveCapsule: (capsule: Capsule) => void;
  onSaveDraft?: (draftCapsule: Capsule) => void;
  draftToEdit?: Capsule | null;
  initialCoords?: Coordinates | null;
  activeUsername: string;
  currentUser?: AppUser | null;
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

export const CreateCapsuleModal: React.FC<CreateCapsuleModalProps> = ({
  isOpen,
  onClose,
  onSaveCapsule,
  onSaveDraft,
  draftToEdit,
  initialCoords,
  activeUsername,
  currentUser,
}) => {
  const [step, setStep] = useState<'form' | 'confirm'>('form');

  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [lat, setLat] = useState<number>(initialCoords?.lat ?? 35.6762);
  const [lng, setLng] = useState<number>(initialCoords?.lng ?? 139.6503);
  const [locationName, setLocationName] = useState(
    initialCoords?.name || initialCoords?.country || 'Earth Coordinates'
  );
  const [countryName, setCountryName] = useState(initialCoords?.country || 'Global');
  const [countryCode, setCountryCode] = useState('US');

  // Access Control: Default to 'private' (Personal to User)
  const [accessType, setAccessType] = useState<'public' | 'private'>('private');
  const [recipientUsername, setRecipientUsername] = useState('');
  const [recipientEmail, setRecipientEmail] = useState('');
  const [unlockDate, setUnlockDate] = useState(() => {
    const d = new Date();
    d.setFullYear(d.getFullYear() + 1); // Default to +1 year in future
    return d.toISOString().slice(0, 16);
  });

  // Media
  const [photoUrl, setPhotoUrl] = useState('');
  const [audioData, setAudioData] = useState<{ url: string; duration: number } | null>(null);
  const [spotifyTrack, setSpotifyTrack] = useState<{
    uri: string;
    id: string;
    title: string;
    artist: string;
  } | null>(null);

  // Synchronize coordinates and reset or populate form fields whenever modal opens
  useEffect(() => {
    if (isOpen) {
      setStep('form');

      if (draftToEdit) {
        // Load draft contents
        setTitle(draftToEdit.title || '');
        setMessage(draftToEdit.message || '');
        setPhotoUrl(draftToEdit.photo_url || '');
        setAudioData(
          draftToEdit.audio_url
            ? { url: draftToEdit.audio_url, duration: draftToEdit.audio_duration || 0 }
            : null
        );
        setSpotifyTrack(
          draftToEdit.spotify_uri
            ? {
                uri: draftToEdit.spotify_uri,
                id: draftToEdit.spotify_track_id || '',
                title: draftToEdit.spotify_title || '',
                artist: draftToEdit.spotify_artist || '',
              }
            : null
        );
        setAccessType(draftToEdit.access_type || 'private');
        setRecipientUsername(draftToEdit.recipient_username || '');
        setRecipientEmail(draftToEdit.recipient_email || '');
        setUnlockDate(
          draftToEdit.unlock_timestamp
            ? draftToEdit.unlock_timestamp.slice(0, 16)
            : new Date(Date.now() + 31536000000).toISOString().slice(0, 16)
        );
        setLat(draftToEdit.lat);
        setLng(draftToEdit.lng);
        setLocationName(draftToEdit.location_name);
        setCountryName(draftToEdit.country_name);
        setCountryCode(draftToEdit.country_code || 'US');
      } else {
        // Reset fresh
        setTitle('');
        setMessage('');
        setPhotoUrl('');
        setAudioData(null);
        setSpotifyTrack(null);
        setAccessType('private');
        setRecipientUsername('');
        setRecipientEmail('');

        // Reset default unlock date to +1 year
        const d = new Date();
        d.setFullYear(d.getFullYear() + 1);
        setUnlockDate(d.toISOString().slice(0, 16));

        if (initialCoords) {
          setLat(initialCoords.lat);
          setLng(initialCoords.lng);
          setLocationName(
            initialCoords.name ||
              initialCoords.country ||
              `Lat: ${initialCoords.lat.toFixed(2)}°, Lng: ${initialCoords.lng.toFixed(2)}°`
          );
          setCountryName(initialCoords.country || 'Global');

          const { countryCode: detectedCode } = getCountryCodeFromCoordinates(
            initialCoords.lat,
            initialCoords.lng
          );
          setCountryCode(detectedCode || 'GL');
        } else {
          setLat(35.6762);
          setLng(139.6503);
          setLocationName('Tokyo, Japan');
          setCountryName('Japan');
          setCountryCode('JP');
        }
      }
    }
  }, [isOpen, initialCoords, draftToEdit]);

  if (!isOpen) return null;

  // Preset Date Buttons
  const setPresetDate = (type: 'hour' | 'week' | 'month' | 'year' | 'decade') => {
    const now = new Date();
    if (type === 'hour') now.setHours(now.getHours() + 1);
    else if (type === 'week') now.setDate(now.getDate() + 7);
    else if (type === 'month') now.setMonth(now.getMonth() + 1);
    else if (type === 'year') now.setFullYear(now.getFullYear() + 1);
    else if (type === 'decade') now.setFullYear(now.getFullYear() + 10);
    setUnlockDate(now.toISOString().slice(0, 16));
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Step 1 Save as In-Progress Draft in My Vault
  const handleSaveAsDraft = () => {
    const finalLat = Number(Number(lat).toFixed(4));
    const finalLng = Number(Number(lng).toFixed(4));
    const userHandle = currentUser?.username || activeUsername || '@earth_explorer';
    const userEmail = currentUser?.email || 'explorer@earth.org';
    const draftId =
      draftToEdit?.id || `draft_cap_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;

    const draftCapsule: Capsule = {
      id: draftId,
      title: title.trim() || `Draft Memory (${locationName || 'Earth Coordinates'})`,
      message: message.trim(),
      created_at: draftToEdit?.created_at || new Date().toISOString(),
      unlock_timestamp: new Date(unlockDate).toISOString(),
      lat: finalLat,
      lng: finalLng,
      location_name: locationName.trim() || `Earth Point (${finalLat}°, ${finalLng}°)`,
      country_code: countryCode.toUpperCase() || 'GL',
      country_name: countryName.trim() || 'Global',
      creator_username: userHandle,
      creator_email: userEmail,
      access_type: accessType,
      recipient_username:
        accessType === 'private' && recipientUsername.trim()
          ? recipientUsername.trim()
          : undefined,
      recipient_email:
        accessType === 'private' && recipientEmail.trim()
          ? recipientEmail.trim()
          : undefined,
      photo_url: photoUrl || undefined,
      audio_url: audioData?.url || undefined,
      audio_duration: audioData?.duration,
      spotify_uri: spotifyTrack?.uri,
      spotify_track_id: spotifyTrack?.id,
      spotify_title: spotifyTrack?.title,
      spotify_artist: spotifyTrack?.artist,
      arweave_tx_id: draftToEdit?.arweave_tx_id || generateArweaveTxId(),
      encryption_signature: `sig_ed25519_${Math.random().toString(16).slice(2, 10)}`,
      is_encrypted: false,
      is_draft: true,
      notified: false,
      tags: ['draft', 'in-progress', 'memory'],
    };

    if (onSaveDraft) {
      onSaveDraft(draftCapsule);
    } else {
      onSaveCapsule(draftCapsule);
    }
    onClose();
  };

  // Step 1 -> Step 2 transition on "Lock Capsule"
  const handleProceedToLock = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !message.trim()) return;
    setStep('confirm');
  };

  // Step 2 final "Bury Capsule" confirmation
  const handleFinalBury = () => {
    const txId = generateArweaveTxId();
    const finalLat = Number(Number(lat).toFixed(4));
    const finalLng = Number(Number(lng).toFixed(4));
    const userHandle = currentUser?.username || activeUsername || '@earth_explorer';
    const userEmail = currentUser?.email || 'explorer@earth.org';
    const capId =
      draftToEdit && !draftToEdit.id.startsWith('draft_')
        ? draftToEdit.id
        : `user_cap_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;

    const newCapsule: Capsule = {
      id: capId,
      title: title.trim(),
      message: message.trim(),
      created_at: draftToEdit?.created_at || new Date().toISOString(),
      unlock_timestamp: new Date(unlockDate).toISOString(),
      lat: finalLat,
      lng: finalLng,
      location_name: locationName.trim() || `Earth Point (${finalLat}°, ${finalLng}°)`,
      country_code: countryCode.toUpperCase() || 'GL',
      country_name: countryName.trim() || 'Global',
      creator_username: userHandle,
      creator_email: userEmail,
      access_type: accessType,
      recipient_username:
        accessType === 'private' && recipientUsername.trim()
          ? recipientUsername.trim()
          : undefined,
      recipient_email:
        accessType === 'private' && recipientEmail.trim()
          ? recipientEmail.trim()
          : undefined,
      photo_url: photoUrl || undefined,
      audio_url: audioData?.url || undefined,
      audio_duration: audioData?.duration,
      spotify_uri: spotifyTrack?.uri,
      spotify_track_id: spotifyTrack?.id,
      spotify_title: spotifyTrack?.title,
      spotify_artist: spotifyTrack?.artist,
      arweave_tx_id: txId,
      encryption_signature: `sig_ed25519_${Math.random().toString(16).slice(2, 10)}`,
      is_encrypted: new Date(unlockDate).getTime() > Date.now(),
      is_draft: false,
      notified: false,
      tags: ['personal', 'memory', 'time-capsule'],
    };

    onSaveCapsule(newCapsule);
    onClose();
  };

  // Calculate items manifest summary
  const itemsCount = {
    photos: photoUrl ? 1 : 0,
    voiceNotes: audioData?.url ? 1 : 0,
    spotifyTracks: spotifyTrack?.uri ? 1 : 0,
    messageWords: message.trim().split(/\s+/).filter(Boolean).length,
  };

  const unlockDateObj = new Date(unlockDate);
  const formattedUnlockDate = unlockDateObj.toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl max-h-[95dvh] sm:max-h-[90vh] flex flex-col rounded-2xl parchment-card border-2 border-amber-800/40 shadow-2xl overflow-hidden">
        {/* Wood Header */}
        <div className="wood-trim px-3.5 py-3 sm:px-6 sm:py-4 flex items-center justify-between text-amber-50 shadow-md shrink-0">
          <div className="flex items-center gap-2 sm:gap-2.5">
            <span className="wax-seal w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-white font-serif font-black text-xs sm:text-sm ring-2 ring-amber-300/40">
              TF
            </span>
            <div>
              <h2 className="font-serif font-bold text-sm sm:text-lg text-amber-100 leading-none">
                {step === 'confirm'
                  ? 'Confirm Burial & Time-Lock'
                  : 'Plant a New Earth Time Capsule'}
              </h2>
              <span className="text-[9px] sm:text-[11px] text-amber-300/80">
                {step === 'confirm'
                  ? 'Review attached memories before sealing into Earth'
                  : 'Sealed Cryptographically & Anchored to Arweave'}
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1 sm:p-1.5 rounded-full hover:bg-amber-950/60 text-amber-200 hover:text-white transition cursor-pointer"
          >
            <X className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        </div>

        {/* STEP 1: Main Form */}
        {step === 'form' && (
          <form
            onSubmit={handleProceedToLock}
            className="flex-1 overflow-y-auto p-3.5 sm:p-6 space-y-3.5 sm:space-y-5"
          >
            {/* Title & Story */}
            <div className="space-y-3 sm:space-y-4">
              <div>
                <label className="block text-[10px] sm:text-xs font-bold text-amber-950 uppercase tracking-wider mb-1">
                  Capsule Title
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g., Midnight Promise under the Tuscan Stars"
                  className="w-full text-xs sm:text-sm font-medium px-3 sm:px-3.5 py-2 sm:py-2.5 rounded-xl bg-white border border-amber-300 focus:outline-none focus:ring-2 focus:ring-amber-600 text-stone-900 placeholder:text-stone-400 shadow-xs"
                />
              </div>

              <div>
                <label className="block text-[10px] sm:text-xs font-bold text-amber-950 uppercase tracking-wider mb-1">
                  Memory Text & Secret Letter
                </label>
                <textarea
                  required
                  rows={3}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Write your heartfelt story, future message, coordinates secret, or time reflection..."
                  className="w-full text-[11px] sm:text-xs leading-relaxed px-3 sm:px-3.5 py-2 sm:py-2.5 rounded-xl bg-white border border-amber-300 focus:outline-none focus:ring-2 focus:ring-amber-600 text-stone-900 placeholder:text-stone-400 shadow-xs"
                />
              </div>
            </div>

            {/* Coordinates & Location */}
            <div className="p-3 sm:p-3.5 rounded-xl parchment-subtle border border-amber-300/80 space-y-2.5 sm:space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[11px] sm:text-xs font-bold text-amber-950 flex items-center gap-1.5">
                  <MapPin className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-amber-700" />
                  Earth Coordinates & Location
                </span>
                <span className="text-[10px] sm:text-[11px] font-mono text-amber-800">
                  Lat: {Number(lat).toFixed(4)}°, Lng: {Number(lng).toFixed(4)}°
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-2.5">
                <input
                  type="text"
                  value={locationName}
                  onChange={(e) => setLocationName(e.target.value)}
                  placeholder="Location Name (e.g. Kyoto Bamboo Grove)"
                  className="text-[11px] sm:text-xs px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-lg bg-white border border-amber-300 text-stone-900 focus:outline-none focus:ring-1 focus:ring-amber-500"
                />
                <input
                  type="text"
                  value={countryName}
                  onChange={(e) => setCountryName(e.target.value)}
                  placeholder="Country Name (e.g. Japan)"
                  className="text-[11px] sm:text-xs px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-lg bg-white border border-amber-300 text-stone-900 focus:outline-none focus:ring-1 focus:ring-amber-500"
                />
              </div>
            </div>

            {/* Time Lock & Unlock Date */}
            <div className="p-3 sm:p-3.5 rounded-xl parchment-subtle border border-amber-300/80 space-y-2.5 sm:space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-[11px] sm:text-xs font-bold text-amber-950 flex items-center gap-1.5">
                  <Calendar className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-amber-700" />
                  Unlock Date & Time (Vault Lock)
                </label>
                <span className="text-[9px] sm:text-[10px] text-amber-800 italic">
                  Locked until timestamp arrives
                </span>
              </div>

              <input
                type="datetime-local"
                value={unlockDate}
                onChange={(e) => setUnlockDate(e.target.value)}
                className="w-full text-xs px-3 py-2 rounded-lg bg-white border border-amber-300 text-stone-900 font-mono focus:outline-none focus:ring-1 focus:ring-amber-500"
              />

              {/* Quick Preset Buttons */}
              <div className="flex flex-wrap gap-1.5 pt-1">
                <span className="text-[10px] font-bold text-amber-900 self-center mr-1">
                  Presets:
                </span>
                <button
                  type="button"
                  onClick={() => setPresetDate('hour')}
                  className="text-[10px] px-2 py-0.5 rounded-md bg-amber-100 hover:bg-amber-200 text-amber-900 border border-amber-300 transition"
                >
                  +1 Hour
                </button>
                <button
                  type="button"
                  onClick={() => setPresetDate('week')}
                  className="text-[10px] px-2 py-0.5 rounded-md bg-amber-100 hover:bg-amber-200 text-amber-900 border border-amber-300 transition"
                >
                  +1 Week
                </button>
                <button
                  type="button"
                  onClick={() => setPresetDate('month')}
                  className="text-[10px] px-2 py-0.5 rounded-md bg-amber-100 hover:bg-amber-200 text-amber-900 border border-amber-300 transition"
                >
                  +1 Month
                </button>
                <button
                  type="button"
                  onClick={() => setPresetDate('year')}
                  className="text-[10px] px-2 py-0.5 rounded-md bg-amber-200 hover:bg-amber-300 text-amber-950 font-bold border border-amber-400 transition"
                >
                  +1 Year
                </button>
                <button
                  type="button"
                  onClick={() => setPresetDate('decade')}
                  className="text-[10px] px-2 py-0.5 rounded-md bg-amber-100 hover:bg-amber-200 text-amber-900 border border-amber-300 transition"
                >
                  +10 Years
                </button>
              </div>
            </div>

            {/* Access Control: Public vs Private */}
            <div className="p-3 sm:p-3.5 rounded-xl parchment-subtle border border-amber-300/80 space-y-2.5">
              <label className="text-[11px] sm:text-xs font-bold text-amber-950 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Lock className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-amber-700" />
                  Access Control & Vault Security
                </span>
                <span className="text-[10px] text-stone-500">Who can decrypt</span>
              </label>

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setAccessType('private')}
                  className={`p-2.5 rounded-xl border text-left transition flex items-center gap-2 cursor-pointer ${
                    accessType === 'private'
                      ? 'bg-amber-900 text-amber-50 border-amber-950 ring-2 ring-amber-600 shadow-md font-bold'
                      : 'bg-white/80 text-stone-700 border-amber-200 hover:bg-white'
                  }`}
                >
                  <Lock className="w-4 h-4 text-amber-400 shrink-0" />
                  <div>
                    <div className="text-xs font-bold">Personal Vault</div>
                    <div className="text-[10px] opacity-80 leading-tight">
                      Only you or recipient
                    </div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setAccessType('public')}
                  className={`p-2.5 rounded-xl border text-left transition flex items-center gap-2 cursor-pointer ${
                    accessType === 'public'
                      ? 'bg-amber-900 text-amber-50 border-amber-950 ring-2 ring-amber-600 shadow-md font-bold'
                      : 'bg-white/80 text-stone-700 border-amber-200 hover:bg-white'
                  }`}
                >
                  <Globe2 className="w-4 h-4 text-amber-400 shrink-0" />
                  <div>
                    <div className="text-xs font-bold">Public Explorer</div>
                    <div className="text-[10px] opacity-80 leading-tight">
                      Open to world on unlock
                    </div>
                  </div>
                </button>
              </div>

              {accessType === 'private' && (
                <div className="space-y-2 pt-1 border-t border-amber-200/80">
                  <span className="text-[10px] font-bold text-amber-900">
                    Optional Designated Recipient:
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <input
                      type="text"
                      value={recipientUsername}
                      onChange={(e) => setRecipientUsername(e.target.value)}
                      placeholder="Recipient username (@handle)"
                      className="text-xs px-2.5 py-1.5 rounded-lg bg-white border border-amber-300 text-stone-900 focus:outline-none focus:ring-1 focus:ring-amber-500"
                    />
                    <input
                      type="email"
                      value={recipientEmail}
                      onChange={(e) => setRecipientEmail(e.target.value)}
                      placeholder="Recipient email address"
                      className="text-xs px-2.5 py-1.5 rounded-lg bg-white border border-amber-300 text-stone-900 focus:outline-none focus:ring-1 focus:ring-amber-500"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Voice Note Recorder */}
            <VoiceRecorder onAudioReady={(data) => setAudioData(data)} />

            {/* Spotify Integration */}
            <SpotifyEmbed
              isEditable={true}
              spotifyUri={spotifyTrack?.uri}
              onSelectTrack={(track) => setSpotifyTrack(track)}
            />

            {/* Photo Attachment */}
            <div className="p-3.5 rounded-xl parchment-subtle border border-amber-300/80 space-y-2.5">
              <label className="text-xs font-bold text-amber-950 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <ImageIcon className="w-3.5 h-3.5 text-amber-700" />
                  Memory Photo Attachment
                </span>
                <span className="text-[10px] text-stone-500">File upload or URL</span>
              </label>

              <div className="flex gap-2">
                <input
                  type="text"
                  value={photoUrl}
                  onChange={(e) => setPhotoUrl(e.target.value)}
                  placeholder="Paste Image URL (Unsplash, imgur, etc.)"
                  className="flex-1 text-xs px-3 py-2 rounded-lg bg-white border border-amber-300 text-stone-900 focus:outline-none focus:ring-1 focus:ring-amber-500"
                />
                <label className="px-3 py-2 rounded-lg bg-amber-100 hover:bg-amber-200 text-amber-900 text-xs font-medium border border-amber-300 cursor-pointer shrink-0 transition">
                  Upload
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoUpload}
                    className="hidden"
                  />
                </label>
              </div>

              {photoUrl && (
                <div className="mt-2 relative rounded-lg overflow-hidden border border-amber-300 max-h-36">
                  <img
                    src={photoUrl}
                    alt="Memory Preview"
                    className="w-full h-36 object-cover"
                  />
                </div>
              )}
            </div>

            {/* Arweave Permanence Stamp Notice */}
            <div className="p-3 rounded-xl bg-amber-950/5 border border-amber-300/50 flex items-start gap-2.5 text-[11px] text-stone-700">
              <ShieldCheck className="w-4 h-4 text-amber-800 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-amber-950">
                  Arweave Permaweb & Supabase Encryption
                </span>
                <p className="mt-0.5 text-stone-600 leading-relaxed">
                  When you plant this capsule, an encrypted payload is minted with an
                  Arweave TX ID and backed up to decentralized storage, ensuring your
                  memories survive for centuries.
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center justify-between gap-2.5 pt-2 border-t border-amber-800/15">
              <button
                type="button"
                onClick={onClose}
                className="px-3.5 py-2.5 rounded-xl bg-stone-200 hover:bg-stone-300 text-stone-700 font-semibold text-xs transition cursor-pointer"
              >
                Cancel
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleSaveAsDraft}
                  className="px-4 py-2.5 rounded-xl bg-amber-100 hover:bg-amber-200 text-amber-950 font-bold text-xs border border-amber-400/70 transition flex items-center gap-1.5 cursor-pointer shadow-xs"
                  title="Save draft to My Vault without locking or burying"
                >
                  <Bookmark className="w-3.5 h-3.5 text-amber-800" />
                  <span>Save as Draft</span>
                </button>

                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-700 to-amber-900 hover:from-amber-800 hover:to-amber-950 text-amber-100 font-bold text-xs transition shadow-lg flex items-center gap-2 cursor-pointer"
                >
                  <Lock className="w-4 h-4 text-amber-300" />
                  <span>Lock & Review</span>
                </button>
              </div>
            </div>
          </form>
        )}

        {/* STEP 2: Pre-Lock Confirmation Screen & Items Summary */}
        {step === 'confirm' && (
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
            {/* Top Prompt Banner */}
            <div className="p-4 rounded-xl bg-gradient-to-r from-amber-900/90 to-amber-950/95 text-amber-50 border border-amber-400/60 shadow-lg space-y-1.5">
              <div className="flex items-center gap-2 font-serif font-bold text-base text-amber-200">
                <Sparkles className="w-4 h-4 text-amber-300 animate-pulse" />
                <span>Pre-Lock Capsule Manifest</span>
              </div>
              <p className="text-xs text-amber-200/80 leading-relaxed">
                Review all attached items and unlock parameters. Once buried in Earth, the
                contents will be time-locked under cryptographic encryption until the
                designated unlock timestamp.
              </p>
            </div>

            {/* Itemized Summary Breakdown Badges */}
            <div className="p-4 rounded-xl parchment-subtle border border-amber-800/30 space-y-3.5 shadow-sm">
              <h3 className="text-xs font-bold uppercase tracking-wider text-amber-950 font-mono">
                Items to be Sealed & Buried:
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {/* 1. Letter Message Badge */}
                <div className="p-3 rounded-lg bg-white/90 border border-amber-300/80 flex items-start gap-2.5">
                  <FileText className="w-4 h-4 text-amber-800 shrink-0 mt-0.5" />
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-stone-900">
                      1 Secret Text Letter
                    </div>
                    <div className="text-[11px] text-stone-600 truncate">
                      {itemsCount.messageWords} words • &ldquo;{title}&rdquo;
                    </div>
                  </div>
                </div>

                {/* 2. Photo Attachment Badge */}
                <div className="p-3 rounded-lg bg-white/90 border border-amber-300/80 flex items-start gap-2.5">
                  <ImageIcon className="w-4 h-4 text-purple-700 shrink-0 mt-0.5" />
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-stone-900">
                      {itemsCount.photos > 0 ? '1 Memory Photo' : '0 Photos'}
                    </div>
                    <div className="text-[11px] text-stone-600 truncate">
                      {itemsCount.photos > 0
                        ? 'High-res image attached'
                        : 'No image uploaded'}
                    </div>
                  </div>
                </div>

                {/* 3. Voice Note Badge */}
                <div className="p-3 rounded-lg bg-white/90 border border-amber-300/80 flex items-start gap-2.5">
                  <Mic className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-stone-900">
                      {itemsCount.voiceNotes > 0
                        ? `1 Voice Note (${audioData?.duration || 0}s)`
                        : '0 Voice Notes'}
                    </div>
                    <div className="text-[11px] text-stone-600 truncate">
                      {itemsCount.voiceNotes > 0
                        ? 'Lossless WebM audio recording'
                        : 'No audio note attached'}
                    </div>
                  </div>
                </div>

                {/* 4. Spotify Track Badge */}
                <div className="p-3 rounded-lg bg-white/90 border border-amber-300/80 flex items-start gap-2.5">
                  <Music className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-stone-900 truncate">
                      {spotifyTrack?.title ? `1 Track: ${spotifyTrack.title}` : '0 Spotify Tracks'}
                    </div>
                    <div className="text-[11px] text-stone-600 truncate">
                      {spotifyTrack?.artist || 'No musical theme attached'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Photo Preview if uploaded */}
              {photoUrl && (
                <div className="p-2 rounded-lg bg-white/80 border border-amber-300/60 flex items-center gap-3">
                  <img
                    src={photoUrl}
                    alt="Capsule Attachment"
                    className="w-16 h-14 rounded object-cover border border-amber-400/80"
                  />
                  <div className="text-xs text-stone-700">
                    <div className="font-bold text-stone-900">Photo Attachment Preview</div>
                    <div className="text-[11px] text-stone-500">
                      Will be preserved on Arweave permaweb storage
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Earth Location & Time-Lock Info */}
            <div className="p-4 rounded-xl parchment-subtle border border-amber-800/30 space-y-2.5 shadow-sm text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <span className="text-[10px] uppercase font-mono text-stone-500 block">
                    Burial Coordinates & Country
                  </span>
                  <div className="font-bold text-stone-900 flex items-center gap-1.5 mt-0.5">
                    <span className="text-base">{getCountryFlagEmoji(countryCode)}</span>
                    <span>
                      {locationName}, {countryName}
                    </span>
                  </div>
                  <div className="text-[11px] font-mono text-stone-600">
                    {Number(lat).toFixed(4)}°, {Number(lng).toFixed(4)}°
                  </div>
                </div>

                <div>
                  <span className="text-[10px] uppercase font-mono text-stone-500 block">
                    Target Unlock Time
                  </span>
                  <div className="font-bold text-amber-950 mt-0.5">
                    {formattedUnlockDate}
                  </div>
                  <div className="text-[11px] text-stone-600">
                    {accessType === 'private' ? '🔒 Private Vault Lock' : '🌐 Public Discovery'}
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons: Back vs Bury Capsule */}
            <div className="flex items-center justify-between pt-2 border-t border-amber-800/20">
              <button
                type="button"
                onClick={() => setStep('form')}
                className="px-4 py-2.5 rounded-xl bg-stone-200 hover:bg-stone-300 text-stone-800 font-semibold text-xs transition cursor-pointer flex items-center gap-1.5"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back & Edit</span>
              </button>

              <button
                type="button"
                onClick={handleFinalBury}
                className="px-6 py-3 rounded-xl bg-gradient-to-r from-amber-700 via-amber-800 to-amber-950 hover:from-amber-600 hover:to-amber-900 text-amber-100 font-bold text-sm transition shadow-xl border-2 border-amber-400/80 flex items-center gap-2 cursor-pointer animate-pulse hover:animate-none"
              >
                <Lock className="w-4.5 h-4.5 text-amber-300" />
                <span>Bury Capsule</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
