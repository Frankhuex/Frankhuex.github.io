const LIMIT = 50;
export function normalizeHistory(value) {
  if (!Array.isArray(value)) return [];
  const seen = new Set();
  return value.filter(item => item && typeof item.query === 'string' && item.query.trim() &&
    Number.isFinite(item.time) && item.time > 0 && Number.isFinite(new Date(item.time).getTime()))
    .map(item => ({query:item.query.trim(), time:item.time}))
    .sort((a, b) => b.time - a.time)
    .filter(item => !seen.has(item.query) && seen.add(item.query)).slice(0, LIMIT);
}
export function recordSearch(history, query, time = Date.now()) {
  query = query.trim();
  return normalizeHistory(query ? [{query, time}, ...normalizeHistory(history).filter(item => item.query !== query)] : history);
}
export function renderSearchHistory(container, history, actions) {
  container.replaceChildren();
  const heading = document.createElement('div');
  heading.className = 'search-history-heading';
  const title = document.createElement('h2'); title.textContent = '搜索历史';
  const clear = document.createElement('button');
  clear.type = 'button'; clear.textContent = '清除全部'; clear.disabled = !history.length;
  clear.onclick = actions.clear;
  heading.append(title, clear); container.append(heading);
  if (!history.length) {
    const empty = document.createElement('p'); empty.className = 'search-history-empty';
    empty.textContent = '暂无搜索历史'; container.append(empty); return;
  }
  const list = document.createElement('ul');
  const format = new Intl.DateTimeFormat('zh-CN', {year:'numeric', month:'2-digit', day:'2-digit', hour:'2-digit', minute:'2-digit', second:'2-digit', hour12:false});
  for (const item of history) {
    const row = document.createElement('li');
    const keyword = document.createElement('button');
    keyword.type = 'button'; keyword.className = 'history-keyword'; keyword.textContent = item.query;
    keyword.title = item.query; keyword.onclick = () => actions.search(item.query);
    const time = document.createElement('time');
    time.dateTime = new Date(item.time).toISOString(); time.textContent = format.format(item.time);
    const remove = document.createElement('button');
    remove.type = 'button'; remove.className = 'history-remove'; remove.textContent = '×';
    remove.setAttribute('aria-label', `删除搜索记录：${item.query}`);
    remove.title = '删除这条记录'; remove.onclick = () => actions.remove(item.query);
    row.append(keyword, time, remove); list.append(row);
  }
  container.append(list);
}
