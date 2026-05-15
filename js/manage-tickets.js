document.addEventListener("DOMContentLoaded", () => {
    requireLogin();
    const currentUser = getCurrentUser();
    const userRole = currentUser.role;

    let tickets = getTable('tickets');
    let orders = getTable('orders');
    let events = getTable('events');
    let categories = getTable('categories');
    let seats = getTable('seats');

    const pageTitle = document.getElementById('page-title');
    const cardsContainer = document.getElementById('ticket-cards-container');
    const totalText = document.getElementById('total-tickets');
    const btnAdd = document.getElementById('btn-add-ticket');
    const searchInput = document.getElementById('search-ticket');
    const filterStatus = document.getElementById('filter-status');

    const modalForm = document.getElementById('modal-form');
    const formTicket = document.getElementById('ticket-form');
    const inputOrder = document.getElementById('form-order');
    const inputCategory = document.getElementById('form-category');
    const seatGroup = document.getElementById('seat-selection-group');
    const inputSeat = document.getElementById('form-seat');
    const errorMsg = document.getElementById('form-error');
    const btnCancelForm = document.getElementById('btn-cancel-form');

    const modalUpdate = document.getElementById('modal-update');
    const formUpdate = document.getElementById('update-form');
    const updateTicketId = document.getElementById('update-ticket-id');
    const updateCode = document.getElementById('update-code');
    const updateStatus = document.getElementById('update-status');
    const updateSeatGroup = document.getElementById('update-seat-group');
    const updateSeat = document.getElementById('update-seat');
    const btnCancelUpdate = document.getElementById('btn-cancel-update');

    // Pengaturan Role-Based UI
    if (userRole === 'Customer') {
        pageTitle.innerText = 'Tiket Saya';
        btnAdd.classList.add('hidden');
    } else {
        pageTitle.innerText = 'Manajemen Tiket';
        btnAdd.classList.remove('hidden');
    }

    // Helper untuk memfilter data awal berdasarkan hak akses role
    function getRoleFilteredTickets() {
        return tickets.filter(tkt => {
            const order = orders.find(o => o.id === tkt.orderId);
            if (!order) return false;

            if (userRole === 'Customer') {
                return order.customerId === currentUser.id;
            }
            // Admin dan Organizer melihat seluruh tiket di implementasi frontend ini
            return true;
        });
    }

    function renderCards(searchTerm = "", statusTerm = "") {
        cardsContainer.innerHTML = '';

        let visibleTickets = getRoleFilteredTickets();

        // Terapkan Filter Search
        if (searchTerm) {
            searchTerm = searchTerm.toLowerCase();
            visibleTickets = visibleTickets.filter(tkt => {
                const ev = events.find(e => e.id === tkt.eventId) || { name: '' };
                return tkt.code.toLowerCase().includes(searchTerm) ||
                    ev.name.toLowerCase().includes(searchTerm);
            });
        }

        // Terapkan Filter Status (berdasarkan status Order)
        if (statusTerm) {
            visibleTickets = visibleTickets.filter(tkt => {
                const order = orders.find(o => o.id === tkt.orderId) || { status: '' };
                return order.status === statusTerm;
            });
        }

        totalText.innerText = `Total Tiket: ${visibleTickets.length}`;

        if (visibleTickets.length === 0) {
            cardsContainer.innerHTML = `<div class="col-span-full text-center text-gray-500 py-10">Belum ada tiket yang ditemukan.</div>`;
            return;
        }

        visibleTickets.forEach(tkt => {
            const ev = events.find(e => e.id === tkt.eventId) || { name: 'Unknown Event', date: new Date().toISOString() };
            const cat = categories.find(c => c.id === tkt.categoryId) || { name: 'Unknown Category' };
            const order = orders.find(o => o.id === tkt.orderId) || { status: 'Unknown', customerName: 'Unknown' };

            let seatText = 'Tidak Disediakan';
            if (tkt.seatId) {
                const seat = seats.find(s => s.id === tkt.seatId);
                if (seat) seatText = `Section ${seat.section} — Baris ${seat.row}, No. ${seat.number}`;
            }

            const d = new Date(ev.date);
            const dateString = `${d.toLocaleDateString('id-ID')} ${d.toLocaleTimeString('id-ID')}`;

            // Badge Color untuk status
            let statusColor = 'bg-gray-100 text-gray-800';
            if (order.status === 'Lunas') statusColor = 'bg-green-100 text-green-800';
            else if (order.status === 'Pending') statusColor = 'bg-yellow-100 text-yellow-800';
            else if (order.status === 'Dibatalkan') statusColor = 'bg-red-100 text-red-800';

            const card = document.createElement('div');
            card.className = 'bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition flex flex-col';

            let actionBtnHtml = '';
            let customerHtml = '';

            if (userRole === 'Admin' || userRole === 'Organizer') {
                customerHtml = `<div class="text-sm text-gray-600 mb-1"><strong>Pelanggan:</strong> ${order.customerName}</div>`;
            }

            if (userRole === 'Admin') {
                actionBtnHtml = `<div class="bg-gray-50 p-4 border-t border-gray-100 flex justify-end gap-3">
                    <button class="btn-update text-sm font-medium text-blue-600 hover:text-blue-800" data-id="${tkt.id}">Update</button>
                    <button class="btn-delete text-sm font-medium text-red-500 hover:text-red-700" data-id="${tkt.id}">Hapus</button>
                </div>`;
            }

            // Ticket Status (dummy jika tidak ada)
            const tktStatus = tkt.status || 'Valid';
            let tktStatusColor = 'bg-gray-100 text-gray-800';
            if (tktStatus === 'Valid') tktStatusColor = 'bg-green-100 text-green-800';
            else if (tktStatus === 'Dibatalkan') tktStatusColor = 'bg-red-100 text-red-800';

            card.innerHTML = `
                <div class="p-5 flex-1">
                    <div class="flex justify-between items-start mb-4">
                        <div>
                            <span class="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded tracking-wider uppercase">${tkt.code}</span>
                            <span class="text-xs font-semibold px-2 py-1 rounded ml-2 ${tktStatusColor}">${tktStatus}</span>
                        </div>
                        <span class="text-xs font-semibold px-2 py-1 rounded ${statusColor}" title="Status Pembayaran Order">${order.status}</span>
                    </div>
                    <h3 class="text-lg font-bold text-gray-800 mb-1">${ev.name}</h3>
                    <div class="text-xs text-gray-500 mb-4 flex items-center gap-1">
                        <span>📅</span> ${dateString}
                    </div>
                    
                    ${customerHtml}

                    <div class="bg-gray-50 rounded-lg p-3 text-sm">
                        <div class="flex justify-between mb-1">
                            <span class="text-gray-500">Kategori:</span>
                            <span class="font-medium text-gray-800">${cat.name}</span>
                        </div>
                        <div class="flex justify-between">
                            <span class="text-gray-500">Kursi:</span>
                            <span class="font-medium text-gray-800">${seatText}</span>
                        </div>
                    </div>
                </div>
                ${actionBtnHtml}
            `;
            cardsContainer.appendChild(card);
        });

        if (userRole === 'Admin') {
            document.querySelectorAll('.btn-delete').forEach(btn => {
                btn.addEventListener('click', (e) => deleteTicket(e.target.getAttribute('data-id')));
            });
            document.querySelectorAll('.btn-update').forEach(btn => {
                btn.addEventListener('click', (e) => openUpdateModal(e.target.getAttribute('data-id')));
            });
        }
    }

    // FUNGSI UNTUK MODAL CREATE
    function populateOrders() {
        inputOrder.innerHTML = '<option value="">-- Pilih Pesanan --</option>';
        const validOrders = orders.filter(o => {
            if (userRole === 'Admin') return true;
            const ev = events.find(e => e.id === o.eventId);
            return ev && ev.organizerId === currentUser.id;
        });

        validOrders.forEach(o => {
            const ev = events.find(e => e.id === o.eventId) || { name: '?' };
            const opt = document.createElement('option');
            opt.value = o.id;
            opt.textContent = `${o.id} — ${o.customerName} — ${ev.name}`;
            inputOrder.appendChild(opt);
        });
    }

    inputOrder.addEventListener('change', (e) => {
        const orderId = e.target.value;
        inputCategory.innerHTML = '<option value="">-- Pilih Kategori --</option>';
        inputSeat.innerHTML = '<option value="">-- Pilih Kursi Tersedia --</option>';
        seatGroup.style.display = 'none';
        inputSeat.removeAttribute('required');

        if (!orderId) {
            inputCategory.disabled = true;
            return;
        }

        const order = orders.find(o => o.id === orderId);
        if (!order) return;

        const eventId = order.eventId;
        const ev = events.find(ev => ev.id === eventId);

        inputCategory.disabled = false;

        const validCategories = categories.filter(c => c.eventId === eventId);
        validCategories.forEach(c => {
            const opt = document.createElement('option');
            opt.value = c.id;
            opt.textContent = `${c.name} — ${formatCurrency(c.price)} — (${(c.booked || 0)}/${c.quota})`;
            if ((c.booked || 0) >= c.quota) {
                opt.disabled = true;
            }
            inputCategory.appendChild(opt);
        });

        if (ev && ev.hasReservedSeating) {
            seatGroup.style.display = 'block';
            inputSeat.setAttribute('required', 'true');
            
            // Cari venueId dari event's location (dummy fallback mechanism)
            const allVenues = getTable('venues');
            const venue = allVenues.find(v => v.name === ev.location);
            const venueId = venue ? venue.id : null;

            const validSeats = seats.filter(s => s.venueId === venueId && s.isAvailable);
            validSeats.forEach(s => {
                const opt = document.createElement('option');
                opt.value = s.id;
                opt.textContent = `Section ${s.section} — Baris ${s.row}, No. ${s.number}`;
                inputSeat.appendChild(opt);
            });
        }
    });

    function openFormModal() {
        errorMsg.classList.add('hidden');
        populateOrders();
        inputCategory.innerHTML = '<option value="">-- Pilih Kategori --</option>';
        inputCategory.disabled = true;
        inputSeat.innerHTML = '<option value="">-- Pilih Kursi Tersedia --</option>';
        seatGroup.style.display = 'none';
        inputSeat.removeAttribute('required');

        modalForm.classList.remove('hidden');
    }

    function closeFormModal() {
        modalForm.classList.add('hidden');
    }

    function deleteTicket(id) {
        const tkt = tickets.find(t => t.id === id);
        if (confirm(`Apakah Anda yakin ingin menghapus aset tiket "${tkt.code}"?`)) {
            if (tkt.seatId) {
                const seatIndex = seats.findIndex(s => s.id === tkt.seatId);
                if (seatIndex !== -1) {
                    seats[seatIndex].isAvailable = true;
                    saveTable('seats', seats);
                }
            }

            tickets = tickets.filter(t => t.id !== id);
            saveTable('tickets', tickets);
            renderCards(searchInput.value, filterStatus.value);
        }
    }

    function openUpdateModal(id) {
        const tkt = tickets.find(t => t.id === id);
        if (!tkt) return;

        updateTicketId.value = tkt.id;
        updateCode.value = tkt.code;
        updateStatus.value = tkt.status || 'Valid';
        
        const ev = events.find(e => e.id === tkt.eventId);
        updateSeat.innerHTML = '<option value="">Tanpa Kursi</option>';
        updateSeatGroup.style.display = 'none';

        if (ev && ev.hasReservedSeating) {
            updateSeatGroup.style.display = 'block';
            
            // Tambahkan kursi saat ini jika ada
            if (tkt.seatId) {
                const currentSeat = seats.find(s => s.id === tkt.seatId);
                if (currentSeat) {
                    const opt = document.createElement('option');
                    opt.value = currentSeat.id;
                    opt.textContent = `[Saat Ini] Section ${currentSeat.section} — Baris ${currentSeat.row}, No. ${currentSeat.number}`;
                    updateSeat.appendChild(opt);
                }
            }

            const allVenues = getTable('venues');
            const venue = allVenues.find(v => v.name === ev.location);
            const venueId = venue ? venue.id : null;

            // Tambahkan semua kursi tersedia untuk event ini
            const availableSeats = seats.filter(s => s.venueId === venueId && s.isAvailable);
            availableSeats.forEach(s => {
                const opt = document.createElement('option');
                opt.value = s.id;
                opt.textContent = `Section ${s.section} — Baris ${s.row}, No. ${s.number}`;
                updateSeat.appendChild(opt);
            });

            updateSeat.value = tkt.seatId || "";
        }

        modalUpdate.classList.remove('hidden');
    }

    function closeUpdateModal() {
        modalUpdate.classList.add('hidden');
    }

    if (btnCancelUpdate) btnCancelUpdate.addEventListener('click', closeUpdateModal);

    if (formUpdate) {
        formUpdate.addEventListener('submit', (e) => {
            e.preventDefault();
            const id = updateTicketId.value;
            const newStatus = updateStatus.value;
            const newSeatId = updateSeat.value;

            const tktIndex = tickets.findIndex(t => t.id === id);
            if (tktIndex === -1) return;

            const tkt = tickets[tktIndex];
            
            // Perbarui kursi jika berubah
            if (tkt.seatId !== newSeatId) {
                // Bebaskan kursi lama
                if (tkt.seatId) {
                    const oldSeatIdx = seats.findIndex(s => s.id === tkt.seatId);
                    if (oldSeatIdx !== -1) seats[oldSeatIdx].isAvailable = true;
                }
                // Pakai kursi baru
                if (newSeatId) {
                    const newSeatIdx = seats.findIndex(s => s.id === newSeatId);
                    if (newSeatIdx !== -1) seats[newSeatIdx].isAvailable = false;
                }
                tkt.seatId = newSeatId || null;
                saveTable('seats', seats);
            }

            tkt.status = newStatus;
            saveTable('tickets', tickets);

            closeUpdateModal();
            renderCards(searchInput.value, filterStatus.value);
            alert(`Berhasil! Tiket ${tkt.code} telah diperbarui.`);
        });
    }

    // EVENT LISTENERS UMUM
    if (btnAdd) btnAdd.addEventListener('click', openFormModal);
    if (btnCancelForm) btnCancelForm.addEventListener('click', closeFormModal);

    if (searchInput) {
        searchInput.addEventListener('input', () => {
            renderCards(searchInput.value, filterStatus.value);
        });
    }

    if (filterStatus) {
        filterStatus.addEventListener('change', () => {
            renderCards(searchInput.value, filterStatus.value);
        });
    }

    // SUBMIT TIKET BARU
    if (formTicket) {
        formTicket.addEventListener('submit', (e) => {
            e.preventDefault();
            const orderId = inputOrder.value;
            const categoryId = inputCategory.value;
            const seatId = inputSeat.value;

            if (!orderId || !categoryId) {
                errorMsg.innerText = 'Harap pilih pesanan dan kategori!';
                errorMsg.classList.remove('hidden');
                return;
            }

            const order = orders.find(o => o.id === orderId);
            const ev = events.find(ev => ev.id === order.eventId);

            if (ev.hasReservedSeating && !seatId) {
                errorMsg.innerText = 'Harap pilih kursi!';
                errorMsg.classList.remove('hidden');
                return;
            }

            const code = 'TKT-' + Math.random().toString(36).substr(2, 6).toUpperCase();

            tickets.unshift({
                id: generateUUID(),
                code: code,
                orderId: orderId,
                eventId: order.eventId,
                categoryId: categoryId,
                seatId: seatId || null,
                status: 'Valid'
            });

            if (seatId) {
                const seatIndex = seats.findIndex(s => s.id === seatId);
                if (seatIndex !== -1) {
                    seats[seatIndex].isAvailable = false;
                    saveTable('seats', seats);
                }
            }

            const catIndex = categories.findIndex(c => c.id === categoryId);
            if (catIndex !== -1) {
                categories[catIndex].booked = (categories[catIndex].booked || 0) + 1;
                saveTable('categories', categories);
            }

            saveTable('tickets', tickets);

            closeFormModal();
            renderCards(searchInput.value, filterStatus.value);
            alert(`Berhasil! Tiket ${code} telah digenerasi.`);
        });
    }

    // Initial render
    renderCards();
});
