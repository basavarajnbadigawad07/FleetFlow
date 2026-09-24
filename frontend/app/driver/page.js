'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import apiFetch from '@/lib/api';

export default function DriverDashboard() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [shipments, setShipments] = useState([]);
  const [sharing, setSharing] = useState(false);
  const [lastLocation, setLastLocation] = useState(null);
  const [locationError, setLocationError] = useState('');

  useEffect(() => {
    if (!loading && (!user || user.role !== 'driver')) {
      router.push('/login');
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (user?.role === 'driver') {
      apiFetch('/shipments/mine').then(setShipments).catch(console.error);
    }
  }, [user]);

  async function updateStatus(shipmentId, status) {
    try {
      await apiFetch(`/shipments/${shipmentId}/status`, { method: 'PUT', body: JSON.stringify({ status }) });
      const updated = await apiFetch('/shipments/mine');
      setShipments(updated);
    } catch (err) {
      alert(err.message);
    }
  }

  function shareLocation() {
    if (!navigator.geolocation) {
      setLocationError('Geolocation not supported by this browser');
      return;
    }
    setSharing(true);
    setLocationError('');
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        try {
          await apiFetch('/drivers/location', { method: 'PUT', body: JSON.stringify({ lat: latitude, lng: longitude }) });
          setLastLocation({ lat: latitude, lng: longitude, at: new Date() });
        } catch (err) {
          setLocationError(err.message);
        } finally {
          setSharing(false);
        }
      },
      (err) => { setLocationError(err.message); setSharing(false); }
    );
  }

  if (loading || !user) return <div className="min-h-[80vh] flex items-center justify-center text-slate-400">Loading...</div>;

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold">My Deliveries</h1>
        <p className="text-slate-400 text-sm mt-1">Manage your assigned shipments</p>
      </div>

      <div className="ff-card p-6 mb-8">
        <button onClick={shareLocation} disabled={sharing} className="ff-btn-primary px-5 py-2.5 rounded-lg text-sm">
          📍 {sharing ? 'Sharing...' : 'Share My Location'}
        </button>
        {lastLocation && (
          <p className="text-xs text-slate-400 mt-3">
            Last shared: <span className="text-amber-400 font-mono">{lastLocation.lat.toFixed(4)}, {lastLocation.lng.toFixed(4)}</span> at {lastLocation.at.toLocaleTimeString()}
          </p>
        )}
        {locationError && <p className="text-xs text-red-400 mt-3">{locationError}</p>}
      </div>

      {shipments.length === 0 && (
        <div className="ff-card p-10 text-center text-slate-400">
          <p className="text-3xl mb-2">📭</p>
          <p>No active deliveries assigned.</p>
        </div>
      )}

      {shipments.map((s) => (
        <div key={s.id} className="ff-card p-6 mb-4">
          <div className="flex justify-between items-start mb-2">
            <p className="font-mono text-amber-400 font-semibold">{s.tracking_code}</p>
            <span className={`ff-badge ff-badge-${s.status}`}>{s.status}</span>
          </div>
          <p className="text-sm text-slate-400 mb-4">Customer: {s.customer_name}</p>
          <div className="flex gap-2">
            {s.status === 'assigned' && (
              <button onClick={() => updateStatus(s.id, 'in_transit')} className="ff-btn-primary px-4 py-2 rounded-lg text-sm">
                Start Delivery
              </button>
            )}
            {s.status === 'in_transit' && (
              <button onClick={() => updateStatus(s.id, 'delivered')} className="bg-green-600 hover:bg-green-500 transition-colors text-white px-4 py-2 rounded-lg text-sm font-semibold">
                Mark Delivered
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}