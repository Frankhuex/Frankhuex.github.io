'use strict';
const escapeHTML = value => String(value).replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
const preciseDates = {"GPT-4.5": "2025-02-27", "GPT-4.1": "2025-04-14", "GPT-5.1": "2025-11-12", "GPT-5.2": "2025-12-11", "GPT-5.3 Instant": "2026-03-03", "GPT-5.4": "2026-03-05", "GPT-5.5": "2026-04-24", "GPT-5.6": "2026-07-09", "GPT-6 Sol / Luna": "2026-09-22", "Claude 2.1": "2023-11-21", "Claude 3.5 Sonnet v2": "2024-10-22", "Claude Opus 4.1": "2025-08-05", "Claude Sonnet 4.5": "2025-09-29", "Claude Haiku 4.5": "2025-10-15", "Claude Opus 4.5": "2025-11-24", "Claude Sonnet 4.6": "2026-02-17", "Claude Opus 4.7": "2026-04-16", "Claude Opus 4.8": "2026-05-28", "Claude Fable / Mythos 5": "2026-06-09", "Claude Sonnet 5": "2026-06-30", "Claude Opus 5": "2026-07-24", "Claude Fable / Mythos 5.1": "2026-09-01", "Claude Opus 5.5": "2026-09-22", "Claude Sonnet 5.5": "2026-09-28", "Claude Haiku 5.5": "2026-10-07", "DeepSeek-V2.5": "2024-09-05", "DeepSeek-V3.1": "2025-08-21", "DeepSeek-V3.1-Terminus": "2025-09-22", "DeepSeek-V3.2-Exp": "2025-09-29", "GLM-4.1V-Thinking": "2025-07-01", "GLM-4.6": "2025-09-30", "GLM-4.7": "2025-12-22", "GLM-5.1": "2026-04-07", "GLM-5.2": "2026-06-16", "GLM-5.3": "2026-08-18", "豆包 1.8": "2025-12-18", "Gemini 3.5 Flash": "2026-05-19", "Gemini 3.6 Flash": "2026-07-21", "Gemini 3.7 Flash": "2026-08-13", "Gemini 3.8 Flash": "2026-09-02", "Gemini 4 Argon": "2026-10-13", "Qwen1.5": "2024-02-04", "Qwen3.6 Plus": "2026-04-02", "Qwen3.8 Max": "2026-08-03", "MiniMax M2.1": "2025-12-23", "MiniMax M2.5": "2026-02-12", "Grok 1.5": "2024-03-28", "Grok 1.5 Vision": "2024-04-12", "Grok 4.20": "2026-03-10", "Grok 4.5": "2026-07-08", "Grok 4.7": "2026-09-21", "GPT-1": "2018-06-11", "GPT-2": "2019-02-14", "GPT-3": "2020-05-28", "GPT-5": "2025-08-07", "GPT-6 Astra": "2026-09-03", "GPT-6.1 Sol": "2026-09-29", "Gemini 1.0 Ultra": "2024-02-08", "Gemini 1.5": "2024-02-15", "Claude Opus 4.6": "2026-02-05", "DeepSeek-V3.2": "2025-12-01", "GLM-4.5": "2025-07-28", "GLM-5.3-Flash": "2026-08-26", "Grok 4.6": "2026-08-12", "Claude 1.3": "2023-04-18", "Claude Instant 1.2": "2023-08-09", "GPT-5.3 Codex": "2026-02-05", "GLM": "2021-03-18", "DeepSeek-Coder": "2023-11-02", "DeepSeek LLM 67B": "2023-11-29", "Claude 早期测试": "2023-01-17", "Gemini 研发预告": "2023-05-10", "豆包 邀请测试": "2023-08-17"};
const cutoff = Date.UTC(2026,9,16);
const origin = Date.UTC(2018,0,1);
const geometry = {width:4500,height:1450,left:16,right:130,top:40,row:120};
const xAt = date => geometry.left+(date-origin)/(cutoff-origin)*(geometry.width-geometry.left-geometry.right);
const release = e => Date.parse((e[5] || preciseDates[e[1]] || e[0].replace('.','-')+'-01')+'T00:00:00Z');
const dateLabel = e => (e[5] || preciseDates[e[1]])?.replaceAll('-','.') || e[0];
const svgNS='http://www.w3.org/2000/svg';
const measure=document.createElement('canvas').getContext('2d');
series.sort((a,b)=>release(a.events[0])-release(b.events[0]));
const selectedNames=new Set(series.map(s=>s.name));
let shownSeries=series;
const font='-apple-system, BlinkMacSystemFont, "PingFang SC", "Microsoft YaHei", sans-serif';
measure.font=`650 18px ${font}`;
const nameWidth=Math.ceil(Math.max(...series.map(s=>measure.measureText(s.name).width)))+20;
geometry.right=nameWidth;
document.documentElement.style.setProperty('--name-width',`${nameWidth}px`);
// At maximum zoom every release interval fits its complete horizontal label.
measure.font=`500 14px ${font}`;
const maxTimelineWidth=Math.ceil(Math.max(...series.flatMap(s=>s.events.map((e,i)=>{
 const end=i+1<s.events.length?release(s.events[i+1]):cutoff;
 return (measure.measureText(e[1]).width+20)*(cutoff-origin)/(end-release(e));
}))))+geometry.left+geometry.right;

