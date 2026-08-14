import type { APIRoute, GetStaticPaths } from 'astro';
import { getCollection } from 'astro:content';
import { renderOgImage } from '../../lib/og';
import { business, council } from '../../lib/business';
import { band, weeks } from '../../lib/format';

/**
 * One sharing image per project, plus one for each main page, generated as
 * real files at build time. Nothing is rendered on demand.
 */

export const getStaticPaths = (async () => {
  const projects = await getCollection('projects', (p) => !p.data.draft);

  const projectCards = projects.map((project) => {
    const d = project.data;
    return {
      params: { slug: project.id },
      props: {
        title: d.title,
        eyebrow: `${council(d.council).name} · ${d.houseType}, ${d.eraBuilt}`,
        facts: [
          { label: 'Cost band', value: band(d.costBand.low, d.costBand.high) },
          { label: 'On site', value: weeks([d.durationWeeks, d.durationWeeks]) },
          {
            label: 'Approval',
            value:
              d.approvalPath === 'cdc' ? 'CDC' : d.approvalPath === 'da' ? 'DA' : 'None needed',
          },
        ],
      },
    };
  });

  const pageCards = [
    {
      params: { slug: 'home' },
      props: {
        title: 'Fixed price before demolition starts',
        eyebrow: 'Renovation builder · Sydney',
        facts: [
          {
            label: 'We work between',
            value: band(business.projectValue.minimum, business.projectValue.maximum),
          },
          { label: 'Suburbs', value: String(business.serviceArea.suburbs.length) },
          { label: 'Councils', value: String(business.councils.length) },
        ],
      },
    },
    {
      params: { slug: 'costs' },
      props: {
        title: 'What a renovation actually costs',
        eyebrow: 'Published cost bands · GST inclusive',
        facts: business.costBands.bands.slice(0, 3).map((b) => ({
          label: b.name,
          value: band(b.low, b.high),
        })),
      },
    },
    {
      params: { slug: 'approvals' },
      props: {
        title: 'When you need council, and when you do not',
        eyebrow: 'Approvals explainer · New South Wales',
        facts: [
          { label: 'Exempt', value: 'No approval' },
          { label: 'Complying', value: '3–6 weeks' },
          { label: 'Development app', value: '10–20 weeks' },
        ],
      },
    },
    {
      params: { slug: 'process' },
      props: {
        title: 'Eleven stages, and what you own at each',
        eyebrow: 'How a renovation runs',
        facts: [
          { label: 'Stages', value: String(business.process.stages.length) },
          { label: 'First call', value: '20 minutes' },
          { label: 'Defects period', value: `${business.credentials.warranty.defectsYears} years` },
        ],
      },
    },
  ];

  return [...projectCards, ...pageCards];
}) satisfies GetStaticPaths;

export const GET: APIRoute = async ({ props }) => {
  const png = await renderOgImage(props as Parameters<typeof renderOgImage>[0]);
  return new Response(new Uint8Array(png), {
    headers: {
      'Content-Type': 'image/png',
      'Cache-Control': 'public, max-age=31536000, immutable',
    },
  });
};
