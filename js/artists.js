document.addEventListener("DOMContentLoaded", () => {
    // 1. STATE & DATA
    const currentUser = getCurrentUser();
    const userRole = currentUser ? currentUser.role : 'Guest'; 

    // Ambil data artis dari localStorage (sistem app.js). 
    // Jika kosong, masukkan 8 data dummy awal.
    let artists = getTable('artists');
    if (!artists || artists.length === 0) {
        artists = [
            { artist_id: 'e1111111-e111-e111-e111-e11111111111', name: 'Fourtwnty', genre: 'Indie Folk' },
            { artist_id: 'e2222222-e222-e222-e222-e22222222222', name: 'Hindia', genre: 'Indie Pop' },
            { artist_id: 'e3333333-e333-e333-e333-e33333333333', name: 'Tulus', genre: 'Pop' },
            { artist_id: 'e4444444-e444-e444-e444-e44444444444', name: 'Nadin Amizah', genre: 'Folk' },
            { artist_id: 'e5555555-e555-e555-e555-e55555555555', name: 'Pamungkas', genre: 'Alternative/Indie' },
            { artist_id: 'e6666666-e666-e666-e666-e66666666666', name: 'Raisa', genre: 'Pop' },
            { artist_id: 'e7777777-e777-e777-e777-e77777777777', name: 'Dewa 19', genre: 'Rock' },
            { artist_id: 'e8888888-e888-e888-e888-e88888888888', name: 'Sheila On 7', genre: 'Pop Rock' }
        ];
        saveTable('artists', artists); // Simpan ke localStorage
    }

    let artistToDelete = null;

    // 2. DOM ELEMENTS
    const tableBody = document.getElementById('artist-table-body');
    const totalText = document.getElementById('total-artists');
    const btnAdd = document.getElementById('btn-add-artist');
    const thAction = document.getElementById('th-action');

    // Modal Form
    const modalForm = document.getElementById('modal-form');
    const formTitle = document.getElementById('modal-title');
    const formArtist = document.getElementById('artist-form');
    const inputId = document.getElementById('form-artist-id');
    const inputName = document.getElementById('form-name');
    const inputGenre = document.getElementById('form-genre');
    const errorMsg = document.getElementById('form-error');
    const btnCancelForm = document.getElementById('btn-cancel-form');

    // Modal Delete
    const modalDelete = document.getElementById('modal-delete');
    const deleteNameSpan = document.getElementById('delete-artist-name');
    const btnCancelDelete = document.getElementById('btn-cancel-delete');
    const btnConfirmDelete = document.getElementById('btn-confirm-delete');

    // 3. RENDER FUNCTION
    function renderTable() {
        tableBody.innerHTML = '';
        totalText.innerText = `Total Artis: ${artists.length}`;

        // Konfigurasi Visibilitas UI berdasarkan Role
        if (userRole === 'Admin') {
            btnAdd.classList.remove('hidden');
            thAction.style.display = 'table-cell';
        } else {
            btnAdd.classList.add('hidden');
            thAction.style.display = 'none';
        }

        const sortedArtists = [...artists].sort((a, b) => a.name.localeCompare(b.name));

        sortedArtists.forEach(artist => {
            const tr = document.createElement('tr');
            tr.className = 'hover:bg-gray-50 border-b last:border-0';

            let rowHTML = `
                <td class="p-4 text-sm text-gray-500">${artist.artist_id}</td>
                <td class="p-4 font-medium text-gray-800">${artist.name}</td>
                <td class="p-4 text-gray-600">${artist.genre || '-'}</td>
            `;

            if (userRole === 'Admin') {
                rowHTML += `
                    <td class="p-4 flex justify-center gap-2">
                        <button class="btn-edit text-blue-500 hover:text-blue-700 font-medium text-sm" data-id="${artist.artist_id}">Edit</button>
                        <button class="btn-delete text-red-500 hover:text-red-700 font-medium text-sm" data-id="${artist.artist_id}">Hapus</button>
                    </td>
                `;
            }

            tr.innerHTML = rowHTML;
            tableBody.appendChild(tr);
        });

        // Event Listeners dinamis
        if (userRole === 'Admin') {
            document.querySelectorAll('.btn-edit').forEach(btn => {
                btn.addEventListener('click', (e) => openFormModal(e.target.getAttribute('data-id')));
            });
            document.querySelectorAll('.btn-delete').forEach(btn => {
                btn.addEventListener('click', (e) => openDeleteModal(e.target.getAttribute('data-id')));
            });
        }
    }

    // 4. HANDLERS (Buka/Tutup Modal)
    function openFormModal(id = null) {
        errorMsg.classList.add('hidden');
        if (id) {
            const artist = artists.find(a => a.artist_id === id);
            formTitle.innerText = 'Edit Artis';
            inputId.value = artist.artist_id;
            inputName.value = artist.name;
            inputGenre.value = artist.genre;
        } else {
            formTitle.innerText = 'Tambah Artis Baru';
            inputId.value = '';
            inputName.value = '';
            inputGenre.value = '';
        }
        modalForm.classList.remove('hidden');
    }

    function closeFormModal() { modalForm.classList.add('hidden'); }

    function openDeleteModal(id) {
        artistToDelete = artists.find(a => a.artist_id === id);
        deleteNameSpan.innerText = artistToDelete.name;
        modalDelete.classList.remove('hidden');
    }

    function closeDeleteModal() {
        modalDelete.classList.add('hidden');
        artistToDelete = null;
    }

    // 5. EVENT LISTENERS
    if (btnAdd) btnAdd.addEventListener('click', () => openFormModal());
    if (btnCancelForm) btnCancelForm.addEventListener('click', closeFormModal);
    if (btnCancelDelete) btnCancelDelete.addEventListener('click', closeDeleteModal);

    // Form Submit (Create / Update)
    if (formArtist) {
        formArtist.addEventListener('submit', (e) => {
            e.preventDefault();
            const id = inputId.value;
            const name = inputName.value.trim();
            const genre = inputGenre.value.trim();

            if (!name) {
                errorMsg.innerText = 'Nama artis wajib diisi!';
                errorMsg.classList.remove('hidden');
                return;
            }

            if (id) {
                // Update
                const index = artists.findIndex(a => a.artist_id === id);
                artists[index] = { ...artists[index], name, genre };
            } else {
                // Create
                const newId = generateUUID(); // Pakai fungsi dari app.js
                artists.push({ artist_id: newId, name, genre });
            }

            // SIMPAN PERUBAHAN KE LOCALSTORAGE
            saveTable('artists', artists);
            
            closeFormModal();
            renderTable();
        });
    }

    // Confirm Delete
    if (btnConfirmDelete) {
        btnConfirmDelete.addEventListener('click', () => {
            if (artistToDelete) {
                artists = artists.filter(a => a.artist_id !== artistToDelete.artist_id);
                
                // SIMPAN PERUBAHAN KE LOCALSTORAGE
                saveTable('artists', artists);

                closeDeleteModal();
                renderTable();
            }
        });
    }

    // INIT
    renderTable();
});