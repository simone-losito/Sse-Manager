// app.js - Sse Manager Ver 1.6.4 - VERSIONE COMPLETA
console.log('🏗️ Sse Manager - Caricamento Ver 1.6.4 COMPLETA...');

class SseManager {
    constructor() {
        // Configurazione Supabase
        this.supabase = null;
        this.supabaseConfigured = false;
        
        // DATI IN MEMORIA
        this.operai = [];
        this.cantieri = [];
        this.users = [];
        
        // SISTEMA DI CACHE
        this.cache = {
            operai: new Map(),
            cantieri: new Map(),
            giornate: new Map(),
            stats: {
                totalOperai: 0,
                totalCantieri: 0,
                totalGiornate: 0
            }
        };
        
        // STATO CARICAMENTO
        this.dataLoaded = {
            operai: false,
            cantieri: false
        };
        
        // CALENDARIO
        this.calendarData = {
            currentMonth: new Date().getMonth(),
            currentYear: new Date().getFullYear(),
            loadedMonths: new Set()
        };

        // Variabili di stato
        this.currentUser = null;
        this.draggedOperaio = null;
        this.draggedCantiere = null;
        this.isDragDropActive = true;
        this.currentCantiereId = null;
        this.currentOperaiView = null;
        
        // Performance monitoring
        this.performance = {
            startTime: Date.now(),
            queriesCount: 0,
            cacheHits: 0,
            lastCleanup: Date.now()
        };

        this.init();
    }

    async init() {
        console.log('🚀 Inizializzazione applicazione...');
        
        await this.loadSupabaseConfig();
        await this.loadEssentialData();
        this.setupEventListeners();
        this.updateStats();
        this.setupPerformanceMonitoring();
        
        // Controlla se c'è un utente già loggato
        const savedUser = this.loadData('current_user');
        if (savedUser) {
            this.currentUser = savedUser;
            this.showMainApp();
        }
        
        console.log('✅ App inizializzata');
    }

    // ===== SISTEMA DI LOGIN =====
    async login() {
        const username = document.getElementById('login-username').value;
        const password = document.getElementById('login-password').value;

        console.log('Tentativo login:', username);

        if (!username || !password) {
            alert('Inserisci username e password');
            return;
        }

        // Utenti predefiniti
        const users = {
            'admin': { 
                password: 'admin123', 
                user: { id: 1, username: 'admin', type: 'master', nome: 'Amministratore' } 
            },
            'manager': { 
                password: 'manager123', 
                user: { id: 2, username: 'manager', type: 'manager', nome: 'Manager' } 
            },
            'marco.rossi': { 
                password: 'operaio123', 
                user: { id: 3, username: 'marco.rossi', type: 'operaio', nome: 'Marco Rossi', operaio_id: 1 } 
            },
            'giuseppe.bianchi': { 
                password: 'operaio123', 
                user: { id: 4, username: 'giuseppe.bianchi', type: 'operaio', nome: 'Giuseppe Bianchi', operaio_id: 2 } 
            },
            'antonio.verde': { 
                password: 'operaio123', 
                user: { id: 5, username: 'antonio.verde', type: 'operaio', nome: 'Antonio Verde', operaio_id: 3 } 
            }
        };

        if (users[username] && users[username].password === password) {
            this.currentUser = users[username].user;
            this.showMainApp();
            this.saveData('current_user', this.currentUser);
            alert(`✅ Benvenuto ${this.currentUser.nome}!`);
        } else {
            alert('❌ Credenziali errate');
        }
    }

    logout() {
        this.currentUser = null;
        this.saveData('current_user', null);
        this.showLoginScreen();
        alert('👋 Logout effettuato');
    }

    showLoginScreen() {
        document.getElementById('login-screen').classList.remove('hidden');
        document.getElementById('main-app').classList.add('hidden');
        document.getElementById('performance-monitor')?.classList.add('hidden');
        
        document.getElementById('login-username').value = '';
        document.getElementById('login-password').value = '';
    }

