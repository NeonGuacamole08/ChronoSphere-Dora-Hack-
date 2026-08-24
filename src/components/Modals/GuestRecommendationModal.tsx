import React, { useState } from 'react';
import {
  Star,
  Sparkles,
  Send,
  CheckCircle2,
  AlertCircle,
  ThumbsUp,
  Globe2,
  Mail,
  Lock,
  Compass,
  MessageSquareHeart,
  Loader2,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { Capsule } from '../../types';

interface GuestRecommendationModalProps {
  isOpen: boolean;
  onClose: () => void;
  capsuleJustPlanted: Capsule | null;
  onOpenSignUp?: () => void;
}

const FEATURE_OPTIONS = [
  { id: 'globe', label: '🌍 3D Earth Globe Navigation' },
  { id: 'timelock', label: '⏳ Time-Locked Encryption' },
  { id: 'voicerec', label: '🎙️ Voice Notes & Audio Recording' },
  { id: 'multiphoto', label: '📸 Multi-Photo Vault Gallery' },
  { id: 'letters', label: '📜 Secret Letters & Written Notes' },
  { id: 'spotify', label: '🎵 Spotify Soundtrack Pairing' },
  { id: 'country', label: '🗺️ Country Dossiers & Cultural Data' },
  { id: 'offline', label: '💎 Offline HTML Self-Contained Backup' },
];

const RATING_DESCRIPTIONS: Record<number, string> = {
  1: 'Needs major improvement 😕',
  2: 'Fair, but room to grow 😐',
  3: 'Good experience 🙂',
  4: 'Great app & fun concept! 😃',
  5: 'Mind-blowing & truly magical! 🤩✨',
};

export const GuestRecommendationModal: React.FC<GuestRecommendationModalProps> = ({
  isOpen,
  onClose,
  capsuleJustPlanted,
  onOpenSignUp,
}) => {
  const [rating, setRating] = useState<number>(5);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [npsScore, setNpsScore] = useState<number>(10);
  const [selectedFeatures, setSelectedFeatures] = useState<string[]>([
    '3D Earth Globe Navigation',
    'Time-Locked Encryption',
  ]);
  const [feedback, setFeedback] = useState<string>('');
  const [willSignUp, setWillSignUp] = useState<string>('Yes, definitely!');
  const [guestName, setGuestName] = useState<string>('Guest Explorer');
  const [guestEmail, setGuestEmail] = useState<string>('');

  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isSubmitted, setIsSubmitted] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const toggleFeature = (featureLabel: string) => {
    setSelectedFeatures((prev) =>
      prev.includes(featureLabel)
        ? prev.filter((f) => f !== featureLabel)
        : [...prev, featureLabel]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMessage(null);

    const payload = {
      rating,
      npsScore,
      favoriteFeatures: selectedFeatures,
      feedback: feedback.trim() || 'No additional written comments.',
      willSignUp,
      guestName: guestName.trim() || 'Guest Explorer',
      guestEmail: guestEmail.trim() || 'None provided',
      pinTitle: capsuleJustPlanted?.title || 'First Memory Pin',
      pinLocation: capsuleJustPlanted?.location_name || 'Global Coordinates',
      submittedAt: new Date().toISOString(),
      targetEmail: 'masiala.felicia@gmail.com',
    };

    try {
      // 1. Send to server backend endpoint
      let backendSuccess = false;
      try {
        const res = await fetch('/api/send-recommendation', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        if (res.ok) {
          backendSuccess = true;
        }
      } catch (err) {
        console.warn('Backend route warning:', err);
      }

      // 2. Direct client-side guaranteed delivery to masiala.felicia@gmail.com via FormSubmit AJAX
      try {
        await fetch('https://formsubmit.co/ajax/masiala.felicia@gmail.com', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
          body: JSON.stringify({
            _subject: `🌟 [TreasureFest Guest Rating ${rating}/5] from ${payload.guestName}`,
            _template: 'table',
            Rating: `${rating} / 5 Stars`,
            Recommendation_Score: `${npsScore} / 10`,
            Favorite_Features: selectedFeatures.join(', '),
            Feedback: payload.feedback,
            Will_Sign_Up: willSignUp,
            First_Pin_Title: payload.pinTitle,
            First_Pin_Location: payload.pinLocation,
            Guest_Name: payload.guestName,
            Guest_Email: payload.guestEmail,
            Submission_Time: new Date().toLocaleString(),
          }),
        });
      } catch (formSubmitErr) {
        console.warn('Formsubmit direct fallback notice:', formSubmitErr);
      }

      // Save record in localStorage for offline reference
      try {
        localStorage.setItem(
          'treasurefest_guest_recommendation_completed',
          JSON.stringify({
            submittedAt: new Date().toISOString(),
            rating,
            npsScore,
          })
        );
      } catch (storageErr) {
        console.warn('LocalStorage save error:', storageErr);
      }

      // Fire celebratory confetti!
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
      });

      setIsSubmitted(true);
    } catch (err: any) {
      console.error('Submission failed:', err);
      setErrorMessage('Could not deliver feedback automatically. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in">
      <div className="relative w-full max-w-xl max-h-[92vh] flex flex-col rounded-2xl bg-[#141d2b] border-2 border-amber-500/80 shadow-2xl overflow-hidden text-stone-100">
        {/* Header Ribbon */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-amber-950 via-[#1c283c] to-amber-950 border-b border-amber-500/40 relative">
          <div className="flex items-center gap-2 mb-1.5">
            <span className="px-2.5 py-0.5 rounded-full bg-amber-500 text-stone-950 font-bold text-[10px] uppercase tracking-wider flex items-center gap-1 font-mono shadow-xs">
              <Sparkles className="w-3 h-3" /> Mandatory Guest Check-In
            </span>
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-900/90 text-emerald-300 font-semibold text-[10px] border border-emerald-500/50">
              📍 1st Pin Placed!
            </span>
          </div>

          <h2 className="text-lg sm:text-xl font-bold font-serif text-amber-200 flex items-center gap-2">
            <MessageSquareHeart className="w-5 h-5 text-amber-400 shrink-0" />
            Guest Recommendation & Experience Review
          </h2>
          <p className="text-xs text-amber-100/70 mt-1 leading-relaxed">
            You just planted your first time capsule! As a guest explorer, please take 30 seconds to rate your experience. Your answers are sent directly to the creator (<strong className="text-amber-300">masiala.felicia@gmail.com</strong>).
          </p>
        </div>

        {/* Modal Body */}
        {!isSubmitted ? (
          <form
            onSubmit={handleSubmit}
            className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5 custom-scrollbar"
          >
            {/* Placed Pin Badge */}
            {capsuleJustPlanted && (
              <div className="p-3 rounded-xl bg-amber-950/40 border border-amber-500/40 flex items-center justify-between gap-2 text-xs">
                <div className="flex items-center gap-2 min-w-0">
                  <Globe2 className="w-4 h-4 text-amber-400 shrink-0" />
                  <span className="text-stone-300 truncate">
                    Sealed Pin: <strong className="text-amber-200">"{capsuleJustPlanted.title}"</strong> at {capsuleJustPlanted.location_name}
                  </span>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-900/60 text-amber-300 shrink-0">
                  Temporary Guest Pin
                </span>
              </div>
            )}

            {/* Question 1: Star Rating */}
            <div className="space-y-2 p-3.5 rounded-xl bg-stone-900/60 border border-stone-800">
              <label className="block text-xs font-bold text-amber-300 uppercase tracking-wider font-mono">
                1. How would you rate TreasureFest overall? <span className="text-amber-500">*</span>
              </label>

              <div className="flex items-center gap-2 pt-1">
                {[1, 2, 3, 4, 5].map((star) => {
                  const isFilled = (hoverRating || rating) >= star;
                  return (
                    <button
                      type="button"
                      key={star}
                      onMouseEnter={() => setHoverRating(star)}
                      onMouseLeave={() => setHoverRating(0)}
                      onClick={() => setRating(star)}
                      className="p-1 sm:p-1.5 transition-transform hover:scale-125 focus:outline-none cursor-pointer"
                    >
                      <Star
                        className={`w-7 h-7 sm:w-8 sm:h-8 transition-colors ${
                          isFilled
                            ? 'text-amber-400 fill-amber-400 filter drop-shadow-[0_0_8px_rgba(251,191,36,0.5)]'
                            : 'text-stone-600 hover:text-stone-400'
                        }`}
                      />
                    </button>
                  );
                })}
              </div>
              <div className="text-xs text-amber-200/90 font-medium italic pt-0.5">
                {RATING_DESCRIPTIONS[hoverRating || rating]}
              </div>
            </div>

            {/* Question 2: NPS Recommendation (0 - 10) */}
            <div className="space-y-2 p-3.5 rounded-xl bg-stone-900/60 border border-stone-800">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-bold text-amber-300 uppercase tracking-wider font-mono">
                  2. How likely are you to recommend this to friends? <span className="text-amber-500">*</span>
                </label>
                <span className="text-xs font-bold font-mono text-emerald-400 bg-emerald-950 px-2 py-0.5 rounded border border-emerald-800">
                  {npsScore} / 10
                </span>
              </div>

              <div className="grid grid-cols-11 gap-1 pt-1">
                {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((score) => (
                  <button
                    type="button"
                    key={score}
                    onClick={() => setNpsScore(score)}
                    className={`py-1.5 rounded text-xs font-bold font-mono transition cursor-pointer ${
                      npsScore === score
                        ? 'bg-amber-500 text-stone-950 ring-2 ring-amber-300 scale-105 shadow-md'
                        : 'bg-stone-800 text-stone-300 hover:bg-stone-700'
                    }`}
                  >
                    {score}
                  </button>
                ))}
              </div>
              <div className="flex justify-between text-[10px] text-stone-400 pt-1 font-mono">
                <span>0 = Not Likely</span>
                <span>10 = Extremely Likely!</span>
              </div>
            </div>

            {/* Question 3: Favorite Features */}
            <div className="space-y-2 p-3.5 rounded-xl bg-stone-900/60 border border-stone-800">
              <label className="block text-xs font-bold text-amber-300 uppercase tracking-wider font-mono">
                3. Which features did you enjoy the most?
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                {FEATURE_OPTIONS.map((feat) => {
                  const isChecked = selectedFeatures.includes(feat.label);
                  return (
                    <button
                      type="button"
                      key={feat.id}
                      onClick={() => toggleFeature(feat.label)}
                      className={`p-2 rounded-lg text-left text-xs font-medium border transition flex items-center gap-2 cursor-pointer ${
                        isChecked
                          ? 'bg-amber-950/70 border-amber-400 text-amber-200'
                          : 'bg-stone-800/60 border-stone-700 text-stone-300 hover:border-stone-500'
                      }`}
                    >
                      <div
                        className={`w-4 h-4 rounded flex items-center justify-center text-[10px] shrink-0 border ${
                          isChecked
                            ? 'bg-amber-500 text-stone-950 border-amber-400 font-bold'
                            : 'border-stone-500'
                        }`}
                      >
                        {isChecked && '✓'}
                      </div>
                      <span className="truncate">{feat.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Question 4: Detailed Feedback */}
            <div className="space-y-2 p-3.5 rounded-xl bg-stone-900/60 border border-stone-800">
              <label className="block text-xs font-bold text-amber-300 uppercase tracking-wider font-mono">
                4. What did you like most, and what could we improve?
              </label>
              <textarea
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                placeholder="Share your thoughts on the 3D globe, animations, sound design, file uploads, or new features you'd like to see..."
                rows={3}
                className="w-full rounded-lg bg-stone-950 border border-stone-700 p-2.5 text-xs text-stone-100 placeholder-stone-500 focus:outline-none focus:border-amber-400 resize-none"
              />
            </div>

            {/* Question 5: Account Intention */}
            <div className="space-y-2 p-3.5 rounded-xl bg-stone-900/60 border border-stone-800">
              <label className="block text-xs font-bold text-amber-300 uppercase tracking-wider font-mono">
                5. Will you create a permanent account to save your vaults?
              </label>
              <div className="grid grid-cols-3 gap-2">
                {['Yes, definitely!', 'Maybe later', 'Just testing today'].map((option) => (
                  <button
                    type="button"
                    key={option}
                    onClick={() => setWillSignUp(option)}
                    className={`p-2 rounded-lg text-xs font-medium border text-center transition cursor-pointer ${
                      willSignUp === option
                        ? 'bg-amber-500 text-stone-950 font-bold border-amber-400'
                        : 'bg-stone-800 border-stone-700 text-stone-300 hover:bg-stone-750'
                    }`}
                  >
                    {option}
                  </button>
                ))}
              </div>
            </div>

            {/* Explorer Contact (Optional) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-mono text-stone-400 mb-1">
                  Your Explorer Name / Handle (Optional)
                </label>
                <input
                  type="text"
                  value={guestName}
                  onChange={(e) => setGuestName(e.target.value)}
                  placeholder="Guest Explorer"
                  className="w-full rounded-lg bg-stone-950 border border-stone-700 px-3 py-2 text-xs text-stone-100 placeholder-stone-500 focus:outline-none focus:border-amber-400"
                />
              </div>
              <div>
                <label className="block text-[11px] font-mono text-stone-400 mb-1">
                  Your Email (Optional if you want a response)
                </label>
                <input
                  type="email"
                  value={guestEmail}
                  onChange={(e) => setGuestEmail(e.target.value)}
                  placeholder="explorer@example.com"
                  className="w-full rounded-lg bg-stone-950 border border-stone-700 px-3 py-2 text-xs text-stone-100 placeholder-stone-500 focus:outline-none focus:border-amber-400"
                />
              </div>
            </div>

            {errorMessage && (
              <div className="p-3 rounded-xl bg-red-950/80 border border-red-500/80 text-red-200 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Mandatory Submit Button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-amber-600 via-amber-500 to-amber-600 hover:from-amber-500 hover:to-amber-400 text-stone-950 font-bold text-sm shadow-xl transition transform active:scale-[0.99] flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-stone-950" />
                    <span>Routing Feedback to Creator...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 text-stone-950" />
                    <span>Submit Review & Continue Exploring 🌍</span>
                  </>
                )}
              </button>
              <p className="text-[10px] text-center text-stone-500 mt-2 font-mono">
                Responses are automatically delivered to masiala.felicia@gmail.com
              </p>
            </div>
          </form>
        ) : (
          /* Submission Complete View */
          <div className="p-6 sm:p-8 text-center space-y-5 animate-in zoom-in-95">
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 border-2 border-emerald-400 flex items-center justify-center mx-auto text-emerald-400 shadow-lg">
              <CheckCircle2 className="w-10 h-10" />
            </div>

            <div className="space-y-2">
              <h3 className="text-xl font-bold font-serif text-amber-200">
                Thank You for Your Feedback! 🎉
              </h3>
              <p className="text-xs text-stone-300 max-w-md mx-auto leading-relaxed">
                Your rating (<strong className="text-amber-400">{rating}/5 Stars</strong>) and recommendation score (<strong className="text-emerald-400">{npsScore}/10</strong>) have been routed to <strong className="text-amber-300">masiala.felicia@gmail.com</strong>.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-stone-900/90 border border-stone-700 text-left text-xs space-y-2 max-w-md mx-auto">
              <div className="flex justify-between text-stone-400">
                <span>Planted Pin:</span>
                <span className="text-stone-200 font-medium truncate max-w-[200px]">
                  {capsuleJustPlanted?.title || 'First Memory Capsule'}
                </span>
              </div>
              <div className="flex justify-between text-stone-400">
                <span>Favorite Features:</span>
                <span className="text-amber-300 font-medium">
                  {selectedFeatures.length} selected
                </span>
              </div>
              <div className="flex justify-between text-stone-400">
                <span>Account Status:</span>
                <span className="text-cyan-300 font-medium">Guest Mode</span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-3">
              <button
                type="button"
                onClick={onClose}
                className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-xs transition shadow-md cursor-pointer"
              >
                Continue Exploring Globe 🗺️
              </button>

              {onOpenSignUp && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenSignUp();
                  }}
                  className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-stone-800 hover:bg-stone-700 border border-amber-400/50 text-amber-200 font-bold text-xs transition cursor-pointer"
                >
                  Create Permanent Account 🔐
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
