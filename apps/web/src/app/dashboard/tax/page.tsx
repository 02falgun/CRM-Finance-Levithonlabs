'use client';

import React, { useState, useEffect } from 'react';
import { Plus, Percent } from 'lucide-react';
import { api } from '../../../lib/api';

interface TaxRule {
  id: string;
  name: string;
  rate: number;
  isExempt: boolean;
}

export default function TaxPage() {
  const [taxes, setTaxes] = useState<TaxRule[]>([]);
  const [loading, setLoading] = useState(true);

  const [newName, setNewName] = useState('');
  const [newRate, setNewRate] = useState(13);
  const [newExempt, setNewExempt] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchTaxes();
  }, []);

  async function fetchTaxes() {
    try {
      setLoading(true);
      const res = await api.get('/sales/taxes');
      // res is mapped array of Tax entities
      const mapped = res.map((t: any) => ({
        id: t.id,
        name: t.name,
        rate: Number(t.rate),
        isExempt: t.isExempt
      }));
      setTaxes(mapped);
    } catch (err: any) {
      alert('Failed to load tax categories: ' + err.message);
    } finally {
      setLoading(false);
    }
  }

  const handleAddTax = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName) return;

    try {
      setSubmitting(true);
      await api.post('/sales/taxes', {
        name: newName,
        rate: newExempt ? 0.00 : Number(newRate),
        isExempt: newExempt
      });

      setNewName('');
      setNewRate(13);
      setNewExempt(false);
      await fetchTaxes();
      alert('Tax category added successfully!');
    } catch (err: any) {
      alert('Failed to create tax category: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="text-center space-y-2">
          <div className="w-8 h-8 border-4 border-t-[#E86D1F] border-r-transparent border-slate-200 rounded-full animate-spin mx-auto" />
          <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Syncing Taxes...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-xl font-black text-[#111111] font-outfit uppercase">Tax Configurations</h1>
        <p className="text-xs text-slate-500 mt-1">Configure VAT brackets, custom sales tax, and compliance brackets</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Tax Rules list (col-span-2) */}
        <div className="lg:col-span-2 premium-card p-6 rounded-2xl bg-white space-y-4">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                  <th className="py-3 px-2">Tax Category Name</th>
                  <th className="py-3 px-2">Tax Rate</th>
                  <th className="py-3 px-2">Type</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {taxes.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="py-6 text-center text-xs text-slate-400 font-bold">
                      No tax brackets defined yet.
                    </td>
                  </tr>
                ) : (
                  taxes.map(t => (
                    <tr key={t.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-3.5 px-2 text-[#111111] font-bold">{t.name}</td>
                      <td className="py-3.5 px-2 text-[#E86D1F] font-extrabold font-mono">{t.rate.toFixed(2)}%</td>
                      <td className="py-3.5 px-2">
                        <span className={`inline-block text-[9px] font-extrabold px-1.5 py-0.5 rounded ${
                          t.isExempt 
                            ? 'bg-amber-50 text-amber-600 border border-amber-100' 
                            : 'bg-indigo-50 text-indigo-600 border border-indigo-100'
                        }`}>
                          {t.isExempt ? 'EXEMPT' : 'TAXABLE'}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Add Tax Rule Card */}
        <div className="premium-card p-6 rounded-2xl bg-white space-y-4">
          <div className="border-b border-slate-100 pb-3 flex items-center gap-1.5 text-slate-400">
            <Percent className="h-4 w-4 text-[#E86D1F]" />
            <h2 className="text-xs font-black uppercase tracking-wider text-[#111111]">Configure new tax</h2>
          </div>

          <form onSubmit={handleAddTax} className="space-y-3">
            <div className="space-y-1">
              <label className="text-[10px] text-slate-400 font-bold uppercase">Tax Class Name</label>
              <input 
                type="text" 
                placeholder="e.g. Service Charge 10%"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                className="w-full bg-[#F8F8F8] border border-slate-200/80 rounded-xl p-2.5 text-xs outline-none focus:border-[#E86D1F] text-[#111111]"
                required
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] text-slate-400 font-bold uppercase">Exempt from Tax</label>
              <div className="flex items-center gap-2 py-1">
                <input 
                  type="checkbox"
                  checked={newExempt}
                  onChange={(e) => setNewExempt(e.target.checked)}
                  className="rounded border-slate-300 text-[#E86D1F] focus:ring-[#E86D1F]"
                />
                <span className="text-xs text-slate-500 font-medium">Exempt class (Ex: 0.00% VAT)</span>
              </div>
            </div>

            {!newExempt && (
              <div className="space-y-1">
                <label className="text-[10px] text-slate-400 font-bold uppercase">Rate percentage (%)</label>
                <input 
                  type="number" 
                  value={newRate}
                  onChange={(e) => setNewRate(Number(e.target.value))}
                  className="w-full bg-[#F8F8F8] border border-slate-200/80 rounded-xl p-2.5 text-xs outline-none focus:border-[#E86D1F] text-[#111111]"
                  min="0.1"
                  max="100"
                  step="0.01"
                  required
                />
              </div>
            )}

            <button 
              type="submit" 
              disabled={submitting}
              className="w-full bg-slate-900 hover:bg-[#E86D1F] text-white text-xs font-bold p-3 rounded-xl transition-all"
            >
              {submitting ? 'Adding...' : 'Add Tax Class'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
