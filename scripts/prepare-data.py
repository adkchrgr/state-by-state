"""Decode the bundled, projected us-atlas TopoJSON; no Python dependencies."""
import json
from pathlib import Path
root=Path(__file__).resolve().parents[1]
t=json.loads((root/'web/data/source-topology.json').read_text())
arcs=[]
for arc in t['arcs']:
    x=y=0; points=[]
    for dx,dy in arc:
        x+=dx;y+=dy
        points.append([round(x*t['transform']['scale'][0]+t['transform']['translate'][0],4),round(y*t['transform']['scale'][1]+t['transform']['translate'][1],4)])
    arcs.append(points)
def ring(ids):
    out=[]
    for n in ids:
        pts=arcs[n] if n>=0 else list(reversed(arcs[~n]))
        out.extend(pts if not out else pts[1:])
    return out
codes='AL AK AZ AR CA CO CT DE FL GA HI ID IL IN IA KS KY LA ME MD MA MI MN MS MO MT NE NV NH NJ NM NY NC ND OH OK OR PA RI SC SD TN TX UT VT VA WA WV WI WY'.split()
names='Alabama|Alaska|Arizona|Arkansas|California|Colorado|Connecticut|Delaware|Florida|Georgia|Hawaii|Idaho|Illinois|Indiana|Iowa|Kansas|Kentucky|Louisiana|Maine|Maryland|Massachusetts|Michigan|Minnesota|Mississippi|Missouri|Montana|Nebraska|Nevada|New Hampshire|New Jersey|New Mexico|New York|North Carolina|North Dakota|Ohio|Oklahoma|Oregon|Pennsylvania|Rhode Island|South Carolina|South Dakota|Tennessee|Texas|Utah|Vermont|Virginia|Washington|West Virginia|Wisconsin|Wyoming'.split('|')
lookup=dict(zip(names,codes)); states=[]
for g in t['objects']['states']['geometries']:
    name=g['properties']['name']
    if name not in lookup: continue
    polys=g['arcs'] if g['type']=='MultiPolygon' else [g['arcs']]
    states.append(dict(id=lookup[name],name=name,geometry=[[ring(r) for r in p] for p in polys]))
states.sort(key=lambda s:s['name'])
(root/'web/data/states.js').write_text('/* Derived from us-atlas 3.0.1. See THIRD_PARTY.md. */\n(function(g){const data='+json.dumps(states,separators=(',',':'))+';if(typeof module!=="undefined")module.exports=data;else g.STATES=data;})(globalThis);\n')
print('Bundled',len(states),'states')
