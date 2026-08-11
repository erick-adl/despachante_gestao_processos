import { state } from '../core/state.js';

import {
  fmtMoney,
  fmtDateShort,
  escapeHtml,
  todayISO,
  weekRangeISO,
  monthRangeISO,
  renderPlateChip
} from '../core/utils.js';

import { icon } from '../core/icons.js';

import {
  allServicos,
  servicosNoPeriodo,
  sumLucro,
  tiposArray
} from '../core/data.js';




export function viewRelatorio() {
  const today = todayISO();
  let start = today, end = today;
  if (state.REPORT_PERIOD === 'semana') { const r = weekRangeISO(today); start = r.start; end = r.end; }
  if (state.REPORT_PERIOD === 'mes') { const r = monthRangeISO(today); start = r.start; end = r.end; }
  if (state.REPORT_PERIOD === 'custom' && state.REPORT_RANGE) { start = state.REPORT_RANGE.start; end = state.REPORT_RANGE.end; }
  const servicos = servicosNoPeriodo(start, end).sort((a, b) => b.data.localeCompare(a.data));
  const total = sumLucro(servicos);

  const byTipo = {};
  servicos.forEach(s => { tiposArray(s.tipoServico).forEach(t => { byTipo[t] = (byTipo[t] || 0) + (Number(s.lucro) || 0); }); });
  const tipoRows = Object.entries(byTipo).sort((a, b) => b[1] - a[1]);

  return `
  <div class="view">
    <div class="page-head"><h1>Financeiro</h1></div>
    <div class="filter-bar">
      <div class="period-tabs">
        <button class="${state.REPORT_PERIOD === 'dia' ? 'active' : ''}" onclick="setReportPeriod('dia')">Hoje</button>
        <button class="${state.REPORT_PERIOD === 'semana' ? 'active' : ''}" onclick="setReportPeriod('semana')">Semana</button>
        <button class="${state.REPORT_PERIOD === 'mes' ? 'active' : ''}" onclick="setReportPeriod('mes')">Mês</button>
        <button class="${state.REPORT_PERIOD === 'custom' ? 'active' : ''}" onclick="setReportPeriod('custom')">Período</button>
      </div>
      ${state.REPORT_PERIOD === 'custom' ? `
        <input type="date" id="rp_start" value="${state.REPORT_RANGE ? state.REPORT_RANGE.start : today}" onchange="updateReportRange()">
        <span style="color:var(--text-muted);">até</span>
        <input type="date" id="rp_end" value="${state.REPORT_RANGE ? state.REPORT_RANGE.end : today}" onchange="updateReportRange()">
      ` : ''}
    </div>

    <div class="grid grid-2" style="margin-bottom:18px;">
      <div class="card">
        <div class="card-head"><h3>Lucro no período</h3></div>
        <div class="stat-value green">${fmtMoney(total)}</div>
        <div class="stat-sub">${fmtDateShort(start)} — ${fmtDateShort(end)} · ${servicos.length} serviço${servicos.length === 1 ? '' : 's'}</div>
      </div>
      <div class="card">
        <div class="card-head"><h3>Por tipo de serviço</h3></div>
        ${tipoRows.length === 0 ? '<div class="stat-sub">Sem dados no período.</div>' :
      tipoRows.map(([tipo, val]) => `<div style="display:flex;justify-content:space-between;padding:6px 0;font-size:13px;border-bottom:1px solid var(--line);"><span>${escapeHtml(tipo)}</span><b class="mono">${fmtMoney(val)}</b></div>`).join('')}
      </div>
    </div>

    <div class="table-wrap">
      <table>
        <thead><tr><th>Data</th><th>Cliente</th><th>Placa</th><th>Serviço</th><th>Lucro</th></tr></thead>
        <tbody>
          ${servicos.length === 0 ? `<tr><td colspan="5"><div class="empty-state">${icon('inbox')}<b>Nenhum serviço no período</b></div></td></tr>` :
      servicos.map(s => `<tr class="row-click" onclick="go('clienteDetalhe',{id:'${s.clienteId}'})">
              <td class="mono">${fmtDateShort(s.data)}</td>
              <td>${escapeHtml(s.clienteNome)}</td>
              <td>${renderPlateChip(s.placa)}</td>
              <td>${tiposArray(s.tipoServico).map(t => escapeHtml(t)).join(', ') || '—'}</td>
              <td class="mono" style="color:var(--green);font-weight:700;">${fmtMoney(s.lucro)}</td>
            </tr>`).join('')}
        </tbody>
      </table>
    </div>
  </div>`;
}