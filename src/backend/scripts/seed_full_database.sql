-- RentaTool LK - Comprehensive PostgreSQL Seed Script
-- Populates Users, Roles, Trust Ledger, Categories, Equipment, Bookings, KYC Records, Escrow Holds, and Damage Claims

BEGIN;

-- 1. USERS & PASSWORDS (PBKDF2 hash compatible with PasswordHasher)
-- Password for all seed users is 'Password@123'
DO $$
DECLARE
    pwd_hash text := 'JZD4TpMjL0UtrX+jG4NVnQ==.og7c86x4PD/DeD4T6eVBhuCiMBER8EgWPMUmAMrjw/A=';
BEGIN

    -- Duminda Bandara (Verified Renter)
    INSERT INTO users (id, name, email, password_hash, role, phone_number, is_verified, is_active, suspension_reason, created_at_utc, is_deleted)
    VALUES ('11111111-1111-1111-1111-111111111101', 'Duminda Bandara', 'duminda@rentatool.lk', pwd_hash, 'Renter', '0774210992', true, true, NULL, NOW() - INTERVAL '60 days', false)
    ON CONFLICT (email) DO UPDATE SET is_active = true, is_verified = true;

    -- Chaminda Perera (Verified Owner)
    INSERT INTO users (id, name, email, password_hash, role, phone_number, is_verified, is_active, suspension_reason, created_at_utc, is_deleted)
    VALUES ('11111111-1111-1111-1111-111111111102', 'Chaminda Perera', 'chaminda@rentatool.lk', pwd_hash, 'Owner', '0771280912', true, true, NULL, NOW() - INTERVAL '90 days', false)
    ON CONFLICT (email) DO UPDATE SET is_active = true, is_verified = true;

    -- K.G. Nimal Jayasinghe (Unverified Renter - Pending KYC)
    INSERT INTO users (id, name, email, password_hash, role, phone_number, is_verified, is_active, suspension_reason, created_at_utc, is_deleted)
    VALUES ('11111111-1111-1111-1111-111111111103', 'K.G. Nimal Jayasinghe', 'nimal.jay@gmail.com', pwd_hash, 'Renter', '0770450811', false, true, NULL, NOW() - INTERVAL '15 days', false)
    ON CONFLICT (email) DO UPDATE SET is_active = true, is_verified = false;

    -- Tharindu Wijesinghe (Suspended Owner)
    INSERT INTO users (id, name, email, password_hash, role, phone_number, is_verified, is_active, suspension_reason, created_at_utc, is_deleted)
    VALUES ('11111111-1111-1111-1111-111111111104', 'Tharindu Wijesinghe', 'tharindu.w@agriheavy.lk', pwd_hash, 'Owner', '0775223019', false, false, 'Multiple unresolved damage disputes and KYC forgery flags', NOW() - INTERVAL '120 days', false)
    ON CONFLICT (email) DO UPDATE SET is_active = false, suspension_reason = 'Multiple unresolved damage disputes and KYC forgery flags';

    -- Kasun Kalhara (Renter)
    INSERT INTO users (id, name, email, password_hash, role, phone_number, is_verified, is_active, suspension_reason, created_at_utc, is_deleted)
    VALUES ('11111111-1111-1111-1111-111111111105', 'Kasun Kalhara', 'kasun.civil@gmail.com', pwd_hash, 'Renter', '0776829104', true, true, NULL, NOW() - INTERVAL '30 days', false)
    ON CONFLICT (email) DO UPDATE SET is_active = true, is_verified = true;

    -- Saman Dissanayake (Owner)
    INSERT INTO users (id, name, email, password_hash, role, phone_number, is_verified, is_active, suspension_reason, created_at_utc, is_deleted)
    VALUES ('11111111-1111-1111-1111-111111111106', 'Saman Dissanayake', 'saman.generators@sltnet.lk', pwd_hash, 'Owner', '0779920194', true, true, NULL, NOW() - INTERVAL '75 days', false)
    ON CONFLICT (email) DO UPDATE SET is_active = true, is_verified = true;

END $$;

-- 2. USER ROLE ASSIGNMENTS
INSERT INTO user_roles (id, user_id, role, created_at_utc, is_deleted)
SELECT gen_random_uuid(), u.id, u.role, NOW(), false
FROM users u
WHERE NOT EXISTS (SELECT 1 FROM user_roles ur WHERE ur.user_id = u.id AND ur.role = u.role);

