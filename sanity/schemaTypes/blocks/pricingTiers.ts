import { defineArrayMember, defineField, defineType } from 'sanity'

/** Program pricing tiers (Argenti / Bronzo / Oro): metal-named cards with a full feature list. */
export const pricingTiers = defineType({
  name: 'pricingTiers',
  title: 'Pricing Tiers',
  type: 'object',
  fields: [
    defineField({ name: 'eyebrow', title: 'Eyebrow', type: 'string' }),
    defineField({ name: 'heading', title: 'Heading', type: 'string' }),
    defineField({
      name: 'tiers',
      title: 'Tiers',
      type: 'array',
      of: [
        defineArrayMember({
          type: 'object',
          name: 'tier',
          fields: [
            defineField({ name: 'name', title: 'Name', type: 'string' }),
            defineField({ name: 'metal', title: 'Metal color', type: 'string', options: { list: ['silver', 'bronze', 'gold'] } }),
            defineField({ name: 'goal', title: 'Goal', type: 'string' }),
            defineField({ name: 'who', title: 'Who', type: 'string' }),
            defineField({ name: 'pace', title: 'Pace', type: 'string' }),
            defineField({ name: 'caseStudyLabel', title: 'Case study label', type: 'string' }),
            defineField({ name: 'caseStudyHref', title: 'Case study link', type: 'string' }),
            defineField({ name: 'features', title: 'Features (one per line)', type: 'array', of: [defineArrayMember({ type: 'string' })] }),
            defineField({ name: 'cta', title: 'Button', type: 'link' }),
          ],
          preview: { select: { title: 'name', subtitle: 'goal' } },
        }),
      ],
    }),
    defineField({ name: 'settings', title: 'Section settings', type: 'sectionSettings' }),
  ],
  preview: {
    select: { title: 'heading', items: 'tiers' },
    prepare: ({ title, items }) => ({ title: title || 'Pricing tiers', subtitle: `${Array.isArray(items) ? items.length : 0} tiers` }),
  },
})
