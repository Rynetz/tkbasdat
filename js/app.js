const initialData = {
    users: [
        { id: 'admin-1', role: 'Admin', username: 'admin', password: 'password', fullName: 'Super Admin', phone: '-', email: 'admin@tiktaktuk.com' },
        { id: 'org-1', role: 'Organizer', username: 'organizer', password: 'password', fullName: 'Del Folks Organizer', phone: '08123456789', email: 'org@delfolks.com' },
        { id: 'cust-1', role: 'Customer', username: 'customer', password: 'password', fullName: 'Budi Santoso', phone: '08987654321', email: 'budi@example.com' }
    ],
    events: [
        { id: 'ev-1', name: 'Konser Melodi Senja', capacity: 500, location: 'Stadion Utama', date: '2026-08-15T19:00', organizerId: 'org-1', hasReservedSeating: true },
        { id: 'ev-2', name: 'Festival Kuliner Nusantara', capacity: 2000, location: 'Alun-alun Kota', date: '2026-09-01T10:00', organizerId: 'org-1', hasReservedSeating: false }
    ],
    venues: [
        { id: 'ven-1', name: 'Stadion Utama', capacity: 50000, address: 'Jl. Pemuda No. 1', city: 'Jakarta' },
        { id: 'ven-2', name: 'Alun-alun Kota', capacity: 10000, address: 'Pusat Kota', city: 'Bandung' },
        { id: 'ven-3', name: 'Gedung Kesenian', capacity: 500, address: 'Jl. Merdeka No. 10', city: 'Surabaya' },
        { id: 'ven-4', name: 'Taman Budaya', capacity: 2000, address: 'Jl. Budaya No. 5', city: 'Yogyakarta' },
        { id: 'ven-5', name: 'Hall Expo', capacity: 15000, address: 'Jl. Expo No. 99', city: 'Medan' }
    ],
    categories: [
        { id: 'cat-1', eventId: 'ev-1', name: 'VIP', quota: 50, price: 1500000, booked: 20 },
        { id: 'cat-2', eventId: 'ev-1', name: 'Festival', quota: 450, price: 500000, booked: 100 },
        { id: 'cat-3', eventId: 'ev-2', name: 'Regular Pass', quota: 2000, price: 100000, booked: 500 }
    ],
    seats: [
        { id: 'seat-1', venueId: 'ven-1', section: 'Utama', row: 'A', number: '1', isAvailable: true },
        { id: 'seat-2', venueId: 'ven-1', section: 'Utama', row: 'A', number: '2', isAvailable: true },
        { id: 'seat-3', venueId: 'ven-1', section: 'Utama', row: 'A', number: '3', isAvailable: false }
    ],
    tickets: [
        { id: 'tkt-1', code: 'TKT-001', orderId: 'ord-1', eventId: 'ev-1', categoryId: 'cat-1', seatId: 'seat-3' }
    ],
    promotions: [
        { promotion_id: 'f0000000-0000-0000-0000-000000000001', promo_code: 'TIKTAK20', discount_type: 'PERCENTAGE', discount_value: 20, start_date: '2026-01-01', end_date: '2026-12-31', usage_limit: 100 },
        { promotion_id: 'f0000000-0000-0000-0000-000000000002', promo_code: 'HEMAT50K', discount_type: 'NOMINAL', discount_value: 50000, start_date: '2026-01-01', end_date: '2026-12-31', usage_limit: 50 },
        { promotion_id: 'f0000000-0000-0000-0000-000000000003', promo_code: 'NEWUSER30', discount_type: 'PERCENTAGE', discount_value: 30, start_date: '2026-03-01', end_date: '2026-06-30', usage_limit: 200 },
        { promotion_id: 'f0000000-0000-0000-0000-000000000004', promo_code: 'PAYDAY100K', discount_type: 'NOMINAL', discount_value: 100000, start_date: '2026-04-25', end_date: '2026-04-30', usage_limit: 500 },
        { promotion_id: 'f0000000-0000-0000-0000-000000000005', promo_code: 'FASILKOM50', discount_type: 'PERCENTAGE', discount_value: 50, start_date: '2026-04-01', end_date: '2026-04-30', usage_limit: 100 },
        { promotion_id: 'f0000000-0000-0000-0000-000000000006', promo_code: 'EARLYBIRD', discount_type: 'NOMINAL', discount_value: 25000, start_date: '2026-05-01', end_date: '2026-05-15', usage_limit: 300 }
    ],
    orders: [
        { order_id: 'd0000000-0000-0000-0000-000000000001', order_date: '2026-04-10T14:30:00Z', payment_status: 'Lunas', total_amount: 1200000, customer_id: 'cust-1', event_id: 'ev-1', customerName: 'Budi Santoso' },
        { order_id: 'd0000000-0000-0000-0000-000000000002', order_date: '2026-04-11T09:15:00Z', payment_status: 'Lunas', total_amount: 150000, customer_id: 'cust-1', event_id: 'ev-1', customerName: 'Siti Rahayu' },
        { order_id: 'd0000000-0000-0000-0000-000000000003', order_date: '2026-04-12T18:45:00Z', payment_status: 'Pending', total_amount: 1500000, customer_id: 'cust-1', event_id: 'ev-1', customerName: 'Andi Wijaya' },
        { order_id: 'd0000000-0000-0000-0000-000000000004', order_date: '2026-04-13T11:00:00Z', payment_status: 'Dibatalkan', total_amount: 700000, customer_id: 'cust-1', event_id: 'ev-2', customerName: 'Dewi Lestari' },
        { order_id: 'd0000000-0000-0000-0000-000000000005', order_date: '2026-04-14T10:20:00Z', payment_status: 'Lunas', total_amount: 450000, customer_id: 'cust-1', event_id: 'ev-2', customerName: 'Doni Pratama' },
        { order_id: 'd0000000-0000-0000-0000-000000000006', order_date: '2026-04-15T16:10:00Z', payment_status: 'Pending', total_amount: 250000, customer_id: 'cust-1', event_id: 'ev-2', customerName: 'Rani Mulyani' },
        { order_id: 'd0000000-0000-0000-0000-000000000007', order_date: '2026-04-16T13:05:00Z', payment_status: 'Lunas', total_amount: 300000, customer_id: 'cust-1', event_id: 'ev-1', customerName: 'Budi Santoso' },
        { order_id: 'd0000000-0000-0000-0000-000000000008', order_date: '2026-04-17T08:30:00Z', payment_status: 'Lunas', total_amount: 800000, customer_id: 'cust-1', event_id: 'ev-1', customerName: 'Siti Rahayu' },
        { order_id: 'd0000000-0000-0000-0000-000000000009', order_date: '2026-04-18T19:25:00Z', payment_status: 'Pending', total_amount: 2000000, customer_id: 'cust-1', event_id: 'ev-2', customerName: 'Andi Wijaya' },
        { order_id: 'd0000000-0000-0000-0000-000000000010', order_date: '2026-04-19T21:00:00Z', payment_status: 'Dibatalkan', total_amount: 100000, customer_id: 'cust-1', event_id: 'ev-2', customerName: 'Dewi Lestari' },
        { order_id: 'd0000000-0000-0000-0000-000000000011', order_date: '2026-04-20T15:40:00Z', payment_status: 'Lunas', total_amount: 350000, customer_id: 'cust-1', event_id: 'ev-1', customerName: 'Doni Pratama' },
        { order_id: 'd0000000-0000-0000-0000-000000000012', order_date: '2026-04-21T12:12:00Z', payment_status: 'Lunas', total_amount: 120000, customer_id: 'cust-1', event_id: 'ev-2', customerName: 'Rani Mulyani' }
    ],
    order_promotions: [
        { order_promotion_id: '22000000-0000-0000-0000-000000000001', promotion_id: 'f0000000-0000-0000-0000-000000000001', order_id: 'd0000000-0000-0000-0000-000000000001' },
        { order_promotion_id: '22000000-0000-0000-0000-000000000002', promotion_id: 'f0000000-0000-0000-0000-000000000002', order_id: 'd0000000-0000-0000-0000-000000000005' },
        { order_promotion_id: '22000000-0000-0000-0000-000000000003', promotion_id: 'f0000000-0000-0000-0000-000000000003', order_id: 'd0000000-0000-0000-0000-000000000007' },
        { order_promotion_id: '22000000-0000-0000-0000-000000000004', promotion_id: 'f0000000-0000-0000-0000-000000000001', order_id: 'd0000000-0000-0000-0000-000000000008' },
        { order_promotion_id: '22000000-0000-0000-0000-000000000005', promotion_id: 'f0000000-0000-0000-0000-000000000005', order_id: 'd0000000-0000-0000-0000-000000000011' }
    ],
    stats: {
        totalTickets: 120,
        totalOrders: 45,
        totalRevenue: 15000000
    }
};

