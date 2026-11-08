import {findBook, progressKey, escapeHtml, loadBook, searchLibrary} from './library.js?v=20261108-hymn-align';
import {books} from './books.js?v=20261108-hymn-align';
import {read,save,setupSettings} from './settings.js?v=20261105-settings2';
import {search,highlight} from './search.js?v=20261107-scene-breaks';
import {renderReader,route} from './reader.js?v=20261108-hymn-align';
history.scrollRestoration = 'manual';
setupSettings();
const app=document.querySelector('#app');
const siteHeader = document.querySelector('header');
const siteHeaderObserver = new ResizeObserver(() => {
  document.documentElement.style.setProperty('--header-height', `${siteHeader.offsetHeight}px`);
});
siteHeaderObserver.observe(siteHeader);
const menuButton = document.createElement('button');
menuButton.id = 'header-menu';
menuButton.type = 'button';
menuButton.textContent = '⋯';
menuButton.setAttribute('aria-label', '打开菜单');
menuButton.setAttribute('aria-expanded', 'false');
siteHeader.append(menuButton);
function closeHeaderMenu() {
  siteHeader.classList.remove('menu-open');
  menuButton.setAttribute('aria-expanded', 'false');
}
menuButton.onclick = () => {
  const open = siteHeader.classList.toggle('menu-open');
  menuButton.setAttribute('aria-expanded', String(open));
};
document.addEventListener('click', event => {
  if (!siteHeader.contains(event.target) || event.target.closest('#settings-open')) closeHeaderMenu();
});
document.addEventListener('keydown', event => {
  if (event.key === 'Escape' && siteHeader.classList.contains('menu-open')) {
    closeHeaderMenu();
    menuButton.focus();
  }
});

