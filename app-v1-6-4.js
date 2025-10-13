// app.js - Sse Manager Ver 1.6.4 - Database Supabase Integration
console.log('🏗️ Sse Manager - Caricamento Ver 1.6.4...');

class SseManager {
    constructor() {
        // Configurazione database Supabase
        this.supabaseConfig = this.loadData('supabaseConfig') || {
            url: '',
            key: '',
            connected: false
        };
        this.supabaseClient = null;
        
        // Dati locali (fallback e cache)
        this.operai = this.loadData('operai') || [
            {id: 1, nome: "Marco Rossi", email: "marco.rossi@standardse.it", telefono: "333-1234567", specializzazione: "Elettricista", livello: 5, cantiere: 1, avatar: "⚡", preposto: true},
            {id: 2, nome: "Giuseppe Bianchi", email: "giuseppe.bianchi@standardse.it", telefono: "335-2345678", specializzazione: "Meccanico", livello: 4, cantiere: 1, avatar: "🔧", preposto: false},
            {id: 3, nome: "Antonio Verde", email: "antonio.verde@standardse.it", telefono: "338-3456789", specializzazione: "Elettricista", livello: 3, cantiere: 2, avatar: "⚡", preposto: false},
            {id: 4, nome: "Francesco Neri", email: "francesco.neri@standardse.it", telefono: "339-4567890", specializzazione: "Meccanico", livello: 5, cantiere: 2, avatar: "🔧", preposto: true},
            {id: 5, nome: "Luigi Viola", email: "luigi.viola@standardse.it", telefono: "340-5678901", specializzazione: "Elettricista", livello: 2, cantiere: null, avatar: "⚡", preposto: false},
            {id: 6, nome: "Salvatore Blu", email: "salvatore.blu@standardse.it", telefono: "346-6789012", specializzazione: "Meccanico", livello: 3, cantiere: null, avatar: "🔧", preposto: false}
        ];
        
        this.cantieri = this.loadData('cantieri') || [
            {id: 1, nome: "Palazzo Roma Centro", indirizzo: "Via Roma 123, Roma", tipo: "Civile", x: 150, y: 200, operai: [1, 2], calendarSelections: {}, timeSlot: {start: "08:00", end: "17:00"}, operaiTimeSlots: {}},
            {id: 2, nome: "Impianto Industriale Ostia", indirizzo: "Via del Mare 45, Ostia", tipo: "Industriale", x: 400, y: 300, operai: [4, 3], calendarSelections: {}, timeSlot: {start: "07:00", end: "16:00"}, operaiTimeSlots: {}},
            {id: 3, nome: "Ristrutturazione Trastevere", indirizzo: "Viale Trastevere 78, Roma", tipo: "Residenziale", x: 300, y: 150, operai: [], calendarSelections: {}, timeSlot: {start: "08:30", end: "17:30"}, operaiTimeSlots: {}}
        ];
        
        this.users = this.loadData('users') || [
            {id: 1, username: 'master', password: 'Sse19731973!', type: 'master', operaioId: null, lastLogin: null},
            {id: 2, username: 'marco.rossi', password: 'password123', type: 'operaio', operaioId: 1, lastLogin: null},
            {id: 3, username: 'giuseppe.bianchi', password: 'password123', type: 'operaio', operaioId: 2, lastLogin: null}
        ];
        
        // Nuova struttura per turni di lavoro
        this.turniLavoro = this.loadData('turniLavoro') || [];
        
        // Variabili di stato
        this.currentUser = null;
        this.draggedOperaio = null;
        this.draggedCantiere = null;
        this.isDragDropActive = true;
        this.currentCantiereId = null;
        this.currentMonth = new Date().getMonth();
        this.currentYear = new Date().getFullYear();
        this.autoSaveEnabled = true;
        this.selectedDate = null;
        
        // Variabili per drag & drop migliorato
        this.dragOffsetX = 0;
        this.dragOffsetY = 0;
        
        this.init();
    }
    
    async init() {
        console.log('🚀 Inizializzazione Sse Manager Ver 1.6.4');
        await this.initSupabase();
        this.setupEventListeners();
        this.updateStats();
        this.setupAutoSave();
    }
    
    // ===== GESTIONE DATABASE SUPABASE =====
    async initSupabase() {
        if (this.supabaseConfig.url && this.supabaseConfig.key) {
            try {
                // Importa la libreria Supabase dinamicamente
                const { createClient } = await import('https://cdn.skypack.dev/@supabase/supabase-js');
                this.supabaseClient = createClient(this.supabaseConfig.url, this.supabaseConfig.key);
                await this.testSupabaseConnection();
            } catch (error) {
                console.error('Errore inizializzazione Supabase:', error);
                this.supabaseConfig.connected = false;
            }
        }
    }
    
