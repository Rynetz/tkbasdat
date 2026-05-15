document.addEventListener("DOMContentLoaded", () => {
    requireLogin();
    const currentUser = getCurrentUser();
    const userRole = currentUser.role;

    // Hanya Admin dan Organizer yang boleh masuk halaman ini
    if (userRole !== 'Admin' && userRole !== 'Organizer') {
        alert('Anda tidak memiliki akses ke halaman ini.');
        window.location.href = 'profile.html';
        return;
    }

    // 1. STATE & DATA
    let allEvents = getTable('events');
    let allVenues = getTable('venues');
    
    // 2. DOM ELEMENTS
    const pageTitle = document.getElementById('page-title');
    const tableBody = document.getElementById('event-table-body');
    const totalText = document.getElementById('total-events');
    const btnAdd = document.getElementById('btn-add-event');
    const searchInput = document.getElementById('search-event');

    // Modal Form
    const modalForm = document.getElementById('modal-form');
    const formTitle = document.getElementById('modal-title');
    const formEvent = document.getElementById('event-form');
    const inputId = document.getElementById('form-event-id');
    const inputName = document.getElementById('form-name');
    const inputDate = document.getElementById('form-date');
    const inputLocation = document.getElementById('form-location');
    const inputCapacity = document.getElementById('form-capacity');
    const inputSeating = document.getElementById('form-seating');
    const errorMsg = document.getElementById('form-error');
    const btnCancelForm = document.getElementById('btn-cancel-form');

    // Sesuaikan Judul Halaman
    if (userRole === 'Organizer') {
        pageTitle.innerText = 'Event Saya';
    } else {
        pageTitle.innerText = 'Manajemen Event';
    }

    // Populate Venue Dropdown
    function populateVenues() {
        inputLocation.innerHTML = '<option value="">-- Pilih Venue --</option>';
        allVenues.forEach(v => {
            const opt = document.createElement('option');
            opt.value = v.name; // Simpan nama venue sebagai location, sesuai struktur awal
            opt.textContent = `${v.name} (Kap: ${v.capacity}, ${v.city})`;
            inputLocation.appendChild(opt);
        });
    }

    // 3. RENDER FUNCTION
    function renderTable(searchTerm = "") {
        tableBody.innerHTML = '';
        
        // Filter by Role (Organizer hanya melihat event miliknya)
        let visibleEvents = allEvents;
        if (userRole === 'Organizer') {
            visibleEvents = allEvents.filter(ev => ev.organizerId === currentUser.id);
        }

        // Filter by Search Term
        if (searchTerm) {
            visibleEvents = visibleEvents.filter(ev => 
                ev.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                ev.location.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }

        totalText.innerText = `Total Event: ${visibleEvents.length}`;

        visibleEvents.forEach(ev => {
            const tr = document.createElement('tr');
            tr.className = 'hover:bg-gray-50 border-b last:border-0';

            const d = new Date(ev.date);
            const dateStr = d.toLocaleDateString('id-ID', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });

            tr.innerHTML = `
                <td class="p-4 text-sm text-gray-500">${ev.id}</td>
                <td class="p-4 font-medium text-gray-800">${ev.name}</td>
                <td class="p-4 text-gray-600">${dateStr}</td>
                <td class="p-4 text-gray-600">${ev.location}</td>
                <td class="p-4 text-gray-600">${ev.capacity.toLocaleString('id-ID')}</td>
                <td class="p-4 text-gray-600">${ev.hasReservedSeating ? '<span class="text-green-600 font-medium">Ya</span>' : 'Tidak'}</td>
                <td class="p-4 flex justify-center gap-2">
                    <button class="btn-edit text-blue-500 hover:text-blue-700 font-medium text-sm" data-id="${ev.id}">Edit</button>
                    <button class="btn-delete text-red-500 hover:text-red-700 font-medium text-sm" data-id="${ev.id}">Hapus</button>
                </td>
            `;
            tableBody.appendChild(tr);
        });

        // Event Listeners dinamis
        document.querySelectorAll('.btn-edit').forEach(btn => {
            btn.addEventListener('click', (e) => openFormModal(e.target.getAttribute('data-id')));
        });
        document.querySelectorAll('.btn-delete').forEach(btn => {
            btn.addEventListener('click', (e) => deleteEvent(e.target.getAttribute('data-id')));
        });
    }

    // 4. HANDLERS (Buka/Tutup Modal)
    function openFormModal(id = null) {
        errorMsg.classList.add('hidden');
        populateVenues(); // Refresh opsi venue tiap kali modal dibuka

        if (id) {
            const ev = allEvents.find(e => e.id === id);
            formTitle.innerText = 'Edit Event';
            inputId.value = ev.id;
            inputName.value = ev.name;
            inputDate.value = ev.date;
            inputLocation.value = ev.location;
            inputCapacity.value = ev.capacity;
            inputSeating.checked = ev.hasReservedSeating;
        } else {
            formTitle.innerText = 'Tambah Event Baru';
            inputId.value = '';
            inputName.value = '';
            inputDate.value = '';
            inputLocation.value = '';
            inputCapacity.value = '';
            inputSeating.checked = false;
        }
        modalForm.classList.remove('hidden');
    }

    function closeFormModal() { 
        modalForm.classList.add('hidden'); 
    }

    function deleteEvent(id) {
        const ev = allEvents.find(e => e.id === id);
        if (confirm(`Apakah Anda yakin ingin menghapus event "${ev.name}"?`)) {
            allEvents = allEvents.filter(e => e.id !== id);
            saveTable('events', allEvents);
            renderTable(searchInput.value);
        }
    }

    // 5. EVENT LISTENERS
    if (btnAdd) btnAdd.addEventListener('click', () => openFormModal());
    if (btnCancelForm) btnCancelForm.addEventListener('click', closeFormModal);
    
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            renderTable(e.target.value);
        });
    }

    // Sinkronisasi otomatis kapasitas form saat venue dipilih
    inputLocation.addEventListener('change', (e) => {
        const venueName = e.target.value;
        const selectedVenue = allVenues.find(v => v.name === venueName);
        if (selectedVenue) {
            inputCapacity.value = selectedVenue.capacity;
        }
    });

    // Form Submit (Create / Update)
    if (formEvent) {
        formEvent.addEventListener('submit', (e) => {
            e.preventDefault();
            const id = inputId.value;
            const name = inputName.value.trim();
            const date = inputDate.value;
            const location = inputLocation.value;
            const capacity = parseInt(inputCapacity.value, 10);
            const hasReservedSeating = inputSeating.checked;

            if (!name || !date || !location || isNaN(capacity) || capacity <= 0) {
                errorMsg.innerText = 'Harap isi semua field dengan benar!';
                errorMsg.classList.remove('hidden');
                return;
            }

            // Validasi: Kapasitas event tidak boleh melebihi kapasitas venue
            const selectedVenue = allVenues.find(v => v.name === location);
            if (selectedVenue && capacity > selectedVenue.capacity) {
                errorMsg.innerText = `Kapasitas event (${capacity}) tidak boleh melebihi kapasitas venue (${selectedVenue.capacity})!`;
                errorMsg.classList.remove('hidden');
                return;
            }

            if (id) {
                // Update
                const index = allEvents.findIndex(e => e.id === id);
                allEvents[index] = { 
                    ...allEvents[index], 
                    name, 
                    date, 
                    location, 
                    capacity, 
                    hasReservedSeating 
                };
            } else {
                // Create
                const newId = generateUUID();
                // Jika Organizer yang membuat, simpan ID-nya. Jika Admin, kita bisa menyimpan ID admin atau minta pilih organizer (tapi agar simpel pakai id admin dulu atau kosongi, kita pakai id pembuat)
                const organizerId = currentUser.id;
                
                allEvents.push({ 
                    id: newId, 
                    name, 
                    date, 
                    location, 
                    capacity, 
                    organizerId, 
                    hasReservedSeating 
                });
            }

            saveTable('events', allEvents);
            
            closeFormModal();
            renderTable(searchInput.value);
        });
    }

    // INIT
    renderTable();
});
