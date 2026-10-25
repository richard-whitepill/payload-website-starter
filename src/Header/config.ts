import type { GlobalConfig } from 'payload'
import { link } from '@/fields/link'
import { revalidateHeader } from './hooks/revalidateHeader'
export const Header: GlobalConfig = {
  slug: 'header',
  access: {
    read: () => true,
  },
  fields: [
    {
      name: 'logo',
      type: 'upload',
      relationTo: 'media',
      admin: {
        description: 'EFDSZ logó (ha üres, szöveg lesz)',
      },
    },
    {
      name: 'orgName',
      type: 'text',
      defaultValue: 'Erdészeti és Faipari Dolgozók Szakszervezete',
      admin: {
        description: 'Fejléc cím',
      },
    },
    {
      name: 'orgShortName',
      type: 'text',
      defaultValue: 'EFDSZ',
      admin: {
        description: 'Rövid név (logó mellett)',
      },
    },
    {
      name: 'navItems',
      type: 'array',
      label: 'Felső menü (mint Joomla Main Menu)',
      fields: [
        link({
          appearances: false,
        }),
      ],
      maxRows: 8,
      admin: {
        initCollapsed: true,
        components: {
          RowLabel: '@/Header/RowLabel#RowLabel',
        },
      },
    },
  ],
  hooks: {
    afterChange: [revalidateHeader],
  },
}
