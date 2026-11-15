import assert from 'node:assert/strict';
import {partAtReadingLine} from '../reader-position.js?v=20261115-toc-same-line';
// A paragraph-start author and an inline handoff occupy the same visible text row.
const markers = [{id:'earlier',top:135}, {id:'later',top:135}, {id:'next-row',top:189}];
assert.equal(partAtReadingLine(markers, 158, 'earlier', 'start'), 'earlier');
assert.equal(partAtReadingLine(markers, 158, 'later', 'start'), 'later');
assert.equal(partAtReadingLine(markers, 158, 'previous-row', 'start'), 'earlier');
// Normal reading still advances once a distinct author row reaches the reading area.
assert.equal(partAtReadingLine(markers, 200, 'earlier', 'start'), 'next-row');
assert.equal(partAtReadingLine(markers, 100, 'earlier', 'start'), 'start');
console.log('PASS: same-line author clicks remain selected; scrolling advances to a new row');
