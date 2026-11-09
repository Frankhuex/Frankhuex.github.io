import assert from 'node:assert/strict';
import {findBook, loadBook, searchLibrary} from '../library.js?v=20261109-heitonghua-soft-purple';
import {search} from '../search.js?v=20261107-scene-breaks';

const novel = await loadBook(findBook('heitonghua'));
assert.equal(novel.date, '2023.3.13');
assert.deepEqual(novel.chapters.map(chapter => chapter.title), ['正文']);

const [{parts, paragraphs, sceneBreaks}] = novel.chapters;
const authors = new Map(parts.map(({id, author}) => [id, author]));
assert.equal(authors.size, 81);
assert.equal(paragraphs.length, 488);
assert.equal(sceneBreaks.length, 34);
assert.deepEqual([...new Set(paragraphs.flat().map(segment => segment.part))], [...authors.keys()]);
assert.deepEqual(
  paragraphs.filter(paragraph => paragraph.length > 1).map(paragraph => {
    const [before, after] = paragraph;
    return [authors.get(before.part), authors.get(after.part), after.text.slice(0, 8)];
  }),
  [
    ['真爱困', 'SmallPot', '他的头发接触到骨'],
    ['直升机', 'SmallPot', '小魔女此时已经痛'],
    ['SmallPot', '真爱困', '下一秒，车内响起']
  ]
);
const dialogueStart = paragraphs.findIndex(([segment]) => segment.text === '“你说什么？没听清。”');
assert.equal(paragraphs[dialogueStart - 1][0].text, '“……”');
assert.equal(authors.get(paragraphs[dialogueStart - 1][0].part), '#');
assert.equal(paragraphs.at(-1)[0].text, '总之，失踪的女孩们，在另一个不为人知的世界里一直生活了下去。');
const {results} = await searchLibrary('车内响起警报', search);
assert(results.some(result => result.book.id === novel.id));
console.log('PASS: 黑童话正文、段内交接、结尾和跨书搜索');
