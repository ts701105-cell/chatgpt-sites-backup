import json,pathlib
root=pathlib.Path(__file__).parent
s=[]
def add(id,name,unit,freq,source='FRED',note=''):
 s.append(dict(id=id,name=name,unit=unit,freq=freq,source=source,note=note,url='https://fred.stlouisfed.org/series/'+id if source=='FRED' else 'https://data.worldbank.org/indicator/'+id.split(':')[1]))
raw='''GDPC1|實質 GDP|十億鏈結 2017 美元|Q
GDP|名目 GDP|十億美元|Q
UNRATE|失業率|%|M
CPIAUCSL|消費者物價指數 CPI|1982–84=100|M
CPILFESL|核心 CPI|1982–84=100|M
FEDFUNDS|有效聯邦基金利率|%|M
GS10|10 年期美國公債殖利率|%|M
GS2|2 年期美國公債殖利率|%|M
GS5|5 年期美國公債殖利率|%|M
GS30|30 年期美國公債殖利率|%|M
MORTGAGE30US|30 年固定房貸利率|%|W
AAA|Moody's Aaa 公司債殖利率|%|M
BAMLH0A0HYM2EY|ICE 美國高收益債有效殖利率|%|D
DJIA|道瓊工業指數|點|D
SP500|S&P 500 指數|點|D
NASDAQCOM|那斯達克綜合指數|點|D
NIKKEI225|日經 225 指數|點|D
PCE|個人消費支出|十億美元|M
PCEC|個人消費支出（季）|十億美元|Q
PCEC96|實質個人消費支出|十億鏈結 2017 美元|M
GPDI|民間國內投資|十億美元|Q
PNFI|民間非住宅固定投資|十億美元|Q
PRFI|民間住宅固定投資|十億美元|Q
FPI|民間固定投資|十億美元|Q
PNFIC1|實質非住宅固定投資|十億鏈結 2017 美元|Q
PNFIC96|實質非住宅固定投資（舊代碼）|十億美元|Q
A679RC1Q027SBEA|資訊處理設備與軟體投資|十億美元|Q
ULCNFB|非農企業單位勞動成本|2017=100|Q
OPHNFB|非農企業每小時產出|2017=100|Q
AHETPI|生產及非管理員工平均時薪|美元／小時|M
AWHNONAG|生產及非管理員工每週工時|小時|M
PAYEMS|非農就業人數|千人|M
MANEMP|製造業就業人數|千人|M
CES6562000001|醫療與社會援助業就業人數|千人|M
CIVPART|勞動參與率|%|M
CE16OV|家庭調查就業人數|千人|M
PSAVERT|個人儲蓄率|%|M
TOTALSL|消費信貸總額|百萬美元|M
HHMSDODNS|家庭房屋抵押貸款餘額|百萬美元|Q
HDTGPDUSQ163N|家庭債務占 GDP|%|Q
TABSHNO|家庭及非營利組織總資產|百萬美元|Q
HOANBS|家庭及非營利組織房地產資產|十億美元|Q
TNWBSHNO|家庭及非營利組織淨值|百萬美元|Q
CPATAX|企業稅後利潤（含 IVA／CCAdj）|十億美元|Q
CP|企業稅後利潤（未含 IVA／CCAdj）|十億美元|Q
NETEXP|商品及服務淨出口|十億美元|Q
EXPGS|商品及服務出口|十億美元|Q
IMPGS|商品及服務進口|十億美元|Q
BOPGSTB|商品及服務貿易差額|百萬美元|M
FYFSD|聯邦財政盈餘／赤字|百萬美元|A
FYFSGDA188S|聯邦盈餘／赤字占 GDP|%|A
FYONGDA188S|聯邦支出占 GDP|%|A
FYFRGDA188S|聯邦收入占 GDP|%|A
GFDEGDQ188S|聯邦總債務占 GDP|%|Q
FGEXPND|聯邦政府經常支出|十億美元|Q
FGRECPT|聯邦政府經常收入|十億美元|Q
SLEXPND|州與地方政府經常支出|十億美元|Q
A091RC1Q027SBEA|聯邦政府利息支出|十億美元|Q
CSUSHPINSA|Case-Shiller 全美房價|2000 年 1 月=100|M
SPCS20RSA|Case-Shiller 20 城市房價|2000 年 1 月=100|M
HOUST|新屋開工|千戶，季調年率|M
EXHOSLUSM495S|成屋銷售|戶，季調年率|M
RRVRUSQ156N|出租房空置率|%|Q
CUSR0000SEHA|主要住所租金 CPI|1982–84=100|M
TTLHH|家庭戶數|千戶|A
DCOILWTICO|WTI 原油現貨|美元／桶|D
DCOILBRENTEU|Brent 原油現貨|美元／桶|D
DHHNGSP|Henry Hub 天然氣現貨|美元／百萬 BTU|D
IPG21112N|原油工業生產指數|2017=100|M
DEXJPUS|美元兌日圓|日圓／美元|D
DEXTAUS|美元兌新台幣|新台幣／美元|D
DEXKOUS|美元兌韓元|韓元／美元|D
DEXCHUS|美元兌人民幣|人民幣／美元|D
DEXSZUS|美元兌瑞郎|瑞郎／美元|D
IRLTLT01JPM156N|日本 10 年期公債殖利率|%|M
MRTSSM44000USS|零售業銷售（不含餐飲）|百萬美元|M
MRTSSM446USS|健康與個人護理商店零售|百萬美元|M
DGDSRC1|耐久財消費支出|十億美元|M
AMDMVS|製造業耐久財出貨|百萬美元|M
ANDEVS|非國防資本財出貨（含飛機）|百萬美元|M
AMVPVS|汽車及零件出貨|百萬美元|M
A34SVS|電腦與電子產品出貨|百萬美元|M
JTSJOL|全產業職缺|千人|M
JTS6200JOL|醫療與社會援助職缺|千人|M'''
for row in raw.splitlines():add(*row.split('|'))
# World Bank data extend international comparisons; annual observations are explicit proxies.
for code,cn in [('USA','美國'),('JPN','日本'),('GBR','英國'),('DEU','德國'),('FRA','法國'),('ITA','義大利'),('BRA','巴西'),('RUS','俄羅斯'),('IND','印度'),('CHN','中國'),('IDN','印尼'),('MYS','馬來西亞'),('THA','泰國'),('VNM','越南'),('PHL','菲律賓'),('SGP','新加坡')]:
 for ind,name,unit in [('NY.GDP.MKTP.KD.ZG','實質 GDP 年增率','%')]:add(code+':'+ind,cn+name,unit,'A','World Bank')
