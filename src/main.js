import './style.css';
import { registerSW } from 'virtual:pwa-register';
import { el } from './utils/dom.js';
import { renderReservations } from './views/reservations.js';
import { renderPasses } from './views/passes.js';
import { renderPassDetail } from './views/pass-detail.js';
import { renderRecharge } from './views/recharge.js';
import { renderCatalog } from './views/catalog.js';
import { renderCatalogPasses } from './views/catalog-passes.js';
import { renderCatalogAssiettes } from './views/catalog-assiettes.js';
import { renderCatalogPlats } from './views/catalog-plats.js';
import { renderCatalogMenus } from './views/catalog-menus.js';
import { computeRecharges } from './utils/calc.js';
import { getState } from './store.js';

registerSW({ immediate: true });

const root = document.getElementById('app');

const routes = [
  { match: /^#\/passes\/([^/]+)$/, render: renderPassDetail, tab: 'passes' },
  { match: /^#\/passes$/, render: renderPasses, tab: 'passes' },
  { match: /^#\/recharge$/, render: renderRecharge, tab: 'recharge' },
  { match: /^#\/catalog\/passes$/, render: renderCatalogPasses, tab: 'catalog' },
  { match: /^#\/catalog\/assiettes$/, render: renderCatalogAssiettes, tab: 'catalog' },
  { match: /^#\/catalog\/plats$/, render: renderCatalogPlats, tab: 'catalog' },
  { match: /^#\/catalog\/menus$/, render: renderCatalogMenus, tab: 'catalog' },
  { match: /^#\/catalog$/, render: renderCatalog, tab: 'catalog' },
  { match: /^.*$/, render: renderReservations, tab: 'reservations' },
];

function pickRoute() {
  const hash = location.hash || '#/reservations';
  for (const r of routes) {
    const m = hash.match(r.match);
    if (m) return { route: r, params: m.slice(1) };
  }
  return { route: routes[routes.length - 1], params: [] };
}

export function rerender() {
  const { route, params } = pickRoute();
  root.innerHTML = '';
  const shell = el('div', { class: 'app-shell' });
  const content = el('main', { class: 'content' });
  try {
    content.appendChild(route.render(...params));
  } catch (e) {
    console.error(e);
    content.appendChild(el('div', { class: 'alert alert-warning' }, 'Erreur d\'affichage : ' + e.message));
  }
  shell.appendChild(content);
  shell.appendChild(bottomNav(route.tab));
  root.appendChild(shell);
  window.scrollTo(0, 0);
}

function bottomNav(active) {
  let rechargeCount = 0;
  try {
    rechargeCount = computeRecharges(getState()).length;
  } catch {}
  const tabs = [
    { key: 'reservations', label: 'Résas', hash: '#/reservations', icon: iconList() },
    { key: 'passes', label: 'Passes', hash: '#/passes', icon: iconGrid() },
    {
      key: 'recharge',
      label: 'Recharge',
      hash: '#/recharge',
      icon: iconReload(),
      badge: rechargeCount > 0 ? rechargeCount : null,
    },
    { key: 'catalog', label: 'Modifier', hash: '#/catalog', icon: iconGear() },
  ];
  return el(
    'nav',
    { class: 'tabbar' },
    tabs.map((t) => {
      const iconWrap = el('div', { class: 'tab-icon-wrap' }, [t.icon]);
      if (t.badge) {
        iconWrap.appendChild(el('span', { class: 'tab-badge' }, String(t.badge)));
      }
      return el(
        'a',
        {
          href: t.hash,
          class: 'tab' + (active === t.key ? ' tab-active' : ''),
        },
        [iconWrap, el('span', { class: 'tab-label' }, t.label)]
      );
    })
  );
}

function svgIcon(d) {
  const ns = 'http://www.w3.org/2000/svg';
  const s = document.createElementNS(ns, 'svg');
  s.setAttribute('viewBox', '0 0 24 24');
  s.setAttribute('width', '22');
  s.setAttribute('height', '22');
  s.setAttribute('fill', 'none');
  s.setAttribute('stroke', 'currentColor');
  s.setAttribute('stroke-width', '2');
  s.setAttribute('stroke-linecap', 'round');
  s.setAttribute('stroke-linejoin', 'round');
  const p = document.createElementNS(ns, 'path');
  p.setAttribute('d', d);
  s.appendChild(p);
  return s;
}
function iconList() {
  return svgIcon('M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01');
}
function iconGrid() {
  return svgIcon('M3 3h7v7H3zM14 3h7v7h-7zM14 14h7v7h-7zM3 14h7v7H3z');
}
function iconReload() {
  return svgIcon(
    'M3 12a9 9 0 0 1 15.5-6.3L21 8 M21 3v5h-5 M21 12a9 9 0 0 1-15.5 6.3L3 16 M3 21v-5h5'
  );
}
function iconGear() {
  return svgIcon(
    'M12 15.5a3.5 3.5 0 100-7 3.5 3.5 0 000 7z M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 11-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 11-4 0v-.09a1.65 1.65 0 00-1-1.51 1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 11-2.83-2.83l.06-.06A1.65 1.65 0 005 15a1.65 1.65 0 00-1.51-1H3a2 2 0 110-4h.09A1.65 1.65 0 005 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 112.83-2.83l.06.06A1.65 1.65 0 009 5a1.65 1.65 0 001-1.51V3a2 2 0 114 0v.09A1.65 1.65 0 0015 5a1.65 1.65 0 001.82-.33l.06-.06a2 2 0 112.83 2.83l-.06.06A1.65 1.65 0 0019 9a1.65 1.65 0 001.51 1H21a2 2 0 110 4h-.09A1.65 1.65 0 0019.4 15z'
  );
}

window.addEventListener('hashchange', rerender);
rerender();
