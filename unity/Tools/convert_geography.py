"""Convert the authoritative repo geography into JsonUtility-compatible records."""
import json
from pathlib import Path
root=Path(__file__).resolve().parents[2]
data=json.loads((root/'data/vajgar.json').read_text())
def point(a):return {'x':a[0],'z':a[1]}
s=data['station']
out={'shoreline':[point(p) for p in data['shoreline']], 'island':[point(p) for p in data['island']],
 'buildings':[dict(outline=[point(p) for p in b['outline']],height=b['height'],name=b['name'],type=b['type']) for b in data['buildings']],
 'station':{'position':point([s['position'][0],s['position'][2]]),'target':point([s['target'][0],s['target'][2]]),'eyeHeight':s['position'][1]}}
path=root/'unity/Assets/Reviry/Resources/Geography/vajgar.json'
path.write_text(json.dumps(out,ensure_ascii=False,separators=(',',':')))
print(path)
