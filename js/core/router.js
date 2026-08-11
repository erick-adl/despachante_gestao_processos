import { state } from './state.js';

let renderFunction = null;

export function setRenderFunction(fn) {
    renderFunction = fn;
}

export function go(name, params) {
    state.VIEW = {
        name,
        params: params || {}
    };

    state.SEARCH_QUERY = "";

    // Essa variável ainda pertence ao app.js.
    // Vamos removê-la em uma etapa posterior.
    window.resetClientesListQuery?.();

    if (renderFunction) {
        renderFunction();
    }

    window.scrollTo(0, 0);
}

export function updateNavActive() {
    document
        .querySelectorAll('.nav-item[data-view]')
        .forEach(function (btn) {

            const name = btn.getAttribute('data-view');

            const active =
                state.VIEW.name === name ||
                (
                    state.VIEW.name === 'clienteDetalhe' &&
                    name === 'clientes'
                );

            btn.classList.toggle('active', active);
        });
}