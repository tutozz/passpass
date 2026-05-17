import { el } from './dom.js';

export function openModal({ title, body, onClose }) {
  const back = el('div', { class: 'modal-back' });
  const modal = el('div', { class: 'modal' });
  if (title) modal.appendChild(el('h2', { class: 'modal-title' }, title));
  modal.appendChild(body);
  back.appendChild(modal);
  back.addEventListener('click', (e) => {
    if (e.target === back) close();
  });
  function close() {
    back.remove();
    if (onClose) onClose();
  }
  document.body.appendChild(back);
  document.body.style.overflow = 'hidden';
  return {
    close: () => {
      document.body.style.overflow = '';
      close();
    },
  };
}
