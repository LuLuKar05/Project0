/**
 * @file src/features/seo/JsonLd.tsx
 * Emits schema.org JSON-LD on the home page (server-rendered into the HTML):
 *  • Person   — you, for rich results / knowledge panel
 *  • WebSite  — the site itself
 *  • ItemList — your projects, so search engines can index your work even though
 *               the 3D detail panel only renders a project's text client-side.
 */

import type { Project } from '@/lib/types';

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ??
  (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000');

const NAME = 'Myo Myat Thiha';

export default function JsonLd({ projects }: { projects: Project[] }) {
  const sameAs = [
    process.env.NEXT_PUBLIC_LINKEDIN_URL,
    process.env.NEXT_PUBLIC_GITHUB_URL,
  ].filter((u): u is string => Boolean(u));

  const graph: Record<string, unknown>[] = [
    {
      '@type': 'Person',
      '@id': `${SITE_URL}/#person`,
      name: NAME,
      url: SITE_URL,
      jobTitle: 'Full-Stack Developer',
      ...(sameAs.length ? { sameAs } : {}),
    },
    {
      '@type': 'WebSite',
      '@id': `${SITE_URL}/#website`,
      url: SITE_URL,
      name: `${NAME} — Full-Stack Developer`,
      author: { '@id': `${SITE_URL}/#person` },
    },
    {
      '@type': 'ItemList',
      name: 'Projects',
      itemListElement: projects.map((p, i) => ({
        '@type': 'ListItem',
        position: i + 1,
        item: {
          '@type': 'CreativeWork',
          name: p.title,
          description: p.shortDesc,
          ...(p.deployedURL || p.githubURL ? { url: p.deployedURL ?? p.githubURL } : {}),
        },
      })),
    },
  ];

  const json = { '@context': 'https://schema.org', '@graph': graph };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(json) }}
    />
  );
}
