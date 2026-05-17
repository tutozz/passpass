import { uid } from './utils/id.js';

const CATALOG_KEY = 'passpass.catalog.v1';
const SESSION_KEY = 'passpass.session.v1';
const PREFS_KEY = 'passpass.prefs.v1';

const defaultCatalog = () => ({
  passes: Array.from({ length: 5 }, (_, i) => ({
    id: uid(),
    nom: `Pass ${i + 1}`,
    photo: null,
    ordre: i,
  })),
  assiettes: [],
  plats: [],
  menus: [],
});

const defaultSession = () => ({
  reservations: [],
  cochages: {},
  started_at: Date.now(),
});

const defaultPrefs = () => ({ last_menu_id: null });

function loadFrom(storage, key, fallback) {
  try {
    const raw = storage.getItem(key);
    if (!raw) return fallback();
    const parsed = JSON.parse(raw);
    return parsed || fallback();
  } catch {
    return fallback();
  }
}

const state = {
  catalog: loadFrom(localStorage, CATALOG_KEY, defaultCatalog),
  session: loadFrom(sessionStorage, SESSION_KEY, defaultSession),
  prefs: loadFrom(localStorage, PREFS_KEY, defaultPrefs),
};

// Sanity: always 5 passes
if (!Array.isArray(state.catalog.passes) || state.catalog.passes.length === 0) {
  state.catalog.passes = defaultCatalog().passes;
}
while (state.catalog.passes.length < 5) {
  state.catalog.passes.push({
    id: uid(),
    nom: `Pass ${state.catalog.passes.length + 1}`,
    photo: null,
    ordre: state.catalog.passes.length,
  });
}
state.catalog.passes.forEach((p, i) => (p.ordre = i));

export function getState() {
  return state;
}

export function saveCatalog() {
  try {
    localStorage.setItem(CATALOG_KEY, JSON.stringify(state.catalog));
  } catch (e) {
    console.error('Erreur localStorage (quota dépassé ?)', e);
    alert('Espace de stockage saturé. Réduis les photos ou supprime des items.');
  }
}

export function saveSession() {
  try {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(state.session));
  } catch (e) {
    console.error('Erreur sessionStorage', e);
  }
}

export function savePrefs() {
  try {
    localStorage.setItem(PREFS_KEY, JSON.stringify(state.prefs));
  } catch (e) {
    console.error('Erreur prefs', e);
  }
}

// ---------- Pass ----------
export function updatePass(id, patch) {
  const p = state.catalog.passes.find((x) => x.id === id);
  if (p) Object.assign(p, patch);
  saveCatalog();
}

// ---------- Assiette ----------
export function addAssiette(nom, marge = 10, photo = null) {
  const a = { id: uid(), nom, marge_pourcentage: marge, photo };
  state.catalog.assiettes.push(a);
  saveCatalog();
  return a;
}
export function updateAssiette(id, patch) {
  const a = state.catalog.assiettes.find((x) => x.id === id);
  if (a) Object.assign(a, patch);
  saveCatalog();
}
export function deleteAssiette(id) {
  const refs = state.catalog.plats.filter((p) =>
    p.compositions.some((c) => c.assiette_id === id)
  );
  if (refs.length) return { ok: false, plats: refs };
  state.catalog.assiettes = state.catalog.assiettes.filter((x) => x.id !== id);
  saveCatalog();
  return { ok: true };
}

// ---------- Plat ----------
export function addPlat(nom) {
  const p = { id: uid(), nom, compositions: [] };
  state.catalog.plats.push(p);
  saveCatalog();
  return p;
}
export function updatePlat(id, patch) {
  const p = state.catalog.plats.find((x) => x.id === id);
  if (p) Object.assign(p, patch);
  saveCatalog();
}
export function deletePlat(id) {
  const refs = state.catalog.menus.filter((m) => m.plats.includes(id));
  if (refs.length) return { ok: false, menus: refs };
  state.catalog.plats = state.catalog.plats.filter((x) => x.id !== id);
  saveCatalog();
  return { ok: true };
}

// ---------- Menu ----------
export function addMenu(nom) {
  const m = {
    id: uid(),
    nom,
    plats: [],
    est_defaut: state.catalog.menus.length === 0,
  };
  state.catalog.menus.push(m);
  saveCatalog();
  return m;
}
export function updateMenu(id, patch) {
  const m = state.catalog.menus.find((x) => x.id === id);
  if (m) Object.assign(m, patch);
  saveCatalog();
}
export function setMenuDefault(id) {
  for (const m of state.catalog.menus) m.est_defaut = m.id === id;
  saveCatalog();
}
export function deleteMenu(id, fallbackMenuId = null) {
  const m = state.catalog.menus.find((x) => x.id === id);
  if (!m) return { ok: true };
  if (m.est_defaut && fallbackMenuId) {
    const f = state.catalog.menus.find((x) => x.id === fallbackMenuId);
    if (f) f.est_defaut = true;
  }
  for (const r of state.session.reservations) {
    if (r.menu_id === id) r.menu_id = null;
  }
  state.catalog.menus = state.catalog.menus.filter((x) => x.id !== id);
  saveCatalog();
  saveSession();
  return { ok: true };
}

// ---------- Reservations ----------
export function addReservation(couverts, menu_id) {
  state.session.reservations.unshift({ id: uid(), couverts, menu_id });
  state.prefs.last_menu_id = menu_id;
  saveSession();
  savePrefs();
}
export function removeReservation(id) {
  state.session.reservations = state.session.reservations.filter((r) => r.id !== id);
  saveSession();
}

// ---------- Cochages ----------
export function isCoche(passId, assietteId) {
  return !!state.session.cochages[`${passId}|${assietteId}`];
}
export function toggleCochage(passId, assietteId) {
  const k = `${passId}|${assietteId}`;
  state.session.cochages[k] = !state.session.cochages[k];
  saveSession();
}

// ---------- Helpers ----------
export function defaultMenu() {
  return state.catalog.menus.find((m) => m.est_defaut) || null;
}
