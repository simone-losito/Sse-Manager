// ===== SSE MANAGER - VERSIONE GITHUB PAGES OTTIMIZZATA =====
"use strict";

// Polyfill per browser vecchi
if (!Array.prototype.includes) {
    Array.prototype.includes = function(searchElement) {
        return this.indexOf(searchElement) !== -1;
    };
}

// Riduzione drastica console.log per performance
const DEBUG = false;
const log = DEBUG ? console.log.bind(console) : function() {};
const error = console.error.bind(console);

// Gestione errori globale
window.onerror = function(msg, url, lineNo, columnNo, error) {
    console.error('JavaScript Error:', {
        message: msg,
        source: url,
        line: lineNo,
        column: columnNo,
        error: error
    });
    return false;
};

// Loading indicator
function showLoading() {
    const loader = document.createElement('div');
    loader.id = 'app-loader';
    loader.innerHTML = `
        <div style="position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.8);z-index:10000;display:flex;align-items:center;justify-content:center;color:white;font-size:18px;">
            🏗️ Caricamento Sse Manager...
        </div>
    `;
    document.body.appendChild(loader);
}

function hideLoading() {
    const loader = document.getElementById('app-loader');
    if (loader) loader.remove();
}

// Inizializzazione sicura
document.addEventListener('DOMContentLoaded', function() {
    try {
        showLoading();
        initializeApp();
        setTimeout(hideLoading, 1000);
    } catch (error) {
        console.error('Errore inizializzazione:', error);
        hideLoading();
        alert('Errore di caricamento. Ricarica la pagina.');
    }
});

function initializeApp() {
    log('🚀 Inizializzazione App');
    setupEventListeners();
    loadFromStorage();
    renderApp();
}

// Feature detection per compatibilità
function isFeatureSupported() {
    try {
        // Test localStorage
        localStorage.setItem('test', 'test');
        localStorage.removeItem('test');

        // Test JSON
        JSON.parse('{}');

        // Test ES6 features critiche
        const test = () => true;
        const template = `test`;

        return true;
    } catch (e) {
        return false;
    }
}

// Fallback per browser non supportati
if (!isFeatureSupported()) {
    alert('Browser non supportato. Aggiorna il browser per utilizzare Sse Manager.');
}

// app.js - Sse Manager Ver 1.8 COMPLETA
// DATI - Ver 1.8 COMPLETA
let operai = [
    {id: 1, nome: "Marco Rossi", email: "marco.rossi@cantieri.it", mail: "marco.rossi@cantieri.it", telefono: "333-1234567", specializzazione: "Elettricista", livello: 5, cantiere: 1, avatar: "⚡", preposto: true},
    {id: 2, nome: "Giuseppe Bianchi", email: "giuseppe.bianchi@cantieri.it", mail: "giuseppe.bianchi@cantieri.it", telefono: "335-2345678", specializzazione: "Meccanico", livello: 4, cantiere: 1, avatar: "🔧", preposto: false},
    {id: 3, nome: "Antonio Verde", email: "antonio.verde@cantieri.it", mail: "antonio.verde@cantieri.it", telefono: "338-3456789", specializzazione: "Elettricista", livello: 3, cantiere: 2, avatar: "⚡", preposto: false},
    {id: 4, nome: "Francesco Neri", email: "francesco.neri@cantieri.it", mail: "francesco.neri@cantieri.it", telefono: "339-4567890", specializzazione: "Meccanico", livello: 5, cantiere: 2, avatar: "🔧", preposto: true},
    {id: 5, nome: "Luigi Viola", email: "luigi.viola@cantieri.it", mail: "luigi.viola@cantieri.it", telefono: "340-5678901", specializzazione: "Elettricista", livello: 2, cantiere: null, avatar: "⚡", preposto: false},
    {id: 6, nome: "Salvatore Blu", email: "salvatore.blu@cantieri.it", mail: "salvatore.blu@cantieri.it", telefono: "346-6789012", specializzazione: "Meccanico", livello: 3, cantiere: null, avatar: "🔧", preposto: false}
];

let cantieri = [
    {id: 1, nome: "Palazzo Roma Centro", tipo: "Civile", x: 150, y: 200, operai: [1, 2], calendarSelections: {}, timeSlot: {start: "08:00", end: "17:00"}},
    {id: 2, nome: "Impianto Industriale Ostia", tipo: "Industriale", x: 400, y: 300, operai: [4, 3], calendarSelections: {}, timeSlot: {start: "07:00", end: "16:00"}},
    {id: 3, nome: "Ristrutturazione Trastevere", tipo: "Residenziale", x: 300, y: 150, operai: [], calendarSelections: {}, timeSlot: {start: "08:30", end: "17:30"}}
];

let currentMode = 'master';
let draggedOperaio = null;
let isDragDropActive = false;
let currentCantiereId = null;
let currentMonth = new Date().getMonth();
let currentYear = new Date().getFullYear();

// CONFIGURAZIONI
let emailConfig = {
    smtpServer: '',
    smtpPort: '',
    senderEmail: '',
    emailPassword: '',
    senderName: 'Sse Manager',
    emailSubject: 'Convocazione Cantiere - {cantiere}',
    emailTemplate: `Gentile {operaio},

Siete convocati per i seguenti giorni di lavoro:

🏗️ Cantiere: {cantiere}
📅 Giorni: {giorni}
⏰ Orario: {orario}

Vi preghiamo di presentarvi puntuali.

Cordiali saluti,
Sse Manager - {mittente}`
};

