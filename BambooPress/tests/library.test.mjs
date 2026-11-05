import assert from 'node:assert/strict';
import {books} from '../books.js?v=authors2';
import {findBook, loadBook, searchLibrary, progressKey, escapeHtml} from '../library.js?v=authors2';
import {search} from '../search.js?v=authors2';

const original = await loadBook(findBook());
const second = {
  id: 'test-second', title: '第二本测试书',
  load: async () => ({novel: {
    id: 'test-second', title: '第二本测试书', authors: ['测试作者'],
    chapters: [{id:'c0', title:'测试章节', parts:[{id:'s0',author:'测试作者'}],
      paragraphs:[[{part:'s0',text:'第二本独有文字 灰色'}]]}]
  }})
};
books.push(second);
try {
  assert.equal(findBook(second.id), second);
  assert.equal(findBook('missing'), undefined);
  assert.equal(findBook().id, original.id);
  assert.notEqual(progressKey(second.id), progressKey(original.id));
  assert.equal((await loadBook(second)).chapters[0].id, 'c0');
  const exclusive = await searchLibrary('第二本独有文字', search);
  assert.deepEqual(exclusive.results.map(result => result.book.id), [second.id]);
  const shared = await searchLibrary('灰色', search);
  assert(shared.results.some(result => result.book.id === original.id));
  assert(shared.results.some(result => result.book.id === second.id));
  assert.equal((await searchLibrary('', search)).results.length, 0);
  books.push({id:'broken', load:async()=>{throw new Error('fixture');}});
  const partial = await searchLibrary('第二本独有文字', search);
  assert.equal(partial.failed[0].id, 'broken');
  assert.equal(partial.results[0].book.id, second.id);
  assert.equal(escapeHtml('<书 & "名">'), '&lt;书 &amp; &quot;名&quot;&gt;');
  console.log('PASS: two books, overlapping chapter IDs, legacy selection, isolated progress keys, cross-book search, partial load failure');
} finally {
  books.splice(1);
}
