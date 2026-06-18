'use client';

import React, { useState, useEffect } from 'react';
import { ShieldCheck, Search, Database, RefreshCw, CheckCircle, XCircle } from 'lucide-react';
import { api } from '../../../lib/api';

interface EbillLog {
  id: string;
  invoiceNo: string;
  customerName: string;
  buyerPan: string;
  totalAmount: number;
  syncStatus: string;
  verifiedHash: string;
  syncTime: string;
}

export default function EbillingPage() {
  const [logs, setLogs] = useState<EbillLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchLogs();
  }, []);

  async function fetchLogs() {
    try {
      setLoading(true);
      const res = await api.get('/ebilling/logs');
      const mapped = res.map((l: any) => ({
        id: l.id,
        invoiceNo: l.invoice?.invoiceNo || 'N/A',
        customerName: l.invoice?.customer?.name || 'Walk-in Customer',
        buyerPan: l.payloadSent?.buyer_pan || 'N/A',
        totalAmount: Number(l.invoice?.totalAmount || 0),
        syncStatus: l.syncStatus,
        verifiedHash: l.verifiedHash || 'N/A',
        syncTime: l.syncTime ? new Date(l.syncTime).toLocaleString() : 'N/A'
      }));
      setLogs(mapped);
    } catch (err: any) {
      alert('Failed to load compliance logs: ' + err.message);
    } finally {
      setLoading(false);
    }
  }

  const filtered = logs.filter(l => 
    l.invoiceNo.toLowerCase().includes(search.toLowerCase()) || 
    l.verifiedHash.toLowerCase().includes(search.toLowerCase()) ||
    l.customerName.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="text-center space-y-2">
          <div className="w-8 h-8 border-4 border-t-[#E86D1F] border-r-transparent border-slate-200 rounded-full animate-spin mx-auto" />
          <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Syncing compliance logs...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex justify-between items-center border-b border-slate-200/80 pb-4">
        <div>
          <h1 className="text-xl font-black text-[#111111] font-outfit uppercase">Inland Revenue Department (IRD) Portal</h1>
          <p className="text-xs text-slate-500 mt-1">Audit log records of electronic bill sync reports (CBMS System)</p>
        </div>

        <button 
          onClick={fetchLogs}
          className="flex items-center gap-1.5 bg-white hover:bg-slate-50 text-slate-600 border border-slate-200 text-xs font-bold py-2 px-4 rounded-xl transition-all shadow-sm"
        >
          <RefreshCw className="h-3.5 w-3.5 text-[#E86D1F]" /> Refresh Audit Logs
        </button>
      </div>

      {/* Main Datagrid */}
      <div className="premium-card p-6 rounded-2xl bg-white space-y-4">
        <div className="flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3.5 h-4 w-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search by Invoice No, Customer, or Verification Hash..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-[#F8F8F8] border border-slate-200/80 rounded-xl pl-9 pr-4 py-2.5 text-xs text-[#111111] focus:outline-none focus:border-[#E86D1F]"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-100 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                <th className="py-3 px-2">Invoice No</th>
                <th className="py-3 px-2">Buyer PAN & Company</th>
                <th className="py-3 px-2">Bill Total</th>
                <th className="py-3 px-2">CBMS Hash Verification ID</th>
                <th className="py-3 px-2">Portal Status</th>
                <th className="py-3 px-2">Synced At</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-6 text-center text-xs text-slate-400 font-bold">
                    No sync logs match the search query.
                  </td>
                </tr>
              ) : (
                filtered.map(l => (
                  <tr key={l.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-3.5 px-2 font-bold font-mono text-[#111111]">{l.invoiceNo}</td>
                    <td className="py-3.5 px-2">
                      <div className="font-bold text-[#111111]">{l.customerName}</div>
                      <div className="text-[10px] text-slate-400 mt-0.5 font-mono">Buyer PAN: {l.buyerPan}</div>
                    </td>
                    <td className="py-3.5 px-2 font-bold text-[#111111]">Rs. {l.totalAmount.toLocaleString()}</td>
                    <td className="py-3.5 px-2">
                      <div className="flex items-center gap-1.5">
                        <Database className="h-3.5 w-3.5 text-slate-400" />
                        <code className="bg-slate-50 border border-slate-200/60 px-1.5 py-0.5 rounded text-[11px] font-mono font-bold text-[#E86D1F]">
                          {l.verifiedHash}
                        </code>
                      </div>
                    </td>
                    <td className="py-3.5 px-2">
                      {l.syncStatus === 'Accepted' || l.syncStatus === 'SUCCESS' ? (
                        <span className="inline-flex items-center gap-1 text-[9px] font-extrabold bg-emerald-50 text-emerald-600 border border-emerald-100 px-2 py-0.5 rounded">
                          <CheckCircle className="h-3 w-3 animate-pulse" /> {l.syncStatus}
                        </span>
                      ) : l.syncStatus === 'Rejected' || l.syncStatus === 'FAILED' ? (
                        <span className="inline-flex items-center gap-1 text-[9px] font-extrabold bg-rose-50 text-rose-600 border border-rose-100 px-2 py-0.5 rounded">
                          <XCircle className="h-3 w-3" /> {l.syncStatus}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[9px] font-extrabold bg-amber-50 text-amber-600 border border-amber-100 px-2 py-0.5 rounded">
                          {l.syncStatus}
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-2 text-slate-500 font-mono">{l.syncTime}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
