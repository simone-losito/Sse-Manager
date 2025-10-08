// Regno delle Costruzioni - Ver 1.8 - Sistema di Gestione Cantieri
// Dati dell'applicazione
let operai = [
    {id: 1, nome: "Marco Rossi", email: "marco.rossi@cantieri.it", telefono: "333-1234567", specializzazione: "Elettricista", livello: 5, cantiere: 1, avatar: "⚡", preposto: true},
    {id: 2, nome: "Giuseppe Bianchi", email: "giuseppe.bianchi@cantieri.it", telefono: "335-2345678", specializzazione: "Meccanico", livello: 4, cantiere: 1, avatar: "🔧", preposto: false},
    {id: 3, nome: "Antonio Verde", email: "antonio.verde@cantieri.it", telefono: "338-3456789", specializzazione: "Elettricista", livello: 3, cantiere: 2, avatar: "⚡", preposto: false},
    {id: 4, nome: "Francesco Neri", email: "francesco.neri@cantieri.it", telefono: "339-4567890", specializzazione: "Meccanico", livello: 5, cantiere: 2, avatar: "🔧", preposto: true},
    {id: 5, nome: "Luigi Viola", email: "luigi.viola@cantieri.it", telefono: "340-5678901", specializzazione: "Elettricista", livello: 2, cantiere: null, avatar: "⚡", preposto: false},
    {id: 6, nome: "Salvatore Blu", email: "salvatore.blu@cantieri.it", telefono: "346-6789012", specializzazione: "Meccanico", livello: 3, cantiere: null, avatar: "🔧", preposto: false}
];

let cantieri = [
    {id: 1, nome: "Palazzo Roma Centro", tipo: "Civile", x: 150, y: 200, operai: [1, 2], calendarSelections: {}, timeSlot: {start: "08:00", end: "17:00"}},
    {id: 2, nome: "Impianto Industriale Ostia", tipo: "Industriale", x: 400, y: 300, operai: [4, 3], calendarSelections: {}, timeSlot: {start: "07:00", end: "16:00"}},
    {id: 3, nome: "Ristrutturazione Trastevere", tipo: "Residenziale", x: 300, y: 150, operai: [], calendarSelections: {}, timeSlot: {start: "08:30", end: "17:30"}}
];

// Configurazioni Email SMTP
let emailSettings = {
    server: '',
    port: 587,
    username: '',
    password: '',
    ssl: true,
    subject: 'Assegnazione Cantiere - {{cantiere}}',
    template: `Ciao {{nome}},

Sei stato assegnato al cantiere: {{cantiere}}
Orario di lavoro: {{orario}}
Giorni selezionati: {{giorni}}

Cordiali saluti,
{{azienda}}`
};

// Configurazioni Generali
let generalSettings = {
    companyName: 'Regno delle Costruzioni',
    timezone: 'Europe/Rome',
    language: 'it',
    dateFormat: 'DD/MM/YYYY'
};

let currentEditingOperaio = null;
let currentEditingCantiere = null;
let nextOperaioId = 7;
let nextCantiereId = 4;

// === INIZIALIZZAZIONE ===
function startApp(mode) {
    document.getElementById('login-screen').classList.add('hidden');
    document.getElementById('main-app').classList.remove('hidden');
    
    renderOperai();
    renderCantieri();
    renderCalendar();
    setupDragAndDrop();
    loadSettings();
}

function logout() {
    document.getElementById('main-app').classList.add('hidden');
    document.getElementById('login-screen').classList.remove('hidden');
}

// === RENDERING ===
function renderOperai() {
    const operaiList = document.getElementById('operai-list');
    const availableOperai = operai.filter(o => o.cantiere === null);
    
    // Ordina per livello (preposti prima) e poi per nome
    availableOperai.sort((a, b) => {
        if (a.preposto && !b.preposto) return -1;
        if (!a.preposto && b.preposto) return 1;
        if (a.livello !== b.livello) return b.livello - a.livello;
        return a.nome.localeCompare(b.nome);
    });
    
    operaiList.innerHTML = availableOperai.map(operaio => `
        <div class="operaio-card ${operaio.preposto ? 'preposto' : ''}" 
             draggable="true" 
             data-id="${operaio.id}"
             ondragstart="dragStart(event)">
            <div class="operaio-info">
                <div class="operaio-nome">
                    ${operaio.avatar} ${operaio.nome} ${operaio.preposto ? '⭐' : ''}
                </div>
                <div class="operaio-specializzazione">${operaio.specializzazione}</div>
                <div class="operaio-livello">Livello ${operaio.livello}</div>
            </div>
        </div>
    `).join('');
}

