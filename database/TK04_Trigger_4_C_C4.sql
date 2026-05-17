-- -----------------------------------------------------------------------------
-- Stored Procedure (Function) & Trigger untuk Validasi Promotion saat digunakan
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION validate_promotion_usage()
RETURNS TRIGGER AS $$
DECLARE
    v_promo_code VARCHAR(50);
    v_usage_limit INT;
    v_start_date DATE;
    v_end_date DATE;
    v_current_usage INT;
    v_event_date DATE;
BEGIN
    -- 1. Validasi Promotion ID terdaftar
    SELECT promo_code, usage_limit, start_date, end_date
    INTO v_promo_code, v_usage_limit, v_start_date, v_end_date
    FROM PROMOTION
    WHERE promotion_id = NEW.promotion_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Promotion dengan ID % tidak ditemukan.', NEW.promotion_id;
    END IF;

    -- 2. Validasi Jumlah penggunaan belum melebihi usage_limit
    SELECT COUNT(*) INTO v_current_usage
    FROM ORDER_PROMOTION
    WHERE promotion_id = NEW.promotion_id;

    IF v_current_usage >= v_usage_limit THEN
        RAISE EXCEPTION 'Promotion "%" telah mencapai batas maksimum penggunaan.', v_promo_code;
    END IF;

    -- 3. Validasi Tanggal Event dalam periode berlaku promotion
    -- Mencari tanggal event dari tiket yang terkait dengan order ini
    SELECT DATE(e.event_time) INTO v_event_date
    FROM TICKET t
    JOIN TICKET_CATEGORY tc ON t.category_id = tc.category_id
    JOIN EVENT e ON tc.event_id = e.event_id
    WHERE t.order_id = NEW.order_id
    LIMIT 1;

    -- Jika tiket sudah ada dan ditemukan tanggal event-nya, lakukan validasi
    IF v_event_date IS NOT NULL THEN
        IF v_event_date < v_start_date OR v_event_date > v_end_date THEN
            RAISE EXCEPTION 'Promotion "%" tidak berlaku untuk tanggal event ini.', v_promo_code;
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_validate_promotion_usage
BEFORE INSERT ON ORDER_PROMOTION
FOR EACH ROW
EXECUTE FUNCTION validate_promotion_usage();