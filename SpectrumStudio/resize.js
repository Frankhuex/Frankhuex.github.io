'use strict';
window.resizeCorner=(p,b)=>{
 const r=canvas.getBoundingClientRect(),s=Math.min(r.width/canvas.width,r.height/canvas.height);
 for(const [name,x,y] of [['nw',b.x,b.y],['ne',b.x+b.w,b.y],['sw',b.x,b.y+b.h],['se',b.x+b.w,b.y+b.h]])if(Math.abs(p.x-x)*canvas.width*s<12&&Math.abs(p.y-y)*canvas.height*s<12)return name;
 return null;
};
window.resizeBox=(b,start,p,corner,proportional,id)=>{
 const west=corner.includes('w'),north=corner.includes('n'),ax=west?b.x+b.w:b.x,ay=north?b.y+b.h:b.y;
 let w=Math.max(.01,b.w+(west?-1:1)*(p.x-start.x)),h=Math.max(.01,b.h+(north?-1:1)*(p.y-start.y));
 if(proportional){const f=Math.abs(w/b.w-1)>Math.abs(h/b.h-1)?w/b.w:h/b.h;w=b.w*f;h=b.h*f;}
 window.clearSnapLines?.();
 if($('snapEnabled').checked){
  const targets=[{x:0,y:0,w:1,h:1},...(window.getForegroundElements?.()||[]).filter(e=>e.id!==id)];if(id!=='spectrum')targets.push(window.spectrumBounds());
  const r=canvas.getBoundingClientRect(),s=Math.min(r.width/canvas.width,r.height/canvas.height);let candidates=[];
  for(const [axis,anchor,length,negative,pixels] of [['x',ax,w,west,canvas.width*s],['y',ay,h,north,canvas.height*s]]){
   let best=8,choice=null;
   for(const t of targets)for(const line of [t[axis],t[axis]+t[axis==='x'?'w':'h']/2,t[axis]+t[axis==='x'?'w':'h']])for(const fraction of [.5,1]){
    const wanted=(line-anchor)/(negative?-fraction:fraction),distance=Math.abs(wanted-length)*fraction*pixels;
    if(wanted>.01&&distance<best){best=distance;choice={axis,length:wanted,line,distance};}
   }if(choice)candidates.push(choice);
  }
  if(proportional&&candidates.length){const c=candidates.sort((a,b)=>a.distance-b.distance)[0],f=c.length/(c.axis==='x'?w:h);w*=f;h*=f;window.activeSnapLines[c.axis]=c.line;}
  else for(const c of candidates){if(c.axis==='x')w=c.length;else h=c.length;window.activeSnapLines[c.axis]=c.line;}
 }
 return {...b,x:west?ax-w:ax,y:north?ay-h:ay,w,h};
};
window.cornerHandles=(c,x,y,w,h)=>{for(const xx of [x,x+w])for(const yy of [y,y+h])c.fillRect(xx-5,yy-5,10,10);};

window.cornerCursor=corner=>(corner==='ne'||corner==='sw')?'nesw-resize':'nwse-resize';
