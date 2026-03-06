import type { Resource } from "@/routes/crm/constants.js";

const WRITE_ALLOWLISTS: Record<Resource, readonly string[]> = {
  contacts: [
    "firstName",
    "lastName",
    "email",
    "companyId",
    "linkedinUrl",
    "customFields",
  ],
  companies: [
    "name",
    "domain",
    "description",
    "category",
    "customFields",
  ],
  deals: [
    "name",
    "companyId",
    "status",
    "amount",
    "customFields",
  ],
  contact_notes: ["contactId", "text", "date", "status", "attachments"],
  deal_notes: ["dealId", "type", "text", "date", "attachments"],
  tasks: ["contactId", "type", "text", "dueDate", "doneDate"],
  crm_users: [],
  tags: ["name", "color"],
  configuration: ["config"],
  automation_rules: ["name", "enabled", "workflowDefinition", "lastRunAt"],
  companies_summary: [],
  contacts_summary: [],
};

export function getWriteAllowlist(resource: Resource): Set<string> {
  return new Set(WRITE_ALLOWLISTS[resource] ?? []);
}
