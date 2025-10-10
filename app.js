// app.js - Ver.1.0.2 Modifiche richieste
// Correzioni: search operai/cantieri, rimozione operaio in scheda, layout automatico

// Cerca operai
const searchOperaiInput = document.getElementById('search-operai');
searchOperaiInput.addEventListener('input', () => {
  const query = searchOperaiInput.value.toLowerCase();
  document.querySelectorAll('.operaio-card').forEach(card => {
    const nome = card.querySelector('.operaio-nome').textContent.toLowerCase();
    card.style.display = nome.includes(query) ? '' : 'none';
  });
});

// Cerca cantieri
const searchCantieriInput = document.getElementById('search-cantieri');
searchCantieriInput.addEventListener('input', () => {
  const query = searchCantieriInput.value.toLowerCase();
  document.querySelectorAll('.cantiere').forEach(el => {
    const nome = el.querySelector('.cantiere-nome').textContent.toLowerCase();
    el.style.display = nome.includes(query) ? '' : 'none';
  });
});

// Unassign update propagation fixed
function unassignOperaio(operaioId, cantiereId) {
  const operaio = operai.find(o => o.id === operaioId);
  const cantiere = cantieri.find(c => c.id === cantiereId);
  if (!operaio || !cantiere) return;
  operaio.cantiere = null;
  cantiere.operai = cantiere.operai.filter(id => id !== operaioId);
  // Refresh both lists and details
  renderOperai();
  renderCantieri();
  if (currentCantiereId === cantiereId) showCantiereDetails(cantiereId);
}

// Layout automatico grid without overlaps
function layoutCantieriGrid() {
  const padding = 50;
  const cols = Math.ceil(Math.sqrt(cantieri.length));
  const spacingX = (mapContainer.clientWidth - padding*2) / cols;
  const rows = Math.ceil(cantieri.length / cols);
  const spacingY = (mapContainer.clientHeight - padding*2) / rows;
  cantieri.forEach((cantiere, i) => {
    const col = i % cols;
    const row = Math.floor(i / cols);
    cantiere.x = Math.round(padding + col * spacingX + spacingX/2 - 40);
    cantiere.y = Math.round(padding + row * spacingY + spacingY/2 - 40);
  });
}

// Inizializzazione override positions
document.addEventListener('DOMContentLoaded', () => {
  layoutCantieriGrid();
  startApp();
});

// Modifica startApp remove initial map call
function startApp() {
  document.getElementById('login-screen').classList.add('hidden');
  document.getElementById('main-app').classList.remove('hidden');
  document.getElementById('mode-text').textContent = 'Modalità: Manager';
  initMap(); renderApp(); initDragAndDrop();
}

// Mantieni initMap separate
function initMap() {
  map = L.map('map-container', {crs: L.CRS.Simple}).setView([0,0], 0);
  const bounds = [[0,0], [1000,1000]];
  L.imageOverlay('', bounds).addTo(map);
  map.setMaxBounds(bounds);
}

// Rerender uses new positions
function renderCantieri() {
  const container = document.getElementById('map-container');
  container.innerHTML = '';
  cantieri.forEach(c => {
    const el = document.createElement('div'); el.className='cantiere';
    el.dataset.cantiereId=c.id;
    el.style.left=c.x+'px'; el.style.top=c.y+'px';
    el.innerHTML=`<div class="cantiere-icon">${{'Civile':'🏰','Industriale':'🏭','Residenziale':'🏢'}[c.tipo]}</div>
                  <div class="cantiere-nome">${c.nome}</div>
                  <div class="cantiere-count">${c.operai.length||''}</div>`;
    // attach drag handlers
    el.setAttribute('draggable',true);
    el.ondragstart=e=>{draggedCantiere=c;};
    el.ondragend=e=>{c.x=el.offsetLeft; c.y=el.offsetTop;};
    container.appendChild(el);
  });
}

// Drag drop updated
function initDragAndDrop() {
  renderOperai(); renderCantieri();
  document.querySelectorAll('.cantiere').forEach(el=>{
    el.addEventListener('dragover',e=>{e.preventDefault();});
    el.addEventListener('drop',e=>{e.preventDefault();
      if(draggedOperaio) assignOperaio(draggedOperaio.id,parseInt(el.dataset.cantiereId));
      if(draggedCantiere) { draggedCantiere.x=el.offsetLeft; draggedCantiere.y=el.offsetTop; renderCantieri(); }
    });
  });
}

// Mantieni resto funzioni da Ver1.0.1
