document.addEventListener('DOMContentLoaded', () => {
    requireLogin();
    
    document.getElementById('searchOrderId').addEventListener('input', renderOrders);
    document.getElementById('filterStatus').addEventListener('change', renderOrders);
    
    document.getElementById('updateForm').addEventListener('submit', executeUpdateOrder);

    renderOrders();
});

async function getFilteredOrders() {
    const user = getCurrentUser();
    let orders = [];
    
    try {
        const response = await fetch('/api/orders');
        const json = await response.json();
        if (json.success) orders = json.data;
    } catch (err) {
        console.error(err);
    }

    if (user.role === 'Organizer') {
        orders = orders.filter(o => o.organizerUserId === user.id);
    } else if (user.role === 'Customer') {
        orders = orders.filter(o => o.customerUserId === user.id);
    }

    const search = document.getElementById('searchOrderId').value.toLowerCase();
    const status = document.getElementById('filterStatus').value;

    if (search) orders = orders.filter(o => o.id.toLowerCase().includes(search));
    if (status) orders = orders.filter(o => o.status === status);

    orders.sort((a, b) => new Date(b.date) - new Date(a.date));

    return orders;
}

async function renderOrders() {
    const user = getCurrentUser();
    const orders = await getFilteredOrders();
    
    let total = orders.length;
    let lunas = orders.filter(o => o.status === 'Lunas').length;
    let pending = orders.filter(o => o.status === 'Pending').length;
    
    let statsHtml = `
        <div class="card feature-card"><h3>${total}</h3><p>TOTAL ORDER</p></div>
        <div class="card feature-card"><h3>${lunas}</h3><p>LUNAS</p></div>
        <div class="card feature-card"><h3>${pending}</h3><p>PENDING</p></div>
    `;

    if (user.role === 'Admin' || user.role === 'Organizer') {
        let revenue = orders.filter(o => o.status === 'Lunas').reduce((sum, o) => sum + parseFloat(o.amount), 0);
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
            const d = new Date(o.date);
            const dateStr = d.toLocaleDateString('id-ID') + ' ' + d.toLocaleTimeString('id-ID', {hour:'2-digit', minute:'2-digit'});
            
            let statusBadge = '';
            if (o.status === 'Lunas') statusBadge = `<span style="background: #e6f4ea; color: #1e8e3e; padding: 0.25rem 0.5rem; border-radius: 4px; font-size: 0.75rem; font-weight: bold;">LUNAS</span>`;
            else if (o.status === 'Pending') statusBadge = `<span style="background: #fef7e0; color: #f29900; padding: 0.25rem 0.5rem; border-radius: 4px; font-size: 0.75rem; font-weight: bold;">PENDING</span>`;
            else statusBadge = `<span style="background: #fce8e6; color: #d93025; padding: 0.25rem 0.5rem; border-radius: 4px; font-size: 0.75rem; font-weight: bold;">DIBATALKAN</span>`;

            html += `<tr>
                <td style="font-family: monospace; font-size: 0.875rem;">${o.id.split('-')[0]}...</td>
                <td>${dateStr}</td>
            `;

            if (user.role === 'Admin' || user.role === 'Organizer') {
                html += `<td>${o.customerName || '-'}</td>`;
            }

            html += `
                <td>${statusBadge}</td>
                <td style="font-weight: bold;">${formatCurrency(parseFloat(o.amount))}</td>
            `;

            if (user.role === 'Admin') {
                html += `
                    <td style="text-align: right;">
                        <button onclick="openUpdateModal('${o.id}', '${o.status}')" style="background:none; border:none; cursor:pointer; color: var(--primary); margin-right: 0.5rem;" title="Edit">✏️</button>
                        <button onclick="openDeleteModal('${o.id}')" style="background:none; border:none; cursor:pointer; color: var(--danger);" title="Hapus">🗑️</button>
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

async function executeUpdateOrder(e) {
    e.preventDefault();
    const id = document.getElementById('updOrderId').value;
    const status = document.getElementById('updStatus').value;

    try {
        const response = await fetch(`/api/orders/${id}/status`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status })
        });
        const result = await response.json();
        
        if (result.success) {
            closeModal('updateModal');
            renderOrders();
            alert('Status order berhasil diperbarui.');
        } else {
            alert(result.message || 'Gagal update status order.');
        }
    } catch (err) {
        alert('Terjadi kesalahan pada server.');
    }
}

function openDeleteModal(id) {
    document.getElementById('delOrderId').value = id;
    document.getElementById('deleteModal').classList.add('show');
}

async function executeDeleteOrder() {
    const id = document.getElementById('delOrderId').value;
    try {
        const response = await fetch(`/api/orders/${id}`, { method: 'DELETE' });
        const result = await response.json();
        
        if (result.success) {
            closeModal('deleteModal');
            renderOrders();
        } else {
            alert(result.message || 'Gagal menghapus order.');
        }
    } catch (err) {
        alert('Terjadi kesalahan pada server.');
    }
}

function closeModal(id) {
    document.getElementById(id).classList.remove('show');
}