function buildTimeline(){
 shownSeries=series.filter(s=>selectedNames.has(s.name));
 const rowHeight=64;
 const layouts=shownSeries.map((s,i)=>({y:geometry.top+i*rowHeight+rowHeight/2}));
 geometry.height=shownSeries.length?geometry.top+shownSeries.length*rowHeight+35:260;
 const {width,height,left,right,top,row}=geometry;
 const parts=[`<svg xmlns="${svgNS}" xmlns:xlink="http://www.w3.org/1999/xlink" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" role="img" aria-label="大模型发展史" style="font-family:${escapeHTML(font)};background:#fff"><desc id="chart-desc">横向连续时间数轴。每条轨道表示一个系列，每个区间从该版本发布延伸至下一版本发布；最后区间延伸到资料截止日。</desc><rect width="100%" height="100%" fill="#fff"/>`];
 const txt=(value,x,y,size=17,color='#333f49',anchor='middle',weight=400)=>`<text x="${x}" y="${y}" font-size="${size}" fill="${color}" text-anchor="${anchor}" font-weight="${weight}">${escapeHTML(value)}</text>`;
 const line=(x,y,x2,y2,color,width=1,extra='')=>`<line x1="${x}" y1="${y}" x2="${x2}" y2="${y2}" stroke="${color}" stroke-width="${width}" ${extra}/>`;
 shownSeries.forEach((s,i)=>{
  const y=layouts[i].y;
  parts.push(`<g class="series-label">${txt(s.name,width-right+10,y+5,18,s.color,'start',650)}</g>`);


  s.events.forEach((e,j)=>{
   const start=release(e),end=j+1<s.events.length?release(s.events[j+1]):cutoff;
   const x=xAt(start),x2=xAt(end),center=(x+x2)/2;
   const desc=`${s.name} · ${e[1]}\n${dateLabel(e)} → ${j+1<s.events.length?dateLabel(s.events[j+1]):'至今'}\n${e[2]}`;
   const url=s.sources[e[3]][1];
   const boxWidth=x2-x,boxTop=y-rowHeight/2,clipId=`model-clip-${i}-${j}`;
   const narrow=boxWidth<48;
   parts.push(`<defs><clipPath id="${clipId}"><rect x="${x+2}" y="${boxTop+2}" width="${Math.max(0,boxWidth-4)}" height="${rowHeight-4}"/></clipPath></defs>`);
   parts.push(`<a data-start="${x}" data-end="${x2}" data-y="${y}" data-color="${s.color}" data-start-date="${escapeHTML(dateLabel(e))}" data-end-date="${escapeHTML(j+1<s.events.length?dateLabel(s.events[j+1]):'至今')}" href="${escapeHTML(url)}" xlink:href="${escapeHTML(url)}" target="_blank" rel="noopener noreferrer" tabindex="0" aria-label="${escapeHTML(desc)}"><title>${escapeHTML(desc)}</title><rect class="model-box" x="${x}" y="${boxTop}" width="${boxWidth}" height="${rowHeight}" fill="none" stroke="${s.color}" stroke-width="1.2" pointer-events="all"/>`);
   parts.push(`<g clip-path="url(#${clipId})" pointer-events="none"><text x="${narrow?center:x+8}" y="${y+5}" font-size="${narrow?11:14}" fill="#34414b" font-weight="500" ${narrow?`text-anchor="middle" transform="rotate(-90 ${center} ${y})"`:''}>${escapeHTML(e[1])}</text></g>`);
   parts.push('</a>');
  });
 });
 parts.push(`<g class="interaction-layer" pointer-events="none"><g id="date-cursor" visibility="hidden"><line id="cursor-line" y1="40" y2="${height-35}" stroke="#6c7780" stroke-width="1" stroke-dasharray="4 4"/><g id="cursor-badge"><rect x="-56" y="8" width="112" height="25" rx="4" fill="#28343e"/><text y="25" text-anchor="middle" fill="#fff" font-size="14" id="cursor-date"/></g></g><g id="endpoint-dates" visibility="hidden"/></g>`);
 if(!shownSeries.length)parts.push(txt('请勾选要显示的模型系列',width/2,85,20,'#7c8388'));
 parts.push('</svg>');
 document.getElementById('timeline').style.width=`${width}px`;
 document.getElementById('timeline').innerHTML=`<div class="timeline-header" aria-hidden="true"><span id="header-date" hidden></span></div><div class="sticky-labels" style="height:${height}px">${shownSeries.map((s,i)=>`<div style="top:${layouts[i].y-16}px;color:${s.color}"><a href="${escapeHTML(s.website)}" target="_blank" rel="noopener noreferrer" aria-label="${escapeHTML(s.name)} 官网，新标签页打开">${escapeHTML(s.name)}</a></div>`).join('')}</div>`+parts.join('');
}
let chart;
const scrollArea=document.querySelector('.timeline-scroll');
let cursor;
let endpointDates;
let lastPointer=null;
function keepLabelsVisible(){
 if(!chart)return;
 const visibleLeft=scrollArea.scrollLeft,visibleRight=visibleLeft+scrollArea.clientWidth-geometry.right;
 chart.querySelectorAll('a[data-start]').forEach(link=>{
  const start=Number(link.dataset.start),end=Number(link.dataset.end),y=Number(link.dataset.y);
  const text=link.querySelector('text');
  if(!text.dataset.originalX){text.dataset.originalX=text.getAttribute('x');text.dataset.originalTransform=text.getAttribute('transform')||'';text.dataset.originalAnchor=text.getAttribute('text-anchor')||'start';text.dataset.originalSize=text.getAttribute('font-size')}
  const left=Math.max(start,visibleLeft),right=Math.min(end,visibleRight),width=right-left;
  if(width<=0)return;
  if(width<48){
   const center=(left+right)/2;
   text.setAttribute('x',center);text.setAttribute('y',y+5);text.setAttribute('text-anchor','middle');text.setAttribute('font-size','11');text.setAttribute('transform',`rotate(-90 ${center} ${y})`);
  }else{
   measure.font=`500 14px ${font}`;
   const textWidth=measure.measureText(text.textContent).width;
   const x=width>=textWidth+16?Math.max(left+8,Math.min(start+8,right-textWidth-8)):left+8;
   text.setAttribute('x',x);text.setAttribute('y',y+5);text.setAttribute('text-anchor','start');text.setAttribute('font-size','14');text.removeAttribute('transform');
  }
 });
}
function highlightAt(x){
 chart?.querySelectorAll('a[data-start]').forEach(link=>{
  const active=x!==null&&x>=Number(link.dataset.start)&&(x<Number(link.dataset.end)||(x===geometry.width-geometry.right&&x===Number(link.dataset.end)));
  const box=link.querySelector('.model-box');box.setAttribute('fill',active?link.dataset.color:'none');box.setAttribute('fill-opacity',active?'.28':'1');
 });
}
const formatDate=timestamp=>new Date(timestamp).toISOString().slice(0,10).replaceAll('-','.');
function showEndpoints(link){
 if(!link){endpointDates.setAttribute('visibility','hidden');return}
 const y=Number(link.dataset.y);
 const badge=(x,date,dy)=>{
  const w=Math.max(110,date.length*14+18),cx=Math.max(geometry.left+w/2,Math.min(geometry.width-geometry.right-w/2,x));
  return `<line x1="${x}" y1="${y-9}" x2="${x}" y2="${y+9}" stroke="#28343e" stroke-width="2"/><path d="M${x},${y+(dy<0?-10:10)} L${cx},${y+dy+(dy<0?9:-20)}" fill="none" stroke="#a1a8ae"/><rect x="${cx-w/2}" y="${y+dy-18}" width="${w}" height="27" rx="4" fill="#f0f3f5"/><text x="${cx}" y="${y+dy}" text-anchor="middle" font-size="14" fill="#27343e">${escapeHTML(date)}</text>`;
 };
 endpointDates.innerHTML=badge(Number(link.dataset.start),link.dataset.startDate,-57)+badge(Number(link.dataset.end),link.dataset.endDate,65);
 endpointDates.setAttribute('visibility','visible');
}
function updatePointer(event){
 const matrix=chart.getScreenCTM();if(!matrix)return;
 const point=new DOMPoint(event.clientX,event.clientY).matrixTransform(matrix.inverse());
 const viewport=scrollArea.getBoundingClientRect();
 // The series names cover the right edge of the viewport.
 if(event.clientX>viewport.left+scrollArea.clientWidth-geometry.right||point.x<geometry.left||point.x>geometry.width-geometry.right){cursor.setAttribute('visibility','hidden');highlightAt(null);document.getElementById('header-date').hidden=true;showEndpoints(null);return}
 const x=point.x;
 highlightAt(x);
 const timestamp=origin+(x-geometry.left)/(geometry.width-geometry.left-geometry.right)*(cutoff-origin);
 document.getElementById('cursor-line').setAttribute('x1',x);document.getElementById('cursor-line').setAttribute('x2',x);
 const badgeX=Math.max(geometry.left+56,Math.min(geometry.width-56,x));
 document.getElementById('cursor-badge').setAttribute('transform',`translate(${badgeX} 0)`);
 document.getElementById('cursor-date').textContent=formatDate(timestamp);
 const headerDate=document.getElementById('header-date');
 headerDate.textContent=formatDate(timestamp);headerDate.hidden=false;headerDate.style.left=`${Math.max(scrollArea.scrollLeft+geometry.left+56,Math.min(scrollArea.scrollLeft+scrollArea.clientWidth-geometry.right-56,badgeX))}px`;
 cursor.setAttribute('visibility','visible');
 const target=document.elementFromPoint(event.clientX,event.clientY);
 showEndpoints(target?.closest('a[data-start]'));
}
scrollArea.addEventListener('pointermove',event=>{if(event.pointerType==='touch')return;lastPointer={clientX:event.clientX,clientY:event.clientY};updatePointer(lastPointer)});
scrollArea.addEventListener('pointerleave',()=>{lastPointer=null;cursor.setAttribute('visibility','hidden');highlightAt(null);document.getElementById('header-date').hidden=true;showEndpoints(null)});
scrollArea.addEventListener('scroll',()=>{keepLabelsVisible();if(lastPointer)updatePointer(lastPointer)},{passive:true});
function renderSelection(){
 lastPointer=null;
 buildTimeline();
 chart=document.querySelector('#timeline>svg');cursor=document.getElementById('date-cursor');endpointDates=document.getElementById('endpoint-dates');
 chart.addEventListener('focusin',event=>showEndpoints(event.target.closest('a[data-start]')));
 chart.addEventListener('focusout',()=>showEndpoints(null));

 const all=document.getElementById('select-all');all.checked=selectedNames.size===series.length;all.indeterminate=selectedNames.size>0&&selectedNames.size<series.length;
 document.getElementById('selection-count').textContent=`已选 ${selectedNames.size} / ${series.length}`;
 document.getElementById('download').disabled=selectedNames.size===0;
 syncNavigator();
 keepLabelsVisible();
}
const rangeTrack=document.getElementById('range-track');
const rangeWindow=document.getElementById('range-window');
const clamp=(value,min,max)=>Math.max(min,Math.min(max,value));
let rangeDrag=null,rangeFrame=0;
document.querySelector('.range-years').innerHTML=Array.from({length:9},(_,i)=>`<span style="left:${(Date.UTC(2018+i,0,1)-origin)/(cutoff-origin)*100}%">${2018+i}</span>`).join('');
function syncNavigator(){
 const total=geometry.width-geometry.left-geometry.right,visible=Math.max(1,scrollArea.clientWidth-geometry.left-geometry.right);
 const fraction=Math.min(1,visible/total),start=clamp(scrollArea.scrollLeft/total,0,1-fraction);
 rangeWindow.style.left=`${start*100}%`;rangeWindow.style.width=`${fraction*100}%`;
 const startDate=origin+start*(cutoff-origin),endDate=Math.min(cutoff,origin+(start+fraction)*(cutoff-origin));
 rangeWindow.setAttribute('aria-valuemin','0');rangeWindow.setAttribute('aria-valuemax','100');rangeWindow.setAttribute('aria-valuenow',String(Math.round(start*100)));
 rangeWindow.setAttribute('aria-valuetext',`${formatDate(startDate)} 至 ${formatDate(endDate)}`);
}
function applyRangeDrag(){
 rangeFrame=0;if(!rangeDrag)return;
 const d=rangeDrag,dx=d.x-d.startX,dy=d.y-d.startY;
 const total=clamp(d.total*Math.exp(dy*.008),Math.max(1,scrollArea.clientWidth-geometry.left-geometry.right),maxTimelineWidth-geometry.left-geometry.right);
 const visible=Math.max(1,scrollArea.clientWidth-geometry.left-geometry.right);
 const center=clamp(d.center+dx/d.trackWidth,visible/total/2,1-visible/total/2);
 const width=Math.round(total+geometry.left+geometry.right),scrollTop=scrollArea.scrollTop;
 if(width!==geometry.width){geometry.width=width;renderSelection();scrollArea.scrollTop=scrollTop}
 scrollArea.scrollLeft=(center-visible/(geometry.width-geometry.left-geometry.right)/2)*(geometry.width-geometry.left-geometry.right);
 syncNavigator();
}
rangeWindow.addEventListener('pointerdown',event=>{
 if(event.button!==0)return;event.preventDefault();
 const total=geometry.width-geometry.left-geometry.right,visible=scrollArea.clientWidth-geometry.left-geometry.right;
 rangeDrag={startX:event.clientX,startY:event.clientY,x:event.clientX,y:event.clientY,total,center:(scrollArea.scrollLeft+visible/2)/total,trackWidth:rangeTrack.clientWidth};
 rangeWindow.setPointerCapture(event.pointerId);rangeWindow.classList.add('dragging');

});
rangeWindow.addEventListener('pointermove',event=>{
 if(!rangeDrag)return;rangeDrag.x=event.clientX;rangeDrag.y=event.clientY;
 if(!rangeFrame)rangeFrame=requestAnimationFrame(applyRangeDrag);
});
function finishRangeDrag(){
 if(rangeFrame){cancelAnimationFrame(rangeFrame);applyRangeDrag()}
 rangeDrag=null;rangeWindow.classList.remove('dragging');
}
window.addEventListener('blur',finishRangeDrag);