    showMainApp() {
        document.getElementById('login-screen').classList.add('hidden');
        document.getElementById('main-app').classList.remove('hidden');
        document.getElementById('performance-monitor')?.classList.remove('hidden');
        
        this.updateUIForUserType();
        this.renderApp();
    }

    updateUIForUserType() {
        const userInfo = document.getElementById('user-info');
        const masterElements = document.querySelectorAll('.master-only');
        
        if (userInfo && this.currentUser) {
            userInfo.textContent = `👤 ${this.currentUser.nome} (${this.currentUser.type})`;
        }
        
        masterElements.forEach(el => {
            if (this.currentUser.type === 'master') {
                el.style.display = 'block';
            } else {
                el.style.display = 'none';
            }
        });
        
        const modeText = document.getElementById('mode-text');
        if (modeText && this.currentUser) {
            modeText.textContent = `Modalità: ${this.currentUser.type.charAt(0).toUpperCase() + this.currentUser.type.slice(1)}`;
        }
    }

    // ===== CONFIGURAZIONE SUPABASE =====
    async loadSupabaseConfig() {
        try {
            const config = this.loadData('supabase_config');
            if (config && config.url && config.key) {
                const { createClient } = await import('https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm');
                this.supabase = createClient(config.url, config.key);
                this.supabaseConfigured = true;
                console.log('✅ Supabase configurato');
            } else {
                console.log('ℹ️ Supabase non configurato');
                this.supabaseConfigured = false;
            }
        } catch (error) {
            console.error('❌ Errore Supabase:', error);
            this.supabaseConfigured = false;
        }
    }

    // ===== CARICAMENTO DATI =====
    async loadEssentialData() {
        console.log('📊 Caricamento dati essenziali...');
        
        if (this.supabaseConfigured) {
            try {
                const [operaiCount, cantieriCount] = await Promise.all([
                    this.getOperaiCount(),
                    this.getCantieriCount()
                ]);
                
                this.cache.stats = {
                    totalOperai: operaiCount,
                    totalCantieri: cantieriCount,
                    totalGiornate: 0
                };
                
                console.log('✅ Statistiche caricate:', this.cache.stats);
                
            } catch (error) {
                console.error('Errore caricamento statistiche:', error);
                this.loadDefaultStats();
            }
        } else {
            this.loadDefaultStats();
        }
    }

    async getOperaiCount() {
        if (this.supabaseConfigured) {
            const { count, error } = await this.supabase
                .from('operai')
                .select('*', { count: 'exact', head: true });
            return error ? 0 : count;
        }
        return this.operai.length;
    }

    async getCantieriCount() {
        if (this.supabaseConfigured) {
            const { count, error } = await this.supabase
                .from('cantieri')
                .select('*', { count: 'exact', head: true });
            return error ? 0 : count;
        }
        return this.cantieri.length;
    }

    loadDefaultStats() {
        this.cache.stats = {
            totalOperai: this.operai.length,
            totalCantieri: this.cantieri.length,
            totalGiornate: 0
        };
    }

    // ===== CARICAMENTO OPERAI =====
    async loadOperaiLazy() {
        if (this.dataLoaded.operai && this.operai.length > 0) {
            this.performance.cacheHits++;
            return this.operai;
        }
        
        console.log('📥 Caricamento operai...');
        
        if (this.supabaseConfigured) {
            try {
                const { data, error } = await this.supabase
                    .from('operai')
                    .select('*')
                    .order('nome')
                    .limit(1000);
                
                if (error) throw error;
                
                this.operai = data || [];
                this.dataLoaded.operai = true;
                
                console.log(`✅ ${this.operai.length} operai caricati`);
                return this.operai;
                
            } catch (error) {
                console.error('Errore caricamento operai:', error);
                return this.loadOperaiFromLocalStorage();
            }
        }
        
        return this.loadOperaiFromLocalStorage();
    }

