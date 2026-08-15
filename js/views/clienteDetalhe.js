import { state } from '../core/state.js';

import {
    escapeHtml,
    fmtMoney,
    fmtDateShort,
    onlyDigits
} from '../core/utils.js';

import { icon } from '../core/icons.js';

import { go } from '../core/router.js';

import { showToast } from '../components/toast.js';
import { showConfirm } from '../components/confirm.js';

import {
    sumLucro,
    tiposArray
} from '../core/data.js';

import {
    deleteAnexoFile
} from '../core/storage.js';

import { renderPlateChip } from '../core/utils.js';
import { emptyState } from '../components/emptyState.js';
import {
    deleteClient,
    getServices,
    deleteService
} from '../core/firestore.js';




export async function viewClienteDetalhe(id) {
    const c = state.DATA.clientes.find(x => x.id === id);
    if (!c) {
        return `<div class="view">${emptyState('users', 'Cliente não encontrado', 'Volte para a lista de clientes.')}</div>`;
    }

    const servicos = (await getServices(id))
        .slice()
        .sort((a, b) => b.data.localeCompare(a.data));
    const totalLucro = sumLucro(servicos);
    return `
  <div class="view">
    <div class="breadcrumb"><b onclick="go('clientes')">Clientes</b> / ${escapeHtml(c.nome)}</div>
    <div class="client-hero">
      <div>
        <h2>${escapeHtml(c.nome)}</h2>
        <div class="meta-row">
          <div class="meta-item">
        <span>Código</span>
        <b class="mono">
            ${c.codigo ? String(c.codigo).padStart(6, '0') : '—'}
        </b>
        </div>
          <div class="meta-item"><span>CPF</span><b class="mono">${escapeHtml(c.cpf || '—')}</b></div>
          <div class="meta-item">
            <span>Telefone</span>
            <div style="display:flex;align-items:center;gap:8px;">
              <b class="mono">${escapeHtml(c.telefone || '—')}</b>
              ${c.telefone ? `<a href="https://wa.me/55${onlyDigits(c.telefone)}" target="_blank" title="Abrir WhatsApp" style="color:#25D366;line-height:0;font-size:18px;">${icon('whatsapp')}</a>` : ''}
            </div>
          </div>
          <div class="meta-item"><span>CNH</span><b class="mono">${escapeHtml(c.cnh || '—')}</b></div>
          <div class="meta-item"><span>Endereço</span><b>${escapeHtml(c.endereco || '—')}</b></div>
          <div class="meta-item"><span>Referência</span><b>${escapeHtml(c.referencia || '—')}</b></div>
        </div>
        ${(function () {
      const docs = (c.documentos && c.documentos.length) ? c.documentos : (c.documentoIdentificacao ? [c.documentoIdentificacao] : []);
      if (!docs.length) return '';
      return `<div style="display:flex;flex-wrap:wrap;gap:8px;margin-top:14px;">${docs.map(d => `<button class="anexo-link" onclick="downloadAnexoFile('${encodeURIComponent(d.url || '')}','${encodeURIComponent(d.nome)}')">${icon('file')} ${escapeHtml(d.nome)}</button>`).join('')}</div>`;
    })()}
      </div>
      <div style="display:flex;gap:8px;flex-shrink:0;">
        <button class="icon-btn" style="background:var(--ink-3);border-color:var(--line-dark);color:var(--text-inverse);" onclick="openClientForm('${c.id}')" title="Editar cliente">${icon('edit')}</button>
        <button class="icon-btn" style="background:var(--ink-3);border-color:var(--line-dark);color:#FF9C93;" onclick="confirmDeleteClient('${c.id}')" title="Excluir cliente">${icon('trash')}</button>
      </div>
    </div>

    <div class="page-head">
      <div>
        <h3 style="font-size:14px;text-transform:uppercase;letter-spacing:.06em;color:var(--text-muted);">Serviços prestados (${servicos.length}) · Lucro total <b class="mono" style="color:var(--green);">${fmtMoney(totalLucro)}</b></h3>
      </div>
      <button class="btn btn-primary" onclick="openServiceForm('${c.id}')">${icon('plus')} Novo serviço</button>
    </div>

    ${servicos.length === 0 ? emptyState('clip', 'Nenhum serviço registrado', 'Adicione o primeiro serviço prestado para este cliente.') :
      servicos.map(s => serviceCardHtml(c, s)).join('')}
  </div>`;
}

