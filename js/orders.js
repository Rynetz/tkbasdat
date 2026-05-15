document.addEventListener('DOMContentLoaded', () => {
    requireLogin();
    
    document.getElementById('searchOrderId').addEventListener('input', renderOrders);
    document.getElementById('filterStatus').addEventListener('change', renderOrders);
    
    document.getElementById('updateForm').addEventListener('submit', executeUpdateOrder);

    renderOrders();
});

function getFilteredOrders() {
    const user = getCurrentUser();
    let orders = getTable('orders');

    if (user.role === 'Organizer') {
        const events = getTable('events').filter(e => e.organizerId === user.id).map(e => e.id);
        orders = orders.filter(o => events.includes(o.event_id));
    } else if (user.role === 'Customer') {
        orders = orders.filter(o => o.customer_id === user.id);
    }

    const search = document.getElementById('searchOrderId').value.toLowerCase();
    const status = document.getElementById('filterStatus').value;

    if (search) orders = orders.filter(o => o.order_id.toLowerCase().includes(search));
    if (status) orders = orders.filter(o => o.payment_status === status);

    orders.sort((a, b) => new Date(b.order_date) - new Date(a.order_date));

    return orders;
}

function renderOrders() {
    const user = getCurrentUser();
    const orders = getFilteredOrders();
    
    let total = orders.length;
    let lunas = orders.filter(o => o.payment_status === 'Lunas').length;
    let pending = orders.filter(o => o.payment_status === 'Pending').length;
    
    let statsHtml = `
        <div class="card feature-card"><h3>${total}</h3><p>TOTAL ORDER</p></div>
        <div class="card feature-card"><h3>${lunas}</h3><p>LUNAS</p></div>
        <div class="card feature-card"><h3>${pending}</h3><p>PENDING</p></div>
    `;

    if (user.role === 'Admin' || user.role === 'Organizer') {
        let revenue = orders.filter(o => o.payment_status === 'Lunas').reduce((sum, o) => sum + o.total_amount, 0);
        statsHtml += `<div class="card feature-card"><h3 style="color: var(--secondary)">${formatCurrency(revenue)}</h3><p>TOTAL REVENUE</p></div>`;
        document.getElementById('thPelanggan').style.display = 'table-cell';
    } else {
        document.getElementById('thPelanggan').style.display = 'none';
    }

    if (user.role === 'Admin') {
        document.getElementById('thAction').style.display = 'table-cell';
    } else {
        document.getElementById('thAction').style.display = 'none';
    }

    document.getElementById('orderStats').innerHTML = statsHtml;

    const tbody = document.getElementById('ordersTbody');
    let html = '';

    if (orders.length === 0) {
        html = `<tr><td colspan="6" style="text-align:center;">Tidak ada data order ditemukan.</td></tr>`;
    } else {
        orders.forEach(o => {
            const d = new Date(o.order_date);
            const dateStr = d.toLocaleDateString('id-ID') + ' ' + d.toLocaleTimeString('id-ID', {hour:'2-digit', minute:'2-digit'});
            
            let statusBadge = '';
            if (o.payment_status === 'Lunas') statusBadge = `<span style="background: #e6f4ea; color: #1e8e3e; padding: 0.25rem 0.5rem; border-radius: 4px; font-size: 0.75rem; font-weight: bold;">LUNAS</span>`;
            else if (o.payment_status === 'Pending') statusBadge = `<span style="background: #fef7e0; color: #f29900; padding: 0.25rem 0.5rem; border-radius: 4px; font-size: 0.75rem; font-weight: bold;">PENDING</span>`;
            else statusBadge = `<span style="background: #fce8e6; color: #d93025; padding: 0.25rem 0.5rem; border-radius: 4px; font-size: 0.75rem; font-weight: bold;">DIBATALKAN</span>`;

            html += `<tr>
                <td style="font-family: monospace; font-size: 0.875rem;">${o.order_id.split('-')[0]}...</td>
                <td>${dateStr}</td>
            `;

            if (user.role === 'Admin' || user.role === 'Organizer') {
                html += `<td>${o.customerName || '-'}</td>`;
            }

            html += `
                <td>${statusBadge}</td>
                <td style="font-weight: bold;">${formatCurrency(o.total_amount)}</td>
            `;

            if (user.role === 'Admin') {
                html += `
                    <td style="text-align: right;">
                        <button onclick="openUpdateModal('${o.order_id}', '${o.payment_status}')" style="background:none; border:none; cursor:pointer; color: var(--primary); margin-right: 0.5rem;" title="Edit">✏️</button>
                        <button onclick="openDeleteModal('${o.order_id}')" style="background:none; border:none; cursor:pointer; color: var(--danger);" title="Hapus">🗑️</button>
                    </td>
                `;
            }
            html += `</tr>`;
        });
    }
    tbody.innerHTML = html;
}

function openUpdateModal(id, currentStatus) {
    document.getElementById('updOrderId').value = id;
    document.getElementById('updOrderDisplay').value = id;
    document.getElementById('updStatus').value = currentStatus;
    document.getElementById('updateModal').classList.add('show');
}

function executeUpdateOrder(e) {
    e.preventDefault();
    const id = document.getElementById('updOrderId').value;
    const status = document.getElementById('updStatus').value;

    const orders = getTable('orders');
    const idx = orders.findIndex(o => o.order_id === id);
    if (idx !== -1) {
        orders[idx].payment_status = status;
        saveTable('orders', orders);
        closeModal('updateModal');
        renderOrders();
        alert('Status order berhasil diperbarui.');
    }
}

function openDeleteModal(id) {
    document.getElementById('delOrderId').value = id;
    document.getElementById('deleteModal').classList.add('show');
}

function executeDeleteOrder() {
    const id = document.getElementById('delOrderId').value;
    let orders = getTable('orders');
    orders = orders.filter(o => o.order_id !== id);
    saveTable('orders', orders);
    closeModal('deleteModal');
    renderOrders();
}

function closeModal(id) {
    document.getElementById(id).classList.remove('show');
}
