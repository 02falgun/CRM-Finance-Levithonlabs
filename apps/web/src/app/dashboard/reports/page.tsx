'use client';

import React, { useState, useEffect } from 'react';
import { FileSpreadsheet, FileText, Download, CheckCircle } from 'lucide-react';
import { api } from '../../../lib/api';

interface Report {
  id: string;
  title: string;
  type: string;
  date: string;
  status: string;
}

export default function ReportsPage() {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [title, setTitle] = useState('');
  const [type, setType] = useState('TAX');

  useEffect(() => {
    fetchReports();
  }, []);

  async function fetchReports() {
    try {
      setLoading(true);
      const res = await api.get('/utility/reports');
      const mapped = res.map((r: any) => ({
        id: r.id,
        title: r.title,
        type: r.type,
        date: r.createdAt ? new Date(r.createdAt).toISOString().split('T')[0] : 'N/A',
        status: 'COMPLETED'
      }));
      setReports(mapped);
    } catch (err: any) {
      alert('Failed to load reports: ' + err.message);
    } finally {
      setLoading(false);
    }
  }

  const handleCreateReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title) return;

    try {
      setSubmitting(true);
      await api.post('/utility/reports/generate', {
        title,
        type,
        parameters: {}
      });

      setTitle('');
      await fetchReports();
      alert('Dynamic report generated successfully!');
    } catch (err: any) {
      alert('Failed to generate report: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDownloadPdf = async (id: string, titleStr: string) => {
    try {
      const blob = await api.get(`/integration/pdf/report/${id}`);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${titleStr.replace(/\s+/g, '_')}_Report.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      alert('Failed to download report PDF: ' + err.message);
    }
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="text-center space-y-2">
          <div className="w-8 h-8 border-4 border-t-[#E86D1F] border-r-transparent border-slate-200 rounded-full animate-spin mx-auto" />
          <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Syncing Reports...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-xl font-black text-[#111111] font-outfit uppercase">Compliance Reports</h1>
        <p className="text-xs text-slate-500 mt-1">Export sales audits, tax records, and crm activities spreadsheets</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Reports Registry */}
        <div className="lg:col-span-2 premium-card p-6 rounded-2xl bg-white space-y-4">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                  <th className="py-3 px-2">Report Document Title</th>
                  <th className="py-3 px-2">Type</th>
                  <th className="py-3 px-2">Created Date</th>
                  <th className="py-3 px-2">Status</th>
                  <th className="py-3 px-2 text-right">Download</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {reports.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-6 text-center text-xs text-slate-400 font-bold">
                      No reports generated yet.
                    </td>
                  </tr>
                ) : (
                  reports.map(r => (
                    <tr key={r.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-3.5 px-2 text-[#111111] font-bold flex items-center gap-2">
                        <FileText className="h-4 w-4 text-[#E86D1F]" /> {r.title}
                      </td>
                      <td className="py-3.5 px-2 font-mono">
                        <span className="text-[9px] bg-slate-900 text-white font-bold px-1.5 py-0.5 rounded animate-pulse">
                          {r.type}
                        </span>
                      </td>
                      <td className="py-3.5 px-2 text-slate-500 font-mono">{r.date}</td>
                      <td className="py-3.5 px-2">
                        <span className="inline-flex items-center gap-1 text-[9px] font-extrabold bg-emerald-50 text-emerald-600 px-1.5 py-0.5 rounded">
                          <CheckCircle className="h-3.5 w-3.5 text-emerald-500" /> {r.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-2 text-right">
                        <button 
                          onClick={() => handleDownloadPdf(r.id, r.title)}
                          className="bg-white hover:bg-slate-50 text-slate-600 border border-slate-200 p-1.5 rounded-lg transition-all shadow-sm"
                          title="Download Document"
                        >
                          <Download className="h-4.5 w-4.5 text-[#E86D1F]" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Generate Report Form */}
        <div className="premium-card p-6 rounded-2xl bg-white space-y-4">
          <div className="border-b border-slate-100 pb-3 flex items-center gap-1.5 text-slate-400">
            <FileSpreadsheet className="h-4 w-4 text-[#E86D1F]" />
            <h2 className="text-xs font-black uppercase tracking-wider text-[#111111]">Generate report</h2>
          </div>

          <form onSubmit={handleCreateReport} className="space-y-3">
            <div className="space-y-1">
              <label className="text-[10px] text-slate-400 font-bold uppercase">Report Sheet Name</label>
              <input 
                type="text" 
                placeholder="e.g. Sales Ledger Ashadh"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full bg-[#F8F8F8] border border-slate-200/80 rounded-xl p-2.5 text-xs outline-none focus:border-[#E86D1F] text-[#111111]"
                required
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] text-slate-400 font-bold uppercase">Report Class Category</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="w-full bg-[#F8F8F8] border border-slate-200/80 rounded-xl p-2.5 text-xs outline-none text-[#111111] focus:border-[#E86D1F]"
              >
                <option value="TAX">TAX VAT Register (Nepal Rules)</option>
                <option value="SALES">Sales Ledger Report</option>
                <option value="AUDIT">CRM Audit Log Trail</option>
              </select>
            </div>

            <button 
              type="submit" 
              disabled={submitting}
              className="w-full bg-slate-900 hover:bg-[#E86D1F] text-white text-xs font-bold p-3 rounded-xl transition-all"
            >
              {submitting ? 'Compiling...' : 'Compile & Generate PDF'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