-- 3. TRUST LEDGER SCORES
INSERT INTO trust_ledger (id, user_id, score_delta, reason, transaction_reference, running_trust_score, created_at_utc, is_deleted)
VALUES
    (gen_random_uuid(), '11111111-1111-1111-1111-111111111101', 38, 'Successful rentals without damages & verified NIC', 'registration-kyc', 88, NOW() - INTERVAL '30 days', false),
    (gen_random_uuid(), '11111111-1111-1111-1111-111111111102', 44, 'Top-tier plant partner with 0 safety infractions', 'fleet-performance', 94, NOW() - INTERVAL '40 days', false),
    (gen_random_uuid(), '11111111-1111-1111-1111-111111111103', 12, 'New account, pending NIC verification inspection', 'initial-audit', 62, NOW() - INTERVAL '15 days', false),
    (gen_random_uuid(), '11111111-1111-1111-1111-111111111104', -15, 'Penalized for fraudulent document submission', 'dispute-penalty', 35, NOW() - INTERVAL '10 days', false),
    (gen_random_uuid(), '11111111-1111-1111-1111-111111111105', 28, 'Good return timeliness rating', 'booking-audit', 78, NOW() - INTERVAL '20 days', false),
    (gen_random_uuid(), '11111111-1111-1111-1111-111111111106', 41, 'Certified silent generator fleet operator', 'owner-compliance', 91, NOW() - INTERVAL '35 days', false)
ON CONFLICT DO NOTHING;

-- 4. EQUIPMENT FLEET (Catalog & 60-day wear compliance)
INSERT INTO equipment (id, owner_id, title, description, category_id, daily_rate, replacement_value, status, location, specifications_json, total_rental_days_accumulated, requires_maintenance_check, last_maintenance_date_utc, created_at_utc, is_deleted)
VALUES
    ('22222222-2222-2222-2222-222222222201', '11111111-1111-1111-1111-111111111102', 'Caterpillar 320D Hydraulic Excavator', 'Heavy-duty 20-ton crawler excavator equipped with heavy hydraulic rock breaker and digging bucket.', '352ea07e-bd97-481b-a287-027036658902', 32000.00, 18000000.00, 'Available', 'Colombo 05', '{"weight": "21.5 tons", "engine": "Cat C6.4 Acert", "fuel": "Diesel"}'::jsonb, 24, false, NOW() - INTERVAL '20 days', NOW() - INTERVAL '60 days', false),

    ('22222222-2222-2222-2222-222222222202', '11111111-1111-1111-1111-111111111102', 'Bomag BW 120 AD Tandem Vibratory Roller', 'Dual drum asphalt and sub-base compaction roller for highway and paving contractors.', '352ea07e-bd97-481b-a287-027036658902', 14500.00, 8500000.00, 'Available', 'Gampaha', '{"operating_weight": "2.7 tons", "drum_width": "1200mm"}'::jsonb, 42, false, NOW() - INTERVAL '15 days', NOW() - INTERVAL '50 days', false),

    ('22222222-2222-2222-2222-222222222203', '11111111-1111-1111-1111-111111111106', 'Denyo DCA-25USI 20kVA Ultra-Silent Generator', 'Three-phase soundproof diesel generator with automatic voltage regulation for site power.', '62886944-85b4-4d2f-a700-382319ab2ddf', 8500.00, 3200000.00, 'Available', 'Kandy', '{"prime_output": "20 kVA", "sound_level": "58 dB(A)@7m"}'::jsonb, 15, false, NOW() - INTERVAL '10 days', NOW() - INTERVAL '40 days', false),

    ('22222222-2222-2222-2222-222222222204', '990d754f-9e7a-4a54-92f7-d27d141c5ba5', 'Hilti TE 3000-AVR Heavy Demolition Breaker', 'High-performance concrete breaking tool with active vibration reduction and brushless motor.', '6550f572-d602-4ec8-88e5-d3183a807787', 5500.00, 1200000.00, 'Available', 'Negombo', '{"impact_energy": "68 Joules", "weight": "29.9 kg"}'::jsonb, 18, false, NOW() - INTERVAL '5 days', NOW() - INTERVAL '30 days', false),

    ('22222222-2222-2222-2222-222222222205', '11111111-1111-1111-1111-111111111104', 'Komatsu PC200-8 Crawler Excavator', 'Large hydraulic excavator flagged for mandatory overhaul inspection after reaching threshold.', '352ea07e-bd97-481b-a287-027036658902', 38000.00, 22000000.00, 'UnderMaintenance', 'Kurunegala', '{"weight": "20 tons", "bucket_capacity": "1.0 m3"}'::jsonb, 62, true, NOW() - INTERVAL '65 days', NOW() - INTERVAL '90 days', false),

    ('22222222-2222-2222-2222-222222222206', '11111111-1111-1111-1111-111111111104', 'Dynapac CA250D Single Drum Soil Compactor', 'Heavy embankment and earthworks compactor locked due to 60-day wear limit trigger.', '352ea07e-bd97-481b-a287-027036658902', 19000.00, 11000000.00, 'UnderMaintenance', 'Galle', '{"drum_type": "Smooth", "weight": "11.5 tons"}'::jsonb, 64, true, NOW() - INTERVAL '70 days', NOW() - INTERVAL '100 days', false),

    ('22222222-2222-2222-2222-222222222207', '11111111-1111-1111-1111-111111111106', 'Nilfisk SC500 Walk-Behind Industrial Scrubber', 'Battery-powered scrubbing and drying machine for commercial warehouses and factory floors.', '5fcc78e0-06b4-4db7-b6bf-31c3fac5524d', 4500.00, 950000.00, 'Available', 'Colombo 03', '{"scrubbing_width": "530mm", "tank_capacity": "45L"}'::jsonb, 12, false, NOW() - INTERVAL '12 days', NOW() - INTERVAL '35 days', false)
