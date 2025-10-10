// Inizializzazione mappa
const map = L.map('map').setView([41.9028, 12.4964], 13);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);

// Dati in memoria (sostituire con persistenza reale se disponibile)
let workers = [];
let sites = [];
let assignments = {};

// Riferimenti DOM
const workersList = document.getElementById('workers-list');
const sitesSection = document.getElementById('map');
const detailDialog = document.getElementById('detail-dialog');
let calendar;

// Carica workers da LocalStorage
function loadWorkers() {
  const data = JSON.parse(localStorage.getItem('workers')||'[]');
  workers = data;
}
function saveWorkers() {
  localStorage.setItem('workers', JSON.stringify(workers));
}
loadWorkers(); renderWorkers();

// CRUD dipendenti & rendering
function renderWorkers() {
  workersList.innerHTML = '';
  workers.forEach((w, i) => {
    const tpl = document.getElementById('worker-card').content.cloneNode(true);
    tpl.querySelector('.worker-name').textContent = w.name;
    tpl.querySelector('.worker-role').textContent = w.role;
    const card = tpl.querySelector('.worker-card');
    card.dataset.index = i;
    enableDrag(card);
    workersList.appendChild(card);
  });
}

// Drag & Drop worker -> site
function enableDrag(card) {
  card.addEventListener('dragstart', e => {
    e.dataTransfer.setData('text/plain', card.dataset.index);
  });
}

// Aggiungi marker cantiere
function addSiteMarker(site, idx) {
  const icon = L.divIcon({className:''});
  const marker = L.marker(site.coords, {icon}).addTo(map);
  marker._icon.classList.add('site-marker');
  marker.on('drop', e => {
    const workerIdx = e.originalEvent.dataTransfer.getData('text');
    assignWorker(idx, workerIdx);
  });
  marker.on('dragover', e => e.originalEvent.preventDefault());
  marker.on('click', () => openDetail(idx));
}

// Rendering cantieri
function renderSites() {
  sites.forEach((s, i) => addSiteMarker(s, i));
}

// Assegna dipendente
function assignWorker(siteIdx, workerIdx) {
  assignments[siteIdx] = assignments[siteIdx]||[];
  if(!assignments[siteIdx].includes(workerIdx)) {
    assignments[siteIdx].push(workerIdx);
  }
}

// Dettaglio cantiere
function openDetail(idx) {
  detailDialog.showModal();
  document.getElementById('detail-title').textContent = sites[idx].name;
  renderAssigned(idx);
  initCalendar(idx);
}

// Render assegnati
function renderAssigned(idx) {
  const container = document.getElementById('assigned-workers');
  container.innerHTML = '';
  (assignments[idx]||[]).forEach(wi => {
    const w = workers[wi];
    const card = document.createElement('div');
    card.className = 'card worker-card';
    card.innerHTML = `<h4>${w.name}</h4><p>${w.role}</p>`;
    container.appendChild(card);
  });
}

// Calendario FullCalendar
function initCalendar(siteIdx) {
  if (calendar) calendar.destroy();
  calendar = new FullCalendar.Calendar(document.getElementById('calendar'), {
    initialView: 'dayGridWeek',
    selectable: true,
    select: info => {
      assignments[siteIdx].calendar = assignments[siteIdx].calendar||[];
      assignments[siteIdx].calendar.push({start: info.startStr, end: info.endStr});
    }
  });
  calendar.render();
}

// Eventi init
document.getElementById('add-worker-btn').addEventListener('click', () => {
  const name=prompt('Nome completo'); const role=prompt('Ruolo');
  workers.push({name, role}); saveWorkers(); renderWorkers();
});
document.getElementById('add-site-btn').addEventListener('click', () => {
  const name=prompt('Nome cantiere'); sites.push({name, coords:map.getCenter()});
  renderSites();
});
document.getElementById('close-detail-btn').addEventListener('click', () => detailDialog.close());
document.getElementById('send-mail-btn').addEventListener('click', () => {
  alert('Email inviata ai partecipanti!');
});
