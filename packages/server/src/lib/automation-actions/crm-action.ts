import type { Db } from "../../db/client.js";
import * as schema from "../../db/schema/index.js";
import { eq, and } from "drizzle-orm";

export async function executeCrmAction(
  config: Record<string, unknown>,
  _context: Record<string, unknown>,
  db: Db,
  salesId: number,
): Promise<Record<string, unknown>> {
  const { action, params = {} } = config as {
    action: string;
    params?: Record<string, unknown>;
  };

  switch (action) {
    case "create_task": {
      const { text, type, dueDate, contactId: rawContactId } = params as {
        text?: string;
        type?: string;
        dueDate?: string;
        contactId?: number | string;
      };
      const contactId = rawContactId ? Number(rawContactId) : undefined;

      if (!contactId) throw new Error("create_task requires a contactId");

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
      const { firstName, lastName, email, status } = params as {
        firstName?: string;
        lastName?: string;
        email?: string;
        status?: string;
      };

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

    case "create_deal_note": {
      const { dealId: rawDealId, text, type } = params as {
        dealId?: number | string;
        text?: string;
        type?: string;
      };
      const dealId = rawDealId ? Number(rawDealId) : undefined;

      if (!dealId) throw new Error("create_deal_note requires a dealId");

      const [note] = await db.insert(schema.dealNotes).values({
        salesId,
        dealId,
        text: text ?? "",
        type: type ?? null,
        date: new Date(),
      }).returning();
      return { crm_result: note };
    }

    case "create_note": {
      const { contactId: rawNoteContactId, text, status } = params as {
        contactId?: number | string;
        text?: string;
        status?: string;
      };
      const contactId = rawNoteContactId ? Number(rawNoteContactId) : undefined;

      if (!contactId) throw new Error("create_note requires a contactId");

      const [note] = await db.insert(schema.contactNotes).values({
        salesId,
        contactId,
        text: text ?? "",
        status: status ?? "none",
        date: new Date(),
      }).returning();
      return { crm_result: note };
    }

    case "update_contact": {
      const { contactId: rawContactId, firstName, lastName, email, status } = params as {
        contactId?: number | string;
        firstName?: string;
        lastName?: string;
        email?: string;
        status?: string;
      };
      const contactId = rawContactId ? Number(rawContactId) : undefined;
      if (!contactId) throw new Error("update_contact requires a contactId");

      const updates: Record<string, unknown> = {};
      if (firstName !== undefined) updates.firstName = firstName;
      if (lastName !== undefined) updates.lastName = lastName;
      if (email !== undefined) updates.email = email;
      if (status !== undefined) updates.status = status;

      const [contact] = await db
        .update(schema.contacts)
        .set(updates)
        .where(and(eq(schema.contacts.id, contactId), eq(schema.contacts.salesId, salesId)))
        .returning();
      if (!contact) throw new Error(`Contact ${contactId} not found`);
      return { crm_result: contact };
    }

    case "update_deal": {
      const { dealId: rawDealId, stage, amount, name } = params as {
        dealId?: number | string;
        stage?: string;
        amount?: number | string;
        name?: string;
      };
      const dealId = rawDealId ? Number(rawDealId) : undefined;
      if (!dealId) throw new Error("update_deal requires a dealId");

      const updates: Record<string, unknown> = {};
      if (stage !== undefined) updates.stage = stage;
      if (amount !== undefined) updates.amount = Number(amount);
      if (name !== undefined) updates.name = name;

      const [deal] = await db
        .update(schema.deals)
        .set(updates)
        .where(and(eq(schema.deals.id, dealId), eq(schema.deals.salesId, salesId)))
        .returning();
      if (!deal) throw new Error(`Deal ${dealId} not found`);
      return { crm_result: deal };
    }

    case "update_task": {
      const { taskId: rawTaskId, text, type, dueDate } = params as {
        taskId?: number | string;
        text?: string;
        type?: string;
        dueDate?: string;
      };
      const taskId = rawTaskId ? Number(rawTaskId) : undefined;
      if (!taskId) throw new Error("update_task requires a taskId");

      const updates: Record<string, unknown> = {};
      if (text !== undefined) updates.text = text;
      if (type !== undefined) updates.type = type;
      if (dueDate !== undefined) updates.dueDate = dueDate ? new Date(dueDate) : null;

      const [task] = await db
        .update(schema.tasks)
        .set(updates)
        .where(and(eq(schema.tasks.id, taskId), eq(schema.tasks.salesId, salesId)))
        .returning();
      if (!task) throw new Error(`Task ${taskId} not found`);
      return { crm_result: task };
    }

    default:
      throw new Error(`Unknown CRM action: ${action}`);
  }
}