for code,cn,inds in [('BRA','巴西',['FP.CPI.TOTL.ZG','NE.CON.PRVT.KD']),('RUS','俄羅斯',['NE.EXP.GNFS.CD']),('IND','印度',['NE.CON.PRVT.KD','NE.GDI.FTOT.KD','NE.RSB.GNFS.ZS']),('CHN','中國',['SP.POP.DPND','NV.AGR.TOTL.KD.ZG','NV.IND.TOTL.KD.ZG','NV.SRV.TOTL.KD.ZG']),('USA','美國',['SP.POP.1564.TO.ZS','SP.POP.65UP.TO.ZS']),('JPN','日本',['NE.RSB.GNFS.CD'])]:
  names={'FP.CPI.TOTL.ZG':('CPI 年增率','%'),'NE.CON.PRVT.KD':('家庭及非營利組織實質消費','固定 2015 美元'),'NE.EXP.GNFS.CD':('商品及服務出口','現價美元'),'NE.GDI.FTOT.KD':('實質固定資本形成（全體）','固定 2015 美元'),'NE.RSB.GNFS.ZS':('商品及服務貿易餘額占 GDP','%'),'SP.POP.DPND':('年齡扶養比','%'),'NV.AGR.TOTL.KD.ZG':('農業附加價值年增率','%'),'NV.IND.TOTL.KD.ZG':('工業附加價值年增率','%'),'NV.SRV.TOTL.KD.ZG':('服務業附加價值年增率','%'),'SP.POP.1564.TO.ZS':('15–64 歲人口占比','%'),'SP.POP.65UP.TO.ZS':('65 歲以上人口占比','%'),'NE.RSB.GNFS.CD':('商品及服務貿易餘額','現價美元')}
  for ind in inds:add(code+':'+ind,cn+names[ind][0],names[ind][1],'A','World Bank')
(root/'series.json').write_text(json.dumps(s,ensure_ascii=False,indent=2))
p=root/'.openai/hosting.json';v=json.loads(p.read_text());v['static']={'directory':'dist'};p.write_text(json.dumps(v))
