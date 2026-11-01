'use strict';
const $=id=>document.getElementById(id),canvas=$('canvas'),ctx=canvas.getContext('2d');
let ac,buffer,source,analyser,dest,start=0,offset=0,playing=false,image=null,recorder,exporting=false,cancelled=false,url,bins;
const v=id=>$(id).value, status=s=>$('status').textContent=s;
function dimensions(){const short=+v('resolution'),ratio=+v('ratio');canvas.width=Math.round((ratio>=1?short*ratio:short)/2)*2;canvas.height=Math.round((ratio>=1?short:short/ratio)/2)*2;}
function position(){return playing?Math.min(buffer.duration,offset+ac.currentTime-start):offset;}
function stop(){if(source){source.onended=null;source.stop();source.disconnect();source=null;}if(playing)offset=position();playing=false;$('play').textContent='▶';}
async function play(){await ac.resume();if(offset>=buffer.duration)offset=0;source=ac.createBufferSource();source.buffer=buffer;source.connect(analyser);start=ac.currentTime;playing=true;source.start(0,offset);source.onended=()=>{offset=buffer.duration;playing=false;$('play').textContent='▶';if(exporting)recorder.stop();};$('play').textContent='Ⅱ';}
$('play').onclick=()=>playing?stop():play();
$('audioFile').onchange=async e=>{const file=e.target.files[0];if(!file)return;try{stop();status('正在解码音频…');ac ||= new AudioContext();buffer=await ac.decodeAudioData(await file.arrayBuffer());if(analyser)analyser.disconnect();analyser=ac.createAnalyser();analyser.fftSize=4096;analyser.smoothingTimeConstant=.8;analyser.connect(ac.destination);dest=ac.createMediaStreamDestination();analyser.connect(dest);bins=new Uint8Array(analyser.frequencyBinCount);offset=0;$('filename').textContent=file.name;$('play').disabled=false;$('empty').hidden=true;document.querySelector('.stage').classList.add('has-audio');status('音频已就绪');}catch(err){status('音频读取失败：'+err.message);}};
$('imageFile').onchange=async e=>{const file=e.target.files[0];if(!file)return;try{const next=await createImageBitmap(file);image?.close();image=next;$('backgroundFilename').textContent=file.name;}catch(err){status('图片读取失败：'+err.message);}};
$('clearImage').onclick=()=>{image?.close();image=null;$('imageFile').value='';$('backgroundFilename').textContent='尚未添加背景图';};
$('seek').oninput=()=>{if(!buffer)return;const resume=playing;stop();offset=+v('seek')*buffer.duration;if(resume)play();};
$('ratio').onchange=dimensions;$('resolution').onchange=dimensions;
// Cache a software Gaussian convolution so background filters work without Canvas filter support.
const background=document.createElement('canvas');
let backgroundKey='',backgroundImage=null;
function paintBackground(w,h){
 const key=[w,h,v('bg'),v('fit'),v('blur'),v('brightness')].join();
 if(key!==backgroundKey||image!==backgroundImage){
  backgroundKey=key;backgroundImage=image;
  const scale=Math.min(1,640/Math.max(w,h));
  background.width=Math.round(w*scale);background.height=Math.round(h*scale);
  const b=background.getContext('2d'),bw=background.width,bh=background.height;
  b.fillStyle=v('bg');b.fillRect(0,0,bw,bh);
  if(image){
   const fit=Math[v('fit')==='cover'?'max':'min'](bw/image.width,bh/image.height);
   b.drawImage(image,(bw-image.width*fit)/2,(bh-image.height*fit)/2,image.width*fit,image.height*fit);
   const pixels=b.getImageData(0,0,bw,bh),data=pixels.data;
   const sigma=+v('blur')*bw/1280;
   if(sigma>0){
    const radius=Math.ceil(sigma*3),kernel=new Float32Array(radius*2+1);let total=0;
    for(let k=-radius;k<=radius;k++){kernel[k+radius]=Math.exp(-k*k/(2*sigma*sigma));total+=kernel[k+radius];}
    for(let k=0;k<kernel.length;k++)kernel[k]/=total;
    const temp=new Float32Array(data.length);
    for(let y=0;y<bh;y++)for(let x=0;x<bw;x++)for(let c=0;c<3;c++){
     let sum=0;for(let k=-radius;k<=radius;k++)sum+=data[(y*bw+Math.max(0,Math.min(bw-1,x+k)))*4+c]*kernel[k+radius];
     temp[(y*bw+x)*4+c]=sum;
    }
    for(let y=0;y<bh;y++)for(let x=0;x<bw;x++)for(let c=0;c<3;c++){
     let sum=0;for(let k=-radius;k<=radius;k++)sum+=temp[(Math.max(0,Math.min(bh-1,y+k))*bw+x)*4+c]*kernel[k+radius];
     data[(y*bw+x)*4+c]=sum;
    }
   }
   const brightness=+v('brightness');for(let i=0;i<data.length;i+=4)for(let c=0;c<3;c++)data[i+c]*=brightness;
   b.putImageData(pixels,0,0);
  }
 }
 ctx.drawImage(background,0,0,w,h);
}
let placement={x:0,y:0},spectrumGesture=null,spectrumSelected=true;
window.selectSpectrum=()=>{spectrumSelected=true;};
window.deselectSpectrum=()=>{spectrumSelected=false;};
window.isSpectrumSelected=()=>spectrumSelected&&!window.getSelectedForeground?.();
window.spectrumBounds=()=>{
 const size=+v('size'),ratio=canvas.width/canvas.height;
 if(v('style')==='circle'){
  const r=Math.min(ratio,1)*.23*size+.175*size;
  return {x:.5+placement.x-r/ratio,y:.5+placement.y-r,w:2*r/ratio,h:2*r};
 }
 const height=.35*size,mirror=v('style')==='mirror',base=v('style')==='line'?.6:.62;
 return {x:.5-.425*size+placement.x,y:base-height+placement.y,w:.85*size,h:height*(mirror?2:1)+(mirror?4/canvas.height:0)};
};
canvas.style.touchAction='none';canvas.style.cursor='grab';
function pointerPosition(e){
 const rect=canvas.getBoundingClientRect(),scale=Math.min(rect.width/canvas.width,rect.height/canvas.height);
 const width=canvas.width*scale,height=canvas.height*scale;
 return {x:(e.clientX-rect.left-(rect.width-width)/2)/width,y:(e.clientY-rect.top-(rect.height-height)/2)/height};
}
function isSpectrumHandleHit(p){
 if(!buffer||!window.isSpectrumSelected())return false;
 return window.resizeCorner(p,window.spectrumBounds());
}
window.isSpectrumHandleHit=isSpectrumHandleHit;
canvas.addEventListener('pointerdown',e=>{
 if(exporting||!buffer)return;
 const p=pointerPosition(e);
 if(p.x<0||p.x>1||p.y<0||p.y>1)return;
 window.deselectForeground?.();
 spectrumSelected=true;
 if(isSpectrumHandleHit(p)){
  spectrumGesture={id:e.pointerId,type:'resize',corner:isSpectrumHandleHit(p),p,initialSize:+v('size'),initialBounds:window.spectrumBounds()};
  canvas.setPointerCapture(e.pointerId);
  canvas.style.cursor=window.cornerCursor(spectrumGesture.corner);
 }else{
  spectrumGesture={id:e.pointerId,type:'move',p,initialPlacement:{...placement}};
  canvas.setPointerCapture(e.pointerId);
  canvas.style.cursor='grabbing';
 }
});
canvas.addEventListener('pointermove',e=>{
 if(exporting)return;
 const p=pointerPosition(e);
 if(spectrumGesture&&spectrumGesture.id===e.pointerId){
  const g=spectrumGesture,dx=p.x-g.p.x,dy=p.y-g.p.y;
  if(g.type==='resize'){
   const b=g.initialBounds,previous={...placement},oldSize=v('size');
   const target=window.resizeBox(b,g.p,p,g.corner,true,'spectrum');
   $('size').value=Math.max(.2,Math.min(1,g.initialSize*target.w/b.w));
   const resized=window.spectrumBounds(),west=g.corner.includes('w'),north=g.corner.includes('n');
   placement.x+=(west?b.x+b.w-resized.w:b.x)-resized.x;
   placement.y+=(north?b.y+b.h-resized.h:b.y)-resized.y;
   const next=window.spectrumBounds();
   if(next.x<0||next.y<0||next.x+next.w>1||next.y+next.h>1||(window.spectrumPlacementValid&&!window.spectrumPlacementValid())){placement=previous;$('size').value=oldSize;window.clearSnapLines();}

  }else{
   const previous={...placement};
   placement.x=Math.max(-.5,Math.min(.5,g.initialPlacement.x+dx));
   placement.y=Math.max(-.5,Math.min(.38,g.initialPlacement.y+dy));
   if(window.snapRectangle){
    const bounds=window.spectrumBounds(),snapped=window.snapRectangle(bounds,'spectrum');
    placement.x+=snapped.x-bounds.x;
    placement.y+=snapped.y-bounds.y;
   }
   if(window.spectrumPlacementValid&&!window.spectrumPlacementValid())placement=previous;
  }
  return;
 }
 if(!buffer)return;
 if(window.isForegroundHandleHit&&window.isForegroundHandleHit(p)){
  canvas.style.cursor=window.cornerCursor(window.isForegroundHandleHit(p));
 }else if(isSpectrumHandleHit(p)){
  canvas.style.cursor=window.cornerCursor(isSpectrumHandleHit(p));
 }else if(window.findForegroundAt&&window.findForegroundAt(p)){
  canvas.style.cursor='move';
 }else{
  const sb=window.spectrumBounds();
  canvas.style.cursor=(p.x>=sb.x&&p.x<=sb.x+sb.w&&p.y>=sb.y&&p.y<=sb.y+sb.h)?'grab':'default';
 }
});
function endSpectrumGesture(){
 spectrumGesture=null;
 window.clearSnapLines?.();
 canvas.style.cursor='grab';
}
canvas.addEventListener('pointerup',endSpectrumGesture);
canvas.addEventListener('pointercancel',endSpectrumGesture);
canvas.addEventListener('lostpointercapture',endSpectrumGesture);
const clock=t=>Math.floor(t/60)+':'+String(Math.floor(t%60)).padStart(2,'0');
function drawSpectrumIndicator(c,w,h){
 if(exporting||!buffer||!window.isSpectrumSelected())return;
 const b=window.spectrumBounds(),x=b.x*w,y=b.y*h,ew=b.w*w,eh=b.h*h;
 c.save();
 c.strokeStyle='#b6f577';
 c.lineWidth=2;
 c.strokeRect(x,y,ew,eh);
 c.fillStyle='#b6f577';
 window.cornerHandles(c,x,y,ew,eh);
 c.restore();
}
function drawSnapGuides(c,w,h){
 if(exporting||!window.activeSnapLines)return;
 const {x,y}=window.activeSnapLines;
 if(x===null&&y===null)return;
 c.save();
 c.strokeStyle='#b6f577';
 c.lineWidth=1.5;
 c.setLineDash([6,4]);
 c.shadowColor='#b6f57780';
 c.shadowBlur=4;
 if(typeof x==='number'){
  const px=Math.round(x*w)+.5;
  c.beginPath();c.moveTo(px,0);c.lineTo(px,h);c.stroke();
 }
 if(typeof y==='number'){
  const py=Math.round(y*h)+.5;
  c.beginPath();c.moveTo(0,py);c.lineTo(w,py);c.stroke();
 }
 c.restore();
}
window.drawSpectrumIndicator=drawSpectrumIndicator;
window.drawSnapGuides=drawSnapGuides;
function draw(schedule=true){const w=canvas.width,h=canvas.height;paintBackground(w,h);if(analyser){ctx.save();ctx.translate(placement.x*w,placement.y*h);analyser.getByteFrequencyData(bins);const n=+v('bands'),size=+v('size'),color=v('color'),values=Array.from({length:n},(_,i)=>{const lo=Math.floor(Math.pow(800,i/n)),hi=Math.min(bins.length-1,Math.ceil(Math.pow(800,(i+1)/n)));let sum=0;for(let k=lo;k<=hi;k++)sum+=bins[k];return Math.min(1,sum/(hi-lo+1)/255*+v('gain'));});ctx.fillStyle=color;ctx.strokeStyle=color;ctx.lineWidth=Math.max(2,w/500);const span=w*.85*size,step=span/n;ctx.beginPath();values.forEach((a,i)=>{const x=(w-span)/2+i*step,amp=Math.max(2,a*h*.35*size);if(v('style')==='circle'){const angle=i/n*Math.PI*2,r=Math.min(w,h)*.23*size,cx=w/2,cy=h/2;ctx.moveTo(cx+Math.cos(angle)*r,cy+Math.sin(angle)*r);ctx.lineTo(cx+Math.cos(angle)*(r+amp*.5),cy+Math.sin(angle)*(r+amp*.5));}else if(v('style')==='line'){const y=h*.6-amp;i?ctx.lineTo(x,y):ctx.moveTo(x,y);}else{ctx.fillRect(x,h*.62-amp,step*.65,amp);if(v('style')==='mirror'){ctx.globalAlpha=.4;ctx.fillRect(x,h*.62+4,step*.65,amp);ctx.globalAlpha=1;}}});ctx.stroke();ctx.restore();}if(window.drawForeground)window.drawForeground(ctx,w,h,exporting);drawSpectrumIndicator(ctx,w,h);drawSnapGuides(ctx,w,h);if(buffer){const t=position();$('seek').value=t/buffer.duration;$('time').textContent=clock(t)+' / '+clock(buffer.duration);if(exporting)$('progress').value=t/buffer.duration;}if(schedule)requestAnimationFrame(()=>draw());}
function lock(on){document.querySelectorAll('aside input,aside select,aside button,#play,#seek,#export,.range-step').forEach(e=>e.disabled=on);}
$('export').onclick=async()=>{if(!buffer){status('请先导入音频');return;}if(!window.MediaRecorder||!canvas.captureStream){status('当前浏览器不支持视频录制，请使用桌面 Chrome 或 Edge');return;}const mime=['video/mp4;codecs=avc1,mp4a.40.2','video/webm;codecs=vp9,opus','video/webm;codecs=vp8,opus','video/webm'].find(x=>MediaRecorder.isTypeSupported(x));if(!mime){status('未找到可用的视频编码格式');return;}stop();offset=0;cancelled=false;exporting=true;lock(true);window.clearSnapLines?.();draw(false);const stream=canvas.captureStream(30);dest.stream.getAudioTracks().forEach(t=>stream.addTrack(t));try{recorder=new MediaRecorder(stream,{mimeType:mime,videoBitsPerSecond:8000000});const chunks=[];recorder.ondataavailable=e=>{if(e.data.size)chunks.push(e.data);};recorder.onstop=()=>{exporting=false;stop();stream.getVideoTracks().forEach(t=>t.stop());lock(false);if(cancelled){status('已取消导出');$('progressBox').hidden=true;return;}if(url)URL.revokeObjectURL(url);url=URL.createObjectURL(new Blob(chunks,{type:mime}));$('download').href=url;$('download').download='spectrum-studio.'+(mime.includes('mp4')?'mp4':'webm');$('download').hidden=false;$('cancel').hidden=true;status('视频已生成，点击下载');};recorder.onerror=()=>{cancelled=true;status('编码失败，请降低分辨率后重试');};exporting=true;lock(true);$('progressBox').hidden=false;$('download').hidden=true;$('cancel').hidden=false;draw(false);recorder.start(1000);await play();status('正在实时导出，请保持页面前台');}catch(err){exporting=false;lock(false);stream.getVideoTracks().forEach(t=>t.stop());status('导出失败：'+err.message);}};
$('cancel').onclick=()=>{cancelled=true;if(recorder?.state!=='inactive')recorder.stop();};
window.addEventListener('beforeunload',e=>{if(exporting){e.preventDefault();e.returnValue='';}});dimensions();draw();