    async loadOperaiFromLocalStorage() {
        const localData = this.loadData('operai');
        this.operai = localData || [];
        this.dataLoaded.operai = true;
        return this.operai;
    }

    // ===== CARICAMENTO CANTIERI =====
    async loadCantieriLazy() {
        if (this.dataLoaded.cantieri && this.cantieri.length > 0) {
            this.performance.cacheHits++;
            return this.cantieri;
        }
        
        console.log('📥 Caricamento cantieri...');
        
        if (this.supabaseConfigured) {
            try {
                const { data, error } = await this.supabase
                    .from('cantieri')
                    .select('*')
                    .order('nome')
                    .limit(500);
                
                if (error) throw error;
                
                this.cantieri = data || [];
                this.dataLoaded.cantieri = true;
                
                console.log(`✅ ${this.cantieri.length} cantieri caricati`);
                return this.cantieri;
                
            } catch (error) {
                console.error('Errore caricamento cantieri:', error);
                return this.loadCantieriFromLocalStorage();
            }
        }
        
        return this.loadCantieriFromLocalStorage();
    }

    async loadCantieriFromLocalStorage() {
        const localData = this.loadData('cantieri');
        this.cantieri = localData || [];
        this.dataLoaded.cantieri = true;
        return this.cantieri;
    }

    // ===== RENDER APPLICAZIONE =====
    async renderApp() {
        console.log('🎨 Render applicazione...');
        await this.renderOperai();
        await this.renderCantieri();
        this.updateStats();
    }

    async renderOperai() {
        const container = document.getElementById('operai-container');
        if (!container) return;
        
        container.innerHTML = '<div class="loading">🔄 Caricamento operai...</div>';
        
        await this.loadOperaiLazy();
        
        container.innerHTML = '';
        const filteredOperai = this.getFilteredOperai();
        
        if (filteredOperai.length > 50) {
            this.renderOperaiVirtual(container, filteredOperai);
        } else {
            this.renderOperaiNormal(container, filteredOperai);
        }
        
        this.updateOperaiControls();
    }

    renderOperaiVirtual(container, operai) {
        console.log('🎯 Virtual scrolling per', operai.length, 'operai');
        
        const visibleCount = 20;
        let startIndex = 0;
        
        const renderChunk = () => {
            const endIndex = Math.min(startIndex + visibleCount, operai.length);
            const chunk = operai.slice(startIndex, endIndex);
            
            let html = '';
            chunk.forEach(operaio => {
                html += this.createOperaioCardHTML(operaio);
            });
            
            container.innerHTML = html;
            
            if (operai.length > visibleCount) {
                container.innerHTML += `
                    <div class="virtual-scroll-controls">
                        <button onclick="app.scrollOperai(-${visibleCount})" ${startIndex === 0 ? 'disabled' : ''}>
                            ⬅️ Precedenti
                        </button>
                        <span>${startIndex + 1}-${endIndex} di ${operai.length}</span>
                        <button onclick="app.scrollOperai(${visibleCount})" ${endIndex >= operai.length ? 'disabled' : ''}>
                            Successivi ➡️
                        </button>
                    </div>
                `;
            }
        };
        
        this.currentOperaiView = { operai, startIndex, renderChunk };
        renderChunk();
    }

    renderOperaiNormal(container, operai) {
        operai.forEach(operaio => {
            const cardHTML = this.createOperaioCardHTML(operaio);
            container.innerHTML += cardHTML;
        });
    }

