// app.js - Ver 1.8.1 con nome azienda modificato

// Dati Ver 1.8
let operai = [ /* dati identici */ ];
let cantieri = [ /* dati identici */ ];

// Configurazioni Email (identiche Ver 1.8)
let emailSettings = { /* ... */ };

// Configurazioni Generali con nome azienda modificato
let generalSettings = {
  companyName: "Standard System Engineering srl",
  timezone: "Europe/Rome",
  language: "it",
  dateFormat: "DD/MM/YYYY"
};

// Resto del codice Ver 1.8 rimane identico
// (menu, sidebar, map, CRUD, calendar, email)

// Esempio di login e inizializzazione
function startApp(mode) {
  document.getElementById('login-screen').classList.add('hidden');
  document.getElementById('main-app').classList.remove('hidden');
  setupApp();
  renderApp();
}

function logout() {
  document.getElementById('main-app').classList.add('hidden');
  document.getElementById('login-screen').classList.remove('hidden');
}

// Export necessario funzioni globali
window.startApp = startApp;
window.logout = logout;
// ... e tutte le altre funzioni Ver 1.8 ...