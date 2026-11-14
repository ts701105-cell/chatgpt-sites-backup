import {test} from 'node:test';import assert from 'node:assert/strict';import {suggestSlipFields} from '../lib/slip-fields.ts';
const employees=[{number:'151770',name:'楊智鋒'},{number:'123456',name:'測試員工'}];
test('matches a unique employee and ROC date, preserves fractional hours',()=>{assert.deepEqual(suggestSlipFields('姓名 楊智鋒\n日期 115/08/14\n特休\n合計 2.5 小時',employees),{number:'151770',date:'2026-08-14',type:'特休',hours:'2.5'});});
test('ambiguous people or printed leave options require manual confirmation',()=>{const s=suggestSlipFields('楊智鋒 測試員工 事假 病假 生理假 特休',employees);assert.equal(s.type,'');assert.equal(s.number,'');assert.equal(s.hours,'');});
