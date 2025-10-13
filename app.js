// app.js - Sse Manager Ver 1.6.4 - COMPLETO CON SINCRONIZZAZIONE BIDIREZIONALE
console.log('🏗️ Sse Manager - Caricamento Ver 1.6.4 COMPLETO...');

class SseManager {
    constructor() {
        // Configurazione Supabase
        this.supabase = null;
        this.supabaseConfigured = false;
        
        // Carica dati locali come fallback
        this.operai = this.loadData('operai') || [];
        this.cantieri = this.loadData('cantieri') || [];
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
        
        // Variabili per drag & drop migliorato
        this.dragOffsetX = 0;
        this.dragOffsetY = 0;

        // Nuove variabili per calendario avanzato
        this.selectedDate = null;
        this.calendarAssignments = {};

        // Flag per controllo sincronizzazione
        this.syncInProgress = false;

        this.init();
    }

    async init() {
        console.log('🚀 Inizializzazione Sse Manager Ver 1.6.4 COMPLETO');
        
        // Carica configurazione Supabase
        await this.loadSupabaseConfig();
        
        // Se Supabase è configurato, carica i dati dal database
        if (this.supabaseConfigured) {
            try {
                await this.syncFromDatabase();
                console.log('✅ Dati sincronizzati da Supabase');
            } catch (error) {
                console.error('❌ Errore nella sincronizzazione da Supabase:', error);
                // Fallback ai dati locali
                this.loadDefaultData();
            }
        } else {
            this.loadDefaultData();
        }
        
        this.setupEventListeners();
        this.updateStats();
        this.setupAutoSave();
    }

    loadDefaultData() {
        if (this.operai.length === 0) {
            this.operai = [
                {id: 1, nome: "Marco Rossi", email: "marco.rossi@standardse.it", telefono: "333-1234567", specializzazione: "Elettricista", livello: 5, cantiere: 1, avatar: "⚡", preposto: true},
                {id: 2, nome: "Giuseppe Bianchi", email: "giuseppe.bianchi@standardse.it", telefono: "335-2345678", specializzazione: "Meccanico", livello: 4, cantiere: 1, avatar: "🔧", preposto: false},
                {id: 3, nome: "Antonio Verde", email: "antonio.verde@standardse.it", telefono: "338-3456789", specializzazione: "Elettricista", livello: 3, cantiere: 2, avatar: "⚡", preposto: false},
                {id: 4, nome: "Francesco Neri", email: "francesco.neri@standardse.it", telefono: "339-4567890", specializzazione: "Meccanico", livello: 5, cantiere: 2, avatar: "🔧", preposto: true},
                {id: 5, nome: "Luigi Viola", email: "luigi.viola@standardse.it", telefono: "340-5678901", specializzazione: "Elettricista", livello: 2, cantiere: null, avatar: "⚡", preposto: false},
                {id: 6, nome: "Salvatore Blu", email: "salvatore.blu@standardse.it", telefono: "346-6789012", specializzazione: "Meccanico", livello: 3, cantiere: null, avatar: "🔧", preposto: false}
            ];
        }

        if (this.cantieri.length === 0) {
            this.cantieri = [
                {id: 1, nome: "Palazzo Roma Centro", indirizzo: "Via Roma 123, Roma", tipo: "Civile", x: 150, y: 200, operai: [1, 2], calendarSelections: {}, timeSlot: {start: "08:00", end: "17:00"}},
                {id: 2, nome: "Impianto Industriale Ostia", indirizzo: "Via del Mare 45, Ostia", tipo: "Industriale", x: 400, y: 300, operai: [4, 3], calendarSelections: {}, timeSlot: {start: "07:00", end: "16:00"}},
                {id: 3, nome: "Ristrutturazione Trastevere", indirizzo: "Viale Trastevere 78, Roma", tipo: "Residenziale", x: 300, y: 150, operai: [], calendarSelections: {}, timeSlot: {start: "08:30", end: "17:30"}}
            ];
        }
    }

    // ===== GESTIONE SUPABASE =====
    async loadSupabaseConfig() {
        const config = this.loadData('supabase_config');
        if (config && config.url && config.key) {
            try {
                // Carica dinamicamente Supabase
                const { createClient } = await import('https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm');
                this.supabase = createClient(config.url, config.key);
                this.supabaseConfigured = true;
                console.log('✅ Supabase configurato');
            } catch (error) {
                console.error('❌ Errore nel caricamento Supabase:', error);
                this.supabaseConfigured = false;
            }
        } else {
            console.log('ℹ️ Supabase non configurato');
            this.supabaseConfigured = false;
        }
    }

    // ===== SINCRONIZZAZIONE BIDIREZIONALE =====
    async syncFromDatabase() {
        if (!this.supabaseConfigured) return;

        console.log('🔄 Sincronizzazione FROM database...');
        
        try {
            // Carica operai dal database
            const { data: operaiData, error: operaiError } = await this.supabase
                .from('operai')
                .select('*')
                .order('id');
            
            if (operaiError) throw operaiError;

            // Carica cantieri dal database
            const { data: cantieriData, error: cantieriError } = await this.supabase
                .from('cantieri')
                .select('*')
                .order('id');
            
            if (cantieriError) throw cantieriError;

            // Carica assegnazioni
            const { data: assegnazioniData, error: assegnazioniError } = await this.supabase
                .from('assegnazione_operai')
                .select('*');
            
            if (assegnazioniError) throw assegnazioniError;

            // Sincronizzazione bidirezionale
            await this.mergeData(operaiData, cantieriData, assegnazioniData);
            
        } catch (error) {
            console.error('Errore nella sincronizzazione dal database:', error);
            throw error;
        }
    }

    async mergeData(dbOperai, dbCantieri, dbAssegnazioni) {
        console.log('🔄 Unione dati locali e database...');
        
        // Per operai: unisci dati database con modifiche locali non sincronizzate
        const operaiUnificati = await this.mergeOperai(dbOperai || []);
        const cantieriUnificati = await this.mergeCantieri(dbCantieri || []);
        
        // Aggiorna le strutture dati principali
        this.operai = operaiUnificati;
        this.cantieri = cantieriUnificati;
        
        // Ricostruisci le assegnazioni
        await this.rebuildAssegnazioni(dbAssegnazioni || []);
        
        console.log('✅ Unione dati completata:', {
            operai: this.operai.length,
            cantieri: this.cantieri.length
        });
    }

