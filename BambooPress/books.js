export const books = [
  {
    id: 'vx1',
    previousIds: ['weixi1'],
    title: '薇 · 茜',
    authors: '彼格丧 / 纯鹿人 / 梅川旁次 / SmallPot / 真爱困 / *开着',
    description: '于新世纪的展台，离人终欢聚一堂。',
    coverColor: '#8b1525',
    themeColor: '#8b1525',
    themeColorNight: '#ef929e',
    coverImage: 'images/vx1.png',
    load: () => import('./books/vx1.js?v=20261106-indent')
  },
  {
    id: 'wuzhiyin',
    legacyDefault: true,
    title: '无只因生还',
    authors: '「竹林七贤」BCE / Wkz / 真爱困 / Lth / SmallPot / Frank / Wtc',
    description: '灰色中分已然绽放。',
    date: '2022.08.19',
    coverColor: '#31584b',
    coverImage: 'images/wuzhiyin.jpeg',
    load: () => import('./books/wuzhiyin.js?v=20261106-indent')
  }
];
