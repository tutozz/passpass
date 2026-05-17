import { el } from '../utils/dom.js';
import { getState } from '../store.js';
import { computeRecharges } from '../utils/calc.js';
import { iconCheck, iconPlate } from '../utils/icons.js';

export function renderRecharge() {
  const state = getState();
  const wrap = el('div');

  wrap.appendChild(
    el('div', { class: 'page-head' }, [
      el('h1', { class: 'page-title' }, 'Recharge'),
      el(
        'p',
        { class: 'page-sub' },
        'Assiettes à recharger pendant le service.'
      ),
    ])
  );

  if (state.session.reservations.length === 0) {
    wrap.appendChild(
      el('div', { class: 'empty' }, [
        el('div', { class: 'empty-title' }, 'Aucune réservation'),
        el('div', {}, 'Saisis d\'abord des réservations.'),
      ])
    );
    return wrap;
  }

  const recharges = computeRecharges(state);

  if (recharges.length === 0) {
    wrap.appendChild(
      el('div', { class: 'recharge-ok' }, [
        el('div', { class: 'recharge-ok-icon' }, iconCheck(40)),
        el('div', { class: 'recharge-ok-title' }, 'Stock suffisant'),
        el(
          'div',
          { class: 'recharge-ok-sub' },
          'Aucune recharge à prévoir pour ce service.'
        ),
      ])
    );

    const stockless = state.catalog.assiettes.filter(
      (a) => a.stock_total == null
    );
    if (stockless.length > 0) {
      wrap.appendChild(
        el('div', { class: 'alert alert-info', style: { marginTop: '20px' } }, [
          stockless.length === 1
            ? '1 assiette sans stock défini : '
            : `${stockless.length} assiettes sans stock défini : `,
          stockless.map((a) => a.nom).join(', '),
          ' (pas comptées ici).',
        ])
      );
    }
    return wrap;
  }

  const totalManque = recharges.reduce((s, r) => s + r.manque, 0);
  wrap.appendChild(
    el('div', { class: 'hero hero-warn' }, [
      el('div', {}, [
        el('div', { class: 'hero-label' }, 'À recharger'),
        el(
          'div',
          { class: 'hero-sub' },
          `${recharges.length} référence${recharges.length > 1 ? 's' : ''}`
        ),
      ]),
      el('div', { class: 'hero-num' }, `+${totalManque}`),
    ])
  );

  const list = el('div');
  for (const r of recharges) {
    const row = el('div', { class: 'recharge-row' }, [
      el(
        'div',
        {
          class: 'plate-thumb',
          style: r.assiette.photo
            ? { backgroundImage: `url(${r.assiette.photo})` }
            : {},
        },
        r.assiette.photo ? null : iconPlate(22)
      ),
      el('div', { class: 'recharge-row-main' }, [
        el('div', { class: 'recharge-row-name' }, r.assiette.nom),
        el(
          'div',
          { class: 'recharge-row-sub' },
          `besoin ${r.besoin} · stock ${r.stock}`
        ),
      ]),
      el('div', { class: 'recharge-row-qty' }, `+${r.manque}`),
    ]);
    list.appendChild(row);
  }
  wrap.appendChild(list);

  return wrap;
}
