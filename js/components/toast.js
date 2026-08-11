import { icon } from '../core/icons.js';
import { escapeHtml } from '../core/utils.js';

let toastTimer = null;

export function showToast(msg, isError = false) {
    let t = document.getElementById('toast');

    if (t) {
        t.remove();
    }

    t = document.createElement('div');

    t.id = 'toast';
    t.className = 'toast';

    t.style.color = isError
        ? '#FFD9D5'
        : 'var(--text-inverse)';

    t.innerHTML =
        icon(isError ? 'x' : 'check') +
        '<span>' +
        escapeHtml(msg) +
        '</span>';

    document.body.appendChild(t);

    clearTimeout(toastTimer);

    toastTimer = setTimeout(() => {
        t.remove();
    }, 2600);
}