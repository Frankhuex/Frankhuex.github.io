import assert from 'node:assert/strict';
import {existsSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {findBook, loadBook, searchLibrary} from '../library.js?v=20261115-punctuation';
import {search} from '../search.js?v=20261115-codeblock-restored';
const novel = await loadBook(findBook('hummingbird'));
assert.deepEqual(novel.chapters.map(c => c.title), ['I', 'II', 'III']);
assert.equal(novel.date, '2023.6.2');
assert.deepEqual(novel.chapters.map(c => c.parts.length), [58, 33, 11]);
const expected = [
  // Current corrected chapter text, including reviewed Chinese punctuation.
  '27431e4af6e51fa0a992fffedafad894b506d7a5920b6d14043c660baf530b80', '9517cb318636393996a764afcf2126ce0c53e358541e436470356723cb5930ed', '80485d89850c0e64845cbc1079f6870a786cdb451a68cbd1a915a94d1f8953e5'
];
const ids = new Set();
for (const [index, chapter] of novel.chapters.entries()) {
  const parts = new Map(chapter.parts.map(part => [part.id, part.author]));
  for (const part of chapter.parts) {
    assert(!ids.has(part.id)); ids.add(part.id);
    assert(novel.authors.includes(part.author));
  }
  assert.deepEqual([...new Set(chapter.paragraphs.flat().map(s => s.part))], [...parts.keys()]);
  // Reverse the user-approved symbol correction before comparing with the Word source.
  const text = chapter.paragraphs.flat().map(s => s.text || '').join('')
    .replace('×->[@] “{]┌”[@]<@>', '×->[@]“{]┌”[@]').replace(/\s/g, '');
  assert.equal(createHash('sha256').update(text).digest('hex'), expected[index]);
  for (const paragraph of chapter.paragraphs) for (const segment of paragraph) {
    assert(parts.has(segment.part));
    if (segment.type === 'image') {
      assert.equal(paragraph.length, 1);
      assert(existsSync(new URL('../' + segment.src, import.meta.url)));
      assert(segment.alt && segment.width > 0 && segment.height > 0);
    } else assert(segment.text.length);
  }
}
const second = novel.chapters[1];
const pictureIndex = second.paragraphs.findIndex(p => p[0].type === 'image');
assert.equal(second.paragraphs[pictureIndex - 1].map(s => s.text).join(''), '“只有这样，我们才能形成三体运动！”');
assert(second.paragraphs[pictureIndex + 1][0].text.startsWith('果然如此。'));
assert.equal(second.parts.find(p => p.id === second.paragraphs[pictureIndex][0].part).author, '开着');
assert.equal(search(novel, second.paragraphs[pictureIndex][0].alt)[0].index, pictureIndex);
assert((await searchLibrary(second.paragraphs[pictureIndex][0].alt, search)).results.some(r => r.book.id === novel.id));
const mixed = novel.chapters[0].paragraphs.find(p => p.some(s => s.text?.startsWith('抓起边上')));
assert.deepEqual(mixed.map(s => novel.chapters[0].parts.find(p => p.id === s.part).author), ['真爱困', '开着', '纯鹿人']);
assert.deepEqual(novel.authors, ['SmallPot', '真爱困', '直升机', '开着', '梅川旁次', '纯鹿人']);
assert.equal(novel.chapters[1].parts.find(p => p.id === 'c1-s13').author, '真爱困');
const correctedBoundary = novel.chapters[0].paragraphs.find(p => p.some(s => s.part === 'c0-s2'));
assert.equal(correctedBoundary[0].part, 'c0-s1');
assert(correctedBoundary[0].text.endsWith('长眠于农场的黄土地下了。'));
assert.equal(correctedBoundary[1].part, 'c0-s2');
assert(correctedBoundary[1].text.startsWith('或许你会以为我将为此感到悲痛，'));
assert(novel.chapters[2].paragraphs.at(-1)[0].text.endsWith('飞向了远方的浩瀚天堂。'));
console.log('PASS: three complete chapters, 102 boundaries, inline handoffs, illustration location, image search and colophon');

const symbolIndex = novel.chapters[0].paragraphs.findIndex(p => p.some(s => s.text === '×->[@] “{]┌”[@]<@>'));
assert(symbolIndex >= 0);
assert.equal(novel.chapters[0].paragraphStyles[symbolIndex], 'monospace');
assert(search(novel, '<@>').some(r => r.index === symbolIndex));
