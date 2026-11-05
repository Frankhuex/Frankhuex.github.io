export function search(novel, query) {
  const term = query.toLocaleLowerCase();
  const results = [];
  for (const chapter of novel.chapters) {
    chapter.paragraphs.forEach((segments, index) => {
      const text = segments.map(s=>s.text).join('');
      const offset = text.toLocaleLowerCase().indexOf(term);
      const authors = [...new Set(segments.map(s=>chapter.parts.find(p=>p.id===s.part)?.author).filter(Boolean))].join(' / ');
      const metadata = `${novel.title} ${chapter.title} ${authors}`.toLocaleLowerCase().includes(term);
      if (offset >= 0 || metadata) results.push({chapter,index,text,authors,offset,rank:metadata?0:1});
    });
  }
  return results.sort((a,b)=>a.rank-b.rank);
}
export function highlight(element, text, query) {
  if (!query) { element.append(document.createTextNode(text)); return; }
  let cursor = 0;
  const lower = text.toLocaleLowerCase();
  let offset = lower.indexOf(query.toLocaleLowerCase());
  while (offset >= 0) {
    element.append(document.createTextNode(text.slice(cursor,offset)));
    const mark = document.createElement('mark'); mark.textContent = text.slice(offset,offset+query.length); element.append(mark);
    cursor = offset+query.length; offset = lower.indexOf(query.toLocaleLowerCase(),cursor);
  }
  element.append(document.createTextNode(text.slice(cursor)));
}
