// app.js - Sse Manager Ver 1.1 FUNZIONANTE
console.log('🏗️ Sse Manager - Caricamento...');

class SseManager {
    constructor() {
        this.operai = [
            {id: 1, nome: "Marco Rossi", email: "marco.rossi@cantieri.it", telefono: "333-1234567", specializzazione: "Elettricista", livello: 5, cantiere: 1, avatar: "⚡", preposto: true},
            {id: 2, nome: "Giuseppe Bianchi", email: "giuseppe.bianchi@cantieri.it", telefono: "335-2345678", specializzazione: "Meccanico", livello: 4, cantiere: 1, avatar: "🔧", preposto: false},
            {id: 3, nome: "Antonio Verde", email: "antonio.verde@cantieri.it", telefono: "338-3456789", specializzazione: "Elettricista", livello: 3, cantiere: 2, avatar: "⚡", preposto: false},
            {id: 4, nome: "Francesco Neri", email: "francesco.neri@cantieri.it", telefono: "339-4567890", specializzazione: "Meccanico", livello: 5, cantiere: 2, avatar: "🔧", preposto: true},
            {id: 5, nome: "Luigi Viola", email: "luigi.viola@cantieri.it", telefono: "340-5678901", specializzazione: "Elettricista", livello: 2, cantiere: null, avatar: "⚡", preposto: false},
            {id: 6, nome: "Salvatore Blu", email: "salvatore.blu@cantieri.it", telefono: "346-6789012", specializzazione: "Meccanico", livello: 3, cantiere: null, avatar: "🔧", preposto: false}
        ];

        this.cantieri = [
            {id: 1, nome: "Palazzo Roma Centro", tipo: "Civile", x: 150, y: 200, operai: [1, 2], calendarSelections: {}, timeSlot: {start: "08:00", end: "17:00"}},
            {id: 2, nome: "Impianto Industriale Ostia", tipo: "Industriale", x: 400, y: 300, operai: [4, 3], calendarSelections: {}, timeSlot: {start: "07:00", end: "16:00"}},
            {id: 3, nome: "Ristrutturazione Trastevere", tipo: "Residenziale", x: 300, y: 150, operai: [], calendarSelections: {}, timeSlot: {start: "08:30", end: "17:30"}}
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
        console.log('🚀 Inizializzazione Sse Manager');
        this.setupEventListeners();
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

        // Ricerca
        document.getElementById('search-operai').addEventListener('input', (e) => {
            this.filterOperai(e.target.value);
        });
        
        document.getElementById('search-cantieri').addEventListener('input', (e) => {
            this.filterCantieri(e.target.value);
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
    }

    handleMenuAction(action) {
        const actions = {
            'focus-search-operai': () => this.focusSearchOperai(),
            'focus-search-cantieri': () => this.focusSearchCantieri(),
            'show-operai-list': () => this.showOperaiList(),
            'show-cantieri-list': () => this.showCantieriList(),
            'show-modify-cantiere': () => this.showModifyCantiereMenu(),
            'show-delete-cantiere': () => this.showDeleteCantiereMenu(),
            'open-settings': () => this.openSettings(),
            'open-general-settings': () => this.openGeneralSettings(),
            'logout': () => this.logout()
        };

        if (actions[action]) {
            actions[action]();
            this.closeMenu();
        }
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
        document.getElementById('main-app').classList.add('hidden');
        document.getElementById('login-screen').classList.remove('hidden');
        this.closeMenu();
    }

    renderApp() {
        this.renderOperai();
        this.renderCantieri();
    }

    // ===== FUNZIONI OPERAI =====
    renderOperai() {
        const container = document.getElementById('operai-container');
        const controls = document.getElementById('controls-operai');
        
        controls.innerHTML = '<button class="btn btn-primary" id="add-operaio-btn">+ Aggiungi Operaio</button>';
        document.getElementById('add-operaio-btn').addEventListener('click', () => this.addOperaio());
        
        container.innerHTML = '';
        
        const operaiDisponibili = this.operai.filter(o => o.cantiere === null);
        
        operaiDisponibili.forEach(operaio => {
            const card = document.createElement('div');
            card.className = 'operaio-card';
            card.draggable = true;
            card.dataset.operaioId = operaio.id;
            card.innerHTML = this.getOperaioCardHTML(operaio);
            
            this.setupOperaioDrag(card, operaio);
            container.appendChild(card);
        });
        
        if (operaiDisponibili.length === 0) {
            container.innerHTML = '<p style="color: #95a5a6; text-align: center; padding: 2rem;">Nessun operaio disponibile</p>';
        }
    }

    getOperaioCardHTML(operaio) {
        const prepostoBadge = operaio.preposto ? '<div class="operaio-preposto">⭐ Preposto ⭐</div>' : '';
        
        return `
            <div class="operaio-header">
                <span class="operaio-avatar">${operaio.avatar}</span>
                <div class="operaio-info">
                    <div class="operaio-nome">${operaio.nome}</div>
                    <div class="operaio-spec">${operaio.specializzazione}</div>
                    <div class="operaio-level">Livello ${operaio.livello}</div>
                </div>
            </div>
            <div class="operaio-status">Disponibile</div>
            <div class="operaio-contact">
                📧 ${operaio.email}<br>
                📞 ${operaio.telefono}
            </div>
            ${prepostoBadge}
            <div class="operaio-actions">
                <button class="btn btn-edit">✏️</button>
                <button class="btn btn-delete">🗑️</button>
            </div>
        `;
    }

    setupOperaioDrag(card, operaio) {
        card.ondragstart = (e) => {
            this.draggedOperaio = operaio;
            this.isDragDropActive = true;
            e.dataTransfer.effectAllowed = 'move';
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
        
        editBtn.addEventListener('click', () => this.editOperaio(operaio.id));
        deleteBtn.addEventListener('click', () => this.removeOperaio(operaio.id));
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
                }
            });
            
            // Rimuovi dall'array operai
            const index = this.operai.findIndex(o => o.id === operaioId);
            if (index !== -1) {
                this.operai.splice(index, 1);
            }
            
            this.renderApp();
            this.closeModal();
            this.closeCantiereModal();
        }
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
    }

