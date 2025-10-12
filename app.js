// app.js - Sse Manager Ver 1.6 - COMPLETAMENTE FUNZIONANTE
console.log('🏗️ Sse Manager - Caricamento Ver 1.6...');

class SseManager {
    constructor() {
        this.operai = this.loadData('operai') || [
            {id: 1, nome: "Marco Rossi", email: "marco.rossi@standardse.it", telefono: "333-1234567", specializzazione: "Elettricista", livello: 5, cantiere: 1, avatar: "⚡", preposto: true},
            {id: 2, nome: "Giuseppe Bianchi", email: "giuseppe.bianchi@standardse.it", telefono: "335-2345678", specializzazione: "Meccanico", livello: 4, cantiere: 1, avatar: "🔧", preposto: false},
            {id: 3, nome: "Antonio Verde", email: "antonio.verde@standardse.it", telefono: "338-3456789", specializzazione: "Elettricista", livello: 3, cantiere: 2, avatar: "⚡", preposto: false},
            {id: 4, nome: "Francesco Neri", email: "francesco.neri@standardse.it", telefono: "339-4567890", specializzazione: "Meccanico", livello: 5, cantiere: 2, avatar: "🔧", preposto: true},
            {id: 5, nome: "Luigi Viola", email: "luigi.viola@standardse.it", telefono: "340-5678901", specializzazione: "Elettricista", livello: 2, cantiere: null, avatar: "⚡", preposto: false},
            {id: 6, nome: "Salvatore Blu", email: "salvatore.blu@standardse.it", telefono: "346-6789012", specializzazione: "Meccanico", livello: 3, cantiere: null, avatar: "🔧", preposto: false}
        ];

        this.cantieri = this.loadData('cantieri') || [
            {id: 1, nome: "Palazzo Roma Centro", indirizzo: "Via Roma 123, Roma", tipo: "Civile", x: 150, y: 200, operai: [1, 2], calendarSelections: {}, timeSlot: {start: "08:00", end: "17:00"}},
            {id: 2, nome: "Impianto Industriale Ostia", indirizzo: "Via del Mare 45, Ostia", tipo: "Industriale", x: 400, y: 300, operai: [4, 3], calendarSelections: {}, timeSlot: {start: "07:00", end: "16:00"}},
            {id: 3, nome: "Ristrutturazione Trastevere", indirizzo: "Viale Trastevere 78, Roma", tipo: "Residenziale", x: 300, y: 150, operai: [], calendarSelections: {}, timeSlot: {start: "08:30", end: "17:30"}}
        ];

        // Sistema utenti
        this.users = this.loadData('users') || [
            {id: 1, username: 'master', password: 'Sse19731973!', type: 'master', operaioId: null, lastLogin: null},
            {id: 2, username: 'marco.rossi', password: 'password123', type: 'operaio', operaioId: 1, lastLogin: null},
            {id: 3, username: 'giuseppe.bianchi', password: 'password123', type: 'operaio', operaioId: 2, lastLogin: null}
        ];

        this.currentUser = null;
        this.draggedOperaio = null;
        this.draggedCantiere = null;
        this.isDragDropActive = false;
        this.currentCantiereId = null;
        this.currentMonth = new Date().getMonth();
        this.currentYear = new Date().getFullYear();
        this.autoSaveEnabled = true;

        this.init();
    }

    init() {
        console.log('🚀 Inizializzazione Sse Manager Ver 1.6');
        this.setupEventListeners();
        this.updateStats();
        this.setupAutoSave();
        console.log('✅ App inizializzata correttamente');
    }

