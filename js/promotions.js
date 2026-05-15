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

function renderPromos() {
    const user = getCurrentUser();
    let promos = getTable('promotions');

    const search = document.getElementById('searchPromo').value.toLowerCase();
    const type = document.getElementById('filterType').value;

    if (search) promos = promos.filter(p => p.promo_code.toLowerCase().includes(search));
    if (type) promos = promos.filter(p => p.discount_type === type);

    const order_promotions = getTable('order_promotions') || [];
    const getUsedCount = (promoId) => order_promotions.filter(op => op.promotion_id === promoId).length;

    const totalPromo = promos.length;
    const totalUsed = promos.reduce((sum, p) => sum + getUsedCount(p.promotion_id), 0);
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

            html += `<tr>
                <td style="font-weight: bold;">${p.promo_code}</td>
                <td>${typeBadge}</td>
                <td>${valStr}</td>
                <td>${p.start_date}</td>
                <td>${p.end_date}</td>
                <td>${getUsedCount(p.promotion_id)} / ${p.usage_limit}</td>
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

function openEditModal(id) {
    const p = getTable('promotions').find(x => x.promotion_id === id);
    if (!p) return;

    document.getElementById('formAction').value = 'update';
    document.getElementById('promoId').value = p.promotion_id;
    document.getElementById('pCode').value = p.promo_code;
    document.getElementById('pType').value = p.discount_type;
    document.getElementById('pValue').value = p.discount_value;
    document.getElementById('pStart').value = p.start_date;
    document.getElementById('pEnd').value = p.end_date;
    document.getElementById('pLimit').value = p.usage_limit;
    
    document.getElementById('modalTitle').innerText = 'Edit Promo';
    document.getElementById('btnSubmitPromo').innerText = 'Simpan';
    document.getElementById('promoError').classList.add('d-none');
    document.getElementById('promoModal').classList.add('show');
}

function handlePromoSubmit(e) {
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

    let promos = getTable('promotions');
    
    const existing = promos.find(p => p.promo_code.toLowerCase() === code.toLowerCase() && p.promotion_id !== id);
    if (existing) {
        err.innerText = 'Kode promo ini sudah digunakan.';
        err.classList.remove('d-none');
        return;
    }

    if (action === 'create') {
        promos.push({
            promotion_id: generateUUID(),
            promo_code: code,
            discount_type: type,
            discount_value: value,
            start_date: start,
            end_date: end,
            usage_limit: limit
        });
    } else {
        const idx = promos.findIndex(p => p.promotion_id === id);
        if (idx !== -1) {
            promos[idx].promo_code = code;
            promos[idx].discount_type = type;
            promos[idx].discount_value = value;
            promos[idx].start_date = start;
            promos[idx].end_date = end;
            promos[idx].usage_limit = limit;
        }
    }

    saveTable('promotions', promos);
    closeModal('promoModal');
    renderPromos();
    alert(action === 'create' ? 'Promo berhasil dibuat!' : 'Promo berhasil diperbarui!');
}

function openDeleteModal(id) {
    document.getElementById('delPromoId').value = id;
    document.getElementById('deletePromoModal').classList.add('show');
}

function executeDeletePromo() {
    const id = document.getElementById('delPromoId').value;
    let promos = getTable('promotions');
    promos = promos.filter(p => p.promotion_id !== id);
    saveTable('promotions', promos);
    closeModal('deletePromoModal');
    renderPromos();
}

function closeModal(id) {
    document.getElementById(id).classList.remove('show');
}
