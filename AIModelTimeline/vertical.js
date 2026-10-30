'use strict';
const verticalPanel=document.createElement('section');verticalPanel.className='vertical-panel';verticalPanel.hidden=true;
verticalPanel.innerHTML='<div class="vertical-nav"><div class="vertical-window" tabindex="0" role="slider" aria-label="左右拖动平移，上下拖动缩放" aria-orientation="horizontal"></div></div><div class="vertical-scroll"><div class="vertical-content"></div></div>';
scrollArea.after(verticalPanel);
const vs=verticalPanel.querySelector('.vertical-scroll'),vc=verticalPanel.querySelector('.vertical-content'),vn=verticalPanel.querySelector('.vertical-nav'),vw=verticalPanel.querySelector('.vertical-window');
let vertical=false,vLength=4500,vDrag=null;
const vAxisWidth=37;
const vy=date=>44+(date-origin)/(cutoff-origin)*vLength;
function renderVertical(){
 const families=series.filter(s=>selectedNames.has(s.name));
 vc.style.width=`${vAxisWidth+families.length*48}px`;
 verticalPanel.style.width=`${vAxisWidth+families.length*48}px`;
 vc.innerHTML=`<div class="vertical-head"><span>日期</span>${families.map(s=>`<a href="${escapeHTML(s.website)}" target="_blank" rel="noopener" style="color:${s.color}">${escapeHTML(s.name)}</a>`).join('')}</div><div class="vertical-body" style="height:${vLength+44}px"></div>`;
 const body=vc.querySelector('.vertical-body');
 let html='<div class="vertical-ruler">';const mode=vLength/(cutoff-origin)*86400000>=20?'day':vLength/(cutoff-origin)*86400000*28>=80?'month':'year';
 for(let t=origin;t<=cutoff;){const d=new Date(t),label=mode==='year'?String(d.getUTCFullYear()):mode==='month'?formatDate(t).slice(0,7):formatDate(t).slice(5);html+=`<div class="vertical-tick" style="top:${vy(t)}px">${label}</div>`;t=mode==='year'?Date.UTC(d.getUTCFullYear()+1,0,1):mode==='month'?Date.UTC(d.getUTCFullYear(),d.getUTCMonth()+1,1):t+86400000}
 html+='</div>';
 families.forEach((s,i)=>s.events.forEach((e,j)=>{const start=release(e),end=j+1<s.events.length?release(s.events[j+1]):cutoff;html+=`<a class="vertical-model" data-from="${start}" data-to="${end}" data-start-date="${dateLabel(e)}" data-end-date="${j+1<s.events.length?dateLabel(s.events[j+1]):'至今'}" href="${escapeHTML(s.sources[e[3]][1])}" target="_blank" rel="noopener" style="left:${vAxisWidth+i*48}px;top:${vy(start)}px;height:${Math.max(0,vy(end)-vy(start))}px;--accent:${s.color}" title="${escapeHTML(e[1])} · ${dateLabel(e)} → ${j+1<s.events.length?dateLabel(s.events[j+1]):'至今'}"><span>${escapeHTML(e[1])}</span></a>`}));
 body.innerHTML=html+'<div class="vertical-cross" hidden></div>';syncVertical();
}
function syncVertical(){keepVerticalLabelsVisible();const visible=Math.max(1,vs.clientHeight-44),fraction=Math.min(1,visible/vLength);vw.style.left=`${Math.min(1-fraction,vs.scrollTop/vLength)*100}%`;vw.style.width=`${fraction*100}%`;vw.setAttribute('aria-valuenow',String(Math.round(vs.scrollTop/vLength*100)));vw.setAttribute('aria-valuetext',`${formatDate(origin+vs.scrollTop/vLength*(cutoff-origin))} 至 ${formatDate(Math.min(cutoff,origin+(vs.scrollTop+visible)/vLength*(cutoff-origin)))}`);vw.setAttribute('aria-valuemin','0');vw.setAttribute('aria-valuemax','100');}
vs.addEventListener('scroll',syncVertical);
vw.addEventListener('pointerdown',e=>{if(e.button!==0)return;e.preventDefault();vDrag={x:e.clientX,y:e.clientY,length:vLength,center:(vs.scrollTop+(vs.clientHeight-44)/2)/vLength};vw.setPointerCapture(e.pointerId);vw.classList.add('dragging')});
vw.addEventListener('pointermove',e=>{if(!vDrag)return;const visible=Math.max(1,vs.clientHeight-44);vLength=clamp(vDrag.length*Math.exp((e.clientY-vDrag.y)*.008),visible,maxTimelineWidth);const center=clamp(vDrag.center+(e.clientX-vDrag.x)/vn.clientWidth,visible/vLength/2,1-visible/vLength/2);renderVertical();vs.scrollTop=center*vLength-visible/2;syncVertical()});
for(const type of ['pointerup','pointercancel','lostpointercapture'])vw.addEventListener(type,()=>{vDrag=null;vw.classList.remove('dragging')});
vw.addEventListener('keydown',e=>{if(['ArrowLeft','ArrowRight'].includes(e.key)){e.preventDefault();vs.scrollTop+=(e.key==='ArrowLeft'?-1:1)*vs.clientHeight*.15}if(['ArrowUp','ArrowDown','+','-','='].includes(e.key)){e.preventDefault();const center=(vs.scrollTop+vs.clientHeight/2)/vLength;vLength=clamp(vLength*(['ArrowUp','+','='].includes(e.key)?1.25:.8),vs.clientHeight,maxTimelineWidth);renderVertical();vs.scrollTop=center*vLength-vs.clientHeight/2}});
vs.addEventListener('pointermove',e=>{if(e.pointerType==='touch')return;const y=e.clientY-vs.getBoundingClientRect().top+vs.scrollTop-44,t=origin+(y-44)/vLength*(cutoff-origin);const cross=vc.querySelector('.vertical-cross');cross.hidden=false;cross.style.top=`${y}px`;cross.textContent=formatDate(clamp(t,origin,cutoff));vc.querySelectorAll('.vertical-model').forEach(a=>a.classList.toggle('active',t>=+a.dataset.from&&t<+a.dataset.to))});
vs.addEventListener('pointerleave',()=>{vc.querySelector('.vertical-cross').hidden=true;vc.querySelectorAll('.active').forEach(a=>a.classList.remove('active'))});
document.getElementById('orientation').addEventListener('click',e=>{vertical=!vertical;verticalPanel.hidden=!vertical;scrollArea.hidden=vertical;document.querySelector('.range-navigator').hidden=vertical;e.currentTarget.textContent=vertical?'横向':'纵向';e.currentTarget.setAttribute('aria-pressed',String(vertical));if(vertical)renderVertical()});
document.getElementById('model-options').addEventListener('change',()=>{if(vertical)renderVertical()});document.getElementById('select-all').addEventListener('change',()=>{if(vertical)renderVertical()});
new ResizeObserver(()=>{if(vertical){renderVertical();syncVertical()}}).observe(vs);

