// app.js - Sse Manager Ver 1.6.4 - SUPABASE OPZIONALE
console.log('🏗️ Sse Manager - Caricamento Ver 1.6.4...');

// Configurazione Supabase - CREDENZIALI CONFIGURATE
const SUPABASE_URL = 'https://ycikmgjwxfwgkmnreeft.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InljaWttZ2p3eGZ3Z2ttbnJlZWZ0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAyOTczOTAsImV4cCI6MjA3NTg3MzM5MH0.e1YfxKavtEotky-Tlh2B4tPKbyGLvgJ0d6-RmtGaVfY';

class SseManager {
    constructor() {
        this.supabase = null;
        this.supabaseConnected = false;
        this.operai = [];
        this.cantieri = [];
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
        
        this.dragOffsetX = 0;
        this.dragOffsetY = 0;

        this.init();
    }

    async init() {
        console.log('🚀 Inizializzazione Sse Manager Ver 1.6.4');
        await this.initSupabase();
        await this.loadAllData();
        this.setupEventListeners();
        this.updateStats();
        this.setupAutoSave();
        this.showConnectionStatus();
    }

    async initSupabase() {
        try {
            // Controlla se Supabase è disponibile globalmente
            if (typeof createClient === 'undefined') {
                console.warn('⚠️ Supabase client non disponibile');
                this.supabaseConnected = false;
                return;
            }
            
            this.supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
            
            // Test connessione con timeout
            const timeoutPromise = new Promise((_, reject) => 
                setTimeout(() => reject(new Error('Timeout')), 5000)
            );
            
            const supabasePromise = this.supabase
                .from('operai')
                .select('count')
                .limit(1);
            
            await Promise.race([supabasePromise, timeoutPromise]);
            
            this.supabaseConnected = true;
            console.log('✅ Connesso a Supabase');
            
        } catch (error) {
            console.warn('❌ Supabase non disponibile, uso localStorage:', error.message);
            this.supabaseConnected = false;
            // Continua comunque con localStorage
        }
    }

    showConnectionStatus() {
        const statusMessage = this.supabaseConnected 
            ? '🗄️ Supabase: Connesso' 
            : '🗄️ Supabase: Offline - usando localStorage';
        
        const headerLeft = document.querySelector('.header-left');
        if (headerLeft && !document.getElementById('connection-status')) {
            const statusEl = document.createElement('div');
            statusEl.id = 'connection-status';
            statusEl.style.cssText = `
                font-size: 12px;
                color: ${this.supabaseConnected ? '#27ae60' : '#e74c3c'};
                margin-top: 5px;
                font-weight: bold;
            `;
            statusEl.textContent = statusMessage;
            headerLeft.appendChild(statusEl);
        }
    }

    async loadAllData() {
        // Carica prima da localStorage per velocità
        this.loadFromLocalStorage();
        
        // Poi prova a caricare da Supabase (se connesso)
        if (this.supabaseConnected) {
            await this.loadFromSupabase();
        }
        
        this.renderApp();
    }

    loadFromLocalStorage() {
        // Carica operai
        const localOperai = this.loadData('operai');
        if (localOperai && localOperai.length > 0) {
            this.operai = localOperai;
            console.log('✅ Operai caricati da localStorage:', this.operai.length);
        } else {
            this.operai = this.getDefaultOperai();
            console.log('✅ Operai caricati da dati predefiniti');
        }

        // Carica cantieri
        const localCantieri = this.loadData('cantieri');
        if (localCantieri && localCantieri.length > 0) {
            this.cantieri = localCantieri;
            console.log('✅ Cantieri caricati da localStorage:', this.cantieri.length);
        } else {
            this.cantieri = this.getDefaultCantieri();
            console.log('✅ Cantieri caricati da dati predefiniti');
        }
    }

