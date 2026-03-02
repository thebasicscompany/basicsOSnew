# Automations — How They Work

## The Big Picture

An automation is a **workflow** that runs automatically when something happens in the CRM (a trigger) or on a schedule. Each workflow is a chain of nodes connected by edges. When a trigger fires, the nodes run one by one in order, and each node can pass data to the next.

```
[Trigger] → [Web Search] → [AI Task] → [CRM Action]
```

---

## Part 1: How a Workflow is Stored

Every automation you build in the UI is saved to the `automation_rules` table in the database as a single row. The entire canvas — all nodes and all the arrows connecting them — is stored as a JSON blob in the `workflow_definition` column:

```json
{
  "nodes": [
    { "id": "1", "type": "trigger_event", "data": { "event": "deal.created" } },
    { "id": "2", "type": "action_web_search", "data": { "query": "competitors of {{trigger_data.name}}" } },
    { "id": "3", "type": "action_ai", "data": { "prompt": "Summarize: {{web_results}}" } },
    { "id": "4", "type": "action_crm", "data": { "action": "create_deal_note", "params": { "dealId": "{{trigger_data.id}}", "text": "{{ai_result}}" } } }
  ],
  "edges": [
    { "id": "e1", "source": "1", "target": "2" },
    { "id": "e2", "source": "2", "target": "3" },
    { "id": "e3", "source": "3", "target": "4" }
  ]
}
```

The edges define the order — they tell the engine which node feeds into which.

---

## Part 2: How a Trigger Fires

### Event Triggers (e.g. `deal.created`)

When you create a deal in the CRM, the server's API route does two things:
1. Inserts the deal into the database and returns it.
2. Calls `fireEvent("deal.created", dealRecord, salesId)` in the background.

`fireEvent` then:
1. Loads all your **enabled** automation rules from the database.
2. For each rule, looks for a `trigger_event` node whose `event` field matches `"deal.created"`.
3. If it matches, sends a job to a queue called `run-automation` via **pg-boss** (a PostgreSQL-backed job queue).

The job contains:
- `ruleId` — which automation to run
- `salesId` — which user triggered it
- `triggerData` — the full deal/contact/task record that was just created

The queue is processed asynchronously — the API responds to the user immediately, and the automation runs in the background a moment later.

### Supported events
| Event | Fires when |
|---|---|
| `deal.created` | A new deal is created |
| `deal.updated` | A deal is edited |
| `deal.deleted` | A deal is deleted |
| `contact.created` | A new contact is created |
| `contact.updated` | A contact is edited |
| `task.created` | A new task is created |

### Schedule Triggers (e.g. "every day at 9am")

When the server starts, the engine loads all enabled rules that have a `trigger_schedule` node. For each one, it registers a **cron job** in pg-boss using the cron expression you configured (e.g. `0 9 * * *`).

When the cron fires, pg-boss sends a job to a per-rule queue (`rule-schedule-{ruleId}`), and the automation runs with an empty `triggerData` (`{}`).

> ⚠️ **Important**: Schedule rules are only registered at server startup. If you create or edit a schedule automation while the server is running, it won't take effect until the server restarts (or you call `reloadRule` internally).

---

## Part 3: How a Workflow Executes

Once a job is picked up from the queue, `runAutomation()` runs:

1. Creates an `automation_runs` row with status `"running"`.
2. Loads your automation rule from the database.
3. Loads your user record (to get your `basicsApiKey` for gateway calls).
4. Calls `executeWorkflow()`.
5. Updates the run to `"success"` or `"error"` with a full result/error log.

### Node ordering: Topological Sort

The executor uses **Kahn's algorithm** to figure out what order to run nodes. It follows the edges you drew on the canvas. This means:
- Nodes with no incoming edges run first (the trigger).
- Then nodes that depend on those, and so on.
- If you drew: `Trigger → Web Search → AI → CRM Action`, they run in exactly that order.

### The Context Object

As nodes execute, they build up a **context** — a shared bag of data that every subsequent node can read from:

```
context = {
  trigger_data: { ... },   ← always available: the record that fired the trigger
  sales_id: 42,            ← your user ID
  web_results: [ ... ],    ← set after a Web Search node runs
  ai_result: "...",        ← set after an AI Task node runs
  ai_agent_result: "...",  ← set after an AI Agent node runs
  gmail_messages: [ ... ], ← set after a Gmail Read node runs
  crm_result: { ... },     ← set after a CRM Action node runs
}
```

### Template Resolution

Before each node runs, every string value in its config is scanned for `{{variable}}` patterns. These are replaced with the actual value from the context at that moment.

For example, if the AI Task node has prompt:
```
Summarize competitors of {{trigger_data.name}}: {{web_results}}
```

The executor looks up `context.trigger_data.name` (e.g. `"Salesforce CRM Migration"`) and `context.web_results` (the JSON array from the search), and substitutes them in. The AI then receives the fully-resolved string.

**Dot-path access** works to any depth: `{{trigger_data.companyId}}`, `{{trigger_data.customFields.priority}}`, etc.

If a variable doesn't exist in the context, it is left as the literal `{{variable_name}}` — it does **not** throw an error.

---

## Part 4: What Each Node Does

### Trigger Nodes (no output — they just start the context)

