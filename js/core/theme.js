import clientConfig from '../../config/client.js';

export function applyTheme() {
    const theme = clientConfig.theme || {};

    const root = document.documentElement;

    if (theme.primary) {
        root.style.setProperty('--orange', theme.primary);
    }

    if (theme.primaryDeep) {
        root.style.setProperty('--orange-deep', theme.primaryDeep);
    }

    if (theme.primaryGhost) {
        root.style.setProperty('--orange-ghost', theme.primaryGhost);
    }

    if (clientConfig.logo) {
        document.querySelectorAll('.brand-logo').forEach(img => {
            img.src = clientConfig.logo;
        });
    }
}