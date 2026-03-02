import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router";
import {
  addEdge,
  useNodesState,
  useEdgesState,
  useReactFlow,
  type Node,
  type Edge,
  type Connection,
  ReactFlowProvider,
  useOnSelectionChange,
  ConnectionMode,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getOne, create, update } from "basics-os/src/lib/api/crm";
import { fetchApi } from "basics-os/src/lib/api";
import { Button } from "basics-os/src/components/ui/button";
import { Input } from "basics-os/src/components/ui/input";
import { Label } from "basics-os/src/components/ui/label";
import { Textarea } from "basics-os/src/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "basics-os/src/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "basics-os/src/components/ui/dropdown-menu";
import { WorkflowCanvas } from "basics-os/src/components/ai-elements/canvas";
import { WorkflowControls } from "basics-os/src/components/ai-elements/controls";
import { WorkflowConnection } from "basics-os/src/components/ai-elements/connection";
import { WorkflowEdge } from "basics-os/src/components/ai-elements/edge";
import { AutomationRunsPanel } from "./AutomationRunsPanel";
import type { AutomationRule } from "./AutomationListPage";
import {
  TriggerEventNode,
  TriggerScheduleNode,
  EmailActionNode,
  AIActionNode,
  WebSearchActionNode,
  CrmActionNode,
  SlackActionNode,
  AIAgentNode,
  GmailReadNode,
  GmailSendNode,
  ConditionNode,
} from "./nodes";
import { VariablePicker, useInsertAtCursor, type Variable } from "./VariablePicker";
import { toast } from "sonner";
import { ChevronLeft, Loader2, Play, Plus, Save, Trash2, X } from "lucide-react";
import cronstrue from "cronstrue";

const NODE_TYPES = {
  trigger_event: TriggerEventNode,
  trigger_schedule: TriggerScheduleNode,
  action_email: EmailActionNode,
  action_ai: AIActionNode,
  action_web_search: WebSearchActionNode,
  action_crm: CrmActionNode,
  action_slack: SlackActionNode,
  action_ai_agent: AIAgentNode,
  action_gmail_read: GmailReadNode,
  action_gmail_send: GmailSendNode,
  action_condition: ConditionNode,
};

type WorkflowNode = Node<Record<string, unknown>, string>;
type WorkflowEdgeType = Edge;

const TRIGGER_ITEMS: { type: WorkflowNode["type"]; label: string; defaultData: Record<string, unknown> }[] = [
  { type: "trigger_event", label: "Event Trigger", defaultData: { event: "contact.created" } },
  { type: "trigger_schedule", label: "Schedule", defaultData: { cron: "0 9 * * 1", label: "Every Monday at 9am" } },
];

const ACTION_ITEMS: { type: WorkflowNode["type"]; label: string; defaultData: Record<string, unknown> }[] = [
  { type: "action_condition", label: "Condition / Filter", defaultData: { field: "", operator: "eq", value: "" } },
  { type: "action_email", label: "Send Email", defaultData: { to: "", subject: "", body: "" } },
  { type: "action_ai", label: "AI Task", defaultData: { prompt: "" } },
  { type: "action_web_search", label: "Web Search", defaultData: { query: "", numResults: 5 } },
  { type: "action_crm", label: "CRM Action", defaultData: { action: "create_task", params: { text: "", type: "task", contactId: undefined } } },
  { type: "action_slack", label: "Send Slack Message", defaultData: { channel: "", message: "" } },
  { type: "action_gmail_read", label: "Read Gmail", defaultData: { query: "is:unread", maxResults: 5 } },
  { type: "action_gmail_send", label: "Send Gmail", defaultData: { to: "", subject: "", body: "" } },
  { type: "action_ai_agent", label: "AI Agent", defaultData: { objective: "", model: "", maxSteps: 6 } },
];

// ── Sample payloads for trigger event preview ───────────────────────────────

const SAMPLE_PAYLOADS: Record<string, Record<string, unknown>> = {
  "contact.created": { id: 42, firstName: "Jane", lastName: "Smith", email: "jane@example.com", status: "warm", companyId: 7, salesId: 1, tags: ["vip"] },
  "contact.updated": { id: 42, firstName: "Jane", lastName: "Smith", email: "jane@example.com", status: "hot", companyId: 7, salesId: 1, tags: ["vip"] },
  "contact.deleted": { id: 42, firstName: "Jane", lastName: "Smith", email: "jane@example.com", status: "cold", companyId: 7, salesId: 1, tags: [] },
  "deal.created": { id: 11, name: "Acme Corp Deal", stage: "opportunity", amount: 15000, companyId: 7, contactIds: [42], salesId: 1, category: "expansion" },
  "deal.updated": { id: 11, name: "Acme Corp Deal", stage: "won", amount: 15000, companyId: 7, contactIds: [42], salesId: 1, category: "expansion" },
  "deal.deleted": { id: 11, name: "Acme Corp Deal", stage: "lost", amount: 15000, companyId: 7, contactIds: [42], salesId: 1, category: "expansion" },
  "task.created": { id: 99, text: "Follow up with Jane", type: "Todo", dueDate: "2026-03-10", contactId: 42, salesId: 1 },
  "task.updated": { id: 99, text: "Follow up with Jane", type: "Todo", dueDate: "2026-03-10", doneDate: null, contactId: 42, salesId: 1 },
  "task.completed": { id: 99, text: "Follow up with Jane", type: "Todo", dueDate: "2026-03-10", doneDate: "2026-03-08T09:00:00Z", contactId: 42, salesId: 1 },
};