ON CONFLICT (id) DO NOTHING;

-- 5. ACTIVE & COMPLETED BOOKINGS
INSERT INTO bookings (id, equipment_id, renter_id, owner_id, start_date, end_date, daily_rate, total_rental_fee, status, cancellation_reason, created_at_utc, is_deleted)
VALUES
    ('33333333-3333-3333-3333-333333333301', '22222222-2222-2222-2222-222222222201', '11111111-1111-1111-1111-111111111101', '11111111-1111-1111-1111-111111111102', NOW() - INTERVAL '3 days', NOW() + INTERVAL '4 days', 32000.00, 224000.00, 'Active', NULL, NOW() - INTERVAL '4 days', false),

    ('33333333-3333-3333-3333-333333333302', '9532fff5-e5cd-49d7-a121-96ade735a4af', '11111111-1111-1111-1111-111111111105', '990d754f-9e7a-4a54-92f7-d27d141c5ba5', NOW() - INTERVAL '2 days', NOW() + INTERVAL '2 days', 4200.00, 16800.00, 'Active', NULL, NOW() - INTERVAL '3 days', false),

    ('33333333-3333-3333-3333-333333333303', '22222222-2222-2222-2222-222222222203', '533502bf-3ca3-4cda-a059-539a27e7d2bf', '11111111-1111-1111-1111-111111111106', NOW() - INTERVAL '1 day', NOW() + INTERVAL '6 days', 8500.00, 59500.00, 'Active', NULL, NOW() - INTERVAL '2 days', false),

    ('33333333-3333-3333-3333-333333333304', 'aea6d444-997e-48a1-a834-873df6edcf10', '11111111-1111-1111-1111-111111111101', '990d754f-9e7a-4a54-92f7-d27d141c5ba5', NOW() - INTERVAL '10 days', NOW() - INTERVAL '3 days', 3500.00, 24500.00, 'Completed', NULL, NOW() - INTERVAL '12 days', false),

    ('33333333-3333-3333-3333-333333333305', '22222222-2222-2222-2222-222222222202', '11111111-1111-1111-1111-111111111105', '11111111-1111-1111-1111-111111111102', NOW() - INTERVAL '5 days', NOW() + INTERVAL '1 day', 14500.00, 87000.00, 'Active', NULL, NOW() - INTERVAL '6 days', false)
ON CONFLICT (id) DO NOTHING;

