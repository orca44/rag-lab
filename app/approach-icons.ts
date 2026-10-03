import {GitBranch, Network, Route, Search, SlidersHorizontal, Workflow} from 'lucide-react';
import type {RagId} from '@/lib/rag';

export const approachIcons = {naive:Search, hybrid:GitBranch, rerank:SlidersHorizontal, multi:Workflow, graph:Network, agentic:Route} satisfies Record<RagId, unknown>;
