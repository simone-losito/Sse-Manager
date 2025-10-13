// app.js - Sse Manager Ver 1.6.4 - SUPABASE INTEGRATION
console.log('🏗️ Sse Manager - Caricamento Ver 1.6.4...');

// Configurazione Supabase - AGGIORNA QUESTE VARIABILI CON LE TUE CREDENZIALI
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
        
        // Variabili per drag & drop migliorato
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
    }

    async initSupabase() {
        try {
            // Carica dinamicamente il client Supabase
            if (typeof createClient === 'undefined') {
                console.warn('Supabase client non disponibile, uso localStorage');
                return;
            }
            
            this.supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
            
            // Test connessione
            const { data, error } = await this.supabase
                .from('operai')
                .select('count')
                .limit(1);
            
            if (error) throw error;
            
            this.supabaseConnected = true;
            console.log('✅ Connesso a Supabase');
            
        } catch (error) {
            console.warn('❌ Supabase non disponibile, uso localStorage:', error.message);
            this.supabaseConnected = false;
        }
    }

    async loadAllData() {
        await this.loadOperai();
        await this.loadCantieri();
        this.renderApp();
    }

    async loadOperai() {
        try {
            if (this.supabaseConnected) {
                const { data, error } = await this.supabase
                    .from('operai')
                    .select('*')
                    .order('id');
                
                if (error) throw error;
                
                if (data && data.length > 0) {
                    this.operai = data.map(operaio => ({
                        ...operaio,
                        cantiere: operaio.cantiere_id
                    }));
                    console.log('✅ Operai caricati da Supabase:', this.operai.length);
                    return;
                }
            }
            
            // Fallback a localStorage
            const localOperai = this.loadData('operai');
            if (localOperai && localOperai.length > 0) {
                this.operai = localOperai;
                console.log('✅ Operai caricati da localStorage:', this.operai.length);
            } else {
                // Dati predefiniti
                this.operai = [
                    {id: 1, nome: "Marco Rossi", email: "marco.rossi@standardse.it", telefono: "333-1234567", specializzazione: "Elettricista", livello: 5, cantiere: 1, avatar: "⚡", preposto: true},
                    {id: 2, nome: "Giuseppe Bianchi", email: "giuseppe.bianchi@standardse.it", telefono: "335-2345678", specializzazione: "Meccanico", livello: 4, cantiere: 1, avatar: "🔧", preposto: false},
                    {id: 3, nome: "Antonio Verde", email: "antonio.verde@standardse.it", telefono: "338-3456789", specializzazione: "Elettricista", livello: 3, cantiere: 2, avatar: "⚡", preposto: false},
                    {id: 4, nome: "Francesco Neri", email: "francesco.neri@standardse.it", telefono: "339-4567890", specializzazione: "Meccanico", livello: 5, cantiere: 2, avatar: "🔧", preposto: true},
                    {id: 5, nome: "Luigi Viola", email: "luigi.viola@standardse.it", telefono: "340-5678901", specializzazione: "Elettricista", livello: 2, cantiere: null, avatar: "⚡", preposto: false},
                    {id: 6, nome: "Salvatore Blu", email: "salvatore.blu@standardse.it", telefono: "346-6789012", specializzazione: "Meccanico", livello: 3, cantiere: null, avatar: "🔧", preposto: false}
                ];
                console.log('✅ Operai caricati da dati predefiniti');
            }
            
        } catch (error) {
            console.error('❌ Errore caricamento operai:', error);
            // Fallback completo
            const localOperai = this.loadData('operai');
            this.operai = localOperai || [];
        }
    }

    async loadCantieri() {
        try {
            if (this.supabaseConnected) {
                const { data, error } = await this.supabase
                    .from('cantieri')
                    .select('*')
                    .order('id');
                
                if (error) throw error;
                
                if (data && data.length > 0) {
                    // Carica le assegnazioni operai per ogni cantiere
                    for (let cantiere of data) {
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
                    
                    this.cantieri = data;
                    console.log('✅ Cantieri caricati da Supabase:', this.cantieri.length);
                    return;
                }
            }
            
            // Fallback a localStorage
            const localCantieri = this.loadData('cantieri');
            if (localCantieri && localCantieri.length > 0) {
                this.cantieri = localCantieri;
                console.log('✅ Cantieri caricati da localStorage:', this.cantieri.length);
            } else {
                // Dati predefiniti
                this.cantieri = [
                    {id: 1, nome: "Palazzo Roma Centro", indirizzo: "Via Roma 123, Roma", tipo: "Civile", x: 150, y: 200, operai: [1, 2], calendarSelections: {}, timeSlot: {start: "08:00", end: "17:00"}},
                    {id: 2, nome: "Impianto Industriale Ostia", indirizzo: "Via del Mare 45, Ostia", tipo: "Industriale", x: 400, y: 300, operai: [4, 3], calendarSelections: {}, timeSlot: {start: "07:00", end: "16:00"}},
                    {id: 3, nome: "Ristrutturazione Trastevere", indirizzo: "Viale Trastevere 78, Roma", tipo: "Residenziale", x: 300, y: 150, operai: [], calendarSelections: {}, timeSlot: {start: "08:30", end: "17:30"}}
                ];
                console.log('✅ Cantieri caricati da dati predefiniti');
            }
            
        } catch (error) {
            console.error('❌ Errore caricamento cantieri:', error);
            // Fallback completo
            const localCantieri = this.loadData('cantieri');
            this.cantieri = localCantieri || [];
        }
    }

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

            let error;
            if (operaio.id) {
                // Update
                const { error: updateError } = await this.supabase
                    .from('operai')
                    .update(operaioData)
                    .eq('id', operaio.id);
                error = updateError;
            } else {
                // Insert
                const { data, error: insertError } = await this.supabase
                    .from('operai')
                    .insert([operaioData])
                    .select();
                error = insertError;
                
                if (data && data[0]) {
                    operaio.id = data[0].id; // Aggiorna ID con quello generato da Supabase
                }
            }

            if (error) throw error;
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

            let error;
            if (cantiere.id) {
                // Update
                const { error: updateError } = await this.supabase
                    .from('cantieri')
                    .update(cantiereData)
                    .eq('id', cantiere.id);
                error = updateError;
            } else {
                // Insert
                const { data, error: insertError } = await this.supabase
                    .from('cantieri')
                    .insert([cantiereData])
                    .select();
                error = insertError;
                
                if (data && data[0]) {
                    cantiere.id = data[0].id; // Aggiorna ID con quello generato da Supabase
                }
            }

            if (error) throw error;
            return true;
            
        } catch (error) {
            console.error('❌ Errore salvataggio cantiere su Supabase:', error);
            return false;
        }
    }

    async updateAssegnazioneOperaio(operaioId, cantiereId) {
        if (!this.supabaseConnected) return false;
        
        try {
            // Rimuovi tutte le assegnazioni esistenti per questo operaio
            const { error: deleteError } = await this.supabase
                .from('assegnazioni_operai')
                .delete()
                .eq('operaio_id', operaioId);
            
            if (deleteError) throw deleteError;
            
            // Se c'è un cantiere, aggiungi la nuova assegnazione
            if (cantiereId) {
                const { error: insertError } = await this.supabase
                    .from('assegnazioni_operai')
                    .insert([{
                        operaio_id: operaioId,
                        cantiere_id: cantiereId
                    }]);
                
                if (insertError) throw insertError;
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
            const { error } = await this.supabase
                .from('cantieri')
                .update({
                    coordinate_x: x,
                    coordinate_y: y,
                    updated_at: new Date().toISOString()
                })
                .eq('id', cantiereId);
            
            if (error) throw error;
            return true;
            
        } catch (error) {
            console.error('❌ Errore aggiornamento posizione cantiere:', error);
            return false;
        }
    }

    // RESTANTE CODICE IDENTICO ALLA VERSIONE PRECEDENTE
    // [Tutte le altre funzioni rimangono identiche...]

    setupEventListeners() {
        // [Codice identico alla versione 1.6.3...]
    }

    handleMenuAction(action) {
        // [Codice identico alla versione 1.6.3...]
    }

    // AGGIORNAMENTO FUNZIONI DI SALVATAGGIO PER SUPABASE

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
        if (id) {
            operaio = this.operai.find(o => o.id == id);
            if (operaio) {
                Object.assign(operaio, {
                    nome, email, telefono, specializzazione, livello, preposto,
                    avatar: avatarMap[specializzazione] || '👷'
                });
            }
        } else {
            const newId = Math.max(0, ...this.operai.map(o => o.id)) + 1;
            operaio = {
                id: newId, nome, email, telefono, specializzazione, livello, 
                cantiere: null, avatar: avatarMap[specializzazione] || '👷', preposto
            };
            this.operai.push(operaio);
        }
        
        // Salva su Supabase
        const success = await this.saveOperaioToSupabase(operaio);
        
        // Doppio salvataggio per sicurezza
        this.saveAllData();
        
        this.closeModal('modal-operaio');
        this.renderApp();
        
        if (success) {
            alert('✅ Operaio salvato con successo (Supabase)');
        } else {
            alert('✅ Operaio salvato con successo (localStorage)');
        }
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
        if (id) {
            cantiere = this.cantieri.find(c => c.id == id);
            if (cantiere) {
                cantiere.nome = nome;
                cantiere.indirizzo = indirizzo;
                cantiere.tipo = tipo;
            }
        } else {
            const newId = Math.max(0, ...this.cantieri.map(c => c.id)) + 1;
            cantiere = {
                id: newId, nome, indirizzo, tipo,
                x: Math.random() * 400 + 100, y: Math.random() * 300 + 100,
                operai: [], calendarSelections: {}, timeSlot: {start: "08:00", end: "17:00"}
            };
            this.cantieri.push(cantiere);
        }
        
        // Salva su Supabase
        const success = await this.saveCantiereToSupabase(cantiere);
        
        // Doppio salvataggio per sicurezza
        this.saveAllData();
        
        this.closeModal('modal-cantiere');
        this.renderCantieri();
        
        if (success) {
            alert('✅ Cantiere salvato con successo (Supabase)');
        } else {
            alert('✅ Cantiere salvato con successo (localStorage)');
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
        if (!cantiere.operai.includes(operaioId)) {
            cantiere.operai.push(operaioId);
        }
        
        // Aggiorna su Supabase
        await this.updateAssegnazioneOperaio(operaioId, cantiereId);
        
        this.renderApp();
        this.saveAllData();
    }

    async unassignOperaioFromAnyCantiere(operaioId) {
        const operaio = this.operai.find(o => o.id === operaioId);
        if (!operaio || !operaio.cantiere) return;
        
        const cantiere = this.cantieri.find(c => c.id === operaio.cantiere);
        if (cantiere) {
            cantiere.operai = cantiere.operai.filter(id => id !== operaioId);
        }
        
        operaio.cantiere = null;
        
        // Aggiorna su Supabase
        await this.updateAssegnazioneOperaio(operaioId, null);
        
        this.renderApp();
        this.saveAllData();
    }

    // AGGIUNTA: Funzione per aggiornare posizione cantiere durante il drag
    async updateCantierePosition(cantiereId, x, y) {
        const cantiere = this.cantieri.find(c => c.id === cantiereId);
        if (cantiere) {
            cantiere.x = x;
            cantiere.y = y;
            
            // Aggiorna su Supabase
            await this.updatePosizioneCantiere(cantiereId, x, y);
            
            this.saveAllData();
        }
    }

    // [Tutte le altre funzioni rimangono identiche...]
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

// Aggiungi indicatore stato Supabase
document.addEventListener('DOMContentLoaded', function() {
    const statusDiv = document.createElement('div');
    statusDiv.id = 'supabase-status';
    statusDiv.className = 'supabase-status';
    document.body.appendChild(statusDiv);
    
    // Aggiorna stato periodicamente
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