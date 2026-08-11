import { state } from '../core/state.js';
import { normalize, onlyDigits, escapeHtml } from '../core/utils.js';
import { go } from '../core/router.js';
import { icon } from '../core/icons.js';
import { getServices } from '../core/firestore.js';


export async function searchResults() {
    const q = normalize(state.SEARCH_QUERY);

    if (!q) return [];

    const results = [];
    const qDigits = onlyDigits(state.SEARCH_QUERY);

    for (const c of state.DATA.clientes) {
        const nome = normalize(c.nome);
        const cpf = onlyDigits(c.cpf);
        const telefone = onlyDigits(c.telefone);

        let match =
            nome.includes(q) ||
            (qDigits && cpf.includes(qDigits)) ||
            (qDigits && telefone.includes(qDigits));

        let placaMatch = null;

        const servicos = await getServices(c.id);

        for (const s of servicos) {
            if (
                normalize(s.placa)
                    .replace(/-/g, '')
                    .includes(q.replace(/-/g, '')) &&
                q.length >= 2
            ) {
                placaMatch = s.placa;
                break;
            }
        }

        if (match || placaMatch) {
            results.push({
                cliente: c,
                placaMatch,
                servicos
            });
        }
    }

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

    const dropdown = document.getElementById('searchDropdownHost');

    if (dropdown) {
        dropdown.outerHTML = await searchDropdownHtml();
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