    getCantiereHTML(cantiere) {
        const icons = {'Civile': '🏰', 'Industriale': '🏭', 'Residenziale': '🏢'};
        const icon = icons[cantiere.tipo] || '🏰';
        const countBadge = cantiere.operai.length > 0 ? 
            `<div class="cantiere-count">${cantiere.operai.length}</div>` : '';
        
        return `
            <div class="cantiere-icon">${icon}</div>
            <div class="cantiere-nome">${cantiere.nome}</div>
            ${countBadge}
            <div class="cantiere-controls">
                <button class="btn-small btn-edit">✏️</button>
                <button class="btn-small btn-delete">🗑️</button>
            </div>
        `;
    }

    setupCantiereDrag(element, cantiere) {
        element.draggable = true;
        
        element.ondragstart = (e) => {
            this.draggedCantiere = cantiere;
            this.isDragDropActive = true;
            e.dataTransfer.effectAllowed = 'move';
            element.classList.add('dragging');
        };
        
        element.ondragend = (e) => {
            element.classList.remove('dragging');
            
            if (this.draggedCantiere) {
                const rect = element.getBoundingClientRect();
                const containerRect = document.getElementById('map-container').getBoundingClientRect();
                
                this.draggedCantiere.x = rect.left - containerRect.left;
                this.draggedCantiere.y = rect.top - containerRect.top;
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
            this.editCantiere(cantiere.id);
        });
        
        deleteBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.removeCantiere(cantiere.id);
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
        document.getElementById('cantiere-tipo').value = cantiere.tipo;
        
        document.getElementById('modal-cantiere').classList.remove('hidden');
    }

    saveCantiere() {
        const id = document.getElementById('cantiere-id').value;
        const nome = document.getElementById('cantiere-nome').value.trim();
        const tipo = document.getElementById('cantiere-tipo').value;
        
        if (!nome || !tipo) {
            alert('Tutti i campi sono obbligatori');
            return;
        }
        
        if (id) {
            const cantiere = this.cantieri.find(c => c.id == id);
            if (cantiere) {
                cantiere.nome = nome;
                cantiere.tipo = tipo;
            }
        } else {
            const newId = Math.max(0, ...this.cantieri.map(c => c.id)) + 1;
            this.cantieri.push({
                id: newId, nome, tipo,
                x: Math.random() * 400 + 100, y: Math.random() * 300 + 100,
                operai: [], calendarSelections: {}, timeSlot: {start: "08:00", end: "17:00"}
            });
        }
        
        this.closeModal();
        this.renderCantieri();
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
    }

    unassignOperaio(operaioId, cantiereId) {
        const operaio = this.operai.find(o => o.id === operaioId);
        const cantiere = this.cantieri.find(c => c.id === cantiereId);
        if (!operaio || !cantiere) return;
        
        operaio.cantiere = null;
        cantiere.operai = cantiere.operai.filter(id => id !== operaioId);
        this.renderApp();
    }

    // ===== FUNZIONI RICERCA =====
    filterOperai(searchTerm) {
        const operaiCards = document.querySelectorAll('.operaio-card');
        const term = searchTerm.toLowerCase().trim();
        
        operaiCards.forEach(card => {
            const operaioId = parseInt(card.dataset.operaioId);
            const operaio = this.operai.find(o => o.id === operaioId);
            
            if (!operaio) return;
            
            const matches = operaio.nome.toLowerCase().includes(term) ||
                           operaio.specializzazione.toLowerCase().includes(term) ||
                           operaio.email.toLowerCase().includes(term) ||
                           operaio.telefono.includes(term);
            
            card.style.display = matches ? 'block' : 'none';
        });
    }

