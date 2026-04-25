export const SITE = {
  title: "Trustless future is tomorrow",
  description: "A web3 developer's home on web2.",
  author: 'Husni Rizal',
  url: 'https://ical10.github.io',
  repo: 'https://github.com/ical10/website',
  repoEditBase: 'https://github.com/ical10/website/edit/main/',
  email: 'mochhusnir@gmail.com',
  postsPerPage: 8,
  giscus: {
    repo: 'husni/website',
    repoId: 'R_kgDOIjPNaQ',
    category: 'General',
    categoryId: 'DIC_kwDOIjPNac4CaklA',
  },
  nav: [
    { href: '/', label: 'Posts' },
    { href: '/tags/', label: 'Tags' },
    { href: '/archive/', label: 'Archive' },
    { href: '/about/', label: 'About' },
    { href: '/rss.xml', label: 'RSS' },
  ],
} as const;
