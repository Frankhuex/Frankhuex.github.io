export const books = [
  {
    id: 'wuzhiyin',
    legacyDefault: true,
    title: '无只因生还',
    authors: '「竹林七贤」BCE / Wkz / 真爱困 / Lth / SmallPot / Frank / Wtc',
    description: '灰色中分已然绽放。',
    date: '2026.08.19',
    coverColor: '#3b3b3b',
    coverImage: 'images/wuzhiyin.jpeg',
    load: () => import('./books/wuzhiyin.js?v=authors2')
  }
];
