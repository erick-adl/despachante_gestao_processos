import { saveClient } from '../core/firestore.js';
import { state } from '../core/state.js';

import {
    escapeHtml,
    fmtDateShort,
    todayISO,
    uid,
    normalize,
    onlyDigits
} from '../core/utils.js';

import {
    saveAnexoFile,
    deleteAnexoFile,
    readFileAsBase64
} from '../core/storage.js';


import { icon } from '../core/icons.js';

import { go } from '../core/router.js';

import { showToast } from '../components/toast.js';

import { emptyState } from '../components/emptyState.js';

let CLIENTES_LIST_QUERY = '';



export function viewClientesList() {
    return `
        <div class="view">
            <div class="page-head">
                <div>
                    <h1>Clientes</h1>
                    <p>Gerencie os clientes e seus serviços.</p>
                </div>

                <button class="btn btn-primary" onclick="openClientForm()">
                    ${icon('plus')} Novo cliente
                </button>
            </div>

            <div class="search-list-wrap">
                <div class="field" style="margin-bottom:16px;">
                    <input
                        type="text"
                        placeholder="Buscar por nome, CPF, telefone ou placa..."
                        value="${escapeHtml(CLIENTES_LIST_QUERY)}"
                        oninput="onClientesSearchInput(this.value)"
                    >
                </div>

                <div id="clientesTableHost">
                    ${clientesTableHtml()}
                </div>
            </div>
        </div>
    `;
}

export function onClientesSearchInput(v) {
    CLIENTES_LIST_QUERY = v;
    const host = document.getElementById('clientesTableHost');
    if (host) host.innerHTML = clientesTableHtml();
}

function clientAnexosListHtml() {
    if (state.CURRENT_CLIENT_ANEXOS.length === 0) {
        return 'Nenhum documento anexado ainda.';
    }

    return state.CURRENT_CLIENT_ANEXOS.map(a => `
        <span class="anexo-chip">
            ${icon('file')}
            ${escapeHtml(a.nome)}

            ${a.url ? `
                <button
                    type="button"
                    onclick="downloadAnexoFile('${encodeURIComponent(a.url)}', '${encodeURIComponent(a.nome)}')"
                    title="Baixar">
                    ${icon('download')}
                </button>
            ` : ''}

            <button
                type="button"
                onclick="removeCurrentClientAnexo('${a.id}')"
                title="Remover">
                ${icon('x')}
            </button>
        </span>
    `).join('');
}

