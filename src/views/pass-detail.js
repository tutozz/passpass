import { el } from '../utils/dom.js';
import { getState, isCoche, toggleCochage } from '../store.js';
import { computeQuantities } from '../utils/calc.js';
import { haptic, hapticStrong } from '../utils/haptic.js';
import { rerender } from '../main.js';

export function renderPassDetail(passId) {
  const state = getState();
  const pass = state.catalog.passes.find((p) => p.id === passId);
  const wrap = el('div');

  if (!pass) {
    wrap.appendChild(el('div', { class: 'empty' }, 'Pass introuvable.'));
    return wrap;
  }

  // Banner
  const banner = el('div', {
    class: 'pass-banner' + (pass.photo ? '' : ' pass-banner-no-photo'),
    style: pass.photo ? { backgroundImage: `url(${pass.photo})` } : {},
  });
  const overlay = el('div', { class: 'pass-banner-overlay' }, [
    el(
      'a',
      {
        href: '#/passes',
        style: {
          color: 'inherit',
          textDecoration: 'none',
          fontSize: '13px',
          opacity: '0.9',
        },
      },
      '← Toutes les passes'
    ),
    el(
      'div',
      { style: { fontWeight: '700', fontSize: '24px', marginTop: '6px' } },
      pass.nom
    ),
  ]);
  banner.appendChild(overlay);
  wrap.appendChild(banner);

  const byPass = computeQuantities(state);
  const lines = byPass[passId] || [];

  if (lines.length === 0) {
    wrap.appendChild(
      el('div', { class: 'empty' }, [
        el('div', { class: 'empty-title' }, 'Aucune assiette à poser'),
        el(
          'div',
          {},
          'Aucun plat des menus saisis ne pose d\'assiette dans cette pass.'
        ),
      ])
    );
    return wrap;
  }

  const total = lines.length;
  const checkedCount = lines.filter((l) =>
    isCoche(passId, l.assiette.id)
  ).length;
  const wasJustCompleted =
    checkedCount === total && total > 0 && window.__passpass_last_done !== passId;

  wrap.appendChild(
    el('div', { class: 'hero' }, [
      el('div', {}, [
        el('div', { class: 'hero-label' }, 'Avancement'),
        el('div', { class: 'hero-sub' }, `${checkedCount} sur ${total} assiettes`),
      ]),
      el('div', { class: 'hero-num' }, `${checkedCount}/${total}`),
    ])
  );

  const list = el('div');
  for (const l of lines) {
    const checked = isCoche(passId, l.assiette.id);
    const row = el('div', {
      class: 'plate-row' + (checked ? ' checked' : ''),
    });
    row.addEventListener('click', () => {
      const wasChecked = isCoche(passId, l.assiette.id);
      toggleCochage(passId, l.assiette.id);
      if (!wasChecked) haptic();
      rerender();
    });
    row.appendChild(
      el(
        'div',
        { class: 'checkbox' + (checked ? ' checked' : '') },
        checked ? '✓' : ''
      )
    );
    row.appendChild(
      el(
        'div',
        {
          class: 'plate-thumb',
          style: l.assiette.photo
            ? { backgroundImage: `url(${l.assiette.photo})` }
            : {},
        },
        l.assiette.photo ? null : '🍽'
      )
    );
    row.appendChild(
      el('div', { class: 'plate-row-main' }, [
        el('div', { class: 'plate-row-name' }, l.assiette.nom),
        el(
          'div',
          { class: 'plate-row-sub' },
          `base ${l.brut} · marge +${l.marge}%`
        ),
      ])
    );
    row.appendChild(el('div', { class: 'plate-row-qty' }, `×${l.final}`));
    list.appendChild(row);
  }
  wrap.appendChild(list);

  if (checkedCount === total) {
    wrap.appendChild(el('div', { class: 'pass-done' }, '✓ Pass terminée'));
    if (wasJustCompleted) {
      hapticStrong();
      window.__passpass_last_done = passId;
    }
  } else if (window.__passpass_last_done === passId) {
    window.__passpass_last_done = null;
  }

  return wrap;
}