function renderCantieri() {
    const mapArea = document.getElementById('map-area');
    
    mapArea.innerHTML = cantieri.map(cantiere => {
        const operaiCantiere = operai.filter(o => o.cantiere === cantiere.id);
        // Ordina operai per livello (preposti prima)
        operaiCantiere.sort((a, b) => {
            if (a.preposto && !b.preposto) return -1;
            if (!a.preposto && b.preposto) return 1;
            if (a.livello !== b.livello) return b.livello - a.livello;
            return a.nome.localeCompare(b.nome);
        });
        
        return `
            <div class="cantiere" 
                 style="left: ${cantiere.x}px; top: ${cantiere.y}px;"
                 data-id="${cantiere.id}"
                 ondrop="drop(event)" 
                 ondragover="allowDrop(event)"
                 ondragenter="dragEnter(event)"
                 ondragleave="dragLeave(event)"
                 ondblclick="editCantiere(${cantiere.id})"
                 oncontextmenu="showCantiereContextMenu(event, ${cantiere.id})">
                <div class="cantiere-header">
                    <div class="cantiere-nome">${cantiere.nome}</div>
                    <div class="cantiere-tipo">${cantiere.tipo}</div>
                </div>
                <div class="cantiere-orario">⏰ ${cantiere.timeSlot.start} - ${cantiere.timeSlot.end}</div>
                <div class="cantiere-operai">
                    ${operaiCantiere.map(operaio => `
                        <div class="operaio-assegnato ${operaio.preposto ? 'preposto' : ''}">
                            <span>${operaio.avatar} ${operaio.nome} ${operaio.preposto ? '⭐' : ''}</span>
                            <button class="rimuovi-operaio" onclick="rimuoviOperaioDaCantiere(${operaio.id})">×</button>
                        </div>
                    `).join('')}
                </div>
                <div class="cantiere-actions" style="margin-top: 0.5rem; text-align: right;">
                    <button class="btn btn--secondary" style="font-size: 0.8rem; padding: 0.25rem 0.5rem;" onclick="editCantiere(${cantiere.id})">✏️ Modifica</button>
                    <button class="btn btn--danger" style="font-size: 0.8rem; padding: 0.25rem 0.5rem;" onclick="deleteCantiere(${cantiere.id})">🗑️</button>
                </div>
            </div>
        `;
    }).join('');
}

function renderCalendar() {
    const calendarContainer = document.getElementById('calendar-container');
    const today = new Date();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();
    
    const firstDay = new Date(currentYear, currentMonth, 1);
    const lastDay = new Date(currentYear, currentMonth + 1, 0);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());
    
    const monthNames = ['Gennaio', 'Febbraio', 'Marzo', 'Aprile', 'Maggio', 'Giugno',
                       'Luglio', 'Agosto', 'Settembre', 'Ottobre', 'Novembre', 'Dicembre'];
    
    let calendarHTML = `
        <div class="calendar-month">
            <h4>${monthNames[currentMonth]} ${currentYear}</h4>
        </div>
        <div class="calendar-header">
            <div class="calendar-header-day">Dom</div>
            <div class="calendar-header-day">Lun</div>
            <div class="calendar-header-day">Mar</div>
            <div class="calendar-header-day">Mer</div>
            <div class="calendar-header-day">Gio</div>
            <div class="calendar-header-day">Ven</div>
            <div class="calendar-header-day">Sab</div>
        </div>
        <div class="calendar-grid">
    `;
    
    for (let i = 0; i < 42; i++) {
        const date = new Date(startDate);
        date.setDate(startDate.getDate() + i);
        
        const isToday = date.toDateString() === today.toDateString();
        const isCurrentMonth = date.getMonth() === currentMonth;
        const dayKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
        
        calendarHTML += `
            <div class="calendar-day ${isToday ? 'today' : ''} ${!isCurrentMonth ? 'disabled' : ''}" 
                 data-date="${dayKey}" 
                 onclick="toggleCalendarDay('${dayKey}')">
                ${date.getDate()}
            </div>
        `;
    }
    
    calendarHTML += '</div>';
    calendarContainer.innerHTML = calendarHTML;
}