    async mergeOperai(dbOperai) {
        const operaiLocali = this.loadData('operai') || [];
        const operaiUnificati = [...dbOperai];
        
        // Trova il massimo ID nel database per evitare conflitti
        const maxDbId = dbOperai.length > 0 ? Math.max(...dbOperai.map(o => o.id)) : 0;
        
        // Aggiungi operai locali che non sono nel database (nuovi operai creati localmente)
        operaiLocali.forEach(operaioLocale => {
            const existsInDb = dbOperai.some(dbOp => dbOp.id === operaioLocale.id);
            if (!existsInDb) {
                // Assegna un nuovo ID che non confligga con il database
                const newId = maxDbId + operaioLocale.id;
                operaiUnificati.push({
                    ...operaioLocale,
                    id: newId,
                    needsSync: true // Flag per indicare che deve essere salvato nel DB
                });
            }
        });
        
        return operaiUnificati;
    }

    async mergeCantieri(dbCantieri) {
        const cantieriLocali = this.loadData('cantieri') || [];
        const cantieriUnificati = [...dbCantieri];
        
        // Trova il massimo ID nel database
        const maxDbId = dbCantieri.length > 0 ? Math.max(...dbCantieri.map(c => c.id)) : 0;
        
        // Aggiungi cantieri locali che non sono nel database
        cantieriLocali.forEach(cantiereLocale => {
            const existsInDb = dbCantieri.some(dbCat => dbCat.id === cantiereLocale.id);
            if (!existsInDb) {
                const newId = maxDbId + cantiereLocale.id;
                cantieriUnificati.push({
                    ...cantiereLocale,
                    id: newId,
                    needsSync: true
                });
            }
        });
        
        return cantieriUnificati;
    }

    async rebuildAssegnazioni(dbAssegnazioni) {
        // Reset di tutte le assegnazioni
        this.operai.forEach(operaio => {
            operaio.cantiere = null;
            operaio.cantiere_id = null;
        });
        
        this.cantieri.forEach(cantiere => {
            cantiere.operai = [];
        });
        
        // Ricostruisci dalle assegnazioni del database
        dbAssegnazioni.forEach(assegnazione => {
            const operaio = this.operai.find(o => o.id === assegnazione.operaio_id);
            const cantiere = this.cantieri.find(c => c.id === assegnazione.cantiere_id);
            
            if (operaio && cantiere) {
                operaio.cantiere = cantiere.id;
                operaio.cantiere_id = cantiere.id;
                if (!cantiere.operai.includes(operaio.id)) {
                    cantiere.operai.push(operaio.id);
                }
            }
        });
    }

    // ===== SALVATAGGIO AUTOMATICO SU DATABASE =====
    async autoSaveToDatabase() {
        if (!this.supabaseConfigured || this.syncInProgress) return;
        
        try {
            console.log('💾 Salvataggio automatico su database...');
            await this.syncToDatabase();
        } catch (error) {
            console.error('❌ Errore nel salvataggio automatico:', error);
        }
    }

    async syncToDatabase() {
        if (!this.supabaseConfigured) return;
        
        this.syncInProgress = true;
        console.log('🔄 Sincronizzazione TO database...');
        
        try {
            // Salva operai
            for (const operaio of this.operai) {
                await this.saveOperaioToSupabase(operaio);
            }
            
            // Salva cantieri
            for (const cantiere of this.cantieri) {
                await this.saveCantiereToSupabase(cantiere);
            }
            
            // Salva assegnazioni
            await this.saveAllAssegnazioni();
            
            console.log('✅ Sincronizzazione su database completata');
            
        } catch (error) {
            console.error('❌ Errore nella sincronizzazione su database:', error);
            throw error;
        } finally {
            this.syncInProgress = false;
        }
    }

    async saveAllAssegnazioni() {
        if (!this.supabaseConfigured) return;
        
        try {
            // Prima cancella tutte le assegnazioni esistenti
            const { error: deleteError } = await this.supabase
                .from('assegnazione_operai')
                .delete()
                .neq('id', 0); // Cancella tutto
            
            if (deleteError) throw deleteError;
            
            // Poi ricrea tutte le assegnazioni attuali
            const assegnazioni = [];
            
            this.cantieri.forEach(cantiere => {
                cantiere.operai.forEach(operaioId => {
                    assegnazioni.push({
                        operaio_id: operaioId,
                        cantiere_id: cantiere.id,
                        created_at: new Date().toISOString()
                    });
                });
            });
            
            if (assegnazioni.length > 0) {
                const { error: insertError } = await this.supabase
                    .from('assegnazione_operai')
                    .insert(assegnazioni);
                
                if (insertError) throw insertError;
            }
            
        } catch (error) {
            console.error('Errore nel salvataggio assegnazioni:', error);
            throw error;
        }
    }

    async saveOperaioToSupabase(operaio) {
        if (!this.supabaseConfigured) return;

        try {
            const operaioData = {
                nome: operaio.nome,
                email: operaio.email,
                telefono: operaio.telefono,
                specializzazione: operaio.specializzazione,
                livello: operaio.livello,
                cantiere_id: operaio.cantiere,
                avatar: operaio.avatar,
                preposto: operaio.preposto,
                updated_at: new Date().toISOString()
            };

            if (operaio.id) {
                // Update
                const { error } = await this.supabase
                    .from('operai')
                    .update(operaioData)
                    .eq('id', operaio.id);
                
                if (error) throw error;
            } else {
                // Insert
                operaioData.created_at = new Date().toISOString();
                const { data, error } = await this.supabase
                    .from('operai')
                    .insert([operaioData])
                    .select();
                
                if (error) throw error;
                if (data && data[0]) {
                    operaio.id = data[0].id;
                }
            }
        } catch (error) {
            console.error('Errore nel salvataggio operaio su Supabase:', error);
            throw error;
        }
    }