| Node | Type | What it does |
|---|---|---|
| Event Trigger | `trigger_event` | Fires when a CRM event matches (e.g. `deal.created`) |
| Schedule Trigger | `trigger_schedule` | Fires on a cron schedule (e.g. daily at 9am) |

### Action Nodes

#### Web Search (`action_web_search`)
- Calls `POST https://api.basicsos.com/v1/execute/web/search` via the gateway.
- Uses the Exa search engine.
- **Config**: `query` (string), `numResults` (1–10)
- **Output**: Sets `{{web_results}}` in context — an array of `{ title, url, text }` objects, JSON-stringified when used in a template.

#### AI Task (`action_ai`)
- Calls the gateway's chat completions endpoint with your prompt.
- **Config**: `prompt` (string, supports `{{variables}}`)
- **Output**: Sets `{{ai_result}}` — a plain string (the model's response).
- **Model**: Defaults to `claude-sonnet-4-5-20251001`.

#### AI Agent (`action_ai_agent`)
- A more powerful version of AI Task. Can use CRM tools autonomously.
- Available tools: `getContacts`, `getDeals`, `createTask`, `updateDeal`.
- **Config**: `prompt` (string)
- **Output**: Sets `{{ai_agent_result}}`.

#### CRM Action (`action_crm`)
- Writes directly to the database. No gateway call.
- **Config**: `action` + `params`

| Action | Required params | What it creates |
|---|---|---|
| `create_task` | `contactId`, `text`, `type` | A task linked to a contact |
| `create_contact` | `firstName`, `lastName`, `email` | A new contact |
| `create_note` | `contactId`, `text` | A note on a contact |
| `create_deal_note` | `dealId`, `text` | A note on a deal |

- **Output**: Sets `{{crm_result}}` — the inserted database row.

#### Email (`action_email`)
- Sends an email via the gateway's email route.
- **Config**: `to`, `subject`, `body`

#### Gmail Read (`action_gmail_read`)
- Reads emails from a connected Gmail account.
- **Output**: Sets `{{gmail_messages}}` — array of `{ id, subject, from, snippet }`.

#### Gmail Send (`action_gmail_send`)
- Sends an email from a connected Gmail account.
- **Config**: `to`, `subject`, `body`

#### Slack (`action_slack`)
- Posts a message to a connected Slack workspace.
- **Config**: `channel` (e.g. `#sales`), `text`

---

## Part 5: The trigger_data Fields

The `trigger_data` object is the raw database record that caused the trigger. Field names are **camelCase** (matching the Drizzle schema).

### Contact fields
| Variable | Example value |
|---|---|
| `{{trigger_data.id}}` | `42` |
| `{{trigger_data.firstName}}` | `"Jane"` |
| `{{trigger_data.lastName}}` | `"Smith"` |
| `{{trigger_data.email}}` | `"jane@acme.com"` |
| `{{trigger_data.status}}` | `"warm"` |
| `{{trigger_data.companyId}}` | `7` |
| `{{trigger_data.salesId}}` | `1` |

### Deal fields
| Variable | Example value |
|---|---|
| `{{trigger_data.id}}` | `15` |
| `{{trigger_data.name}}` | `"Salesforce CRM Migration"` |
| `{{trigger_data.stage}}` | `"Opportunity"` |
| `{{trigger_data.amount}}` | `50000` |
| `{{trigger_data.companyId}}` | `7` |
| `{{trigger_data.description}}` | `"..."` |

### Task fields
| Variable | Example value |
|---|---|
| `{{trigger_data.id}}` | `99` |
| `{{trigger_data.text}}` | `"Follow up with Jane"` |
| `{{trigger_data.type}}` | `"Todo"` |
| `{{trigger_data.contactId}}` | `42` |

---

## Part 6: Seeing What Happened (Run Logs)

Every automation run is recorded in `automation_runs`. In the UI, click on an automation and open the run history panel. Each run shows:
- **Status**: `running`, `success`, or `error`
- **Duration**: how long it took
- **Result**: the full context object at the end (all variables resolved)
- **Error**: the error message if it failed

This is the best way to debug — the result shows exactly what each variable contained when the automation finished.

---

## Part 7: Common Gotchas

**Automation doesn't fire at all**
- Check that the rule is **enabled** (toggle in the list view).
- Check that the trigger event matches exactly (e.g. `deal.created` not `deals.created`).
- Check the server logs for `[automation-engine] fireEvent error`.

**Variables show up as `{{trigger_data.name}}`** (not resolved)
- The variable path doesn't exist in the context at that point.
- Check the field names are camelCase (e.g. `firstName` not `first_name`).
- Check that the upstream node ran successfully (if `{{web_results}}` is empty, the web search may have failed).

**`create_task` or `create_deal_note` fails**
- The ID field (`contactId`, `dealId`) must resolve to a valid number.
- Use `{{trigger_data.id}}` when the trigger is the thing you're linking to.

**Schedule automation doesn't run**
- Schedule rules only register at server startup. Restart the server after creating or editing a schedule rule.

**Gateway calls fail (AI, web search, email, Slack)**
- Your `basicsApiKey` must be set in your user settings.
- The gateway at `https://api.basicsos.com` must have the relevant env vars configured (`EXA_API_KEY`, `SLACK_CLIENT_ID`, etc.).
