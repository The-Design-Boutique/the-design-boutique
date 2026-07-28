import { defineField, defineType } from 'sanity'

/**
 * Cached Google-sourced SEO data for one URL (SOW 2.3, ruleset 03 rule 7).
 *
 * Written by the daily cron, read by the SEO panel. The Studio never calls
 * Google directly, so no API key is ever exposed to a browser, and opening the
 * panel costs nothing and waits for nothing.
 *
 * One document per URL, replaced in place each day, so the dataset does not
 * grow without limit. The in-CMS checks are not stored here: they run live in
 * the editor because they are instant and free.
 */
export const seoAudit = defineType({
  name: 'seoAudit',
  title: 'SEO Audit',
  type: 'document',
  readOnly: true,
  fields: [
    defineField({ name: 'url', title: 'URL', type: 'string' }),
    defineField({ name: 'path', title: 'Path', type: 'string', description: 'The site-relative path, used to match this to a document.' }),
    defineField({
      name: 'scope',
      title: 'Scope',
      type: 'string',
      options: { list: [{ title: 'One page', value: 'page' }, { title: 'Whole site', value: 'site' }] },
      initialValue: 'page',
    }),
    defineField({ name: 'fetchedAt', title: 'Last successful check', type: 'datetime' }),
    defineField({ name: 'lastAttemptAt', title: 'Last attempted', type: 'datetime' }),

    // --- Lighthouse (technical) ---
    defineField({ name: 'lighthouseSeoScore', title: 'Lighthouse SEO score', type: 'number' }),
    defineField({ name: 'lighthouseAccessibilityScore', title: 'Lighthouse accessibility score', type: 'number' }),
    defineField({ name: 'lighthouseBestPracticesScore', title: 'Lighthouse best practices score', type: 'number' }),
    defineField({ name: 'lighthousePerformanceScore', title: 'Lighthouse performance score', type: 'number' }),
    defineField({
      name: 'lighthouseFailures',
      title: 'Failing Lighthouse audits',
      type: 'array',
      of: [
        {
          type: 'object',
          name: 'audit',
          fields: [
            defineField({ name: 'id', title: 'Audit id', type: 'string' }),
            defineField({ name: 'title', title: 'Title', type: 'string' }),
            defineField({ name: 'description', title: 'Description', type: 'text', rows: 2 }),
            defineField({ name: 'category', title: 'Category', type: 'string' }),
          ],
          preview: { select: { title: 'title', subtitle: 'category' } },
        },
      ],
    }),
    defineField({ name: 'lighthouseError', title: 'Lighthouse error', type: 'string' }),

    // --- Search Console (search presence) ---
    defineField({
      name: 'indexStatus',
      title: 'Indexing status',
      type: 'string',
      description: 'What Google reports for this URL, verbatim.',
    }),
    defineField({ name: 'indexVerdict', title: 'Verdict', type: 'string' }),
    defineField({ name: 'lastCrawledAt', title: 'Last crawled by Google', type: 'datetime' }),
    defineField({ name: 'robotsState', title: 'Robots state', type: 'string' }),
    defineField({ name: 'canonicalGoogle', title: 'Canonical Google chose', type: 'string' }),
    defineField({ name: 'clicks', title: 'Clicks (28 days)', type: 'number' }),
    defineField({ name: 'impressions', title: 'Impressions (28 days)', type: 'number' }),
    defineField({ name: 'position', title: 'Average position', type: 'number' }),
    defineField({
      name: 'topQueries',
      title: 'Top queries',
      type: 'array',
      of: [
        {
          type: 'object',
          name: 'query',
          fields: [
            defineField({ name: 'query', title: 'Query', type: 'string' }),
            defineField({ name: 'clicks', title: 'Clicks', type: 'number' }),
            defineField({ name: 'impressions', title: 'Impressions', type: 'number' }),
            defineField({ name: 'position', title: 'Position', type: 'number' }),
          ],
          preview: {
            select: { title: 'query', clicks: 'clicks', position: 'position' },
            prepare: ({ title, clicks, position }) => ({
              title,
              subtitle: `${clicks || 0} clicks, position ${position ? position.toFixed(1) : 'n/a'}`,
            }),
          },
        },
      ],
    }),
    defineField({ name: 'searchConsoleError', title: 'Search Console error', type: 'string' }),

    // --- Site-wide crawl findings (ruleset 03, rule 8) ---
    defineField({
      name: 'siteIssues',
      title: 'Site-wide issues',
      type: 'array',
      of: [
        {
          type: 'object',
          name: 'siteIssue',
          fields: [
            defineField({ name: 'id', title: 'Id', type: 'string' }),
            defineField({ name: 'title', title: 'Title', type: 'string' }),
            defineField({ name: 'detail', title: 'Detail', type: 'text', rows: 2 }),
            defineField({ name: 'severity', title: 'Severity', type: 'string' }),
          ],
          preview: { select: { title: 'title', subtitle: 'detail' } },
        },
      ],
    }),
  ],
  orderings: [{ name: 'recent', title: 'Most recent', by: [{ field: 'fetchedAt', direction: 'desc' }] }],
  preview: {
    select: { path: 'path', at: 'fetchedAt', seo: 'lighthouseSeoScore', verdict: 'indexVerdict' },
    prepare: ({ path, at, seo, verdict }) => ({
      title: path || 'Audit',
      subtitle: [seo != null ? `SEO ${seo}` : null, verdict, at ? new Date(at).toLocaleDateString() : null]
        .filter(Boolean)
        .join(' · '),
    }),
  },
})
