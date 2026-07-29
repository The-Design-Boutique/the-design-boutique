import { defineArrayMember, defineField, defineType } from 'sanity'
import { AiKeyInput, AiModelInput } from '../../components/AiAssistInputs'
import { makeEncryptedKeyInput } from '../../components/EncryptedKeyInput'

/** Global site configuration (singleton). One document, pinned in the desk. */
export const siteSettings = defineType({
  name: 'siteSettings',
  title: 'Site Settings',
  type: 'document',
  groups: [
    { name: 'general', title: 'General', default: true },
    { name: 'contact', title: 'Contact' },
    { name: 'social', title: 'Social' },
    { name: 'seo', title: 'SEO & Analytics' },
    { name: 'privacy', title: 'Cookies & privacy' },
    { name: 'blog', title: 'Blog' },
    { name: 'ai', title: 'Writing assistant' },
    { name: 'forms', title: 'Forms' },
  ],
  fields: [
    defineField({ name: 'siteName', title: 'Site name', type: 'string', group: 'general', initialValue: 'The Design Boutique' }),
    defineField({ name: 'logo', title: 'Logo', type: 'imageWithAlt', group: 'general' }),
    defineField({ name: 'logoSecondary', title: 'Secondary logo', type: 'imageWithAlt', group: 'general', description: 'Shown beside the primary logo in the header (the "TDB Digital" mark).' }),
    defineField({ name: 'footerLogo', title: 'Footer logo', type: 'imageWithAlt', group: 'general', description: 'The compact square mark used in the footer.' }),
    defineField({ name: 'googleBadgeUrl', title: 'Google reviews badge URL', type: 'url', group: 'general', description: 'SVG badge shown in the footer social row.' }),
    defineField({ name: 'phone', title: 'Phone', type: 'string', group: 'contact' }),
    defineField({ name: 'email', title: 'Email', type: 'string', group: 'contact' }),
    defineField({ name: 'address', title: 'Address', type: 'text', rows: 3, group: 'contact' }),
    defineField({
      name: 'socialLinks',
      title: 'Social links',
      type: 'array',
      group: 'social',
      of: [
        defineArrayMember({
          type: 'object',
          name: 'socialLink',
          fields: [
            defineField({ name: 'platform', title: 'Platform', type: 'string' }),
            defineField({ name: 'url', title: 'URL', type: 'url' }),
          ],
          preview: { select: { title: 'platform', subtitle: 'url' } },
        }),
      ],
    }),
    defineField({
      name: 'defaultShareImage',
      title: 'Default social share image',
      type: 'image',
      group: 'seo',
      options: { hotspot: true },
      description: 'Used when a page has no share image of its own. Recommended 1200 x 630.',
    }),
    defineField({
      name: 'gtmId',
      title: 'Google Tag Manager ID',
      type: 'string',
      group: 'seo',
      description:
        'For example GTM-XXXXXX. Leave empty and no tracking of any kind is loaded. Anything you add inside Tag Manager runs on every page of this site, so it is worth keeping the container sparse: this site is fast, and tracking is the usual reason a site stops being fast.',
      validation: (rule) =>
        rule.custom((value) => {
          if (!value) return true
          // Catching the shape here is kinder than a container that silently
          // never fires because somebody pasted a GA id or the whole snippet.
          return /^GTM-[A-Z0-9]+$/i.test(value.trim())
            ? true
            : 'A Tag Manager ID looks like GTM-XXXXXX. A GA4 id (G-XXXX) goes inside Tag Manager, not here.'
        }),
    }),
    defineField({
      name: 'gtmOnPreview',
      title: 'Also load it on the preview site',
      type: 'boolean',
      group: 'seo',
      initialValue: false,
      description:
        'Off by default, and worth leaving off. While this build is a preview, loading Tag Manager here would record our own testing as if it were real visitors, and that cannot be cleaned out of the figures afterwards. Turn it on only to check the container is firing, then turn it off again. At go-live this setting stops mattering.',
    }),
    // The cookie banner and what it actually enforces.
    //
    // Worth knowing what this is before changing anything in it: the banner is
    // the visible part, but the work happens underneath. Nothing on the list of
    // known tracking tools is allowed to load at all until somebody agrees to
    // the category it belongs to, whether it was added through Tag Manager or
    // pasted into a page. Turning the banner off turns that enforcement off too.
    defineField({
      name: 'privacy',
      title: 'Cookie banner',
      type: 'object',
      group: 'privacy',
      options: { collapsible: false },
      description:
        'Asks visitors what tracking they will accept, and holds everything non-essential until they answer. The same logic used on the WordPress sites.',
      fields: [
        defineField({
          name: 'enabled',
          title: 'Show the cookie banner',
          type: 'boolean',
          initialValue: true,
          description:
            'When this is off there is no banner and no blocking, so anything in Tag Manager runs for everybody immediately. Only appropriate if the site loads no tracking at all.',
        }),
        defineField({
          name: 'heading',
          title: 'Banner heading',
          type: 'string',
          initialValue: 'Your privacy choices',
        }),
        defineField({
          name: 'body',
          title: 'Banner text',
          type: 'text',
          rows: 3,
          description:
            'Leave empty to use the standard wording, which explains that nothing non-essential runs until they choose.',
        }),
        defineField({
          name: 'policyVersion',
          title: 'Policy version',
          type: 'number',
          initialValue: 1,
          description:
            'The one setting worth understanding. Every visitor’s answer is stored against the number that was here when they gave it. Raise it by one and everybody is asked again, which is what you do after changing what the site collects. Nothing else re-asks them.',
          validation: (rule) => rule.min(1).integer(),
        }),
        defineField({
          name: 'cookieDays',
          title: 'Remember their answer for (days)',
          type: 'number',
          initialValue: 180,
          description: 'After this many days they are asked again. Six months is the usual choice.',
          validation: (rule) => rule.min(1).max(730).integer(),
        }),
        defineField({
          name: 'honorGpc',
          title: 'Honour the browser’s own privacy signal',
          type: 'boolean',
          initialValue: true,
          description:
            'Some browsers send a "do not sell or share my information" signal on the visitor’s behalf. California, Colorado and Connecticut require that signal to be obeyed, so leave this on. Advertising stays off for those visitors even if they click Accept all.',
        }),
        defineField({
          name: 'offerSessionRecording',
          title: 'Offer the session recording category',
          type: 'boolean',
          initialValue: true,
          description:
            'Tools that record what a visitor did on the page, such as Hotjar or Microsoft Clarity. Leave the category listed even if none is in use: if one is ever added it is blocked by default rather than silently allowed. Turning this off hides the choice, and those tools stay blocked for everyone.',
        }),
        defineField({
          name: 'privacyPolicyUrl',
          title: 'Privacy policy link',
          type: 'string',
          description: 'Shown in the banner. A path such as /privacy-policy, or a full address.',
        }),
        defineField({
          name: 'cookiePolicyUrl',
          title: 'Cookie policy link',
          type: 'string',
          description: 'Optional. Shown beside the privacy policy link when set.',
        }),
        defineField({
          name: 'linkText',
          title: 'Footer link wording',
          type: 'string',
          initialValue: 'Your Privacy Choices',
          description:
            'The permanent link that reopens this. California expects an opt-out to stay reachable, not to disappear once the banner is dismissed.',
        }),
        defineField({
          name: 'extraBlocklist',
          title: 'Additional tools to block',
          type: 'text',
          rows: 4,
          description:
            'Only needed for something the site starts using that is not already recognised. One per line, as address = category, for example widget.example.com = functional. Categories: analytics, advertising, functional, session_replay.',
        }),
        defineField({
          name: 'healthIntentPaths',
          title: 'Pages that collect health information',
          type: 'array',
          of: [{ type: 'string' }],
          description:
            'One path per line, such as /health-enquiry. On these pages no advertising, analytics or recording runs at all, whatever the visitor previously agreed to, and Tag Manager is not loaded. Leave empty unless a form genuinely asks about health, which for this site it probably does not.',
        }),
      ],
    }),
    // The promo card shown in the sidebar of every blog post.
    defineField({ name: 'blogEyebrow', title: 'Blog eyebrow', type: 'string', group: 'blog', initialValue: 'The Design Boutique', description: 'Small line above the blog name on post pages.' }),
    defineField({ name: 'blogName', title: 'Blog name', type: 'string', group: 'blog', initialValue: 'Laney Said' }),
    defineField({ name: 'postSidebarHeading', title: 'Post sidebar heading', type: 'text', rows: 2, group: 'blog', description: 'Shown at the top of the promo card on every post. Line breaks are kept.' }),
    defineField({ name: 'postSidebarItems', title: 'Post sidebar items', type: 'array', of: [{ type: 'text', rows: 2 }], group: 'blog', description: 'One line per service, e.g. "SEO: Drive Explosive Traffic & Real Results."' }),
    defineField({ name: 'postSidebarCta', title: 'Post sidebar button', type: 'link', group: 'blog' }),
    defineField({ name: 'relatedHeading', title: 'Related posts heading', type: 'string', group: 'blog', initialValue: 'More from The Design Boutique Blog' }),
    // How notification emails physically leave the site.
    //
    // A website cannot send email by itself; it has to hand the message to a
    // service that does. Resend is that service here. Until a key is saved,
    // every form still works and every submission is still stored, but nobody
    // is emailed about it. That failure is silent by nature, which is why it is
    // spelled out on this field, on the form's own Notifications tab, and in
    // the submission record itself.
    defineField({
      name: 'emailDelivery',
      title: 'Sending email (Resend)',
      type: 'object',
      group: 'forms',
      options: { collapsible: false },
      description:
        'Required before any form can email anyone. Without a key here, submissions are still saved and can still be read under Form Submissions, but no notification is sent and nothing warns the person who filled the form in. Resend is free for the volumes this site sends.',
      fields: [
        defineField({
          name: 'key',
          title: 'Resend API key',
          type: 'object',
          components: {
            input: makeEncryptedKeyInput({
              service: 'resend',
              serviceLabel: 'Resend',
              signupUrl: 'https://resend.com/signup',
            }),
          },
          description: 'Stored encrypted. Only the first few characters are ever shown again.',
          fields: [
            defineField({ name: 'ciphertext', type: 'string', readOnly: true }),
            defineField({ name: 'hint', type: 'string', readOnly: true }),
            defineField({ name: 'updatedAt', type: 'datetime', readOnly: true }),
          ],
        }),
        defineField({
          name: 'fromEmail',
          title: 'Send notifications from',
          type: 'string',
          description:
            'The address these emails appear to come from, such as website@thedesignboutique.com. It does not need to be a real inbox, but the part after the @ must be a domain verified inside Resend, otherwise the emails will be refused. The Resend setup guide covers verifying the domain.',
          validation: (rule) =>
            rule.custom((value) => {
              if (!value) return true
              return /^[^@\s]+@[^@\s.]+\.[^@\s]+$/.test(value) ? true : 'That does not look like an email address.'
            }),
        }),
        defineField({
          name: 'fromName',
          title: 'Sender name',
          type: 'string',
          initialValue: 'The Design Boutique',
          description: 'The name shown in the inbox beside the address above.',
        }),
        defineField({
          name: 'replyTo',
          title: 'Replies go to',
          type: 'string',
          description:
            'Optional. If set, hitting reply on a notification writes to this address instead of the sending address above.',
          validation: (rule) =>
            rule.custom((value) => {
              if (!value) return true
              return /^[^@\s]+@[^@\s.]+\.[^@\s]+$/.test(value) ? true : 'That does not look like an email address.'
            }),
        }),
      ],
    }),
    // Optional form verification services. Both are off unless a key is saved,
    // and a form works normally without them: the difference is whether a typo
    // in an email or phone number is caught at the point of entry.
    defineField({
      name: 'formVerification',
      title: 'Checking email addresses and phone numbers',
      type: 'object',
      group: 'forms',
      options: { collapsible: false },
      description:
        'Optional paid services that check whether an address or number is real before a form is submitted, which cuts down on junk enquiries. Forms already check that what was typed looks correct; these check that it actually exists. Leave both empty to skip this entirely.',
      fields: [
        defineField({
          name: 'mailverify',
          title: 'MailVerify (email addresses)',
          type: 'object',
          components: {
            input: makeEncryptedKeyInput({ service: 'mailverify', serviceLabel: 'MailVerify', signupUrl: 'https://mailverify.ai' }),
          },
          fields: [
            defineField({ name: 'ciphertext', type: 'string', readOnly: true }),
            defineField({ name: 'hint', type: 'string', readOnly: true }),
            defineField({ name: 'updatedAt', type: 'datetime', readOnly: true }),
          ],
        }),
        defineField({
          name: 'numverify',
          title: 'NumVerify (phone numbers)',
          type: 'object',
          components: {
            input: makeEncryptedKeyInput({ service: 'numverify', serviceLabel: 'NumVerify', signupUrl: 'https://numverify.com' }),
          },
          fields: [
            defineField({ name: 'ciphertext', type: 'string', readOnly: true }),
            defineField({ name: 'hint', type: 'string', readOnly: true }),
            defineField({ name: 'updatedAt', type: 'datetime', readOnly: true }),
          ],
        }),
      ],
    }),
    // Optional AI writing assistance. The SEO checks and readability panel are
    // always on and cost nothing; everything in this group is additive, off by
    // default, and billed to whichever account the key belongs to.
    defineField({
      name: 'aiAssist',
      title: 'Writing assistant',
      type: 'object',
      group: 'ai',
      description:
        'Adds an optional "Suggest" button to the SEO panel that can draft a meta description or tighten a paragraph. The SEO score and readability checks do not use this and keep working whether it is on or off.',
      options: { collapsible: false },
      fields: [
        defineField({
          name: 'enabled',
          title: 'Turn the Suggest button on',
          type: 'boolean',
          initialValue: false,
          description: 'Off by default. Nothing is ever sent to a provider, and nothing is billed, until this is on and a key is saved.',
        }),
        defineField({
          name: 'provider',
          title: 'Provider',
          type: 'string',
          initialValue: 'anthropic',
          description: 'Use whichever account you already have. The two are interchangeable here.',
          options: {
            list: [
              { title: 'Anthropic (Claude)', value: 'anthropic' },
              { title: 'OpenAI', value: 'openai' },
            ],
            layout: 'radio',
          },
        }),
        defineField({
          name: 'model',
          title: 'Model',
          type: 'string',
          initialValue: 'claude-opus-5',
          components: { input: AiModelInput },
        }),
        defineField({
          name: 'key',
          title: 'API key',
          type: 'object',
          components: { input: AiKeyInput },
          description: 'Stored encrypted. Only the first few characters are ever shown again.',
          fields: [
            // Written by the key field's own controls, never typed into directly.
            defineField({ name: 'ciphertext', title: 'Encrypted key', type: 'string', readOnly: true }),
            defineField({ name: 'hint', title: 'Masked key', type: 'string', readOnly: true }),
            defineField({ name: 'updatedAt', title: 'Last updated', type: 'datetime', readOnly: true }),
          ],
        }),
      ],
    }),
  ],
  preview: { prepare: () => ({ title: 'Site Settings' }) },
})
