import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {books} from '../books.js';
import {findBook, loadBook, searchLibrary} from '../library.js?v=20261115-punctuation';
import {search} from '../search.js?v=20261115-codeblock-restored';

assert.equal(books[0].id, 'shengwu');

const novel = await loadBook(findBook('shengwu'));
const wuli = await loadBook(findBook('wuli'));

assert.equal(novel.title, '生物');
assert.equal(novel.description, '命运的指针已然暂停。');
assert.equal(novel.date, '2022.11.08');
assert.equal(novel.themeColor, wuli.themeColor);
assert.equal(novel.themeColorNight, wuli.themeColorNight);
assert.equal(novel.authors.length, 10);
assert(novel.authors.includes('纯鹿人'));
assert(!novel.authors.includes('纯路人'));
assert.deepEqual(novel.chapters.map(chapter => chapter.title), ['入殓师', '噩梦的开始']);

const [c0, c1] = novel.chapters;
assert.equal(c0.parts.length, 33);
assert.equal(c0.paragraphs.length, 293);
assert.equal(c0.sceneBreaks.length, 12);
assert.equal(c1.parts.length, 83);
assert.equal(c1.paragraphs.length, 637);
assert.equal(c1.sceneBreaks.length, 29);
assert.equal(c1.paragraphAlignments['421'], 'center');
assert.equal(c1.paragraphs[421][0].text, '伍等分の启星');

for (const chapter of novel.chapters) {
  const partAuthors = new Map(chapter.parts.map(({id, author}) => [id, author]));
  assert.deepEqual(
    [...new Set(chapter.paragraphs.flat().map(segment => segment.part))],
    [...partAuthors.keys()]
  );

  for (const part of chapter.parts) {
    assert(novel.authors.includes(part.author), `Unknown author: ${part.author}`);
  }

  for (const [idx, paragraph] of chapter.paragraphs.entries()) {
    assert(Array.isArray(paragraph) && paragraph.length > 0, `Empty paragraph at ${chapter.id}:${idx}`);
    for (const segment of paragraph) {
      assert(partAuthors.has(segment.part), `Invalid part ${segment.part} at ${chapter.id}:${idx}`);
      if (segment.type === 'image') {
        assert.equal(paragraph.length, 1, `Image must be sole segment at ${chapter.id}:${idx}`);
        assert.equal(segment.text, undefined);
        assert.equal(segment.alt, 'chicken star：1155666，4433221');
        assert(Number.isInteger(segment.width) && segment.width > 0);
        assert(Number.isInteger(segment.height) && segment.height > 0);
        const imagePath = path.join(process.cwd(), 'BambooPress', segment.src);
        assert(fs.existsSync(imagePath), `Missing image: ${imagePath}`);
      } else {
        assert.equal(typeof segment.text, 'string');
        assert(segment.text.length > 0, `Empty text segment at ${chapter.id}:${idx}`);
      }
    }
  }

  const sceneBreaks = chapter.sceneBreaks ?? [];
  for (let i = 0; i < sceneBreaks.length; i += 1) {
    const index = sceneBreaks[i];
    assert(Number.isInteger(index) && index >= 0 && index < chapter.paragraphs.length);
    if (i > 0) {
      assert(index > sceneBreaks[i - 1], `Unsorted/duplicate sceneBreak at ${chapter.id}:${i}`);
    }
  }
}

// Verify inline handoffs on first two paragraphs of chapter 1
const c0Authors = new Map(c0.parts.map(({id, author}) => [id, author]));
assert.equal(c0Authors.get(c0.paragraphs[0][0].part), '直升机');
assert.equal(c0Authors.get(c0.paragraphs[0][1].part), '纯鹿人');
assert.equal(c0Authors.get(c0.paragraphs[1][0].part), '纯鹿人');
assert.equal(c0Authors.get(c0.paragraphs[1][1].part), '蛙男');

// Verify chapter 1 ending and chapter 2 start
assert.equal(c0.paragraphs.at(-1)[0].text, '“找到她！”');
assert.equal(c0Authors.get(c0.paragraphs.at(-1)[0].part), '开着');
const c1Authors = new Map(c1.parts.map(({id, author}) => [id, author]));
assert.equal(c1.paragraphs[0][0].text, '“可怎么找？”季逆无语住了，又要干活。');
assert.equal(c1Authors.get(c1.paragraphs[0][0].part), '纯鹿人');

// Verify image attribution to 梅川旁次
const imagePara = c1.paragraphs.find(paragraph => paragraph[0]?.type === 'image');
assert(imagePara, 'Expected musical score image paragraph');
assert.equal(c1Authors.get(imagePara[0].part), '梅川旁次');

// Verify oMath formula 4√3 was preserved
assert(c1.paragraphs.some(p => p.some(s => s.text?.includes('约4√3秒的下落时间'))));

// Verify （在很爱解困） mapped to 真爱困 and ending paragraph
assert.equal(c1.paragraphs.at(-1)[0].text, '掌声雷鸣。');
assert.equal(c1Authors.get(c1.paragraphs.at(-1)[0].part), '真爱困');

// Verify cross-book search
const {results} = await searchLibrary('通灵心诀', search);
assert(results.some(result => result.book.id === novel.id));

console.log('PASS: 生物两章结构、插图、段内交接、对齐与跨书搜索');