rangeWindow.addEventListener('pointerup',finishRangeDrag);
rangeWindow.addEventListener('pointercancel',finishRangeDrag);
rangeWindow.addEventListener('lostpointercapture',finishRangeDrag);
rangeWindow.addEventListener('keydown',event=>{
 if(event.key==='ArrowLeft'||event.key==='ArrowRight'){event.preventDefault();scrollArea.scrollLeft+=(event.key==='ArrowLeft'?-1:1)*(scrollArea.clientWidth-geometry.left-geometry.right)*.15}
 if(['ArrowUp','ArrowDown','+','-','='].includes(event.key)){
  event.preventDefault();const visible=scrollArea.clientWidth-geometry.left-geometry.right,total=geometry.width-geometry.left-geometry.right,center=(scrollArea.scrollLeft+visible/2)/total;
  geometry.width=Math.round(clamp(total*(['ArrowUp','+','='].includes(event.key)?1.25:.8),visible,maxTimelineWidth-geometry.left-geometry.right)+geometry.left+geometry.right);
  const top=scrollArea.scrollTop;renderSelection();scrollArea.scrollTop=top;scrollArea.scrollLeft=center*(geometry.width-geometry.left-geometry.right)-visible/2;
 }syncNavigator();
});
scrollArea.addEventListener('scroll',syncNavigator,{passive:true});
new ResizeObserver(()=>{syncNavigator();keepLabelsVisible()}).observe(scrollArea);
document.getElementById('model-options').innerHTML=series.map(s=>`<label style="--accent:${s.color}"><input type="checkbox" value="${escapeHTML(s.name)}" checked>${escapeHTML(s.name)}</label>`).join('');
document.getElementById('model-options').addEventListener('change',event=>{
 const input=event.target;if(!input.matches('input[type="checkbox"]'))return;
 if(input.checked)selectedNames.add(input.value);else selectedNames.delete(input.value);
 renderSelection();
});
document.getElementById('select-all').addEventListener('change',event=>{
 selectedNames.clear();if(event.target.checked)series.forEach(s=>selectedNames.add(s.name));
 document.querySelectorAll('#model-options input').forEach(input=>input.checked=event.target.checked);
 renderSelection();
});
renderSelection();
async function createPoster(scale=2){
 await document.fonts.ready;
 const savedWidth=geometry.width,savedLeft=scrollArea.scrollLeft,savedTop=scrollArea.scrollTop;
 const posterWidth=Math.min(savedWidth,12000);
 let svg;
 try{
  if(posterWidth!==savedWidth){geometry.width=posterWidth;renderSelection()}
  svg=document.querySelector('#timeline>svg').cloneNode(true);
 }finally{
  if(posterWidth!==savedWidth){geometry.width=savedWidth;renderSelection();scrollArea.scrollLeft=savedLeft;scrollArea.scrollTop=savedTop}
 }

 svg.querySelectorAll('a[data-start] text').forEach(text=>{
  if(!text.dataset.originalX)return;
  text.setAttribute('x',text.dataset.originalX);text.setAttribute('font-size',text.dataset.originalSize);text.setAttribute('text-anchor',text.dataset.originalAnchor);
  if(text.dataset.originalTransform)text.setAttribute('transform',text.dataset.originalTransform);else text.removeAttribute('transform');
 });
 svg.querySelector('.interaction-layer')?.remove();
 svg.querySelectorAll('.model-box').forEach(box=>{box.setAttribute('fill','none');box.removeAttribute('fill-opacity')});
 const heading=document.createElementNS(svgNS,'text');heading.setAttribute('x','16');heading.setAttribute('y','26');heading.setAttribute('font-size','20');heading.setAttribute('font-weight','650');heading.setAttribute('fill','#202a35');heading.textContent='大模型发展史';svg.appendChild(heading);
 const caption=document.createElementNS(svgNS,'text');caption.setAttribute('x','250');caption.setAttribute('y','26');caption.setAttribute('font-size','12');caption.setAttribute('fill','#7c8388');caption.textContent='数据截至 2026.10.16';svg.appendChild(caption);
 const blob=new Blob([new XMLSerializer().serializeToString(svg)],{type:'image/svg+xml;charset=utf-8'});
 const url=URL.createObjectURL(blob);
 try{
  const img=new Image();img.src=url;await img.decode();
  const canvas=document.createElement('canvas');canvas.width=posterWidth*scale;canvas.height=geometry.height*scale;
  const c=canvas.getContext('2d');if(!c)throw new Error('浏览器未能创建画布');
  c.drawImage(img,0,0,canvas.width,canvas.height);return canvas;
 }finally{URL.revokeObjectURL(url)}
}
const downloadButton=document.getElementById('download');
let statusTimer;
function announce(message){clearTimeout(statusTimer);document.getElementById('status').textContent=message;statusTimer=setTimeout(()=>{document.getElementById('status').textContent=''},6500)}
downloadButton.addEventListener('click',async()=>{downloadButton.disabled=true;announce('正在生成数轴图片…');try{const canvas=await createPoster();const blob=await new Promise((resolve,reject)=>canvas.toBlob(b=>b?resolve(b):reject(new Error('图片编码失败')),'image/png'));const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=`AI-${shownSeries.length}系列区间时间轴-2026-10.png`;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),60000);announce(`高清 PNG 已生成（${canvas.width} × ${canvas.height}）`)}catch(error){announce('导出失败：'+error.message)}finally{downloadButton.disabled=false}});
