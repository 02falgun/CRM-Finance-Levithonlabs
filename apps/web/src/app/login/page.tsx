'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ShieldCheck, Mail, Lock, Building, AlertCircle } from 'lucide-react';
import { api } from '../../lib/api';
import { saveSession, isAuthenticated } from '../../lib/auth';

export default function LoginPage() {
  const router = useRouter();
  const [subdomain, setSubdomain] = useState('demo');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isAuthenticated()) {
      router.push('/dashboard');
    }
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subdomain || !email || !password) {
      setError('Please fill in all fields');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await api.post(
        '/auth/login',
        { email, password },
        {
          headers: {
            'x-tenant-subdomain': subdomain,
          },
        }
      );

      saveSession({
        token: res.accessToken,
        user: res.user,
        tenant: res.tenant,
      });

      router.push('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Authentication failed. Please verify credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center p-6 relative overflow-hidden bg-slate-950 font-sans">
      {/* Visual background enhancements */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#0f172a_1px,transparent_1px),linear-gradient(to_bottom,#0f172a_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_40%,#000_70%,transparent_100%)] pointer-events-none -z-10" />
      <div className="absolute left-1/4 top-1/3 w-80 h-80 bg-indigo-600/20 rounded-full blur-[100px] pointer-events-none -z-10 animate-pulse" />
      <div className="absolute right-1/4 bottom-1/4 w-80 h-80 bg-orange-600/10 rounded-full blur-[100px] pointer-events-none -z-10" />

      <div className="w-full max-w-md bg-slate-900/60 border border-slate-800/80 backdrop-blur-xl rounded-3xl p-8 shadow-2xl relative">
        {/* Accent strip */}
        <div className="absolute top-0 left-10 right-10 h-0.5 bg-gradient-to-r from-transparent via-[#E86D1F] to-transparent" />

        <div className="space-y-6">
          <div className="text-center space-y-2">
            <div className="flex justify-center mb-2">
              <img src="/logowhite.png" alt="Levithon Labs Logo" className="h-12 object-contain" />
            </div>
            <h1 className="text-2xl font-black text-white font-outfit uppercase tracking-tight">
              Levithon<span className="text-[#E86D1F]">Labs</span> eBilling
            </h1>
            <p className="text-xs text-slate-400">Sign in to access your CRM & Invoicing portal</p>
          </div>

          {error && (
            <div className="flex items-start gap-2.5 bg-rose-500/10 border border-rose-500/20 text-rose-400 p-3.5 rounded-xl text-xs font-semibold">
              <AlertCircle className="h-4.5 w-4.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1">
              <label className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider block">Company Code / Subdomain</label>
              <div className="relative">
                <Building className="absolute left-3.5 top-3 h-4 w-4 text-slate-500" />
                <input
                  type="text"
                  placeholder="e.g. demo"
                  value={subdomain}
                  onChange={(e) => setSubdomain(e.target.value)}
                  className="w-full bg-slate-950/60 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-600 outline-none focus:border-[#E86D1F] transition-all"
                  required
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider block">Corporate Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-3 h-4 w-4 text-slate-500" />
                <input
                  type="email"
                  placeholder="name@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-slate-950/60 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-600 outline-none focus:border-[#E86D1F] transition-all"
                  required
                />
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex justify-between items-center">
                <label className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider block">Password</label>
                <Link href="/forgot-password" className="text-[9px] font-bold text-[#E86D1F] hover:underline uppercase tracking-wider">
                  Forgot Password?
                </Link>
              </div>
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

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#E86D1F] hover:bg-[#ff7e2e] disabled:opacity-50 text-white text-xs font-bold py-3 rounded-xl transition-all shadow-lg shadow-orange-600/10 cursor-pointer flex items-center justify-center gap-1.5"
            >
              {loading ? 'Authenticating...' : 'Sign In to Dashboard'}
            </button>
          </form>

          <div className="text-center pt-2">
            <span className="text-[11px] text-slate-500">Need a new company workspace? </span>
            <Link href="/signup" className="text-[11px] font-bold text-[#E86D1F] hover:underline">
              Create an account
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
