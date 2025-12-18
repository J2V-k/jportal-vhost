import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';

export default defineConfig({
  output: 'static',
  site: 'https://J2V-k.github.io',
  base: '/jportal-vhost',
  integrations: [
    starlight({
      title: 'JP Portal',
      description: 'Modern JIIT WebKiosk client - Documentation',
      favicon: '/favicon.svg',
      logo: {
        src: './public/favicon.svg',
      },
      customCss: [
        './src/styles/custom.css',
      ],
      social: [
        { 
          href: 'https://github.com/J2V-k/jportal-vhost', 
          icon: 'github', 
          label: 'GitHub Repository' 
        }
      ],
      editLink: {
        baseUrl: 'https://github.com/J2V-k/jportal-vhost/edit/main/docs/',
      },
      lastUpdated: true,
      tableOfContents: {
        minHeadingLevel: 2,
        maxHeadingLevel: 4,
      },
      sidebar: [
        { 
          label: 'Getting Started', 
          items: [
            { label: 'Overview', link: '/' },
            { label: 'Setup', link: '/setup' },
          ]
        },
        { 
          label: 'Core Concepts',
          items: [
            { label: 'Architecture', link: '/architecture' },
            { label: 'Code Map', link: '/code-map' },
            { label: 'Calculations & Logic', link: '/calculations-logic' },
          ]
        },
        { 
          label: 'Features',
          items: [
            { label: 'Feature Guide', link: '/features' },
            { label: 'PWA & Offline', link: '/pwa-offline' },
            { label: 'API Integration', link: '/api-integration' },
          ]
        },
        { 
          label: 'Development',
          items: [
            { label: 'UI Components', link: '/ui-components' },
            { label: 'Contributing', link: '/contributing' },
            { label: 'Troubleshooting', link: '/troubleshooting' },
          ]
        }
      ],
      head: [
        {
          tag: 'meta',
          attrs: {
            property: 'og:image',
            content: 'https://J2V-k.github.io/jportal-vhost/og-image.png',
          },
        },
        {
          tag: 'meta',
          attrs: {
            name: 'twitter:card',
            content: 'summary_large_image',
          },
        },
      ],
    })
  ]
});
