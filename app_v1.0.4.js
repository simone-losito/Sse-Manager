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
    return true;
};

// ===== POLYFILL =====
if (!Array.prototype.includes) {
    Array.prototype.includes = function(el) { return this.indexOf(el) !== -1; };
}
if (!Array.prototype.find) {
    Array.prototype.find = function(pred) { for (let i=0;i<this.length;i++) if(pred(this[i],i,this)) return this[i]; };
}

const log = console.log.bind(console);
const error = console.error.bind(console);

// ===== INIZIALIZZAZIONE =====
(function(){
    if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',initApp);
    else initApp();
    function initApp(){
        log('🚀 Inizializzazione Sse Manager');
        if(!isCompatible()) alert('⚠️ Browser non completamente supportato.');
        loadFromStorage();
        setupEventListeners();
        log('✅ App inizializzata');
    }
    function isCompatible(){ try{localStorage.setItem('t','t');localStorage.removeItem('t');JSON.parse('{}'); return true;}catch(e){error(e);return false;} }
})();

// ===== STORAGE =====nfunction saveToStorage(){try{localStorage.setItem('sse_o',JSON.stringify(operai));localStorage.setItem('sse_c',JSON.stringify(cantieri));log('💾 Dati salvati');}catch(e){error('Errore',e);}}
function loadFromStorage(){try{let so=localStorage.getItem('sse_o');if(so)operai=JSON.parse(so);let sc=localStorage.getItem('sse_c');if(sc)cantieri=JSON.parse(sc);log('📂 Dati caricati');}catch(e){error(e);}}

// ===== LISTENER =====nfunction setupEventListeners(){log('🔧 Listeners');document.addEventListener('keydown',e=>{if(e.key==='Escape'){document.querySelectorAll('.modal:not(.hidden)').forEach(m=>m.classList.add('hidden'));}});setInterval(saveToStorage,30000);}