import type { Db } from "../../db/client.js";
import * as schema from "../../db/schema/index.js";

export async function executeCrmAction(
  config: Record<string, unknown>,
  _context: Record<string, unknown>,
  db: Db,
  salesId: number,
): Promise<void> {
  const { action, params = {} } = config as {
    action: string;
    params?: Record<string, unknown>;
  };

  switch (action) {
    case "create_task": {
      const { text, type, dueDate, contactId } = params as {
        text?: string;
        type?: string;
        dueDate?: string;
        contactId?: number;
      };

      if (!contactId) throw new Error("create_task requires a contactId");

      await db.insert(schema.tasks).values({
        salesId,
        text: text ?? "",
        type: type ?? "Todo",
        dueDate: dueDate ? new Date(dueDate) : null,
        contactId,
      });
      break;
    }

    default:
      throw new Error(`Unknown CRM action: ${action}`);
  }
}
