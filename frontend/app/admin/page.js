'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { io } from 'socket.io-client';
import { useAuth } from '@/context/AuthContext';
import apiFetch from '@/lib/api';

export default function AdminDashboard() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [shipments, setShipments] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [warehouses, setWarehouses] = useState([]);

  const [form, setForm] = useState({
    origin_warehouse_id: '', destination_warehouse_id: '',
    customer_name: '', customer_phone: '', destination_address: ''
  });

  const [assigning, setAssigning] = useState(null);
  const [assignForm, setAssignForm] = useState({ driver_id: '', vehicle_id: '' });

  useEffect(() => {
    if (!loading && (!user || user.role !== 'admin')) {
      router.push('/login');
    }
  }, [user, loading, router]);

  async function loadAll() {
    const [s, v, d, w] = await Promise.all([
      apiFetch('/shipments'),
      apiFetch('/vehicles'),
      apiFetch('/drivers'),
      apiFetch('/warehouses'),
    ]);
    setShipments(s); setVehicles(v); setDrivers(d); setWarehouses(w);
  }

  useEffect(() => {
    if (user?.role === 'admin') loadAll().catch(console.error);
  }, [user]);

  useEffect(() => {
    if (user?.role !== 'admin') return;
    const socket = io('http://localhost:5002');
    socket.on('shipment_updated', () => loadAll().catch(console.error));
    socket.on('driver_location_update', () => loadAll().catch(console.error));
    return () => socket.disconnect();
  }, [user]);

  function handleFormChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function handleCreateShipment(e) {
    e.preventDefault();
    try {
      await apiFetch('/shipments', { method: 'POST', body: JSON.stringify(form) });
      setForm({ origin_warehouse_id: '', destination_warehouse_id: '', customer_name: '', customer_phone: '', destination_address: '' });
      await loadAll();
    } catch (err) {
      alert(err.message);
    }
  }

  function openAssign(shipmentId) {
    setAssigning(shipmentId);
    setAssignForm({ driver_id: '', vehicle_id: '' });
  }

  async function handleAssign(e) {
    e.preventDefault();
    try {
      await apiFetch(`/shipments/${assigning}/assign`, { method: 'PUT', body: JSON.stringify(assignForm) });
      setAssigning(null);
      await loadAll();
    } catch (err) {
      alert(err.message);
    }
  }

  if (loading || !user) return <div className="min-h-[80vh] flex items-center justify-center text-slate-400">Loading...</div>;

  const availableDrivers = drivers.filter((d) => d.availability === 'available');

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold">Admin Dashboard</h1>
        <p className="text-slate-400 text-sm mt-1">Manage your fleet, drivers, and shipments</p>
      </div>

      <div className="grid grid-cols-3 gap-5 mb-10">
        <div className="ff-stat-card">
          <p className="text-xs uppercase tracking-wide text-slate-400 mb-1">Total Shipments</p>
          <p className="text-3xl font-extrabold text-white">{shipments.length}</p>
        </div>
        <div className="ff-stat-card">
          <p className="text-xs uppercase tracking-wide text-slate-400 mb-1">Vehicles</p>
          <p className="text-3xl font-extrabold text-white">{vehicles.length}</p>
        </div>
        <div className="ff-stat-card">
          <p className="text-xs uppercase tracking-wide text-slate-400 mb-1">Drivers</p>
          <p className="text-3xl font-extrabold text-white">{drivers.length}</p>
        </div>
      </div>

      <div className="ff-card p-6 mb-10">
        <h2 className="text-lg font-bold mb-4 flex items-center gap-2">📦 Create Shipment</h2>
        <form onSubmit={handleCreateShipment} className="grid grid-cols-2 gap-3">
          <select name="origin_warehouse_id" value={form.origin_warehouse_id} onChange={handleFormChange} className="ff-input px-4 py-2.5" required>
            <option value="">Origin warehouse</option>
            {warehouses.map((w) => <option key={w.id} value={w.id}>{w.name}</option>)}
          </select>
          <select name="destination_warehouse_id" value={form.destination_warehouse_id} onChange={handleFormChange} className="ff-input px-4 py-2.5">
            <option value="">Destination warehouse (optional)</option>
            {warehouses.map((w) => <option key={w.id} value={w.id}>{w.name}</option>)}
          </select>
          <input name="customer_name" placeholder="Customer name" value={form.customer_name} onChange={handleFormChange} className="ff-input px-4 py-2.5" required />
          <input name="customer_phone" placeholder="Customer phone" value={form.customer_phone} onChange={handleFormChange} className="ff-input px-4 py-2.5" />
          <input name="destination_address" placeholder="Destination address (if no warehouse)" value={form.destination_address} onChange={handleFormChange} className="ff-input px-4 py-2.5 col-span-2" />
          <button type="submit" className="ff-btn-primary py-2.5 rounded-lg col-span-2">Create Shipment</button>
        </form>
      </div>

      <div className="ff-card p-6">
        <h2 className="text-lg font-bold mb-4 flex items-center gap-2">🚚 Shipments</h2>
        <table className="w-full ff-table text-left text-sm">
          <thead>
            <tr>
              <th>Tracking Code</th>
              <th>Customer</th>
              <th>Status</th>
              <th>Driver</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {shipments.map((s) => (
              <tr key={s.id}>
                <td className="font-mono text-amber-400">{s.tracking_code}</td>
                <td>{s.customer_name}</td>
                <td><span className={`ff-badge ff-badge-${s.status}`}>{s.status}</span></td>
                <td>{s.driver_name || '—'}</td>
                <td>
                  {s.status === 'pending' && (
                    <button onClick={() => openAssign(s.id)} className="text-amber-400 hover:underline text-xs font-semibold">
                      Assign →
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {assigning && (
        <div className="fixed inset-0 ff-modal-backdrop flex items-center justify-center z-50">
          <form onSubmit={handleAssign} className="ff-card p-7 w-96 space-y-4">
            <h3 className="text-lg font-bold">Assign Shipment</h3>
            <select
              value={assignForm.driver_id}
              onChange={(e) => setAssignForm({ ...assignForm, driver_id: e.target.value })}
              className="ff-input w-full px-4 py-2.5" required
            >
              <option value="">Select driver</option>
              {availableDrivers.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select>
            <select
              value={assignForm.vehicle_id}
              onChange={(e) => setAssignForm({ ...assignForm, vehicle_id: e.target.value })}
              className="ff-input w-full px-4 py-2.5" required
            >
              <option value="">Select vehicle</option>
              {vehicles.map((v) => <option key={v.id} value={v.id}>{v.plate_number} ({v.type})</option>)}
            </select>
            <div className="flex gap-3 pt-2">
              <button type="submit" className="ff-btn-primary px-5 py-2 rounded-lg flex-1">Assign</button>
              <button type="button" onClick={() => setAssigning(null)} className="ff-btn-secondary px-5 py-2 rounded-lg">Cancel</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}