// === DRAG AND DROP ===
function setupDragAndDrop() {
    // Gestito tramite inline events nell'HTML
}

function dragStart(event) {
    event.dataTransfer.setData('text/plain', event.target.dataset.id);
    event.target.classList.add('dragging');
}

function allowDrop(event) {
    event.preventDefault();
}

function dragEnter(event) {
    event.preventDefault();
    event.target.closest('.cantiere').classList.add('drag-over');
}

function dragLeave(event) {
    event.target.closest('.cantiere').classList.remove('drag-over');
}

function drop(event) {
    event.preventDefault();
    const operaioId = parseInt(event.dataTransfer.getData('text/plain'));
    const cantiereId = parseInt(event.target.closest('.cantiere').dataset.id);
    
    // Trova l'operaio e assegnalo al cantiere
    const operaio = operai.find(o => o.id === operaioId);
    if (operaio) {
        operaio.cantiere = cantiereId;
        renderOperai();
        renderCantieri();
    }
    
    // Rimuovi la classe drag-over
    event.target.closest('.cantiere').classList.remove('drag-over');
    
    // Rimuovi la classe dragging dall'elemento trascinato
    document.querySelector('.dragging')?.classList.remove('dragging');
}

function rimuoviOperaioDaCantiere(operaioId) {
    const operaio = operai.find(o => o.id === operaioId);
    if (operaio) {
        operaio.cantiere = null;
        renderOperai();
        renderCantieri();
    }
}

// === MENU ===
function toggleMenu() {
    const dropdown = document.getElementById('menu-dropdown');
    dropdown.classList.toggle('hidden');
}

function closeMenu() {
    const dropdown = document.getElementById('menu-dropdown');
    dropdown.classList.add('hidden');
}

// === OPERAI CRUD ===
function addOperaio() {
    currentEditingOperaio = null;
    document.getElementById('operaio-modal-title').textContent = 'Aggiungi Operaio';
    document.getElementById('operaio-form').reset();
    document.getElementById('operaio-modal').classList.remove('hidden');
}

function editOperaio(id) {
    const operaio = operai.find(o => o.id === id);
    if (!operaio) return;
    
    currentEditingOperaio = operaio;
    document.getElementById('operaio-modal-title').textContent = 'Modifica Operaio';
    document.getElementById('operaio-nome').value = operaio.nome;
    document.getElementById('operaio-email').value = operaio.email;
    document.getElementById('operaio-telefono').value = operaio.telefono;
    document.getElementById('operaio-specializzazione').value = operaio.specializzazione;
    document.getElementById('operaio-livello').value = operaio.livello;
    document.getElementById('operaio-preposto').checked = operaio.preposto;
    document.getElementById('operaio-modal').classList.remove('hidden');
}

function saveOperaio() {
    const nome = document.getElementById('operaio-nome').value;
    const email = document.getElementById('operaio-email').value;
    const telefono = document.getElementById('operaio-telefono').value;
    const specializzazione = document.getElementById('operaio-specializzazione').value;
    const livello = parseInt(document.getElementById('operaio-livello').value);
    const preposto = document.getElementById('operaio-preposto').checked;
    
    if (!nome || !email) {
        alert('Nome e email sono obbligatori!');
        return;
    }
    
    const avatar = specializzazione === 'Elettricista' ? '⚡' : '🔧';
    
    if (currentEditingOperaio) {
        // Modifica operaio esistente
        currentEditingOperaio.nome = nome;
        currentEditingOperaio.email = email;
        currentEditingOperaio.telefono = telefono;
        currentEditingOperaio.specializzazione = specializzazione;
        currentEditingOperaio.livello = livello;
        currentEditingOperaio.preposto = preposto;
        currentEditingOperaio.avatar = avatar;
    } else {
        // Aggiungi nuovo operaio
        const nuovoOperaio = {
            id: nextOperaioId++,
            nome,
            email,
            telefono,
            specializzazione,
            livello,
            preposto,
            avatar,
            cantiere: null
        };
        operai.push(nuovoOperaio);
    }
    
    renderOperai();
    renderCantieri();
    closeOperaioModal();
}

function closeOperaioModal() {
    document.getElementById('operaio-modal').classList.add('hidden');
    currentEditingOperaio = null;
}

