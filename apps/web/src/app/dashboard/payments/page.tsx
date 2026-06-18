'use client';

import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Wallet, 
  ShieldCheck, 
  Calendar, 
  AlertCircle, 
  Layers, 
  Download
} from 'lucide-react';
import { api } from '../../../lib/api';

interface Payment {
  id: string;
  invoiceId: string;
  invoiceNo: string;
  customerName: string;
  amount: number;
  paymentMode: string;
  referenceNo: string;
  paidAt: string;
}

interface Invoice {
  id: string;
  invoiceNo: string;
  customer: {
    name: string;
  };
  totalAmount: number;
  paidAmount: number;
  status: 'DRAFT' | 'SENT' | 'PAID' | 'PARTIAL_PAID' | 'OVERDUE' | 'CANCELLED';
}

export default function PaymentsPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);

  // Form Inputs
  const [selectedInvoiceId, setSelectedInvoiceId] = useState('');
  const [amount, setAmount] = useState<number | ''>('');
  const [mode, setMode] = useState<'CASH' | 'BANK_TRANSFER' | 'ESEWA' | 'KHALTI' | 'IME_PAY' | 'QR' | 'CHEQUE'>('ESEWA');
  const [refNo, setRefNo] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    try {
      setLoading(true);
      const [invs, pmts] = await Promise.all([
        api.get('/sales/invoices'),
        api.get('/sales/payments')
      ]);
      setInvoices(invs);
      
      const mappedPmts = pmts.map((p: any) => ({
        id: p.id,
        invoiceId: p.invoiceId,
        invoiceNo: p.invoice?.invoiceNo || 'N/A',
        customerName: p.invoice?.customer?.name || 'N/A',
        amount: Number(p.amount),
        paymentMode: p.paymentMode,
        referenceNo: p.referenceNo || 'N/A',
        paidAt: p.paidAt ? new Date(p.paidAt).toISOString().split('T')[0] : 'N/A'
      }));
      setPayments(mappedPmts);
    } catch (err: any) {
      alert('Failed to fetch ledger data: ' + err.message);
    } finally {
      setLoading(false);
    }
  }

  // Selected Invoice Metadata
  const selectedInvoice = invoices.find(i => i.id === selectedInvoiceId);
  const remainingBalance = selectedInvoice ? (selectedInvoice.totalAmount - selectedInvoice.paidAmount) : 0;

  const handleInvoiceChange = (id: string) => {
    setSelectedInvoiceId(id);
    setErrorMsg('');
    
    const inv = invoices.find(i => i.id === id);
    if (inv) {
      if (inv.status === 'DRAFT') {
        setErrorMsg('Cannot log payment against Draft invoices. Lock and issue them first.');
        setAmount('');
      } else if (inv.status === 'CANCELLED') {
        setErrorMsg('Cannot pay against a cancelled invoice.');
        setAmount('');
      } else if (inv.status === 'PAID') {
        setErrorMsg('This invoice is already fully paid.');
        setAmount('');
      } else {
        setAmount(inv.totalAmount - inv.paidAmount);
      }
    } else {
      setAmount('');
    }
  };

  const handleLogPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!selectedInvoiceId || !selectedInvoice) {
      setErrorMsg('Please select a valid invoice.');
      return;
    }

    const payAmt = Number(amount);
    if (!payAmt || payAmt <= 0) {
      setErrorMsg('Payment amount must be greater than zero.');
      return;
    }

    if (payAmt > remainingBalance) {
      setErrorMsg(`Payment exceeds remaining invoice balance of Rs. ${remainingBalance.toLocaleString()}`);
      return;
    }

    try {
      setSubmitting(true);
      await api.post(`/sales/invoices/${selectedInvoiceId}/payments`, {
        amount: payAmt,
        paymentMode: mode,
        referenceNo: refNo.trim() || undefined
      });

      alert(`Payment of Rs. ${payAmt.toLocaleString()} successfully matched with invoice ${selectedInvoice.invoiceNo}!`);
      
      // Reset inputs
      setSelectedInvoiceId('');
      setAmount('');
      setRefNo('');
      
      // Refresh list
      await fetchData();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to submit payment allocation');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDownloadReceipt = async (id: string) => {
    try {
      const blob = await api.get(`/integration/pdf/receipt/${id}`);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Receipt_${id}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      alert('Failed to download receipt PDF: ' + err.message);
    }
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="text-center space-y-2">
          <div className="w-8 h-8 border-4 border-t-[#E86D1F] border-r-transparent border-slate-200 rounded-full animate-spin mx-auto" />
          <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Syncing Ledger...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Upper Stats bar */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="premium-card p-5 rounded-2xl bg-white border border-slate-200/60 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider block">Total Ledger Revenue</span>
            <span className="text-lg font-black text-emerald-600 font-outfit">
              Rs. {payments.reduce((acc, curr) => acc + curr.amount, 0).toLocaleString()}
            </span>
          </div>
          <div className="h-10 w-10 bg-emerald-50 border border-emerald-100 rounded-xl flex items-center justify-center text-emerald-600">
            <Wallet className="h-5 w-5" />
          </div>
        </div>

        <div className="premium-card p-5 rounded-2xl bg-white border border-slate-200/60 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider block">Reconciled Payments</span>
            <span className="text-lg font-black text-[#111111] font-outfit">
              {payments.length} Transactions
            </span>
          </div>
          <div className="h-10 w-10 bg-slate-50 border border-slate-100 rounded-xl flex items-center justify-center text-[#111111]">
            <ShieldCheck className="h-5 w-5" />
          </div>
        </div>

        <div className="premium-card p-5 rounded-2xl bg-white border border-slate-200/60 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider block">Outstanding Balances</span>
            <span className="text-lg font-black text-rose-500 font-outfit">
              Rs. {invoices.reduce((acc, curr) => curr.status !== 'CANCELLED' ? acc + (curr.totalAmount - curr.paidAmount) : acc, 0).toLocaleString()}
            </span>
          </div>
          <div className="h-10 w-10 bg-rose-50 border border-rose-100 rounded-xl flex items-center justify-center text-rose-500">
            <Layers className="h-5 w-5" />
          </div>
        </div>
      </div>

      <div>
        <h1 className="text-xl font-black text-[#111111] font-outfit uppercase flex items-center gap-2">
          <Wallet className="h-5 w-5 text-[#E86D1F]" /> Payments Ledger
        </h1>
        <p className="text-xs text-slate-500 mt-1">Receive invoice payments, allocate to ledger, and verify references</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Payments Ledger table (col-span-2) */}
        <div className="lg:col-span-2 space-y-6">
          <div className="premium-card p-6 rounded-2xl bg-white border border-slate-200/60 shadow-sm space-y-4">
            <h2 className="text-xs font-black uppercase text-[#111111] tracking-wider">Transaction Records</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                    <th className="py-3 px-2">Invoice No</th>
                    <th className="py-3 px-2">Client / Company</th>
                    <th className="py-3 px-2">Paid Amount</th>
                    <th className="py-3 px-2">Gateway Mode</th>
                    <th className="py-3 px-2">Ref / TXN ID</th>
                    <th className="py-3 px-2">Reconciliation Date</th>
                    <th className="py-3 px-2 text-right">Receipt</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                  {payments.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-6 text-center text-xs text-slate-400 font-bold">
                        No payments reconciled yet.
                      </td>
                    </tr>
                  ) : (
                    payments.map(p => (
                      <tr key={p.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="py-4 px-2 font-bold font-mono text-[#111111]">{p.invoiceNo}</td>
                        <td className="py-4 px-2 text-[#111111] font-bold">{p.customerName}</td>
                        <td className="py-4 px-2 text-emerald-600 font-extrabold">Rs. {p.amount.toLocaleString()}</td>
                        <td className="py-4 px-2">
                          <span className="text-[9px] font-extrabold bg-[#F8F8F8] border border-slate-200/60 px-2 py-0.5 rounded-lg text-slate-600">
                            {p.paymentMode}
                          </span>
                        </td>
                        <td className="py-4 px-2 font-mono text-slate-500">{p.referenceNo}</td>
                        <td className="py-4 px-2 text-slate-500 flex items-center gap-1.5 mt-0.5">
                          <Calendar className="h-3.5 w-3.5 text-slate-400" /> {p.paidAt}
                        </td>
                        <td className="py-4 px-2 text-right">
                          <button
                            onClick={() => handleDownloadReceipt(p.id)}
                            className="p-1 hover:text-[#E86D1F] text-slate-400 border border-slate-200/60 rounded-md hover:bg-slate-50 transition-all shadow-sm"
                            title="Download Receipt PDF"
                          >
                            <Download className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Active Invoices Balances Tracker */}
          <div className="premium-card p-6 rounded-2xl bg-white border border-slate-200/60 shadow-sm space-y-4">
            <h2 className="text-xs font-black uppercase text-[#111111] tracking-wider">Active Invoices Balance Sheet</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {invoices.filter(i => i.status !== 'DRAFT' && i.status !== 'CANCELLED').length === 0 ? (
                <div className="col-span-2 text-center text-xs text-slate-400 py-4 font-bold">
                  No active invoices requiring tracking.
                </div>
              ) : (
                invoices.filter(i => i.status !== 'DRAFT' && i.status !== 'CANCELLED').map(inv => {
                  const pct = Math.round((inv.paidAmount / inv.totalAmount) * 100);
                  return (
                    <div key={inv.id} className="p-4 rounded-xl border border-slate-200/60 bg-[#F8F8F8]/50 space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="font-bold font-mono text-xs text-[#111111]">{inv.invoiceNo}</span>
                        <span className={`text-[8px] font-extrabold px-1.5 py-0.5 rounded border ${
                          inv.status === 'PAID' 
                            ? 'bg-emerald-50 text-emerald-600 border-emerald-100' 
                            : 'bg-purple-50 text-purple-600 border-purple-100'
                        }`}>
                          {inv.status}
                        </span>
                      </div>
                      <div className="text-[10px] text-slate-500 font-bold truncate">{inv.customer.name}</div>
                      
                      {/* Progress Bar */}
                      <div className="space-y-1">
                        <div className="w-full bg-slate-200/80 rounded-full h-1.5 overflow-hidden">
                          <div 
                            className="bg-[#E86D1F] h-1.5 rounded-full transition-all duration-500" 
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <div className="flex justify-between text-[9px] text-slate-400 font-bold">
                          <span>Rs. {inv.paidAmount.toLocaleString()} paid</span>
                          <span>Rs. {(inv.totalAmount - inv.paidAmount).toLocaleString()} left</span>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Payment Allocation Form */}
        <div className="premium-card p-6 rounded-2xl bg-white border border-slate-200/60 shadow-sm space-y-4">
          <div className="border-b border-slate-100 pb-3 flex items-center gap-1.5 text-slate-400">
            <Wallet className="h-4 w-4 text-[#E86D1F]" />
            <h2 className="text-xs font-black uppercase tracking-wider text-[#111111]">Log payment allocation</h2>
          </div>

          <form onSubmit={handleLogPayment} className="space-y-4">
            <div className="space-y-1">
              <label className="text-[10px] text-slate-400 font-bold uppercase">Select Issued Invoice</label>
              <select
                value={selectedInvoiceId}
                onChange={(e) => handleInvoiceChange(e.target.value)}
                className="w-full bg-[#F8F8F8] border border-slate-200/80 rounded-xl p-2.5 text-xs outline-none text-[#111111] focus:border-[#E86D1F]"
                required
              >
                <option value="">-- Select Active Invoice --</option>
                {invoices
                  .filter(inv => inv.status !== 'DRAFT' && inv.status !== 'CANCELLED')
                  .map(inv => (
                    <option key={inv.id} value={inv.id}>
                      {inv.invoiceNo} - {inv.customer.name} ({inv.status})
                    </option>
                  ))}
              </select>
            </div>

            {selectedInvoice && !errorMsg && (
              <div className="bg-slate-50 border border-slate-100 rounded-xl p-3.5 space-y-1.5 text-xs text-slate-600">
                <div className="flex justify-between font-medium">
                  <span>Invoice Total:</span>
                  <span className="font-extrabold text-[#111111]">Rs. {selectedInvoice.totalAmount.toLocaleString()}</span>
                </div>
                <div className="flex justify-between font-medium">
                  <span>Already Paid:</span>
                  <span className="font-extrabold text-emerald-600">Rs. {selectedInvoice.paidAmount.toLocaleString()}</span>
                </div>
                <div className="flex justify-between font-medium pt-1 border-t border-slate-200/60">
                  <span>Remaining Balance:</span>
                  <span className="font-extrabold text-[#E86D1F]">Rs. {remainingBalance.toLocaleString()}</span>
                </div>
              </div>
            )}

            {errorMsg && (
              <div className="bg-rose-50 border border-rose-100 rounded-xl p-3 flex gap-2 text-rose-600 text-xs">
                <AlertCircle className="h-4.5 w-4.5 shrink-0 mt-0.5" />
                <span>{errorMsg}</span>
              </div>
            )}

            <div className="space-y-1">
              <label className="text-[10px] text-slate-400 font-bold uppercase">Payment Amount (NPR)</label>
              <input 
                type="number" 
                value={amount}
                onChange={(e) => {
                  setAmount(e.target.value === '' ? '' : Number(e.target.value));
                  setErrorMsg('');
                }}
                disabled={!selectedInvoiceId || !!errorMsg}
                placeholder={selectedInvoice ? `Max Rs. ${remainingBalance}` : 'Select an invoice first'}
                className="w-full bg-[#F8F8F8] border border-slate-200/80 rounded-xl p-2.5 text-xs outline-none focus:border-[#E86D1F] disabled:opacity-50 text-[#111111]"
                min="1"
                required
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] text-slate-400 font-bold uppercase">Payment Mode / Gateway</label>
              <select
                value={mode}
                onChange={(e) => setMode(e.target.value as any)}
                disabled={!selectedInvoiceId || !!errorMsg}
                className="w-full bg-[#F8F8F8] border border-slate-200/80 rounded-xl p-2.5 text-xs outline-none text-[#111111] focus:border-[#E86D1F] disabled:opacity-50"
              >
                <option value="ESEWA">eSewa Wallet</option>
                <option value="KHALTI">Khalti Wallet</option>
                <option value="IME_PAY">IME Pay Wallet</option>
                <option value="BANK_TRANSFER">Bank Transfer / Fonepay</option>
                <option value="QR">Fonepay QR Code Scan</option>
                <option value="CASH">Cash Counter Payment</option>
                <option value="CHEQUE">Cheque Deposit</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] text-slate-400 font-bold uppercase">Reference No / Gateway TXN ID</label>
              <input 
                type="text" 
                placeholder="e.g. TXN-129038"
                value={refNo}
                onChange={(e) => setRefNo(e.target.value)}
                disabled={!selectedInvoiceId || !!errorMsg}
                className="w-full bg-[#F8F8F8] border border-slate-200/80 rounded-xl p-2.5 text-xs outline-none focus:border-[#E86D1F] disabled:opacity-50 text-[#111111]"
              />
            </div>

            <button 
              type="submit" 
              disabled={!selectedInvoiceId || !!errorMsg || !amount || submitting}
              className="w-full bg-[#111111] hover:bg-[#E86D1F] text-white text-xs font-bold p-3 rounded-xl transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? 'Reconciling...' : 'Reconcile & Allocate Payment'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
