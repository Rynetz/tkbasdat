document.addEventListener("DOMContentLoaded", () => {
    // 1. STATE & DATA
    const currentUser = getCurrentUser();
    const userRole = currentUser ? currentUser.role : 'Guest'; 

    let categories = getTable('categories') || [];
    let events = getTable('events') || [];
    let categoryToDelete = null;

    // 2. DOM ELEMENTS
    const tableBody = document.getElementById('category-table-body');
    const totalText = document.getElementById('total-categories');
    const btnAdd = document.getElementById('btn-add-category');
    const thAction = document.getElementById('th-action');

    // Modal Form
    const modalForm = document.getElementById('modal-form');
    const formTitle = document.getElementById('modal-title');
    const formCategory = document.getElementById('category-form');
    const inputId = document.getElementById('form-category-id');
    const inputEvent = document.getElementById('form-event');
    const inputName = document.getElementById('form-name');
    const inputPrice = document.getElementById('form-price');
    const inputQuota = document.getElementById('form-quota');
    const errorMsg = document.getElementById('form-error');
    const btnCancelForm = document.getElementById('btn-cancel-form');

    // Modal Delete
    const modalDelete = document.getElementById('modal-delete');
    const deleteNameSpan = document.getElementById('delete-category-name');
    const btnCancelDelete = document.getElementById('btn-cancel-delete');
    const btnConfirmDelete = document.getElementById('btn-confirm-delete');

    // Mengisi opsi Event ke dalam dropdown
    function populateEventDropdown() {
        inputEvent.innerHTML = '<option value="" disabled selected>-- Pilih Acara --</option>';
        events.forEach(ev => {
            const option = document.createElement('option');
            option.value = ev.id;
            option.textContent = ev.name;
            inputEvent.appendChild(option);
        });
    }

    // 3. RENDER FUNCTION
    function renderTable() {
        tableBody.innerHTML = '';
        totalText.innerText = `Total Kategori: ${categories.length}`;

        // Role-Based UI: Action untuk Admin dan Organizer
        if (userRole === 'Admin' || userRole === 'Organizer') {
            btnAdd.classList.remove('hidden');
            thAction.style.display = 'table-cell';
        } else {
            btnAdd.classList.add('hidden');
            thAction.style.display = 'none';
        }

        // Penggabungan data (Join) dan Sorting (Event Name -> Category Name ASC)
        const enrichedCategories = categories.map(cat => {
            const eventObj = events.find(e => e.id === cat.eventId);
            return {
                ...cat,
                eventName: eventObj ? eventObj.name : 'Unknown Event'
            };
        });

        enrichedCategories.sort((a, b) => {
            if (a.eventName === b.eventName) {
                return a.name.localeCompare(b.name);
            }
            return a.eventName.localeCompare(b.eventName);
        });

        enrichedCategories.forEach(cat => {
            const tr = document.createElement('tr');
            tr.className = 'hover:bg-gray-50 border-b last:border-0';

            let rowHTML = `
                <td class="p-4 font-medium text-gray-800">${cat.name}</td>
                <td class="p-4 text-sm text-gray-600">${cat.eventName}</td>
                <td class="p-4 text-blue-600 font-medium">${formatCurrency(cat.price)}</td>
                <td class="p-4 text-gray-600">${cat.quota} tiket</td>
            `;

            if (userRole === 'Admin' || userRole === 'Organizer') {
                rowHTML += `
                    <td class="p-4 flex justify-center gap-2">
                        <button class="btn-edit text-blue-500 hover:text-blue-700 font-medium text-sm" data-id="${cat.id}">Edit</button>
                        <button class="btn-delete text-red-500 hover:text-red-700 font-medium text-sm" data-id="${cat.id}">Hapus</button>
                    </td>
                `;
            }

            tr.innerHTML = rowHTML;
            tableBody.appendChild(tr);
        });

        // Attach Event Listeners
        if (userRole === 'Admin' || userRole === 'Organizer') {
            document.querySelectorAll('.btn-edit').forEach(btn => {
                btn.addEventListener('click', (e) => openFormModal(e.target.getAttribute('data-id')));
            });
            document.querySelectorAll('.btn-delete').forEach(btn => {
                btn.addEventListener('click', (e) => openDeleteModal(e.target.getAttribute('data-id')));
            });
        }
    }

    // 4. HANDLERS
    function openFormModal(id = null) {
        errorMsg.classList.add('hidden');
        populateEventDropdown();

        if (id) {
            const cat = categories.find(c => c.id === id);
            formTitle.innerText = 'Edit Kategori';
            inputId.value = cat.id;
            inputEvent.value = cat.eventId;
            inputName.value = cat.name;
            inputPrice.value = cat.price;
            inputQuota.value = cat.quota;
        } else {
            formTitle.innerText = 'Tambah Kategori Baru';
            inputId.value = '';
            inputEvent.value = '';
            inputName.value = '';
            inputPrice.value = '';
            inputQuota.value = '';
        }
        modalForm.classList.remove('hidden');
    }

    function closeFormModal() { modalForm.classList.add('hidden'); }

    function openDeleteModal(id) {
        categoryToDelete = categories.find(c => c.id === id);
        deleteNameSpan.innerText = categoryToDelete.name;
        modalDelete.classList.remove('hidden');
    }

    function closeDeleteModal() {
        modalDelete.classList.add('hidden');
        categoryToDelete = null;
    }

    // 5. EVENT LISTENERS
    if (btnAdd) btnAdd.addEventListener('click', () => openFormModal());
    if (btnCancelForm) btnCancelForm.addEventListener('click', closeFormModal);
    if (btnCancelDelete) btnCancelDelete.addEventListener('click', closeDeleteModal);

    // Validasi & Simpan Form
    if (formCategory) {
        formCategory.addEventListener('submit', (e) => {
            e.preventDefault();
            const id = inputId.value;
            const eventId = inputEvent.value;
            const name = inputName.value.trim();
            const price = Number(inputPrice.value);
            const quota = Number(inputQuota.value);

            // Validasi Dasar
            if (!eventId || !name || inputPrice.value === '' || inputQuota.value === '') {
                errorMsg.innerText = 'Semua field wajib diisi!';
                errorMsg.classList.remove('hidden');
                return;
            }
            if (price < 0 || quota <= 0) {
                errorMsg.innerText = 'Harga tidak boleh negatif dan kuota harus > 0!';
                errorMsg.classList.remove('hidden');
                return;
            }

            // Validasi Kapasitas Event (Total kuota kategori tidak boleh melebihi kapasitas event)
            const targetEvent = events.find(ev => ev.id === eventId);
            const otherCategories = categories.filter(c => c.eventId === eventId && c.id !== id);
            const currentTotalQuota = otherCategories.reduce((sum, c) => sum + Number(c.quota), 0);
            
            if (currentTotalQuota + quota > targetEvent.capacity) {
                errorMsg.innerText = `Sisa kapasitas venue untuk acara ini hanya ${targetEvent.capacity - currentTotalQuota} tiket!`;
                errorMsg.classList.remove('hidden');
                return;
            }

            if (id) {
                // Update
                const index = categories.findIndex(c => c.id === id);
                categories[index] = { ...categories[index], eventId, name, price, quota };
            } else {
                // Create
                const newId = generateUUID(); 
                categories.push({ id: newId, eventId, name, price, quota, booked: 0 });
            }

            saveTable('categories', categories);
            closeFormModal();
            renderTable();
        });
    }

    if (btnConfirmDelete) {
        btnConfirmDelete.addEventListener('click', () => {
            if (categoryToDelete) {
                categories = categories.filter(c => c.id !== categoryToDelete.id);
                saveTable('categories', categories);
                closeDeleteModal();
                renderTable();
            }
        });
    }

    // INIT
    renderTable();
});