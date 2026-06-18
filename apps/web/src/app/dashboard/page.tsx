'use client';

import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  Users, 
  Receipt, 
  ShieldCheck, 
  Clock, 
  ArrowUpRight 
} from 'lucide-react';
import { api } from '../../lib/api';

interface Transaction {
  id: string;
  customer: string;
  billNo: string;
  amount: number;
  status: string;
  date: string;
}

interface ChartPoint {
  day: string;
  amount: number;
}

interface DashboardStats {
  totalRevenue: number;
  activeCustomers: number;
  invoicesIssued: number;
  syncRate: number;
  recentTransactions: Transaction[];
  chartData: ChartPoint[];
}

export default function AnalyticsPage() {
  const [data, setData] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function fetchDashboard() {
      try {
        const res = await api.get('/utility/dashboard');
        setData(res);
      } catch (err: any) {
        setError(err.message || 'Failed to fetch dashboard metrics');
      } finally {
        setLoading(false);
      }
    }
    fetchDashboard();
  }, []);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="text-center space-y-2">
          <div className="w-8 h-8 border-4 border-t-[#E86D1F] border-r-transparent border-slate-300 rounded-full animate-spin mx-auto" />
          <p className="text-[10px] text-slate-400 font-extrabold uppercase tracking-widest">Aggregating Ledger Stats...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-6 bg-rose-50 border border-rose-100 rounded-2xl text-rose-600 text-xs">
        {error || 'Could not load stats data. Check backend connectivity.'}
      </div>
    );
  }

  // Calculate dynamic SVG coordinates for the last 7 days chart
  const maxAmount = Math.max(...data.chartData.map(d => d.amount), 1);
  const points = data.chartData.map((d, i) => {
    const x = i * 100;
    const y = 180 - (d.amount / maxAmount) * 150;
    return { x, y };
  });

  const strokePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ');
  const areaPath = `${strokePath} L600,200 L0,200 Z`;

  const stats = [
    { name: 'Total Revenue', value: `Rs. ${data.totalRevenue.toLocaleString()}`, change: 'Live', desc: 'verified sales ledger', icon: TrendingUp },
    { name: 'Active Customers', value: String(data.activeCustomers), change: 'Sync', desc: 'onboarded business PANs', icon: Users },
    { name: 'Invoices Issued', value: String(data.invoicesIssued), change: 'Official', desc: 'sequential bill serials', icon: Receipt },
    { name: 'IRD Compliance Sync', value: `${data.syncRate}%`, change: 'Sandbox', desc: 'real-time sync accepted', icon: ShieldCheck },
  ];

  return (
    <div className="space-y-8 font-sans">
      {/* Page Header */}
      <div>
        <h1 className="text-xl font-black tracking-tight text-[#111111] font-outfit uppercase">
          Billing & CRM Analytics
        </h1>
        <p className="text-xs text-slate-500 mt-1">Real-time sales, crm leads, and IRD sync monitoring</p>
      </div>

      {/* Grid Stats */}
      <section className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {stats.map((s) => (
          <div key={s.name} className="premium-card p-6 rounded-2xl bg-white space-y-4">
            <div className="flex justify-between items-start">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">{s.name}</span>
              <div className="p-2 rounded-lg bg-slate-50 text-[#111111] border border-slate-100">
                <s.icon className="h-4 w-4 text-[#E86D1F]" />
              </div>
            </div>
            <div>
              <div className="text-2xl font-black text-[#111111]">{s.value}</div>
              <div className="flex items-center gap-1.5 mt-2">
                <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">{s.change}</span>
                <span className="text-[10px] text-slate-400">{s.desc}</span>
              </div>
            </div>
          </div>
        ))}
      </section>

      {/* Charts & Transaction Panels */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Sales Performance Chart (Dynamic SVG Sparkline) */}
        <div className="lg:col-span-2 premium-card p-6 rounded-2xl bg-white space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-sm font-bold text-[#111111] uppercase tracking-wider">Revenue Stream</h2>
              <p className="text-[11px] text-slate-400 mt-0.5">NPR weekly invoice volume</p>
            </div>
            <span className="text-xs font-semibold text-slate-500">Last 7 Days</span>
          </div>

          <div className="h-64 w-full relative pt-4">
            <div className="absolute inset-0 flex flex-col justify-between pointer-events-none opacity-20">
              <div className="border-b border-[#111111]" />
              <div className="border-b border-[#111111]" />
              <div className="border-b border-[#111111]" />
              <div className="border-b border-[#111111]" />
            </div>

            <svg className="w-full h-full overflow-visible" viewBox="0 0 600 200" preserveAspectRatio="none">
              <defs>
                <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#E86D1F" stopOpacity="0.25" />
                  <stop offset="100%" stopColor="#E86D1F" stopOpacity="0.0" />
                </linearGradient>
              </defs>
              <path 
                d={areaPath} 
                fill="url(#chartGradient)"
              />
              <path 
                d={strokePath} 
                fill="none" 
                stroke="#E86D1F" 
                strokeWidth="3.5"
                strokeLinecap="round"
              />
              {points.map((p, idx) => (
                <circle 
                  key={idx} 
                  cx={p.x} 
                  cy={p.y} 
                  r="4.5" 
                  fill="#111111" 
                  stroke="#E86D1F" 
                  strokeWidth="2.5" 
                />
              ))}
            </svg>
          </div>

          <div className="flex justify-between items-center text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2">
            {data.chartData.map((d, idx) => (
              <span key={idx}>{d.day}</span>
            ))}
          </div>
        </div>

        {/* Recent CBMS Transmissions */}
        <div className="premium-card p-6 rounded-2xl bg-white space-y-6">
          <div className="flex justify-between items-center border-b border-slate-100 pb-4">
            <h2 className="text-sm font-bold text-[#111111] uppercase tracking-wider">E-Billing Portal</h2>
            <Clock className="h-4.5 w-4.5 text-slate-400" />
          </div>

          <div className="space-y-4">
            {data.recentTransactions.length === 0 ? (
              <p className="text-xs text-slate-400 italic">No invoices synchronized yet.</p>
            ) : (
              data.recentTransactions.map((tx) => (
                <div key={tx.id} className="flex justify-between items-center text-xs">
                  <div className="space-y-1 max-w-[60%]">
                    <div className="font-bold text-[#111111] truncate">{tx.customer}</div>
                    <div className="text-[10px] text-slate-400 font-mono truncate">
                      {tx.billNo} • {new Date(tx.date).toLocaleDateString()}
                    </div>
                  </div>
                  <div className="text-right space-y-1">
                    <div className="font-bold text-[#111111]">Rs. {tx.amount.toLocaleString()}</div>
                    <span className={`inline-block text-[9px] font-extrabold px-1.5 py-0.5 rounded ${
                      tx.status === 'SUCCESS' || tx.status === 'ACCEPTED'
                        ? 'bg-emerald-50 text-emerald-600' 
                        : tx.status === 'PENDING'
                        ? 'bg-amber-50 text-amber-600'
                        : 'bg-rose-50 text-rose-600'
                    }`}>
                      {tx.status}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
