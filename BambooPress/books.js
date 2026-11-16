import hummingbird from './books/hummingbird.json?v=20261115-hummingbird-clean' with {type: 'json'};
import heitonghua from './books/heitonghua.json?v=20261115-heitonghua-color' with {type: 'json'};
import wuli from './books/wuli.json?v=20261115-punctuation' with {type: 'json'};
import vx1 from './books/vx1.json?v=20261115-punctuation' with {type: 'json'};
import wuzhiyin from './books/wuzhiyin.json?v=20261115-wuzhiyin-epilogue2' with {type: 'json'};
import terry from './books/terry.json?v=20261116-terry' with {type: 'json'};
import shengwu from './books/shengwu.json?v=20261116-shengwu' with {type: 'json'};

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
  register(shengwu),
  register(terry),
  register(hummingbird),
  register(heitonghua),
  register(wuli),
  register(vx1, {previousIds: ['weixi1']}),
  register(wuzhiyin, {legacyDefault: true})
];
