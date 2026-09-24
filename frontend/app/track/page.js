'use client';

import { useState } from 'react';

export default function TrackPage() {
  const [code, setCode] = useState('');
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setResult(null);
    try {
      const res = await fetch(`http://localhost:5002/api/shipments/track/${code}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Not found');
      setResult(data);
    } catch (err) {
      setError(err.message);
    }
  }

  const statusSteps = ['pending', 'assigned', 'in_transit', 'delivered'];

  return (
    <div className="max-w-xl mx-auto mt-12 px-4 pb-16">
      <div className="text-center mb-8">
        <span className="text-4xl">📦</span>
        <h1 className="text-3xl font-extrabold mt-3">Track Your Shipment</h1>
        <p className="text-slate-400 text-sm mt-1">Enter your tracking code to see live status</p>
      </div>

      <form onSubmit={handleSubmit} className="flex gap-2 mb-8">
        <input
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          placeholder="FF-XXXXXXXX"
          className="ff-input flex-1 px-4 py-2.5 font-mono"
          required
        />
        <button type="submit" className="ff-btn-primary px-6 py-2.5 rounded-lg">Track</button>
      </form>

      {error && (
        <p className="text-red-400 text-sm mb-4 bg-red-500/10 border border-red-500/30 rounded-lg px-3 py-2 text-center">
          {error}
        </p>
      )}

      {result && (
        <div className="ff-card p-7">
          <p className="text-xs uppercase tracking-wide text-slate-400 mb-1">Tracking Code</p>
          <p className="font-mono text-amber-400 font-bold text-lg mb-6">{result.shipment.tracking_code}</p>

          <div className="flex justify-between mb-8 relative">
            <div className="absolute top-[0.55rem] left-0 right-0 h-0.5 bg-slate-700 -z-0" />
            {statusSteps.map((step) => {
              const isActive = statusSteps.indexOf(result.shipment.status) >= statusSteps.indexOf(step);
              return (
                <div key={step} className="flex-1 text-center relative z-10">
                  <div className={`ff-step-dot mx-auto mb-2 ${isActive ? 'active' : 'inactive'}`} />
                  <p className="text-xs capitalize text-slate-300">{step.replace('_', ' ')}</p>
                </div>
              );
            })}
          </div>

          <div className="space-y-2 mb-6 text-sm">
            <p><span className="text-slate-400">From:</span> {result.shipment.origin_name || '—'}</p>
            <p><span className="text-slate-400">To:</span> {result.shipment.destination_name || result.shipment.destination_address || '—'}</p>
            <p><span className="text-slate-400">Customer:</span> {result.shipment.customer_name}</p>
          </div>

          <h3 className="font-bold mb-3 text-sm uppercase tracking-wide text-slate-400">History</h3>
          <ul className="text-sm space-y-2">
            {result.history.map((h, i) => (
              <li key={i} className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-1.5 flex-shrink-0" />
                <span>
                  <span className="capitalize font-medium text-slate-200">{h.status.replace('_', ' ')}</span>
                  {h.note && <span className="text-slate-400"> — {h.note}</span>}
                  <span className="text-slate-500"> ({new Date(h.created_at).toLocaleString()})</span>
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}