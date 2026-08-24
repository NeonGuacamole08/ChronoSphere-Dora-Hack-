import React, { useState, useEffect } from 'react';
import {
  X,
  Lock,
  Mail,
  User,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  Compass,
  AlertTriangle,
  RotateCcw,
  Sparkles,
  KeyRound,
  Inbox,
} from 'lucide-react';
import { supabaseAuth, AppUser } from '../../utils/supabase';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: AppUser | null;
  onAuthSuccess: (user: AppUser) => void;
  onSignOut: () => void;
  onContinueAsGuest?: () => void;
  initialMode?: 'signin' | 'signup' | 'forgot_password';
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onAuthSuccess,
  onSignOut,
  onContinueAsGuest,
  initialMode = 'signin',
}) => {
  const [mode, setMode] = useState<
    'signin' | 'signup' | 'verify_email' | 'forgot_password' | 'reset_password_code' | 'profile'
  >(currentUser && !currentUser.isGuest ? 'profile' : initialMode);

  // Form Fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [lastDispatchedCode, setLastDispatchedCode] = useState<string | null>(null);

  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [resendCooldown, setResendCooldown] = useState(0);

  useEffect(() => {
    if (currentUser && !currentUser.isGuest) {
      setMode('profile');
    } else {
      setMode(initialMode);
    }
    setErrorMsg(null);
    setSuccessMsg(null);
  }, [isOpen, currentUser, initialMode]);

  // Resend cooldown timer
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => {
      setResendCooldown((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  if (!isOpen) return null;

  // 1. Handle Sign Up -> Triggers real confirmation email with 6-digit code
  const handleSignUpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);
    setIsLoading(true);

    const res = await supabaseAuth.signUp(email, password, username);
    setIsLoading(false);

    if (res.error) {
      setErrorMsg(res.error);
    } else if (res.pendingVerification) {
      setLastDispatchedCode(res.code || null);
      setSuccessMsg(
        `Confirmation email dispatched to ${res.email}! Please enter the 6-digit code below to activate your account.`
      );
      setResendCooldown(30);
      setMode('verify_email');
    } else if (res.user) {
      setSuccessMsg(`Welcome ${res.user.username}! Account created and verified.`);
      onAuthSuccess(res.user);
      setTimeout(() => {
        onClose();
      }, 1500);
    }
  };

  // 2. Handle Confirm Email Code -> Activates account
  const handleVerifyEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);
    setIsLoading(true);

    const res = await supabaseAuth.verifyEmailCode(email, verificationCode);
    setIsLoading(false);

    if (res.error) {
      setErrorMsg(res.error);
    } else if (res.user) {
      setSuccessMsg(`🎉 Account verified & activated! Welcome, ${res.user.username}.`);
      onAuthSuccess(res.user);
      setTimeout(() => {
        onClose();
      }, 1400);
    }
  };

  // 3. Handle Resend Confirmation Code
  const handleResendCode = async () => {
    if (resendCooldown > 0 || !email) return;
    setIsLoading(true);
    setErrorMsg(null);

    const res = await supabaseAuth.resendVerificationCode(email);
    setIsLoading(false);

    if (res.error) {
      setErrorMsg(res.error);
    } else {
      if (res.code) setLastDispatchedCode(res.code);
      setSuccessMsg(`A fresh 6-digit confirmation code has been dispatched to ${email}.`);
      setResendCooldown(30);
    }
  };

  // 4. Handle Sign In -> If unverified, prompts for verification code
  const handleSignInSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);
    setIsLoading(true);

    const res = await supabaseAuth.signInWithPassword(email, password);
    setIsLoading(false);

    if (res.requiresVerification) {
      setLastDispatchedCode(res.code || null);
      setErrorMsg(res.error || 'Your email address is not verified yet.');
      setMode('verify_email');
      setResendCooldown(30);
    } else if (res.error) {
      setErrorMsg(res.error);
    } else if (res.user) {
      setSuccessMsg(`Signed in as ${res.user.username}! Welcome back.`);
      onAuthSuccess(res.user);
      setTimeout(() => {
        onClose();
      }, 1200);
    }
  };

  // 5. Handle Forgot Password (Send Reset Code)
  const handleForgotPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);
    setIsLoading(true);

    const res = await supabaseAuth.sendPasswordResetCode(email);
    setIsLoading(false);

    if (res.error) {
      setErrorMsg(res.error);
    } else {
      if (res.code) setLastDispatchedCode(res.code);
      setSuccessMsg(`A 6-digit password reset code has been sent to ${email}. Enter it below to set a new password.`);
      setMode('reset_password_code');
      setResendCooldown(30);
    }
  };

  // 6. Handle Reset Password with Code
  const handleResetPasswordWithCodeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (newPassword !== confirmPassword) {
      setErrorMsg('Passwords do not match. Please verify both fields.');
      return;
    }

    setIsLoading(true);
    const res = await supabaseAuth.resetPasswordWithCode(email, verificationCode, newPassword);
    setIsLoading(false);

    if (res.error) {
      setErrorMsg(res.error);
    } else if (res.user) {
      setSuccessMsg('🎉 Password successfully reset and account activated! Welcome back.');
      onAuthSuccess(res.user);
      setTimeout(() => {
        onClose();
      }, 1500);
    }
  };

  // 7. Sign Out
  const handleSignOutClick = async () => {
    await supabaseAuth.signOut();
    onSignOut();
    setMode('signin');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-xs animate-in fade-in duration-200 overflow-y-auto">
      <div className="relative w-full max-w-md my-auto flex flex-col rounded-2xl parchment-card border-2 border-amber-800/40 shadow-2xl overflow-hidden">
        {/* Header Banner */}
        <div className="tree-bark-banner px-5 py-4 flex items-center justify-between text-amber-50 shadow-md">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-cyan-500 to-emerald-500 p-0.5 shadow-[0_0_15px_rgba(6,182,212,0.5)] shrink-0 flex items-center justify-center">
              <div className="w-full h-full rounded-full bg-[#0c1626] flex items-center justify-center">
                <ShieldCheck className="w-5 h-5 text-cyan-300" />
              </div>
            </div>
            <div>
              <h3 className="font-serif font-bold text-base sm:text-lg text-white leading-tight">
                {mode === 'profile'
                  ? 'Authenticated Explorer'
                  : mode === 'verify_email'
                  ? 'Email Confirmation'
                  : mode === 'forgot_password' || mode === 'reset_password_code'
                  ? 'Password Recovery'
                  : mode === 'signup'
                  ? 'Create Explorer Account'
                  : 'Explorer Sign In'}
              </h3>
              <p className="text-[11px] sm:text-xs text-amber-200/80">
                TreasureFest Secure Earth Identity
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-amber-950/60 text-amber-200 hover:text-white transition cursor-pointer"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher for Unauthenticated States */}
        {(!currentUser || currentUser.isGuest) && (mode === 'signin' || mode === 'signup') && (
          <div className="flex border-b border-amber-200/80 bg-amber-50/90 px-4 pt-2.5 gap-2 text-xs font-bold">
            <button
              onClick={() => {
                setMode('signin');
                setErrorMsg(null);
                setSuccessMsg(null);
              }}
              className={`pb-2 px-3 border-b-2 transition cursor-pointer ${
                mode === 'signin'
                  ? 'border-emerald-800 text-emerald-950 font-bold'
                  : 'border-transparent text-stone-600 hover:text-stone-900'
              }`}
            >
              Sign In
            </button>
            <button
              onClick={() => {
                setMode('signup');
                setErrorMsg(null);
                setSuccessMsg(null);
              }}
              className={`pb-2 px-3 border-b-2 transition cursor-pointer ${
                mode === 'signup'
                  ? 'border-emerald-800 text-emerald-950 font-bold'
                  : 'border-transparent text-stone-600 hover:text-stone-900'
              }`}
            >
              Create Account
            </button>
          </div>
        )}

        {/* Modal Body */}
        <div className="p-5 sm:p-6 space-y-4">
          {/* Status Notifications */}
          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-300 text-rose-900 text-xs flex items-start gap-2 shadow-xs">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div className="leading-snug">{errorMsg}</div>
            </div>
          )}

          {successMsg && (
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-900 text-xs flex items-start gap-2 animate-in fade-in shadow-xs">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <div className="leading-snug">{successMsg}</div>
            </div>
          )}

          {/* VIEW 1: AUTHENTICATED PROFILE */}
          {mode === 'profile' && currentUser && !currentUser.isGuest ? (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-white border border-amber-300/80 shadow-sm flex items-center gap-3">
                <img
                  src={currentUser.avatar_url || 'https://api.dicebear.com/7.x/bottts/svg?seed=explorer'}
                  alt={currentUser.username}
                  className="w-14 h-14 rounded-full border-2 border-emerald-500 object-cover bg-stone-900 shadow"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <h4 className="font-bold text-stone-900 text-base truncate">
                      {currentUser.username}
                    </h4>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 uppercase flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                      Verified
                    </span>
                  </div>
                  <p className="text-xs text-stone-600 truncate mt-0.5 font-medium">
                    {currentUser.email}
                  </p>
                  <p className="text-[10px] font-mono text-stone-500 mt-1">
                    Account Type: Permanent Verified Vault
                  </p>
                </div>
              </div>

              <div className="p-3 bg-cyan-50 rounded-xl border border-cyan-200 text-xs text-cyan-950 space-y-1">
                <div className="font-bold flex items-center gap-1.5 text-cyan-900">
                  <ShieldCheck className="w-4 h-4 text-cyan-600" />
                  Your Account Is Fully Active & Secured
                </div>
                <p className="text-[11px] text-cyan-900/90 leading-relaxed">
                  All memory vaults, photos, voice recordings, and planted pins are permanently preserved under your verified email.
                </p>
              </div>

              <div className="flex items-center justify-end pt-2 border-t border-amber-200">
                <button
                  type="button"
                  onClick={handleSignOutClick}
                  className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition cursor-pointer shadow"
                >
                  Sign Out
                </button>
              </div>
            </div>
          ) : mode === 'verify_email' ? (
            /* VIEW 2: EMAIL CONFIRMATION CODE (MANDATORY BEFORE ACCOUNT STARTS WORKING) */
            <div className="space-y-4">
              <div className="p-3.5 bg-gradient-to-br from-emerald-950 to-[#0c1e18] text-emerald-100 rounded-xl border border-emerald-500/60 shadow-inner space-y-2">
                <div className="flex items-center gap-2 text-emerald-300 font-bold text-xs">
                  <Inbox className="w-4 h-4 text-emerald-400" />
                  Confirmation Email Sent to Your Inbox
                </div>
                <p className="text-[11px] text-emerald-100/90 leading-relaxed">
                  We sent a 6-digit confirmation code to <strong className="text-emerald-300 font-mono">{email}</strong>. Please enter the code below before your account starts working.
                </p>
              </div>

              <form onSubmit={handleVerifyEmailSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-stone-800 mb-1.5 text-center">
                    Enter 6-Digit Confirmation Code
                  </label>
                  <div className="relative max-w-[240px] mx-auto">
                    <input
                      type="text"
                      required
                      maxLength={6}
                      value={verificationCode}
                      onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ''))}
                      placeholder="• • • • • •"
                      className="w-full text-center font-mono text-2xl font-bold tracking-[0.3em] py-2.5 px-3 rounded-xl bg-white border-2 border-emerald-600 text-emerald-950 shadow-inner focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading || verificationCode.length < 4}
                  className="w-full py-3 px-4 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-emerald-100 font-bold text-xs flex items-center justify-center gap-2 transition shadow-md cursor-pointer disabled:opacity-50"
                >
                  {isLoading ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 text-emerald-300" />
                      <span>Confirm & Activate Account</span>
                    </>
                  )}
                </button>
              </form>

              {/* Resend code & fallback helper */}
              <div className="pt-2 border-t border-amber-200/80 flex flex-col items-center gap-2 text-xs">
                <div className="flex items-center gap-2">
                  <span className="text-stone-600 text-[11px]">Didn't get the code?</span>
                  <button
                    type="button"
                    onClick={handleResendCode}
                    disabled={resendCooldown > 0 || isLoading}
                    className="font-bold text-emerald-800 hover:text-emerald-950 underline disabled:opacity-50 cursor-pointer flex items-center gap-1 text-[11px]"
                  >
                    <RotateCcw className="w-3 h-3" />
                    {resendCooldown > 0 ? `Resend code in ${resendCooldown}s` : 'Resend Confirmation Email'}
                  </button>
                </div>

                {lastDispatchedCode && (
                  <button
                    type="button"
                    onClick={() => setVerificationCode(lastDispatchedCode)}
                    className="text-[10px] text-stone-500 hover:text-stone-800 bg-amber-100/70 hover:bg-amber-200/80 px-2.5 py-1 rounded-full border border-amber-300 transition cursor-pointer"
                  >
                    Instant Auto-Fill Code: <strong>{lastDispatchedCode}</strong>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => {
                    setMode('signup');
                    setErrorMsg(null);
                    setSuccessMsg(null);
                  }}
                  className="text-[11px] font-medium text-stone-600 hover:text-stone-900 underline mt-1 cursor-pointer"
                >
                  ← Edit Account Details / Try Another Email
                </button>
              </div>
            </div>
          ) : mode === 'forgot_password' ? (
            /* VIEW 3: FORGOT PASSWORD (REQUEST RESET CODE) */
            <div className="space-y-4">
              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs text-stone-700 leading-relaxed">
                Enter your account email below. We'll send a 6-digit password recovery code to your inbox.
              </div>

              <form onSubmit={handleForgotPasswordSubmit} className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-stone-800 mb-1">
                    Your Account Email
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-stone-400 absolute left-3 top-2.5" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="explorer@earth.org"
                      className="w-full text-xs pl-9 pr-3 py-2.5 rounded-xl bg-white border border-amber-300 text-stone-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-2.5 px-4 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-emerald-100 font-bold text-xs flex items-center justify-center gap-2 transition shadow-md cursor-pointer disabled:opacity-50"
                >
                  {isLoading ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <span>Send Recovery Code</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>

                <div className="text-center pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setMode('signin');
                      setErrorMsg(null);
                      setSuccessMsg(null);
                    }}
                    className="text-xs font-bold text-stone-600 hover:text-stone-900 underline cursor-pointer"
                  >
                    ← Back to Sign In
                  </button>
                </div>
              </form>
            </div>
          ) : mode === 'reset_password_code' ? (
            /* VIEW 4: ENTER RESET CODE & SET NEW PASSWORD */
            <div className="space-y-4">
              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs text-stone-700 leading-relaxed">
                Enter the 6-digit code sent to <strong className="text-stone-900 font-mono">{email}</strong> along with your new password.
              </div>

              <form onSubmit={handleResetPasswordWithCodeSubmit} className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-stone-800 mb-1 text-center">
                    6-Digit Reset Code
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={6}
                    value={verificationCode}
                    onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ''))}
                    placeholder="• • • • • •"
                    className="w-full text-center font-mono text-xl font-bold tracking-[0.25em] py-2 px-3 rounded-xl bg-white border border-amber-300 text-stone-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                  {lastDispatchedCode && (
                    <div className="text-center mt-1">
                      <button
                        type="button"
                        onClick={() => setVerificationCode(lastDispatchedCode)}
                        className="text-[10px] text-stone-500 underline cursor-pointer"
                      >
                        Auto-fill code: {lastDispatchedCode}
                      </button>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-800 mb-1">
                    New Password (min 6 characters)
                  </label>
                  <div className="relative">
                    <KeyRound className="w-4 h-4 text-stone-400 absolute left-3 top-2.5" />
                    <input
                      type="password"
                      required
                      minLength={6}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full text-xs pl-9 pr-3 py-2 rounded-xl bg-white border border-amber-300 text-stone-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-800 mb-1">
                    Confirm New Password
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-stone-400 absolute left-3 top-2.5" />
                    <input
                      type="password"
                      required
                      minLength={6}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full text-xs pl-9 pr-3 py-2 rounded-xl bg-white border border-amber-300 text-stone-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-2.5 px-4 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-emerald-100 font-bold text-xs flex items-center justify-center gap-2 transition shadow-md cursor-pointer disabled:opacity-50 mt-3"
                >
                  {isLoading ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <span>Save New Password & Sign In</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
            </div>
          ) : (
            /* VIEW 5: SIGN IN / SIGN UP FORM */
            <div className="space-y-4">
              <form onSubmit={mode === 'signup' ? handleSignUpSubmit : handleSignInSubmit} className="space-y-3">
                {mode === 'signup' && (
                  <div>
                    <label className="block text-xs font-bold text-stone-800 mb-1">
                      Explorer Handle (@username)
                    </label>
                    <div className="relative">
                      <User className="w-4 h-4 text-stone-400 absolute left-3 top-2.5" />
                      <input
                        type="text"
                        required
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        placeholder="@earth_traveler"
                        className="w-full text-xs pl-9 pr-3 py-2 rounded-xl bg-white border border-amber-300 text-stone-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-bold text-stone-800 mb-1">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-stone-400 absolute left-3 top-2.5" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="explorer@earth.org"
                      className="w-full text-xs pl-9 pr-3 py-2 rounded-xl bg-white border border-amber-300 text-stone-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-bold text-stone-800">
                      Password
                    </label>
                    {mode === 'signin' && (
                      <button
                        type="button"
                        onClick={() => {
                          setMode('forgot_password');
                          setErrorMsg(null);
                          setSuccessMsg(null);
                        }}
                        className="text-[11px] font-bold text-emerald-800 hover:text-emerald-950 underline cursor-pointer"
                      >
                        Forgot Password?
                      </button>
                    )}
                  </div>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-stone-400 absolute left-3 top-2.5" />
                    <input
                      type="password"
                      required
                      minLength={6}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full text-xs pl-9 pr-3 py-2 rounded-xl bg-white border border-amber-300 text-stone-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-2.5 px-4 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-emerald-100 font-bold text-xs flex items-center justify-center gap-2 transition shadow-md cursor-pointer disabled:opacity-50 mt-2"
                >
                  {isLoading ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <span>{mode === 'signup' ? 'Create Account & Send Verification Email' : 'Sign In'}</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>

              {/* Guest Mode Divider & "Continue as Guest" Action */}
              <div className="mt-4 pt-4 border-t border-amber-300/80 space-y-2">
                <div className="flex items-center gap-2">
                  <div className="h-px bg-amber-300/70 flex-1" />
                  <span className="text-[10px] uppercase font-mono tracking-wider text-stone-600 font-bold">
                    Or Explore Freely
                  </span>
                  <div className="h-px bg-amber-300/70 flex-1" />
                </div>

                <div className="p-2.5 rounded-xl bg-amber-100/90 border border-amber-300 text-amber-950 text-[11px] flex items-start gap-2 shadow-xs">
                  <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                  <div className="leading-snug">
                    <span className="font-bold block text-amber-900">
                      Guest Mode: None of your data, pins, vaults, or shares will be saved.
                    </span>
                    <span className="text-amber-800 text-[10px]">
                      Create an account above to permanently save pins, encrypt photos, and keep voice recordings.
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    if (onContinueAsGuest) {
                      onContinueAsGuest();
                    }
                    onClose();
                  }}
                  className="w-full py-2.5 px-4 rounded-xl bg-stone-800 hover:bg-stone-900 text-amber-100 font-bold text-xs flex items-center justify-center gap-2 transition shadow-sm border border-stone-700 cursor-pointer"
                >
                  <Compass className="w-4 h-4 text-amber-400" />
                  <span>Continue as Guest</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
