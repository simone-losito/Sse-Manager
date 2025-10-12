// app.js - Sse Manager Ver 1.6.3 - COMPLETO E FUNZIONANTE
console.log('🏗️ Sse Manager - Caricamento Ver 1.6.3...');

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

        this.users = this.loadData('users') || [
            {id: 1, username: 'master', password: 'Sse19731973!', type: 'master', operaioId: null, lastLogin: null},
            {id: 2, username: 'marco.rossi', password: 'password123', type: 'operaio', operaioId: 1, lastLogin: null},
            {id: 3, username: 'giuseppe.bianchi', password: 'password123', type: 'operaio', operaioId: 2, lastLogin: null}
        ];

        this.currentUser = null;
        this.draggedOperaio = null;
        this.draggedCantiere = null;
        this.isDragDropActive = true;
        this.currentCantiereId = null;
        this.currentMonth = new Date().getMonth();
        this.currentYear = new Date().getFullYear();
        this.autoSaveEnabled = true;

        this.init();
    }

    init() {
        console.log('🚀 Inizializzazione Sse Manager Ver 1.6.3');
        this.setupEventListeners();
        this.updateStats();
        this.setupAutoSave();
    }

    setupEventListeners() {
        // Login
        document.getElementById('login-btn').addEventListener('click', () => this.login());
        document.getElementById('login-password').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.login();
        });

        // Menu
        document.getElementById('menu-btn').addEventListener('click', (e) => {
            e.stopPropagation();
            this.toggleMenu();
        });
        
        document.querySelectorAll('.menu-item').forEach(item => {
            item.addEventListener('click', (e) => {
                e.stopPropagation();
                const action = e.target.dataset.action;
                this.handleMenuAction(action);
            });
        });

        document.addEventListener('click', () => this.closeMenu());

        // Forms
        document.getElementById('form-operaio')?.addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveOperaio();
        });
        
        document.getElementById('form-cantiere')?.addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveCantiere();
        });

        // Ricerca e Filtri
        document.getElementById('search-operai')?.addEventListener('input', () => this.filterOperai());
        document.getElementById('search-cantieri')?.addEventListener('input', (e) => {
            this.filterCantieri(e.target.value);
        });

        document.getElementById('filter-specializzazione')?.addEventListener('change', () => this.filterOperai());
        document.getElementById('filter-livello')?.addEventListener('change', () => this.filterOperai());
        document.getElementById('filter-preposto')?.addEventListener('change', () => this.filterOperai());

        // Modal buttons
        document.getElementById('cancel-operaio')?.addEventListener('click', () => this.closeModal('modal-operaio'));
        document.getElementById('cancel-cantiere')?.addEventListener('click', () => this.closeModal('modal-cantiere'));
        document.getElementById('close-cantiere-details')?.addEventListener('click', () => this.closeModal('modal-cantiere-details'));
        document.getElementById('close-users')?.addEventListener('click', () => this.closeModal('modal-users'));
        document.getElementById('cancel-user')?.addEventListener('click', () => this.closeModal('modal-user-form'));
        document.getElementById('close-settings')?.addEventListener('click', () => this.closeModal('modal-settings'));
        document.getElementById('close-info')?.addEventListener('click', () => this.closeModal('modal-info'));

        // Calendar
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('prev-month')) this.changeMonth(-1);
            if (e.target.classList.contains('next-month')) this.changeMonth(1);
        });

        // Email
        document.getElementById('btn-send-emails')?.addEventListener('click', () => this.sendParticipationEmails());

        // Users
        document.getElementById('add-user-btn')?.addEventListener('click', () => this.addUser());
        document.getElementById('form-user')?.addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveUser();
        });

        // Drag & Drop globale
        document.addEventListener('dragover', (e) => {
            e.preventDefault();
            e.dataTransfer.dropEffect = 'move';
        });
        
        document.addEventListener('drop', (e) => e.preventDefault());

        window.addEventListener('beforeunload', () => this.saveAllData());
    }

    // ===== GESTIONE MENU =====
    handleMenuAction(action) {
        console.log('Menu action:', action);
        switch(action) {
            case 'logout':
                this.logout();
                break;
            case 'manage-users':
                this.showUserManagement();
                break;
            case 'show-info':
                this.showInfo();
                break;
            case 'focus-search-operai':
                document.getElementById('search-operai')?.focus();
                break;
            case 'focus-search-cantieri':
                document.getElementById('search-cantieri')?.focus();
                break;
            case 'open-settings':
                this.showSettings();
                break;
            case 'open-general-settings':
                this.showSettings('general');
                break;
            case 'export-operai':
                this.exportOperaiCSV();
                break;
            default:
                console.warn('Azione menu non gestita:', action);
                alert('Funzionalità in sviluppo: ' + action);
        }
        this.closeMenu();
    }

    toggleMenu() {
        const menu = document.getElementById('menu-dropdown');
        menu.classList.toggle('hidden');
    }

    closeMenu() {
        const menu = document.getElementById('menu-dropdown');
        menu.classList.add('hidden');
    }

    // ===== GESTIONE MODAL =====
    showModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.remove('hidden');
        }
    }

    closeModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.add('hidden');
        }
    }

    // ===== AUTENTICAZIONE =====
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
            this.showMainApp();
        } else {
            alert('❌ Credenziali non valide');
        }
    }

    showMainApp() {
        document.getElementById('login-screen').classList.add('hidden');
        document.getElementById('main-app').classList.remove('hidden');
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
            masterElements.forEach(el => el.style.display = 'block');
        } else if (this.currentUser.type === 'manager') {
            modeText.textContent = 'Modalità: Manager';
            userInfo.innerHTML = `<span class="user-badge manager">👔 ${this.currentUser.username}</span>`;
            masterElements.forEach(el => el.style.display = 'none');
        } else {
            const operaio = this.operai.find(o => o.id === this.currentUser.operaioId);
            modeText.textContent = 'Modalità: Operaio';
            userInfo.innerHTML = `<span class="user-badge operaio">👷 ${operaio ? operaio.nome : this.currentUser.username}</span>`;
            masterElements.forEach(el => el.style.display = 'none');
        }
    }

    logout() {
        this.saveAllData();
        document.getElementById('main-app').classList.add('hidden');
        document.getElementById('login-screen').classList.remove('hidden');
        this.closeMenu();
        this.currentUser = null;
        document.getElementById('login-username').value = '';
        document.getElementById('login-password').value = '';
    }

    // ===== RENDER APPLICAZIONE =====
    renderApp() {
        this.renderOperai();
        this.renderCantieri();
        this.updateStats();
    }

    updateStats() {
        const totalOperai = this.operai.length;
        const assignedOperai = this.operai.filter(o => o.cantiere !== null).length;
        const totalCantieri = this.cantieri.length;
        
        document.getElementById('total-operai').textContent = totalOperai;
        document.getElementById('assigned-operai').textContent = assignedOperai;
        document.getElementById('total-cantieri').textContent = totalCantieri;
        
        // Aggiorna anche le info nel modal info
        document.getElementById('info-total-operai').textContent = totalOperai;
        document.getElementById('info-assigned-operai').textContent = assignedOperai;
        document.getElementById('info-total-cantieri').textContent = totalCantieri;
    }

    // ===== GESTIONE OPERAI =====
    renderOperai() {
        const container = document.getElementById('operai-container');
        const controls = document.getElementById('controls-operai');
        
        if (!container) return;
        
        container.innerHTML = '';
        
        // Controlli solo per manager e master
        if (this.currentUser.type === 'manager' || this.currentUser.type === 'master') {
            controls.innerHTML = '<button class="btn btn-primary" onclick="app.addOperaio()">➕ Aggiungi Operaio</button>';
        } else {
            controls.innerHTML = '';
        }

        const filteredOperai = this.getFilteredOperai();
        
        filteredOperai.forEach(operaio => {
            const card = document.createElement('div');
            card.className = `operaio-card ${operaio.cantiere ? 'assigned' : ''}`;
            card.draggable = (this.currentUser.type === 'manager' || this.currentUser.type === 'master');
            card.dataset.operaioId = operaio.id;
            
            // Setup drag events
            if (this.currentUser.type === 'manager' || this.currentUser.type === 'master') {
                card.addEventListener('dragstart', (e) => {
                    this.draggedOperaio = operaio.id;
                    e.dataTransfer.setData('text/plain', operaio.id.toString());
                    card.classList.add('dragging');
                });
                
                card.addEventListener('dragend', () => {
                    card.classList.remove('dragging');
                    this.draggedOperaio = null;
                });
            }

            const cantiere = operaio.cantiere ? this.cantieri.find(c => c.id === operaio.cantiere) : null;
            
            card.innerHTML = `
                <div class="operaio-header">
                    <span class="operaio-avatar">${operaio.avatar}</span>
                    <div class="operaio-info">
                        <div class="operaio-nome">${operaio.nome}</div>
                        <div class="operaio-spec">${operaio.specializzazione}</div>
                        <div class="operaio-level">Livello ${operaio.livello}</div>
                    </div>
                </div>
                <div class="operaio-status">${operaio.cantiere === null ? 'Disponibile' : 'Assegnato'}</div>
                <div class="operaio-contact">
                    📧 ${operaio.email}<br>
                    📞 ${operaio.telefono}
                </div>
                ${operaio.preposto ? '<div class="operaio-preposto">⭐ Preposto ⭐</div>' : ''}
                ${cantiere ? `<div class="assignment-info">📍 Assegnato a: ${cantiere.nome}</div>` : ''}
                ${(this.currentUser.type === 'manager' || this.currentUser.type === 'master') ? `
                <div class="operaio-actions">
                    <button class="btn btn-edit" onclick="app.editOperaio(${operaio.id})">✏️</button>
                    <button class="btn btn-delete" onclick="app.removeOperaio(${operaio.id})">🗑️</button>
                </div>
                ` : ''}
            `;
            
            container.appendChild(card);
        });
    }

    getFilteredOperai() {
        const searchTerm = document.getElementById('search-operai')?.value.toLowerCase() || '';
        const specializzazione = document.getElementById('filter-specializzazione')?.value || '';
        const livello = document.getElementById('filter-livello')?.value || '';
        const preposto = document.getElementById('filter-preposto')?.value || '';

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
        const livello = parseInt(document.getElementById('operaio-livello').value);
        const preposto = document.getElementById('operaio-preposto').checked;

        if (!nome || !email || !telefono || !specializzazione || !livello) {
            alert('Tutti i campi sono obbligatori');
            return;
        }

        const avatarMap = {
            'Elettricista': '⚡', 'Meccanico': '🔧', 'Muratore': '🧱', 
            'Carpentiere': '🪵', 'Idraulico': '🚰', 'Saldatore': '🔥', 
            'Operatore Macchine': '🚜'
        };

        if (id) {
            const operaio = this.operai.find(o => o.id == id);
            if (operaio) {
                Object.assign(operaio, {
                    nome, email, telefono, specializzazione, livello, preposto,
                    avatar: avatarMap[specializzazione] || '👷'
                });
            }
        } else {
            const newId = Math.max(0, ...this.operai.map(o => o.id)) + 1;
            this.operai.push({
                id: newId, nome, email, telefono, specializzazione, livello, 
                cantiere: null, avatar: avatarMap[specializzazione] || '👷', preposto
            });
        }
        
        this.closeModal('modal-operaio');
        this.renderApp();
        this.saveAllData();
        alert('✅ Operaio salvato con successo');
    }

    removeOperaio(operaioId) {
        const operaio = this.operai.find(o => o.id === operaioId);
        if (!operaio) return;
        
        if (confirm(`Sei sicuro di voler eliminare ${operaio.nome}?`)) {
            this.cantieri.forEach(cantiere => {
                const index = cantiere.operai.indexOf(operaioId);
                if (index !== -1) {
                    cantiere.operai.splice(index, 1);
                }
            });
            
            const index = this.operai.findIndex(o => o.id === operaioId);
            if (index !== -1) {
                this.operai.splice(index, 1);
            }
            
            this.renderApp();
            this.saveAllData();
            alert('✅ Operaio eliminato');
        }
    }

    // ===== GESTIONE CANTIERI =====
    renderCantieri() {
        const container = document.getElementById('map-container');
        const controls = document.getElementById('controls-cantieri');
        
        if (!container) return;

        if (this.currentUser.type === 'manager' || this.currentUser.type === 'master') {
            controls.innerHTML = `
                <button class="btn btn-add" id="add-cantiere-btn">➕ Aggiungi Cantiere</button>
                <button class="btn btn-secondary" onclick="app.toggleDragDrop()">
                    ${this.isDragDropActive ? '🔒 Blocca' : '🔓 Sblocca'} Drag & Drop
                </button>
            `;
            document.getElementById('add-cantiere-btn').addEventListener('click', () => this.addCantiere());
        } else {
            controls.innerHTML = '';
        }

        container.innerHTML = '';
        
        this.cantieri.forEach(cantiere => {
            const element = document.createElement('div');
            element.className = 'cantiere';
            element.dataset.cantiereId = cantiere.id;
            element.style.left = cantiere.x + 'px';
            element.style.top = cantiere.y + 'px';
            element.draggable = (this.currentUser.type === 'manager' || this.currentUser.type === 'master');
            
            // Setup drag per cantiere
            if (this.currentUser.type === 'manager' || this.currentUser.type === 'master') {
                element.addEventListener('dragstart', (e) => {
                    this.draggedCantiere = cantiere;
                    e.dataTransfer.setData('text/plain', 'cantiere-' + cantiere.id);
                    element.classList.add('dragging');
                });
                
                element.addEventListener('dragend', (e) => {
                    element.classList.remove('dragging');
                    
                    if (this.draggedCantiere) {
                        const containerRect = container.getBoundingClientRect();
                        const elementRect = element.getBoundingClientRect();
                        
                        this.draggedCantiere.x = elementRect.left - containerRect.left;
                        this.draggedCantiere.y = elementRect.top - containerRect.top;
                        
                        this.saveAllData();
                    }
                    
                    this.draggedCantiere = null;
                });
            }

            // Setup drop per operai
            element.addEventListener('dragover', (e) => {
                e.preventDefault();
                if (this.draggedOperaio) {
                    element.classList.add('drag-over');
                }
            });
            
            element.addEventListener('dragleave', (e) => {
                element.classList.remove('drag-over');
            });
            
            element.addEventListener('drop', (e) => {
                e.preventDefault();
                element.classList.remove('drag-over');
                
                if (this.draggedOperaio) {
                    this.assignOperaioToCantiere(this.draggedOperaio, cantiere.id);
                    this.showDragSuccess(cantiere);
                }
            });

            // Click per dettagli
            element.addEventListener('click', (e) => {
                if (!this.draggedOperaio && !e.target.closest('.cantiere-controls')) {
                    this.showCantiereDetails(cantiere.id);
                }
            });

            const assignedCount = cantiere.operai.length;
            const icons = {'Civile': '🏰', 'Industriale': '🏭', 'Residenziale': '🏢', 'Stradale': '🛣️', 'Ferroviario': '🚂'};
            const icon = icons[cantiere.tipo] || '🏗️';
            
            element.innerHTML = `
                <div class="cantiere-icon">${icon}</div>
                <div class="cantiere-nome">${cantiere.nome}</div>
                <div class="cantiere-indirizzo">${cantiere.indirizzo}</div>
                ${assignedCount > 0 ? `<div class="cantiere-count">${assignedCount}</div>` : ''}
                <div class="cantiere-controls">
                    ${(this.currentUser.type === 'manager' || this.currentUser.type === 'master') ? `
                    <button class="btn-small btn-edit" onclick="event.stopPropagation(); app.editCantiere(${cantiere.id})">✏️</button>
                    <button class="btn-small btn-delete" onclick="event.stopPropagation(); app.removeCantiere(${cantiere.id})">🗑️</button>
                    ` : ''}
                </div>
            `;
            
            container.appendChild(element);
        });
    }

    showDragSuccess(cantiere) {
        const successMsg = document.createElement('div');
        successMsg.style.cssText = `
            position: absolute;
            top: ${cantiere.y + 80}px;
            left: ${cantiere.x}px;
            background: #27ae60;
            color: white;
            padding: 8px 12px;
            border-radius: 6px;
            font-size: 12px;
            font-weight: bold;
            z-index: 1000;
            animation: fadeInOut 2s ease-in-out;
        `;
        successMsg.textContent = '✅ Operaio assegnato!';
        document.getElementById('map-container').appendChild(successMsg);
        
        setTimeout(() => {
            successMsg.remove();
        }, 2000);
    }

    filterCantieri(searchTerm) {
        const cantiereElements = document.querySelectorAll('.cantiere');
        
        cantiereElements.forEach(element => {
            const nome = element.querySelector('.cantiere-nome').textContent.toLowerCase();
            const indirizzo = element.querySelector('.cantiere-indirizzo').textContent.toLowerCase();
            
            if (!searchTerm || nome.includes(searchTerm.toLowerCase()) || indirizzo.includes(searchTerm.toLowerCase())) {
                element.style.display = 'block';
            } else {
                element.style.display = 'none';
            }
        });
    }

    addCantiere() {
        document.getElementById('modal-cantiere-title').textContent = 'Aggiungi Cantiere';
        document.getElementById('form-cantiere').reset();
        document.getElementById('cantiere-id').value = '';
        this.showModal('modal-cantiere');
    }

    editCantiere(cantiereId) {
        const cantiere = this.cantieri.find(c => c.id === cantiereId);
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
            alert('Tutti i campi sono obbligatori');
            return;
        }
        
        if (id) {
            const cantiere = this.cantieri.find(c => c.id == id);
            if (cantiere) {
                cantiere.nome = nome;
                cantiere.indirizzo = indirizzo;
                cantiere.tipo = tipo;
            }
        } else {
            const newId = Math.max(0, ...this.cantieri.map(c => c.id)) + 1;
            this.cantieri.push({
                id: newId, nome, indirizzo, tipo,
                x: Math.random() * 400 + 100, y: Math.random() * 300 + 100,
                operai: [], calendarSelections: {}, timeSlot: {start: "08:00", end: "17:00"}
            });
        }
        
        this.closeModal('modal-cantiere');
        this.renderCantieri();
        this.saveAllData();
        alert('✅ Cantiere salvato con successo');
    }

    removeCantiere(cantiereId) {
        const cantiere = this.cantieri.find(c => c.id === cantiereId);
        if (!cantiere) return;
        
        if (confirm(`Sei sicuro di voler eliminare il cantiere "${cantiere.nome}"?`)) {
            cantiere.operai.forEach(operaioId => {
                const operaio = this.operai.find(o => o.id === operaioId);
                if (operaio) operaio.cantiere = null;
            });
            
            const index = this.cantieri.findIndex(c => c.id === cantiereId);
            if (index !== -1) this.cantieri.splice(index, 1);
            
            this.renderApp();
            this.saveAllData();
            alert('✅ Cantiere eliminato');
        }
    }

    assignOperaioToCantiere(operaioId, cantiereId) {
        const operaio = this.operai.find(o => o.id === operaioId);
        const cantiere = this.cantieri.find(c => c.id === cantiereId);
        if (!operaio || !cantiere) return;
        
        // Rimuovi da cantiere precedente
        if (operaio.cantiere) {
            const oldCantiere = this.cantieri.find(c => c.id === operaio.cantiere);
            if (oldCantiere) {
                oldCantiere.operai = oldCantiere.operai.filter(id => id !== operaioId);
            }
        }
        
        // Assegna al nuovo cantiere
        operaio.cantiere = cantiereId;
        if (!cantiere.operai.includes(operaioId)) {
            cantiere.operai.push(operaioId);
        }
        
        this.renderApp();
        this.saveAllData();
    }

    toggleDragDrop() {
        this.isDragDropActive = !this.isDragDropActive;
        this.renderOperai();
        this.renderCantieri();
        alert(this.isDragDropActive ? '🔓 Drag & Drop attivato' : '🔒 Drag & Drop disattivato');
    }

    // ===== DETTAGLI CANTIERE =====
    showCantiereDetails(cantiereId) {
        const cantiere = this.cantieri.find(c => c.id === cantiereId);
        if (!cantiere) return;
        
        this.currentCantiereId = cantiereId;
        document.getElementById('cantiere-details-title').textContent = `Dettagli: ${cantiere.nome}`;
        
        const icons = {'Civile': '🏰', 'Industriale': '🏭', 'Residenziale': '🏢'};
        const icon = icons[cantiere.tipo] || '🏗️';
        
        document.getElementById('cantiere-basic-info').innerHTML = `
            <p><strong>Nome:</strong> ${icon} ${cantiere.nome}</p>
            <p><strong>Indirizzo:</strong> ${cantiere.indirizzo}</p>
            <p><strong>Tipo:</strong> ${cantiere.tipo}</p>
            <p><strong>Posizione:</strong> X: ${Math.round(cantiere.x)}, Y: ${Math.round(cantiere.y)}</p>
            <p><strong>Operai Assegnati:</strong> ${cantiere.operai.length}</p>
        `;
        
        const operaiAssegnati = cantiere.operai.map(id => this.operai.find(o => o.id === id)).filter(o => o);
        let operaiHtml = '';
        
        if (operaiAssegnati.length > 0) {
            operaiAssegnati.forEach(operaio => {
                const prepostoText = operaio.preposto ? ' ⭐ PREPOSTO' : '';
                operaiHtml += `
                    <div class="operaio-detail">
                        <strong>${operaio.avatar} ${operaio.nome}${prepostoText}</strong><br>
                        <small>${operaio.specializzazione} - Livello ${operaio.livello}</small><br>
                        <small>📧 ${operaio.email} | 📞 ${operaio.telefono}</small>
                        <button onclick="app.unassignOperaio(${operaio.id}, ${cantiereId})" 
                                style="float:right; background:#e74c3c; color:white; border:none; padding:4px 8px; border-radius:4px; font-size:10px; cursor:pointer;">
                            Rimuovi
                        </button>
                    </div>
                `;
            });
        } else {
            operaiHtml = '<p style="color: #95a5a6; font-style: italic;">Nessun operaio assegnato</p>';
        }
        
        document.getElementById('cantiere-operai-list').innerHTML = operaiHtml;
        this.renderCalendar();
        document.getElementById('time-start').value = cantiere.timeSlot?.start || '08:00';
        document.getElementById('time-end').value = cantiere.timeSlot?.end || '17:00';
        
        // Aggiorna time slot in tempo reale
        document.getElementById('time-start').onchange = (e) => {
            cantiere.timeSlot.start = e.target.value;
            this.saveAllData();
        };
        
        document.getElementById('time-end').onchange = (e) => {
            cantiere.timeSlot.end = e.target.value;
            this.saveAllData();
        };

        this.showModal('modal-cantiere-details');
    }

    unassignOperaio(operaioId, cantiereId) {
        const operaio = this.operai.find(o => o.id === operaioId);
        const cantiere = this.cantieri.find(c => c.id === cantiereId);
        if (!operaio || !cantiere) return;
        
        operaio.cantiere = null;
        cantiere.operai = cantiere.operai.filter(id => id !== operaioId);
        
        this.renderApp();
        this.saveAllData();
        
        if (this.currentCantiereId === cantiereId) {
            this.showCantiereDetails(cantiereId);
        }
        
        alert(`✅ ${operaio.nome} rimosso dal cantiere`);
    }

    renderCalendar() {
        if (!this.currentCantiereId) return;
        
        const cantiere = this.cantieri.find(c => c.id === this.currentCantiereId);
        if (!cantiere) return;

        const monthNames = ['Gennaio', 'Febbraio', 'Marzo', 'Aprile', 'Maggio', 'Giugno', 'Luglio', 'Agosto', 'Settembre', 'Ottobre', 'Novembre', 'Dicembre'];
        const dayNames = ['Dom', 'Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab'];
        
        document.getElementById('calendar-month-year').textContent = `${monthNames[this.currentMonth]} ${this.currentYear}`;
        
        const firstDay = new Date(this.currentYear, this.currentMonth, 1);
        const startDate = new Date(firstDay);
        startDate.setDate(startDate.getDate() - firstDay.getDay());
        
        let calendarHtml = '';
        dayNames.forEach(day => calendarHtml += `<div class="calendar-day-header">${day}</div>`);
        
        const current = new Date(startDate);
        for (let i = 0; i < 42; i++) {
            const dayNum = current.getDate();
            const isCurrentMonth = current.getMonth() === this.currentMonth;
            const isSelected = this.isCalendarDaySelected(current);
            
            let dayClass = 'calendar-day';
            if (!isCurrentMonth) dayClass += ' other-month';
            if (isSelected) dayClass += ' selected';
            
            calendarHtml += `<div class="${dayClass}" data-date="${current.toISOString()}">${dayNum}</div>`;
            current.setDate(current.getDate() + 1);
        }
        
        document.getElementById('calendar-grid').innerHTML = calendarHtml;
        
        document.querySelectorAll('.calendar-day').forEach(day => {
            day.addEventListener('click', () => {
                this.toggleCalendarDay(day.dataset.date);
            });
        });
    }

    isCalendarDaySelected(date) {
        if (!this.currentCantiereId) return false;
        const cantiere = this.cantieri.find(c => c.id === this.currentCantiereId);
        if (!cantiere || !cantiere.calendarSelections) return false;
        const dateStr = new Date(date).toISOString().split('T')[0];
        return cantiere.calendarSelections[dateStr] === true;
    }

    toggleCalendarDay(dateStr) {
        if (!this.currentCantiereId) return;
        const cantiere = this.cantieri.find(c => c.id === this.currentCantiereId);
        if (!cantiere) return;
        
        if (!cantiere.calendarSelections) cantiere.calendarSelections = {};
        const dateKey = new Date(dateStr).toISOString().split('T')[0];
        cantiere.calendarSelections[dateKey] = !cantiere.calendarSelections[dateKey];
        this.renderCalendar();
        this.saveAllData();
    }

    changeMonth(delta) {
        this.currentMonth += delta;
        
        if (this.currentMonth < 0) {
            this.currentMonth = 11;
            this.currentYear--;
        } else if (this.currentMonth > 11) {
            this.currentMonth = 0;
            this.currentYear++;
        }
        
        this.renderCalendar();
    }

    sendParticipationEmails() {
        if (!this.currentCantiereId) return;
        const cantiere = this.cantieri.find(c => c.id === this.currentCantiereId);
        if (!cantiere) return;
        
        const operaiAssegnati = cantiere.operai.map(id => this.operai.find(o => o.id === id)).filter(o => o);
        if (operaiAssegnati.length === 0) {
            alert('⚠️ Nessun operaio assegnato a questo cantiere');
            return;
        }
        
        const selectedDates = Object.keys(cantiere.calendarSelections || {}).filter(date => cantiere.calendarSelections[date]);
        if (selectedDates.length === 0) {
            alert('⚠️ Nessun giorno selezionato nel calendario');
            return;
        }
        
        const button = document.getElementById('btn-send-emails');
        const originalText = button.textContent;
        button.textContent = '📤 Invio in corso...';
        button.disabled = true;
        
        setTimeout(() => {
            const giorni = selectedDates.map(date => new Date(date).toLocaleDateString('it-IT')).join(', ');
            
            // Simulazione invio email
            operaiAssegnati.forEach(operaio => {
                console.log(`📧 Email inviata a ${operaio.email}: Partecipazione cantiere ${cantiere.nome} per i giorni ${giorni}`);
            });
            
            button.textContent = originalText;
            button.disabled = false;
            alert(`✅ Email inviate con successo a ${operaiAssegnati.length} operai per i giorni: ${giorni}`);
        }, 2000);
    }

    // ===== GESTIONE UTENTI =====
    showUserManagement() {
        this.renderUsersTable();
        this.showModal('modal-users');
    }

    renderUsersTable() {
        const tbody = document.getElementById('users-table-body');
        if (!tbody) return;
        
        tbody.innerHTML = '';
        
        this.users.forEach(user => {
            const row = document.createElement('tr');
            const operaio = user.operaioId ? this.operai.find(o => o.id === user.operaioId) : null;
            
            row.innerHTML = `
                <td>${user.username}</td>
                <td><span class="user-type-badge ${user.type}">${user.type}</span></td>
                <td>${operaio ? operaio.nome : 'Nessuno'}</td>
                <td>${user.lastLogin ? new Date(user.lastLogin).toLocaleString('it-IT') : 'Mai'}</td>
                <td>
                    <button class="btn-small btn-edit" onclick="app.editUser(${user.id})">✏️</button>
                    ${user.type !== 'master' ? `<button class="btn-small btn-delete" onclick="app.removeUser(${user.id})">🗑️</button>` : ''}
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
            option.selected = (operaio.id === user.operaioId);
            operaioSelect.appendChild(option);
        });
        
        this.showModal('modal-user-form');
    }

    saveUser() {
        const id = document.getElementById('user-id').value;
        const username = document.getElementById('user-username').value.trim();
        const password = document.getElementById('user-password').value;
        const type = document.getElementById('user-type').value;
        const operaioId = document.getElementById('user-operaio').value || null;

        if (!username || !password || !type) {
            alert('Tutti i campi sono obbligatori');
            return;
        }

        if (id) {
            const user = this.users.find(u => u.id == id);
            if (user) {
                Object.assign(user, { username, password, type, operaioId });
            }
        } else {
            const newId = Math.max(0, ...this.users.map(u => u.id)) + 1;
            this.users.push({
                id: newId, username, password, type, operaioId, lastLogin: null
            });
        }
        
        this.closeModal('modal-user-form');
        this.renderUsersTable();
        this.saveAllData();
        alert('✅ Utente salvato con successo');
    }

    removeUser(userId) {
        const user = this.users.find(u => u.id === userId);
        if (!user) return;
        
        if (confirm(`Sei sicuro di voler eliminare l'utente ${user.username}?`)) {
            const index = this.users.findIndex(u => u.id === userId);
            if (index !== -1) {
                this.users.splice(index, 1);
            }
            
            this.renderUsersTable();
            this.saveAllData();
            alert('✅ Utente eliminato');
        }
    }

    // ===== ESPORTAZIONE OPERAI =====
    exportOperaiCSV() {
        const headers = ['ID', 'Nome Completo', 'Email', 'Telefono', 'Specializzazione', 'Livello', 'Preposto', 'Cantiere Assegnato', 'Indirizzo Cantiere', 'Tipo Cantiere'];
        
        const rows = this.operai.map(operaio => {
            const cantiere = operaio.cantiere ? this.cantieri.find(c => c.id === operaio.cantiere) : null;
            return [
                operaio.id,
                `"${operaio.nome}"`,
                operaio.email,
                operaio.telefono,
                operaio.specializzazione,
                operaio.livello,
                operaio.preposto ? 'Sì' : 'No',
                cantiere ? `"${cantiere.nome}"` : 'Nessuno',
                cantiere ? `"${cantiere.indirizzo}"` : '',
                cantiere ? cantiere.tipo : ''
            ];
        });

        const csvContent = [headers, ...rows].map(row => row.join(',')).join('\n');
        
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `operai_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        alert('✅ File CSV esportato con successo!');
    }

    // ===== IMPOSTAZIONI =====
    showSettings(activeTab = 'email') {
        this.showModal('modal-settings');
        
        // Attiva tab specificato
        if (activeTab) {
            this.switchSettingsTab(activeTab);
        }
    }

    switchSettingsTab(tabName) {
        // Nascondi tutti i tab content
        document.querySelectorAll('.tab-content').forEach(tab => {
            tab.classList.add('hidden');
        });
        
        // Rimuovi active da tutti i tab
        document.querySelectorAll('.tab').forEach(tab => {
            tab.classList.remove('active');
        });
        
        // Mostra tab selezionato
        document.getElementById('settings-' + tabName)?.classList.remove('hidden');
        document.querySelector(`[data-tab="${tabName}"]`)?.classList.add('active');
    }

    // ===== INFORMAZIONI =====
    showInfo() {
        this.updateStats();
        this.showModal('modal-info');
    }

    // ===== PERSISTENZA DATI =====
    setupAutoSave() {
        if (this.autoSaveEnabled) {
            setInterval(() => {
                this.saveAllData();
            }, 30000); // Salva ogni 30 secondi
        }
    }

    saveAllData() {
        try {
            localStorage.setItem('sse_operai', JSON.stringify(this.operai));
            localStorage.setItem('sse_cantieri', JSON.stringify(this.cantieri));
            localStorage.setItem('sse_users', JSON.stringify(this.users));
            console.log('💾 Dati salvati con successo');
        } catch (error) {
            console.error('❌ Errore nel salvataggio:', error);
        }
    }

    loadData(key) {
        try {
            const data = localStorage.getItem('sse_' + key);
            return data ? JSON.parse(data) : null;
        } catch (error) {
            console.error('Errore nel caricamento dati:', error);
            return null;
        }
    }
}

// Inizializza l'applicazione
const app = new SseManager();