const TRIGGER_PAYLOAD_FIELDS: Record<string, string[]> = {
  "contact.created": ["id", "firstName", "lastName", "email", "status", "companyId", "salesId", "tags"],
  "contact.updated": ["id", "firstName", "lastName", "email", "status", "companyId", "salesId", "tags"],
  "contact.deleted": ["id", "firstName", "lastName", "email", "status", "companyId", "salesId", "tags"],
  "deal.created": ["id", "name", "stage", "amount", "companyId", "contactIds", "salesId", "category"],
  "deal.updated": ["id", "name", "stage", "amount", "companyId", "contactIds", "salesId", "category"],
  "deal.deleted": ["id", "name", "stage", "amount", "companyId", "contactIds", "salesId", "category"],
  "task.created": ["id", "text", "type", "dueDate", "contactId", "salesId"],
  "task.updated": ["id", "text", "type", "dueDate", "doneDate", "contactId", "salesId"],
  "task.completed": ["id", "text", "type", "dueDate", "doneDate", "contactId", "salesId"],
};

const NODE_OUTPUT_KEY_MAP: Record<string, string> = {
  action_ai: "ai_result",
  action_web_search: "web_results",
  action_crm: "crm_result",
  action_slack: "slack_result",
  action_gmail_read: "gmail_messages",
  action_ai_agent: "ai_agent_result",
};

// ── Template gallery ────────────────────────────────────────────────────────

function newId() {
  return crypto.randomUUID().slice(0, 8);
}

interface Template {
  name: string;
  description: string;
  nodes: WorkflowNode[];
  edges: WorkflowEdgeType[];
}

function makeTemplates(): Template[] {
  const t1id = newId(), t1e1id = newId();
  const t2id = newId(), t2c1id = newId(), t2s1id = newId();
  const t3id = newId(), t3a1id = newId(), t3e1id = newId();
  const t4id = newId(), t4c1id = newId();
  return [
    {
      name: "Blank",
      description: "Start from scratch",
      nodes: [],
      edges: [],
    },
    {
      name: "Welcome new contact",
      description: "Send a welcome email when a contact is created",
      nodes: [
        { id: t1id, type: "trigger_event", position: { x: 100, y: 150 }, data: { event: "contact.created" } },
        { id: t1e1id, type: "action_email", position: { x: 340, y: 150 }, data: { to: "{{trigger_data.email}}", subject: "Welcome, {{trigger_data.firstName}}!", body: "Hi {{trigger_data.firstName}},\n\nWelcome! We're glad to have you." } },
      ],
      edges: [{ id: `e-${t1id}-${t1e1id}`, source: t1id, target: t1e1id, type: "animated" }],
    },
    {
      name: "Deal won notification",
      description: "Notify Slack when a deal stage is updated",
      nodes: [
        { id: t2id, type: "trigger_event", position: { x: 100, y: 150 }, data: { event: "deal.updated" } },
        { id: t2c1id, type: "action_condition", position: { x: 340, y: 150 }, data: { field: "{{trigger_data.stage}}", operator: "eq", value: "won" } },
        { id: t2s1id, type: "action_slack", position: { x: 580, y: 150 }, data: { channel: "#sales", message: "🎉 Deal won: {{trigger_data.name}} ({{trigger_data.amount}})" } },
      ],
      edges: [
        { id: `e-${t2id}-${t2c1id}`, source: t2id, target: t2c1id, type: "animated" },
        { id: `e-${t2c1id}-${t2s1id}`, source: t2c1id, target: t2s1id, type: "animated" },
      ],
    },
    {
      name: "Weekly AI digest",
      description: "Every Monday, run an AI summary and email it",
      nodes: [
        { id: t3id, type: "trigger_schedule", position: { x: 100, y: 150 }, data: { cron: "0 9 * * 1", label: "Every Monday at 9am" } },
        { id: t3a1id, type: "action_ai", position: { x: 340, y: 150 }, data: { prompt: "Summarize this week's key business updates and opportunities in 3 bullet points." } },
        { id: t3e1id, type: "action_email", position: { x: 580, y: 150 }, data: { to: "", subject: "Your weekly AI digest", body: "{{ai_result}}" } },
      ],
      edges: [
        { id: `e-${t3id}-${t3a1id}`, source: t3id, target: t3a1id, type: "animated" },
        { id: `e-${t3a1id}-${t3e1id}`, source: t3a1id, target: t3e1id, type: "animated" },
      ],
    },
    {
      name: "Auto follow-up task",
      description: "Create a follow-up task when a contact is added",
      nodes: [
        { id: t4id, type: "trigger_event", position: { x: 100, y: 150 }, data: { event: "contact.created" } },
        { id: t4c1id, type: "action_crm", position: { x: 340, y: 150 }, data: { action: "create_task", params: { text: "Follow up with {{trigger_data.firstName}} {{trigger_data.lastName}}", type: "Todo", contactId: "{{trigger_data.id}}" } } },
      ],
      edges: [{ id: `e-${t4id}-${t4c1id}`, source: t4id, target: t4c1id, type: "animated" }],
    },
  ];
}

// ── Available variables computation ────────────────────────────────────────

function getAvailableVariables(nodes: WorkflowNode[]): Variable[] {
  const vars: Variable[] = [
    { value: "sales_id", label: "Current user ID", group: "Context" },
  ];

  const triggerNode = nodes.find((n) => n.type === "trigger_event");
  if (triggerNode) {
    const event = (triggerNode.data?.event as string) ?? "";
    vars.push({ value: "trigger_data", label: "Full trigger payload", group: "Trigger data" });
    for (const f of TRIGGER_PAYLOAD_FIELDS[event] ?? []) {
      vars.push({ value: `trigger_data.${f}`, label: f, group: "Trigger data" });
    }
  }

  for (const n of nodes) {
    const key = NODE_OUTPUT_KEY_MAP[n.type ?? ""];
    if (key) {
      vars.push({ value: key, label: `Output from ${n.type?.replace("action_", "") ?? "node"}`, group: "Node outputs" });
    }
  }

  return vars;
}

const edgeTypes = { animated: WorkflowEdge.Animated };