    async testSupabaseConnection() {
        if (!this.supabaseClient) return false;
        
        try {
            const { data, error } = await this.supabaseClient.from('operai').select('count', { count: 'exact' });
            if (error) throw error;
            
            this.supabaseConfig.connected = true;
            console.log('✅ Connessione Supabase attiva');
            await this.syncWithDatabase();
            return true;
        } catch (error) {
            console.error('❌ Errore connessione Supabase:', error);
            this.supabaseConfig.connected = false;
            return false;
        }
    }
    
    async syncWithDatabase() {
        if (!this.supabaseConfig.connected) return;
        
        try {
            // Sincronizza operai
            const { data: operaiData } = await this.supabaseClient.from('operai').select('*');
            if (operaiData && operaiData.length > 0) {
                this.operai = operaiData;
            }
            
            // Sincronizza cantieri
            const { data: cantieriData } = await this.supabaseClient.from('cantieri').select('*');
            if (cantieriData && cantieriData.length > 0) {
                this.cantieri = cantieriData;
            }
            
            // Sincronizza turni
            const { data: turniData } = await this.supabaseClient.from('turni_lavoro').select('*');
            if (turniData) {
                this.turniLavoro = turniData;
            }
            
            // Sincronizza utenti
            const { data: usersData } = await this.supabaseClient.from('users').select('*');
            if (usersData && usersData.length > 0) {
                this.users = usersData;
            }
            
            console.log('🔄 Sincronizzazione database completata');
            this.renderApp();
        } catch (error) {
            console.error('Errore sincronizzazione:', error);
        }
    }
    
    async saveToDatabase(table, data, operation = 'upsert') {
        if (!this.supabaseConfig.connected) {
            console.log('Database non connesso, salvataggio locale');
            return this.saveAllData();
        }
        
        try {
            let result;
            switch (operation) {
                case 'insert':
                    result = await this.supabaseClient.from(table).insert(data);
                    break;
                case 'update':
                    result = await this.supabaseClient.from(table).update(data).eq('id', data.id);
                    break;
                case 'delete':
                    result = await this.supabaseClient.from(table).delete().eq('id', data.id);
                    break;
                default:
                    result = await this.supabaseClient.from(table).upsert(data);
            }
            
            if (result.error) throw result.error;
            console.log(`✅ ${table} salvato nel database`);
            return result;
        } catch (error) {
            console.error(`Errore salvataggio ${table}:`, error);
            this.saveAllData(); // Fallback locale
        }
    }
    
    async saveSupabaseConfig() {
        const url = document.getElementById('supabase-url')?.value;
        const key = document.getElementById('supabase-key')?.value;
        
        if (!url || !key) {
            alert('Inserisci URL e Key di Supabase');
            return;
        }
        
        this.supabaseConfig = {
            url: url,
            key: key,
            connected: false
        };
        
        this.saveData('supabaseConfig', this.supabaseConfig);
        
        // Test connessione
        await this.initSupabase();
        
        if (this.supabaseConfig.connected) {
            alert('✅ Configurazione Supabase salvata e connessione attiva');
            this.closeModal('modal-settings');
        } else {
            alert('❌ Errore connessione. Verifica le credenziali');
        }
    }
    
    // ===== GESTIONE CALENDARIO CON FASCE ORARIE PERSONALIZZATE =====
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
        
        for (let i = 0; i < 42; i++) {
            const currentDate = new Date(startDate);
            currentDate.setDate(startDate.getDate() + i);
            
            const isCurrentMonth = currentDate.getMonth() === this.currentMonth;
            const dateString = currentDate.toISOString().split('T')[0];
            const isSelected = cantiere.calendarSelections && cantiere.calendarSelections[dateString];
            
            calendarHtml += `
                <div class="calendar-day ${!isCurrentMonth ? 'other-month' : ''} ${isSelected ? 'selected' : ''}" 
                     data-date="${dateString}">
                    ${currentDate.getDate()}
                </div>
            `;
        }
        
        document.getElementById('calendar-days').innerHTML = calendarHtml;
        
