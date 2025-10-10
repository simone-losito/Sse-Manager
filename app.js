// app.js - Sse Manager
class SseManager {
    constructor() {
        this.cantieri = [
            {
                id: 1,
                titolo: "Palazzo Roma Centro",
                tipo: "Civile",
                orarioDefault: "08:00-17:00",
                coords: [41.9028, 12.4964],
                operai: ["Marco Rossi ⭐", "Giuseppe Bianchi"]
            },
            {
                id: 2,
                titolo: "Impianto Industriale Ostia",
                tipo: "Industriale", 
                orarioDefault: "07:00-16:00",
                coords: [41.7518, 12.3012],
                operai: ["Francesco Neri ⭐", "Antonio Verde"]
            },
            {
                id: 3,
                titolo: "Ristrutturazione Trastevere",
                tipo: "Residenziale",
                orarioDefault: "08:30-17:30",
                coords: [41.8890, 12.4673],
                operai: []
            }
        ];

        this.map = null;
        this.markers = [];
        this.init();
    }

    init() {
        this.initMap();
        this.renderCantieri();
        this.initDragAndDrop();
        this.initSmoothScroll();
    }

    initMap() {
        // Inizializza la mappa
        this.map = L.map('map').setView([41.9028, 12.4964], 11);
        
        // Aggiungi tile layer
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors'
        }).addTo(this.map);

        // Aggiungi marker per ogni cantiere
        this.cantieri.forEach((cantiere, index) => {
            const marker = L.marker(cantiere.coords, {
                draggable: true
            }).addTo(this.map);

            marker.bindPopup(`
                <div style="min-width: 200px;">
                    <h3 style="margin: 0 0 10px 0; color: #2c3e50;">${cantiere.titolo}</h3>
                    <p style="margin: 5px 0; color: #7f8c8d;">
                        <strong>Tipo:</strong> ${cantiere.tipo}
                    </p>
                    <p style="margin: 5px 0; color: #7f8c8d;">
                        <strong>Orario:</strong> ${cantiere.orarioDefault}
                    </p>
                    <p style="margin: 5px 0; color: #7f8c8d;">
                        <strong>Operai:</strong> ${cantiere.operai.length}
                    </p>
                </div>
            `);

            // Event listener per drag end
            marker.on('dragend', (e) => {
                const newLatLng = e.target.getLatLng();
                this.cantieri[index].coords = [newLatLng.lat, newLatLng.lng];
                console.log(`Cantiere ${cantiere.titolo} spostato a:`, newLatLng);
            });

            this.markers.push(marker);
        });
    }

    renderCantieri() {
        const cantieriGrid = document.getElementById('cantieriGrid');
        cantieriGrid.innerHTML = '';

        this.cantieri.forEach(cantiere => {
            const cantiereCard = this.createCantiereCard(cantiere);
            cantieriGrid.appendChild(cantiereCard);
        });
    }

    createCantiereCard(cantiere) {
        const card = document.createElement('div');
        card.className = 'cantiere-card';
        card.dataset.cantiereId = cantiere.id;

        const operaiList = cantiere.operai.map(operaio => {
            const isSuper = operaio.includes('⭐');
            return `<span class="operaio-tag ${isSuper ? 'supervisore' : ''}">${operaio}</span>`;
        }).join('');

        card.innerHTML = `
            <div class="cantiere-header">
                <div>
                    <h3 class="cantiere-title">${cantiere.titolo}</h3>
                    <span class="cantiere-type">${cantiere.tipo}</span>
                </div>
            </div>
            
            <div class="cantiere-info">
                <p><strong>📍 Coordinate:</strong> ${cantiere.coords[0].toFixed(4)}, ${cantiere.coords[1].toFixed(4)}</p>
                <p><strong>⏰ Orario predefinito:</strong> ${cantiere.orarioDefault}</p>
            </div>

            <div class="operai-assegnati">
                <h4>👷 Operai Assegnati (${cantiere.operai.length})</h4>
                <div class="operai-list">
                    ${operaiList || '<span style="color: #7f8c8d; font-style: italic;">Nessun operaio assegnato</span>'}
                </div>
            </div>

            <div class="calendario-section">
                <div class="orario-selector">
                    <label for="orario-${cantiere.id}">Fascia Oraria:</label>
                    <select id="orario-${cantiere.id}" class="orario-select">
                        <option value="07:00-16:00" ${cantiere.orarioDefault === '07:00-16:00' ? 'selected' : ''}>07:00 - 16:00</option>
                        <option value="08:00-17:00" ${cantiere.orarioDefault === '08:00-17:00' ? 'selected' : ''}>08:00 - 17:00</option>
                        <option value="08:30-17:30" ${cantiere.orarioDefault === '08:30-17:30' ? 'selected' : ''}>08:30 - 17:30</option>
                        <option value="09:00-18:00">09:00 - 18:00</option>
                    </select>
                </div>
                
                <div class="calendario">
                    <h5>📅 ${this.getCurrentMonth()}</h5>
                    <div class="calendar-grid">
                        ${this.generateCalendarDays()}
                    </div>
                </div>
            </div>
        `;

        // Event listener per cambio orario
        const orarioSelect = card.querySelector('.orario-select');
        orarioSelect.addEventListener('change', (e) => {
            const cantiere = this.cantieri.find(c => c.id == card.dataset.cantiereId);
            cantiere.orarioDefault = e.target.value;
            // Aggiorna anche l'info nel card
            const infoOrario = card.querySelector('.cantiere-info p:nth-child(2)');
            infoOrario.innerHTML = `<strong>⏰ Orario predefinito:</strong> ${e.target.value}`;
        });

        return card;
    }

    getCurrentMonth() {
        const now = new Date();
        const months = [
            'Gennaio', 'Febbraio', 'Marzo', 'Aprile', 'Maggio', 'Giugno',
            'Luglio', 'Agosto', 'Settembre', 'Ottobre', 'Novembre', 'Dicembre'
        ];
        return `${months[now.getMonth()]} ${now.getFullYear()}`;
    }

    generateCalendarDays() {
        const now = new Date();
        const year = now.getFullYear();
        const month = now.getMonth();
        const today = now.getDate();
        
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const daysInMonth = lastDay.getDate();
        
        let days = '';
        
        for (let day = 1; day <= daysInMonth; day++) {
            const isToday = day === today;
            const dayClass = isToday ? 'calendar-day today' : 'calendar-day';
            days += `<div class="${dayClass}" data-day="${day}">${day}</div>`;
        }
        
        return days;
    }

    initDragAndDrop() {
        const operaiCards = document.querySelectorAll('.operaio-card');
        const cantieriCards = document.querySelectorAll('.cantiere-card');

        // Drag start per operai
        operaiCards.forEach(card => {
            card.addEventListener('dragstart', (e) => {
                e.dataTransfer.setData('text/plain', JSON.stringify({
                    nome: card.dataset.operaio,
                    specializzazione: card.dataset.specializzazione,
                    livello: card.dataset.livello
                }));
                card.classList.add('dragging');
            });

            card.addEventListener('dragend', () => {
                card.classList.remove('dragging');
            });
        });

        // Drop events per cantieri
        cantieriCards.forEach(card => {
            card.addEventListener('dragover', (e) => {
                e.preventDefault();
                card.classList.add('drag-over');
            });

            card.addEventListener('dragleave', () => {
                card.classList.remove('drag-over');
            });

            card.addEventListener('drop', (e) => {
                e.preventDefault();
                card.classList.remove('drag-over');
                
                try {
                    const operaioData = JSON.parse(e.dataTransfer.getData('text/plain'));
                    const cantiereId = parseInt(card.dataset.cantiereId);
                    this.assegnaOperaio(cantiereId, operaioData);
                } catch (error) {
                    console.error('Errore nel parsing dei dati operaio:', error);
                }
            });
        });

        // Calendar click events
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('calendar-day')) {
                e.target.classList.toggle('selected');
            }
        });
    }

    assegnaOperaio(cantiereId, operaioData) {
        const cantiere = this.cantieri.find(c => c.id === cantiereId);
        if (!cantiere) return;

        const nomeOperaio = operaioData.nome;
        
        // Verifica se l'operaio è già assegnato
        const giaAssegnato = cantiere.operai.some(op => op.includes(nomeOperaio));
        if (giaAssegnato) {
            alert(`${nomeOperaio} è già assegnato a questo cantiere!`);
            return;
        }

        // Aggiungi operaio (il primo operaio diventa supervisore)
        const isFirstOperaio = cantiere.operai.length === 0;
        const nomeConRuolo = isFirstOperaio ? `${nomeOperaio} ⭐` : nomeOperaio;
        
        cantiere.operai.push(nomeConRuolo);
        
        // Rimuovi operaio da altri cantieri se già assegnato
        this.cantieri.forEach(c => {
            if (c.id !== cantiereId) {
                c.operai = c.operai.filter(op => !op.includes(nomeOperaio));
            }
        });

        // Re-render cantieri
        this.renderCantieri();
        this.initDragAndDrop(); // Re-inizializza drag and drop

        console.log(`${nomeOperaio} assegnato al cantiere ${cantiere.titolo}`);
    }

    initSmoothScroll() {
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', function (e) {
                e.preventDefault();
                const target = document.querySelector(this.getAttribute('href'));
                if (target) {
                    target.scrollIntoView({
                        behavior: 'smooth',
                        block: 'start'
                    });
                }
            });
        });
    }

    // Metodi di utilità
    getCantiere(id) {
        return this.cantieri.find(c => c.id === id);
    }

    updateCantiere(id, updates) {
        const cantiere = this.getCantiere(id);
        if (cantiere) {
            Object.assign(cantiere, updates);
            this.renderCantieri();
        }
    }

    exportData() {
        return {
            cantieri: this.cantieri,
            timestamp: new Date().toISOString()
        };
    }

    importData(data) {
        if (data.cantieri) {
            this.cantieri = data.cantieri;
            this.renderCantieri();
            this.initDragAndDrop();
        }
    }
}

// Inizializza l'applicazione quando il DOM è caricato
document.addEventListener('DOMContentLoaded', () => {
    window.sseManager = new SseManager();
    console.log('Sse Manager inizializzato con successo!');
});