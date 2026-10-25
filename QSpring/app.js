'use strict';
const $=id=>document.getElementById(id), controls=['k','duration','family','direction','strength','waves','fps','size','transparent','bg'];
let source, sourceName='小布丁', phase=0, playing=true, previous=0, worker=null, downloadURL=null, loadToken=0;
let imageComplexity=0.35, imageCoverage=1;
const canvas=$('preview'), ctx=canvas.getContext('2d'), curve=$('curve');
const bounce=t=>{const n=7.5625,d=2.75;if(t<1/d)return n*t*t;if(t<2/d)return n*(t-=1.5/d)*t+.75;if(t<2.5/d)return n*(t-=2.25/d)*t+.9375;return n*(t-=2.625/d)*t+.984375;};
function easing(t){const family=$('family').value, a=+$('strength').value,n=+$('waves').value;
  const base=x=>{switch(family){case'linear':return x;case'sine':return 1-Math.cos(x*Math.PI/2);case'quad':return x*x;case'cubic':return x**3;case'quart':return x**4;case'quint':return x**5;case'expo':return x===0?0:2**(10*x-10);case'circ':return 1-Math.sqrt(Math.max(0,1-x*x));case'back':return (a+1)*x**3-a*x*x;case'elastic':return x===0||x===1?x:-(2**(10*x-10))*Math.cos((x-1)*2*Math.PI*n);case'bounce':return 1-bounce(1-x);}};
  const dir=$('direction').value;return dir==='in'?base(t):dir==='out'?1-base(1-t):t<.5?base(2*t)/2:1-base(2-2*t)/2;
}
let low=0,high=1,phaseOffset=0;
function normalized(t){return Math.max(0,Math.min(1,(easing(t)-low)/(high-low)));}
function scaleAt(p){p=((p+phaseOffset)%1+1)%1;const t=p<.5?p*2:2-p*2,k=+$('k').value;return 1/k+(k-1/k)*normalized(t);}
function dimensions(size=$('size').value){const k=+$('k').value,edge=+size, factor=size==='original'?1:edge/(Math.max(source.width,source.height)*k);return {w:Math.ceil(source.width*k*factor-1e-9),h:Math.ceil(source.height*k*factor-1e-9),bw:source.width*factor,bh:source.height*factor};}
function schedule(){const duration=+$('duration').value,cs=Math.round(duration*100),count=Math.max(2,Math.min(Math.floor(cs/2),Math.round(duration*+$('fps').value)));return {count,cs};}
function draw(target,p,d,transparent=$('transparent').checked,bg=$('bg').value){target.clearRect(0,0,d.w,d.h);if(!transparent){target.fillStyle=bg;target.fillRect(0,0,d.w,d.h);}const s=scaleAt(p),w=d.bw*s,h=d.bh/s;target.imageSmoothingEnabled=true;target.imageSmoothingQuality='high';target.drawImage(source,(d.w-w)/2,d.h-h,w,h);}
// Sample the source once when it changes; no GIF encoding is used for estimates.
function analyzeImage() {
  const sample=document.createElement('canvas');
  const ratio=Math.min(1,96/Math.max(source.width,source.height));
  sample.width=Math.max(1,Math.round(source.width*ratio));
  sample.height=Math.max(1,Math.round(source.height*ratio));
  const g=sample.getContext('2d',{willReadFrequently:true});
  g.drawImage(source,0,0,sample.width,sample.height);
  const pixels=g.getImageData(0,0,sample.width,sample.height).data;
  let visible=0,changes=0,pairs=0;
  const colors=new Set();
  const colorAt=i=>pixels[i+3]<128?-1:Math.round(pixels[i]/51)*42+Math.round(pixels[i+1]*6/255)*6+Math.round(pixels[i+2]/51);
  for(let i=0;i<pixels.length;i+=4){
    const color=colorAt(i);
    if(color>=0){visible++;colors.add(color);}
    if((i/4)%sample.width){pairs++;if(color!==colorAt(i-4))changes++;}
  }
  imageCoverage=visible/(sample.width*sample.height);
  imageComplexity=Math.min(1,0.7*changes/Math.max(1,pairs)+0.3*Math.log2(colors.size+1)/8);
}
function updateSizeEstimate() {
  const d=dimensions(),{count}=schedule(),area=d.w*d.h;
  const coverage=Math.min(1,d.bw*d.bh/area)*($('transparent').checked?imageCoverage:1);
  // Empirical bytes/pixel range for the bounded-dictionary GIF encoder.
  // Each frame is encoded independently, including its background.
  const bytesPerPixel=0.018+coverage*(0.025+0.9*imageComplexity);
  const estimate=800+count*(792+area*bytesPerPixel);
  const format=n=>n<1048576?(n/1024).toFixed(0)+' KB':(n/1048576).toFixed(2)+' MB';
  $('sizeEstimate').textContent='预计大小：'+format(estimate*0.65)+' ～ '+format(estimate*1.6);
}
function render(){if(!source)return;const d=dimensions();if(canvas.width!==d.w||canvas.height!==d.h){canvas.width=d.w;canvas.height=d.h;}draw(ctx,phase,d);const s=scaleAt(phase);$('widthStat').textContent=(s*100).toFixed(1)+'%';$('heightStat').textContent=(100/s).toFixed(1)+'%';$('time').textContent=(phase*+$('duration').value).toFixed(2)+' s';$('scrub').value=Math.round(phase*1000);}
function update(){if(downloadURL){URL.revokeObjectURL(downloadURL);downloadURL=null;$('download').hidden=true;}low=0;high=1;for(let i=0;i<=10000;i++){const v=easing(i/10000);low=Math.min(low,v);high=Math.max(high,v);} let left=0,right=1;const target=1/(+$('k').value+1);for(let i=0;i<50;i++){const middle=(left+right)/2;if(normalized(middle)<target)left=middle;else right=middle;}phaseOffset=1-(left+right)/4; $('kValue').textContent=(+$('k').value).toFixed(2)+' ×';$('durationValue').textContent=(+$('duration').value).toFixed(6)+' s · '+(60/+$('duration').value).toFixed(1)+' BPM';$('strengthValue').textContent=$('strength').value;$('wavesValue').textContent=$('waves').value;$('strengthField').hidden=$('family').value!=='back';$('wavesField').hidden=$('family').value!=='elastic';$('direction').disabled=$('family').value==='linear';$('bg').disabled=$('transparent').checked;
 const c=curve.getContext('2d');c.clearRect(0,0,600,130);c.strokeStyle='#e1e7d6';c.lineWidth=1;for(let y of [15,65,115]){c.beginPath();c.moveTo(12,y);c.lineTo(588,y);c.stroke();}c.strokeStyle='#6c913b';c.lineWidth=3;c.beginPath();for(let i=0;i<=576;i++){const k=+$('k').value,s=scaleAt(i/576),v=k===1?.5:(s-1/k)/(k-1/k);c.lineTo(12+i,115-v*100);}c.stroke();if(source){const sizeSelect=$('size'),selectedSize=sizeSelect.value;const options=Array.from(sizeSelect.options).map(option=>{const output=dimensions(option.value);option.textContent=`${output.w} × ${output.h}`;return {option,output};});options.sort((a,b)=>a.output.w*a.output.h-b.output.w*b.output.h);for(const {option} of options)sizeSelect.appendChild(option);sizeSelect.value=selectedSize;const d=dimensions(),s=schedule();$('exportInfo').textContent=`${d.w} × ${d.h} px · ${s.count} 帧`;updateSizeEstimate();render();}}
