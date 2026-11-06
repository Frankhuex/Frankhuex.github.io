import {progressKey, escapeHtml} from './library.js?v=20261106-indent';
import {highlight} from './search.js?v=20261106-indent';
import {read, save} from './settings.js?v=20261105-settings2';
export function route(values={}) { return '#'+new URLSearchParams(values).toString(); }
export function renderReader(app, novel, chapter, params) {
  const bookRoute = values => route({...values, book:novel.id});
  app.innerHTML = `<button class="toc-toggle" aria-controls="toc" aria-label="展开目录" title="展开目录"><span aria-hidden="true">☰</span></button><aside id="toc"><div class="toc-book-title">${escapeHtml(novel.title)}</div><div id="toc-items"></div></aside><article class="reader"><div class="chapter-heading"><h1>${escapeHtml(chapter.title)}</h1>${chapter.excerpt ? `<small>${escapeHtml(chapter.excerpt)}</small>` : ''}</div><div id="prose"></div><nav class="chapter-nav"></nav></article>`;
  const toc = app.querySelector('#toc');
  const toggle = app.querySelector('.toc-toggle');
  const desktop = matchMedia('(min-width: 960px)');
  const header = document.querySelector('header');
  const headerSize = new ResizeObserver(() => {
    document.documentElement.style.setProperty('--header-height', `${header.offsetHeight}px`);
  });
  headerSize.observe(header);
  function setSidebar(open) {
    toc.classList.toggle('open', open);
    document.body.classList.toggle('sidebar-collapsed', !open);
    toggle.setAttribute('aria-expanded', String(open));
    const label = open ? '收起目录' : '展开目录';
    toggle.setAttribute('aria-label', label);
    toggle.title = label;
    toggle.querySelector('span').textContent = '☰';
    if (desktop.matches) save('sidebar-open', open);
  }
  function close() {
    setSidebar(false);
    toggle.focus();
  }
  toggle.onclick = () => setSidebar(!toc.classList.contains('open'));
  const escape = event => {
    if (event.key === 'Escape' && toc.classList.contains('open')) close();
  };
  const resize = () => setSidebar(desktop.matches ? read('sidebar-open', true) : false);
  resize();
  desktop.addEventListener('change', resize);
  document.addEventListener('keydown', escape);
  header.classList.remove('header-hidden');
  let headerReady = false;
  let headerFrame;
  let lastScroll = scrollY;
  let direction = 0;
  let distance = 0;
  function updateHeader() {
    const position = Math.max(0, scrollY);
    if (!headerReady) {
      lastScroll = position;
      return;
    }
    const delta = position - lastScroll;
    lastScroll = position;
    if (position < 30) {
      header.classList.remove('header-hidden');
      return;
    }
    if (!delta) return;
    const nextDirection = Math.sign(delta);
    distance = nextDirection === direction ? distance + Math.abs(delta) : Math.abs(delta);
    direction = nextDirection;
    if (distance >= 12 && !header.contains(document.activeElement)) {
      header.classList.toggle('header-hidden', direction > 0);
    }
  }
  const revealHeader = () => header.classList.remove('header-hidden');
  header.addEventListener('focusin', revealHeader);
  for (const item of novel.chapters) {
    const section = document.createElement('section');
    section.className = 'toc-chapter';
    const heading = document.createElement('div');
    heading.className = 'toc-chapter-heading';
    const toggle = document.createElement('button');
    toggle.className = 'toc-expand';
    toggle.type = 'button';
    const list = document.createElement('div');
    list.id = `toc-parts-${item.id}`;
    list.className = 'toc-parts';
    list.hidden = item.id !== chapter.id;
    toggle.setAttribute('aria-controls', list.id);
    function updateToggle() {
      toggle.textContent = list.hidden ? '▸' : '▾';
      toggle.setAttribute('aria-expanded', String(!list.hidden));
      toggle.setAttribute('aria-label', `${list.hidden ? '展开' : '折叠'}${item.title}目录`);
    }
    toggle.onclick = () => {
      list.hidden = !list.hidden;
      updateToggle();
    };
    updateToggle();
    const chapterLink = document.createElement('a');
    chapterLink.href = bookRoute({view:'read', chapter:item.id});
    const chapterLabel = item.excerpt ? `${item.title}　${item.excerpt}` : item.title;
    chapterLink.textContent = chapterLabel;
    chapterLink.title = chapterLabel;
    heading.append(toggle, chapterLink);
    item.parts.forEach((part, index) => {
      const link = document.createElement('a');
      link.href = bookRoute({view:'read', chapter:item.id, part:part.id});
      link.dataset.part = part.id;
      link.textContent = `${index + 1} · ${part.author}`;
      list.append(link);
    });
    section.append(heading, list);
    toc.querySelector('#toc-items').append(section);
  }

  const seen = new Set();
  chapter.paragraphs.forEach((segments,index)=>{
    const p = document.createElement('p');p.id=`p${index}`;
    for (const segment of segments) {
      const span = document.createElement('span');
      if (segment.part && !seen.has(segment.part)) {
        seen.add(segment.part);span.id=segment.part;
        const name = document.createElement('small');name.className='signature';name.textContent=chapter.parts.find(part=>part.id===segment.part).author;span.append(name);
      }
      for (const line of segment.text.split('\n')) {
        if (!line.trim()) continue;
        const textLine = document.createElement('span');
        textLine.className = 'prose-line';
        highlight(textLine, line, params.get('q') || '');
        span.append(textLine);
      }
      p.append(span);
    }
    app.querySelector('#prose').append(p);
  });
  const index = novel.chapters.indexOf(chapter);
  const nav=app.querySelector('.chapter-nav');
  for(const [label,target] of [['上一章',index-1],['下一章',index+1]]) {
    if(novel.chapters[target]) {const a=document.createElement('a');a.href=bookRoute({view:'read',chapter:novel.chapters[target].id});a.textContent=`${label} · ${novel.chapters[target].title}`;nav.append(a);}
  }
  if(index===novel.chapters.length-1) nav.innerHTML+='<span>已读完，<a href="#">返回书架</a></span>';
  const topNav = nav.cloneNode(true);
  topNav.classList.add('chapter-nav-top');
  topNav.setAttribute('aria-label', '章节导航');
  app.querySelector('.chapter-heading').before(topNav);
  const target=document.getElementById(params.get('part')||params.get('paragraph')||'');
  const atChapterStart = !params.has('part') && !params.has('q') &&
    (!params.has('paragraph') || params.get('paragraph') === 'p0') &&
    !(Number(params.get('ratio')) > 0);
  requestAnimationFrame(() => {
    document.documentElement.style.setProperty('--header-height', `${header.offsetHeight}px`);
    if (atChapterStart || !target) {
      scrollTo(0, 0);
    } else {
      target.scrollIntoView();
      if (params.has('q') && target.querySelector('mark')) {
        target.querySelector('mark').scrollIntoView({block:'center'});
      }
      if (params.has('ratio')) {
        scrollBy(0, Number(params.get('ratio')) * target.getBoundingClientRect().height);
      }
    }
    headerFrame = requestAnimationFrame(() => {
      lastScroll = Math.max(0, scrollY);
      direction = 0;
      distance = 0;
      if (atChapterStart) scrollTo(0, 0);
      lastScroll = Math.max(0, scrollY);
      headerReady = true;
      header.classList.remove('header-hidden');
    });
  });
  let timer;
  const initialProgress = {chapter:chapter.id, paragraph:params.get('paragraph') || 'p0', ratio:Number(params.get('ratio')) || 0};
  if(params.has('part')) {
    const paragraph = target?.closest('p');
    if(paragraph) initialProgress.paragraph = paragraph.id;
  }
  save(progressKey(novel.id), initialProgress);
  const onScroll=()=>{
    updateHeader();
    clearTimeout(timer);timer=setTimeout(()=>{
      const paragraphs=[...app.querySelectorAll('#prose > p')];
      const readingTop = header.offsetHeight + 32;
      const current=paragraphs.find(p=>p.getBoundingClientRect().bottom>readingTop)||paragraphs.at(-1);
      if(!current)return;
      const box=current.getBoundingClientRect();
      save(progressKey(novel.id),{chapter:chapter.id,paragraph:current.id,ratio:Math.max(0,(readingTop-box.top)/box.height)});
      const part=[...app.querySelectorAll('#prose span[id]')].filter(s=>s.getBoundingClientRect().top<180).at(-1);
      toc.querySelectorAll('[data-part]').forEach(a=>a.classList.toggle('active',a.dataset.part===part?.id));
    },120);
  };
  addEventListener('scroll',onScroll,{passive:true});
  return ()=>{headerSize.disconnect();cancelAnimationFrame(headerFrame);clearTimeout(timer);removeEventListener('scroll',onScroll);document.removeEventListener('keydown',escape);desktop.removeEventListener('change',resize);header.removeEventListener('focusin',revealHeader);header.classList.remove('header-hidden');document.body.classList.remove('sidebar-collapsed');};
}
