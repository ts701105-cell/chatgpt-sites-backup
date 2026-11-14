import {validDate,today} from './leave';
export const leaveTypes=['特休','事假','病假','生理假'];
export function validateHistoryRows(rows:any[]){
 if(!Array.isArray(rows)||rows.length<1||rows.length>50)throw Error('每批歷史紀錄須為 1 至 50 筆');
 const keys=new Set<string>();
 for(const r of rows){
  if(typeof r.number!=='string'||! /^[A-Za-z0-9_-]{1,30}$/.test(r.number)||r.number.toUpperCase()==='ADMIN')throw Error('員工編號不正確');
  if(typeof r.name!=='string'||!r.name.trim()||r.name.length>60)throw Error('員工姓名不正確');
  if(!validDate(String(r.hire))||r.hire<'1900-01-01'||!validDate(String(r.date))||r.date<r.hire||r.date>today())throw Error('到職日或請假日期不正確');
  if(!leaveTypes.includes(r.type)||typeof r.hours!=='number'||!Number.isFinite(r.hours)||r.hours<=0||r.hours>24||!Number.isInteger(r.hours*60))throw Error('假別或原始時數不正確');
  if(typeof r.source!=='string'||!r.source||r.source.length>140)throw Error('請提供原始檔案與工作表列號');
  const key=r.number+'|'+r.date+'|'+r.type;if(keys.has(key))throw Error('同一員工、日期與假別有多筆紀錄，請先核對');keys.add(key);
 }
 return rows;
}