function initDB() {
    let dbStr = localStorage.getItem('tiktaktuk_db');
    let needsReset = false;
    if (dbStr) {
        try {
            const db = JSON.parse(dbStr);
            if (db.orders && db.orders.length > 0 && !db.orders[0].order_id) {
                needsReset = true;
            }
        } catch(e) {
            needsReset = true;
        }
    }
    
    if (!dbStr || needsReset) {
        localStorage.setItem('tiktaktuk_db', JSON.stringify(initialData));
    } else {
        let db = JSON.parse(dbStr);
        let updated = false;
        for (let key in initialData) {
            if (!db[key]) {
                db[key] = initialData[key];
                updated = true;
            }
        }
        if (updated) {
            localStorage.setItem('tiktaktuk_db', JSON.stringify(db));
        }
    }
}

function getTable(tableName) {
    const db = JSON.parse(localStorage.getItem('tiktaktuk_db'));
    return db[tableName] || [];
}

function saveTable(tableName, data) {
    const db = JSON.parse(localStorage.getItem('tiktaktuk_db'));
    db[tableName] = data;
    localStorage.setItem('tiktaktuk_db', JSON.stringify(db));
}

function generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        const r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

function getCurrentUser() {
    const userId = localStorage.getItem('session_user');
    if (!userId) return null;
    return getTable('users').find(u => u.id === userId);
}

