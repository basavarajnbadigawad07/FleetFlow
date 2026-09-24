'use client';

import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';

export default function Navbar() {
  const { user, logout } = useAuth();

  return (
    <nav className="ff-navbar px-6 py-4 flex justify-between items-center sticky top-0 z-40">
      <Link href="/" className="font-extrabold text-xl flex items-center gap-2 tracking-tight">
        <span className="text-2xl">🚚</span>
        <span>Fleet<span className="text-amber-400">Flow</span></span>
      </Link>
      <div className="flex items-center gap-6 text-sm font-medium">
        <Link href="/track" className="text-slate-300 hover:text-amber-400 transition-colors">Track Shipment</Link>
        {user?.role === 'admin' && (
          <Link href="/admin" className="text-slate-300 hover:text-amber-400 transition-colors">Dashboard</Link>
        )}
        {user?.role === 'driver' && (
          <Link href="/driver" className="text-slate-300 hover:text-amber-400 transition-colors">My Deliveries</Link>
        )}
        {user ? (
          <button onClick={logout} className="ff-btn-secondary px-4 py-1.5 rounded-lg text-xs">
            Log out
          </button>
        ) : (
          <Link href="/login" className="ff-btn-primary px-4 py-1.5 rounded-lg text-xs">
            Log in
          </Link>
        )}
      </div>
    </nav>
  );
}