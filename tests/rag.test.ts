import {test} from 'node:test';
import assert from 'node:assert/strict';
import {documents, patterns, retrieve, type RagId} from '../lib/rag';
import {examples, lessons, playgroundPicks} from '../lib/examples';
import {scenarios} from '../lib/building-scenarios';

test('every facilities scenario has a relevant runnable company companion',()=>{
 assert.equal(new Set(scenarios.map(s=>s.pattern)).size,patterns.length);
 for(const scenario of scenarios){
  const companion=examples.find(e=>e.id===scenario.companionId);
  assert.ok(companion,scenario.name);
  assert.ok(companion.approaches.includes(scenario.pattern),scenario.name);
  assert.ok(retrieve(scenario.pattern,companion.question).hits.length>0,scenario.name);
 }
});

test('each approach retrieves grounded chiller evidence',()=>{
 for(const p of patterns){const result=retrieve(p.id,'What is the impact of a CH-1 chiller trip?');assert.ok(result.hits.some(h=>h.doc.id==='D08'),p.name);assert.ok(result.hits.length<=3);for(const h of result.hits)assert.ok(result.answer.includes(h.doc.text));}
});
test('hybrid retrieves an exact alarm code and agent routes to hybrid',()=>{
 assert.equal(retrieve('hybrid','F-17').hits[0].doc.id,'D04');
 assert.equal(retrieve('agentic','What should I check for alarm F-17 on AHU-7?').route,'hybrid');
});
test('graph follows equipment dependency links',()=>{
 const result=retrieve('graph','CH-1 chiller trip');assert.ok(result.hits.some(h=>h.doc.id==='D07'));assert.ok(result.hits.some(h=>h.reason.includes('relationship')));
});
test('empty and unmatched inputs abstain',()=>{
 for(const p of patterns){assert.equal(retrieve(p.id,'').hits.length,0);assert.equal(retrieve(p.id,'quantum penguins').hits.length,0);}
});
test('filters and top K hold for every approach',()=>{
 for(const p of patterns){const result=retrieve(p.id,'after-hours cooling charges',1,'Tenant services');assert.ok(result.hits.length<=1);assert.ok(result.hits.every(h=>h.doc.category==='Tenant services'));assert.equal(retrieve(p.id,'cooling',3,'Missing collection').hits.length,0);}
});
test('multi-query expands vocabulary and graph links resolve',()=>{
 assert.ok(retrieve('multi','overnight electricity').queries.length>1);
 for(const doc of documents)for(const link of doc.links)assert.ok(documents.some(d=>d.id===link));
});

test('RRF uses one-based ranks and a constant independent of Top K',()=>{
 const one=retrieve('hybrid','F-17',1);
 const five=retrieve('hybrid','F-17',5);
 // No dictionary concept is present. Only the keyword list contributes rank 1.
 assert.equal(one.hits[0].doc.id,'D04');
 assert.equal(one.hits[0].score,1/61);
 assert.equal(one.hits[0].score,five.hits[0].score);
});

test('graph links are one-hop associations with heuristic scores',()=>{
 const result=retrieve('graph','CH-1 chiller trip',5);
 const [seed,...neighbors]=result.hits;
 assert.ok(neighbors.length>0);
 assert.deepEqual(neighbors.map(h=>h.doc.id),seed.doc.links);
 for(const hit of neighbors) assert.equal(hit.score,seed.score*0.8);
 const filtered=retrieve('graph','chiller trip',5,'HVAC & plant');
 assert.ok(filtered.hits.every(h=>h.doc.category==='HVAC & plant'));
});

test('source count fallback happens after Top K and does not measure answerability',()=>{
 const one=retrieve('agentic','after-hours cooling',1);
 assert.ok(one.trace.some(t=>t.includes('Retry with hybrid')));
 assert.deepEqual(one.hits,retrieve('hybrid','after-hours cooling',1).hits);
 const several=retrieve('agentic','after-hours cooling',3);
 assert.ok(!several.trace.some(t=>t.includes('Retry with hybrid')));
 // An unsupported question with a known concept can still retrieve sources.
 assert.ok(retrieve('naive','Does the chiller cure quantum penguins?').hits.length>0);
});