function formatCurrency(amount) {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(amount);
}

function formatDate(dateString) {
    const options = { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' };
    return new Date(dateString).toLocaleDateString('id-ID', options);
}

function getBaseUrl() {
    return window.location.pathname.includes('/pages/') ? '../' : './';
}

function renderNavbar() {
    const navContainer = document.getElementById('dynamicNavbar');
    if (!navContainer) return;

    const user = getCurrentUser();
    const role = user ? user.role : 'Guest';
    const baseUrl = getBaseUrl();

    let navLinks = '';

    if (role === 'Guest') {
        navLinks = `
            <a href="${baseUrl}pages/login.html">Login</a>
            <a href="${baseUrl}pages/register.html">Registrasi</a>
            <a href="${baseUrl}pages/events.html">Cari Event</a>
            <a href="${baseUrl}pages/promotions.html">Promosi</a>
            <a href="${baseUrl}pages/venues.html">Venue</a>
        `;
    } else if (role === 'Admin') {
        navLinks = `
            <a href="${baseUrl}pages/profile.html">Dashboard</a>
            <a href="${baseUrl}pages/events.html">Cari Event</a>
            <a href="${baseUrl}pages/manage-events.html">Manajemen Event</a>
            <a href="${baseUrl}pages/venues.html">Manajemen Venue</a>
            <a href="${baseUrl}pages/manage-seats.html">Manajemen Kursi</a>
            <a href="${baseUrl}pages/ticket-categories.html">Kategori Tiket</a>
            <a href="${baseUrl}pages/manage-tickets.html">Manajemen Tiket</a>
            <a href="${baseUrl}pages/orders.html">Semua Order</a>
            <a href="${baseUrl}pages/promotions.html">Promosi</a>
            <a href="${baseUrl}pages/artists.html">Artis</a>
            <a href="${baseUrl}pages/manage-tickets.html">Tiket (Aset)</a>
            <a href="${baseUrl}pages/orders.html">Order (Aset)</a>
            <a href="${baseUrl}pages/profile.html" style="font-weight: bold;">Profile</a>
            <a href="#" onclick="logout()" style="color: var(--danger);">Logout</a>
        `;
    } else if (role === 'Organizer') {
        navLinks = `
            <a href="${baseUrl}pages/profile.html">Dashboard</a>
            <a href="${baseUrl}pages/events.html">Cari Event</a>
            <a href="${baseUrl}pages/manage-events.html">Event Saya</a>
            <a href="${baseUrl}pages/venues.html">Manajemen Venue</a>
            <a href="${baseUrl}pages/manage-seats.html">Manajemen Kursi</a>
            <a href="${baseUrl}pages/ticket-categories.html">Kategori Tiket</a>
            <a href="${baseUrl}pages/manage-tickets.html">Manajemen Tiket</a>
            <a href="${baseUrl}pages/orders.html">Semua Order</a>
            <a href="${baseUrl}pages/promotions.html">Promosi</a>
            <a href="${baseUrl}pages/artists.html">Artis</a>
            <a href="${baseUrl}pages/manage-tickets.html">Tiket (Aset)</a>
            <a href="${baseUrl}pages/orders.html">Order (Aset)</a>
            <a href="${baseUrl}pages/profile.html" style="font-weight: bold;">Profile</a>
            <a href="#" onclick="logout()" style="color: var(--danger);">Logout</a>
        `;
    } else if (role === 'Customer') {
        navLinks = `
            <a href="${baseUrl}pages/profile.html">Dashboard</a>
            <a href="${baseUrl}pages/manage-tickets.html">Tiket Saya</a>
            <a href="${baseUrl}pages/ticket-categories.html">Kategori Tiket</a>
            <a href="${baseUrl}pages/orders.html">Pesanan</a>
            <a href="${baseUrl}pages/events.html">Cari Event</a>
            <a href="${baseUrl}pages/promotions.html">Promosi</a>
            <a href="${baseUrl}pages/artists.html">Artis</a>
            <a href="${baseUrl}pages/venues.html">Venue</a>
            <a href="${baseUrl}pages/artists.html">Artis</a>
            <a href="#" onclick="logout()" style="color: var(--danger);">Logout</a>
        `;
    }

    navContainer.innerHTML = `
        <div class="nav-container">
            <a href="${baseUrl}index.html" class="logo">TikTakTuk</a>
            <nav class="nav-links">
                ${navLinks}
            </nav>
        </div>
    `;

    const currentPage = window.location.pathname.split('/').pop();
    document.querySelectorAll('.nav-links a').forEach(link => {
        if (link.getAttribute('href').includes(currentPage) && currentPage !== '') {
            link.classList.add('active');
        }
    });
}

function requireLogin() {
    if (!getCurrentUser()) {
        window.location.href = getBaseUrl() + 'pages/login.html';
    }
}

document.addEventListener('DOMContentLoaded', () => {
    initDB();
    renderNavbar();
});
function logout() { localStorage.removeItem('session_user'); window.location.href = getBaseUrl() + 'pages/login.html'; }
//ini logout