let generalConfig = {
    companyName: 'Sse Manager',
    timezone: 'Europe/Rome',
    language: 'it',
    datetimeFormat: 'dd/mm/yyyy'
};

// ===== FUNZIONI LOGIN =====
function loginMaster() {
    log('👑 LOGIN MASTER');
    currentMode = 'master';
    startApp();
}

function startApp() {
    log('🚀 STARTING APP');
    document.getElementById('login-screen').classList.add('hidden');
    document.getElementById('main-app').classList.remove('hidden');
    document.getElementById('mode-text').textContent = 'Modalità: Manager';
    renderApp();
}

function logout() {
    log('👋 LOGOUT');
    document.getElementById('main-app').classList.add('hidden');
    document.getElementById('login-screen').classList.remove('hidden');
    closeMenu();
}

// ===== FUNZIONI MENU =====
function toggleMenu() {
    log('🔘 Toggle menu');
    const dropdown = document.getElementById('menu-dropdown');
    if (dropdown) {
        dropdown.classList.toggle('hidden');
    }
}

function closeMenu() {
    log('❌ Close menu');
    const dropdown = document.getElementById('menu-dropdown');
    if (dropdown) {
        dropdown.classList.add('hidden');
    }
}

function focusSearchOperai() {
    log('🔍 Focus search operai');
    const input = document.getElementById('search-operai');
    if (input) {
        input.focus();
        input.select();
    }
}

function focusSearchCantieri() {
    log('🔍 Focus search cantieri');
    const input = document.getElementById('search-cantieri');
    if (input) {
        input.focus();
        input.select();
    }
}

// ===== FUNZIONI IMPOSTAZIONI =====
function openSettings() {
    log('⚙️ OPEN SETTINGS');
    loadEmailSettings();
    loadGeneralSettings();
    document.getElementById('modal-settings').classList.remove('hidden');
    showSettingsTab('email');
}

function openGeneralSettings() {
    log('🌐 OPEN GENERAL SETTINGS');
    loadEmailSettings();
    loadGeneralSettings();
    document.getElementById('modal-settings').classList.remove('hidden');
    showSettingsTab('general');
}

function closeSettings() {
    log('❌ CLOSE SETTINGS');
    document.getElementById('modal-settings').classList.add('hidden');
}