    createOperaioCardHTML(operaio) {
        const isDraggable = (this.currentUser.type === 'manager' || this.currentUser.type === 'master') && this.isDragDropActive;
        
        return `
            <div class="operaio-card ${operaio.cantiere_id ? 'assigned' : ''}" 
                 data-operaio-id="${operaio.id}"
                 draggable="${isDraggable}">
                <div class="operaio-header">
                    <span class="operaio-avatar">${operaio.avatar || '👷'}</span>
                    <div class="operaio-info">
                        <div class="operaio-nome">${operaio.nome}</div>
                        <div class="operaio-spec">${operaio.specializzazione}</div>
                        <div class="operaio-level">Livello ${operaio.livello}</div>
                    </div>
                </div>
                <div class="operaio-status">${operaio.cantiere_id ? 'Assegnato' : 'Disponibile'}</div>
                <div class="operaio-contact">
                    📧 ${operaio.email}<br>
                    📞 ${operaio.telefono}
                </div>
                ${operaio.preposto ? '<div class="operaio-preposto">⭐ Preposto ⭐</div>' : ''}
                ${(this.currentUser.type === 'manager' || this.currentUser.type === 'master') ? `
                <div class="operaio-actions">
                    <button class="btn btn-edit" onclick="app.editOperaio(${operaio.id})">✏️</button>
                    <button class="btn btn-delete" onclick="app.removeOperaio(${operaio.id})">🗑️</button>
                </div>
                ` : ''}
            </div>
        `;
    }

    scrollOperai(delta) {
        if (!this.currentOperaiView) return;
        
        const newStart = this.currentOperaiView.startIndex + delta;
        if (newStart >= 0 && newStart < this.currentOperaiView.operai.length) {
            this.currentOperaiView.startIndex = newStart;
            this.currentOperaiView.renderChunk();
        }
    }

    updateOperaiControls() {
        const controls = document.getElementById('controls-operai');
        if (!controls) return;

        if (this.currentUser.type === 'manager' || this.currentUser.type === 'master') {
            controls.innerHTML = `
                <button class="btn btn-primary" onclick="app.addOperaio()">➕ Aggiungi Operaio</button>
                <button class="btn btn-secondary" onclick="app.exportOperaiCSV()">📤 Export CSV</button>
                ${this.operai.length > 50 ? '<span class="stat-tooltip">🎯 Virtual scrolling attivo</span>' : ''}
            `;
        } else {
            controls.innerHTML = '';
        }
    }

    async renderCantieri() {
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

        container.innerHTML = '<div class="loading">🏗️ Caricamento cantieri...</div>';
        
        await this.loadCantieriLazy();
        
        container.innerHTML = '';
        
        this.cantieri.forEach(cantiere => {
            const element = document.createElement('div');
            element.className = 'cantiere';
            element.dataset.cantiereId = cantiere.id;
            element.style.left = (cantiere.x || 100) + 'px';
            element.style.top = (cantiere.y || 100) + 'px';
            element.draggable = (this.currentUser.type === 'manager' || this.currentUser.type === 'master') && this.isDragDropActive;
            
            const icons = {'Civile': '🏰', 'Industriale': '🏭', 'Residenziale': '🏢', 'Stradale': '🛣️', 'Ferroviario': '🚂'};
            const icon = icons[cantiere.tipo] || '🏗️';
            
            element.innerHTML = `
                <div class="cantiere-icon">${icon}</div>
                <div class="cantiere-nome">${cantiere.nome}</div>
                <div class="cantiere-indirizzo">${cantiere.indirizzo}</div>
                <div class="cantiere-controls">
                    ${(this.currentUser.type === 'manager' || this.currentUser.type === 'master') ? `
                    <button class="btn-small btn-edit" onclick="event.stopPropagation(); app.editCantiere(${cantiere.id})">✏️</button>
                    <button class="btn-small btn-delete" onclick="event.stopPropagation(); app.removeCantiere(${cantiere.id})">🗑️</button>
                    ` : ''}
                </div>
            `;
            
            // Setup drag and drop
            element.addEventListener('dragstart', (e) => {
                this.draggedCantiere = cantiere;
                e.dataTransfer.setData('text/plain', cantiere.id);
            });
            
            element.addEventListener('click', () => {
                this.showCantiereDetails(cantiere.id);
            });
            
            container.appendChild(element);
        });
    }