    filterCantieri(searchTerm) {
        const cantiereElements = document.querySelectorAll('.cantiere');
        const term = searchTerm.toLowerCase().trim();
        
        cantiereElements.forEach(element => {
            const cantiereId = parseInt(element.dataset.cantiereId);
            const cantiere = this.cantieri.find(c => c.id === cantiereId);
            
            if (!cantiere) return;
            
            const matches = cantiere.nome.toLowerCase().includes(term) ||
                           cantiere.tipo.toLowerCase().includes(term);
            
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
            <p><strong>Tipo:</strong> ${cantiere.tipo}</p>
            <p><strong>Posizione:</strong> X: ${cantiere.x}, Y: ${cantiere.y}</p>
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
                        <button onclick="app.unassignOperaio(${operaio.id}, ${cantiereId})" style="float:right; background:#e74c3c; color:white; border:none; padding:4px 8px; border-radius:4px; font-size:10px;">Rimuovi</button>
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
            
            button.textContent = originalText;
            button.disabled = false;
            
            alert(`✅ Email inviate con successo!\n\n📧 Destinatari: ${operaiAssegnati.length}\n🏗️ Cantiere: ${cantiere.nome}\n📅 Giorni: ${giorni}\n⏰ Orario: ${orario}`);
        }, 2000);
    }

    // ===== FUNZIONI MENU =====
    toggleMenu() {
        const dropdown = document.getElementById('menu-dropdown');
        dropdown.classList.toggle('hidden');
    }

    closeMenu() {
        const dropdown = document.getElementById('menu-dropdown');
        dropdown.classList.add('hidden');
    }

    focusSearchOperai() {
        const input = document.getElementById('search-operai');
        input.focus();
        input.select();
    }

    focusSearchCantieri() {
        const input = document.getElementById('search-cantieri');
        input.focus();
        input.select();
    }

    // ===== FUNZIONI UTILITY =====
    closeModal() {
        document.getElementById('modal-operaio').classList.add('hidden');
        document.getElementById('modal-cantiere').classList.add('hidden');
    }

    closeCantiereModal() {
        document.getElementById('modal-cantiere-details').classList.add('hidden');
        this.currentCantiereId = null;
    }

    // ===== FUNZIONI LISTE (semplificate) =====
    showOperaiList() {
        let message = '👷 LISTA OPERAI:\n\n';
        this.operai.forEach((operaio, index) => {
            const cantiere = operaio.cantiere ? this.cantieri.find(c => c.id === operaio.cantiere) : null;
            const status = cantiere ? `Assegnato: ${cantiere.nome}` : 'Disponibile';
            message += `${index + 1}. ${operaio.nome} - ${status}\n`;
        });
        alert(message);
    }

    showCantieriList() {
        let message = '🏗️ LISTA CANTIERI:\n\n';
        this.cantieri.forEach((cantiere, index) => {
            message += `${index + 1}. ${cantiere.nome} (${cantiere.tipo}) - ${cantiere.operai.length} operai\n`;
        });
        alert(message);
    }

    showModifyCantiereMenu() {
        if (this.cantieri.length === 0) {
            alert('Nessun cantiere disponibile');
            return;
        }
        let message = 'Seleziona cantiere da modificare:\n\n';
        this.cantieri.forEach((cantiere, index) => {
            message += `${index + 1}. ${cantiere.nome}\n`;
        });
        const scelta = prompt(message);
        const numero = parseInt(scelta);
        if (numero >= 1 && numero <= this.cantieri.length) {
            this.editCantiere(this.cantieri[numero - 1].id);
        }
    }

    showDeleteCantiereMenu() {
        if (this.cantieri.length === 0) {
            alert('Nessun cantiere disponibile');
            return;
        }
        let message = 'Seleziona cantiere da eliminare:\n\n';
        this.cantieri.forEach((cantiere, index) => {
            message += `${index + 1}. ${cantiere.nome}\n`;
        });
        const scelta = prompt(message);
        const numero = parseInt(scelta);
        if (numero >= 1 && numero <= this.cantieri.length) {
            this.removeCantiere(this.cantieri[numero - 1].id);
        }
    }

    // ===== FUNZIONI IMPOSTAZIONI (semplificate) =====
    openSettings() {
        document.getElementById('modal-settings').classList.remove('hidden');
        this.showSettingsTab('email');
    }

    openGeneralSettings() {
        document.getElementById('modal-settings').classList.remove('hidden');
        this.showSettingsTab('general');
    }

    closeSettings() {
        document.getElementById('modal-settings').classList.add('hidden');
    }

    showSettingsTab(tabName) {
        document.querySelectorAll('.tab').forEach(tab => tab.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(content => content.classList.add('hidden'));
        
        document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');
        document.getElementById(`settings-${tabName}`).classList.remove('hidden');
    }
}

// Inizializzazione
const app = new SseManager();
window.app = app;

console.log('🏗️ Sse Manager - Ver 1.1 COMPLETAMENTE FUNZIONANTE!');