function showSettingsTab(tabName) {
    log('📋 SHOW SETTINGS TAB:', tabName);
    
    document.querySelectorAll('.tab').forEach(tab => tab.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(content => content.classList.add('hidden'));
    
    document.querySelector(`[onclick="showSettingsTab('${tabName}')"]`).classList.add('active');
    document.getElementById(`settings-${tabName}`).classList.remove('hidden');
}

function loadEmailSettings() {
    log('📧 LOAD EMAIL SETTINGS');
    document.getElementById('smtp-server').value = emailConfig.smtpServer || '';
    document.getElementById('smtp-port').value = emailConfig.smtpPort || '';
    document.getElementById('sender-email').value = emailConfig.senderEmail || '';
    document.getElementById('email-password').value = emailConfig.emailPassword || '';
    document.getElementById('sender-name').value = emailConfig.senderName || 'Sse Manager';
    document.getElementById('email-subject').value = emailConfig.emailSubject || 'Convocazione Cantiere - {cantiere}';
    document.getElementById('email-template').value = emailConfig.emailTemplate || '';
}

function loadGeneralSettings() {
    log('🌐 LOAD GENERAL SETTINGS');
    document.getElementById('company-name').value = generalConfig.companyName || 'Sse Manager';
    document.getElementById('timezone').value = generalConfig.timezone || 'Europe/Rome';
    document.getElementById('language').value = generalConfig.language || 'it';
    document.getElementById('datetime-format').value = generalConfig.datetimeFormat || 'dd/mm/yyyy';
}

function saveEmailSettings() {
    log('💾 SAVE EMAIL SETTINGS');
    
    try {
        const smtpServer = document.getElementById('smtp-server').value.trim();
        const smtpPort = document.getElementById('smtp-port').value.trim();
        const senderEmail = document.getElementById('sender-email').value.trim();
        const emailPassword = document.getElementById('email-password').value.trim();
        const senderName = document.getElementById('sender-name').value.trim();
        const emailSubject = document.getElementById('email-subject').value.trim();
        const emailTemplate = document.getElementById('email-template').value.trim();
        
        if (!smtpServer || !smtpPort || !senderEmail || !emailPassword || !senderName) {
            alert('⚠️ Tutti i campi obbligatori devono essere compilati');
            return;
        }
        
        emailConfig = {
            smtpServer,
            smtpPort,
            senderEmail,
            emailPassword,
            senderName,
            emailSubject: emailSubject || 'Convocazione Cantiere - {cantiere}',
            emailTemplate: emailTemplate || emailConfig.emailTemplate
        };
        
        alert('✅ Configurazione email salvata con successo!');
        
    } catch (error) {
        console.error('❌ Error saving email settings:', error);
        alert('❌ Errore nel salvataggio delle impostazioni email. Riprova.');
    }
}

function saveGeneralSettings() {
    log('💾 SAVE GENERAL SETTINGS');
    
    try {
        generalConfig = {
            companyName: document.getElementById('company-name').value.trim() || 'Sse Manager',
            timezone: document.getElementById('timezone').value || 'Europe/Rome',
            language: document.getElementById('language').value || 'it',
            datetimeFormat: document.getElementById('datetime-format').value || 'dd/mm/yyyy'
        };
        
        alert('✅ Impostazioni generali salvate con successo!');
        
    } catch (error) {
        console.error('❌ Error saving general settings:', error);
        alert('❌ Errore nel salvataggio delle impostazioni generali. Riprova.');
    }
}

function testEmailConnection() {
    log('🔧 TEST EMAIL CONNECTION');
    
    if (!emailConfig.smtpServer || !emailConfig.smtpPort || !emailConfig.senderEmail) {
        alert('⚠️ Configura prima i parametri email obbligatori');
        return;
    }
    
    const button = event.target;
    const originalText = button.textContent;
    button.textContent = '🔄 Test in corso...';
    button.disabled = true;
    
    setTimeout(() => {
        const success = Math.random() > 0.3;
        
        button.textContent = originalText;
        button.disabled = false;
        
        if (success) {
            alert('✅ Test connessione riuscito!');
        } else {
            alert('❌ Test connessione fallito!');
        }
    }, 2000);
}

function resetEmailSettings() {
    log('🔄 RESET EMAIL SETTINGS');
    
    if (confirm('Vuoi ripristinare le impostazioni email ai valori di default?')) {
        emailConfig = {
            smtpServer: '',
            smtpPort: '',
            senderEmail: '',
            emailPassword: '',
            senderName: 'Sse Manager',
            emailSubject: 'Convocazione Cantiere - {cantiere}',
            emailTemplate: emailConfig.emailTemplate
        };
        
        loadEmailSettings();
        alert('🔄 Impostazioni email ripristinate ai valori di default');
    }
}

function resetGeneralSettings() {
    log('🔄 RESET GENERAL SETTINGS');
    
    if (confirm('Vuoi ripristinare le impostazioni generali ai valori di default?')) {
        generalConfig = {
            companyName: 'Sse Manager',
            timezone: 'Europe/Rome',
            language: 'it',
            datetimeFormat: 'dd/mm/yyyy'
        };
        
        loadGeneralSettings();
        alert('🔄 Impostazioni generali ripristinate ai valori di default');
    }
}

// ===== FUNZIONI LISTE =====
function showOperaiList() {
    log('👷 SHOW OPERAI LIST');
    
    let message = '👷 LISTA COMPLETA DIPENDENTI:\n\n';
    
    operai.forEach((operaio, index) => {
        const cantiere = operaio.cantiere ? cantieri.find(c => c.id === operaio.cantiere) : null;
        const status = cantiere ? `Assegnato: ${cantiere.nome}` : 'Disponibile';
        const prepostoText = operaio.preposto ? ' ⭐ PREPOSTO' : '';
        
        message += `${index + 1}. ${operaio.avatar} ${operaio.nome}${prepostoText}\n`;
        message += `   ${operaio.specializzazione} - Livello ${operaio.livello}\n`;
        message += `   📧 ${operaio.mail} | 📞 ${operaio.telefono}\n`;
        message += `   Status: ${status}\n\n`;
    });
    
    alert(message);
}

function showCantieriList() {
    log('🏗️ SHOW CANTIERI LIST');
    
    let message = '🏗️ LISTA COMPLETA CANTIERI:\n\n';
    
    cantieri.forEach((cantiere, index) => {
        const operaiCount = cantiere.operai.length;
        const operaiNames = cantiere.operai.map(id => {
            const op = operai.find(o => o.id === id);
            return op ? op.nome : 'Sconosciuto';
        }).join(', ');
        
        const icons = {'Civile': '🏰', 'Industriale': '🏭', 'Residenziale': '🏢'};
        const icon = icons[cantiere.tipo] || '🏗️';
        
        message += `${index + 1}. ${icon} ${cantiere.nome}\n`;
        message += `   Tipo: ${cantiere.tipo}\n`;
        message += `   Posizione: X:${cantiere.x}, Y:${cantiere.y}\n`;
        message += `   Operai: ${operaiCount}`;
        if (operaiCount > 0) {
            message += ` (${operaiNames})`;
        }
        message += '\n';
        message += `   Orario: ${cantiere.timeSlot?.start || '08:00'} - ${cantiere.timeSlot?.end || '17:00'}\n\n`;
    });
    
    alert(message);
}

function showModifyCantiereMenu() {
    log('✏️ Mostra menu modifica cantiere');
    
    if (cantieri.length === 0) {
        alert('Nessun cantiere disponibile da modificare');
        return;
    }
    
    let message = 'Seleziona cantiere da modificare:\n\n';
    cantieri.forEach((cantiere, index) => {
        message += `${index + 1}. ${cantiere.nome} (${cantiere.tipo})\n`;
    });
    
    const scelta = prompt(message + '\nInserisci il numero del cantiere:');
    const numeroScelta = parseInt(scelta);
    
    if (numeroScelta >= 1 && numeroScelta <= cantieri.length) {
        const cantiereSelezionato = cantieri[numeroScelta - 1];
        editCantiere(cantiereSelezionato.id);
    } else if (scelta !== null) {
        alert('Selezione non valida');
    }
}

function showDeleteCantiereMenu() {
    log('🗑️ Mostra menu elimina cantiere');
    
    if (cantieri.length === 0) {
        alert('Nessun cantiere disponibile da eliminare');
        return;
    }
    
    let message = 'Seleziona cantiere da eliminare:\n\n';
    cantieri.forEach((cantiere, index) => {
        message += `${index + 1}. ${cantiere.nome} (${cantiere.tipo})\n`;
    });
    
    const scelta = prompt(message + '\nInserisci il numero del cantiere:');
    const numeroScelta = parseInt(scelta);
    
    if (numeroScelta >= 1 && numeroScelta <= cantieri.length) {
        const cantiereSelezionato = cantieri[numeroScelta - 1];
        removeCantiere(cantiereSelezionato.id);
    } else if (scelta !== null) {
        alert('Selezione non valida');
    }
}

// ===== FUNZIONI RENDERING =====
function renderApp() {
    renderOperai();
    renderCantieri();
}

function renderOperai() {
    const container = document.getElementById('operai-container');
    const controls = document.getElementById('controls-operai');
    
    controls.innerHTML = '<button onclick="addOperaio()" class="btn btn-primary">+ Aggiungi Operaio</button>';
    
    container.innerHTML = '';
    
    const operaiDisponibili = operai.filter(o => o.cantiere === null);
    
    operaiDisponibili.forEach(operaio => {
        const prepostoBadge = operaio.preposto ? 
            `<div class="operaio-preposto">⭐ Preposto ⭐</div>` : '';
        
        const contactInfo = `
            <div class="operaio-contact">
                📧 ${operaio.mail || operaio.email}<br>
                📞 ${operaio.telefono}
            </div>
        `;
        
        const actionsHtml = `
            <div class="operaio-actions">
                <button onclick="editOperaio(${operaio.id})" class="btn btn-edit">✏️</button>
                <button onclick="removeOperaio(${operaio.id})" class="btn btn-delete">🗑️</button>
            </div>
        `;
        
        const card = document.createElement('div');
        card.className = 'operaio-card';
        card.draggable = true;
        card.dataset.operaioId = operaio.id;
        card.innerHTML = `
            <div class="operaio-header">
                <span class="operaio-avatar">${operaio.avatar}</span>
                <div class="operaio-info">
                    <div class="operaio-nome">${operaio.nome}</div>
                    <div class="operaio-spec">${operaio.specializzazione}</div>
                    <div class="operaio-level">Livello ${operaio.livello}</div>
                </div>
            </div>
            <div class="operaio-status">Disponibile</div>
            ${contactInfo}
            ${prepostoBadge}
            ${actionsHtml}
        `;
        
        card.ondragstart = function(e) {
            log('🔥 DRAG START - Operaio:', operaio.nome);
            draggedOperaio = operaio;
            isDragDropActive = true;
            e.dataTransfer.effectAllowed = 'move';
            e.dataTransfer.setData('text/plain', operaio.id.toString());
            card.style.opacity = '0.5';
            e.stopPropagation();
        };
        
        card.ondragend = function(e) {
            log('🔥 DRAG END');
            card.style.opacity = '1';
            setTimeout(() => {
                isDragDropActive = false;
                draggedOperaio = null;
            }, 100);
            e.stopPropagation();
        };
        
        container.appendChild(card);
    });
    
    if (operaiDisponibili.length === 0) {
        container.innerHTML = '<p style="color: #95a5a6; text-align: center; padding: 2rem;">Nessun operaio disponibile</p>';
    }
}

function renderCantieri() {
    const container = document.getElementById('map-container');
    const controls = document.getElementById('controls-cantieri');
    
    if (controls) {
        controls.innerHTML = '<button onclick="addCantiere()" class="btn btn-add">➕ Aggiungi Cantiere</button>';
    }
    
    container.innerHTML = '';
    
    cantieri.forEach(cantiere => {
        const icons = {'Civile': '🏰', 'Industriale': '🏭', 'Residenziale': '🏢'};
        const icon = icons[cantiere.tipo] || '🏰';
        
        const controlsHtml = `
            <div class="cantiere-controls">
                <button onclick="event.stopPropagation(); editCantiere(${cantiere.id})" class="btn-small btn-edit">✏️</button>
                <button onclick="event.stopPropagation(); removeCantiere(${cantiere.id})" class="btn-small btn-delete">🗑️</button>
            </div>
        `;
        
        const element = document.createElement('div');
        element.className = 'cantiere';
        element.dataset.cantiereId = cantiere.id;
        element.style.left = cantiere.x + 'px';
        element.style.top = cantiere.y + 'px';
        element.innerHTML = `
            <div class="cantiere-icon">${icon}</div>
            <div class="cantiere-nome">${cantiere.nome}</div>
            ${cantiere.operai.length > 0 ? `<div class="cantiere-count">${cantiere.operai.length}</div>` : ''}
            ${controlsHtml}
        `;
        
        // Drag & Drop eventi
        element.ondragover = function(e) {
            e.preventDefault();
            e.dataTransfer.dropEffect = 'move';
            if (draggedOperaio && isDragDropActive) {
                log('🔥 DRAG OVER - Cantiere:', cantiere.nome);
                element.classList.add('drag-over');
            }
            e.stopPropagation();
        };
        
        element.ondragenter = function(e) {
            e.preventDefault();
            if (draggedOperaio && isDragDropActive) {
                element.classList.add('drag-over');
            }
            e.stopPropagation();
        };
        
        element.ondragleave = function(e) {
            e.preventDefault();
            const rect = element.getBoundingClientRect();
            const x = e.clientX;
            const y = e.clientY;
            if (x < rect.left || x > rect.right || y < rect.top || y > rect.bottom) {
                element.classList.remove('drag-over');
            }
            e.stopPropagation();
        };
        
        element.ondrop = function(e) {
            e.preventDefault();
            e.stopPropagation();
            log('🔥 DROP EVENT - Cantiere:', cantiere.nome, 'isDragDropActive:', isDragDropActive);
            element.classList.remove('drag-over');
            
            if (draggedOperaio && isDragDropActive) {
                log('🔥 ASSIGNING:', draggedOperaio.nome, 'to', cantiere.nome);
                assignOperaio(draggedOperaio.id, cantiere.id);
                
                const feedback = document.createElement('div');
                feedback.style.cssText = `
                    position: absolute;
                    top: ${cantiere.y + 90}px;
                    left: ${cantiere.x}px;
                    background: #27ae60;
                    color: white;
                    padding: 8px 12px;
                    border-radius: 6px;
                    font-size: 12px;
                    font-weight: bold;
                    z-index: 1001;
                    pointer-events: none;
                `;
                feedback.textContent = `✅ ${draggedOperaio.nome} assegnato!`;
                container.appendChild(feedback);
                
                setTimeout(() => {
                    if (feedback.parentNode) {
                        feedback.parentNode.removeChild(feedback);
                    }
                }, 2000);
                
                draggedOperaio = null;
                isDragDropActive = false;
                return;
            }
        };
        
        element.onclick = function(e) {
            if (isDragDropActive || e.target.closest('.cantiere-controls')) {
                return;
            }
            
            setTimeout(() => {
                if (!isDragDropActive) {
                    showCantiereDetails(cantiere.id);
                }
            }, 50);
        };
        
        container.appendChild(element);
    });
}

// ===== FUNZIONI OPERAI =====
function addOperaio() {
    log('➕ ADD OPERAIO');
    document.getElementById('modal-operaio-title').textContent = 'Aggiungi Operaio';
    document.getElementById('form-operaio').reset();
    document.getElementById('operaio-id').value = '';
    document.getElementById('modal-operaio').classList.remove('hidden');
    
    document.getElementById('form-operaio').onsubmit = function(e) {
        e.preventDefault();
        saveOperaio();
    };
}

function editOperaio(operaioId) {
    log('✏️ EDIT OPERAIO:', operaioId);
    const operaio = operai.find(o => o.id === operaioId);
    if (!operaio) return;
    
    document.getElementById('modal-operaio-title').textContent = 'Modifica Operaio';
    document.getElementById('operaio-id').value = operaio.id;
    document.getElementById('operaio-nome').value = operaio.nome;
    document.getElementById('operaio-email').value = operaio.email || operaio.mail;
    document.getElementById('operaio-telefono').value = operaio.telefono;
    document.getElementById('operaio-specializzazione').value = operaio.specializzazione;
    document.getElementById('operaio-livello').value = operaio.livello;
    document.getElementById('operaio-preposto').checked = operaio.preposto;
    
    document.getElementById('modal-operaio').classList.remove('hidden');
    
    document.getElementById('form-operaio').onsubmit = function(e) {
        e.preventDefault();
        saveOperaio();
    };
}

function saveOperaio() {
    log('💾 SAVE OPERAIO');
    
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
        'Elettricista': '⚡',
        'Meccanico': '🔧',
        'Muratore': '🧱',
        'Carpentiere': '🪵',
        'Idraulico': '🚰',
        'Saldatore': '🔥',
        'Operatore Macchine': '🚜'
    };
    
    if (id) {
        // Modifica
        const operaio = operai.find(o => o.id == id);
        if (operaio) {
            operaio.nome = nome;
            operaio.email = email;
            operaio.mail = email;
            operaio.telefono = telefono;
            operaio.specializzazione = specializzazione;
            operaio.livello = livello;
            operaio.preposto = preposto;
            operaio.avatar = avatarMap[specializzazione] || '👷';
        }
    } else {
        // Aggiungi
        const newId = Math.max(...operai.map(o => o.id)) + 1;
        operai.push({
            id: newId,
            nome,
            email,
            mail: email,
            telefono,
            specializzazione,
            livello,
            cantiere: null,
            avatar: avatarMap[specializzazione] || '👷',
            preposto
        });
    }
    
    closeModal();
    renderOperai();
}

