export function closeModal(id) {
    const el = document.getElementById(id);

    if (el) {
        el.remove();
    }
}