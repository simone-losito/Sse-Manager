// app.js
const cantieriData = [
  { titolo: "Palazzo Roma Centro", tipo: "Civile", orarioDefault: "08:00-17:00", coords: [41.9,12.5], operai: ["Marco Rossi ⭐","Giuseppe Bianchi"] },
  { titolo: "Impianto Industriale Ostia", tipo: "Industriale", orarioDefault: "07:00-16:00", coords: [41.75,12.3], operai: ["Francesco Neri ⭐","Antonio Verde"] },
  { titolo: "Ristrutturazione Trastevere", tipo: "Residenziale", orarioDefault: "08:30-17:30", coords: [41.888,12.467], operai: [] }
];

// Inizializza mappa
const map = L.map('map').setView([41.9,12.5], 12);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: '' }).addTo(map);

// Aggiungi marker draggable
cantieriData.forEach((c, i) => {
  const marker = L.marker(c.coords, { draggable: true }).addTo(map).bindPopup(c.titolo);
  marker.on('dragend', e => {
    const { lat, lng } = e.target.getLatLng();
    cantieriData[i].coords = [lat, lng];
  });
});

// Crea calendario
function creaCalendario(container) {
  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth();
  const start = new Date(year, month, 1);
  const end = new Date(year, month + 1, 0);
  container.innerHTML = `<strong>${start.toLocaleString('it-IT',{ month:'long'})} ${year}</strong>`;
  const grid = document.createElement('div');
  grid.className = 'calendar';
  for (let d = 1; d <= end.getDate(); d++) {
    const cell = document.createElement('div');
    cell.textContent = d;
    grid.appendChild(cell);
  }
  container.appendChild(grid);
}

// Render cantieri
function renderCantieri() {
  const list = document.getElementById('list-cantieri');
  const template = document.getElementById('template-cantiere');
  list.innerHTML = '';
  cantieriData.forEach(c => {
    const clone = template.content.cloneNode(true);
    clone.querySelector('.cantiere-title').textContent = c.titolo;
    clone.querySelector('.cantiere-type').textContent = c.tipo;
    clone.querySelector('.cantiere-orario').textContent = c.orarioDefault;
    const ul = clone.querySelector('.cantiere-workers');
    c.operai.forEach(op => { const li = document.createElement('li'); li.textContent = op; ul.appendChild(li); });
    const cal = clone.querySelector('.calendar');
    creaCalendario(clone.querySelector('.scheduler .calendar'));
    list.appendChild(clone);
  });
}

document.addEventListener('DOMContentLoaded', renderCantieri);
