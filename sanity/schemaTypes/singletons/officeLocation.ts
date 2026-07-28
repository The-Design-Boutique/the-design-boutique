import { defineArrayMember, defineField, defineType } from 'sanity'

/**
 * The office details used for local search (SOW 2.5, section 6).
 *
 * Held as structured fields rather than hand-written code, so the Local
 * Business information sent to Google is assembled from these and can never
 * drift out of sync with what the site says.
 */
export const officeLocation = defineType({
  name: 'officeLocation',
  title: 'Office & Local SEO',
  type: 'document',
  groups: [
    { name: 'address', title: 'Address', default: true },
    { name: 'contact', title: 'Contact' },
    { name: 'hours', title: 'Opening hours' },
    { name: 'profiles', title: 'Profiles' },
  ],
  fields: [
    defineField({ name: 'name', title: 'Business name', type: 'string', group: 'address', initialValue: 'The Design Boutique' }),
    defineField({ name: 'streetAddress', title: 'Street address', type: 'string', group: 'address' }),
    defineField({ name: 'addressLocality', title: 'City', type: 'string', group: 'address' }),
    defineField({ name: 'addressRegion', title: 'State', type: 'string', group: 'address' }),
    defineField({ name: 'postalCode', title: 'ZIP code', type: 'string', group: 'address' }),
    defineField({ name: 'addressCountry', title: 'Country', type: 'string', group: 'address', initialValue: 'US' }),
    defineField({ name: 'latitude', title: 'Latitude', type: 'number', group: 'address', description: 'Optional. Helps map results place the business precisely.' }),
    defineField({ name: 'longitude', title: 'Longitude', type: 'number', group: 'address' }),

    defineField({ name: 'phone', title: 'Phone', type: 'string', group: 'contact' }),
    defineField({ name: 'email', title: 'Email', type: 'string', group: 'contact' }),
    defineField({ name: 'priceRange', title: 'Price range', type: 'string', group: 'contact', description: 'Shown by Google as a rough guide, e.g. $$ or $$$.' }),

    defineField({
      name: 'openingHours',
      title: 'Opening hours',
      type: 'array',
      group: 'hours',
      description: 'One row per day or group of days.',
      of: [
        defineArrayMember({
          type: 'object',
          name: 'hoursRow',
          fields: [
            defineField({
              name: 'days', title: 'Days', type: 'array',
              of: [{ type: 'string' }],
              options: {
                list: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
              },
            }),
            defineField({ name: 'opens', title: 'Opens', type: 'string', description: '24-hour, e.g. 09:00' }),
            defineField({ name: 'closes', title: 'Closes', type: 'string', description: '24-hour, e.g. 17:30' }),
          ],
          preview: {
            select: { days: 'days', opens: 'opens', closes: 'closes' },
            prepare: ({ days, opens, closes }) => ({
              title: Array.isArray(days) ? days.join(', ') : 'Days',
              subtitle: opens && closes ? `${opens} to ${closes}` : undefined,
            }),
          },
        }),
      ],
    }),

    defineField({
      name: 'sameAs',
      title: 'Profile links',
      type: 'array',
      group: 'profiles',
      description: 'Links to the business elsewhere: Google Business Profile, LinkedIn, Facebook, Instagram. Helps Google connect them to this site.',
      of: [{ type: 'url' }],
    }),
  ],
  preview: { prepare: () => ({ title: 'Office & Local SEO' }) },
})
