import { GlobalConfig } from 'payload'

export const Header: GlobalConfig = {
  slug: 'header',
  access: {
    read: () => true,
  },
  fields: [
    {
      name: 'email',
      type: 'text',
      defaultValue: 'info@efdsz.hu',
      admin: { description: 'Felső sáv email' },
    },
    {
      name: 'facebookUrl',
      type: 'text',
      defaultValue: 'https://www.facebook.com/efdsz.hivatalos',
      admin: { description: 'Facebook link' },
    },
    {
      name: 'logo',
      label: 'Fő logó (bal, menü mellett)',
      type: 'upload',
      relationTo: 'media',
    },
    {
      name: 'heroImage',
      label: 'Hero kép (menü alatt)',
      type: 'upload',
      relationTo: 'media',
    },
    {
      name: 'slogan',
      label: 'Szlogen a Hero képen',
      type: 'text',
      defaultValue: 'Erdészeti és Faipari Dolgozók Szakszervezete',
    },
    {
      name: 'smallLogo',
      label: 'Kis logó a szlogen mellé jobbra',
      type: 'upload',
      relationTo: 'media',
    },
    {
      name: 'navItems',
      type: 'array',
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
              admin: { layout: 'horizontal' },
            },
            {
              name: 'newTab',
              type: 'checkbox',
              label: 'Open in new tab',
            },
            {
              name: 'reference',
              type: 'relationship',
              relationTo: ['pages', 'posts'],
              required: false,
            },
            {
              name: 'url',
              type: 'text',
              required: false,
            },
            {
              name: 'label',
              type: 'text',
              required: true,
            },
          ],
        },
      ],
    },
  ],
}
