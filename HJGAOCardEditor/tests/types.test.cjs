const fs = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const source = fs.readFileSync(require('node:path').join(__dirname, '../script.js'), 'utf8');
const context = vm.createContext({ document: {getElementById: () => ({})}, window: {addEventListener() {}}, console, assert });
vm.runInContext(source.replace(/bindEvents\(\);\ninitializeApp\(\);\s*$/, ''), context);
vm.runInContext(`
render = () => syncTypeOrder();
const input = [
 {name:'a', count:1, type:' A '}, {name:'b', count:1, type:'B'},
 {name:'c', count:1, type:'A'}, {name:'d', count:1},
 {name:'e', count:1, type:'  '}, {name:'f', count:1, type:''},
 {name:'g', count:1, type:'__proto__'}
];
importCards(parseCardsFromJson({ordered_card_templates: input}), 'test');
assert.equal(types().join('|'), 'A|B||__proto__');
assert.equal(state.cards.map(c=>c.name).join(''), 'acbdefg');
assert.equal(Object.hasOwn(buildDeckJson(state.cards).json.deck_template.ordered_card_templates[3], 'type'), false);
state.typeOrder.push('Empty');
moveType('Empty', 0);
assert.equal(types()[0], 'Empty');
assert.equal(buildDeckJson(state.cards).json.deck_template.ordered_card_templates.length, 7);
moveCard(state.cards[1], -1);
assert.equal(state.cards.map(c=>c.name).join(''), 'cabdefg');
state.selected = new Set(state.cards.filter(c=>c.type==='A').map(c=>c.id));
switchSelectedType('B');
assert.equal(types().join('|'), 'Empty|A|B||__proto__');
assert.equal(state.cards.map(c=>c.name).join(''), 'bcadefg');
state.selected = new Set(state.cards.filter(c=>c.type==='B').map(c=>c.id));
switchSelectedType('New');
assert.equal(types().at(-1), 'New');
assert.equal(state.cards.map(c=>c.name).join(''), 'defgbca');
const json = buildDeckJson(state.cards).json;
assert.equal(JSON.stringify(buildDeckJson(parseCardsFromJson(json)).json), JSON.stringify(json));
assert.throws(()=>parseCardsFromJson({ordered_card_templates:[{name:'bad',count:1,type:3}]}));
renameType('New', ' Renamed ');
assert.equal(types().at(-1), 'Renamed');
assert.equal(state.cards.at(-1).type, 'Renamed');
renameType('Empty', 'Empty renamed');
assert.equal(types()[0], 'Empty renamed');
assert.throws(()=>renameType('Renamed', 'B'));
assert.throws(()=>renameType('Renamed', ' '));
assert.throws(()=>renameType('', 'Other'));
createEmptyDeck();
assert.equal(types().join('|'), '');
importCards(parseCardsFromJson({ordered_card_templates:[{name:'Only',count:1,type:'A'}]}), 'test');
assert.equal(types().join('|'), 'A|');
assert.equal(buildDeckJson(state.cards).json.deck_template.ordered_card_templates[0].type, 'A');
state.selected = new Set(state.cards.map(c => c.id));
switchSelectedType('未分类');
assert.equal(types().includes(''), true);
assert.equal(types().includes('未分类'), true);
assert.equal(buildDeckJson(state.cards).json.deck_template.ordered_card_templates[0].type, '未分类');
renameType('未分类', '普通类型');
state.selected = new Set(state.cards.map(c => c.id));
switchSelectedType('  ');
assert.equal(state.cards[0].type, '');
assert.equal(Object.hasOwn(buildDeckJson(state.cards).json.deck_template.ordered_card_templates[0], 'type'), false);
assert.equal(parseCardsFromJson({ordered_card_templates:[{name:'Named',count:1,type:'未分类'}]})[0].type, '未分类');
console.log('PASS: normalization, stable grouping, two-level ordering, empty types, batch moves, JSON round trip');
`, context);
