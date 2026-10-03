import {documents} from './rag';
import {examples} from './examples';
import {scenarios} from './building-scenarios';

// Reader-facing descriptions of the data and behavior in each workspace view.
export const workspaceSections = [
 {name:'Playground',scope:`Pick one of six approaches to see how it finds evidence, then try it on ${documents.length} documents from Harbor Tower, a fictional office building.`},
 {name:'Learning labs',scope:`Evaluation uses the same ${documents.length} Harbor Tower documents and ${examples.length} questions, with its own Top K and editable grades. Ingestion, security and queue experiments use separate inputs; they do not update the playground corpus.`},
 {name:'Compare approaches',scope:`Run one question through all six approaches over the same ${documents.length} Harbor Tower documents. Collection and Top K are shared with Playground.`},
 {name:'Knowledge base',scope:`Browse ${documents.length} searchable Harbor Tower documents and ${scenarios.length} portfolio-scale case studies. The documents power retrieval; the case studies support Production blueprint and are not searched by the playground.`},
 {name:'Production blueprint',scope:`How each approach would run across a 100-building portfolio: ${scenarios.length} design scenarios, where building data lives, load planning and a production checklist. Proposed designs and planning estimates, not live systems.`},
 {name:'Sources & limits',scope:'Where the data comes from, how each approach is simplified, and the open sources behind it.'},
] as const;
