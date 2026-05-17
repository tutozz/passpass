const NS = 'http://www.w3.org/2000/svg';

function svgEl(paths, size = 22, opts = {}) {
  const s = document.createElementNS(NS, 'svg');
  s.setAttribute('viewBox', opts.viewBox || '0 0 24 24');
  s.setAttribute('width', String(size));
  s.setAttribute('height', String(size));
  s.setAttribute('fill', opts.fill || 'none');
  s.setAttribute('stroke', opts.stroke || 'currentColor');
  s.setAttribute('stroke-width', String(opts.strokeWidth || 2));
  s.setAttribute('stroke-linecap', 'round');
  s.setAttribute('stroke-linejoin', 'round');
  const list = Array.isArray(paths) ? paths : [paths];
  for (const p of list) {
    const el = document.createElementNS(NS, 'path');
    el.setAttribute('d', p);
    s.appendChild(el);
  }
  return s;
}

export const iconCheck = (size = 22) => svgEl('M20 6 9 17l-5-5', size);

export const iconWarning = (size = 22) =>
  svgEl(
    [
      'M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z',
      'M12 9v4',
      'M12 17h.01',
    ],
    size
  );

export const iconPlate = (size = 22) =>
  svgEl(
    [
      'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18z',
      'M12 7.5a4.5 4.5 0 1 0 0 9 4.5 4.5 0 0 0 0-9z',
    ],
    size
  );

export const iconCamera = (size = 22) =>
  svgEl(
    [
      'M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z',
      'M12 17a4 4 0 1 0 0-8 4 4 0 0 0 0 8z',
    ],
    size
  );

export const iconTarget = (size = 22) =>
  svgEl(
    [
      'M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20z',
      'M12 18a6 6 0 1 0 0-12 6 6 0 0 0 0 12z',
      'M12 14a2 2 0 1 0 0-4 2 2 0 0 0 0 4z',
    ],
    size
  );

export const iconUtensils = (size = 22) =>
  svgEl(
    [
      'M3 2v7a3 3 0 0 0 6 0V2',
      'M6 9v13',
      'M18 2a3 3 0 0 0-3 3v6a2 2 0 0 0 2 2h1',
      'M18 2v20',
    ],
    size
  );

export const iconClipboard = (size = 22) =>
  svgEl(
    [
      'M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2',
      'M9 2h6a1 1 0 0 1 1 1v2a1 1 0 0 1-1 1H9a1 1 0 0 1-1-1V3a1 1 0 0 1 1-1z',
      'M9 12h6',
      'M9 16h4',
    ],
    size
  );
