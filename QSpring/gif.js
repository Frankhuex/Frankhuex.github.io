/* Browser-local GIF89a encoder. Adaptive per-frame palette with error diffusion, transparent index 255.
   A bounded LZW dictionary keeps code width at 9 bits; runs in a Worker. */
function gifWorker() {
  let bytes = [], width, height;
  const put = (...v) => { for (const x of v) bytes.push(x); };
  const word = v => put(v & 255, v >> 8);
  const str = s => { for (const c of s) put(c.charCodeAt(0)); };
  function quantize(rgba) {
    // Weighted median cut over a 5-bit histogram; retain actual channel averages.
    const histogram=new Map();
    for(let i=0;i<rgba.length;i+=4){
      if(rgba[i+3]<128)continue;
      const r=rgba[i],g=rgba[i+1],b=rgba[i+2],key=(r>>3)*1024+(g>>3)*32+(b>>3);
      let bin=histogram.get(key);
      if(!bin){bin=[0,0,0,0];histogram.set(key,bin);}
      bin[0]+=r;bin[1]+=g;bin[2]+=b;bin[3]++;
    }
    const colors=Array.from(histogram.values(),v=>[v[0]/v[3],v[1]/v[3],v[2]/v[3],v[3]]);
    function box(list){
      const min=[255,255,255],max=[0,0,0];let weight=0;
      for(const c of list){weight+=c[3];for(let j=0;j<3;j++){min[j]=Math.min(min[j],c[j]);max[j]=Math.max(max[j],c[j]);}}
      const ranges=max.map((v,j)=>v-min[j]);
      const axis=ranges.indexOf(Math.max(...ranges));
      return {list,weight,axis,score:list.length>1?Math.max(...ranges)*Math.sqrt(weight):0};
    }
    const boxes=colors.length?[box(colors)]:[];
    while(boxes.length<255){
      let index=-1,score=0;
      for(let i=0;i<boxes.length;i++)if(boxes[i].score>score){index=i;score=boxes[i].score;}
      if(index<0)break;
      const current=boxes[index],list=current.list.sort((a,b)=>a[current.axis]-b[current.axis]);
      let sum=0,split=0;
      while(split<list.length-1&&sum<current.weight/2)sum+=list[split++][3];
      boxes.splice(index,1,box(list.slice(0,split)),box(list.slice(split)));
    }
    const palette=boxes.map(({list,weight})=>{
      const sums=[0,0,0];for(const c of list)for(let j=0;j<3;j++)sums[j]+=c[j]*c[3];
      return sums.map(v=>Math.round(v/weight));
    });
    if(!palette.length)palette.push([0,0,0]);
    const cache=new Int16Array(262144);cache.fill(-1);
    function nearest(r,g,b){
      const key=(r>>2)*4096+(g>>2)*64+(b>>2);
      if(cache[key]>=0)return cache[key];
      let best=0,distance=Infinity;
      for(let i=0;i<palette.length;i++){
        const c=palette[i],d=(r-c[0])**2+(g-c[1])**2+(b-c[2])**2;
        if(d<distance){distance=d;best=i;}
      }
      cache[key]=best;return best;
    }
    const pixels=new Uint8Array(width*height);
    let row=new Float32Array((width+2)*3),next=new Float32Array(row.length);
    for(let y=0;y<height;y++){
      const reverse=y%2===1,step=reverse?-1:1;
      for(let x=reverse?width-1:0;x>=0&&x<width;x+=step){
        const p=(y*width+x)*4,e=(x+1)*3;
        if(rgba[p+3]<128){pixels[y*width+x]=255;continue;}
        const rgb=[0,1,2].map(j=>Math.max(0,Math.min(255,rgba[p+j]+row[e+j])));
        const index=nearest(...rgb);pixels[y*width+x]=index;
        for(let j=0;j<3;j++){
          const error=rgb[j]-palette[index][j];
          row[e+step*3+j]+=error*7/16;
          next[e-step*3+j]+=error*3/16;next[e+j]+=error*5/16;next[e+step*3+j]+=error/16;
        }
      }
      [row,next]=[next,row];next.fill(0);
    }
    return {pixels,palette};
  }
  onmessage = ({data:d}) => {
    try {
      if (d.type === 'start') {
        bytes=[];width=d.width;height=d.height;
        str('GIF89a');word(width);word(height);put(247,255,0);
        // Global fallback table; each frame supplies its own adaptive table.
        for(let i=0;i<256;i++)put(0,0,0);
        put(33,255,11);str('NETSCAPE2.0');put(3,1,0,0,0);
      } else if(d.type === 'frame') {
        const rgba=new Uint8ClampedArray(d.buffer),{pixels,palette}=quantize(rgba);
        put(33,249,4,9);word(d.delay);put(255,0,44);word(0);word(0);word(width);word(height);put(135);
        for(let i=0;i<256;i++)put(...(palette[i]||[0,0,0]));
        put(8);
        let block=[],acc=0,bits=0,dict=new Map(),next=258;
        const emit=code=>{acc|=code<<bits;bits+=9;while(bits>=8){block.push(acc&255);acc>>>=8;bits-=8;}};
        emit(256);let prefix=pixels[0];
        for(let i=1;i<pixels.length;i++){
          const c=pixels[i],key=prefix*256+c,found=dict.get(key);
          if(found!==undefined){prefix=found;continue;}
          emit(prefix);dict.set(key,next++);prefix=c;
          if(next===510){emit(256);dict.clear();next=258;}
        }
        emit(prefix);emit(257);if(bits)block.push(acc&255);
        for(let p=0;p<block.length;p+=255){const n=Math.min(255,block.length-p);put(n);for(let j=0;j<n;j++)put(block[p+j]);}put(0);
        postMessage({type:'frame'});
      } else if(d.type==='finish'){put(59);const buffer=new Uint8Array(bytes).buffer;postMessage({type:'done',buffer},[buffer]);bytes=[];}
    } catch(e){postMessage({type:'error',message:e.message});}
  };
}
