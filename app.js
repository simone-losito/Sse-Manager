// app.js - Sse Manager Ver 1.6.4 - OTTIMIZZATO PER GRANDI DATASET
console.log('🏗️ Sse Manager - Caricamento Ver 1.6.4 OTTIMIZZATO...');

class SseManager {
    constructor() {
        // Configurazione Supabase
        this.supabase = null;
        this.supabaseConfigured = false;
        
        // DATI IN MEMORIA - SOLO QUELLI NECESSARI
        this.operai = [];
        this.cantieri = [];
        this.users = [];
        
        // SISTEMA DI CACHE E LAZY LOADING
        this.cache = {
            operai: new Map(),
            cantieri: new Map(),
            giornate: new Map(), // Cache per mese/anno
            stats: {
                totalOperai: 0,
                totalCantieri: 0,
                totalGiornate: 0
            }
        };
        
        // STATO CARICAMENTO
        this.dataLoaded = {
            operai: false,
            cantieri: false,
            // Giornate vengono caricate on-demand per mese
        };
        
        // CALENDARIO - Solo dati del mese corrente
        this.calendarData = {
            currentMonth: new Date().getMonth(),
            currentYear: new Date().getFullYear(),
            loadedMonths: new Set() // Traccia mesi già caricati
        };

        // Variabili di stato
        this.currentUser = null;
        this.draggedOperaio = null;
        this.draggedCantiere = null;
        this.isDragDropActive = true;
        this.currentCantiereId = null;
        this.currentOperaiView = null; // Per virtual scrolling
        
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
        console.log('🚀 Inizializzazione OTTIMIZZATA per grandi dataset');
        
        await this.loadSupabaseConfig();
        await this.loadEssentialData(); // Carica solo dati essenziali
        this.setupEventListeners();
        this.updateStats();
        this.setupPerformanceMonitoring();
        this.setupOptimizedStyles();
    }

