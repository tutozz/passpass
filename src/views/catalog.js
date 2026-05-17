import { el } from '../utils/dom.js';
import { getState } from '../store.js';
import {
  iconTarget,
  iconPlate,
  iconUtensils,
  iconClipboard,
} from '../utils/icons.js';

export function renderCatalog() {
  const state = getState();
  const wrap = el('div');
  wrap.appendChild(
    el('div', { class: 'page-head' }, [
      el('h1', { class: 'page-title' }, 'Modifier'),
      el('p', { class: 'page-sub' }, 'Configure pass, assiettes, plats et menus.'),
    ])
  );

  const hasDefault = state.catalog.menus.some((m) => m.est_defaut);
  const cards = [
    {
      href: '#/catalog/passes',
      title: 'Pass',
      sub: `${state.catalog.passes.length} pass · positions des assiettes`,
      icon: iconTarget,
    },
    {
      href: '#/catalog/assiettes',
      title: 'Assiettes',
      sub: `${state.catalog.assiettes.length} assiette${state.catalog.assiettes.length > 1 ? 's' : ''} · marge incluse`,
      icon: iconPlate,
    },
    {
      href: '#/catalog/plats',
      title: 'Plats',
      sub: `${state.catalog.plats.length} plat${state.catalog.plats.length > 1 ? 's' : ''} · composition`,
      icon: iconUtensils,
    },
    {
      href: '#/catalog/menus',
      title: 'Menus',
      sub: `${state.catalog.menus.length} menu${state.catalog.menus.length > 1 ? 's' : ''}` +
        (state.catalog.menus.length === 0
          ? ' · aucun défini'
          : hasDefault
            ? ' · défaut OK'
            : ' · pas de défaut'),
      icon: iconClipboard,
    },
  ];

  const hub = el('div', { class: 'cat-hub' });
  for (const c of cards) {
    hub.appendChild(
      el(
        'a',
        { href: c.href, class: 'list-item', style: { textDecoration: 'none', color: 'inherit' } },
        [
          el('div', { class: 'plate-thumb' }, c.icon(24)),
          el('div', { class: 'list-item-main' }, [
            el('div', { class: 'list-item-title' }, c.title),
            el('div', { class: 'list-item-sub' }, c.sub),
          ]),
          el('div', { class: 'chev' }, '›'),
        ]
      )
    );
  }
  wrap.appendChild(hub);

  wrap.appendChild(
    el('div', { class: 'footer' }, [
      'Toutes les données sont stockées localement sur cet appareil.',
    ])
  );

  return wrap;
}