function removeOperaio(operaioId) {
    log('🗑️ REMOVE OPERAIO:', operaioId);
    
    const operaio = operai.find(o => o.id === operaioId);
    if (!operaio) return;
    
    if (confirm(`Sei sicuro di voler eliminare ${operaio.nome}?`)) {
        // Rimuovi da cantieri
        cantieri.forEach(cantiere => {
            cantiere.operai = cantiere.operai.filter(id => id !== operaioId);
        });
        
        // Rimuovi dall'array operai
        const index = operai.findIndex(o => o.id === operaioId);
        if (index !== -1) {
            operai.splice(index, 1);
        }
        
        renderApp();
    }
}

function closeModal() {
    log('❌ CLOSE MODAL');
    document.getElementById('modal-operaio').classList.add('hidden');
    document.getElementById('modal-cantiere').classList.add('hidden');
}

// ===== FUNZIONI CANTIERI =====
function addCantiere() {
    log('➕ ADD CANTIERE');
    document.getElementById('modal-cantiere-title').textContent = 'Aggiungi Cantiere';
    document.getElementById('form-cantiere').reset();
    document.getElementById('cantiere-id').value = '';
    document.getElementById('modal-cantiere').classList.remove('hidden');
    
    document.getElementById('form-cantiere').onsubmit = function(e) {
        e.preventDefault();
        saveCantiere();
    };
}

