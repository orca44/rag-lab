'use client';

import {useEffect, useState, type ReactNode} from 'react';
import {AlertTriangle, ArrowRight, Check, Download, FileText, Gauge, Star, X} from 'lucide-react';
import {documents, patterns} from '@/lib/rag';
import {datasetVersion} from '@/lib/examples';
import {assembleContext, chunkText, evaluationCases, graphEdges, graphNodes, ingestionExamples, ingestionSample, metrics, parseRuns, percentile, queueExperiment, rankedIds, securityGate, traverseGraph, validateCitationIds, type ImportedRun, type Judgment} from '@/lib/labs';

type Step={do:string;see:string};
// Each "see" is checked against lib/labs.ts in tests/labs.test.ts.
const lessons:{name:string;title:string;intro:string;steps:Step[]}[]=[
 {name:'Evaluation',title:'A source count is not a quality score.',intro:'Grade the documents, then see which methods found the useful ones.',steps:[{do:'Look at BM25',see:'0%: its top three are all grade 0'},{do:'Set Top K to 5',see:'Multi-query reaches 100% recall'},{do:'Grade D12 as 1',see:'Reranking rises, Naive drops'}]},
 {name:'Ingestion',title:'Watch a document become context.',intro:'Split a document into chunks, then see which chunks fit in the prompt.',steps:[{do:'Check the prompt bar',see:'The $85 chunk (C3) doesn’t fit'},{do:'Raise the budget to 250',see:'C3 makes it in'},{do:'Load the archived policy',see:'Both versions reach the prompt'}]},
 {name:'Security',title:'A relevant passage can still be unsafe.',intro:'Each filter decides which records may reach the prompt.',steps:[{do:'Switch the tenant to South',see:'Only S2 gets through'},{do:'Turn off tenant scope',see:'South sees North’s rate'},{do:'Turn off cache scoping',see:'The cache serves North’s answer'}]},
 {name:'Graph & tools',title:'Follow the edge. Keep its evidence.',intro:'Trace what depends on chiller CH-1, one tool call at a time.',steps:[{do:'Set hops to 1',see:'Comms room 305 is not reached'},{do:'Set the budget to 1',see:'The run stops early'},{do:'Simulate a failure',see:'The answer is incomplete'}]},
 {name:'Operations',title:'Measure retrieval. Model the queue.',intro:'Time retrieval in your browser, then see when a queue starts to grow.',steps:[{do:'Raise arrivals above 10/s',see:'The queue starts growing'},{do:'Lower the service time',see:'The queue disappears'},{do:'Measure browser retrieval',see:'Far below the simulated service time'}]},
 {name:'Model comparison',title:'Compare real runs without invented results.',intro:'Score every method on the same questions, grades and Top K.',steps:[{do:'Score the local methods',see:'7 methods × 15 questions'},{do:'Compare the bars',see:'Same questions, grades and K'},{do:'Download the kit',see:'Score your own models the same way'}]},
];
const methods=[...patterns.map(p=>({id:p.id,name:p.name})),{id:'bm25' as const,name:'BM25 baseline'}];
const percent=(v:number|null)=>v===null?'N/A':`${(v*100).toFixed(1)}%`;
const mean=(values:number[])=>values.length?values.reduce((s,v)=>s+v,0)/values.length:0;
const gradeNames=['Not useful','Supports it','Answers it'];
function Card({title,className='',children}:{title:string;className?:string;children:ReactNode}) {return <section className={'lab-card '+className}><h3>{title}</h3>{children}</section>;}
function Bar({value,color='green',label}:{value:number|null;color?:string;label?:string}) {return value===null?<span className="bar-na" title={label}>n/a</span>:<span className="lab-bar" title={label}>{label&&<span className="sr-only">{label} </span>}<i className={color} style={{width:`${Math.min(100,Math.max(0,value*100))}%`}}/><span>{percent(value)}</span></span>;}
function Range({label,value,onChange,min,max,step=1}:{label:string;value:number;onChange:(v:number)=>void;min:number;max:number;step?:number}) {return <label className="lab-range">{label}<strong>{value}</strong><input type="range" aria-label={label} min={min} max={max} step={step} value={value} onChange={e=>onChange(Number(e.target.value))}/></label>;}
function Notes({children}:{children:ReactNode}) {return <details className="lab-notes"><summary>Notes</summary><div>{children}</div></details>;}

