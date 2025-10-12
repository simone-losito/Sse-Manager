// app.js - Sse Manager Ver 1.6
// Novità: Import/Export Excel Dipendenti, Login Master & Gestione Utenti

// Libreria XLSX integrata (CDN consigliato, oppure richiedere all’utente di fornire la libreria xlsx.min.js in locale)

class SseManager {
  constructor() {
    this.operai = this.loadData('operai') || [];
    this.cantieri = this.loadData('cantieri') || [];
    this.users = this.loadData('users') || [
      { username: 'master', password: 'Sse19731973!', fullname: 'Master', email: '', admin: true }
    ];
    this.currentUser = null;
    this.autoSaveEnabled = true;
    this.init();
  }

  // Inizializzazione
  init() {
    this.setupLogin();
    if (this.isLoggedIn()) {
      this.setupEventListeners();
      this.renderApp();
      this.setupAutoSave();
    } else {
      this.renderLoginScreen();
    }
  }

  isLoggedIn() {
    return !!this.currentUser;
  }

  setupLogin() {
    const savedUser = this.loadData('currentUser');
    if (savedUser) {
      this.currentUser = savedUser;
      document.getElementById('login-screen').classList.add('hidden');
      document.getElementById('main-app').classList.remove('hidden');
    } else {
      document.getElementById('login-screen').classList.remove('hidden');
      document.getElementById('main-app').classList.add('hidden');
    }
    document.getElementById('login-btn').onclick = () => this.loginUser();
  }

  loginUser() {
    const username = document.getElementById('login-username').value.trim();
    const password = document.getElementById('login-password').value;
    const user = this.users.find(u => u.username === username && u.password === password);
    const errorDiv = document.getElementById('login-error');
    if (user) {
      this.currentUser = user;
      this.saveData('currentUser', user);
      errorDiv.classList.add('hidden');
      document.getElementById('login-screen').classList.add('hidden');
      document.getElementById('main-app').classList.remove('hidden');
      this.setupEventListeners();
      this.renderApp();
      this.setupAutoSave();
    } else {
      errorDiv.textContent = 'Login errato. Verifica username e password.';
      errorDiv.classList.remove('hidden');
    }
  }

  logout() {
    this.saveAllData();
    this.currentUser = null;
    localStorage.removeItem('sse_manager_currentUser');
    document.getElementById('main-app').classList.add('hidden');
    document.getElementById('login-screen').classList.remove('hidden');
  }

  // Event listeners
  setupEventListeners() {
    if (!this.listenersReady) {
      document.getElementById('menu-btn').onclick = () => this.toggleMenu();
      document.querySelectorAll('.menu-item').forEach(item => {
        item.onclick = e => this.handleMenuAction(e.target.dataset.action);
      });
      document.getElementById('logout-btn')?.addEventListener('click', () => this.logout());
      // Import/Export Excel
      document.querySelector('[data-action="export-operai-excel"]').onclick = () => this.exportOperaiExcel();
      document.querySelector('[data-action="import-operai-excel"]').onclick = () => this.importOperaiExcel();
      // Gestione Utenti (solo Master)
      if (this.currentUser.admin) {
        document.querySelector('[data-action="manage-users"]').onclick = () => this.showUserModal();
      } else {
        document.getElementById('admin-section').style.display = 'none';
      }
      this.listenersReady = true;
    }
  }

  // Import/Export Excel
  exportOperaiExcel() {
    // Requisito: window.XLSX deve essere presente!
    if (!window.XLSX) {
      alert('Carica prima la libreria XLSX per esportare Excel!');
      return;
    }
    const operaiData = this.operai.map(o => ({
      Nome: o.nome,
      Email: o.email,
      Telefono: o.telefono,
      Specializzazione: o.specializzazione,
      Livello: o.livello,
      Preposto: o.preposto ? 'SI' : 'NO',
    }));
    const ws = XLSX.utils.json_to_sheet(operaiData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Operai');
    XLSX.writeFile(wb, `operai_sse_manager_${new Date().toISOString().slice(0,10)}.xlsx`);
  }

  importOperaiExcel() {
    if (!window.XLSX) {
      alert('Carica prima la libreria XLSX per importare Excel!');
      return;
    }
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.xlsx,.xls';
    input.onchange = e => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = event => {
        const data = new Uint8Array(event.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const json = XLSX.utils.sheet_to_json(sheet);
        // Mappatura
        this.operai = json.map((row, idx) => ({
          id: idx + 1, // assegna nuovo id sequenziale
          nome: row.Nome || '',
          email: row.Email || '',
          telefono: row.Telefono || '',
          specializzazione: row.Specializzazione || '',
          livello: Number(row.Livello) || 1,
          preposto: (row.Presto || row.Preposto) === 'SI',
          cantiere: null,
          avatar: row.Specializzazione && row.Specializzazione.toLowerCase().includes('elettricista') ? '⚡' : '🔧',
        }));
        this.saveAllData();
        this.renderApp();
        alert('Importazione operai da Excel completata!');
      };
      reader.readAsArrayBuffer(file);
    };
    input.click();
  }

  // Gestione utenti - solo master
  showUserModal() {
    // gestione visualizzazione modal, aggiunta, modifica, eliminazione utenti
  }

  // ... Resto delle funzionalità come v1.5 (salvataggio, calendario, ecc) ...

  // Salvataggio
  saveData(key, data) {
    try {
      localStorage.setItem(`sse_manager_${key}`, JSON.stringify(data));
      return true;
    } catch (error) {
      return false;
    }
  }
  loadData(key) {
    try {
      const data = localStorage.getItem(`sse_manager_${key}`);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      return null;
    }
  }
  saveAllData() {
    this.saveData('operai', this.operai);
    this.saveData('cantieri', this.cantieri);
    this.saveData('users', this.users);
    this.saveData('currentUser', this.currentUser);
  }
  setupAutoSave() { setInterval(() => { if(this.autoSaveEnabled) this.saveAllData(); }, 30000); }
  // ...
}

window.onload = function() {
  window.sseManager = new SseManager();
};
