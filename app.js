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

    handleMenuAction(action) {
        const actions = {
            'focus-search-operai': () => this.focusSearchOperai(),
            'focus-search-cantieri': () => this.focusSearchCantieri(),
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

    // ===== SISTEMA SALVATAGGIO DATI =====
    setupAutoSave() {
        // Salva automaticamente ogni 30 secondi
        setInterval(() => {
            if (this.autoSaveEnabled) {
                this.saveAllData();
            }
        }, 30000);
    }

    saveAllData() {
        this.saveData('operai', this.operai);
        this.saveData('cantieri', this.cantieri);
        this.showAutoSaveIndicator();
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

    loadData(key) {
        try {
            const data = localStorage.getItem(`sse_manager_${key}`);
            return data ? JSON.parse(data) : null;
        } catch (error) {
            console.error('Errore nel caricamento dati:', error);
            return null;
        }
    }

    showAutoSaveIndicator() {
        const indicator = document.createElement('div');
        indicator.className = 'auto-save-indicator';
        indicator.textContent = '💾 Dati salvati';
        document.body.appendChild(indicator);
        
        setTimeout(() => {
            indicator.remove();
        }, 2000);
    }

    // ===== IMPORT/EXPORT DATI =====
    exportData() {
        const data = {
            operai: this.operai,
            cantieri: this.cantieri,
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

    // ===== INFORMAZIONI SISTEMA =====
    showInfo() {
        // Aggiorna le statistiche nel modal info
        document.getElementById('info-total-operai').textContent = this.operai.length;
        document.getElementById('info-assigned-operai').textContent = this.operai.filter(o => o.cantiere !== null).length;
        document.getElementById('info-total-cantieri').textContent = this.cantieri.length;
        
        document.getElementById('modal-info').classList.remove('hidden');
    }

    closeInfo() {
        document.getElementById('modal-info').classList.add('hidden');
    }

    // ===== FUNZIONI PRINCIPALI =====
    loginMaster() {
        console.log('👑 LOGIN MASTER');
        document.getElementById('login-screen').classList.add('hidden');
        document.getElementById('main-app').classList.remove('hidden');
        document.getElementById('mode-text').textContent = 'Modalità: Manager';
        this.renderApp();
    }

    logout() {
        console.log('👋 LOGOUT');
        // Salva prima di uscire
        this.saveAllData();
        document.getElementById('main-app').classList.add('hidden');
        document.getElementById('login-screen').classList.remove('hidden');
        this.closeMenu();
    }

    renderApp() {
        this.renderOperai();
        this.renderCantieri();
        this.updateStats();
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

    // ===== FUNZIONI OPERAI =====
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

    setupOperaioDrag(card, operaio) {
        card.ondragstart = (e) => {
            this.draggedOperaio = operaio;
            this.isDragDropActive = true;
            e.dataTransfer.effectAllowed = 'move';
            e.dataTransfer.setData('text/plain', operaio.id.toString());
            card.style.opacity = '0.5';
        };
        
        card.ondragend = (e) => {
            card.style.opacity = '1';
            setTimeout(() => {
                this.isDragDropActive = false;
                this.draggedOperaio = null;
            }, 100);
        };

        // Bottoni azioni
        const editBtn = card.querySelector('.btn-edit');
        const deleteBtn = card.querySelector('.btn-delete');
        
        editBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.editOperaio(parseInt(e.target.dataset.operaioId));
        });
        
        deleteBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.removeOperaio(parseInt(e.target.dataset.operaioId));
        });
    }

    addOperaio() {
        document.getElementById('modal-operaio-title').textContent = 'Aggiungi Operaio';
        document.getElementById('form-operaio').reset();
        document.getElementById('operaio-id').value = '';
        document.getElementById('modal-operaio').classList.remove('hidden');
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
        
        document.getElementById('modal-operaio').classList.remove('hidden');
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
        
        this.closeModal();
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
                    console.log(`✅ Rimosso operaio ${operaioId} dal cantiere ${cantiere.id}`);
                }
            });
            
            // Rimuovi dall'array operai
            const index = this.operai.findIndex(o => o.id === operaioId);
            if (index !== -1) {
                this.operai.splice(index, 1);
            }
            
            // AGGIORNAMENTO IMMEDIATO - anche se il modal dettagli è aperto
            this.renderApp();
            this.saveAllData();
            
            // Se il modal dettagli cantiere è aperto, aggiorna anche quello
            if (this.currentCantiereId) {
                this.showCantiereDetails(this.currentCantiereId);
            }
            
            this.closeModal();
        }
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

    // ===== FUNZIONI CANTIERI =====
    renderCantieri() {
        const container = document.getElementById('map-container');
        const controls = document.getElementById('controls-cantieri');
        
        controls.innerHTML = '<button class="btn btn-add" id="add-cantiere-btn">➕ Aggiungi Cantiere</button>';
        document.getElementById('add-cantiere-btn').addEventListener('click', () => this.addCantiere());
        
        container.innerHTML = '';
        
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

    setupCantiereDrag(element, cantiere) {
        element.draggable = true;
        
        let dragOffsetX = 0;
        let dragOffsetY = 0;
        
        element.ondragstart = (e) => {
            this.draggedCantiere = cantiere;
            this.isDragDropActive = true;
            e.dataTransfer.effectAllowed = 'move';
            e.dataTransfer.setData('text/plain', 'cantiere-' + cantiere.id);
            element.classList.add('dragging');
            
            // Calcola l'offset del mouse rispetto all'elemento
            const rect = element.getBoundingClientRect();
            dragOffsetX = e.clientX - rect.left;
            dragOffsetY = e.clientY - rect.top;
        };
        
        element.ondragend = (e) => {
            element.classList.remove('dragging');
            
            if (this.draggedCantiere) {
                const container = document.getElementById('map-container');
                const containerRect = container.getBoundingClientRect();
                
                // Calcola la nuova posizione considerando l'offset
                const x = e.clientX - containerRect.left - dragOffsetX + container.scrollLeft;
                const y = e.clientY - containerRect.top - dragOffsetY + container.scrollTop;
                
                // Limita la posizione ai confini del container
                const maxX = containerRect.width - element.offsetWidth;
                const maxY = containerRect.height - element.offsetHeight;
                
                this.draggedCantiere.x = Math.max(0, Math.min(x, maxX));
                this.draggedCantiere.y = Math.max(0, Math.min(y, maxY));
                
                console.log(`📍 Cantiere ${cantiere.nome} spostato a: X=${this.draggedCantiere.x}, Y=${this.draggedCantiere.y}`);
                
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
        };

        // Bottoni azioni
        const editBtn = element.querySelector('.btn-edit');
        const deleteBtn = element.querySelector('.btn-delete');
        
        editBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.editCantiere(parseInt(e.target.dataset.cantiereId));
        });
        
        deleteBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.removeCantiere(parseInt(e.target.dataset.cantiereId));
        });
    }

    setupCantiereDrop(element, cantiere) {
        element.ondragover = (e) => {
            e.preventDefault();
            e.dataTransfer.dropEffect = 'move';
            if (this.draggedOperaio && this.isDragDropActive) {
                element.classList.add('drag-over');
            }
        };
        
        element.ondragenter = (e) => {
            e.preventDefault();
            if (this.draggedOperaio && this.isDragDropActive) {
                element.classList.add('drag-over');
            }
        };
        
        element.ondragleave = (e) => {
            const rect = element.getBoundingClientRect();
            const x = e.clientX, y = e.clientY;
            if (x < rect.left || x > rect.right || y < rect.top || y > rect.bottom) {
                element.classList.remove('drag-over');
            }
        };
        
        element.ondrop = (e) => {
            e.preventDefault();
            element.classList.remove('drag-over');
            
            if (this.draggedOperaio && this.isDragDropActive) {
                this.assignOperaio(this.draggedOperaio.id, cantiere.id);
                
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
        };
    }

    setupCantiereClick(element, cantiere) {
        element.addEventListener('click', (e) => {
            if (this.isDragDropActive || e.target.closest('.cantiere-controls')) {
                return;
            }
            setTimeout(() => {
                if (!this.isDragDropActive) {
                    this.showCantiereDetails(cantiere.id);
                }
            }, 50);
        });
    }

    addCantiere() {
        document.getElementById('modal-cantiere-title').textContent = 'Aggiungi Cantiere';
        document.getElementById('form-cantiere').reset();
        document.getElementById('cantiere-id').value = '';
        document.getElementById('modal-cantiere').classList.remove('hidden');
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

    // ===== FUNZIONI ASSEGNAZIONE =====
    assignOperaio(operaioId, cantiereId) {
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

    unassignOperaio(operaioId, cantiereId) {
        console.log('🔓 UNASSIGN OPERAIO:', operaioId, 'from', cantiereId);
        const operaio = this.operai.find(o => o.id === operaioId);
        const cantiere = this.cantieri.find(c => c.id === cantiereId);
        if (!operaio || !cantiere) return;
        
        operaio.cantiere = null;
        cantiere.operai = cantiere.operai.filter(id => id !== operaioId);
        
        // AGGIORNAMENTO IMMEDIATO - rigenera l'intera UI
        this.renderApp();
        this.saveAllData();
        
        // Se il modal dettagli è aperto, aggiorna anche quello
        if (this.currentCantiereId === cantiereId) {
            this.showCantiereDetails(cantiereId);
        }
    }

    // ===== FUNZIONI RICERCA =====
    filterCantieri(searchTerm) {
        const cantiereElements = document.querySelectorAll('.cantiere');
        const term = searchTerm.toLowerCase().trim();
        
        if (!term) {
            cantiereElements.forEach(element => element.style.display = 'block');
            return;
        }
        
        cantiereElements.forEach(element => {
            const cantiereId = parseInt(element.dataset.cantiereId);
            const cantiere = this.cantieri.find(c => c.id === cantiereId);
            
            if (!cantiere) return;
            
            const matches = cantiere.nome.toLowerCase().includes(term) ||
                           cantiere.tipo.toLowerCase().includes(term) ||
                           cantiere.indirizzo.toLowerCase().includes(term);
            
            element.style.display = matches ? 'block' : 'none';
        });
    }

    // ===== FUNZIONI DETTAGLI CANTIERE =====
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
        document.getElementById('modal-cantiere-details').classList.remove('hidden');
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
        const dateStr = date.toISOString().split('T')[0];
        return cantiere.calendarSelections[dateStr] === true;
    }

    toggleCalendarDay(dateStr) {
        if (!this.currentCantiereId) return;
        const cantiere = this.cantieri.find(c => c.id === this.currentCantiereId);
        if (!cantiere) return;
        
        if (!cantiere.calendarSelections) cantiere.calendarSelections = {};
        const dateKey = dateStr.split('T')[0];
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

    // ===== FUNZIONI MENU =====
    toggleMenu() {
        const dropdown = document.getElementById('menu-dropdown');
        dropdown.classList.toggle('hidden');
    }

    closeMenu() {
        document.getElementById('menu-dropdown').classList.add('hidden');
    }

    focusSearchOperai() {
        document.getElementById('search-operai').focus();
    }

    focusSearchCantieri() {
        document.getElementById('search-cantieri').focus();
    }

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

    openSettings() {
        document.getElementById('modal-settings').classList.remove('hidden');
        this.showSettingsTab('email');
    }

    openGeneralSettings() {
        document.getElementById('modal-settings').classList.remove('hidden');
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
        document.getElementById('modal-settings').classList.add('hidden');
    }

    // ===== FUNZIONI UTILITY =====
    closeModal() {
        document.querySelectorAll('.modal').forEach(modal => {
            modal.classList.add('hidden');
        });
    }

    closeCantiereModal() {
        document.getElementById('modal-cantiere-details').classList.add('hidden');
        this.currentCantiereId = null;
    }
}

// Inizializza l'app quando il DOM è pronto
document.addEventListener('DOMContentLoaded', () => {
    window.app = new SseManager();
});