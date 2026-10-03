'use client';

import {useState} from 'react';
import {Activity, AlertTriangle, ArrowRight, Building2, Check, FileInput, FileText, Gauge, Network, ShieldCheck, Upload} from 'lucide-react';
import {patterns, type RagId} from '@/lib/rag';
import './enterprise.css';
import {CapacityChart} from './visuals';
import {scenarios, choices} from '@/lib/building-scenarios';
import {examples} from '@/lib/examples';
import {approachIcons} from './approach-icons';

function Flow({title,steps}:{title:string;steps:string[]}) {
 return <div className="enterprise-flow"><h3>{title}</h3><ol>{steps.map((step,i)=><li key={step}><span className="flow-number">{i+1}</span><span>{step}</span></li>)}</ol></div>;
}

// The typical question and what each pattern adds, for the cheat sheet. Order follows `patterns`.
const cheatSheet:Record<RagId,{question:string;adds:string}>={
 naive:{question:'How do I request after-hours cooling?',adds:'Finds one current handbook passage.'},
 hybrid:{question:'What does F-17 mean on this model?',adds:'Matches exact codes and symptom wording.'},
 rerank:{question:'Which of these procedures fits AHU-7?',adds:'Puts the applicable procedure first.'},
 multi:{question:'What records explain overnight energy use?',adds:'Searches baseload, overrides and out-of-hours operation.'},
 graph:{question:'Which rooms are downstream of AHU-7?',adds:'Follows equipment and room connections.'},
 agentic:{question:'Why is Room 301 hot right now?',adds:'Combines live readings, work orders and procedures.'},
};

const checklist=[
 {icon:Gauge,title:'Evaluate before adding complexity',text:'Score a held-out question set for recall, ranking, citation support and abstention.',lab:0,labName:'Evaluation'},
 {icon:FileInput,title:'Version every source',text:'Carry building, revision and access rules with each passage, and propagate deletions.',lab:1,labName:'Ingestion'},
 {icon:ShieldCheck,title:'Filter before the model sees it',text:'Apply permissions before evidence reaches a reranker, model, cache or user.',lab:2,labName:'Security'},
 {icon:Network,title:'Bound graph and tool calls',text:'Cap hops and tool calls; escalate when evidence is incomplete.',lab:3,labName:'Graph & tools'},
 {icon:Activity,title:'Load-test the real service',text:'Measure throughput, queue wait and p95 latency at each load.',lab:4,labName:'Operations'},
 {icon:Upload,title:'Compare models on the same set',text:'Same questions, grades and Top K, so differences mean something.',lab:5,labName:'Model comparison'},
];

