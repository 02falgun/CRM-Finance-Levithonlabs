'use client';

import React, { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { ShieldCheck, Lock, AlertCircle, CheckCircle2, ArrowRight } from 'lucide-react';
import { api } from '../../lib/api';

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!token) {
      setError('Password reset token is missing from the URL.');
      return;
    }

    if (!password || !confirmPassword) {
      setError('Please fill in all fields');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const res = await api.post('/auth/reset-password', {
        token,
        password,
      });

      setSuccess(res.message || 'Password reset successfully.');
      setTimeout(() => {
        router.push('/login');
      }, 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to reset password. The link may have expired.');
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="space-y-4 text-center">
        <div className="flex items-start gap-2.5 bg-rose-500/10 border border-rose-500/20 text-rose-400 p-4 rounded-xl text-xs font-semibold">
          <AlertCircle className="h-4.5 w-4.5 shrink-0" />
          <span>Invalid password reset link. No token detected in the URL query.</span>
        </div>
        <Link
          href="/forgot-password"
          className="inline-block text-xs font-bold text-[#E86D1F] hover:underline uppercase tracking-wider mt-4"
        >
          Request new reset link
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="flex items-start gap-2.5 bg-rose-500/10 border border-rose-500/20 text-rose-400 p-3.5 rounded-xl text-xs font-semibold animate-in fade-in duration-200">
          <AlertCircle className="h-4.5 w-4.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {success ? (
        <div className="space-y-4 animate-in fade-in duration-300">
          <div className="flex items-start gap-2.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 p-3.5 rounded-xl text-xs font-semibold">
            <CheckCircle2 className="h-4.5 w-4.5 shrink-0" />
            <span>{success} Redirecting to login...</span>
          </div>
          <Link
            href="/login"
            className="w-full bg-[#E86D1F] hover:bg-[#ff7e2e] text-white text-xs font-bold py-3 rounded-xl transition-all shadow-lg shadow-orange-600/10 cursor-pointer flex items-center justify-center gap-1.5"
          >
            Go to Sign In <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider block">New Password</label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-3 h-4 w-4 text-slate-500" />
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-slate-950/60 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-600 outline-none focus:border-[#E86D1F] transition-all"
                required
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider block">Confirm Password</label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-3 h-4 w-4 text-slate-500" />
              <input
                type="password"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full bg-slate-950/60 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-600 outline-none focus:border-[#E86D1F] transition-all"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#E86D1F] hover:bg-[#ff7e2e] disabled:opacity-50 text-white text-xs font-bold py-3 rounded-xl transition-all shadow-lg shadow-orange-600/10 cursor-pointer flex items-center justify-center gap-1.5"
          >
            {loading ? 'Updating Password...' : 'Reset Password'}
          </button>
        </form>
      )}
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <main className="min-h-screen flex items-center justify-center p-6 relative overflow-hidden bg-slate-950 font-sans">
      {/* Background gradients */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#0f172a_1px,transparent_1px),linear-gradient(to_bottom,#0f172a_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_40%,#000_70%,transparent_100%)] pointer-events-none -z-10" />
      <div className="absolute left-1/4 top-1/3 w-80 h-80 bg-indigo-600/10 rounded-full blur-[100px] pointer-events-none -z-10" />
      <div className="absolute right-1/4 bottom-1/4 w-80 h-80 bg-orange-600/15 rounded-full blur-[100px] pointer-events-none -z-10 animate-pulse" />

      <div className="w-full max-w-md bg-slate-900/60 border border-slate-800/80 backdrop-blur-xl rounded-3xl p-8 shadow-2xl relative">
        <div className="absolute top-0 left-10 right-10 h-0.5 bg-gradient-to-r from-transparent via-[#E86D1F] to-transparent" />

        <div className="space-y-6">
          <div className="text-center space-y-2">
            <div className="flex justify-center mb-2">
              <img src="/logowhite.png" alt="Levithon Labs Logo" className="h-12 object-contain" />
            </div>
            <h1 className="text-2xl font-black text-white font-outfit uppercase tracking-tight">
              Create New Password
            </h1>
            <p className="text-xs text-slate-400">Establish a secure password for your workspace account</p>
          </div>

          <Suspense fallback={
            <div className="flex h-32 items-center justify-center">
              <div className="w-6 h-6 border-2 border-t-[#E86D1F] border-slate-800 rounded-full animate-spin" />
            </div>
          }>
            <ResetPasswordForm />
          </Suspense>
        </div>
      </div>
    </main>
  );
}
