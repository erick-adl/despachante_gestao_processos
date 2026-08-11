import { icon } from '../core/icons.js';
import { escapeHtml } from '../core/utils.js';

export function showConfirm(message, onConfirm) {

    const overlay = document.createElement('div');

    overlay.className = 'form-overlay';
    overlay.id = 'confirmOverlay';
    overlay.style.zIndex = 300;

    overlay.innerHTML = `
    <div class="form-modal" style="max-width:400px;">
      <div class="form-modal-head">
        <h3>Confirmar ação</h3>

        <button
          class="icon-btn"
          onclick="closeModal('confirmOverlay')">
          ${icon('x')}
        </button>
      </div>

      <div class="form-modal-body">
        <p style="font-size:13.5px;color:var(--text);margin:0;line-height:1.5;">
          ${escapeHtml(message)}
        </p>
      </div>

      <div class="form-modal-foot">
        <button
          class="btn btn-ghost"
          onclick="closeModal('confirmOverlay')">
          Cancelar
        </button>

        <button
          class="btn btn-primary"
          id="confirmOkBtn">
          Confirmar
        </button>
      </div>
    </div>
  `;

    document.body.appendChild(overlay);

    document.getElementById('confirmOkBtn').onclick = function () {

        closeModal('confirmOverlay');

        onConfirm();

    };
}