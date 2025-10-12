// app.js - Sse Manager Ver 1.4
console.log('🏗️ Sse Manager - Caricamento Ver 1.4...');

class SseManager {
    constructor() {
        this.operai = [
            {id: 1, nome: "Marco Rossi", email: "marco.rossi@standardse.it", telefono: "333-1234567", specializzazione: "Elettricista", livello: 5, cantiere: 1, avatar: "⚡", preposto: true},
            {id: 2, nome: "Giuseppe Bianchi", email: "giuseppe.bianchi@standardse.it", telefono: "335-2345678", specializzazione: "Meccanico", livello: 4, cantiere: 1, avatar: "🔧", preposto: false},
            {id: 3, nome: "Antonio Verde", email: "antonio.verde@standardse.it", telefono: "338-3456789", specializzazione: "Elettricista", livello: 3, cantiere: 2, avatar: "⚡", preposto: false},
            {id: 4, nome: "Francesco Neri", email: "francesco.neri@standardse.it", telefono: "339-4567890", specializzazione: "Meccanico", livello: 5, cantiere: 2, avatar: "🔧", preposto: true},
            {id: 5, nome: "Luigi Viola", email: "luigi.viola@standardse.it", telefono: "340-5678901", specializzazione: "Elettricista", livello: 2, cantiere: null, avatar: "⚡", preposto: false},
            {id: 6, nome: "Salvatore Blu", email: "salvatore.blu@standardse.it", telefono: "346-6789012", specializzazione: "Meccanico", livello: 3, cantiere: null, avatar: "🔧", preposto: false}
        ];

        this.cantieri = [
            {id: 1, nome: "Palazzo Roma Centro", indirizzo: "Via Roma 123, Roma", tipo: "Civile", x: 150, y: 200, operai: [1, 2], calendarSelections: {}, timeSlot: {start: "08:00", end: "17:00"}},
            {id: 2, nome: "Impianto Industriale Ostia", indirizzo: "Via del Mare 45, Ostia", tipo: "Industriale", x: 400, y: 300, operai: [4, 3], calendarSelections: {}, timeSlot: {start: "07:00", end: "16:00"}},
            {id: 3, nome: "Ristrutturazione Trastevere", indirizzo: "Viale Trastevere 78, Roma", tipo: "Residenziale", x: 300, y: 150, operai: [], calendarSelections: {}, timeSlot: {start: "08:30", end: "17:30"}}
        ];

        this.draggedOperaio = null;
        this.draggedCantiere = null;
        this.isDragDropActive = false;
        this.currentCantiereId = null;
        this.currentMonth = new Date().getMonth();
        this.currentYear = new Date().getFullYear();

        this.init();
    }

    init() {
        console.log('🚀 Inizializzazione Sse Manager Ver 1.4');
        this.setupEventListeners();
        this.updateStats();
        console.log('✅ App inizializzata correttamente');
    }

    setupEventListeners() {
        // Login
        document.getElementById('login-btn').addEventListener('click', () => this.loginMaster());
        
        // Menu
        document.getElementById('menu-btn').addEventListener('click', () => this.toggleMenu());
        
        // Menu items
        document.querySelectorAll('.menu-item').forEach(item => {
            item.addEventListener('click', (e) => {
                const action = e.target.dataset.action;
                this.handleMenuAction(action);
            });
        });

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
    }

    // ===== STATISTICHE AGGIORNATE =====
    updateStats() {
        const totalOperai = this.operai.length;
        const assignedOperai = this.operai.filter(o => o.cantiere !== null).length;
        const totalCantieri = this.cantieri.length;
        
        document.getElementById('total-operai').textContent = totalOperai;
        document.getElementById('assigned-operai').textContent = assignedOperai;
        document.getElementById('total-cantieri').textContent = totalCantieri;
    }

