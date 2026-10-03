'use client';

import {useState} from 'react';
import {ArrowRight, Network, Search} from 'lucide-react';
import {documents} from '@/lib/rag';
import {scenarios} from '@/lib/building-scenarios';
import {approachIcons} from './approach-icons';
import {categoryColors} from './category-colors';
import {KnowledgeGraph} from './visuals';

const categories=[...new Set(documents.map(d=>d.category))];
const linkCount=documents.reduce((s,d)=>s+d.links.length,0);

export type KnowledgeScope='company'|'facilities';
export default function KnowledgeBase({scope,onScope,onSource,onEnterprise}:{scope:KnowledgeScope;onScope:(scope:KnowledgeScope)=>void;onSource:(id:string)=>void;onEnterprise:(index:number)=>void}) {
 const [filter,setFilter]=useState('All'),[query,setQuery]=useState('');
 const words=query.toLowerCase().trim();
 const shown=documents.filter(d=>(filter==='All'||d.category===filter)&&(!words||`${d.id} ${d.title} ${d.text}`.toLowerCase().includes(words)));
 return <section className="knowledge-base">
  <div className="knowledge-tabs" role="group" aria-label="Knowledge base collections"><button aria-pressed={scope==='company'} onClick={()=>onScope('company')}>Building documents ({documents.length})</button><button aria-pressed={scope==='facilities'} onClick={()=>onScope('facilities')}>Facilities case studies ({scenarios.length})</button></div>
  {scope==='company'?<>
   <div className="kb-stats"><div><strong>{documents.length}</strong><span>documents</span></div><div><strong>{categories.length}</strong><span>categories</span></div><div><strong>{linkCount}</strong><span>document links</span></div><p>Harbor Tower’s fictional operations library. The Playground, Compare approaches and the Evaluation lab all search it.</p></div>
   <div className="kb-filters">
    <div className="kb-chips" role="group" aria-label="Filter by category">{['All',...categories].map(c=><button key={c} aria-pressed={filter===c} onClick={()=>setFilter(c)}>{c!=='All'&&<i style={{background:categoryColors[c]}}/>}{c==='All'?'All':c}<span>{c==='All'?documents.length:documents.filter(d=>d.category===c).length}</span></button>)}</div>
    <label className="kb-search"><Search size={14}/><input aria-label="Filter documents by word" placeholder="Filter by word or ID" value={query} onChange={e=>setQuery(e.target.value)}/></label>
   </div>
   {shown.length?<div className="document-grid">{shown.map(d=><button className="document-card" key={d.id} style={{'--cat':categoryColors[d.category]} as React.CSSProperties} onClick={()=>onSource(d.id)}><div><span className="doc-id">{d.id}</span><span className="doc-links" title={`${d.links.length} links to other documents`}><Network size={12}/>{d.links.length}<span className="sr-only"> links</span></span></div><h3>{d.title}</h3><small>{d.category}</small><p>{d.text}</p></button>)}</div>:<p className="kb-empty">No documents match “{query}”{filter==='All'?'':` in ${filter}`}.</p>}
   <KnowledgeGraph onSource={onSource}/>
  </>:<>
   <p className="kb-intro">Six portfolio-scale scenarios used by the Production blueprint. Their evidence is written up here; the underlying documents are not bundled or searched.</p>
   <div className="facilities-library">{scenarios.map((s,i)=>{const Icon=approachIcons[s.pattern];return <article className="facility-card" key={s.name}><span className="visual-kicker"><Icon size={13}/>{s.stack}</span><h3>{s.name}</h3><p>{s.question}</p><details><summary>Read case-study evidence</summary><h4>Source material described by the scenario</h4><p>{s.sources}</p><h4>Fictional evidence summary</h4><p>{s.evidence}</p><h4>Prepared example answer</h4><p>{s.answer}</p></details><button className="text-button" onClick={()=>onEnterprise(i)}>Open {s.name.toLowerCase()} in Production blueprint <ArrowRight size={14}/></button></article>;})}</div>
  </>}
 </section>;
}
