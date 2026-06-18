'use client';

import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Search, 
  FileText, 
  UserPlus, 
  Trash2, 
  Edit3, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  AlertCircle, 
  ArrowLeft,
  Users,
  ChevronRight
} from 'lucide-react';
import { api } from '../../../lib/api';

interface Contact {
  id?: string;
  name: string;
  email: string | null;
  phone: string | null;
  role: string | null;
}

interface TimelineEvent {
  id: string;
  date: string;
  title: string;
  details: string;
  type: 'INVOICE' | 'PAYMENT' | 'ACTIVITY';
}

interface Customer {
  id: string;
  name: string;
  panNumber: string;
  isActive: boolean;
  contacts: Contact[];
}

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  
  // Panel States: 'create' | 'contacts' | 'edit' | 'timeline' | null
  const [activePanel, setActivePanel] = useState<'create' | 'contacts' | 'edit' | 'timeline' | null>(null);
  const [activeCustId, setActiveCustId] = useState<string | null>(null);
  const [selectedTimeline, setSelectedTimeline] = useState<TimelineEvent[]>([]);

  // Form states - Customer Create/Edit
  const [custName, setCustName] = useState('');
  const [custPan, setCustPan] = useState('');
  const [custActive, setCustActive] = useState(true);
  const [panError, setPanError] = useState('');

  // Form states - Contact Add
  const [contactName, setContactName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [contactRole, setContactRole] = useState('');

  useEffect(() => {
    fetchCustomers();
  }, []);

  async function fetchCustomers() {
    try {
      setLoading(true);
      const res = await api.get('/crm/customers');
      setCustomers(res);
    } catch (err: any) {
      alert('Failed to load customers: ' + err.message);
    } finally {
      setLoading(false);
    }
  }

  const activeCustomer = customers.find(c => c.id === activeCustId);

  const handlePanValidation = (val: string) => {
    setCustPan(val);
    if (val && !/^\d{9}$/.test(val)) {
      setPanError('PAN number must be exactly 9 digits');
    } else {
      setPanError('');
    }
  };

  const handleAddCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!custName || !custPan) return;
    if (!/^\d{9}$/.test(custPan)) {
      setPanError('PAN must be exactly 9 digits before saving');
      return;
    }

    try {
      await api.post('/crm/customers', { name: custName, panNumber: custPan });
      setCustName('');
      setCustPan('');
      setActivePanel(null);
      fetchCustomers();
      alert(`Customer profile for ${custName} registered successfully.`);
    } catch (err: any) {
      alert('Failed to create customer: ' + err.message);
    }
  };

  const handleStartEdit = (cust: Customer) => {
    setActiveCustId(cust.id);
    setCustName(cust.name);
    setCustPan(cust.panNumber);
    setCustActive(cust.isActive);
    setPanError('');
    setActivePanel('edit');
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeCustId || !custName || !custPan) return;
    if (!/^\d{9}$/.test(custPan)) {
      setPanError('PAN must be exactly 9 digits before saving');
      return;
    }

    try {
      await api.patch(`/crm/customers/${activeCustId}`, { name: custName, panNumber: custPan });
      const orig = customers.find(c => c.id === activeCustId);
      if (orig && orig.isActive !== custActive) {
        await api.patch(`/crm/customers/${activeCustId}/deactivate`, { isActive: custActive });
      }
      setActivePanel(null);
      setActiveCustId(null);
      fetchCustomers();
      alert('Customer profile updated successfully!');
    } catch (err: any) {
      alert('Failed to save customer modifications: ' + err.message);
    }
  };

  const handleAddContact = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeCustId || !contactName) return;

    try {
      await api.post(`/crm/customers/${activeCustId}/contacts`, {
        name: contactName,
        email: contactEmail || undefined,
        phone: contactPhone || undefined,
        role: contactRole || undefined
      });
      setContactName('');
      setContactEmail('');
      setContactPhone('');
      setContactRole('');
      fetchCustomers();
      alert('Representative contact added successfully.');
    } catch (err: any) {
      alert('Failed to add contact: ' + err.message);
    }
  };

  const toggleCustomerActiveState = async (id: string) => {
    const c = customers.find(item => item.id === id);
    if (!c) return;
    try {
      await api.patch(`/crm/customers/${id}/deactivate`, { isActive: !c.isActive });
      fetchCustomers();
    } catch (err: any) {
      alert('Failed to toggle active status: ' + err.message);
    }
  };

  const handleLoadTimeline = async (id: string) => {
    setActiveCustId(id);
    setActivePanel('timeline');
    setSelectedTimeline([]);
    try {
      const res = await api.get(`/crm/customers/${id}/timeline`);
      setSelectedTimeline(res);
    } catch (err: any) {
      alert('Failed to load timeline events: ' + err.message);
    }
  };

  const filtered = customers.filter(c => 
    c.name.toLowerCase().includes(search.toLowerCase()) || 
    c.panNumber.includes(search) ||
    c.contacts.some(contact => contact.name.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      {/* Top statistics overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="premium-card p-5 rounded-2xl bg-white border border-slate-200/60 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider block">Total Customer Directory</span>
            <span className="text-lg font-black text-[#111111] font-outfit">
              {customers.length} Profiles
            </span>
          </div>
          <div className="h-10 w-10 bg-slate-50 border border-slate-100 rounded-xl flex items-center justify-center text-[#111111]">
            <Users className="h-5 w-5" />
          </div>
        </div>

        <div className="premium-card p-5 rounded-2xl bg-white border border-slate-200/60 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider block">Active Accounts</span>
            <span className="text-lg font-black text-emerald-600 font-outfit">
              {customers.filter(c => c.isActive).length} Active
            </span>
          </div>
          <div className="h-10 w-10 bg-emerald-50 border border-emerald-100 rounded-xl flex items-center justify-center text-emerald-600">
            <CheckCircle2 className="h-5 w-5" />
          </div>
        </div>

        <div className="premium-card p-5 rounded-2xl bg-white border border-slate-200/60 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider block">Deactivated Accounts</span>
            <span className="text-lg font-black text-rose-500 font-outfit">
              {customers.filter(c => !c.isActive).length} Suspended
            </span>
          </div>
          <div className="h-10 w-10 bg-rose-50 border border-rose-100 rounded-xl flex items-center justify-center text-rose-500">
            <XCircle className="h-5 w-5" />
          </div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-slate-200/80 pb-4 gap-4">
        <div>
          <h1 className="text-xl font-black text-[#111111] font-outfit uppercase flex items-center gap-2">
            <Users className="h-5 w-5 text-[#E86D1F]" /> Customer Registry
          </h1>
          <p className="text-xs text-slate-500 mt-1">Manage buyer profiles, PAN declarations, and client activity logs</p>
        </div>

        <button
          onClick={() => {
            setCustName('');
            setCustPan('');
            setPanError('');
            setActivePanel('create');
            setActiveCustId(null);
          }}
          className="text-xs py-2.5 px-4 rounded-xl font-bold bg-[#111111] hover:bg-[#E86D1F] text-white border border-slate-900 shadow-md shadow-slate-900/10 transition-all flex items-center gap-1.5"
        >
          <Plus className="h-4 w-4" /> Add Customer Profile
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Customer Directory */}
        <div className="lg:col-span-2 space-y-4">
          <div className="premium-card p-6 rounded-2xl bg-white border border-slate-200/60 shadow-sm space-y-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3.5 h-4 w-4 text-slate-400" />
              <input 
                type="text" 
                placeholder="Search by buyer name, PAN, or contact representatives..." 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-[#F8F8F8] border border-slate-200/80 rounded-xl pl-9 pr-4 py-2.5 text-xs text-[#111111] focus:outline-none focus:border-[#E86D1F] transition-all"
              />
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                    <th className="py-3 px-2">Customer Profile</th>
                    <th className="py-3 px-2">Buyer PAN</th>
                    <th className="py-3 px-2">Contacts</th>
                    <th className="py-3 px-2">Status</th>
                    <th className="py-3 px-2 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                  {filtered.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-slate-400 font-normal">
                        No customer profiles found.
                      </td>
                    </tr>
                  ) : (
                    filtered.map(c => (
                      <tr 
                        key={c.id} 
                        className={`hover:bg-slate-50/50 transition-colors ${!c.isActive ? 'bg-slate-50/30 opacity-75' : ''}`}
                      >
                        <td className="py-4 px-2">
                          <div className="font-bold text-[#111111]">{c.name}</div>
                          <div className="text-[10px] text-slate-400 mt-0.5">ID: {c.id}</div>
                        </td>
                        <td className="py-4 px-2 font-mono text-xs text-[#111111]">{c.panNumber}</td>
                        <td className="py-4 px-2">
                          <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-lg border border-slate-200">
                            {c.contacts.length} Reps
                          </span>
                        </td>
                        <td className="py-4 px-2">
                          <button
                            onClick={() => toggleCustomerActiveState(c.id)}
                            className={`inline-flex items-center gap-1 text-[9px] font-extrabold px-2 py-0.5 rounded-lg border uppercase tracking-wider transition-all ${
                              c.isActive
                                ? 'bg-emerald-50 text-emerald-600 border-emerald-100 hover:bg-emerald-100'
                                : 'bg-rose-50 text-rose-600 border-rose-100 hover:bg-rose-100'
                            }`}
                            title="Click to toggle status state"
                          >
                            {c.isActive ? 'Active' : 'Inactive'}
                          </button>
                        </td>
                        <td className="py-4 px-2 text-right space-x-1">
                          <button 
                            onClick={() => handleLoadTimeline(c.id)}
                            className="bg-white hover:bg-slate-100 text-slate-500 border border-slate-200 text-[10px] font-bold p-1.5 rounded-lg transition-all"
                            title="View Activity Timeline"
                          >
                            <Clock className="h-3.5 w-3.5" />
                          </button>
                          <button 
                            onClick={() => { setActiveCustId(c.id); setActivePanel('contacts'); }}
                            className="bg-white hover:bg-slate-100 text-slate-500 border border-slate-200 text-[10px] font-bold p-1.5 rounded-lg transition-all"
                            title="Manage Contacts"
                          >
                            <UserPlus className="h-3.5 w-3.5" />
                          </button>
                          <button 
                            onClick={() => handleStartEdit(c)}
                            className="bg-slate-900 hover:bg-[#E86D1F] text-white text-[10px] font-bold px-2.5 py-1.5 rounded-lg transition-all inline-flex items-center gap-1"
                          >
                            <Edit3 className="h-3 w-3" /> Edit
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Dynamic Detail & Form Panel */}
        <div className="space-y-6">
          {activePanel === 'timeline' && activeCustomer && (
            <div className="premium-card p-6 rounded-2xl bg-white border border-slate-200/60 shadow-sm space-y-6">
              <div className="flex justify-between items-center border-b border-slate-100 pb-4">
                <div>
                  <h2 className="text-xs font-black uppercase text-[#111111] tracking-wider">Activity Timeline</h2>
                  <p className="text-[10px] text-slate-400 mt-0.5 truncate">{activeCustomer.name}</p>
                </div>
                <button 
                  onClick={() => { setActivePanel(null); setActiveCustId(null); }}
                  className="text-[10px] font-bold text-slate-400 hover:text-[#111111]"
                >
                  Close
                </button>
              </div>

              <div className="relative pl-4 border-l border-slate-200 space-y-6">
                {selectedTimeline.length === 0 ? (
                  <p className="text-xs text-slate-400 italic">No activity logs found for this customer.</p>
                ) : (
                  selectedTimeline.map((event) => (
                    <div key={event.id} className="relative space-y-1">
                      {/* Timeline dot */}
                      <div className={`absolute -left-[22px] top-1.5 h-3 w-3 rounded-full border-2 border-white ${
                        event.type === 'INVOICE' 
                          ? 'bg-blue-500' 
                          : event.type === 'PAYMENT' 
                          ? 'bg-emerald-500' 
                          : 'bg-purple-500'
                      }`} />
                      
                      <div className="flex items-center justify-between text-[10px] text-slate-400 font-bold">
                        <span className="bg-slate-50 border border-slate-100 px-1.5 py-0.5 rounded text-[8px] uppercase">
                          {event.type}
                        </span>
                        <span>{new Date(event.date).toLocaleDateString()}</span>
                      </div>
                      
                      <h4 className="text-xs font-extrabold text-[#111111]">{event.title}</h4>
                      <p className="text-[11px] text-slate-500 font-medium leading-relaxed">{event.details}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {activePanel === 'contacts' && activeCustomer && (
            <div className="premium-card p-6 rounded-2xl bg-white border border-slate-200/60 shadow-sm space-y-6">
              <div className="flex justify-between items-center border-b border-slate-100 pb-4">
                <div>
                  <h2 className="text-xs font-black uppercase text-[#111111] tracking-wider">Contacts Registry</h2>
                  <p className="text-[10px] text-slate-400 mt-0.5 truncate">{activeCustomer.name}</p>
                </div>
                <button 
                  onClick={() => { setActivePanel(null); setActiveCustId(null); }}
                  className="text-[10px] font-bold text-slate-400 hover:text-[#111111]"
                >
                  Close
                </button>
              </div>

              <div className="space-y-3">
                {activeCustomer.contacts.length === 0 ? (
                  <p className="text-xs text-slate-400 italic">No representative contacts mapped to this account.</p>
                ) : (
                  activeCustomer.contacts.map((contact, idx) => (
                    <div key={idx} className="p-3 bg-[#F8F8F8] border border-slate-200/60 rounded-xl space-y-1 text-xs">
                      <div className="font-extrabold text-[#111111] flex items-center justify-between">
                        <span>{contact.name}</span>
                        <span className="text-[9px] font-bold text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded uppercase">{contact.role}</span>
                      </div>
                      <div className="text-[10px] text-slate-500">Phone: {contact.phone}</div>
                      <div className="text-[10px] text-slate-500">Email: {contact.email}</div>
                    </div>
                  ))
                )}
              </div>

              <form onSubmit={handleAddContact} className="space-y-3 pt-4 border-t border-slate-100">
                <h3 className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Add New Contact Card</h3>
                <input 
                  type="text" 
                  placeholder="Representative Name" 
                  value={contactName}
                  onChange={(e) => setContactName(e.target.value)}
                  className="w-full bg-[#F8F8F8] border border-slate-200/80 rounded-xl p-2.5 text-xs text-[#111111] outline-none focus:border-[#E86D1F]"
                  required
                />
                <input 
                  type="email" 
                  placeholder="Email Address" 
                  value={contactEmail}
                  onChange={(e) => setContactEmail(e.target.value)}
                  className="w-full bg-[#F8F8F8] border border-slate-200/80 rounded-xl p-2.5 text-xs text-[#111111] outline-none focus:border-[#E86D1F]"
                />
                <input 
                  type="text" 
                  placeholder="Mobile Phone" 
                  value={contactPhone}
                  onChange={(e) => setContactPhone(e.target.value)}
                  className="w-full bg-[#F8F8F8] border border-slate-200/80 rounded-xl p-2.5 text-xs text-[#111111] outline-none focus:border-[#E86D1F]"
                />
                <input 
                  type="text" 
                  placeholder="Role (e.g. Director, Accountant)" 
                  value={contactRole}
                  onChange={(e) => setContactRole(e.target.value)}
                  className="w-full bg-[#F8F8F8] border border-slate-200/80 rounded-xl p-2.5 text-xs text-[#111111] outline-none focus:border-[#E86D1F]"
                />
                <button 
                  type="submit" 
                  className="w-full bg-[#111111] hover:bg-[#E86D1F] text-white text-xs font-bold p-2.5 rounded-xl transition-all shadow-sm"
                >
                  Save Representative Link
                </button>
              </form>
            </div>
          )}

          {activePanel === 'edit' && activeCustomer && (
            <div className="premium-card p-6 rounded-2xl bg-white border border-slate-200/60 shadow-sm space-y-6">
              <div className="flex justify-between items-center border-b border-slate-100 pb-4">
                <div>
                  <h2 className="text-xs font-black uppercase text-[#111111] tracking-wider">Edit Customer Profile</h2>
                  <p className="text-[10px] text-slate-400 mt-0.5">Edit credentials & active state flags</p>
                </div>
                <button 
                  onClick={() => { setActivePanel(null); setActiveCustId(null); }}
                  className="text-[10px] font-bold text-slate-400 hover:text-[#111111]"
                >
                  Cancel
                </button>
              </div>

              <form onSubmit={handleSaveEdit} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-400 font-bold uppercase">Company Name</label>
                  <input 
                    type="text" 
                    value={custName}
                    onChange={(e) => setCustName(e.target.value)}
                    className="w-full bg-[#F8F8F8] border border-slate-200/80 rounded-xl p-2.5 text-xs text-[#111111] outline-none focus:border-[#E86D1F]"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] text-slate-400 font-bold uppercase">Buyer VAT/PAN</label>
                  <input 
                    type="text" 
                    value={custPan}
                    onChange={(e) => handlePanValidation(e.target.value)}
                    className={`w-full bg-[#F8F8F8] border rounded-xl p-2.5 text-xs text-[#111111] outline-none focus:border-[#E86D1F] ${
                      panError ? 'border-rose-400 focus:border-rose-500' : 'border-slate-200/80'
                    }`}
                    required
                  />
                  {panError && (
                    <p className="text-[9px] text-rose-500 font-bold flex items-center gap-1 mt-1">
                      <AlertCircle className="h-3 w-3" /> {panError}
                    </p>
                  )}
                </div>

                <div className="space-y-2 pt-2 border-t border-slate-100">
                  <label className="text-[10px] text-slate-400 font-bold uppercase block">Active Account Status</label>
                  <label className="flex items-center gap-2 cursor-pointer bg-[#F8F8F8] p-3 rounded-xl border border-slate-200/60">
                    <input 
                      type="checkbox"
                      checked={custActive}
                      onChange={(e) => setCustActive(e.target.checked)}
                      className="rounded border-slate-300 text-[#E86D1F] focus:ring-[#E86D1F]"
                    />
                    <div className="text-xs">
                      <span className="font-extrabold text-[#111111] block">Enable Customer Profile</span>
                      <span className="text-[10px] text-slate-400 block mt-0.5">Toggle status to restrict billing or new orders</span>
                    </div>
                  </label>
                </div>

                <button 
                  type="submit" 
                  disabled={!!panError}
                  className="w-full bg-[#111111] hover:bg-[#E86D1F] text-white text-xs font-bold p-3 rounded-xl transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Save Profile Modifications
                </button>
              </form>
            </div>
          )}

          {(activePanel === null || activePanel === 'create') && (
            <div className="premium-card p-6 rounded-2xl bg-white border border-slate-200/60 shadow-sm space-y-4">
              <div className="border-b border-slate-100 pb-3">
                <h2 className="text-xs font-black uppercase text-[#111111] tracking-wider">New Customer Registration</h2>
              </div>
              <form onSubmit={handleAddCustomer} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-400 font-bold uppercase">Company/Buyer Name</label>
                  <input 
                    type="text" 
                    placeholder="e.g. Pokhara Industrial Corp" 
                    value={custName}
                    onChange={(e) => setCustName(e.target.value)}
                    className="w-full bg-[#F8F8F8] border border-slate-200/80 rounded-xl p-2.5 text-xs text-[#111111] outline-none focus:border-[#E86D1F]"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] text-slate-400 font-bold uppercase">Buyer VAT/PAN (9 Digits)</label>
                  <input 
                    type="text" 
                    placeholder="e.g. 301298456" 
                    value={custPan}
                    onChange={(e) => handlePanValidation(e.target.value)}
                    className={`w-full bg-[#F8F8F8] border rounded-xl p-2.5 text-xs text-[#111111] outline-none focus:border-[#E86D1F] ${
                      panError ? 'border-rose-400 focus:border-rose-500' : 'border-slate-200/80'
                    }`}
                    required
                  />
                  {panError && (
                    <p className="text-[9px] text-rose-500 font-bold flex items-center gap-1 mt-1">
                      <AlertCircle className="h-3 w-3" /> {panError}
                    </p>
                  )}
                </div>

                <button 
                  type="submit" 
                  disabled={!custName || !custPan || !!panError}
                  className="w-full bg-[#111111] hover:bg-[#E86D1F] text-white text-xs font-bold p-3 rounded-xl transition-all shadow-md flex items-center justify-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Plus className="h-4 w-4" /> Save Profile to Registry
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
