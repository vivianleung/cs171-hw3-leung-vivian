import requests
import pandas as pd
from pattern import web as w

r = requests.get('https://unglobalpulse.net/ewec')

results = w.Element(r.content)

table = results.by_tag('table')[0]

data = { 'Analysis Date': [], "Women's Health": [] }

i = 0
for row in table.by_tag('tr'):
	if i == 0: 
		i = 1
	else: 
		rval = row.by_tag('td')
		val1 = rval[0].content
		val2 = int(rval[3].content.replace(",","")) 	
		data['Analysis Date'].append( val1 )
		data["Women's Health"].append( val2)

data = pd.DataFrame(data)
data.to_csv("unHealth.csv", index=False)

print "done! ^_^"

