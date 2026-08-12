import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Genealo - Arbre Généalogique',
    short_name: 'Genealo',
    description: 'Créez et explorez votre arbre généalogique facilement.',
    start_url: '/',
    display: 'standalone',
    background_color: '#f7f6f0',
    theme_color: '#556b2f',
    orientation: 'portrait',
    icons: [
      {
        src: '/icon.svg',
        sizes: 'any',
        type: 'image/svg+xml',
        purpose: 'any',
      },
    ],
  };
}
