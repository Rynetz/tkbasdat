const express = require('express');
const db = require('./db');

const router = express.Router();

// ==============================================================================
// ENDPOINT 1: GET /api/venues - Lihat Daftar Venue
// ==============================================================================
router.get('/', async (req, res) => {
    try {
        const query = `
            SELECT 
                venue_id,
                venue_name,
                capacity,
                address,
                city
            FROM VENUE
            ORDER BY city, venue_name ASC
        `;
        
        const result = await db.query(query);
        
        res.status(200).json({
            success: true,
            message: 'Berhasil mengambil daftar venue',
            data: result.rows,
            total: result.rows.length
        });
    } catch (error) {
        console.error('GET /api/venues Error:', error.message);
        
        res.status(500).json({
            success: false,
            message: 'Terjadi kesalahan saat mengambil data venue',
            error: error.message
        });
    }
});

// ==============================================================================
// ENDPOINT 2: POST /api/venues - Tambah Venue
// ==============================================================================
router.post('/', async (req, res) => {
    const { venue_name, capacity, address, city } = req.body;

    // Validasi input
    if (!venue_name || !capacity || !address || !city) {
        return res.status(400).json({
            success: false,
            message: 'Semua field harus diisi (venue_name, capacity, address, city)'
        });
    }

    if (capacity <= 0 || !Number.isInteger(capacity)) {
        return res.status(400).json({
            success: false,
            message: 'Capacity harus berupa angka positif'
        });
    }

    try {
        const query = `
            INSERT INTO VENUE (venue_id, venue_name, capacity, address, city)
            VALUES (gen_random_uuid(), $1, $2, $3, $4)
            RETURNING venue_id, venue_name, capacity, address, city
        `;
        
        const result = await db.query(query, [venue_name, capacity, address, city]);
        const newVenue = result.rows[0];

        res.status(201).json({
            success: true,
            message: 'Venue berhasil ditambahkan',
            data: newVenue
        });
    } catch (error) {
        console.error('POST /api/venues Error:', error.message);
        
        // ✅ MENANGKAP ERROR DARI TRIGGER POSTGRESQL
        // Trigger akan melempar exception dengan format:
        // "Venue '<nama_venue>' di kota '<nama_kota>' sudah terdaftar dengan ID <id_venue>."
        
        const triggerErrorMessage = error.message;
        
        // Cek apakah error dari Trigger PostgreSQL
        if (triggerErrorMessage.includes('sudah terdaftar dengan ID')) {
            return res.status(400).json({
                success: false,
                message: triggerErrorMessage
            });
        }

        res.status(500).json({
            success: false,
            message: 'Terjadi kesalahan saat menambahkan venue',
            error: triggerErrorMessage
        });
    }
});

// ==============================================================================
// ENDPOINT 3: PUT /api/venues/:id - Edit Venue
// ==============================================================================
router.put('/:id', async (req, res) => {
    const { id } = req.params;
    const { venue_name, capacity, address, city } = req.body;

    // Validasi UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id)) {
        return res.status(400).json({
            success: false,
            message: 'Format venue_id tidak valid'
        });
    }

    // Validasi input
    if (!venue_name || !capacity || !address || !city) {
        return res.status(400).json({
            success: false,
            message: 'Semua field harus diisi (venue_name, capacity, address, city)'
        });
    }

    if (capacity <= 0 || !Number.isInteger(capacity)) {
        return res.status(400).json({
            success: false,
            message: 'Capacity harus berupa angka positif'
        });
    }

    try {
        // Cek apakah venue dengan ID tersebut ada
        const checkQuery = `SELECT venue_id FROM VENUE WHERE venue_id = $1`;
        const checkResult = await db.query(checkQuery, [id]);
        
        if (checkResult.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: `Venue dengan ID '${id}' tidak ditemukan`
            });
        }

        const query = `
            UPDATE VENUE
            SET venue_name = $1, capacity = $2, address = $3, city = $4
            WHERE venue_id = $5
            RETURNING venue_id, venue_name, capacity, address, city
        `;
        
        const result = await db.query(query, [venue_name, capacity, address, city, id]);
        const updatedVenue = result.rows[0];

        res.status(200).json({
            success: true,
            message: 'Venue berhasil diperbarui',
            data: updatedVenue
        });
    } catch (error) {
        console.error('PUT /api/venues/:id Error:', error.message);
        
        // ✅ MENANGKAP ERROR DARI TRIGGER POSTGRESQL (Duplikasi)
        const triggerErrorMessage = error.message;
        
        if (triggerErrorMessage.includes('sudah terdaftar dengan ID')) {
            return res.status(400).json({
                success: false,
                message: triggerErrorMessage
            });
        }

        res.status(500).json({
            success: false,
            message: 'Terjadi kesalahan saat memperbarui venue',
            error: triggerErrorMessage
        });
    }
});

// ==============================================================================
// ENDPOINT 4: DELETE /api/venues/:id - Hapus Venue
// ==============================================================================
router.delete('/:id', async (req, res) => {
    const { id } = req.params;

    // Validasi UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id)) {
        return res.status(400).json({
            success: false,
            message: 'Format venue_id tidak valid'
        });
    }

    try {
        // Cek apakah venue dengan ID tersebut ada
        const checkQuery = `SELECT venue_name FROM VENUE WHERE venue_id = $1`;
        const checkResult = await db.query(checkQuery, [id]);
        
        if (checkResult.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: `Venue dengan ID '${id}' tidak ditemukan`
            });
        }

        const venueName = checkResult.rows[0].venue_name;

        const query = `DELETE FROM VENUE WHERE venue_id = $1 RETURNING venue_id, venue_name`;
        const result = await db.query(query, [id]);
        const deletedVenue = result.rows[0];

        res.status(200).json({
            success: true,
            message: 'Venue berhasil dihapus',
            data: deletedVenue
        });
    } catch (error) {
        console.error('DELETE /api/venues/:id Error:', error.message);
        
        // ✅ MENANGKAP ERROR DARI TRIGGER POSTGRESQL (Venue masih aktif)
        const triggerErrorMessage = error.message;
        
        if (triggerErrorMessage.includes('masih memiliki event aktif')) {
            return res.status(400).json({
                success: false,
                message: triggerErrorMessage
            });
        }

        res.status(500).json({
            success: false,
            message: 'Terjadi kesalahan saat menghapus venue',
            error: triggerErrorMessage
        });
    }
});

// ==============================================================================
// ENDPOINT BONUS: GET /api/venues/:id - Lihat Detail Venue
// ==============================================================================
router.get('/:id', async (req, res) => {
    const { id } = req.params;

    // Validasi UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id)) {
        return res.status(400).json({
            success: false,
            message: 'Format venue_id tidak valid'
        });
    }

    try {
        const query = `
            SELECT 
                venue_id,
                venue_name,
                capacity,
                address,
                city
            FROM VENUE
            WHERE venue_id = $1
        `;
        
        const result = await db.query(query, [id]);
        
        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: `Venue dengan ID '${id}' tidak ditemukan`
            });
        }

        res.status(200).json({
            success: true,
            message: 'Berhasil mengambil detail venue',
            data: result.rows[0]
        });
    } catch (error) {
        console.error('GET /api/venues/:id Error:', error.message);
        
        res.status(500).json({
            success: false,
            message: 'Terjadi kesalahan saat mengambil detail venue',
            error: error.message
        });
    }
});

module.exports = router;
