import { GlobalConfig } from 'payload'
import { link } from '@/fields/link'

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
      admin: { description: 'Felső sáv email cím' },
    },
    {
      name: 'facebookUrl',
      type: 'text',
      defaultValue: 'https://www.facebook.com/efdsz.hivatalos',
      admin: { description: 'Facebook oldal linkje' },
    },
    {
      name: 'logo',
      label: 'Fő logó (bal oldalon, menü mellett)',
      type: 'upload',
      relationTo: 'media',
      admin: { description: 'Bal oldali logó a menü mellett - feltölthető!' },
    },
    {
      name: 'heroImage',
      label: 'Hero kép (menü alatt)',
      type: 'upload',
      relationTo: 'media',
      admin: { description: 'Nagy Hero kép a menü alatt - feltölthető! Görgetéskor kigördül!' },
    },
    {
      name: 'slogan',
      label: 'Szlogen a Hero képen',
      type: 'text',
      defaultValue: 'Erdészeti és Faipari Dolgozók Szakszervezete',
      admin: { description: 'Adminban átírható szlogen a Hero képen!' },
    },
    {
      name: 'smallLogo',
      label: 'Kis logó a szlogen mellett (jobbra)',
      type: 'upload',
      relationTo: 'media',
      admin: { description: 'Kis logó a szlogentől jobbra a Hero képen - feltölthető!' },
    },
    {
      name: 'navItems',
      type: 'array',
      fields: [
        link({
          appearances: false,
        }),
      ],
      maxRows: 10,
      admin: {
        initCollapsed: true,
        components: {
          RowLabel: {
            path: '@/Header/RowLabel#RowLabel',
          },
        },
      },
    },
  ],
}
