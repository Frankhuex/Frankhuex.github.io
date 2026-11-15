import assert from 'node:assert/strict';
import {existsSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {findBook, loadBook, searchLibrary} from '../library.js?v=20261115-hummingbird';
import {search} from '../search.js?v=20261115-hummingbird';
const novel = await loadBook(findBook('hummingbird'));
assert.deepEqual(novel.chapters.map(c => c.title), ['I', 'II', 'III']);
assert.equal(novel.date, '2023.6.2');
assert.deepEqual(novel.chapters.map(c => c.parts.length), [58, 33, 11]);
const expected = [
  // Hashes of the Word chapter text, excluding indentation and paragraph boundaries.
  'd066986aef007c3c1a52838fcbeb2522a8076dd3ba483d907cbafbc552920e12', '26bd4ef298ca1b7e2c29ca12ebb5bca240d6a3926f1e6a7170927d32eddc6986', 'ac2682c1fd753398dbf228717b6dcbd79c42cc51897efd17c0fd24b5e761317d'
];
const ids = new Set();
for (const [index, chapter] of novel.chapters.entries()) {
  const parts = new Map(chapter.parts.map(part => [part.id, part.author]));
  for (const part of chapter.parts) {
    assert(!ids.has(part.id)); ids.add(part.id);
    assert(novel.authors.includes(part.author));
  }
  assert.deepEqual([...new Set(chapter.paragraphs.flat().map(s => s.part))], [...parts.keys()]);
  const text = chapter.paragraphs.flat().map(s => s.text || '').join('').replace(/\s/g, '');
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
assert.equal(search(novel, '原文手绘插图')[0].index, pictureIndex);
assert((await searchLibrary('原文手绘插图', search)).results.some(r => r.book.id === novel.id));
const mixed = novel.chapters[0].paragraphs.find(p => p.some(s => s.text?.startsWith('抓起边上')));
assert.deepEqual(mixed.map(s => novel.chapters[0].parts.find(p => p.id === s.part).author), ['真爱困', '开着', '纯鹿人']);
assert.deepEqual(novel.authors, ['SmallPot', '真爱困', '直升机', '开着', '梅川旁次', '纯鹿人']);
assert.equal(novel.chapters[1].parts.find(p => p.id === 'c1-s13').author, '真爱困');
const correctedBoundary = novel.chapters[0].paragraphs.find(p => p.some(s => s.part === 'c0-s2'));
assert.equal(correctedBoundary[0].part, 'c0-s1');
assert(correctedBoundary[0].text.endsWith('长眠于农场的黄土地下了。'));
assert.equal(correctedBoundary[1].part, 'c0-s2');
assert(correctedBoundary[1].text.startsWith('或许你会以为我将为此感到悲痛，'));
assert.equal(novel.chapters[2].paragraphs.at(-1)[0].text, '2023.6.2');
console.log('PASS: three complete chapters, 102 boundaries, inline handoffs, illustration location, image search and colophon');
