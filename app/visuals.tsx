'use client';

import {useId, useState} from 'react';
import {ArrowRight, Network} from 'lucide-react';
import {documents, type Result} from '@/lib/rag';
import {categoryColors} from './category-colors';

export function KnowledgeGraph({onSource, hits=[]}:{onSource:(id:string)=>void;hits?:Result['hits']}) {
 const [selected,setSelected]=useState(hits[0]?.doc.id??'D08');
 const marker=useId().replace(/:/g,'');
 const doc=documents.find(d=>d.id===selected)!;
 const neighbors=doc.links.map(id=>documents.find(d=>d.id===id)!);
 const nodes=[doc,...neighbors];
 const positions=nodes.map((_,i)=>i===0?[50,48]:[50+35*Math.cos((i-1)*2*Math.PI/neighbors.length-Math.PI/2),48+32*Math.sin((i-1)*2*Math.PI/neighbors.length-Math.PI/2)]);
 return <section className="knowledge-visual"><div className="visual-section-heading"><div><span className="visual-kicker">THE CONNECTED CORPUS</span><h3>Documents don’t exist in isolation.</h3><p>Pick a document to see what it links to, then follow a link to keep going.</p></div><Network size={25}/></div>
 <label className="graph-source-picker">Graph starting document<select value={selected} onChange={e=>setSelected(e.target.value)}>{documents.map(d=><option key={d.id} value={d.id}>{d.id} · {d.title}</option>)}</select></label>
 <div className="graph-layout"><div><div className="graph-canvas"><svg viewBox="0 0 600 360" preserveAspectRatio="none" aria-hidden="true"><defs><marker id={marker} viewBox="0 0 10 10" refX="9" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse"><path d="M 0 0 L 10 5 L 0 10 z" fill="#438772"/></marker></defs>{neighbors.map((d,i)=>{
 const a=positions[0],b=positions[i+1],dx=(b[0]-a[0])*6,dy=(b[1]-a[1])*3.6,length=Math.hypot(dx,dy);
 return <line key={d.id} x1={a[0]*6+dx/length*21} y1={a[1]*3.6+dy/length*21} x2={b[0]*6-dx/length*24} y2={b[1]*3.6-dy/length*24} className="graph-edge selected" markerEnd={`url(#${marker})`}/>;
 })}</svg>{nodes.map((d,i)=><button key={d.id} className={'graph-node '+(selected===d.id?'selected ':'connected ')+(hits.some(h=>h.doc.id===d.id)?'retrieved':'')} style={{left:`${positions[i][0]}%`,top:`${positions[i][1]}%`,borderColor:categoryColors[d.category]}} aria-label={`Select ${d.title} (${d.id})`} aria-pressed={selected===d.id} onClick={()=>setSelected(d.id)}><span>{d.id}</span><small>{d.title}</small></button>)}</div><div className="graph-legend">{Object.entries(categoryColors).map(([label,color])=><span key={label}><i style={{background:color}}/>{label}</span>)}</div></div><div className="graph-inspector" key={doc.id}><span className="visual-kicker">{doc.id} / {doc.category}</span><h4>{doc.title}</h4><p>{doc.text}</p><span className="graph-link-title">{doc.links.length} OUTGOING RELATIONSHIPS</span>{neighbors.map(d=><button key={d.id} onClick={()=>setSelected(d.id)}><span>{d.id}</span>{d.title}<ArrowRight size={13}/></button>)}<button className="text-button" onClick={()=>onSource(doc.id)}>Open source document <ArrowRight size={14}/></button></div></div><p className="visual-footnote">Showing {nodes.length} of {documents.length} sources. Arrows show explicit document links, not measured similarity. Follow AHU-7 (D07) to find comms room 305; a one-hop search from the chiller does not automatically reach it.{hits.length>0?' Dotted outlines mark retrieved sources visible in this neighborhood.':''}</p></section>;
}

export {default as ComparisonMap} from './comparison-map';

export function CapacityChart({qps,variants,cache}:{qps:number;variants:number;cache:number}) {
 const max=qps*variants*2;
 const value=max*(1-cache/100);
 const x=60+cache/80*600;
 const y=195-value/max*150;
 return <figure className="capacity-chart"><figcaption><div><span className="visual-kicker">EXPLORE THE TRADEOFF</span><h3>More cache hits. Fewer searches.</h3><p>Move the sliders to see the modeled search demand change.</p></div><span className="capacity-savings">{cache}%<small>search work avoided</small></span></figcaption><svg viewBox="0 0 720 255" role="img" aria-label={`At ${qps} questions per second and ${variants} phrasings, a ${cache}% cache hit rate reduces logical search branches from ${max} to ${Number(value.toFixed(1))} per second.`}><defs><linearGradient id="capacity-area" x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stopColor="#54b594" stopOpacity=".25"/><stop offset="100%" stopColor="#54b594" stopOpacity=".02"/></linearGradient></defs>{[0,.5,1].map(t=><g key={t}><line x1="60" x2="660" y1={195-t*150} y2={195-t*150} className="chart-grid"/><text x="47" y={199-t*150} textAnchor="end">{Math.round(max*t)}</text></g>)}<text x="60" y="20">Logical search branches / second</text><path d="M 60 45 L 660 165 L 660 195 L 60 195 Z" fill="url(#capacity-area)"/><path d="M 60 45 L 660 165" className="capacity-line"/><line x1={x} x2={x} y1={y} y2="195" className="capacity-guide"/><circle cx={x} cy={y} r="7" className="capacity-point"/>{[0,20,40,60,80].map(t=><text key={t} x={60+t/80*600} y="220" textAnchor="middle">{t}%</text>)}<text x="360" y="245" textAnchor="middle">Authorized answer-cache hit rate</text></svg><p className="visual-footnote">Current demand: <strong>{Number(value.toFixed(1))} branches/sec</strong> = {qps} questions/sec × (1 − {cache}/100) × {variants} variants × 2 search branches. Each cache hit avoids all modeled search branches. Planning model, not a benchmark.</p></figure>;
}
