"""Refresh official history, retain last-good values on failure, never fabricate missing data."""
import urllib.request,urllib.parse,concurrent.futures,json,csv,io,time,datetime,pathlib,sys
root=pathlib.Path(__file__).parent
out=root/'dist/data/history.json'
prev=json.loads(out.read_text()) if out.exists() else {'series':{}}
registry=json.loads((root/'series.json').read_text())
used={id for c in json.loads((root/'dist/data/catalog.json').read_text()) for id in c['series']}
registry=[s for s in registry if s['id'] in used]
metadata=json.loads((root/'metadata-check.json').read_text()) if (root/'metadata-check.json').exists() else {}
for s in registry:
 s['sourceTitle']=metadata.get(s['id'],{}).get('title','')
 s['sourceUnit']=metadata.get(s['id'],{}).get('units','')
now=datetime.datetime.now(datetime.timezone.utc).isoformat()
def fetch(s):
 if '--only-missing' in sys.argv and prev['series'].get(s['id'],{}).get('status')=='ok':
  old=prev['series'][s['id']];old.update(s);return s['id'],old
 try:
  if s['source']=='FRED':
   url='https://fred.stlouisfed.org/graph/fredgraph.csv?id='+s['id']
   raw=urllib.request.urlopen(url,timeout=55).read().decode('utf-8-sig')
   reader=csv.reader(io.StringIO(raw));headers=next(reader)
   if s['id'] not in headers:raise ValueError('Unexpected CSV headers')
   k=headers.index(s['id']); data=[]
   for r in reader:
    if len(r)>k and r[k] not in ('','.','NA'):data.append([r[0],float(r[k])])
  else:
   country,indicator=s['id'].split(':')
   url=f'https://api.worldbank.org/v2/country/{country}/indicator/{indicator}?format=json&per_page=1000'
   j=json.loads(urllib.request.urlopen(url,timeout=55).read())
   data=sorted([[r['date']+'-01-01',r['value']] for r in j[1] if r['value'] is not None])
  if len(data)<2:raise ValueError('Insufficient observations')
  # Date validation and no projected observations in the observed-data layer.
  today=now[:10];data=[r for r in data if datetime.date.fromisoformat(r[0]) and r[0]<=today]
  return s['id'],dict(**s,data=data,checked=now,fetched=now,status='ok',download=url)
 except Exception as e:
  old=prev['series'].get(s['id'],{})
  return s['id'],dict(**s,data=old.get('data',[]),fetched=old.get('fetched'),checked=now,status='stale' if old.get('data') else 'unavailable',error=str(e)[:180])
result={}
with concurrent.futures.ThreadPoolExecutor(max_workers=10) as pool:
 for id,row in pool.map(fetch,registry):
  result[id]=row
  print(id,row['status'],len(row['data']),flush=True)
payload={'checked':now,'series':result,'note':'Latest revised observations, not vintage data. Errors preserve last successful history.'}
out.parent.mkdir(parents=True,exist_ok=True)
tmp=out.with_suffix('.tmp');tmp.write_text(json.dumps(payload,ensure_ascii=False,separators=(',',':')));tmp.replace(out)
print('RESULT',sum(bool(s['data']) for s in result.values()),'/',len(result))
