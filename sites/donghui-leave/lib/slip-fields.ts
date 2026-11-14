export function suggestSlipFields(text:string,employees:{number:string;name:string}[]){
 const compact=text.replace(/\s/g,'');const people=employees.filter(e=>compact.includes(e.number)||compact.includes(e.name.replace(/\s/g,'')));const types=['事假','病假','生理假','特休'].filter(t=>compact.includes(t));
 const dateMatch=/(?:民國)?(\d{3,4})\s*[年\/.-]\s*(\d{1,2})\s*[月\/.-]\s*(\d{1,2})/.exec(text);let date='';if(dateMatch){const year=Number(dateMatch[1])+(dateMatch[1].length===3?1911:0);date=`${year}-${dateMatch[2].padStart(2,'0')}-${dateMatch[3].padStart(2,'0')}`;}
 const hm=/(?:請假時數|時數|共計|合計)\s*[:：]?\s*(\d+(?:\.\d+)?)\s*(?:小時)?/.exec(text)||/(\d+(?:\.\d+)?)\s*小時/.exec(text);
 return {number:people.length===1?people[0].number:'',type:types.length===1?types[0]:'',date,hours:hm?hm[1]:''};
}
