document.addEventListener('DOMContentLoaded', () => {
    const user = getCurrentUser();
    
    document.getElementById('searchPromo').addEventListener('input', renderPromos);
    document.getElementById('filterType').addEventListener('change', renderPromos);
    
    document.getElementById('promoForm').addEventListener('submit', handlePromoSubmit);

    if (user && user.role === 'Admin') {
        const btnCreate = document.getElementById('btnCreatePromo');
        btnCreate.style.display = 'block';
        btnCreate.addEventListener('click', openCreateModal);
        document.getElementById('thAction').style.display = 'table-cell';
    }

    renderPromos();
});

async function renderPromos() {
    const user = getCurrentUser();
    let promos = [];
    
    try {
        const response = await fetch('/api/promotions');
        const json = await response.json();
        if (json.success) promos = json.data;
    } catch (error) {
        console.error('Failed to fetch promotions:', error);
    }

    const search = document.getElementById('searchPromo').value.toLowerCase();
    const type = document.getElementById('filterType').value;

    if (search) promos = promos.filter(p => p.promo_code.toLowerCase().includes(search));
    if (type) promos = promos.filter(p => p.discount_type === type);

    const getUsedCount = (p) => parseInt(p.used_count) || 0;

    const totalPromo = promos.length;
    const totalUsed = promos.reduce((sum, p) => sum + getUsedCount(p), 0);
    const totalPercent = promos.filter(p => p.discount_type === 'PERCENTAGE').length;

    document.getElementById('promoStats').innerHTML = `
        <div class="card feature-card"><h3>${totalPromo}</h3><p>TOTAL PROMO</p></div>
        <div class="card feature-card"><h3>${totalUsed}</h3><p>TOTAL PENGGUNAAN</p></div>
        <div class="card feature-card"><h3>${totalPercent}</h3><p>TIPE PERSENTASE</p></div>
    `;

    const tbody = document.getElementById('promoTbody');
    let html = '';

    if (promos.length === 0) {
        html = `<tr><td colspan="7" style="text-align:center;">Tidak ada data promo ditemukan.</td></tr>`;
    } else {
        promos.forEach(p => {
            const badgeColor = p.discount_type === 'PERCENTAGE' ? '#e8f0fe; color: var(--primary)' : '#fce8e6; color: var(--danger)';
            const typeBadge = `<span style="background: ${badgeColor}; padding: 0.25rem 0.5rem; border-radius: 4px; font-size: 0.75rem; font-weight: bold;">${p.discount_type.toUpperCase()}</span>`;
            
            let valStr = p.discount_type === 'PERCENTAGE' ? `${p.discount_value}%` : formatCurrency(p.discount_value);

            // Backend returns start_date and end_date as ISO string or date object
            const startDate = p.start_date.split('T')[0];
            const endDate = p.end_date.split('T')[0];

            html += `<tr>
                <td style="font-weight: bold;">${p.promo_code}</td>
                <td>${typeBadge}</td>
                <td>${valStr}</td>
                <td>${startDate}</td>
                <td>${endDate}</td>
                <td>${getUsedCount(p)} / ${p.usage_limit}</td>
            `;

            if (user && user.role === 'Admin') {
                html += `
                    <td style="text-align: right;">
                        <button onclick="openEditModal('${p.promotion_id}')" style="background:none; border:none; cursor:pointer; color: var(--primary); margin-right: 0.5rem;" title="Edit">✏️</button>
                        <button onclick="openDeleteModal('${p.promotion_id}')" style="background:none; border:none; cursor:pointer; color: var(--danger);" title="Hapus">🗑️</button>
                    </td>
                `;
            }
            html += `</tr>`;
        });
    }
    tbody.innerHTML = html;
}

function openCreateModal() {
    document.getElementById('formAction').value = 'create';
    document.getElementById('promoId').value = '';
    document.getElementById('promoForm').reset();
    document.getElementById('modalTitle').innerText = 'Buat Promo Baru';
    document.getElementById('btnSubmitPromo').innerText = 'Buat';
    document.getElementById('promoError').classList.add('d-none');
    document.getElementById('promoModal').classList.add('show');
}

async function openEditModal(id) {
    try {
        const response = await fetch('/api/promotions');
        const json = await response.json();
        const p = json.data.find(x => x.promotion_id === id);
        if (!p) return;

        document.getElementById('formAction').value = 'update';
        document.getElementById('promoId').value = p.promotion_id;
        document.getElementById('pCode').value = p.promo_code;
        document.getElementById('pType').value = p.discount_type;
        document.getElementById('pValue').value = p.discount_value;
        document.getElementById('pStart').value = p.start_date.split('T')[0];
        document.getElementById('pEnd').value = p.end_date.split('T')[0];
        document.getElementById('pLimit').value = p.usage_limit;
        
        document.getElementById('modalTitle').innerText = 'Edit Promo';
        document.getElementById('btnSubmitPromo').innerText = 'Simpan';
        document.getElementById('promoError').classList.add('d-none');
        document.getElementById('promoModal').classList.add('show');
    } catch (err) {
        console.error(err);
    }
}

async function handlePromoSubmit(e) {
    e.preventDefault();
    const action = document.getElementById('formAction').value;
    const id = document.getElementById('promoId').value;
    const code = document.getElementById('pCode').value.trim();
    const type = document.getElementById('pType').value;
    const value = parseFloat(document.getElementById('pValue').value);
    const start = document.getElementById('pStart').value;
    const end = document.getElementById('pEnd').value;
    const limit = parseInt(document.getElementById('pLimit').value);
    
    const err = document.getElementById('promoError');
    err.classList.add('d-none');

    if (value <= 0) {
        err.innerText = 'Nilai diskon harus lebih besar dari 0.';
        err.classList.remove('d-none');
        return;
    }
    if (limit <= 0) {
        err.innerText = 'Batas penggunaan harus lebih besar dari 0.';
        err.classList.remove('d-none');
        return;
    }
    if (new Date(end) < new Date(start)) {
        err.innerText = 'Tanggal Berakhir tidak boleh sebelum Tanggal Mulai.';
        err.classList.remove('d-none');
        return;
    }

    const payload = {
        promo_code: code,
        discount_type: type,
        discount_value: value,
        start_date: start,
        end_date: end,
        usage_limit: limit
    };

    try {
        let response;
        if (action === 'create') {
            response = await fetch('/api/promotions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
        } else {
            response = await fetch(`/api/promotions/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
        }

        const result = await response.json();
        if (result.success) {
            closeModal('promoModal');
            renderPromos();
            alert(action === 'create' ? 'Promo berhasil dibuat!' : 'Promo berhasil diperbarui!');
        } else {
            err.innerText = result.message || 'Gagal menyimpan promosi.';
            err.classList.remove('d-none');
        }
    } catch (error) {
        err.innerText = 'Terjadi kesalahan pada server.';
        err.classList.remove('d-none');
    }
}

function openDeleteModal(id) {
    document.getElementById('delPromoId').value = id;
    document.getElementById('deletePromoModal').classList.add('show');
}

async function executeDeletePromo() {
    const id = document.getElementById('delPromoId').value;
    try {
        const response = await fetch(`/api/promotions/${id}`, { method: 'DELETE' });
        const result = await response.json();
        if (result.success) {
            closeModal('deletePromoModal');
            renderPromos();
        } else {
            alert(result.message || 'Gagal menghapus promosi.');
        }
    } catch (error) {
        alert('Terjadi kesalahan pada server.');
    }
}

function closeModal(id) {
    document.getElementById(id).classList.remove('show');
}