    // ===== GESTIONE EVENTI =====
    setupEventListeners() {
        console.log('🔧 Setup event listeners...');
        
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
        document.getElementById('close-performance')?.addEventListener('click', () => this.closeModal('modal-performance'));

        // Calendar
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('prev-month')) this.changeMonth(-1);
            if (e.target.classList.contains('next-month')) this.changeMonth(1);
        });

        // Drag & Drop globale
        document.addEventListener('dragover', (e) => {
            e.preventDefault();
            e.dataTransfer.dropEffect = 'move';
        });
        
        document.addEventListener('drop', (e) => e.preventDefault());

        window.addEventListener('beforeunload', () => this.saveAllData());

        console.log('✅ Event listeners configurati');
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
            case 'show-performance':
                this.showPerformance();
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
        if (menu) menu.classList.toggle('hidden');
    }

    closeMenu() {
        const menu = document.getElementById('menu-dropdown');
        if (menu) menu.classList.add('hidden');
    }

    // ===== METODI OPERAI =====
    addOperaio() {
        document.getElementById('modal-operaio-title').textContent = 'Aggiungi Operaio';
        document.getElementById('operaio-id').value = '';
        document.getElementById('operaio-nome').value = '';
        document.getElementById('operaio-email').value = '';
        document.getElementById('operaio-telefono').value = '';
        document.getElementById('operaio-specializzazione').value = '';
        document.getElementById('operaio-livello').value = '';
        document.getElementById('operaio-preposto').checked = false;
        
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
        document.getElementById('operaio-preposto').checked = operaio.preposto || false;
        
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
                cantiere_id: null, avatar: avatarMap[specializzazione] || '👷', preposto,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            };
            this.operai.push(operaio);
            isNew = true;
        }
        
        if (this.supabaseConfigured) {
            try {
                await this.saveOperaioToSupabase(operaio);
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

    async saveOperaioToSupabase(operaio) {
        if (!this.supabaseConfigured) return;

        const operaioData = {
            nome: operaio.nome,
            email: operaio.email,
            telefono: operaio.telefono,
            specializzazione: operaio.specializzazione,
            livello: operaio.livello,
            cantiere_id: operaio.cantiere_id,
            avatar: operaio.avatar,
            preposto: operaio.preposto,
            updated_at: new Date().toISOString()
        };

        if (operaio.id) {
            const { error } = await this.supabase
                .from('operai')
                .update(operaioData)
                .eq('id', operaio.id);
            if (error) throw error;
        } else {
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
    }

    removeOperaio(id) {
        if (!confirm('Sei sicuro di voler eliminare questo operaio?')) return;
        
        this.operai = this.operai.filter(o => o.id !== id);
        
        if (this.supabaseConfigured) {
            this.supabase
                .from('operai')
                .delete()
                .eq('id', id)
                .then(() => {
                    console.log('✅ Operaio eliminato dal database');
                })
                .catch(error => {
                    console.error('Errore eliminazione operaio:', error);
                    alert('⚠️ Operaio eliminato localmente, ma errore nel database');
                });
        }
        
        this.renderApp();
        this.saveAllData();
        alert('✅ Operaio eliminato con successo');
    }

    // ===== METODI CANTIERI =====
    addCantiere() {
        document.getElementById('modal-cantiere-title').textContent = 'Aggiungi Cantiere';
        document.getElementById('cantiere-id').value = '';
        document.getElementById('cantiere-nome').value = '';
        document.getElementById('cantiere-indirizzo').value = '';
        document.getElementById('cantiere-tipo').value = '';
        
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
                Object.assign(cantiere, {
                    nome, indirizzo, tipo,
                    updated_at: new Date().toISOString()
                });
            }
        } else {
            const newId = Math.max(0, ...this.cantieri.map(c => c.id)) + 1;
            cantiere = {
                id: newId, nome, indirizzo, tipo,
                x: Math.random() * 400 + 50,
                y: Math.random() * 300 + 50,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            };
            this.cantieri.push(cantiere);
            isNew = true;
        }
        
        if (this.supabaseConfigured) {
            try {
                await this.saveCantiereToSupabase(cantiere);
                console.log(`✅ Cantiere ${isNew ? 'creato' : 'aggiornato'} sul database`);
            } catch (error) {
                console.error('Errore nel salvataggio su Supabase:', error);
                alert('⚠️ Cantiere salvato localmente, ma errore nel salvataggio sul database');
            }
        }
        
        this.closeModal('modal-cantiere');
        this.renderApp();
        this.saveAllData();
        alert('✅ Cantiere salvato con successo' + (this.supabaseConfigured ? ' e sincronizzato con il database' : ''));
    }

    async saveCantiereToSupabase(cantiere) {
        if (!this.supabaseConfigured) return;

        const cantiereData = {
            nome: cantiere.nome,
            indirizzo: cantiere.indirizzo,
            tipo: cantiere.tipo,
            x: cantiere.x,
            y: cantiere.y,
            updated_at: new Date().toISOString()
        };

        if (cantiere.id) {
            const { error } = await this.supabase
                .from('cantieri')
                .update(cantiereData)
                .eq('id', cantiere.id);
            if (error) throw error;
        } else {
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
    }

    removeCantiere(id) {
        if (!confirm('Sei sicuro di voler eliminare questo cantiere?')) return;
        
        this.cantieri = this.cantieri.filter(c => c.id !== id);
        
        if (this.supabaseConfigured) {
            this.supabase
                .from('cantieri')
                .delete()
                .eq('id', id)
                .then(() => {
                    console.log('✅ Cantiere eliminato dal database');
                })
                .catch(error => {
                    console.error('Errore eliminazione cantiere:', error);
                    alert('⚠️ Cantiere eliminato localmente, ma errore nel database');
                });
        }
        
        this.renderApp();
        this.saveAllData();
        alert('✅ Cantiere eliminato con successo');
    }

    showCantiereDetails(cantiereId) {
        this.currentCantiereId = cantiereId;
        const cantiere = this.cantieri.find(c => c.id === cantiereId);
        
        if (!cantiere) return;
        
        document.getElementById('cantiere-details-title').textContent = `Dettagli: ${cantiere.nome}`;
        
        const basicInfo = document.getElementById('cantiere-basic-info');
        basicInfo.innerHTML = `
            <p><strong>📍 Indirizzo:</strong> ${cantiere.indirizzo}</p>
            <p><strong>🏗️ Tipo:</strong> ${cantiere.tipo}</p>
            <p><strong>📅 Data creazione:</strong> ${new Date(cantiere.created_at).toLocaleDateString()}</p>
        `;
        
        this.showModal('modal-cantiere-details');
        this.renderCalendar();
    }

    toggleDragDrop() {
        this.isDragDropActive = !this.isDragDropActive;
        alert(`Drag & Drop ${this.isDragDropActive ? 'sbloccato' : 'bloccato'}`);
        this.renderApp();
    }

    // ===== FILTRI E RICERCA =====
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

    filterCantieri(searchTerm) {
        const container = document.getElementById('map-container');
        if (!container) return;
        
        const cantieriElements = container.querySelectorAll('.cantiere');
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

    // ===== CALENDARIO =====
    async renderCalendar() {
        if (!this.currentCantiereId) return;
        
        const container = document.getElementById('calendar-grid');
        if (!container) return;
        
        container.innerHTML = '<div class="loading">📅 Caricamento calendario...</div>';
        
        // Simula caricamento calendario
        setTimeout(() => {
            this.renderCalendarGrid(container);
        }, 1000);
    }

    renderCalendarGrid(container) {
        const monthNames = ['Gennaio', 'Febbraio', 'Marzo', 'Aprile', 'Maggio', 'Giugno', 
                           'Luglio', 'Agosto', 'Settembre', 'Ottobre', 'Novembre', 'Dicembre'];
        const dayNames = ['Dom', 'Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab'];
        
        document.getElementById('calendar-month-year').textContent = 
            `${monthNames[this.calendarData.currentMonth]} ${this.calendarData.currentYear}`;
        
        const firstDay = new Date(this.calendarData.currentYear, this.calendarData.currentMonth, 1);
        const startDate = new Date(firstDay);
        startDate.setDate(startDate.getDate() - firstDay.getDay());
        
        let calendarHtml = '';
        
        dayNames.forEach(day => {
            calendarHtml += `<div class="calendar-day-header">${day}</div>`;
        });
        
        const current = new Date(startDate);
        for (let i = 0; i < 42; i++) {
            const dayNum = current.getDate();
            const isCurrentMonth = current.getMonth() === this.calendarData.currentMonth;
            const hasWork = Math.random() > 0.7; // Simula giorni con lavoro
            
            let dayClass = 'calendar-day';
            if (!isCurrentMonth) dayClass += ' other-month';
            if (hasWork) dayClass += ' has-work';
            
            calendarHtml += `
                <div class="${dayClass}" data-date="${current.toISOString()}">
                    ${dayNum}
                    ${hasWork ? `<div class="work-indicator">👷</div>` : ''}
                </div>
            `;
            current.setDate(current.getDate() + 1);
        }
        
        container.innerHTML = calendarHtml;
    }

    changeMonth(delta) {
        this.calendarData.currentMonth += delta;
        
        if (this.calendarData.currentMonth < 0) {
            this.calendarData.currentMonth = 11;
            this.calendarData.currentYear--;
        } else if (this.calendarData.currentMonth > 11) {
            this.calendarData.currentMonth = 0;
            this.calendarData.currentYear++;
        }
        
        this.renderCalendar();
    }

    selectCalendarDay(date) {
        console.log('Giorno selezionato:', date);
        alert(`Giorno selezionato: ${new Date(date).toLocaleDateString()}`);
    }

    // ===== PERFORMANCE MONITORING =====
    setupPerformanceMonitoring() {
        setInterval(() => {
            this.monitorPerformance();
        }, 30000);
        
        this.showPerformanceMonitor();
    }

    monitorPerformance() {
        const now = Date.now();
        const uptime = (now - this.performance.startTime) / 1000;
        const hitRate = Math.round((this.performance.cacheHits / (this.performance.queriesCount || 1)) * 100);
        
        console.log('📊 Performance:', {
            uptime: `${Math.round(uptime)}s`,
            queries: this.performance.queriesCount,
            cacheHits: this.performance.cacheHits,
            cacheHitRate: `${hitRate}%`
        });
        
        this.updatePerformanceMonitor();
    }

    showPerformanceMonitor() {
        const monitor = document.getElementById('performance-monitor');
        if (monitor) {
            monitor.classList.remove('hidden');
            this.updatePerformanceMonitor();
        }
    }

    updatePerformanceMonitor() {
        const monitor = document.getElementById('performance-monitor');
        const stats = document.getElementById('monitor-stats');
        
        if (monitor && stats) {
            const uptime = Math.round((Date.now() - this.performance.startTime) / 1000);
            const hitRate = Math.round((this.performance.cacheHits / (this.performance.queriesCount || 1)) * 100);
            
            stats.textContent = `Q:${this.performance.queriesCount} | C:${this.performance.cacheHits} (${hitRate}%) | O:${this.operai.length} | 🕒${uptime}s`;
        }
    }

    showPerformance() {
        const uptime = Math.round((Date.now() - this.performance.startTime) / 1000);
        const hitRate = Math.round((this.performance.cacheHits / (this.performance.queriesCount || 1)) * 100);
        
        document.getElementById('performance-uptime').textContent = `${uptime}s`;
        document.getElementById('performance-queries').textContent = this.performance.queriesCount;
        document.getElementById('performance-cache-hits').textContent = this.performance.cacheHits;
        document.getElementById('performance-hit-rate').textContent = `${hitRate}%`;
        document.getElementById('performance-operai-memory').textContent = this.operai.length;
        document.getElementById('performance-cantieri-memory').textContent = this.cantieri.length;
        document.getElementById('performance-cached-months').textContent = this.cache.giornate.size;
        
        this.showModal('modal-performance');
    }

    clearCache() {
        this.cache.giornate.clear();
        this.calendarData.loadedMonths.clear();
        this.dataLoaded.operai = false;
        this.dataLoaded.cantieri = false;
        
        alert('✅ Cache pulita con successo');
        this.renderApp();
    }

    optimizeMemory() {
        this.cleanExpiredCache();
        alert('✅ Memoria ottimizzata');
        this.showPerformance();
    }

    cleanExpiredCache() {
        const now = Date.now();
        let cleaned = 0;
        
        this.cache.giornate.forEach((value, key) => {
            if (value.expires && value.expires < now) {
                this.cache.giornate.delete(key);
                cleaned++;
            }
        });
        
        if (cleaned > 0) {
            console.log(`🧹 ${cleaned} cache entries pulite`);
        }
    }

    // ===== METODI UTILITY =====
    updateStats() {
        document.getElementById('total-operai').textContent = this.cache.stats.totalOperai;
        document.getElementById('total-cantieri').textContent = this.cache.stats.totalCantieri;
        document.getElementById('total-giornate').textContent = this.cache.stats.totalGiornate;
        
        const assignedOperai = this.operai.filter(o => o.cantiere_id !== null).length;
        document.getElementById('assigned-operai').textContent = assignedOperai;
        
        document.getElementById('info-total-operai').textContent = this.cache.stats.totalOperai;
        document.getElementById('info-total-cantieri').textContent = this.cache.stats.totalCantieri;
        document.getElementById('info-total-giornate').textContent = this.cache.stats.totalGiornate;
        document.getElementById('info-assigned-operai').textContent = assignedOperai;
    }

    showModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) modal.classList.remove('hidden');
    }

    closeModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) modal.classList.add('hidden');
    }

    showInfo() {
        this.showModal('modal-info');
    }

    // ===== METODI PLACEHOLDER =====
    showUserManagement() { alert('👥 Gestione utenti - In sviluppo'); }
    showSettings() { alert('⚙️ Impostazioni - In sviluppo'); }
    exportOperaiCSV() { alert('📤 Export CSV - In sviluppo'); }
    importOperaiCSV() { alert('📥 Import CSV - In sviluppo'); }
    showOperaiList() { alert('👷 Lista operai - In sviluppo'); }
    showCantieriList() { alert('🏗️ Lista cantieri - In sviluppo'); }
    exportAllData() { alert('💾 Export dati - In sviluppo'); }
    importData() { alert('📂 Import dati - In sviluppo'); }
    syncWithDatabase() { alert('🔄 Sincronizzazione - In sviluppo'); }

    // ===== PERSISTENZA =====
    saveAllData() {
        try {
            localStorage.setItem('sse_operai', JSON.stringify(this.operai));
            localStorage.setItem('sse_cantieri', JSON.stringify(this.cantieri));
            localStorage.setItem('sse_users', JSON.stringify(this.users));
        } catch (error) {
            console.error('❌ Errore salvataggio:', error);
        }
    }

    loadData(key) {
        try {
            const data = localStorage.getItem('sse_' + key);
            return data ? JSON.parse(data) : null;
        } catch (error) {
            console.error('Errore caricamento:', error);
            return null;
        }
    }

    saveData(key, data) {
        try {
            localStorage.setItem('sse_' + key, JSON.stringify(data));
        } catch (error) {
            console.error('Errore salvataggio:', error);
        }
    }
}

// Inizializza l'applicazione
console.log('🔧 Creazione istanza app...');
const app = new SseManager();
console.log('✅ App creata, pronto per uso!');

// Rendilo globale per debug
window.app = app;