export default function Labs({onSource,initialLesson=0}:{onSource:(id:string)=>void;initialLesson?:number}) {
 const [active,setActive]=useState(initialLesson),[done,setDone]=useState<number[]>([]),[storage,setStorage]=useState('Loading progress…');
 useEffect(()=>{try{const saved:unknown=JSON.parse(localStorage.getItem('rag-lab-progress-v1')??'[]');if(Array.isArray(saved))setDone([...new Set(saved.filter((v):v is number=>Number.isInteger(v)&&v>=0&&v<lessons.length))]);setStorage('Saved on this browser only.');}catch{setStorage('Progress lasts for this visit.');}},[]);
 function save(next:number[]){setDone(next);try{localStorage.setItem('rag-lab-progress-v1',JSON.stringify(next));setStorage('Saved on this browser only.');}catch{setStorage('Progress lasts for this visit.');}}
 const lesson=lessons[active];
 return <section className="labs">
  <div className="lab-tabs" role="group" aria-label="Learning labs">{lessons.map(({name},i)=><button key={name} aria-label={name} aria-pressed={active===i} className={done.includes(i)?'done':''} onClick={()=>setActive(i)}><span className="lab-tab-num" aria-hidden="true">{done.includes(i)?<Check size={11}/>:i+1}</span><span>{name}</span></button>)}</div>
  <div className="lab-progress"><progress aria-label="Learning progress" value={done.length} max={lessons.length}/><span>{done.length} of {lessons.length} complete</span></div>
  <div className="lab-body" key={active}>
   <header className="lab-intro"><span className="visual-kicker">EXPERIMENT 0{active+1}</span><h2>{lesson.title}</h2><p>{lesson.intro}</p></header>
   <ol className="lab-try" aria-label="Try this">{lesson.steps.map((s,i)=><li key={s.do}><b>{i+1}</b><div><strong>{s.do}</strong><span>{s.see}</span></div></li>)}</ol>
   {active===0?<Evaluation onSource={onSource}/>:active===1?<Ingestion/>:active===2?<Security/>:active===3?<Graph onSource={onSource}/>:active===4?<Operations/>:<Models/>}
  </div>
  <div className="lab-completion"><button className="primary" onClick={()=>save(done.includes(active)?done.filter(n=>n!==active):[...done,active])}>{done.includes(active)?'Mark as unfinished':'Mark lesson complete'}<Check size={15}/></button>{active<lessons.length-1&&<button className="lab-next" onClick={()=>{setActive(active+1);document.querySelector('.lab-tabs')?.scrollIntoView({behavior:'smooth',block:'start'});}}>Next: {lessons[active+1].name}<ArrowRight size={14}/></button>}<p role="status">{storage}</p><button className="text-button" onClick={()=>save([])}>Reset progress</button></div>
 </section>;
}

function Evaluation({onSource}:{onSource:(id:string)=>void}) {
 const [caseId,setCaseId]=useState('notice'),[k,setK]=useState(3),[labels,setLabels]=useState<Record<string,Judgment>>({}),[guesses,setGuesses]=useState<Record<number,string>>({});
 const current=evaluationCases.find(c=>c.id===caseId)!;const grades=labels[caseId]??current.grades;
 const answerable=Object.values(grades).some(g=>g>0);
 const exercises:{claim:string;source:string;verdict:string;answer:'Supported'|'Unsupported'|'Needs qualification'}[]=[{claim:'After-hours cooling costs $85 per floor per hour. [D02]',source:'D02: After-hours heating and cooling is billed at $85 per floor per hour, with a two-hour minimum.',verdict:'Supported by this fictional passage.',answer:'Supported'},{claim:'Canceled bookings are refunded. [D02]',source:'D02 covers hourly rates, monthly statements and billing disputes.',verdict:'Unsupported: the citation never mentions cancellations or refunds.',answer:'Unsupported'},{claim:'Anyone can book after-hours cooling one day ahead.',source:'Archived 2024 version: three business days. Current version: tenants book at least one business day ahead. D11: subtenants book through the head tenant.',verdict:'Needs qualification: use the current version and preserve who can book. Subtenants cannot request directly, and the rule is business days.',answer:'Needs qualification'}];
 return <>
  <div className="lab-controls"><label>Evaluation question<select value={caseId} onChange={e=>setCaseId(e.target.value)}>{evaluationCases.map(c=><option key={c.id} value={c.id}>{c.question}</option>)}</select></label><Range label="Evaluation Top K" min={1} max={5} value={k} onChange={setK}/></div>
  <div className="lab-grid eval-grid">
   <Card title="Which methods found the useful documents?">
    <div className="grade-legend" aria-hidden="true">{[2,1,0].map(g=><span key={g}><i className={`g${g}`}/>{gradeNames[g]}</span>)}</div>
    {!answerable&&<p className="lab-alert">No document is graded useful for this question, so recall and nDCG do not apply. Missing grades alone do not establish that a question is unanswerable.</p>}
    <div className="score-table">
     <div className="score-key" aria-hidden="true"><span><i/>Recall</span><span><i className="blue"/>nDCG</span></div><div className="score-head" aria-hidden="true"><span>Method</span><span>Top {k}</span><span>Recall</span><span>nDCG</span></div>
     {methods.map(m=>{const ids=rankedIds(m.id,current.question,k);const score=metrics(ids,grades,k);return <div className="lab-score" key={m.id}><strong>{m.name}</strong><span className="rank-tiles">{ids.map((id,i)=>{const g=grades[id]??0;return <button key={id} className={`g${g}`} aria-label={`Rank ${i+1}, ${id}, ${gradeNames[g]}`} title={`${i+1}. ${id} ${documents.find(d=>d.id===id)?.title} · ${gradeNames[g]}`} onClick={()=>onSource(id)}>{id}</button>;})}{!ids.length&&<em>none</em>}</span><Bar value={score.recall} label="Recall"/><Bar value={score.ndcg} color="blue" label="nDCG"/></div>;})}
    </div>
   </Card>
   <Card title="Your grades">
    <p className="lab-hint">Click a tile to change its grade. The page icon opens the document.</p>
    <div className="judge-grid">{documents.map(d=>{const g=grades[d.id]??0;return <div key={d.id} className={`judge-tile g${g}`}><button className="judge-grade" aria-label={`Relevance of ${d.id}`} data-grade={g} title={`${d.title}: ${gradeNames[g]}. Click to change.`} onClick={()=>setLabels({...labels,[caseId]:{...grades,[d.id]:(g+1)%3}})}><strong>{d.id}</strong><span>{g}</span></button><button className="judge-open" aria-label={`${d.id} · ${d.title}`} title={d.title} onClick={()=>onSource(d.id)}><FileText size={12}/></button></div>;})}</div>
    <button className="text-button" onClick={()=>setLabels({...labels,[caseId]:current.grades})}>Restore suggested grades</button>
    <details key={current.id}><summary>Reference answer</summary><p>{current.answer}</p><p>{current.rationale}</p></details>
   </Card>
  </div>
  <Card title="Does the citation support the claim?"><div className="lab-exercises">{exercises.map((e,i)=><article key={e.claim}><h4>{e.claim}</h4><blockquote>{e.source}</blockquote><div className="lab-guess" role="group" aria-label={`Verdict for case ${i+1}`}>{(['Supported','Unsupported','Needs qualification'] as const).map(g=><button key={g} aria-pressed={guesses[i]===g} className={guesses[i]?(g===e.answer?'right':guesses[i]===g?'wrong':''):''} onClick={()=>setGuesses({...guesses,[i]:g})}>{g}</button>)}</div>{guesses[i]&&<p role="status" className={e.answer==='Supported'?'lab-verdict':'lab-alert'}><strong>{guesses[i]===e.answer?'Correct. ':'Not quite. '}</strong>{e.verdict}</p>}</article>)}</div></Card>
  <Notes><p>These {evaluationCases.length} cases and suggested grades are AI-authored examples, not independent human judgments or a representative benchmark. Your grade changes last until you leave this lesson.</p><p>Recall@K = retrieved relevant passages / all relevant passages. DCG@K = Σ (2^grade − 1) / log₂(rank + 1), using one-based ranks. nDCG = DCG / ideal DCG. The ideal list sorts grades for all {documents.length} documents. Questions with no positive grades have undefined recall and nDCG; they are not scored as perfect.</p><p>Retrieval relevance, citation support and answerability are separate checks. The citation cases are authored examples; no automated checker runs here.</p></Notes>
 </>;
}

