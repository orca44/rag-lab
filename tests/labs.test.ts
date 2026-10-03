import {test} from 'node:test';
import assert from 'node:assert/strict';
import {assembleContext,bm25,chunkText,evaluationCases,ingestionExamples,metrics,parseRuns,percentile,queueExperiment,rankedIds,securityGate,traverseGraph,validateCitationIds} from '../lib/labs';

test('graded metrics reward relevant rank order and exclude unanswerable denominators',()=>{
 const grades={a:2,b:1,c:0};
 assert.deepEqual(metrics(['a','b'],grades,2),{recall:1,ndcg:1});
 assert.equal(metrics(['b','a'],grades,2).recall,1);
 assert.ok(metrics(['b','a'],grades,2).ndcg!<1);
 assert.deepEqual(metrics(['a'],{},3),{recall:null,ndcg:null});
 assert.equal(metrics(['a','a'],grades,2).recall,.5);
 assert.equal(metrics(['c','a'],grades,1).recall,0);
 assert.equal(metrics([],{a:2},3).ndcg,0);
});
test('BM25 retrieves lexical evidence, handles empty input and respects result limit',()=>{
 assert.equal(bm25('F-17',1)[0].doc.id,'D04');
 assert.equal(bm25('baseload',1)[0].doc.id,'D10');
 assert.deepEqual(bm25(''),[]);
 assert.deepEqual(bm25('xyzzynonexistent'),[]);
 assert.equal(bm25('tenant',1).length,1);
 assert.ok(bm25('baseload')[0].score>0);
});
test('chunks preserve boundaries and overlap without creating an extra tail chunk',()=>{
 assert.deepEqual(chunkText('# a b c d e f g',4,1),[{id:'C1',start:0,end:4,text:'a b c d'},{id:'C2',start:3,end:7,text:'d e f g'}]);
 assert.deepEqual(chunkText('  ',4,1),[]);
 assert.throws(()=>chunkText('hello',4,4));
 const result=assembleContext(chunkText('one two three four five six seven eight',3,1),40,'Why?');
 assert.ok(result.used<=40);
 assert.ok(result.excluded.length>0);
 assert.equal(result.included.length+result.excluded.length,4);
 assert.equal(assembleContext([],1,'why').baseTooLarge,true);
});
test('security gate independently enforces scope, versions, tombstones and known quarantine',()=>{
 const all={scope:true,fresh:true,quarantine:true};
 assert.deepEqual(securityGate('North',all).filter(r=>!r.reason).map(r=>r.doc.id),['S1']);
 assert.deepEqual(securityGate('South',all).filter(r=>!r.reason).map(r=>r.doc.id),['S2']);
 assert.equal(securityGate('North',{scope:false,fresh:false,quarantine:false}).filter(r=>!r.reason).length,5);
 assert.equal(validateCitationIds(['S99'],['S1']),false);
 assert.equal(validateCitationIds([],['S1']),false);
 assert.equal(validateCitationIds(['S1'],['S1']),true);
});
test('multi-hop tools obey budgets, stop on failure and preserve pruning results',()=>{
 const first=traverseGraph(3,1);assert.equal(first.calls,1);assert.ok(!first.visited.includes('Mechanical team'));assert.match(first.stop,/budget/);
 const full=traverseGraph(3,3);assert.ok(full.visited.includes('Mechanical team'));assert.equal(full.calls,3);
 const adaptive=traverseGraph(3,3,false,'adaptive');assert.deepEqual(adaptive.visited,full.visited);assert.equal(adaptive.calls,2);
 const failed=traverseGraph(3,3,true);assert.equal(failed.calls,2);assert.match(failed.stop,/failed/);assert.ok(!failed.visited.includes('Mechanical team'));
});
test('queue and nearest-rank percentiles have known numerical results',()=>{
 assert.deepEqual(queueExperiment(10,100,3).map(r=>r.wait),[0,0,0]);
 assert.deepEqual(queueExperiment(20,100,3).map(r=>r.wait),[0,50,100]);
 assert.equal(percentile([4,1,3,2],.5),2);assert.equal(percentile([4,1,3,2],.95),4);
});
test('import rejects fabricated shapes, duplicate cases, unknown IDs and invalid measurements',()=>{
 const run={name:'Measured run',kind:'embeddings',model:'model revision',environment:'test CPU',measuredAt:'2026-09-26T12:00:00Z',dataset:'rag-lab-v3',topK:3,results:evaluationCases.map(c=>({caseId:c.id,ids:['D01'],latencyMs:5,inputTokens:0,outputTokens:0,costUsd:0,answer:''}))};
 assert.equal(parseRuns(JSON.stringify([run])).length,1);
 assert.throws(()=>parseRuns(JSON.stringify([{...run,dataset:'rag-lab-v2'}])),/rag-lab-v3/);
 assert.throws(()=>parseRuns(JSON.stringify([{...run,results:run.results.slice(1)}])));
 assert.throws(()=>parseRuns(JSON.stringify([{...run,results:run.results.map(r=>({...r,caseId:'remote'}))}])));
 assert.throws(()=>parseRuns(JSON.stringify([{...run,results:run.results.map(r=>({...r,ids:['D99']}))}])));
 assert.throws(()=>parseRuns(JSON.stringify([{...run,results:run.results.map(r=>({...r,latencyMs:-1}))}])));
 assert.throws(()=>parseRuns(JSON.stringify([{...run,results:run.results.map(r=>({...r,inputTokens:1.5}))}])));
});

test('bounded typed traversal reaches the indirect comms room dependency on the second hop',()=>{
 assert.ok(!traverseGraph(1,3).visited.includes('Comms room 305'));
 assert.ok(traverseGraph(2,3).visited.includes('Comms room 305'));
 assert.ok(!traverseGraph(3,1).visited.includes('Comms room 305'));
});

test('learning lab “Try this” steps match the lab logic',()=>{
 const notice=evaluationCases.find(c=>c.id==='notice')!;
 assert.deepEqual(rankedIds('bm25',notice.question,3),['D12','D03','D18']);
 assert.equal(metrics(rankedIds('bm25',notice.question,3),notice.grades,3).recall,0);
 assert.equal(metrics(rankedIds('multi',notice.question,5),notice.grades,5).recall,1);
 const relabeled={...notice.grades,D12:1};
 assert.equal(metrics(rankedIds('rerank',notice.question,3),relabeled,3).ndcg,1);
 assert.ok(metrics(rankedIds('naive',notice.question,3),relabeled,3).recall!<metrics(rankedIds('naive',notice.question,3),notice.grades,3).recall!);
 const handbook=ingestionExamples[0];const chunks=chunkText(handbook.text,24,6);
 const answer=chunks.filter(c=>c.text.includes(handbook.answer)).map(c=>c.id);
 assert.deepEqual(answer,['C3']);
 assert.ok(!assembleContext(chunks,180,handbook.question).included.includes('C3'));
 assert.ok(assembleContext(chunks,250,handbook.question).included.includes('C3'));
 for(const e of ingestionExamples)assert.ok(chunkText(e.text,24,6).some(c=>c.text.includes(e.answer)),e.id);
 assert.deepEqual(securityGate('South',{scope:true,fresh:true,quarantine:true}).filter(r=>!r.reason).map(r=>r.doc.id),['S2']);
 assert.ok(securityGate('South',{scope:false,fresh:true,quarantine:true}).some(r=>r.doc.id==='S1'&&!r.reason));
 assert.ok(!traverseGraph(1,2).visited.includes('Comms room 305'));
 assert.match(traverseGraph(2,1).stop,/budget exhausted/);
});