    // ===== RICERCA OPERAI MIGLIORATA =====
    renderOperai() {
        const container = document.getElementById('operai-container');
        const controls = document.getElementById('controls-operai');
        
        controls.innerHTML = '<button class="btn btn-primary" id="add-operaio-btn">+ Aggiungi Operaio</button>';
        document.getElementById('add-operaio-btn').addEventListener('click', () => this.addOperaio());
        
        container.innerHTML = '';
        
        // Mostra TUTTI gli operai (disponibili e assegnati)
        this.operai.forEach(operaio => {
            const card = document.createElement('div');
            card.className = 'operaio-card';
            if (operaio.cantiere !== null) {
                card.classList.add('assigned');
            }
            card.draggable = true;
            card.dataset.operaioId = operaio.id;
            card.innerHTML = this.getOperaioCardHTML(operaio);
            
            this.setupOperaioDrag(card, operaio);
            container.appendChild(card);
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
            <div class="operaio-actions">
                <button class="btn btn-edit" data-operaio-id="${operaio.id}">✏️</button>
                <button class="btn btn-delete" data-operaio-id="${operaio.id}">🗑️</button>
            </div>
        `;
    }

    // ===== FILTRO OPERAI AVANZATO =====
    filterOperai() {
        const searchTerm = document.getElementById('search-operai').value.toLowerCase().trim();
        const specializzazioneFilter = document.getElementById('filter-specializzazione').value;
        const livelloFilter = document.getElementById('filter-livello').value;
        const prepostoFilter = document.getElementById('filter-preposto').value;
        
        const operaiCards = document.querySelectorAll('.operaio-card');
        
        operaiCards.forEach(card => {
            const operaioId = parseInt(card.dataset.operaioId);
            const operaio = this.operai.find(o => o.id === operaioId);
            
            if (!operaio) {
                card.style.display = 'none';
                return;
            }
            
            // Filtro per testo (nome, specializzazione, email, telefono)
            const matchesSearch = !searchTerm || 
                operaio.nome.toLowerCase().includes(searchTerm) ||
                operaio.specializzazione.toLowerCase().includes(searchTerm) ||
                operaio.email.toLowerCase().includes(searchTerm) ||
                operaio.telefono.includes(searchTerm);
            
            // Filtro per specializzazione
            const matchesSpecializzazione = !specializzazioneFilter || 
                operaio.specializzazione === specializzazioneFilter;
            
            // Filtro per livello
            const matchesLivello = !livelloFilter || 
                operaio.livello.toString() === livelloFilter;
            
            // Filtro per preposto
            const matchesPreposto = !prepostoFilter || 
                (prepostoFilter === 'si' && operaio.preposto) ||
                (prepostoFilter === 'no' && !operaio.preposto);
            
            const shouldShow = matchesSearch && matchesSpecializzazione && 
                             matchesLivello && matchesPreposto;
            
            card.style.display = shouldShow ? 'block' : 'none';
        });
    }

    // ===== CANTIERE CON INDIRIZZO =====
    getCantiereHTML(cantiere) {
        const icons = {'Civile': '🏰', 'Industriale': '🏭', 'Residenziale': '🏢'};
        const icon = icons[cantiere.tipo] || '🏰';
        const countBadge = cantiere.operai.length > 0 ? 
            `<div class="cantiere-count">${cantiere.operai.length}</div>` : '';
        
        return `
            <div class="cantiere-icon">${icon}</div>
            <div class="cantiere-nome">${cantiere.nome}</div>
            <div class="cantiere-indirizzo">${cantiere.indirizzo}</div>
            ${countBadge}
            <div class="cantiere-controls">
                <button class="btn-small btn-edit" data-cantiere-id="${cantiere.id}">✏️</button>
                <button class="btn-small btn-delete" data-cantiere-id="${cantiere.id}">🗑️</button>
            </div>
        `;
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
        
        this.closeModal();
        this.renderCantieri();
        this.updateStats();
    }

    editCantiere(cantiereId) {
        const cantiere = this.cantieri.find(c => c.id === cantiereId);
        if (!cantiere) return;
        
        document.getElementById('modal-cantiere-title').textContent = 'Modifica Cantiere';
        document.getElementById('cantiere-id').value = cantiere.id;
        document.getElementById('cantiere-nome').value = cantiere.nome;
        document.getElementById('cantiere-indirizzo').value = cantiere.indirizzo;
        document.getElementById('cantiere-tipo').value = cantiere.tipo;
        
        document.getElementById('modal-cantiere').classList.remove('hidden');
    }

    // ===== AGGIORNAMENTO DETTAGLI CANTIERE =====
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
        
        // ... resto del codice rimane invariato ...
    }

    // ... resto delle funzioni rimangono invariate ...

}

// Inizializza l'app quando il DOM è pronto
document.addEventListener('DOMContentLoaded', () => {
    window.app = new SseManager();
});