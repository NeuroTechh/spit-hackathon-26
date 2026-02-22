-- ═══════════════════════════════════════════════════════════
-- Seed Piston Cup Events
-- ═══════════════════════════════════════════════════════════
-- Creates a system organizer and seeds the 8 Piston Cup events
-- so the Piston Cup UI can match them by title.
-- ═══════════════════════════════════════════════════════════

-- Create a system organizer user for Piston Cup events
INSERT INTO users (id, display_name, role, is_active)
VALUES (
    'a0000000-0000-0000-0000-000000000001',
    'Piston Cup Organizer',
    'organizer',
    true
)
ON CONFLICT (id) DO NOTHING;

-- Seed events (skip if title already exists)
INSERT INTO events (organizer_id, title, description, event_date, location, status, min_age, requires_kyc, min_reputation_score, max_attendees)
SELECT * FROM (VALUES
    (
        'a0000000-0000-0000-0000-000000000001'::uuid,
        'Lightning McQueen Grand Prix',
        'Experience the thrill of the Piston Cup''s premier event. Watch Lightning McQueen defend his title against the fastest racers in the world. This championship round features a 500-lap endurance race with pit strategy that will keep you on the edge of your seat.',
        '2026-03-15 19:00:00-07'::timestamptz,
        'Radiator Springs, AZ',
        'active'::event_status,
        18,
        true,
        50,
        50000
    ),
    (
        'a0000000-0000-0000-0000-000000000001'::uuid,
        'Doc Hudson Memorial Classic',
        'A tribute to the legendary Hudson Hornet. This special heritage event brings together classic and modern racers for an unforgettable day of competition and remembrance.',
        '2026-04-02 15:00:00-04'::timestamptz,
        'Thomasville, GA',
        'active'::event_status,
        16,
        true,
        30,
        35000
    ),
    (
        'a0000000-0000-0000-0000-000000000001'::uuid,
        'Radiator Springs Night Race',
        'Race through the neon-lit streets of Radiator Springs as the desert sky transforms into a canvas of stars. One of the most visually stunning events on the Piston Cup calendar.',
        '2026-03-28 21:00:00-07'::timestamptz,
        'Radiator Springs, AZ',
        'active'::event_status,
        18,
        true,
        40,
        25000
    ),
    (
        'a0000000-0000-0000-0000-000000000001'::uuid,
        'Tokyo Drift Invitational',
        'The Piston Cup goes international with this exclusive drift-focused street race through downtown Tokyo. Watch the world''s best navigate tight corners and narrow streets.',
        '2026-04-18 20:00:00+09'::timestamptz,
        'Tokyo, Japan',
        'active'::event_status,
        18,
        true,
        60,
        30000
    ),
    (
        'a0000000-0000-0000-0000-000000000001'::uuid,
        'Dinoco 400',
        'The season finale. The Dinoco 400 determines the Piston Cup champion. With the most prestigious sponsorship deal in racing on the line, every driver will give everything they have.',
        '2026-05-05 16:00:00-07'::timestamptz,
        'Los Angeles, CA',
        'active'::event_status,
        18,
        true,
        70,
        80000
    ),
    (
        'a0000000-0000-0000-0000-000000000001'::uuid,
        'Rust-eze Rumble',
        'Everyone starts somewhere. The Rust-eze Rumble celebrates the spirit of grassroots racing with amateur and semi-pro drivers competing for their shot at the big leagues.',
        '2026-03-22 14:00:00-05'::timestamptz,
        'Carburetor County, OK',
        'active'::event_status,
        16,
        false,
        10,
        15000
    ),
    (
        'a0000000-0000-0000-0000-000000000001'::uuid,
        'Willy''s Butte Sprint',
        'Train like Lightning. The iconic dirt track where McQueen discovered the art of turning right to go left. This sprint race tests raw skill over technology in a stunning desert canyon setting.',
        '2026-04-10 17:00:00-07'::timestamptz,
        'Radiator Springs, AZ',
        'active'::event_status,
        18,
        true,
        35,
        10000
    ),
    (
        'a0000000-0000-0000-0000-000000000001'::uuid,
        'Porto Corsa Grand Circuit',
        'The Piston Cup heads to the Italian Riviera for this prestigious international round. Winding coastal roads, Mediterranean atmosphere, and world-class racing combine for an event that defines luxury motorsport.',
        '2026-05-20 18:00:00+02'::timestamptz,
        'Porto Corsa, Italy',
        'active'::event_status,
        18,
        true,
        80,
        45000
    )
) AS v(organizer_id, title, description, event_date, location, status, min_age, requires_kyc, min_reputation_score, max_attendees)
WHERE NOT EXISTS (
    SELECT 1 FROM events e WHERE e.title = v.title
);
