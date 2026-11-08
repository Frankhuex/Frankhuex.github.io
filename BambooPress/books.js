import wuli from './books/wuli.json?v=20261108-wuli-cover' with {type: 'json'};
import vx1 from './books/vx1.json?v=20261107-scene-breaks' with {type: 'json'};
import wuzhiyin from './books/wuzhiyin.json?v=20261107-scene-breaks' with {type: 'json'};

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
  register(wuli),
  register(vx1, {previousIds: ['weixi1']}),
  register(wuzhiyin, {legacyDefault: true})
];
