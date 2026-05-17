import { el } from '../utils/dom.js';
import {
  getState,
  addReservation,
  removeReservation,
  defaultMenu,
} from '../store.js';
import { haptic } from '../utils/haptic.js';
import { rerender } from '../main.js';

export function renderReservations() {
  const state = getState();
  const wrap = el('div');

  const menus = state.catalog.menus;
  const def = defaultMenu();

  // State du formulaire (local)
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

  // Header
  wrap.appendChild(
    el('div', { class: 'page-head' }, [
      el('h1', { class: 'page-title' }, 'Service en cours'),
      el('p', { class: 'page-sub' }, formatStart(state.session.started_at)),
    ])
  );

  // Hero stats
  const totalCv = state.session.reservations.reduce((a, r) => a + r.couverts, 0);
  const totalRes = state.session.reservations.length;
  wrap.appendChild(
    el('div', { class: 'hero' }, [
      el('div', {}, [
        el('div', { class: 'hero-label' }, 'Total couverts'),
        el(
          'div',
          { class: 'hero-sub' },
          `${totalRes} réservation${totalRes > 1 ? 's' : ''}`
        ),
      ]),
      el('div', { class: 'hero-num' }, String(totalCv)),
    ])
  );

  // Formulaire
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
    'Ajouter'
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
      const row = el('div', { class: 'resa-row' }, [
        el('div', { class: 'resa-couverts' }, `${r.couverts} cv`),
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
            onClick: () => {
              removeReservation(r.id);
              rerender();
            },
          },
          '×'
        ),
      ]);
      list.appendChild(row);
    }
    wrap.appendChild(list);
  }

  // CTA flottant
  if (state.session.reservations.length > 0) {
    wrap.appendChild(
      el('div', { class: 'sticky-cta' }, [
        el(
          'a',
          { href: '#/passes', class: 'btn btn-primary btn-block btn-large' },
          'Voir les passes →'
        ),
      ])
    );
  }

  return wrap;
}

function formatStart(ts) {
  const d = new Date(ts);
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  return `Service ouvert à ${hh}:${mm}`;
}
