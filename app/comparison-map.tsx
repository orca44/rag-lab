'use client';

import {useState} from 'react';
import {AlertTriangle, Check} from 'lucide-react';
import {documents, patterns, retrieve, type RagId} from '@/lib/rag';
import {examples} from '@/lib/examples';
import {approachIcons} from './approach-icons';
import {categoryColors} from './category-colors';

export default function ComparisonMap({question,topK,category,onSource,onExplore}:{question:string;topK:number;category:string;onSource:(id:string)=>void;onExplore:(id:RagId)=>void}) {
 const [showAll,setShowAll]=useState(false);
 const rows=patterns.map(p=>({...p,result:retrieve(p.id,question,topK,category)}));
 const pool=documents.filter(d=>category==='All documents'||d.category===category);
 const found=new Set(rows.flatMap(p=>p.result.hits.map(h=>h.doc.id)));
 const shared=pool.filter(d=>rows.every(p=>p.result.hits.some(h=>h.doc.id===d.id)));
 const orders=new Set(rows.map(p=>p.result.hits.map(h=>h.doc.id).join(','))).size;
 const agent=rows.find(p=>p.id==='agentic')!;
 const route=patterns.find(p=>p.id===agent.result.route)?.name;
 const grades=examples.find(e=>e.question===question)?.grades;
 const keys=grades?Object.keys(grades).filter(id=>grades[id]===2):[];
 // Key sources always get a column, so a source every approach missed is still visible.
 const visible=pool.filter(d=>showAll||found.has(d.id)||grades?.[d.id]===2);
 return <section className="comparison-map">
  <div className="visual-section-heading"><div><h3>Where do the approaches agree?</h3><p>Each row is one approach; each column is a document it returned.</p></div></div>
  <div className="comparison-summary" aria-live="polite">
   <div className="compare-stats"><div><strong>{found.size}</strong><span>distinct sources</span></div><div><strong>{shared.length}</strong><span>shared by all six</span></div><div><strong>{orders}</strong><span>different {orders===1?'ranking':'rankings'}</span></div></div>
   {found.size>0&&route&&<p>Agentic selected <strong>{route}</strong>{agent.result.retried?', then retried with Hybrid because fewer than two sources came back.':', so its row matches that approach.'}</p>}
  </div>
  <label className="matrix-toggle"><input type="checkbox" checked={showAll} onChange={e=>setShowAll(e.target.checked)}/> Show all {pool.length} documents in this collection</label>
  {visible.length>0?<div className="matrix-scroll" role="region" aria-label="Retrieval comparison table" tabIndex={0}><table className="source-matrix"><caption>Numbers are ranks; a dash means not retrieved. Select a title or rank to read the document.</caption>
   <thead><tr><th scope="col">Approach</th>{grades&&<th scope="col" className="keys-head">Key sources</th>}{visible.map(d=><th key={d.id} scope="col" className={grades?.[d.id]===2?(found.has(d.id)?'key-col':'key-col missed'):''}><button className="matrix-source-title" onClick={()=>onSource(d.id)}><span><i style={{background:categoryColors[d.category]}}/>{d.id}</span>{d.title}</button>{grades?.[d.id]&&<em className={grades[d.id]===2?'col-tag key':'col-tag'}>{grades[d.id]===2?(found.has(d.id)?'Key':'Key · missed by all'):'Supporting'}</em>}</th>)}</tr></thead>
   <tbody>{rows.map(p=>{const Icon=approachIcons[p.id];const hit=keys.filter(id=>p.result.hits.some(h=>h.doc.id===id)).length;return <tr key={p.id}><th scope="row"><button className="matrix-approach" title={`Open ${p.name} in the Playground`} onClick={()=>onExplore(p.id)}><Icon size={14}/>{p.name}</button></th>{grades&&<td className={'matrix-keys '+(!keys.length?'none':hit===keys.length?'all':'partial')}>{keys.length?<>{hit===keys.length?<Check size={13}/>:<AlertTriangle size={13}/>}{hit} of {keys.length}</>:'none exist'}</td>}{visible.map(d=>{const rank=p.result.hits.findIndex(h=>h.doc.id===d.id);return <td key={d.id} className={grades?.[d.id]===2?'key-col':''}>{rank<0?<span className="matrix-empty" aria-label="Not retrieved">—</span>:<button className={`matrix-cell rank-${rank}`} onClick={()=>onSource(d.id)} aria-label={`${p.name}, ${d.title}, rank ${rank+1}`}>{rank+1}</button>}</td>;})}</tr>;})}</tbody></table></div>:<p className="comparison-empty">No document shares a word or concept with this question{category==='All documents'?'':` in ${category}`}.</p>}
  <details className="compare-steps"><summary>Why each approach ranked this way</summary><div className="compare-steps-grid">{rows.map(p=>{const Icon=approachIcons[p.id];return <article key={p.id}><h4><Icon size={15}/>{p.name}</h4><ol>{p.result.trace.map((t,i)=><li key={i}>{t}</li>)}</ol>{p.result.queries.length>1&&<p>Wordings searched: {p.result.queries.join(' · ')}</p>}</article>;})}</div></details>
  <p className="visual-footnote">Ranks show what each approach returned, not whether it is correct. Scores from different approaches use different scales.</p>
 </section>;
}
