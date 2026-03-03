import * as schema from "../../db/schema/index.js";
export async function executeCrmAction(config, _context, db, salesId) {
    const { action, params = {} } = config;
    switch (action) {
        case "create_task": {
            const { text, type, dueDate, contactId } = params;
            if (!contactId)
                throw new Error("create_task requires a contactId");
            const [task] = await db.insert(schema.tasks).values({
                salesId,
                text: text ?? "",
                type: type ?? "Todo",
                dueDate: dueDate ? new Date(dueDate) : null,
                contactId,
            }).returning();
            return { crm_result: task };
        }
        case "create_contact": {
            const { firstName, lastName, email, status } = params;
            const [contact] = await db.insert(schema.contacts).values({
                salesId,
                firstName: firstName ?? null,
                lastName: lastName ?? null,
                email: email ?? null,
                status: status ?? "cold",
                firstSeen: new Date(),
                lastSeen: new Date(),
            }).returning();
            return { crm_result: contact };
        }
        case "create_note": {
            const { contactId, text, status } = params;
            if (!contactId)
                throw new Error("create_note requires a contactId");
            const [note] = await db.insert(schema.contactNotes).values({
                salesId,
                contactId,
                text: text ?? "",
                status: status ?? "none",
                date: new Date(),
            }).returning();
            return { crm_result: note };
        }
        default:
            throw new Error(`Unknown CRM action: ${action}`);
    }
}
