import { z } from "zod";

/** [start, end] for Content-Range pagination */
export const rangeSchema = z
  .tuple([z.number().int().min(0), z.number().int().min(0)])
  .refine(([a, b]) => a <= b, "range start must be <= end");

/** Legacy filter object (e.g. { q: string, sector: string }) */
export const filterSchema = z.record(z.string(), z.unknown());

/** Generic filter for column-based filtering */
export const genericFilterSchema = z.object({
  field: z.string().min(1),
  op: z.string().min(1),
  value: z.string(),
});

export const genericFiltersSchema = z.array(genericFilterSchema);

export function parseRange(value: string | undefined): [number, number] {
  if (!value) return [0, 24];
  try {
    const parsed = JSON.parse(value) as unknown;
    const result = rangeSchema.safeParse(parsed);
    return result.success ? result.data : [0, 24];
  } catch {
    return [0, 24];
  }
}

export function parseFilter(value: string | undefined): Record<string, unknown> {
  if (!value) return {};
  try {
    const parsed = JSON.parse(value) as unknown;
    const result = filterSchema.safeParse(parsed);
    return result.success ? result.data : {};
  } catch {
    return {};
  }
}

export function parseGenericFilters(
  value: string | undefined,
): Array<{ field: string; op: string; value: string }> {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed
      .map((x) => genericFilterSchema.safeParse(x))
      .filter((r): r is z.SafeParseSuccess<{ field: string; op: string; value: string }> => r.success)
      .map((r) => r.data);
  } catch {
    return [];
  }
}
