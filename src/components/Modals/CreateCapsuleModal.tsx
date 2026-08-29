import React, { useState, useEffect, useRef } from 'react';
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
  File,
  ArrowLeft,
  CheckCircle2,
  Bookmark,
  Plus,
  Trash2,
  Play,
  Pause,
  Upload,
  Link as LinkIcon,
  AlertCircle,
  FileCheck,
  Loader2,
  Zap,
  Radio,
} from 'lucide-react';
import { Capsule, CapsuleAttachment, Coordinates } from '../../types';
import { VoiceRecorder } from '../Audio/VoiceRecorder';
import { SpotifyEmbed } from '../Spotify/SpotifyEmbed';
import { generateArweaveTxId } from '../../utils/crypto';
import { AppUser, savePin } from '../../utils/supabase';
import { getCountryCodeFromCoordinates, isCoordinateOnLand } from '../../utils/countries';
import { SupportedLanguage, translate } from '../../utils/i18n';

interface CreateCapsuleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveCapsule: (capsule: Capsule) => void;
  onSaveDraft?: (draftCapsule: Capsule) => void;
  draftToEdit?: Capsule | null;
  initialCoords?: Coordinates | null;
  activeUsername: string;
  currentUser?: AppUser | null;
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

// Format file size in KB/MB
function formatFileSize(bytes?: number): string {
  if (!bytes || bytes <= 0) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

// Safe client-side image compression to prevent laptop browser memory leaks or upload crashes
async function safelyProcessImage(file: File): Promise<{ dataUrl: string; size: number }> {
  return new Promise((resolve, reject) => {
    // Validate file type
    if (!file.type.startsWith('image/')) {
      return reject(new Error('Selected file is not an image.'));
    }

    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Failed to read image file.'));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error('Failed to parse image data.'));
      img.onload = () => {
        try {
          const maxDim = 1400;
          let { width, height } = img;
          if (width > maxDim || height > maxDim) {
            if (width > height) {
              height = Math.round((height * maxDim) / width);
              width = maxDim;
            } else {
              width = Math.round((width * maxDim) / height);
              height = maxDim;
            }
          }

          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            return resolve({ dataUrl: reader.result as string, size: file.size });
          }

          ctx.drawImage(img, 0, 0, width, height);
          const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.85);
          resolve({ dataUrl: compressedDataUrl, size: Math.round(compressedDataUrl.length * 0.75) });
        } catch {
          resolve({ dataUrl: reader.result as string, size: file.size });
        }
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  });
}

