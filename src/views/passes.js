import { el } from '../utils/dom.js';
import { getState, isCoche } from '../store.js';
import { computeQuantities } from '../utils/calc.js';

export function renderPasses() {
  const state = getState();
  const wrap = el('div');

  wrap.appendChild(
    el('div', { class: 'page-head' }, [
      el('h1', { class: 'page-title' }, 'Passes'),
      el('p', { class: 'page-sub' }, 'Sélectionne une pass pour voir les assiettes à poser.'),
    ])
  );

  if (state.session.reservations.length === 0) {
    wrap.appendChild(
      el('div', { class: 'empty' }, [
        el('div', { class: 'empty-title' }, 'Aucune réservation'),
        el('div', {}, 'Saisis d\'abord des réservations.'),
        el(
          'div',
          { style: { marginTop: '14px' } },
          el(
            'a',
            { href: '#/reservations', class: 'btn btn-primary' },
            'Aller à la saisie'
          )
        ),
      ])
    );
    return wrap;
  }

  const def = state.catalog.menus.find((m) => m.est_defaut);
  const hasUnknown = state.session.reservations.some((r) => !r.menu_id);
  if (hasUnknown && !def) {
    wrap.appendChild(
      el(
        'div',
        { class: 'alert alert-warning' },
        '⚠ Aucun menu par défaut défini : les réservations « inconnu » sont ignorées dans le calcul.'
      )
    );
  }

  const byPass = computeQuantities(state);
  const passes = [...state.catalog.passes].sort((a, b) => a.ordre - b.ordre);

  const grid = el('div', { class: 'pass-grid' });
  for (const p of passes) {
    const lines = byPass[p.id] || [];
    const total = lines.reduce((s, l) => s + l.final, 0);
    const checked = lines
      .filter((l) => isCoche(p.id, l.assiette.id))
      .reduce((s, l) => s + l.final, 0);
    const done = total > 0 && checked >= total;
    const tile = el('a', {
      href: `#/passes/${p.id}`,
      class: 'pass-tile' + (p.photo ? '' : ' pass-tile-no-photo'),
      style: p.photo ? { backgroundImage: `url(${p.photo})` } : {},
    });
    if (done) tile.appendChild(el('div', { class: 'pass-tile-check' }, '✓'));
    const overlay = el('div', { class: 'pass-tile-overlay' }, [
      el('div', { class: 'pass-tile-name' }, p.nom),
      lines.length > 0
        ? el('div', { class: 'pass-tile-meta' }, `${checked} / ${total} posées`)
        : el('div', { class: 'pass-tile-empty' }, 'Aucune assiette'),
    ]);
    if (lines.length > 0) {
      overlay.appendChild(
        el('div', { class: 'pass-tile-bar' }, [
          el('div', {
            style: { width: `${Math.min(100, (checked / total) * 100)}%` },
          }),
        ])
      );
    }
    tile.appendChild(overlay);
    grid.appendChild(tile);
  }
  wrap.appendChild(grid);
  return wrap;
}