    async saveCantiereToSupabase(cantiere) {
        if (!this.supabaseConfigured) return;

        try {
            const cantiereData = {
                nome: cantiere.nome,
                indirizzo: cantiere.indirizzo,
                tipo: cantiere.tipo,
                coordinate_x: cantiere.x,
                coordinate_y: cantiere.y,
                time_slot_start: cantiere.timeSlot?.start || "08:00",
                time_slot_end: cantiere.timeSlot?.end || "17:00",
                updated_at: new Date().toISOString()
            };

            if (cantiere.id) {
                // Update
                const { error } = await this.supabase
                    .from('cantieri')
                    .update(cantiereData)
                    .eq('id', cantiere.id);
                
                if (error) throw error;
            } else {
                // Insert
                cantiereData.created_at = new Date().toISOString();
                const { data, error } = await this.supabase
                    .from('cantieri')
                    .insert([cantiereData])
                    .select();
                
                if (error) throw error;
                if (data && data[0]) {
                    cantiere.id = data[0].id;
                }
            }
        } catch (error) {
            console.error('Errore nel salvataggio cantiere su Supabase:', error);
            throw error;
        }
    }

    async saveAssegnazioneToSupabase(operaioId, cantiereId) {
        if (!this.supabaseConfigured) return;

        try {
            // Rimuovi assegnazioni precedenti per questo operaio
            const { error: deleteError } = await this.supabase
                .from('assegnazione_operai')
                .delete()
                .eq('operaio_id', operaioId);
            
            if (deleteError) throw deleteError;

            // Se cantiereId non è null, crea nuova assegnazione
            if (cantiereId) {
                const { error: insertError } = await this.supabase
                    .from('assegnazione_operai')
                    .insert([{
                        operaio_id: operaioId,
                        cantiere_id: cantiereId,
                        created_at: new Date().toISOString()
                    }]);
                
                if (insertError) throw insertError;
            }
        } catch (error) {
            console.error('Errore nel salvataggio assegnazione su Supabase:', error);
            throw error;
        }
    }

    async deleteOperaioFromSupabase(operaioId) {
        if (!this.supabaseConfigured) return;

        try {
            const { error } = await this.supabase
                .from('operai')
                .delete()
                .eq('id', operaioId);
            
            if (error) throw error;
        } catch (error) {
            console.error('Errore nell\'eliminazione operaio da Supabase:', error);
            throw error;
        }
    }