    async loadFromSupabase() {
        if (!this.supabaseConnected) return;

        try {
            // Carica operai da Supabase
            const { data: operaiData, error: operaiError } = await this.supabase
                .from('operai')
                .select('*')
                .order('id');
            
            if (!operaiError && operaiData && operaiData.length > 0) {
                this.operai = operaiData.map(operaio => ({
                    ...operaio,
                    cantiere: operaio.cantiere_id
                }));
                console.log('✅ Operai caricati da Supabase:', this.operai.length);
            }

            // Carica cantieri da Supabase
            const { data: cantieriData, error: cantieriError } = await this.supabase
                .from('cantieri')
                .select('*')
                .order('id');
            
            if (!cantieriError && cantieriData && cantieriData.length > 0) {
                for (let cantiere of cantieriData) {
                    // Carica assegnazioni per ogni cantiere
                    const { data: assegnazioni, error: errAssegnazioni } = await this.supabase
                        .from('assegnazioni_operai')
                        .select('operaio_id')
                        .eq('cantiere_id', cantiere.id);
                    
                    if (!errAssegnazioni && assegnazioni) {
                        cantiere.operai = assegnazioni.map(a => a.operaio_id);
                    } else {
                        cantiere.operai = [];
                    }
                    
                    cantiere.x = cantiere.coordinate_x || 100;
                    cantiere.y = cantiere.coordinate_y || 100;
                    cantiere.timeSlot = {
                        start: cantiere.time_slot_start || "08:00",
                        end: cantiere.time_slot_end || "17:00"
                    };
                    cantiere.calendarSelections = {};
                }
                
                this.cantieri = cantieriData;
                console.log('✅ Cantieri caricati da Supabase:', this.cantieri.length);
            }
            
        } catch (error) {
            console.error('❌ Errore caricamento da Supabase:', error);
            // In caso di errore, mantieni i dati di localStorage
        }
    }

    getDefaultOperai() {
        return [
            {id: 1, nome: "Marco Rossi", email: "marco.rossi@standardse.it", telefono: "333-1234567", specializzazione: "Elettricista", livello: 5, cantiere: 1, avatar: "⚡", preposto: true},
            {id: 2, nome: "Giuseppe Bianchi", email: "giuseppe.bianchi@standardse.it", telefono: "335-2345678", specializzazione: "Meccanico", livello: 4, cantiere: 1, avatar: "🔧", preposto: false},
            {id: 3, nome: "Antonio Verde", email: "antonio.verde@standardse.it", telefono: "338-3456789", specializzazione: "Elettricista", livello: 3, cantiere: 2, avatar: "⚡", preposto: false},
            {id: 4, nome: "Francesco Neri", email: "francesco.neri@standardse.it", telefono: "339-4567890", specializzazione: "Meccanico", livello: 5, cantiere: 2, avatar: "🔧", preposto: true},
            {id: 5, nome: "Luigi Viola", email: "luigi.viola@standardse.it", telefono: "340-5678901", specializzazione: "Elettricista", livello: 2, cantiere: null, avatar: "⚡", preposto: false},
            {id: 6, nome: "Salvatore Blu", email: "salvatore.blu@standardse.it", telefono: "346-6789012", specializzazione: "Meccanico", livello: 3, cantiere: null, avatar: "🔧", preposto: false}
        ];
    }

    getDefaultCantieri() {
        return [
            {id: 1, nome: "Palazzo Roma Centro", indirizzo: "Via Roma 123, Roma", tipo: "Civile", x: 150, y: 200, operai: [1, 2], calendarSelections: {}, timeSlot: {start: "08:00", end: "17:00"}},
            {id: 2, nome: "Impianto Industriale Ostia", indirizzo: "Via del Mare 45, Ostia", tipo: "Industriale", x: 400, y: 300, operai: [4, 3], calendarSelections: {}, timeSlot: {start: "07:00", end: "16:00"}},
            {id: 3, nome: "Ristrutturazione Trastevere", indirizzo: "Viale Trastevere 78, Roma", tipo: "Residenziale", x: 300, y: 150, operai: [], calendarSelections: {}, timeSlot: {start: "08:30", end: "17:30"}}
        ];
    }