    // ===== CONFIGURAZIONE SUPABASE =====
    async loadSupabaseConfig() {
        const config = this.loadData('supabase_config');
        if (config && config.url && config.key) {
            try {
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

    // ===== CARICAMENTO DATI ESSENZIALI =====
    async loadEssentialData() {
        console.log('📊 Caricamento dati essenziali...');
        
        if (this.supabaseConfigured) {
            try {
                const [operaiCount, cantieriCount, giornateCount] = await Promise.all([
                    this.getOperaiCount(),
                    this.getCantieriCount(),
                    this.getGiornateCount()
                ]);
                
                this.cache.stats = {
                    totalOperai: operaiCount,
                    totalCantieri: cantieriCount,
                    totalGiornate: giornateCount
                };
                
                console.log('✅ Statistiche caricate:', this.cache.stats);
                this.updateStats();
                
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

    async getGiornateCount() {
        if (this.supabaseConfigured) {
            const { count, error } = await this.supabase
                .from('giornate_lavoro')
                .select('*', { count: 'exact', head: true });
            return error ? 0 : count;
        }
        return 0;
    }

    loadDefaultStats() {
        this.cache.stats = {
            totalOperai: this.operai.length,
            totalCantieri: this.cantieri.length,
            totalGiornate: 0
        };
    }

    // ===== CARICAMENTO LAZY DEGLI OPERAI =====
    async loadOperaiLazy() {
        if (this.dataLoaded.operai && this.operai.length > 0) {
            this.performance.cacheHits++;
            return this.operai;
        }
        
        console.log('📥 Caricamento LAZY operai...');
        this.performance.queriesCount++;
        
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
                this.updateOperaiCache();
                
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

    updateOperaiCache() {
        this.cache.operai.clear();
        this.operai.forEach(operaio => {
            this.cache.operai.set(operaio.id, operaio);
        });
    }

    // ===== CARICAMENTO LAZY DEI CANTIERI =====
    async loadCantieriLazy() {
        if (this.dataLoaded.cantieri && this.cantieri.length > 0) {
            this.performance.cacheHits++;
            return this.cantieri;
        }
        
        console.log('📥 Caricamento LAZY cantieri...');
        this.performance.queriesCount++;
        
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

    // ===== SISTEMA AVANZATO PER GIORNATE DI LAVORO =====
    async loadGiornateForMonth(month, year, cantiereId = null) {
        const cacheKey = `${year}-${month}-${cantiereId}`;
        
        // Controlla cache
        if (this.cache.giornate.has(cacheKey)) {
            const cached = this.cache.giornate.get(cacheKey);
            if (cached.expires > Date.now()) {
                this.performance.cacheHits++;
                return cached.data;
            } else {
                this.cache.giornate.delete(cacheKey);
            }
        }
        
        console.log(`📅 Caricamento giornate per ${month}/${year}...`);
        this.performance.queriesCount++;
        
        const startDate = new Date(year, month, 1);
        const endDate = new Date(year, month + 1, 0);
        
        try {
            let query = this.supabase
                .from('giornate_lavoro')
                .select(`
                    *,
                    operai!inner(nome, specializzazione, avatar),
                    cantieri!inner(nome, indirizzo)
                `)
                .gte('data', startDate.toISOString().split('T')[0])
                .lte('data', endDate.toISOString().split('T')[0]);
            
            if (cantiereId) {
                query = query.eq('cantiere_id', cantiereId);
            }
            
            const { data, error } = await query;
            
            if (error) throw error;
            
            const organizedData = this.organizeGiornateData(data || []);
            
            // Salva in cache (5 minuti)
            this.cache.giornate.set(cacheKey, {
                data: organizedData,
                timestamp: Date.now(),
                expires: Date.now() + (5 * 60 * 1000)
            });
            
            this.calendarData.loadedMonths.add(cacheKey);
            
            console.log(`✅ ${data.length} giornate caricate per ${month}/${year}`);
            return organizedData;
            
        } catch (error) {
            console.error('Errore caricamento giornate:', error);
            return this.organizeGiornateData([]);
        }
    }

    organizeGiornateData(giornate) {
        const organized = {
            byDate: new Map(),
            byOperaio: new Map(),
            byCantiere: new Map(),
            stats: {
                total: giornate.length,
                completate: giornate.filter(g => g.stato === 'completato').length,
                oreTotali: giornate.reduce((sum, g) => sum + (g.ore_lavorate || 0), 0)
            }
        };
        
        giornate.forEach(giornata => {
            const dateKey = giornata.data;
            if (!organized.byDate.has(dateKey)) {
                organized.byDate.set(dateKey, []);
            }
            organized.byDate.get(dateKey).push(giornata);
            
            if (!organized.byOperaio.has(giornata.operaio_id)) {
                organized.byOperaio.set(giornata.operaio_id, []);
            }
            organized.byOperaio.get(giornata.operaio_id).push(giornata);
            
            if (giornata.cantiere_id) {
                if (!organized.byCantiere.has(giornata.cantiere_id)) {
                    organized.byCantiere.set(giornata.cantiere_id, []);
                }
                organized.byCantiere.get(giornata.cantiere_id).push(giornata);
            }
        });
        
        return organized;
    }

    // ===== RENDER OTTIMIZZATO =====
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
        console.log('🎯 Usando virtual scrolling per', operai.length, 'operai');
        
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
        const cantiere = operaio.cantiere ? this.cantieri.find(c => c.id === operaio.cantiere) : null;
        const isDraggable = (this.currentUser.type === 'manager' || this.currentUser.type === 'master') && this.isDragDropActive;
        
        return `
            <div class="operaio-card ${operaio.cantiere ? 'assigned' : ''}" 
                 data-operaio-id="${operaio.id}"
                 draggable="${isDraggable}">
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

    // ===== CALENDARIO OTTIMIZZATO =====
    async renderCalendar() {
        if (!this.currentCantiereId) return;
        
        const container = document.getElementById('calendar-grid');
        if (!container) return;
        
        container.innerHTML = '<div class="loading">📅 Caricamento calendario...</div>';
        
        const giornateData = await this.loadGiornateForMonth(
            this.calendarData.currentMonth,
            this.calendarData.currentYear,
            this.currentCantiereId
        );
        
        this.renderCalendarGrid(container, giornateData);
    }

    async renderCalendarGrid(container, giornateData) {
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
            const dateKey = current.toISOString().split('T')[0];
            
            const giornateDelGiorno = giornateData.byDate.get(dateKey) || [];
            const hasGiornate = giornateDelGiorno.length > 0;
            const hasCompletato = giornateDelGiorno.some(g => g.stato === 'completato');
            const hasAssente = giornateDelGiorno.some(g => g.stato === 'assente');
            
            let dayClass = 'calendar-day';
            if (!isCurrentMonth) dayClass += ' other-month';
            if (hasGiornate) dayClass += ' has-work';
            if (hasCompletato) dayClass += ' completed';
            if (hasAssente) dayClass += ' cancelled';
            
            calendarHtml += `
                <div class="${dayClass}" data-date="${current.toISOString()}">
                    ${dayNum}
                    ${hasGiornate ? `<div class="work-indicator">👷 ${giornateDelGiorno.length}</div>` : ''}
                </div>
            `;
            current.setDate(current.getDate() + 1);
        }
        
        container.innerHTML = calendarHtml;
        
        document.querySelectorAll('.calendar-day').forEach(day => {
            day.addEventListener('click', () => {
                this.selectCalendarDay(day.dataset.date);
            });
        });
    }

    // ===== GESTIONE EVENTI (adattata) =====
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
        document.getElementById('close-performance')?.addEventListener('click', () => this.closeModal('modal-performance'));

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

        // Performance
        document.getElementById('btn-clear-cache')?.addEventListener('click', () => this.clearCache());
        document.getElementById('btn-optimize-memory')?.addEventListener('click', () => this.optimizeMemory());

        // Drag & Drop globale
        document.addEventListener('dragover', (e) => {
            e.preventDefault();
            e.dataTransfer.dropEffect = 'move';
        });
        
        document.addEventListener('drop', (e) => e.preventDefault());

        window.addEventListener('beforeunload', () => this.saveAllData());
    }

    // ===== GESTIONE MENU (estesa) =====
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

    // ===== PERFORMANCE MONITORING =====
    setupPerformanceMonitoring() {
        // Monitora ogni 30 secondi
        setInterval(() => {
            this.monitorPerformance();
        }, 30000);
        
        // Pulizia cache ogni ora
        setInterval(() => {
            this.cleanExpiredCache();
        }, 60 * 60 * 1000);
        
        // Mostra monitor
        this.showPerformanceMonitor();
    }

    monitorPerformance() {
        const now = Date.now();
        const uptime = (now - this.performance.startTime) / 1000;
        const hitRate = Math.round((this.performance.cacheHits / (this.performance.queriesCount || 1)) * 100);
        
        console.log('📊 Performance Report:', {
            uptime: `${Math.round(uptime)}s`,
            queries: this.performance.queriesCount,
            cacheHits: this.performance.cacheHits,
            cacheHitRate: `${hitRate}%`,
            operaiInMemory: this.operai.length,
            cantieriInMemory: this.cantieri.length,
            cachedMonths: this.cache.giornate.size
        });
        
        // Aggiorna monitor visivo
        this.updatePerformanceMonitor();
        
        // Pulizia memoria se necessario
        if (this.operai.length > 200 || this.cantieri.length > 100) {
            this.clearMemory();
        }
        
        // Pulizia cache ogni 10 minuti
        if (now - this.performance.lastCleanup > 10 * 60 * 1000) {
            this.cleanExpiredCache();
            this.performance.lastCleanup = now;
        }
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
            
            // Cambia colore in base alle performance
            if (hitRate < 50) {
                monitor.style.background = 'rgba(231, 76, 60, 0.8)';
            } else if (hitRate < 80) {
                monitor.style.background = 'rgba(230, 126, 34, 0.8)';
            } else {
                monitor.style.background = 'rgba(39, 174, 96, 0.8)';
            }
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
        this.clearMemory();
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

    clearMemory() {
        console.log('🧹 Pulizia memoria...');
        
        if (this.operai.length > 100) {
            this.operai = this.operai.slice(0, 100);
        }
        
        if (this.cantieri.length > 50) {
            this.cantieri = this.cantieri.slice(0, 50);
        }
        
        this.dataLoaded.operai = false;
        this.dataLoaded.cantieri = false;
        this.currentOperaiView = null;
    }

    // ===== METODI CORE (adattati) =====
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
            cantiere_id: operaio.cantiere,
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

    // ===== METODI SUPABASE PER GIORNATE =====
    async saveGiornataLavoro(giornata) {
        this.performance.queriesCount++;
        
        try {
            let result;
            const oreLavorate = this.calculateOreLavorate(giornata.ora_inizio, giornata.ora_fine);
            
            if (giornata.id) {
                result = await this.supabase
                    .from('giornate_lavoro')
                    .update({
                        operaio_id: giornata.operaio_id,
                        cantiere_id: giornata.cantiere_id,
                        data: giornata.data,
                        ora_inizio: giornata.ora_inizio,
                        ora_fine: giornata.ora_fine,
                        ore_lavorate: oreLavorate,
                        stato: giornata.stato,
                        note: giornata.note,
                        updated_at: new Date().toISOString()
                    })
                    .eq('id', giornata.id);
            } else {
                result = await this.supabase
                    .from('giornate_lavoro')
                    .insert([{
                        operaio_id: giornata.operaio_id,
                        cantiere_id: giornata.cantiere_id,
                        data: giornata.data,
                        ora_inizio: giornata.ora_inizio,
                        ora_fine: giornata.ora_fine,
                        ore_lavorate: oreLavorate,
                        stato: giornata.stato,
                        note: giornata.note,
                        created_at: new Date().toISOString(),
                        updated_at: new Date().toISOString()
                    }])
                    .select();
            }
            
            if (result.error) throw result.error;
            
            this.invalidateMonthCache(giornata.data);
            console.log('✅ Giornata salvata nel database');
            return result.data;
            
        } catch (error) {
            console.error('Errore salvataggio giornata:', error);
            throw error;
        }
    }

    calculateOreLavorate(oraInizio, oraFine) {
        const start = new Date(`2000-01-01T${oraInizio}`);
        const end = new Date(`2000-01-01T${oraFine}`);
        const diff = (end - start) / (1000 * 60 * 60);
        return Math.max(0, parseFloat(diff.toFixed(2)));
    }

    invalidateMonthCache(dateString) {
        const date = new Date(dateString);
        const month = date.getMonth();
        const year = date.getFullYear();
        
        const keysToDelete = [];
        this.cache.giornate.forEach((value, key) => {
            if (key.startsWith(`${year}-${month}`)) {
                keysToDelete.push(key);
            }
        });
        
        keysToDelete.forEach(key => {
            this.cache.giornate.delete(key);
            this.calendarData.loadedMonths.delete(key);
        });
        
        console.log('🗑️ Cache invalidata per mese', month, year);
    }

    // ===== STILI OTTIMIZZATI =====
    setupOptimizedStyles() {
        const style = document.createElement('style');
        style.textContent = `
            .loading {
                text-align: center;
                padding: 20px;
                color: var(--color-text-secondary);
                font-style: italic;
                background: var(--color-surface);
                border-radius: var(--radius-base);
                margin: 10px;
            }
            
            .virtual-scroll-controls {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 10px;
                background: var(--color-surface);
                border-top: 1px solid var(--color-border);
                margin-top: 10px;
                border-radius: 0 0 var(--radius-base) var(--radius-base);
            }
            
            .virtual-scroll-controls button {
                padding: 6px 12px;
                border: 1px solid var(--color-border);
                background: var(--color-surface);
                border-radius: var(--radius-sm);
                cursor: pointer;
                font-size: var(--font-size-sm);
                transition: all var(--duration-fast) var(--ease-standard);
            }
            
            .virtual-scroll-controls button:hover:not(:disabled) {
                background: var(--color-secondary);
                transform: translateY(-1px);
            }
            
            .virtual-scroll-controls button:disabled {
                opacity: 0.5;
                cursor: not-allowed;
                transform: none;
            }
            
            .performance-monitor {
                position: fixed;
                bottom: 10px;
                left: 10px;
                background: rgba(0,0,0,0.8);
                color: white;
                padding: 5px 10px;
                border-radius: var(--radius-sm);
                font-size: 10px;
                z-index: 1000;
                backdrop-filter: blur(10px);
                border: 1px solid rgba(255,255,255,0.1);
            }
            
            .work-indicator {
                position: absolute;
                top: 2px;
                right: 2px;
                background: var(--color-success);
                color: white;
                border-radius: 50%;
                width: 16px;
                height: 16px;
                font-size: 8px;
                display: flex;
                align-items: center;
                justify-content: center;
                font-weight: var(--font-weight-bold);
            }
            
            .calendar-day.has-work {
                background: linear-gradient(135deg, var(--color-bg-3), var(--color-bg-4));
                border: 2px solid var(--color-success);
            }
        `;
        document.head.appendChild(style);
    }

    // ===== METODI DI SUPPORTO =====
    updateStats() {
        document.getElementById('total-operai').textContent = this.cache.stats.totalOperai;
        document.getElementById('total-cantieri').textContent = this.cache.stats.totalCantieri;
        document.getElementById('total-giornate').textContent = this.cache.stats.totalGiornate;
        
        // Calcola operai assegnati
        const assignedOperai = this.operai.filter(o => o.cantiere !== null).length;
        document.getElementById('assigned-operai').textContent = assignedOperai;
        
        // Aggiorna info modal
        document.getElementById('info-total-operai').textContent = this.cache.stats.totalOperai;
        document.getElementById('info-total-cantieri').textContent = this.cache.stats.totalCantieri;
        document.getElementById('info-total-giornate').textContent = this.cache.stats.totalGiornate;
        document.getElementById('info-assigned-operai').textContent = assignedOperai;
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

    // ===== METODI DI GESTIONE (esistenti) =====
    toggleMenu() {
        const menu = document.getElementById('menu-dropdown');
        menu.classList.toggle('hidden');
    }

    closeMenu() {
        const menu = document.getElementById('menu-dropdown');
        menu.classList.add('hidden');
    }

    showModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) modal.classList.remove('hidden');
    }

    closeModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) modal.classList.add('hidden');
    }

    async renderApp() {
        await this.renderOperai();
        await this.renderCantieri();
        this.updateStats();
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
        
        // ... implementazione render cantieri esistente
        this.cantieri.forEach(cantiere => {
            const element = document.createElement('div');
            element.className = 'cantiere';
            element.dataset.cantiereId = cantiere.id;
            element.style.left = cantiere.x + 'px';
            element.style.top = cantiere.y + 'px';
            element.draggable = (this.currentUser.type === 'manager' || this.currentUser.type === 'master') && this.isDragDropActive;
            
            // ... setup drag/drop events
            
            const assignedCount = cantiere.operai?.length || 0;
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

    // ... altri metodi esistenti (login, logout, addOperaio, editOperaio, etc.)

    // ===== PERSISTENZA =====
    saveAllData() {
        try {
            localStorage.setItem('sse_operai', JSON.stringify(this.operai));
            localStorage.setItem('sse_cantieri', JSON.stringify(this.cantieri));
            localStorage.setItem('sse_users', JSON.stringify(this.users));
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