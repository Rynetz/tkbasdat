document.addEventListener("DOMContentLoaded", () => {
    requireLogin();
    const currentUser = getCurrentUser();
    const userRole = currentUser.role;

    // Hapus blokir Customer, biarkan melihat tapi batasi aksinya nanti
    const colAksi = document.getElementById('col-aksi');
    if (userRole === 'Admin' || userRole === 'Organizer') {
        const btnAddSeat = document.getElementById('btn-add-seat');
        if (btnAddSeat) btnAddSeat.classList.remove('hidden');
    } else {
        if (colAksi) colAksi.style.display = 'none';
    }

    let seats = getTable('seats');
    let venues = getTable('venues');
    let tickets = getTable('tickets');
    
    const tableBody = document.getElementById('seat-table-body');
    const statTotal = document.getElementById('stat-total');
    const statAvailable = document.getElementById('stat-available');
    const statFilled = document.getElementById('stat-filled');
    const btnAdd = document.getElementById('btn-add-seat');
    const searchInput = document.getElementById('search-seat');
    const filterVenue = document.getElementById('filter-venue');

    const modalForm = document.getElementById('modal-form');
    const formTitle = document.getElementById('modal-title');
    const formSeat = document.getElementById('seat-form');
    const inputId = document.getElementById('form-seat-id');
    const inputVenue = document.getElementById('form-venue');
    const inputSection = document.getElementById('form-section');
    const inputRow = document.getElementById('form-row');
    const inputNumber = document.getElementById('form-number');
    const errorMsg = document.getElementById('form-error');
    const btnCancelForm = document.getElementById('btn-cancel-form');
    const btnSubmitForm = document.getElementById('btn-submit-form');

    // Populate Venues
    function populateVenues() {
        // Untuk filter
        filterVenue.innerHTML = '<option value="">Semua Venue</option>';
        venues.forEach(v => {
            const opt = document.createElement('option');
            opt.value = v.id;
            opt.textContent = v.name;
            filterVenue.appendChild(opt);
        });

        // Untuk modal form
        inputVenue.innerHTML = '<option value="">-- Pilih Venue --</option>';
        venues.forEach(v => {
            const opt = document.createElement('option');
            opt.value = v.id;
            opt.textContent = v.name;
            inputVenue.appendChild(opt);
        });
    }

    function renderTable(searchTerm = "", venueTerm = "") {
        tableBody.innerHTML = '';
        
        let visibleSeats = seats;

        if (venueTerm) {
            visibleSeats = visibleSeats.filter(s => s.venueId === venueTerm);
        }

        if (searchTerm) {
            searchTerm = searchTerm.toLowerCase();
            visibleSeats = visibleSeats.filter(s => {
                const venue = venues.find(v => v.id === s.venueId) || { name: '' };
                return (s.section && s.section.toLowerCase().includes(searchTerm)) ||
                       (s.number && s.number.toLowerCase().includes(searchTerm)) ||
                       (s.row && s.row.toLowerCase().includes(searchTerm)) ||
                       venue.name.toLowerCase().includes(searchTerm);
            });
        }

        let filledCount = 0;
        let availableCount = 0;

        visibleSeats.forEach(s => {
            const isAssigned = tickets.some(t => t.seatId === s.id);
            if (isAssigned) filledCount++;
            else availableCount++;
        });

        if (statTotal) statTotal.innerText = visibleSeats.length;
        if (statAvailable) statAvailable.innerText = availableCount;
        if (statFilled) statFilled.innerText = filledCount;

        if (visibleSeats.length === 0) {
            let colSpan = (userRole === 'Admin' || userRole === 'Organizer') ? 6 : 5;
            tableBody.innerHTML = `<tr><td colspan="${colSpan}" class="p-4 text-center text-gray-500">Belum ada kursi yang ditemukan.</td></tr>`;
            return;
        }

        visibleSeats.forEach(s => {
            const tr = document.createElement('tr');
            tr.className = 'hover:bg-gray-50 border-b last:border-0';

            const venue = venues.find(v => v.id === s.venueId) || { name: 'Unknown' };
            
            // Cek apakah kursi sudah di-assign ke sebuah tiket
            const isAssigned = tickets.some(t => t.seatId === s.id);
            const statusHtml = isAssigned 
                ? '<span class="text-red-600 bg-red-100 px-2 py-1 rounded text-xs font-bold uppercase tracking-wider">Terisi</span>' 
                : '<span class="text-green-600 bg-green-100 px-2 py-1 rounded text-xs font-bold uppercase tracking-wider">Tersedia</span>';

            let actionHtml = '';
            if (userRole === 'Admin' || userRole === 'Organizer') {
                let deleteBtnClass = isAssigned ? 'text-gray-400 cursor-not-allowed' : 'text-red-500 hover:text-red-700';
                actionHtml = `
                <td class="p-4 text-center flex justify-center gap-3">
                    <button class="btn-update text-blue-500 hover:text-blue-700 font-medium text-sm" data-id="${s.id}">Edit</button>
                    <button class="btn-delete ${deleteBtnClass} font-medium text-sm" data-id="${s.id}" data-assigned="${isAssigned}">Hapus</button>
                </td>`;
            }

            tr.innerHTML = `
                <td class="p-4 font-medium text-gray-800">${venue.name}</td>
                <td class="p-4 text-gray-600">${s.section || 'Utama'}</td>
                <td class="p-4 text-gray-600">${s.row || '-'}</td>
                <td class="p-4 font-medium text-gray-800">${s.number || '-'}</td>
                <td class="p-4">${statusHtml}</td>
                ${actionHtml}
            `;
            tableBody.appendChild(tr);
        });

        document.querySelectorAll('.btn-update').forEach(btn => {
            btn.addEventListener('click', (e) => openFormModal(e.target.getAttribute('data-id')));
        });
        
        document.querySelectorAll('.btn-delete').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = e.target.getAttribute('data-id');
                const isAssigned = e.target.getAttribute('data-assigned') === 'true';
                if (isAssigned) {
                    alert("Kursi ini sudah di-assign ke tiket dan tidak dapat dihapus. Hapus atau ubah tiket terlebih dahulu.");
                    return;
                }
                deleteSeat(id);
            });
        });
    }

    function openFormModal(id = null) {
        errorMsg.classList.add('hidden');
        
        if (id) {
            const seat = seats.find(s => s.id === id);
            if (!seat) return;
            formTitle.innerText = 'Edit Kursi';
            btnSubmitForm.innerText = 'Simpan';
            inputId.value = seat.id;
            inputVenue.value = seat.venueId;
            inputSection.value = seat.section || '';
            inputRow.value = seat.row || '';
            inputNumber.value = seat.number || '';
        } else {
            formTitle.innerText = 'Tambah Kursi Baru';
            btnSubmitForm.innerText = 'Tambah';
            inputId.value = '';
            inputVenue.value = '';
            inputSection.value = '';
            inputRow.value = '';
            inputNumber.value = '';
        }
        
        modalForm.classList.remove('hidden');
    }

    function closeFormModal() { 
        modalForm.classList.add('hidden'); 
    }

    function deleteSeat(id) {
        if (confirm(`Apakah Anda yakin ingin menghapus kursi ini secara permanen?`)) {
            seats = seats.filter(s => s.id !== id);
            saveTable('seats', seats);
            renderTable(searchInput.value, filterVenue.value);
        }
    }

    if (btnAdd) btnAdd.addEventListener('click', () => openFormModal());
    if (btnCancelForm) btnCancelForm.addEventListener('click', closeFormModal);
    
    if (searchInput) {
        searchInput.addEventListener('input', () => {
            renderTable(searchInput.value, filterVenue.value);
        });
    }

    if (filterVenue) {
        filterVenue.addEventListener('change', () => {
            renderTable(searchInput.value, filterVenue.value);
        });
    }

    if (formSeat) {
        formSeat.addEventListener('submit', (e) => {
            e.preventDefault();
            const id = inputId.value;
            const venueId = inputVenue.value;
            const section = inputSection.value.trim();
            const row = inputRow.value.trim();
            const number = inputNumber.value.trim();

            if (!venueId || !section || !row || !number) {
                errorMsg.innerText = 'Harap isi semua field dengan benar!';
                errorMsg.classList.remove('hidden');
                return;
            }

            // Validasi unik (Venue, Section, Row, Number)
            const isDuplicate = seats.some(s => 
                s.venueId === venueId && 
                s.section.toLowerCase() === section.toLowerCase() && 
                s.row.toLowerCase() === row.toLowerCase() && 
                s.number.toLowerCase() === number.toLowerCase() &&
                s.id !== id
            );

            if (isDuplicate) {
                errorMsg.innerText = 'Kombinasi kursi (Section, Row, Number) di Venue ini sudah ada!';
                errorMsg.classList.remove('hidden');
                return;
            }

            if (id) {
                // Update
                const index = seats.findIndex(s => s.id === id);
                if (index !== -1) {
                    seats[index].venueId = venueId;
                    seats[index].section = section;
                    seats[index].row = row;
                    seats[index].number = number;
                }
            } else {
                // Create
                seats.push({
                    id: generateUUID(),
                    venueId: venueId,
                    section: section,
                    row: row,
                    number: number,
                    isAvailable: true // Default tersedia
                });
            }

            saveTable('seats', seats);
            closeFormModal();
            renderTable(searchInput.value, filterVenue.value);
        });
    }

    // Init
    populateVenues();
    renderTable();
});
