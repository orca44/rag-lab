import {ArrowRight, Building2, Database, FlaskConical} from 'lucide-react';
import {assumptions, gaps, patternResearch, references, reviewedOn, sourceGroups} from '@/lib/research';
import {documents, patterns} from '@/lib/rag';
import {examples} from '@/lib/examples';
import {scenarios} from '@/lib/building-scenarios';
import {approachIcons} from './approach-icons';

// Which data each section reads. Mirrors the props passed in app/page.tsx.
const dataFlow=[
 {icon:Database,source:'Harbor Tower documents',detail:`${documents.length} documents · ${examples.length} example questions`,feeds:['Playground','Compare approaches','Knowledge base','Evaluation','Ingestion examples','Graph & tools edges','Operations timing','Model comparison']},
 {icon:Building2,source:'Facilities case studies',detail:`${scenarios.length} portfolio scenarios`,feeds:['Knowledge base','Production blueprint']},
 {icon:FlaskConical,source:'Lab-only inputs',detail:'Simulated, or your own file',feeds:['Security: 5 tenant records','Operations: simulated queue','Ingestion: your .txt or .md']},
];
const sources=Object.values(references);

export default function Research() {
 return <section className="research-page">
  <nav className="research-jump" aria-label="On this page">{[['data-heading','Data'],['pattern-evidence-heading','Approaches'],['limits-heading','Assumptions & limits'],['references-heading','Sources']].map(([id,label])=><a key={id} href={`#${id}`}>{label}</a>)}</nav>

  <section aria-labelledby="data-heading"><h2 id="data-heading">Where each section’s data comes from</h2><p>All fictional, bundled with the app and searched locally.</p>
   <div className="data-map">{dataFlow.map(({icon:Icon,source,detail,feeds})=><div key={source} className="data-row"><div className="data-source"><Icon size={18}/><div><strong>{source}</strong><span>{detail}</span></div></div><ArrowRight size={16} className="data-arrow" aria-hidden="true"/><ul aria-label={`${source} feeds`}>{feeds.map(f=><li key={f}>{f}</li>)}</ul></div>)}</div>
  </section>

  <section aria-labelledby="pattern-evidence-heading"><h2 id="pattern-evidence-heading">How each approach works here</h2><p>Simple stand-ins for each technique. They combine; they are not a quality ladder.</p>
   <div className="technique-table">{patterns.map(p=>{const Icon=approachIcons[p.id];return <article key={p.id}><h3><Icon size={16}/>{p.name}</h3><p>{patternResearch[p.id].limit.replace(/^Method details: (.)/,(_,c:string)=>c.toUpperCase())}</p></article>;})}</div>
  </section>

  <section aria-labelledby="limits-heading"><h2 id="limits-heading">Assumptions and limits</h2><p>Open a card for the details.</p>
   <div className="limits-columns">
    <div><h3 id="assumptions-heading">Data and modeling assumptions</h3><div className="research-grid">{assumptions.map(a=><details key={a.id} id={`assumption-${a.id}`}><summary><span>{a.id}</span>{a.title}</summary><p>{a.text}</p></details>)}</div></div>
    <div><h3 id="gaps-heading">Capabilities and limitations</h3><div className="research-grid">{gaps.map(g=><details key={g.title}><summary><span>{g.status}</span>{g.title}</summary><p>{g.text}</p></details>)}</div></div>
   </div>
  </section>

  <section aria-labelledby="references-heading"><h2 id="references-heading">Sources</h2><p>{sources.length} research papers, all open on arXiv. They explain the techniques; they don’t validate the fictional data. Reviewed {reviewedOn}.</p>
   <div className="research-sources">{sourceGroups.map(group=><section key={group} aria-label={group}><h3>{group}</h3><ul>{sources.filter(r=>r.group===group).map(r=><li key={r.url}><div className="source-head"><a href={r.url} target="_blank" rel="noreferrer">{r.title} ↗</a><span className="source-kind">arXiv {r.url.split('/').pop()}</span></div><p>{r.note}</p><div className="source-used" aria-label="Used in">{r.usedIn.map(u=><span key={u}>{u}</span>)}</div></li>)}</ul></section>)}</div>
  </section>
 </section>;
}
