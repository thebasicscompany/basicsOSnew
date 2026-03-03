import { PgBoss } from "pg-boss";
import * as schema from "../db/schema/index.js";
import { eq, and } from "drizzle-orm";
import { executeWorkflow } from "./automation-executor.js";
let _boss = null;
let _db = null;
let _env = null;
export async function startAutomationEngine(database, environment) {
    _db = database;
    _env = environment;
    _boss = new PgBoss(environment.DATABASE_URL);
    _boss.on("error", (err) => {
        console.error("[automation-engine] pg-boss error:", err);
    });
    await _boss.start();
    // pg-boss v12 requires creating the queue before workers can poll it
    await _boss.createQueue("run-automation");
    await _boss.work("run-automation", { localConcurrency: 3 }, async (jobs) => {
        for (const job of jobs) {
            const { ruleId, salesId, triggerData } = job.data;
            await runAutomation(ruleId, salesId, triggerData);
        }
    });
    // Load and register schedule-triggered rules
    await loadScheduleRules();
    console.log("[automation-engine] started");
}
async function loadScheduleRules() {
    if (!_db)
        return;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const rules = await _db
        .select()
        .from(schema.automationRules)
        .where(eq(schema.automationRules.enabled, true));
    for (const rule of rules) {
        const def = rule.workflowDefinition;
        const triggerNode = def?.nodes?.find((n) => n.type === "trigger_schedule");
        if (triggerNode) {
            const cron = triggerNode.data.cron;
            if (cron) {
                await registerScheduleRule(rule.id, rule.salesId, cron);
            }
        }
    }
}
async function registerScheduleRule(ruleId, salesId, cron) {
    if (!_boss)
        return;
    const queueName = `rule-schedule-${ruleId}`;
    try {
        await _boss.schedule(queueName, cron, { ruleId, salesId });
        await _boss.work(queueName, async (jobs) => {
            for (const job of jobs) {
                const data = job.data;
                await runAutomation(data.ruleId, data.salesId, {});
            }
        });
    }
    catch (err) {
        console.error(`[automation-engine] failed to register schedule for rule ${ruleId}:`, err);
    }
}
export async function reloadRule(ruleId) {
    if (!_boss || !_db)
        return;
    // Remove existing schedule
    try {
        await _boss.unschedule(`rule-schedule-${ruleId}`);
    }
    catch {
        // Schedule may not exist, ignore
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const rules = await _db
        .select()
        .from(schema.automationRules)
        .where(eq(schema.automationRules.id, ruleId))
        .limit(1);
    const rule = rules[0];
    if (rule?.enabled) {
        const def = rule.workflowDefinition;
        const triggerNode = def?.nodes?.find((n) => n.type === "trigger_schedule");
        if (triggerNode) {
            const cron = triggerNode.data.cron;
            if (cron) {
                await registerScheduleRule(ruleId, rule.salesId, cron);
            }
        }
    }
}
export async function fireEvent(event, payload, salesId) {
    if (!_boss || !_db)
        return;
    try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const rules = await _db
            .select()
            .from(schema.automationRules)
            .where(and(eq(schema.automationRules.salesId, salesId), eq(schema.automationRules.enabled, true)));
        for (const rule of rules) {
            const def = rule.workflowDefinition;
            const triggerNode = def?.nodes?.find((n) => n.type === "trigger_event");
            if (triggerNode) {
                const triggerEvent = triggerNode.data.event;
                if (triggerEvent === event) {
                    await _boss.send("run-automation", {
                        ruleId: rule.id,
                        salesId,
                        triggerData: payload,
                    });
                }
            }
        }
    }
    catch (err) {
        console.error("[automation-engine] fireEvent error:", err);
    }
}
/** Trigger a manual run for a specific rule. Sends job to run-automation queue. */
export async function triggerRunNow(ruleId, salesId) {
    if (!_boss)
        return false;
    try {
        await _boss.send("run-automation", {
            ruleId,
            salesId,
            triggerData: { manual: true },
        });
        return true;
    }
    catch (err) {
        console.error("[automation-engine] triggerRunNow error:", err);
        return false;
    }
}
async function runAutomation(ruleId, salesId, triggerData) {
    if (!_db || !_env)
        return;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = _db;
    const [run] = await db
        .insert(schema.automationRuns)
        .values({ ruleId, salesId, status: "running" })
        .returning();
    try {
        const rules = await db
            .select()
            .from(schema.automationRules)
            .where(eq(schema.automationRules.id, ruleId))
            .limit(1);
        const rule = rules[0];
        if (!rule)
            throw new Error(`Rule ${ruleId} not found`);
        const salesRows = await db
            .select()
            .from(schema.sales)
            .where(eq(schema.sales.id, salesId))
            .limit(1);
        const salesRow = salesRows[0];
        if (!salesRow)
            throw new Error(`Sales user ${salesId} not found`);
        const result = await executeWorkflow(rule.workflowDefinition, triggerData, { id: salesRow.id, basicsApiKey: salesRow.basicsApiKey }, _db, _env);
        await db
            .update(schema.automationRuns)
            .set({ status: "success", result, finishedAt: new Date() })
            .where(eq(schema.automationRuns.id, run.id));
        await db
            .update(schema.automationRules)
            .set({ lastRunAt: new Date() })
            .where(eq(schema.automationRules.id, ruleId));
    }
    catch (err) {
        const error = err instanceof Error ? err.message : String(err);
        console.error(`[automation-engine] run ${run?.id} failed:`, err);
        if (run?.id != null) {
            await (db)
                .update(schema.automationRuns)
                .set({ status: "error", error, finishedAt: new Date() })
                .where(eq(schema.automationRuns.id, run.id));
        }
    }
}
