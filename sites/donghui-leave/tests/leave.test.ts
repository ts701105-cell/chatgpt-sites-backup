import {test} from 'node:test';
import assert from 'node:assert/strict';
import {period,balance,anniversary,validDate,hours} from '../lib/leave.ts';
test('hourly leave excludes lunch and rejects invalid intervals',()=>{assert.equal(hours('09:00','18:00'),8);assert.equal(hours('11:00','14:00'),2);assert.equal(hours('09:00','10:00'),1);assert.throws(()=>hours('12:00','13:00'));assert.throws(()=>hours('11:30','14:00'));assert.throws(()=>hours('18:00','09:00'));});
test('statutory thresholds and distinct six-month grant',()=>{
 for(const [date,days] of [['2020-06-30',0],['2020-07-01',3],['2021-01-01',7],['2022-01-01',10],['2023-01-01',14],['2025-01-01',15],['2030-01-01',16],['2044-01-01',30],['2050-01-01',30]] as const)assert.equal(period('2020-01-01',date).days,days,date);
});
test('month ends, leap years and invalid dates',()=>{assert.equal(anniversary('2024-02-29',12),'2025-02-28');assert.equal(anniversary('2023-08-31',6),'2024-02-29');assert.equal(validDate('2025-02-29'),false);});
test('pending reservations and prior periods',()=>{const p=balance('2020-01-01','2021-08-01',[{type:'特休',date:'2020-09-01',status:'approved',units:3},{type:'特休',date:'2021-08-01',status:'approved',units:1},{type:'特休',date:'2021-08-02',status:'pending',units:.5},{type:'特休',date:'2021-08-03',status:'cancelled',units:1}]);assert.equal(p.remaining,5.5);assert.equal(p.used,1);assert.equal(p.pending,.5);});