function deleteOperaio(id) {
    if (confirm('Sei sicuro di voler eliminare questo operaio?')) {
        operai = operai.filter(o => o.id !== id);
        renderOperai();
        renderCantieri();
    }
}

// === CANTIERI CRUD ===
function addCantiere() {
    currentEditingCantiere = null;
    document.getElementById('cantiere-modal-title').textContent = 'Aggiungi Cantiere';
    document.getElementById('cantiere-form').reset();
    document.getElementById('cantiere-orario-inizio').value = '08:00';
    document.getElementById('cantiere-orario-fine').value = '17:00';
    document.getElementById('cantiere-modal').classList.remove('hidden');
}

function editCantiere(id) {
    const cantiere = cantieri.find(c => c.id === id);
    if (!cantiere) return;
    
    currentEditingCantiere = cantiere;
    document.getElementById('cantiere-modal-title').textContent = 'Modifica Cantiere';
    document.getElementById('cantiere-nome').value = cantiere.nome;
    document.getElementById('cantiere-tipo').value = cantiere.tipo;
    document.getElementById('cantiere-orario-inizio').value = cantiere.timeSlot.start;
    document.getElementById('cantiere-orario-fine').value = cantiere.timeSlot.end;
    document.getElementById('cantiere-modal').classList.remove('hidden');
}

function saveCantiere() {
    const nome = document.getElementById('cantiere-nome').value;
    const tipo = document.getElementById('cantiere-tipo').value;
    const orarioInizio = document.getElementById('cantiere-orario-inizio').value;
    const orarioFine = document.getElementById('cantiere-orario-fine').value;
    
    if (!nome) {
        alert('Il nome del cantiere è obbligatorio!');
        return;
    }
    
    if (currentEditingCantiere) {
        // Modifica cantiere esistente
        currentEditingCantiere.nome = nome;
        currentEditingCantiere.tipo = tipo;
        currentEditingCantiere.timeSlot.start = orarioInizio;
        currentEditingCantiere.timeSlot.end = orarioFine;
    } else {
        // Aggiungi nuovo cantiere
        const nuovoCantiere = {
            id: nextCantiereId++,
            nome,
            tipo,
            x: Math.random() * 400 + 50,
            y: Math.random() * 300 + 50,
            operai: [],
            calendarSelections: {},
            timeSlot: {
                start: orarioInizio,
                end: orarioFine
            }
        };
        cantieri.push(nuovoCantiere);
    }
    
    renderCantieri();
    closeCantiereModal();
}

function closeCantiereModal() {
    document.getElementById('cantiere-modal').classList.add('hidden');
    currentEditingCantiere = null;
}

function deleteCantiere(id) {
    if (confirm('Sei sicuro di voler eliminare questo cantiere?')) {
        // Libera tutti gli operai del cantiere
        operai.forEach(o => {
            if (o.cantiere === id) {
                o.cantiere = null;
            }
        });
        
        cantieri = cantieri.filter(c => c.id !== id);
        renderOperai();
        renderCantieri();
    }
}

// === MENU CONTESTUALE CANTIERI ===
function showCantiereContextMenu(event, cantiereId) {
    event.preventDefault();
    event.stopPropagation();
    
    // Rimuovi eventuali menu esistenti
    const existingMenu = document.querySelector('.context-menu');
    if (existingMenu) {
        document.body.removeChild(existingMenu);
    }
    
    const contextMenu = document.createElement('div');
    contextMenu.className = 'context-menu';
    contextMenu.style.cssText = `
        position: fixed;
        background: white;
        border: 1px solid #ccc;
        border-radius: 4px;
        box-shadow: 0 2px 10px rgba(0,0,0,0.2);
        z-index: 9999;
        left: ${event.clientX}px;
        top: ${event.clientY}px;
        min-width: 150px;
    `;
    
    contextMenu.innerHTML = `
        <div style="padding: 8px 12px; cursor: pointer; border-bottom: 1px solid #eee;" onclick="editCantiere(${cantiereId}); removeContextMenu();">
            ✏️ Modifica Cantiere
        </div>
        <div style="padding: 8px 12px; cursor: pointer; color: #d32f2f;" onclick="deleteCantiere(${cantiereId}); removeContextMenu();">
            🗑️ Elimina Cantiere
        </div>
    `;
    
    document.body.appendChild(contextMenu);
    
    // Rimuovi il menu quando si clicca altrove
    setTimeout(() => {
        const removeMenu = (e) => {
            if (!contextMenu.contains(e.target)) {
                removeContextMenu();
                document.removeEventListener('click', removeMenu);
            }
        };
        document.addEventListener('click', removeMenu);
    }, 100);
}

