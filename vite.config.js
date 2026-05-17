import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  base: '/passpass/',
  plugins: [
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'icon-192.png', 'icon-512.png', 'icon-maskable.png'],
      manifest: {
        name: 'Passe Passe',
        short_name: 'PassPass',
        description: 'Préparation de service restaurant — calcule les assiettes par pass.',
        lang: 'fr',
        theme_color: '#ffffff',
        background_color: '#fafafa',
        display: 'standalone',
        orientation: 'portrait',
        start_url: '/passpass/',
        scope: '/passpass/',
        icons: [
          { src: 'icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icon-maskable.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,ico,woff2}']
      }
    })
  ],
  build: {
    target: 'es2020',
    cssCodeSplit: false
  }
});
