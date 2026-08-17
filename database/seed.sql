INSERT INTO users (id, username, email, password_hash, role)
VALUES 
    ('a0000000-0000-0000-0000-000000000001', 'chief_moderator', 'mod@neutralmap.org', '$2a$10$e8e...mockhash', 'moderator'),
    ('a0000000-0000-0000-0000-000000000002', 'osint_analyst_01', 'analyst@neutralmap.org', '$2a$10$e8e...mockhash', 'editor'),
    ('a0000000-0000-0000-0000-000000000003', 'admin', 'admin@neutralmap.org', '$2a$10$e8e...mockhash', 'admin')
ON CONFLICT (id) DO NOTHING;

INSERT INTO sources (id, url, archive_url, source_type, confidence, title, description, media_url, geolocation, author_id, created_at)
VALUES 
    (
        'b0000000-0000-0000-0000-000000000001',
        'https://t.me/osint_geoconfirm/14290',
        'https://web.archive.org/web/20260812102030/https://t.me/osint_geoconfirm/14290',
        'video',
        'confirmed_high',
        'Geolocated Drone Reconnaissance Video #1429',
        'Video footage confirming control over the northern heights near industrial zone. Coordinates verified with 3m precision.',
        'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=600&auto=format&fit=crop',
        ST_SetSRID(ST_MakePoint(37.998, 48.595), 4326),
        'a0000000-0000-0000-0000-000000000002',
        NOW() - INTERVAL '2 days'
    ),
    (
        'b0000000-0000-0000-0000-000000000002',
        'https://sentinel-hub.com/eo-browser/sample-2026',
        'https://archive.is/sample-sentinel-2026',
        'sat_imagery',
        'confirmed_high',
        'Sentinel-2 Multi-spectral Satellite Imagery',
        'Visible thermal signatures and fortified trench lines along the canal perimeter.',
        'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=600&auto=format&fit=crop',
        ST_SetSRID(ST_MakePoint(37.865, 48.421), 4326),
        'a0000000-0000-0000-0000-000000000001',
        NOW() - INTERVAL '1 day'
    ),
    (
        'b0000000-0000-0000-0000-000000000003',
        'https://twitter.com/analyst_mapper/status/18920192',
        NULL,
        'official_report',
        'medium',
        'Field Recon Report - Sector South',
        'Clashes reported around the railway junction, situation fluid and contested.',
        'https://images.unsplash.com/photo-1508873696983-2df570464756?w=600&auto=format&fit=crop',
        ST_SetSRID(ST_MakePoint(38.012, 48.520), 4326),
        'a0000000-0000-0000-0000-000000000002',
        NOW() - INTERVAL '6 hours'
    )
ON CONFLICT (id) DO NOTHING;

INSERT INTO territories (id, name, status, color_hex, geometry, last_source_id, created_at, updated_at)
VALUES
    (
        'c0000000-0000-0000-0000-000000000001',
        'Northern Sector - Stronghold Alpha',
        'side_a',
        '#3b82f6',
        ST_GeomFromText('POLYGON((37.92 48.62, 38.02 48.65, 38.06 48.58, 37.95 48.56, 37.92 48.62))', 4326),
        'b0000000-0000-0000-0000-000000000001',
        NOW() - INTERVAL '5 days',
        NOW() - INTERVAL '1 day'
    ),
    (
        'c0000000-0000-0000-0000-000000000002',
        'Eastern Approach & Industrial Hub',
        'side_b',
        '#ef4444',
        ST_GeomFromText('POLYGON((38.06 48.58, 38.15 48.60, 38.18 48.50, 38.05 48.48, 38.06 48.58))', 4326),
        'b0000000-0000-0000-0000-000000000002',
        NOW() - INTERVAL '5 days',
        NOW() - INTERVAL '12 hours'
    ),
    (
        'c0000000-0000-0000-0000-000000000003',
        'Central Contested Buffer Zone (Bakhmut Ridge)',
        'contested',
        '#eab308',
        ST_GeomFromText('POLYGON((37.95 48.56, 38.06 48.58, 38.05 48.48, 37.94 48.46, 37.95 48.56))', 4326),
        'b0000000-0000-0000-0000-000000000003',
        NOW() - INTERVAL '3 days',
        NOW() - INTERVAL '6 hours'
    ),
    (
        'c0000000-0000-0000-0000-000000000004',
        'Southern Forestry Perimeter',
        'unconfirmed',
        '#6b7280',
        ST_GeomFromText('POLYGON((37.94 48.46, 38.05 48.48, 38.02 48.38, 37.90 48.37, 37.94 48.46))', 4326),
        NULL,
        NOW() - INTERVAL '2 days',
        NOW()
    )
ON CONFLICT (id) DO NOTHING;

INSERT INTO territory_history (
    id, territory_id, change_type, old_geometry, new_geometry, diff_gain, diff_loss, 
    delta_area_sqkm, author_id, moderator_id, moderation_status, source_ids, valid_from, valid_to, notes
)
VALUES
    (
        'd0000000-0000-0000-0000-000000000001',
        'c0000000-0000-0000-0000-000000000002',
        'advance',
        ST_GeomFromText('POLYGON((38.08 48.58, 38.15 48.60, 38.18 48.50, 38.07 48.48, 38.08 48.58))', 4326),
        ST_GeomFromText('POLYGON((38.06 48.58, 38.15 48.60, 38.18 48.50, 38.05 48.48, 38.06 48.58))', 4326),
        ST_GeomFromText('POLYGON((38.06 48.58, 38.08 48.58, 38.07 48.48, 38.05 48.48, 38.06 48.58))', 4326),
        NULL,
        1.84,
        'a0000000-0000-0000-0000-000000000002',
        'a0000000-0000-0000-0000-000000000001',
        'approved',
        ARRAY['b0000000-0000-0000-0000-000000000001'::uuid, 'b0000000-0000-0000-0000-000000000002'::uuid],
        NOW() - INTERVAL '1 day',
        NULL,
        'Tactical advance confirmed via drone footage and satellite change detection.'
    )
ON CONFLICT (id) DO NOTHING;