// Keep every slider's native step and input events when adjusting with buttons.
document.querySelectorAll('aside input[type="range"]').forEach(input=>{
 const parent=input.parentElement;
 const name=input.id==='seek'?'播放进度':parent.firstChild.textContent.trim();
 const wrapper=document.createElement('span');wrapper.className='range-control';
 if(parent.tagName==='LABEL'){
  const row=document.createElement('div');row.className='setting-row';
  const label=document.createElement('label');label.htmlFor=input.id;label.textContent=name;
  parent.replaceWith(row);row.append(label,wrapper);
 }else{input.before(wrapper);}
 wrapper.append(input);
 [-1,1].forEach(direction=>{
  const button=document.createElement('button');button.type='button';button.className='range-step';
  button.textContent=direction<0?'−':'+';button.setAttribute('aria-label',(direction<0?'减少':'增加')+name);
  button.onclick=()=>{if(input.disabled)return;direction<0?input.stepDown():input.stepUp();input.dispatchEvent(new Event('input',{bubbles:true}));input.dispatchEvent(new Event('change',{bubbles:true}));};
  direction<0?wrapper.prepend(button):wrapper.append(button);
 });
});
$('exportBottom').onclick=()=>$('export').click();

document.querySelector('.stage').addEventListener('click',()=>{if(!buffer&&!exporting)$('audioFile').click();});

document.querySelectorAll('.settings-nav button').forEach(button=>button.onclick=()=>{
 document.querySelectorAll('.settings-page').forEach(page=>page.hidden=page.dataset.page!==button.dataset.page);
 document.querySelectorAll('.settings-nav button').forEach(tab=>tab.setAttribute('aria-selected',String(tab===button)));
 if(button.dataset.page==='0'){window.selectSpectrum();window.deselectForeground?.();}
});
for(const id of ['style','size','ratio','resolution']){
 let accepted=$(id).value;
 $(id).addEventListener('input',()=>{
  if(window.spectrumPlacementValid&&!window.spectrumPlacementValid()){$(id).value=accepted;if(id==='ratio'||id==='resolution')dimensions();status('频谱区域与前景元素重叠');}
  else accepted=$(id).value;
 });
}
