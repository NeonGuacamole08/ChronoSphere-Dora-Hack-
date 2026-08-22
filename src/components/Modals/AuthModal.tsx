import React, { useState } from 'react';
import {
  X,
  Lock,
  Mail,
  User,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
} from 'lucide-react';
import { supabaseAuth, AppUser } from '../../utils/supabase';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: AppUser | null;
  onAuthSuccess: (user: AppUser) => void;
  onSignOut: () => void;
  initialMode?: 'signin' | 'signup';
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onAuthSuccess,
  onSignOut,
  initialMode = 'signin',
}) => {
  const [mode, setMode] = useState<'signin' | 'signup' | 'profile'>(
    currentUser ? 'profile' : initialMode
  );

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);
    setIsLoading(true);

    if (mode === 'signup') {
      const res = await supabaseAuth.signUp(email, password, username);
      setIsLoading(false);
      if (res.error) {
        setErrorMsg(res.error);
      } else if (res.user) {
        setSuccessMsg(`Welcome ${res.user.username}! A confirmation email has been dispatched to ${res.user.email}.`);
        onAuthSuccess(res.user);
        setTimeout(() => {
          onClose();
        }, 1500);
      }
    } else {
      const res = await supabaseAuth.signInWithPassword(email, password);
      setIsLoading(false);
      if (res.error) {
        setErrorMsg(res.error);
      } else if (res.user) {
        setSuccessMsg(`Signed in as ${res.user.username}! Login confirmation email dispatched.`);
        onAuthSuccess(res.user);
        setTimeout(() => {
          onClose();
        }, 1200);
      }
    }
  };

  const handleGoogleSignIn = async () => {
    setErrorMsg(null);
    setSuccessMsg(null);
    setIsLoading(true);

    const res = await supabaseAuth.signInWithGoogle();
    setIsLoading(false);
    if (res.error) {
      setErrorMsg(res.error);
    } else if (res.user) {
      setSuccessMsg(`Authenticated via Google OAuth as ${res.user.username}! Confirmation email dispatched.`);
      onAuthSuccess(res.user);
      setTimeout(() => {
        onClose();
      }, 1200);
    }
  };

  const handleSignOutClick = async () => {
    await supabaseAuth.signOut();
    onSignOut();
    setMode('signin');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-md flex flex-col rounded-2xl parchment-card border-2 border-amber-800/40 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="tree-bark-banner px-6 py-4 flex items-center justify-between text-amber-50 shadow-md">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-cyan-500 to-emerald-500 p-0.5 shadow-[0_0_15px_rgba(6,182,212,0.5)] shrink-0 flex items-center justify-center">
              <div className="w-full h-full rounded-full bg-[#0c1626] flex items-center justify-center">
                <ShieldCheck className="w-5 h-5 text-cyan-300" />
              </div>
            </div>
            <div>
              <h3 className="font-serif font-bold text-lg text-white leading-tight">
                {currentUser && mode === 'profile'
                  ? 'Authenticated User Profile'
                  : 'Supabase Authentication'}
              </h3>
              <p className="text-xs text-amber-200/80">
                Secure Cryptographic Earth Identity
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-amber-950/60 text-amber-200 hover:text-white transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switcher for unauthenticated users: ONLY Sign In & Create Account */}
        {!currentUser && (
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
        <div className="p-6 space-y-4">
          {/* Status Messages */}
          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-300 text-rose-900 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-900 text-xs flex items-center gap-2 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* ACTIVE LOGGED-IN PROFILE VIEW */}
          {currentUser && mode === 'profile' ? (
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
                    <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 uppercase">
                      Verified
                    </span>
                  </div>
                  <p className="text-xs text-stone-600 truncate mt-0.5">
                    {currentUser.email}
                  </p>
                  <p className="text-[10px] font-mono text-stone-500 mt-1">
                    Provider: {currentUser.provider === 'google' ? 'Google OAuth' : 'Supabase Email Auth'}
                  </p>
                </div>
              </div>

              {/* Security confirmation notice */}
              <div className="p-3 bg-cyan-50 rounded-xl border border-cyan-200 text-xs text-cyan-950 space-y-1">
                <div className="font-bold flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-cyan-600" />
                  Cryptographic Session Secured
                </div>
                <p className="text-[11px] text-cyan-900 leading-relaxed">
                  Only your account possesses decryption privileges for your planted private memory tokens. Automated confirmation notifications are sent on active sign-ins.
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
          ) : (
            /* SIGN IN / SIGN UP FORM */
            <div className="space-y-4">
              {/* Google OAuth One-Click Button */}
              <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={isLoading}
                className="w-full py-2.5 px-4 rounded-xl bg-white hover:bg-stone-50 border-2 border-stone-300 text-stone-800 font-bold text-xs flex items-center justify-center gap-2.5 transition shadow-sm cursor-pointer disabled:opacity-50"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.34 24 12 24z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.98 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.34 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                  />
                </svg>
                <span>Continue with Google OAuth</span>
              </button>

              <div className="flex items-center gap-2 text-stone-500 text-[11px]">
                <div className="flex-1 h-px bg-amber-200" />
                <span>or email authentication</span>
                <div className="flex-1 h-px bg-amber-200" />
              </div>

              <form onSubmit={handleEmailAuth} className="space-y-3">
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
                  <label className="block text-xs font-bold text-stone-800 mb-1">
                    Password
                  </label>
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
                      <span>{mode === 'signup' ? 'Create Supabase Account' : 'Sign In'}</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
