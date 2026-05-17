import { el } from '../utils/dom.js';
import {
  getState,
  addMenu,
  updateMenu,
  deleteMenu,
  setMenuDefault,
} from '../store.js';
import { openModal } from '../utils/modal.js';
import { rerender } from '../main.js';

export function renderCatalogMenus() {
  const state = getState();
  const wrap = el('div');
  wrap.appendChild(
    el('div', { class: 'subhead' }, [
      el('a', { href: '#/catalog', class: 'back-btn' }, '←'),
      el('div', { class: 'subhead-title' }, 'Menus'),
      el(
        'button',
        { class: 'btn btn-primary', onClick: () => editMenu(null) },
        '+ Ajouter'
      ),
    ])
  );

  if (state.catalog.menus.length === 0) {
    wrap.appendChild(
      el('div', { class: 'empty' }, [
        el('div', { class: 'empty-title' }, 'Aucun menu'),
        el('div', {}, 'Crée un menu pour pouvoir saisir des réservations.'),
      ])
    );
    return wrap;
  }

  const list = el('div', { class: 'list' });
  for (const m of state.catalog.menus) {
    list.appendChild(
      el(
        'div',
        { class: 'list-item', onClick: () => editMenu(m.id) },
        [
          el('div', { class: 'list-item-main' }, [
            el('div', { class: 'list-item-title' }, [
              m.nom,
              ' ',
              m.est_defaut
                ? el('span', { class: 'badge badge-default' }, 'défaut')
                : null,
            ]),
            el(
              'div',
              { class: 'list-item-sub' },
              `${m.plats.length} plat${m.plats.length > 1 ? 's' : ''}`
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

function editMenu(id) {
  const state = getState();
  const isNew = id == null;
  const existing = isNew ? null : state.catalog.menus.find((m) => m.id === id);
  let nom = existing?.nom || '';
  let platIds = [...(existing?.plats || [])];
  let isDefault =
    existing?.est_defaut || (isNew && state.catalog.menus.length === 0);

  const body = el('div');

  const nomInput = el('input', { type: 'text', value: nom });
  nomInput.addEventListener('input', () => (nom = nomInput.value));
  body.appendChild(
    el('div', { class: 'field' }, [
      el('label', { class: 'field-label' }, 'Nom du menu'),
      nomInput,
    ])
  );

  const toggle = el(
    'div',
    { class: 'chip' + (isDefault ? ' chip-active' : '') },
    isDefault ? '✓ Menu par défaut' : 'Définir par défaut'
  );
  toggle.addEventListener('click', () => {
    isDefault = !isDefault;
    toggle.className = 'chip' + (isDefault ? ' chip-active' : '');
    toggle.textContent = isDefault
      ? '✓ Menu par défaut'
      : 'Définir par défaut';
  });
  body.appendChild(
    el('div', { class: 'field' }, [
      el('label', { class: 'field-label' }, 'Statut'),
      toggle,
      el(
        'div',
        { style: { fontSize: '12px', color: 'var(--text-faint)', marginTop: '6px' } },
        'Le menu par défaut est utilisé pour les réservations « Inconnu ».'
      ),
    ])
  );

  // Plats picker
  const platsWrap = el('div', { class: 'chips' });
  const sortedPlats = [...state.catalog.plats].sort((a, b) =>
    a.nom.localeCompare(b.nom)
  );
  for (const p of sortedPlats) {
    const selected = platIds.includes(p.id);
    const chip = el(
      'div',
      { class: 'chip' + (selected ? ' chip-active' : '') },
      p.nom
    );
    chip.addEventListener('click', () => {
      const idx = platIds.indexOf(p.id);
      if (idx >= 0) platIds.splice(idx, 1);
      else platIds.push(p.id);
      chip.className =
        'chip' + (platIds.includes(p.id) ? ' chip-active' : '');
    });
    platsWrap.appendChild(chip);
  }
  body.appendChild(
    el('div', { class: 'field' }, [
      el('label', { class: 'field-label' }, 'Plats du menu'),
      sortedPlats.length === 0
        ? el(
            'div',
            { style: { color: 'var(--text-faint)', fontSize: '14px' } },
            'Aucun plat disponible. Crée d\'abord des plats.'
          )
        : platsWrap,
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
              const menu = state.catalog.menus.find((m) => m.id === id);
              if (!menu) return;
              let fallback = null;
              if (menu.est_defaut) {
                const others = state.catalog.menus.filter(
                  (m) => m.id !== id
                );
                if (others.length === 0) {
                  if (
                    !confirm(
                      "C'est le seul menu (et le défaut). Le supprimer empêchera la saisie de réservations « Inconnu ». Continuer ?"
                    )
                  )
                    return;
                } else {
                  const names = others.map((m) => m.nom).join(' / ');
                  const pick = prompt(
                    `Choisis le nouveau menu par défaut parmi : ${names}`,
                    others[0].nom
                  );
                  if (pick == null) return;
                  fallback =
                    others.find((m) => m.nom === pick)?.id || others[0].id;
                }
              }
              const hadResas = state.session.reservations.some(
                (r) => r.menu_id === id
              );
              if (
                hadResas &&
                !confirm(
                  'Des réservations utilisent ce menu. Elles seront marquées « Inconnu ». Continuer ?'
                )
              )
                return;
              deleteMenu(id, fallback);
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
              alert('Donne un nom au menu.');
              return;
            }
            if (isNew) {
              const m = addMenu(nom.trim());
              updateMenu(m.id, { plats: platIds });
              if (isDefault) setMenuDefault(m.id);
            } else {
              updateMenu(id, { nom: nom.trim(), plats: platIds });
              if (isDefault) setMenuDefault(id);
              else if (existing.est_defaut) {
                const others = state.catalog.menus.filter(
                  (m) => m.id !== id && m.est_defaut
                );
                if (others.length === 0) {
                  alert(
                    'Au moins un menu doit être défaut. Définis-en un autre comme défaut d\'abord.'
                  );
                  setMenuDefault(id);
                }
              }
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
    title: isNew ? 'Nouveau menu' : 'Modifier le menu',
    body,
  });
}
