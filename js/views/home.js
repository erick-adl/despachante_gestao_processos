import { searchDropdownHtml } from '../components/search.js';
import { state } from '../core/state.js';

import {
  fmtDateLong,
  fmtMoney,
  todayISO,
  weekRangeISO,
  monthRangeISO,
  escapeHtml
} from '../core/utils.js';

import { icon } from '../core/icons.js';

import {
  sumLucro,
  agendaItemHtml
} from '../core/data.js';

import { go } from '../core/router.js';

import { getServices } from '../core/firestore.js';

export async function viewHome() {
  const today = todayISO();
  let start = today, end = today;
  if (state.HOME_PERIOD === 'semana') { const r = weekRangeISO(today); start = r.start; end = r.end; }
  if (state.HOME_PERIOD === 'mes') { const r = monthRangeISO(today); start = r.start; end = r.end; }
  const todosServicos = (
    await Promise.all(
      state.DATA.clientes.map(c => getServices(c.id))
    )
  ).flat();

  const servicos = todosServicos.filter(
    s => s.data >= start && s.data <= end
  );

  const lucro = sumLucro(servicos);
  const periodLabel = state.HOME_PERIOD === 'dia' ? 'hoje' : (state.HOME_PERIOD === 'semana' ? 'nesta semana' : 'neste mês');

  const agendaHoje = (state.DATA.agenda || []).filter(a => a.data === today).sort((a, b) => (a.hora || '').localeCompare(b.hora || ''));
  const r7 = { start: today, end: (() => { const d = new Date(today + 'T12:00:00'); d.setDate(d.getDate() + 6); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); })() };
  const agendaSemana = (state.DATA.agenda || []).filter(a => a.data >= r7.start && a.data <= r7.end).sort((a, b) => a.data.localeCompare(b.data) || (a.hora || '').localeCompare(b.hora || ''));

  return `
  <div class="view">
    <div class="topbar">
      <div class="date-block">
        <div class="eyebrow">Painel do escritório</div>
        <h1>${fmtDateLong(today)}</h1>
      </div>
      <div class="searchbar-wrap" style="width:380px;">
        <div class="searchbar">
          ${icon('search')}
          <input id="homeSearchInput" placeholder="Buscar por nome, CPF, telefone ou placa…" oninput="onSearchInput(this.value)" onkeydown="if(event.key==='Enter') submitSearch()">
        </div>
        ${await searchDropdownHtml()}
      </div>
    </div>

    <div class="grid grid-3" style="margin-bottom:18px;">
      <div class="card" style="grid-column: span 1;">
        <div class="card-head">
          <h3>Ganhos ${periodLabel}</h3>
          <div class="period-tabs">
            <button class="${state.HOME_PERIOD === 'dia' ? 'active' : ''}" onclick="setHomePeriod('dia')">Dia</button>
            <button class="${state.HOME_PERIOD === 'semana' ? 'active' : ''}" onclick="setHomePeriod('semana')">Semana</button>
            <button class="${state.HOME_PERIOD === 'mes' ? 'active' : ''}" onclick="setHomePeriod('mes')">Mês</button>
          </div>
        </div>
        <div class="stat-value green">${fmtMoney(lucro)}</div>
        <div class="stat-sub">${servicos.length} serviço${servicos.length === 1 ? '' : 's'} registrado${servicos.length === 1 ? '' : 's'} no período</div>
      </div>

      <div class="card">
        <div class="card-head"><h3>Clientes cadastrados</h3></div>
        <div class="stat-value">${state.DATA.clientes.length}</div>
        <div class="stat-sub">${todosServicos.length} serviços no total</div>
        <button class="btn btn-primary btn-sm" style="margin-top:14px;" onclick="openClientForm()">${icon('plus')} Cadastrar cliente</button>
      </div>

      <div class="card">
        <div class="card-head"><h3>Compromissos hoje</h3></div>
        <div class="stat-value">${agendaHoje.length}</div>
        <div class="stat-sub">${agendaSemana.length} nos próximos 7 dias</div>
        <button class="btn btn-ghost btn-sm" style="margin-top:14px;" onclick="openAgendaForm()">${icon('plus')} Novo compromisso</button>
      </div>
    </div>

    <div class="grid grid-2">
      <div class="card">
        <div class="card-head">
          <h3>Agenda de hoje</h3>
          <button class="icon-btn" title="Ver agenda completa" onclick="go('agenda')">${icon('calendar')}</button>
        </div>
        ${agendaHoje.length ? agendaHoje.map(agendaItemHtml).join('') : '<div class="agenda-empty">Nenhum compromisso para hoje.</div>'}
      </div>
      <div class="card">
        <div class="card-head"><h3>Próximos 7 dias</h3></div>
        ${agendaSemana.length ? agendaSemana.slice(0, 6).map(a => agendaItemHtml(a, true)).join('') : '<div class="agenda-empty">Nada agendado por enquanto.</div>'}
      </div>
    </div>
  </div>`;
}