document.addEventListener('DOMContentLoaded', () => {
    requireLogin();
    const user = getCurrentUser();
    if (user.role !== 'Customer') {
        alert('Hanya Customer yang dapat membeli tiket.');
        window.location.href = 'profile.html';
        return;
    }

    const urlParams = new URLSearchParams(window.location.search);
    const eventId = urlParams.get('eventId');
    if (!eventId) {
        showError('Event tidak ditemukan.');
        return;
    }

    loadEventCheckout(eventId);
});

let selectedCategory = null;
let currentEvent = null;
let appliedPromo = null;

function showError(msg) {
    const err = document.getElementById('errorMsg');
    err.innerText = msg;
    err.classList.remove('d-none');
}

async function loadEventCheckout(eventId) {
    try {
        const evResponse = await fetch('/api/events');
        const evJson = await evResponse.json();
        currentEvent = evJson.data.find(e => e.id === eventId);
        
        if (!currentEvent) {
            showError('Event tidak ditemukan.');
            return;
        }

        document.getElementById('checkoutContent').style.display = 'grid';
        
        const d = new Date(currentEvent.date);
        document.getElementById('evName').innerText = currentEvent.name;
        document.getElementById('evDetails').innerHTML = `📍 ${currentEvent.location} &nbsp;|&nbsp; 📅 ${d.toLocaleDateString('id-ID')} ${d.toLocaleTimeString('id-ID')}`;

        const catResponse = await fetch(`/api/events/${eventId}/categories`);
        const catJson = await catResponse.json();
        const categories = catJson.data || [];
        
        const catContainer = document.getElementById('categoriesList');
        
        if (categories.length === 0) {
            catContainer.innerHTML = '<p>Tidak ada tiket tersedia.</p>';
            return;
        }

        let catHtml = '';
        categories.forEach(cat => {
            const sisa = cat.quota - (cat.booked || 0);
            catHtml += `
                <div class="ticket-cat-card" data-id="${cat.id}" data-price="${cat.price}">
                    <div>
                        <h4 style="margin-bottom: 0.25rem;">${cat.name}</h4>
                        <span style="font-size: 0.75rem; color: ${sisa > 0 ? 'var(--secondary)' : 'var(--danger)'};">Sisa: ${sisa} tiket</span>
                    </div>
                    <div style="font-weight: bold; color: var(--primary);">
                        ${formatCurrency(cat.price)}
                    </div>
                </div>
            `;
        });
        catContainer.innerHTML = catHtml;

        document.querySelectorAll('.ticket-cat-card').forEach(card => {
            card.addEventListener('click', () => {
                document.querySelectorAll('.ticket-cat-card').forEach(c => c.classList.remove('selected'));
                card.classList.add('selected');
                selectedCategory = {
                    id: card.getAttribute('data-id'),
                    name: card.querySelector('h4').innerText,
                    price: parseFloat(card.getAttribute('data-price'))
                };
                calculateTotal();
            });
        });


        document.getElementById('ticketQty').addEventListener('input', calculateTotal);
        document.getElementById('btnApplyPromo').addEventListener('click', applyPromo);
        document.getElementById('btnPay').addEventListener('click', processPayment);
    } catch (err) {
        showError('Gagal memuat data dari server.');
    }
}

async function applyPromo() {
    const code = document.getElementById('promoCode').value.trim();
    const msg = document.getElementById('promoMsg');
    
    if (!code) {
        appliedPromo = null;
        msg.innerText = '';
        calculateTotal();
        return;
    }

    try {
        const response = await fetch('/api/promotions');
        const json = await response.json();
        const promos = json.data || [];
        const promo = promos.find(p => p.promo_code === code);

        if (!promo) {
            msg.style.color = 'var(--danger)';
            msg.innerText = `Promotion dengan kode ${code} tidak ditemukan.`;
            appliedPromo = null;
        } else {
            // Hapus validasi frontend agar trigger database yang bekerja saat Checkout!
            msg.style.color = 'var(--secondary)';
            msg.innerText = `Promo ${promo.discount_type} diterapkan!`;
            appliedPromo = promo;
        }
    } catch (err) {
        msg.style.color = 'var(--danger)';
        msg.innerText = 'Gagal mengecek promo.';
        appliedPromo = null;
    }
    calculateTotal();
}

function calculateTotal() {
    if (!selectedCategory) return;

    const qty = parseInt(document.getElementById('ticketQty').value) || 1;
    let subtotal = selectedCategory.price * qty;
    let discount = 0;

    if (appliedPromo) {
        if (appliedPromo.discount_type === 'PERCENTAGE') {
            discount = subtotal * (appliedPromo.discount_value / 100);
        } else {
            discount = appliedPromo.discount_value;
        }
        if (discount > subtotal) discount = subtotal;
    }

    const serviceFee = 5000;
    const total = subtotal - discount + serviceFee;

    document.getElementById('sumCatName').innerText = selectedCategory.name;
    document.getElementById('sumCatPrice').innerText = formatCurrency(selectedCategory.price);
    document.getElementById('sumQty').innerText = `x${qty}`;
    
    if (discount > 0) {
        document.getElementById('sumDiscountRow').style.display = 'flex';
        document.getElementById('sumDiscountVal').innerText = `-${formatCurrency(discount)}`;
    } else {
        document.getElementById('sumDiscountRow').style.display = 'none';
    }
    
    document.getElementById('sumTotal').innerText = formatCurrency(total);
}

async function processPayment() {
    const errorDiv = document.getElementById('errorMsg');
    errorDiv.classList.add('d-none');

    if (!selectedCategory) {
        errorDiv.innerText = 'Silakan pilih kategori tiket terlebih dahulu.';
        errorDiv.classList.remove('d-none');
        return;
    }

    let qty = parseInt(document.getElementById('ticketQty').value);
    if (isNaN(qty) || qty < 1 || qty > 10) {
        errorDiv.innerText = 'Jumlah tiket harus antara 1 sampai 10.';
        errorDiv.classList.remove('d-none');
        return;
    }

    const user = getCurrentUser();
    
    const payload = {
        category_id: selectedCategory.id,
        qty: qty,
        promo_code: appliedPromo ? appliedPromo.promo_code : null,
        userId: user.id
    };

    try {
        document.getElementById('btnPay').disabled = true;
        document.getElementById('btnPay').innerText = 'Memproses...';

        const response = await fetch('/api/orders', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        
        const result = await response.json();
        
        if (result.success) {
            alert('Pemesanan berhasil dibuat! Silakan lunasi pembayaran.');
            window.location.href = 'orders.html';
        } else {
            errorDiv.innerText = result.message || 'Gagal memproses pembayaran.';
            errorDiv.classList.remove('d-none');
            document.getElementById('btnPay').disabled = false;
            document.getElementById('btnPay').innerText = 'Bayar Sekarang';
        }
    } catch (err) {
        errorDiv.innerText = 'Terjadi kesalahan pada server saat memproses pesanan.';
        errorDiv.classList.remove('d-none');
        document.getElementById('btnPay').disabled = false;
        document.getElementById('btnPay').innerText = 'Bayar Sekarang';
    }
}
