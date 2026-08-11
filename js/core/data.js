import { state } from './state.js';
import { escapeHtml, fmtDateHuman } from './utils.js';
import { icon } from './icons.js';

export function allServicos() {
    const clientes = state.DATA.clientes || [];

    return clientes.flatMap(cliente =>
        (cliente.servicos || []).map(servico => ({
            ...servico,
            clienteId: cliente.id,
            clienteNome: cliente.nome,
            placa: cliente.placa
        }))
    );
}

export function servicosNoPeriodo(start, end) {
    return allServicos().filter(
        servico =>
            servico.data >= start &&
            servico.data <= end
    );
}

export function sumLucro(list) {
    return list.reduce(
        (total, servico) =>
            total + (Number(servico.lucro) || 0),
        0
    );
}



export function agendaItemHtml(a, showDate = false) {
    const cliente = a.clienteId
        ? state.DATA.clientes.find(c => c.id === a.clienteId)
        : null;

    return `<div class="agenda-item">
        <div class="agenda-time mono">
            ${showDate ? fmtDateHuman(a.data) : (a.hora || '—')}
        </div>

        <div class="agenda-desc" style="flex:1;">
            <b>${escapeHtml(a.descricao)}</b>
            <span>
                ${cliente ? 'Cliente: ' + escapeHtml(cliente.nome) + ' · ' : ''}
                ${showDate ? (a.hora || '') : ''}
            </span>
        </div>

        <button
            class="icon-btn"
            onclick="deleteAgendaItem('${a.id}')"
            title="Remover">
            ${icon('x')}
        </button>
    </div>`;
}

export const TIPO_MULTA = 'Recurso de multas/CNH';

export function defaultTipos() {
    return [
        'Transferência de propriedade',
        'Licenciamento anual',
        'Emplacamento',
        '2ª via de CRLV',
        '2ª via de CNH',
        'Baixa de veículo',
        'Vistoria veicular',
        'Comunicação de venda',
        TIPO_MULTA,
        'Outro'
    ];
}

export function tiposArray(val) {
    if (!val) return [];
    return Array.isArray(val) ? val : [val];
}