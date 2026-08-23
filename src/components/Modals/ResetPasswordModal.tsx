import React, { useState } from 'react';
import { KeyRound, CheckCircle2, AlertCircle, ArrowRight, X } from 'lucide-react';
import { supabaseAuth } from '../../utils/supabase';

interface ResetPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const ResetPasswordModal: React.FC<ResetPasswordModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (newPassword.length < 6) {
      setErrorMsg('Password must be at least 6 characters.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMsg('Passwords do not match. Please verify both fields.');
      return;
    }

    setIsLoading(true);
    const res = await supabaseAuth.updatePassword(newPassword);
    setIsLoading(false);

    if (res.error) {
      setErrorMsg(res.error);
    } else {
      setSuccessMsg('Your password has been successfully updated! You can now sign in with your new credentials.');
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 1500);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-md flex flex-col rounded-2xl parchment-card border-2 border-amber-800/40 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="tree-bark-banner px-6 py-4 flex items-center justify-between text-amber-50 shadow-md">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-amber-500 to-emerald-500 p-0.5 shadow-[0_0_15px_rgba(245,158,11,0.5)] shrink-0 flex items-center justify-center">
              <div className="w-full h-full rounded-full bg-[#0c1626] flex items-center justify-center">
                <KeyRound className="w-5 h-5 text-amber-300" />
              </div>
            </div>
            <div>
              <h3 className="font-serif font-bold text-lg text-white leading-tight">
                Reset Account Password
              </h3>
              <p className="text-xs text-amber-200/80">
                Supabase Auth Cryptographic Update
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

        {/* Body */}
        <div className="p-6 space-y-4">
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

          <p className="text-xs text-stone-700 leading-relaxed">
            Enter your new master password below to re-secure your memory vault and earth coordinates.
          </p>

          <form onSubmit={handleReset} className="space-y-3">
            <div>
              <label className="block text-xs font-bold text-stone-800 mb-1">
                New Password (minimum 6 characters)
              </label>
              <input
                type="password"
                required
                minLength={6}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full text-xs px-3 py-2.5 rounded-xl bg-white border border-amber-300 text-stone-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-800 mb-1">
                Confirm New Password
              </label>
              <input
                type="password"
                required
                minLength={6}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full text-xs px-3 py-2.5 rounded-xl bg-white border border-amber-300 text-stone-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2.5 px-4 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-emerald-100 font-bold text-xs flex items-center justify-center gap-2 transition shadow-md cursor-pointer disabled:opacity-50 mt-4"
            >
              {isLoading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <span>Save New Password</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
