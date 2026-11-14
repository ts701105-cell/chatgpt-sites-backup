import urllib.request,re,json,pathlib,concurrent.futures,html
root=pathlib.Path(__file__).parent
ss=json.loads((root/'series.json').read_text())
used={k for c in json.loads((root/'dist/data/catalog.json').read_text()) for k in c['series']}
ss=[s for s in ss if s['id'] in used]
def get(s):
 if s['source']!='FRED':return s['id'],{}
 try:
  t=urllib.request.urlopen(s['url'],timeout=30).read().decode()
  title=html.unescape(re.search(r'<title>(.*?)</title>',t,re.S).group(1)).strip()
  units=re.search(r'<span class="series-meta-value-units">(.*?)</span>',t,re.S)
  return s['id'],{'title':title,'units':html.unescape(re.sub('<[^>]*>','',units.group(1))).strip() if units else ''}
 except Exception as e:return s['id'],{'error':str(e)}
with concurrent.futures.ThreadPoolExecutor(max_workers=10) as pool:
 d=dict(pool.map(get,ss))
(root/'metadata-check.json').write_text(json.dumps(d,ensure_ascii=False,indent=2))
for k,v in d.items():
 if v:print(k,v)
