import { state } from '../core/state.js';

import {
    uid,
    fmtMoney,
    todayISO,
    escapeHtml
} from '../core/utils.js';

import { icon } from '../core/icons.js';

import { go } from '../core/router.js';

import { showToast } from '../components/toast.js';
import { showConfirm } from '../components/confirm.js';
import { closeModal } from '../components/modal.js';

import {
    allServicos
} from '../core/data.js';

import {
    saveAnexoFile,
    deleteAnexoFile,
    readFileAsBase64
} from '../core/storage.js';

import {
    saveService,
    deleteService,
    saveConfiguracoes
} from '../core/firestore.js';

const TIPO_MULTA = 'Recurso de multas/CNH';

function tiposArray(val) {
    if (!val) return [];
    return Array.isArray(val) ? val : [val];
}

export function openServiceForm(clienteId, servicoId) {
    const c = state.DATA.clientes.find(x => x.id === clienteId);
    const s = servicoId ? (c.servicos || []).find(x => x.id === servicoId) : null;
    const isEdit = !!s;
    state.CURRENT_INFRACOES = (s && s.infracoes) ? s.infracoes.map(x => Object.assign({}, x)) : [];
    state.CURRENT_TIPOS = tiposArray(s ? s.tipoServico : null);
    state.CURRENT_COBRANCAS = (s && s.cobrancas && s.cobrancas.length) ? s.cobrancas.map(x => Object.assign({}, x)) : [];
    state.REMOVED_ANEXO_KEYS = [];
    if (s && s.anexos && s.anexos.length) {
        state.CURRENT_ANEXOS = s.anexos.map(a => Object.assign({ status: 'existing' }, a));
    } else if (s && s.anexoNome) {
        state.CURRENT_ANEXOS = [{ id: 'legacy', nome: s.anexoNome, mime: 'application/pdf', status: 'existing', key: 'anexo:' + s.id }];
    } else {
        state.CURRENT_ANEXOS = [];
    }
    const overlay = document.createElement('div');
    overlay.className = 'form-overlay';
    overlay.id = 'serviceFormOverlay';
    overlay.innerHTML = `
    <div class="form-modal">
      <div class="form-modal-head">
        <h3>${isEdit ? 'Editar serviço' : 'Novo serviço'} — ${escapeHtml(c.nome)}</h3>
        <button class="icon-btn" onclick="closeModal('serviceFormOverlay')">${icon('x')}</button>
      </div>
      <div class="form-modal-body">
        <div class="field">
          <label>Data do serviço</label>
          <input id="s_data" type="date" value="${s ? s.data : todayISO()}">
        </div>
        <div class="field-row">
          <div class="field plate-field">
            <label>Placa do veículo</label>
            <input id="s_placa" value="${s ? escapeHtml(s.placa || '') : ''}" placeholder="ABC1D23" maxlength="8" oninput="this.value=this.value.toUpperCase()">
          </div>
          <div class="field">
            <label>Renavam</label>
            <input id="s_renavam" class="mono" value="${s ? escapeHtml(s.renavam || '') : ''}" placeholder="00000000000" maxlength="11" oninput="this.value=onlyDigits(this.value)">
          </div>
        </div>
        <div class="field-row">
          <div class="field">
            <label>CNH</label>
            <input id="s_cnh" class="mono" value="${s ? escapeHtml(s.cnh || '') : ''}" placeholder="Número da CNH">
          </div>
          <div class="field">
            <label>Marca / Modelo do veículo</label>
            <input id="s_marca" value="${s ? escapeHtml(s.marca || '') : ''}" placeholder="Ex: Fiat Uno 2015">
          </div>
        </div>
        <div class="field">
          <label>Tipo(s) de serviço prestado</label>
          <div id="tiposChecklist" class="tipos-checklist">${tiposChecklistHtml()}</div>
          <div style="display:flex;gap:8px;margin-top:10px;">
            <button type="button" class="btn btn-ghost btn-sm" onclick="toggleNewTipoInput(true)">${icon('plus')} Novo tipo</button>
            <button type="button" class="btn btn-ghost btn-sm" onclick="openManageTipos()">${icon('edit')} Editar/excluir tipos</button>
          </div>
          <div id="newTipoRow" style="display:none;gap:8px;margin-top:8px;">
            <input id="newTipoInput" placeholder="Nome do novo tipo de serviço" style="flex:1;border:1.5px solid var(--line);border-radius:9px;padding:8px 10px;font-size:13px;background:var(--card);" onkeydown="if(event.key==='Enter'){event.preventDefault();confirmNewTipo();}">
            <button type="button" class="btn btn-primary btn-sm" onclick="confirmNewTipo()">Adicionar</button>
            <button type="button" class="btn btn-ghost btn-sm" onclick="toggleNewTipoInput(false)">Cancelar</button>
          </div>
          <div class="hint">Você pode marcar mais de um tipo de serviço para o mesmo registro.</div>
        </div>
        <div id="infracoesSection" class="field infracoes-box" style="display:${state.CURRENT_TIPOS.includes(TIPO_MULTA) ? 'block' : 'none'};">
          <label>Infrações recorridas</label>
          <div id="infracoesList">${infracoesListHtml()}</div>
          <button type="button" class="btn btn-ghost btn-sm" onclick="addInfracao()">${icon('plus')} Adicionar infração</button>
        </div>
        <div class="field">
          <label>Detalhamento do que foi cobrado</label>
          <div id="cobrancasList">${cobrancasListHtml()}</div>
          <button type="button" class="btn btn-ghost btn-sm" onclick="addCobranca()">${icon('plus')} Adicionar cobrança</button>
          <div class="cobrancas-total-box">
            <span>Total cobrado</span>
            <b id="cobrancasTotalValue" class="mono">${fmtMoney(cobrancasTotal())}</b>
          </div>
        </div>
        <div class="field">
          <label>Lucro gerado por este serviço</label>
          <div class="money-input"><span>R$</span><input id="s_lucro" type="number" step="0.01" min="0" value="${s ? s.lucro : ''}" placeholder="0,00"></div>
        </div>
        <div class="field">
          <label>Anexos (documentação em PDF, PNG ou JPEG)</label>
          <div id="anexosList">${anexosListHtml()}</div>
          <div class="file-drop" onclick="document.getElementById('s_arquivos').click()">
            ${icon('clip')}<b>Clique para anexar arquivos</b><span>pode selecionar vários de uma vez, até 4 MB cada</span>
          </div>
          <input type="file" id="s_arquivos" accept="application/pdf,image/png,image/jpeg" multiple style="display:none;" onchange="handleServiceFilesChosen(this)">
        </div>
      </div>
      <div class="form-modal-foot">
        <button class="btn btn-ghost" onclick="closeModal('serviceFormOverlay')">Cancelar</button>
        <button class="btn btn-primary" onclick="submitServiceForm('${clienteId}','${isEdit ? s.id : ''}')">${icon('check')} ${isEdit ? 'Salvar alterações' : 'Adicionar serviço'}</button>
      </div>
    </div>`;
    document.body.appendChild(overlay);
}
function tiposChecklistHtml() {
    return state.DATA.tiposServico.map(t => {
        const checked = state.CURRENT_TIPOS.includes(t);
        return `<button type="button" class="tipo-chip ${checked ? 'checked' : ''}" data-tipo="${escapeHtml(t)}" onclick="toggleTipoFromEl(this)">${checked ? icon('check') : ''}<span>${escapeHtml(t)}</span></button>`;
    }).join('');
}
export function toggleTipoFromEl(el) {
    const t = el.dataset.tipo;
    const idx = state.CURRENT_TIPOS.indexOf(t);
    if (idx >= 0) state.CURRENT_TIPOS.splice(idx, 1); else state.CURRENT_TIPOS.push(t);
    document.getElementById('tiposChecklist').innerHTML = tiposChecklistHtml();
    const sec = document.getElementById('infracoesSection');
    if (sec) sec.style.display = state.CURRENT_TIPOS.includes(TIPO_MULTA) ? 'block' : 'none';
}
export function toggleNewTipoInput(show) {
    document.getElementById('newTipoRow').style.display = show ? 'flex' : 'none';
    if (show) setTimeout(() => document.getElementById('newTipoInput').focus(), 30);
}
export async function confirmNewTipo() {
    const input = document.getElementById('newTipoInput');
    const val = input.value.trim();
    if (!val) { showToast('Digite o nome do novo tipo de serviço.', true); return; }
    if (!state.DATA.tiposServico.includes(val)) {
        state.DATA.tiposServico.push(val);

        await saveConfiguracoes({
            tiposServico: state.DATA.tiposServico
        });
    }
    if (!state.CURRENT_TIPOS.includes(val)) state.CURRENT_TIPOS.push(val);
    document.getElementById('tiposChecklist').innerHTML = tiposChecklistHtml();
    const sec = document.getElementById('infracoesSection');
    if (sec) sec.style.display = state.CURRENT_TIPOS.includes(TIPO_MULTA) ? 'block' : 'none';
    input.value = '';
    toggleNewTipoInput(false);
    showToast('Tipo de serviço adicionado e selecionado.');
}
export function openManageTipos() {
    const overlay = document.createElement('div');
    overlay.className = 'form-overlay';
    overlay.id = 'manageTiposOverlay';
    overlay.style.zIndex = 150;
    overlay.innerHTML = `
    <div class="form-modal" style="max-width:460px;">
      <div class="form-modal-head">
        <h3>Editar / excluir tipos de serviço</h3>
        <button class="icon-btn" onclick="closeModal('manageTiposOverlay')">${icon('x')}</button>
      </div>
      <div class="form-modal-body">
        <div class="hint" style="margin-bottom:12px;">Altere o nome para corrigir um tipo escrito errado (atualiza todos os serviços já registrados) ou exclua um tipo que não é mais oferecido.</div>
        <div id="tiposManageList">${tiposManageListHtml()}</div>
      </div>
      <div class="form-modal-foot">
        <button class="btn btn-ghost" onclick="closeModal('manageTiposOverlay')">Fechar</button>
      </div>
    </div>`;
    document.body.appendChild(overlay);
}
function tiposManageListHtml() {
    return state.DATA.tiposServico.map((t) => {
        const locked = t === TIPO_MULTA;
        return `<div class="tipo-manage-row">
      <input value="${escapeHtml(t)}" ${locked ? 'disabled' : ''} data-original="${escapeHtml(t)}" onchange="renameTipo(this)">
      ${locked
                ? '<span class="hint" style="margin:0;white-space:nowrap;">Tipo especial</span>'
                : `<button class="icon-btn" title="Excluir tipo" onclick="deleteTipo('${escapeHtml(t).replace(/'/g, "&#39;")}')">${icon('trash')}</button>`}
    </div>`;
    }).join('');
}
export async function renameTipo(el) {
    const oldVal = el.dataset.original;
    const newVal = el.value.trim();
    if (!newVal) { showToast('O nome não pode ficar vazio.', true); el.value = oldVal; return; }
    if (newVal === oldVal) return;
    if (state.DATA.tiposServico.includes(newVal)) {
        showToast('Já existe um tipo de serviço com esse nome.', true);
        el.value = oldVal;
        return;
    }
    const idx = state.DATA.tiposServico.indexOf(oldVal);
    if (idx >= 0) state.DATA.tiposServico[idx] = newVal;
    state.DATA.clientes.forEach(c => {
        (c.servicos || []).forEach(s => {
            if (Array.isArray(s.tipoServico)) {
                s.tipoServico = s.tipoServico.map(x => x === oldVal ? newVal : x);
            } else if (s.tipoServico === oldVal) {
                s.tipoServico = newVal;
            }
        });
    });
    if (state.CURRENT_TIPOS && state.CURRENT_TIPOS.includes(oldVal)) {
        state.CURRENT_TIPOS = state.CURRENT_TIPOS.map(x => x === oldVal ? newVal : x);
    }
    await saveConfiguracoes({
        tiposServico: state.DATA.tiposServico
    });

    el.dataset.original = newVal;
    showToast('Tipo de serviço renomeado em todos os registros.');
    const checklist = document.getElementById('tiposChecklist');
    if (checklist) checklist.innerHTML = tiposChecklistHtml();
}
export function deleteTipo(t) {
    if (t === TIPO_MULTA) { showToast('Este tipo é especial e não pode ser excluído.', true); return; }
    const emUso = allServicos().some(s => tiposArray(s.tipoServico).includes(t));
    const msg = emUso
        ? 'Este tipo já foi usado em serviços registrados. Ele deixará de aparecer como opção para novos serviços, mas os registros existentes continuam mostrando o nome atual. Deseja continuar?'
        : 'Excluir este tipo de serviço da lista?';
    showConfirm(msg, function () {
        state.DATA.tiposServico = state.DATA.tiposServico.filter(x => x !== t);
        state.CURRENT_TIPOS = state.CURRENT_TIPOS.filter(x => x !== t);
        saveConfiguracoes({
            tiposServico: state.DATA.tiposServico
        }).then(() => {
            showToast('Tipo de serviço excluído.');
            const manageList = document.getElementById('tiposManageList');
            if (manageList) manageList.innerHTML = tiposManageListHtml();
            const checklist = document.getElementById('tiposChecklist');
            if (checklist) checklist.innerHTML = tiposChecklistHtml();
        });
    });
}
function infracoesListHtml() {
    if (state.CURRENT_INFRACOES.length === 0) {
        return '<div class="hint" style="margin-bottom:10px;">Nenhuma infração adicionada ainda.</div>';
    }
    return state.CURRENT_INFRACOES.map((inf, idx) => `
    <div class="infracao-row">
      <div class="infracao-row-grid">
        <input placeholder="Nº do auto de infração" value="${escapeHtml(inf.numeroAuto || '')}" oninput="updateInfracao(${idx},'numeroAuto',this.value)">
        <input placeholder="Órgão autuador" value="${escapeHtml(inf.orgaoAutuador || '')}" oninput="updateInfracao(${idx},'orgaoAutuador',this.value)">
        <input placeholder="Tipo de infração" value="${escapeHtml(inf.tipoInfracao || '')}" oninput="updateInfracao(${idx},'tipoInfracao',this.value)">
      </div>
      <button class="icon-btn" onclick="removeInfracao(${idx})" type="button" title="Remover">${icon('x')}</button>
    </div>
  `).join('');
}
export function updateInfracao(idx, key, val) { state.CURRENT_INFRACOES[idx][key] = val; }
export function addInfracao() {
    state.CURRENT_INFRACOES.push({ numeroAuto: '', orgaoAutuador: '', tipoInfracao: '' });
    document.getElementById('infracoesList').innerHTML = infracoesListHtml();
}
export function removeInfracao(idx) {
    state.CURRENT_INFRACOES.splice(idx, 1);
    document.getElementById('infracoesList').innerHTML = infracoesListHtml();
}

/* ---- cobranças (itens cobrados + soma automática) ---- */
function cobrancasListHtml() {
    if (state.CURRENT_COBRANCAS.length === 0) {
        return '<div class="hint" style="margin-bottom:10px;">Nenhuma cobrança adicionada ainda.</div>';
    }
    return state.CURRENT_COBRANCAS.map((cb, idx) => `
    <div class="cobranca-row">
      <input placeholder="Nome da cobrança (ex: IPVA, Taxa DETRAN...)" value="${escapeHtml(cb.nome || '')}" oninput="updateCobranca(${idx},'nome',this.value)">
      <div class="money-input cobranca-valor"><span>R$</span><input type="number" step="0.01" min="0" placeholder="0,00" value="${cb.valor !== undefined && cb.valor !== '' ? cb.valor : ''}" oninput="updateCobranca(${idx},'valor',this.value)"></div>
      <button class="icon-btn" type="button" onclick="removeCobranca(${idx})" title="Remover">${icon('x')}</button>
    </div>
  `).join('');
}
function cobrancasTotal() {
    return state.CURRENT_COBRANCAS.reduce((a, cb) => a + (parseFloat(cb.valor) || 0), 0);
}
function updateCobrancasTotalDisplay() {
    const el = document.getElementById('cobrancasTotalValue');
    if (el) el.textContent = fmtMoney(cobrancasTotal());
}
export function updateCobranca(idx, key, val) {
    state.CURRENT_COBRANCAS[idx][key] = val;
    if (key === 'valor') updateCobrancasTotalDisplay();
}
export function addCobranca() {
    state.CURRENT_COBRANCAS.push({ nome: '', valor: '' });
    document.getElementById('cobrancasList').innerHTML = cobrancasListHtml();
    updateCobrancasTotalDisplay();
}
export function removeCobranca(idx) {
    state.CURRENT_COBRANCAS.splice(idx, 1);
    document.getElementById('cobrancasList').innerHTML = cobrancasListHtml();
    updateCobrancasTotalDisplay();
}

/* ---- anexos (múltiplos arquivos por serviço) ---- */
function anexosListHtml() {
    if (state.CURRENT_ANEXOS.length === 0) {
        return 'Nenhum anexo adicionado ainda.';
    }

    return state.CURRENT_ANEXOS.map(a => `
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
                onclick="removeCurrentAnexo('${a.id}')"
                title="Remover">
                ${icon('x')}
            </button>
        </span>
    `).join('');
}
export async function handleServiceFilesChosen(input) {
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
            state.CURRENT_ANEXOS.push({ id: uid(), nome: file.name, mime: file.type, status: 'new', base64 });
        } catch (e) { showToast('Erro ao ler arquivo: ' + file.name, true); }
    }
    input.value = '';
    document.getElementById('anexosList').innerHTML = anexosListHtml();
}
export function removeCurrentAnexo(id) {
    const idx = state.CURRENT_ANEXOS.findIndex(a => a.id === id);
    if (idx < 0) return;
    const a = state.CURRENT_ANEXOS[idx];
    if (a.status === 'existing' && a.key) state.REMOVED_ANEXO_KEYS.push(a.key);
    state.CURRENT_ANEXOS.splice(idx, 1);
    document.getElementById('anexosList').innerHTML = anexosListHtml();
}

export async function submitServiceForm(clienteId, existingId) {
    const c = state.DATA.clientes.find(x => x.id === clienteId);
    const data = document.getElementById('s_data').value || todayISO();
    if (state.CURRENT_TIPOS.length === 0) { showToast('Selecione ao menos um tipo de serviço.', true); return; }
    const infracoesValidas = state.CURRENT_INFRACOES.filter(i => (i.numeroAuto || '').trim() || (i.orgaoAutuador || '').trim() || (i.tipoInfracao || '').trim());
    const cobrancasValidas = state.CURRENT_COBRANCAS.filter(cb => (cb.nome || '').trim() || (cb.valor !== '' && cb.valor != null));
    const payload = {
        data,
        placa: document.getElementById('s_placa').value.trim().toUpperCase(),
        renavam: document.getElementById('s_renavam').value.trim(),
        cnh: document.getElementById('s_cnh').value.trim(),
        marca: document.getElementById('s_marca').value.trim(),
        tipoServico: state.CURRENT_TIPOS.slice(),
        cobrancas: cobrancasValidas,
        lucro: parseFloat(document.getElementById('s_lucro').value) || 0,
        infracoes: state.CURRENT_TIPOS.includes(TIPO_MULTA) ? infracoesValidas : [],
    };
    let servicoId = existingId;
    let sObj;
    if (!c.servicos) c.servicos = [];
    if (existingId) {
        sObj = c.servicos.find(x => x.id === existingId);
        Object.assign(sObj, payload);
    } else {
        servicoId = uid();
        sObj = Object.assign({ id: servicoId }, payload);
        c.servicos.push(sObj);
    }
    const anexosFinal = [];
    for (const a of state.CURRENT_ANEXOS) {
        if (a.status === 'new') {
            const key = 'servicos/' + clienteId + '/' + servicoId + '/' + a.id;

            const uploaded = await saveAnexoFile(
                key,
                a.nome,
                a.base64,
                a.mime
            );
            anexosFinal.push({
                id: a.id,
                nome: a.nome,
                mime: a.mime,
                key,
                url: uploaded.url
            });
        } else {
            anexosFinal.push({
                id: a.id,
                nome: a.nome,
                mime: a.mime,
                key: a.key,
                url: a.url
            });
        }
    }
    for (const key of state.REMOVED_ANEXO_KEYS) { await deleteAnexoFile(key); }
    sObj.anexos = anexosFinal;
    delete sObj.anexoNome;

    await saveService(
        clienteId,
        sObj
    );
    closeModal('serviceFormOverlay');
    showToast(existingId ? 'Serviço atualizado.' : 'Serviço adicionado.');
    go('clienteDetalhe', { id: clienteId });
}
export function confirmDeleteService(clienteId, servicoId) {
    showConfirm('Excluir este serviço? Esta ação não pode ser desfeita.', function () {
        const c = state.DATA.clientes.find(x => x.id === clienteId);
        const s = c.servicos.find(x => x.id === servicoId);
        const anexos = (s && s.anexos) ? s.anexos : (s && s.anexoNome ? [{ key: 'anexo:' + s.id }] : []);
        anexos.forEach(a => deleteAnexoFile(a.key));
        c.servicos = c.servicos.filter(
            s => s.id !== servicoId
        );

        deleteService(
            clienteId,
            servicoId
        ).then(() => {
            showToast('Serviço excluído.');
            go('clienteDetalhe', { id: clienteId });
        });
    });
}