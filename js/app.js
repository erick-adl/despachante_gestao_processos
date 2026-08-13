import { showToast } from './components/toast.js';
import { state } from './core/state.js';
import { defaultTipos } from './core/data.js';
import {
  uid,
  todayISO,
  maskCPF,
  maskPhone,
} from './core/utils.js';
import {
  go,
  updateNavActive,
  setRenderFunction
} from './core/router.js';
import { closeModal } from './components/modal.js';
import { viewHome } from './views/home.js';
import {
  onSearchInput,
  submitSearch
} from './components/search.js';
import {
  viewClientesList,
  onClientesSearchInput,
  resetClientesListQuery,
  openClientForm,
  submitClientForm,
  handleClientFilesChosen,
  removeCurrentClientAnexo
} from './views/clientes.js';

import {
  viewClienteDetalhe,
  confirmDeleteClient
} from './views/clienteDetalhe.js';

import {
  openServiceForm,
  submitServiceForm,
  confirmDeleteService,
  handleServiceFilesChosen,
  removeCurrentAnexo,
  toggleTipoFromEl,
  toggleNewTipoInput,
  confirmNewTipo,
  openManageTipos,
  renameTipo,
  deleteTipo,
  addInfracao,
  updateInfracao,
  removeInfracao,
  addCobranca,
  updateCobranca,
  removeCobranca
} from './views/serviceForm.js';

import {
  viewAgenda,
  openAgendaForm,
  submitAgendaForm,
  deleteAgendaItem
} from './views/agenda.js';

import { viewRelatorio } from './views/relatorio.js';

import {
  login,
  logout as firebaseLogout,
  observeAuth
} from './core/auth.js';

import {
  getClients,
  getAgenda
} from './core/firestore.js';

import { applyTheme } from './core/theme.js';


let currentUser = null;
window.getCurrentUser = () => currentUser;

async function loadData() {
  try {
    const clients = await getClients();

    state.DATA.clientes = clients;
    const agenda = await getAgenda();

    state.DATA.agenda = agenda;
  } catch (e) {
    console.error(
      'Erro ao carregar clientes do Firestore:',
      e
    );
  }

  if (!state.DATA.clientes) {
    state.DATA.clientes = [];
  }

  if (!state.DATA.agenda) {
    state.DATA.agenda = [];
  }

  if (!state.DATA.tiposServico || !state.DATA.tiposServico.length) {
    state.DATA.tiposServico = defaultTipos();
  }
}
/* ============================================================
   ROUTER / RENDER
   ============================================================ */

applyTheme();
render();
async function render() {
  const mainEl = document.getElementById('mainEl');

  if (!state.BOOTED) {
    mainEl.innerHTML = '<div class="loading-wrap"><div class="spinner"></div><div>Carregando dados do escritório…</div></div>';
    return;
  }

  mainEl.innerHTML = await viewContent();

  updateNavActive();
  bindGlobalEvents();
}
setRenderFunction(render);



function viewContent() {
  switch (state.VIEW.name) {
    case 'home': return viewHome();
    case 'clientes': return viewClientesList();
    case 'clienteDetalhe': return viewClienteDetalhe(state.VIEW.params.id);
    case 'agenda': return viewAgenda();
    case 'relatorio': return viewRelatorio();
    default: return viewHome();
  }
}





function setHomePeriod(p) { state.HOME_PERIOD = p; render(); }











/* ---------------- RELATÓRIO / FINANCEIRO ---------------- */

function setReportPeriod(p) {
  state.REPORT_PERIOD = p;
  if (p === 'custom' && !state.REPORT_RANGE) { state.REPORT_RANGE = { start: todayISO(), end: todayISO() }; }
  render();
}
function updateReportRange() {
  state.REPORT_RANGE = { start: document.getElementById('rp_start').value, end: document.getElementById('rp_end').value };
  render();
}

/* ---------------- MODAL HELPERS ---------------- */


function bindGlobalEvents() {
  document.onclick = function (e) {
    const dd = document.getElementById('searchDropdownHost');
    const wrap = e.target.closest('.searchbar-wrap');
    if (dd && !wrap) { state.SEARCH_QUERY = ''; const host = document.getElementById('searchDropdownHost'); if (host) host.outerHTML = '<div id="searchDropdownHost"></div>'; }
  };
}

/* ============================================================
   LOGIN
   ============================================================ */

async function attemptLogin() {
  const email = document.getElementById('loginUser').value.trim();
  const password = document.getElementById('loginPass').value;
  const errBox = document.getElementById('loginError');

  errBox.style.display = 'none';

  try {
    await login(email, password);
  } catch (error) {
    console.error(error);

    errBox.textContent = 'E-mail ou senha inválidos.';
    errBox.style.display = 'block';

    document.getElementById('loginPass').value = '';
    document.getElementById('loginPass').focus();
  }
}

async function logout() {
  await firebaseLogout();
}
observeAuth((user) => {
  const loginScreen = document.getElementById('loginScreen');
  const app = document.getElementById('app');

  if (user) {
    currentUser = user;

    loginScreen.style.display = 'none';
    app.style.display = 'flex';

    init();
  } else {
    currentUser = null;

    state.BOOTED = false;

    app.style.display = 'none';
    loginScreen.style.display = 'flex';
  }
});
setTimeout(() => { const u = document.getElementById('loginUser'); if (u) u.focus(); }, 100);

/* ============================================================
   INIT
   ============================================================ */

async function init() {
  await loadData();

  state.BOOTED = true;

  render();
}

function downloadAnexoFile(encodedUrl, encodedFilename) {
  const url = decodeURIComponent(encodedUrl);
  const filename = decodeURIComponent(encodedFilename);

  if (!url) {
    showToast('Anexo não encontrado.', true);
    return;
  }

  const a = document.createElement('a');

  a.href = url;
  a.target = '_blank';
  a.rel = 'noopener noreferrer';

  if (filename) {
    a.download = filename;
  }

  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

/* ============================================================
   GLOBALS — funções usadas pelos eventos inline do HTML
   ============================================================ */
Object.assign(window, {
  attemptLogin,
  logout,
  currentUser,

  go,

  openClientForm,
  submitClientForm,
  closeModal,
  removeCurrentClientAnexo,

  openServiceForm,
  submitServiceForm,
  handleServiceFilesChosen,
  removeCurrentAnexo,

  toggleTipoFromEl,
  toggleNewTipoInput,
  confirmNewTipo,
  openManageTipos,
  renameTipo,
  deleteTipo,

  addInfracao,
  updateInfracao,
  removeInfracao,

  addCobranca,
  updateCobranca,
  removeCobranca,

  openAgendaForm,
  submitAgendaForm,
  deleteAgendaItem,

  setHomePeriod,
  onSearchInput,
  submitSearch,
  onClientesSearchInput,

  setReportPeriod,
  updateReportRange,

  downloadAnexoFile,
  confirmDeleteClient,
  confirmDeleteService,

  maskCPF,
  maskPhone,
  uid,
  todayISO,
  resetClientesListQuery,
  handleClientFilesChosen,
});

