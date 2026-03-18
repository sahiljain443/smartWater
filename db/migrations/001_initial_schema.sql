-- ============================================
-- Smart WaterVerse — Initial Database Schema
-- ============================================

-- Users & Auth
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(100) NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('super_admin', 'site_manager', 'technician', 'society_admin', 'resident')),
    is_active BOOLEAN DEFAULT true,
    telegram_chat_id VARCHAR(50),
    fcm_token TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Invites
CREATE TABLE invites (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) NOT NULL,
    name VARCHAR(100) NOT NULL,
    role VARCHAR(20) NOT NULL,
    site_id UUID NOT NULL,
    token VARCHAR(255) UNIQUE NOT NULL,
    invited_by UUID NOT NULL REFERENCES users(id),
    accepted_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Sites (STP plants)
CREATE TABLE sites (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(200) NOT NULL,
    address TEXT NOT NULL,
    latitude DOUBLE PRECISION NOT NULL,
    longitude DOUBLE PRECISION NOT NULL,
    capacity_kld NUMERIC(10,2) NOT NULL,
    technology_type VARCHAR(100) NOT NULL,
    society_name VARCHAR(200) NOT NULL,
    health_status VARCHAR(10) DEFAULT 'offline' CHECK (health_status IN ('green', 'amber', 'red', 'offline')),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- User-Site mapping (many-to-many)
CREATE TABLE user_sites (
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    site_id UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
    PRIMARY KEY (user_id, site_id)
);

-- Assets (equipment)
CREATE TABLE assets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    site_id UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
    name VARCHAR(200) NOT NULL,
    category VARCHAR(20) NOT NULL CHECK (category IN ('pump', 'blower', 'membrane', 'filter', 'motor', 'valve', 'sensor', 'panel', 'other')),
    make VARCHAR(100),
    model VARCHAR(100),
    serial_number VARCHAR(100),
    process_stage VARCHAR(100),
    status VARCHAR(20) DEFAULT 'operational' CHECK (status IN ('operational', 'maintenance', 'faulty', 'decommissioned')),
    install_date DATE,
    warranty_expiry DATE,
    parent_asset_id UUID REFERENCES assets(id),
    qr_code VARCHAR(255),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_assets_site ON assets(site_id);

-- Sensor configurations
CREATE TABLE sensor_configs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    site_id UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
    sensor_id VARCHAR(100) NOT NULL,
    type VARCHAR(30) NOT NULL,
    name VARCHAR(200) NOT NULL,
    unit VARCHAR(20) NOT NULL,
    min_threshold NUMERIC(12,4),
    max_threshold NUMERIC(12,4),
    process_stage VARCHAR(100),
    asset_id UUID REFERENCES assets(id),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(site_id, sensor_id)
);

-- Sensor readings (TimescaleDB hypertable)
CREATE TABLE sensor_readings (
    time TIMESTAMPTZ NOT NULL,
    site_id UUID NOT NULL,
    sensor_id VARCHAR(100) NOT NULL,
    sensor_type VARCHAR(30) NOT NULL,
    value DOUBLE PRECISION NOT NULL,
    unit VARCHAR(20) NOT NULL,
    quality VARCHAR(10) DEFAULT 'good'
);

SELECT create_hypertable('sensor_readings', 'time');

CREATE INDEX idx_readings_site_sensor ON sensor_readings(site_id, sensor_id, time DESC);

-- Continuous aggregate: hourly rollups
CREATE MATERIALIZED VIEW sensor_readings_hourly
WITH (timescaledb.continuous) AS
SELECT
    time_bucket('1 hour', time) AS bucket,
    site_id,
    sensor_id,
    sensor_type,
    AVG(value) AS avg_value,
    MIN(value) AS min_value,
    MAX(value) AS max_value,
    COUNT(*) AS reading_count
FROM sensor_readings
GROUP BY bucket, site_id, sensor_id, sensor_type
WITH NO DATA;

SELECT add_continuous_aggregate_policy('sensor_readings_hourly',
    start_offset => INTERVAL '3 hours',
    end_offset => INTERVAL '1 hour',
    schedule_interval => INTERVAL '1 hour');

