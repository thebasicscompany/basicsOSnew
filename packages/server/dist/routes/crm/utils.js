const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}:\d{2})?/;
/**
 * Converts snake_case keys to camelCase. Used for request body parsing (HTTP concern).
 */
export function snakeToCamel(obj) {
    const result = {};
    for (const [k, v] of Object.entries(obj)) {
        if (v === undefined)
            continue;
        const camel = k.replace(/_([a-z])/g, (_, c) => c.toUpperCase());
        result[camel] =
            typeof v === "string" && ISO_DATE_RE.test(v) ? new Date(v) : v;
    }
    return result;
}