export function openClientForm(clientId) {
    const c = clientId ? state.DATA.clientes.find(x => x.id === clientId) : null;
    const isEdit = !!c;
    state.REMOVED_CLIENT_ANEXO_KEYS = [];
    if (c && c.documentos && c.documentos.length) {
        state.CURRENT_CLIENT_ANEXOS = c.documentos.map(a => Object.assign({ status: 'existing' }, a));
    } else if (c && c.documentoIdentificacao) {
        state.CURRENT_CLIENT_ANEXOS = [{ id: 'legacy', nome: c.documentoIdentificacao.nome, mime: c.documentoIdentificacao.mime, status: 'existing', key: c.documentoIdentificacao.key }];
    } else {
        state.CURRENT_CLIENT_ANEXOS = [];
    }
    const overlay = document.createElement('div');
    overlay.className = 'form-overlay';
    overlay.id = 'clientFormOverlay';
    overlay.innerHTML = `
    <div class="form-modal">
      <div class="form-modal-head">
        <h3>${isEdit ? 'Editar cliente' : 'Cadastrar cliente'}</h3>
        <button class="icon-btn" onclick="closeModal('clientFormOverlay')">${icon('x')}</button>
      </div>
      <div class="form-modal-body">
        <div class="field">
          <label>Nome completo</label>
          <input id="f_nome" value="${c ? escapeHtml(c.nome) : ''}" placeholder="Ex: João da Silva">
        </div>
        <div class="field-row">
          <div class="field">
            <label>CPF</label>
            <input id="f_cpf" class="mono" value="${c ? escapeHtml(c.cpf || '') : ''}" placeholder="000.000.000-00" oninput="this.value=maskCPF(this.value)" maxlength="14">
          </div>
          <div class="field">
            <label>Telefone</label>
            <input id="f_telefone" class="mono" value="${c ? escapeHtml(c.telefone || '') : ''}" placeholder="(00) 00000-0000" oninput="this.value=maskPhone(this.value)" maxlength="15">
          </div>
        </div>
        <div class="field">
          <label>CNH</label>
          <input id="f_cnh" class="mono" value="${c ? escapeHtml(c.cnh || '') : ''}" placeholder="Número de registro da CNH">
        </div>
        <div class="field">
          <label>Endereço</label>
          <input id="f_endereco" value="${c ? escapeHtml(c.endereco || '') : ''}" placeholder="Rua, número, bairro, cidade">
        </div>
        <div class="field">
          <label>Documentos do cliente (anexos)</label>
          <div id="clientAnexosList">${clientAnexosListHtml()}</div>
          <div class="file-drop" onclick="document.getElementById('f_arquivos').click()">
            ${icon('clip')}<b>Clique para anexar arquivos</b><span>PDF, PNG ou JPEG — pode selecionar vários, até 4 MB cada</span>
          </div>
          <input type="file" id="f_arquivos" accept="application/pdf,image/png,image/jpeg" multiple style="display:none;" onchange="handleClientFilesChosen(this)">
        </div>
      </div>
      <div class="form-modal-foot">
        <button class="btn btn-ghost" onclick="closeModal('clientFormOverlay')">Cancelar</button>
        <button class="btn btn-primary" onclick="submitClientForm('${isEdit ? c.id : ''}')">${icon('check')} ${isEdit ? 'Salvar alterações' : 'Cadastrar cliente'}</button>
      </div>
    </div>`;
    document.body.appendChild(overlay);
    setTimeout(() => document.getElementById('f_nome').focus(), 50);
}

export async function submitClientForm(existingId) {
    const nome = document.getElementById('f_nome').value.trim();
    if (!nome) { showToast('Informe o nome do cliente.', true); return; }
    const payload = {
        nome,
        cpf: document.getElementById('f_cpf').value.trim(),
        telefone: document.getElementById('f_telefone').value.trim(),
        cnh: document.getElementById('f_cnh').value.trim(),
        endereco: document.getElementById('f_endereco').value.trim(),
    };
    let clientId = existingId;
    let clientObj;
    if (existingId) {
        clientObj = state.DATA.clientes.find(x => x.id === existingId);
        Object.assign(clientObj, payload);
    } else {
        clientId = uid();
        clientObj = Object.assign({ id: clientId, criadoEm: todayISO(), servicos: [] }, payload);
        state.DATA.clientes.push(clientObj);
    }
    const docsFinal = [];
    for (const a of state.CURRENT_CLIENT_ANEXOS) {
        if (a.status === 'new') {
            const key = 'clientes/' + clientId + '/' + a.id;

            const uploaded = await saveAnexoFile(
                key,
                a.nome,
                a.base64,
                a.mime
            );

            docsFinal.push({
                id: a.id,
                nome: a.nome,
                mime: a.mime,
                key,
                url: uploaded.url
            });
        } else {
            docsFinal.push({
                id: a.id,
                nome: a.nome,
                mime: a.mime,
                key: a.key,
                url: a.url
            });
        }
    }
    for (const key of state.REMOVED_CLIENT_ANEXO_KEYS) { await deleteAnexoFile(key); }
    clientObj.documentos = docsFinal;
    delete clientObj.documentoIdentificacao;
    await saveClient(
        clientObj
    );
    closeModal('clientFormOverlay');
    showToast(existingId ? 'Cliente atualizado.' : 'Cliente cadastrado. Agora adicione um serviço, se desejar.');
    go('clienteDetalhe', { id: clientId });
}