    setupEventListeners() {
        // Login
        document.getElementById('login-btn').addEventListener('click', () => this.login());
        
        // Enter key per login
        document.getElementById('login-password').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.login();
        });

        // Menu
        document.getElementById('menu-btn').addEventListener('click', (e) => {
            e.stopPropagation();
            this.toggleMenu();
        });
        
        // Menu items
        document.querySelectorAll('.menu-item').forEach(item => {
            item.addEventListener('click', (e) => {
                e.stopPropagation();
                const action = e.target.dataset.action;
                this.handleMenuAction(action);
            });
        });

        // Click outside per chiudere menu
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.menu-container') && !e.target.closest('.menu-dropdown')) {
                this.closeMenu();
            }
        });

        // Gestione utenti
        document.getElementById('add-user-btn')?.addEventListener('click', () => this.addUser());
        document.getElementById('form-user')?.addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveUser();
        });
        document.getElementById('cancel-user')?.addEventListener('click', () => this.closeUserModal());
        document.getElementById('close-users')?.addEventListener('click', () => this.closeUsersModal());

        // Aggiungi operaio e cantiere
        document.getElementById('form-operaio')?.addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveOperaio();
        });
        
        document.getElementById('cancel-operaio')?.addEventListener('click', () => {
            this.closeModal('modal-operaio');
        });

        document.getElementById('form-cantiere')?.addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveCantiere();
        });
        
        document.getElementById('cancel-cantiere')?.addEventListener('click', () => {
            this.closeModal('modal-cantiere');
        });

        // Ricerca e Filtri
        document.getElementById('search-operai')?.addEventListener('input', (e) => {
            this.filterOperai();
        });
        
        document.getElementById('search-cantieri')?.addEventListener('input', (e) => {
            this.filterCantieri(e.target.value);
        });

        // Filtri avanzati
        document.getElementById('filter-specializzazione')?.addEventListener('change', () => {
            this.filterOperai();
        });
        
        document.getElementById('filter-livello')?.addEventListener('change', () => {
            this.filterOperai();
        });
        
        document.getElementById('filter-preposto')?.addEventListener('change', () => {
            this.filterOperai();
        });

        // Dettagli cantiere
        document.getElementById('close-cantiere-details')?.addEventListener('click', () => {
            this.closeCantiereModal();
        });

        document.querySelector('.prev-month')?.addEventListener('click', () => {
            this.changeMonth(-1);
        });

        document.querySelector('.next-month')?.addEventListener('click', () => {
            this.changeMonth(1);
        });

        document.getElementById('btn-send-emails')?.addEventListener('click', () => {
            this.sendParticipationEmails();
        });

        // Impostazioni
        document.getElementById('close-settings')?.addEventListener('click', () => {
            this.closeSettings();
        });

        // Info modal
        document.getElementById('close-info')?.addEventListener('click', () => {
            this.closeInfo();
        });

        document.querySelectorAll('.tab').forEach(tab => {
            tab.addEventListener('click', (e) => {
                this.showSettingsTab(e.target.dataset.tab);
            });
        });

        // Prevenire drop default
        document.addEventListener('dragover', (e) => e.preventDefault());
        document.addEventListener('drop', (e) => e.preventDefault());
        
        // Salva dati prima di chiudere la pagina
        window.addEventListener('beforeunload', () => {
            this.saveAllData();
        });
    }

    // ===== SISTEMA DI AUTENTICAZIONE =====
    login() {
        const username = document.getElementById('login-username').value.trim();
        const password = document.getElementById('login-password').value;

        if (!username || !password) {
            alert('Inserisci username e password');
            return;
        }

        const user = this.users.find(u => u.username === username && u.password === password);
        
        if (user) {
            this.currentUser = user;
            user.lastLogin = new Date().toISOString();
            this.saveAllData();
            
            console.log(`👤 Accesso effettuato come: ${user.username} (${user.type})`);
            this.showMainApp();
        } else {
            alert('❌ Credenziali non valide');
        }
    }

    showMainApp() {
        document.getElementById('login-screen').classList.add('hidden');
        document.getElementById('main-app').classList.remove('hidden');
        
        // Aggiorna interfaccia in base al tipo di utente
        this.updateUIForUserType();
        this.renderApp();
    }

    updateUIForUserType() {
        const modeText = document.getElementById('mode-text');
        const userInfo = document.getElementById('user-info');
        const masterElements = document.querySelectorAll('.master-only');

        if (this.currentUser.type === 'master') {
            modeText.textContent = 'Modalità: Master Administrator';
            userInfo.innerHTML = `<span class="user-badge master">👑 ${this.currentUser.username}</span>`;
            
            // Mostra elementi master
            masterElements.forEach(el => el.style.display = 'block');
        } else if (this.currentUser.type === 'manager') {
            modeText.textContent = 'Modalità: Manager';
            userInfo.innerHTML = `<span class="user-badge manager">👔 ${this.currentUser.username}</span>`;
            
            // Nascondi elementi master
            masterElements.forEach(el => el.style.display = 'none');
        } else {
            // Operaio
            const operaio = this.operai.find(o => o.id === this.currentUser.operaioId);
            modeText.textContent = 'Modalità: Operaio';
            userInfo.innerHTML = `<span class="user-badge operaio">👷 ${operaio ? operaio.nome : this.currentUser.username}</span>`;
            
            // Nascondi elementi master
            masterElements.forEach(el => el.style.display = 'none');
        }
    }

    logout() {
        console.log('👋 LOGOUT');
        this.saveAllData();
        document.getElementById('main-app').classList.add('hidden');
        document.getElementById('login-screen').classList.remove('hidden');
        this.closeMenu();
        this.currentUser = null;
        
        // Reset login form
        document.getElementById('login-username').value = '';
        document.getElementById('login-password').value = '';
    }

    // ===== GESTIONE UTENTI =====
    showUsersManagement() {
        if (this.currentUser.type !== 'master') {
            alert('❌ Solo gli utenti master possono gestire gli utenti');
            return;
        }
        
        this.renderUsersTable();
        this.showModal('modal-users');
    }

    renderUsersTable() {
        const tbody = document.getElementById('users-table-body');
        if (!tbody) return;
        
        tbody.innerHTML = '';

        this.users.forEach(user => {
            const operaio = user.operaioId ? this.operai.find(o => o.id === user.operaioId) : null;
            const lastLogin = user.lastLogin ? new Date(user.lastLogin).toLocaleString('it-IT') : 'Mai';
            
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${user.username} ${user.id === this.currentUser.id ? '(Tu)' : ''}</td>
                <td>
                    <span class="user-type-badge ${user.type}">
                        ${user.type === 'master' ? '👑 Master' : 
                          user.type === 'manager' ? '👔 Manager' : '👷 Operaio'}
                    </span>
                </td>
                <td>${operaio ? operaio.nome : '-'}</td>
                <td>${lastLogin}</td>
                <td>
                    <button class="btn-edit btn-small" onclick="app.editUser(${user.id})" ${user.id === this.currentUser.id ? 'disabled' : ''}>✏️</button>
                    <button class="btn-delete btn-small" onclick="app.deleteUser(${user.id})" ${user.id === this.currentUser.id ? 'disabled' : ''}>🗑️</button>
                </td>
            `;
            tbody.appendChild(row);
        });
    }

    addUser() {
        document.getElementById('modal-user-title').textContent = 'Aggiungi Utente';
        document.getElementById('form-user').reset();
        document.getElementById('user-id').value = '';
        
        // Popola dropdown operai
        const operaioSelect = document.getElementById('user-operaio');
        operaioSelect.innerHTML = '<option value="">Nessuna associazione</option>';
        this.operai.forEach(operaio => {
            const option = document.createElement('option');
            option.value = operaio.id;
            option.textContent = operaio.nome;
            operaioSelect.appendChild(option);
        });
        
        this.showModal('modal-user-form');
    }

    editUser(userId) {
        const user = this.users.find(u => u.id === userId);
        if (!user) return;

        document.getElementById('modal-user-title').textContent = 'Modifica Utente';
        document.getElementById('user-id').value = user.id;
        document.getElementById('user-username').value = user.username;
        document.getElementById('user-password').value = user.password;
        document.getElementById('user-type').value = user.type;
        
        // Popola dropdown operai
        const operaioSelect = document.getElementById('user-operaio');
        operaioSelect.innerHTML = '<option value="">Nessuna associazione</option>';
        this.operai.forEach(operaio => {
            const option = document.createElement('option');
            option.value = operaio.id;
            option.textContent = operaio.nome;
            option.selected = user.operaioId === operaio.id;
            operaioSelect.appendChild(option);
        });
        
        this.showModal('modal-user-form');
    }

    saveUser() {
        const userId = document.getElementById('user-id').value;
        const username = document.getElementById('user-username').value.trim();
        const password = document.getElementById('user-password').value;
        const type = document.getElementById('user-type').value;
        const operaioId = document.getElementById('user-operaio').value || null;

        if (!username || !password) {
            alert('Compila tutti i campi obbligatori');
            return;
        }

        // Verifica username unico
        const existingUser = this.users.find(u => u.username === username && u.id !== parseInt(userId));
        if (existingUser) {
            alert('❌ Username già esistente');
            return;
        }

        if (userId) {
            // Modifica utente esistente
            const userIndex = this.users.findIndex(u => u.id === parseInt(userId));
            if (userIndex !== -1) {
                this.users[userIndex] = {
                    ...this.users[userIndex],
                    username,
                    password,
                    type,
                    operaioId: operaioId ? parseInt(operaioId) : null
                };
            }
        } else {
            // Nuovo utente
            const newUser = {
                id: Math.max(...this.users.map(u => u.id), 0) + 1,
                username,
                password,
                type,
                operaioId: operaioId ? parseInt(operaioId) : null,
                lastLogin: null
            };
            this.users.push(newUser);
        }

        this.saveAllData();
        this.renderUsersTable();
        this.closeUserModal();
        alert('✅ Utente salvato con successo');
    }

    deleteUser(userId) {
        if (userId === this.currentUser.id) {
            alert('❌ Non puoi eliminare il tuo account');
            return;
        }

        if (confirm('Sei sicuro di voler eliminare questo utente?')) {
            this.users = this.users.filter(u => u.id !== userId);
            this.saveAllData();
            this.renderUsersTable();
            alert('✅ Utente eliminato');
        }
    }

    closeUserModal() {
        this.closeModal('modal-user-form');
    }

    closeUsersModal() {
        this.closeModal('modal-users');
    }

    // ===== GESTIONE OPERAI =====
    renderOperai() {
        const container = document.getElementById('operai-container');
        const controls = document.getElementById('controls-operai');
        
        if (!container || !controls) return;

        // Controlli solo per manager e master
        if (this.currentUser.type === 'manager' || this.currentUser.type === 'master') {
            controls.innerHTML = `
                <button class="btn btn-primary" onclick="app.addOperaio()">
                    ➕ Aggiungi Operaio
                </button>
            `;
        } else {
            controls.innerHTML = '';
        }

        container.innerHTML = '';
        
        const filteredOperai = this.getFilteredOperai();
        
        filteredOperai.forEach(operaio => {
            const operaioEl = document.createElement('div');
            operaioEl.className = `operaio-card ${operaio.cantiere ? 'assigned' : ''} ${this.isDragDropActive ? 'draggable' : ''}`;
            operaioEl.setAttribute('data-operaio-id', operaio.id);
            operaioEl.draggable = this.isDragDropActive;
            
            // Drag events solo per manager e master
            if (this.currentUser.type === 'manager' || this.currentUser.type === 'master') {
                operaioEl.addEventListener('dragstart', (e) => {
                    this.dragStartOperaio(e, operaio.id);
                });
                
                operaioEl.addEventListener('dragend', (e) => {
                    this.dragEndOperaio(e);
                });
            }

            const cantiere = operaio.cantiere ? this.cantieri.find(c => c.id === operaio.cantiere) : null;
            
            operaioEl.innerHTML = `
                <div class="operaio-header">
                    <span class="operaio-avatar">${operaio.avatar}</span>
                    <div class="operaio-info">
                        <div class="operaio-nome">${operaio.nome}</div>
                        <div class="operaio-specializzazione">${operaio.specializzazione}</div>
                    </div>
                    ${operaio.preposto ? '<span class="preposto-badge">⭐</span>' : ''}
                </div>
                <div class="operaio-details">
                    <div class="operaio-contact">
                        <span class="contact-item">📧 ${operaio.email}</span>
                        <span class="contact-item">📞 ${operaio.telefono}</span>
                    </div>
                    <div class="operaio-stats">
                        <span class="level-badge level-${operaio.livello}">Liv. ${operaio.livello}</span>
                        ${cantiere ? `<span class="cantiere-assigned">📍 ${cantiere.nome}</span>` : '<span class="cantiere-free">🆓 Disponibile</span>'}
                    </div>
                </div>
                ${(this.currentUser.type === 'manager' || this.currentUser.type === 'master') ? `
                <div class="operaio-actions">
                    <button class="btn-edit" onclick="app.editOperaio(${operaio.id})">✏️</button>
                    <button class="btn-delete" onclick="app.deleteOperaio(${operaio.id})">🗑️</button>
                </div>
                ` : ''}
            `;
            
            container.appendChild(operaioEl);
        });
    }

    getFilteredOperai() {
        const searchTerm = document.getElementById('search-operai').value.toLowerCase();
        const specializzazione = document.getElementById('filter-specializzazione').value;
        const livello = document.getElementById('filter-livello').value;
        const preposto = document.getElementById('filter-preposto').value;

        return this.operai.filter(operaio => {
            const matchesSearch = !searchTerm || 
                operaio.nome.toLowerCase().includes(searchTerm) ||
                operaio.specializzazione.toLowerCase().includes(searchTerm) ||
                operaio.email.toLowerCase().includes(searchTerm);
            
            const matchesSpecializzazione = !specializzazione || operaio.specializzazione === specializzazione;
            const matchesLivello = !livello || operaio.livello.toString() === livello;
            const matchesPreposto = !preposto || 
                (preposto === 'si' && operaio.preposto) || 
                (preposto === 'no' && !operaio.preposto);

            return matchesSearch && matchesSpecializzazione && matchesLivello && matchesPreposto;
        });
    }

    filterOperai() {
        this.renderOperai();
    }

    addOperaio() {
        document.getElementById('modal-operaio-title').textContent = 'Aggiungi Operaio';
        document.getElementById('form-operaio').reset();
        document.getElementById('operaio-id').value = '';
        this.showModal('modal-operaio');
    }

    editOperaio(id) {
        const operaio = this.operai.find(o => o.id === id);
        if (!operaio) return;

        document.getElementById('modal-operaio-title').textContent = 'Modifica Operaio';
        document.getElementById('operaio-id').value = operaio.id;
        document.getElementById('operaio-nome').value = operaio.nome;
        document.getElementById('operaio-email').value = operaio.email;
        document.getElementById('operaio-telefono').value = operaio.telefono;
        document.getElementById('operaio-specializzazione').value = operaio.specializzazione;
        document.getElementById('operaio-livello').value = operaio.livello;
        document.getElementById('operaio-preposto').checked = operaio.preposto;
        
        this.showModal('modal-operaio');
    }

    saveOperaio() {
        const id = document.getElementById('operaio-id').value;
        const nome = document.getElementById('operaio-nome').value.trim();
        const email = document.getElementById('operaio-email').value.trim();
        const telefono = document.getElementById('operaio-telefono').value.trim();
        const specializzazione = document.getElementById('operaio-specializzazione').value;
        const livello = document.getElementById('operaio-livello').value;
        const preposto = document.getElementById('operaio-preposto').checked;

        if (!nome || !email || !telefono || !specializzazione || !livello) {
            alert('Compila tutti i campi obbligatori');
            return;
        }

        const operaioData = {
            nome,
            email,
            telefono,
            specializzazione,
            livello: parseInt(livello),
            preposto,
            avatar: this.getAvatarForSpecialization(specializzazione)
        };

        if (id) {
            // Modifica operaio esistente
            const operaioIndex = this.operai.findIndex(o => o.id === parseInt(id));
            if (operaioIndex !== -1) {
                // Mantieni il cantiere esistente
                operaioData.cantiere = this.operai[operaioIndex].cantiere;
                operaioData.id = parseInt(id);
                this.operai[operaioIndex] = operaioData;
            }
        } else {
            // Nuovo operaio
            const newOperaio = {
                id: Math.max(...this.operai.map(o => o.id), 0) + 1,
                cantiere: null,
                ...operaioData
            };
            this.operai.push(newOperaio);
        }

        this.saveAllData();
        this.renderOperai();
        this.updateStats();
        this.closeModal('modal-operaio');
        alert('✅ Operaio salvato con successo');
    }

    deleteOperaio(id) {
        if (confirm('Sei sicuro di voler eliminare questo operaio?')) {
            // Rimuovi operaio dai cantieri
            this.cantieri.forEach(cantiere => {
                cantiere.operai = cantiere.operai.filter(operaioId => operaioId !== id);
            });
            
            // Rimuovi operaio
            this.operai = this.operai.filter(o => o.id !== id);
            
            this.saveAllData();
            this.renderOperai();
            this.renderCantieri();
            this.updateStats();
            alert('✅ Operaio eliminato');
        }
    }

    getAvatarForSpecialization(specializzazione) {
        const avatars = {
            'Elettricista': '⚡',
            'Meccanico': '🔧',
            'Muratore': '🧱',
            'Carpentiere': '🪵',
            'Idraulico': '🚰',
            'Saldatore': '🔥',
            'Operatore Macchine': '🚜'
        };
        return avatars[specializzazione] || '👷';
    }

    // ===== GESTIONE CANTIERI =====
    renderCantieri() {
        const container = document.getElementById('map-container');
        const controls = document.getElementById('controls-cantieri');
        
        if (!container || !controls) return;

        // Controlli solo per manager e master
        if (this.currentUser.type === 'manager' || this.currentUser.type === 'master') {
            controls.innerHTML = `
                <button class="btn btn-primary" onclick="app.addCantiere()">
                    ➕ Aggiungi Cantiere
                </button>
                <button class="btn btn-secondary" onclick="app.toggleDragDrop()">
                    ${this.isDragDropActive ? '🔒 Blocca' : '🔓 Sblocca'} Drag & Drop
                </button>
            `;
        } else {
            controls.innerHTML = '';
        }

        container.innerHTML = '';
        
        const searchTerm = document.getElementById('search-cantieri')?.value.toLowerCase() || '';
        const filteredCantieri = this.cantieri.filter(cantiere => 
            !searchTerm || cantiere.nome.toLowerCase().includes(searchTerm)
        );

        filteredCantieri.forEach(cantiere => {
            const cantiereEl = document.createElement('div');
            cantiereEl.className = `cantiere-card ${cantiere.tipo.toLowerCase()} ${this.isDragDropActive ? 'drop-target' : ''}`;
            cantiereEl.style.left = `${cantiere.x}px`;
            cantiereEl.style.top = `${cantiere.y}px`;
            cantiereEl.setAttribute('data-cantiere-id', cantiere.id);

            // Drag events per spostamento cantieri (solo manager/master)
            if (this.currentUser.type === 'manager' || this.currentUser.type === 'master') {
                cantiereEl.draggable = true;
                
                cantiereEl.addEventListener('dragstart', (e) => {
                    this.dragStartCantiere(e, cantiere.id);
                });
                
                cantiereEl.addEventListener('dragover', (e) => {
                    e.preventDefault();
                    if (this.draggedOperaio) {
                        cantiereEl.classList.add('drag-over');
                    }
                });
                
                cantiereEl.addEventListener('dragleave', (e) => {
                    cantiereEl.classList.remove('drag-over');
                });
                
                cantiereEl.addEventListener('drop', (e) => {
                    e.preventDefault();
                    cantiereEl.classList.remove('drag-over');
                    
                    if (this.draggedOperaio) {
                        this.assignOperaioToCantiere(this.draggedOperaio, cantiere.id);
                    }
                });
                
                cantiereEl.addEventListener('dragend', (e) => {
                    this.dragEndCantiere(e);
                });
            }

            const assignedOperai = this.operai.filter(o => o.cantiere === cantiere.id);
            
            cantiereEl.innerHTML = `
                <div class="cantiere-header">
                    <div class="cantiere-icon">${this.getCantiereIcon(cantiere.tipo)}</div>
                    <div class="cantiere-info">
                        <div class="cantiere-nome">${cantiere.nome}</div>
                        <div class="cantiere-indirizzo">${cantiere.indirizzo}</div>
                    </div>
                </div>
                <div class="cantiere-stats">
                    <div class="operai-count">👷 ${assignedOperai.length} operai</div>
                    <div class="cantiere-tipo">${cantiere.tipo}</div>
                </div>
                <div class="cantiere-operai">
                    ${assignedOperai.slice(0, 3).map(operaio => `
                        <div class="mini-operaio" title="${operaio.nome}">
                            ${operaio.avatar}
                        </div>
                    `).join('')}
                    ${assignedOperai.length > 3 ? `<div class="more-operai">+${assignedOperai.length - 3}</div>` : ''}
                </div>
                <div class="cantiere-actions">
                    <button class="btn-details" onclick="app.showCantiereDetails(${cantiere.id})">👁️ Dettagli</button>
                    ${(this.currentUser.type === 'manager' || this.currentUser.type === 'master') ? `
                    <button class="btn-edit" onclick="app.editCantiere(${cantiere.id})">✏️</button>
                    <button class="btn-delete" onclick="app.deleteCantiere(${cantiere.id})">🗑️</button>
                    ` : ''}
                </div>
            `;
            
            container.appendChild(cantiereEl);
        });
    }

    filterCantieri(searchTerm) {
        this.renderCantieri();
    }

    addCantiere() {
        document.getElementById('modal-cantiere-title').textContent = 'Aggiungi Cantiere';
        document.getElementById('form-cantiere').reset();
        document.getElementById('cantiere-id').value = '';
        this.showModal('modal-cantiere');
    }

    editCantiere(id) {
        const cantiere = this.cantieri.find(c => c.id === id);
        if (!cantiere) return;

        document.getElementById('modal-cantiere-title').textContent = 'Modifica Cantiere';
        document.getElementById('cantiere-id').value = cantiere.id;
        document.getElementById('cantiere-nome').value = cantiere.nome;
        document.getElementById('cantiere-indirizzo').value = cantiere.indirizzo;
        document.getElementById('cantiere-tipo').value = cantiere.tipo;
        
        this.showModal('modal-cantiere');
    }

    saveCantiere() {
        const id = document.getElementById('cantiere-id').value;
        const nome = document.getElementById('cantiere-nome').value.trim();
        const indirizzo = document.getElementById('cantiere-indirizzo').value.trim();
        const tipo = document.getElementById('cantiere-tipo').value;

        if (!nome || !indirizzo || !tipo) {
            alert('Compila tutti i campi obbligatori');
            return;
        }

        const cantiereData = {
            nome,
            indirizzo,
            tipo
        };

        if (id) {
            // Modifica cantiere esistente
            const cantiereIndex = this.cantieri.findIndex(c => c.id === parseInt(id));
            if (cantiereIndex !== -1) {
                cantiereData.id = parseInt(id);
                cantiereData.x = this.cantieri[cantiereIndex].x;
                cantiereData.y = this.cantieri[cantiereIndex].y;
                cantiereData.operai = this.cantieri[cantiereIndex].operai;
                cantiereData.calendarSelections = this.cantieri[cantiereIndex].calendarSelections;
                cantiereData.timeSlot = this.cantieri[cantiereIndex].timeSlot;
                this.cantieri[cantiereIndex] = cantiereData;
            }
        } else {
            // Nuovo cantiere
            const newCantiere = {
                id: Math.max(...this.cantieri.map(c => c.id), 0) + 1,
                x: Math.random() * 500 + 50,
                y: Math.random() * 300 + 50,
                operai: [],
                calendarSelections: {},
                timeSlot: { start: "08:00", end: "17:00" },
                ...cantiereData
            };
            this.cantieri.push(newCantiere);
        }

        this.saveAllData();
        this.renderCantieri();
        this.updateStats();
        this.closeModal('modal-cantiere');
        alert('✅ Cantiere salvato con successo');
    }

    deleteCantiere(id) {
        if (confirm('Sei sicuro di voler eliminare questo cantiere? Tutti gli operai verranno rilasciati.')) {
            // Rilascia operai dal cantiere
            this.operai.forEach(operaio => {
                if (operaio.cantiere === id) {
                    operaio.cantiere = null;
                }
            });
            
            // Rimuovi cantiere
            this.cantieri = this.cantieri.filter(c => c.id !== id);
            
            this.saveAllData();
            this.renderOperai();
            this.renderCantieri();
            this.updateStats();
            alert('✅ Cantiere eliminato');
        }
    }

    getCantiereIcon(tipo) {
        const icons = {
            'Civile': '🏰',
            'Industriale': '🏭',
            'Residenziale': '🏢',
            'Stradale': '🛣️',
            'Ferroviario': '🚂'
        };
        return icons[tipo] || '🏗️';
    }

    // ===== DRAG & DROP =====
    dragStartOperaio(e, operaioId) {
        if (!this.isDragDropActive) {
            e.preventDefault();
            return;
        }
        
        this.draggedOperaio = operaioId;
        e.dataTransfer.setData('text/plain', operaioId.toString());
        e.target.classList.add('dragging');
        
        console.log(`👷 Inizio drag operaio: ${operaioId}`);
    }

    dragEndOperaio(e) {
        e.target.classList.remove('dragging');
        this.draggedOperaio = null;
    }

    dragStartCantiere(e, cantiereId) {
        if (!this.isDragDropActive) {
            e.preventDefault();
            return;
        }
        
        this.draggedCantiere = cantiereId;
        e.dataTransfer.setData('text/plain', cantiereId.toString());
        e.target.classList.add('dragging');
        
        console.log(`🏗️ Inizio drag cantiere: ${cantiereId}`);
    }

    dragEndCantiere(e) {
        e.target.classList.remove('dragging');
        
        if (this.draggedCantiere) {
            const cantiere = this.cantieri.find(c => c.id === this.draggedCantiere);
            if (cantiere) {
                // Aggiorna posizione cantiere
                const rect = e.target.getBoundingClientRect();
                const containerRect = e.target.parentElement.getBoundingClientRect();
                
                cantiere.x = rect.left - containerRect.left;
                cantiere.y = rect.top - containerRect.top;
                
                this.saveAllData();
                console.log(`📍 Cantiere ${cantiere.nome} spostato a (${cantiere.x}, ${cantiere.y})`);
            }
        }
        
        this.draggedCantiere = null;
    }

    assignOperaioToCantiere(operaioId, cantiereId) {
        if (!this.isDragDropActive) return;
        
        const operaio = this.operai.find(o => o.id === operaioId);
        const cantiere = this.cantieri.find(c => c.id === cantiereId);
        
        if (!operaio || !cantiere) return;

        // Rimuovi operaio dal cantiere precedente
        const oldCantiere = this.cantieri.find(c => c.id === operaio.cantiere);
        if (oldCantiere) {
            oldCantiere.operai = oldCantiere.operai.filter(id => id !== operaioId);
        }

        // Assegna al nuovo cantiere
        operaio.cantiere = cantiereId;
        if (!cantiere.operai.includes(operaioId)) {
            cantiere.operai.push(operaioId);
        }

        this.saveAllData();
        this.renderOperai();
        this.renderCantieri();
        this.updateStats();
        
        console.log(`✅ Operaio ${operaio.nome} assegnato a ${cantiere.nome}`);
    }

    toggleDragDrop() {
        this.isDragDropActive = !this.isDragDropActive;
        
        // Aggiorna interfaccia
        this.renderOperai();
        this.renderCantieri();
        
        const btn = document.querySelector('.btn-secondary');
        if (btn) {
            btn.textContent = this.isDragDropActive ? '🔒 Blocca' : '🔓 Sblocca Drag & Drop';
        }
        
        console.log(`🔄 Drag & Drop ${this.isDragDropActive ? 'attivato' : 'disattivato'}`);
    }

    // ===== DETTAGLI CANTIERE =====
    showCantiereDetails(cantiereId) {
        const cantiere = this.cantieri.find(c => c.id === cantiereId);
        if (!cantiere) return;

        this.currentCantiereId = cantiereId;
        
        // Aggiorna titolo
        document.getElementById('cantiere-details-title').textContent = cantiere.nome;
        
        // Informazioni base
        const basicInfo = document.getElementById('cantiere-basic-info');
        basicInfo.innerHTML = `
            <p><strong>📍 Indirizzo:</strong> ${cantiere.indirizzo}</p>
            <p><strong>🏗️ Tipo:</strong> ${cantiere.tipo}</p>
            <p><strong>👷 Operai Assegnati:</strong> ${cantiere.operai.length}</p>
            <p><strong>⏰ Orario Lavoro:</strong> ${cantiere.timeSlot.start} - ${cantiere.timeSlot.end}</p>
        `;

        // Lista operai
        this.renderCantiereOperaiList(cantiereId);
        
        // Calendario
        this.renderCalendar(cantiereId);
        
        // Time slot
        document.getElementById('time-start').value = cantiere.timeSlot.start;
        document.getElementById('time-end').value = cantiere.timeSlot.end;
        
        // Event listeners per time slot
        document.getElementById('time-start').addEventListener('change', (e) => {
            cantiere.timeSlot.start = e.target.value;
            this.saveAllData();
        });
        
        document.getElementById('time-end').addEventListener('change', (e) => {
            cantiere.timeSlot.end = e.target.value;
            this.saveAllData();
        });

        this.showModal('modal-cantiere-details');
    }

    renderCantiereOperaiList(cantiereId) {
        const listContainer = document.getElementById('cantiere-operai-list');
        const assignedOperai = this.operai.filter(o => o.cantiere === cantiereId);
        
        if (assignedOperai.length === 0) {
            listContainer.innerHTML = '<p class="no-operai">Nessun operaio assegnato</p>';
            return;
        }

        listContainer.innerHTML = assignedOperai.map(operaio => `
            <div class="cantiere-operaio-item">
                <div class="operaio-avatar">${operaio.avatar}</div>
                <div class="operaio-details">
                    <div class="operaio-nome">${operaio.nome}</div>
                    <div class="operaio-specializzazione">${operaio.specializzazione} - Liv. ${operaio.livello}</div>
                    <div class="operaio-contact">📧 ${operaio.email} | 📞 ${operaio.telefono}</div>
                </div>
                ${operaio.preposto ? '<span class="preposto-badge">⭐ Preposto</span>' : ''}
                ${(this.currentUser.type === 'manager' || this.currentUser.type === 'master') ? `
                <button class="btn-remove" onclick="app.removeOperaioFromCantiere(${operaio.id}, ${cantiereId})">
                    🗑️
                </button>
                ` : ''}
            </div>
        `).join('');
    }

    removeOperaioFromCantiere(operaioId, cantiereId) {
        const operaio = this.operai.find(o => o.id === operaioId);
        const cantiere = this.cantieri.find(c => c.id === cantiereId);
        
        if (operaio && cantiere) {
            operaio.cantiere = null;
            cantiere.operai = cantiere.operai.filter(id => id !== operaioId);
            
            this.saveAllData();
            this.renderOperai();
            this.renderCantiereOperaiList(cantiereId);
            this.updateStats();
            
            alert(`✅ ${operaio.nome} rimosso dal cantiere`);
        }
    }

    renderCalendar(cantiereId) {
        const cantiere = this.cantieri.find(c => c.id === cantiereId);
        if (!cantiere) return;

        // Aggiorna header calendario
        const monthYear = document.getElementById('calendar-month-year');
        const monthNames = ['Gennaio', 'Febbraio', 'Marzo', 'Aprile', 'Maggio', 'Giugno',
                           'Luglio', 'Agosto', 'Settembre', 'Ottobre', 'Novembre', 'Dicembre'];
        monthYear.textContent = `${monthNames[this.currentMonth]} ${this.currentYear}`;

        // Genera calendario
        const firstDay = new Date(this.currentYear, this.currentMonth, 1);
        const lastDay = new Date(this.currentYear, this.currentMonth + 1, 0);
        const startDate = new Date(firstDay);
        startDate.setDate(startDate.getDate() - firstDay.getDay());

        const calendarGrid = document.getElementById('calendar-grid');
        calendarGrid.innerHTML = '';

        // Intestazioni giorni
        const dayNames = ['Dom', 'Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab'];
        dayNames.forEach(day => {
            const dayHeader = document.createElement('div');
            dayHeader.className = 'calendar-day-header';
            dayHeader.textContent = day;
            calendarGrid.appendChild(dayHeader);
        });

        // Celle calendario
        const currentDate = new Date(startDate);
        for (let i = 0; i < 42; i++) {
            const cell = document.createElement('div');
            cell.className = 'calendar-cell';
            
            if (currentDate.getMonth() === this.currentMonth) {
                cell.classList.add('current-month');
                cell.textContent = currentDate.getDate();
                
                const dateKey = this.formatDateKey(currentDate);
                if (cantiere.calendarSelections[dateKey]) {
                    cell.classList.add('selected');
                }
                
                cell.addEventListener('click', () => {
                    this.toggleCalendarDate(cantiereId, currentDate);
                });
            }
            
            calendarGrid.appendChild(cell);
            currentDate.setDate(currentDate.getDate() + 1);
        }
    }

    toggleCalendarDate(cantiereId, date) {
        const cantiere = this.cantieri.find(c => c.id === cantiereId);
        if (!cantiere) return;

        const dateKey = this.formatDateKey(date);
        
        if (cantiere.calendarSelections[dateKey]) {
            delete cantiere.calendarSelections[dateKey];
        } else {
            cantiere.calendarSelections[dateKey] = true;
        }
        
        this.saveAllData();
        this.renderCalendar(cantiereId);
    }

    formatDateKey(date) {
        return date.toISOString().split('T')[0]; // YYYY-MM-DD
    }

    changeMonth(delta) {
        this.currentMonth += delta;
        
        if (this.currentMonth > 11) {
            this.currentMonth = 0;
            this.currentYear++;
        } else if (this.currentMonth < 0) {
            this.currentMonth = 11;
            this.currentYear--;
        }
        
        this.renderCalendar(this.currentCantiereId);
    }

    closeCantiereModal() {
        this.closeModal('modal-cantiere-details');
        this.currentCantiereId = null;
    }

    // ===== EMAIL SYSTEM =====
    sendParticipationEmails() {
        const cantiere = this.cantieri.find(c => c.id === this.currentCantiereId);
        if (!cantiere) return;

        const assignedOperai = this.operai.filter(o => o.cantiere === cantiere.id);
        if (assignedOperai.length === 0) {
            alert('❌ Nessun operaio assegnato al cantiere');
            return;
        }

        // Simulazione invio email
        console.log('📧 Invio email di partecipazione:');
        assignedOperai.forEach(operaio => {
            console.log(`   → Inviata a: ${operaio.email} (${operaio.nome})`);
        });

        alert(`✅ Email di partecipazione inviate a ${assignedOperai.length} operai`);
    }

    // ===== GESTIONE DATI =====
    exportOperaiToExcel() {
        // Prepara i dati per l'export
        const data = this.operai.map(operaio => {
            const cantiere = operaio.cantiere ? this.cantieri.find(c => c.id === operaio.cantiere) : null;
            
            return {
                'ID': operaio.id,
                'Nome Completo': operaio.nome,
                'Email': operaio.email,
                'Telefono': operaio.telefono,
                'Specializzazione': operaio.specializzazione,
                'Livello': operaio.livello,
                'Preposto': operaio.preposto ? 'Sì' : 'No',
                'Cantiere Assegnato': cantiere ? cantiere.nome : 'Nessuno',
                'Indirizzo Cantiere': cantiere ? cantiere.indirizzo : '',
                'Tipo Cantiere': cantiere ? cantiere.tipo : ''
            };
        });

        // Crea CSV nel formato richiesto
        const headers = ['ID', 'Nome Completo', 'Email', 'Telefono', 'Specializzazione', 'Livello', 'Preposto', 'Cantiere Assegnato', 'Indirizzo Cantiere', 'Tipo Cantiere'];
        const csvContent = [
            headers.join(','),
            ...data.map(row => headers.map(header => {
                let value = row[header] || '';
                // Escape valori che contengono virgole
                if (typeof value === 'string' && value.includes(',')) {
                    value = `"${value}"`;
                }
                return value;
            }).join(','))
        ].join('\n');

        // Crea e scarica file
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        
        link.setAttribute('href', url);
        link.setAttribute('download', `dipendenti_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        console.log('📤 Export dipendenti completato');
    }

    importOperaiFromCSV(csvText) {
        try {
            const lines = csvText.split('\n').filter(line => line.trim());
            const headers = lines[0].split(',').map(h => h.trim());
            
            const newOperai = [];
            
            for (let i = 1; i < lines.length; i++) {
                const values = this.parseCSVLine(lines[i]);
                if (values.length !== headers.length) continue;
                
                const row = {};
                headers.forEach((header, index) => {
                    row[header] = values[index];
                });
                
                // Mappa i campi CSV alla struttura operai
                const operaio = {
                    id: parseInt(row['ID']) || Math.max(...this.operai.map(o => o.id), 0) + 1,
                    nome: row['Nome Completo'] || '',
                    email: row['Email'] || '',
                    telefono: row['Telefono'] || '',
                    specializzazione: row['Specializzazione'] || '',
                    livello: parseInt(row['Livello']) || 1,
                    preposto: row['Preposto'] === 'Sì',
                    cantiere: null, // Verrà assegnato successivamente
                    avatar: this.getAvatarForSpecialization(row['Specializzazione'] || '')
                };
                
                newOperai.push(operaio);
            }
            
            // Sostituisci gli operai esistenti
            this.operai = newOperai;
            this.saveAllData();
            this.renderOperai();
            this.updateStats();
            
            alert(`✅ Importati ${newOperai.length} operai`);
            
        } catch (error) {
            console.error('❌ Errore durante l\'import:', error);
            alert('❌ Errore durante l\'import del file CSV');
        }
    }

    parseCSVLine(line) {
        const result = [];
        let current = '';
        let inQuotes = false;
        
        for (let i = 0; i < line.length; i++) {
            const char = line[i];
            
            if (char === '"') {
                inQuotes = !inQuotes;
            } else if (char === ',' && !inQuotes) {
                result.push(current.trim());
                current = '';
            } else {
                current += char;
            }
        }
        
        result.push(current.trim());
        return result;
    }

    // ===== IMPOSTAZIONI =====
    showSettings() {
        this.showModal('modal-settings');
        this.showSettingsTab('email');
    }

    showSettingsTab(tabName) {
        // Nascondi tutti i tab
        document.querySelectorAll('.tab-content').forEach(tab => {
            tab.classList.add('hidden');
        });
        
        // Rimuovi active da tutte le tab
        document.querySelectorAll('.tab').forEach(tab => {
            tab.classList.remove('active');
        });
        
        // Mostra tab selezionato
        document.getElementById(`settings-${tabName}`).classList.remove('hidden');
        document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');
    }

    closeSettings() {
        this.closeModal('modal-settings');
    }

    showInfo() {
        // Aggiorna statistiche
        document.getElementById('info-total-operai').textContent = this.operai.length;
        document.getElementById('info-assigned-operai').textContent = this.operai.filter(o => o.cantiere).length;
        document.getElementById('info-total-cantieri').textContent = this.cantieri.length;
        
        this.showModal('modal-info');
    }

    closeInfo() {
        this.closeModal('modal-info');
    }

    // ===== MENU SYSTEM =====
    toggleMenu() {
        const menu = document.getElementById('menu-dropdown');
        menu.classList.toggle('hidden');
    }

    closeMenu() {
        const menu = document.getElementById('menu-dropdown');
        menu.classList.add('hidden');
    }

    handleMenuAction(action) {
        this.closeMenu();
        
        switch (action) {
            case 'manage-users':
                this.showUsersManagement();
                break;
                
            case 'export-operai':
                this.exportOperaiToExcel();
                break;
                
            case 'import-operai':
                this.handleImportOperai();
                break;
                
            case 'focus-search-operai':
                document.getElementById('search-operai').focus();
                break;
                
            case 'focus-search-cantieri':
                document.getElementById('search-cantieri').focus();
                break;
                
            case 'show-operai-list':
                // Già visibile
                break;
                
            case 'show-cantieri-list':
                // Già visibile
                break;
                
            case 'show-modify-cantiere':
                alert('💡 Clicca sul pulsante ✏️ di un cantiere per modificarlo');
                break;
                
            case 'show-delete-cantiere':
                alert('💡 Clicca sul pulsante 🗑️ di un cantiere per eliminarlo');
                break;
                
            case 'export-data':
                this.exportAllData();
                break;
                
            case 'import-data':
                this.importAllData();
                break;
                
            case 'open-settings':
                this.showSettings();
                break;
                
            case 'open-general-settings':
                this.showSettings();
                this.showSettingsTab('general');
                break;
                
            case 'show-info':
                this.showInfo();
                break;
                
            case 'logout':
                this.logout();
                break;
                
            default:
                console.log('Azione menu non gestita:', action);
        }
    }

    handleImportOperai() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.csv';
        
        input.onchange = (e) => {
            const file = e.target.files[0];
            if (!file) return;
            
            const reader = new FileReader();
            reader.onload = (event) => {
                this.importOperaiFromCSV(event.target.result);
            };
            reader.readAsText(file);
        };
        
        input.click();
    }

    // ===== UTILITIES =====
    showModal(modalId) {
        document.getElementById(modalId).classList.remove('hidden');
    }

    closeModal(modalId) {
        document.getElementById(modalId).classList.add('hidden');
    }

    updateStats() {
        const totalOperai = this.operai.length;
        const assignedOperai = this.operai.filter(o => o.cantiere).length;
        const totalCantieri = this.cantieri.length;

        document.getElementById('total-operai').textContent = totalOperai;
        document.getElementById('assigned-operai').textContent = assignedOperai;
        document.getElementById('total-cantieri').textContent = totalCantieri;
    }

    renderApp() {
        this.renderOperai();
        this.renderCantieri();
        this.updateStats();
    }

    // ===== GESTIONE DATI LOCALI =====
    loadData(key) {
        try {
            const data = localStorage.getItem(`sse-manager-${key}`);
            return data ? JSON.parse(data) : null;
        } catch (error) {
            console.error(`❌ Errore nel caricamento ${key}:`, error);
            return null;
        }
    }

    saveData(key, data) {
        try {
            localStorage.setItem(`sse-manager-${key}`, JSON.stringify(data));
        } catch (error) {
            console.error(`❌ Errore nel salvataggio ${key}:`, error);
        }
    }

    saveAllData() {
        if (!this.autoSaveEnabled) return;
        
        this.saveData('operai', this.operai);
        this.saveData('cantieri', this.cantieri);
        this.saveData('users', this.users);
        
        console.log('💾 Dati salvati');
    }

    setupAutoSave() {
        // Salva automaticamente ogni 30 secondi
        setInterval(() => {
            this.saveAllData();
        }, 30000);
    }

    exportAllData() {
        const data = {
            operai: this.operai,
            cantieri: this.cantieri,
            users: this.users,
            exportDate: new Date().toISOString(),
            version: '1.6'
        };
        
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        
        link.setAttribute('href', url);
        link.setAttribute('download', `sse-manager-backup-${new Date().toISOString().split('T')[0]}.json`);
        link.style.visibility = 'hidden';
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        console.log('💾 Backup dati esportato');
    }

    importAllData() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        
        input.onchange = (e) => {
            const file = e.target.files[0];
            if (!file) return;
            
            const reader = new FileReader();
            reader.onload = (event) => {
                try {
                    const data = JSON.parse(event.target.result);
                    
                    if (data.operai) this.operai = data.operai;
                    if (data.cantieri) this.cantieri = data.cantieri;
                    if (data.users) this.users = data.users;
                    
                    this.saveAllData();
                    this.renderApp();
                    
                    alert('✅ Dati importati con successo');
                } catch (error) {
                    console.error('❌ Errore durante l\'import:', error);
                    alert('❌ Errore durante l\'import del file');
                }
            };
            reader.readAsText(file);
        };
        
        input.click();
    }
}

// Inizializzazione app
const app = new SseManager();
console.log('🎉 Sse Manager Ver 1.6 pronto!');