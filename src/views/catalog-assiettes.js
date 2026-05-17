import { el } from '../utils/dom.js';
import {
  getState,
  addAssiette,
  updateAssiette,
  deleteAssiette,
} from '../store.js';
import { openModal } from '../utils/modal.js';
import { fileToCompressedDataURL } from '../utils/photo.js';
import { rerender } from '../main.js';
import { iconPlate } from '../utils/icons.js';

export function renderCatalogAssiettes() {
  const state = getState();
  const wrap = el('div');
  wrap.appendChild(
    el('div', { class: 'subhead' }, [
      el('a', { href: '#/catalog', class: 'back-btn' }, '←'),
      el('div', { class: 'subhead-title' }, 'Assiettes'),
      el(
        'button',
        { class: 'btn btn-primary', onClick: () => editAssiette(null) },
        '+ Ajouter'
      ),
    ])
  );

  if (state.catalog.assiettes.length === 0) {
    wrap.appendChild(
      el('div', { class: 'empty' }, [
        el('div', { class: 'empty-title' }, 'Aucune assiette'),
        el('div', {}, 'Ajoute ta première assiette en haut à droite.'),
      ])
    );
    return wrap;
  }

  const list = el('div', { class: 'list' });
  const sorted = [...state.catalog.assiettes].sort((a, b) =>
    a.nom.localeCompare(b.nom)
  );
  for (const a of sorted) {
    list.appendChild(
      el(
        'div',
        { class: 'list-item', onClick: () => editAssiette(a.id) },
        [
          el(
            'div',
            {
              class: 'plate-thumb',
              style: a.photo ? { backgroundImage: `url(${a.photo})` } : {},
            },
            a.photo ? null : iconPlate(22)
          ),
          el('div', { class: 'list-item-main' }, [
            el('div', { class: 'list-item-title' }, a.nom),
            el(
              'div',
              { class: 'list-item-sub' },
              `Marge +${a.marge_pourcentage}%` +
                (a.stock_total != null ? ` · stock ${a.stock_total}` : '')
            ),
          ]),
          el('div', { style: { color: 'var(--text-faint)', fontSize: '20px' } }, '›'),
        ]
      )
    );
  }
  wrap.appendChild(list);
  return wrap;
}

function editAssiette(id) {
  const state = getState();
  const isNew = id == null;
  const existing = isNew
    ? null
    : state.catalog.assiettes.find((a) => a.id === id);
  let nom = existing?.nom || '';
  let marge = existing?.marge_pourcentage ?? 10;
  let photo = existing?.photo || null;
  let stock = existing?.stock_total ?? '';

  const body = el('div');

  const nomInput = el('input', { type: 'text', value: nom });
  nomInput.addEventListener('input', () => (nom = nomInput.value));
  body.appendChild(
    el('div', { class: 'field' }, [
      el('label', { class: 'field-label' }, 'Nom'),
      nomInput,
    ])
  );

  // Marge
  const margeInput = el('input', {
    type: 'number',
    min: '0',
    max: '100',
    value: String(marge),
    inputmode: 'numeric',
  });
  margeInput.addEventListener('input', () => {
    const v = parseInt(margeInput.value, 10);
    marge = isNaN(v) || v < 0 ? 0 : v;
  });
  const margeStepper = el('div', { class: 'stepper' }, [
    el(
      'button',
      {
        type: 'button',
        onClick: () => {
          marge = Math.max(0, marge - 5);
          margeInput.value = String(marge);
        },
      },
      '−'
    ),
    margeInput,
    el(
      'button',
      {
        type: 'button',
        onClick: () => {
          marge += 5;
          margeInput.value = String(marge);
        },
      },
      '+'
    ),
  ]);
  const presets = el('div', { class: 'chips', style: { marginTop: '8px' } });
  for (const v of [0, 5, 10, 15, 20]) {
    presets.appendChild(
      el(
        'div',
        {
          class: 'chip',
          onClick: () => {
            marge = v;
            margeInput.value = String(v);
          },
        },
        `${v} %`
      )
    );
  }
  body.appendChild(
    el('div', { class: 'field' }, [
      el('label', { class: 'field-label' }, 'Marge de sécurité (%)'),
      el('div', {}, [margeStepper, presets]),
    ])
  );

  // Stock total
  const stockInput = el('input', {
    type: 'number',
    min: '0',
    value: stock === '' ? '' : String(stock),
    placeholder: 'illimité',
    inputmode: 'numeric',
  });
  stockInput.addEventListener('input', () => {
    const raw = stockInput.value.trim();
    if (raw === '') stock = '';
    else {
      const v = parseInt(raw, 10);
      stock = isNaN(v) || v < 0 ? '' : v;
    }
  });
  body.appendChild(
    el('div', { class: 'field' }, [
      el('label', { class: 'field-label' }, 'Stock total (laisser vide si illimité)'),
      stockInput,
      el(
        'div',
        { style: { fontSize: '12px', color: 'var(--text-faint)', marginTop: '6px' } },
        'Nombre d\'exemplaires disponibles à la maison. Sert à calculer les recharges pendant le service.'
      ),
    ])
  );

  // Photo
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
  body.appendChild(
    el('div', { class: 'field' }, [
      el('label', { class: 'field-label' }, 'Photo (optionnelle)'),
      photoPreview,
    ])
  );

  const actions = el(
    'div',
    { class: 'modal-actions' },
    [
      !isNew &&
        el(
          'button',
          {
            class: 'btn btn-danger',
            onClick: () => {
              if (!confirm(`Supprimer l'assiette « ${existing.nom} » ?`))
                return;
              const r = deleteAssiette(id);
              if (!r.ok) {
                alert(
                  'Assiette utilisée par : ' +
                    r.plats.map((p) => p.nom).join(', ') +
                    '. Modifie ces plats d\'abord.'
                );
                return;
              }
              modal.close();
              rerender();
            },
          },
          'Supprimer'
        ),
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
            if (!nom.trim()) {
              alert('Donne un nom à l\'assiette.');
              return;
            }
            const stockVal = stock === '' ? null : stock;
            if (isNew) {
              const created = addAssiette(nom.trim(), marge, photo);
              updateAssiette(created.id, { stock_total: stockVal });
            } else {
              updateAssiette(id, {
                nom: nom.trim(),
                marge_pourcentage: marge,
                photo,
                stock_total: stockVal,
              });
            }
            modal.close();
            rerender();
          },
        },
        'Enregistrer'
      ),
    ].filter(Boolean)
  );
  body.appendChild(actions);

  const modal = openModal({
    title: isNew ? 'Nouvelle assiette' : 'Modifier l\'assiette',
    body,
  });
}
