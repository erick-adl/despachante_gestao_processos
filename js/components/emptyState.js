import { icon } from '../core/icons.js';

export function emptyState(iconName, title, sub) {
    return `
        <div class="empty-state">
            ${icon(iconName)}
            <b>${title}</b>
            <div>${sub}</div>
        </div>
    `;
}