// Safely process document or audio files
async function safelyProcessFile(file: File): Promise<{ dataUrl: string; size: number }> {
  return new Promise((resolve, reject) => {
    // 15MB limit check
    if (file.size > 15 * 1024 * 1024) {
      return reject(new Error('File size exceeds the 15MB safety limit.'));
    }

    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Failed to read file.'));
    reader.onload = () => {
      resolve({ dataUrl: reader.result as string, size: file.size });
    };
    reader.readAsDataURL(file);
  });
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
  language = 'en',
}) => {
  const [step, setStep] = useState<'form' | 'confirm'>('form');

  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [lat, setLat] = useState<number | null>(initialCoords?.lat ?? null);
  const [lng, setLng] = useState<number | null>(initialCoords?.lng ?? null);
  const [locationName, setLocationName] = useState(
    initialCoords?.name || initialCoords?.country || ''
  );
  const [countryName, setCountryName] = useState(initialCoords?.country || '');
  const [countryCode, setCountryCode] = useState('US');
  const [coordinateError, setCoordinateError] = useState<string | null>(null);

  // Access Control: Default to 'private' (Personal to User)
  const [accessType, setAccessType] = useState<'public' | 'private'>('private');
  const [publicUnlockMode, setPublicUnlockMode] = useState<'instant_find' | 'time_locked'>('instant_find');
  const [unlockRadiusMeters, setUnlockRadiusMeters] = useState<number>(100);
  const [recipientUsername, setRecipientUsername] = useState('');
  const [recipientEmail, setRecipientEmail] = useState('');
  const [taggedUsersInput, setTaggedUsersInput] = useState('');
  const [unlockDate, setUnlockDate] = useState(() => {
    const d = new Date();
    d.setFullYear(d.getFullYear() + 1); // Default to +1 year in future
    return d.toISOString().slice(0, 16);
  });

  // Spotify Track
  const [spotifyTrack, setSpotifyTrack] = useState<{
    uri: string;
    id: string;
    title: string;
    artist: string;
  } | null>(null);

  // Multi-Media Attachments Array (Unlimited Photos, Audio Memos, Letters, Documents)
  const [attachments, setAttachments] = useState<CapsuleAttachment[]>([]);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isProcessingUpload, setIsProcessingUpload] = useState(false);

  // Quick Photo URL Input
  const [imageUrlInput, setImageUrlInput] = useState('');

  // Written Letter Entry Form State
  const [showAddLetterModal, setShowAddLetterModal] = useState(false);
  const [letterTitle, setLetterTitle] = useState('');
  const [letterContent, setLetterContent] = useState('');

  // Audio Playback in preview list
  const [playingAudioId, setPlayingAudioId] = useState<string | null>(null);
  const audioPlayerRef = useRef<HTMLAudioElement | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Helper to completely clear all form inputs and states
  const resetFormState = () => {
    setTitle('');
    setMessage('');
    setLat(null);
    setLng(null);
    setLocationName('');
    setCountryName('');
    setCountryCode('US');
    setCoordinateError(null);
    setAttachments([]);
    setSpotifyTrack(null);
    setAccessType('private');
    setPublicUnlockMode('instant_find');
    setUnlockRadiusMeters(100);
    setRecipientUsername('');
    setRecipientEmail('');
    setTaggedUsersInput('');
    setImageUrlInput('');
    setLetterTitle('');
    setLetterContent('');
    setShowAddLetterModal(false);
    setUploadError(null);
    setIsSubmitting(false);
    setStep('form');
    const d = new Date();
    d.setFullYear(d.getFullYear() + 1);
    setUnlockDate(d.toISOString().slice(0, 16));
  };

  const handleModalClose = () => {
    resetFormState();
    onClose();
  };

  // Synchronize coordinates and reset or populate form fields whenever modal opens
  useEffect(() => {
    if (isOpen) {
      setStep('form');
      setUploadError(null);
      setCoordinateError(null);
      setShowAddLetterModal(false);

      if (draftToEdit) {
        // Load draft contents
        setTitle(draftToEdit.title || '');
        setMessage(draftToEdit.message || '');
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
        setTaggedUsersInput(draftToEdit.tagged_users ? draftToEdit.tagged_users.join(', ') : '');
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

        // Populate attachments from draft
        const initialAttachments: CapsuleAttachment[] = [];
        if (draftToEdit.attachments && draftToEdit.attachments.length > 0) {
          initialAttachments.push(...draftToEdit.attachments);
        } else {
          if (draftToEdit.photo_url) {
            initialAttachments.push({
              id: `att_photo_${Date.now()}`,
              type: 'photo',
              title: 'Primary Photo',
              data_url: draftToEdit.photo_url,
            });
          }
          if (draftToEdit.audio_url) {
            initialAttachments.push({
              id: `att_audio_${Date.now()}`,
              type: 'audio',
              title: 'Voice Recording',
              data_url: draftToEdit.audio_url,
              duration: draftToEdit.audio_duration,
            });
          }
        }
        setAttachments(initialAttachments);
      } else {
        // Reset fresh
        resetFormState();

        if (initialCoords && initialCoords.lat !== undefined && initialCoords.lng !== undefined) {
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
          setLat(null);
          setLng(null);
          setLocationName('');
          setCountryName('');
          setCountryCode('US');
        }
      }
    } else {
      resetFormState();
    }
  }, [isOpen, initialCoords, draftToEdit]);

  // Clean up audio on unmount or close
  useEffect(() => {
    return () => {
      if (audioPlayerRef.current) {
        audioPlayerRef.current.pause();
        audioPlayerRef.current = null;
      }
    };
  }, []);

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

  // Safe Multi-File Image/Photo Upload Handler
  const handleMultiplePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsProcessingUpload(true);
    setUploadError(null);

    const newAttachments: CapsuleAttachment[] = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      try {
        const { dataUrl, size } = await safelyProcessImage(file);
        newAttachments.push({
          id: `photo_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
          type: 'photo',
          title: file.name.replace(/\.[^/.]+$/, '') || `Photo ${attachments.length + i + 1}`,
          file_name: file.name,
          data_url: dataUrl,
          size_bytes: size,
        });
      } catch (err: any) {
        console.error('Error processing photo:', err);
        setUploadError(err.message || 'Failed to process image attachment.');
      }
    }

    if (newAttachments.length > 0) {
      setAttachments((prev) => [...prev, ...newAttachments]);
    }
    setIsProcessingUpload(false);
    // Reset file input value so same files can be re-selected if desired
    e.target.value = '';
  };

  // Add Photo via URL
  const handleAddImageUrl = () => {
    if (!imageUrlInput.trim()) return;
    const newAtt: CapsuleAttachment = {
      id: `photo_url_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      type: 'photo',
      title: `Web Image ${attachments.filter((a) => a.type === 'photo').length + 1}`,
      data_url: imageUrlInput.trim(),
    };
    setAttachments((prev) => [...prev, newAtt]);
    setImageUrlInput('');
  };

  // Safe Multi-File Document / File Upload Handler
  const handleDocumentUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsProcessingUpload(true);
    setUploadError(null);

    const newAttachments: CapsuleAttachment[] = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      try {
        const { dataUrl, size } = await safelyProcessFile(file);
        newAttachments.push({
          id: `doc_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
          type: 'document',
          title: file.name,
          file_name: file.name,
          data_url: dataUrl,
          size_bytes: size,
        });
      } catch (err: any) {
        console.error('Error processing document:', err);
        setUploadError(err.message || 'Failed to process document attachment.');
      }
    }

    if (newAttachments.length > 0) {
      setAttachments((prev) => [...prev, ...newAttachments]);
    }
    setIsProcessingUpload(false);
    e.target.value = '';
  };

  // Add Audio Recording from VoiceRecorder component
  const handleAudioRecordingReady = (data: { url: string; duration: number }) => {
    if (!data.url) return;
    const audioCount = attachments.filter((a) => a.type === 'audio').length + 1;
    const newAtt: CapsuleAttachment = {
      id: `audio_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      type: 'audio',
      title: `Voice Memo #${audioCount} (${data.duration}s)`,
      data_url: data.url,
      duration: data.duration,
    };
    setAttachments((prev) => [...prev, newAtt]);
  };

  // Add Written Secret Letter / Reflection
  const handleAddWrittenLetter = (e: React.FormEvent) => {
    e.preventDefault();
    if (!letterTitle.trim() || !letterContent.trim()) return;

    const newAtt: CapsuleAttachment = {
      id: `letter_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      type: 'letter',
      title: letterTitle.trim(),
      text_content: letterContent.trim(),
    };
    setAttachments((prev) => [...prev, newAtt]);
    setLetterTitle('');
    setLetterContent('');
    setShowAddLetterModal(false);
  };

  // Remove an attachment by ID
  const handleRemoveAttachment = (id: string) => {
    if (playingAudioId === id && audioPlayerRef.current) {
      audioPlayerRef.current.pause();
      setPlayingAudioId(null);
    }
    setAttachments((prev) => prev.filter((att) => att.id !== id));
  };

  // Toggle audio playback preview in attachment list
  const handleTogglePlayAudio = (att: CapsuleAttachment) => {
    if (!att.data_url) return;

    if (playingAudioId === att.id) {
      if (audioPlayerRef.current) {
        audioPlayerRef.current.pause();
      }
      setPlayingAudioId(null);
    } else {
      if (audioPlayerRef.current) {
        audioPlayerRef.current.pause();
      }
      const audio = new Audio(att.data_url);
      audioPlayerRef.current = audio;
      setPlayingAudioId(att.id);
      audio.play().catch((err) => console.error('Audio play error:', err));
      audio.onended = () => {
        setPlayingAudioId(null);
      };
    }
  };

  // Parse tagged users
  const parsedTaggedUsers = taggedUsersInput
    .split(',')
    .map((u) => u.trim().replace(/^@/, ''))
    .filter(Boolean);

  // Extract primary photo and primary audio for backward compatibility
  const primaryPhoto = attachments.find((a) => a.type === 'photo')?.data_url;
  const primaryAudio = attachments.find((a) => a.type === 'audio');

  // Step 1 Save as In-Progress Draft in My Vault
  const handleSaveAsDraft = () => {
    if (lat === null || lng === null || isNaN(Number(lat)) || isNaN(Number(lng))) {
      setCoordinateError('Please select or search for a valid land location before saving.');
      return;
    }

    const finalLat = Number(lat);
    const finalLng = Number(lng);

    // Validate land placement
    if (!isCoordinateOnLand(finalLat, finalLng)) {
      setCoordinateError('No pins should land in open ocean waters. Please select a terrestrial land or city location.');
      return;
    }

    const userHandle = currentUser?.username || activeUsername || '@earth_explorer';
    const userEmail = currentUser?.email || 'contact@unis.org';
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
      location_name: locationName.trim() || `Earth Point (${finalLat.toFixed(4)}°, ${finalLng.toFixed(4)}°)`,
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
      tagged_users: parsedTaggedUsers.length > 0 ? parsedTaggedUsers : undefined,
      attachments: attachments.length > 0 ? attachments : undefined,
      photo_url: primaryPhoto || undefined,
      audio_url: primaryAudio?.data_url || undefined,
      audio_duration: primaryAudio?.duration,
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
    handleModalClose();
  };

  // Step 1 -> Step 2 transition on "Lock Capsule"
  const handleProceedToLock = (e: React.FormEvent) => {
    e.preventDefault();
    setCoordinateError(null);

    if (!title.trim() || !message.trim()) return;

    if (lat === null || lng === null || isNaN(Number(lat)) || isNaN(Number(lng)) || (Number(lat) === 0 && Number(lng) === 0)) {
      setCoordinateError('Please select a valid land coordinate or search for a location before burying your capsule.');
      return;
    }

    if (!isCoordinateOnLand(Number(lat), Number(lng))) {
      setCoordinateError('No pins should land in open ocean waters. Please choose a terrestrial landmass or city.');
      return;
    }

    setStep('confirm');
  };

  // Step 2 final "Bury Capsule" confirmation
  const handleFinalBury = async () => {
    if (isSubmitting) return;

    if (lat === null || lng === null || isNaN(Number(lat)) || isNaN(Number(lng))) {
      setCoordinateError('Invalid coordinates. Please select a valid land position on the globe.');
      setStep('form');
      return;
    }

    const finalLat = Number(lat);
    const finalLng = Number(lng);

    if (!isCoordinateOnLand(finalLat, finalLng)) {
      setCoordinateError('No pins should land in open ocean waters. Please choose a terrestrial location.');
      setStep('form');
      return;
    }

    setIsSubmitting(true);

    try {
      const txId = generateArweaveTxId();
      const userHandle = currentUser?.username || activeUsername || '@earth_explorer';
      const userEmail = currentUser?.email || 'contact@unis.org';
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
        location_name: locationName.trim() || `Earth Point (${finalLat.toFixed(4)}°, ${finalLng.toFixed(4)}°)`,
        country_code: countryCode.toUpperCase() || 'GL',
        country_name: countryName.trim() || 'Global',
        creator_username: userHandle,
        creator_email: userEmail,
        access_type: accessType,
        public_unlock_mode: accessType === 'public' ? publicUnlockMode : undefined,
        unlock_radius_meters: accessType === 'public' ? unlockRadiusMeters : undefined,
        recipient_username:
          accessType === 'private' && recipientUsername.trim()
            ? recipientUsername.trim()
            : undefined,
        recipient_email:
          accessType === 'private' && recipientEmail.trim()
            ? recipientEmail.trim()
            : undefined,
        tagged_users: parsedTaggedUsers.length > 0 ? parsedTaggedUsers : undefined,
        attachments: attachments.length > 0 ? attachments : undefined,
        photo_url: primaryPhoto || undefined,
        audio_url: primaryAudio?.data_url || undefined,
        audio_duration: primaryAudio?.duration,
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

      // Save pin to database with raw numeric latitude & longitude
      try {
        await savePin({
          title: newCapsule.title,
          description: newCapsule.message,
          lat: finalLat,
          lng: finalLng,
          is_public: accessType === 'public',
        });
      } catch (err) {
        console.warn('Background savePin notice:', err);
      }

      await onSaveCapsule(newCapsule);
      handleModalClose();
    } catch (err) {
      console.error('Error burying capsule:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Counts of each media type
  const photosCount = attachments.filter((a) => a.type === 'photo').length;
  const audioCount = attachments.filter((a) => a.type === 'audio').length;
  const lettersCount = attachments.filter((a) => a.type === 'letter').length;
  const docsCount = attachments.filter((a) => a.type === 'document').length;
  const messageWords = message.trim().split(/\s+/).filter(Boolean).length;

  const formattedUnlockDate = new Date(unlockDate).toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl max-h-[92vh] flex flex-col rounded-2xl parchment-card border-2 border-amber-500/80 shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 sm:py-4 bg-gradient-to-r from-amber-900 via-amber-950 to-stone-900 text-amber-100 border-b border-amber-500/50">
          <div className="flex items-center gap-2 sm:gap-3">
            <span className="text-xl sm:text-2xl">{getCountryFlagEmoji(countryCode)}</span>
            <div>
              <h2 className="font-serif font-bold text-base sm:text-lg text-amber-100 flex items-center gap-1.5 sm:gap-2 leading-tight">
                <span>{step === 'form' ? translate('plantEarthTimeCapsule', language) : translate('confirmCapsuleManifest', language)}</span>
                {draftToEdit?.is_draft && (
                  <span className="text-[10px] bg-amber-500/30 text-amber-200 px-2 py-0.5 rounded-full border border-amber-400/40">
                    {translate('drafts', language)}
                  </span>
                )}
              </h2>
              <span className="text-[10px] sm:text-xs text-amber-200/80 font-mono">
                {step === 'form'
                  ? translate('sealSecretMemories', language)
                  : translate('reviewCryptoLock', language)}
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={handleModalClose}
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
            {/* Guest Mode Warning Banner if current user is guest */}
            {currentUser?.isGuest && (
              <div className="p-3 rounded-xl bg-amber-100/90 border border-amber-400 text-amber-950 text-xs flex items-start gap-2.5 shadow-xs">
                <AlertCircle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                <div className="leading-snug">
                  <span className="font-bold text-amber-900 block">
                    {translate('guestModeActive', language)}
                  </span>
                  <span className="text-amber-800 text-[11px]">
                    {translate('guestModeWarning', language)}
                  </span>
                </div>
              </div>
            )}

            {/* Title & Primary Story */}
            <div className="space-y-3 sm:space-y-4">
              <div>
                <label className="block text-[10px] sm:text-xs font-bold text-amber-950 uppercase tracking-wider mb-1">
                  {translate('capsuleTitle', language)}
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder={translate('capsuleTitlePlaceholder', language)}
                  className="w-full text-xs sm:text-sm font-medium px-3 sm:px-3.5 py-2 sm:py-2.5 rounded-xl bg-white border border-amber-300 focus:outline-none focus:ring-2 focus:ring-amber-600 text-stone-900 placeholder:text-stone-400 shadow-xs"
                />
              </div>

              <div>
                <label className="block text-[10px] sm:text-xs font-bold text-amber-950 uppercase tracking-wider mb-1">
                  {translate('primaryStory', language)}
                </label>
                <textarea
                  required
                  rows={3}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder={translate('storyPlaceholder', language)}
                  className="w-full text-[11px] sm:text-xs leading-relaxed px-3 sm:px-3.5 py-2 sm:py-2.5 rounded-xl bg-white border border-amber-300 focus:outline-none focus:ring-2 focus:ring-amber-600 text-stone-900 placeholder:text-stone-400 shadow-xs"
                />
              </div>
            </div>

            {/* Coordinates & Location */}
            <div className="p-3 sm:p-3.5 rounded-xl parchment-subtle border border-amber-300/80 space-y-2.5 sm:space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[11px] sm:text-xs font-bold text-amber-950 flex items-center gap-1.5">
                  <MapPin className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-amber-700" />
                  {translate('earthCoordinates', language)}
                </span>
                <span className="text-[10px] sm:text-[11px] font-mono text-amber-800">
                  {lat !== null && lng !== null
                    ? `Lat: ${Number(lat).toFixed(4)}°, Lng: ${Number(lng).toFixed(4)}°`
                    : 'No location selected'}
                </span>
              </div>

              {coordinateError && (
                <div className="p-2 sm:p-2.5 rounded-lg bg-red-950/90 border border-red-500/60 text-red-200 text-[11px] flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                  <span>{coordinateError}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-2.5">
                <input
                  type="text"
                  value={locationName}
                  onChange={(e) => setLocationName(e.target.value)}
                  placeholder={translate('locationNamePlaceholder', language)}
                  className="text-[11px] sm:text-xs px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-lg bg-white border border-amber-300 text-stone-900 focus:outline-none focus:ring-1 focus:ring-amber-500"
                />
                <input
                  type="text"
                  value={countryName}
                  onChange={(e) => setCountryName(e.target.value)}
                  placeholder={translate('countryNamePlaceholder', language)}
                  className="text-[11px] sm:text-xs px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-lg bg-white border border-amber-300 text-stone-900 focus:outline-none focus:ring-1 focus:ring-amber-500"
                />
              </div>
            </div>

            {/* Time Lock & Unlock Date */}
            <div className="p-3 sm:p-3.5 rounded-xl parchment-subtle border border-amber-300/80 space-y-2.5 sm:space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-[11px] sm:text-xs font-bold text-amber-950 flex items-center gap-1.5">
                  <Calendar className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-amber-700" />
                  {translate('unlockDateTime', language)}
                </label>
                <span className="text-[9px] sm:text-[10px] text-amber-800 italic">
                  {translate('lockedUntilTimestamp', language)}
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
                  {translate('presets', language)}
                </span>
                <button
                  type="button"
                  onClick={() => setPresetDate('hour')}
                  className="text-[10px] px-2 py-0.5 rounded-md bg-amber-100 hover:bg-amber-200 text-amber-900 border border-amber-300 transition cursor-pointer"
                >
                  {translate('plusOneHour', language)}
                </button>
                <button
                  type="button"
                  onClick={() => setPresetDate('week')}
                  className="text-[10px] px-2 py-0.5 rounded-md bg-amber-100 hover:bg-amber-200 text-amber-900 border border-amber-300 transition cursor-pointer"
                >
                  {translate('plusOneWeek', language)}
                </button>
                <button
                  type="button"
                  onClick={() => setPresetDate('month')}
                  className="text-[10px] px-2 py-0.5 rounded-md bg-amber-100 hover:bg-amber-200 text-amber-900 border border-amber-300 transition cursor-pointer"
                >
                  {translate('plusOneMonth', language)}
                </button>
                <button
                  type="button"
                  onClick={() => setPresetDate('year')}
                  className="text-[10px] px-2 py-0.5 rounded-md bg-amber-200 hover:bg-amber-300 text-amber-950 font-bold border border-amber-400 transition cursor-pointer"
                >
                  {translate('plusOneYear', language)}
                </button>
                <button
                  type="button"
                  onClick={() => setPresetDate('decade')}
                  className="text-[10px] px-2 py-0.5 rounded-md bg-amber-100 hover:bg-amber-200 text-amber-900 border border-amber-300 transition cursor-pointer"
                >
                  {translate('plusTenYears', language)}
                </button>
              </div>
            </div>

            {/* Access Control: Public vs Private & Tagged Recipients */}
            <div className="p-3 sm:p-3.5 rounded-xl parchment-subtle border border-amber-300/80 space-y-2.5">
              <label className="text-[11px] sm:text-xs font-bold text-amber-950 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Lock className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-amber-700" />
                  {translate('accessControl', language)}
                </span>
                <span className="text-[10px] text-stone-500">{translate('whoCanDecrypt', language)}</span>
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
                    <div className="text-xs font-bold">{translate('personalVault', language)}</div>
                    <div className="text-[10px] opacity-80 leading-tight">
                      {translate('onlyYouOrRecipient', language)}
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
                    <div className="text-xs font-bold">{translate('publicExplorer', language)}</div>
                    <div className="text-[10px] opacity-80 leading-tight">
                      {translate('openToWorld', language)}
                    </div>
                  </div>
                </button>
              </div>

              {/* Dual Public Unlock System Configuration */}
              {accessType === 'public' && (
                <div className="p-3 rounded-xl bg-amber-100/70 border border-amber-400/80 space-y-2.5 animate-in fade-in">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-amber-950 flex items-center gap-1.5">
                      <Zap className="w-3.5 h-3.5 text-amber-700" />
                      {translate('publicUnlockMode', language)}
                    </span>
                    <span className="text-[10px] text-amber-800 font-medium">
                      {translate('gpsProximityRule', language)}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setPublicUnlockMode('instant_find')}
                      className={`p-2.5 rounded-xl border text-left transition flex items-start gap-2 cursor-pointer ${
                        publicUnlockMode === 'instant_find'
                          ? 'bg-amber-950 text-amber-100 border-amber-400 ring-2 ring-amber-500 shadow-sm'
                          : 'bg-white/90 text-stone-700 border-amber-300 hover:bg-white'
                      }`}
                    >
                      <Zap className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                      <div>
                        <div className="text-xs font-bold text-amber-100">{translate('instantFindTitle', language)}</div>
                        <div className="text-[10px] opacity-80 leading-tight mt-0.5">
                          {translate('instantFindDesc', language)}
                        </div>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setPublicUnlockMode('time_locked')}
                      className={`p-2.5 rounded-xl border text-left transition flex items-start gap-2 cursor-pointer ${
                        publicUnlockMode === 'time_locked'
                          ? 'bg-amber-950 text-amber-100 border-amber-400 ring-2 ring-amber-500 shadow-sm'
                          : 'bg-white/90 text-stone-700 border-amber-300 hover:bg-white'
                      }`}
                    >
                      <Lock className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                      <div>
                        <div className="text-xs font-bold text-amber-100">{translate('timeLockedTitle', language)}</div>
                        <div className="text-[10px] opacity-80 leading-tight mt-0.5">
                          {translate('timeLockedDesc', language)}
                        </div>
                      </div>
                    </button>
                  </div>

                  {/* Unlock Radius Selector */}
                  <div className="flex items-center justify-between pt-1 border-t border-amber-300/60">
                    <span className="text-[10px] font-bold text-amber-900 flex items-center gap-1">
                      <Radio className="w-3 h-3 text-amber-700" />
                      {translate('proximityRadius', language)}:
                    </span>
                    <div className="flex gap-1.5">
                      {[50, 100, 250, 500].map((meters) => (
                        <button
                          key={meters}
                          type="button"
                          onClick={() => setUnlockRadiusMeters(meters)}
                          className={`px-2 py-0.5 rounded-lg text-[10px] font-bold transition cursor-pointer ${
                            unlockRadiusMeters === meters
                              ? 'bg-amber-800 text-amber-100 shadow-xs'
                              : 'bg-white/80 text-stone-700 hover:bg-white border border-amber-300'
                          }`}
                        >
                          {meters}m
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Designated Recipient & Tagged Users */}
              <div className="space-y-2 pt-1 border-t border-amber-200/80">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div>
                    <span className="text-[10px] font-bold text-amber-900 block mb-0.5">
                      {translate('designatedRecipient', language)}:
                    </span>
                    <input
                      type="text"
                      value={recipientUsername}
                      onChange={(e) => setRecipientUsername(e.target.value)}
                      placeholder="@username handle"
                      className="w-full text-xs px-2.5 py-1.5 rounded-lg bg-white border border-amber-300 text-stone-900 focus:outline-none focus:ring-1 focus:ring-amber-500"
                    />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-amber-900 block mb-0.5">
                      {translate('recipientEmail', language)}:
                    </span>
                    <input
                      type="email"
                      value={recipientEmail}
                      onChange={(e) => setRecipientEmail(e.target.value)}
                      placeholder="recipient@example.com"
                      className="w-full text-xs px-2.5 py-1.5 rounded-lg bg-white border border-amber-300 text-stone-900 focus:outline-none focus:ring-1 focus:ring-amber-500"
                    />
                  </div>
                </div>

                <div>
                  <span className="text-[10px] font-bold text-amber-900 block mb-0.5">
                    {translate('tagFriends', language)}:
                  </span>
                  <input
                    type="text"
                    value={taggedUsersInput}
                    onChange={(e) => setTaggedUsersInput(e.target.value)}
                    placeholder="e.g. alice, bob_traveler, charlie"
                    className="w-full text-xs px-2.5 py-1.5 rounded-lg bg-white border border-amber-300 text-stone-900 focus:outline-none focus:ring-1 focus:ring-amber-500"
                  />
                </div>
              </div>
            </div>

            {/* MULTI-MEDIA ATTACHMENTS SECTION */}
            <div className="p-3.5 rounded-xl parchment-subtle border-2 border-amber-400/80 space-y-3 shadow-xs">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-amber-700" />
                  <span className="text-xs font-bold text-amber-950 uppercase tracking-wide">
                    {translate('multimediaAttachments', language)} ({attachments.length})
                  </span>
                </div>
                <span className="text-[10px] font-mono text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full border border-amber-300 font-bold">
                  {translate('unlimitedMediaSubtitle', language)}
                </span>
              </div>

              {/* Upload error banner if any */}
              {uploadError && (
                <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-300 text-rose-900 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{uploadError}</span>
                </div>
              )}

              {/* Quick Action Toolbar to Attach Items */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
                {/* 1. Add Photos */}
                <label className="p-2.5 rounded-xl bg-white hover:bg-amber-50 border border-amber-300 hover:border-amber-400 text-stone-800 flex flex-col items-center justify-center gap-1 cursor-pointer transition shadow-xs">
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleMultiplePhotoUpload}
                    className="hidden"
                    disabled={isProcessingUpload}
                  />
                  <ImageIcon className="w-4 h-4 text-amber-800" />
                  <span className="text-[11px] font-bold">{translate('addPhotos', language)}</span>
                  <span className="text-[9px] text-stone-500">Multi-upload</span>
                </label>

                {/* 2. Add Written Letter / Text Entry */}
                <button
                  type="button"
                  onClick={() => setShowAddLetterModal(true)}
                  className="p-2.5 rounded-xl bg-white hover:bg-amber-50 border border-amber-300 hover:border-amber-400 text-stone-800 flex flex-col items-center justify-center gap-1 cursor-pointer transition shadow-xs"
                >
                  <FileText className="w-4 h-4 text-amber-800" />
                  <span className="text-[11px] font-bold">{translate('addWrittenLetter', language)}</span>
                  <span className="text-[9px] text-stone-500">{translate('secretNotes', language)}</span>
                </button>

                {/* 3. Add Document / File */}
                <label className="p-2.5 rounded-xl bg-white hover:bg-amber-50 border border-amber-300 hover:border-amber-400 text-stone-800 flex flex-col items-center justify-center gap-1 cursor-pointer transition shadow-xs">
                  <input
                    type="file"
                    multiple
                    accept=".pdf,.txt,.doc,.docx,.md,.json"
                    onChange={handleDocumentUpload}
                    className="hidden"
                    disabled={isProcessingUpload}
                  />
                  <File className="w-4 h-4 text-amber-800" />
                  <span className="text-[11px] font-bold">{translate('addDocument', language)}</span>
                  <span className="text-[9px] text-stone-500">PDF, TXT, MD</span>
                </label>

                {/* 4. Paste Image URL */}
                <div className="p-2.5 rounded-xl bg-white border border-amber-300 text-stone-800 flex flex-col justify-between shadow-xs">
                  <span className="text-[10px] font-bold text-amber-900 flex items-center gap-1">
                    <LinkIcon className="w-3 h-3" /> {translate('imageUrl', language)}
                  </span>
                  <div className="flex gap-1 mt-1">
                    <input
                      type="url"
                      value={imageUrlInput}
                      onChange={(e) => setImageUrlInput(e.target.value)}
                      placeholder="https://"
                      className="w-full text-[10px] px-1.5 py-1 rounded bg-amber-50/60 border border-amber-200 text-stone-800"
                    />
                    <button
                      type="button"
                      onClick={handleAddImageUrl}
                      disabled={!imageUrlInput.trim()}
                      className="px-2 py-1 bg-amber-800 text-white rounded text-[10px] font-bold disabled:opacity-40 cursor-pointer"
                    >
                      {translate('add', language)}
                    </button>
                  </div>
                </div>
              </div>

              {/* Voice Recorder Component */}
              <div className="pt-2">
                <VoiceRecorder onAudioReady={handleAudioRecordingReady} />
              </div>

              {/* Interactive Add Written Letter Form Modal / Expansion */}
              {showAddLetterModal && (
                <div className="p-3.5 rounded-xl bg-amber-50 border-2 border-amber-400 space-y-2 animate-in fade-in">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-amber-950 flex items-center gap-1.5">
                      <FileText className="w-3.5 h-3.5 text-amber-800" />
                      {translate('addWrittenLetter', language)}
                    </span>
                    <button
                      type="button"
                      onClick={() => setShowAddLetterModal(false)}
                      className="text-stone-400 hover:text-stone-700"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  <input
                    type="text"
                    value={letterTitle}
                    onChange={(e) => setLetterTitle(e.target.value)}
                    placeholder={translate('letterTitlePlaceholder', language)}
                    className="w-full text-xs px-3 py-1.5 rounded-lg bg-white border border-amber-300 text-stone-900"
                  />
                  <textarea
                    rows={3}
                    value={letterContent}
                    onChange={(e) => setLetterContent(e.target.value)}
                    placeholder={translate('letterContentPlaceholder', language)}
                    className="w-full text-xs leading-relaxed px-3 py-1.5 rounded-lg bg-white border border-amber-300 text-stone-900"
                  />
                  <div className="flex justify-end gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setShowAddLetterModal(false)}
                      className="px-3 py-1 text-xs rounded bg-stone-200 text-stone-700"
                    >
                      {translate('cancel', language)}
                    </button>
                    <button
                      type="button"
                      onClick={handleAddWrittenLetter}
                      disabled={!letterTitle.trim() || !letterContent.trim()}
                      className="px-4 py-1 text-xs rounded bg-amber-800 text-white font-bold disabled:opacity-40"
                    >
                      {translate('attachLetter', language)}
                    </button>
                  </div>
                </div>
              )}

              {/* Itemized Attachments Preview List */}
              {attachments.length > 0 ? (
                <div className="space-y-2 pt-2 border-t border-amber-300/80">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-amber-900 font-mono block">
                    {translate('attachedManifest', language)} ({attachments.length}):
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-56 overflow-y-auto pr-1">
                    {attachments.map((att) => (
                      <div
                        key={att.id}
                        className="p-2.5 rounded-xl bg-white/90 border border-amber-300/80 flex items-center justify-between gap-2 shadow-xs group"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          {att.type === 'photo' ? (
                            <div className="w-10 h-10 rounded-lg overflow-hidden border border-amber-300 shrink-0 bg-stone-100">
                              <img
                                src={att.data_url}
                                alt={att.title}
                                className="w-full h-full object-cover"
                              />
                            </div>
                          ) : att.type === 'audio' ? (
                            <button
                              type="button"
                              onClick={() => handleTogglePlayAudio(att)}
                              className="w-10 h-10 rounded-lg bg-amber-800 text-amber-100 flex items-center justify-center shrink-0 hover:bg-amber-900 transition cursor-pointer"
                            >
                              {playingAudioId === att.id ? (
                                <Pause className="w-4 h-4" />
                              ) : (
                                <Play className="w-4 h-4 translate-x-0.5" />
                              )}
                            </button>
                          ) : att.type === 'letter' ? (
                            <div className="w-10 h-10 rounded-lg bg-amber-100 border border-amber-300 text-amber-800 flex items-center justify-center shrink-0">
                              <FileText className="w-5 h-5" />
                            </div>
                          ) : (
                            <div className="w-10 h-10 rounded-lg bg-cyan-100 border border-cyan-300 text-cyan-800 flex items-center justify-center shrink-0">
                              <FileCheck className="w-5 h-5" />
                            </div>
                          )}

                          <div className="min-w-0">
                            <span className="text-[11px] font-bold text-stone-900 truncate block leading-snug">
                              {att.title}
                            </span>
                            <span className="text-[10px] text-stone-500 flex items-center gap-1 font-mono">
                              <span className="uppercase font-bold text-amber-900">
                                {att.type}
                              </span>
                              {att.duration ? `• ${att.duration}s` : ''}
                              {att.size_bytes ? `• ${formatFileSize(att.size_bytes)}` : ''}
                            </span>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleRemoveAttachment(att.id)}
                          className="p-1.5 rounded-lg text-stone-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer shrink-0"
                          title="Remove attachment"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="p-3 text-center rounded-xl bg-white/40 border border-dashed border-amber-300 text-stone-500 text-[11px]">
                  {translate('noMediaAttached', language)}
                </div>
              )}
            </div>

            {/* Spotify Integration */}
            <SpotifyEmbed
              isEditable={true}
              spotifyUri={spotifyTrack?.uri}
              onSelectTrack={(track) => setSpotifyTrack(track)}
            />

            {/* Arweave Permanence Stamp Notice */}
            <div className="p-3 rounded-xl bg-amber-950/5 border border-amber-300/50 flex items-start gap-2.5 text-[11px] text-stone-700">
              <ShieldCheck className="w-4 h-4 text-amber-800 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-amber-950">
                  {translate('arweavePermaweb', language)}
                </span>
                <p className="mt-0.5 text-stone-600 leading-relaxed">
                  {translate('arweaveNotice', language)}
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center justify-between gap-2.5 pt-2 border-t border-amber-800/15">
              <button
                type="button"
                onClick={handleModalClose}
                className="px-3.5 py-2.5 rounded-xl bg-stone-200 hover:bg-stone-300 text-stone-700 font-semibold text-xs transition cursor-pointer"
              >
                {translate('cancel', language)}
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleSaveAsDraft}
                  className="px-4 py-2.5 rounded-xl bg-amber-100 hover:bg-amber-200 text-amber-950 font-bold text-xs border border-amber-400/70 transition flex items-center gap-1.5 cursor-pointer shadow-xs"
                  title="Save draft to My Vault without locking or burying"
                >
                  <Bookmark className="w-3.5 h-3.5 text-amber-800" />
                  <span>{translate('saveAsDraft', language)}</span>
                </button>

                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-700 to-amber-900 hover:from-amber-800 hover:to-amber-950 text-amber-100 font-bold text-xs transition shadow-lg flex items-center gap-2 cursor-pointer"
                >
                  <Lock className="w-4 h-4 text-amber-300" />
                  <span>{translate('lockAndReview', language)} ({attachments.length + 1} {translate('items', language)})</span>
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
                <span>{translate('preLockManifestTitle', language)}</span>
              </div>
              <p className="text-xs text-amber-200/80 leading-relaxed">
                {translate('preLockManifestNotice', language)}
              </p>
            </div>

            {/* Itemized Summary Breakdown Badges */}
            <div className="p-4 rounded-xl parchment-subtle border border-amber-800/30 space-y-3.5 shadow-sm">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-amber-950 font-mono">
                  {translate('itemsToBeSealed', language)}:
                </h3>
                <span className="text-xs font-mono font-bold text-amber-900 bg-amber-200/80 px-2 py-0.5 rounded-full">
                  {translate('totalItems', language)}: {1 + attachments.length + (spotifyTrack ? 1 : 0)}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {/* 1. Letter Message Badge */}
                <div className="p-3 rounded-lg bg-white/90 border border-amber-300/80 flex items-start gap-2.5">
                  <FileText className="w-4 h-4 text-amber-800 shrink-0 mt-0.5" />
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-stone-900">
                      1 {translate('primaryMemoryLetter', language)}
                    </div>
                    <div className="text-[11px] text-stone-600 truncate">
                      {messageWords} words • &ldquo;{title}&rdquo;
                    </div>
                  </div>
                </div>

                {/* 2. Photo Attachments Badge */}
                <div className="p-3 rounded-lg bg-white/90 border border-amber-300/80 flex items-start gap-2.5">
                  <ImageIcon className="w-4 h-4 text-purple-700 shrink-0 mt-0.5" />
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-stone-900">
                      {photosCount} {translate('photoAttachments', language)}
                    </div>
                    <div className="text-[11px] text-stone-600 truncate">
                      {photosCount > 0 ? translate('highResPreserved', language) : translate('noPhotosAttached', language)}
                    </div>
                  </div>
                </div>

                {/* 3. Voice Notes Badge */}
                <div className="p-3 rounded-lg bg-white/90 border border-amber-300/80 flex items-start gap-2.5">
                  <Mic className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-stone-900">
                      {audioCount} {translate('voiceMemos', language)}
                    </div>
                    <div className="text-[11px] text-stone-600 truncate">
                      {audioCount > 0 ? translate('losslessAudio', language) : translate('noAudioAttached', language)}
                    </div>
                  </div>
                </div>

                {/* 4. Written Letters & Secret Notes */}
                <div className="p-3 rounded-lg bg-white/90 border border-amber-300/80 flex items-start gap-2.5">
                  <FileText className="w-4 h-4 text-blue-700 shrink-0 mt-0.5" />
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-stone-900">
                      {lettersCount} {translate('writtenLetters', language)}
                    </div>
                    <div className="text-[11px] text-stone-600 truncate">
                      {lettersCount > 0 ? translate('secretNotes', language) : translate('noExtraLetters', language)}
                    </div>
                  </div>
                </div>

                {/* 5. Documents Badge */}
                <div className="p-3 rounded-lg bg-white/90 border border-amber-300/80 flex items-start gap-2.5">
                  <File className="w-4 h-4 text-cyan-700 shrink-0 mt-0.5" />
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-stone-900">
                      {docsCount} {translate('documentsCount', language)}
                    </div>
                    <div className="text-[11px] text-stone-600 truncate">
                      {docsCount > 0 ? translate('preservedDocs', language) : translate('noDocsAttached', language)}
                    </div>
                  </div>
                </div>

                {/* 6. Spotify Track Badge */}
                <div className="p-3 rounded-lg bg-white/90 border border-amber-300/80 flex items-start gap-2.5">
                  <Music className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-stone-900 truncate">
                      {spotifyTrack?.title ? `1 Track: ${spotifyTrack.title}` : `0 Spotify Tracks`}
                    </div>
                    <div className="text-[11px] text-stone-600 truncate">
                      {spotifyTrack?.artist || translate('noMusicalTheme', language)}
                    </div>
                  </div>
                </div>
              </div>

              {/* Itemized Attachment Previews */}
              {attachments.length > 0 && (
                <div className="space-y-1.5 pt-2">
                  <span className="text-[10px] font-bold uppercase font-mono text-amber-900">
                    {translate('attachedArtifactsDetails', language)}:
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {attachments.map((att) => (
                      <div
                        key={att.id}
                        className="p-2 rounded-lg bg-white/80 border border-amber-300/60 flex items-center gap-2.5 text-xs text-stone-800"
                      >
                        {att.type === 'photo' && att.data_url && (
                          <img
                            src={att.data_url}
                            alt={att.title}
                            className="w-10 h-10 rounded object-cover border border-amber-300 shrink-0"
                          />
                        )}
                        {att.type === 'audio' && (
                          <div className="w-8 h-8 rounded-full bg-amber-800 text-amber-100 flex items-center justify-center shrink-0">
                            <Mic className="w-4 h-4" />
                          </div>
                        )}
                        {att.type === 'letter' && (
                          <div className="w-8 h-8 rounded bg-amber-100 text-amber-800 flex items-center justify-center shrink-0">
                            <FileText className="w-4 h-4" />
                          </div>
                        )}
                        {att.type === 'document' && (
                          <div className="w-8 h-8 rounded bg-cyan-100 text-cyan-800 flex items-center justify-center shrink-0">
                            <FileCheck className="w-4 h-4" />
                          </div>
                        )}
                        <div className="min-w-0">
                          <div className="font-bold truncate text-xs">{att.title}</div>
                          <div className="text-[10px] text-stone-500 font-mono uppercase">
                            {att.type} {att.duration ? `• ${att.duration}s` : ''}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Earth Location & Time-Lock Info */}
            <div className="p-4 rounded-xl parchment-subtle border border-amber-800/30 space-y-2.5 shadow-sm text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <span className="text-[10px] uppercase font-mono text-stone-500 block">
                    {translate('burialCoordsAndCountry', language)}
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
                    {translate('targetUnlockTime', language)}
                  </span>
                  <div className="font-bold text-amber-950 mt-0.5">
                    {formattedUnlockDate}
                  </div>
                  <div className="text-[11px] text-stone-600">
                    {accessType === 'private' ? translate('privateVaultLock', language) : translate('publicDiscovery', language)}
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
                <span>{translate('backAndEdit', language)}</span>
              </button>

              <button
                type="button"
                onClick={handleFinalBury}
                disabled={isSubmitting}
                className="px-6 py-3 rounded-xl bg-gradient-to-r from-amber-700 via-amber-800 to-amber-950 hover:from-amber-600 hover:to-amber-900 disabled:opacity-50 disabled:cursor-not-allowed text-amber-100 font-bold text-sm transition shadow-xl border-2 border-amber-400/80 flex items-center gap-2 cursor-pointer"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4.5 h-4.5 text-amber-300 animate-spin" />
                    <span>{translate('buryingCapsule', language)}...</span>
                  </>
                ) : (
                  <>
                    <Lock className="w-4.5 h-4.5 text-amber-300" />
                    <span>{translate('buryCapsule', language)}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
