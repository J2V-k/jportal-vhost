import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';

export default defineConfig({
  output: 'static',
  site: 'https://J2V-k.github.io',
  base: '/jportal-vhost',
  integrations: [
    starlight({
      title: 'JP Portal Docs',
      favicon: '/favicon.svg',
      social: [
        { href: 'https://github.com/J2V-k/jportal-vhost', icon: 'github', label: 'GitHub' }
      ],
      sidebar: [
        { label: 'Overview', link: '/' },
        { label: 'Setup', link: '/setup' },
        { label: 'Architecture', link: '/architecture' },
        { label: 'Code Map', link: '/code-map' },
        { label: 'Features', link: '/features' },
        { label: 'PWA & Offline', link: '/pwa-offline' },
        { label: 'API Integration', link: '/api-integration' },
        { label: 'UI Components', link: '/ui-components' },
        { label: 'Contributing', link: '/contributing' },
        { label: 'Troubleshooting', link: '/troubleshooting' }
      ]
    })
  ]
});
