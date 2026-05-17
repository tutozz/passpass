import { el } from '../utils/dom.js';
import {
  getState,
  addReservation,
  removeReservation,
  updateReservation,
  defaultMenu,
} from '../store.js';
import { haptic } from '../utils/haptic.js';
import { rerender } from '../main.js';
import { openModal } from '../utils/modal.js';

export function renderReservations() {
  const state = getState();
  const wrap = el('div');

  const menus = state.catalog.menus;
  const def = defaultMenu();

  let formCouverts = 2;
  const last = state.prefs.last_menu_id;
  let formMenu =
    last === null
      ? 'unknown'
      : last && menus.find((m) => m.id === last)
        ? last
        : def
          ? 'unknown'
          : menus[0]?.id || null;

  // Header — titre + bouton voir passes
  const totalCv = state.session.reservations.reduce((a, r) => a + r.couverts, 0);
  const totalRes = state.session.reservations.length;

  const headRow = el('div', { class: 'page-head-row' }, [
    el('div', { class: 'page-head' }, [
      el('h1', { class: 'page-title' }, 'Service en cours'),
      el('p', { class: 'page-sub' }, formatStart(state.session.started_at)),
    ]),
    totalRes > 0
      ? el(
          'a',
          {
            href: '#/passes',
            class: 'btn btn-primary head-cta',
          },
          ['Voir passes →']
        )
      : null,
  ]);
  wrap.appendChild(headRow);

  // Hero (clickable when resas)
  const hero = el(
    totalRes > 0 ? 'a' : 'div',
    {
      class: 'hero' + (totalRes > 0 ? ' hero-link' : ''),
      href: totalRes > 0 ? '#/passes' : null,
    },
    [
      el('div', {}, [
        el('div', { class: 'hero-label' }, 'Total couverts'),
        el(
          'div',
          { class: 'hero-sub' },
          `${totalRes} réservation${totalRes > 1 ? 's' : ''}`
        ),
      ]),
      el('div', { class: 'hero-num' }, String(totalCv)),
    ]
  );
  wrap.appendChild(hero);

  // Formulaire d'ajout
  const stepperInput = el('input', {
    type: 'number',
    min: '1',
    value: String(formCouverts),
    inputmode: 'numeric',
  });
  stepperInput.addEventListener('input', () => {
    const v = parseInt(stepperInput.value, 10);
    formCouverts = isNaN(v) || v < 1 ? 1 : v;
  });
  const stepper = el('div', { class: 'stepper' }, [
    el(
      'button',
      {
        type: 'button',
        onClick: () => {
          formCouverts = Math.max(1, formCouverts - 1);
          stepperInput.value = String(formCouverts);
        },
      },
      '−'
    ),
    stepperInput,
    el(
      'button',
      {
        type: 'button',
        onClick: () => {
          formCouverts += 1;
          stepperInput.value = String(formCouverts);
        },
      },
      '+'
    ),
  ]);

  const chipsWrap = el('div', { class: 'chips' });
  function renderChips() {
    chipsWrap.innerHTML = '';
    if (def) {
      const isActive = formMenu === 'unknown';
      const chip = el(
        'div',
        {
          class: 'chip' + (isActive ? ' chip-active' : ''),
          onClick: () => {
            formMenu = 'unknown';
            renderChips();
          },
        },
        ['Inconnu', el('span', { class: 'chip-sub' }, `→ ${def.nom}`)]
      );
      chipsWrap.appendChild(chip);
    }
    for (const m of menus) {
      const isActive = formMenu === m.id;
      const chip = el(
        'div',
        {
          class: 'chip' + (isActive ? ' chip-active' : ''),
          onClick: () => {
            formMenu = m.id;
            renderChips();
          },
        },
        [
          m.nom,
          m.est_defaut ? el('span', { class: 'chip-sub' }, 'défaut') : null,
        ]
      );
      chipsWrap.appendChild(chip);
    }
  }
  renderChips();

  const addBtn = el(
    'button',
    { class: 'btn btn-primary btn-block btn-large' },
    '+ Ajouter cette réservation'
  );
  addBtn.addEventListener('click', () => {
    if (menus.length === 0) {
      alert('Crée d\'abord un menu dans l\'onglet Modifier.');
      return;
    }
    if (!def && formMenu === 'unknown') {
      alert('Choisis un menu (pas de menu par défaut défini).');
      return;
    }
    const menuId = formMenu === 'unknown' ? null : formMenu;
    addReservation(formCouverts, menuId);
    haptic();
    rerender();
  });

  const formSection = el('div', { class: 'section' }, [
    el('h2', { class: 'section-title' }, 'Nouvelle réservation'),
    el('div', { class: 'field' }, [
      el('label', { class: 'field-label' }, 'Couverts'),
      stepper,
    ]),
    menus.length === 0
      ? el(
          'div',
          { class: 'alert alert-info' },
          'Aucun menu créé. Va dans l\'onglet Modifier pour configurer assiettes, plats et menus.'
        )
      : el('div', { class: 'field' }, [
          el('label', { class: 'field-label' }, 'Menu'),
          chipsWrap,
        ]),
    addBtn,
  ]);
  wrap.appendChild(formSection);

  // Liste
  wrap.appendChild(
    el('h2', { class: 'section-title' }, 'Réservations saisies')
  );
  if (state.session.reservations.length === 0) {
    wrap.appendChild(
      el('div', { class: 'empty' }, [
        el('div', { class: 'empty-title' }, 'Aucune réservation'),
        el('div', {}, 'Commence par en ajouter une ci-dessus.'),
      ])
    );
  } else {
    const list = el('div', { class: 'list' });
    for (const r of state.session.reservations) {
      const menu = r.menu_id ? menus.find((m) => m.id === r.menu_id) : null;
      const isUnknown = !r.menu_id;
      const displayMenu = menu
        ? menu.nom
        : def
          ? `Inconnu → ${def.nom}`
          : 'Inconnu (aucun défaut)';
      const row = el(
        'div',
        { class: 'resa-row', onClick: () => editResa(r.id) },
        [
          el('div', { class: 'resa-couverts' }, `${r.couverts} PAX`),
          el(
            'div',
            { class: 'resa-menu' + (isUnknown ? ' unknown' : '') },
            displayMenu
          ),
          el(
            'button',
            {
              class: 'btn btn-icon btn-ghost btn-danger',
              'aria-label': 'Supprimer',
              onClick: (e) => {
                e.stopPropagation();
                removeReservation(r.id);
                rerender();
              },
            },
            '×'
          ),
        ]
      );
      list.appendChild(row);
    }
    wrap.appendChild(list);
  }

  return wrap;
}