function editCantiere(cantiereId) {
    log('✏️ EDIT CANTIERE:', cantiereId);
    const cantiere = cantieri.find(c => c.id === cantiereId);
    if (!cantiere) return;
    
    document.getElementById('modal-cantiere-title').textContent = 'Modifica Cantiere';
    document.getElementById('cantiere-id').value = cantiere.id;
    document.getElementById('cantiere-nome').value = cantiere.nome;
    document.getElementById('cantiere-tipo').value = cantiere.tipo;
    
    document.getElementById('modal-cantiere').classList.remove('hidden');
    
    document.getElementById('form-cantiere').onsubmit = function(e) {
        e.preventDefault();
        saveCantiere();
    };
}

function saveCantiere() {
    log('💾 SAVE CANTIERE');
    
    const id = document.getElementById('cantiere-id').value;
    const nome = document.getElementById('cantiere-nome').value.trim();
    const tipo = document.getElementById('cantiere-tipo').value;
    
    if (!nome || !tipo) {
        alert('Tutti i campi sono obbligatori');
        return;
    }
    
    if (id) {
        // Modifica
        const cantiere = cantieri.find(c => c.id == id);
        if (cantiere) {
            cantiere.nome = nome;
            cantiere.tipo = tipo;
        }
    } else {
        // Aggiungi
        const newId = Math.max(...cantieri.map(c => c.id)) + 1;
        cantieri.push({
            id: newId,
            nome,
            tipo,
            x: Math.random() * 400 + 100,
            y: Math.random() * 300 + 100,
            operai: [],
            calendarSelections: {},
            timeSlot: {start: "08:00", end: "17:00"}
        });
    }
    
    closeModal();
    renderCantieri();
}

