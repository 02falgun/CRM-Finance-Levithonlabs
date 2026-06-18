'use client';

import React, { useState, useEffect } from 'react';
import { Building2, ShieldCheck, Save } from 'lucide-react';
import { api } from '../../../lib/api';

export default function SettingsPage() {
  const [loading, setLoading] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingGateways, setSavingGateways] = useState(false);

  // Company Profile states
  const [compName, setCompName] = useState('');
  const [compPan, setCompPan] = useState('');
  const [compEmail, setCompEmail] = useState('');
  const [compPhone, setCompPhone] = useState('');
  const [compAddress, setCompAddress] = useState('');

  // Integrations states
  const [irdApi, setIrdApi] = useState('');
  const [smsGateway, setSmsGateway] = useState('');
  const [smsToken, setSmsToken] = useState('');

  useEffect(() => {
    fetchConfigs();
  }, []);

  async function fetchConfigs() {
    try {
      setLoading(true);
      const [profile, settings] = await Promise.all([
        api.get('/tenant/profile'),
        api.get('/tenant/settings')
      ]);

      if (profile) {
        setCompName(profile.name || '');
        setCompPan(profile.panNumber || '');
        setCompEmail(profile.email || '');
        setCompPhone(profile.phone || '');
        setCompAddress(profile.address || '');
      }

      if (settings && Array.isArray(settings)) {
        const irdSetting = settings.find((s: any) => s.key === 'IRD_API_ENDPOINT');
        const smsSetting = settings.find((s: any) => s.key === 'SMS_GATEWAY_API');
        const tokenSetting = settings.find((s: any) => s.key === 'SMS_GATEWAY_TOKEN');

        if (irdSetting) setIrdApi(irdSetting.value);
        if (smsSetting) setSmsGateway(smsSetting.value);
        if (tokenSetting) setSmsToken(tokenSetting.value);
      }
    } catch (err: any) {
      alert('Failed to load system settings: ' + err.message);
    } finally {
      setLoading(false);
    }
  }

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSavingProfile(true);
      await api.patch('/tenant/profile', {
        name: compName,
        panNumber: compPan,
        email: compEmail || undefined,
        phone: compPhone || undefined,
        address: compAddress || undefined
      });
      alert('Company billing profile updated successfully!');
      await fetchConfigs();
    } catch (err: any) {
      alert('Failed to update company profile: ' + err.message);
    } finally {
      setSavingProfile(false);
    }
  };

  const handleSaveIntegrations = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSavingGateways(true);
      await Promise.all([
        api.put('/tenant/settings/IRD_API_ENDPOINT', { value: irdApi }),
        api.put('/tenant/settings/SMS_GATEWAY_API', { value: smsGateway }),
        api.put('/tenant/settings/SMS_GATEWAY_TOKEN', { value: smsToken })
      ]);
      alert('eBilling & SMS Gateway configurations saved!');
      await fetchConfigs();
    } catch (err: any) {
      alert('Failed to save integration settings: ' + err.message);
    } finally {
      setSavingGateways(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="text-center space-y-2">
          <div className="w-8 h-8 border-4 border-t-[#E86D1F] border-r-transparent border-slate-200 rounded-full animate-spin mx-auto" />
          <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Syncing System Settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-xl font-black text-[#111111] font-outfit uppercase">Platform Settings</h1>
        <p className="text-xs text-slate-500 mt-1">Manage corporate profiles, taxpayer declarations, and API gateway routes</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        {/* Company profile configs */}
        <div className="premium-card p-6 rounded-2xl bg-white space-y-4">
          <div className="border-b border-slate-100 pb-3 flex items-center gap-1.5 text-slate-400">
            <Building2 className="h-4.5 w-4.5 text-[#E86D1F]" />
            <h2 className="text-xs font-black uppercase tracking-wider text-[#111111]">Company billing profile</h2>
          </div>

          <form onSubmit={handleSaveProfile} className="space-y-3.5">
            <div className="space-y-1">
              <label className="text-[10px] text-slate-400 font-bold uppercase">Company Legal Name</label>
              <input 
                type="text" 
                value={compName}
                onChange={(e) => setCompName(e.target.value)}
                className="w-full bg-[#F8F8F8] border border-slate-200/80 rounded-xl p-2.5 text-xs outline-none focus:border-[#E86D1F] text-[#111111]"
                required
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] text-slate-400 font-bold uppercase">Seller VAT/PAN Number (9 Digits)</label>
              <input 
                type="text" 
                value={compPan}
                onChange={(e) => setCompPan(e.target.value)}
                className="w-full bg-[#F8F8F8] border border-slate-200/80 rounded-xl p-2.5 text-xs outline-none focus:border-[#E86D1F] font-mono text-[#111111]"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] text-slate-400 font-bold uppercase">Email Address</label>
                <input 
                  type="email" 
                  value={compEmail}
                  onChange={(e) => setCompEmail(e.target.value)}
                  className="w-full bg-[#F8F8F8] border border-slate-200/80 rounded-xl p-2.5 text-xs outline-none focus:border-[#E86D1F] text-[#111111]"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] text-slate-400 font-bold uppercase">Phone Contact</label>
                <input 
                  type="text" 
                  value={compPhone}
                  onChange={(e) => setCompPhone(e.target.value)}
                  className="w-full bg-[#F8F8F8] border border-slate-200/80 rounded-xl p-2.5 text-xs outline-none focus:border-[#E86D1F] text-[#111111]"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] text-slate-400 font-bold uppercase">Physical Address</label>
              <input 
                type="text" 
                value={compAddress}
                onChange={(e) => setCompAddress(e.target.value)}
                className="w-full bg-[#F8F8F8] border border-slate-200/80 rounded-xl p-2.5 text-xs outline-none focus:border-[#E86D1F] text-[#111111]"
              />
            </div>

            <button 
              type="submit" 
              disabled={savingProfile}
              className="bg-slate-900 hover:bg-[#E86D1F] text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-all flex items-center gap-1.5 shadow-sm"
            >
              <Save className="h-4 w-4" /> {savingProfile ? 'Saving...' : 'Save Profile Details'}
            </button>
          </form>
        </div>

        {/* IRD & SMS Integration settings */}
        <div className="premium-card p-6 rounded-2xl bg-white space-y-4">
          <div className="border-b border-slate-100 pb-3 flex items-center gap-1.5 text-slate-400">
            <ShieldCheck className="h-4.5 w-4.5 text-[#E86D1F]" />
            <h2 className="text-xs font-black uppercase tracking-wider text-[#111111]">IRD portal & integrations</h2>
          </div>

          <form onSubmit={handleSaveIntegrations} className="space-y-3.5">
            <div className="space-y-1">
              <label className="text-[10px] text-slate-400 font-bold uppercase">Nepal IRD CBMS API Endpoint</label>
              <input 
                type="text" 
                value={irdApi}
                onChange={(e) => setIrdApi(e.target.value)}
                className="w-full bg-[#F8F8F8] border border-slate-200/80 rounded-xl p-2.5 text-xs outline-none focus:border-[#E86D1F] font-mono text-[#111111]"
                required
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] text-slate-400 font-bold uppercase">Sparrow SMS Gateway API url</label>
              <input 
                type="text" 
                value={smsGateway}
                onChange={(e) => setSmsGateway(e.target.value)}
                className="w-full bg-[#F8F8F8] border border-slate-200/80 rounded-xl p-2.5 text-xs outline-none focus:border-[#E86D1F] font-mono text-[#111111]"
                required
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] text-slate-400 font-bold uppercase">Sparrow API token secret</label>
              <input 
                type="password" 
                value={smsToken}
                onChange={(e) => setSmsToken(e.target.value)}
                className="w-full bg-[#F8F8F8] border border-slate-200/80 rounded-xl p-2.5 text-xs outline-none focus:border-[#E86D1F] font-mono text-[#111111]"
                required
              />
            </div>

            <button 
              type="submit" 
              disabled={savingGateways}
              className="bg-slate-900 hover:bg-[#E86D1F] text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-all flex items-center gap-1.5 shadow-sm"
            >
              <Save className="h-4 w-4" /> {savingGateways ? 'Saving...' : 'Save Gateways Settings'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
