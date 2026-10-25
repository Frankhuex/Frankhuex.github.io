const fs = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const nodes = new Map();
const defaults = {k:1.35,duration:1.2,family:'sine',direction:'inout',strength:1.7,waves:3,fps:25,size:'original',bg:'#fff5e9'};
let rectangle;
function element(id) {
  if (!nodes.has(id)) nodes.set(id, {value:defaults[id] ?? '',checked:id==='transparent',width:600,height:130,
    options:id==='size'?['original','320','480','640','800'].map(value=>({value})):[],
    classList:{remove(){},add(){},toggle(){}},addEventListener(){},setAttribute(){},appendChild(){},
    getContext(){return new Proxy({}, {get:(_,key)=>key==='getImageData'?()=>({data:new Uint8ClampedArray(4)}):key==='drawImage'?(_img,x,y,w,h)=>{rectangle={x,y,w,h};}:()=>{}});}});
  return nodes.get(id);
}
const scope={console,document:{getElementById:element,querySelectorAll:()=>[],createElement:()=>element(Symbol())},requestAnimationFrame(){}};
vm.createContext(scope);
vm.runInContext(fs.readFileSync(path.join(__dirname,'app.js'),'utf8'),scope);
const run=code=>vm.runInContext(code,scope);
for (const family of ['linear','sine','quad','cubic','quart','quint','expo','circ','back','elastic','bounce']) {
  for(const direction of ['in','out','inout']) {
    element('family').value=family;element('direction').value=direction;run('update()');
    const d=run('dimensions()');
    for(let i=0;i<=1000;i++) {
      const p=i/1000,s=run(`scaleAt(${p})`);
      assert(s>=1/1.35-1e-12&&s<=1.35+1e-12);
      run(`draw(ctx,${p},dimensions())`);
      assert(Math.abs(rectangle.w*rectangle.h-d.bw*d.bh)<1e-7);
      assert(Math.abs(rectangle.y+rectangle.h-d.h)<1e-9);
      assert(rectangle.y>=-1e-9&&rectangle.x>=-1e-9);
    }
    assert(Math.abs(run('scaleAt(0)-scaleAt(1)'))<1e-12);
  }
}
assert.equal(run('dimensions().w'),486);
for(const duration of [.2,.35,1.2,5])for(const fps of [15,25,50]) {
 element('duration').value=duration;element('fps').value=fps;
 const {count,cs}=run('schedule()');let sum=0;
 for(let i=0;i<count;i++){const delay=Math.round((i+1)*cs/count)-Math.round(i*cs/count);assert(delay>=2);sum+=delay;}
 assert.equal(sum,Math.round(duration*100));
}
let gif;const encoder={postMessage:d=>{if(d.type==='done')gif=d.buffer;}};vm.createContext(encoder);
vm.runInContext(fs.readFileSync(path.join(__dirname,'gif.js'),'utf8')+';gifWorker()',encoder);
encoder.onmessage({data:{type:'start',width:64,height:48}});
for(let f=0;f<3;f++) {
 const pixels=new Uint8Array(64*48*4);
 for(let i=0;i<64*48;i++)pixels.set([(i*37+f*10)%256,i*19%256,i*7%256,i%9?255:0],i*4);
 encoder.onmessage({data:{type:'frame',buffer:pixels.buffer,delay:4+f}});
}
encoder.onmessage({data:{type:'finish'}});
assert.equal(Buffer.from(gif).subarray(0,6).toString(),'GIF89a');
const out=path.join(os.tmpdir(),'qspring-validation.gif');fs.writeFileSync(out,Buffer.from(gif));
const decode=spawnSync('ffmpeg',['-v','error','-i',out,'-f','null','-'],{encoding:'utf8'});
if(decode.error?.code==='ENOENT')console.log('FFmpeg unavailable; decoder check skipped.');
else {assert.equal(decode.status,0,decode.stderr);assert.equal(decode.stderr,'');console.log('GIF decoder check passed.');}
console.log('33 easing combinations: bounds, area, bottom alignment, loop; timing checks passed.');

// Regression: smooth warm gradients should retain substantially more color
// detail than the old fixed 6×7×6 palette, with transparency preserved.
if(!decode.error){
 const original=new Uint8Array(64*48*4);
 for(let y=0;y<48;y++)for(let x=0;x<64;x++){
   const p=(y*64+x)*4;
   original.set([80+x*2,55+y*2,30+x+y,x<3?0:255],p);
 }
 encoder.onmessage({data:{type:'start',width:64,height:48}});
 encoder.onmessage({data:{type:'frame',buffer:original.buffer,delay:4}});
 encoder.onmessage({data:{type:'finish'}});
 fs.writeFileSync(out,Buffer.from(gif));
 const decoded=spawnSync('ffmpeg',['-v','error','-i',out,'-frames:v','1','-f','rawvideo','-pix_fmt','rgba','-']);
 assert.equal(decoded.status,0);
 assert.equal(decoded.stdout.length,original.length);
 let oldError=0,newError=0;
 for(let i=0;i<original.length;i+=4){
   assert.equal(decoded.stdout[i+3],original[i+3]);
   if(!original[i+3])continue;
   for(let c=0;c<3;c++){
     const levels=c===1?6:5;
     const old=Math.round(Math.round(original[i+c]*levels/255)*255/levels);
     oldError+=(old-original[i+c])**2;
     newError+=(decoded.stdout[i+c]-original[i+c])**2;
   }
 }
 assert(newError<oldError*0.25,`Color error regression: ${newError} vs ${oldError}`);
 console.log('Adaptive palette color quality and transparency checks passed.');
}

// One beat starts at original dimensions, stretches upward first, and returns.
run("$('reset').onclick()");
assert.equal(+element('duration').value,60/130);
assert(Math.abs(run('scaleAt(0)')-1)<1e-10);
assert(run('scaleAt(0.01)')<1);
assert(Math.abs(run('scaleAt(1)')-1)<1e-10);
assert.equal(run('schedule().cs'),46);
console.log('130 BPM default/reset and motion phase checks passed.');