function removeContextMenu() {
    const contextMenu = document.querySelector('.context-menu');
    if (contextMenu) {
        document.body.removeChild(contextMenu);
    }
}

// === CALENDARIO ===
function toggleCalendarDay(dayKey) {
    const dayElement = document.querySelector(`[data-date="${dayKey}"]`);
    if (dayElement.classList.contains('disabled')) return;
    
    dayElement.classList.toggle('selected');
}

// === RICERCA ===
function focusSearchOperai() {
    document.getElementById('search-operai').focus();
}

function focusSearchCantieri() {
    document.getElementById('search-cantieri').focus();
}

function filterOperai(query) {
    const operaiCards = document.querySelectorAll('.operaio-card');
    operaiCards.forEach(card => {
        const nome = card.querySelector('.operaio-nome').textContent.toLowerCase();
        const specializzazione = card.querySelector('.operaio-specializzazione').textContent.toLowerCase();
        
        if (nome.includes(query.toLowerCase()) || specializzazione.includes(query.toLowerCase())) {
            card.style.display = 'block';
        } else {
            card.style.display = 'none';
        }
    });
}

function filterCantieri(query) {
    const cantiereCards = document.querySelectorAll('.cantiere');
    cantiereCards.forEach(card => {
        const nome = card.querySelector('.cantiere-nome').textContent.toLowerCase();
        const tipo = card.querySelector('.cantiere-tipo').textContent.toLowerCase();
        
        if (nome.includes(query.toLowerCase()) || tipo.includes(query.toLowerCase())) {
            card.style.display = 'block';
        } else {
            card.style.display = 'none';
        }
    });
}

// === IMPOSTAZIONI ===
function showSettings() {
    loadSettings();
    document.getElementById('settings-modal').classList.remove('hidden');
}

function closeSettings() {
    document.getElementById('settings-modal').classList.add('hidden');
}

function showTab(tabName) {
    // Nascondi tutti i tab
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.classList.remove('active');
    });
    document.querySelectorAll('.tab-button').forEach(button => {
        button.classList.remove('active');
    });
    
    // Mostra il tab selezionato
    document.getElementById(tabName).classList.add('active');
    document.querySelector(`[onclick="showTab('${tabName}')"]`).classList.add('active');
}

function loadSettings() {
    // Carica impostazioni email
    document.getElementById('smtp-server').value = emailSettings.server;
    document.getElementById('smtp-port').value = emailSettings.port;
    document.getElementById('smtp-username').value = emailSettings.username;
    document.getElementById('smtp-password').value = emailSettings.password;
    document.getElementById('smtp-ssl').checked = emailSettings.ssl;
    document.getElementById('email-subject').value = emailSettings.subject;
    document.getElementById('email-template').value = emailSettings.template;
    
    // Carica impostazioni generali
    document.getElementById('company-name').value = generalSettings.companyName;
    document.getElementById('timezone').value = generalSettings.timezone;
    document.getElementById('language').value = generalSettings.language;
    document.getElementById('date-format').value = generalSettings.dateFormat;
}

function saveSettings() {
    // Salva impostazioni email
    emailSettings.server = document.getElementById('smtp-server').value;
    emailSettings.port = parseInt(document.getElementById('smtp-port').value);
    emailSettings.username = document.getElementById('smtp-username').value;
    emailSettings.password = document.getElementById('smtp-password').value;
    emailSettings.ssl = document.getElementById('smtp-ssl').checked;
    emailSettings.subject = document.getElementById('email-subject').value;
    emailSettings.template = document.getElementById('email-template').value;
    
    // Salva impostazioni generali
    generalSettings.companyName = document.getElementById('company-name').value;
    generalSettings.timezone = document.getElementById('timezone').value;
    generalSettings.language = document.getElementById('language').value;
    generalSettings.dateFormat = document.getElementById('date-format').value;
    
    alert('Impostazioni salvate correttamente!');
    closeSettings();
}

function testEmailConnection() {
    // Simulazione test connessione email
    alert('Test connessione email in corso...\n\nConnessione stabilita correttamente!');
}

