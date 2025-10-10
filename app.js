// Inizializza mappa
const map = L.map('map').setView([41.9028, 12.4964], 13);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);

// Dati
let workers = JSON.parse(localStorage.getItem('workers')||'[]');
let sites = JSON.parse(localStorage.getItem('sites')||'[]');
let assignments = JSON.parse(localStorage.getItem('assignments')||'{}');

// DOM
const workersList = document.getElementById('workers-list');
const assignedList = document.getElementById('assigned-workers');
const detailDialog = document.getElementById('detail-dialog');

// Salvataggio
function saveAll() {
  localStorage.setItem('workers', JSON.stringify(workers));
  localStorage.setItem('sites', JSON.stringify(sites));
  localStorage.setItem('assignments', JSON.stringify(assignments));
}

// Rendering operai
function renderWorkers() {
  workersList.innerHTML = '';
  workers.forEach((w,i) => {
    const tpl = document.getElementById('worker-item').content.cloneNode(true);
    tpl.querySelector('.worker-name').textContent = w.name;
    tpl.querySelector('.worker-email').textContent = w.email;
    const li = tpl.querySelector('li');
    li.dataset.index = i;
    li.addEventListener('dragstart', e => {
      e.dataTransfer.setData('text/plain', i);
    });
    workersList.appendChild(li);
  });
}

// Aggiungi operaio
document.getElementById('add-worker-btn').onclick = () => {
  const name = prompt('Nome completo');
  const email = prompt('Email');
  workers.push({name,email});
  saveAll(); renderWorkers();
};

// Rendering siti e marker drag
function renderSites() {
  sites.forEach((s,i) => {
    if (s.marker) map.removeLayer(s.marker);
    const marker = L.marker(s.coords, { draggable: true }).addTo(map);
    marker.on('dragend', e => {
      sites[i].coords = [e.target.getLatLng().lat, e.target.getLatLng().lng];
      saveAll();
    });
    marker.on('drop', e => {
      const wi = e.originalEvent.dataTransfer.getData('text');
      assignments[i] = assignments[i]||[];
      if (!assignments[i].includes(wi)) assignments[i].push(wi);
      saveAll();
    });
    marker.on('dragover', e => e.originalEvent.preventDefault());
    marker.on('click', () => openDetail(i));
    s.marker = marker;
  });
}

// Aggiungi cantiere
document.getElementById('add-site-btn').onclick = () => {
  const name = prompt('Nome cantiere');
  const coords = [map.getCenter().lat, map.getCenter().lng];
  sites.push({name,coords});
  saveAll(); renderSites();
};

// Dettagli cantiere
function openDetail(i) {
  detailDialog.showModal();
  document.getElementById('detail-title').textContent = sites[i].name;
  renderAssigned(i);
  document.getElementById('send-mail-btn').onclick = () => {
    alert('Email inviata a '+assignments[i].length+' operai');
  };
}

// Rendering assegnati
function renderAssigned(i) {
  assignedList.innerHTML = '';
  (assignments[i]||[]).forEach(wi => {
    const li = document.createElement('li');
    li.textContent = workers[wi].name+' ('+workers[wi].email+')';
    assignedList.appendChild(li);
  });
}

// Chiudi dialog
document.getElementById('close-detail-btn').onclick = () => {
  detailDialog.close();
};

// Init
renderWorkers();
renderSites();