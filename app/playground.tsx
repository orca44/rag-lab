'use client';

import {useState} from 'react';
import {AlertTriangle, ArrowRight, Check, CornerDownRight, Database, Info, Play, ShieldCheck} from 'lucide-react';
import {documents, patterns, type RagId, type Result} from '@/lib/rag';
import {examples, lessons, playgroundPicks, type Example, type Lesson} from '@/lib/examples';
import {approachIcons} from './approach-icons';
import {patternResearch} from '@/lib/research';
import {KnowledgeGraph} from './visuals';
import {categoryColors} from './category-colors';

const categories=[...new Set(documents.map(d=>d.category))];

type Props={active:RagId;onSelect:(id:RagId)=>void;question:string;onQuestion:(q:string)=>void;category:string;onCategory:(c:string)=>void;topK:number;onTopK:(k:number)=>void;result:Result|null;ready:boolean;onRun:()=>void;onExample:(q:string)=>void;onSource:(id:string)=>void;onCompare:()=>void};

export default function Playground({active,onSelect,question,onQuestion,category,onCategory,topK,onTopK,result,ready,onRun,onExample,onSource,onCompare}:Props) {
 const pattern=patterns.find(p=>p.id===active)!;const Icon=approachIcons[active];
 const suggested=playgroundPicks[active].map(id=>examples.find(e=>e.id===id)!);
 const selected=examples.find(e=>e.question===question);
 const lesson=selected&&lessons[selected.id]?.[active];
 return <>
  <div className="approach-strip" role="group" aria-label="RAG approaches">{patterns.map((p,i)=>{const CardIcon=approachIcons[p.id];return <button className={'approach-card '+(active===p.id?'chosen':'')} key={p.id} aria-pressed={active===p.id} onClick={()=>onSelect(p.id)}><div><CardIcon size={20}/><span>0{i+1}</span></div><strong>{p.name}</strong><small>{p.short}</small>{active===p.id&&<span className="card-selected"><Check size={11}/></span>}</button>})}</div>

  <section className="pattern-panel" aria-labelledby="pattern-name">
   <div className="pattern-head"><div className="pattern-title"><span className="large-icon"><Icon size={25}/></span><div><h2 id="pattern-name">{pattern.name}</h2><p>{pattern.description}</p></div></div></div>
   <ol className="approach-steps" aria-label={`How ${pattern.name} works`}>{pattern.steps.map((step,i)=><li key={step}><span>{i+1}</span><strong>{step}</strong><p>{pattern.stepNotes[i]}</p></li>)}</ol>
   <div className="approach-fit"><div><h3>Good for</h3><p>{pattern.use}</p></div><div><h3>Watch out</h3><p>{pattern.tradeoff}</p></div></div>
   <details className="pattern-details"><summary>How this demo implements it</summary><div className="pattern-evidence"><p>{patternResearch[active].limit}</p></div></details>
  </section>

  <div className="playground-grid">
   <section className="query-panel" aria-labelledby="try-heading">
    <h3 id="try-heading">Try {pattern.name}</h3>
    <p className="panel-intro">Pick an example chosen to show this approach, or ask your own question about Harbor Tower.</p>
    <div className="example-chips" role="group" aria-label={`Example questions for ${pattern.name}`}>{suggested.map(e=><button key={e.id} aria-pressed={e.question===question} onClick={()=>onExample(e.question)}>{e.question}<LessonTag lesson={lessons[e.id][active]!}/></button>)}</div>
    <label htmlFor="question">Your question</label>
    <textarea disabled={!ready} id="question" value={question} onChange={e=>onQuestion(e.target.value)} placeholder="Ask about tenant requests, alarms, energy or equipment dependencies…"/>
    <div className="query-options">
     <div><label htmlFor="collection">Knowledge source</label><select id="collection" value={category} onChange={e=>onCategory(e.target.value)}><option>All documents</option>{categories.map(c=><option key={c}>{c}</option>)}</select></div>
     <div><label htmlFor="topk">Top K</label><select id="topk" value={topK} onChange={e=>onTopK(Number(e.target.value))}>{[1,2,3,4,5].map(n=><option key={n}>{n}</option>)}</select></div>
    </div>
    <p className="option-hint">Searching {documents.filter(d=>category==='All documents'||d.category===category).length} documents. Top K is how many sources the search keeps.</p>
    <button className="primary" disabled={!ready||!question.trim()} onClick={onRun}>Run search<Play size={14} fill="currentColor"/></button>
    {selected&&<div className="look-for"><strong>{lesson?'What to look for':'What to compare across approaches'}</strong>{lesson&&<LessonTag lesson={lesson}/>}<p>{lesson?lesson.note:selected.observe}</p><details key={selected.id}><summary>Reference answer</summary><p>{selected.answer}</p><p className="visual-footnote">Written in advance for the fictional sources, not generated from this run.</p></details></div>}
    <div className="demo-note"><ShieldCheck size={13}/> Question processing stays in your browser</div>
   </section>

   <section className="result-panel" aria-labelledby="result-heading">
    <h3 id="result-heading">What {pattern.name} found</h3>
    {!result?<div className="empty-result"><div className="empty-orbit"><Database size={30}/></div><p>Run the search to see which documents {pattern.name} keeps, how it ranks them and whether it finds the expected sources.</p></div>:<ResultView result={result} example={selected} active={active} category={category} topK={topK} onSource={onSource} onCompare={onCompare}/>}
   </section>
  </div>
  {active==='graph'&&<KnowledgeGraph key={result?.hits.map(h=>h.doc.id).join(',')??'preview'} onSource={onSource} hits={result?.hits}/>}
 </>;
}

