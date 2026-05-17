export function computeQuantities(state) {
  const { catalog, session } = state;
  const defaultMenu = catalog.menus.find((m) => m.est_defaut) || null;
  const platById = Object.fromEntries(catalog.plats.map((p) => [p.id, p]));
  const menuById = Object.fromEntries(catalog.menus.map((m) => [m.id, m]));
  const assietteById = Object.fromEntries(catalog.assiettes.map((a) => [a.id, a]));

  const brut = Object.create(null);
  for (const r of session.reservations) {
    const menu = r.menu_id ? menuById[r.menu_id] : defaultMenu;
    if (!menu) continue;
    for (const platId of menu.plats) {
      const plat = platById[platId];
      if (!plat) continue;
      for (const c of plat.compositions) {
        if (!c.assiette_id || !c.pass_id) continue;
        const cpu = Math.max(1, c.couverts_par_unite || 1);
        const units = Math.ceil(r.couverts / cpu) * c.quantite;
        if (units <= 0) continue;
        const key = `${c.pass_id}|${c.assiette_id}`;
        brut[key] = (brut[key] || 0) + units;
      }
    }
  }

  const byPass = {};
  for (const p of catalog.passes) byPass[p.id] = [];
  for (const [key, b] of Object.entries(brut)) {
    if (b <= 0) continue;
    const [passId, assietteId] = key.split('|');
    const a = assietteById[assietteId];
    if (!a || !byPass[passId]) continue;
    const marge = a.marge_pourcentage || 0;
    const final = Math.ceil(b * (1 + marge / 100));
    byPass[passId].push({
      passId,
      assiette: a,
      brut: b,
      final,
      marge,
    });
  }
  for (const list of Object.values(byPass)) {
    list.sort(
      (x, y) => y.final - x.final || x.assiette.nom.localeCompare(y.assiette.nom)
    );
  }
  return byPass;
}

export function computeRecharges(state) {
  const byPass = computeQuantities(state);
  const totalByAssiette = new Map();
  for (const lines of Object.values(byPass)) {
    for (const l of lines) {
      const prev = totalByAssiette.get(l.assiette.id) || {
        assiette: l.assiette,
        besoin: 0,
      };
      prev.besoin += l.final;
      totalByAssiette.set(l.assiette.id, prev);
    }
  }
  const recharges = [];
  for (const { assiette, besoin } of totalByAssiette.values()) {
    const stock = assiette.stock_total;
    if (stock == null) continue;
    const manque = besoin - stock;
    if (manque > 0) {
      recharges.push({ assiette, besoin, stock, manque });
    }
  }
  recharges.sort(
    (a, b) => b.manque - a.manque || a.assiette.nom.localeCompare(b.assiette.nom)
  );
  return recharges;
}
