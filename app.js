"use strict";

// ===== ERROR HANDLING GLOBALE =====
window.onerror = function(message, source, lineno, colno, error) {
    console.error('🔴 JavaScript Error:', {
        message: message,
        source: source,
        line: lineno,
        column: colno,
        error: error
    });
    // Non bloccare l'esecuzione
    return true;
};

// ===== POLYFILL PER COMPATIBILITÀ =====
if (!Array.prototype.includes) {
    Array.prototype.includes = function(searchElement) {
        return this.indexOf(searchElement) !== -1;
    };
}

if (!Array.prototype.find) {
    Array.prototype.find = function(predicate) {
        for (var i = 0; i < this.length; i++) {
            if (predicate(this[i], i, this)) return this[i];
        }
        return undefined;
    };
}

// ===== UTILITIES =====
const log = console.log.bind(console);
const error = console.error.bind(console);

// ===== INIZIALIZZAZIONE SICURA =====
(function() {
    // Attende che il DOM sia completamente caricato
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initApp);
    } else {
        initApp();
    }
    
    function initApp() {
        log('🚀 Inizializzazione Sse Manager');
        
        // Verifica compatibilità browser
        if (!isCompatible()) {
            alert('⚠️ Browser non completamente supportato. Alcune funzionalità potrebbero non funzionare.');
        }
        
        // Carica configurazione salvata
        loadFromStorage();
        
        // Setup event listeners
        setupEventListeners();
        
        log('✅ App inizializzata con successo');
    }
    
    function isCompatible() {
        try {
            // Test localStorage
            localStorage.setItem('test', 'test');
            localStorage.removeItem('test');
            
            // Test JSON
            JSON.parse('{}');
            JSON.stringify({});
            
            return true;
        } catch (e) {
            error('Browser non supporta funzionalità richieste:', e);
            return false;
        }
    }
})();

// ===== STORAGE MANAGEMENT =====
function saveToStorage() {
    try {
        localStorage.setItem('sseManager_operai', JSON.stringify(operai));
        localStorage.setItem('sseManager_cantieri', JSON.stringify(cantieri));
        localStorage.setItem('sseManager_emailConfig', JSON.stringify(emailConfig));
        localStorage.setItem('sseManager_generalConfig', JSON.stringify(generalConfig));
        log('💾 Dati salvati');
    } catch (e) {
        error('Errore salvataggio:', e);
    }
}

function loadFromStorage() {
    try {
        const savedOperai = localStorage.getItem('sseManager_operai');
        const savedCantieri = localStorage.getItem('sseManager_cantieri');
        const savedEmailConfig = localStorage.getItem('sseManager_emailConfig');
        const savedGeneralConfig = localStorage.getItem('sseManager_generalConfig');
        
        if (savedOperai) operai = JSON.parse(savedOperai);
        if (savedCantieri) cantieri = JSON.parse(savedCantieri);
        if (savedEmailConfig) emailConfig = Object.assign({}, emailConfig, JSON.parse(savedEmailConfig));
        if (savedGeneralConfig) generalConfig = Object.assign({}, generalConfig, JSON.parse(savedGeneralConfig));
        
        log('📂 Dati caricati da storage');
    } catch (e) {
        error('Errore caricamento:', e);
    }
}

// ===== EVENT LISTENERS =====
function setupEventListeners() {
    log('🔧 Setup event listeners');
    
    // Gestione ESC per chiudere modal
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            const modals = document.querySelectorAll('.modal:not(.hidden)');
            modals.forEach(function(modal) {
                modal.classList.add('hidden');
            });
        }
    });
    
    // Auto-save periodico
    setInterval(function() {
        saveToStorage();
    }, 30000); // Ogni 30 secondi
}

// ===== FUNZIONE CORRETTA unassignOperaio =====
function unassignOperaio(opId, cantiereId) {
    console.log('🔄 Rimozione operaio', opId, 'dal cantiere', cantiereId);
    
    // Rimuove l'assegnazione del dipendente dal cantiere
    operai = operai.map(op => {
        if (op.id === opId) {
            console.log('✅ Operaio rimosso:', op.nome);
            op.cantiere = null;
        }
        return op;
    });
    
    // Aggiorna UI generale
    renderOperai();
    renderCantieri();
    
    // Aggiorna il modal del cantiere se è aperto
    const modalCantiere = document.getElementById('modal-cantiere-details');
    if (modalCantiere && !modalCantiere.classList.contains('hidden')) {
        // Il modal è aperto, aggiorna il contenuto
        console.log('📋 Aggiornamento modal cantiere aperto');
        showCantiereDetails(cantiereId);
    }
    
    // Salva i dati
    if (typeof saveToStorage === 'function') {
        saveToStorage();
    }
}

// [Il resto del codice di app.js originale qui sotto...]
// (Ti consiglio di inserirlo tutto nel file app.js nella tua directory)