export default function Enterprise({onExplore,onKnowledge,onLab,onScenario,initialScenario=0}:{onExplore:(id:RagId)=>void;onKnowledge:()=>void;onLab:(lesson:number)=>void;onScenario:(index:number)=>void;initialScenario?:number}) {
 const [scenario,setLocalScenario]=useState(initialScenario);
 // Remember the scenario in the page so returning from a lab keeps your place.
 const setScenario=(i:number)=>{setLocalScenario(i);onScenario(i);};
 const [qps,setQps]=useState(20);
 const [variants,setVariants]=useState(1);
 const [cache,setCache]=useState(20);
 const current=scenarios[scenario];
 const choice=choices.find(c=>c.id===current.pattern)!;
 const companion=examples.find(e=>e.id===current.companionId)!;
 const CurrentIcon=approachIcons[current.pattern];
 const misses=qps*(1-cache/100);
 const format=(n:number)=>n.toLocaleString('en-US',{maximumFractionDigits:1});
 function openScenario(id:RagId){setScenario(scenarios.findIndex(s=>s.pattern===id));document.getElementById('scenario-heading')?.scrollIntoView({behavior:'smooth',block:'start'});}
 return <section className="enterprise">
  <div className="enterprise-lead"><span><Building2 size={15}/>100 buildings</span><span>{scenarios.length} facilities questions</span><span>Fictional data</span><span>Planning estimates, not measurements</span><button className="text-button" onClick={onKnowledge}>Browse facilities evidence in Knowledge base <ArrowRight size={14}/></button></div>

  <section className="enterprise-section" aria-labelledby="scenario-heading"><div className="enterprise-section-title"><span>01 / SCENARIOS</span><h2 id="scenario-heading">Pick a facilities question</h2></div>
   <div className="scenario-picker" aria-label="Facilities scenarios">{scenarios.map((s,i)=>{const Icon=approachIcons[s.pattern];return <button key={s.name} aria-label={s.name} aria-pressed={scenario===i} onClick={()=>setScenario(i)}><Icon size={18}/><strong>{s.name}</strong><small>{s.stack}</small></button>;})}</div>
   <article className="scenario-detail" aria-live="polite">
    <div className="scenario-top"><div><span className="enterprise-kicker">{current.scale}</span><blockquote>{current.question}</blockquote><p>{current.situation}</p></div><span className="enterprise-badge"><CurrentIcon size={14}/>{current.stack}</span></div>
    <ol className="evidence-chain" aria-label="From sources to answer"><li><span>What the system can look at</span><p>{current.sources}</p></li><li><span>What it finds · fictional evidence</span><p>{current.evidence}</p></li><li className="answer"><span>Example answer to the facilities team</span><p>{current.answer}</p></li></ol>
    <div className="flow-pair"><Flow title="Before anyone asks" steps={['Manuals, procedures and work orders → change queue','Split into passages; keep building, asset, revision and access rules','Build vector + keyword indexes; retry failed updates','Publish searchable versions'+(current.pattern==='graph'?' alongside the verified building graph':'')]}/><Flow title="When the operator asks" steps={['Sign in; check customer, building and equipment access',...current.retrieval,'Give evidence to the language model → cite sources or say what is unknown']}/></div>
    <div className="risk-grid"><div><h4><Building2 size={15}/>At portfolio scale</h4><p>{current.operations}</p></div><div><h4><AlertTriangle size={15}/>Design for failure</h4><p>{current.failure}</p></div><div><h4><Check size={15}/>Prove it works</h4><p>{current.measure}</p></div></div>
    <details className="enterprise-why"><summary>Why this RAG pattern fits</summary><p>{current.why}</p><p><strong>Budget for: </strong>{choice.cost}</p></details>
    <div className="enterprise-connection"><div><strong>Try the same challenge on Harbor Tower</strong><p>{current.connection}</p></div><button className="primary" data-testid="enterprise-companion" onClick={()=>onExplore(current.pattern)}>Try {companion.title} in Playground <ArrowRight size={14}/></button></div>
   </article>
  </section>

  <section className="enterprise-section" aria-labelledby="data-heading"><div className="enterprise-section-title"><span>02 / BUILDING DATA</span><h2 id="data-heading">Three kinds of building data, three stores</h2></div>
   <div className="data-gateway"><ShieldCheck size={15}/>A shared gateway checks access, then sends each question to the store that can answer it</div>
   <div className="building-data-grid">
    <article><FileText size={22}/><h3>Documents → search index</h3><strong>“What is the procedure?”</strong><p>Manuals, procedures and work orders, split into passages for RAG.</p></article>
    <article><Network size={22}/><h3>Connections → building graph</h3><strong>“What serves this room?”</strong><p>Verified links such as AHU-7 → VAV-3 → Rooms 301/302.</p></article>
    <article><Activity size={22}/><h3>Readings → historian / API</h3><strong>“What is happening now?”</strong><p>Timestamped sensor and meter values, queried by exact time window.</p></article>
   </div>
   <details><summary>At portfolio scale, and a plain-language glossary</summary><p>Keep the three sources connected by customer, building and asset IDs; a room sensor reading is not a manual paragraph. Ingest documents through retryable queues, refresh the graph when equipment changes, and scale telemetry storage separately. Search replicas handle more questions; bounded queries protect building APIs from overload. Answers from readings should carry timestamps, units and quality flags.</p><p>AHU: air-handling unit. VAV: variable-air-volume terminal. BMS: building management system. Historian: timestamped equipment readings. RAG: retrieve evidence and give it to a language model before it answers. Embedding: a numeric representation used for meaning-based search. Reranking: sorting the first search results again for relevance. Graph: assets and the connections between them. Agent: a model that chooses its next allowed lookup.</p></details>
  </section>

  <section className="enterprise-section" aria-labelledby="capacity-heading"><div className="enterprise-section-title"><span>03 / CAPACITY</span><h2 id="capacity-heading">What happens when every building asks at once?</h2><p>Assistant questions across the portfolio, not sensor readings. Assumes hybrid search, 50 passages reranked and one generated answer per uncached question.</p></div>
   <div className="capacity-controls"><label htmlFor="enterprise-qps">Incoming questions / second <strong>{qps}</strong><input id="enterprise-qps" type="range" min="10" max="500" step="10" value={qps} onChange={e=>setQps(Number(e.target.value))}/></label><label htmlFor="enterprise-variants">Query variants (different phrasings) <strong>{variants}</strong><input id="enterprise-variants" type="range" min="1" max="5" value={variants} onChange={e=>setVariants(Number(e.target.value))}/></label><label htmlFor="enterprise-cache">Authorized answer-cache hit rate <strong>{cache}%</strong><input id="enterprise-cache" type="range" min="0" max="80" step="10" value={cache} onChange={e=>setCache(Number(e.target.value))}/></label></div>
   <CapacityChart qps={qps} variants={variants} cache={cache}/><div className="capacity-metrics" aria-live="polite"><div><strong data-testid="search-load">{format(misses*variants*2)}</strong><span>search branches / sec</span></div><div><strong>{format(misses*50)}</strong><span>passages to rerank / sec</span></div><div><strong>{format(misses*3000)}</strong><span>model input tokens / sec</span></div><div><strong>{format(misses*4)}</strong><span>answers in progress, on average</span></div></div>
   <details><summary>Assumptions, formulas and sizing limits</summary><p>Workload inputs are illustrative planning assumptions, not measured performance or published defaults.</p><p>Cache misses = questions/sec × (1 − hit rate). Search work = misses × variants × 2 (keyword + vector). A search service may execute both branches in one API request. After deduplication, budget up to 50 candidates once per miss; the displayed candidate demand assumes that full budget is used. Assume 3,000 total input tokens and 500 output tokens per answer: output demand is {format(misses*500)} tokens/sec. At an assumed mean generation time of 4 seconds, average concurrency = misses × 4 in a stable system whose throughput keeps up with arrivals. This excludes queue wait; an overloaded service does not satisfy that assumption.</p><p>This excludes expansion tokens, retries, graph traversals and agent loops. These are workload estimates, not throughput guarantees or p95 forecasts. Benchmark the actual index, filters and models; size replicas, model quotas and burst headroom from measurements. Cache answers only when customer, building, permissions, query and content versions match; invalidate on access-rule changes. Current temperature and alarm questions need timestamp-aware live data handling, not this document-answer cache.</p><p>Separate large-portfolio storage example (not the 100-building baseline): 20 million document chunks × 1,536 dimensions × 4 bytes = 122.88 GB of raw float32 vectors (decimal), before text, metadata, ANN structures, keyword indexes and replicas. Three full copies require 368.64 GB of vectors alone. Dimensions and compression depend on your embedding model and search engine.</p></details>
  </section>

  <section className="enterprise-section" aria-labelledby="choice-heading"><div className="enterprise-section-title"><span>04 / CHEAT SHEET</span><h2 id="choice-heading">Which pattern fits which question?</h2><p>Ask what is missing. These techniques combine; they are not levels to progress through.</p></div>
   <div className="decision-table-wrap" role="region" aria-label="RAG selection reference" tabIndex={0}><table className="decision-table"><thead><tr><th scope="col">Pattern</th><th scope="col">Typical question</th><th scope="col">What it adds</th><th scope="col">Budget for</th><th scope="col"><span className="sr-only">Scenario</span></th></tr></thead><tbody>{patterns.map(p=>{const Icon=approachIcons[p.id];const active=current.pattern===p.id;return <tr key={p.id} className={active?'active':''}><th scope="row"><Icon size={15}/>{p.name}</th><td>“{cheatSheet[p.id].question}”</td><td>{cheatSheet[p.id].adds}</td><td>{choices.find(c=>c.id===p.id)!.cost}</td><td><button className="text-button" aria-label={`Open the ${p.name} scenario`} onClick={()=>openScenario(p.id)}>{active?'Showing':'Scenario'} <ArrowRight size={13}/></button></td></tr>;})}</tbody></table></div>
  </section>

  <section className="enterprise-section" aria-labelledby="ready-heading"><div className="enterprise-section-title"><span>05 / BEFORE YOU SHIP</span><h2 id="ready-heading">Production checklist</h2><p>Each item has a lab where you can see it go wrong.</p></div>
   <div className="ready-grid">{checklist.map(c=><article key={c.title}><c.icon size={20}/><h3>{c.title}</h3><p>{c.text}</p><button className="text-button" onClick={()=>onLab(c.lab)}>Try it in {c.labName} <ArrowRight size={13}/></button></article>)}</div>
   <details><summary>Production notes</summary><p>Build a held-out set of representative questions with relevant passages and expected answers. Include model-specific alarms, repeated asset names across buildings, stale sensor values, retired manuals, unanswered questions and another customer’s private work orders. Compare the same corpus snapshot and context budget. Track recall@K, nDCG@K, answer correctness, citation support, abstention, p50/p95 latency and cost per successful answer, by question type and tenant; averages can hide failures.</p><p>Enforce document and graph permissions before evidence reaches a reranker, model, cache or user. Redact sensitive telemetry. Carry source IDs and versions into citations and audit traces. Use idempotent ingestion, deletion propagation, queue backpressure, model rate limits, timeouts and circuit breakers. Deploy new index versions with rollback; canary changes and monitor quality, cost, freshness and saturation. Abstain or escalate when safe evidence is unavailable.</p><p>Treat retrieved instructions as untrusted content. Test document poisoning, prompt injection and unauthorized evidence paths; validate model outputs before downstream use. These controls are not implemented in this simulator.</p><p>Graph RAG is a family of approaches. The cooling-outage example follows verified building connections; community-summary Graph RAG approaches target corpus-wide themes, which need a different indexing and evaluation strategy.</p><p>A suggested starting experiment: compare a simple vector baseline against hybrid retrieval, then test reranking. Add multi-query, graph or agent routing only for question slices where evaluation shows a benefit. This is a design recommendation, not a benchmark result.</p></details>
  </section>
 </section>;
}
