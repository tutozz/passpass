# Passe Passe

App de préparation de service pour restaurant — calcule combien d'assiettes
mettre en place dans chaque pass, à partir des réservations saisies.

PWA installable, fonctionne offline, données stockées localement (localStorage).

## Stack

- Vanilla JS + Vite
- vite-plugin-pwa (service worker + manifest)
- Hébergement : GitHub Pages

## Dev local

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
npm run preview
```

## Déploiement

Le déploiement est automatique via GitHub Actions (`.github/workflows/deploy.yml`)
à chaque push sur `main`.

Pour activer la première fois :

1. Aller sur le dépôt → **Settings** → **Pages**
2. Sous **Source**, choisir **GitHub Actions**
3. Pousser sur `main` ou relancer le workflow manuellement

URL publique : `https://<utilisateur>.github.io/passpass/`

## Données

- **Catalogue** (pass, assiettes, plats, menus) : persisté en `localStorage`
- **Session** (réservations, cochages) : `sessionStorage`, reset à chaque
  relancement de l'app (conforme à la spec)
- **Photos** : redimensionnées max 480px et compressées JPEG ~0.78 avant stockage