// === IMPORT/EXPORT EXCEL ===
function showImportExport() {
    document.getElementById('import-export-modal').classList.remove('hidden');
}

function closeImportExport() {
    document.getElementById('import-export-modal').classList.add('hidden');
}

function handleExcelImport(input) {
    const file = input.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const data = new Uint8Array(e.target.result);
            const workbook = XLSX.read(data, {type: 'array'});
            const sheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[sheetName];
            const jsonData = XLSX.utils.sheet_to_json(worksheet);
            
            // Importa i dati
            jsonData.forEach(row => {
                const nuovoOperaio = {
                    id: nextOperaioId++,
                    nome: row.Nome || '',
                    email: row.Email || '',
                    telefono: row.Telefono || '',
                    specializzazione: row.Specializzazione || 'Elettricista',
                    livello: parseInt(row.Livello) || 3,
                    preposto: row.Preposto === 'Sì' || row.Preposto === 'Si' || row.Preposto === true,
                    avatar: (row.Specializzazione === 'Elettricista') ? '⚡' : '🔧',
                    cantiere: null
                };
                operai.push(nuovoOperaio);
            });
            
            renderOperai();
            alert(`Importati ${jsonData.length} operai con successo!`);
        } catch (error) {
            alert('Errore nell\'importazione del file Excel. Verifica il formato.');
        }
    };
    reader.readAsArrayBuffer(file);
}

function exportToExcel() {
    // Prepara i dati per l'export
    const exportData = operai.map(operaio => ({
        Nome: operaio.nome,
        Email: operaio.email,
        Telefono: operaio.telefono,
        Specializzazione: operaio.specializzazione,
        Livello: operaio.livello,
        Preposto: operaio.preposto ? 'Sì' : 'No',
        Cantiere: operaio.cantiere ? cantieri.find(c => c.id === operaio.cantiere)?.nome : 'Nessuno'
    }));
    
    // Crea il workbook
    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Operai');
    
    // Scarica il file
    const today = new Date().toISOString().split('T')[0];
    XLSX.writeFile(workbook, `operai_${today}.xlsx`);
}

// === EVENTI GLOBALI ===
document.addEventListener('DOMContentLoaded', function() {
    // Chiudi i dropdown quando si clicca fuori
    document.addEventListener('click', function(event) {
        if (!event.target.closest('.menu-container')) {
            closeMenu();
        }
    });
    
    // Gestisci la chiusura delle modal con ESC
    document.addEventListener('keydown', function(event) {
        if (event.key === 'Escape') {
            closeOperaioModal();
            closeCantiereModal();
            closeSettings();
            closeImportExport();
            removeContextMenu();
        }
    });
});

// === ESPORTAZIONE FUNZIONI GLOBALI ===
window.startApp = startApp;
window.logout = logout;
window.toggleMenu = toggleMenu;
window.closeMenu = closeMenu;
window.addOperaio = addOperaio;
window.editOperaio = editOperaio;
window.saveOperaio = saveOperaio;
window.closeOperaioModal = closeOperaioModal;
window.deleteOperaio = deleteOperaio;
window.addCantiere = addCantiere;
window.editCantiere = editCantiere;
window.saveCantiere = saveCantiere;
window.closeCantiereModal = closeCantiereModal;
window.deleteCantiere = deleteCantiere;
window.showCantiereContextMenu = showCantiereContextMenu;
window.removeContextMenu = removeContextMenu;
window.focusSearchOperai = focusSearchOperai;
window.focusSearchCantieri = focusSearchCantieri;
window.filterOperai = filterOperai;
window.filterCantieri = filterCantieri;
window.showSettings = showSettings;
window.closeSettings = closeSettings;
window.showTab = showTab;
window.saveSettings = saveSettings;
window.testEmailConnection = testEmailConnection;
window.showImportExport = showImportExport;
window.closeImportExport = closeImportExport;
window.handleExcelImport = handleExcelImport;
window.exportToExcel = exportToExcel;
window.dragStart = dragStart;
window.allowDrop = allowDrop;
window.dragEnter = dragEnter;
window.dragLeave = dragLeave;
window.drop = drop;
window.rimuoviOperaioDaCantiere = rimuoviOperaioDaCantiere;
window.toggleCalendarDay = toggleCalendarDay;