        // Event listeners per i giorni del calendario
        document.querySelectorAll('.calendar-day').forEach(day => {
            day.addEventListener('click', (e) => {
                const date = e.target.dataset.date;
                this.selectCalendarDate(date);
            });
        });
    }
    
    async selectCalendarDate(dateString) {
        const cantiere = this.cantieri.find(c => c.id === this.currentCantiereId);
        if (!cantiere) return;
        
        this.selectedDate = dateString;
        
        // Toggle selezione
        if (!cantiere.calendarSelections) cantiere.calendarSelections = {};
        cantiere.calendarSelections[dateString] = !cantiere.calendarSelections[dateString];
        
        // Render orari personalizzati se il giorno è selezionato
        if (cantiere.calendarSelections[dateString]) {
            this.renderCustomTimeSlots(dateString);
        } else {
            document.getElementById('custom-time-slots').innerHTML = '';
        }
        
        this.renderCalendar();
        await this.saveToDatabase('cantieri', cantiere);
        this.saveAllData();
    }
    
    renderCustomTimeSlots(dateString) {
        const cantiere = this.cantieri.find(c => c.id === this.currentCantiereId);
        if (!cantiere) return;
        
        const operaiAssegnati = cantiere.operai.map(id => this.operai.find(o => o.id === id)).filter(o => o);
        
        if (!cantiere.operaiTimeSlots) cantiere.operaiTimeSlots = {};
        if (!cantiere.operaiTimeSlots[dateString]) cantiere.operaiTimeSlots[dateString] = {};
        
        let timeSlotsHtml = `
            <div class="custom-time-slots">
                <h4>⏰ Orari Personalizzati - ${new Date(dateString).toLocaleDateString('it-IT')}</h4>
                
                <div class="same-time-for-all">
                    <button class="btn btn-primary" onclick="app.applySameTimeForAll('${dateString}')">
                        📋 Applica Stesso Orario a Tutti
                    </button>
                    <div class="time-inputs">
                        <label>
                            Inizio: <input type="time" id="global-start-${dateString}" value="${cantiere.timeSlot.start}">
                        </label>
                        <label>
                            Fine: <input type="time" id="global-end-${dateString}" value="${cantiere.timeSlot.end}">
                        </label>
                    </div>
                </div>
                
                <div class="individual-time-slots">
                    <h5>👥 Orari Individuali</h5>
        `;
        
        operaiAssegnati.forEach(operaio => {
            const currentSlot = cantiere.operaiTimeSlots[dateString][operaio.id] || {
                start: cantiere.timeSlot.start,
                end: cantiere.timeSlot.end
            };
            
            timeSlotsHtml += `
                <div class="operaio-time-slot">
                    <span class="operaio-name">${operaio.avatar} ${operaio.nome}</span>
                    <div class="time-inputs">
                        <label>
                            Inizio: 
                            <input type="time" 
                                   value="${currentSlot.start}" 
                                   onchange="app.updateOperaioTimeSlot('${dateString}', ${operaio.id}, 'start', this.value)">
                        </label>
                        <label>
                            Fine: 
                            <input type="time" 
                                   value="${currentSlot.end}" 
                                   onchange="app.updateOperaioTimeSlot('${dateString}', ${operaio.id}, 'end', this.value)">
                        </label>
                    </div>
                </div>
            `;
        });
        
        timeSlotsHtml += `
                </div>
            </div>
        `;
        
        document.getElementById('custom-time-slots').innerHTML = timeSlotsHtml;
    }
    
    async applySameTimeForAll(dateString) {
        const cantiere = this.cantieri.find(c => c.id === this.currentCantiereId);
        if (!cantiere) return;
        
        const globalStart = document.getElementById(`global-start-${dateString}`).value;
        const globalEnd = document.getElementById(`global-end-${dateString}`).value;
        
        if (!globalStart || !globalEnd) {
            alert('Inserisci orario di inizio e fine');
            return;
        }
        
        const operaiAssegnati = cantiere.operai;
        
        if (!cantiere.operaiTimeSlots[dateString]) cantiere.operaiTimeSlots[dateString] = {};
        
        operaiAssegnati.forEach(operaioId => {
            cantiere.operaiTimeSlots[dateString][operaioId] = {
                start: globalStart,
                end: globalEnd
            };
        });
        
        // Salva turno nel database
        const turno = {
            id: `${this.currentCantiereId}-${dateString}`,
            cantiere_id: this.currentCantiereId,
            data: dateString,
            operai_time_slots: cantiere.operaiTimeSlots[dateString],
            created_at: new Date().toISOString()
        };
        
        await this.saveToDatabase('turni_lavoro', turno);
        
        this.renderCustomTimeSlots(dateString);
        this.saveAllData();
        
        alert('✅ Orario applicato a tutti i dipendenti');
    }
    
    async updateOperaioTimeSlot(dateString, operaioId, field, value) {
        const cantiere = this.cantieri.find(c => c.id === this.currentCantiereId);
        if (!cantiere) return;
        
        if (!cantiere.operaiTimeSlots[dateString]) cantiere.operaiTimeSlots[dateString] = {};
        if (!cantiere.operaiTimeSlots[dateString][operaioId]) {
            cantiere.operaiTimeSlots[dateString][operaioId] = {
                start: cantiere.timeSlot.start,
                end: cantiere.timeSlot.end
            };
        }
        
        cantiere.operaiTimeSlots[dateString][operaioId][field] = value;
        
        // Salva turno nel database
        const turno = {
            id: `${this.currentCantiereId}-${dateString}-${operaioId}`,
            cantiere_id: this.currentCantiereId,
            operaio_id: operaioId,
            data: dateString,
            ora_inizio: cantiere.operaiTimeSlots[dateString][operaioId].start,
            ora_fine: cantiere.operaiTimeSlots[dateString][operaioId].end,
            created_at: new Date().toISOString()
        };
        
        await this.saveToDatabase('turni_lavoro', turno);
        this.saveAllData();
    }
    
    // ===== GESTIONE EVENTI =====
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
        
        // Settings
        document.querySelectorAll('.tab').forEach(tab => {
            tab.addEventListener('click', (e) => {
                const tabName = e.target.dataset.tab;
                this.switchSettingsTab(tabName);
            });
        });
        
        document.getElementById('save-email')?.addEventListener('click', () => this.saveEmailSettings());
        document.getElementById('save-general')?.addEventListener('click', () => this.saveGeneralSettings());
        document.getElementById('save-supabase')?.addEventListener('click', () => this.saveSupabaseConfig());
        document.getElementById('test-email')?.addEventListener('click', () => this.testEmailConnection());
        document.getElementById('reset-email')?.addEventListener('click', () => this.resetEmailSettings());
        document.getElementById('reset-general')?.addEventListener('click', () => this.resetGeneralSettings());
        
        // Export/Import
        document.getElementById('export-data')?.addEventListener('click', () => this.exportAllData());
        document.getElementById('import-data')?.addEventListener('click', () => this.importData());
        
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
            case 'import-operai':
                this.importOperaiCSV();
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
                this.exportAllData();
                break;
            case 'import-data':
                this.importData();
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
            userInfo.innerHTML = `👑 ${this.currentUser.username}`;
            masterElements.forEach(el => el.style.display = 'block');
            document.body.classList.add('current-user-master');
        } else if (this.currentUser.type === 'manager') {
            modeText.textContent = 'Modalità: Manager';
            userInfo.innerHTML = `👔 ${this.currentUser.username}`;
            masterElements.forEach(el => el.style.display = 'none');
            document.body.classList.remove('current-user-master');
        } else {
            const operaio = this.operai.find(o => o.id === this.currentUser.operaioId);
            modeText.textContent = 'Modalità: Operaio';
            userInfo.innerHTML = `👷 ${operaio ? operaio.nome : this.currentUser.username}`;
            masterElements.forEach(el => el.style.display = 'none');
            document.body.classList.remove('current-user-master');
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
        document.body.classList.remove('current-user-master');
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
            controls.innerHTML = `
                <button class="btn btn-primary" onclick="app.addOperaio()">➕ Aggiungi Operaio</button>
            `;
        } else {
            controls.innerHTML = '';
        }
        
        const filteredOperai = this.getFilteredOperai();
        
        filteredOperai.forEach(operaio => {
            const card = document.createElement('div');
            card.className = `operaio-card ${operaio.cantiere ? 'assigned' : ''}`;
            card.draggable = (this.currentUser.type === 'manager' || this.currentUser.type === 'master') && this.isDragDropActive;
            card.dataset.operaioId = operaio.id;
            
            // Setup drag events
            if ((this.currentUser.type === 'manager' || this.currentUser.type === 'master') && this.isDragDropActive) {
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
                <div class="operaio-avatar">${operaio.avatar}</div>
                <div class="operaio-info">
                    <div class="operaio-name">${operaio.nome}</div>
                    <div class="operaio-specializzazione">${operaio.specializzazione}</div>
                    <div class="operaio-level">Livello: ${operaio.livello}</div>
                    ${operaio.preposto ? '<div class="preposto-badge">⭐ PREPOSTO</div>' : ''}
                </div>
                <div class="operaio-cantiere">
                    ${cantiere ? `📍 ${cantiere.nome}` : '🏠 Non assegnato'}
                </div>
                ${(this.currentUser.type === 'manager' || this.currentUser.type === 'master') ? `
                    <div class="operaio-actions">
                        <button onclick="app.editOperaio(${operaio.id})" class="btn-icon" title="Modifica">✏️</button>
                        <button onclick="app.deleteOperaio(${operaio.id})" class="btn-icon delete" title="Elimina">🗑️</button>
                    </div>
                ` : ''}
            `;
            
            container.appendChild(card);
        });
    }
    
    getFilteredOperai() {
        const searchTerm = document.getElementById('search-operai')?.value.toLowerCase() || '';
        const filterSpec = document.getElementById('filter-specializzazione')?.value || '';
        const filterLivello = document.getElementById('filter-livello')?.value || '';
        const filterPreposto = document.getElementById('filter-preposto')?.value || '';
        
        return this.operai.filter(operaio => {
            const matchesSearch = operaio.nome.toLowerCase().includes(searchTerm) ||
                                operaio.specializzazione.toLowerCase().includes(searchTerm);
            const matchesSpec = !filterSpec || operaio.specializzazione === filterSpec;
            const matchesLivello = !filterLivello || operaio.livello.toString() === filterLivello;
            const matchesPreposto = !filterPreposto || 
                                  (filterPreposto === 'true' && operaio.preposto) ||
                                  (filterPreposto === 'false' && !operaio.preposto);
            
            return matchesSearch && matchesSpec && matchesLivello && matchesPreposto;
        });
    }
    
    filterOperai() {
        this.renderOperai();
    }
    
    addOperaio() {
        // Reset form
        document.getElementById('form-operaio').reset();
        document.getElementById('operaio-id').value = '';
        document.getElementById('modal-operaio-title').textContent = 'Aggiungi Operaio';
        this.showModal('modal-operaio');
    }
    
    editOperaio(id) {
        const operaio = this.operai.find(o => o.id === id);
        if (!operaio) return;
        
        document.getElementById('operaio-id').value = operaio.id;
        document.getElementById('operaio-nome').value = operaio.nome;
        document.getElementById('operaio-email').value = operaio.email;
        document.getElementById('operaio-telefono').value = operaio.telefono;
        document.getElementById('operaio-specializzazione').value = operaio.specializzazione;
        document.getElementById('operaio-livello').value = operaio.livello;
        document.getElementById('operaio-preposto').checked = operaio.preposto;
        
        document.getElementById('modal-operaio-title').textContent = 'Modifica Operaio';
        this.showModal('modal-operaio');
    }
    
    async deleteOperaio(id) {
        if (!confirm('Sei sicuro di voler eliminare questo operaio?')) return;
        
        const operaio = this.operai.find(o => o.id === id);
        if (!operaio) return;
        
        // Rimuovi da cantieri
        this.cantieri.forEach(cantiere => {
            cantiere.operai = cantiere.operai.filter(opId => opId !== id);
        });
        
        // Rimuovi dall'array
        this.operai = this.operai.filter(o => o.id !== id);
        
        // Salva nel database
        await this.saveToDatabase('operai', {id: id}, 'delete');
        
        this.renderApp();
        this.saveAllData();
        alert('✅ Operaio eliminato');
    }
    
    async saveOperaio() {
        const form = document.getElementById('form-operaio');
        const formData = new FormData(form);
        
        const operaio = {
            id: parseInt(formData.get('operaio-id')) || Date.now(),
            nome: formData.get('nome'),
            email: formData.get('email'),
            telefono: formData.get('telefono'),
            specializzazione: formData.get('specializzazione'),
            livello: parseInt(formData.get('livello')),
            preposto: formData.get('preposto') === 'on',
            cantiere: null,
            avatar: formData.get('specializzazione') === 'Elettricista' ? '⚡' : '🔧'
        };
        
        if (!operaio.nome || !operaio.email) {
            alert('Nome e email sono obbligatori');
            return;
        }
        
        const existingIndex = this.operai.findIndex(o => o.id === operaio.id);
        if (existingIndex >= 0) {
            // Mantieni il cantiere attuale se stai modificando
            operaio.cantiere = this.operai[existingIndex].cantiere;
            this.operai[existingIndex] = operaio;
        } else {
            this.operai.push(operaio);
        }
        
        // Salva nel database
        await this.saveToDatabase('operai', operaio);
        
        this.renderApp();
        this.saveAllData();
        this.closeModal('modal-operaio');
        alert('✅ Operaio salvato');
    }
    
    // ===== GESTIONE CANTIERI =====
    renderCantieri() {
        const container = document.getElementById('cantieri-container');
        if (!container) return;
        
        container.innerHTML = '';
        
        this.cantieri.forEach(cantiere => {
            const cantiereEl = document.createElement('div');
            cantiereEl.className = 'cantiere';
            cantiereEl.draggable = (this.currentUser.type === 'manager' || this.currentUser.type === 'master') && this.isDragDropActive;
            cantiereEl.dataset.cantiereId = cantiere.id;
            cantiereEl.style.left = `${cantiere.x}px`;
            cantiereEl.style.top = `${cantiere.y}px`;
            
            // Setup drag events per cantieri
            if ((this.currentUser.type === 'manager' || this.currentUser.type === 'master') && this.isDragDropActive) {
                cantiereEl.addEventListener('dragstart', (e) => {
                    this.draggedCantiere = cantiere.id;
                    const rect = cantiereEl.getBoundingClientRect();
                    this.dragOffsetX = e.clientX - rect.left;
                    this.dragOffsetY = e.clientY - rect.top;
                    cantiereEl.classList.add('dragging');
                });
                
                cantiereEl.addEventListener('dragend', () => {
                    cantiereEl.classList.remove('dragging');
                    this.draggedCantiere = null;
                });
            }
            
            // Setup drop zone per operai
            cantiereEl.addEventListener('dragover', (e) => {
                e.preventDefault();
                if (this.draggedOperaio && !this.draggedCantiere) {
                    cantiereEl.classList.add('drop-zone');
                }
            });
            
            cantiereEl.addEventListener('dragleave', () => {
                cantiereEl.classList.remove('drop-zone');
            });
            
            cantiereEl.addEventListener('drop', (e) => {
                e.preventDefault();
                cantiereEl.classList.remove('drop-zone');
                
                if (this.draggedOperaio) {
                    this.assignOperaioToCantiere(this.draggedOperaio, cantiere.id);
                }
            });
            
            const tipoIcon = cantiere.tipo === 'Civile' ? '🏢' : cantiere.tipo === 'Industriale' ? '🏭' : '🏠';
            
            cantiereEl.innerHTML = `
                <div class="cantiere-header">
                    <span class="cantiere-tipo">${tipoIcon}</span>
                    <span class="cantiere-nome">${cantiere.nome}</span>
                </div>
                <div class="cantiere-info">
                    <div class="cantiere-indirizzo">${cantiere.indirizzo}</div>
                    <div class="cantiere-operai-count">👥 ${cantiere.operai.length} operai</div>
                </div>
            `;
            
            cantiereEl.addEventListener('click', () => {
                this.showCantiereDetails(cantiere.id);
            });
            
            container.appendChild(cantiereEl);
        });
        
        // Setup drop zone per la mappa (per rimuovere operai)
        const mapContainer = document.getElementById('map-container');
        if (mapContainer) {
            mapContainer.addEventListener('dragover', (e) => {
                e.preventDefault();
                if (this.draggedCantiere) {
                    const rect = mapContainer.getBoundingClientRect();
                    const x = e.clientX - rect.left - this.dragOffsetX;
                    const y = e.clientY - rect.top - this.dragOffsetY;
                    
                    const cantiereEl = document.querySelector(`[data-cantiere-id="${this.draggedCantiere}"]`);
                    if (cantiereEl) {
                        cantiereEl.style.left = `${Math.max(0, Math.min(x, rect.width - cantiereEl.offsetWidth))}px`;
                        cantiereEl.style.top = `${Math.max(0, Math.min(y, rect.height - cantiereEl.offsetHeight))}px`;
                    }
                }
            });
            
            mapContainer.addEventListener('drop', async (e) => {
                e.preventDefault();
                
                if (this.draggedCantiere) {
                    const rect = mapContainer.getBoundingClientRect();
                    const x = e.clientX - rect.left - this.dragOffsetX;
                    const y = e.clientY - rect.top - this.dragOffsetY;
                    
                    const cantiere = this.cantieri.find(c => c.id === this.draggedCantiere);
                    if (cantiere) {
                        cantiere.x = Math.max(0, Math.min(x, rect.width - 200));
                        cantiere.y = Math.max(0, Math.min(y, rect.height - 100));
                        
                        await this.saveToDatabase('cantieri', cantiere);
                        this.saveAllData();
                    }
                } else if (this.draggedOperaio) {
                    // Rimuovi operaio dal cantiere se trascinato sulla mappa vuota
                    const target = e.target;
                    if (target.id === 'map-container' || target.classList.contains('map-container')) {
                        this.removeOperaioFromCantiere(this.draggedOperaio);
                    }
                }
            });
        }
    }
    
    filterCantieri(searchTerm) {
        const cantieri = document.querySelectorAll('.cantiere');
        cantieri.forEach(cantiere => {
            const nome = cantiere.querySelector('.cantiere-nome').textContent.toLowerCase();
            const indirizzo = cantiere.querySelector('.cantiere-indirizzo').textContent.toLowerCase();
            
            if (nome.includes(searchTerm.toLowerCase()) || indirizzo.includes(searchTerm.toLowerCase())) {
                cantiere.style.display = 'block';
            } else {
                cantiere.style.display = 'none';
            }
        });
    }
    
    async assignOperaioToCantiere(operaioId, cantiereId) {
        const operaio = this.operai.find(o => o.id === operaioId);
        const cantiere = this.cantieri.find(c => c.id === cantiereId);
        
        if (!operaio || !cantiere) return;
        
        // Rimuovi da cantiere precedente
        if (operaio.cantiere) {
            const oldCantiere = this.cantieri.find(c => c.id === operaio.cantiere);
            if (oldCantiere) {
                oldCantiere.operai = oldCantiere.operai.filter(id => id !== operaioId);
                await this.saveToDatabase('cantieri', oldCantiere);
            }
        }
        
        // Assegna al nuovo cantiere
        operaio.cantiere = cantiereId;
        if (!cantiere.operai.includes(operaioId)) {
            cantiere.operai.push(operaioId);
        }
        
        // Salva nel database
        await this.saveToDatabase('operai', operaio);
        await this.saveToDatabase('cantieri', cantiere);
        
        this.renderApp();
        this.saveAllData();
        alert(`✅ ${operaio.nome} assegnato a ${cantiere.nome}`);
    }
    
    async removeOperaioFromCantiere(operaioId) {
        const operaio = this.operai.find(o => o.id === operaioId);
        if (!operaio) return;
        
        if (operaio.cantiere) {
            const cantiere = this.cantieri.find(c => c.id === operaio.cantiere);
            if (cantiere) {
                cantiere.operai = cantiere.operai.filter(id => id !== operaioId);
                await this.saveToDatabase('cantieri', cantiere);
            }
        }
        
        operaio.cantiere = null;
        await this.saveToDatabase('operai', operaio);
        
        this.renderApp();
        this.saveAllData();
        alert(`✅ ${operaio.nome} rimosso dal cantiere`);
    }
    
    addCantiere() {
        document.getElementById('form-cantiere').reset();
        document.getElementById('cantiere-id').value = '';
        document.getElementById('modal-cantiere-title').textContent = 'Aggiungi Cantiere';
        this.showModal('modal-cantiere');
    }
    
    async saveCantiere() {
        const form = document.getElementById('form-cantiere');
        const formData = new FormData(form);
        
        const cantiere = {
            id: parseInt(formData.get('cantiere-id')) || Date.now(),
            nome: formData.get('nome'),
            indirizzo: formData.get('indirizzo'),
            tipo: formData.get('tipo'),
            x: Math.random() * 400 + 50,
            y: Math.random() * 300 + 50,
            operai: [],
            calendarSelections: {},
            timeSlot: {start: "08:00", end: "17:00"},
            operaiTimeSlots: {}
        };
        
        if (!cantiere.nome || !cantiere.indirizzo) {
            alert('Nome e indirizzo sono obbligatori');
            return;
        }
        
        const existingIndex = this.cantieri.findIndex(c => c.id === cantiere.id);
        if (existingIndex >= 0) {
            // Mantieni i dati esistenti quando modifichi
            const existing = this.cantieri[existingIndex];
            cantiere.x = existing.x;
            cantiere.y = existing.y;
            cantiere.operai = existing.operai;
            cantiere.calendarSelections = existing.calendarSelections;
            cantiere.timeSlot = existing.timeSlot;
            cantiere.operaiTimeSlots = existing.operaiTimeSlots;
            this.cantieri[existingIndex] = cantiere;
        } else {
            this.cantieri.push(cantiere);
        }
        
        // Salva nel database
        await this.saveToDatabase('cantieri', cantiere);
        
        this.renderApp();
        this.saveAllData();
        this.closeModal('modal-cantiere');
        alert('✅ Cantiere salvato');
    }
    
    showCantiereDetails(cantiereId) {
        const cantiere = this.cantieri.find(c => c.id === cantiereId);
        if (!cantiere) return;
        
        this.currentCantiereId = cantiereId;
        
        const icon = cantiere.tipo === 'Civile' ? '🏢' : cantiere.tipo === 'Industriale' ? '🏭' : '🏠';
        
        document.getElementById('cantiere-details-title').innerHTML = `${icon} ${cantiere.nome}`;
        document.getElementById('cantiere-details-info').innerHTML = `
            <p><strong>Nome:</strong> ${icon} ${cantiere.nome}</p>
            <p><strong>Indirizzo:</strong> ${cantiere.indirizzo}</p>
            <p><strong>Tipo:</strong> ${cantiere.tipo}</p>
            <p><strong>Posizione:</strong> X: ${Math.round(cantiere.x)}, Y: ${Math.round(cantiere.y)}</p>
        `;
        
        const operaiAssegnati = cantiere.operai.map(id => this.operai.find(o => o.id === id)).filter(o => o);
        
        let operaiHtml = '';
        if (operaiAssegnati.length > 0) {
            operaiAssegnati.forEach(operaio => {
                const prepostoText = operaio.preposto ? ' ⭐ PREPOSTO' : '';
                operaiHtml += `
                    <div class="operaio-detail">
                        <strong>${operaio.avatar} ${operaio.nome}${prepostoText}</strong>
                        <small>${operaio.specializzazione} - Livello ${operaio.livello}</small>
                        <small>📧 ${operaio.email} | 📞 ${operaio.telefono}</small>
                        ${(this.currentUser.type === 'manager' || this.currentUser.type === 'master') ? `
                            <button onclick="app.unassignOperaio(${operaio.id}, ${cantiereId})" class="btn btn-danger btn-sm">Rimuovi</button>
                        ` : ''}
                    </div>
                `;
            });
        } else {
            operaiHtml = '<p><strong>Operai Assegnati:</strong> Nessun operaio assegnato</p>';
        }
        
        document.getElementById('cantiere-operai-list').innerHTML = operaiHtml;
        
        // Render calendario e time slots
        this.renderCalendar();
        
        document.getElementById('time-start').value = cantiere.timeSlot?.start || '08:00';
        document.getElementById('time-end').value = cantiere.timeSlot?.end || '17:00';
        
        // Aggiorna time slot in tempo reale
        document.getElementById('time-start').onchange = async (e) => {
            cantiere.timeSlot.start = e.target.value;
            await this.saveToDatabase('cantieri', cantiere);
            this.saveAllData();
        };
        
        document.getElementById('time-end').onchange = async (e) => {
            cantiere.timeSlot.end = e.target.value;
            await this.saveToDatabase('cantieri', cantiere);
            this.saveAllData();
        };
        
        this.showModal('modal-cantiere-details');
    }
    
    async unassignOperaio(operaioId, cantiereId) {
        const operaio = this.operai.find(o => o.id === operaioId);
        const cantiere = this.cantieri.find(c => c.id === cantiereId);
        
        if (!operaio || !cantiere) return;
        
        operaio.cantiere = null;
        cantiere.operai = cantiere.operai.filter(id => id !== operaioId);
        
        // Salva nel database
        await this.saveToDatabase('operai', operaio);
        await this.saveToDatabase('cantieri', cantiere);
        
        this.renderApp();
        this.saveAllData();
        
        if (this.currentCantiereId === cantiereId) {
            this.showCantiereDetails(cantiereId);
        }
        
        alert(`✅ ${operaio.nome} rimosso dal cantiere`);
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
    
    // ===== GESTIONE SETTINGS =====
    showSettings(tab = 'email') {
        // Popola i campi Supabase se esistono
        if (this.supabaseConfig.url) {
            document.getElementById('supabase-url').value = this.supabaseConfig.url;
        }
        if (this.supabaseConfig.key) {
            document.getElementById('supabase-key').value = this.supabaseConfig.key;
        }
        
        // Mostra stato connessione
        const statusEl = document.getElementById('supabase-status');
        if (statusEl) {
            statusEl.textContent = this.supabaseConfig.connected ? '✅ Connesso' : '❌ Non connesso';
            statusEl.className = this.supabaseConfig.connected ? 'status-connected' : 'status-disconnected';
        }
        
        this.switchSettingsTab(tab);
        this.showModal('modal-settings');
    }
    
    switchSettingsTab(tabName) {
        // Nascondi tutti i tab content
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.add('hidden');
        });
        
        // Rimuovi classe active da tutti i tab
        document.querySelectorAll('.tab').forEach(tab => {
            tab.classList.remove('active');
        });
        
        // Mostra il tab content selezionato
        const targetContent = document.getElementById(`tab-${tabName}`);
        if (targetContent) {
            targetContent.classList.remove('hidden');
        }
        
        // Aggiungi classe active al tab selezionato
        const targetTab = document.querySelector(`[data-tab="${tabName}"]`);
        if (targetTab) {
            targetTab.classList.add('active');
        }
    }
    
    // ===== GESTIONE EMAIL =====
    async sendParticipationEmails() {
        if (!this.currentCantiereId) return;
        
        const cantiere = this.cantieri.find(c => c.id === this.currentCantiereId);
        if (!cantiere) return;
        
        const selectedDates = Object.keys(cantiere.calendarSelections || {}).filter(date => cantiere.calendarSelections[date]);
        
        if (selectedDates.length === 0) {
            alert('Seleziona almeno un giorno nel calendario');
            return;
        }
        
        const operaiAssegnati = cantiere.operai.map(id => this.operai.find(o => o.id === id)).filter(o => o);
        
        if (operaiAssegnati.length === 0) {
            alert('Nessun operaio assegnato al cantiere');
            return;
        }
        
        // Simulazione invio email (qui integreresti con il tuo servizio email)
        alert(`📧 Email di partecipazione inviate a ${operaiAssegnati.length} operai per ${selectedDates.length} giorni selezionati`);
    }
    
    // ===== UTILITY =====
    loadData(key) {
        try {
            const data = localStorage.getItem(`sse-manager-${key}`);
            return data ? JSON.parse(data) : null;
        } catch (error) {
            console.error(`Errore caricamento ${key}:`, error);
            return null;
        }
    }
    
    saveData(key, data) {
        try {
            localStorage.setItem(`sse-manager-${key}`, JSON.stringify(data));
        } catch (error) {
            console.error(`Errore salvataggio ${key}:`, error);
        }
    }
    
    saveAllData() {
        this.saveData('operai', this.operai);
        this.saveData('cantieri', this.cantieri);
        this.saveData('users', this.users);
        this.saveData('turniLavoro', this.turniLavoro);
        this.saveData('supabaseConfig', this.supabaseConfig);
    }
    
    setupAutoSave() {
        if (this.autoSaveEnabled) {
            setInterval(() => {
                this.saveAllData();
            }, 30000); // Salva ogni 30 secondi
        }
    }
    
    // ===== PLACEHOLDER METHODS =====
    showUserManagement() {
        alert('Gestione utenti: Funzionalità in sviluppo');
    }
    
    showInfo() {
        this.showModal('modal-info');
    }
    
    exportOperaiCSV() {
        alert('Export CSV operai: Funzionalità in sviluppo');
    }
    
    importOperaiCSV() {
        alert('Import CSV operai: Funzionalità in sviluppo');
    }
    
    exportAllData() {
        const data = {
            operai: this.operai,
            cantieri: this.cantieri,
            users: this.users,
            turniLavoro: this.turniLavoro,
            version: '1.6.4',
            exportDate: new Date().toISOString()
        };
        
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `sse-manager-backup-${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
    }
    
    importData() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        input.onchange = (e) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    try {
                        const data = JSON.parse(e.target.result);
                        if (data.operai) this.operai = data.operai;
                        if (data.cantieri) this.cantieri = data.cantieri;
                        if (data.users) this.users = data.users;
                        if (data.turniLavoro) this.turniLavoro = data.turniLavoro;
                        
                        this.saveAllData();
                        this.renderApp();
                        alert('✅ Dati importati con successo');
                    } catch (error) {
                        alert('❌ Errore importazione file');
                    }
                };
                reader.readAsText(file);
            }
        };
        input.click();
    }
}

// Inizializza l'applicazione
const app = new SseManager();

// Rendi l'app globalmente accessibile per eventi onclick
window.app = app;