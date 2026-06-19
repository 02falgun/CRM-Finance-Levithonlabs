'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ShieldCheck, Mail, Lock, Building, User, FileText, AlertCircle } from 'lucide-react';
import { api } from '../../lib/api';
import { saveSession, isAuthenticated } from '../../lib/auth';

export default function SignupPage() {
  const router = useRouter();
  const [subdomain, setSubdomain] = useState('');
  const [tenantName, setTenantName] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [panNumber, setPanNumber] = useState('');
  const [panError, setPanError] = useState('');
  
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isAuthenticated()) {
      router.push('/dashboard');
    }
  }, [router]);

  const handlePanChange = (val: string) => {
    setPanNumber(val);
    if (val && !/^\d{9}$/.test(val)) {
      setPanError('PAN must be exactly 9 numeric digits');
    } else {
      setPanError('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subdomain || !tenantName || !name || !email || !password) {
      setError('Please fill in all required fields');
      return;
    }
    if (panNumber && !/^\d{9}$/.test(panNumber)) {
      setPanError('PAN must be exactly 9 numeric digits before submitting');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await api.post('/auth/register', {
        subdomain: subdomain.trim().toLowerCase(),
        tenantName,
        name,
        email,
        password,
        panNumber: panNumber || undefined,
      });

      saveSession({
        token: res.accessToken,
        user: res.user,
        tenant: res.tenant,
      });

      router.push('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Registration failed. Please check inputs.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center p-6 relative overflow-hidden bg-slate-950 font-sans">
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#0f172a_1px,transparent_1px),linear-gradient(to_bottom,#0f172a_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_40%,#000_70%,transparent_100%)] pointer-events-none -z-10" />
      <div className="absolute left-1/4 top-1/4 w-80 h-80 bg-indigo-600/10 rounded-full blur-[100px] pointer-events-none -z-10" />
      <div className="absolute right-1/4 bottom-1/4 w-80 h-80 bg-orange-600/15 rounded-full blur-[100px] pointer-events-none -z-10 animate-pulse" />

      <div className="w-full max-w-lg bg-slate-900/60 border border-slate-800/80 backdrop-blur-xl rounded-3xl p-8 shadow-2xl relative my-8">
        <div className="absolute top-0 left-10 right-10 h-0.5 bg-gradient-to-r from-transparent via-[#E86D1F] to-transparent" />

        <div className="space-y-6">
          <div className="text-center space-y-1">
            <div className="flex justify-center mb-2">
              <img src="/logowhite.png" alt="Levithon Labs Logo" className="h-12 object-contain" />
            </div>
            <h1 className="text-2xl font-black text-white font-outfit uppercase tracking-tight">
              Create SaaS Workspace
            </h1>
            <p className="text-xs text-slate-400">Register your Nepalese company and allocate owner details</p>
          </div>

          {error && (
            <div className="flex items-start gap-2.5 bg-rose-500/10 border border-rose-500/20 text-rose-400 p-3.5 rounded-xl text-xs font-semibold">
              <AlertCircle className="h-4.5 w-4.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider block">Company Code / Subdomain *</label>
                <div className="relative">
                  <Building className="absolute left-3.5 top-3 h-4 w-4 text-slate-500" />
                  <input
                    type="text"
                    placeholder="e.g. kavyatech"
                    value={subdomain}
                    onChange={(e) => setSubdomain(e.target.value)}
                    className="w-full bg-slate-950/60 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-600 outline-none focus:border-[#E86D1F] transition-all"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider block">Registered Company Name *</label>
                <div className="relative">
                  <Building className="absolute left-3.5 top-3 h-4 w-4 text-slate-500" />
                  <input
                    type="text"
                    placeholder="e.g. KavTech Nepal Pvt Ltd"
                    value={tenantName}
                    onChange={(e) => setTenantName(e.target.value)}
                    className="w-full bg-slate-950/60 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-600 outline-none focus:border-[#E86D1F] transition-all"
                    required
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider block">Owner Full Name *</label>
                <div className="relative">
                  <User className="absolute left-3.5 top-3 h-4 w-4 text-slate-500" />
                  <input
                    type="text"
                    placeholder="e.g. Kavya Kumar Thakur"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-slate-950/60 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-600 outline-none focus:border-[#E86D1F] transition-all"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider block">Company PAN/VAT (9 Digits)</label>
                <div className="relative">
                  <FileText className="absolute left-3.5 top-3 h-4 w-4 text-slate-500" />
                  <input
                    type="text"
                    placeholder="e.g. 987654321"
                    value={panNumber}
                    onChange={(e) => handlePanChange(e.target.value)}
                    className={`w-full bg-slate-950/60 border rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-600 outline-none focus:border-[#E86D1F] transition-all ${
                      panError ? 'border-rose-500' : 'border-slate-800'
                    }`}
                  />
                </div>
                {panError && (
                  <p className="text-[9px] text-rose-400 mt-1 flex items-center gap-1 font-semibold">
                    <AlertCircle className="h-3 w-3" /> {panError}
                  </p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider block">Email Address *</label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-3 h-4 w-4 text-slate-500" />
                  <input
                    type="email"
                    placeholder="owner@company.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-slate-950/60 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-600 outline-none focus:border-[#E86D1F] transition-all"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider block">Password *</label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-3 h-4 w-4 text-slate-500" />
                  <input
                    type="password"
                    placeholder="Min 6 characters"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-slate-950/60 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-600 outline-none focus:border-[#E86D1F] transition-all"
                    required
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || !!panError}
              className="w-full bg-[#E86D1F] hover:bg-[#ff7e2e] disabled:opacity-50 text-white text-xs font-bold py-3 rounded-xl transition-all shadow-lg shadow-orange-600/10 cursor-pointer flex items-center justify-center gap-1.5"
            >
              {loading ? 'Creating Workspace...' : 'Register and Setup Workspace'}
            </button>
          </form>

          <div className="text-center pt-2">
            <span className="text-[11px] text-slate-500">Already have a workspace? </span>
            <Link href="/login" className="text-[11px] font-bold text-[#E86D1F] hover:underline">
              Sign In
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
