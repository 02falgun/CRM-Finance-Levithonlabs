'use client';

import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Printer, 
  CheckCircle, 
  Search, 
  AlertCircle, 
  FileText, 
  Ban, 
  Trash2, 
  Filter,
  DollarSign,
  Calendar,
  Layers,
  ArrowUpRight,
  TrendingUp,
  Receipt,
  Mail
} from 'lucide-react';
import { api } from '../../../lib/api';

interface LineItem {
  desc: string;
  qty: number;
  price: number;
  taxId: string;
  discount: number;
}

interface Invoice {
  id: string;
  invoiceNo: string;
  customer: {
    name: string;
    panNumber: string | null;
  };
  subTotal: number;
  vatAmount: number;
  totalAmount: number;
  status: 'DRAFT' | 'SENT' | 'PAID' | 'PARTIAL_PAID' | 'OVERDUE' | 'CANCELLED';
  isPrinted: boolean;
  dateBS: string;
  fiscalYear: string;
  ebills?: {
    verifiedHash: string | null;
  }[];
}

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [taxes, setTaxes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [activeTab, setActiveTab] = useState<'list' | 'create'>('list');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [search, setSearch] = useState('');
  
  // Form Inputs
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [generalDiscount, setGeneralDiscount] = useState(0);
  const [items, setItems] = useState<LineItem[]>([
    { desc: 'ERP System Setup & Implementation SLA', qty: 1, price: 50000, taxId: '', discount: 0 }
  ]);

  useEffect(() => {
    fetchInvoices();
    fetchCustomers();
    fetchTaxes();
  }, []);

  async function fetchInvoices() {
    try {
      setLoading(true);
      const res = await api.get('/sales/invoices');
      setInvoices(res);
    } catch (err: any) {
      alert('Failed to load invoices: ' + err.message);
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
    setItems([...items, { desc: '', qty: 1, price: 0, taxId: '', discount: 0 }]);
  };

  const handleRemoveItem = (index: number) => {
    if (items.length === 1) return;
    setItems(items.filter((_, idx) => idx !== index));
  };

  const handleSaveInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomerId) {
      alert('Please select a customer profile');
      return;
    }

    try {
      await api.post('/sales/invoices', {
        customerId: selectedCustomerId,
        discount: Number(generalDiscount),
        items: items.map(i => ({
          description: i.desc,
          quantity: Number(i.qty),
          unitPrice: Number(i.price),
          discount: Number(i.discount),
          taxId: i.taxId || undefined
        }))
      });

      setSelectedCustomerId('');
      setGeneralDiscount(0);
      setItems([{ desc: 'ERP System Setup & Implementation SLA', qty: 1, price: 50000, taxId: '', discount: 0 }]);
      setActiveTab('list');
      fetchInvoices();
      alert('Draft Invoice generated successfully!');
    } catch (err: any) {
      alert('Failed to create invoice: ' + err.message);
    }
  };

  const handlePrintLock = async (invoiceId: string) => {
    try {
      const res = await api.post(`/sales/invoices/${invoiceId}/print`);
      fetchInvoices();
      alert(`Invoice successfully locked and synchronized to Nepal IRD portal!\nVerification Hash: ${res.verificationHash}`);
    } catch (err: any) {
      alert('Failed to print and lock invoice: ' + err.message);
    }
  };

  const handleVoidCreditNote = async (invoiceId: string) => {
    const reason = prompt('Specify void reason for credit note generation (Required by Nepal IRD):');
    if (!reason || !reason.trim()) {
      alert('Credit note generation cancelled. A valid reason is required.');
      return;
    }

    try {
      await api.post(`/sales/invoices/${invoiceId}/credit-notes`, { reason });
      fetchInvoices();
      alert(`Credit Note successfully issued.\nStatus set to CANCELLED.`);
    } catch (err: any) {
      alert('Failed to void invoice: ' + err.message);
    }
  };

  const handleDeleteDraft = async (invoiceId: string) => {
    if (confirm('Are you sure you want to delete this draft invoice?')) {
      try {
        await api.delete(`/sales/invoices/${invoiceId}`);
        fetchInvoices();
        alert('Draft invoice deleted.');
      } catch (err: any) {
        alert('Failed to delete draft: ' + err.message);
      }
    }
  };

  const handleDownloadPdf = async (id: string, invoiceNo: string) => {
    try {
      const blob = await api.get(`/integration/pdf/invoice/${id}`);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Invoice_${invoiceNo}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      alert('Failed to download invoice PDF: ' + err.message);
    }
  };

  const handleEmailInvoice = async (id: string) => {
    try {
      const res = await api.post(`/integration/email/invoice/${id}`);
      alert(res.message || 'Invoice successfully emailed.');
    } catch (err: any) {
      alert('Failed to email invoice: ' + err.message);
    }
  };

  const filtered = invoices.filter(i => {
    const matchesSearch = 
      i.customer.name.toLowerCase().includes(search.toLowerCase()) || 
      i.invoiceNo.toLowerCase().includes(search.toLowerCase()) ||
      (i.customer.panNumber && i.customer.panNumber.includes(search));
    
    if (statusFilter === 'ALL') return matchesSearch;
    return matchesSearch && i.status === statusFilter;
  });

  if (loading && invoices.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="text-center space-y-2">
          <div className="w-8 h-8 border-4 border-t-[#E86D1F] border-r-transparent border-slate-300 rounded-full animate-spin mx-auto" />
          <p className="text-[10px] text-slate-400 font-extrabold uppercase tracking-widest">Loading Invoices...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 font-sans">
      {/* Upper Statistics Panel */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="premium-card p-5 rounded-2xl bg-white border border-slate-200/60 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider block">Total Invoiced</span>
            <span className="text-lg font-black text-[#111111] font-outfit">
              Rs. {invoices.reduce((acc, curr) => curr.status !== 'CANCELLED' ? acc + Number(curr.totalAmount) : acc, 0).toLocaleString()}
            </span>
          </div>
          <div className="h-10 w-10 bg-slate-50 border border-slate-100 rounded-xl flex items-center justify-center text-[#111111]">
            <TrendingUp className="h-5 w-5" />
          </div>
        </div>

        <div className="premium-card p-5 rounded-2xl bg-white border border-slate-200/60 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider block">Ledger Paid</span>
            <span className="text-lg font-black text-emerald-600 font-outfit">
              Rs. {invoices.reduce((acc, curr) => curr.status === 'PAID' ? acc + Number(curr.totalAmount) : curr.status === 'PARTIAL_PAID' ? acc + (Number(curr.totalAmount) * 0.4) : acc, 0).toLocaleString()}
            </span>
          </div>
          <div className="h-10 w-10 bg-emerald-50 border border-emerald-100 rounded-xl flex items-center justify-center text-emerald-600">
            <DollarSign className="h-5 w-5" />
          </div>
        </div>

        <div className="premium-card p-5 rounded-2xl bg-white border border-slate-200/60 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider block">Outstanding Receivables</span>
            <span className="text-lg font-black text-indigo-600 font-outfit">
              Rs. {invoices.reduce((acc, curr) => {
                if (curr.status === 'SENT') return acc + Number(curr.totalAmount);
                if (curr.status === 'PARTIAL_PAID') return acc + (Number(curr.totalAmount) * 0.6);
                if (curr.status === 'OVERDUE') return acc + Number(curr.totalAmount);
                return acc;
              }, 0).toLocaleString()}
            </span>
          </div>
          <div className="h-10 w-10 bg-indigo-50 border border-indigo-100 rounded-xl flex items-center justify-center text-indigo-600">
            <Layers className="h-5 w-5" />
          </div>
        </div>

        <div className="premium-card p-5 rounded-2xl bg-white border border-slate-200/60 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider block">Cancelled Credit Notes</span>
            <span className="text-lg font-black text-rose-600 font-outfit">
              Rs. {invoices.reduce((acc, curr) => curr.status === 'CANCELLED' ? acc + Number(curr.totalAmount) : acc, 0).toLocaleString()}
            </span>
          </div>
          <div className="h-10 w-10 bg-rose-50 border border-rose-100 rounded-xl flex items-center justify-center text-rose-600">
            <Ban className="h-5 w-5" />
          </div>
        </div>
      </div>

      {/* Header Panel */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-slate-200/80 pb-4 gap-4">
        <div>
          <h1 className="text-xl font-black text-[#111111] font-outfit uppercase flex items-center gap-2">
            <Receipt className="h-5 w-5 text-[#E86D1F]" /> Invoice Registry
          </h1>
          <p className="text-xs text-slate-500 mt-1">Nepal CBMS compliance logs, printed bills, and tax returns tracking</p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => { setActiveTab('list'); setStatusFilter('ALL'); }}
            className={`text-xs py-2.5 px-4 rounded-xl font-bold border transition-all ${
              activeTab === 'list' 
                ? 'bg-[#111111] text-white border-slate-900 shadow-md shadow-slate-900/10' 
                : 'bg-white text-slate-500 border-slate-200 hover:border-[#E86D1F]'
            }`}
          >
            All Invoices
          </button>
          <button
            onClick={() => setActiveTab('create')}
            className={`text-xs py-2.5 px-4 rounded-xl font-bold border transition-all ${
              activeTab === 'create' 
                ? 'bg-[#111111] text-white border-slate-900 shadow-md shadow-slate-900/10' 
                : 'bg-white text-slate-500 border-slate-200 hover:border-[#E86D1F]'
            }`}
          >
            New Invoice Draft
          </button>
        </div>
      </div>

      {activeTab === 'list' ? (
        <div className="premium-card p-6 rounded-2xl bg-white border border-slate-200/60 shadow-sm space-y-4">
          {/* Controls Bar */}
          <div className="flex flex-col md:flex-row justify-between items-stretch md:items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3.5 h-4 w-4 text-slate-400" />
              <input 
                type="text" 
                placeholder="Search by client name, invoice number, or PAN..." 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-[#F8F8F8] border border-slate-200/80 rounded-xl pl-9 pr-4 py-2.5 text-xs text-[#111111] focus:outline-none focus:border-[#E86D1F] transition-all"
              />
            </div>
            
            {/* Status Filter Badges */}
            <div className="flex flex-wrap gap-1 items-center bg-[#F8F8F8] p-1 rounded-xl border border-slate-200/60">
              {['ALL', 'DRAFT', 'SENT', 'PAID', 'PARTIAL_PAID', 'OVERDUE', 'CANCELLED'].map((st) => (
                <button
                  key={st}
                  onClick={() => setStatusFilter(st)}
                  className={`text-[9px] font-extrabold px-2.5 py-1.5 rounded-lg transition-all uppercase ${
                    statusFilter === st
                      ? 'bg-white text-[#111111] shadow-sm'
                      : 'text-slate-500 hover:text-[#111111]'
                  }`}
                >
                  {st.replace('_', ' ')}
                </button>
              ))}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                  <th className="py-3.5 px-2">Invoice No</th>
                  <th className="py-3.5 px-2">Customer / PAN</th>
                  <th className="py-3.5 px-2">Subtotal</th>
                  <th className="py-3.5 px-2">VAT (13%)</th>
                  <th className="py-3.5 px-2">Total Amount</th>
                  <th className="py-3.5 px-2">Status</th>
                  <th className="py-3.5 px-2 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-400 font-normal">
                      No invoices found matching criteria.
                    </td>
                  </tr>
                ) : (
                  filtered.map(i => (
                    <tr key={i.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-4 px-2 font-bold font-mono text-[#111111] text-xs">
                        {i.invoiceNo}
                        <span className="block text-[8px] text-slate-400 font-sans font-normal mt-0.5">
                          Fiscal Year: {i.fiscalYear}
                        </span>
                      </td>
                      <td className="py-4 px-2">
                        <div className="font-bold text-[#111111]">{i.customer.name}</div>
                        <div className="text-[10px] text-slate-400 mt-0.5 font-mono">
                          PAN: {i.customer.panNumber || 'Unspecified'}
                        </div>
                      </td>
                      <td className="py-4 px-2 text-slate-500">Rs. {Number(i.subTotal).toLocaleString()}</td>
                      <td className="py-4 px-2 text-slate-500">Rs. {Number(i.vatAmount).toLocaleString()}</td>
                      <td className="py-4 px-2 text-[#111111] font-extrabold text-sm">Rs. {Number(i.totalAmount).toLocaleString()}</td>
                      <td className="py-4 px-2">
                        <span className={`inline-block text-[9px] font-extrabold px-2 py-0.5 rounded-lg border uppercase tracking-wider ${
                          i.status === 'PAID'
                            ? 'bg-emerald-50 text-emerald-600 border-emerald-100'
                            : i.status === 'PARTIAL_PAID'
                            ? 'bg-purple-50 text-purple-600 border-purple-100'
                            : i.status === 'SENT'
                            ? 'bg-sky-50 text-sky-600 border-sky-100'
                            : i.status === 'OVERDUE'
                            ? 'bg-orange-50 text-orange-600 border-orange-100'
                            : i.status === 'CANCELLED'
                            ? 'bg-rose-50 text-rose-600 border-rose-100'
                            : 'bg-amber-50 text-amber-600 border-amber-100'
                        }`}>
                          {i.status.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="py-4 px-2 text-right space-x-1.5 whitespace-nowrap">
                        <button
                          onClick={() => handleDownloadPdf(i.id, i.invoiceNo)}
                          className="bg-white hover:bg-slate-100 text-slate-500 border border-slate-200 text-[10px] font-bold p-1.5 rounded-lg transition-all"
                          title="Download Tax Invoice PDF"
                        >
                          <FileText className="h-3.5 w-3.5 text-slate-400" />
                        </button>

                        {!i.isPrinted ? (
                          <>
                            <button 
                              onClick={() => handlePrintLock(i.id)}
                              className="bg-slate-900 hover:bg-[#E86D1F] text-white text-[10px] font-bold px-3 py-1.5 rounded-lg transition-all inline-flex items-center gap-1"
                            >
                              <Printer className="h-3 w-3" /> Print & Issue
                            </button>
                            <button
                              onClick={() => handleDeleteDraft(i.id)}
                              className="bg-white hover:bg-rose-50 text-slate-450 hover:text-rose-600 border border-slate-200 text-[10px] font-bold p-1.5 rounded-lg transition-all inline-flex items-center"
                              title="Delete Draft"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </>
                        ) : (
                          <>
                            <span className="inline-flex items-center gap-1 text-[9px] font-bold text-slate-400 bg-slate-50 border border-slate-200 px-2 py-1 rounded-lg">
                              <CheckCircle className="h-3 w-3 text-emerald-500" /> Locked
                            </span>
                            <button
                              onClick={() => handleEmailInvoice(i.id)}
                              className="bg-white hover:bg-slate-100 text-slate-500 border border-slate-200 text-[10px] font-bold p-1.5 rounded-lg transition-all"
                              title="Email invoice PDF to buyer"
                            >
                              <Mail className="h-3.5 w-3.5 text-slate-400" />
                            </button>
                          </>
                        )}
                        
                        {i.status !== 'CANCELLED' && i.status !== 'DRAFT' && (
                          <button
                            onClick={() => handleVoidCreditNote(i.id)}
                            className="bg-white hover:bg-rose-50 text-slate-500 hover:text-rose-600 border border-slate-200 text-[10px] font-bold px-2.5 py-1.5 rounded-lg transition-all inline-flex items-center gap-1"
                          >
                            <Ban className="h-3 w-3" /> Void (CN)
                          </button>
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
        <form onSubmit={handleSaveInvoice} className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          {/* Main Info */}
          <div className="lg:col-span-2 premium-card p-6 rounded-2xl bg-white border border-slate-200/60 shadow-sm space-y-6">
            <div className="border-b border-slate-100 pb-4 flex justify-between items-center">
              <h2 className="text-xs font-black uppercase text-[#111111] tracking-wider">Invoice Line Items</h2>
              <span className="text-[10px] text-slate-400 font-bold">Associate dynamic tax configurations per row</span>
            </div>

            <div className="space-y-4">
              {items.map((item, index) => (
                <div key={index} className="grid grid-cols-12 gap-3 items-end bg-[#F8F8F8]/50 p-3.5 rounded-xl border border-slate-100 animate-in fade-in duration-200">
                  <div className="col-span-12 sm:col-span-4 space-y-1">
                    <label className="text-[9px] text-slate-400 font-extrabold uppercase">Product / Service Description</label>
                    <input
                      type="text"
                      placeholder="e.g. ERP License SLA"
                      value={item.desc}
                      onChange={(e) => {
                        const copy = [...items];
                        copy[index].desc = e.target.value;
                        setItems(copy);
                      }}
                      className="w-full bg-white border border-slate-200/80 rounded-lg p-2.5 text-xs text-[#111111] outline-none focus:border-[#E86D1F]"
                      required
                    />
                  </div>
                  <div className="col-span-3 sm:col-span-2 space-y-1">
                    <label className="text-[9px] text-slate-400 font-extrabold uppercase">Qty</label>
                    <input
                      type="number"
                      value={item.qty}
                      onChange={(e) => {
                        const copy = [...items];
                        copy[index].qty = Math.max(1, Number(e.target.value));
                        setItems(copy);
                      }}
                      className="w-full bg-white border border-slate-200/80 rounded-lg p-2.5 text-xs text-[#111111] outline-none focus:border-[#E86D1F]"
                      min="1"
                      required
                    />
                  </div>
                  <div className="col-span-3 sm:col-span-2 space-y-1">
                    <label className="text-[9px] text-slate-400 font-extrabold uppercase">Unit Price (NPR)</label>
                    <input
                      type="number"
                      value={item.price}
                      onChange={(e) => {
                        const copy = [...items];
                        copy[index].price = Math.max(0, Number(e.target.value));
                        setItems(copy);
                      }}
                      className="w-full bg-white border border-slate-200/80 rounded-lg p-2.5 text-xs text-[#111111] outline-none focus:border-[#E86D1F]"
                      min="0"
                      required
                    />
                  </div>
                  <div className="col-span-3 sm:col-span-3 space-y-1">
                    <label className="text-[9px] text-slate-400 font-extrabold uppercase">Tax Config</label>
                    <select
                      value={item.taxId}
                      onChange={(e) => {
                        const copy = [...items];
                        copy[index].taxId = e.target.value;
                        setItems(copy);
                      }}
                      className="w-full bg-white border border-slate-200/80 rounded-lg p-2.5 text-xs text-[#111111] outline-none"
                    >
                      <option value="">Exempt (0%)</option>
                      {taxes.map(t => (
                        <option key={t.id} value={t.id}>{t.name} ({Number(t.rate)}%)</option>
                      ))}
                    </select>
                  </div>
                  <div className="col-span-12 sm:col-span-1 flex justify-end pb-2">
                    <button
                      type="button"
                      onClick={() => handleRemoveItem(index)}
                      className="text-[10px] text-rose-500 hover:text-rose-700 font-bold p-1 rounded hover:bg-rose-50"
                      disabled={items.length === 1}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={handleAddItem}
              className="text-xs font-bold text-[#E86D1F] hover:text-[#111111] transition-all flex items-center gap-1.5 mt-2"
            >
              <Plus className="h-4 w-4" /> Add Item Row
            </button>
          </div>

          {/* Client Details */}
          <div className="premium-card p-6 rounded-2xl bg-white border border-slate-200/60 shadow-sm space-y-6">
            <div className="border-b border-slate-100 pb-4">
              <h2 className="text-xs font-black uppercase text-[#111111] tracking-wider">Billing Profile</h2>
            </div>

            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] text-slate-400 font-bold uppercase">Buyer Company</label>
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
                <label className="text-[10px] text-slate-400 font-bold uppercase">General Invoice Discount (NPR)</label>
                <input
                  type="number"
                  value={generalDiscount}
                  onChange={(e) => setGeneralDiscount(Math.max(0, Number(e.target.value)))}
                  className="w-full bg-[#F8F8F8] border border-slate-200/80 rounded-xl p-2.5 text-xs outline-none focus:border-[#E86D1F]"
                />
              </div>
            </div>

            {/* Calculations */}
            <div className="pt-4 border-t border-slate-100 space-y-2 text-xs">
              <div className="flex justify-between text-slate-400 font-medium">
                <span>Taxable Amount</span>
                <span>
                  Rs. {items.reduce((acc, curr) => {
                    const tax = taxes.find(t => t.id === curr.taxId);
                    return acc + ((!tax || !tax.isExempt) ? (curr.qty * curr.price) : 0);
                  }, 0).toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between text-slate-400 font-medium">
                <span>Non-Taxable Amount</span>
                <span>
                  Rs. {items.reduce((acc, curr) => {
                    const tax = taxes.find(t => t.id === curr.taxId);
                    return acc + ((tax && tax.isExempt) ? (curr.qty * curr.price) : 0);
                  }, 0).toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between text-slate-400 font-medium">
                <span>Nepal VAT (13%)</span>
                <span>
                  Rs. {items.reduce((acc, curr) => {
                    const tax = taxes.find(t => t.id === curr.taxId);
                    if (tax && !tax.isExempt) {
                      return acc + (curr.qty * curr.price * (Number(tax.rate) / 100));
                    }
                    return acc;
                  }, 0).toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between text-slate-400 font-medium">
                <span>General Discount</span>
                <span>Rs. {generalDiscount.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-[#111111] font-extrabold pt-2.5 border-t border-dashed border-slate-200 text-sm">
                <span>Total Bill Amount</span>
                <span>
                  Rs. {Math.max(0, items.reduce((acc, curr) => {
                    const tax = taxes.find(t => t.id === curr.taxId);
                    const val = curr.qty * curr.price;
                    const taxAmt = (tax && !tax.isExempt) ? (val * (Number(tax.rate) / 100)) : 0;
                    return acc + val + taxAmt;
                  }, 0) - generalDiscount).toLocaleString()}
                </span>
              </div>
            </div>

            <button
              type="submit"
              className="w-full bg-[#111111] hover:bg-[#E86D1F] text-white text-xs font-bold p-3 rounded-xl shadow-lg transition-all"
            >
              Generate Draft Invoice
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