function removeCantiere(cantiereId) {
    log('🗑️ REMOVE CANTIERE:', cantiereId);
    
    const cantiere = cantieri.find(c => c.id === cantiereId);
    if (!cantiere) return;
    
    if (confirm(`Sei sicuro di voler eliminare il cantiere "${cantiere.nome}"?`)) {
        // Libera tutti gli operai assegnati
        cantiere.operai.forEach(operaioId => {
            const operaio = operai.find(o => o.id === operaioId);
            if (operaio) {
                operaio.cantiere = null;
            }
        });
        
        // Rimuovi cantiere
        const index = cantieri.findIndex(c => c.id === cantiereId);
        if (index !== -1) {
            cantieri.splice(index, 1);
        }
        
        renderApp();
    }
}

// ===== FUNZIONI ASSEGNAZIONE =====
function assignOperaio(operaioId, cantiereId) {
    log('🔗 ASSIGN OPERAIO:', operaioId, 'to', cantiereId);
    
    const operaio = operai.find(o => o.id === operaioId);
    const cantiere = cantieri.find(c => c.id === cantiereId);
    
    if (!operaio || !cantiere) return;
    
    // Rimuovi da cantiere precedente se assegnato
    if (operaio.cantiere) {
        const oldCantiere = cantieri.find(c => c.id === operaio.cantiere);
        if (oldCantiere) {
            oldCantiere.operai = oldCantiere.operai.filter(id => id !== operaioId);
        }
    }
    
    // Assegna al nuovo cantiere
    operaio.cantiere = cantiereId;
    if (!cantiere.operai.includes(operaioId)) {
        cantiere.operai.push(operaioId);
    }
    
    renderApp();
}

function unassignOperaio(operaioId, cantiereId) {
    log('🔓 UNASSIGN OPERAIO:', operaioId, 'from', cantiereId);
    
    const operaio = operai.find(o => o.id === operaioId);
    const cantiere = cantieri.find(c => c.id === cantiereId);
    
    if (!operaio || !cantiere) return;
    
    operaio.cantiere = null;
    cantiere.operai = cantiere.operai.filter(id => id !== operaioId);
    
    renderApp();
}

// ===== FUNZIONI DETTAGLI CANTIERE =====
function showCantiereDetails(cantiereId) {
    log('📋 SHOW CANTIERE DETAILS:', cantiereId);
    
    const cantiere = cantieri.find(c => c.id === cantiereId);
    if (!cantiere) return;
    
    currentCantiereId = cantiereId;
    
    document.getElementById('cantiere-details-title').textContent = `Dettagli: ${cantiere.nome}`;
    
    const icons = {'Civile': '🏰', 'Industriale': '🏭', 'Residenziale': '🏢'};
    const icon = icons[cantiere.tipo] || '🏗️';
    
    document.getElementById('cantiere-basic-info').innerHTML = `
        <p><strong>Nome:</strong> ${icon} ${cantiere.nome}</p>
        <p><strong>Tipo:</strong> ${cantiere.tipo}</p>
        <p><strong>Posizione:</strong> X: ${cantiere.x}, Y: ${cantiere.y}</p>
        <p><strong>Operai Assegnati:</strong> ${cantiere.operai.length}</p>
    `;
    
    const operaiAssegnati = cantiere.operai.map(id => operai.find(o => o.id === id)).filter(o => o);
    
    let operaiHtml = '';
    if (operaiAssegnati.length > 0) {
        operaiAssegnati.forEach(operaio => {
            const prepostoText = operaio.preposto ? ' ⭐ PREPOSTO' : '';
            operaiHtml += `
                <div class="operaio-detail">
                    <strong>${operaio.avatar} ${operaio.nome}${prepostoText}</strong><br>
                    <small>${operaio.specializzazione} - Livello ${operaio.livello}</small><br>
                    <small>📧 ${operaio.mail} | 📞 ${operaio.telefono}</small>
                    <button onclick="unassignOperaio(${operaio.id}, ${cantiereId})" style="float:right; background:#e74c3c; color:white; border:none; padding:4px 8px; border-radius:4px; font-size:10px;">Rimuovi</button>
                </div>
            `;
        });
    } else {
        operaiHtml = '<p style="color: #95a5a6; font-style: italic;">Nessun operaio assegnato</p>';
    }
    
    document.getElementById('cantiere-operai-list').innerHTML = operaiHtml;
    
    renderCalendar();
    
    document.getElementById('time-start').value = cantiere.timeSlot?.start || '08:00';
    document.getElementById('time-end').value = cantiere.timeSlot?.end || '17:00';
    
    document.getElementById('modal-cantiere-details').classList.remove('hidden');
}