function keepVerticalLabelsVisible(){
 if(!vertical)return;
 const viewport=vs.getBoundingClientRect();
 const top=viewport.top+44,bottom=viewport.top+vs.clientHeight;
 vc.querySelectorAll('.vertical-model').forEach(box=>{
  const rect=box.getBoundingClientRect(),label=box.querySelector('span');
  const visibleTop=Math.max(rect.top+1,top),visibleBottom=Math.min(rect.bottom-1,bottom);
  if(visibleBottom<=visibleTop)return;
  const left=Math.max(rect.left+1,viewport.left+vAxisWidth),right=Math.min(rect.right-1,viewport.left+vs.clientWidth);
  if(right<=left)return;
  label.style.left=`${Math.max(0,left-rect.left+3)}px`;
  label.style.width=`${Math.max(1,right-left-6)}px`;
  const height=label.offsetHeight;
  const desired=visibleTop+3;
  const y=Math.max(visibleTop,Math.min(desired,visibleBottom-height-3));
  label.style.top=`${Math.max(0,y-rect.top-1)}px`;
 });
}

// Viewport overlays keep dates readable even when interval endpoints are offscreen.
const vDates=document.createElement('div');vDates.className='vertical-dates';vDates.hidden=true;document.body.appendChild(vDates);
let vPointer=null,vFocused=null;
function updateVerticalDates(event){
 if(!vertical)return;
 const view=vs.getBoundingClientRect(),top=view.top+44,bottom=view.bottom;
 const target=vFocused||(event&&document.elementFromPoint(event.clientX,event.clientY)?.closest('.vertical-model'));
 const y=event?event.clientY:target?.getBoundingClientRect().top;
 if(y===undefined||y<top||y>bottom){vDates.hidden=true;return}
 const time=clamp(origin+(y-view.top+vs.scrollTop-88)/vLength*(cutoff-origin),origin,cutoff);
 let html=`<span class="v-current" style="left:${view.left}px;top:${view.top+10}px">${formatDate(time)}</span>`;
 if(target){const r=target.getBoundingClientRect(),x=clamp(r.left,view.left+vAxisWidth,Math.max(view.left+vAxisWidth,view.right-vAxisWidth-32));
 for(const [value,pos] of [[target.dataset.startDate,r.top],[target.dataset.endDate,r.bottom]]){const yy=clamp(pos,top+4,bottom-25);html+=`<span style="left:${x}px;top:${yy}px">${escapeHTML(value)}</span>`}}
 vDates.innerHTML=html;vDates.hidden=false;
}
vs.addEventListener('pointermove',e=>{vPointer={clientX:e.clientX,clientY:e.clientY};updateVerticalDates(vPointer)});
vs.addEventListener('pointerleave',()=>{vPointer=null;if(!vFocused)vDates.hidden=true});
vs.addEventListener('focusin',e=>{vFocused=e.target.closest('.vertical-model');if(vFocused){const r=vFocused.getBoundingClientRect();updateVerticalDates({clientX:r.left,clientY:Math.max(vs.getBoundingClientRect().top+45,r.top+2)})}});
vs.addEventListener('focusout',()=>{vFocused=null;vDates.hidden=true});
vs.addEventListener('scroll',()=>{if(vPointer||vFocused)updateVerticalDates(vPointer)});
document.getElementById('orientation').addEventListener('click',()=>{vDates.hidden=true;vPointer=null;vFocused=null});
window.addEventListener('blur',()=>{vDrag=null;vDates.hidden=true});
const vyears=document.createElement('div');vyears.className='vertical-years';vn.appendChild(vyears);
for(let year=2018;year<=2026;year++){const tick=document.createElement('span');tick.className='vertical-year';tick.textContent=year;tick.style.left=`${(Date.UTC(year,0,1)-origin)/(cutoff-origin)*100}%`;vyears.appendChild(tick)}