let cleanup=()=>{};
let revision=0;
const scrollPositions=new Map();
let previous=location.hash;
function cover(book) {
  const color = /^#[0-9a-f]{6}$/i.test(book.coverColor || '') ? book.coverColor : '#3b3b3b';
  if (book.coverImage) {
    const imageUrl = new URL(book.coverImage, import.meta.url).href;
    return `<div class="cover cover-image"><img src="${escapeHtml(imageUrl)}" alt="${escapeHtml(book.title)}封面" decoding="async"></div>`;
  }
  return `<div class="cover" style="--cover-color:${color}"><strong>${escapeHtml(book.title)}</strong></div>`;
}
function resume(book, novel) {
  const oldProgress = (book.previousIds || []).map(id => read(progressKey(id), null)).find(Boolean);
  if (oldProgress && !read(progressKey(book.id), null)) save(progressKey(book.id), oldProgress);
  const progress = read(progressKey(book.id), null) ||
    (book.legacyDefault ? read('progress', null) : null);
  return route({view:'read', ...(progress || {chapter:novel.chapters[0].id}), book:book.id});
}
async function renderContent() {
  const currentRevision=++revision;
  scrollPositions.set(previous,scrollY);previous=location.hash;
  cleanup();cleanup=()=>{};
  closeHeaderMenu();
  const existingSearch = document.querySelector('#search-form');
  if (existingSearch && app.contains(existingSearch)) {
    document.querySelector('header').append(existingSearch);
  }
  const params=new URLSearchParams(location.hash.slice(1));
  const view = location.pathname.endsWith('/search.html') ? 'search' : params.get('view');
  const book = findBook(params.get('book'));
  if (book && params.has('book') && params.get('book') !== book.id) {
    params.set('book', book.id);
    history.replaceState(null, '', route(Object.fromEntries(params)));
  }
  const missingBook = (view === 'book' || view === 'read') && !book;
  document.body.classList.toggle('reading',view==='read' && !missingBook);
  const back = document.querySelector('#header-back');
  back.hidden = false;
  back.textContent = view === 'search' ? '返回' : !view ? '主站' : view === 'read' ? '返回目录' : '返回书架';
  back.href = view === 'search' ? new URL('./', location.href).href : !view ? '/#fiction' : view === 'read' ? route({view:'book', book:book?.id}) : '#';
  back.onclick = view === 'search' ? event => {
    event.preventDefault();
    history.back();
  } : null;
  const brand = document.querySelector('.brand');
  const inBook = !missingBook && (view === 'book' || view === 'read');
  for (const [field, property] of [['themeColor', '--book-accent'], ['themeColorNight', '--book-accent-night']]) {
    const color = inBook ? book[field] : null;
    if (/^#[0-9a-f]{6}$/i.test(color || '')) document.body.style.setProperty(property, color);
    else document.body.style.removeProperty(property);
  }
  brand.textContent = view === 'search' ? '搜索' : inBook ? book.title : 'BambooPress';
  document.querySelector('footer').textContent = inBook ? `BambooPress · ${book.title}` : 'BambooPress';
  document.querySelector('#query').value=params.get('q')||'';
  document.title = inBook ? `${book.title} · BambooPress` : view === 'search' ? '搜索 · BambooPress' : 'BambooPress';
  if (missingBook) {
    back.textContent = '返回书架';
    back.href = '#';
    app.innerHTML = '<section class="detail"><h1>未找到作品</h1><a href="#">返回书架</a></section>';
    scrollTo(0, 0);
    return;
  }
  if(!view) {
    app.innerHTML = `<section class="shelf" aria-label="书架"><div class="bookshelf">${books.map((shelfBook, index) => `<a class="shelf-book" data-book="${escapeHtml(shelfBook.id)}" style="--book-index:${index}" href="${route({view:'book', book:shelfBook.id})}">${cover(shelfBook)}<h2>${escapeHtml(shelfBook.title)}</h2></a>`).join('')}</div></section>`;
  } else {
    if (view !== 'read' || !app.querySelector('.reader')) app.innerHTML='<p class="loading">正在加载…</p>';
    try {
      const novel = view === 'search' ? null : await loadBook(book);
      if(currentRevision!==revision)return;
      if(view==='read') {
        const chapter=novel.chapters.find(c=>c.id===params.get('chapter'))||novel.chapters[0];
        document.title=`${chapter.title} · ${novel.title} · BambooPress`;
        cleanup=renderReader(app,novel,chapter,params);return;
      }
      if(view==='book') {
        app.innerHTML=`<section class="detail book-enter book-pending"><div class="detail-top">${cover(book)}<div><h1>${escapeHtml(book.title)}</h1><p>${escapeHtml(book.description)}</p><p class="authors">${escapeHtml(book.authorCredit || book.authors.join(' / '))}</p>${novel.date ? `<p class="authors book-date">${escapeHtml(novel.date)}</p>` : ''}<a class="primary" href="${resume(book, novel)}">阅读 →</a><a class="secondary book-download" href="./books/${encodeURIComponent(book.id)}.json" download>下载</a></div></div><h2>目录</h2><div class="chapter-list"></div></section>`;
        novel.chapters.forEach(c=>{const a=document.createElement('a');a.href=route({view:'read',book:book.id,chapter:c.id});a.textContent=c.excerpt ? `${c.title}　${c.excerpt}` : c.title;app.querySelector('.chapter-list').append(a);});
      } else if(view==='search') {
        const query=(params.get('q')||'').trim();
        const {results, failed} = await searchLibrary(query, search);
        if (currentRevision !== revision) return;
        app.innerHTML='<section class="results"><p class="result-count"></p><div class="result-list"></div></section>';
        app.querySelector('.results').prepend(document.querySelector('#search-form'));
        app.querySelector('.result-count').textContent=query?`“${query}” · ${results.length} 处结果`:'';
        if(query&&!results.length)app.querySelector('.result-count').textContent+='，换一段文字再试试。';
        if (failed.length) app.querySelector('.result-count').append(document.createTextNode(`（${failed.length} 本作品暂未加载成功）`));
        for(const result of results) {
          const a=document.createElement('a');a.className='result';a.href=new URL('./', location.href).href+route({view:'read',book:result.book.id,chapter:result.chapter.id,paragraph:`p${result.index}`,q:query});
          const label=document.createElement('small');label.textContent=`${result.book.title} / ${result.chapter.title} / ${result.authors}`;a.append(label);
          const p=document.createElement('p');const start=Math.max(0,result.offset-35);highlight(p,(start?'…':'')+result.text.slice(start,start+150)+(result.text.length>start+150?'…':''),query);a.append(p);app.querySelector('.result-list').append(a);
        }
      } else {app.innerHTML='<section class="detail"><h1>请从书架选择作品</h1><a href="#">返回书架</a></section>';}
    } catch(error) {app.innerHTML='<section class="detail"><h1>暂时未能加载内容</h1><p>请刷新重试。</p><a href="#">返回书架</a></section>';console.error(error);}
  }
  requestAnimationFrame(()=>scrollTo(0,scrollPositions.get(location.hash)||0));
}
const searchForm = document.querySelector('#search-form');
const searchInput = document.querySelector('#query');
const searchSubmit = document.querySelector('#search-submit');
const searchReveal = searchForm.querySelector('.search-reveal');
function setSearchOpen(open) {
  searchForm.classList.toggle('search-open', open);
  searchReveal.inert = !open;
  searchSubmit.setAttribute('aria-expanded', String(open));
  if (open) searchInput.focus();
  else searchSubmit.focus();
}
searchForm.onsubmit = event => {
  event.preventDefault();
  if (!location.pathname.endsWith('/search.html')) {
    location.href = new URL('search.html', location.href).href;
    return;
  }
  const query = searchInput.value.trim();
  if (query) location.hash = route({view:'search', q:query});
};
document.querySelector('#search-cancel').onclick = () => {
  if (location.pathname.endsWith('/search.html')) location.href = new URL('./', location.href).href;
  else setSearchOpen(false);
};
if (location.pathname.endsWith('/search.html')) setSearchOpen(true);
searchForm.addEventListener('keydown', event => {
  if (event.key === 'Escape') {
    event.preventDefault();
    if (location.pathname.endsWith('/search.html')) searchInput.blur();
    else setSearchOpen(false);
  }
});
let renderedView = new URLSearchParams(location.hash.slice(1)).get('view');
async function render() {
  const nextView = new URLSearchParams(location.hash.slice(1)).get('view');
  const enteringBook = !renderedView && nextView === 'book';
  const enteringReader = renderedView === 'book' && nextView === 'read';
  renderedView = nextView;
  if ((enteringBook || enteringReader) && document.startViewTransition &&
      !matchMedia('(prefers-reduced-motion: reduce)').matches) {
    // Load before capturing either page so the cover stays in both snapshots.
    const selectedBook = findBook(new URLSearchParams(location.hash.slice(1)).get('book'));
    if (selectedBook) {
      try { await loadBook(selectedBook); } catch { /* Render the normal loading error below. */ }
    }
    for (const element of app.querySelectorAll('.shelf-book')) {
      element.classList.toggle('transition-book', element.dataset.book === selectedBook?.id);
    }
    document.documentElement.classList.toggle('page-turn', enteringReader);
    const transition = document.startViewTransition(async () => {
      await renderContent();
      if (enteringReader) document.querySelector('#toc')?.classList.add('toc-entering');
    });
    try { await transition.finished; } catch { /* The next navigation may interrupt the animation. */ }
    document.documentElement.classList.remove('page-turn');
    const enteringToc = document.querySelector('.toc-entering');
    if (enteringToc) {
      enteringToc.classList.remove('toc-entering');
      enteringToc.classList.add('toc-arrived');
    }
    app.querySelector('.book-pending')?.classList.remove('book-pending');
  } else {
    await renderContent();
    app.querySelector('.book-pending')?.classList.remove('book-pending');
  }
}
addEventListener('hashchange', render);
render();
