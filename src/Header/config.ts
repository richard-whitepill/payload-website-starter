import type { GlobalConfig } from 'payload'

export const Header: GlobalConfig = {
  slug: 'header',
  access: {
    read: () => true,
  },
  fields: [
    {
      name: 'navItems',
      type: 'array',
      maxRows: 6,
      fields: [
        {
          name: 'link',
          type: 'group',
          fields: [
            {
              name: 'type',
              type: 'radio',
              options: [
                { label: 'Internal link', value: 'reference' },
                { label: 'Custom URL', value: 'custom' },
              ],
              defaultValue: 'reference',
              admin: {
                layout: 'horizontal',
              },
            },
            {
              name: 'newTab',
              label: 'Open in new tab',
              type: 'checkbox',
            },
            {
              name: 'reference',
              label: 'Document to link to',
              type: 'relationship',
              relationTo: ['pages', 'posts'],
              required: false,
            },
            {
              name: 'url',
              label: 'Custom URL',
              type: 'text',
              required: false,
            },
            {
              name: 'label',
              label: 'Label',
              type: 'text',
              required: true,
            },
          ],
        },
      ],
      admin: {
        initCollapsed: true,
      },
    },
  ],
}
