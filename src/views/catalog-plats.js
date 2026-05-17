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
    compsWrap.appendChild(
      el('div', { style: { fontSize: '12px', color: 'var(--text-faint)', marginBottom: '6px' } }, 'Assiette · qté · pass')
    );
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
      const row = el('div', { class: 'compo-row' });
      const aSel = el('select');
      aSel.appendChild(el('option', { value: '' }, '—'));
      for (const a of sortedAssiettes) {
        const opt = el('option', { value: a.id }, a.nom);
        if (c.assiette_id === a.id) opt.selected = true;
        aSel.appendChild(opt);
      }
      aSel.addEventListener('change', () => (c.assiette_id = aSel.value));
      const qInput = el('input', {
        type: 'number',
        min: '1',
        max: '5',
        value: String(c.quantite),
        inputmode: 'numeric',
      });
      qInput.addEventListener('input', () => {
        const v = parseInt(qInput.value, 10);
        c.quantite = isNaN(v) || v < 1 ? 1 : Math.min(5, v);
      });
      const pSel = el('select');
      pSel.appendChild(el('option', { value: '' }, '—'));
      for (const p of sortedPasses) {
        const opt = el('option', { value: p.id }, p.nom);
        if (c.pass_id === p.id) opt.selected = true;
        pSel.appendChild(opt);
      }
      pSel.addEventListener('change', () => (c.pass_id = pSel.value));
      const del = el(
        'button',
        {
          class: 'btn btn-ghost btn-icon btn-danger',
          'aria-label': 'Retirer',
          onClick: () => {
            comps.splice(idx, 1);
            renderComps();
          },
        },
        '×'
      );
      row.appendChild(aSel);
      row.appendChild(qInput);
      row.appendChild(pSel);
      row.appendChild(del);
      compsWrap.appendChild(row);
    });
    const addBtn = el(
      'button',
      {
        class: 'btn btn-block',
        style: { marginTop: '12px' },
        onClick: () => {
          comps.push({
            assiette_id: state.catalog.assiettes[0]?.id || '',
            quantite: 1,
            pass_id: state.catalog.passes[0]?.id || '',
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
            const cleanComps = comps.filter(
              (c) => c.assiette_id && c.pass_id && c.quantite > 0
            );
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
