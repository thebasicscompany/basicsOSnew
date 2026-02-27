import { getList, create } from "@/lib/api/crm";
import type { CrmTool } from "./types";

export const search_companies: CrmTool<
  { query?: string; sector?: string; limit?: number },
  { data: unknown[]; total: number }
> = {
  name: "search_companies",
  description:
    "Search and list companies. Use when the user asks about companies, organizations, or accounts. Supports free-text search on name, city, and sector.",
  parameters: {
    type: "object",
    properties: {
      query: {
        type: "string",
        description: "Free-text search across company name, city, and sector",
      },
      sector: {
        type: "string",
        description: "Filter by sector/industry",
      },
      limit: {
        type: "number",
        description: "Max number of results (default 25)",
      },
    },
    required: [],
  },
  async execute(params) {
    const filter: Record<string, unknown> = {};
    if (params.query?.trim()) filter.q = params.query.trim();
    if (params.sector) filter.sector = params.sector;
    const result = await getList("companies_summary", {
      filter: Object.keys(filter).length > 0 ? filter : undefined,
      pagination: { page: 1, perPage: params.limit ?? 25 },
    });
    return result;
  },
};

export const create_company: CrmTool<
  { name: string; sector?: string; city?: string; website?: string },
  unknown
> = {
  name: "create_company",
  description:
    "Create a new company. Use when the user wants to add an organization to the CRM.",
  parameters: {
    type: "object",
    properties: {
      name: { type: "string", description: "Company name" },
      sector: { type: "string", description: "Industry/sector" },
      city: { type: "string", description: "City" },
      website: { type: "string", description: "Website URL" },
    },
    required: ["name"],
  },
  async execute(params) {
    const data = await create("companies", {
      name: params.name,
      sector: params.sector,
      city: params.city,
      website: params.website,
    });
    return data;
  },
};
