import {books} from './books.js?v=20261107-book-json';

export function findBook(id) {
  return id ? books.find(book => book.id === id || book.previousIds?.includes(id)) : books.find(book => book.legacyDefault);
}

export function progressKey(bookId) {
  return `progress-${bookId}`;
}

export function escapeHtml(value = '') {
  return String(value).replace(/[&<>"']/g, character => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  })[character]);
}

export async function loadBook(book) {
  const {novel} = await book.load();
  if (novel.id !== book.id || !novel.chapters.length) {
    throw new Error(`Invalid book data: ${book.id}`);
  }
  return novel;
}

export async function searchLibrary(query, search) {
  if (!query) return {results: [], failed: []};
  const loaded = await Promise.allSettled(books.map(async book => {
    const novel = await loadBook(book);
    return search(novel, query).map(result => ({...result, book}));
  }));
  return {
    results: loaded.flatMap(result => result.status === 'fulfilled' ? result.value : [])
      .sort((a, b) => a.rank - b.rank),
    failed: books.filter((book, index) => loaded[index].status === 'rejected')
  };
}
