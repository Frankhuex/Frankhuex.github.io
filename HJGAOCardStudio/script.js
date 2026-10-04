'use strict';
const $ = id => document.getElementById(id);
const KEY = 'hjgao-card-studio-v1';
const label = type => type || '未分类';
const normalize = value => typeof value === 'string' ? value.trim() : '';
let deck = { types: [''], cards: [] };
let selected = new Set(), collapsed = new Set(), history = [], editingSnapshot = null;
let drag = null, toastTimer, dialogAction = null, design = '';
const uid = () => crypto.randomUUID();
function tidy(data) {
  data.types = [...new Set(data.types.map(normalize))];
  data.cards.forEach(card => {card.type = normalize(card.type); if (!data.types.includes(card.type)) data.types.push(card.type);});
  if (!data.types.includes('')) data.types.push('');
  data.cards = data.types.flatMap(type => data.cards.filter(card => card.type === type));
  return data;
}
function parseDeck(raw) {
  const cards = raw?.deck_template?.ordered_card_templates ?? raw?.ordered_card_templates;
  if (!Array.isArray(cards)) throw Error('缺少 ordered_card_templates 数组。');
  const result = {types: [], cards: cards.map((card, i) => {
    if (!card || typeof card !== 'object' || Array.isArray(card)) throw Error(`第 ${i+1} 项需要是卡牌对象。`);
    if (card.type != null && typeof card.type !== 'string') throw Error(`第 ${i+1} 项的 type 需要是字符串。`);
    if (typeof card.name !== 'string' || !card.name.trim()) throw Error(`第 ${i+1} 项缺少牌名。`);
    if (!Number.isInteger(card.count) || card.count < 0) throw Error(`第 ${i+1} 项数量需为非负整数。`);
    return {id:uid(), type:normalize(card.type), name:card.name, count:card.count, description:String(card.description ?? '')};
  })};
  return tidy(result);
}
function errors() {
  const names = new Map(), invalid = new Map();
  deck.cards.forEach(card => {
    let messages = [];
    if (!card.name.trim()) messages.push('请填写牌名');
    else if (names.has(card.name.trim())) {
      messages.push('牌名重复'); invalid.set(names.get(card.name.trim()), '牌名重复');
    } else names.set(card.name.trim(), card.id);
    if (card.count === '' || !Number.isInteger(Number(card.count)) || Number(card.count) < 0) messages.push('数量需为非负整数');
    if (messages.length) invalid.set(card.id, messages.join(' · '));
  });
  return invalid;
}
function exported() {
  if (errors().size) throw Error('请先修正卡牌中的牌名或数量问题。');
  return {deck_template:{ordered_card_templates:deck.cards.map(card => ({...(card.type ? {type:card.type}:{}),name:card.name.trim(),count:Number(card.count),description:card.description}))}};
}
function save() {
  try {localStorage.setItem(KEY, JSON.stringify({deck,design})); $('save-state').textContent='已自动保存到本机';}
  catch { $('save-state').textContent='保存失败，请及时导出'; }
}
function remember(snapshot = JSON.stringify(deck)) { history.push(snapshot); if(history.length>50) history.shift(); $('undo').disabled=false; }
function commit(action) { editingSnapshot=null; remember(); action(); tidy(deck); save(); render(); }
function notify(text) {clearTimeout(toastTimer); $('toast').textContent=text; $('toast').hidden=false; toastTimer=setTimeout(()=>$('toast').hidden=true,3000);}
function undo() { if(!history.length)return; deck=JSON.parse(history.pop()); selected.clear(); editingSnapshot=null;save();render();notify('已撤销上一步'); }
function node(tag, cls, text) {const el=document.createElement(tag); if(cls)el.className=cls;if(text!=null)el.textContent=text;return el;}
function button(text, title, action, cls='') {const b=node('button',cls,text);b.type='button';b.title=title;b.setAttribute('aria-label',title);b.onclick=action;return b;}
function showDialog(title, confirm, build, action) {
  $('dialog-title').textContent=title; $('confirm-dialog').textContent=confirm;
  $('dialog-body').replaceChildren();$('dialog-error').textContent='';dialogAction=action;
  build($('dialog-body')); $('dialog').showModal();
}
function field(parent, title, tag='input', value='') {const l=node('label','',title), input=node(tag);input.value=value;l.append(input);parent.append(l);return input;}
function typeDialog(source=null) {
  let input;
  showDialog(source===null?'新建类型':'类型改名',source===null?'创建类型':'保存名称',body=>{
    input=field(body,'类型名称','input',source??''); input.required=true;
    body.append(node('p','','按游玩时能否混合使用划分类型。名称“未分类”也可以用作普通类型。'));
  },()=>{
    const name=input.value.trim();if(!name)throw Error('请输入类型名称。');
    if(name!==source && deck.types.includes(name))throw Error('这个名称已存在，请换一个名称。');
    commit(()=>{if(source===null)deck.types.push(name);else {deck.types=deck.types.map(t=>t===source?name:t);deck.cards.forEach(c=>{if(c.type===source)c.type=name;});if(collapsed.delete(source))collapsed.add(name);}});
    notify(source===null?'已创建空类型':'类型名称已更新');
  });
}
function moveDialog(ids=selected) {
  const moving=new Set(ids);let select,newName;
  showDialog(`移动 ${moving.size} 种卡牌`,'确认移动',body=>{
    select=field(body,'目标类型','select');
    deck.types.forEach(t=>{const o=node('option','',t||'未分类 · 默认分组');o.value=t;select.append(o);});
    const create=node('option','','＋ 新建类型…');create.value='__new_choice__';create.dataset.create='true';select.append(create);
    newName=field(body,'新类型名称');newName.parentElement.hidden=true;
    select.onchange=()=>{newName.parentElement.hidden=!select.selectedOptions[0]?.dataset.create;};
    body.append(node('p','','卡牌按当前显示顺序追加到目标类型末尾，原来的空类型会保留。'));
  },()=>{
    const creating=!!select.selectedOptions[0]?.dataset.create;
    const target=creating?newName.value.trim():select.value;
    if(creating && (!target||deck.types.includes(target)))throw Error('请输入一个尚未使用的类型名称。');
    commit(()=>{const incoming=deck.cards.filter(c=>moving.has(c.id)&&c.type!==target);deck.cards=deck.cards.filter(c=>!incoming.includes(c));incoming.forEach(c=>c.type=target);deck.cards.push(...incoming);if(!deck.types.includes(target))deck.types.push(target);collapsed.delete(target);selected.clear();});
    notify('已移动卡牌，可随时撤销');
  });
}
function addCard(type) {const card={id:uid(),type,name:'',count:1,description:''};commit(()=>{deck.cards.push(card);collapsed.delete(type);});document.querySelector(`[data-id="${card.id}"] .name-input`)?.focus();}
function reorderType(type,delta) {const i=deck.types.indexOf(type), j=i+delta;if(j<0||j>=deck.types.length)return;commit(()=>{deck.types.splice(i,1);deck.types.splice(j,0,type);});}
function reorderCard(card,delta) {const i=deck.cards.indexOf(card),other=deck.cards[i+delta];if(!other||other.type!==card.type)return;commit(()=>{deck.cards.splice(i,1);deck.cards.splice(i+delta,0,card);});}
function menu(anchor,items) {
  const old=anchor.parentElement.querySelector('.menu-popover');document.querySelectorAll('.menu-popover').forEach(e=>e.remove());if(old)return;
  const pop=node('div','menu-popover');items.forEach(([text,action,disabled=false,danger=false])=>{const b=button(text,text,()=>{pop.remove();action();},danger?'danger':'');b.disabled=disabled;pop.append(b);});anchor.parentElement.append(pop);
}
function selectionUI() {
  selected=new Set([...selected].filter(id=>deck.cards.some(c=>c.id===id)));
  $('batch').hidden=!selected.size;$('selected-count').textContent=`已选 ${selected.size} 种`;
  $('select-all').checked=!!deck.cards.length&&selected.size===deck.cards.length;$('select-all').indeterminate=selected.size>0&&selected.size<deck.cards.length;
  document.querySelectorAll('.row').forEach(row=>{const checked=selected.has(row.dataset.id);row.classList.toggle('selected',checked);row.querySelector('input[type=checkbox]').checked=checked;});
  document.querySelectorAll('.group').forEach(section=>{const cards=deck.cards.filter(c=>c.type===section.dataset.type), count=cards.filter(c=>selected.has(c.id)).length;const box=section.querySelector('.group-check');box.checked=cards.length>0&&count===cards.length;box.indeterminate=count>0&&count<cards.length;section.querySelector('.group-meta').textContent=`${cards.length} 种${count?' · 已选 '+count:''}`;});
}
function derived() {
  $('collapse').textContent=deck.types.every(t=>collapsed.has(t))?'展开全部':'折叠全部';
  $('kinds').textContent=deck.cards.length;$('total').textContent=deck.cards.reduce((n,c)=>n+(Number.isInteger(Number(c.count))&&Number(c.count)>0?Number(c.count):0),0);$('groups-count').textContent=deck.types.filter(Boolean).length;
  $('summary').textContent='按类型排列 · 修改自动保存在本机';$('undo').disabled=!history.length;
  const invalid=errors();$('validation').textContent=invalid.size?`${invalid.size} 种卡牌需要完善，完成后即可导出。`:'';
  document.querySelectorAll('.row').forEach(row=>{row.querySelector('.field-error').textContent=invalid.get(row.dataset.id)||'';});
}
function dragTarget(el,kind,target,type) {
  el.addEventListener('dragover',e=>{if(!drag||drag.kind!==kind||(kind==='card'&&drag.type!==type))return;e.preventDefault();e.stopPropagation();document.querySelectorAll('.drop-before,.drop-after').forEach(n=>n.classList.remove('drop-before','drop-after'));const r=el.getBoundingClientRect();el.classList.add(e.clientY<r.top+r.height/2?'drop-before':'drop-after');});
  el.addEventListener('drop',e=>{if(!drag||drag.kind!==kind||(kind==='card'&&drag.type!==type))return;e.preventDefault();e.stopPropagation();const after=el.classList.contains('drop-after'), source=drag.id;drag=null;if(source===target){render();return;}commit(()=>{if(kind==='type'){deck.types=deck.types.filter(t=>t!==source);deck.types.splice(deck.types.indexOf(target)+(after?1:0),0,source);}else{const card=deck.cards.find(c=>c.id===source);deck.cards=deck.cards.filter(c=>c.id!==source);deck.cards.splice(deck.cards.findIndex(c=>c.id===target)+(after?1:0),0,card);}});});
}
function handle(kind,id,type) {const h=button('⠿',kind==='type'?'拖动类型排序':'在同类型内拖动排序',()=>{},'handle');h.draggable=true;h.ondragstart=e=>{drag={kind,id,type};e.dataTransfer.setData('text/plain',id||'default');e.dataTransfer.effectAllowed='move';};h.ondragend=()=>{drag=null;document.querySelectorAll('.drop-before,.drop-after').forEach(n=>n.classList.remove('drop-before','drop-after'));};return h;}
function render() {
  $('groups').replaceChildren();$('type-nav').replaceChildren();
  deck.types.forEach((type,idx)=>{
    const cards=deck.cards.filter(c=>c.type===type);const section=node('section','group');section.dataset.type=type;section.id='group-'+idx;
    const nav=button(label(type),'跳转到 '+label(type),()=>section.scrollIntoView({behavior:'smooth',block:'start'}),'nav-item');if(!type){nav.classList.add('default-label');nav.append(node('small','badge','默认'));}nav.append(node('span','',cards.length));$('type-nav').append(nav);
    const header=node('div','group-header');header.append(handle('type',type));
    const check=node('input','group-check');check.type='checkbox';check.disabled=!cards.length;check.setAttribute('aria-label','选择 '+label(type)+' 的全部卡牌');check.onchange=()=>{cards.forEach(c=>check.checked?selected.add(c.id):selected.delete(c.id));selectionUI();};header.append(check);
    const toggle=button(`${collapsed.has(type)?'▸':'▾'} ${label(type)}`,'展开或折叠 '+label(type),()=>{collapsed.has(type)?collapsed.delete(type):collapsed.add(type);render();},'group-toggle');toggle.setAttribute('aria-expanded',String(!collapsed.has(type)));if(!type){toggle.classList.add('default-label');toggle.append(node('span','badge','默认'));}header.append(toggle,node('span','group-meta',`${cards.length} 种`));
    header.append(button('＋','在 '+label(type)+' 新增卡牌',()=>addCard(type),'icon'));
    const wrap=node('div','row-menu'), more=button('⋯','管理类型 '+label(type),()=>menu(more,[['上移类型',()=>reorderType(type,-1),idx===0],['下移类型',()=>reorderType(type,1),idx===deck.types.length-1],['改名',()=>typeDialog(type),!type],['删除空类型',()=>commit(()=>{deck.types=deck.types.filter(t=>t!==type);collapsed.delete(type);}),!type||!!cards.length,true]]),'icon');wrap.append(more);header.append(wrap);dragTarget(header,'type',type);section.append(header);
    const body=node('div');body.hidden=collapsed.has(type);
    if(!cards.length)body.append(node('div','empty-group','这里还没有卡牌。添加一张，或从其他类型移入。'));
    cards.forEach((card,i)=>{
      const row=node('article','row');row.dataset.id=card.id;const controls=node('div','row-controls'), box=node('input');box.type='checkbox';box.setAttribute('aria-label','选择卡牌 '+(card.name||'未命名'));box.onchange=()=>{box.checked?selected.add(card.id):selected.delete(card.id);selectionUI();};controls.append(box,handle('card',card.id,type),node('span','row-number',String(i+1).padStart(2,'0')));
      const fields=node('div','card-fields'), name=node('input','name-input'), description=node('textarea');name.value=card.name;name.placeholder='输入牌名';name.setAttribute('aria-label','牌名');description.value=card.description;description.placeholder='添加描述…';description.rows=1;description.setAttribute('aria-label','描述');const error=node('span','field-error');fields.append(name,description,error);
      const count=node('input','count-input');count.type='number';count.min='0';count.step='1';count.value=card.count;count.setAttribute('aria-label','数量');
      [[name,'name'],[description,'description'],[count,'count']].forEach(([input,key])=>{input.onfocus=()=>{editingSnapshot=JSON.stringify(deck);};input.oninput=()=>{if(editingSnapshot){remember(editingSnapshot);editingSnapshot=null;}card[key]=input.value;save();derived();};input.onblur=()=>{editingSnapshot=null;derived();};});
      const w=node('div','row-menu'), b=button('⋯','卡牌操作 '+(card.name||'未命名'),()=>menu(b,[['上移',()=>reorderCard(card,-1),i===0],['下移',()=>reorderCard(card,1),i===cards.length-1],['切换类型',()=>moveDialog(new Set([card.id]))],['复制卡牌',()=>{commit(()=>{const copy={...card,id:uid(),name:card.name+' 副本'};deck.cards.splice(deck.cards.indexOf(card)+1,0,copy);});}],['删除',()=>{commit(()=>deck.cards=deck.cards.filter(c=>c.id!==card.id));notify('卡牌已删除，可撤销恢复');},false,true]]),'icon menu-button');w.append(b);row.append(controls,fields,count,w);dragTarget(row,'card',card.id,type);body.append(row);
    });
    body.append(button('＋ 添加卡牌','添加到 '+label(type),()=>addCard(type),'group-add'));section.append(body);$('groups').append(section);
  });derived();selectionUI();
}
function promptText() {
  return '请生成合法 JSON，只输出 JSON 本体。顶层结构为 {"deck_template":{"ordered_card_templates":[...]}}。每张卡牌包含 name（非空牌名）、count（非负整数）、description（字符串），可选 type（类型字符串）。无分类时省略 type；显式名称“未分类”属于普通类型。\n\ntype 决定游玩时的可混合性：相同类型可混合使用，不同类型不可混合。武将牌、游戏牌、血量牌、身份牌应分别使用不同 type。锦囊牌、基本牌、装备牌可以混合，它们的 type 统一为“游戏牌”，功能子分类可写入 description。不要根据效果、花色或功能随意拆分类型。\n\n同类型卡牌连续排列，数组按类型顺序及类内顺序组织，牌名不得重复。\n\n卡牌设计要求：\n'+(design||'请生成一套标准 54 张扑克牌，花色与点数写在牌名中。');
}
$('dialog-form').onsubmit=e=>{e.preventDefault();try{dialogAction?.();$('dialog').close();}catch(error){$('dialog-error').textContent=error.message;}};
$('close-dialog').onclick=$('cancel-dialog').onclick=()=>$('dialog').close();
$('new-type').onclick=()=>typeDialog();$('add').onclick=()=>addCard('');$('undo').onclick=undo;
$('move').onclick=()=>moveDialog();$('clear-selection').onclick=()=>{selected.clear();selectionUI();};$('select-all').onchange=e=>{selected=e.target.checked?new Set(deck.cards.map(c=>c.id)):new Set();selectionUI();};
$('collapse').onclick=()=>{const all=deck.types.every(t=>collapsed.has(t));collapsed=all?new Set():new Set(deck.types);$('collapse').textContent=all?'折叠全部':'展开全部';render();};
$('new-deck').onclick=()=>showDialog('新建空白卡组','新建卡组',body=>body.append(node('p','','当前卡组将被替换。你可以通过“撤销”恢复，也可以先取消并导出备份。')),()=>{commit(()=>{deck={types:[''],cards:[]};selected.clear();collapsed.clear();});});
$('import').onclick=()=>{let text;showDialog('导入卡组','导入并替换',body=>{body.append(node('p','','导入会替换当前卡组，可通过撤销恢复。支持旧版 JSON，缺失或空白类型归入默认未分类。'));const file=field(body,'选择 JSON 文件');file.type='file';file.accept='.json,application/json';text=field(body,'或粘贴 JSON','textarea');file.onchange=async()=>{try{if(file.files[0])text.value=await file.files[0].text();}catch{$('dialog-error').textContent='文件读取失败。';}};},()=>{const data=parseDeck(JSON.parse(text.value));commit(()=>{deck=data;selected.clear();collapsed.clear();});notify('已导入卡组');});};
$('export').onclick=()=>{let json;try{json=JSON.stringify(exported(),null,2);}catch(error){notify(error.message);document.querySelector('.field-error:not(:empty)')?.scrollIntoView({block:'center',behavior:'smooth'});return;}let filename;showDialog('导出卡组','下载 JSON',body=>{filename=field(body,'文件名','input','deck');const text=field(body,'JSON 预览','textarea',json);text.readOnly=true;body.append(button('复制 JSON','复制 JSON',async()=>{try{await navigator.clipboard.writeText(json);notify('已复制 JSON');}catch{notify('复制失败，请选中预览内容复制');}}));body.append(node('p','','空类型不写入文件；默认未分类卡牌省略 type 字段。'));},()=>{const blob=new Blob([json+'\n'],{type:'application/json'}),url=URL.createObjectURL(blob),a=node('a');a.href=url;a.download=(filename.value.trim().replace(/\.json$/i,'')||'deck')+'.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);});};
$('ai').onclick=()=>{let output;showDialog('让 AI 帮你设计卡牌','完成',body=>{const input=field(body,'描述你的游戏与卡牌需求','textarea',design);input.style.minHeight='100px';const include=field(body,'附上当前卡组','input');include.type='checkbox';const updatePrompt=()=>{let current='';if(include.checked){try{current='\n\n请基于下面的现有卡组修改：\n'+JSON.stringify(exported(),null,2);}catch(error){include.checked=false;notify(error.message);}}output.value=promptText()+current;};include.onchange=updatePrompt;output=field(body,'可直接复制的提示词','textarea',promptText());output.readOnly=true;input.oninput=()=>{design=input.value;save();updatePrompt();};body.append(button('复制提示词','复制提示词',async()=>{try{await navigator.clipboard.writeText(output.value);notify('已复制提示词');}catch{notify('复制失败，请选中提示词复制');}}));},()=>{});};
document.addEventListener('click',e=>{if(!e.target.closest('.row-menu'))document.querySelectorAll('.menu-popover').forEach(n=>n.remove());});
document.addEventListener('keydown',e=>{if((e.metaKey||e.ctrlKey)&&e.key.toLowerCase()==='z'&&!e.target.matches('input,textarea')&&!$('dialog').open){e.preventDefault();undo();}});
try{const saved=JSON.parse(localStorage.getItem(KEY)||'null');if(saved?.deck){deck=tidy(saved.deck);design=String(saved.design||'');}}catch{notify('本地缓存无法恢复，请导入备份文件');}
render();
