import vx1 from './books/vx1.json?v=20261107-book-json' with {type: 'json'};
import wuzhiyin from './books/wuzhiyin.json?v=20261107-book-json' with {type: 'json'};

function register(novel, compatibility) {
  return {
    ...novel,
    ...compatibility,
    async load() {
      return {novel};
    }
  };
}

export const books = [
  register(vx1, {previousIds: ['weixi1']}),
  register(wuzhiyin, {legacyDefault: true})
];