export async function handleClientFilesChosen(input) {
    const files = Array.from(input.files || []);
    for (const file of files) {
        if (!['application/pdf', 'image/png', 'image/jpeg'].includes(file.type)) {
            showToast('Formato não suportado: ' + file.name, true); continue;
        }
        if (file.size > 4 * 1024 * 1024) {
            showToast('Arquivo muito grande (máx. 4 MB): ' + file.name, true); continue;
        }
        try {
            const base64 = await readFileAsBase64(file);
            state.CURRENT_CLIENT_ANEXOS.push({ id: uid(), nome: file.name, mime: file.type, status: 'new', base64 });
        } catch (e) { showToast('Erro ao ler arquivo: ' + file.name, true); }
    }
    input.value = '';
    document.getElementById('clientAnexosList').innerHTML = clientAnexosListHtml();
}

export function removeCurrentClientAnexo(id) {
    const idx = state.CURRENT_CLIENT_ANEXOS.findIndex(a => a.id === id);
    if (idx < 0) return;
    const a = state.CURRENT_CLIENT_ANEXOS[idx];
    if (a.status === 'existing' && a.key) state.REMOVED_CLIENT_ANEXO_KEYS.push(a.key);
    state.CURRENT_CLIENT_ANEXOS.splice(idx, 1);
    document.getElementById('clientAnexosList').innerHTML = clientAnexosListHtml();
}


function clientesTableHtml() {
    const q = normalize(CLIENTES_LIST_QUERY);
    const qDigits = onlyDigits(CLIENTES_LIST_QUERY);
    let list = state.DATA.clientes.slice();
    if (CLIENTES_LIST_QUERY.trim()) {
        list = list.filter(c => {
            const nome = normalize(c.nome);
            const cpf = onlyDigits(c.cpf);
            const telefone = onlyDigits(c.telefone);
            const placaMatch = (c.servicos || []).some(s => normalize(s.placa).replace(/-/g, '').includes(q.replace(/-/g, '')) && q.length >= 2);
            return nome.includes(q) || (qDigits && cpf.includes(qDigits)) || (qDigits && telefone.includes(qDigits)) || placaMatch;
        });
    }
    list = list.sort((a, b) => (b.criadoEm || '').localeCompare(a.criadoEm || ''));
    if (list.length === 0) {
        return CLIENTES_LIST_QUERY.trim()
            ? emptyState('search', 'Nenhum cliente encontrado', 'Tente buscar por outro nome, CPF, telefone ou placa.')
            : emptyState('users', 'Nenhum cliente cadastrado ainda', 'Cadastre o primeiro cliente para começar a registrar serviços.');
    }
    return `
    <div class="table-wrap">
      <table>
        <thead><tr><th>Nome</th><th>CPF</th><th>Telefone</th><th>Serviços</th><th>Última movimentação</th><th></th></tr></thead>
        <tbody>
          ${list.map(c => {
        const ultimo = (c.servicos || []).slice().sort((a, b) => b.data.localeCompare(a.data))[0];
        return `<tr class="row-click" onclick="go('clienteDetalhe',{id:'${c.id}'})">
              <td><b>${escapeHtml(c.nome)}</b></td>
              <td class="mono">${escapeHtml(c.cpf || '—')}</td>
              <td class="mono">${escapeHtml(c.telefone || '—')}</td>
              <td>${(c.servicos || []).length}</td>
              <td>${ultimo ? fmtDateShort(ultimo.data) : '—'}</td>
              <td style="text-align:right;">${icon('arrowleft')}</td>
            </tr>`;
    }).join('')}
        </tbody>
      </table>
    </div>`;
}

export function resetClientesListQuery() {
    CLIENTES_LIST_QUERY = '';
}