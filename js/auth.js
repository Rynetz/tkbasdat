document.addEventListener('DOMContentLoaded', () => {
    if (getCurrentUser()) {
        window.location.href = 'profile.html';
        return;
    }

    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }

    const registerForm = document.getElementById('registerForm');
    if (registerForm) {
        registerForm.addEventListener('submit', handleRegister);
        document.querySelectorAll('.role-tab').forEach(tab => {
            tab.addEventListener('click', (e) => {
                document.querySelectorAll('.role-tab').forEach(t => t.classList.remove('active'));
                e.target.classList.add('active');
                const role = e.target.getAttribute('data-role');
                document.getElementById('regRole').value = role;
                updateRegisterForm(role);
            });
        });
    }
});

function handleLogin(e) {
    e.preventDefault();
    const loginUsername = document.getElementById('loginUsername').value.trim();
    const password = document.getElementById('loginPassword').value;
    const errorDiv = document.getElementById('loginError');

    if (!loginUsername || !password) {
        errorDiv.innerText = 'Username dan Password wajib diisi.';
        errorDiv.classList.remove('d-none');
        return;
    }

    const users = getTable('users');
    const user = users.find(u => u.username === loginUsername && u.password === password);

    if (user) {
        localStorage.setItem('session_user', user.id);
        window.location.href = 'profile.html'; 
    } else {
        errorDiv.innerText = 'Username atau Password salah.';
        errorDiv.classList.remove('d-none');
    }
}

function updateRegisterForm(role) {
    const groupFullName = document.getElementById('groupFullName');
    const groupEmail = document.getElementById('groupEmail');
    const groupPhone = document.getElementById('groupPhone');
    const lblFullName = document.getElementById('lblFullName');

    document.getElementById('regFullName').required = true;
    document.getElementById('regEmail').required = true;
    document.getElementById('regPhone').required = true;

    if (role === 'Admin') {
        groupFullName.classList.add('d-none');
        groupEmail.classList.add('d-none');
        groupPhone.classList.add('d-none');
        document.getElementById('regFullName').required = false;
        document.getElementById('regEmail').required = false;
        document.getElementById('regPhone').required = false;
    } else if (role === 'Organizer') {
        groupFullName.classList.remove('d-none');
        groupEmail.classList.remove('d-none');
        groupPhone.classList.remove('d-none');
        lblFullName.innerText = 'Nama Lengkap';
    } else if (role === 'Customer') {
        groupFullName.classList.remove('d-none');
        groupEmail.classList.remove('d-none');
        groupPhone.classList.remove('d-none');
        lblFullName.innerText = 'Nama Lengkap';
    }
}

function handleRegister(e) {
    e.preventDefault();
    const errorDiv = document.getElementById('registerError');
    errorDiv.classList.add('d-none');

    const role = document.getElementById('regRole').value;
    const username = document.getElementById('regUsername').value.trim();
    const password = document.getElementById('regPassword').value;
    const confirm = document.getElementById('regConfirm').value;
    const terms = document.getElementById('regTerms').checked;
    
    if (!terms) {
        errorDiv.innerText = 'Anda harus menyetujui Syarat & Ketentuan.';
        errorDiv.classList.remove('d-none');
        return;
    }

    let fullName = '';
    let email = '';
    let phone = '';

    if (role !== 'Admin') {
        fullName = document.getElementById('regFullName').value.trim();
        email = document.getElementById('regEmail').value.trim();
        phone = document.getElementById('regPhone').value.trim();
    }

    if (password !== confirm) {
        errorDiv.innerText = 'Konfirmasi Password tidak cocok.';
        errorDiv.classList.remove('d-none');
        return;
    }

    const users = getTable('users');
    if (users.find(u => u.username === username)) {
        errorDiv.innerText = 'Username sudah terdaftar.';
        errorDiv.classList.remove('d-none');
        return;
    }
    
    if (role !== 'Admin' && users.find(u => u.email === email && u.email !== '')) {
        errorDiv.innerText = 'Email sudah terdaftar.';
        errorDiv.classList.remove('d-none');
        return;
    }

    const newUser = {
        id: generateUUID(),
        role: role,
        username: username,
        password: password,
        fullName: fullName || '-',
        email: email || '-',
        phone: phone || '-'
    };

    users.push(newUser);
    saveTable('users', users);

    alert('Registrasi berhasil! Silakan login.');
    window.location.href = 'login.html';
}
