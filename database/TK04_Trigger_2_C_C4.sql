-- ==============================================================================
-- TK04: FITUR MANAJEMEN VENUE
-- Database Setup dengan Raw SQL dan Trigger PostgreSQL
-- ==============================================================================

-- ==================== TAHAP 1: MEMBUAT TABEL ====================

-- 1. Create Table VENUE
CREATE TABLE IF NOT EXISTS VENUE (
    venue_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    venue_name VARCHAR(255) NOT NULL,
    capacity INT NOT NULL CHECK (capacity > 0),
    address TEXT NOT NULL,
    city VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Create Table EVENT (untuk cek relasi pada Trigger 2)
CREATE TABLE IF NOT EXISTS EVENT (
    event_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_name VARCHAR(255) NOT NULL,
    event_time TIMESTAMP NOT NULL,
    venue_id UUID NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_event_venue FOREIGN KEY (venue_id) REFERENCES VENUE(venue_id) ON DELETE CASCADE
);

-- Create index untuk mempercepat query
CREATE INDEX IF NOT EXISTS idx_event_venue_id ON EVENT(venue_id);
CREATE INDEX IF NOT EXISTS idx_event_time ON EVENT(event_time);
CREATE INDEX IF NOT EXISTS idx_venue_city ON VENUE(city);

-- ==================== TAHAP 2: INSERT DATA DUMMY ====================

-- Insert dummy venues
INSERT INTO VENUE (venue_name, capacity, address, city) VALUES
('Bali International Convention Center', 5000, 'Jl. Nusa Dua, Bali', 'Bali'),
('Jakarta Convention Center', 10000, 'Jl. Gatot Subroto, Jakarta', 'Jakarta'),
('Surabaya Culture Hall', 3000, 'Jl. Tunjungan, Surabaya', 'Surabaya'),
('Medan Grand Theater', 2500, 'Jl. Diponegoro, Medan', 'Medan')
ON CONFLICT (venue_id) DO NOTHING;

-- Insert dummy events untuk testing Trigger 2 (Delete Venue Aktif)
INSERT INTO EVENT (event_name, event_time, venue_id) VALUES
('Music Festival 2026', NOW() + INTERVAL '30 days', 
    (SELECT venue_id FROM VENUE WHERE venue_name = 'Bali International Convention Center' LIMIT 1)),
('Tech Conference 2026', NOW() + INTERVAL '60 days', 
    (SELECT venue_id FROM VENUE WHERE venue_name = 'Jakarta Convention Center' LIMIT 1)),
('Concert Night', NOW() - INTERVAL '5 days', 
    (SELECT venue_id FROM VENUE WHERE venue_name = 'Surabaya Culture Hall' LIMIT 1))
ON CONFLICT (event_id) DO NOTHING;

-- ==================== TAHAP 3: TRIGGERS POSTGRESQL ====================

-- ==============================================================================
-- TRIGGER 1: MENCEGAH DUPLIKASI VENUE (IGNORE CASE)
-- ==============================================================================

-- Drop existing function dan trigger jika ada (untuk re-run script)
DROP TRIGGER IF EXISTS trigger_check_duplicate_venue ON VENUE;
DROP FUNCTION IF EXISTS fn_check_duplicate_venue();

-- Create function untuk cek duplikasi
CREATE OR REPLACE FUNCTION fn_check_duplicate_venue()
RETURNS TRIGGER AS $$
DECLARE
    v_existing_id UUID;
    v_venue_name VARCHAR;
    v_city VARCHAR;
BEGIN
    -- Cek apakah venue_name sudah ada di city yang sama (ignore case)
    -- CATATAN: Untuk INSERT, NEW.venue_id masih NULL, jadi gunakan COALESCE untuk exclude
    SELECT venue_id, venue_name, city INTO v_existing_id, v_venue_name, v_city
    FROM VENUE
    WHERE LOWER(venue_name) = LOWER(NEW.venue_name)
      AND LOWER(city) = LOWER(NEW.city)
      AND venue_id != COALESCE(NEW.venue_id, '00000000-0000-0000-0000-000000000000')  -- Exclude current record untuk UPDATE
    LIMIT 1;

    -- Jika ada duplikasi, lempar error dengan format persis
    IF FOUND THEN
        RAISE EXCEPTION 'Venue ''%'' di kota ''%'' sudah terdaftar dengan ID %.', 
            NEW.venue_name, NEW.city, v_existing_id;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger untuk INSERT dan UPDATE
CREATE TRIGGER trigger_check_duplicate_venue
BEFORE INSERT OR UPDATE ON VENUE
FOR EACH ROW
EXECUTE FUNCTION fn_check_duplicate_venue();

-- ==============================================================================
-- TRIGGER 2: MENCEGAH HAPUS VENUE AKTIF
-- ==============================================================================

-- Drop existing function dan trigger jika ada
DROP TRIGGER IF EXISTS trigger_prevent_delete_active_venue ON VENUE;
DROP FUNCTION IF EXISTS fn_prevent_delete_active_venue();

-- Create function untuk cek event aktif
CREATE OR REPLACE FUNCTION fn_prevent_delete_active_venue()
RETURNS TRIGGER AS $$
DECLARE
    v_active_event_count INT;
    v_venue_name VARCHAR;
BEGIN
    -- Cek apakah ada event dengan event_time >= CURRENT_TIMESTAMP
    SELECT COUNT(*), OLD.venue_name INTO v_active_event_count, v_venue_name
    FROM EVENT
    WHERE venue_id = OLD.venue_id
      AND event_time >= CURRENT_TIMESTAMP;

    -- Jika ada event aktif, lempar error dengan format persis
    IF v_active_event_count > 0 THEN
        RAISE EXCEPTION 'Venue ''%'' masih memiliki event aktif sehingga tidak dapat dihapus.',
            v_venue_name;
    END IF;

    RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- Create trigger untuk DELETE
CREATE TRIGGER trigger_prevent_delete_active_venue
BEFORE DELETE ON VENUE
FOR EACH ROW
EXECUTE FUNCTION fn_prevent_delete_active_venue();

-- ==============================================================================
-- QUERY TESTING (Jalankan untuk test)
-- ==============================================================================

-- Test SELECT semua venue
-- SELECT * FROM VENUE;

-- Test SELECT semua event
-- SELECT * FROM EVENT;

-- Test error duplikasi (uncomment untuk test):
-- INSERT INTO VENUE (venue_name, capacity, address, city) 
-- VALUES ('Bali International Convention Center', 5000, 'Jl. Test', 'Bali');

-- Test error delete active venue (uncomment untuk test):
-- DELETE FROM VENUE WHERE venue_name = 'Bali International Convention Center';

-- ==============================================================================
-- END OF TK04 DATABASE SETUP
-- ==============================================================================
