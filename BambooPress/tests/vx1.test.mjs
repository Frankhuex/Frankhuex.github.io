import assert from 'node:assert/strict';
import {findBook, loadBook} from '../library.js?v=20261109-heitonghua-soft-purple';
const novel = await loadBook(findBook('vx1'));
import {search} from '../search.js?v=20261107-scene-breaks';

assert.deepEqual(novel.chapters.map(chapter => chapter.title), ['序','第一章','第二章','第三章','第四章','第五章','尾声','番外一','番外二','番外三','番外四','番外五','番外六','番外七']);
assert.deepEqual(novel.authors, ['真爱困','彼格丧','SmallPot','纯鹿人','梅川旁次','开着']);
let transitions = 0;
const relay = [];
for (const chapter of novel.chapters) {
  const parts = new Map(chapter.parts.map(part => [part.id, part.author]));
  const used = new Set();
  for (const paragraph of chapter.paragraphs) {
    assert(paragraph.length);
    for (const segment of paragraph) {
      assert(parts.has(segment.part));
      assert(novel.authors.includes(parts.get(segment.part)));
      assert(segment.text.length);
      used.add(segment.part);
      if (relay.at(-1) !== parts.get(segment.part)) relay.push(parts.get(segment.part));
    }
    if (paragraph.length > 1) transitions++;
  }
  assert.equal(used.size, parts.size);
}
assert.equal(relay.length, 105);
assert.equal(transitions, 3);
const inlineCases = [
  ['“上一次遇到这种案子', '彼格丧', 'SmallPot'],
  ['说完，多茜便朝着', '真爱困', 'SmallPot'],
  ['随即走进了那扇门', '梅川旁次', '纯鹿人']
];
for (const [quote, before, after] of inlineCases) {
  const chapter = novel.chapters.find(c => c.paragraphs.some(p => p.some(s => s.text.startsWith(quote))));
  assert(chapter, quote);
  const paragraph = chapter.paragraphs.find(p => p.some(s => s.text.startsWith(quote)));
  assert.equal(chapter.parts.find(part => part.id === paragraph[0].part).author, before);
  assert.equal(chapter.parts.find(part => part.id === paragraph[1].part).author, after);
}
const guest = search(novel, '开着');
assert(guest.some(result => result.text.includes('安娜俯身，双腿弯曲')));
assert.deepEqual(novel.chapters.slice(7).map(chapter => chapter.parts[0].author), ['纯鹿人','SmallPot','彼格丧','纯鹿人','梅川旁次','SmallPot','真爱困']);
assert.equal(novel.chapters[8].excerpt, '一封信');
assert(novel.chapters[2].paragraphs.some(p => p.map(s=>s.text).join('') === '番外'));
console.log('PASS: fourteen chapters, 105 relays, six authors, three inline boundaries, guest author, seven attributed extras');

const epilogue = novel.chapters.find(chapter => chapter.id === 'c6');
assert.deepEqual(
  Object.entries(epilogue.paragraphAlignments).filter(([, alignment]) => alignment === 'right').map(([index, alignment]) => [
    epilogue.paragraphs[index].map(segment => segment.text).join(''),
    alignment
  ]),
  [['你最爱的艾薇”', 'right'], ['柯析”', 'right']]
);
assert.deepEqual(
  Object.keys(epilogue.paragraphAlignments).filter(index => epilogue.paragraphAlignments[index] === 'center').map(Number),
  Array.from({length: 24}, (_, index) => index + 32)
);
