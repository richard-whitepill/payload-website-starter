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
      name: 'navItems',
      type: 'array',
      fields: [
        link({
          appearances: false,
        }),
      ],
      maxRows: 6,
      admin: {
        initCollapsed: true,
        components: {
          RowLabel: {
            path: '@/Header/RowLabel#RowLabel',
          },
        },
      },
    },
    // TE ÚJ MEZŐID - BCCFA stílus
    {
      name: 'email',
      type: 'text',
      defaultValue: 'info@efdsz.hu',
      admin: { description: 'Felső sáv email - BCCFA stílus' },
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
      admin: { description: 'Bal logó - feltölthető!' },
    },
    {
      name: 'heroImage',
      label: 'Hero kép (menü alatt, 400px)',
      type: 'upload',
      relationTo: 'media',
      admin: { description: 'Nagy Hero kép - erdős kép, kigördül görgetéskor!' },
    },
    {
      name: 'slogan',
      label: 'Szlogen a Hero képen',
      type: 'text',
      defaultValue: 'Erdészeti és Faipari Dolgozók Szakszervezete',
      admin: { description: 'Adminban átírható szlogen!' },
    },
    {
      name: 'smallLogo',
      label: 'Kis logó a szlogen mellé jobbra',
      type: 'upload',
      relationTo: 'media',
      admin: { description: 'Kis zöld logó a szlogen mellett jobbra!' },
    },
  ],
  hooks: {
    afterChange: [revalidateHeader],
  },
}
