import {partAtReadingLine} from './reader-position.js?v=20261115-toc-same-line';
import {progressKey, escapeHtml} from './library.js?v=20261115-punctuation';
import {highlight} from './search.js?v=20261115-codeblock-restored';
import {read, save} from './settings.js?v=20261105-settings2';
export function route(values={}) { return '#'+new URLSearchParams(values).toString(); }
let tocSelection;
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

  const items = toc.querySelector('#toc-items');
  const indicator = document.createElement('div');
  indicator.className = 'toc-selection';
  indicator.setAttribute('aria-hidden', 'true');
  items.prepend(indicator);
  let selectionAnimation;
  let selectedPart = params.get('part') || chapter.paragraphs[0]?.[0]?.part;
  if (tocSelection?.book === novel.id) toc.scrollTop = tocSelection.scrollTop;
  function selectPart(partId, animate = true) {
    const link = [...items.querySelectorAll('[data-part]')].find(a => a.dataset.part === partId);
    items.querySelectorAll('[data-part]').forEach(a => {
      const active = a === link;
      a.classList.toggle('active', active);
      if (active) a.setAttribute('aria-current', 'location');
      else a.removeAttribute('aria-current');
    });
    if (!link || !link.getClientRects().length) { indicator.hidden = true; return; }
    selectedPart = partId;
    const bounds = link.getBoundingClientRect();
    const origin = items.getBoundingClientRect();
    const next = {book:novel.id, top:bounds.top-origin.top, height:bounds.height, scrollTop:toc.scrollTop};
    const previous = tocSelection?.book === novel.id ? tocSelection : null;
    const currentTop = !indicator.hidden && indicator.style.top ? indicator.getBoundingClientRect().top - origin.top : previous?.top;
    indicator.hidden = false;
    indicator.style.top = `${next.top}px`;
    indicator.style.height = `${next.height}px`;
    if (animate && previous && previous.top !== next.top && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
      selectionAnimation?.cancel();
      selectionAnimation = indicator.animate([
        {transform:`translateY(${(currentTop ?? previous.top) - next.top}px)`},
        {transform:'translateY(0)'}
      ], {duration:240, easing:'cubic-bezier(.2,.8,.2,1)'});
    }
    tocSelection = next;
  }
  selectPart(selectedPart);
  const selectionSize = new ResizeObserver(() => selectPart(selectedPart, false));
  selectionSize.observe(items);

  const prose = app.querySelector('#prose');
  const sceneBreaks = new Set(chapter.sceneBreaks);
  const seen = new Set();
  chapter.paragraphs.forEach((segments,index)=>{
    const p = document.createElement(segments[0]?.type === 'image' ? 'figure' : 'p');p.id=`p${index}`;
    p.dataset.paragraph = '';
    if (segments[0]?.type === 'image') p.className = 'prose-image';
    if (chapter.paragraphStyles?.[index] === 'monospace') p.dataset.style = 'monospace';
    const alignment = chapter.paragraphAlignments?.[index];
    if (alignment === 'center' || alignment === 'right') p.dataset.align = alignment;
    const body = document.createElement('span');
    body.className = 'prose-text';
    for (const [segmentIndex, segment] of segments.entries()) {
      const span = document.createElement('span');
      let signature;
      if (segment.part && !seen.has(segment.part)) {
        seen.add(segment.part);
        span.id = segment.part;
        signature = document.createElement('small');
        signature.className = 'signature';
        signature.textContent = chapter.parts.find(part => part.id === segment.part).author;
        if (segmentIndex === 0) {
          const heading = document.createElement('span');
          heading.id = span.id;
          span.removeAttribute('id');
          heading.className = 'part-heading';
          heading.append(signature);
          p.append(heading);
        }
      }
      if (segment.type === 'image') {
        const image = document.createElement('img');
        image.src = segment.src;
        image.alt = segment.alt;
        image.width = segment.width;
        image.height = segment.height;
        image.loading = 'lazy';
        image.decoding = 'async';
        span.append(image);
        p.append(span);
        continue;
      }
      const textLine = document.createElement('span');
      textLine.className = 'prose-line';
      highlight(textLine, segment.text, params.get('q') || '');
      if (signature && segmentIndex > 0) {
        // Keep the label and first character together across automatic line wraps.
        const start = document.createElement('span');
        start.className = 'handoff-start';
        signature.classList.add('signature-inline');
        const firstCharacter = [...segment.text][0];
        const first = document.createElement('span');
        first.className = 'handoff-character';
        // Split the already-highlighted first character without losing a search match.
        const leading = [...textLine.childNodes].find(node => node.textContent.length);
        if (leading.nodeType === Node.TEXT_NODE) {
          first.textContent = firstCharacter;
          leading.deleteData(0, firstCharacter.length);
        } else {
          const mark = document.createElement('mark');
          mark.textContent = firstCharacter;
          first.append(mark);
          leading.firstChild.deleteData(0, firstCharacter.length);
        }
        start.append(signature, first);
        textLine.prepend(start);
      }
      span.append(textLine);
      body.append(span);
    }
    if (body.childElementCount) p.append(body);
    prose.append(p);
    if (sceneBreaks.has(index)) {
      const separator = document.createElement('div');
      separator.className = 'scene-break';
      separator.setAttribute('role', 'separator');
      separator.setAttribute('aria-label', '剧情分隔');
      prose.append(separator);
    }
  });
  // The paragraph heading already provides space above its first text line.
  const headedParagraphs = [...prose.querySelectorAll('p')].filter(paragraph =>
    paragraph.querySelector('.part-heading') && paragraph.querySelector('.handoff-start'));
  function updateFirstLineHandoffs() {
    const updates = [];
    for (const paragraph of headedParagraphs) {
      const firstLine = paragraph.querySelector('.prose-line');
      const walker = document.createTreeWalker(firstLine, NodeFilter.SHOW_TEXT);
      let text = walker.nextNode();
      while (text && !text.textContent.length) text = walker.nextNode();
      if (!text) continue;
      const range = document.createRange();
      range.setStart(text, 0);
      range.setEnd(text, [...text.textContent][0].length);
      const firstBottom = range.getBoundingClientRect().bottom;
      for (const start of paragraph.querySelectorAll('.handoff-start')) {
        const bottom = start.querySelector('.handoff-character').getBoundingClientRect().bottom;
        updates.push([start, Math.abs(bottom - firstBottom) < 1]);
      }
    }
    for (const [start, firstLine] of updates) start.classList.toggle('handoff-first-line', firstLine);
  }
  updateFirstLineHandoffs();
  const handoffSize = new ResizeObserver(updateFirstLineHandoffs);
  handoffSize.observe(prose);
  const handoffSettings = new MutationObserver(updateFirstLineHandoffs);
  handoffSettings.observe(document.documentElement, {attributes:true, attributeFilter:['style']});
  handoffSettings.observe(document.body, {attributes:true, attributeFilter:['class']});
  document.fonts.addEventListener('loadingdone', updateFirstLineHandoffs);
  const index = novel.chapters.indexOf(chapter);
  const nav=app.querySelector('.chapter-nav');
  for (const [label, target, className] of [
    ['上一章', novel.chapters[index - 1], 'chapter-prev'],
    ['下一章', novel.chapters[index + 1], 'chapter-next']
  ]) {
    if (!target) continue;
    const link = document.createElement('a');
    link.className = className;
    link.href = bookRoute({view:'read', chapter:target.id});
    link.textContent = `${label} · ${target.title}`;
    nav.append(link);
  }
  if (nav.childElementCount) {
    const topNav = nav.cloneNode(true);
    topNav.classList.add('chapter-nav-top');
    topNav.setAttribute('aria-label', '章节导航');
    app.querySelector('.chapter-heading').before(topNav);
  }
  if (index === novel.chapters.length - 1) {
    nav.insertAdjacentHTML('beforeend', '<span class="chapter-finished">已读完，<a href="#">返回书架</a></span>');
  }
  const anchor = document.getElementById(params.get('part') || params.get('paragraph') || '');
  const target = params.has('part') ? anchor?.querySelector('.handoff-start') || anchor : anchor;
  const atChapterStart = !params.has('part') && !params.has('q') &&
    (!params.has('paragraph') || params.get('paragraph') === 'p0') &&
    !(Number(params.get('ratio')) > 0);
  requestAnimationFrame(() => {
    document.documentElement.style.setProperty('--header-height', `${header.offsetHeight}px`);
    if (atChapterStart || !target) {
      scrollTo(0, 0);
    } else {
      // Short chapters still need enough room to align their final fragments.
      const readingTop = header.offsetHeight + 32;
      target.style.scrollMarginTop = `${readingTop}px`;
      const desiredScroll = scrollY + target.getBoundingClientRect().top - readingTop;
      const availableScroll = document.documentElement.scrollHeight - innerHeight;
      if (desiredScroll > availableScroll) {
        const spacer = document.createElement('div');
        spacer.setAttribute('aria-hidden', 'true');
        spacer.style.height = `${Math.ceil(desiredScroll - availableScroll)}px`;
        app.querySelector('.reader').append(spacer);
      }
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
    const paragraph = target?.closest('[data-paragraph]');
    if(paragraph) initialProgress.paragraph = paragraph.id;
  }
  save(progressKey(novel.id), initialProgress);
  const onScroll=()=>{
    updateHeader();
    clearTimeout(timer);timer=setTimeout(()=>{
      const paragraphs=[...app.querySelectorAll('#prose > [data-paragraph]')];
      const readingTop = header.offsetHeight + 32;
      const current=paragraphs.find(p=>p.getBoundingClientRect().bottom>readingTop)||paragraphs.at(-1);
      if(!current)return;
      const box=current.getBoundingClientRect();
      save(progressKey(novel.id),{chapter:chapter.id,paragraph:current.id,ratio:Math.max(0,(readingTop-box.top)/box.height)});
      const markers = [...prose.querySelectorAll('span[id]')].map(span => {
        // Compare the text line for both paragraph headings and inline handoffs.
        const text = span.classList.contains('part-heading')
          ? span.closest('[data-paragraph]').querySelector('.prose-line, img') || span
          : span.querySelector('.handoff-character') || span;
        return {id:span.id, top:text.getClientRects()[0]?.top ?? Infinity};
      });
      const lineHeight = parseFloat(getComputedStyle(prose).lineHeight);
      selectPart(partAtReadingLine(markers, readingTop + lineHeight, selectedPart,
        chapter.paragraphs[0]?.[0]?.part));
    },120);
  };
  addEventListener('scroll',onScroll,{passive:true});
  return ()=>{if(tocSelection?.book===novel.id){tocSelection.scrollTop=toc.scrollTop;if(!indicator.hidden)tocSelection.top=indicator.getBoundingClientRect().top-items.getBoundingClientRect().top;}handoffSize.disconnect();handoffSettings.disconnect();document.fonts.removeEventListener('loadingdone', updateFirstLineHandoffs);selectionSize.disconnect();selectionAnimation?.cancel();headerSize.disconnect();cancelAnimationFrame(headerFrame);clearTimeout(timer);removeEventListener('scroll',onScroll);document.removeEventListener('keydown',escape);desktop.removeEventListener('change',resize);header.removeEventListener('focusin',revealHeader);header.classList.remove('header-hidden');document.body.classList.remove('sidebar-collapsed');};
}