    // FUNZIONI SUPABASE - ORA SONO OPPORTUNISTICHE
    async saveOperaioToSupabase(operaio) {
        if (!this.supabaseConnected) return false;
        
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
                await this.supabase
                    .from('operai')
                    .update(operaioData)
                    .eq('id', operaio.id);
            } else {
                const { data } = await this.supabase
                    .from('operai')
                    .insert([operaioData])
                    .select();
                
                if (data && data[0]) {
                    operaio.id = data[0].id;
                }
            }
            return true;
            
        } catch (error) {
            console.error('❌ Errore salvataggio operaio su Supabase:', error);
            return false;
        }
    }

    async saveCantiereToSupabase(cantiere) {
        if (!this.supabaseConnected) return false;
        
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
                await this.supabase
                    .from('cantieri')
                    .update(cantiereData)
                    .eq('id', cantiere.id);
            } else {
                const { data } = await this.supabase
                    .from('cantieri')
                    .insert([cantiereData])
                    .select();
                
                if (data && data[0]) {
                    cantiere.id = data[0].id;
                }
            }
            return true;
            
        } catch (error) {
            console.error('❌ Errore salvataggio cantiere su Supabase:', error);
            return false;
        }
    }

    async updateAssegnazioneOperaio(operaioId, cantiereId) {
        if (!this.supabaseConnected) return false;
        
        try {
            await this.supabase
                .from('assegnazioni_operai')
                .delete()
                .eq('operaio_id', operaioId);
            
            if (cantiereId) {
                await this.supabase
                    .from('assegnazioni_operai')
                    .insert([{
                        operaio_id: operaioId,
                        cantiere_id: cantiereId
                    }]);
            }
            return true;
            
        } catch (error) {
            console.error('❌ Errore aggiornamento assegnazione:', error);
            return false;
        }
    }

    async updatePosizioneCantiere(cantiereId, x, y) {
        if (!this.supabaseConnected) return false;
        
        try {
            await this.supabase
                .from('cantieri')
                .update({
                    coordinate_x: Math.round(x),
                    coordinate_y: Math.round(y),
                    updated_at: new Date().toISOString()
                })
                .eq('id', cantiereId);
            return true;
            
        } catch (error) {
            console.error('❌ Errore aggiornamento posizione cantiere:', error);
            return false;
        }
    }

    // [RESTANTE CODICE IDENTICO - TUTTE LE ALTRE FUNZIONI RIMANGONO]
    // setupEventListeners, handleMenuAction, renderOperai, renderCantieri, ecc...
    // ... (tutto il resto del codice rimane identico)

    setupEventListeners() {
        // [CODICE IDENTICO...]
        document.getElementById('login-btn').addEventListener('click', () => this.login());
        document.getElementById('login-password').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.login();
        });

        // [TUTTO IL RESTO DEL CODICE RIMANE IDENTICO...]
    }

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

    // [TUTTE LE ALTRE FUNZIONI RIMANGONO IDENTICHE...]
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
    
    .supabase-status {
        position: fixed;
        bottom: 10px;
        left: 10px;
        padding: 5px 10px;
        border-radius: 4px;
        font-size: 12px;
        font-weight: bold;
        z-index: 1000;
    }
    
    .supabase-connected {
        background: #27ae60;
        color: white;
    }
    
    .supabase-disconnected {
        background: #e74c3c;
        color: white;
    }
`;
document.head.appendChild(style);

document.addEventListener('DOMContentLoaded', function() {
    const statusDiv = document.createElement('div');
    statusDiv.id = 'supabase-status';
    statusDiv.className = 'supabase-status';
    document.body.appendChild(statusDiv);
    
    setInterval(() => {
        const statusEl = document.getElementById('supabase-status');
        if (statusEl) {
            if (app.supabaseConnected) {
                statusEl.textContent = '🗄️ Supabase: Connesso';
                statusEl.className = 'supabase-status supabase-connected';
            } else {
                statusEl.textContent = '🗄️ Supabase: Offline';
                statusEl.className = 'supabase-status supabase-disconnected';
            }
        }
    }, 5000);
});