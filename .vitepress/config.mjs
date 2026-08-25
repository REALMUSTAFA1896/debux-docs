import { defineConfig } from 'vitepress'

// Products listed here appear in the navbar and are crawlable.
// Anything with published:false is written, built and reachable by direct URL,
// but never linked — use it to prepare a release before it goes on sale.
const products = [
  { slug: 'debux-waypoint', title: 'Waypoint', published: true },
  { slug: 'debux-weaponbag', title: 'Weapon Bag', published: true },
  { slug: 'debux-bank', title: 'Bank', published: false },
]

const live = products.filter((p) => p.published)

function sidebarFor(slug) {
  return [
    {
      text: 'Getting started',
      items: [
        { text: 'Overview', link: `/${slug}/` },
        { text: 'Installation', link: `/${slug}/installation` },
      ],
    },
    {
      text: 'Reference',
      items: [
        { text: 'Configuration', link: `/${slug}/configuration` },
        { text: 'Exports & events', link: `/${slug}/exports` },
      ],
    },
    {
      text: 'Help',
      items: [
        { text: 'Troubleshooting', link: `/${slug}/troubleshooting` },
        { text: 'Changelog', link: `/${slug}/changelog` },
      ],
    },
  ]
}

const sidebar = {}
for (const product of products) {
  sidebar[`/${product.slug}/`] = sidebarFor(product.slug)
}

export default defineConfig({
  title: 'DebuX',
  description: 'Documentation for DebuX FiveM resources',
  lang: 'en',
  cleanUrls: true,
  lastUpdated: true,
  base: '/debux-docs/',

  head: [
    ['meta', { name: 'theme-color', content: '#a855f7' }],
    ['meta', { property: 'og:site_name', content: 'DebuX Docs' }],
  ],

  themeConfig: {
    siteTitle: 'DebuX',

    nav: [
      ...live.map((p) => ({ text: p.title, link: `/${p.slug}/` })),
      { text: 'Store', link: 'https://debux.tebex.io/' },
      { text: 'Discord', link: 'https://discord.gg/DrTFQj5hcZ' },
    ],

    sidebar,

    socialLinks: [{ icon: 'github', link: 'https://github.com/REALMUSTAFA1896' }],

    search: { provider: 'local' },

    footer: {
      message: 'Not affiliated with Rockstar Games or any other company.',
      copyright: '© DebuX',
    },
  },

  // Draft products stay out of the sitemap so they are not indexed before release.
  sitemap: {
    hostname: 'https://realmustafa1896.github.io/debux-docs/',
    transformItems: (items) =>
      items.filter((item) => !item.url.startsWith('debux-bank')),
  },
})