// ── Template gallery overlay ────────────────────────────────────────────────

function TemplateGallery({
  templates,
  onSelect,
}: {
  templates: Template[];
  onSelect: (t: Template) => void;
}) {
  return (
    <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-background/95 backdrop-blur-sm p-8">
      <h2 className="mb-1 text-xl font-semibold">Choose a template</h2>
      <p className="mb-8 text-sm text-muted-foreground">Start from a template or build from scratch</p>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 max-w-3xl w-full">
        {templates.map((t) => (
          <button
            key={t.name}
            type="button"
            className="flex flex-col items-start gap-1 rounded-xl border p-4 text-left shadow-sm hover:border-primary hover:bg-muted/40 transition-colors"
            onClick={() => onSelect(t)}
          >
            <span className="font-medium text-sm">{t.name}</span>
            <span className="text-xs text-muted-foreground">{t.description}</span>
            {t.nodes.length > 0 && (
              <span className="mt-2 text-[10px] text-muted-foreground/60 font-mono">
                {t.nodes.length} node{t.nodes.length !== 1 ? "s" : ""}
              </span>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}

// ── Builder inner component ─────────────────────────────────────────────────

function BuilderInner() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isNew = id === undefined || id === "create";
  const ruleId = isNew ? null : parseInt(id!, 10);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [panelOpen, setPanelOpen] = useState(false);
  const [runsPanelOpen, setRunsPanelOpen] = useState(false);
  const [templateChosen, setTemplateChosen] = useState(!isNew);
  const [templates] = useState(() => makeTemplates());

  const { data: rule, isSuccess: ruleLoaded } = useQuery({
    queryKey: ["automation_rules", ruleId],
    queryFn: () => getOne<AutomationRule>("automation_rules", ruleId!),
    enabled: !!ruleId && !isNew,
  });

  const [nodes, setNodes, onNodesChange] = useNodesState<WorkflowNode>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<WorkflowEdgeType>([]);
  const reactFlowInstance = useReactFlow<WorkflowNode, WorkflowEdgeType>();

  useEffect(() => {
    if (!ruleLoaded || !rule) return;
    setName(rule.name ?? "");
    setDescription(rule.description ?? "");
    if (rule.workflowDefinition?.nodes?.length) {
      setNodes((rule.workflowDefinition.nodes as WorkflowNode[]).map((n) => ({ ...n, data: n.data ?? {} })));
    }
    if (rule.workflowDefinition?.edges?.length) {
      setEdges((rule.workflowDefinition.edges as WorkflowEdgeType[]).map((e) => ({ ...e, type: "animated" })));
    }
  }, [ruleLoaded, rule?.id]);

  useOnSelectionChange({
    onChange: ({ nodes: selectedNodes }) => {
      const nodeId = selectedNodes.length === 1 ? selectedNodes[0].id : null;
      setSelectedNodeId(nodeId);
      if (nodeId) setPanelOpen(true);
    },
  });

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge({ ...params, type: "animated" }, eds)),
    [setEdges]
  );

  const handleAddNode = useCallback(
    (type: WorkflowNode["type"], defaultData: Record<string, unknown>) => {
      const flowWrapper = document.querySelector(".react-flow");
      if (!flowWrapper || !reactFlowInstance.screenToFlowPosition) return;
      const rect = flowWrapper.getBoundingClientRect();
      const position = reactFlowInstance.screenToFlowPosition({
        x: rect.left + rect.width / 2,
        y: rect.top + rect.height / 2,
      });
      position.x -= 96;
      position.y -= 96;
      setNodes((nds) => nds.concat({ id: newId(), type, position, data: { ...defaultData } }));
    },
    [setNodes, reactFlowInstance]
  );

  const handleDeleteNode = useCallback(() => {
    if (!selectedNodeId) return;
    setNodes((nds) => nds.filter((n) => n.id !== selectedNodeId));
    setEdges((eds) => eds.filter((e) => e.source !== selectedNodeId && e.target !== selectedNodeId));
    setSelectedNodeId(null);
    setPanelOpen(false);
  }, [selectedNodeId, setNodes, setEdges]);

  const createRule = useMutation({
    mutationFn: (data: { name: string; description?: string; workflowDefinition: object; enabled: boolean }) =>
      create<AutomationRule>("automation_rules", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["automation_rules"] });
      toast.success("Automation saved");
      navigate("/automations");
    },
    onError: () => toast.error("Failed to save automation"),
  });

  const updateRule = useMutation({
    mutationFn: (data: { name?: string; description?: string; workflowDefinition?: object; enabled?: boolean }) =>
      update<AutomationRule>("automation_rules", ruleId!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["automation_rules"] });
      toast.success("Automation saved");
      navigate("/automations");
    },
    onError: () => toast.error("Failed to save automation"),
  });

  const triggerNow = useMutation({
    mutationFn: () =>
      fetchApi<{ ok: boolean }>("/api/automation-runs/trigger", {
        method: "POST",
        body: JSON.stringify({ ruleId }),
      }),
    onSuccess: () => {
      toast.success("Run triggered");
      setRunsPanelOpen(true);
    },
    onError: () => toast.error("Failed to trigger run"),
  });

  const isSaving = createRule.isPending || updateRule.isPending;

  function validateWorkflow(ns: WorkflowNode[], es: WorkflowEdgeType[]): string[] {
    const errors: string[] = [];
    const hasTrigger = ns.some((n) => n.type === "trigger_event" || n.type === "trigger_schedule");
    if (!hasTrigger) errors.push("No trigger node — add an Event Trigger or Schedule");

    const targetIds = new Set(es.map((e) => e.target));
    for (const node of ns) {
      if (node.type === "trigger_event" || node.type === "trigger_schedule") continue;
      if (!targetIds.has(node.id)) {
        errors.push(`Node "${node.type}" has no incoming connection`);
      }
    }

    for (const node of ns) {
      const d = node.data ?? {};
      if (node.type === "trigger_event" && !d.event) errors.push("Event Trigger: event must be selected");
      if (node.type === "trigger_schedule" && !d.cron) errors.push("Schedule Trigger: cron expression is required");
      if (node.type === "action_email" && (!d.to || !d.subject)) errors.push("Send Email: 'to' and 'subject' are required");
      if (node.type === "action_web_search" && !d.query) errors.push("Web Search: query is required");
      if ((node.type === "action_ai" || node.type === "action_ai_agent") && !(d.prompt || d.objective)) {
        errors.push(`${node.type === "action_ai" ? "AI Task" : "AI Agent"}: prompt/objective is required`);
      }
      if (node.type === "action_crm" && !d.action) errors.push("CRM Action: action must be selected");
      if (node.type === "action_condition" && (!d.field || !d.operator)) errors.push("Condition: field and operator are required");
    }
    return errors;
  }

  const onSave = () => {
    const validationErrors = validateWorkflow(nodes, edges);
    if (validationErrors.length > 0) {
      toast.error(`Fix these issues:\n• ${validationErrors.join("\n• ")}`);
      return;
    }
    const payload = {
      name: name.trim() || "Untitled Automation",
      description: description.trim() || undefined,
      workflowDefinition: {
        nodes: nodes.map((n) => ({ id: n.id, type: n.type, position: n.position, data: n.data })),
        edges: edges.map((e) => ({ id: e.id, source: e.source, target: e.target })),
      },
      enabled: true,
    };
    if (isNew) createRule.mutate(payload);
    else updateRule.mutate(payload);
  };

  const selectedNode = selectedNodeId ? nodes.find((n) => n.id === selectedNodeId) : null;

  const updateNodeData = useCallback(
    (nodeId: string, dataUpdate: Record<string, unknown>) => {
      setNodes((nds) =>
        nds.map((n) => (n.id === nodeId ? { ...n, data: { ...n.data, ...dataUpdate } } : n))
      );
    },
    [setNodes]
  );

  const availableVariables = getAvailableVariables(nodes);

  const handleSelectTemplate = (template: Template) => {
    setNodes(template.nodes);
    setEdges(template.edges);
    setTemplateChosen(true);
  };

  return (
    <div
      className="-mx-4 -mt-4 flex flex-col overflow-hidden"
      style={{ height: "100dvh" }}
    >
      <style>{`
        @keyframes workflow-dashdraw { to { stroke-dashoffset: -10; } }
      `}</style>

      {/* ── Top bar ─────────────────────────────────────────────── */}
      <div className="flex h-14 shrink-0 items-center gap-3 border-b bg-background px-4">
        <Button
          variant="ghost"
          size="sm"
          className="gap-1.5 text-muted-foreground hover:text-foreground"
          onClick={() => navigate("/automations")}
        >
          <ChevronLeft className="size-4" />
          Back
        </Button>

        <div className="h-5 w-px bg-border" />

        <div className="flex flex-col gap-0.5">
          <Input
            className="h-7 w-52 border-0 bg-transparent px-0 font-medium focus-visible:ring-0"
            placeholder="Untitled Automation"
            value={name}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setName(e.target.value)}
          />
          <Input
            className="h-5 w-52 border-0 bg-transparent px-0 text-xs text-muted-foreground focus-visible:ring-0"
            placeholder="Add a description…"
            value={description}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDescription(e.target.value)}
          />
        </div>

        <div className="ml-auto flex items-center gap-2">
          {/* Add node */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-1.5">
                <Plus className="size-4" />
                Add node
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Triggers</DropdownMenuLabel>
              {TRIGGER_ITEMS.map((item) => (
                <DropdownMenuItem key={item.type} onClick={() => handleAddNode(item.type, item.defaultData)}>
                  {item.label}
                </DropdownMenuItem>
              ))}
              <DropdownMenuSeparator />
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              {ACTION_ITEMS.map((item) => (
                <DropdownMenuItem key={item.type} onClick={() => handleAddNode(item.type, item.defaultData)}>
                  {item.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Run history + Run now (existing automations only) */}
          {!isNew && (
            <>
              <Button
                variant="ghost"
                size="sm"
                className="gap-1.5 text-muted-foreground"
                onClick={() => setRunsPanelOpen(true)}
              >
                <Play className="size-4" />
                History
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5"
                onClick={() => triggerNow.mutate()}
                disabled={triggerNow.isPending}
              >
                <Play className="size-4" />
                Run now
              </Button>
            </>
          )}

          {/* Save */}
          <Button size="sm" onClick={onSave} disabled={isSaving} className="gap-1.5">
            {isSaving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
            Save
          </Button>
        </div>
      </div>

      {/* ── Canvas + Properties panel ────────────────────────────── */}
      <div className="flex flex-1 min-h-0">
        {/* Canvas */}
        <div className="relative flex-1 min-w-0 bg-background">
          {/* Template gallery overlay */}
          {isNew && !templateChosen && (
            <TemplateGallery templates={templates} onSelect={handleSelectTemplate} />
          )}

          {/* Empty-canvas hint */}
          {templateChosen && nodes.length === 0 && (
            <div className="pointer-events-none absolute inset-0 z-10 flex flex-col items-center justify-center gap-2">
              <p className="text-sm font-medium text-muted-foreground">No nodes yet</p>
              <p className="text-xs text-muted-foreground/70">Click "Add node" above to build your workflow</p>
            </div>
          )}
          <WorkflowCanvas
            connectionLineComponent={WorkflowConnection}
            connectionMode={ConnectionMode.Strict}
            edgeTypes={edgeTypes}
            edges={edges}
            nodes={nodes}
            onConnect={onConnect}
            onEdgesChange={onEdgesChange}
            onNodesChange={onNodesChange}
            nodeTypes={NODE_TYPES}
          >
            <WorkflowControls />
          </WorkflowCanvas>
        </div>

        {/* Properties panel — only shown when a node is selected */}
        {panelOpen && selectedNode && (
          <div className="flex w-80 shrink-0 flex-col overflow-hidden border-l bg-background">
            {/* Panel header */}
            <div className="flex h-14 shrink-0 items-center border-b px-4">
              <h2 className="flex-1 font-semibold">Properties</h2>
              <Button
                variant="ghost"
                size="icon"
                className="size-8 text-muted-foreground hover:text-destructive"
                title="Delete node"
                onClick={handleDeleteNode}
              >
                <Trash2 className="size-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="size-8 text-muted-foreground"
                title="Close"
                onClick={() => setPanelOpen(false)}
              >
                <X className="size-4" />
              </Button>
            </div>

            {/* Panel body */}
            <div className="flex-1 overflow-y-auto p-4">
              <ConfigPanel
                node={selectedNode}
                onUpdate={(data) => updateNodeData(selectedNode.id, data)}
                availableVariables={availableVariables}
              />
            </div>
          </div>
        )}
      </div>

      {/* Run history sheet */}
      {ruleId && (
        <AutomationRunsPanel
          ruleId={runsPanelOpen ? ruleId : null}
          open={runsPanelOpen}
          onOpenChange={setRunsPanelOpen}
        />
      )}
    </div>
  );
}

// ── Variable hint ──────────────────────────────────────────────────────────────

function VariableHint({ outputsAiResult, outputsWebResults }: { outputsAiResult?: boolean; outputsWebResults?: boolean }) {
  return (
    <div className="space-y-1 rounded-md bg-muted p-3 text-xs text-muted-foreground">
      <p className="font-medium text-foreground">Available variables</p>
      <p><code className="font-mono">{"{{trigger_data}}"}</code> — full trigger payload</p>
      <p><code className="font-mono">{"{{trigger_data.id}}"}</code> — e.g. contact/deal/task ID</p>
      <p><code className="font-mono">{"{{trigger_data.firstName}}"}</code> — e.g. contact first name</p>
      <p><code className="font-mono">{"{{trigger_data.email}}"}</code> — e.g. contact email</p>
      <p><code className="font-mono">{"{{sales_id}}"}</code> — current user ID</p>
      {outputsAiResult && <p className="pt-1 font-medium text-foreground">Outputs: <code className="font-mono">{"{{ai_result}}"}</code></p>}
      {outputsWebResults && <p className="pt-1 font-medium text-foreground">Outputs: <code className="font-mono">{"{{web_results}}"}</code></p>}
    </div>
  );
}

// ── Field with variable picker ─────────────────────────────────────────────

function FieldRow({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      {children}
    </div>
  );
}

function InputWithPicker({
  value,
  onChange,
  placeholder,
  type,
  availableVariables,
  ...props
}: {
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  type?: string;
  availableVariables: Variable[];
  [key: string]: unknown;
}) {
  const { ref, insert } = useInsertAtCursor(value, onChange);
  return (
    <div className="flex gap-1">
      <Input
        ref={ref as React.Ref<HTMLInputElement>}
        type={type}
        value={value}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) => onChange(e.target.value)}
        placeholder={placeholder}
        className="flex-1"
        {...props}
      />
      <VariablePicker variables={availableVariables} onInsert={insert} />
    </div>
  );
}

function TextareaWithPicker({
  value,
  onChange,
  placeholder,
  rows,
  availableVariables,
}: {
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  rows?: number;
  availableVariables: Variable[];
}) {
  const { ref, insert } = useInsertAtCursor(value, onChange);
  return (
    <div className="flex gap-1 items-start">
      <Textarea
        ref={ref as React.Ref<HTMLTextAreaElement>}
        value={value}
        onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={rows ?? 4}
        className="flex-1"
      />
      <VariablePicker variables={availableVariables} onInsert={insert} />
    </div>
  );
}

// ── Config panel ───────────────────────────────────────────────────────────────

function ConfigPanel({
  node,
  onUpdate,
  availableVariables,
}: {
  node: WorkflowNode;
  onUpdate: (data: Record<string, unknown>) => void;
  availableVariables: Variable[];
}) {
  const data = node.data ?? {};
  const type = node.type;

  if (type === "trigger_event") {
    const event = (data.event as string) || "";
    const sample = event ? SAMPLE_PAYLOADS[event] : null;
    const [showSample, setShowSample] = useState(false);
    return (
      <div className="space-y-4">
        <div className="space-y-2">
          <Label>Event</Label>
          <Select value={event} onValueChange={(v: string) => onUpdate({ event: v })}>
            <SelectTrigger>
              <SelectValue placeholder="Select an event…" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="contact.created">Contact created</SelectItem>
              <SelectItem value="contact.updated">Contact updated</SelectItem>
              <SelectItem value="contact.deleted">Contact deleted</SelectItem>
              <SelectItem value="deal.created">Deal created</SelectItem>
              <SelectItem value="deal.updated">Deal updated</SelectItem>
              <SelectItem value="deal.deleted">Deal deleted</SelectItem>
              <SelectItem value="task.created">Task created</SelectItem>
              <SelectItem value="task.updated">Task updated</SelectItem>
              <SelectItem value="task.completed">Task completed</SelectItem>
            </SelectContent>
          </Select>
        </div>
        {sample && (
          <div className="space-y-1">
            <button
              type="button"
              className="text-xs text-primary hover:underline"
              onClick={() => setShowSample((s) => !s)}
            >
              {showSample ? "Hide sample data" : "View sample data"}
            </button>
            {showSample && (
              <pre className="text-xs bg-muted p-2 rounded overflow-auto max-h-48 leading-relaxed">
                {JSON.stringify(sample, null, 2)}
              </pre>
            )}
          </div>
        )}
      </div>
    );
  }

  if (type === "trigger_schedule") {
    const cron = (data.cron as string) || "";
    const label = (data.label as string) || "";
    const presets = [
      { cron: "0 * * * *", label: "Hourly" },
      { cron: "0 9 * * *", label: "Daily at 9am" },
      { cron: "0 9 * * 1", label: "Every Monday at 9am" },
    ];
    let cronHuman = "";
    if (cron) {
      try {
        cronHuman = cronstrue.toString(cron);
      } catch {
        // invalid cron
      }
    }
    return (
      <div className="space-y-4">
        <div className="space-y-2">
          <Label>Preset</Label>
          <div className="flex flex-wrap gap-2">
            {presets.map((p) => (
              <Button
                key={p.cron}
                size="sm"
                variant={cron === p.cron ? "default" : "outline"}
                onClick={() => onUpdate({ cron: p.cron, label: p.label })}
              >
                {p.label}
              </Button>
            ))}
          </div>
        </div>
        <div className="space-y-2">
          <Label>Cron expression</Label>
          <Input
            value={cron}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => onUpdate({ cron: e.target.value })}
            placeholder="0 9 * * 1"
          />
          {cronHuman && (
            <p className="text-xs text-muted-foreground">{cronHuman}</p>
          )}
        </div>
        <div className="space-y-2">
          <Label>Label</Label>
          <Input
            value={label}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => onUpdate({ label: e.target.value })}
            placeholder="Every Monday at 9am"
          />
        </div>
      </div>
    );
  }

  if (type === "action_condition") {
    const field = (data.field as string) || "";
    const operator = (data.operator as string) || "eq";
    const value = (data.value as string) || "";
    const hideValue = operator === "is_empty" || operator === "is_not_empty";
    return (
      <div className="space-y-4">
        <FieldRow label="Field">
          <InputWithPicker
            value={field}
            onChange={(v) => onUpdate({ field: v })}
            placeholder="{{trigger_data.status}}"
            availableVariables={availableVariables}
          />
        </FieldRow>
        <div className="space-y-1.5">
          <Label>Operator</Label>
          <Select value={operator} onValueChange={(v: string) => onUpdate({ operator: v })}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="eq">equals</SelectItem>
              <SelectItem value="ne">not equals</SelectItem>
              <SelectItem value="contains">contains</SelectItem>
              <SelectItem value="not_contains">not contains</SelectItem>
              <SelectItem value="gt">greater than</SelectItem>
              <SelectItem value="lt">less than</SelectItem>
              <SelectItem value="is_empty">is empty</SelectItem>
              <SelectItem value="is_not_empty">is not empty</SelectItem>
            </SelectContent>
          </Select>
        </div>
        {!hideValue && (
          <FieldRow label="Value">
            <InputWithPicker
              value={value}
              onChange={(v) => onUpdate({ value: v })}
              placeholder="hot"
              availableVariables={availableVariables}
            />
          </FieldRow>
        )}
        <div className="rounded-md bg-muted p-3 text-xs text-muted-foreground space-y-1">
          <p>If condition is not met, the workflow stops (recorded as "Condition not met").</p>
        </div>
      </div>
    );
  }

  if (type === "action_email") {
    const to = (data.to as string) || "";
    const subject = (data.subject as string) || "";
    const body = (data.body as string) || "";
    return (
      <div className="space-y-4">
        <FieldRow label="To">
          <InputWithPicker
            value={to}
            onChange={(v) => onUpdate({ to: v })}
            placeholder="{{trigger_data.email}}"
            availableVariables={availableVariables}
          />
        </FieldRow>
        <FieldRow label="Subject">
          <InputWithPicker
            value={subject}
            onChange={(v) => onUpdate({ subject: v })}
            placeholder="New deal: {{trigger_data.name}}"
            availableVariables={availableVariables}
          />
        </FieldRow>
        <FieldRow label="Body">
          <TextareaWithPicker
            value={body}
            onChange={(v) => onUpdate({ body: v })}
            placeholder="{{ai_result}}"
            availableVariables={availableVariables}
          />
        </FieldRow>
        <VariableHint />
      </div>
    );
  }

  if (type === "action_ai") {
    const prompt = (data.prompt as string) || "";
    const model = (data.model as string) || "";
    return (
      <div className="space-y-4">
        <FieldRow label="Prompt">
          <TextareaWithPicker
            value={prompt}
            onChange={(v) => onUpdate({ prompt: v })}
            placeholder="Summarize {{trigger_data}}"
            availableVariables={availableVariables}
          />
        </FieldRow>
        <div className="space-y-2">
          <Label>Model (optional)</Label>
          <Input
            value={model}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => onUpdate({ model: e.target.value })}
            placeholder="default"
          />
        </div>
        <VariableHint outputsAiResult />
      </div>
    );
  }

  if (type === "action_web_search") {
    const query = (data.query as string) || "";
    const numResults = (data.numResults as number) ?? 5;
    return (
      <div className="space-y-4">
        <FieldRow label="Query">
          <InputWithPicker
            value={query}
            onChange={(v) => onUpdate({ query: v })}
            placeholder="Use {{variables}}"
            availableVariables={availableVariables}
          />
        </FieldRow>
        <div className="space-y-2">
          <Label>Num results (1–10)</Label>
          <Input
            type="number"
            min={1}
            max={10}
            value={numResults}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              onUpdate({ numResults: parseInt(e.target.value, 10) || 5 })
            }
          />
        </div>
        <VariableHint outputsWebResults />
      </div>
    );
  }

  if (type === "action_crm") {
    const action = (data.action as string) || "create_task";
    const params = (data.params as Record<string, unknown>) ?? {};
    return (
      <div className="space-y-4">
        <div className="space-y-2">
          <Label>Action</Label>
          <Select value={action} onValueChange={(v: string) => onUpdate({ action: v, params: {} })}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="create_task">Create task</SelectItem>
              <SelectItem value="create_contact">Create contact</SelectItem>
              <SelectItem value="create_note">Create contact note</SelectItem>
              <SelectItem value="create_deal_note">Create deal note</SelectItem>
              <SelectItem value="update_contact">Update contact</SelectItem>
              <SelectItem value="update_deal">Update deal</SelectItem>
              <SelectItem value="update_task">Update task</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {action === "create_task" && (
          <>
            <FieldRow label="Task text">
              <InputWithPicker
                value={(params.text as string) ?? ""}
                onChange={(v) => onUpdate({ params: { ...params, text: v } })}
                placeholder="Follow up with {{trigger_data.firstName}} {{trigger_data.lastName}}"
                availableVariables={availableVariables}
              />
            </FieldRow>
            <div className="space-y-2">
              <Label>Type</Label>
              <Input
                value={(params.type as string) ?? "Todo"}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  onUpdate({ params: { ...params, type: e.target.value } })
                }
                placeholder="Todo"
              />
            </div>
            <FieldRow label="Contact ID">
              <InputWithPicker
                value={(params.contactId as string) ?? ""}
                onChange={(v) => onUpdate({ params: { ...params, contactId: v } })}
                placeholder="{{trigger_data.id}}"
                availableVariables={availableVariables}
              />
            </FieldRow>
          </>
        )}

        {action === "create_contact" && (
          <>
            <FieldRow label="First name">
              <InputWithPicker
                value={(params.firstName as string) ?? ""}
                onChange={(v) => onUpdate({ params: { ...params, firstName: v } })}
                placeholder="{{trigger_data.firstName}}"
                availableVariables={availableVariables}
              />
            </FieldRow>
            <FieldRow label="Last name">
              <InputWithPicker
                value={(params.lastName as string) ?? ""}
                onChange={(v) => onUpdate({ params: { ...params, lastName: v } })}
                placeholder="{{trigger_data.lastName}}"
                availableVariables={availableVariables}
              />
            </FieldRow>
            <FieldRow label="Email">
              <InputWithPicker
                value={(params.email as string) ?? ""}
                onChange={(v) => onUpdate({ params: { ...params, email: v } })}
                placeholder="{{trigger_data.email}}"
                availableVariables={availableVariables}
              />
            </FieldRow>
          </>
        )}

        {action === "create_note" && (
          <>
            <FieldRow label="Contact ID">
              <InputWithPicker
                value={(params.contactId as string) ?? ""}
                onChange={(v) => onUpdate({ params: { ...params, contactId: v } })}
                placeholder="{{trigger_data.id}}"
                availableVariables={availableVariables}
              />
            </FieldRow>
            <FieldRow label="Note text">
              <TextareaWithPicker
                value={(params.text as string) ?? ""}
                onChange={(v) => onUpdate({ params: { ...params, text: v } })}
                placeholder="{{ai_result}}"
                availableVariables={availableVariables}
              />
            </FieldRow>
          </>
        )}

        {action === "create_deal_note" && (
          <>
            <FieldRow label="Deal ID">
              <InputWithPicker
                value={(params.dealId as string) ?? ""}
                onChange={(v) => onUpdate({ params: { ...params, dealId: v } })}
                placeholder="{{trigger_data.id}}"
                availableVariables={availableVariables}
              />
            </FieldRow>
            <FieldRow label="Note text">
              <TextareaWithPicker
                value={(params.text as string) ?? ""}
                onChange={(v) => onUpdate({ params: { ...params, text: v } })}
                placeholder="{{ai_result}}"
                availableVariables={availableVariables}
              />
            </FieldRow>
          </>
        )}

        {action === "update_contact" && (
          <>
            <FieldRow label="Contact ID">
              <InputWithPicker
                value={(params.contactId as string) ?? ""}
                onChange={(v) => onUpdate({ params: { ...params, contactId: v } })}
                placeholder="{{trigger_data.id}}"
                availableVariables={availableVariables}
              />
            </FieldRow>
            <FieldRow label="First name">
              <InputWithPicker
                value={(params.firstName as string) ?? ""}
                onChange={(v) => onUpdate({ params: { ...params, firstName: v } })}
                placeholder="{{trigger_data.firstName}}"
                availableVariables={availableVariables}
              />
            </FieldRow>
            <FieldRow label="Last name">
              <InputWithPicker
                value={(params.lastName as string) ?? ""}
                onChange={(v) => onUpdate({ params: { ...params, lastName: v } })}
                placeholder="{{trigger_data.lastName}}"
                availableVariables={availableVariables}
              />
            </FieldRow>
            <FieldRow label="Email">
              <InputWithPicker
                value={(params.email as string) ?? ""}
                onChange={(v) => onUpdate({ params: { ...params, email: v } })}
                placeholder="{{trigger_data.email}}"
                availableVariables={availableVariables}
              />
            </FieldRow>
            <FieldRow label="Status">
              <InputWithPicker
                value={(params.status as string) ?? ""}
                onChange={(v) => onUpdate({ params: { ...params, status: v } })}
                placeholder="cold / warm / hot"
                availableVariables={availableVariables}
              />
            </FieldRow>
          </>
        )}

        {action === "update_deal" && (
          <>
            <FieldRow label="Deal ID">
              <InputWithPicker
                value={(params.dealId as string) ?? ""}
                onChange={(v) => onUpdate({ params: { ...params, dealId: v } })}
                placeholder="{{trigger_data.id}}"
                availableVariables={availableVariables}
              />
            </FieldRow>
            <FieldRow label="Name">
              <InputWithPicker
                value={(params.name as string) ?? ""}
                onChange={(v) => onUpdate({ params: { ...params, name: v } })}
                placeholder="{{trigger_data.name}}"
                availableVariables={availableVariables}
              />
            </FieldRow>
            <FieldRow label="Stage">
              <InputWithPicker
                value={(params.stage as string) ?? ""}
                onChange={(v) => onUpdate({ params: { ...params, stage: v } })}
                placeholder="opportunity / proposal / won"
                availableVariables={availableVariables}
              />
            </FieldRow>
            <div className="space-y-2">
              <Label>Amount</Label>
              <Input
                type="number"
                value={(params.amount as string) ?? ""}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  onUpdate({ params: { ...params, amount: e.target.value } })
                }
                placeholder="10000"
              />
            </div>
          </>
        )}

        {action === "update_task" && (
          <>
            <FieldRow label="Task ID">
              <InputWithPicker
                value={(params.taskId as string) ?? ""}
                onChange={(v) => onUpdate({ params: { ...params, taskId: v } })}
                placeholder="{{trigger_data.id}}"
                availableVariables={availableVariables}
              />
            </FieldRow>
            <FieldRow label="Task text">
              <InputWithPicker
                value={(params.text as string) ?? ""}
                onChange={(v) => onUpdate({ params: { ...params, text: v } })}
                placeholder="Follow up with client"
                availableVariables={availableVariables}
              />
            </FieldRow>
            <div className="space-y-2">
              <Label>Type</Label>
              <Input
                value={(params.type as string) ?? ""}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  onUpdate({ params: { ...params, type: e.target.value } })
                }
                placeholder="Todo"
              />
            </div>
            <div className="space-y-2">
              <Label>Due date</Label>
              <Input
                type="date"
                value={(params.dueDate as string) ?? ""}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  onUpdate({ params: { ...params, dueDate: e.target.value } })
                }
              />
            </div>
          </>
        )}

        <div className="space-y-1 rounded-md bg-muted p-3 text-xs text-muted-foreground">
          <p className="font-medium text-foreground">Outputs: <code className="font-mono">{"{{crm_result}}"}</code></p>
        </div>
        <VariableHint />
      </div>
    );
  }

  if (type === "action_slack") {
    const channel = (data.channel as string) || "";
    const message = (data.message as string) || "";
    return (
      <div className="space-y-4">
        <FieldRow label="Channel">
          <InputWithPicker
            value={channel}
            onChange={(v) => onUpdate({ channel: v })}
            placeholder="#general or @username"
            availableVariables={availableVariables}
          />
        </FieldRow>
        <FieldRow label="Message">
          <TextareaWithPicker
            value={message}
            onChange={(v) => onUpdate({ message: v })}
            placeholder="New deal: {{trigger_data.name}}"
            availableVariables={availableVariables}
          />
        </FieldRow>
        <VariableHint />
      </div>
    );
  }

  if (type === "action_gmail_read") {
    const query = (data.query as string) || "is:unread";
    const maxResults = (data.maxResults as number) ?? 5;
    return (
      <div className="space-y-4">
        <div className="space-y-2">
          <Label>Query</Label>
          <Input
            value={query}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => onUpdate({ query: e.target.value })}
            placeholder="is:unread from:boss@company.com"
          />
        </div>
        <div className="space-y-2">
          <Label>Max results</Label>
          <Input
            type="number"
            min={1}
            max={20}
            value={maxResults}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              onUpdate({ maxResults: parseInt(e.target.value, 10) || 5 })
            }
          />
        </div>
        <div className="space-y-1 rounded-md bg-muted p-3 text-xs text-muted-foreground">
          <p className="font-medium text-foreground">Outputs: <code className="font-mono">{"{{gmail_messages}}"}</code></p>
        </div>
      </div>
    );
  }

  if (type === "action_gmail_send") {
    const to = (data.to as string) || "";
    const subject = (data.subject as string) || "";
    const body = (data.body as string) || "";
    return (
      <div className="space-y-4">
        <FieldRow label="To">
          <InputWithPicker
            value={to}
            onChange={(v) => onUpdate({ to: v })}
            placeholder="recipient@example.com"
            availableVariables={availableVariables}
          />
        </FieldRow>
        <FieldRow label="Subject">
          <InputWithPicker
            value={subject}
            onChange={(v) => onUpdate({ subject: v })}
            placeholder="Update: {{trigger_data.name}}"
            availableVariables={availableVariables}
          />
        </FieldRow>
        <FieldRow label="Body">
          <TextareaWithPicker
            value={body}
            onChange={(v) => onUpdate({ body: v })}
            placeholder="{{ai_result}}"
            availableVariables={availableVariables}
          />
        </FieldRow>
        <VariableHint />
      </div>
    );
  }

  if (type === "action_ai_agent") {
    const objective = (data.objective as string) || "";
    const maxSteps = (data.maxSteps as number) ?? 6;
    return (
      <div className="space-y-4">
        <FieldRow label="Objective">
          <TextareaWithPicker
            value={objective}
            onChange={(v) => onUpdate({ objective: v })}
            placeholder="Find contacts from {{trigger_data.company}} and create a follow-up task"
            availableVariables={availableVariables}
          />
        </FieldRow>
        <div className="space-y-2">
          <Label>Max steps</Label>
          <Input
            type="number"
            min={1}
            max={10}
            value={maxSteps}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              onUpdate({ maxSteps: parseInt(e.target.value, 10) || 6 })
            }
          />
        </div>
        <div className="space-y-1 rounded-md bg-muted p-3 text-xs text-muted-foreground">
          <p className="font-medium text-foreground">Outputs: <code className="font-mono">{"{{ai_agent_result}}"}</code></p>
          <p>The agent has access to CRM tools: search contacts, deals, create tasks, update deals.</p>
        </div>
        <VariableHint />
      </div>
    );
  }

  return null;
}

// ── Export ─────────────────────────────────────────────────────────────────────

export function AutomationBuilderPage() {
  return (
    <ReactFlowProvider>
      <BuilderInner />
    </ReactFlowProvider>
  );
}
