'use strict';
(()=>{
let elements=[],selected=null,gesture=null,fileTarget=null;
const intersects=(a,b)=>a.x<b.x+b.w-1e-9&&a.x+a.w>b.x+1e-9&&a.y<b.y+b.h-1e-9&&a.y+a.h>b.y+1e-9;
const valid=(box,id)=>box.x>=0&&box.y>=0&&box.x+box.w<=1&&box.y+box.h<=1&&!elements.some(e=>e.id!==id&&intersects(box,e))&&(!window.spectrumBounds||!intersects(box,window.spectrumBounds()));
window.spectrumPlacementValid=()=>!elements.some(e=>intersects(e,window.spectrumBounds()));
// Snap each axis independently using a threshold measured in preview pixels.
window.activeSnapLines={x:null,y:null};
window.clearSnapLines=()=>{window.activeSnapLines={x:null,y:null};};
window.getSelectedForeground=()=>selected;
window.getForegroundElements=()=>elements;
window.deselectForeground=()=>{if(selected){selected=null;refresh();}};
window.findForegroundAt=p=>elements.find(el=>p.x>=el.x&&p.x<=el.x+el.w&&p.y>=el.y&&p.y<=el.y+el.h);
window.isForegroundHandleHit=(p,el=selected)=>el?window.resizeCorner(p,el):null;
window.snapRectangle=(box,id)=>{
 if(!$('snapEnabled').checked){window.activeSnapLines={x:null,y:null};return box;}
 const rect=canvas.getBoundingClientRect(),scale=Math.min(rect.width/canvas.width,rect.height/canvas.height);
 const targets=[{x:0,y:0,w:1,h:1},...elements.filter(e=>e.id!==id)];
 if(id!=='spectrum')targets.push(window.spectrumBounds());
 const result={...box};
 for(const [axis,size,pixels] of [['x','w',canvas.width*scale],['y','h',canvas.height*scale]]){
  const anchors=[box[axis],box[axis]+box[size]/2,box[axis]+box[size]];
  let best=8/Math.max(1,pixels),delta=0,snapLine=null;
  for(const target of targets)for(const line of [target[axis],target[axis]+target[size]/2,target[axis]+target[size]])for(const anchor of anchors){
   const distance=line-anchor;if(Math.abs(distance)<best){best=Math.abs(distance);delta=distance;snapLine=line;}
  }
  result[axis]+=delta;
  if(!window.activeSnapLines)window.activeSnapLines={x:null,y:null};
  window.activeSnapLines[axis]=delta!==0?snapLine:null;
 }
 return result;
};
let nextId=0;
function item(type,x,y,w,h,text='YOUR MUSIC'){return {id:String(++nextId),type,x,y,w,h,text,font:'sans-serif',color:'#ffffff',size:40,alignX:'left',alignY:'top',image:null};}
// Fit the intrinsic image ratio inside a normalized canvas rectangle.
function imageBox(img,box){
 const ratio=img.width/img.height*canvas.height/canvas.width;
 const w=Math.min(box.w,box.h*ratio),h=w/ratio;
 return {...box,w,h};
}
let lastAspect=canvas.width/canvas.height;
function updateImageBounds(){
 const aspect=canvas.width/canvas.height;if(aspect===lastAspect)return;
 for(const e of elements)if(e.image)Object.assign(e,imageBox(e.image,e));
 lastAspect=aspect;
}
function syncAlignment(){
 for(const [id,key,fallback] of [['textAlignX','alignX','left'],['textAlignY','alignY','top']])
  $(id).querySelectorAll('button').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.align===(selected?.[key]||fallback))));
}
for(const [id,key] of [['textAlignX','alignX'],['textAlignY','alignY']])$(id).querySelectorAll('button').forEach(button=>button.onclick=()=>{if(!selected)return;selected[key]=button.dataset.align;syncAlignment();});
function refresh(){const list=$('elementList');list.replaceChildren();elements.forEach((e,i)=>list.add(new Option(e.type==='image'?(e.filename||'图片 '+(i+1)):'文字 '+(i+1),e.id)));list.value=selected?.id||'';$('elementEditor').hidden=!selected;if(!selected)return;$('replaceImage').hidden=selected.type!=='image';$('foregroundFilename').hidden=selected.type!=='image';$('foregroundFilename').textContent=selected.filename||'';$('textRow').hidden=selected.type!=='text';for(const id of ['textFont','textColor','textSize'])$(id).parentElement.hidden=selected.type!=='text';$('alignXRow').hidden=selected.type!=='text';$('alignYRow').hidden=selected.type!=='text';syncAlignment();$('textContent').value=selected.text;$('textFont').value=selected.font;$('textColor').value=selected.color;$('textSize').value=selected.size;$('elementScale').value=100;}
function add(type,img,filename=''){const e=item(type,0,0,.25,.18,type==='text'?'输入你的文字':'');if(img){e.image=img;e.filename=filename;Object.assign(e,imageBox(img,e));}let found=false;for(let y=.03;y<=.8&&!found;y+=.02)for(let x=.03;x<=.72;x+=.02){e.x=x;e.y=y;if(valid(e,e.id)){found=true;break;}}if(!found){img?.close();status('没有足够的空白位置，请先缩小或删除元素');return;}elements.push(e);selected=e;refresh();}
$('addText').onclick=()=>add('text');$('addImage').onclick=()=>{fileTarget=null;$('foregroundFile').click();};$('replaceImage').onclick=()=>{fileTarget=selected;$('foregroundFile').click();};
$('foregroundFile').onchange=async e=>{const f=e.target.files[0];if(!f)return;try{const img=await createImageBitmap(f);if(fileTarget&&elements.includes(fileTarget)){const box=imageBox(img,fileTarget);fileTarget.image?.close();Object.assign(fileTarget,box,{image:img,filename:f.name});refresh();}else add('image',img,f.name);}catch(err){status('图片读取失败：'+err.message);}e.target.value='';};
$('elementList').onchange=()=>{selected=elements.find(e=>e.id===$('elementList').value);refresh();};
for(const [id,key] of [['textContent','text'],['textFont','font'],['textColor','color'],['textSize','size']])$(id).oninput=()=>{if(!selected)return;selected[key]=key==='size'?Math.max(8,Math.min(200,+$(id).value||8)):$(id).value;};
$('removeElement').onclick=()=>{selected?.image?.close();elements=elements.filter(e=>e!==selected);selected=elements[0];refresh();};
$('elementScale').onchange=()=>{if(!selected)return;const factor=Math.max(.1,Math.min(2,+$('elementScale').value/100));const box={...selected,w:selected.w*factor,h:selected.h*factor};if(valid(box,selected.id))Object.assign(selected,box);else status('缩放区域与其他元素重叠或超出画幅');$('elementScale').value=100;};
window.drawForeground=(c,w,h,recording)=>{updateImageBounds();for(const e of elements){const x=e.x*w,y=e.y*h,ew=e.w*w,eh=e.h*h;c.save();c.beginPath();c.rect(x,y,ew,eh);c.clip();if(e.type==='image'){if(e.image){c.drawImage(e.image,x,y,ew,eh);}else if(!recording){c.fillStyle='#ffffff18';c.fillRect(x,y,ew,eh);c.fillStyle='#b6f577';c.font=`${Math.max(12,w/70)}px sans-serif`;c.fillText('＋ 选择后添加图片',x+10,y+eh/2);}}else{c.fillStyle=e.color;c.font=`${e.size*w/1280}px ${e.font.split(',').map(f=>{f=f.trim();return f.includes(' ')?JSON.stringify(f):f;}).join(',')}`;c.textBaseline='top';const lineHeight=e.size*w/1280*1.25,lines=[];let line='';
for(const char of e.text){if(char==='\n'||(line&&c.measureText(line+char).width>ew)){lines.push(line);line='';if(char==='\n')continue;}line+=char;}lines.push(line);
const alignX=e.alignX||'left',alignY=e.alignY||'top';c.textAlign=alignX;
const tx=alignX==='center'?x+ew/2:alignX==='right'?x+ew:x;
let ly=y+(alignY==='middle'?(eh-lines.length*lineHeight)/2:alignY==='bottom'?eh-lines.length*lineHeight:0);
for(const text of lines){c.fillText(text,tx,ly);ly+=lineHeight;}
}c.restore();if(e===selected&&!recording){c.save();c.strokeStyle='#b6f577';c.lineWidth=2;c.strokeRect(x,y,ew,eh);c.fillStyle='#b6f577';window.cornerHandles(c,x,y,ew,eh);c.restore();}}};
canvas.addEventListener('pointerdown',e=>{
 if(exporting||!buffer)return;
 const p=pointerPosition(e);
 const isHandle=selected&&window.isForegroundHandleHit(p,selected);
 const hit=isHandle?selected:elements.find(el=>p.x>=el.x&&p.x<=el.x+el.w&&p.y>=el.y&&p.y<=el.y+el.h);
 if(!hit){if(selected){selected=null;refresh();}return;}
 e.stopImmediatePropagation();
 selected=hit;refresh();
 window.deselectSpectrum?.();
 gesture={id:e.pointerId,p,original:{...hit},resize:window.resizeCorner(p,hit)};
 canvas.setPointerCapture(e.pointerId);
 canvas.style.cursor=gesture.resize?window.cornerCursor(gesture.resize):'grabbing';
},true);
canvas.addEventListener('pointermove',e=>{
 if(!gesture||exporting)return;
 e.stopImmediatePropagation();
 const p=pointerPosition(e),g=gesture,dx=p.x-g.p.x,dy=p.y-g.p.y;
 let box={...g.original};
 if(g.resize){
  box=window.resizeBox(g.original,g.p,p,g.resize,box.type!=='text',selected.id);
 }else{
  box.x+=dx;
  box.y+=dy;
  box=window.snapRectangle(box,selected.id);
 }
 if(valid(box,selected.id))Object.assign(selected,box);
},true);
for(const event of ['pointerup','pointercancel','lostpointercapture'])canvas.addEventListener(event,()=>{gesture=null;window.clearSnapLines?.();canvas.style.cursor='grab';});

