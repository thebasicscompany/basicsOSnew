import * as schema from "../../db/schema/index.js";
export const CRM_RESOURCES = [
    "contacts",
    "companies",
    "deals",
    "contact_notes",
    "deal_notes",
    "tasks",
    "sales",
    "tags",
    "configuration",
    "automation_rules",
    "companies_summary",
    "contacts_summary",
];
export const TABLE_MAP = {
    contacts: schema.contacts,
    companies: schema.companies,
    deals: schema.deals,
    contact_notes: schema.contactNotes,
    deal_notes: schema.dealNotes,
    tasks: schema.tasks,
    sales: schema.sales,
    tags: schema.tags,
    configuration: schema.configuration,
    automation_rules: schema.automationRules,
};
export function hasSalesId(resource) {
    return [
        "companies",
        "deals",
        "contact_notes",
        "deal_notes",
        "tasks",
        "sales",
        "automation_rules",
    ].includes(resource);
}
