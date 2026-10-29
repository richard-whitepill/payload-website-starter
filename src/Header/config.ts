export const Header: GlobalConfig = {
  slug: 'header',
  access: { read: () => true },
  fields: [
    {
      name: 'email',
      type: 'text',
      defaultValue: 'info@efdsz.hu',
    },
  ],
}