let editor=null,editingElement=null;
function finishEdit(){
 if(!editor)return;
 const field=editor,target=editingElement;
 // Clear the active session before removing a focused node (which can fire blur).
 editor=null;editingElement=null;
 field.onblur=null;field.oninput=null;field.onkeydown=null;
 if(target&&elements.includes(target))target.text=field.value;
 field.remove();refresh();
}
document.addEventListener('pointerdown',event=>{
 if(editor&&!editor.contains(event.target))finishEdit();
},true);
document.addEventListener('keydown',event=>{
 if(editor&&(event.key==='Escape'||(event.key==='Enter'&&(event.ctrlKey||event.metaKey)))){
  event.preventDefault();event.stopPropagation();finishEdit();
 }
},true);
canvas.addEventListener('dblclick',event=>{
 if(exporting||!buffer)return;
 const p=pointerPosition(event),hit=elements.find(e=>e.type==='text'&&p.x>=e.x&&p.x<=e.x+e.w&&p.y>=e.y&&p.y<=e.y+e.h);
 if(!hit)return;finishEdit();selected=hit;refresh();window.deselectSpectrum?.();
 const rect=canvas.getBoundingClientRect(),scale=Math.min(rect.width/canvas.width,rect.height/canvas.height),w=canvas.width*scale,h=canvas.height*scale;
 editingElement=hit;editor=document.createElement('textarea');editor.className='canvas-text-editor';editor.value=hit.text;
 Object.assign(editor.style,{left:(rect.left+(rect.width-w)/2+hit.x*w)+'px',top:(rect.top+(rect.height-h)/2+hit.y*h)+'px',width:hit.w*w+'px',height:hit.h*h+'px',fontFamily:hit.font,fontSize:hit.size*w/1280+'px',color:hit.color,textAlign:hit.alignX||'left'});
 editor.setAttribute('aria-label','编辑文字');document.body.append(editor);editor.focus();editor.select();
 editor.oninput=()=>{hit.text=editor.value;$('textContent').value=hit.text;};editor.onblur=finishEdit;
 editor.onkeydown=e=>{if(e.key==='Escape'||(e.key==='Enter'&&(e.ctrlKey||e.metaKey))){e.preventDefault();finishEdit();}};
});
window.addEventListener('resize',finishEdit);
document.querySelector('aside').addEventListener('scroll',finishEdit);
})();
