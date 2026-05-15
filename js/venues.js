document.addEventListener("DOMContentLoaded", () => {
    // 1. STATE & DATA
    const currentUser = getCurrentUser();
    const userRole = currentUser ? currentUser.role : 'Guest'; 

    let venues = getTable('venues');
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
            venue.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            venue.city.toLowerCase().includes(searchTerm.toLowerCase())
        );

        totalText.innerText = `Total Venue: ${filteredVenues.length}`;

        const sortedVenues = [...filteredVenues].sort((a, b) => a.name.localeCompare(b.name));

        sortedVenues.forEach(venue => {
            const tr = document.createElement('tr');
            tr.className = 'hover:bg-gray-50 border-b last:border-0';

            let rowHTML = `
                <td class="p-4 text-sm text-gray-500">${venue.id}</td>
                <td class="p-4 font-medium text-gray-800">${venue.name}</td>
                <td class="p-4 text-gray-600">${venue.capacity.toLocaleString('id-ID')}</td>
                <td class="p-4 text-gray-600">${venue.city}</td>
            `;

            if (userRole === 'Admin' || userRole === 'Organizer') {
                rowHTML += `
                    <td class="p-4 flex justify-center gap-2">
                        <button class="btn-edit text-blue-500 hover:text-blue-700 font-medium text-sm" data-id="${venue.id}">Edit</button>
                        <button class="btn-delete text-red-500 hover:text-red-700 font-medium text-sm" data-id="${venue.id}">Hapus</button>
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
            const venue = venues.find(v => v.id === id);
            formTitle.innerText = 'Edit Venue';
            inputId.value = venue.id;
            inputName.value = venue.name;
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
        venueToDelete = venues.find(v => v.id === id);
        deleteNameSpan.innerText = venueToDelete.name;
        modalDelete.classList.remove('hidden');
    }

    function closeDeleteModal() {
        modalDelete.classList.add('hidden');
        venueToDelete = null;
    }

    // 5. EVENT LISTENERS
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
        formVenue.addEventListener('submit', (e) => {
            e.preventDefault();
            const id = inputId.value;
            const name = inputName.value.trim();
            const capacity = parseInt(inputCapacity.value, 10);
            const address = inputAddress.value.trim();
            const city = inputCity.value.trim();

            if (!name || isNaN(capacity) || capacity <= 0 || !address || !city) {
                errorMsg.innerText = 'Harap isi semua field dengan benar!';
                errorMsg.classList.remove('hidden');
                return;
            }

            if (id) {
                // Update
                const index = venues.findIndex(v => v.id === id);
                venues[index] = { ...venues[index], name, capacity, address, city };
            } else {
                // Create
                const newId = generateUUID(); 
                venues.push({ id: newId, name, capacity, address, city });
            }

            saveTable('venues', venues);
            
            closeFormModal();
            renderTable(searchInput ? searchInput.value : "");
        });
    }

    // Confirm Delete
    if (btnConfirmDelete) {
        btnConfirmDelete.addEventListener('click', () => {
            if (venueToDelete) {
                venues = venues.filter(v => v.id !== venueToDelete.id);
                
                saveTable('venues', venues);

                closeDeleteModal();
                renderTable(searchInput ? searchInput.value : "");
            }
        });
    }

    // INIT
    renderTable();
});
