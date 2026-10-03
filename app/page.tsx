'use client';

import {useEffect, useState} from 'react';
import {ArrowRight, BookOpen, Building2, ChevronRight, Code2, Columns3, Database, FlaskConical, Layers3, Network, Play, X} from 'lucide-react';
import {documents, patterns, retrieve, type RagId, type Result} from '@/lib/rag';
import Enterprise from './enterprise';
import KnowledgeBase, {type KnowledgeScope} from './knowledge-base';
import {workspaceSections} from '@/lib/workspace';
import {scenarios as buildingScenarios} from '@/lib/building-scenarios';
import ExamplePicker from './examples';
import {examples as scenarios} from '@/lib/examples';
import Labs from './labs';
import Research from './research';
import {ComparisonMap} from './visuals';
import Playground from './playground';
import ThemeToggle from './theme-toggle';
import {approachIcons as icons} from './approach-icons';
const examples = scenarios.map(s=>s.question);
const headings: Record<string,string> = {'Playground':'Less theory. More understanding.','Learning labs':'Build intuition. Test the evidence.','Compare approaches':'One question. Six perspectives.','Knowledge base':'Meet your knowledge base.','Production blueprint':'From playground to production.','Sources & limits':'Explore the methods and evidence.'};
export default function Home(){
 const [active,setActive]=useState<RagId>('naive');const [view,setView]=useState('Playground');const [question,setQuestion]=useState(examples[0]);const [category,setCategory]=useState('All documents');const [topK,setTopK]=useState(3);const [result,setResult]=useState<Result|null>(null);const [ready,setReady]=useState(false);const [source,setSource]=useState<string|null>(null);
 const [knowledgeScope,setKnowledgeScope]=useState<KnowledgeScope>('company');
 const [enterpriseScenario,setEnterpriseScenario]=useState(0);
 const [labLesson,setLabLesson]=useState(0);
 useEffect(()=>{setReady(true);},[]);
 useEffect(()=>{
  if(!source)return;
  const previous=document.activeElement as HTMLElement|null;
  const previousOverflow=document.body.style.overflow;
  document.body.style.overflow='hidden';
  const handleKey=(event:KeyboardEvent)=>{
   if(event.key==='Escape'){setSource(null);return;}
   if(event.key!=='Tab')return;
   const controls=document.querySelectorAll<HTMLElement>('.document-modal button');
   const first=controls[0],last=controls[controls.length-1];
   if(event.shiftKey&&document.activeElement===first){event.preventDefault();last?.focus();}
   else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first?.focus();}
  };
  document.addEventListener('keydown',handleKey);
  return ()=>{document.body.style.overflow=previousOverflow;document.removeEventListener('keydown',handleKey);if(previous?.isConnected)previous.focus();};
 },[source]);
 function select(id:RagId){setActive(id);setResult(null);setView('Playground');}
 function chooseExample(value:string){setQuestion(value);setCategory('All documents');setTopK(3);setResult(null);}
 function exploreEnterprise(id:RagId){const companion=scenarios.find(e=>e.id===buildingScenarios.find(s=>s.pattern===id)!.companionId)!;chooseExample(companion.question);select(id);}
 function openEnterprise(index:number){setEnterpriseScenario(index);setView('Production blueprint');}
 function navigate(name:string,lesson=0){setView(name);setLabLesson(lesson);}
 function run(){if(!question.trim())return;setResult(retrieve(active,question,topK,category));}
 const selectedDoc=documents.find(d=>d.id===source);
 return <div className="app-shell">
  <aside className="sidebar">
   <a className="brand" href="/" aria-label="RAG Lab home"><span className="brand-mark"><Layers3 size={23}/></span>rag<span className="brand-light">lab</span><span className="beta">BETA</span></a>
   <div className="nav-label">WORKSPACE</div>
   <nav>{[{name:'Playground',icon:Play},{name:'Learning labs',icon:FlaskConical},{name:'Compare approaches',icon:Columns3},{name:'Knowledge base',icon:Database},{name:'Production blueprint',icon:Building2},{name:'Sources & limits',icon:BookOpen}].map(({name,icon:NavIcon})=><button key={name} aria-label={name==='Knowledge base'?`Knowledge base ${documents.length}`:name} title={name} className={'nav-item '+(view===name?'selected':'')} onClick={()=>navigate(name)}><NavIcon size={17}/>{name}{name==='Knowledge base'&&<span className="count">{documents.length}</span>}</button>)}</nav>
   <div className="nav-label types-label">RAG APPROACHES <span>6</span></div>
   <nav>{patterns.map(p=>{const ItemIcon=icons[p.id];return <button key={p.id} className={'nav-item approach '+(active===p.id&&view==='Playground'?'active':'')} onClick={()=>select(p.id)}><ItemIcon size={17}/>{p.name}</button>})}</nav>
   <div className="sidebar-bottom"><span className="status-dot"/> Browser workspace <span>No API key needed</span></div>
  </aside>
  <div className="main-shell"><header className="topbar"><div><span>Workspace</span><ChevronRight size={14}/><strong>{view}</strong></div><div className="topbar-actions"><ThemeToggle/></div></header>
  <main>
   <div className="page-heading"><div className="eyebrow"><span/> RETRIEVAL-AUGMENTED GENERATION</div><h1>{headings[view]}</h1><p className="workspace-scope">{workspaceSections.find(s=>s.name===view)?.scope}</p></div>
   {view!=='Production blueprint'&&view!=='Sources & limits'&&<div className="simulation-notice"><span><strong>Interactive examples.</strong> Sample data · browser-based retrieval · no LLM. Results show source excerpts, not generated answers.</span><button onClick={()=>setView('Sources & limits')}>Methods and limitations</button></div>}
   {view==='Sources & limits'&&<Research/>}
   {view==='Learning labs'&&<Labs initialLesson={labLesson} onSource={setSource}/>}
   {view==='Production blueprint'&&<Enterprise initialScenario={enterpriseScenario} onExplore={exploreEnterprise} onLab={lesson=>navigate('Learning labs',lesson)} onScenario={setEnterpriseScenario} onKnowledge={()=>{setKnowledgeScope('facilities');setView('Knowledge base');}}/>}
   {view==='Playground'&&<Playground active={active} onSelect={select} question={question} onQuestion={q=>{setQuestion(q);setResult(null);}} category={category} onCategory={c=>{setCategory(c);setResult(null);}} topK={topK} onTopK={k=>{setTopK(k);setResult(null);}} result={result} ready={ready} onRun={run} onExample={chooseExample} onSource={setSource} onCompare={()=>setView('Compare approaches')}/>}
   {view==='Compare approaches'&&<section className="comparison"><div className="compare-controls"><label className="compare-question">Your question<input value={question} onChange={e=>{setQuestion(e.target.value);setResult(null);}}/></label><label>Example scenario<select value={scenarios.find(e=>e.question===question)?.id??''} onChange={e=>{const next=scenarios.find(x=>x.id===e.target.value);if(next)chooseExample(next.question);}}><option value="" disabled>Custom question</option>{scenarios.map(e=><option key={e.id} value={e.id}>{e.title}</option>)}</select></label><label>Knowledge source<select value={category} onChange={e=>{setCategory(e.target.value);setResult(null);}}><option>All documents</option>{[...new Set(documents.map(d=>d.category))].map(c=><option key={c}>{c}</option>)}</select></label><label>Top K<select value={topK} onChange={e=>{setTopK(Number(e.target.value));setResult(null);}}>{[1,2,3,4,5].map(n=><option key={n}>{n}</option>)}</select></label></div><ExamplePicker question={question}/><ComparisonMap question={question} topK={topK} category={category} onSource={setSource} onExplore={select}/></section>}
   {view==='Knowledge base'&&<KnowledgeBase scope={knowledgeScope} onScope={setKnowledgeScope} onSource={setSource} onEnterprise={openEnterprise}/>}
   <footer><span><Code2 size={14}/> Built for curiosity. Designed for clarity.</span><span className="footer-tag">RAG LAB</span></footer>
  </main></div>
  {selectedDoc&&<div className="modal-backdrop" onClick={()=>setSource(null)}><section className="document-modal" role="dialog" aria-modal="true" aria-label={selectedDoc.title} onClick={e=>e.stopPropagation()} onKeyDown={e=>{if(e.key==='Escape')setSource(null);}}><button autoFocus className="close" aria-label="Close document" onClick={()=>setSource(null)}><X size={20}/></button><span className="eyebrow">{selectedDoc.id} / {selectedDoc.category}</span><h2>{selectedDoc.title}</h2><p className="fictional-source-note">Sample document. Policies, equipment, alarm codes and readings are fictional examples. They do not describe a real building, owner or manufacturer.</p><p>{selectedDoc.text}</p><h4><Network size={16}/> Connected documents</h4>{selectedDoc.links.map(id=><button className="linked-doc" key={id} onClick={()=>setSource(id)}>{documents.find(d=>d.id===id)?.title}<ArrowRight size={15}/></button>)}</section></div>}
 </div>;
}
