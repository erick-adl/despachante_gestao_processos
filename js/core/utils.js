export function uid() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

export function fmtMoney(n) {
    n = Number(n) || 0;
    return n.toLocaleString('pt-BR', {
        style: 'currency',
        currency: 'BRL'
    });
}

export function fmtDateLong(d) {
    const dt = new Date(d + 'T12:00:00');

    let s = dt.toLocaleDateString('pt-BR', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric'
    });

    return s.charAt(0).toUpperCase() + s.slice(1);
}

export function fmtDateShort(d) {
    const dt = new Date(d + 'T12:00:00');

    return dt.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    });
}

export function fmtDateHuman(d) {
    const dt = new Date(d + 'T12:00:00');

    return dt.toLocaleDateString('pt-BR', {
        weekday: 'short',
        day: '2-digit',
        month: 'short'
    }).replace('.', '');
}

export function todayISO() {
    const d = new Date();

    return d.getFullYear() +
        '-' +
        String(d.getMonth() + 1).padStart(2, '0') +
        '-' +
        String(d.getDate()).padStart(2, '0');
}

export function normalize(s) {
    return (s || '')
        .toString()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .trim();
}

export function onlyDigits(s) {
    return (s || '').replace(/\D/g, '');
}

export function maskCPF(v) {
    v = onlyDigits(v).slice(0, 11);

    v = v
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d{1,2})$/, '$1-$2');

    return v;
}

export function maskPhone(v) {
    v = onlyDigits(v).slice(0, 11);

    if (v.length > 10) {
        return v.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
    }

    return v
        .replace(/(\d{2})(\d{4})(\d{0,4})/, '($1) $2-$3')
        .replace(/-$/, '');
}

export function escapeHtml(s) {
    return (s || '')
        .toString()
        .replace(
            /[&<>"']/g,
            c => ({
                '&': '&amp;',
                '<': '&lt;',
                '>': '&gt;',
                '"': '&quot;',
                "'": '&#39;'
            }[c])
        );
}

export function weekRangeISO(baseISO) {
    const d = new Date(baseISO + 'T12:00:00');
    const day = d.getDay();

    const monday = new Date(d);
    monday.setDate(d.getDate() - ((day + 6) % 7));

    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);

    const f = x =>
        x.getFullYear() +
        '-' +
        String(x.getMonth() + 1).padStart(2, '0') +
        '-' +
        String(x.getDate()).padStart(2, '0');

    return {
        start: f(monday),
        end: f(sunday)
    };
}

export function monthRangeISO(baseISO) {
    const d = new Date(baseISO + 'T12:00:00');

    const first = new Date(
        d.getFullYear(),
        d.getMonth(),
        1
    );

    const last = new Date(
        d.getFullYear(),
        d.getMonth() + 1,
        0
    );

    const f = x =>
        x.getFullYear() +
        '-' +
        String(x.getMonth() + 1).padStart(2, '0') +
        '-' +
        String(x.getDate()).padStart(2, '0');

    return {
        start: f(first),
        end: f(last)
    };
}

export function renderPlateChip(placa) {
    placa = (placa || '').toUpperCase().trim();

    if (!placa) {
        return `
            <span class="plate empty">
                <span class="flag"></span>
                <span class="num">SEM PLACA</span>
            </span>
        `;
    }

    return `
        <span class="plate">
            <span class="flag"></span>
            <span class="num">${escapeHtml(placa)}</span>
        </span>
    `;
}