import {books} from './books.js';
import {read,setupSettings} from './settings.js?v=20261105-settings2';
import {search,highlight} from './search.js';
import {renderReader,route} from './reader.js?v=20261105-chapter-position3';
history.scrollRestoration = 'manual';
setupSettings();
const app=document.querySelector('#app');
const siteHeader = document.querySelector('header');
const siteHeaderObserver = new ResizeObserver(() => {
  document.documentElement.style.setProperty('--header-height', `${siteHeader.offsetHeight}px`);
});
siteHeaderObserver.observe(siteHeader);
let cleanup=()=>{};
let revision=0;
const scrollPositions=new Map();
let previous=location.hash;
function cover() {return '<div class="cover"><strong>无只因生还</strong></div>';}
function resume() {return route({view:'read',...read('progress',{chapter:'c0'})});}
async function renderContent() {
  const currentRevision=++revision;
  scrollPositions.set(previous,scrollY);previous=location.hash;
  cleanup();cleanup=()=>{};
  const params=new URLSearchParams(location.hash.slice(1));
  const view=params.get('view');
  const book=books[0];
  document.body.classList.toggle('reading',view==='read');
  const back = document.querySelector('#header-back');
  back.hidden = Boolean(view) && view !== 'book' && view !== 'read';
  back.textContent = !view ? '主站' : view === 'read' ? '返回目录' : '返回书架';
  back.href = !view ? '/#fiction' : view === 'read' ? route({view:'book'}) : '#';
  const brand = document.querySelector('.brand');
  const inBook = view === 'book' || view === 'read';
  brand.textContent = inBook ? `BambooPress · ${book.title}` : 'BambooPress';
  document.querySelector('footer').textContent = brand.textContent;
  document.querySelector('#query').value=params.get('q')||'';
  document.title=`${book.title} · BambooPress`;
  if(!view) {
    app.innerHTML = `<section class="shelf" aria-label="书架"><div class="bookshelf">${books.map((shelfBook, index) => `<a class="shelf-book" style="--book-index:${index}" href="${route({view:'book'})}">${cover()}<h2>${shelfBook.title}</h2></a>`).join('')}</div></section>`;
  } else {
    app.innerHTML='<p class="loading">正在加载…</p>';
    try {
      const {novel}=await book.load();
      if(currentRevision!==revision)return;
      if(view==='read') {
        const chapter=novel.chapters.find(c=>c.id===params.get('chapter'))||novel.chapters[0];
        document.title=`${chapter.title} · ${novel.title} · BambooPress`;
        cleanup=renderReader(app,novel,chapter,params);return;
      }
      if(view==='book') {
        app.innerHTML=`<section class="detail book-enter book-pending"><div class="detail-top">${cover()}<div><h1>${book.title}</h1><p>${book.description}</p><p class="authors">${book.authors}</p><a class="primary" href="${resume()}">阅读 →</a></div></div><h2>目录</h2><div class="chapter-list"></div></section>`;
        novel.chapters.forEach(c=>{const a=document.createElement('a');a.href=route({view:'read',chapter:c.id});a.textContent=c.excerpt ? `${c.title}　${c.excerpt}` : c.title;app.querySelector('.chapter-list').append(a);});
      } else if(view==='search') {
        const query=(params.get('q')||'').trim();
        const results=query?search(novel,query):[];
        app.innerHTML='<section class="results"><a href="#">← 书架</a><h1>搜索结果</h1><p class="result-count"></p><div class="result-list"></div></section>';
        app.querySelector('.result-count').textContent=query?`“${query}” · ${results.length} 处结果`:'输入书名、作者或记得的文字。';
        if(query&&!results.length)app.querySelector('.result-count').textContent+='，换一段文字再试试。';
        for(const result of results) {
          const a=document.createElement('a');a.className='result';a.href=route({view:'read',chapter:result.chapter.id,paragraph:`p${result.index}`,q:query});
          const label=document.createElement('small');label.textContent=`${novel.title} / ${result.chapter.title} / ${result.authors}`;a.append(label);
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
  if (!searchForm.classList.contains('search-open')) {
    setSearchOpen(true);
    return;
  }
  const query = searchInput.value.trim();
  if (query) location.hash = route({view:'search', q:query});
};
document.querySelector('#search-cancel').onclick = () => setSearchOpen(false);
searchForm.addEventListener('keydown', event => {
  if (event.key === 'Escape') {
    event.preventDefault();
    setSearchOpen(false);
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
    await books[0].load();
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