function Ingestion() {
 const [sample,setSample]=useState(ingestionExamples[0]),[raw,setRaw]=useState(ingestionSample),[size,setSize]=useState(24),[overlap,setOverlap]=useState(6),[budget,setBudget]=useState(180),[version,setVersion]=useState('v2'),[error,setError]=useState('');
 const chunks=chunkText(raw,size,Math.min(overlap,size-1));const [question,setQuestion]=useState(sample.question);const context=assembleContext(chunks,budget,question,version);
 const phrase=raw===sample.text&&question===sample.question?sample.answer:null;const flat=raw.replace(/^#+\s*/gm,'').split(/\s+/).join(' ');
 const answerIn=phrase?chunks.filter(c=>c.text.includes(phrase)).map(c=>c.id):[];const answerKept=answerIn.filter(id=>context.included.includes(id));
 const total=chunks.at(-1)?.end||1;const scale=Math.max(budget,context.used);
 return <>
  <div className="lab-grid ingest-grid">
   <Card title="Settings">
    <label className="lab-label">Ingestion example<select value={sample.id} onChange={e=>{const next=ingestionExamples.find(x=>x.id===e.target.value)!;setSample(next);setRaw(next.text);setQuestion(next.question);setError('');}}>{ingestionExamples.map(x=><option key={x.id} value={x.id}>{x.label}</option>)}</select></label>
    <Range label="Chunk size (words)" min={12} max={48} value={size} onChange={v=>{setSize(v);setOverlap(Math.min(overlap,v-1));}}/>
    <Range label="Overlap (words)" min={0} max={size-1} value={overlap} onChange={setOverlap}/>
    <Range label="Prompt budget (estimated tokens)" min={60} max={500} step={10} value={budget} onChange={setBudget}/>
    <label className="lab-label">Document version<select value={version} onChange={e=>setVersion(e.target.value)}><option value="v2">v2 · current</option><option value="v1">v1 · superseded</option></select></label>
    <label className="lab-label">Context question<input value={question} maxLength={500} onChange={e=>setQuestion(e.target.value)}/></label>
    <details className="lab-source"><summary>Edit or load source text</summary><label className="lab-label">Source text<textarea aria-label="Source text" maxLength={12000} value={raw} onChange={e=>setRaw(e.target.value)}/></label><label className="lab-upload">Load a public .txt or .md file<input type="file" accept=".txt,.md,text/plain,text/markdown" onChange={async e=>{const file=e.target.files?.[0];if(!file)return;if(file.size>12000||!(/\.(txt|md)$/i.test(file.name))){setError('Use a .txt or .md file no larger than 12 KB.');return;}try{setRaw(await file.text());setError('');}catch{setError('Could not read this file.');}}}/></label></details>
    {error&&<p role="alert" className="lab-alert">{error}</p>}
   </Card>
   <div className="lab-stack">
    <Card title="Chunks">
     <div className="lab-stat-grid"><div><strong>{chunks.length}</strong><span>chunks</span></div><div><strong>{chunks.reduce((s,c)=>s+c.end-c.start,0)}</strong><span>words stored, with repeats</span></div></div>
     <div className="chunk-map" aria-label="Chunk boundary diagram">{chunks.map(c=>{const kept=context.included.includes(c.id);return <div key={c.id} className={kept?'kept':'omitted'}><span>{c.id}</span><div><i style={{marginLeft:`${100*c.start/total}%`,width:`${100*(c.end-c.start)/total}%`}}/></div><small>{answerIn.includes(c.id)&&<Star size={11} aria-label="Has the answer"/>}{kept?<Check size={12} aria-label="In the prompt"/>:<X size={12} aria-label="Did not fit"/>}</small></div>;})}</div>
     <div className="chunk-legend" aria-hidden="true"><span><i className="kept"/>In the prompt</span><span><i className="omitted"/>Didn’t fit</span>{answerIn.length>0&&<span><Star size={11}/>Has the answer</span>}</div>
     <details><summary>Read the chunks</summary><div className="lab-chunk-list">{chunks.map((c,i)=>{const shared=i?Math.max(0,chunks[i-1].end-c.start):0;const words=c.text.split(' ');return <article key={c.id} className={answerIn.includes(c.id)?'answer':''}><strong>{c.id}</strong><p>{shared>0&&<mark title="Also in the previous chunk">{words.slice(0,shared).join(' ')}</mark>} {words.slice(shared).join(' ')}</p></article>;})}</div></details>
    </Card>
    <Card title="Prompt budget">
     <div className="prompt-bar" role="img" aria-label={`${context.used} of ${budget} estimated tokens used. In the prompt: ${context.included.join(', ')||'none'}. Did not fit: ${context.excluded.join(', ')||'none'}.`}>
      <span className="seg base" style={{width:`${100*Math.min(context.baseTokens,scale)/scale}%`}}>Q</span>
      {context.parts.filter(p=>p.included).map(p=><span key={p.id} className={'seg chunk'+(answerIn.includes(p.id)?' answer':'')} style={{width:`${100*p.tokens/scale}%`}}>{p.id}</span>)}
     </div>
     <div className="prompt-scale"><span>{context.used} / {budget} estimated tokens</span>{context.excluded.length>0&&<span className="didnt-fit">Didn’t fit: {context.parts.filter(p=>!p.included).map(p=><b key={p.id} className={answerIn.includes(p.id)?'answer':''}>{answerIn.includes(p.id)&&<Star size={10}/>}{p.id}</b>)}</span>}</div>
     {phrase&&flat.includes(phrase)&&(!answerIn.length?<p className="lab-alert lab-answer"><AlertTriangle size={14}/>The answer (“{phrase}”) is split across a chunk boundary. Add overlap.</p>:answerKept.length?<p className="lab-verdict lab-answer"><Check size={14}/>The chunk with the answer (“{phrase}”) is in the prompt.</p>:<p className="lab-alert lab-answer"><AlertTriangle size={14}/>The chunk with the answer (“{phrase}”) was omitted. The prompt cannot answer the question.</p>)}
     {version==='v1'&&<p className="lab-alert">A superseded version still enters context unless you enforce a freshness policy. Metadata alone changes nothing.</p>}
     {context.baseTooLarge&&<p role="alert" className="lab-alert">Instructions and question already exceed the budget.</p>}
     <details><summary>Show the full prompt</summary><pre className="lab-code">{context.prompt}</pre></details>
    </Card>
   </div>
  </div>
  <Notes><p>Source text is read locally and discarded when you leave this lesson. The parser only removes Markdown heading markers and normalizes whitespace: no PDF, OCR, table extraction or upload service.</p><p>Chunks are packed greedily in source order, whole chunks only, so a later small chunk can fit where an earlier large one did not. Retrieval ranking and version filtering do not run here. Version is user-supplied metadata, not inferred from the text.</p><p>Token estimate = ceil(characters / 4), counting instructions, question and chunk labels. This is not a tokenizer or a model context limit, and no output allowance is included.</p></Notes>
 </>;
}

function Security() {
 const [tenant,setTenant]=useState('North'),[scope,setScope]=useState(true),[fresh,setFresh]=useState(true),[quarantine,setQuarantine]=useState(true),[cacheSafe,setCacheSafe]=useState(true),[epoch,setEpoch]=useState(2),[citation,setCitation]=useState('S1');
 const rows=securityGate(tenant,{scope,fresh,quarantine});const allowed=rows.filter(r=>!r.reason).map(r=>r.doc.id);
 type SecurityDoc=typeof rows[number]['doc'];
 const checks=[{label:'Tenant',on:scope,ok:(d:SecurityDoc)=>d.tenant===tenant},{label:'Current',on:fresh,ok:(d:SecurityDoc)=>!d.deleted&&d.version===2},{label:'Safe',on:quarantine,ok:(d:SecurityDoc)=>d.id!=='S5'}];
 const cacheHit=!cacheSafe||(tenant==='North'&&epoch===2);const leaks=[...(tenant!=='North'?[`${tenant} receives North’s answer`]:[]),...(epoch>2?['the revision-2 answer survives the corpus change']:[])];
 const cacheMessage=!cacheHit?'Cache MISS: recompute using current authorized records.':cacheSafe?'Cache HIT: same tenant and revision, so reuse is safe.':leaks.length?`Cache HIT: ${leaks.join(', and ')}.`:'Cache HIT: correct for now, but the key ignores tenant and revision.';
 const valid=validateCitationIds([citation],allowed);
 return <>
  <div className="lab-grid security-grid">
   <Card title="Filters">
    <label className="lab-label">Requesting tenant<select value={tenant} onChange={e=>setTenant(e.target.value)}><option>North</option><option>South</option></select></label>
    {[{label:'Enforce tenant scope',value:scope,set:setScope},{label:'Exclude deleted and superseded records',value:fresh,set:setFresh},{label:'Quarantine the known malicious sample',value:quarantine,set:setQuarantine},{label:'Scope cache by tenant and corpus revision',value:cacheSafe,set:setCacheSafe}].map(c=><label className="lab-toggle" key={c.label}><input type="checkbox" checked={c.value} onChange={e=>c.set(e.target.checked)}/>{c.label}</label>)}
   </Card>
   <Card title="Evidence gate">
    <p className="gate-summary"><strong>{allowed.length} of {rows.length}</strong> records reach the prompt for {tenant}</p>
    <div className="lab-table-wrap"><table className="security-gates"><thead><tr><th>Record</th>{checks.map(c=><th key={c.label} className={c.on?'':'off'}>{c.label}</th>)}<th>Prompt</th></tr></thead>
     <tbody>{rows.map(({doc,reason})=><tr key={doc.id} className={reason?'blocked':'passed'}><th><strong>{doc.id}</strong> <small>{doc.tenant} · v{doc.version}{doc.deleted?' · deleted':''}</small><span>{doc.text}</span></th>{checks.map(c=>{const ok=c.ok(doc);return <td key={c.label} className={!c.on?'off':ok?'ok':'fail'}>{!c.on?<span aria-label="Filter off">–</span>:ok?<Check size={14} aria-label="Passes"/>:<X size={14} aria-label="Fails"/>}</td>;})}<td><span className={reason?'gate-pill blocked':'gate-pill'}>{reason?'Blocked':'Passed'}</span></td></tr>)}</tbody></table></div>
   </Card>
  </div>
  <div className="lab-grid">
   <Card title="Cached answers">
    <div className="cache-keys">{[{label:'Cached',tenant:'North',rev:2},{label:'Requested',tenant,rev:epoch}].map((key,i)=><div key={key.label}><span>{key.label}</span><div><b className={!cacheSafe?'ignored':i&&key.tenant!=='North'?'diff':''}>{key.tenant}</b><b className={!cacheSafe?'ignored':i&&key.rev!==2?'diff':''}>rev {key.rev}</b><b>after-hours rate</b></div></div>)}</div>
    <button className="lab-button" onClick={()=>setEpoch(epoch+1)}>Advance corpus revision</button>
    <p className={cacheHit&&!cacheSafe?'lab-alert':'lab-verdict'} role="status">{cacheMessage}</p>
   </Card>
   <Card title="Check a citation">
    <label className="lab-label">Proposed citation<select value={citation} onChange={e=>setCitation(e.target.value)}><option>S1</option><option>S2</option><option>S5</option><option>S99</option></select></label>
    <p className={valid?'lab-verdict':'lab-alert'} role="status">{valid?'Reference allowed by the current gate.':'Rejected: reference is absent from the allowed evidence.'}</p>
   </Card>
  </div>
  <Notes><p>These are local filters over public, fictional records, not authentication or server-enforced authorization. The app has no private document store.</p><p>The quarantine blocks sample record S5 by its ID. It is not a general prompt-injection detector: retrieved instructions remain untrusted data, and detection alone cannot establish safety.</p><p>In production, bind caches to authenticated identity and permissions, then propagate updates and deletions to indexes, derived summaries and caches. The citation check tests ID membership only; it does not establish that a claim follows from a passage.</p></Notes>
 </>;
}

function Graph({onSource}:{onSource:(id:string)=>void}) {
 const [hops,setHops]=useState(2),[budget,setBudget]=useState(2),[fail,setFail]=useState(false),[mode,setMode]=useState<'workflow'|'adaptive'>('workflow');
 const run=traverseGraph(hops,budget,fail,mode);const positions:Record<string,[number,number]>={'CH-1':[80,160],'AHU-7':[290,70],'AHU-8':[290,160],'Plant team':[290,250],'Mechanical team':[505,70],'Comms room 305':[505,200]};
 const stopped=/escalate/.test(run.stop);
 return <>
  <div className="lab-grid graph-grid">
   <Card title="What depends on CH-1?">
    <svg className="lab-graph" viewBox="0 0 600 300" role="img" aria-label={`Directed graph. Reached: ${run.visited.join(', ')}.`}><defs><marker id="lab-arrow" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto"><path d="M0,0 L6,3 L0,6" fill="#7f9c90"/></marker></defs>
     {graphEdges.map(e=>{const a=positions[e.from],b=positions[e.to];const on=run.visited.includes(e.from)&&run.visited.includes(e.to);return <g key={e.from+e.to}><line x1={a[0]+52} y1={a[1]} x2={b[0]-56} y2={b[1]} className={on?'edge on':'edge'} markerEnd="url(#lab-arrow)"/><text x={a[0]+52+(b[0]-56-a[0]-52)*.55} y={a[1]+(b[1]-a[1])*.55-6} textAnchor="middle" className="edge-label">{edgeLabels[e.type]??e.type}</text></g>;})}
     {graphNodes.map(n=><g key={n} className={n==='CH-1'?'node start':run.visited.includes(n)?'node on':'node'}><rect x={positions[n][0]-52} y={positions[n][1]-22} width="104" height="44" rx="10"/><text x={positions[n][0]} y={positions[n][1]+5} textAnchor="middle">{n}</text></g>)}
    </svg>
    <div className="chunk-legend" aria-hidden="true"><span><i className="start"/>Start</span><span><i className="kept"/>Reached</span><span><i className="omitted"/>Not reached</span></div>
    <details><summary>Evidence for each edge ({graphEdges.length})</summary>{graphEdges.map(e=><div className="lab-edge" key={e.from+e.to}><strong>{e.from} → {e.to}</strong><button onClick={()=>onSource(e.source)}>{e.source}: {e.evidence}</button></div>)}</details>
   </Card>
   <Card title="Tool calls">
    <label className="lab-label">Traversal strategy<select value={mode} onChange={e=>setMode(e.target.value as typeof mode)}><option value="workflow">Fixed breadth-first workflow</option><option value="adaptive">Rule-directed: expand only non-leaf nodes</option></select></label>
    <Range label="Maximum graph hops" min={1} max={3} value={hops} onChange={setHops}/>
    <Range label="Tool call budget" min={1} max={3} value={budget} onChange={setBudget}/>
    <label className="lab-toggle"><input type="checkbox" checked={fail} onChange={e=>setFail(e.target.checked)}/>Simulate failure on the second call</label>
    <div className="budget-dots" role="img" aria-label={`${run.calls} of ${budget} calls used`}>{Array.from({length:budget},(_,i)=><i key={i} className={i<run.calls?'used':''}/>)}<span>{run.calls} of {budget} calls used</span></div>
    <ol className="lab-trace">{run.trace.map(t=><li key={t.step} className={t.result.startsWith('Simulated')?'failed':''}><code>{t.tool}</code><p>{t.result}</p></li>)}</ol>
    <p className={stopped?'lab-alert':'lab-verdict'} role="status">{run.stop}</p>
   </Card>
  </div>
  <Notes><p>Each call looks up outgoing neighbors in the bundled graph. Fixed rules choose what to expand; neither strategy is an LLM agent. Budgets cap calls, including failures, and no building API is contacted.</p><p>“Owned by” and “maintained by” are not outage edges: following them adds who to call, not what is affected.</p><p>A pre-written summary of the same plant reads: CH-1 supplies chilled water to AHU-7 and AHU-8 [D08]. The plant team owns CH-1 [D08]; the mechanical team maintains AHU-7 [D07]. During a CH-1 trip, call the plant team first and notify the tenant help desk [D09]. AHU-7’s chilled-water branch also cools comms room 305 [D21]. It was written in advance from the cited sources; no community detection runs here, and community-summary Graph RAG systems generate their reports differently.</p></Notes>
 </>;
}

const edgeLabels:Record<string,string>={'supplies chilled water to':'chilled water'};

type Timing={name:string;p50:number;p95:number;count:number};
function Operations() {
 const [timings,setTimings]=useState<Timing[]>([]),[busy,setBusy]=useState(false),[qps,setQps]=useState(8),[service,setService]=useState(100),[timingError,setTimingError]=useState('');
 const queue=queueExperiment(qps,service),max=Math.max(...queue.map(r=>r.total));const over=qps*service>1000;const slowest=Math.max(...timings.map(t=>t.p95),0)||1;
 async function measure(){setBusy(true);setTimingError('');try{const results:Timing[]=[];for(const m of methods){await new Promise<void>(resolve=>setTimeout(resolve,0));for(let i=0;i<20;i++)rankedIds(m.id,evaluationCases[i%evaluationCases.length].question,3);const samples:number[]=[];for(let i=0;i<120;i++){const start=performance.now();rankedIds(m.id,evaluationCases[i%evaluationCases.length].question,3);samples.push(performance.now()-start);}results.push({name:m.name,p50:percentile(samples,.5),p95:percentile(samples,.95),count:samples.length});}setTimings(results);}catch{setTimingError('Measurement failed. Try again in an active browser tab.');}finally{setBusy(false);}}
 return <>
  <div className="lab-grid">
   <Card title="Retrieval time in this browser">
    <button className="primary" disabled={busy} onClick={measure}>{busy?'Measuring…':'Measure browser retrieval'}</button>
    {timingError&&<p role="alert" className="lab-alert">{timingError}</p>}
    {timings.length>0?<><div className="timing-bars">{timings.map(t=><div key={t.name}><span>{t.name}</span><span className="timing-track" title={`p50 ${t.p50.toFixed(3)} ms · p95 ${t.p95.toFixed(3)} ms`}><i style={{width:`${100*t.p50/slowest}%`}}/><b style={{left:`${100*t.p95/slowest}%`}}/></span><small>{t.p50.toFixed(3)} / {t.p95.toFixed(3)} ms</small></div>)}</div><div className="chunk-legend" aria-hidden="true"><span><i className="kept"/>Median (p50)</span><span><i className="marker"/>p95</span></div></>:<div className="lab-empty">Run the measurement to see a bar for each method.</div>}
   </Card>
   <Card title="When does a queue grow?">
    <Range label="Arrivals per second" min={1} max={30} value={qps} onChange={setQps}/>
    <Range label="Service time (milliseconds)" min={20} max={300} step={10} value={service} onChange={setService}/>
    <div className="lab-stat-grid"><div><strong>{(1000/service).toFixed(1)}/s</strong><span>one worker can finish</span></div><div className={over?'warn':''}><strong>{queue.at(-1)!.wait.toFixed(0)} ms</strong><span>wait for request 40</span></div></div>
    <p className={over?'lab-alert':'lab-verdict'} role="status">{over?`Over capacity: ${qps} arrive each second, ${(1000/service).toFixed(1)} finish.`:'Below capacity: nobody waits.'}</p>
    <svg className={'lab-queue'+(over?' over':'')} viewBox="0 0 480 185" role="img" aria-label={`Simulated end-to-end latency for 40 requests; last request ${queue.at(-1)!.total.toFixed(0)} milliseconds.`}><line x1="35" y1="150" x2="468" y2="150" stroke="#84968c"/><text x="5" y="18" fontSize="12">{max.toFixed(0)} ms</text><text x="35" y="175" fontSize="12">Request 1</text><text x="393" y="175" fontSize="12">Request 40</text><polyline fill="none" strokeWidth="3" points={queue.map((r,i)=>`${35+i*11},${150-r.total/max*120}`).join(' ')}/></svg>
    <details><summary>All 40 requests</summary><div className="lab-table-wrap"><table><thead><tr><th>Request</th><th>Wait ms</th><th>Total ms</th></tr></thead><tbody>{queue.map(r=><tr key={r.request}><td>{r.request}</td><td>{r.wait.toFixed(1)}</td><td>{r.total.toFixed(1)}</td></tr>)}</tbody></table></div></details>
   </Card>
  </div>
  <Notes><p>Each method gets 20 warm-up calls, then 120 timed calls cycling through {evaluationCases.length} questions at K = 3. This includes retrieval work but excludes rendering, network and generation; timer precision and device load affect results.</p><p>The queue is a deterministic simulation: 40 evenly spaced arrivals, one worker, fixed service time, first in first out, no retries or network. The line shows wait plus service. A finite run does not predict steady-state or tail latency under real traffic.</p><p>Before deployment, run representative traffic against the actual service and record throughput, errors, queue wait and end-to-end percentiles at each load, including cold caches and provider quotas.</p></Notes>
 </>;
}

function Models() {
 const [runs,setRuns]=useState<ImportedRun[]>([]),[localRuns,setLocalRuns]=useState<ImportedRun[]>([]),[error,setError]=useState('');
 const rows=[...localRuns,...runs];
 function scoreLocal(){setLocalRuns(methods.map(m=>({name:m.name,kind:'local retrieval',model:'Built into this app',environment:'This browser · retrieval only · one timed call per question',measuredAt:new Date().toISOString(),dataset:datasetVersion,topK:3,results:evaluationCases.map(c=>{const start=performance.now();const ids=rankedIds(m.id,c.question,3);return {caseId:c.id,ids,latencyMs:performance.now()-start,inputTokens:0,outputTokens:0,costUsd:0,answer:''};})})));}
 function download(){const blob=new Blob([JSON.stringify({dataset:datasetVersion,documents,cases:evaluationCases,schema:{name:'Your measured run',kind:'embeddings | reranker | llm | bm25',model:'Exact model and revision',environment:'Hardware, runtime and measurement boundaries',measuredAt:'ISO timestamp',dataset:datasetVersion,topK:3,results:evaluationCases.map(c=>({caseId:c.id,ids:[],latencyMs:'Measured milliseconds',inputTokens:'Measured integer',outputTokens:'Measured integer',costUsd:'Reported USD',answer:'Actual answer or empty string for retrieval-only runs'}))}},null,2)],{type:'application/json'});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download='rag-lab-evaluation-kit.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
 const scored=rows.map(r=>{const scores=r.results.map(x=>metrics(x.ids,evaluationCases.find(c=>c.id===x.caseId)!.grades,r.topK));return {r,local:r.kind==='local retrieval',recall:mean(scores.flatMap(s=>s.recall===null?[]:[s.recall])),ndcg:mean(scores.flatMap(s=>s.ndcg===null?[]:[s.ndcg]))};});
 return <>
  <Card title="Run the comparison">
   <div className="lab-actions"><button className="primary" onClick={scoreLocal}>Score the local methods <Gauge size={15}/></button><button className="lab-button" onClick={download}>Download evaluation kit <Download size={15}/></button></div>
   <label className="lab-upload">Import measured runs (.json, up to 256 KB)<input type="file" accept=".json,application/json" onChange={async e=>{const file=e.target.files?.[0];if(!file)return;try{if(file.size>262144)throw new Error('Keep the file under 256 KB.');const parsed=parseRuns(await file.text());setRuns(parsed);setError('');}catch(err){setError(err instanceof Error?err.message:'Unable to read file.');setRuns([]);}}}/></label>
   {error&&<p role="alert" className="lab-alert">{error}</p>}
  </Card>
  {rows.length===0?<div className="lab-empty">Score the local methods, or import measured runs, to see the comparison.</div>:<Card title="Results">
   <div className="lab-table-wrap"><table className="model-table"><caption>Quality uses the kit’s suggested grades. {localRuns.length>0&&'Local rows use no model. '}{runs.length>0&&'Imported rows are user-reported.'}</caption><thead><tr><th>Method</th><th>Recall@K</th><th>nDCG@K</th><th>p50 / p95 ms</th><th>Tokens in / out</th><th>Cost</th></tr></thead><tbody>{scored.map(({r,local,recall,ndcg},i)=><tr key={i}><th>{r.name}<small>{r.model} · K={r.topK}</small></th><td><Bar value={recall}/></td><td><Bar value={ndcg} color="blue"/></td><td>{percentile(r.results.map(x=>x.latencyMs),.5).toFixed(local?3:1)} / {percentile(r.results.map(x=>x.latencyMs),.95).toFixed(local?3:1)}</td><td>{local?'—':`${r.results.reduce((s,x)=>s+x.inputTokens,0)} / ${r.results.reduce((s,x)=>s+x.outputTokens,0)}`}</td><td>{local?'—':`$${r.results.reduce((s,x)=>s+x.costUsd,0).toFixed(6)}`}</td></tr>)}</tbody></table></div>
   {runs.map((r,i)=><details key={i} className="run-answers"><summary>{r.name}: answers and retrieved IDs</summary><p>{r.kind} · {r.measuredAt} · {r.environment}</p>{r.results.map(result=><details key={result.caseId}><summary>{result.caseId} · {result.ids.join(', ')||'no retrieved IDs'}</summary><p>{evaluationCases.find(c=>c.id===result.caseId)!.question}</p><pre className="lab-code">{result.answer||'Retrieval-only result: no generated answer supplied.'}</pre></details>)}</details>)}
  </Card>}
  <Notes><p>BM25 and the six approaches run locally. Learned encoders, trained rerankers and LLMs are not bundled or called, and no API keys are requested. Imported measurements are user-reported and cannot be verified by this app; it scores retrieval, not factual correctness or citation support in imported answers.</p><p>Averages use the {evaluationCases.filter(c=>Object.values(c.grades).some(g=>g>0)).length} questions with positive grades only. {evaluationCases.length} timing samples are too few for a stable tail-latency estimate. Tokens and costs are sums, not averages.</p><p>Import contract: an array of 1–8 runs, each with name, kind (bm25, embeddings, reranker or llm), exact model, environment, measuredAt, dataset “{datasetVersion}”, topK (1–5) and exactly {evaluationCases.length} results, one per case ID. Each result has caseId, ranked ids, latencyMs, inputTokens, outputTokens, costUsd and answer. Use the same K and measurement boundaries across runs.</p><p>Local BM25: for each unique query term, sum IDF × tf(k₁ + 1) / (tf + k₁(1 − b + b × length / averageLength)), with k₁ = 1.2, b = 0.75 and IDF = ln(1 + (N − df + 0.5) / (df + 0.5)). Lowercase letter and number tokens; no stop words or stemming. It follows Lucene’s formula but is not Lucene.</p></Notes>
 </>;
}