    async deleteCantiereFromSupabase(cantiereId) {
        if (!this.supabaseConfigured) return;

        try {
            const { error } = await this.supabase
                .from('cantieri')
                .delete()
                .eq('id', cantiereId);
            
            if (error) throw error;
        } catch (error) {
            console.error('Errore nell\'eliminazione cantiere da Supabase:', error);
            throw error;
        }
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
            case 'open-database-settings':
                this.showSettings('database');
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
            case 'sync-database':
                this.syncWithDatabase();
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
            document.body.classList.add('current-user-master');
        } else if (this.currentUser.type === 'manager') {
            modeText.textContent = 'Modalità: Manager';
            userInfo.innerHTML = `<span class="user-badge manager">👔 ${this.currentUser.username}</span>`;
            masterElements.forEach(el => el.style.display = 'none');
            document.body.classList.remove('current-user-master');
        } else {
            const operaio = this.operai.find(o => o.id === this.currentUser.operaioId);
            modeText.textContent = 'Modalità: Operaio';
            userInfo.innerHTML = `<span class="user-badge operaio">👷 ${operaio ? operaio.nome : this.currentUser.username}</span>`;
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
            controls.innerHTML = '<button class="btn btn-primary" onclick="app.addOperaio()">➕ Aggiungi Operaio</button>';
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

    async saveOperaio() {
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

        let operaio;
        let isNew = false;

        if (id) {
            operaio = this.operai.find(o => o.id == id);
            if (operaio) {
                Object.assign(operaio, {
                    nome, email, telefono, specializzazione, livello, preposto,
                    avatar: avatarMap[specializzazione] || '👷',
                    updated_at: new Date().toISOString()
                });
            }
        } else {
            const newId = Math.max(0, ...this.operai.map(o => o.id)) + 1;
            operaio = {
                id: newId, nome, email, telefono, specializzazione, livello, 
                cantiere: null, avatar: avatarMap[specializzazione] || '👷', preposto,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
                needsSync: true // Flag per sincronizzazione
            };
            this.operai.push(operaio);
            isNew = true;
        }
        
        // Salva SEMPRE su Supabase se configurato
        if (this.supabaseConfigured) {
            try {
                await this.saveOperaioToSupabase(operaio);
                // Rimuovi il flag dopo il salvataggio
                if (operaio.needsSync) {
                    delete operaio.needsSync;
                }
                console.log(`✅ Operaio ${isNew ? 'creato' : 'aggiornato'} sul database`);
            } catch (error) {
                console.error('Errore nel salvataggio su Supabase:', error);
                alert('⚠️ Operaio salvato localmente, ma errore nel salvataggio sul database');
            }
        }
        
        this.closeModal('modal-operaio');
        this.renderApp();
        this.saveAllData();
        alert('✅ Operaio salvato con successo' + (this.supabaseConfigured ? ' e sincronizzato con il database' : ''));
    }

    async removeOperaio(operaioId) {
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
            
            // Elimina SEMPRE da Supabase se configurato
            if (this.supabaseConfigured) {
                try {
                    await this.deleteOperaioFromSupabase(operaioId);
                    console.log('✅ Operaio eliminato dal database');
                } catch (error) {
                    console.error('Errore nell\'eliminazione da Supabase:', error);
                    alert('⚠️ Operaio eliminato localmente, ma errore nell\'eliminazione dal database');
                }
            }
            
            this.renderApp();
            this.saveAllData();
            alert('✅ Operaio eliminato' + (this.supabaseConfigured ? ' dal database' : ''));
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
            element.draggable = (this.currentUser.type === 'manager' || this.currentUser.type === 'master') && this.isDragDropActive;
            
            // Setup drag per cantiere
            if ((this.currentUser.type === 'manager' || this.currentUser.type === 'master') && this.isDragDropActive) {
                element.addEventListener('dragstart', (e) => {
                    this.draggedCantiere = cantiere;
                    e.dataTransfer.setData('text/plain', 'cantiere-' + cantiere.id);
                    element.classList.add('dragging');
                    
                    // Imposta l'offset per un drag più preciso
                    const rect = element.getBoundingClientRect();
                    this.dragOffsetX = e.clientX - rect.left;
                    this.dragOffsetY = e.clientY - rect.top;
                });
                
                element.addEventListener('drag', (e) => {
                    if (this.draggedCantiere && e.clientX !== 0 && e.clientY !== 0) {
                        // Aggiorna posizione durante il drag (opzionale, per feedback visivo)
                        const containerRect = container.getBoundingClientRect();
                        const newX = e.clientX - containerRect.left - this.dragOffsetX;
                        const newY = e.clientY - containerRect.top - this.dragOffsetY;
                        
                        // Limita ai confini del container
                        element.style.left = Math.max(0, Math.min(containerRect.width - 160, newX)) + 'px';
                        element.style.top = Math.max(0, Math.min(containerRect.height - 120, newY)) + 'px';
                    }
                });
                
                element.addEventListener('dragend', (e) => {
                    element.classList.remove('dragging');
                    
                    if (this.draggedCantiere) {
                        const containerRect = container.getBoundingClientRect();
                        const elementRect = element.getBoundingClientRect();
                        
                        // Calcola la posizione finale relativa al container
                        const finalX = elementRect.left - containerRect.left;
                        const finalY = elementRect.top - containerRect.top;
                        
                        // Aggiorna la posizione nel modello dati
                        this.draggedCantiere.x = finalX;
                        this.draggedCantiere.y = finalY;
                        
                        this.saveAllData();
                        // Salva anche su database
                        if (this.supabaseConfigured) {
                            this.saveCantiereToSupabase(this.draggedCantiere);
                        }
                    }
                    
                    this.draggedCantiere = null;
                    this.dragOffsetX = 0;
                    this.dragOffsetY = 0;
                });
            }

            // Setup drop per operai
            element.addEventListener('dragover', (e) => {
                e.preventDefault();
                if (this.draggedOperaio && this.isDragDropActive) {
                    element.classList.add('drag-over');
                    e.dataTransfer.dropEffect = 'move';
                }
            });
            
            element.addEventListener('dragleave', (e) => {
                element.classList.remove('drag-over');
            });
            
            element.addEventListener('drop', (e) => {
                e.preventDefault();
                e.stopPropagation();
                element.classList.remove('drag-over');
                
                if (this.draggedOperaio && this.isDragDropActive) {
                    this.assignOperaioToCantiere(this.draggedOperaio, cantiere.id);
                    this.showDragSuccess(cantiere);
                    this.draggedOperaio = null;
                }
            });

            // Click per dettagli
            element.addEventListener('click', (e) => {
                if (!this.draggedOperaio && !e.target.closest('.cantiere-controls') && !this.draggedCantiere) {
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

        // Aggiungi event listener per il drop sul container (per rimuovere operai dai cantieri)
        container.addEventListener('dragover', (e) => {
            e.preventDefault();
            if (this.draggedOperaio && this.isDragDropActive) {
                e.dataTransfer.dropEffect = 'move';
                container.classList.add('drag-over');
            }
        });

        container.addEventListener('dragleave', (e) => {
            container.classList.remove('drag-over');
        });

        container.addEventListener('drop', (e) => {
            e.preventDefault();
            container.classList.remove('drag-over');
            
            const cantiereElement = e.target.closest('.cantiere');
            if (!cantiereElement && this.draggedOperaio && this.isDragDropActive) {
                this.unassignOperaioFromAnyCantiere(this.draggedOperaio);
                this.draggedOperaio = null;
            }
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

    unassignOperaioFromAnyCantiere(operaioId) {
        const operaio = this.operai.find(o => o.id === operaioId);
        if (!operaio || !operaio.cantiere) return;
        
        const cantiere = this.cantieri.find(c => c.id === operaio.cantiere);
        if (cantiere) {
            cantiere.operai = cantiere.operai.filter(id => id !== operaioId);
        }
        
        operaio.cantiere = null;
        this.renderApp();
        this.saveAllData();
        
        // Salva su database
        if (this.supabaseConfigured) {
            this.saveAssegnazioneToSupabase(operaioId, null);
        }
        
        // Mostra feedback
        const successMsg = document.createElement('div');
        successMsg.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: #e74c3c;
            color: white;
            padding: 12px 20px;
            border-radius: 8px;
            font-size: 14px;
            font-weight: bold;
            z-index: 1000;
            animation: fadeInOut 2s ease-in-out;
        `;
        successMsg.textContent = '✅ Operaio rimosso dal cantiere';
        document.body.appendChild(successMsg);
        
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

    async saveCantiere() {
        const id = document.getElementById('cantiere-id').value;
        const nome = document.getElementById('cantiere-nome').value.trim();
        const indirizzo = document.getElementById('cantiere-indirizzo').value.trim();
        const tipo = document.getElementById('cantiere-tipo').value;
        
        if (!nome || !indirizzo || !tipo) {
            alert('Tutti i campi sono obbligatori');
            return;
        }
        
        let cantiere;
        let isNew = false;

        if (id) {
            cantiere = this.cantieri.find(c => c.id == id);
            if (cantiere) {
                cantiere.nome = nome;
                cantiere.indirizzo = indirizzo;
                cantiere.tipo = tipo;
                cantiere.updated_at = new Date().toISOString();
            }
        } else {
            const newId = Math.max(0, ...this.cantieri.map(c => c.id)) + 1;
            cantiere = {
                id: newId, nome, indirizzo, tipo,
                x: Math.random() * 400 + 100, y: Math.random() * 300 + 100,
                operai: [], calendarSelections: {}, timeSlot: {start: "08:00", end: "17:00"},
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
                needsSync: true
            };
            this.cantieri.push(cantiere);
            isNew = true;
        }
        
        // Salva SEMPRE su Supabase se configurato
        if (this.supabaseConfigured) {
            try {
                await this.saveCantiereToSupabase(cantiere);
                if (cantiere.needsSync) {
                    delete cantiere.needsSync;
                }
                console.log(`✅ Cantiere ${isNew ? 'creato' : 'aggiornato'} sul database`);
            } catch (error) {
                console.error('Errore nel salvataggio su Supabase:', error);
                alert('⚠️ Cantiere salvato localmente, ma errore nel salvataggio sul database');
            }
        }
        
        this.closeModal('modal-cantiere');
        this.renderCantieri();
        this.saveAllData();
        alert('✅ Cantiere salvato con successo' + (this.supabaseConfigured ? ' e sincronizzato con il database' : ''));
    }

    async removeCantiere(cantiereId) {
        const cantiere = this.cantieri.find(c => c.id === cantiereId);
        if (!cantiere) return;
        
        if (confirm(`Sei sicuro di voler eliminare il cantiere "${cantiere.nome}"?`)) {
            cantiere.operai.forEach(operaioId => {
                const operaio = this.operai.find(o => o.id === operaioId);
                if (operaio) {
                    operaio.cantiere = null;
                    operaio.cantiere_id = null;
                }
            });
            
            const index = this.cantieri.findIndex(c => c.id === cantiereId);
            if (index !== -1) this.cantieri.splice(index, 1);
            
            // Elimina SEMPRE da Supabase se configurato
            if (this.supabaseConfigured) {
                try {
                    await this.deleteCantiereFromSupabase(cantiereId);
                    console.log('✅ Cantiere eliminato dal database');
                } catch (error) {
                    console.error('Errore nell\'eliminazione da Supabase:', error);
                    alert('⚠️ Cantiere eliminato localmente, ma errore nell\'eliminazione dal database');
                }
            }
            
            this.renderApp();
            this.saveAllData();
            alert('✅ Cantiere eliminato' + (this.supabaseConfigured ? ' dal database' : ''));
        }
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
            }
        }
        
        // Assegna al nuovo cantiere
        operaio.cantiere = cantiereId;
        operaio.cantiere_id = cantiereId;
        if (!cantiere.operai.includes(operaioId)) {
            cantiere.operai.push(operaioId);
        }
        
        // Salva SEMPRE l'assegnazione su Supabase
        if (this.supabaseConfigured) {
            try {
                await this.saveAssegnazioneToSupabase(operaioId, cantiereId);
                console.log('✅ Assegnazione salvata sul database');
            } catch (error) {
                console.error('Errore nel salvataggio assegnazione su Supabase:', error);
            }
        }
        
        this.renderApp();
        this.saveAllData();
    }

    toggleDragDrop() {
        this.isDragDropActive = !this.isDragDropActive;
        
        // Aggiorna lo stato draggable di tutti gli elementi
        document.querySelectorAll('.cantiere').forEach(cantiere => {
            cantiere.draggable = (this.currentUser.type === 'manager' || this.currentUser.type === 'master') && this.isDragDropActive;
        });
        
        document.querySelectorAll('.operaio-card').forEach(card => {
            card.draggable = (this.currentUser.type === 'manager' || this.currentUser.type === 'master') && this.isDragDropActive;
        });
        
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
            if (this.supabaseConfigured) {
                this.saveCantiereToSupabase(cantiere);
            }
        };
        
        document.getElementById('time-end').onchange = (e) => {
            cantiere.timeSlot.end = e.target.value;
            this.saveAllData();
            if (this.supabaseConfigured) {
                this.saveCantiereToSupabase(cantiere);
            }
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
        
        // Salva su database
        if (this.supabaseConfigured) {
            this.saveAssegnazioneToSupabase(operaioId, null);
        }
        
        if (this.currentCantiereId === cantiereId) {
            this.showCantiereDetails(cantiereId);
        }
        
        alert(`✅ ${operaio.nome} rimosso dal cantiere`);
    }

    // ===== CALENDARIO AVANZATO =====
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
            const hasTimeSlots = this.hasTimeSlotsForDate(current, cantiere.id);
            
            let dayClass = 'calendar-day';
            if (!isCurrentMonth) dayClass += ' other-month';
            if (isSelected) dayClass += ' selected';
            if (hasTimeSlots) dayClass += ' has-slots';
            
            calendarHtml += `
                <div class="${dayClass}" data-date="${current.toISOString()}">
                    ${dayNum}
                    ${hasTimeSlots ? '<div class="time-slots-indicator">⏰</div>' : ''}
                </div>
            `;
            current.setDate(current.getDate() + 1);
        }
        
        document.getElementById('calendar-grid').innerHTML = calendarHtml;
        
        document.querySelectorAll('.calendar-day').forEach(day => {
            day.addEventListener('click', () => {
                this.selectCalendarDay(day.dataset.date);
            });
        });
    }

    hasTimeSlotsForDate(date, cantiereId) {
        const dateStr = new Date(date).toISOString().split('T')[0];
        const cantiere = this.cantieri.find(c => c.id === cantiereId);
        
        if (!cantiere || !cantiere.calendarSelections || !cantiere.calendarSelections[dateStr]) {
            return false;
        }
        
        const dayData = cantiere.calendarSelections[dateStr];
        return dayData.timeSlots && Object.keys(dayData.timeSlots).length > 0;
    }

    selectCalendarDay(dateStr) {
        this.selectedDate = new Date(dateStr);
        this.showTimeSlotManager();
    }

    showTimeSlotManager() {
        if (!this.selectedDate || !this.currentCantiereId) return;
        
        const cantiere = this.cantieri.find(c => c.id === this.currentCantiereId);
        const operaiAssegnati = cantiere.operai.map(id => this.operai.find(o => o.id === id)).filter(o => o);
        const dateStr = this.selectedDate.toISOString().split('T')[0];
        
        let timeSlotsHtml = '';
        
        operaiAssegnati.forEach(operaio => {
            const dayData = cantiere.calendarSelections[dateStr] || {};
            const timeSlot = dayData.timeSlots ? dayData.timeSlots[operaio.id] : null;
            
            timeSlotsHtml += `
                <div class="operaio-time-slot">
                    <div class="operaio-info">
                        <strong>${operaio.avatar} ${operaio.nome}</strong>
                        <small>${operaio.specializzazione} - Livello ${operaio.livello}</small>
                    </div>
                    <div class="time-inputs">
                        <input type="time" 
                               value="${timeSlot ? timeSlot.start : '08:00'}" 
                               class="time-start" 
                               data-operaio-id="${operaio.id}">
                        <span>alle</span>
                        <input type="time" 
                               value="${timeSlot ? timeSlot.end : '17:00'}" 
                               class="time-end" 
                               data-operaio-id="${operaio.id}">
                    </div>
                </div>
            `;
        });
        
        const modalHtml = `
            <div class="modal" id="modal-time-slots">
                <div class="modal-content">
                    <h3>⏰ Gestione Orari - ${this.selectedDate.toLocaleDateString('it-IT')}</h3>
                    
                    <div class="time-slots-container">
                        ${timeSlotsHtml}
                    </div>
                    
                    <div class="time-slots-actions">
                        <button class="btn btn-secondary" onclick="app.applySameTimeToAll()">
                            ⚡ Stesso Orario per Tutti
                        </button>
                        <button class="btn btn-primary" onclick="app.saveTimeSlots()">
                            💾 Salva Orari
                        </button>
                        <button class="btn btn-secondary" onclick="app.closeTimeSlots()">
                            ❌ Annulla
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        // Rimuovi modal esistente se presente
        const existingModal = document.getElementById('modal-time-slots');
        if (existingModal) {
            existingModal.remove();
        }
        
        document.body.insertAdjacentHTML('beforeend', modalHtml);
    }

    applySameTimeToAll() {
        const firstStart = document.querySelector('.time-start').value;
        const firstEnd = document.querySelector('.time-end').value;
        
        document.querySelectorAll('.time-start').forEach(input => {
            input.value = firstStart;
        });
        
        document.querySelectorAll('.time-end').forEach(input => {
            input.value = firstEnd;
        });
        
        alert('⚡ Orario applicato a tutti i dipendenti');
    }

    saveTimeSlots() {
        if (!this.selectedDate || !this.currentCantiereId) return;
        
        const cantiere = this.cantieri.find(c => c.id === this.currentCantiereId);
        const dateStr = this.selectedDate.toISOString().split('T')[0];
        
        // Inizializza la struttura dati per il giorno
        if (!cantiere.calendarSelections[dateStr]) {
            cantiere.calendarSelections[dateStr] = {
                selected: true,
                timeSlots: {}
            };
        }
        
        // Salva gli orari per ogni operaio
        document.querySelectorAll('.operaio-time-slot').forEach(slot => {
            const operaioId = parseInt(slot.querySelector('.time-start').dataset.operaioId);
            const startTime = slot.querySelector('.time-start').value;
            const endTime = slot.querySelector('.time-end').value;
            
            cantiere.calendarSelections[dateStr].timeSlots[operaioId] = {
                start: startTime,
                end: endTime
            };
        });
        
        this.saveAllData();
        this.closeTimeSlots();
        this.renderCalendar();
        
        alert('✅ Orari salvati con successo');
    }

    closeTimeSlots() {
        const modal = document.getElementById('modal-time-slots');
        if (modal) {
            modal.remove();
        }
        this.selectedDate = null;
    }

    isCalendarDaySelected(date) {
        if (!this.currentCantiereId) return false;
        const cantiere = this.cantieri.find(c => c.id === this.currentCantiereId);
        if (!cantiere || !cantiere.calendarSelections) return false;
        const dateStr = new Date(date).toISOString().split('T')[0];
        return cantiere.calendarSelections[dateStr] && cantiere.calendarSelections[dateStr].selected;
    }

    toggleCalendarDay(dateStr) {
        if (!this.currentCantiereId) return;
        const cantiere = this.cantieri.find(c => c.id === this.currentCantiereId);
        if (!cantiere) return;
        
        if (!cantiere.calendarSelections) cantiere.calendarSelections = {};
        const dateKey = new Date(dateStr).toISOString().split('T')[0];
        
        if (cantiere.calendarSelections[dateKey]) {
            cantiere.calendarSelections[dateKey].selected = !cantiere.calendarSelections[dateKey].selected;
        } else {
            cantiere.calendarSelections[dateKey] = {
                selected: true,
                timeSlots: {}
            };
        }
        
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

    // ===== INVIO EMAIL MIGLIORATO =====
    async sendParticipationEmails() {
        if (!this.currentCantiereId) return;
        const cantiere = this.cantieri.find(c => c.id === this.currentCantiereId);
        if (!cantiere) return;
        
        const operaiAssegnati = cantiere.operai.map(id => this.operai.find(o => o.id === id)).filter(o => o);
        if (operaiAssegnati.length === 0) {
            alert('⚠️ Nessun operaio assegnato a questo cantiere');
            return;
        }
        
        const selectedDates = Object.keys(cantiere.calendarSelections || {})
            .filter(date => cantiere.calendarSelections[date] && cantiere.calendarSelections[date].selected);
        
        if (selectedDates.length === 0) {
            alert('⚠️ Nessun giorno selezionato nel calendario');
            return;
        }
        
        const button = document.getElementById('btn-send-emails');
        const originalText = button.textContent;
        button.textContent = '📤 Invio in corso...';
        button.disabled = true;
        
        try {
            // Prepara i dati per l'invio email
            const emailData = {
                cantiere: cantiere.nome,
                indirizzo: cantiere.indirizzo,
                dates: selectedDates.map(date => {
                    const dateObj = new Date(date);
                    const dayData = cantiere.calendarSelections[date];
                    return {
                        date: dateObj.toLocaleDateString('it-IT'),
                        timeSlots: dayData.timeSlots || {}
                    };
                })
            };
            
            // Invia email a ogni operaio
            for (const operaio of operaiAssegnati) {
                await this.sendEmailToOperaio(operaio, emailData);
            }
            
            alert(`✅ Email inviate con successo a ${operaiAssegnati.length} operai`);
            
        } catch (error) {
            console.error('Errore nell\'invio email:', error);
            alert('❌ Errore nell\'invio delle email');
        } finally {
            button.textContent = originalText;
            button.disabled = false;
        }
    }

    async sendEmailToOperaio(operaio, emailData) {
        // Simulazione invio email - da implementare con servizio email reale
        console.log(`📧 Email inviata a ${operaio.email}:`, {
            cantiere: emailData.cantiere,
            indirizzo: emailData.indirizzo,
            date: emailData.dates.map(d => {
                const timeSlot = d.timeSlots[operaio.id];
                return `${d.date}: ${timeSlot ? `${timeSlot.start} - ${timeSlot.end}` : 'Orario non definito'}`;
            }).join(', ')
        });
        
        // Simula ritardo di rete
        await new Promise(resolve => setTimeout(resolve, 1000));
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

    importOperaiCSV() {
        alert('📥 Funzionalità di importazione CSV in sviluppo');
    }

    // ===== IMPOSTAZIONI =====
    showSettings(activeTab = 'general') {
        // Crea modal settings dinamico
        const modalHtml = `
            <div id="modal-settings" class="modal">
                <div class="modal-content modal-large">
                    <h3>⚙️ Impostazioni Sistema</h3>
                    
                    <div class="tabs-container">
                        <div class="tab ${activeTab === 'general' ? 'active' : ''}" data-tab="general">🌐 Generali</div>
                        <div class="tab ${activeTab === 'email' ? 'active' : ''}" data-tab="email">📧 Email</div>
                        <div class="tab ${activeTab === 'database' ? 'active' : ''}" data-tab="database">🗄️ Database</div>
                    </div>

                    <!-- TAB GENERALE -->
                    <div id="settings-general" class="tab-content ${activeTab === 'general' ? '' : 'hidden'}">
                        <h4>🌐 Impostazioni Generali</h4>
                        
                        <div class="form-group">
                            <label>Nome Azienda</label>
                            <input type="text" id="company-name" class="form-control" value="Standard System Engineering Srl">
                        </div>
                        
                        <div class="form-group">
                            <label>Drag & Drop</label>
                            <select id="drag-drop-enabled" class="form-control">
                                <option value="true" ${this.isDragDropActive ? 'selected' : ''}>Attivato</option>
                                <option value="false" ${!this.isDragDropActive ? 'selected' : ''}>Disattivato</option>
                            </select>
                        </div>
                        
                        <div class="general-actions">
                            <button id="save-general" class="btn btn-primary">💾 Salva</button>
                            <button id="close-settings" class="btn btn-secondary">✅ Chiudi</button>
                        </div>
                    </div>

                    <!-- TAB EMAIL -->
                    <div id="settings-email" class="tab-content ${activeTab === 'email' ? '' : 'hidden'}">
                        <h4>📧 Configurazione Email SMTP</h4>
                        
                        <div class="form-group">
                            <label>Server SMTP</label>
                            <input type="text" id="smtp-server" class="form-control" placeholder="smtp.gmail.com">
                        </div>
                        
                        <div class="form-group">
                            <label>Porta SMTP</label>
                            <input type="number" id="smtp-port" class="form-control" placeholder="587" value="587">
                        </div>
                        
                        <div class="form-group">
                            <label>Email Mittente</label>
                            <input type="email" id="sender-email" class="form-control" placeholder="cantieri@azienda.com">
                        </div>
                        
                        <div class="email-actions">
                            <button id="save-email" class="btn btn-primary">💾 Salva</button>
                            <button id="close-settings2" class="btn btn-secondary">✅ Chiudi</button>
                        </div>
                    </div>

                    <!-- TAB DATABASE -->
                    <div id="settings-database" class="tab-content ${activeTab === 'database' ? '' : 'hidden'}">
                        <h4>🗄️ Configurazione Database Supabase</h4>
                        
                        <div class="form-group">
                            <label>Supabase URL</label>
                            <input type="text" id="supabase-url" class="form-control" placeholder="https://tuoprogetto.supabase.co">
                        </div>
                        
                        <div class="form-group">
                            <label>Supabase API Key</label>
                            <input type="password" id="supabase-key" class="form-control" placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...">
                        </div>
                        
                        <div class="database-status">
                            <strong>Stato Connessione:</strong> 
                            <span class="status-indicator ${this.supabaseConfigured ? 'connected' : 'disconnected'}">
                                ${this.supabaseConfigured ? '✅ Connesso' : '❌ Disconnesso'}
                            </span>
                        </div>
                        
                        <div class="database-actions">
                            <button id="save-database" class="btn btn-primary">💾 Salva Configurazione</button>
                            <button id="test-database" class="btn btn-secondary">🔧 Test Connessione</button>
                            <button id="sync-database" class="btn btn-secondary" ${this.supabaseConfigured ? '' : 'disabled'}>🔄 Sincronizza Ora</button>
                            <button id="close-settings3" class="btn btn-secondary">✅ Chiudi</button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Rimuovi modal esistente se presente
        const existingModal = document.getElementById('modal-settings');
        if (existingModal) {
            existingModal.remove();
        }

        document.body.insertAdjacentHTML('beforeend', modalHtml);

        // Carica i valori salvati
        this.loadSettingsValues();

        // Setup event listeners
        this.setupSettingsEvents();
    }

    loadSettingsValues() {
        const config = this.loadData('supabase_config') || {};
        document.getElementById('supabase-url').value = config.url || '';
        document.getElementById('supabase-key').value = config.key || '';
    }

    setupSettingsEvents() {
        // Tabs
        document.querySelectorAll('.tab').forEach(tab => {
            tab.addEventListener('click', (e) => {
                const tabName = e.target.dataset.tab;
                this.showSettings(tabName);
            });
        });

        // Salvataggio configurazione database
        document.getElementById('save-database')?.addEventListener('click', () => this.saveDatabaseSettings());
        document.getElementById('test-database')?.addEventListener('click', () => this.testDatabaseConnection());
        document.getElementById('sync-database')?.addEventListener('click', () => this.syncWithDatabase());

        // Altri salvataggi
        document.getElementById('save-general')?.addEventListener('click', () => this.saveGeneralSettings());
        document.getElementById('save-email')?.addEventListener('click', () => this.saveEmailSettings());

        // Chiusura modal
        document.getElementById('close-settings')?.addEventListener('click', () => this.closeModal('modal-settings'));
        document.getElementById('close-settings2')?.addEventListener('click', () => this.closeModal('modal-settings'));
        document.getElementById('close-settings3')?.addEventListener('click', () => this.closeModal('modal-settings'));
    }

    async saveDatabaseSettings() {
        const url = document.getElementById('supabase-url').value.trim();
        const key = document.getElementById('supabase-key').value.trim();
        
        if (!url || !key) {
            alert('⚠️ Inserisci sia URL che API Key');
            return;
        }
        
        const config = { url, key };
        this.saveData('supabase_config', config);
        
        // Ricarica configurazione
        await this.loadSupabaseConfig();
        
        if (this.supabaseConfigured) {
            alert('✅ Configurazione database salvata con successo');
            // Ricarica la modal per aggiornare lo stato
            this.showSettings('database');
        } else {
            alert('❌ Errore nella configurazione. Verifica le credenziali.');
        }
    }

    async testDatabaseConnection() {
        if (!this.supabaseConfigured) {
            alert('❌ Supabase non configurato');
            return;
        }

        try {
            // Test semplice della connessione
            const { data, error } = await this.supabase
                .from('operai')
                .select('count')
                .limit(1);
            
            if (error) throw error;
            
            alert('✅ Connessione al database riuscita!');
        } catch (error) {
            console.error('Errore test connessione:', error);
            alert('❌ Errore nella connessione al database');
        }
    }

    async syncWithDatabase() {
        if (!this.supabaseConfigured) {
            alert('❌ Supabase non configurato. Configura le credenziali nel pannello impostazioni.');
            return;
        }

        try {
            // Sincronizzazione bidirezionale
            await this.syncToDatabase(); // Prima salva le modifiche locali
            await this.syncFromDatabase(); // Poi carica eventuali modifiche esterne
            
            this.renderApp();
            alert('✅ Sincronizzazione bidirezionale completata!');
        } catch (error) {
            console.error('Errore nella sincronizzazione:', error);
            alert('❌ Errore nella sincronizzazione con il database');
        }
    }

    saveGeneralSettings() {
        const companyName = document.getElementById('company-name').value;
        const dragDropEnabled = document.getElementById('drag-drop-enabled').value === 'true';
        
        this.isDragDropActive = dragDropEnabled;
        this.saveData('general_settings', {
            companyName,
            dragDropEnabled
        });
        
        alert('✅ Impostazioni generali salvate');
        this.closeModal('modal-settings');
    }

    saveEmailSettings() {
        alert('✅ Impostazioni email salvate (demo)');
        this.closeModal('modal-settings');
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

    testEmailConnection() {
        alert('🔧 Test connessione email eseguito (demo)');
    }

    resetEmailSettings() {
        if (confirm('Resettare le impostazioni email?')) {
            document.getElementById('smtp-server').value = '';
            document.getElementById('smtp-port').value = '587';
            document.getElementById('sender-email').value = '';
            alert('🔄 Impostazioni email resettate');
        }
    }

    resetGeneralSettings() {
        if (confirm('Resettare le impostazioni generali?')) {
            document.getElementById('company-name').value = 'Standard System Engineering Srl';
            document.getElementById('drag-drop-enabled').value = 'true';
            alert('🔄 Impostazioni generali resettate');
        }
    }

    // ===== ESPORTAZIONE/IMPORTAZIONE DATI =====
    exportAllData() {
        const data = {
            operai: this.operai,
            cantieri: this.cantieri,
            users: this.users,
            exportDate: new Date().toISOString(),
            version: '1.6.4'
        };
        
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `sse_manager_backup_${new Date().toISOString().split('T')[0]}.json`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        alert('✅ Backup dati esportato con successo!');
    }

    importData() {
        alert('📂 Funzionalità di importazione dati in sviluppo');
    }

    // ===== FUNZIONALITÀ AGGIUNTIVE MENU =====
    showOperaiList() {
        alert('👷 Funzionalità lista operai completa - Usa la sidebar per visualizzare gli operai');
    }

    showCantieriList() {
        alert('🏗️ Funzionalità lista cantieri completa - Usa la mappa per visualizzare i cantieri');
    }

    showModifyCantiere() {
        alert('✏️ Funzionalità modifica cantiere - Clicca sul pulsante di modifica di un cantiere sulla mappa');
    }

    showDeleteCantiere() {
        alert('🗑️ Funzionalità elimina cantiere - Clicca sul pulsante di eliminazione di un cantiere sulla mappa');
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
                // Salvataggio automatico su database
                this.autoSaveToDatabase();
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

    saveData(key, data) {
        try {
            localStorage.setItem('sse_' + key, JSON.stringify(data));
        } catch (error) {
            console.error('Errore nel salvataggio dati:', error);
        }
    }
}

// Inizializza l'applicazione
const app = new SseManager();

// Aggiungi stili per animazioni
const style = document.createElement('style');
style.textContent = `
    @keyframes fadeInOut {
        0% { opacity: 0; transform: translateY(-10px); }
        20% { opacity: 1; transform: translateY(0); }
        80% { opacity: 1; transform: translateY(0); }
        100% { opacity: 0; transform: translateY(-10px); }
    }
    
    .current-user-master .master-only {
        display: block !important;
    }

    /* Stili per il calendario avanzato */
    .time-slots-container {
        max-height: 400px;
        overflow-y: auto;
        margin: 15px 0;
        border: 1px solid var(--color-border);
        border-radius: var(--radius-base);
        padding: 10px;
    }

    .operaio-time-slot {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 12px;
        margin-bottom: 8px;
        background: var(--color-surface);
        border-radius: var(--radius-sm);
        border-left: 4px solid var(--color-primary);
    }

    .operaio-info {
        flex: 1;
    }

    .operaio-info strong {
        display: block;
        margin-bottom: 4px;
    }

    .operaio-info small {
        color: var(--color-text-secondary);
        font-size: 0.85em;
    }

    .time-inputs {
        display: flex;
        align-items: center;
        gap: 8px;
    }

    .time-inputs input[type="time"] {
        padding: 6px;
        border: 1px solid var(--color-border);
        border-radius: var(--radius-sm);
        font-size: 14px;
        background: var(--color-surface);
        color: var(--color-text);
    }

    .time-slots-actions {
        display: flex;
        gap: 10px;
        justify-content: flex-end;
        margin-top: 15px;
        padding-top: 15px;
        border-top: 1px solid var(--color-border);
    }

    .time-slots-indicator {
        position: absolute;
        top: 2px;
        right: 2px;
        font-size: 10px;
    }

    .calendar-day.has-slots {
        background: linear-gradient(135deg, var(--color-bg-1), var(--color-bg-2));
        position: relative;
    }

    /* Stili per le impostazioni database */
    .database-status {
        padding: 10px;
        background: var(--color-surface);
        border-radius: var(--radius-sm);
        margin: 15px 0;
        border: 1px solid var(--color-border);
    }

    .status-indicator.connected {
        color: var(--color-success);
        font-weight: bold;
    }

    .status-indicator.disconnected {
        color: var(--color-error);
        font-weight: bold;
    }

    .database-actions {
        display: flex;
        gap: 10px;
        flex-wrap: wrap;
    }

    /* Indicatore sincronizzazione */
    .sync-status {
        position: fixed;
        bottom: 10px;
        right: 10px;
        background: var(--color-success);
        color: white;
        padding: 5px 10px;
        border-radius: var(--radius-sm);
        font-size: 12px;
        z-index: 1000;
    }
`;
document.head.appendChild(style);