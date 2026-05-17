CREATE OR REPLACE FUNCTION validate_username_registration()
RETURNS TRIGGER AS $$
BEGIN
    -- hanya boleh huruf dan angka
    IF NEW.username !~ '^[a-zA-Z0-9]+$' THEN
        RAISE EXCEPTION 
        'Error: Username "%" hanya boleh mengandung huruf dan angka tanpa simbol atau spasi.', 
        NEW.username;
    END IF;

    -- memastikan belum pernah dipakai
    IF EXISTS (
        SELECT 1 
        FROM user_account 
        WHERE LOWER(username) = LOWER(NEW.username)
    ) THEN
        RAISE EXCEPTION 
        'Error: Username "%" sudah terdaftar, gunakan username lain.', 
        NEW.username;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_validate_username ON user_account;

CREATE TRIGGER trg_validate_username
BEFORE INSERT ON user_account
FOR EACH ROW
EXECUTE FUNCTION validate_username_registration();