-- Continuous aggregate: daily rollups
CREATE MATERIALIZED VIEW sensor_readings_daily
WITH (timescaledb.continuous) AS
SELECT
    time_bucket('1 day', time) AS bucket,
    site_id,
    sensor_id,
    sensor_type,
    AVG(value) AS avg_value,
    MIN(value) AS min_value,
    MAX(value) AS max_value,
    COUNT(*) AS reading_count
FROM sensor_readings
GROUP BY bucket, site_id, sensor_id, sensor_type
WITH NO DATA;

SELECT add_continuous_aggregate_policy('sensor_readings_daily',
    start_offset => INTERVAL '3 days',
    end_offset => INTERVAL '1 day',
    schedule_interval => INTERVAL '1 day');

-- Alerts
CREATE TABLE alerts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    site_id UUID NOT NULL REFERENCES sites(id),
    sensor_id VARCHAR(100),
    sensor_type VARCHAR(30),
    alert_type VARCHAR(30) NOT NULL CHECK (alert_type IN ('threshold_high', 'threshold_low', 'anomaly', 'offline', 'rule_triggered')),
    value DOUBLE PRECISION,
    threshold DOUBLE PRECISION,
    message TEXT NOT NULL,
    severity VARCHAR(10) NOT NULL CHECK (severity IN ('critical', 'warning', 'info')),
    acknowledged_at TIMESTAMPTZ,
    acknowledged_by UUID REFERENCES users(id),
    resolved_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_alerts_site_time ON alerts(site_id, created_at DESC);

-- Work orders
CREATE TABLE work_orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    site_id UUID NOT NULL REFERENCES sites(id),
    title VARCHAR(300) NOT NULL,
    description TEXT,
    priority VARCHAR(10) NOT NULL CHECK (priority IN ('critical', 'high', 'medium', 'low')),
    status VARCHAR(15) DEFAULT 'open' CHECK (status IN ('open', 'assigned', 'in_progress', 'completed', 'verified')),
    asset_id UUID REFERENCES assets(id),
    alert_id UUID REFERENCES alerts(id),
    assigned_to UUID REFERENCES users(id),
    created_by UUID NOT NULL REFERENCES users(id),
    due_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    verified_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_work_orders_site ON work_orders(site_id, status);
CREATE INDEX idx_work_orders_assigned ON work_orders(assigned_to, status);

-- Digital logbook
CREATE TABLE logbook_entries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    site_id UUID NOT NULL REFERENCES sites(id),
    author_id UUID NOT NULL REFERENCES users(id),
    content TEXT NOT NULL,
    shift_type VARCHAR(10) NOT NULL CHECK (shift_type IN ('morning', 'afternoon', 'night')),
    attachments TEXT[], -- S3 URLs
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_logbook_site_time ON logbook_entries(site_id, created_at DESC);

-- Compliance parameters
CREATE TABLE compliance_parameters (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    sensor_type VARCHAR(30) NOT NULL,
    min_value NUMERIC(12,4),
    max_value NUMERIC(12,4),
    unit VARCHAR(20) NOT NULL,
    regulation VARCHAR(100) NOT NULL, -- e.g., 'CPCB_2017'
    is_active BOOLEAN DEFAULT true
);

-- Notification log
CREATE TABLE notification_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    channel VARCHAR(20) NOT NULL CHECK (channel IN ('telegram', 'email', 'push')),
    recipient_id UUID REFERENCES users(id),
    title VARCHAR(300),
    body TEXT,
    status VARCHAR(10) DEFAULT 'pending' CHECK (status IN ('sent', 'failed', 'pending')),
    error TEXT,
    sent_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Data retention: auto-drop raw readings older than 90 days (keep rollups)
SELECT add_retention_policy('sensor_readings', INTERVAL '90 days');

-- Updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_sites_updated_at BEFORE UPDATE ON sites FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_assets_updated_at BEFORE UPDATE ON assets FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_work_orders_updated_at BEFORE UPDATE ON work_orders FOR EACH ROW EXECUTE FUNCTION update_updated_at();
