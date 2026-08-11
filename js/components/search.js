import { state } from '../core/state.js';
import { normalize, onlyDigits, escapeHtml } from '../core/utils.js';
import { go } from '../core/router.js';
import { icon } from '../core/icons.js';

export function searchResults() {
    const q = normalize(state.SEARCH_QUERY);

    if (!q) return [];

    const results = [];

    state.DATA.clientes.forEach(c => {
        const nome = normalize(c.nome);
        const cpf = onlyDigits(c.cpf);
        const telefone = onlyDigits(c.telefone);
        const qDigits = onlyDigits(state.SEARCH_QUERY);

        let match =
            nome.includes(q) ||
            (qDigits && cpf.includes(qDigits)) ||
            (qDigits && telefone.includes(qDigits));

        let placaMatch = null;

        (c.servicos || []).forEach(s => {
            if (
                normalize(s.placa)
                    .replace(/-/g, '')
                    .includes(q.replace(/-/g, '')) &&
                q.length >= 2
            ) {
                placaMatch = s.placa;
            }
        });

        if (match || placaMatch) {
            results.push({
                cliente: c,
                placaMatch
            });
        }
    });

    return results.slice(0, 8);
}

export function searchDropdownHtml() {
    if (!state.SEARCH_QUERY) {
        return '<div id="searchDropdownHost"></div>';
    }

    const results = searchResults();

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
                    ${(r.cliente.servicos || []).length}
                    serviço${(r.cliente.servicos || []).length === 1 ? '' : 's'}
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

export function onSearchInput(value) {
    state.SEARCH_QUERY = value;

    const dropdown = document.getElementById('searchDropdownHost');

    if (dropdown) {
        dropdown.outerHTML = searchDropdownHtml();
    }
}

export function submitSearch() {
    const results = searchResults();

    if (results.length === 1) {
        go('clienteDetalhe', {
            id: results[0].cliente.id
        });
    }
}