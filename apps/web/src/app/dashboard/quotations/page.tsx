'use client';

import React, { useState, useEffect } from 'react';
import { Plus, Trash, FileText, Calendar, CheckSquare, RefreshCw, AlertCircle } from 'lucide-react';
import { api } from '../../../lib/api';

interface QuoteItem {
  desc: string;
  qty: number;
  price: number;
  taxId: string;
}

interface Quotation {
  id: string;
  quoteNumber: string;
  customer: {
    name: string;
  };
  subTotal: number;
  taxAmount: number;
  totalAmount: number;
  status: 'DRAFT' | 'SENT' | 'APPROVED' | 'REJECTED' | 'EXPIRED';
  validUntil: string;
}

export default function QuotationsPage() {
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [taxes, setTaxes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'list' | 'create'>('list');

  // Create Form inputs
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [validUntil, setValidUntil] = useState('2026-07-31');
  const [items, setItems] = useState<QuoteItem[]>([{ desc: 'Consulting Retainer SLA', qty: 1, price: 15000, taxId: '' }]);

  useEffect(() => {
    fetchQuotations();
    fetchCustomers();
    fetchTaxes();
  }, []);

  async function fetchQuotations() {
    try {
      setLoading(true);
      const res = await api.get('/sales/quotations');
      setQuotations(res);
    } catch (err: any) {
      alert('Failed to load quotations: ' + err.message);
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

  async function fetchTaxes() {
    try {
      const res = await api.get('/sales/taxes');
      setTaxes(res);
    } catch (err: any) {
      console.error(err);
    }
  }

  const handleAddItem = () => {
    setItems([...items, { desc: '', qty: 1, price: 0, taxId: '' }]);
  };

  const handleRemoveItem = (idx: number) => {
    setItems(items.filter((_, i) => i !== idx));
  };

  const handleSaveQuotation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomerId) {
      alert('Please select a customer profile');
      return;
    }

    try {
      await api.post('/sales/quotations', {
        customerId: selectedCustomerId,
        validUntil: new Date(validUntil).toISOString(),
        items: items.map(i => ({
          description: i.desc,
          quantity: Number(i.qty),
          unitPrice: Number(i.price),
          taxId: i.taxId || undefined,
        })),
      });

      setSelectedCustomerId('');
      setItems([{ desc: 'Consulting Retainer SLA', qty: 1, price: 15000, taxId: '' }]);
      setActiveTab('list');
      fetchQuotations();
      alert('Quotation generated successfully!');
    } catch (err: any) {
      alert('Failed to register quotation: ' + err.message);
    }
  };

  const handleConvertToInvoice = async (quoteId: string) => {
    try {
      await api.post(`/sales/quotations/${quoteId}/convert`);
      fetchQuotations();
      alert('Quotation successfully converted to an Invoice Draft!');
    } catch (err: any) {
      alert('Failed to convert quotation: ' + err.message);
    }
  };

  const handleDownloadPdf = async (id: string, quoteNumber: string) => {
    try {
      const blob = await api.get(`/integration/pdf/quotation/${id}`);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Quotation_${quoteNumber}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      alert('Failed to download proposal PDF: ' + err.message);
    }
  };

  if (loading && quotations.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="text-center space-y-2">
          <div className="w-8 h-8 border-4 border-t-[#E86D1F] border-r-transparent border-slate-300 rounded-full animate-spin mx-auto" />
          <p className="text-[10px] text-slate-400 font-extrabold uppercase tracking-widest">Loading Proposals...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 font-sans">
      {/* Header & Tabs */}
      <div className="flex justify-between items-center border-b border-slate-200/80 pb-4">
        <div>
          <h1 className="text-xl font-black text-[#111111] font-outfit uppercase">Quotations Desk</h1>
          <p className="text-xs text-slate-500 mt-1">Status workflows: Draft, Sent, Approved, Rejected, Expired. Invoice conversion enabled.</p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab('list')}
            className={`text-xs py-2 px-4 rounded-xl font-bold border transition-all ${
              activeTab === 'list' 
                ? 'bg-[#111111] text-white border-slate-900 shadow-md shadow-slate-900/10' 
                : 'bg-white text-slate-500 border-slate-200 hover:border-[#E86D1F]'
            }`}
          >
            All Proposals
          </button>
          <button
            onClick={() => setActiveTab('create')}
            className={`text-xs py-2 px-4 rounded-xl font-bold border transition-all ${
              activeTab === 'create' 
                ? 'bg-[#111111] text-white border-slate-900 shadow-md shadow-slate-900/10' 
                : 'bg-white text-slate-500 border-slate-200 hover:border-[#E86D1F]'
            }`}
          >
            Create Quotation
          </button>
        </div>
      </div>

      {activeTab === 'list' ? (
        <div className="premium-card p-6 rounded-2xl bg-white space-y-4 shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                  <th className="py-3 px-2">Quote No</th>
                  <th className="py-3 px-2">Customer</th>
                  <th className="py-3 px-2">Subtotal</th>
                  <th className="py-3 px-2">VAT Amt</th>
                  <th className="py-3 px-2">Total Amount</th>
                  <th className="py-3 px-2">Valid Until</th>
                  <th className="py-3 px-2">Status</th>
                  <th className="py-3 px-2 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {quotations.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-slate-400 font-normal">
                      No quotations found in directory.
                    </td>
                  </tr>
                ) : (
                  quotations.map(q => (
                    <tr key={q.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-3.5 px-2 text-[#E86D1F] font-bold font-mono">{q.quoteNumber}</td>
                      <td className="py-3.5 px-2 text-[#111111] font-bold">{q.customer?.name}</td>
                      <td className="py-3.5 px-2 text-slate-500">Rs. {Number(q.subTotal).toLocaleString()}</td>
                      <td className="py-3.5 px-2 text-slate-500">Rs. {Number(q.taxAmount).toLocaleString()}</td>
                      <td className="py-3.5 px-2 text-[#111111] font-extrabold">Rs. {Number(q.totalAmount).toLocaleString()}</td>
                      <td className="py-3.5 px-2 text-slate-500">{new Date(q.validUntil).toLocaleDateString()}</td>
                      <td className="py-3.5 px-2">
                        <span className={`inline-block text-[9px] font-extrabold px-2 py-0.5 rounded-lg border uppercase tracking-wider ${
                          q.status === 'APPROVED'
                            ? 'bg-emerald-50 text-emerald-600 border-emerald-100'
                            : q.status === 'SENT'
                            ? 'bg-sky-50 text-sky-600 border-sky-100'
                            : q.status === 'REJECTED'
                            ? 'bg-rose-50 text-rose-600 border-rose-100'
                            : 'bg-amber-50 text-amber-600 border-amber-100'
                        }`}>
                          {q.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-2 text-right space-x-1">
                        <button
                          onClick={() => handleDownloadPdf(q.id, q.quoteNumber)}
                          className="bg-white hover:bg-slate-100 text-slate-500 border border-slate-200 text-[10px] font-bold p-1.5 rounded-lg transition-all inline-flex items-center gap-1"
                          title="Download Proposal PDF"
                        >
                          <FileText className="h-3.5 w-3.5 text-slate-400" /> Proposal
                        </button>
                        {q.status !== 'APPROVED' ? (
                          <button
                            onClick={() => handleConvertToInvoice(q.id)}
                            className="bg-slate-900 hover:bg-[#E86D1F] text-white text-[10px] font-bold px-3 py-1.5 rounded-lg transition-all"
                          >
                            Convert
                          </button>
                        ) : (
                          <span className="text-[10px] font-bold text-slate-400 px-2">Converted</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSaveQuotation} className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          {/* Main Info */}
          <div className="lg:col-span-2 premium-card p-6 rounded-2xl bg-white space-y-6">
            <div className="border-b border-slate-100 pb-4">
              <h2 className="text-xs font-black uppercase text-slate-400">Line items</h2>
            </div>

            <div className="space-y-4">
              {items.map((item, index) => (
                <div key={index} className="grid grid-cols-12 gap-3 items-end bg-[#F8F8F8]/50 p-3.5 rounded-xl border border-slate-100">
                  <div className="col-span-12 sm:col-span-4 space-y-1">
                    <label className="text-[10px] text-slate-400 font-bold uppercase">Description</label>
                    <input
                      type="text"
                      placeholder="e.g. ERP consulting module"
                      value={item.desc}
                      onChange={(e) => {
                        const copy = [...items];
                        copy[index].desc = e.target.value;
                        setItems(copy);
                      }}
                      className="w-full bg-white border border-slate-200/80 rounded-lg p-2 text-xs outline-none focus:border-[#E86D1F]"
                      required
                    />
                  </div>
                  <div className="col-span-4 sm:col-span-2 space-y-1">
                    <label className="text-[10px] text-slate-400 font-bold uppercase">Quantity</label>
                    <input
                      type="number"
                      value={item.qty}
                      onChange={(e) => {
                        const copy = [...items];
                        copy[index].qty = Math.max(1, Number(e.target.value));
                        setItems(copy);
                      }}
                      className="w-full bg-white border border-slate-200/80 rounded-lg p-2 text-xs outline-none focus:border-[#E86D1F]"
                      min="1"
                      required
                    />
                  </div>
                  <div className="col-span-4 sm:col-span-3 space-y-1">
                    <label className="text-[10px] text-slate-400 font-bold uppercase">Price (NPR)</label>
                    <input
                      type="number"
                      value={item.price}
                      onChange={(e) => {
                        const copy = [...items];
                        copy[index].price = Math.max(0, Number(e.target.value));
                        setItems(copy);
                      }}
                      className="w-full bg-white border border-slate-200/80 rounded-lg p-2 text-xs outline-none focus:border-[#E86D1F]"
                      min="0"
                      required
                    />
                  </div>
                  <div className="col-span-4 sm:col-span-2 space-y-1">
                    <label className="text-[10px] text-slate-400 font-bold uppercase block">Tax Rate</label>
                    <select
                      value={item.taxId}
                      onChange={(e) => {
                        const copy = [...items];
                        copy[index].taxId = e.target.value;
                        setItems(copy);
                      }}
                      className="w-full bg-white border border-slate-200/80 rounded-lg p-2 text-xs outline-none text-[#111111]"
                    >
                      <option value="">Exempt (0%)</option>
                      {taxes.map(t => (
                        <option key={t.id} value={t.id}>{t.name} ({Number(t.rate)}%)</option>
                      ))}
                    </select>
                  </div>
                  <div className="col-span-12 sm:col-span-1 flex justify-end pb-1.5">
                    <button 
                      type="button" 
                      onClick={() => handleRemoveItem(index)}
                      className="p-1.5 rounded-lg hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition-all"
                      disabled={items.length === 1}
                    >
                      <Trash className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={handleAddItem}
              className="text-xs font-bold text-[#E86D1F] hover:text-[#111111] transition-all flex items-center gap-1 mt-4"
            >
              <Plus className="h-4.5 w-4.5" /> Add Quotation Item
            </button>
          </div>

          {/* Sidebar calculations & Client details */}
          <div className="premium-card p-6 rounded-2xl bg-white space-y-6">
            <div className="border-b border-slate-100 pb-4">
              <h2 className="text-xs font-black uppercase text-slate-400">Proposal summary</h2>
            </div>

            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] text-slate-400 font-bold uppercase">Client Profile</label>
                <select
                  value={selectedCustomerId}
                  onChange={(e) => setSelectedCustomerId(e.target.value)}
                  className="w-full bg-[#F8F8F8] border border-slate-200/80 rounded-xl p-2.5 text-xs outline-none text-[#111111]"
                  required
                >
                  <option value="">-- Select Client Profile --</option>
                  {customers.map(c => (
                    <option key={c.id} value={c.id}>{c.name} (PAN: {c.panNumber})</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] text-slate-400 font-bold uppercase">Valid Expiration Date</label>
                <input
                  type="date"
                  value={validUntil}
                  onChange={(e) => setValidUntil(e.target.value)}
                  className="w-full bg-[#F8F8F8] border border-slate-200/80 rounded-xl p-2.5 text-xs outline-none focus:border-[#E86D1F]"
                  required
                />
              </div>
            </div>

            {/* Total calculation panel */}
            <div className="pt-4 border-t border-slate-100 space-y-2 text-xs">
              <div className="flex justify-between text-slate-400">
                <span>Subtotal (Excl. Tax)</span>
                <span>
                  Rs. {items.reduce((acc, curr) => acc + (curr.qty * curr.price), 0).toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between text-slate-400 font-medium">
                <span>Estimated Tax (VAT 13%)</span>
                <span>
                  Rs. {items.reduce((acc, curr) => {
                    const matchedTax = taxes.find(t => t.id === curr.taxId);
                    const rate = matchedTax ? Number(matchedTax.rate) : 0;
                    return acc + (curr.qty * curr.price * (rate / 100));
                  }, 0).toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between text-[#111111] font-extrabold pt-2 border-t border-dashed border-slate-200 text-sm">
                <span>Total Amount</span>
                <span>
                  Rs. {items.reduce((acc, curr) => {
                    const matchedTax = taxes.find(t => t.id === curr.taxId);
                    const rate = matchedTax ? Number(matchedTax.rate) : 0;
                    const val = curr.qty * curr.price;
                    return acc + val + (val * (rate / 100));
                  }, 0).toLocaleString()}
                </span>
              </div>
            </div>

            <button
              type="submit"
              className="w-full bg-slate-900 hover:bg-[#E86D1F] text-white text-xs font-bold p-3 rounded-xl shadow-lg transition-all"
            >
              Generate Quotation Card
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
