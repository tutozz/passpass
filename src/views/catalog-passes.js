import { el } from '../utils/dom.js';
import { getState, updatePass } from '../store.js';
import { openModal } from '../utils/modal.js';
import { fileToCompressedDataURL } from '../utils/photo.js';
import { rerender } from '../main.js';

export function renderCatalogPasses() {
  const state = getState();
  const wrap = el('div');
  wrap.appendChild(
    el('div', { class: 'subhead' }, [
      el('a', { href: '#/catalog', class: 'back-btn' }, '←'),
      el('div', { class: 'subhead-title' }, 'Pass'),
    ])
  );

  wrap.appendChild(
    el('p', { class: 'page-sub', style: { marginTop: '0' } }, 'Nomme tes 5 pass et ajoute une photo.')
  );

  const list = el('div', { class: 'list' });
  for (const p of [...state.catalog.passes].sort((a, b) => a.ordre - b.ordre)) {
    list.appendChild(
      el(
        'div',
        { class: 'list-item', onClick: () => editPass(p.id) },
        [
          el(
            'div',
            {
              class: 'plate-thumb',
              style: p.photo ? { backgroundImage: `url(${p.photo})` } : {},
            },
            p.photo ? null : '📷'
          ),
          el('div', { class: 'list-item-main' }, [
            el('div', { class: 'list-item-title' }, p.nom),
            el('div', { class: 'list-item-sub' }, `Position ${p.ordre + 1}`),
          ]),
          el('div', { style: { color: 'var(--text-faint)', fontSize: '20px' } }, '›'),
        ]
      )
    );
  }
  wrap.appendChild(list);
  return wrap;
}

function editPass(id) {
  const state = getState();
  const pass = state.catalog.passes.find((p) => p.id === id);
  if (!pass) return;
  let nom = pass.nom;
  let photo = pass.photo;

  const body = el('div');

  const nomInput = el('input', { type: 'text', value: nom });
  nomInput.addEventListener('input', () => (nom = nomInput.value));
  body.appendChild(
    el('div', { class: 'field' }, [
      el('label', { class: 'field-label' }, 'Nom'),
      nomInput,
    ])
  );

  const photoPreview = el(
    'div',
    {
      class: 'photo-upload',
      style: photo ? { backgroundImage: `url(${photo})` } : {},
    },
    photo ? '' : '+ Photo'
  );
  const file = el('input', {
    type: 'file',
    accept: 'image/*',
    capture: 'environment',
  });
  file.addEventListener('change', async () => {
    const f = file.files[0];
    if (!f) return;
    photo = await fileToCompressedDataURL(f);
    photoPreview.style.backgroundImage = `url(${photo})`;
    photoPreview.textContent = '';
    photoPreview.appendChild(file);
  });
  photoPreview.appendChild(file);

  const photoActions = el('div', { style: { display: 'flex', gap: '8px', alignItems: 'center' } }, [
    photoPreview,
    photo
      ? el(
          'button',
          {
            class: 'btn btn-ghost btn-danger',
            onClick: () => {
              photo = null;
              photoPreview.style.backgroundImage = '';
              photoPreview.textContent = '+ Photo';
              photoPreview.appendChild(file);
            },
          },
          'Retirer'
        )
      : null,
  ]);
  body.appendChild(
    el('div', { class: 'field' }, [
      el('label', { class: 'field-label' }, 'Photo'),
      photoActions,
    ])
  );

  const actions = el('div', { class: 'modal-actions' }, [
    el(
      'button',
      { class: 'btn', onClick: () => modal.close() },
      'Annuler'
    ),
    el(
      'button',
      {
        class: 'btn btn-primary',
        onClick: () => {
          updatePass(id, { nom: nom.trim() || pass.nom, photo });
          modal.close();
          rerender();
        },
      },
      'Enregistrer'
    ),
  ]);
  body.appendChild(actions);

  const modal = openModal({ title: 'Modifier la pass', body });
}
