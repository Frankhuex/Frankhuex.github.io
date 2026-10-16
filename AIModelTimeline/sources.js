 'use strict';
const escapeSource=value=>String(value).replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
document.getElementById('source-list').innerHTML=series.map(s=>`<article class="source-group" style="--accent:${s.color}"><h3>${escapeSource(s.name)} <small>／ ${escapeSource(s.company)}</small></h3><ul>${s.sources.map(([title,url])=>`<li><a href="${escapeSource(url)}" target="_blank" rel="noopener noreferrer">${escapeSource(title)} ↗</a></li>`).join('')}</ul></article>`).join('');
