'use client';

import React, { useState, useEffect } from 'react';
import { UserPlus, UserCog, UserCheck, ShieldAlert } from 'lucide-react';
import { api } from '../../../lib/api';

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  isActive: boolean;
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  // Form inputs
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('SALES_REPRESENTATIVE');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  async function fetchUsers() {
    try {
      setLoading(true);
      const res = await api.get('/tenant/users');
      const mapped = res.map((u: any) => ({
        id: u.id,
        name: u.name,
        email: u.email,
        role: u.roles?.[0]?.role?.name || 'N/A',
        isActive: u.isActive
      }));
      setUsers(mapped);
    } catch (err: any) {
      alert('Failed to load team users: ' + err.message);
    } finally {
      setLoading(false);
    }
  }

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email) return;

    try {
      setSubmitting(true);
      await api.post('/tenant/users', {
        name,
        email,
        role
      });

      setName('');
      setEmail('');
      setRole('SALES_REPRESENTATIVE');
      await fetchUsers();
      alert(`User profile for ${name} registered successfully! (Default temporary password: password123)`);
    } catch (err: any) {
      alert('Failed to register team member: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleActive = async (id: string, userName: string) => {
    try {
      await api.patch(`/tenant/users/${id}/toggle-active`);
      await fetchUsers();
      alert(`Account status updated for ${userName}`);
    } catch (err: any) {
      alert('Failed to toggle account status: ' + err.message);
    }
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="text-center space-y-2">
          <div className="w-8 h-8 border-4 border-t-[#E86D1F] border-r-transparent border-slate-200 rounded-full animate-spin mx-auto" />
          <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Syncing Users & Roles...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-xl font-black text-[#111111] font-outfit uppercase">Users & Access Roles</h1>
        <p className="text-xs text-slate-500 mt-1">Provision corporate user profiles and assign dynamic permission roles</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* User Directory */}
        <div className="lg:col-span-2 premium-card p-6 rounded-2xl bg-white space-y-4">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                  <th className="py-3 px-2">Team Member</th>
                  <th className="py-3 px-2">Access Role</th>
                  <th className="py-3 px-2">Account State</th>
                  <th className="py-3 px-2 text-right">Access Controls</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {users.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-6 text-center text-xs text-slate-400 font-bold">
                      No team users found.
                    </td>
                  </tr>
                ) : (
                  users.map(u => (
                    <tr key={u.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-3.5 px-2">
                        <div className="font-bold text-[#111111]">{u.name}</div>
                        <div className="text-[10px] text-slate-400 mt-0.5 font-mono">{u.email}</div>
                      </td>
                      <td className="py-3.5 px-2 font-mono">
                        <span className="text-[9px] bg-slate-900 text-white font-bold px-1.5 py-0.5 rounded">
                          {u.role}
                        </span>
                      </td>
                      <td className="py-3.5 px-2">
                        <span className={`inline-flex items-center gap-1 text-[9px] font-extrabold px-1.5 py-0.5 rounded ${
                          u.isActive 
                            ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' 
                            : 'bg-rose-50 text-rose-600 border border-rose-100'
                        }`}>
                          {u.isActive ? 'ACTIVE' : 'DEACTIVATED'}
                        </span>
                      </td>
                      <td className="py-3.5 px-2 text-right">
                        <button 
                          onClick={() => handleToggleActive(u.id, u.name)}
                          className={`text-[10px] font-bold px-3 py-1.5 rounded-lg border transition-all ${
                            u.isActive 
                              ? 'bg-white hover:bg-rose-50 text-slate-500 hover:text-rose-600 border-slate-200' 
                              : 'bg-emerald-600 hover:bg-emerald-700 text-white border-transparent'
                          }`}
                        >
                          {u.isActive ? 'Deactivate' : 'Reactivate'}
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* User Inviter Card */}
        <div className="premium-card p-6 rounded-2xl bg-white space-y-4">
          <div className="border-b border-slate-100 pb-3 flex items-center gap-1.5 text-slate-400">
            <UserPlus className="h-4 w-4 text-[#E86D1F]" />
            <h2 className="text-xs font-black uppercase tracking-wider text-[#111111]">Register team member</h2>
          </div>

          <form onSubmit={handleCreateUser} className="space-y-3">
            <div className="space-y-1">
              <label className="text-[10px] text-slate-400 font-bold uppercase">Full Name</label>
              <input 
                type="text" 
                placeholder="e.g. Shyam Thapa"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-[#F8F8F8] border border-slate-200/80 rounded-xl p-2.5 text-xs outline-none focus:border-[#E86D1F] text-[#111111]"
                required
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] text-slate-400 font-bold uppercase">Corporate Email</label>
              <input 
                type="email" 
                placeholder="e.g. shyam@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-[#F8F8F8] border border-slate-200/80 rounded-xl p-2.5 text-xs outline-none focus:border-[#E86D1F] text-[#111111]"
                required
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] text-slate-400 font-bold uppercase">Assign Access Role</label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full bg-[#F8F8F8] border border-slate-200/80 rounded-xl p-2.5 text-xs outline-none text-[#111111] focus:border-[#E86D1F]"
              >
                <option value="SALES_REPRESENTATIVE">Sales Representative</option>
                <option value="BILLING_MANAGER">Billing Manager</option>
                <option value="AUDITOR">Auditor (Read-Only)</option>
                <option value="TENANT_ADMIN">Tenant Admin (All Permissions)</option>
              </select>
            </div>

            <button 
              type="submit" 
              disabled={submitting}
              className="w-full bg-slate-900 hover:bg-[#E86D1F] text-white text-xs font-bold p-3 rounded-xl transition-all"
            >
              {submitting ? 'Registering...' : 'Invite & Allocate Role'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
