// app.js - Sse Manager Ver 1.6.4 - OTTIMIZZATO PER GRANDI DATASET
console.log('🏗️ Sse Manager - Caricamento OTTIMIZZATO per grandi volumi...');

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
        
        // Performance monitoring
        this.performance = {
            startTime: Date.now(),
            queriesCount: 0,
            cacheHits: 0
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
    }

    // ===== CARICAMENTO DATI ESSENZIALI =====
    async loadEssentialData() {
        console.log('📊 Caricamento dati essenziali...');
        
        // Carica solo statistiche e dati minimi
        if (this.supabaseConfigured) {
            try {
                // Carica conteggi in parallelo
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
                    .limit(1000); // Limite di sicurezza
                
                if (error) throw error;
                
                this.operai = data || [];
                this.dataLoaded.operai = true;
                
                // Aggiorna cache
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
                    .limit(500); // Limite di sicurezza
                
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

    // ===== SISTEMA AVANZATO PER GIORNATE DI LAVORO =====
    async loadGiornateForMonth(month, year, cantiereId = null) {
        const cacheKey = `${year}-${month}-${cantiereId}`;
        
        // Controlla cache
        if (this.cache.giornate.has(cacheKey)) {
            this.performance.cacheHits++;
            return this.cache.giornate.get(cacheKey);
        }
        
        console.log(`📅 Caricamento giornate per ${month}/${year}...`);
        this.performance.queriesCount++;
        
        // Calcola range date del mese
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
            
            // Filtra per cantiere se specificato
            if (cantiereId) {
                query = query.eq('cantiere_id', cantiereId);
            }
            
            const { data, error } = await query;
            
            if (error) throw error;
            
            // Organizza dati per accesso rapido
            const organizedData = this.organizeGiornateData(data || []);
            
            // Salva in cache (con expiration)
            this.cache.giornate.set(cacheKey, {
                data: organizedData,
                timestamp: Date.now(),
                expires: Date.now() + (5 * 60 * 1000) // 5 minuti
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
        // Organizza per data e operaio per accesso O(1)
        const organized = {
            byDate: new Map(),      // data -> [giornate]
            byOperaio: new Map(),   // operaio_id -> [giornate]
            byCantiere: new Map()   // cantiere_id -> [giornate]
        };
        
        giornate.forEach(giornata => {
            // Per data
            const dateKey = giornata.data;
            if (!organized.byDate.has(dateKey)) {
                organized.byDate.set(dateKey, []);
            }
            organized.byDate.get(dateKey).push(giornata);
            
            // Per operaio
            if (!organized.byOperaio.has(giornata.operaio_id)) {
                organized.byOperaio.set(giornata.operaio_id, []);
            }
            organized.byOperaio.get(giornata.operaio_id).push(giornata);
            
            // Per cantiere
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
        
        // Mostra loading
        container.innerHTML = '<div class="loading">🔄 Caricamento operai...</div>';
        
        // Carica dati (lazy)
        await this.loadOperaiLazy();
        
        // Ora renderizza
        container.innerHTML = '';
        const filteredOperai = this.getFilteredOperai();
        
        // Virtual scrolling per grandi liste
        if (filteredOperai.length > 50) {
            this.renderOperaiVirtual(container, filteredOperai);
        } else {
            this.renderOperaiNormal(container, filteredOperai);
        }
    }

    renderOperaiVirtual(container, operai) {
        console.log('🎯 Usando virtual scrolling per', operai.length, 'operai');
        
        // Implementazione base virtual scrolling
        const visibleCount = 20; // Operai visibili contemporaneamente
        let startIndex = 0;
        
        const renderChunk = () => {
            const endIndex = Math.min(startIndex + visibleCount, operai.length);
            const chunk = operai.slice(startIndex, endIndex);
            
            let html = '';
            chunk.forEach(operaio => {
                html += this.createOperaioCardHTML(operaio);
            });
            
            container.innerHTML = html;
            
            // Aggiungi pulsanti navigazione
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

    scrollOperai(delta) {
        if (!this.currentOperaiView) return;
        
        const newStart = this.currentOperaiView.startIndex + delta;
        if (newStart >= 0 && newStart < this.currentOperaiView.operai.length) {
            this.currentOperaiView.startIndex = newStart;
            this.currentOperaiView.renderChunk();
        }
    }

    // ===== CALENDARIO OTTIMIZZATO =====
    async renderCalendar() {
        if (!this.currentCantiereId) return;
        
        const container = document.getElementById('calendar-grid');
        if (!container) return;
        
        // Mostra loading
        container.innerHTML = '<div class="loading">📅 Caricamento calendario...</div>';
        
        // Carica giornate per il mese corrente
        const giornateData = await this.loadGiornateForMonth(
            this.calendarData.currentMonth,
            this.calendarData.currentYear,
            this.currentCantiereId
        );
        
        // Renderizza calendario
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
        
        // Intestazioni giorni
        dayNames.forEach(day => {
            calendarHtml += `<div class="calendar-day-header">${day}</div>`;
        });
        
        // Giorni del calendario
        const current = new Date(startDate);
        for (let i = 0; i < 42; i++) {
            const dayNum = current.getDate();
            const isCurrentMonth = current.getMonth() === this.calendarData.currentMonth;
            const dateKey = current.toISOString().split('T')[0];
            
            const giornateDelGiorno = giornateData.byDate.get(dateKey) || [];
            const hasGiornate = giornateDelGiorno.length > 0;
            
            let dayClass = 'calendar-day';
            if (!isCurrentMonth) dayClass += ' other-month';
            if (hasGiornate) dayClass += ' has-work';
            if (giornateDelGiorno.some(g => g.stato === 'completato')) dayClass += ' completed';
            
            calendarHtml += `
                <div class="${dayClass}" data-date="${current.toISOString()}">
                    ${dayNum}
                    ${hasGiornate ? `<div class="work-indicator">👷 ${giornateDelGiorno.length}</div>` : ''}
                </div>
            `;
            current.setDate(current.getDate() + 1);
        }
        
        container.innerHTML = calendarHtml;
        
        // Aggiungi event listeners
        document.querySelectorAll('.calendar-day').forEach(day => {
            day.addEventListener('click', () => {
                this.selectCalendarDay(day.dataset.date);
            });
        });
    }

    // ===== GESTIONE GIORNATE DI LAVORO =====
    async saveGiornataLavoro(giornata) {
        this.performance.queriesCount++;
        
        try {
            let result;
            
            if (giornata.id) {
                // Update
                result = await this.supabase
                    .from('giornate_lavoro')
                    .update({
                        operaio_id: giornata.operaio_id,
                        cantiere_id: giornata.cantiere_id,
                        data: giornata.data,
                        ora_inizio: giornata.ora_inizio,
                        ora_fine: giornata.ora_fine,
                        ore_lavorate: this.calculateOreLavorate(giornata.ora_inizio, giornata.ora_fine),
                        stato: giornata.stato,
                        note: giornata.note,
                        updated_at: new Date().toISOString()
                    })
                    .eq('id', giornata.id);
            } else {
                // Insert
                result = await this.supabase
                    .from('giornate_lavoro')
                    .insert([{
                        operaio_id: giornata.operaio_id,
                        cantiere_id: giornata.cantiere_id,
                        data: giornata.data,
                        ora_inizio: giornata.ora_inizio,
                        ora_fine: giornata.ora_fine,
                        ore_lavorate: this.calculateOreLavorate(giornata.ora_inizio, giornata.ora_fine),
                        stato: giornata.stato,
                        note: giornata.note,
                        created_at: new Date().toISOString(),
                        updated_at: new Date().toISOString()
                    }])
                    .select();
            }
            
            if (result.error) throw result.error;
            
            // Invalida cache del mese
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
        const diff = (end - start) / (1000 * 60 * 60); // Differenza in ore
        return Math.max(0, diff); // Evita valori negativi
    }

    invalidateMonthCache(dateString) {
        const date = new Date(dateString);
        const month = date.getMonth();
        const year = date.getFullYear();
        
        // Invalida tutte le cache per questo mese
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

    // ===== PERFORMANCE MONITORING =====
    setupPerformanceMonitoring() {
        // Monitora memoria ogni 30 secondi
        setInterval(() => {
            this.monitorPerformance();
        }, 30000);
        
        // Pulizia cache ogni ora
        setInterval(() => {
            this.cleanExpiredCache();
        }, 60 * 60 * 1000);
    }

    monitorPerformance() {
        const now = Date.now();
        const uptime = (now - this.performance.startTime) / 1000;
        
        console.log('📊 Performance Report:', {
            uptime: `${Math.round(uptime)}s`,
            queries: this.performance.queriesCount,
            cacheHits: this.performance.cacheHits,
            cacheHitRate: `${Math.round((this.performance.cacheHits / (this.performance.queriesCount || 1)) * 100)}%`,
            operaiInMemory: this.operai.length,
            cantieriInMemory: this.cantieri.length,
            cachedMonths: this.cache.giornate.size
        });
        
        // Pulizia memoria se necessario
        if (this.operai.length > 200 || this.cantieri.length > 100) {
            this.clearMemory();
        }
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
        
        // Mantieni solo dati recenti
        if (this.operai.length > 100) {
            this.operai = this.operai.slice(0, 100); // Mantieni primi 100
        }
        
        if (this.cantieri.length > 50) {
            this.cantieri = this.cantieri.slice(0, 50); // Mantieni primi 50
        }
        
        // Forza ricaricamento al prossimo accesso
        this.dataLoaded.operai = false;
        this.dataLoaded.cantieri = false;
    }

    // ===== METODI ESISTENTI ADATTATI =====
    async saveOperaio() {
        // ... implementazione esistente ma con cache update
        await this.loadOperaiLazy(); // Assicurati dati caricati
        // ... resto del codice
        
        // Invalida cache operai
        this.dataLoaded.operai = false;
        this.cache.operai.clear();
    }

    // ... altri metodi adattati per lazy loading

    // ===== NUOVI STILI CSS =====
    setupOptimizedStyles() {
        const style = document.createElement('style');
        style.textContent = `
            .loading {
                text-align: center;
                padding: 20px;
                color: var(--color-text-secondary);
                font-style: italic;
            }
            
            .virtual-scroll-controls {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 10px;
                background: var(--color-surface);
                border-top: 1px solid var(--color-border);
                margin-top: 10px;
            }
            
            .virtual-scroll-controls button {
                padding: 5px 10px;
                border: 1px solid var(--color-border);
                background: var(--color-surface);
                border-radius: var(--radius-sm);
                cursor: pointer;
            }
            
            .virtual-scroll-controls button:disabled {
                opacity: 0.5;
                cursor: not-allowed;
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
            }
            
            .calendar-day.has-work {
                background: linear-gradient(135deg, var(--color-bg-3), var(--color-bg-4));
            }
            
            .calendar-day.completed {
                border: 2px solid var(--color-success);
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
            }
        `;
        document.head.appendChild(style);
    }
}

// Inizializza l'applicazione
const app = new SseManager();