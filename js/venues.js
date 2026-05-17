document.addEventListener("DOMContentLoaded", () => {
    // 1. STATE & DATA
    const currentUser = getCurrentUser();
    const userRole = currentUser ? currentUser.role : 'Guest'; 

    let venues = [];
    let venueToDelete = null;

    // 2. DOM ELEMENTS
    const tableBody = document.getElementById('venue-table-body');
    const totalText = document.getElementById('total-venues');
    const btnAdd = document.getElementById('btn-add-venue');
    const thAction = document.getElementById('th-action');
    const searchInput = document.getElementById('search-venue');

    // Modal Form
    const modalForm = document.getElementById('modal-form');
    const formTitle = document.getElementById('modal-title');
    const formVenue = document.getElementById('venue-form');
    const inputId = document.getElementById('form-venue-id');
    const inputName = document.getElementById('form-name');
    const inputCapacity = document.getElementById('form-capacity');
    const inputAddress = document.getElementById('form-address');
    const inputCity = document.getElementById('form-city');
    const errorMsg = document.getElementById('form-error');
    const btnCancelForm = document.getElementById('btn-cancel-form');

    // Modal Delete
    const modalDelete = document.getElementById('modal-delete');
    const deleteNameSpan = document.getElementById('delete-venue-name');
    const btnCancelDelete = document.getElementById('btn-cancel-delete');
    const btnConfirmDelete = document.getElementById('btn-confirm-delete');

    // 3. RENDER FUNCTION
    function renderTable(searchTerm = "") {
        tableBody.innerHTML = '';
        
        // Konfigurasi Visibilitas UI berdasarkan Role
        if (userRole === 'Admin' || userRole === 'Organizer') {
            btnAdd.classList.remove('hidden');
            thAction.style.display = 'table-cell';
        } else {
            btnAdd.classList.add('hidden');
            thAction.style.display = 'none';
        }

        let filteredVenues = venues.filter(venue => 
            venue.venue_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            venue.city.toLowerCase().includes(searchTerm.toLowerCase())
        );

        totalText.innerText = `Total Venue: ${filteredVenues.length}`;

        const sortedVenues = [...filteredVenues].sort((a, b) => a.venue_name.localeCompare(b.venue_name));

        sortedVenues.forEach(venue => {
            const tr = document.createElement('tr');
            tr.className = 'hover:bg-gray-50 border-b last:border-0';

            let rowHTML = `
                <td class="p-4 text-sm text-gray-500">${venue.venue_id}</td>
                <td class="p-4 font-medium text-gray-800">${venue.venue_name}</td>
                <td class="p-4 text-gray-600">${venue.capacity.toLocaleString('id-ID')}</td>
                <td class="p-4 text-gray-600">${venue.city}</td>
            `;

            if (userRole === 'Admin' || userRole === 'Organizer') {
                rowHTML += `
                    <td class="p-4 flex justify-center gap-2">
                        <button class="btn-edit text-blue-500 hover:text-blue-700 font-medium text-sm" data-id="${venue.venue_id}">Edit</button>
                        <button class="btn-delete text-red-500 hover:text-red-700 font-medium text-sm" data-id="${venue.venue_id}">Hapus</button>
                    </td>
                `;
            }

            tr.innerHTML = rowHTML;
            tableBody.appendChild(tr);
        });

        // Event Listeners dinamis
        if (userRole === 'Admin' || userRole === 'Organizer') {
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
            const venue = venues.find(v => v.venue_id === id);
            formTitle.innerText = 'Edit Venue';
            inputId.value = venue.venue_id;
            inputName.value = venue.venue_name;
            inputCapacity.value = venue.capacity;
            inputAddress.value = venue.address;
            inputCity.value = venue.city;
        } else {
            formTitle.innerText = 'Tambah Venue Baru';
            inputId.value = '';
            inputName.value = '';
            inputCapacity.value = '';
            inputAddress.value = '';
            inputCity.value = '';
        }
        modalForm.classList.remove('hidden');
    }

    function closeFormModal() { modalForm.classList.add('hidden'); }

    function openDeleteModal(id) {
        venueToDelete = venues.find(v => v.venue_id === id);
        deleteNameSpan.innerText = venueToDelete.venue_name;
        modalDelete.classList.remove('hidden');
    }

    function closeDeleteModal() {
        modalDelete.classList.add('hidden');
        venueToDelete = null;
    }

    // 5. FETCH DATA DARI BACKEND
    async function loadVenues() {
        try {
            const response = await fetch('/api/venues');
            const data = await response.json();
            if (data.success) {
                venues = data.data;
                renderTable(searchInput ? searchInput.value : "");
            } else {
                console.error('Gagal mengambil data venue:', data.message);
            }
        } catch (error) {
            console.error('Error fetching venues:', error);
        }
    }

    // 6. EVENT LISTENERS
    if (btnAdd) btnAdd.addEventListener('click', () => openFormModal());
    if (btnCancelForm) btnCancelForm.addEventListener('click', closeFormModal);
    if (btnCancelDelete) btnCancelDelete.addEventListener('click', closeDeleteModal);
    
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            renderTable(e.target.value);
        });
    }

    // Form Submit (Create / Update)
    if (formVenue) {
        formVenue.addEventListener('submit', async (e) => {
            e.preventDefault();
            const id = inputId.value;
            const venue_name = inputName.value.trim();
            const capacity = parseInt(inputCapacity.value, 10);
            const address = inputAddress.value.trim();
            const city = inputCity.value.trim();

            if (!venue_name || isNaN(capacity) || capacity <= 0 || !address || !city) {
                errorMsg.innerText = 'Harap isi semua field dengan benar!';
                errorMsg.classList.remove('hidden');
                return;
            }

            try {
                let url = '/api/venues';
                let method = 'POST';

                if (id) {
                    url = `/api/venues/${id}`;
                    method = 'PUT';
                }

                const response = await fetch(url, {
                    method: method,
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ venue_name, capacity, address, city })
                });

                const data = await response.json();

                if (data.success) {
                    closeFormModal();
                    loadVenues(); // Refresh data
                } else {
                    errorMsg.innerText = data.message || 'Gagal menyimpan venue';
                    errorMsg.classList.remove('hidden');
                }
            } catch (error) {
                console.error('Error saving venue:', error);
                errorMsg.innerText = 'Terjadi kesalahan pada server.';
                errorMsg.classList.remove('hidden');
            }
        });
    }

    // Confirm Delete
    if (btnConfirmDelete) {
        btnConfirmDelete.addEventListener('click', async () => {
            if (venueToDelete) {
                try {
                    const response = await fetch(`/api/venues/${venueToDelete.venue_id}`, {
                        method: 'DELETE'
                    });
                    const data = await response.json();

                    if (data.success) {
                        closeDeleteModal();
                        loadVenues(); // Refresh data
                    } else {
                        alert(data.message || 'Gagal menghapus venue');
                    }
                } catch (error) {
                    console.error('Error deleting venue:', error);
                    alert('Terjadi kesalahan pada server.');
                }
            }
        });
    }

    // INIT
    loadVenues();
});