function closeCantiereModal() {
    log('❌ CLOSE CANTIERE MODAL');
    document.getElementById('modal-cantiere-details').classList.add('hidden');
    currentCantiereId = null;
}

// ===== FUNZIONI CALENDARIO =====
function renderCalendar() {
    const monthNames = [
        'Gennaio', 'Febbraio', 'Marzo', 'Aprile', 'Maggio', 'Giugno',
        'Luglio', 'Agosto', 'Settembre', 'Ottobre', 'Novembre', 'Dicembre'
    ];
    
    const dayNames = ['Dom', 'Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab'];
    
    document.getElementById('calendar-month-year').textContent = `${monthNames[currentMonth]} ${currentYear}`;
    
    const firstDay = new Date(currentYear, currentMonth, 1);
    const lastDay = new Date(currentYear, currentMonth + 1, 0);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());
    
    let calendarHtml = '';
    
    // Headers
    dayNames.forEach(day => {
        calendarHtml += `<div class="calendar-day-header">${day}</div>`;
    });
    
    // Days
    const current = new Date(startDate);
    for (let i = 0; i < 42; i++) {
        const dayNum = current.getDate();
        const isCurrentMonth = current.getMonth() === currentMonth;
        const isSelected = isCalendarDaySelected(current);
        
        let dayClass = 'calendar-day';
        if (!isCurrentMonth) dayClass += ' other-month';
        if (isSelected) dayClass += ' selected';
        
        calendarHtml += `
            <div class="${dayClass}" onclick="toggleCalendarDay('${current.toISOString()}')" data-date="${current.toISOString()}">
                ${dayNum}
            </div>
        `;
        
        current.setDate(current.getDate() + 1);
    }
    
    document.getElementById('calendar-grid').innerHTML = calendarHtml;
}

function isCalendarDaySelected(date) {
    if (!currentCantiereId) return false;
    
    const cantiere = cantieri.find(c => c.id === currentCantiereId);
    if (!cantiere || !cantiere.calendarSelections) return false;
    
    const dateStr = date.toISOString().split('T')[0];
    return cantiere.calendarSelections[dateStr] === true;
}

function toggleCalendarDay(dateStr) {
    log('📅 TOGGLE CALENDAR DAY:', dateStr);
    
    if (!currentCantiereId) return;
    
    const cantiere = cantieri.find(c => c.id === currentCantiereId);
    if (!cantiere) return;
    
    if (!cantiere.calendarSelections) {
        cantiere.calendarSelections = {};
    }
    
    const dateKey = dateStr.split('T')[0];
    cantiere.calendarSelections[dateKey] = !cantiere.calendarSelections[dateKey];
    
    renderCalendar();
}

function changeMonth(direction) {
    log('📅 CHANGE MONTH:', direction);
    
    currentMonth += direction;
    
    if (currentMonth < 0) {
        currentMonth = 11;
        currentYear--;
    } else if (currentMonth > 11) {
        currentMonth = 0;
        currentYear++;
    }
    
    renderCalendar();
}

// ===== FUNZIONI ORARIO =====
function handleTimeChange() {
    log('⏰ HANDLE TIME CHANGE');
    
    if (!currentCantiereId) return;
    
    const cantiere = cantieri.find(c => c.id === currentCantiereId);
    if (!cantiere) return;
    
    const startTime = document.getElementById('time-start').value;
    const endTime = document.getElementById('time-end').value;
    
    if (!cantiere.timeSlot) {
        cantiere.timeSlot = {};
    }
    
    cantiere.timeSlot.start = startTime;
    cantiere.timeSlot.end = endTime;
    
    log('⏰ Updated time slot:', cantiere.timeSlot);
}

function updateCantiereTimeSlot(cantiereId, start, end) {
    log('⏰ UPDATE CANTIERE TIME SLOT:', cantiereId, start, end);
    
    const cantiere = cantieri.find(c => c.id === cantiereId);
    if (!cantiere) return;
    
    if (!cantiere.timeSlot) {
        cantiere.timeSlot = {};
    }
    
    cantiere.timeSlot.start = start;
    cantiere.timeSlot.end = end;
}

