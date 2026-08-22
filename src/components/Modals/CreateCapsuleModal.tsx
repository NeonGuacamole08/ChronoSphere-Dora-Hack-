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
  initialCoords?: Coordinates | null;
  activeUsername: string;
  currentUser?: AppUser | null;
}

export const CreateCapsuleModal: React.FC<CreateCapsuleModalProps> = ({
  isOpen,
  onClose,
  onSaveCapsule,
  initialCoords,
  activeUsername,
  currentUser,
}) => {
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

  // Synchronize coordinates and reset fields whenever modal opens or new coordinates are passed
  useEffect(() => {
    if (isOpen) {
      if (initialCoords) {
        setLat(initialCoords.lat);
        setLng(initialCoords.lng);
        setLocationName(initialCoords.name || initialCoords.country || `Lat: ${initialCoords.lat.toFixed(2)}°, Lng: ${initialCoords.lng.toFixed(2)}°`);
        setCountryName(initialCoords.country || 'Global');

        const { countryCode: detectedCode } = getCountryCodeFromCoordinates(initialCoords.lat, initialCoords.lng);
        setCountryCode(detectedCode || 'GL');
      }
    }
  }, [isOpen, initialCoords]);

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !message.trim()) return;

    const txId = generateArweaveTxId();
    const finalLat = Number(Number(lat).toFixed(4));
    const finalLng = Number(Number(lng).toFixed(4));
    const userHandle = currentUser?.username || activeUsername || '@earth_explorer';
    const userEmail = currentUser?.email || 'explorer@earth.org';

    const newCapsule: Capsule = {
      id: `user_cap_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      title: title.trim(),
      message: message.trim(),
      created_at: new Date().toISOString(),
      unlock_timestamp: new Date(unlockDate).toISOString(),
      lat: finalLat,
      lng: finalLng,
      location_name: locationName.trim() || `Earth Point (${finalLat}°, ${finalLng}°)`,
      country_code: countryCode.toUpperCase() || 'GL',
      country_name: countryName.trim() || 'Global',
      creator_username: userHandle,
      creator_email: userEmail,
      access_type: accessType,
      recipient_username: accessType === 'private' && recipientUsername.trim() ? recipientUsername.trim() : undefined,
      recipient_email: accessType === 'private' && recipientEmail.trim() ? recipientEmail.trim() : undefined,
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
      notified: false,
      tags: ['personal', 'memory', 'time-capsule'],
    };

    onSaveCapsule(newCapsule);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl max-h-[95dvh] sm:max-h-[90vh] flex flex-col rounded-2xl parchment-card border-2 border-amber-800/40 shadow-2xl overflow-hidden">
        {/* Wood Header */}
        <div className="wood-trim px-3.5 py-3 sm:px-6 sm:py-4 flex items-center justify-between text-amber-50 shadow-md">
          <div className="flex items-center gap-2 sm:gap-2.5">
            <span className="wax-seal w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-white font-serif font-black text-xs sm:text-sm ring-2 ring-amber-300/40">
              TF
            </span>
            <div>
              <h2 className="font-serif font-bold text-sm sm:text-lg text-amber-100 leading-none">
                Plant a New Earth Time Capsule
              </h2>
              <span className="text-[9px] sm:text-[11px] text-amber-300/80">
                Sealed Cryptographically & Anchored to Arweave
              </span>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1 sm:p-1.5 rounded-full hover:bg-amber-950/60 text-amber-200 hover:text-white transition cursor-pointer"
          >
            <X className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-3.5 sm:p-6 space-y-3.5 sm:space-y-5">
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
              <span className="text-[9px] sm:text-[10px] text-amber-800 italic">Locked until timestamp arrives</span>
            </div>

            <input
              type="datetime-local"
              required
              value={unlockDate}
              onChange={(e) => setUnlockDate(e.target.value)}
              className="w-full text-[11px] sm:text-xs font-mono px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-lg bg-white border border-amber-300 text-stone-900 focus:outline-none focus:ring-1 focus:ring-amber-500 shadow-xs"
            />

            {/* Quick Presets */}
            <div className="flex flex-wrap gap-1 sm:gap-1.5 items-center">
              <span className="text-[9px] sm:text-[10px] text-stone-500">Quick Presets:</span>
              <button
                type="button"
                onClick={() => setPresetDate('week')}
                className="text-[9px] sm:text-[10px] px-1.5 sm:px-2 py-0.5 rounded bg-white hover:bg-amber-100 text-stone-700 border border-amber-200 cursor-pointer"
              >
                +1 Week
              </button>
              <button
                type="button"
                onClick={() => setPresetDate('month')}
                className="text-[9px] sm:text-[10px] px-1.5 sm:px-2 py-0.5 rounded bg-white hover:bg-amber-100 text-stone-700 border border-amber-200 cursor-pointer"
              >
                +1 Month
              </button>
              <button
                type="button"
                onClick={() => setPresetDate('year')}
                className="text-[9px] sm:text-[10px] px-1.5 sm:px-2 py-0.5 rounded bg-white hover:bg-amber-100 text-stone-700 border border-amber-200 cursor-pointer"
              >
                +1 Year
              </button>
              <button
                type="button"
                onClick={() => setPresetDate('decade')}
                className="text-[9px] sm:text-[10px] px-1.5 sm:px-2 py-0.5 rounded bg-white hover:bg-amber-100 text-stone-700 border border-amber-200 cursor-pointer"
              >
                +10 Years
              </button>
            </div>
          </div>

          {/* Access Control: Personal Private (Default) vs Shared vs Public */}
          <div className="p-3 sm:p-3.5 rounded-xl parchment-subtle border border-amber-300/80 space-y-2.5 sm:space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-[11px] sm:text-xs font-bold text-amber-950 flex items-center gap-1.5">
                <Key className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-amber-700" />
                Privacy & Access Permissions
              </label>
              <span className="text-[9px] sm:text-[10px] text-amber-800 font-medium">Personal by Default</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setAccessType('private')}
                className={`py-2 sm:py-2.5 px-2.5 sm:px-3 rounded-lg text-xs font-medium border flex items-center justify-center gap-1.5 transition cursor-pointer ${
                  accessType === 'private'
                    ? 'bg-amber-900 text-amber-100 border-amber-950 shadow-xs'
                    : 'bg-white text-stone-700 border-amber-200 hover:bg-amber-50'
                }`}
              >
                <Lock className="w-3.5 h-3.5 text-amber-400" />
                <div className="text-left leading-tight">
                  <div className="font-bold text-[11px] sm:text-xs">Personal Vault</div>
                  <div className="text-[8px] sm:text-[9px] opacity-80">Private to you (or shared)</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setAccessType('public')}
                className={`py-2 sm:py-2.5 px-2.5 sm:px-3 rounded-lg text-xs font-medium border flex items-center justify-center gap-1.5 transition cursor-pointer ${
                  accessType === 'public'
                    ? 'bg-amber-900 text-amber-100 border-amber-950 shadow-xs'
                    : 'bg-white text-stone-700 border-amber-200 hover:bg-amber-50'
                }`}
              >
                <Globe2 className="w-3.5 h-3.5 text-cyan-400" />
                <div className="text-left leading-tight">
                  <div className="font-bold text-[11px] sm:text-xs">Public Explorer</div>
                  <div className="text-[8px] sm:text-[9px] opacity-80">Open to the world</div>
                </div>
              </button>
            </div>

            {accessType === 'private' ? (
              <div className="space-y-2 pt-1 border-t border-amber-200/60">
                <div className="flex items-center gap-1.5 text-[11px] text-amber-900 bg-amber-50/80 p-2 rounded-lg border border-amber-200">
                  <ShieldCheck className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                  <span>
                    Secured for <strong>{currentUser?.username || activeUsername || '@earth_explorer'}</strong>. Unless you share it with a recipient below, no one else can view its decrypted contents.
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-0.5">
                  <div>
                    <label className="block text-[10px] font-bold text-amber-900 mb-1 flex items-center gap-1">
                      <Share2 className="w-3 h-3 text-amber-700" />
                      Optional: Share with @Username
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={recipientUsername}
                        onChange={(e) => setRecipientUsername(e.target.value)}
                        placeholder="@friend or @username"
                        className="w-full text-xs px-3 py-1.5 pl-7 rounded-lg bg-white border border-amber-300 text-stone-900 focus:outline-none focus:ring-1 focus:ring-amber-500"
                      />
                      <User className="w-3.5 h-3.5 text-stone-400 absolute left-2 top-2" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-amber-900 mb-1">
                      Optional: Recipient Email
                    </label>
                    <input
                      type="email"
                      value={recipientEmail}
                      onChange={(e) => setRecipientEmail(e.target.value)}
                      placeholder="friend@example.com"
                      className="w-full text-xs px-3 py-1.5 rounded-lg bg-white border border-amber-300 text-stone-900 focus:outline-none focus:ring-1 focus:ring-amber-500"
                    />
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-[11px] text-stone-600 bg-white/70 p-2 rounded-lg border border-amber-200">
                Any global explorer will be able to unlock and view this capsule when the time-lock expires.
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
                <img src={photoUrl} alt="Memory Preview" className="w-full h-36 object-cover" />
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
                When you plant this capsule, an encrypted payload is minted with an Arweave TX ID and
                backed up to decentralized storage, ensuring your memories survive for centuries.
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl bg-stone-200 hover:bg-stone-300 text-stone-700 font-semibold text-xs transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-700 to-amber-900 hover:from-amber-800 hover:to-amber-950 text-amber-100 font-bold text-xs transition shadow-lg flex items-center gap-2 cursor-pointer"
            >
              <Sparkles className="w-4 h-4 text-amber-300" />
              Seal & Plant Capsule on Earth
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
