import { state } from '../core/state.js';

import {
    uid,
    fmtDateLong,
    todayISO,
    escapeHtml
} from '../core/utils.js';

import { icon } from '../core/icons.js';

import { saveData } from '../core/storage.js';

import { closeModal } from '../components/modal.js';
import { showToast } from '../components/toast.js';
import { agendaItemHtml } from '../core/data.js';

export function viewAgenda() {
    const items = (state.DATA.agenda || []).slice().sort((a, b) => a.data.localeCompare(b.data) || (a.hora || '').localeCompare(b.hora || ''));
    const groups = {};
    items.forEach(a => { (groups[a.data] = groups[a.data] || []).push(a); });
    const dates = Object.keys(groups).sort();
    return `
  <div class="view">
    <div class="page-head">
      <h1>Agenda</h1>
      <button class="btn btn-primary" onclick="openAgendaForm()">${icon('plus')} Novo compromisso</button>
    </div>
    ${dates.length === 0 ? emptyState('calendar', 'Nenhum compromisso agendado', 'Adicione compromissos para acompanhar sua semana.') :
            dates.map(d => `
        <div class="day-group-label">${fmtDateLong(d)}</div>
        <div class="card" style="margin-bottom:16px;">
          ${groups[d].map(a => agendaItemHtml(a)).join('')}
        </div>
      `).join('')}
  </div>`;
}
export function openAgendaForm() {
    const overlay = document.createElement('div');
    overlay.className = 'form-overlay';
    overlay.id = 'agendaFormOverlay';
    const clienteOptions = state.DATA.clientes.slice().sort((a, b) => a.nome.localeCompare(b.nome))
        .map(c => `<option value="${c.id}">${escapeHtml(c.nome)}</option>`).join('');
    overlay.innerHTML = `
    <div class="form-modal" style="max-width:480px;">
      <div class="form-modal-head">
        <h3>Novo compromisso</h3>
        <button class="icon-btn" onclick="closeModal('agendaFormOverlay')">${icon('x')}</button>
      </div>
      <div class="form-modal-body">
        <div class="field-row">
          <div class="field"><label>Data</label><input id="a_data" type="date" value="${todayISO()}"></div>
          <div class="field"><label>Hora</label><input id="a_hora" type="time" value="09:00"></div>
        </div>
        <div class="field">
          <label>Descrição</label>
          <input id="a_desc" placeholder="Ex: Retirada de documento, vistoria…">
        </div>
        <div class="field">
          <label>Cliente (opcional)</label>
          <select id="a_cliente"><option value="">— nenhum —</option>${clienteOptions}</select>
        </div>
      </div>
      <div class="form-modal-foot">
        <button class="btn btn-ghost" onclick="closeModal('agendaFormOverlay')">Cancelar</button>
        <button class="btn btn-primary" onclick="submitAgendaForm()">${icon('check')} Salvar compromisso</button>
      </div>
    </div>`;
    document.body.appendChild(overlay);
}
export async function submitAgendaForm() {
    const desc = document.getElementById('a_desc').value.trim();
    if (!desc) { showToast('Descreva o compromisso.', true); return; }
    state.DATA.agenda.push({
        id: uid(),
        data: document.getElementById('a_data').value || todayISO(),
        hora: document.getElementById('a_hora').value,
        descricao: desc,
        clienteId: document.getElementById('a_cliente').value || null,
    });
    await saveData();
    closeModal('agendaFormOverlay');
    showToast('Compromisso salvo.');
    render();
}
export function deleteAgendaItem(id) {
    state.DATA.agenda = state.DATA.agenda.filter(a => a.id !== id);
    saveData().then(render);
}