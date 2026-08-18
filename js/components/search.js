import { state } from '../core/state.js';
import { normalize, onlyDigits, escapeHtml } from '../core/utils.js';
import { go } from '../core/router.js';
import { icon } from '../core/icons.js';
import { getServices } from '../core/firestore.js';


let searchRequestId = 0;

async function searchResults() {
    const q = normalize(state.SEARCH_QUERY);
    if (!q) return [];

    const qDigits = onlyDigits(state.SEARCH_QUERY);
    const normalizedPlateQuery = q.replace(/[\s-]/g, '');

    const clientesComServicos = await Promise.all(
        state.DATA.clientes.map(async cliente => {
            let servicos = [];

            try {
                servicos = await getServices(cliente.id);
            } catch (error) {
                console.error('Erro ao carregar serviços para busca:', error);
            }

            return {
                ...cliente,
                servicos
            };
        })
    );

    const results = [];

    clientesComServicos.forEach(c => {
        const nome = normalize(c.nome);
        const cpf = onlyDigits(c.cpf);
        const telefone = onlyDigits(c.telefone);
        const codigo = String(c.codigo || '').padStart(6, '0');

        let match =
            nome.includes(q) ||
            (qDigits && cpf.includes(qDigits)) ||
            (qDigits && telefone.includes(qDigits)) ||
            (qDigits && codigo.includes(qDigits));

        let placaMatch = null;

        (c.servicos || []).forEach(s => {
            const placa = normalize(s.placa).replace(/[\s-]/g, '');

            if (
                placa.includes(normalizedPlateQuery) &&
                q.length >= 2
            ) {
                placaMatch = s.placa;
            }
        });

        if (match || placaMatch) {
            results.push({
                cliente: c,
                placaMatch,
                servicos: c.servicos
            });
        }
    });

    return results.slice(0, 8);
}

export async function searchDropdownHtml() {
    if (!state.SEARCH_QUERY) {
        return '<div id="searchDropdownHost"></div>';
    }

    const results = await searchResults();

    let inner = '';

    if (results.length === 0) {
        inner =
            '<div class="search-empty">Nenhum cliente encontrado para "' +
            escapeHtml(state.SEARCH_QUERY) +
            '".</div>';
    } else {
        inner = results.map(r => `
            <div
                class="sres"
                onclick="go('clienteDetalhe',{id:'${r.cliente.id}'})">

                <div>
                    <b>${escapeHtml(r.cliente.nome)}</b>

                    <div class="meta">
                        Código ${r.cliente.codigo ? String(r.cliente.codigo).padStart(6, '0') : '—'} ·
                        CPF ${escapeHtml(r.cliente.cpf || '—')}
                        · Tel ${escapeHtml(r.cliente.telefone || '—')}
                        ${r.placaMatch
                            ? ' · Placa ' + escapeHtml(r.placaMatch.toUpperCase())
                            : ''}
                    </div>
                </div>

                <span class="badge badge-gray">
                    ${r.servicos.length}
                    serviço${r.servicos.length === 1 ? '' : 's'}
                </span>

            </div>
        `).join('');
    }

    return `
        <div id="searchDropdownHost" class="search-dropdown">
            ${inner}
        </div>
    `;
}

export async function onSearchInput(value) {
    state.SEARCH_QUERY = value;
    const requestId = ++searchRequestId;

    const dropdown = document.getElementById('searchDropdownHost');

    if (dropdown) {
        const html = await searchDropdownHtml();

        if (requestId !== searchRequestId || value !== state.SEARCH_QUERY) {
            return;
        }

        dropdown.outerHTML = html;
    }
}

export async function submitSearch() {
    const results = await searchResults();

    if (results.length === 1) {
        go('clienteDetalhe', {
            id: results[0].cliente.id
        });
    }
}
