import { el } from '../utils/dom.js';
import { getState, addPlat, updatePlat, deletePlat } from '../store.js';
import { openModal } from '../utils/modal.js';
import { rerender } from '../main.js';

export function renderCatalogPlats() {
  const state = getState();
  const wrap = el('div');
  wrap.appendChild(
    el('div', { class: 'subhead' }, [
      el('a', { href: '#/catalog', class: 'back-btn' }, '←'),
      el('div', { class: 'subhead-title' }, 'Plats'),
      el(
        'button',
        {
          class: 'btn btn-primary',
          onClick: () => {
            if (state.catalog.assiettes.length === 0) {
              alert('Crée d\'abord des assiettes.');
              return;
            }
            editPlat(null);
          },
        },
        '+ Ajouter'
      ),
    ])
  );

  if (state.catalog.plats.length === 0) {
    wrap.appendChild(
      el('div', { class: 'empty' }, [
        el('div', { class: 'empty-title' }, 'Aucun plat'),
        el('div', {}, 'Ajoute ton premier plat composé d\'assiettes.'),
      ])
    );
    return wrap;
  }

  const list = el('div', { class: 'list' });
  const sorted = [...state.catalog.plats].sort((a, b) =>
    a.nom.localeCompare(b.nom)
  );
  for (const p of sorted) {
    list.appendChild(
      el(
        'div',
        { class: 'list-item', onClick: () => editPlat(p.id) },
        [
          el('div', { class: 'list-item-main' }, [
            el('div', { class: 'list-item-title' }, p.nom),
            el(
              'div',
              { class: 'list-item-sub' },
              `${p.compositions.length} assiette${p.compositions.length > 1 ? 's' : ''}`
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

function editPlat(id) {
  const state = getState();
  const isNew = id == null;
  const existing = isNew ? null : state.catalog.plats.find((p) => p.id === id);
  let nom = existing?.nom || '';
  let comps = JSON.parse(JSON.stringify(existing?.compositions || []));
  comps.forEach((c) => {
    if (!c.couverts_par_unite) c.couverts_par_unite = 1;
  });

  const body = el('div');

  const nomInput = el('input', { type: 'text', value: nom });
  nomInput.addEventListener('input', () => (nom = nomInput.value));
  body.appendChild(
    el('div', { class: 'field' }, [
      el('label', { class: 'field-label' }, 'Nom du plat'),
      nomInput,
    ])
  );

  const compsWrap = el('div');

  function renderComps() {
    compsWrap.innerHTML = '';
    if (comps.length === 0) {
      compsWrap.appendChild(
        el(
          'div',
          { style: { color: 'var(--text-faint)', fontSize: '14px', padding: '8px 0' } },
          'Aucune assiette dans ce plat.'
        )
      );
    }
    const sortedAssiettes = [...state.catalog.assiettes].sort((a, b) =>
      a.nom.localeCompare(b.nom)
    );
    const sortedPasses = [...state.catalog.passes].sort(
      (a, b) => a.ordre - b.ordre
    );

    comps.forEach((c, idx) => {
      const card = el('div', { class: 'compo-card' });

      // Row 1: Assiette + delete
      const aSel = el('select', { class: 'compo-select' });
      aSel.appendChild(el('option', { value: '' }, '— Choisir une assiette —'));
      for (const a of sortedAssiettes) {
        const opt = el('option', { value: a.id }, a.nom);
        if (c.assiette_id === a.id) opt.selected = true;
        aSel.appendChild(opt);
      }
      aSel.addEventListener('change', () => (c.assiette_id = aSel.value));
      const delBtn = el(
        'button',
        {
          class: 'btn btn-ghost btn-icon btn-danger',
          'aria-label': 'Retirer cette assiette',
          onClick: () => {
            comps.splice(idx, 1);
            renderComps();
          },
        },
        '×'
      );
      card.appendChild(el('div', { class: 'compo-card-row' }, [aSel, delBtn]));

      // Row 2: Quantité
      const qInput = miniNumber(c.quantite, 1, 5, (v) => (c.quantite = v));
      card.appendChild(
        el('div', { class: 'compo-card-line' }, [
          el('span', { class: 'compo-lbl' }, 'Quantité par unité'),
          qInput,
        ])
      );

      // Row 3: Couverts par unité (partage)
      const cpuInput = miniNumber(c.couverts_par_unite, 1, 20, (v) => (c.couverts_par_unite = v));
      card.appendChild(
        el('div', { class: 'compo-card-line' }, [
          el('span', { class: 'compo-lbl' }, '1 unité pour'),
          cpuInput,
          el('span', { class: 'compo-lbl' }, 'couvert(s)'),
        ])
      );

      // Row 4: Pass
      const pSel = el('select', { class: 'compo-select' });
      pSel.appendChild(el('option', { value: '' }, '— Choisir une pass —'));
      for (const p of sortedPasses) {
        const opt = el('option', { value: p.id }, p.nom);
        if (c.pass_id === p.id) opt.selected = true;
        pSel.appendChild(opt);
      }
      pSel.addEventListener('change', () => (c.pass_id = pSel.value));
      card.appendChild(
        el('div', { class: 'compo-card-line' }, [
          el('span', { class: 'compo-lbl' }, 'Pass'),
          pSel,
        ])
      );

      compsWrap.appendChild(card);
    });

    const addBtn = el(
      'button',
      {
        class: 'btn btn-block',
        style: { marginTop: '8px' },
        onClick: () => {
          comps.push({
            assiette_id: state.catalog.assiettes[0]?.id || '',
            quantite: 1,
            pass_id: state.catalog.passes[0]?.id || '',
            couverts_par_unite: 1,
          });
          renderComps();
        },
      },
      '+ Ajouter une assiette'
    );
    compsWrap.appendChild(addBtn);
  }
  renderComps();

  body.appendChild(
    el('div', { class: 'field' }, [
      el('label', { class: 'field-label' }, 'Composition'),
      el(
        'div',
        { style: { fontSize: '12px', color: 'var(--text-faint)', marginBottom: '8px' } },
        'Astuce : « 1 unité pour 4 couverts » = un seul plat partagé entre 4 personnes (centre de table). Pour 5 couverts il en faudra 2.'
      ),
      compsWrap,
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
              if (!confirm(`Supprimer le plat « ${existing.nom} » ?`)) return;
              const r = deletePlat(id);
              if (!r.ok) {
                alert(
                  'Plat utilisé par : ' +
                    r.menus.map((m) => m.nom).join(', ') +
                    '. Modifie ces menus d\'abord.'
                );
                return;
              }
              modal.close();
              rerender();
            },
          },
          'Supprimer'
        ),
      el('button', { class: 'btn', onClick: () => modal.close() }, 'Annuler'),
      el(
        'button',
        {
          class: 'btn btn-primary',
          onClick: () => {
            if (!nom.trim()) {
              alert('Donne un nom au plat.');
              return;
            }
            const cleanComps = comps
              .filter((c) => c.assiette_id && c.pass_id && c.quantite > 0)
              .map((c) => ({
                assiette_id: c.assiette_id,
                pass_id: c.pass_id,
                quantite: c.quantite,
                couverts_par_unite: Math.max(1, c.couverts_par_unite || 1),
              }));
            if (isNew) {
              const p = addPlat(nom.trim());
              updatePlat(p.id, { compositions: cleanComps });
            } else {
              updatePlat(id, { nom: nom.trim(), compositions: cleanComps });
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
    title: isNew ? 'Nouveau plat' : 'Modifier le plat',
    body,
  });
}

function miniNumber(value, min, max, onChange) {
  const wrap = el('div', { class: 'mini-stepper' });
  const input = el('input', {
    type: 'number',
    min: String(min),
    max: String(max),
    value: String(value),
    inputmode: 'numeric',
  });
  const update = (v) => {
    const clamped = Math.max(min, Math.min(max, v));
    input.value = String(clamped);
    onChange(clamped);
  };
  input.addEventListener('input', () => {
    const v = parseInt(input.value, 10);
    if (!isNaN(v)) onChange(Math.max(min, Math.min(max, v)));
  });
  wrap.appendChild(
    el(
      'button',
      {
        type: 'button',
        onClick: () => update(parseInt(input.value, 10) - 1),
      },
      '−'
    )
  );
  wrap.appendChild(input);
  wrap.appendChild(
    el(
      'button',
      {
        type: 'button',
        onClick: () => update(parseInt(input.value, 10) + 1),
      },
      '+'
    )
  );
  return wrap;
}