function LessonTag({lesson}:{lesson:Lesson}) {
 return lesson.kind==='works'?<span className="lesson-tag works"><Check size={11}/>Works well</span>:<span className="lesson-tag limit"><AlertTriangle size={11}/>Shows a limit</span>;
}

const routeNames:Record<string,string>={naive:'Naive',hybrid:'Hybrid',rerank:'Reranking',multi:'Multi-query',graph:'Graph'};
const routeWhy:Record<string,string>={graph:'the question mentions an outage, trip, failure, impact, dependency or owner',hybrid:'the question contains a code such as F-17',naive:'no rule matched, so it uses the default'};
// Plain-language versions of the scoring rules in lib/rag.ts; the technical name stays in the tooltip and the steps.
const plainReasons:Record<string,string>={'Concept-vector similarity':'Ranked by how many concepts each document shares with the question','Reciprocal rank fusion (k = 60)':'Ranked by combining the concept search and the exact-word search','Heuristic rerank: 35% concept + 65% keyword':'Re-sorted by a second score that weights the question’s exact words more heavily','Best similarity across expanded queries':'Ranked by each document’s best match across all wordings'};

function ResultView({result,example,active,category,topK,onSource,onCompare}:{result:Result;example?:Example;active:RagId;category:string;topK:number;onSource:(id:string)=>void;onCompare:()=>void}) {
 const [open,setOpen]=useState<string[]>([]);
 const pool=documents.filter(d=>category==='All documents'||d.category===category);
 const rankOf=new Map(result.hits.map((h,i)=>[h.doc.id,i+1]));
 const top=result.hits[0]?.score||1;
 const reasons=[...new Set(result.hits.map(h=>h.reason))];
 const shared=reasons.length===1?reasons[0]:null;
 const grades=example?.grades??{};
 const expected=Object.keys(grades).sort((a,b)=>grades[b]-grades[a]);
 const missed=expected.filter(id=>!rankOf.has(id));
 const keys=expected.filter(id=>grades[id]===2),keysMissed=keys.filter(id=>!rankOf.has(id));
 return <div className="result-content" aria-live="polite">
  <div className={'result-status'+(result.hits.length?'':' empty')}>{result.hits.length?<Check size={15}/>:<AlertTriangle size={15}/>} {result.hits.length} of {pool.length} documents kept</div>
  <div className="corpus-map" role="img" aria-label={`${result.hits.length} of ${pool.length} documents kept`}>{pool.map(d=>{const r=rankOf.get(d.id);return <span key={d.id} title={`${d.id} ${d.title}${r?` · rank ${r}`:missed.includes(d.id)?' · useful, not kept':''}`} className={r?'kept':missed.includes(d.id)?'missed':''} style={{'--cat':categoryColors[d.category]} as React.CSSProperties}>{r&&<b>{r}</b>}</span>})}</div>
  <p className="corpus-caption">Each square is one document. Numbers show the rank of the documents kept{missed.some(id=>pool.some(d=>d.id===id))?'; dashed squares are useful sources it missed':''}.</p>
  <div className="corpus-legend">{Object.entries(categoryColors).filter(([c])=>pool.some(d=>d.category===c)).map(([c,color])=><span key={c}><i style={{background:color}}/>{c}</span>)}</div>
  {example&&(expected.length?<div className={'answer-check'+(keysMissed.length?' partial':' complete')}><strong>{keysMissed.length?<AlertTriangle size={14}/>:<Check size={14}/>}Key sources: {keys.length-keysMissed.length} of {keys.length} found</strong>{keysMissed.some(id=>!pool.some(d=>d.id===id))&&<p>Some key sources are outside {category}. Choose All documents to include them.</p>}<div>{expected.map(id=>{const r=rankOf.get(id);return <button key={id} className={r?'found':'missing'} onClick={()=>onSource(id)}>{r?<Check size={11}/>:null}{id} · {documents.find(d=>d.id===id)!.title}<span>{r?`rank ${r}`:pool.some(d=>d.id===id)?'missed':'outside this knowledge source'}{grades[id]===1?' · supporting':''}</span></button>})}</div></div>
   :<div className="answer-check none"><strong><AlertTriangle size={14}/>No document answers this question</strong><p>These are only the closest matches. A language model given them could still produce a confident, wrong answer.</p></div>)}
  {result.route&&<p className="route-badge">Picked <strong>{routeNames[result.route]??result.route}</strong> because {routeWhy[result.route]}.{result.retried&&' Fewer than two sources came back, so it searched again with Hybrid.'}</p>}
  {result.queries.length>1&&<div className="query-fan" aria-label="Queries searched"><span>Searched {result.queries.length} wordings: your question, plus words from a synonym list</span>{result.queries.map((q,i)=><code key={q}>{i===0?q:<><b>+</b>{q.slice(result.queries[0].length).trim()}</>}</code>)}</div>}
  {shared&&result.hits.length>0&&<p className="ranked-by" title={shared}>{plainReasons[shared]??shared}</p>}
  {result.hits.length?<ol className="hit-list">{result.hits.map((h,i)=>{const expanded=open.includes(h.doc.id);const link=h.reason.match(/from (D\d+)/)?.[1];return <li key={h.doc.id} style={{'--cat':categoryColors[h.doc.category]} as React.CSSProperties}>
   <div className="hit-head"><span className="hit-rank">{i+1}</span><button className="hit-title" onClick={()=>onSource(h.doc.id)}>{h.doc.title}</button><button className="citation" onClick={()=>onSource(h.doc.id)}>{h.doc.id}</button></div>
   <div className="hit-meta"><span className="hit-category">{h.doc.category}</span>{!shared&&(link?<span className="hit-tag linked"><CornerDownRight size={12}/>Linked from {link}</span>:<span className="hit-tag">{i===0&&result.hits.some(x=>x.reason.startsWith('One-hop'))?'Starting point':plainReasons[h.reason]??h.reason}</span>)}{grades[h.doc.id]&&<span className="hit-tag expected"><Check size={11}/>{grades[h.doc.id]===2?'Key source':'Supporting source'}</span>}</div>
   <div className="score-row" title="Score relative to the top result for this approach"><span className="score-bar"><i style={{width:`${Math.max(4,h.score/top*100)}%`}}/></span><span className="hit-score">{h.score.toFixed(3)}</span></div>
   <p className={'hit-passage'+(expanded?' expanded':'')}>{h.doc.text}</p>
   <button className="passage-toggle" aria-expanded={expanded} onClick={()=>setOpen(o=>expanded?o.filter(x=>x!==h.doc.id):[...o,h.doc.id])}>{expanded?'Show less':'Read passage'}</button>
  </li>})}</ol>:<p className="no-match">{category==='All documents'?`None of the ${pool.length} documents shares a word or concept with this question. Try rewording it, or pick an example.`:`Nothing in ${category} matches this question. Choose All documents to search everything.`}</p>}
  {result.hits.length>0&&result.hits.length<topK&&<p className="shortfall"><Info size={13}/>{active==='graph'||(result.route==='graph'&&!result.retried)?`Kept ${result.hits.length}, not ${topK}: Graph only adds documents linked directly to its starting point.`:`Kept ${result.hits.length}, not ${topK}: no other document shares anything with the question.`}</p>}
  <details className="result-steps"><summary>Steps it took ({result.trace.length})</summary><ol className="step-timeline">{result.trace.map((t,i)=><li key={i}>{t}</li>)}</ol></details>
  <p className="evidence-limit"><Info size={13}/><span>Bars compare scores within this approach and are not confidence. Excerpts come from fictional sample documents. Retrieval does not check answerability, conflicts or factual correctness.</span></p>
  <button className="text-button" onClick={onCompare}>Compare all six approaches on this question <ArrowRight size={14}/></button>
 </div>;
}
