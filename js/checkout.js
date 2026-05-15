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

function loadEventCheckout(eventId) {
    const events = getTable('events');
    currentEvent = events.find(e => e.id === eventId);
    
    if (!currentEvent) {
        showError('Event tidak ditemukan.');
        return;
    }

    document.getElementById('checkoutContent').style.display = 'grid';
    
    const d = new Date(currentEvent.date);
    document.getElementById('evName').innerText = currentEvent.name;
    document.getElementById('evDetails').innerHTML = `📍 ${currentEvent.location} &nbsp;|&nbsp; 📅 ${d.toLocaleDateString('id-ID')} ${d.toLocaleTimeString('id-ID')}`;

    const categories = getTable('categories').filter(c => c.eventId === eventId);
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

    if (currentEvent.hasReservedSeating) {
        document.getElementById('seatSelectionGroup').style.display = 'block';
        const seats = getTable('seats').filter(s => s.eventId === eventId && s.isAvailable);
        const seatSelect = document.getElementById('seatSelect');
        seats.forEach(seat => {
            const opt = document.createElement('option');
            opt.value = seat.id;
            opt.innerText = `Kursi ${seat.number}`;
            seatSelect.appendChild(opt);
        });
    }

    document.getElementById('ticketQty').addEventListener('input', calculateTotal);
    document.getElementById('btnApplyPromo').addEventListener('click', applyPromo);
    document.getElementById('btnPay').addEventListener('click', processPayment);
}

function applyPromo() {
    const code = document.getElementById('promoCode').value.trim();
    const msg = document.getElementById('promoMsg');
    
    if (!code) {
        appliedPromo = null;
        msg.innerText = '';
        calculateTotal();
        return;
    }

    const promos = getTable('promotions');
    const promo = promos.find(p => p.promo_code === code);

    if (!promo) {
        msg.style.color = 'var(--danger)';
        msg.innerText = 'Kode promo tidak valid.';
        appliedPromo = null;
    } else {
        const today = new Date().toISOString().split('T')[0];
        const order_promotions = getTable('order_promotions') || [];
        const usedCount = order_promotions.filter(op => op.promotion_id === promo.promotion_id).length;
        
        if (today < promo.start_date || today > promo.end_date) {
            msg.style.color = 'var(--danger)';
            msg.innerText = 'Promo sudah kadaluarsa atau belum aktif.';
            appliedPromo = null;
        } else if (usedCount >= promo.usage_limit) {
            msg.style.color = 'var(--danger)';
            msg.innerText = 'Kuota promo sudah habis.';
            appliedPromo = null;
        } else {
            msg.style.color = 'var(--secondary)';
            msg.innerText = `Promo ${promo.discount_type} berhasil diterapkan!`;
            appliedPromo = promo;
        }
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

function processPayment() {
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
    const finalAmount = subtotal - discount + serviceFee;

    const user = getCurrentUser();
    
    const newOrder = {
        order_id: generateUUID(),
        order_date: new Date().toISOString(),
        payment_status: 'Pending',
        total_amount: finalAmount,
        customer_id: user.id,
        event_id: currentEvent.id,
        customerName: user.fullName || user.username
    };

    const orders = getTable('orders');
    orders.push(newOrder);
    saveTable('orders', orders);
    
    if (appliedPromo) {
        const op = getTable('order_promotions') || [];
        op.push({
            order_promotion_id: generateUUID(),
            promotion_id: appliedPromo.promotion_id,
            order_id: newOrder.order_id
        });
        saveTable('order_promotions', op);
    }

    alert('Pemesanan berhasil dibuat! Silakan lunasi pembayaran.');
    window.location.href = 'orders.html';
}
