document.addEventListener('DOMContentLoaded', () => {
    requireLogin();
    
    loadDashboardStats();
    loadProfileData();

    document.getElementById('profileForm').addEventListener('submit', handleProfileUpdate);
    document.getElementById('passwordForm').addEventListener('submit', handlePasswordUpdate);

    const btnEdit = document.getElementById('btnEditMode');
    if (btnEdit) {
        btnEdit.addEventListener('click', toggleEditMode);
    }
});

let isEditMode = false;

function toggleEditMode() {
    const user = getCurrentUser();
    if (user.role === 'Admin') return alert('Admin tidak dapat mengubah profil.');
    
    isEditMode = !isEditMode;
    const btnEdit = document.getElementById('btnEditMode');
    const btnUpdate = document.getElementById('btnUpdateProfile');
    
    if (isEditMode) {
        btnEdit.innerText = 'Batal Edit';
        btnEdit.classList.replace('btn-secondary', 'btn-danger');
        btnUpdate.classList.remove('d-none');
        
        if (user.role === 'Organizer') {
            document.getElementById('profFullName').disabled = false;
            document.getElementById('profEmail').disabled = false;
        } else if (user.role === 'Customer') {
            document.getElementById('profFullName').disabled = false;
            document.getElementById('profPhone').disabled = false;
        }
    } else {
        btnEdit.innerText = 'Edit';
        btnEdit.classList.replace('btn-danger', 'btn-secondary');
        btnUpdate.classList.add('d-none');
        loadProfileData(); 
    }
}

function loadDashboardStats() {
    const user = getCurrentUser();
    const statsContainer = document.getElementById('dashboardStats');
    const extraContainer = document.getElementById('extraDashboardContent');
    const pageTitle = document.querySelector('.page-title');
    if (pageTitle) pageTitle.innerText = `Dashboard ${user.role}`;
    let html = '';

    if (user.role === 'Admin') {
        document.getElementById('btnLogoutTop').style.display = 'block';
        html += `
            <div class="stat-card"><h3>240</h3><p>Total Pengguna</p></div>
            <div class="stat-card"><h3>18</h3><p>Total Event</p></div>
            <div class="stat-card"><h3 style="font-size:1.5rem; margin-top:0.5rem; color:var(--secondary)">Rp 150.000.000</h3><p>Total Revenue</p></div>
            <div class="stat-card"><h3>85%</h3><p>Statistik Aktivitas</p></div>
        `;
    } else if (user.role === 'Organizer') {
        document.getElementById('btnLogoutTop').style.display = 'block';
        html += `
            <div class="stat-card"><h3>3</h3><p>Jumlah Event</p></div>
            <div class="stat-card"><h3>120</h3><p>Tiket Terjual</p></div>
            <div class="stat-card"><h3 style="font-size:1.5rem; margin-top:0.5rem; color:var(--secondary)">Rp 45.000.000</h3><p>Pendapatan</p></div>
        `;
        extraContainer.innerHTML = `
            <div class="card">
                <h3>Event Sedang Berjalan & Akan Datang</h3>
                <table class="table">
                    <thead><tr><th>Nama Event</th><th>Tanggal</th><th>Status</th></tr></thead>
                    <tbody><tr><td colspan="3" style="text-align:center;">Belum ada event</td></tr></tbody>
                </table>
            </div>
        `;
    } else if (user.role === 'Customer') {
        html += `
            <div class="stat-card"><h3>2</h3><p>Jumlah Tiket</p></div>
            <div class="stat-card"><h3>1</h3><p>Event Diikuti</p></div>
        `;
        extraContainer.innerHTML = `
            <div class="card">
                <h3>Riwayat Pembelian Tiket</h3>
                <table class="table">
                    <thead><tr><th>ID Order</th><th>Event</th><th>Status</th></tr></thead>
                    <tbody><tr><td colspan="3" style="text-align:center;">Belum ada riwayat</td></tr></tbody>
                </table>
            </div>
        `;
    }

    statsContainer.innerHTML = html;
}

function loadProfileData() {
    const user = getCurrentUser();
    
    document.getElementById('profRole').value = user.role;
    document.getElementById('profUsername').value = user.username;
    document.getElementById('profFullName').value = user.fullName;
    document.getElementById('profEmail').value = user.email;
    document.getElementById('profPhone').value = user.phone;

    document.getElementById('profFullName').disabled = true;
    document.getElementById('profEmail').disabled = true;
    document.getElementById('profPhone').disabled = true;

    if (user.role === 'Admin') {
        document.getElementById('btnEditMode').style.display = 'none';
    } else if (user.role === 'Organizer') {
        document.getElementById('lblProfName').innerText = 'Nama Penyelenggara';
    } else if (user.role === 'Customer') {
        document.getElementById('lblProfName').innerText = 'Nama Lengkap';
    }
}

function handleProfileUpdate(e) {
    e.preventDefault();
    const user = getCurrentUser();
    const role = user.role;

    if (role === 'Organizer') {
        user.fullName = document.getElementById('profFullName').value.trim();
        user.email = document.getElementById('profEmail').value.trim();
    } else if (role === 'Customer') {
        user.fullName = document.getElementById('profFullName').value.trim();
        user.phone = document.getElementById('profPhone').value.trim();
    }

    const users = getTable('users');
    const index = users.findIndex(u => u.id === user.id);
    users[index] = user;
    saveTable('users', users);

    const msg = document.getElementById('profileSuccess');
    msg.innerText = 'Profil berhasil diperbarui!';
    msg.classList.remove('d-none');
    setTimeout(() => msg.classList.add('d-none'), 3000);
    
    toggleEditMode();
}

function handlePasswordUpdate(e) {
    e.preventDefault();
    const user = getCurrentUser();
    const oldPass = document.getElementById('oldPassword').value;
    const newPass = document.getElementById('newPassword').value;
    const confPass = document.getElementById('confirmNewPassword').value;
    const err = document.getElementById('pwdError');
    const succ = document.getElementById('pwdSuccess');
    
    err.classList.add('d-none');
    succ.classList.add('d-none');

    if (user.password !== oldPass) {
        err.innerText = 'Password Lama tidak sesuai.';
        err.classList.remove('d-none');
        return;
    }

    if (newPass !== confPass) {
        err.innerText = 'Konfirmasi Password Baru tidak cocok.';
        err.classList.remove('d-none');
        return;
    }

    user.password = newPass;
    const users = getTable('users');
    const index = users.findIndex(u => u.id === user.id);
    users[index] = user;
    saveTable('users', users);

    document.getElementById('passwordForm').reset();
    
    succ.innerText = 'Password berhasil diubah!';
    succ.classList.remove('d-none');
    setTimeout(() => {
        succ.classList.add('d-none');
        closeModal('passwordModal');
    }, 2000);
}

function openModal(id) { document.getElementById(id).classList.add('show'); }
function closeModal(id) { document.getElementById(id).classList.remove('show'); }
