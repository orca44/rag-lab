'use client';

import {AlertTriangle} from 'lucide-react';
import {examples} from '@/lib/examples';

export default function ExamplePicker({question}:{question:string}) {
 const selected=examples.find(e=>e.question===question);
 if(!selected)return <p className="example-custom">Custom question: there is no reference answer or key source for this wording. Pick an example scenario to check the results against one.</p>;
 const unanswerable=Object.keys(selected.grades).length===0;
 return <section className="example-detail" aria-label="Scenario">
  <span className="visual-kicker">{selected.challenge}</span>
  <p><strong>What to compare: </strong>{selected.observe}</p>
  {unanswerable&&<p className="example-unanswerable"><AlertTriangle size={14}/>No document answers this question. Every result below is a near miss.</p>}
  <details key={selected.id}><summary>Reference answer and evidence</summary><p>{selected.answer}</p><p><strong>Evidence assessment: </strong>{selected.rationale}</p><p className="visual-footnote">Written in advance for the fictional sources, not generated from this run.</p></details>
 </section>;
}
