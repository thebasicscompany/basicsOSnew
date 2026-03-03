import type { Db } from "../db/client.js";
import type { Env } from "../env.js";
import type { WorkflowDefinition } from "./automation-engine.js";
type SalesRow = {
    id: number;
    basicsApiKey?: string | null;
};
export declare function executeWorkflow(workflowDef: WorkflowDefinition, triggerData: Record<string, unknown>, sales: SalesRow, db: Db, env: Env): Promise<Record<string, unknown>>;
export {};
//# sourceMappingURL=automation-executor.d.ts.map