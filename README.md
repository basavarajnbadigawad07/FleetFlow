# 🚚 FleetFlow

A real-time logistics and fleet management platform for managing shipments, drivers, vehicles, warehouses, and deliveries — with live tracking connecting customers, drivers, and administrators.

## Features

- **Admin Dashboard** — create shipments, assign drivers & vehicles, monitor fleet stats, live-updating shipment table (Socket.IO)
- **Driver Dashboard** — view assigned deliveries, update delivery status, share live location
- **Public Tracking** — customers track shipments by code, no login required, full status history
- **Real-time Updates** — Socket.IO pushes shipment/location changes instantly to the admin dashboard
- **Redis Caching** — driver locations cached in Redis for fast reads, backed by Postgres for durability

## Tech Stack

**Frontend:** Next.js (App Router), Tailwind CSS, Socket.IO Client
**Backend:** Node.js, Express, PostgreSQL, Redis, Socket.IO
**Auth:** JWT with role-based access (Admin / Driver)

## Getting Started

### Backend
```bash
cd backend
npm install
cp .env.example .env   # fill in your local DB/Redis config
psql -d fleetflow -f schema.sql
npm run dev
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

Backend runs on `http://localhost:5002`, frontend on `http://localhost:3000`.

## Architecture

- **Shipments** move through a status lifecycle: `pending → assigned → in_transit → delivered`
- Every status change is logged to `delivery_updates`, powering both the admin history and public tracking page
- Driver location updates are cached in Redis and broadcast live via Socket.IO
