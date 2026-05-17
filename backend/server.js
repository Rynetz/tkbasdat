const express = require('express');
const cors = require('cors');
const path = require('path');
const db = require('./db');
const venuesRouter = require('./venues');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, '../')));

// ✅ ROUTE UNTUK MANAJEMEN VENUE (TK04)
app.use('/api/venues', venuesRouter);

app.post('/api/register', async (req, res) => {
    const { role, username, password, full_name, email, phone } = req.body;

    try {
        // Menggunakan Transaction karena kita akan insert ke beberapa tabel
        await db.query('BEGIN');

        // 1. Ambil role_id dari tabel ROLE
        let dbRole = role || 'Customer';
        if (dbRole === 'Admin') dbRole = 'Administrator';
        
        const roleQuery = `SELECT role_id FROM ROLE WHERE role_name = $1`;
        const roleResult = await db.query(roleQuery, [dbRole]);
        
        if (roleResult.rows.length === 0) {
            throw new Error(`Role ${dbRole} tidak valid`);
        }
        const roleId = roleResult.rows[0].role_id;

        // 2. Insert ke USER_ACCOUNT menggunakan gen_random_uuid()
        const userQuery = `
            INSERT INTO USER_ACCOUNT (user_id, username, password)
            VALUES (gen_random_uuid(), $1, $2)
            RETURNING user_id, username;
        `;
        const userResult = await db.query(userQuery, [username, password]);
        const newUser = userResult.rows[0];

        // 3. Insert ke ACCOUNT_ROLE
        const accountRoleQuery = `
            INSERT INTO ACCOUNT_ROLE (role_id, user_id)
            VALUES ($1, $2)
        `;
        await db.query(accountRoleQuery, [roleId, newUser.user_id]);

        // 4. Insert ke tabel profil yang sesuai (CUSTOMER atau ORGANIZER)
        if (role === 'Organizer') {
            const orgQuery = `
                INSERT INTO ORGANIZER (organizer_id, organizer_name, contact_email, user_id)
                VALUES (gen_random_uuid(), $1, $2, $3)
            `;
            // Asumsikan full_name adalah organizer_name, dan email adalah contact_email
            await db.query(orgQuery, [full_name, email, newUser.user_id]);
        } else if (role === 'Customer') {
            const custQuery = `
                INSERT INTO CUSTOMER (customer_id, full_name, phone_number, user_id)
                VALUES (gen_random_uuid(), $1, $2, $3)
            `;
            await db.query(custQuery, [full_name, phone, newUser.user_id]);
        }

        await db.query('COMMIT');

        res.status(201).json({
            success: true,
            message: 'Registrasi berhasil',
            data: {
                id: newUser.user_id,
                username: newUser.username,
                role: role
            }
        });

    } catch (error) {
        await db.query('ROLLBACK');
        console.error('Registration Error:', error.message);
        
        // Menangkap pesan error dari PostgreSQL
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
});

app.post('/api/login', async (req, res) => {
    const { username, password } = req.body;

    try {
        // Query disesuaikan dengan schema V2
        // Kita join USER_ACCOUNT, ACCOUNT_ROLE, dan ROLE untuk mendapatkan role_name
        const query = `
            SELECT u.user_id as id, u.username, r.role_name as role
            FROM USER_ACCOUNT u
            JOIN ACCOUNT_ROLE ar ON u.user_id = ar.user_id
            JOIN ROLE r ON ar.role_id = r.role_id
            WHERE u.username = $1 AND u.password = $2
        `;
        const result = await db.query(query, [username, password]);

        if (result.rows.length === 0) {
            return res.status(401).json({ success: false, message: 'Username atau password salah' });
        }

        res.json({
            success: true,
            message: 'Login berhasil',
            user: result.rows[0]
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

app.get('/api/events', async (req, res) => {
    try {
        const query = `
            SELECT e.event_id as id, e.event_title as name, e.event_time as date, 
                   e.venue_id, v.venue_name as location, e.organizer_id, o.organizer_name 
            FROM EVENT e 
            JOIN ORGANIZER o ON e.organizer_id = o.organizer_id
            LEFT JOIN VENUE v ON e.venue_id = v.venue_id
            ORDER BY e.event_time ASC
        `;
        const result = await db.query(query);
        res.json({ success: true, data: result.rows });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Gagal mengambil data event' });
    }
});

app.get('/api/orders', async (req, res) => {
    try {
        const query = `
            SELECT o.order_id as id, o.order_date as date, o.payment_status as status, o.total_amount as amount, 
                   o.customer_id as "customerId", c.full_name as "customerName", c.user_id as "customerUserId",
                   (SELECT org.user_id FROM TICKET t JOIN TICKET_CATEGORY tc ON t.category_id = tc.category_id JOIN EVENT e ON tc.event_id = e.event_id JOIN ORGANIZER org ON e.organizer_id = org.organizer_id WHERE t.order_id = o.order_id LIMIT 1) as "organizerUserId"
            FROM "ORDER" o
            LEFT JOIN CUSTOMER c ON o.customer_id = c.customer_id
            ORDER BY o.order_date DESC
        `;
        const result = await db.query(query);
        res.json({ success: true, data: result.rows });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Gagal mengambil data orders' });
    }
});

app.get('/api/events/:id/categories', async (req, res) => {
    const { id } = req.params;
    try {
        const query = `
            SELECT tc.category_id as id, tc.category_name as name, tc.price, tc.quota,
                   (SELECT COUNT(*) FROM TICKET t WHERE t.category_id = tc.category_id) as booked
            FROM TICKET_CATEGORY tc
            WHERE tc.event_id = $1
        `;
        const result = await db.query(query, [id]);
        res.json({ success: true, data: result.rows });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Gagal mengambil data kategori tiket' });
    }
});

app.post('/api/orders', async (req, res) => {
    const { category_id, qty, promo_code, userId } = req.body;

    const client = await db.connect();
    try {
        await client.query('BEGIN');

        // 1. Get customer_id from user_id
        const customerResult = await client.query('SELECT customer_id FROM CUSTOMER WHERE user_id = $1', [userId]);
        if (customerResult.rows.length === 0) {
            throw new Error('Hanya Customer yang terdaftar yang dapat memesan.');
        }
        const customer_id = customerResult.rows[0].customer_id;

        // 2. Get category details
        const catResult = await client.query('SELECT price, quota, (SELECT COUNT(*) FROM TICKET t WHERE t.category_id = TICKET_CATEGORY.category_id) as booked FROM TICKET_CATEGORY WHERE category_id = $1', [category_id]);
        if (catResult.rows.length === 0) {
            throw new Error('Kategori tiket tidak ditemukan.');
        }
        const category = catResult.rows[0];
        
        // 3. Check quota
        if (parseInt(category.quota) - parseInt(category.booked) < qty) {
            throw new Error('Kuota tiket tidak mencukupi.');
        }

        // 4. Calculate total
        const subtotal = parseFloat(category.price) * qty;
        let discount = 0;
        let promotion_id = null;

        // 5. Apply Promo if provided
        if (promo_code) {
            const promoResult = await client.query('SELECT * FROM PROMOTION WHERE promo_code = $1', [promo_code]);
            if (promoResult.rows.length > 0) {
                const promo = promoResult.rows[0];
                promotion_id = promo.promotion_id;
                
                if (promo.discount_type === 'PERCENTAGE') {
                    discount = subtotal * (parseFloat(promo.discount_value) / 100);
                } else {
                    discount = parseFloat(promo.discount_value);
                }
                if (discount > subtotal) discount = subtotal;
            } else {
                promotion_id = '00000000-0000-0000-0000-000000000000';
            }
        }

        const service_fee = 5000;
        const total_amount = subtotal - discount + service_fee;

        // 6. Create ORDER
        const order_id = await client.query('SELECT gen_random_uuid()').then(res => res.rows[0].gen_random_uuid);
        const orderQuery = `
            INSERT INTO "ORDER" (order_id, order_date, payment_status, total_amount, customer_id)
            VALUES ($1, NOW(), 'Pending', $2, $3)
        `;
        await client.query(orderQuery, [order_id, total_amount, customer_id]);

        // 7. Create TICKETS
        for (let i = 0; i < qty; i++) {
            const ticketCode = 'TKT-' + Math.random().toString(36).substring(2, 10).toUpperCase();
            await client.query(
                'INSERT INTO TICKET (ticket_id, ticket_code, order_id, category_id) VALUES (gen_random_uuid(), $1, $2, $3)',
                [ticketCode, order_id, category_id]
            );
        }

        // 8. Create ORDER_PROMOTION
        if (promotion_id || promo_code) {
            await client.query(
                'INSERT INTO ORDER_PROMOTION (order_promotion_id, promotion_id, order_id) VALUES (gen_random_uuid(), $1, $2)',
                [promotion_id, order_id]
            );
        }

        await client.query('COMMIT');
        res.status(201).json({ success: true, order_id });
    } catch (error) {
        await client.query('ROLLBACK');
        console.error(error);
        res.status(400).json({ success: false, message: error.message || 'Gagal membuat pesanan' });
    } finally {
        client.release();
    }
});

app.put('/api/orders/:id/status', async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;
    try {
        const query = `UPDATE "ORDER" SET payment_status = $1 WHERE order_id = $2 RETURNING *`;
        const result = await db.query(query, [status, id]);
        
        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Order tidak ditemukan' });
        }
        res.json({ success: true, data: result.rows[0] });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Gagal update status order' });
    }
});

app.delete('/api/orders/:id', async (req, res) => {
    const { id } = req.params;
    const client = await db.connect();
    
    try {
        await client.query('BEGIN');
        
        // 1. Hapus referensi dari ORDER_PROMOTION
        await client.query('DELETE FROM ORDER_PROMOTION WHERE order_id = $1', [id]);
        
        // 2. Hapus tiket yang terkait dengan order ini
        await client.query('DELETE FROM TICKET WHERE order_id = $1', [id]);
        
        // 3. Terakhir, hapus dari tabel utama "ORDER"
        const query = `DELETE FROM "ORDER" WHERE order_id = $1`;
        await client.query(query, [id]);
        
        await client.query('COMMIT');
        res.json({ success: true });
    } catch (error) {
        await client.query('ROLLBACK');
        console.error(error);
        res.status(500).json({ success: false, message: 'Gagal menghapus order (Terjadi kesalahan server)' });
    } finally {
        client.release();
    }
});

// PROMOTIONS API
app.get('/api/promotions', async (req, res) => {
    try {
        const query = `
            SELECT p.*, 
                   (SELECT COUNT(*) FROM ORDER_PROMOTION op WHERE op.promotion_id = p.promotion_id) as used_count 
            FROM PROMOTION p
            ORDER BY p.start_date DESC
        `;
        const result = await db.query(query);
        res.json({ success: true, data: result.rows });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Gagal mengambil data promosi' });
    }
});

app.post('/api/promotions', async (req, res) => {
    const { promo_code, discount_type, discount_value, start_date, end_date, usage_limit } = req.body;
    try {
        const query = `
            INSERT INTO PROMOTION (promotion_id, promo_code, discount_type, discount_value, start_date, end_date, usage_limit)
            VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6)
            RETURNING *
        `;
        const result = await db.query(query, [promo_code, discount_type, discount_value, start_date, end_date, usage_limit]);
        res.status(201).json({ success: true, data: result.rows[0] });
    } catch (error) {
        console.error(error);
        res.status(400).json({ success: false, message: error.message || 'Gagal membuat promosi' });
    }
});

app.put('/api/promotions/:id', async (req, res) => {
    const { id } = req.params;
    const { promo_code, discount_type, discount_value, start_date, end_date, usage_limit } = req.body;
    try {
        const query = `
            UPDATE PROMOTION 
            SET promo_code = $1, discount_type = $2, discount_value = $3, start_date = $4, end_date = $5, usage_limit = $6
            WHERE promotion_id = $7
            RETURNING *
        `;
        const result = await db.query(query, [promo_code, discount_type, discount_value, start_date, end_date, usage_limit, id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Promo tidak ditemukan' });
        }
        res.json({ success: true, data: result.rows[0] });
    } catch (error) {
        console.error(error);
        res.status(400).json({ success: false, message: error.message || 'Gagal update promosi' });
    }
});

app.delete('/api/promotions/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const query = `DELETE FROM PROMOTION WHERE promotion_id = $1`;
        await db.query(query, [id]);
        res.json({ success: true });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Gagal menghapus promosi (mungkin sudah digunakan di order)' });
    }
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
