import { Block } from 'payload'

export const MediaBlock: Block = {
  slug: 'mediaBlock',
  interfaceName: 'MediaBlock',
  fields: [
    {
      name: 'media',
      type: 'upload',
      relationTo: 'media',
      required: true,
    },
    {
      name: 'alignment',
      type: 'select',
      label: 'Igazítás (Joomla stílus)',
      defaultValue: 'center',
      options: [
        { label: 'Balra (szöveg jobbra fut)', value: 'left' },
        { label: 'Középre', value: 'center' },
        { label: 'Jobbra (szöveg balra fut)', value: 'right' },
        { label: 'Teljes szélesség', value: 'full' },
      ],
      admin: {
        description: 'Mint Joomlában: balra/jobbra igazítás',
      },
    },
    {
      name: 'width',
      type: 'select',
      label: 'Szélesség',
      defaultValue: '100%',
      options: [
        { label: '25% - kicsi', value: '25%' },
        { label: '33% - harmad', value: '33%' },
        { label: '50% - fél', value: '50%' },
        { label: '75% - háromnegyed', value: '75%' },
        { label: '100% - teljes', value: '100%' },
      ],
      admin: {
        description: 'Kép szélessége - mint Joomlában átméretezés',
      },
    },
    {
      name: 'enableGutter',
      type: 'checkbox',
      label: 'Szöveg körbefuttatása',
      defaultValue: false,
      admin: {
        description: 'Ha bepipálod, a szöveg körbefutja a képet (mint Joomlában float:left/right)',
      },
    },
    {
      name: 'caption',
      type: 'text',
      label: 'Képaláírás',
      admin: {
        description: 'Opcionális képaláírás',
      },
    },
    {
      name: 'alt',
      type: 'text',
      label: 'Alt szöveg (akadálymentesítés)',
    },
  ],
}
