import { defineField, defineType } from 'sanity'

/**
 * One immutable reading of Core Web Vitals for a target (origin or URL) and
 * form factor, taken from the Chrome UX Report. Written by the daily collection
 * route and never edited by hand: the dashboard and the trend chart both read
 * from these. See docs/02-ruleset-cwv-dashboard.md.
 */
export const cwvSnapshot = defineType({
  name: 'cwvSnapshot',
  title: 'Core Web Vitals Snapshot',
  type: 'document',
  readOnly: true,
  fields: [
    defineField({
      name: 'source', title: 'Source', type: 'string', initialValue: 'field',
      description: 'Field = real visitors via the Chrome UX Report. Lab = a simulated test via PageSpeed Insights.',
      options: { list: [{ title: 'Real visitors (field)', value: 'field' }, { title: 'Lab test', value: 'lab' }] },
    }),
    defineField({ name: 'target', title: 'Target', type: 'string', description: 'The origin or page URL this reading is for.' }),
    defineField({
      name: 'scope', title: 'Scope', type: 'string',
      options: { list: [{ title: 'Whole site (origin)', value: 'origin' }, { title: 'Single page (URL)', value: 'url' }] },
    }),
    defineField({
      name: 'formFactor', title: 'Device', type: 'string',
      options: { list: [{ title: 'Phone', value: 'PHONE' }, { title: 'Desktop', value: 'DESKTOP' }] },
    }),
    // Values are the 75th percentile, which is what CrUX reports and what
    // Google's thresholds are defined against.
    defineField({ name: 'lcp', title: 'LCP (ms)', type: 'number' }),
    defineField({ name: 'inp', title: 'INP (ms)', type: 'number' }),
    defineField({ name: 'cls', title: 'CLS', type: 'number' }),
    defineField({ name: 'lcpBand', title: 'LCP band', type: 'string' }),
    defineField({ name: 'inpBand', title: 'INP band', type: 'string' }),
    defineField({ name: 'clsBand', title: 'CLS band', type: 'string' }),
    defineField({ name: 'periodStart', title: 'Collection period start', type: 'date' }),
    defineField({ name: 'periodEnd', title: 'Collection period end', type: 'date' }),
    defineField({ name: 'fetchedAt', title: 'Fetched at', type: 'datetime' }),
    defineField({ name: 'hasData', title: 'Had data', type: 'boolean', description: 'False when CrUX has no reading for this target yet.' }),
    defineField({ name: 'seeded', title: 'Seeded from history', type: 'boolean', description: 'True for the backfilled weekly points from the CrUX History API.' }),
    // Lab-only. Never used for the pass/fail bands, which are field data only.
    defineField({ name: 'performanceScore', title: 'Lighthouse performance score', type: 'number', description: 'Lab runs only, 0 to 100.' }),
    defineField({ name: 'tbt', title: 'Total Blocking Time (ms)', type: 'number', description: 'Lab stand-in for responsiveness; INP cannot be measured in a lab.' }),
    defineField({ name: 'error', title: 'Error', type: 'string' }),
  ],
  preview: {
    select: { target: 'target', ff: 'formFactor', when: 'periodEnd', has: 'hasData', source: 'source', fetched: 'fetchedAt' },
    prepare: ({ target, ff, when, has, source, fetched }) => ({
      title: `${source === 'lab' ? 'Lab' : 'Real visitors'}: ${target} (${ff === 'DESKTOP' ? 'desktop' : 'phone'})`,
      subtitle: has === false ? 'no data' : when || (fetched || '').slice(0, 10),
    }),
  },
})