-- 6. KYC VERIFICATION DOSSIERS (Component 1 / Desk 02)
INSERT INTO kyc_records (id, user_id, document_type, document_number, front_image_url, back_image_url, status, verified_by_admin_id, rejection_reason, verified_at_utc, created_at_utc, is_deleted)
VALUES
    ('44444444-4444-4444-4444-444444444401', '11111111-1111-1111-1111-111111111101', 'NIC', '198842109923', 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=600&auto=format&fit=crop&q=80', NULL, 'Approved', 'd16fc821-96e2-4a80-95e1-d3fa782e048f', NULL, NOW() - INTERVAL '30 days', NOW() - INTERVAL '35 days', false),

    ('44444444-4444-4444-4444-444444444402', '11111111-1111-1111-1111-111111111102', 'NIC', '197412809122', 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=600&auto=format&fit=crop&q=80', NULL, 'Approved', 'd16fc821-96e2-4a80-95e1-d3fa782e048f', NULL, NOW() - INTERVAL '40 days', NOW() - INTERVAL '45 days', false),

    ('44444444-4444-4444-4444-444444444403', '11111111-1111-1111-1111-111111111103', 'NIC', '199104508119', 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=600&auto=format&fit=crop&q=80', NULL, 'Pending', NULL, NULL, NULL, NOW() - INTERVAL '2 days', false),

    ('44444444-4444-4444-4444-444444444404', '11111111-1111-1111-1111-111111111104', 'NIC', '198522301984', 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=600&auto=format&fit=crop&q=80', NULL, 'Rejected', 'd16fc821-96e2-4a80-95e1-d3fa782e048f', 'Flagged for counterfeit laminate and mismatched OCR date', NOW() - INTERVAL '5 days', NOW() - INTERVAL '7 days', false),

    ('44444444-4444-4444-4444-444444444405', '11111111-1111-1111-1111-111111111105', 'NIC', '199310804422', 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=600&auto=format&fit=crop&q=80', NULL, 'Pending', NULL, NULL, NULL, NOW() - INTERVAL '1 day', false)
ON CONFLICT (id) DO NOTHING;

-- 7. ESCROW HOLDS & SECURITY DEPOSITS (Component 4)
INSERT INTO escrow_holds (id, booking_id, renter_id, owner_id, deposit_amount, pre_auth_transaction_id, status, held_at_utc, settled_at_utc, created_at_utc, is_deleted)
VALUES
    ('55555555-5555-5555-5555-555555555501', '33333333-3333-3333-3333-333333333301', '11111111-1111-1111-1111-111111111101', '11111111-1111-1111-1111-111111111102', 100000.00, 'PA-LK-202609-00192', 'Held', NOW() - INTERVAL '3 days', NULL, NOW() - INTERVAL '4 days', false),

    ('55555555-5555-5555-5555-555555555502', '33333333-3333-3333-3333-333333333302', '11111111-1111-1111-1111-111111111105', '990d754f-9e7a-4a54-92f7-d27d141c5ba5', 15000.00, 'PA-LK-202609-00193', 'Held', NOW() - INTERVAL '2 days', NULL, NOW() - INTERVAL '3 days', false),

    ('55555555-5555-5555-5555-555555555503', '33333333-3333-3333-3333-333333333303', '533502bf-3ca3-4cda-a059-539a27e7d2bf', '11111111-1111-1111-1111-111111111106', 35000.00, 'PA-LK-202609-00194', 'Held', NOW() - INTERVAL '1 day', NULL, NOW() - INTERVAL '2 days', false),

    ('55555555-5555-5555-5555-555555555504', '33333333-3333-3333-3333-333333333304', '11111111-1111-1111-1111-111111111101', '990d754f-9e7a-4a54-92f7-d27d141c5ba5', 20000.00, 'PA-LK-202609-00188', 'Held', NOW() - INTERVAL '10 days', NULL, NOW() - INTERVAL '12 days', false),

    ('55555555-5555-5555-5555-555555555505', '33333333-3333-3333-3333-333333333305', '11111111-1111-1111-1111-111111111105', '11111111-1111-1111-1111-111111111102', 50000.00, 'PA-LK-202609-00195', 'Held', NOW() - INTERVAL '5 days', NULL, NOW() - INTERVAL '6 days', false)
ON CONFLICT (id) DO NOTHING;

-- 8. DAMAGE DISPUTES & ARBITRATION CLAIMS (Component 4 / Desk 04)
INSERT INTO damage_claims (id, booking_id, filed_by_user_id, damage_description, evidence_photos_json, proposed_deduction, final_deduction, status, adjudication_notes, adjudicated_by_user_id, adjudicated_at_utc, created_at_utc, is_deleted)
VALUES
    ('66666666-6666-6666-6666-666666666601', '33333333-3333-3333-3333-333333333304', '990d754f-9e7a-4a54-92f7-d27d141c5ba5', 'Cracked brass high-pressure pump head assembly and severe outer casing fracture caused by drop from truck bed.', '["https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=800&auto=format&fit=crop&q=80"]'::jsonb, 18500.00, NULL, 'Filed', NULL, NULL, NULL, NOW() - INTERVAL '2 days', false),

    ('66666666-6666-6666-6666-666666666602', '33333333-3333-3333-3333-333333333302', '990d754f-9e7a-4a54-92f7-d27d141c5ba5', 'Rotary hammer SDS-Max chuck teeth severely stripped and internal clutch slipping due to unapproved dry coring beyond rated capacity.', '["https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=800&auto=format&fit=crop&q=80"]'::jsonb, 8200.00, NULL, 'UnderAIEvaluation', 'Gemini safety arbiter verifies operational abuse inconsistent with normal wear.', NULL, NULL, NOW() - INTERVAL '1 day', false),

    ('66666666-6666-6666-6666-666666666603', '33333333-3333-3333-3333-333333333305', '11111111-1111-1111-1111-111111111102', 'Tandem roller articulation joint hydraulic hose ruptured and vibration amplitude control solenoid crushed during transport.', '["https://images.unsplash.com/photo-1578575437130-527eed3abbec?w=800&auto=format&fit=crop&q=80"]'::jsonb, 45000.00, NULL, 'PendingStaffApproval', 'Pre-authorized deposit covers required replacement parts. Awaiting operator sign-off.', NULL, NULL, NOW() - INTERVAL '12 hours', false)
ON CONFLICT (id) DO NOTHING;

COMMIT;