function editResa(id) {
  const state = getState();
  const r = state.session.reservations.find((x) => x.id === id);
  if (!r) return;
  const menus = state.catalog.menus;
  const def = defaultMenu();

  let couverts = r.couverts;
  let menuId = r.menu_id === null ? 'unknown' : r.menu_id;

  const body = el('div');

  const cInput = el('input', {
    type: 'number',
    min: '1',
    value: String(couverts),
    inputmode: 'numeric',
  });
  cInput.addEventListener('input', () => {
    const v = parseInt(cInput.value, 10);
    couverts = isNaN(v) || v < 1 ? 1 : v;
  });
  const stepper = el('div', { class: 'stepper' }, [
    el(
      'button',
      {
        type: 'button',
        onClick: () => {
          couverts = Math.max(1, couverts - 1);
          cInput.value = String(couverts);
        },
      },
      '−'
    ),
    cInput,
    el(
      'button',
      {
        type: 'button',
        onClick: () => {
          couverts += 1;
          cInput.value = String(couverts);
        },
      },
      '+'
    ),
  ]);
  body.appendChild(
    el('div', { class: 'field' }, [
      el('label', { class: 'field-label' }, 'Couverts'),
      stepper,
    ])
  );

  if (menus.length > 0) {
    const chipsWrap = el('div', { class: 'chips' });
    const renderChips = () => {
      chipsWrap.innerHTML = '';
      if (def) {
        chipsWrap.appendChild(
          el(
            'div',
            {
              class: 'chip' + (menuId === 'unknown' ? ' chip-active' : ''),
              onClick: () => {
                menuId = 'unknown';
                renderChips();
              },
            },
            ['Inconnu', el('span', { class: 'chip-sub' }, `→ ${def.nom}`)]
          )
        );
      }
      for (const m of menus) {
        chipsWrap.appendChild(
          el(
            'div',
            {
              class: 'chip' + (menuId === m.id ? ' chip-active' : ''),
              onClick: () => {
                menuId = m.id;
                renderChips();
              },
            },
            [
              m.nom,
              m.est_defaut
                ? el('span', { class: 'chip-sub' }, 'défaut')
                : null,
            ]
          )
        );
      }
    };
    renderChips();
    body.appendChild(
      el('div', { class: 'field' }, [
        el('label', { class: 'field-label' }, 'Menu'),
        chipsWrap,
      ])
    );
  }

  const actions = el('div', { class: 'modal-actions' }, [
    el(
      'button',
      {
        class: 'btn btn-danger',
        onClick: () => {
          if (!confirm('Supprimer cette réservation ?')) return;
          removeReservation(id);
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
          updateReservation(id, {
            couverts,
            menu_id: menuId === 'unknown' ? null : menuId,
          });
          modal.close();
          rerender();
        },
      },
      'Enregistrer'
    ),
  ]);
  body.appendChild(actions);

  const modal = openModal({ title: 'Modifier la réservation', body });
}

function formatStart(ts) {
  const d = new Date(ts);
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  return `Service ouvert à ${hh}:${mm}`;
}
