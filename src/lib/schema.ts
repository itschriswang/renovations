import { business, council } from './business';
import type { CollectionEntry } from 'astro:content';

/**
 * Structured data.
 *
 * Everything here is generated from business.yaml and the content collections,
 * so the markup cannot claim something the visible page does not — which is
 * both the rule Google applies and the honest way round.
 *
 * PLACEHOLDER: the licence number, ABN, address, coordinates, phone and review
 * figures are all invented. Structured data is machine-readable and gets
 * cached, so publishing these before they are real is worse than publishing
 * them in body copy.
 */

const site = business.site.url;
const id = (path: string) => `${site}${path}`;

export function organisationSchema() {
  return {
    '@type': 'GeneralContractor',
    '@id': id('/#organisation'),
    name: business.identity.name,
    legalName: business.identity.legalName,
    description: business.identity.positioning,
    url: site,
    telephone: business.contact.phoneLink,
    email: business.contact.email,
    slogan: business.identity.differentiator,
  };
}

export function localBusinessSchema() {
  const { address, geo, hours } = business.contact;

  return {
    ...organisationSchema(),
    '@type': ['GeneralContractor', 'LocalBusiness'],
    address: {
      '@type': 'PostalAddress',
      streetAddress: address.street,
      addressLocality: address.suburb,
      addressRegion: address.state,
      postalCode: address.postcode,
      addressCountry: address.country,
    },
    geo: {
      '@type': 'GeoCoordinates',
      latitude: geo.latitude,
      longitude: geo.longitude,
    },
    openingHoursSpecification: hours.map((h) => ({
      '@type': 'OpeningHoursSpecification',
      dayOfWeek: expandDays(h.days),
      opens: h.opens,
      closes: h.closes,
    })),
    areaServed: business.serviceArea.suburbs.map((s) => ({
      '@type': 'Place',
      name: `${s.name}, NSW ${s.postcode}`,
    })),
    priceRange: `$${business.projectValue.minimum / 1000}k–$${business.projectValue.maximum / 1000}k`,
    // aggregateRating is deliberately omitted. It is only added once
    // reviews.googleReviewCount is a real number — a fabricated rating in
    // structured data is a manual-action risk, not just bad manners.
    ...(business.reviews.googleReviewCount > 0
      ? {
          aggregateRating: {
            '@type': 'AggregateRating',
            ratingValue: business.reviews.googleRating,
            reviewCount: business.reviews.googleReviewCount,
          },
        }
      : {}),
  };
}

function expandDays(label: string): string[] {
  const names = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const range = label.match(/^(\w+) to (\w+)$/);
  if (range) {
    const from = names.indexOf(range[1]!);
    const to = names.indexOf(range[2]!);
    if (from >= 0 && to >= from) return names.slice(from, to + 1);
  }
  const single = names.find((n) => label.includes(n));
  return single ? [single] : [];
}

export function websiteSchema() {
  return {
    '@type': 'WebSite',
    '@id': id('/#website'),
    url: site,
    name: business.identity.name,
    inLanguage: 'en-AU',
    publisher: { '@id': id('/#organisation') },
  };
}

export function breadcrumbSchema(trail: { name: string; path: string }[]) {
  return {
    '@type': 'BreadcrumbList',
    itemListElement: trail.map((item, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: item.name,
      item: id(item.path),
    })),
  };
}

export function faqSchema(faqs: { question: string; answer: string }[]) {
  return {
    '@type': 'FAQPage',
    mainEntity: faqs.map((f) => ({
      '@type': 'Question',
      name: f.question,
      acceptedAnswer: { '@type': 'Answer', text: f.answer },
    })),
  };
}

export function projectSchema(project: CollectionEntry<'projects'>, path: string) {
  const d = project.data;
  return {
    '@type': 'Article',
    '@id': id(path),
    headline: d.title,
    description: d.description,
    datePublished: d.publishDate.toISOString().slice(0, 10),
    author: { '@id': id('/#organisation') },
    publisher: { '@id': id('/#organisation') },
    about: {
      '@type': 'Service',
      serviceType: d.projectType,
      provider: { '@id': id('/#organisation') },
      areaServed: { '@type': 'Place', name: d.council },
    },
  };
}

export function suburbSchema(suburb: CollectionEntry<'suburbs'>, path: string) {
  const c = council(suburb.data.council);
  return {
    '@type': 'WebPage',
    '@id': id(path),
    name: `Renovation builder, ${suburb.data.name}`,
    description: suburb.data.description,
    about: {
      '@type': 'Place',
      name: `${suburb.data.name}, NSW ${suburb.data.postcode}`,
      containedInPlace: { '@type': 'AdministrativeArea', name: c.name },
    },
    isPartOf: { '@id': id('/#website') },
  };
}

/** Published cost bands, as offers. Only ever the figures shown on the page. */
export function offerCatalogSchema() {
  return {
    '@type': 'OfferCatalog',
    name: 'Renovation cost bands',
    itemListElement: business.costBands.bands.map((b) => ({
      '@type': 'Offer',
      name: b.name,
      description: b.summary,
      priceSpecification: {
        '@type': 'PriceSpecification',
        minPrice: b.low,
        maxPrice: b.high,
        priceCurrency: 'AUD',
        valueAddedTaxIncluded: business.costBands.gstInclusive,
      },
    })),
  };
}
