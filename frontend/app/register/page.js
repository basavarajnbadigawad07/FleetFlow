'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import apiFetch from '@/lib/api';
import { useAuth } from '@/context/AuthContext';

export default function RegisterPage() {
  const [form, setForm] = useState({ name: '', email: '', password: '', phone: '', role: 'admin' });
  const [error, setError] = useState('');
  const router = useRouter();
  const { login } = useAuth();

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    try {
      const data = await apiFetch('/auth/register', {
        method: 'POST',
        body: JSON.stringify(form),
      });
      login(data.user, data.token);
      router.push(data.user.role === 'admin' ? '/admin' : '/driver');
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-10">
      <div className="ff-card w-full max-w-md p-8">
        <div className="text-center mb-8">
          <span className="text-4xl">📦</span>
          <h1 className="text-2xl font-bold mt-3">Create your account</h1>
          <p className="text-slate-400 text-sm mt-1">Join FleetFlow</p>
        </div>
        {error && (
          <p className="text-red-400 text-sm mb-4 bg-red-500/10 border border-red-500/30 rounded-lg px-3 py-2">
            {error}
          </p>
        )}
        <form onSubmit={handleSubmit} className="space-y-4">
          <input name="name" placeholder="Full name" value={form.name} onChange={handleChange} className="ff-input w-full px-4 py-2.5" required />
          <input name="email" type="email" placeholder="Email" value={form.email} onChange={handleChange} className="ff-input w-full px-4 py-2.5" required />
          <input name="password" type="password" placeholder="Password" value={form.password} onChange={handleChange} className="ff-input w-full px-4 py-2.5" required />
          <input name="phone" placeholder="Phone (optional)" value={form.phone} onChange={handleChange} className="ff-input w-full px-4 py-2.5" />
          <select name="role" value={form.role} onChange={handleChange} className="ff-input w-full px-4 py-2.5">
            <option value="admin">Admin</option>
            <option value="driver">Driver</option>
          </select>
          <button type="submit" className="ff-btn-primary w-full py-2.5 rounded-lg">
            Register
          </button>
        </form>
        <p className="mt-6 text-sm text-center text-slate-400">
          Already have an account?{' '}
          <a href="/login" className="text-amber-400 hover:underline">Log in</a>
        </p>
      </div>
    </div>
  );
}