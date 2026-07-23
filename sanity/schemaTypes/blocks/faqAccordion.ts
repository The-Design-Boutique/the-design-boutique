import { defineArrayMember, defineField, defineType } from 'sanity'

export const faqAccordion = defineType({
  name: 'faqAccordion',
  title: 'FAQ Accordion',
  type: 'object',
  fields: [
    defineField({ name: 'eyebrow', title: 'Eyebrow', type: 'string' }),
    defineField({ name: 'heading', title: 'Heading', type: 'string' }),
    defineField({
      name: 'faqs',
      title: 'Questions',
      type: 'array',
      of: [
        defineArrayMember({
          type: 'object',
          name: 'faq',
          fields: [
            defineField({ name: 'question', title: 'Question', type: 'string', validation: (Rule) => Rule.required() }),
            defineField({ name: 'answer', title: 'Answer', type: 'array', of: [defineArrayMember({ type: 'block' })] }),
          ],
          preview: { select: { title: 'question' } },
        }),
      ],
    }),
    defineField({ name: 'settings', title: 'Section settings', type: 'sectionSettings' }),
  ],
  preview: {
    select: { title: 'heading', faqs: 'faqs' },
    prepare: ({ title, faqs }) => ({ title: title || 'FAQ', subtitle: `${Array.isArray(faqs) ? faqs.length : 0} question(s)` }),
  },
})