function setPlaying(value){playing=value;$('play').innerHTML='<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="'+(value?'M7 5h4v14H7zM14 5h4v14h-4z':'M8 5v14l11-7z')+'"/></svg>';$('play').setAttribute('title',value?'暂停预览':'播放预览');$('play').setAttribute('aria-label',value?'暂停预览':'播放预览');}
$('play').onclick=()=>setPlaying(!playing);$('scrub').oninput=()=>{setPlaying(false);phase=+$('scrub').value/1000;render();};
for(const id of controls)$(id).addEventListener('input',update);
$('reset').onclick=()=>{
  const defaults={k:1.5,duration:60/130,family:'cubic',direction:'inout',strength:1.7,waves:3};
  for(const [id,value] of Object.entries(defaults))$(id).value=value;
  phase=0;
  update();
};
function demo(){loadToken++;const c=document.createElement('canvas');c.width=360;c.height=320;const g=c.getContext('2d');g.fillStyle='#a7bf69';g.beginPath();g.roundRect(30,25,300,290,[110,110,65,65]);g.fill();g.fillStyle='#c9dd94';g.beginPath();g.ellipse(140,90,65,24,-.4,0,Math.PI*2);g.fill();g.fillStyle='#304333';for(let x of [125,235]){g.beginPath();g.ellipse(x,173,9,14,0,0,Math.PI*2);g.fill();}g.strokeStyle='#304333';g.lineWidth=6;g.lineCap='round';g.beginPath();g.arc(180,190,23,.15,Math.PI-.15);g.stroke();g.fillStyle='#e7b7a1';for(let x of [95,265]){g.beginPath();g.ellipse(x,201,22,11,0,0,Math.PI*2);g.fill();}source=c;analyzeImage();sourceName='小布丁';$('fileName').textContent='';$('sourceInfo').textContent='内置示例 · 360 × 320';phase=0;update();}
$('demo').onclick=demo;
async function load(file){if(!file||worker)return;const token=++loadToken;try{if(file.size>30*1024*1024)throw Error('请选择 30 MB 以内的图片。');const head=new Uint8Array(await file.slice(0,12).arrayBuffer());if(String.fromCharCode(...head.slice(0,3))==='GIF')throw Error('当前支持静态图片，请选择 PNG、JPEG 或静态 WebP。');if(!/^image\/(png|jpeg|webp|avif|bmp)$/.test(file.type))throw Error('请选择 PNG、JPEG、WebP、AVIF 或 BMP 图片。');const url=URL.createObjectURL(file),img=new Image();try{img.src=url;await img.decode();}finally{URL.revokeObjectURL(url);}if(token!==loadToken)return;if(img.naturalWidth*img.naturalHeight>40000000)throw Error('图片超过 4000 万像素，请缩小后重试。');const c=document.createElement('canvas');c.width=img.naturalWidth;c.height=img.naturalHeight;c.getContext('2d').drawImage(img,0,0);source=c;analyzeImage();sourceName=file.name.replace(/\.[^.]+$/,'');$('sourceInfo').textContent=`${source.width} × ${source.height}`;$('fileName').textContent=file.name;phase=0;update();$('status').textContent='图片已载入，可以调整弹性或导出 GIF。';}catch(e){if(token===loadToken)$('status').textContent=e.message;}}
$('file').onchange=e=>{load(e.target.files[0]);e.target.value='';};for(const event of ['dragenter','dragover'])$('dropzone').addEventListener(event,e=>{e.preventDefault();$('dropzone').classList.add('dragging');});$('dropzone').ondragleave=()=>$('dropzone').classList.remove('dragging');$('dropzone').ondrop=e=>{e.preventDefault();$('dropzone').classList.remove('dragging');load(e.dataTransfer.files[0]);};
function busy(value){for(const el of document.querySelectorAll('aside input,aside select,aside button,.export-controls input,.export-controls select,.export-controls button'))el.disabled=value;$('cancel').disabled=false;$('cancel').hidden=!value;$('progress').hidden=!value;if(!value){$('bg').disabled=$('transparent').checked;$('direction').disabled=$('family').value==='linear';}}
function stop(){if(worker){worker.terminate();worker=null;}busy(false);}
$('cancel').onclick=()=>{stop();$('status').textContent='已取消生成。';};
$('export').onclick=()=>{if(worker)return;const check=dimensions(),timing=schedule();if(check.w>4096||check.h>4096||check.w*check.h*timing.count>60000000){$('status').textContent='导出像素量较大，请降低尺寸、帧率或周期后再生成。';return;}loadToken++;busy(true);$('download').hidden=true;$('progress').value=0;$('status').textContent='正在生成 GIF…';try{const d=dimensions(),{count,cs}=schedule(),off=document.createElement('canvas');off.width=d.w;off.height=d.h;const g=off.getContext('2d',{willReadFrequently:true}),url=URL.createObjectURL(new Blob(['('+gifWorker.toString()+')()'],{type:'text/javascript'}));worker=new Worker(url);URL.revokeObjectURL(url);let frame=0;const next=()=>{if(!worker)return;if(frame===count){worker.postMessage({type:'finish'});return;}const start=Math.round(frame*cs/count),end=Math.round((frame+1)*cs/count);draw(g,start/cs,d);const buffer=g.getImageData(0,0,d.w,d.h).data.buffer;worker.postMessage({type:'frame',buffer,delay:end-start},[buffer]);frame++;};worker.onmessage=({data})=>{if(data.type==='frame'){$('progress').value=frame/count;$('status').textContent=`正在生成 GIF：${frame} / ${count} 帧`;next();}else if(data.type==='done'){if(downloadURL)URL.revokeObjectURL(downloadURL);downloadURL=URL.createObjectURL(new Blob([data.buffer],{type:'image/gif'}));$('download').href=downloadURL;$('download').download=sourceName+'-Q弹.gif';$('download').click();stop();$('status').textContent='';}else{stop();$('status').textContent='生成失败：'+data.message;}};worker.onerror=e=>{stop();$('status').textContent='生成失败：'+e.message;};worker.postMessage({type:'start',width:d.w,height:d.h});next();}catch(e){stop();$('status').textContent='生成失败：'+e.message;}};
function tick(now){if(previous&&playing&&!document.hidden)phase=(phase+Math.min(now-previous,100)/1000/+$('duration').value)%1;previous=now;render();requestAnimationFrame(tick);}demo();requestAnimationFrame(tick);
