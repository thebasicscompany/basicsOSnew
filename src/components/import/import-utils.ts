import Papa from "papaparse";

export interface ParsedCSV {
  headers: string[];
  rows: string[][];
  errors: { row: number; message: string }[];
}

const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5MB
const MAX_ROWS = 2000;

/** Per-object CSV header aliases → schema field (camelCase) */
const CONTACT_HEADER_ALIASES: Record<string, string> = {
  "first name": "firstName",
  firstname: "firstName",
  first_name: "firstName",
  "last name": "lastName",
  lastname: "lastName",
  last_name: "lastName",
  email: "email",
  "e-mail": "email",
  phone: "phone",
  telephone: "phone",
  mobile: "phone",
  title: "title",
  job: "title",
  "job title": "title",
  status: "status",
  gender: "gender",
  background: "background",
  linkedin: "linkedinUrl",
  "linkedin url": "linkedinUrl",
  "linkedin_url": "linkedinUrl",
};

const COMPANY_HEADER_ALIASES: Record<string, string> = {
  name: "name",
  "company name": "name",
  "company": "name",
  sector: "sector",
  size: "size",
  website: "website",
  "phone": "phoneNumber",
  "phone number": "phoneNumber",
  address: "address",
  city: "city",
  state: "stateAbbr",
  "state abbr": "stateAbbr",
  country: "country",
  zipcode: "zipcode",
  zip: "zipcode",
  description: "description",
  revenue: "revenue",
  linkedin: "linkedinUrl",
  "linkedin url": "linkedinUrl",
};

const DEAL_HEADER_ALIASES: Record<string, string> = {
  name: "name",
  "deal name": "name",
  stage: "stage",
  category: "category",
  amount: "amount",
  value: "amount",
  description: "description",
  "expected closing date": "expectedClosingDate",
  "closing date": "expectedClosingDate",
  "close date": "expectedClosingDate",
};

const ALIASES_BY_OBJECT: Record<string, Record<string, string>> = {
  contacts: CONTACT_HEADER_ALIASES,
  companies: COMPANY_HEADER_ALIASES,
  deals: DEAL_HEADER_ALIASES,
};

export function suggestColumnMapping(
  csvHeader: string,
  objectSlug: string,
): string | null {
  const normalized = csvHeader.trim().toLowerCase();
  const aliases = ALIASES_BY_OBJECT[objectSlug];
  return aliases?.[normalized] ?? null;
}

export function parseCSVFile(file: File): Promise<ParsedCSV> {
  return new Promise((resolve, reject) => {
    if (file.size > MAX_FILE_SIZE_BYTES) {
      reject(new Error(`File too large. Max size is ${MAX_FILE_SIZE_BYTES / 1024 / 1024}MB.`));
      return;
    }

    Papa.parse(file, {
      skipEmptyLines: true,
      complete(result) {
        const errors: { row: number; message: string }[] = (result.errors ?? []).map((e) => ({
          row: (e.row ?? 0) + 1,
          message: e.message ?? "Parse error",
        }));
        const rows = (result.data ?? []) as string[][];
        const headers = rows.length > 0 ? rows[0] : [];
        const dataRows = rows.slice(1);

        if (dataRows.length > MAX_ROWS) {
          errors.push({
            row: 0,
            message: `File has ${dataRows.length} rows. Max ${MAX_ROWS} rows per import.`,
          });
        }

        resolve({
          headers: headers.map((h) => (typeof h === "string" ? h : String(h)).trim()),
          rows: dataRows,
          errors,
        });
      },
      error(err) {
        reject(new Error(err.message ?? "Failed to parse CSV"));
      },
    });
  });
}

function buildContactPayload(
  row: string[],
  mapping: Record<string, number>,
  customFieldNames: Set<string>,
): Record<string, unknown> {
  const payload: Record<string, unknown> = {};
  const customFields: Record<string, unknown> = {};

  for (const [targetCol, csvIndex] of Object.entries(mapping)) {
    const value = row[csvIndex]?.trim();
    if (value === "" || value === undefined) continue;

    if (customFieldNames.has(targetCol)) {
      customFields[targetCol] = value;
    } else if (targetCol === "email") {
      payload.email = value;
      payload.emailJsonb = [{ email: value, type: "Work" }];
    } else if (targetCol === "phone") {
      payload.phoneJsonb = [{ number: value, type: "Work" }];
    } else {
      payload[targetCol] = value;
    }
  }

  if (Object.keys(customFields).length > 0) {
    payload.customFields = customFields;
  }

  return payload;
}

function buildCompanyPayload(
  row: string[],
  mapping: Record<string, number>,
  customFieldNames: Set<string>,
): Record<string, unknown> {
  const payload: Record<string, unknown> = {};
  const customFields: Record<string, unknown> = {};

  for (const [targetCol, csvIndex] of Object.entries(mapping)) {
    const value = row[csvIndex]?.trim();
    if (value === "" || value === undefined) continue;

    if (customFieldNames.has(targetCol)) {
      customFields[targetCol] = value;
    } else {
      payload[targetCol] = value;
    }
  }

  if (Object.keys(customFields).length > 0) {
    payload.customFields = customFields;
  }

  return payload;
}

function buildDealPayload(
  row: string[],
  mapping: Record<string, number>,
  customFieldNames: Set<string>,
): Record<string, unknown> {
  const payload: Record<string, unknown> = {};
  const customFields: Record<string, unknown> = {};

  for (const [targetCol, csvIndex] of Object.entries(mapping)) {
    const value = row[csvIndex]?.trim();
    if (value === "" || value === undefined) continue;

    if (customFieldNames.has(targetCol)) {
      customFields[targetCol] = value;
    } else if (targetCol === "amount") {
      const num = parseFloat(value.replace(/[^0-9.-]/g, ""));
      payload.amount = Number.isNaN(num) ? undefined : num;
    } else {
      payload[targetCol] = value;
    }
  }

  if (Object.keys(customFields).length > 0) {
    payload.customFields = customFields;
  }

  return payload;
}

export function buildImportPayload(
  objectSlug: string,
  row: string[],
  mapping: Record<string, number>,
  customFieldNames: Set<string>,
): Record<string, unknown> {
  switch (objectSlug) {
    case "contacts":
      return buildContactPayload(row, mapping, customFieldNames);
    case "companies":
      return buildCompanyPayload(row, mapping, customFieldNames);
    case "deals":
      return buildDealPayload(row, mapping, customFieldNames);
    default:
      return buildCompanyPayload(row, mapping, customFieldNames);
  }
}
