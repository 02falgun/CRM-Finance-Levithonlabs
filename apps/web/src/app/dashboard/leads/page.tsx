'use client';

import React, { useState, useEffect } from 'react';
import { Plus, ChevronRight, Activity, Calendar, Award } from 'lucide-react';
import { api } from '../../../lib/api';

interface ActivityLog {
  id?: string;
  type: string;
  note: string;
  performedBy?: string;
  createdAt?: string;
}

interface Lead {
  id: string;
  title: string;
  customer?: {
    id: string;
    name: string;
  } | null;
  value: number;
  status: 'New' | 'Contacted' | 'Proposal Sent' | 'Negotiation' | 'Converted' | 'Lost';
  activities: ActivityLog[];
}

export default function LeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeLead, setActiveLead] = useState<Lead | null>(null);

  // New Lead Inputs
  const [newTitle, setNewTitle] = useState('');
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [newValue, setNewValue] = useState(30000);

  // New Activity Inputs
  const [actType, setActType] = useState('NOTE');
  const [actNote, setActNote] = useState('');

  useEffect(() => {
    fetchLeads();
    fetchCustomers();
  }, []);

  async function fetchLeads() {
    try {
      setLoading(true);
      const res = await api.get('/crm/leads');
      setLeads(res);
      if (activeLead) {
        const refreshed = res.find((l: any) => l.id === activeLead.id);
        if (refreshed) {
          setActiveLead(refreshed);
        }
      }
    } catch (err: any) {
      alert('Failed to load leads: ' + err.message);
    } finally {
      setLoading(false);
    }
  }

  async function fetchCustomers() {
    try {
      const res = await api.get('/crm/customers');
      setCustomers(res);
    } catch (err: any) {
      console.error(err);
    }
  }

  const handleAddLead = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle) return;

    try {
      await api.post('/crm/leads', {
        title: newTitle,
        value: Number(newValue),
        customerId: selectedCustomerId || undefined,
      });
      setNewTitle('');
      setSelectedCustomerId('');
      setNewValue(30000);
      fetchLeads();
      alert('CRM Sales Lead generated successfully.');
    } catch (err: any) {
      alert('Failed to register lead: ' + err.message);
    }
  };

  const handleMoveStatus = async (leadId: string, status: Lead['status']) => {
    try {
      await api.patch(`/crm/leads/${leadId}/status`, { status });
      const updatedList = leads.map(l => l.id === leadId ? { ...l, status } : l);
      setLeads(updatedList);
      if (activeLead && activeLead.id === leadId) {
        setActiveLead({ ...activeLead, status });
      }
      fetchLeads();
    } catch (err: any) {
      alert('Failed to move stage status: ' + err.message);
    }
  };

  const handleAddActivity = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeLead || !actNote) return;

    try {
      await api.post(`/crm/leads/${activeLead.id}/activities`, {
        type: actType,
        note: actNote,
      });
      setActNote('');
      fetchLeads();
      alert('Activity logged successfully.');
    } catch (err: any) {
      alert('Failed to save activity log: ' + err.message);
    }
  };

  const columns: Lead['status'][] = ['New', 'Contacted', 'Proposal Sent', 'Negotiation', 'Converted', 'Lost'];

  if (loading && leads.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="text-center space-y-2">
          <div className="w-8 h-8 border-4 border-t-[#E86D1F] border-r-transparent border-slate-300 rounded-full animate-spin mx-auto" />
          <p className="text-[10px] text-slate-400 font-extrabold uppercase tracking-widest">Loading CRM Board...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 font-sans">
      <div>
        <h1 className="text-xl font-black text-[#111111] font-outfit uppercase">CRM Lead Board</h1>
        <p className="text-xs text-slate-500 mt-1">SaaS CRM Pipeline showing stages: New, Contacted, Proposal Sent, Negotiation, Converted, Lost</p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-8 items-start">
        {/* Kanban pipeline lanes (col-span-3) */}
        <div className="xl:col-span-3 overflow-x-auto pb-4">
          <div className="flex gap-4 min-w-[900px]">
            {columns.map(lane => {
              const laneLeads = leads.filter(l => l.status === lane);
              return (
                <div key={lane} className="flex-1 bg-white border border-slate-200/85 p-4 rounded-xl space-y-4 shadow-sm min-h-[450px]">
                  <div className="flex justify-between items-center border-b border-slate-100 pb-2.5">
                    <span className="text-[9px] font-black tracking-wider text-[#111111] uppercase">{lane}</span>
                    <span className="text-[9px] bg-slate-900 text-white font-bold px-2 py-0.5 rounded-full">
                      {laneLeads.length}
                    </span>
                  </div>

                  <div className="space-y-3">
                    {laneLeads.map(l => (
                      <div 
                        key={l.id} 
                        onClick={() => setActiveLead(l)}
                        className={`p-3.5 rounded-xl border border-slate-200 bg-[#F8F8F8] cursor-pointer hover:border-[#E86D1F]/50 transition-all ${
                          activeLead?.id === l.id ? 'border-[#E86D1F] ring-1 ring-[#E86D1F]' : ''
                        }`}
                      >
                        <div className="font-bold text-xs text-[#111111] line-clamp-1">{l.title}</div>
                        <div className="text-[9px] text-slate-400 mt-0.5 font-semibold">
                          {l.customer?.name || 'Unlinked Lead'}
                        </div>
                        <div className="flex justify-between items-center mt-3 pt-2 border-t border-slate-200/40">
                          <span className="font-bold text-[#111111] text-[11px]">Rs. {Number(l.value || 0).toLocaleString()}</span>
                          <span className="text-[9px] font-bold text-[#E86D1F] flex items-center gap-0.5">
                            Details <ChevronRight className="h-3 w-3" />
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right side context panel */}
        <div className="space-y-6">
          {activeLead ? (
            <div className="premium-card p-6 rounded-2xl bg-white space-y-6">
              <div className="flex justify-between items-start border-b border-slate-100 pb-4">
                <div>
                  <h2 className="font-bold text-xs text-[#111111]">{activeLead.title}</h2>
                  <span className="text-[10px] text-slate-400 block mt-0.5 font-semibold">
                    {activeLead.customer?.name || 'Unlinked Lead'}
                  </span>
                </div>
                <button 
                  onClick={() => setActiveLead(null)} 
                  className="text-[10px] font-bold text-slate-400 hover:text-[#111111]"
                >
                  Close
                </button>
              </div>

              {/* Status control buttons */}
              <div className="space-y-2">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Update Stage</span>
                <select
                  value={activeLead.status}
                  onChange={(e) => handleMoveStatus(activeLead.id, e.target.value as any)}
                  className="w-full bg-[#F8F8F8] border border-slate-200/80 rounded-xl p-2.5 text-xs outline-none text-[#111111] font-semibold focus:border-[#E86D1F]"
                >
                  {columns.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              {/* Activity Log list */}
              <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Activity Logs</span>
                {activeLead.activities && activeLead.activities.map((act, idx) => (
                  <div key={idx} className="p-3 bg-[#F8F8F8] border border-slate-200/40 rounded-xl space-y-1">
                    <div className="flex justify-between items-center text-[9px] font-bold text-indigo-600">
                      <span className="bg-indigo-50 px-1.5 py-0.5 rounded uppercase">{act.type}</span>
                      <span className="text-slate-400">
                        {act.createdAt ? new Date(act.createdAt).toLocaleDateString() : 'Just now'}
                      </span>
                    </div>
                    <p className="text-[11px] text-[#111111] leading-relaxed">{act.note}</p>
                    {act.performedBy && (
                      <span className="block text-[8px] text-slate-400 text-right font-medium">Logged by: {act.performedBy}</span>
                    )}
                  </div>
                ))}
                {(!activeLead.activities || activeLead.activities.length === 0) && (
                  <span className="text-[11px] text-slate-400 italic block py-2">No logged activities yet.</span>
                )}
              </div>

              {/* Activity creator form */}
              <form onSubmit={handleAddActivity} className="space-y-3 border-t border-slate-100 pt-4">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Log Activity</span>
                <select
                  value={actType}
                  onChange={(e) => setActType(e.target.value)}
                  className="w-full bg-[#F8F8F8] border border-slate-200/80 rounded-xl p-2.5 text-xs outline-none text-[#111111]"
                >
                  <option value="NOTE">NOTE</option>
                  <option value="CALL">CALL</option>
                  <option value="MEETING">MEETING</option>
                  <option value="EMAIL">EMAIL</option>
                </select>
                <textarea
                  placeholder="Details of log..."
                  value={actNote}
                  onChange={(e) => setActNote(e.target.value)}
                  className="w-full bg-[#F8F8F8] border border-slate-200/80 rounded-xl p-2.5 text-xs outline-none h-16 resize-none focus:border-[#E86D1F]"
                  required
                />
                <button 
                  type="submit" 
                  className="w-full bg-slate-900 hover:bg-[#E86D1F] text-white text-xs font-bold p-2.5 rounded-xl transition-all"
                >
                  Save Log Entry
                </button>
              </form>
            </div>
          ) : (
            <div className="premium-card p-6 rounded-2xl bg-white space-y-4">
              <h2 className="text-xs font-black uppercase text-slate-400">Intake Lead Card</h2>
              <form onSubmit={handleAddLead} className="space-y-3">
                <input 
                  type="text" 
                  placeholder="Lead Title" 
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full bg-[#F8F8F8] border border-slate-200/80 rounded-xl p-2.5 text-xs outline-none focus:border-[#E86D1F]"
                  required
                />
                <select 
                  value={selectedCustomerId}
                  onChange={(e) => setSelectedCustomerId(e.target.value)}
                  className="w-full bg-[#F8F8F8] border border-slate-200/80 rounded-xl p-2.5 text-xs outline-none text-[#111111] focus:border-[#E86D1F]"
                >
                  <option value="">-- Link to Customer (Optional) --</option>
                  {customers.map(c => (
                    <option key={c.id} value={c.id}>{c.name} (PAN: {c.panNumber})</option>
                  ))}
                </select>
                <input 
                  type="number" 
                  placeholder="Expected Value (NPR)" 
                  value={newValue}
                  onChange={(e) => setNewValue(Number(e.target.value))}
                  className="w-full bg-[#F8F8F8] border border-slate-200/80 rounded-xl p-2.5 text-xs outline-none focus:border-[#E86D1F]"
                  required
                />
                <button 
                  type="submit" 
                  className="w-full bg-slate-900 hover:bg-[#E86D1F] text-white text-xs font-bold p-2.5 rounded-xl transition-all flex items-center justify-center gap-1.5"
                >
                  <Plus className="h-4 w-4" /> Save Lead
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