test('token matching is not whole-identifier matching and ties are stable',()=>{
 assert.equal(retrieve('hybrid','G-17').hits[0].doc.id,'D04');
 assert.deepEqual(retrieve('graph','CH-1 chiller trip',5),retrieve('graph','CH-1 chiller trip',5));
 for(const p of patterns){
  const r=retrieve(p.id,'overnight electricity consumption',5);
  assert.equal(new Set(r.hits.map(h=>h.doc.id)).size,r.hits.length);
  assert.ok(r.hits.every(h=>Number.isFinite(h.score)&&h.score>0));
 }
});

test('scenario evidence resolves and covers every approach with supported and unsupported questions',()=>{
 assert.equal(new Set(documents.map(d=>d.id)).size,documents.length);
 assert.equal(new Set(examples.map(e=>e.id)).size,examples.length);
 assert.equal(new Set(examples.map(e=>e.question)).size,examples.length);
 for(const example of examples){
  assert.ok(example.answer.length>50&&example.observe.length>50,example.id);
  for(const id of [...example.inspect,...Object.keys(example.grades)])assert.ok(documents.some(d=>d.id===id),`${example.id}: ${id}`);
  assert.ok(Object.values(example.grades).every(g=>g===1||g===2));
 }
 for(const pattern of patterns)assert.ok(examples.filter(e=>e.approaches.includes(pattern.id)).length>=2,pattern.id);
 assert.equal(examples.filter(e=>Object.keys(e.grades).length===0).length,2);
 assert.equal(examples.find(e=>e.id==='notice')!.grades.D12,undefined,'Archived policy is not current evidence');
});

test('similar alarm procedures: hybrid finds F-17, reranking separates F-18',()=>{
 assert.equal(retrieve('hybrid','What should I check for alarm F-17 on AHU-7?').hits[0].doc.id,'D04');
 // Hybrid ranks F-17 first for the F-18 question too; the F-18 scenario teaches this.
 assert.equal(retrieve('hybrid','What should I check for alarm F-18 on AHU-7?').hits[0].doc.id,'D04');
 assert.equal(retrieve('rerank','What should I check for alarm F-18 on AHU-7?').hits[0].doc.id,'D14');
 const comparisons=examples.map(e=>new Set(patterns.map(p=>retrieve(p.id,e.question).hits.map(h=>h.doc.id).join(','))).size);
 assert.ok(comparisons.filter(count=>count>=3).length>=5,'Several scenarios should reveal different ranked lists');
});

test('the indirect dependency is documented but a one-hop graph does not invent a second hop',()=>{
 assert.ok(documents.find(d=>d.id==='D08')!.links.includes('D07'));
 assert.ok(documents.find(d=>d.id==='D07')!.links.includes('D21'));
 assert.ok(!retrieve('graph','CH-1 chiller trip',5).hits.some(h=>h.doc.id==='D21'));
});

test('playground lessons describe the live ranking for every suggested approach',()=>{
 for(const e of examples){
  assert.deepEqual(Object.keys(lessons[e.id]??{}).sort(),[...e.approaches].sort(),e.id);
  for(const [id,lesson] of Object.entries(lessons[e.id])){
   const ranked=retrieve(id as RagId,e.question).hits.map(h=>h.doc.id);
   assert.deepEqual(ranked.slice(0,lesson!.expect.length),lesson!.expect,`${e.id}/${id}`);
  }
 }
 for(const [id,picks] of Object.entries(playgroundPicks))for(const pick of picks)assert.ok(lessons[pick]?.[id as RagId],`${id}: ${pick}`);
 for(const s of scenarios)assert.ok(playgroundPicks[s.pattern].includes(s.companionId),s.name);
 const top=(id:RagId,ex:string,k=3)=>retrieve(id,examples.find(e=>e.id===ex)!.question,k).hits.map(h=>h.doc.id);
 assert.ok(!top('naive','notice').includes('D12'));
 assert.ok(!top('multi','thermostat').includes('D16'));
 assert.ok(!top('graph','commsroom',5).includes('D21'));
 assert.ok(!top('agentic','commsroom',5).includes('D21'));
 assert.ok(!top('agentic','moveout').includes('D05'));
 assert.ok(!top('naive','movein').includes('D24'));
 assert.equal(retrieve('agentic',examples.find(e=>e.id==='moveout')!.question).route,'naive');
});