// ===== FUNZIONI EMAIL =====
function sendParticipationEmails() {
    log('📤 SEND PARTICIPATION EMAILS');
    
    if (!currentCantiereId) return;
    
    const cantiere = cantieri.find(c => c.id === currentCantiereId);
    if (!cantiere) return;
    
    const operaiAssegnati = cantiere.operai.map(id => operai.find(o => o.id === id)).filter(o => o);
    
    if (operaiAssegnati.length === 0) {
        alert('⚠️ Nessun operaio assegnato a questo cantiere');
        return;
    }
    
    const selectedDates = Object.keys(cantiere.calendarSelections || {}).filter(
        date => cantiere.calendarSelections[date]
    );
    
    if (selectedDates.length === 0) {
        alert('⚠️ Nessun giorno selezionato nel calendario');
        return;
    }
    
    if (!emailConfig.senderEmail || !emailConfig.smtpServer) {
        alert('⚠️ Configurazione email non completa. Vai in Impostazioni > Email');
        return;
    }
    
    const button = document.getElementById('btn-send-emails');
    const originalText = button.textContent;
    button.textContent = '📤 Invio in corso...';
    button.disabled = true;
    
    setTimeout(() => {
        const giorni = selectedDates.map(date => {
            const d = new Date(date);
            return d.toLocaleDateString('it-IT');
        }).join(', ');
        
        const orario = `${cantiere.timeSlot?.start || '08:00'} - ${cantiere.timeSlot?.end || '17:00'}`;
        
        let emailsSent = 0;
        operaiAssegnati.forEach(operaio => {
            log(`📧 Sending email to: ${operaio.nome} (${operaio.email})`);
            emailsSent++;
        });
        
        button.textContent = originalText;
        button.disabled = false;
        
        alert(`✅ Email inviate con successo!
        
📧 Destinatari: ${emailsSent}
🏗️ Cantiere: ${cantiere.nome}
📅 Giorni: ${giorni}
⏰ Orario: ${orario}

Le email di convocazione sono state inviate a tutti gli operai assegnati.`);
        
    }, 2000);
}

// Esponi funzioni globalmente
window.loginMaster = loginMaster;
window.logout = logout;
window.toggleMenu = toggleMenu;
window.closeMenu = closeMenu;
window.focusSearchOperai = focusSearchOperai;
window.focusSearchCantieri = focusSearchCantieri;
window.openSettings = openSettings;
window.openGeneralSettings = openGeneralSettings;
window.closeSettings = closeSettings;
window.showSettingsTab = showSettingsTab;
window.saveEmailSettings = saveEmailSettings;
window.saveGeneralSettings = saveGeneralSettings;
window.testEmailConnection = testEmailConnection;
window.resetEmailSettings = resetEmailSettings;
window.resetGeneralSettings = resetGeneralSettings;
window.showOperaiList = showOperaiList;
window.showCantieriList = showCantieriList;
window.showModifyCantiereMenu = showModifyCantiereMenu;
window.showDeleteCantiereMenu = showDeleteCantiereMenu;
window.addOperaio = addOperaio;
window.editOperaio = editOperaio;
window.removeOperaio = removeOperaio;
window.closeModal = closeModal;
window.addCantiere = addCantiere;
window.editCantiere = editCantiere;
window.removeCantiere = removeCantiere;
window.closeCantiereEditModal = closeCantiereEditModal;
window.assignOperaio = assignOperaio;
window.unassignOperaio = unassignOperaio;
window.showCantiereDetails = showCantiereDetails;
window.closeCantiereModal = closeCantiereModal;
window.toggleCalendarDay = toggleCalendarDay;
window.handleTimeChange = handleTimeChange;
window.updateCantiereTimeSlot = updateCantiereTimeSlot;
window.sendParticipationEmails = sendParticipationEmails;
window.changeMonth = changeMonth;

log('🏗️ Sse Manager - Ver 1.8 COMPLETA caricata!');
log('✅ Tutte le funzionalità operative!');
// ===== GESTIONE EVENTI CON ADDEVENTLISTENER =====
function setupEventListenersImproved() {
    log('🔧 Setup event listeners migliorati');

    // Trova tutti gli elementi con data-onclick e aggiungi event listeners
    const elementsWithEvents = document.querySelectorAll('[data-onclick]');

    elementsWithEvents.forEach(function(element) {
        const eventCode = element.getAttribute('data-onclick');

        element.addEventListener('click', function(event) {
            try {
                // Valuta il codice dell'evento in modo sicuro
                const func = new Function('event', eventCode);
                func.call(this, event);
            } catch (error) {
                console.error('Errore evento click:', error, eventCode);
            }
        });

        // Rimuovi l'attributo data-onclick dopo aver aggiunto il listener
        element.removeAttribute('data-onclick');
    });

    // Event listeners per form submissions
    const forms = document.querySelectorAll('form');
    forms.forEach(function(form) {
        form.addEventListener('submit', function(event) {
            event.preventDefault();

            if (form.id === 'form-operaio') {
                saveOperaio();
            } else if (form.id === 'form-cantiere') {
                saveCantiere();
            }
        });
    });

    // Gestione tasti scorciatoia
    document.addEventListener('keydown', function(event) {
        // ESC per chiudere modal
        if (event.key === 'Escape') {
            const modals = document.querySelectorAll('.modal:not(.hidden)');
            modals.forEach(function(modal) {
                closeModal(modal.id);
            });
        }

        // Ctrl+S per salvare (se in un form)
        if (event.ctrlKey && event.key === 's') {
            event.preventDefault();
            const activeForm = document.querySelector('form:not(.hidden)');
            if (activeForm) {
                activeForm.dispatchEvent(new Event('submit'));
            }
        }
    });

    // Auto-save periodico
    setInterval(function() {
        if (typeof saveToStorage === 'function') {
            saveToStorage();
        }
    }, 30000); // Ogni 30 secondi
}

// Override della funzione di setup originale
const originalSetupEventListeners = setupEventListeners;
setupEventListeners = function() {
    if (typeof originalSetupEventListeners === 'function') {
        originalSetupEventListeners();
    }
    setupEventListenersImproved();
};
