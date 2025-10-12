// app.js - Sse Manager Ver 1.5 - COMPLETAMENTE FUNZIONANTE
console.log('🏗️ Sse Manager - Caricamento Ver 1.5...');

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
        console.log('🚀 Inizializzazione Sse Manager Ver 1.5');
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
        document.getElementById('user-password').value = ''; // Campo password vuoto
        
        // Popola dropdown operai
        const operaioSelect = document.getElementById('user-operaio');
        if (operaioSelect) {
            operaioSelect.innerHTML = '<option value="">Nessuna associazione</option>';
            this.operai.forEach(operaio => {
                const option = document.createElement('option');
                option.value = operaio.id;
                option.textContent = operaio.nome;
                operaioSelect.appendChild(option);
            });
        }
        
        this.showModal('modal-user-form');
    }

    editUser(userId) {
        const user = this.users.find(u => u.id === userId);
        if (!user) return;

        document.getElementById('modal-user-title').textContent = 'Modifica Utente';
        document.getElementById('user-id').value = user.id;
        document.getElementById('user-username').value = user.username;
        document.getElementById('user-password').value = user.password; // Mostra password corrente
        document.getElementById('user-type').value = user.type;
        
        // Popola dropdown operai
        const operaioSelect = document.getElementById('user-operaio');
        if (operaioSelect) {
            operaioSelect.innerHTML = '<option value="">Nessuna associazione</option>';
            this.operai.forEach(operaio => {
                const option = document.createElement('option');
                option.value = operaio.id;
                option.textContent = operaio.nome;
                option.selected = operaio.id === user.operaioId;
                operaioSelect.appendChild(option);
            });
        }
        
        this.showModal('modal-user-form');
    }

    saveUser() {
        const userId = document.getElementById('user-id').value;
        const username = document.getElementById('user-username').value.trim();
        const password = document.getElementById('user-password').value;
        const type = document.getElementById('user-type').value;
        const operaioId = document.getElementById('user-operaio').value || null;

        if (!username || !password) {
            alert('Inserisci username e password');
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
            this.users[userIndex] = {
                ...this.users[userIndex],
                username,
                password,
                type,
                operaioId: operaioId ? parseInt(operaioId) : null
            };
        } else {
            // Nuovo utente
            const newId = Math.max(...this.users.map(u => u.id), 0) + 1;
            this.users.push({
                id: newId,
                username,
                password,
                type,
                operaioId: operaioId ? parseInt(operaioId) : null,
                lastLogin: null
            });
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

    // ===== IMPORT/EXPORT DIPENDENTI =====
    exportOperai() {
        if (this.currentUser.type === 'operaio') {
            alert('❌ Non hai i permessi per esportare i dipendenti');
            return;
        }

        // Crea CSV con campi separati
        const headers = ['Nome Completo', 'Email', 'Telefono', 'Specializzazione', 'Livello', 'Preposto', 'Cantiere Assegnato'];
        const data = this.operai.map(operaio => [
            operaio.nome,
            operaio.email,
            operaio.telefono,
            operaio.specializzazione,
            operaio.livello.toString(),
            operaio.preposto ? 'Sì' : 'No',
            operaio.cantiere ? this.cantieri.find(c => c.id === operaio.cantiere)?.nome : 'Nessuno'
        ]);

        const csvContent = [headers, ...data]
            .map(row => row.map(field => `"${field}"`).join(','))
            .join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        
        link.setAttribute('href', url);
        link.setAttribute('download', `dipendenti_standardse_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        
        alert('✅ Dipendenti esportati con successo in formato CSV!');
    }

    importOperai() {
        if (this.currentUser.type === 'operaio') {
            alert('❌ Non hai i permessi per importare i dipendenti');
            return;
        }

        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.csv';
        
        input.onchange = (e) => {
            const file = e.target.files[0];
            if (!file) return;

            const reader = new FileReader();
            reader.onload = (event) => {
                try {
                    const csvData = event.target.result;
                    const data = this.parseCSVData(csvData);
                    this.processImportedOperai(data);
                } catch (error) {
                    alert('❌ Errore durante l\'importazione: ' + error.message);
                }
            };
            reader.readAsText(file);
        };
        
        input.click();
    }

    parseCSVData(csvText) {
        const lines = csvText.split('\n').filter(line => line.trim());
        const headers = lines[0].split(',').map(header => header.replace(/"/g, '').trim());
        
        const data = [];
        for (let i = 1; i < lines.length; i++) {
            const values = lines[i].split(',').map(value => value.replace(/"/g, '').trim());
            const row = {};
            headers.forEach((header, index) => {
                row[header] = values[index] || '';
            });
            data.push(row);
        }
        
        return data;
    }

    processImportedOperai(data) {
        let importedCount = 0;
        let updatedCount = 0;

        data.forEach(row => {
            const nome = row['Nome Completo'];
            const email = row['Email'];
            
            if (!nome || !email) return;

            const existingIndex = this.operai.findIndex(o => o.email === email);
            
            if (existingIndex >= 0) {
                // Aggiorna operaio esistente
                this.operai[existingIndex] = {
                    ...this.operai[existingIndex],
                    nome,
                    telefono: row['Telefono'] || this.operai[existingIndex].telefono,
                    specializzazione: row['Specializzazione'] || this.operai[existingIndex].specializzazione,
                    livello: parseInt(row['Livello']) || this.operai[existingIndex].livello,
                    preposto: row['Preposto'] === 'Sì'
                };
                updatedCount++;
            } else {
                // Nuovo operaio
                const newId = Math.max(...this.operai.map(o => o.id), 0) + 1;
                const avatarMap = {
                    'Elettricista': '⚡', 'Meccanico': '🔧', 'Muratore': '🧱', 
                    'Carpentiere': '🪵', 'Idraulico': '🚰', 'Saldatore': '🔥', 
                    'Operatore Macchine': '🚜'
                };
                
                this.operai.push({
                    id: newId,
                    nome,
                    email,
                    telefono: row['Telefono'] || '',
                    specializzazione: row['Specializzazione'] || 'Operaio',
                    livello: parseInt(row['Livello']) || 3,
                    cantiere: null,
                    avatar: avatarMap[row['Specializzazione']] || '👷',
                    preposto: row['Preposto'] === 'Sì'
                });
                importedCount++;
            }
        });

        this.saveAllData();
        this.renderApp();
        
        alert(`✅ Import completato!\nNuovi operai: ${importedCount}\nOperai aggiornati: ${updatedCount}`);
    }

    // ===== FUNZIONI OPERAI E CANTIERI =====
    renderApp() {
        this.renderOperai();
        this.renderCantieri();
        this.updateStats();
    }

    renderOperai() {
        const container = document.getElementById('operai-container');
        const controls = document.getElementById('controls-operai');
        
        if (!container) return;
        
        container.innerHTML = '';
        
        // Solo master e manager possono aggiungere operai
        if (this.currentUser.type !== 'operaio') {
            if (controls) {
                controls.innerHTML = '<button class="btn btn-primary" id="add-operaio-btn">+ Aggiungi Operaio</button>';
                document.getElementById('add-operaio-btn').addEventListener('click', () => this.addOperaio());
            }
        } else {
            if (controls) controls.innerHTML = '';
        }
        
        // Mostra TUTTI gli operai (disponibili e assegnati)
        this.operai.forEach(operaio => {
            if (this.isOperaioVisible(operaio)) {
                const card = document.createElement('div');
                card.className = 'operaio-card';
                if (operaio.cantiere !== null) {
                    card.classList.add('assigned');
                }
                card.draggable = this.currentUser.type !== 'operaio';
                card.dataset.operaioId = operaio.id;
                card.innerHTML = this.getOperaioCardHTML(operaio);
                
                this.setupOperaioDrag(card, operaio);
                container.appendChild(card);
            }
        });
        
        this.updateStats();
    }

    getOperaioCardHTML(operaio) {
        const prepostoBadge = operaio.preposto ? '<div class="operaio-preposto">⭐ Preposto ⭐</div>' : '';
        
        // Informazioni di assegnazione
        let assignmentInfo = '';
        if (operaio.cantiere !== null) {
            const cantiere = this.cantieri.find(c => c.id === operaio.cantiere);
            if (cantiere) {
                assignmentInfo = `<div class="assignment-info">📍 Assegnato a: ${cantiere.nome}</div>`;
            }
        }
        
        let actionsHTML = '';
        if (this.currentUser.type !== 'operaio') {
            actionsHTML = `
                <div class="operaio-actions">
                    <button class="btn btn-edit" data-operaio-id="${operaio.id}">✏️</button>
                    <button class="btn btn-delete" data-operaio-id="${operaio.id}">🗑️</button>
                </div>
            `;
        }
        
        return `
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
            ${prepostoBadge}
            ${assignmentInfo}
            ${actionsHTML}
        `;
    }

    setupOperaioDrag(card, operaio) {
        if (this.currentUser.type === 'operaio') return;

        card.addEventListener('dragstart', (e) => {
            this.draggedOperaio = operaio;
            this.isDragDropActive = true;
            e.dataTransfer.effectAllowed = 'move';
            e.dataTransfer.setData('text/plain', operaio.id.toString());
            card.classList.add('dragging');
        });
        
        card.addEventListener('dragend', (e) => {
            card.classList.remove('dragging');
            setTimeout(() => {
                this.isDragDropActive = false;
                this.draggedOperaio = null;
            }, 100);
        });

        // Bottoni azioni
        const editBtn = card.querySelector('.btn-edit');
        const deleteBtn = card.querySelector('.btn-delete');
        
        if (editBtn) {
            editBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.editOperaio(parseInt(e.target.dataset.operaioId));
            });
        }
        
        if (deleteBtn) {
            deleteBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.removeOperaio(parseInt(e.target.dataset.operaioId));
            });
        }
    }

    addOperaio() {
        document.getElementById('modal-operaio-title').textContent = 'Aggiungi Operaio';
        document.getElementById('form-operaio').reset();
        document.getElementById('operaio-id').value = '';
        this.showModal('modal-operaio');
    }

    editOperaio(operaioId) {
        const operaio = this.operai.find(o => o.id === operaioId);
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
        const emailInput = document.getElementById('operaio-email').value.trim();
        const telefono = document.getElementById('operaio-telefono').value.trim();
        const specializzazione = document.getElementById('operaio-specializzazione').value;
        const livello = parseInt(document.getElementById('operaio-livello').value);
        const preposto = document.getElementById('operaio-preposto').checked;
        
        // Aggiungi automaticamente @standardse.it se non presente
        let email = emailInput;
        if (email && !email.includes('@')) {
            email = email + '@standardse.it';
        } else if (!email) {
            // Genera email automatica dal nome
            const nomeEmail = nome.toLowerCase().replace(/\s+/g, '.');
            email = nomeEmail + '@standardse.it';
        }
        
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
    }

    removeOperaio(operaioId) {
        const operaio = this.operai.find(o => o.id === operaioId);
        if (!operaio) return;
        
        if (confirm(`Sei sicuro di voler eliminare ${operaio.nome}?`)) {
            // Rimuovi da tutti i cantieri
            this.cantieri.forEach(cantiere => {
                const index = cantiere.operai.indexOf(operaioId);
                if (index !== -1) {
                    cantiere.operai.splice(index, 1);
                }
            });
            
            // Rimuovi dall'array operai
            const index = this.operai.findIndex(o => o.id === operaioId);
            if (index !== -1) {
                this.operai.splice(index, 1);
            }
            
            this.renderApp();
            this.saveAllData();
            
            // Se il modal dettagli cantiere è aperto, aggiorna anche quello
            if (this.currentCantiereId) {
                this.showCantiereDetails(this.currentCantiereId);
            }
        }
    }

    // ===== FUNZIONI CANTIERI =====
    renderCantieri() {
        const container = document.getElementById('map-container');
        const controls = document.getElementById('controls-cantieri');
        
        if (!container) return;
        
        container.innerHTML = '';
        
        // Solo master e manager possono aggiungere cantieri
        if (this.currentUser.type !== 'operaio') {
            if (controls) {
                controls.innerHTML = '<button class="btn btn-add" id="add-cantiere-btn">➕ Aggiungi Cantiere</button>';
                document.getElementById('add-cantiere-btn').addEventListener('click', () => this.addCantiere());
            }
        } else {
            if (controls) controls.innerHTML = '';
        }
        
        this.cantieri.forEach(cantiere => {
            const element = document.createElement('div');
            element.className = 'cantiere';
            element.dataset.cantiereId = cantiere.id;
            element.style.left = cantiere.x + 'px';
            element.style.top = cantiere.y + 'px';
            element.innerHTML = this.getCantiereHTML(cantiere);
            
            this.setupCantiereDrag(element, cantiere);
            this.setupCantiereDrop(element, cantiere);
            this.setupCantiereClick(element, cantiere);
            
            container.appendChild(element);
        });
        
        this.updateStats();
    }

    getCantiereHTML(cantiere) {
        const icons = {'Civile': '🏰', 'Industriale': '🏭', 'Residenziale': '🏢', 'Stradale': '🛣️', 'Ferroviario': '🚂'};
        const icon = icons[cantiere.tipo] || '🏗️';
        const countBadge = cantiere.operai.length > 0 ? 
            `<div class="cantiere-count">${cantiere.operai.length}</div>` : '';
        
        let controlsHTML = '';
        if (this.currentUser.type !== 'operaio') {
            controlsHTML = `
                <div class="cantiere-controls">
                    <button class="btn-small btn-edit" data-cantiere-id="${cantiere.id}">✏️</button>
                    <button class="btn-small btn-delete" data-cantiere-id="${cantiere.id}">🗑️</button>
                </div>
            `;
        }
        
        return `
            <div class="cantiere-icon">${icon}</div>
            <div class="cantiere-nome">${cantiere.nome}</div>
            <div class="cantiere-indirizzo">${cantiere.indirizzo}</div>
            ${countBadge}
            ${controlsHTML}
        `;
    }

    setupCantiereDrag(element, cantiere) {
        if (this.currentUser.type === 'operaio') return;

        element.draggable = true;
        
        let dragOffsetX = 0;
        let dragOffsetY = 0;
        
        element.addEventListener('dragstart', (e) => {
            this.draggedCantiere = cantiere;
            this.isDragDropActive = true;
            e.dataTransfer.effectAllowed = 'move';
            e.dataTransfer.setData('text/plain', 'cantiere-' + cantiere.id);
            element.classList.add('dragging');
            
            // Calcola l'offset del mouse rispetto all'elemento
            const rect = element.getBoundingClientRect();
            dragOffsetX = e.clientX - rect.left;
            dragOffsetY = e.clientY - rect.top;
        });
        
        element.addEventListener('dragend', (e) => {
            element.classList.remove('dragging');
            
            if (this.draggedCantiere) {
                const container = document.getElementById('map-container');
                const containerRect = container.getBoundingClientRect();
                
                // Calcola la nuova posizione considerando l'offset
                const x = e.clientX - containerRect.left - dragOffsetX;
                const y = e.clientY - containerRect.top - dragOffsetY;
                
                // Limita la posizione ai confini del container
                const maxX = containerRect.width - element.offsetWidth;
                const maxY = containerRect.height - element.offsetHeight;
                
                this.draggedCantiere.x = Math.max(0, Math.min(x, maxX));
                this.draggedCantiere.y = Math.max(0, Math.min(y, maxY));
                
                // Aggiorna la posizione CSS
                element.style.left = this.draggedCantiere.x + 'px';
                element.style.top = this.draggedCantiere.y + 'px';
                
                // Salva la nuova posizione
                this.saveAllData();
            }
            
            setTimeout(() => {
                this.isDragDropActive = false;
                this.draggedCantiere = null;
            }, 100);
        });

        // Bottoni azioni
        const editBtn = element.querySelector('.btn-edit');
        const deleteBtn = element.querySelector('.btn-delete');
        
        if (editBtn) {
            editBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.editCantiere(parseInt(e.target.dataset.cantiereId));
            });
        }
        
        if (deleteBtn) {
            deleteBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.removeCantiere(parseInt(e.target.dataset.cantiereId));
            });
        }
    }

    setupCantiereDrop(element, cantiere) {
        if (this.currentUser.type === 'operaio') return;

        element.addEventListener('dragover', (e) => {
            e.preventDefault();
            e.dataTransfer.dropEffect = 'move';
            if (this.draggedOperaio && this.isDragDropActive) {
                element.classList.add('drag-over');
            }
        });
        
        element.addEventListener('dragenter', (e) => {
            e.preventDefault();
            if (this.draggedOperaio && this.isDragDropActive) {
                element.classList.add('drag-over');
            }
        });
        
        element.addEventListener('dragleave', (e) => {
            element.classList.remove('drag-over');
        });
        
        element.addEventListener('drop', (e) => {
            e.preventDefault();
            element.classList.remove('drag-over');
            
            if (this.draggedOperaio && this.isDragDropActive) {
                this.assignOperaioToCantiere(this.draggedOperaio.id, cantiere.id);
                
                // Feedback visivo
                const feedback = document.createElement('div');
                feedback.style.cssText = `
                    position: absolute; top: ${cantiere.y + 90}px; left: ${cantiere.x}px;
                    background: #27ae60; color: white; padding: 8px 12px; border-radius: 6px;
                    font-size: 12px; font-weight: bold; z-index: 1001; pointer-events: none;
                `;
                feedback.textContent = `✅ ${this.draggedOperaio.nome} assegnato!`;
                document.getElementById('map-container').appendChild(feedback);
                
                setTimeout(() => feedback.remove(), 2000);
                
                this.draggedOperaio = null;
                this.isDragDropActive = false;
            }
        });
    }

    setupCantiereClick(element, cantiere) {
        element.addEventListener('click', (e) => {
            if (this.isDragDropActive || e.target.closest('.cantiere-controls')) {
                return;
            }
            this.showCantiereDetails(cantiere.id);
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
    }

    removeCantiere(cantiereId) {
        const cantiere = this.cantieri.find(c => c.id === cantiereId);
        if (!cantiere) return;
        
        if (confirm(`Sei sicuro di voler eliminare il cantiere "${cantiere.nome}"?`)) {
            // Libera operai assegnati
            cantiere.operai.forEach(operaioId => {
                const operaio = this.operai.find(o => o.id === operaioId);
                if (operaio) operaio.cantiere = null;
            });
            
            // Rimuovi cantiere
            const index = this.cantieri.findIndex(c => c.id === cantiereId);
            if (index !== -1) this.cantieri.splice(index, 1);
            
            this.renderApp();
            this.saveAllData();
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

    // ===== FUNZIONI ESISTENTI AGGIORNATE =====
    handleMenuAction(action) {
        console.log('Menu action:', action);
        
        const actions = {
            'manage-users': () => this.showUsersManagement(),
            'export-operai': () => this.exportOperai(),
            'import-operai': () => this.importOperai(),
            'focus-search-operai': () => document.getElementById('search-operai').focus(),
            'focus-search-cantieri': () => document.getElementById('search-cantieri').focus(),
            'show-operai-list': () => this.showOperaiList(),
            'show-cantieri-list': () => this.showCantieriList(),
            'show-modify-cantiere': () => this.showModifyCantiereMenu(),
            'show-delete-cantiere': () => this.showDeleteCantiereMenu(),
            'export-data': () => this.exportData(),
            'import-data': () => this.importData(),
            'open-settings': () => this.openSettings(),
            'open-general-settings': () => this.openGeneralSettings(),
            'show-info': () => this.showInfo(),
            'logout': () => this.logout()
        };

        if (actions[action]) {
            actions[action]();
            this.closeMenu();
        }
    }

    filterOperai() {
        this.renderOperai();
    }

    isOperaioVisible(operaio) {
        const searchTerm = document.getElementById('search-operai')?.value.toLowerCase() || '';
        const specializzazioneFilter = document.getElementById('filter-specializzazione')?.value || '';
        const livelloFilter = document.getElementById('filter-livello')?.value || '';
        const prepostoFilter = document.getElementById('filter-preposto')?.value || '';

        if (searchTerm && !operaio.nome.toLowerCase().includes(searchTerm) && 
            !operaio.specializzazione.toLowerCase().includes(searchTerm) &&
            !operaio.email.toLowerCase().includes(searchTerm)) {
            return false;
        }

        if (specializzazioneFilter && operaio.specializzazione !== specializzazioneFilter) {
            return false;
        }

        if (livelloFilter && operaio.livello.toString() !== livelloFilter) {
            return false;
        }

        if (prepostoFilter === 'si' && !operaio.preposto) {
            return false;
        }

        if (prepostoFilter === 'no' && operaio.preposto) {
            return false;
        }

        return true;
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

    updateStats() {
        const totalOperai = this.operai.length;
        const assignedOperai = this.operai.filter(o => o.cantiere !== null).length;
        const totalCantieri = this.cantieri.length;

        const totalOperaiEl = document.getElementById('total-operai');
        const assignedOperaiEl = document.getElementById('assigned-operai');
        const totalCantieriEl = document.getElementById('total-cantieri');

        if (totalOperaiEl) totalOperaiEl.textContent = totalOperai;
        if (assignedOperaiEl) assignedOperaiEl.textContent = assignedOperai;
        if (totalCantieriEl) totalCantieriEl.textContent = totalCantieri;

        // Aggiorna anche nel modal info
        document.getElementById('info-total-operai').textContent = totalOperai;
        document.getElementById('info-assigned-operai').textContent = assignedOperai;
        document.getElementById('info-total-cantieri').textContent = totalCantieri;
    }

    // Gestione dati
    loadData(key) {
        try {
            const data = localStorage.getItem(`sse_manager_${key}`);
            return data ? JSON.parse(data) : null;
        } catch (error) {
            console.error('Errore nel caricamento dati:', error);
            return null;
        }
    }

    saveData(key, data) {
        try {
            localStorage.setItem(`sse_manager_${key}`, JSON.stringify(data));
            return true;
        } catch (error) {
            console.error('Errore nel salvataggio dati:', error);
            return false;
        }
    }

    saveAllData() {
        this.saveData('operai', this.operai);
        this.saveData('cantieri', this.cantieri);
        this.saveData('users', this.users);
    }

    setupAutoSave() {
        if (this.autoSaveEnabled) {
            setInterval(() => {
                this.saveAllData();
            }, 30000);
        }
    }

    // Menu functions
    toggleMenu() {
        const menu = document.getElementById('menu-dropdown');
        menu.classList.toggle('hidden');
    }

    closeMenu() {
        const menu = document.getElementById('menu-dropdown');
        menu.classList.add('hidden');
    }

    showModal(modalId) {
        document.getElementById(modalId).classList.remove('hidden');
    }

    closeModal(modalId) {
        document.getElementById(modalId).classList.add('hidden');
    }

    // Funzioni varie
    showOperaiList() {
        const operaiList = this.operai.map(o => `${o.nome} - ${o.specializzazione} - Livello ${o.livello}`).join('\n');
        alert(`👷 LISTA OPERAI:\n\n${operaiList}`);
    }

    showCantieriList() {
        const cantieriList = this.cantieri.map(c => `${c.nome} - ${c.tipo} - ${c.operai.length} operai`).join('\n');
        alert(`🏗️ LISTA CANTIERI:\n\n${cantieriList}`);
    }

    showModifyCantiereMenu() {
        if (this.cantieri.length === 0) {
            alert('⚠️ Nessun cantiere disponibile per la modifica');
            return;
        }
        
        const cantiereNames = this.cantieri.map(c => `${c.nome} (${c.tipo})`).join('\n');
        const cantiereName = prompt(`Quale cantiere vuoi modificare?\n\n${cantiereNames}\n\nInserisci il nome esatto:`);
        
        if (cantiereName) {
            const cantiere = this.cantieri.find(c => c.nome === cantiereName);
            if (cantiere) {
                this.editCantiere(cantiere.id);
            } else {
                alert('❌ Cantiere non trovato');
            }
        }
    }

    showDeleteCantiereMenu() {
        if (this.cantieri.length === 0) {
            alert('⚠️ Nessun cantiere disponibile per l\'eliminazione');
            return;
        }
        
        const cantiereNames = this.cantieri.map(c => `${c.nome} (${c.tipo})`).join('\n');
        const cantiereName = prompt(`Quale cantiere vuoi eliminare?\n\n${cantiereNames}\n\nInserisci il nome esatto:`);
        
        if (cantiereName) {
            const cantiere = this.cantieri.find(c => c.nome === cantiereName);
            if (cantiere) {
                this.removeCantiere(cantiere.id);
            } else {
                alert('❌ Cantiere non trovato');
            }
        }
    }

    exportData() {
        const data = {
            operai: this.operai,
            cantieri: this.cantieri,
            users: this.users,
            exportDate: new Date().toISOString(),
            version: '1.5'
        };

        const dataStr = JSON.stringify(data, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        
        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `sse_manager_backup_${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        
        alert('✅ Dati esportati con successo!');
    }

    importData() {
        const fileInput = document.createElement('input');
        fileInput.type = 'file';
        fileInput.accept = '.json';
        
        fileInput.onchange = (e) => {
            const file = e.target.files[0];
            if (!file) return;
            
            const reader = new FileReader();
            reader.onload = (event) => {
                try {
                    const data = JSON.parse(event.target.result);
                    
                    // Validazione dati
                    if (!data.operai || !data.cantieri) {
                        throw new Error('File non valido: struttura dati mancante');
                    }
                    
                    if (confirm(`Importare ${data.operai.length} operai e ${data.cantieri.length} cantieri? I dati attuali verranno sovrascritti.`)) {
                        this.operai = data.operai;
                        this.cantieri = data.cantieri;
                        this.users = data.users || this.users;
                        this.saveAllData();
                        this.renderApp();
                        alert('✅ Dati importati con successo!');
                    }
                } catch (error) {
                    alert('❌ Errore nell\'importazione: ' + error.message);
                }
            };
            
            reader.readAsText(file);
        };
        
        fileInput.click();
    }

    openSettings() {
        this.showModal('modal-settings');
        this.showSettingsTab('email');
    }

    openGeneralSettings() {
        this.showModal('modal-settings');
        this.showSettingsTab('general');
    }

    showSettingsTab(tabName) {
        // Nascondi tutti i tab
        document.querySelectorAll('.tab-content').forEach(tab => {
            tab.classList.add('hidden');
        });
        
        // Rimuovi classe active da tutti i tab
        document.querySelectorAll('.tab').forEach(tab => {
            tab.classList.remove('active');
        });
        
        // Mostra il tab selezionato
        document.getElementById(`settings-${tabName}`).classList.remove('hidden');
        
        // Aggiungi classe active al tab cliccato
        document.querySelector(`.tab[data-tab="${tabName}"]`).classList.add('active');
    }

    closeSettings() {
        this.closeModal('modal-settings');
    }

    showInfo() {
        // Aggiorna le statistiche nel modal info
        document.getElementById('info-total-operai').textContent = this.operai.length;
        document.getElementById('info-assigned-operai').textContent = this.operai.filter(o => o.cantiere !== null).length;
        document.getElementById('info-total-cantieri').textContent = this.cantieri.length;
        
        this.showModal('modal-info');
    }

    closeInfo() {
        this.closeModal('modal-info');
    }

    // Funzioni dettagli cantiere
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
    }

    renderCalendar() {
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
        
        // Aggiungi event listeners ai giorni
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

    changeMonth(direction) {
        this.currentMonth += direction;
        
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
            const orario = `${cantiere.timeSlot?.start || '08:00'} - ${cantiere.timeSlot?.end || '17:00'}`;
            
            // Simulazione invio email
            operaiAssegnati.forEach(operaio => {
                console.log(`📧 Email inviata a ${operaio.email}:`);
                console.log(`Oggetto: Convocazione per il cantiere ${cantiere.nome}`);
                console.log(`Messaggio: Gentile ${operaio.nome}, sei convocato al cantiere ${cantiere.nome} nei giorni ${giorni} con orario ${orario}.`);
            });
            
            // Feedback all'utente
            alert(`✅ Email inviate a ${operaiAssegnati.length} operai per i giorni: ${giorni}`);
            
            // Ripristina il bottone
            button.textContent = originalText;
            button.disabled = false;
        }, 2000);
    }

    closeCantiereModal() {
        this.closeModal('modal-cantiere-details');
        this.currentCantiereId = null;
    }
}

// Inizializza l'app quando il DOM è pronto
document.addEventListener('DOMContentLoaded', () => {
    window.app = new SseManager();
});