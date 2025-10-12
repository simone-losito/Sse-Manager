// app.js - Sse Manager Ver 1.5
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
        document.getElementById('menu-btn').addEventListener('click', () => this.toggleMenu());
        
        // Menu items
        document.querySelectorAll('.menu-item').forEach(item => {
            item.addEventListener('click', (e) => {
                const action = e.target.dataset.action;
                this.handleMenuAction(action);
            });
        });

        // Gestione utenti
        document.getElementById('add-user-btn').addEventListener('click', () => this.addUser());
        document.getElementById('form-user').addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveUser();
        });
        document.getElementById('cancel-user').addEventListener('click', () => this.closeUserModal());
        document.getElementById('close-users').addEventListener('click', () => this.closeUsersModal());

        // Ricerca e Filtri
        document.getElementById('search-operai').addEventListener('input', (e) => {
            this.filterOperai();
        });
        
        document.getElementById('search-cantieri').addEventListener('input', (e) => {
            this.filterCantieri(e.target.value);
        });

        // Filtri avanzati
        document.getElementById('filter-specializzazione').addEventListener('change', () => {
            this.filterOperai();
        });
        
        document.getElementById('filter-livello').addEventListener('change', () => {
            this.filterOperai();
        });
        
        document.getElementById('filter-preposto').addEventListener('change', () => {
            this.filterOperai();
        });

        // Modali operai
        document.getElementById('form-operaio').addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveOperaio();
        });
        
        document.getElementById('cancel-operaio').addEventListener('click', () => {
            this.closeModal();
        });

        // Modali cantieri
        document.getElementById('form-cantiere').addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveCantiere();
        });
        
        document.getElementById('cancel-cantiere').addEventListener('click', () => {
            this.closeModal();
        });

        // Dettagli cantiere
        document.getElementById('close-cantiere-details').addEventListener('click', () => {
            this.closeCantiereModal();
        });

        document.querySelector('.prev-month').addEventListener('click', () => {
            this.changeMonth(-1);
        });

        document.querySelector('.next-month').addEventListener('click', () => {
            this.changeMonth(1);
        });

        document.getElementById('btn-send-emails').addEventListener('click', () => {
            this.sendParticipationEmails();
        });

        // Impostazioni
        document.getElementById('close-settings').addEventListener('click', () => {
            this.closeSettings();
        });

        // Info modal
        document.getElementById('close-info').addEventListener('click', () => {
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
        
        // Click outside per chiudere menu
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.menu-container')) {
                this.closeMenu();
            }
        });

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
            
            // Abilita tutti i controlli
            this.enableAllControls(true);
        } else if (this.currentUser.type === 'manager') {
            modeText.textContent = 'Modalità: Manager';
            userInfo.innerHTML = `<span class="user-badge manager">👔 ${this.currentUser.username}</span>`;
            
            // Nascondi elementi master
            masterElements.forEach(el => el.style.display = 'none');
            
            // Abilita controlli (tranne gestione utenti)
            this.enableAllControls(true);
        } else {
            // Operaio
            const operaio = this.operai.find(o => o.id === this.currentUser.operaioId);
            modeText.textContent = 'Modalità: Operaio';
            userInfo.innerHTML = `<span class="user-badge operaio">👷 ${operaio ? operaio.nome : this.currentUser.username}</span>`;
            
            // Nascondi elementi master
            masterElements.forEach(el => el.style.display = 'none');
            
            // Disabilita la maggior parte dei controlli
            this.enableAllControls(false);
        }
    }

    enableAllControls(enabled) {
        const controls = [
            '#add-operaio-btn', '#add-cantiere-btn',
            '.btn-edit', '.btn-delete',
            '#search-operai', '#search-cantieri',
            '.filter-select'
        ];

        controls.forEach(selector => {
            const elements = document.querySelectorAll(selector);
            elements.forEach(el => {
                if (enabled) {
                    el.style.display = 'block';
                    el.disabled = false;
                } else {
                    if (selector.includes('btn-') || selector.includes('add-')) {
                        el.style.display = 'none';
                    } else {
                        el.disabled = true;
                    }
                }
            });
        });
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
        document.getElementById('modal-users').classList.remove('hidden');
    }

    renderUsersTable() {
        const tbody = document.getElementById('users-table-body');
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
        
        document.getElementById('modal-user-form').classList.remove('hidden');
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
            option.selected = operaio.id === user.operaioId;
            operaioSelect.appendChild(option);
        });
        
        document.getElementById('modal-user-form').classList.remove('hidden');
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
        document.getElementById('modal-user-form').classList.add('hidden');
    }

    closeUsersModal() {
        document.getElementById('modal-users').classList.add('hidden');
    }

    // ===== IMPORT/EXPORT DIPENDENTI =====
    exportOperai() {
        if (this.currentUser.type === 'operaio') {
            alert('❌ Non hai i permessi per esportare i dipendenti');
            return;
        }

        const data = this.operai.map(operaio => ({
            'Nome Completo': operaio.nome,
            'Email': operaio.email,
            'Telefono': operaio.telefono,
            'Specializzazione': operaio.specializzazione,
            'Livello': operaio.livello,
            'Preposto': operaio.preposto ? 'Sì' : 'No',
            'Cantiere Assegnato': operaio.cantiere ? this.cantieri.find(c => c.id === operaio.cantiere)?.nome : 'Nessuno'
        }));

        this.exportToExcel(data, 'dipendenti_standardse.xlsx');
        alert('✅ Dipendenti esportati con successo');
    }

    importOperai() {
        if (this.currentUser.type === 'operaio') {
            alert('❌ Non hai i permessi per importare i dipendenti');
            return;
        }

        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.xlsx, .xls, .csv';
        
        input.onchange = (e) => {
            const file = e.target.files[0];
            if (!file) return;

            const reader = new FileReader();
            reader.onload = (event) => {
                try {
                    const data = this.parseExcelData(event.target.result);
                    this.processImportedOperai(data);
                } catch (error) {
                    alert('❌ Errore durante l\'importazione: ' + error.message);
                }
            };
            reader.readAsArrayBuffer(file);
        };
        
        input.click();
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
                this.operai.push({
                    id: newId,
                    nome,
                    email,
                    telefono: row['Telefono'] || '',
                    specializzazione: row['Specializzazione'] || 'Operaio',
                    livello: parseInt(row['Livello']) || 3,
                    cantiere: null,
                    avatar: this.getAvatarForSpecializzazione(row['Specializzazione']),
                    preposto: row['Preposto'] === 'Sì'
                });
                importedCount++;
            }
        });

        this.saveAllData();
        this.renderApp();
        
        alert(`✅ Import completato!\nNuovi operai: ${importedCount}\nOperai aggiornati: ${updatedCount}`);
    }

    getAvatarForSpecializzazione(spec) {
        const avatars = {
            'Elettricista': '⚡',
            'Meccanico': '🔧',
            'Muratore': '🧱',
            'Carpentiere': '🪵',
            'Idraulico': '🚰',
            'Saldatore': '🔥',
            'Operatore Macchine': '🚜'
        };
        return avatars[spec] || '👷';
    }

    parseExcelData(arrayBuffer) {
        // Implementazione semplificata - in un'app reale useresti una libreria come SheetJS
        console.log('Parsing Excel data...', arrayBuffer);
        // Per ora restituiamo un array vuoto - l'implementazione completa richiederebbe SheetJS
        alert('⚠️ Funzionalità Import/Export Excel richiede la libreria SheetJS. Implementazione base completata.');
        return [];
    }

    exportToExcel(data, filename) {
        // Implementazione semplificata - in un'app reale useresti SheetJS
        const csvContent = this.convertToCSV(data);
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        
        link.setAttribute('href', url);
        link.setAttribute('download', filename.replace('.xlsx', '.csv'));
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    convertToCSV(data) {
        if (!data.length) return '';
        
        const headers = Object.keys(data[0]);
        const csvRows = [
            headers.join(','),
            ...data.map(row => 
                headers.map(header => 
                    JSON.stringify(row[header] || '')
                ).join(',')
            )
        ];
        
        return csvRows.join('\n');
    }

    // ===== FUNZIONI ESISTENTI (mantenute per compatibilità) =====
    handleMenuAction(action) {
        console.log('Menu action:', action);
        
        switch(action) {
            case 'manage-users':
                this.showUsersManagement();
                break;
            case 'export-operai':
                this.exportOperai();
                break;
            case 'import-operai':
                this.importOperai();
                break;
            case 'focus-search-operai':
                document.getElementById('search-operai').focus();
                break;
            case 'focus-search-cantieri':
                document.getElementById('search-cantieri').focus();
                break;
            case 'show-operai-list':
                this.showOperaiList();
                break;
            case 'show-cantieri-list':
                this.showCantieriList();
                break;
            case 'show-modify-cantiere':
                this.showModifyCantiere();
                break;
            case 'show-delete-cantiere':
                this.showDeleteCantiere();
                break;
            case 'export-data':
                this.exportData();
                break;
            case 'import-data':
                this.importData();
                break;
            case 'open-settings':
                this.openSettings();
                break;
            case 'open-general-settings':
                this.openGeneralSettings();
                break;
            case 'show-info':
                this.showInfo();
                break;
            case 'logout':
                this.logout();
                break;
        }
        
        this.closeMenu();
    }

    renderApp() {
        this.renderOperai();
        this.renderCantieri();
        this.updateStats();
    }

    renderOperai() {
        const container = document.getElementById('operai-container');
        const controls = document.getElementById('controls-operai');
        
        container.innerHTML = '';
        controls.innerHTML = '';

        // Solo master e manager possono aggiungere operai
        if (this.currentUser.type !== 'operaio') {
            const addBtn = document.createElement('button');
            addBtn.className = 'btn btn-primary';
            addBtn.innerHTML = '➕ Aggiungi Operaio';
            addBtn.id = 'add-operaio-btn';
            addBtn.addEventListener('click', () => this.showAddOperaioModal());
            controls.appendChild(addBtn);
        }

        const operaiDisponibili = this.operai.filter(operaio => !operaio.cantiere);
        const operaiAssegnati = this.operai.filter(operaio => operaio.cantiere);

        // Operai disponibili
        if (operaiDisponibili.length > 0) {
            const disponibiliSection = document.createElement('div');
            disponibiliSection.className = 'operai-section';
            disponibiliSection.innerHTML = `<h3>👷 Operai Disponibili</h3>`;
            
            operaiDisponibili.forEach(operaio => {
                if (this.isOperaioVisible(operaio)) {
                    disponibiliSection.appendChild(this.createOperaioCard(operaio));
                }
            });
            
            container.appendChild(disponibiliSection);
        }

        // Operai assegnati
        if (operaiAssegnati.length > 0) {
            const assegnatiSection = document.createElement('div');
            assegnatiSection.className = 'operai-section';
            assegnatiSection.innerHTML = `<h3>📍 Operai Assegnati</h3>`;
            
            operaiAssegnati.forEach(operaio => {
                if (this.isOperaioVisible(operaio)) {
                    assegnatiSection.appendChild(this.createOperaioCard(operaio));
                }
            });
            
            container.appendChild(assegnatiSection);
        }

        if (container.children.length === 0) {
            container.innerHTML = '<div class="no-data">Nessun operaio trovato con i filtri attuali</div>';
        }
    }

    createOperaioCard(operaio) {
        const card = document.createElement('div');
        card.className = `operaio-card ${operaio.preposto ? 'preposto' : ''}`;
        card.draggable = this.currentUser.type !== 'operaio';
        card.innerHTML = `
            <div class="operaio-header">
                <span class="operaio-avatar">${operaio.avatar}</span>
                <span class="operaio-nome">${operaio.nome}</span>
                ${operaio.preposto ? '<span class="preposto-badge">⭐</span>' : ''}
            </div>
            <div class="operaio-info">
                <div class="operaio-email">📧 ${operaio.email}</div>
                <div class="operaio-telefono">📞 ${operaio.telefono}</div>
                <div class="operaio-specializzazione">${operaio.specializzazione}</div>
                <div class="operaio-livello">Livello ${operaio.livello}</div>
            </div>
            ${this.currentUser.type !== 'operaio' ? `
                <div class="operaio-actions">
                    <button class="btn-edit" onclick="app.editOperaio(${operaio.id})">✏️</button>
                    <button class="btn-delete" onclick="app.deleteOperaio(${operaio.id})">🗑️</button>
                </div>
            ` : ''}
        `;

        if (this.currentUser.type !== 'operaio') {
            card.addEventListener('dragstart', (e) => {
                this.draggedOperaio = operaio;
                e.dataTransfer.setData('text/plain', operaio.id);
                card.classList.add('dragging');
            });

            card.addEventListener('dragend', () => {
                this.draggedOperaio = null;
                card.classList.remove('dragging');
            });
        }

        return card;
    }

    renderCantieri() {
        const container = document.getElementById('map-container');
        const controls = document.getElementById('controls-cantieri');
        
        container.innerHTML = '';
        controls.innerHTML = '';

        // Solo master e manager possono aggiungere cantieri
        if (this.currentUser.type !== 'operaio') {
            const addBtn = document.createElement('button');
            addBtn.className = 'btn btn-primary';
            addBtn.innerHTML = '➕ Aggiungi Cantiere';
            addBtn.id = 'add-cantiere-btn';
            addBtn.addEventListener('click', () => this.showAddCantiereModal());
            controls.appendChild(addBtn);
        }

        this.cantieri.forEach(cantiere => {
            const cantiereElement = document.createElement('div');
            cantiereElement.className = 'cantiere';
            cantiereElement.style.left = cantiere.x + 'px';
            cantiereElement.style.top = cantiere.y + 'px';
            cantiereElement.draggable = this.currentUser.type !== 'operaio';
            cantiereElement.innerHTML = `
                <div class="cantiere-icon">${this.getCantiereIcon(cantiere.tipo)}</div>
                <div class="cantiere-info">
                    <div class="cantiere-nome">${cantiere.nome}</div>
                    <div class="cantiere-indirizzo">${cantiere.indirizzo}</div>
                    <div class="cantiere-operai-count">👷 ${cantiere.operai.length} operai</div>
                </div>
            `;

            cantiereElement.addEventListener('click', () => {
                this.showCantiereDetails(cantiere.id);
            });

            if (this.currentUser.type !== 'operaio') {
                cantiereElement.addEventListener('dragstart', (e) => {
                    this.draggedCantiere = cantiere;
                    e.dataTransfer.setData('text/plain', cantiere.id);
                    cantiereElement.classList.add('dragging');
                });

                cantiereElement.addEventListener('dragend', () => {
                    this.draggedCantiere = null;
                    cantiereElement.classList.remove('dragging');
                });

                cantiereElement.addEventListener('dragover', (e) => {
                    e.preventDefault();
                    cantiereElement.classList.add('drag-over');
                });

                cantiereElement.addEventListener('dragleave', () => {
                    cantiereElement.classList.remove('drag-over');
                });

                cantiereElement.addEventListener('drop', (e) => {
                    e.preventDefault();
                    cantiereElement.classList.remove('drag-over');
                    
                    if (this.draggedOperaio) {
                        this.assignOperaioToCantiere(this.draggedOperaio.id, cantiere.id);
                    }
                });
            }

            container.appendChild(cantiereElement);
        });
    }

    // ... (tutte le altre funzioni rimangono uguali)
    // Per brevità, mantengo solo le funzioni modificate o nuove

    filterOperai() {
        this.renderOperai();
    }

    isOperaioVisible(operaio) {
        const searchTerm = document.getElementById('search-operai').value.toLowerCase();
        const specializzazioneFilter = document.getElementById('filter-specializzazione').value;
        const livelloFilter = document.getElementById('filter-livello').value;
        const prepostoFilter = document.getElementById('filter-preposto').value;

        if (searchTerm && !operaio.nome.toLowerCase().includes(searchTerm) && 
            !operaio.specializzazione.toLowerCase().includes(searchTerm)) {
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
        const cantieriElements = document.querySelectorAll('.cantiere');
        
        cantieriElements.forEach(element => {
            const nome = element.querySelector('.cantiere-nome').textContent.toLowerCase();
            const indirizzo = element.querySelector('.cantiere-indirizzo').textContent.toLowerCase();
            
            if (nome.includes(searchTerm.toLowerCase()) || indirizzo.includes(searchTerm.toLowerCase())) {
                element.style.display = 'block';
            } else {
                element.style.display = 'none';
            }
        });
    }

    updateStats() {
        const totalOperai = this.operai.length;
        const assignedOperai = this.operai.filter(o => o.cantiere).length;
        const totalCantieri = this.cantieri.length;

        document.getElementById('total-operai').textContent = totalOperai;
        document.getElementById('assigned-operai').textContent = assignedOperai;
        document.getElementById('total-cantieri').textContent = totalCantieri;

        // Aggiorna anche nel modal info
        document.getElementById('info-total-operai').textContent = totalOperai;
        document.getElementById('info-assigned-operai').textContent = assignedOperai;
        document.getElementById('info-total-cantieri').textContent = totalCantieri;
    }

    // Gestione dati
    loadData(key) {
        const data = localStorage.getItem(`sse-manager-${key}`);
        return data ? JSON.parse(data) : null;
    }

    saveData(key, data) {
        localStorage.setItem(`sse-manager-${key}`, JSON.stringify(data));
    }

    saveAllData() {
        this.saveData('operai', this.operai);
        this.saveData('cantieri', this.cantieri);
        this.saveData('users', this.users);
        console.log('💾 Tutti i dati salvati');
    }

    setupAutoSave() {
        if (this.autoSaveEnabled) {
            setInterval(() => {
                this.saveAllData();
            }, 30000); // Salva ogni 30 secondi
        }
    }

    // Menu functions
    toggleMenu() {
        const menu = document.getElementById('menu-dropdown');
        menu.classList.toggle('hidden');
    }

    closeMenu() {
        document.getElementById('menu-dropdown').classList.add('hidden');
    }

    // Le altre funzioni rimangono uguali...
    // Per brevità, ometto le funzioni che non sono state modificate
}

// Inizializzazione app
const app = new SseManager();