CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  role VARCHAR(20) NOT NULL CHECK (role IN ('admin', 'driver')),
  phone VARCHAR(20),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE vehicles (
  id SERIAL PRIMARY KEY,
  plate_number VARCHAR(20) UNIQUE NOT NULL,
  type VARCHAR(50) NOT NULL,
  capacity_kg NUMERIC(10,2),
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'maintenance', 'idle')),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE drivers (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  vehicle_id INTEGER REFERENCES vehicles(id) ON DELETE SET NULL,
  license_number VARCHAR(50),
  availability VARCHAR(20) DEFAULT 'available' CHECK (availability IN ('available', 'on_delivery', 'off_duty')),
  current_lat NUMERIC(9,6),
  current_lng NUMERIC(9,6),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE warehouses (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  address TEXT NOT NULL,
  lat NUMERIC(9,6),
  lng NUMERIC(9,6),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE shipments (
  id SERIAL PRIMARY KEY,
  tracking_code VARCHAR(20) UNIQUE NOT NULL,
  origin_warehouse_id INTEGER REFERENCES warehouses(id),
  destination_warehouse_id INTEGER REFERENCES warehouses(id),
  destination_address TEXT,
  customer_name VARCHAR(100),
  customer_phone VARCHAR(20),
  driver_id INTEGER REFERENCES drivers(id) ON DELETE SET NULL,
  vehicle_id INTEGER REFERENCES vehicles(id) ON DELETE SET NULL,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'assigned', 'in_transit', 'delivered', 'cancelled')),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE delivery_updates (
  id SERIAL PRIMARY KEY,
  shipment_id INTEGER REFERENCES shipments(id) ON DELETE CASCADE,
  status VARCHAR(20) NOT NULL,
  lat NUMERIC(9,6),
  lng NUMERIC(9,6),
  note TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);