CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis";

CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username VARCHAR(100) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'viewer',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS sources (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    url TEXT NOT NULL,
    archive_url TEXT,
    source_type VARCHAR(50) NOT NULL,
    confidence VARCHAR(30) NOT NULL DEFAULT 'medium',
    title TEXT NOT NULL,
    description TEXT,
    media_url TEXT,
    geolocation GEOMETRY(Point, 4326),
    author_id UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_sources_geom ON sources USING GIST(geolocation);

CREATE TABLE IF NOT EXISTS territories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    status VARCHAR(50) NOT NULL,
    color_hex VARCHAR(20) DEFAULT '#3b82f6',
    geometry GEOMETRY(Geometry, 4326) NOT NULL,
    area_sqkm DOUBLE PRECISION GENERATED ALWAYS AS (ST_Area(geometry::geography) / 1000000.0) STORED,
    last_source_id UUID REFERENCES sources(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_territories_geom ON territories USING GIST(geometry);
CREATE INDEX IF NOT EXISTS idx_territories_status ON territories(status);

CREATE TABLE IF NOT EXISTS territory_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    territory_id UUID REFERENCES territories(id) ON DELETE CASCADE,
    change_type VARCHAR(50) NOT NULL,
    old_geometry GEOMETRY(Geometry, 4326),
    new_geometry GEOMETRY(Geometry, 4326) NOT NULL,
    diff_gain GEOMETRY(Geometry, 4326),
    diff_loss GEOMETRY(Geometry, 4326),
    delta_area_sqkm DOUBLE PRECISION DEFAULT 0.0,
    author_id UUID REFERENCES users(id) ON DELETE SET NULL,
    moderator_id UUID REFERENCES users(id) ON DELETE SET NULL,
    moderation_status VARCHAR(30) DEFAULT 'approved',
    source_ids UUID[] DEFAULT '{}',
    valid_from TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    valid_to TIMESTAMP WITH TIME ZONE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_history_geom ON territory_history USING GIST(new_geometry);
CREATE INDEX IF NOT EXISTS idx_history_diff_gain ON territory_history USING GIST(diff_gain);
CREATE INDEX IF NOT EXISTS idx_history_diff_loss ON territory_history USING GIST(diff_loss);
CREATE INDEX IF NOT EXISTS idx_history_validity ON territory_history(valid_from, valid_to);
CREATE INDEX IF NOT EXISTS idx_history_territory ON territory_history(territory_id);

CREATE TABLE IF NOT EXISTS sync_feeds (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    kml_url TEXT NOT NULL,
    poll_interval_seconds INT DEFAULT 300,
    last_synced_at TIMESTAMP WITH TIME ZONE,
    last_etag VARCHAR(255),
    status VARCHAR(50) DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS sync_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    feed_id UUID REFERENCES sync_feeds(id) ON DELETE CASCADE,
    polygons_detected INT DEFAULT 0,
    changes_detected INT DEFAULT 0,
    status VARCHAR(50) NOT NULL,
    log_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE OR REPLACE FUNCTION calculate_territory_diff(
    old_geom GEOMETRY,
    new_geom GEOMETRY
) RETURNS TABLE (
    gain GEOMETRY,
    loss GEOMETRY,
    delta_sqkm DOUBLE PRECISION
) AS $$
BEGIN
    IF old_geom IS NULL THEN
        RETURN QUERY SELECT 
            new_geom, 
            NULL::GEOMETRY, 
            ST_Area(new_geom::geography) / 1000000.0;
    ELSE
        RETURN QUERY SELECT
            ST_Difference(new_geom, old_geom),
            ST_Difference(old_geom, new_geom),
            (ST_Area(new_geom::geography) - ST_Area(old_geom::geography)) / 1000000.0;
    END IF;
END;
$$ LANGUAGE plpgsql;