function serviceCardHtml(c, s) {
  const anexos = (s.anexos && s.anexos.length) ? s.anexos : (s.anexoNome ? [{ nome: s.anexoNome, mime: 'application/pdf', key: 'anexo:' + s.id }] : []);
  const cobrancas = s.cobrancas || [];
  const totalCobrado = cobrancas.reduce((a, x) => a + (Number(x.valor) || 0), 0);
  return `<div class="service-card">
    <div class="service-card-top">
      <div class="service-title">
        ${renderPlateChip(s.placa)}
        <div style="display:flex;flex-wrap:wrap;gap:6px;">${tiposArray(s.tipoServico).map(t => `<span class="badge badge-orange">${escapeHtml(t)}</span>`).join('') || '<span class="badge badge-gray">Serviço</span>'}</div>
        <span class="badge badge-gray mono">${fmtDateShort(s.data)}</span>
      </div>
      <div style="display:flex;gap:6px;">
        <button class="icon-btn" onclick="openServiceForm('${c.id}','${s.id}')" title="Editar serviço">${icon('edit')}</button>
        <button class="icon-btn" onclick="confirmDeleteService('${c.id}','${s.id}')" title="Excluir serviço">${icon('trash')}</button>
      </div>
    </div>
    <div class="service-meta-grid">
      <div class="smeta"><span>Renavam</span><b class="mono">${escapeHtml(s.renavam || '—')}</b></div>
      <div class="smeta"><span>CNH</span><b class="mono">${escapeHtml(s.cnh || '—')}</b></div>
      <div class="smeta"><span>Marca / Modelo</span><b>${escapeHtml(s.marca || '—')}</b></div>
    </div>
    ${cobrancas.length ? `<div class="service-detail">
      ${cobrancas.map(x => `<div style="display:flex;justify-content:space-between;padding:3px 0;font-size:12.5px;"><span>${escapeHtml(x.nome || 'Cobrança')}</span><b class="mono">${fmtMoney(x.valor)}</b></div>`).join('')}
      <div style="display:flex;justify-content:space-between;padding-top:7px;margin-top:5px;border-top:1px dashed var(--line);font-weight:700;font-size:12.5px;"><span>Total cobrado</span><b class="mono">${fmtMoney(totalCobrado)}</b></div>
    </div>` : (s.detalhamento ? `<div class="service-detail">${escapeHtml(s.detalhamento)}</div>` : '')}
    ${s.infracoes && s.infracoes.length ? `<div class="service-detail" style="margin-top:8px;">
      <b style="display:block;margin-bottom:6px;font-size:10.5px;text-transform:uppercase;letter-spacing:.06em;color:var(--text-muted);">Infrações recorridas (${s.infracoes.length})</b>
      ${s.infracoes.map(i => `<div style="font-size:12.5px;padding:5px 0;border-bottom:1px dashed var(--line);"><b>Auto:</b> ${escapeHtml(i.numeroAuto || '—')} &nbsp; <b>Órgão:</b> ${escapeHtml(i.orgaoAutuador || '—')} &nbsp; <b>Infração:</b> ${escapeHtml(i.tipoInfracao || '—')}</div>`).join('')}
    </div>` : ''}
    <div class="service-foot" style="${anexos.length > 1 ? 'align-items:flex-start;' : ''}">
      <div class="lucro-tag mono">${fmtMoney(s.lucro)}</div>
      ${anexos.length ? `<div style="display:flex;flex-wrap:wrap;gap:6px;justify-content:flex-end;">${anexos.map(a => `<button class="anexo-link" onclick="downloadAnexoFile('${encodeURIComponent(a.url || '')}','${encodeURIComponent(a.nome)}')">${icon('file')} ${escapeHtml(a.nome)}</button>`).join('')}</div>` : '<span></span>'}
    </div>
  </div>`;
}

export function confirmDeleteClient(id) {
  showConfirm(
    'Excluir este cliente e todo o histórico de serviços? Esta ação não pode ser desfeita.',
    async function () {
      try {
        const c = state.DATA.clientes.find(x => x.id === id);

        if (!c) {
          showToast('Cliente não encontrado.', true);
          return;
        }

        // Remove anexos do cliente
        const docs = c.documentos || [];

        for (const d of docs) {
          if (d.key) {
            await deleteAnexoFile(d.key);
          }
        }

        // Busca e remove os serviços do cliente
        const servicos = await getServices(id);

        for (const s of servicos) {
          const anexos = s.anexos || [];

          for (const a of anexos) {
            if (a.key) {
              await deleteAnexoFile(a.key);
            }
          }

          await deleteService(id, s.id);
        }

        // Remove o cliente
        await deleteClient(id);

        // Atualiza o cache local
        state.DATA.clientes = state.DATA.clientes.filter(
          c => c.id !== id
        );

        showToast('Cliente excluído.');

        go('clientes');

      } catch (error) {
        console.error('Erro ao excluir cliente:', error);
        showToast(
          'Não foi possível excluir o cliente.',
          true
        );
      }
    }
  );
}
