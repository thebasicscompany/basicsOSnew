#!/usr/bin/env node
/**
 * End-to-end CRM API checks: create → read → update → delete.
 *
 * Usage:
 *   CRM_API_TOKEN=bos_crm_... API_URL=http://localhost:3001 node scripts/crm-api-e2e.mjs
 *
 * PowerShell:
 *   $env:CRM_API_TOKEN="bos_crm_..."; $env:API_URL="http://localhost:3001"; node scripts/crm-api-e2e.mjs
 */

const API_URL = (process.env.API_URL ?? "http://localhost:3001").replace(/\/+$/, "");
const TOKEN = process.env.CRM_API_TOKEN ?? "";

if (!TOKEN) {
  console.error("Set CRM_API_TOKEN to a bos_crm_… personal access token.");
  process.exit(1);
}

const stamp = `e2e-${Date.now()}`;
const results = [];

async function req(method, path, body) {
  const url = `${API_URL}${path}`;
  const init = {
    method,
    headers: {
      Authorization: `Bearer ${TOKEN}`,
      "Content-Type": "application/json",
    },
  };
  if (body !== undefined) init.body = JSON.stringify(body);
  const res = await fetch(url, init);
  const text = await res.text();
  let json;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = { _raw: text };
  }
  return { status: res.status, json, path, method };
}

function ok(name, r, expect = (s) => s >= 200 && s < 300) {
  const pass = expect(r.status);
  results.push({ name, pass, status: r.status, path: `${r.method} ${r.path}` });
  const icon = pass ? "OK" : "FAIL";
  console.log(`[${icon}] ${name} → ${r.status} ${r.path}`);
  if (!pass) console.log("       ", JSON.stringify(r.json)?.slice(0, 400));
  return pass;
}

async function main() {
  console.log(`API_URL=${API_URL}\n`);

  // Public
  let r = await req("GET", "/health");
  ok("GET /health", r);

  // Me
  r = await req("GET", "/api/me");
  if (!ok("GET /api/me", r)) process.exit(1);

  const ids = {};

  // Company
  r = await req("POST", "/api/companies", {
    name: `Co ${stamp}`,
    domain: `${stamp}.example.test`,
  });
  if (!ok("POST /api/companies (create)", r)) process.exit(1);
  ids.company = r.json.id;
  if (!ids.company) {
    console.error("No company id in response", r.json);
    process.exit(1);
  }

  r = await req("GET", `/api/companies/${ids.company}`);
  ok("GET /api/companies/:id", r);

  r = await req("PUT", `/api/companies/${ids.company}`, {
    name: `Co ${stamp} (edited)`,
  });
  ok("PUT /api/companies/:id", r);

  // Contact
  r = await req("POST", "/api/contacts", {
    firstName: "E2E",
    lastName: stamp,
    email: `${stamp}@example.test`,
    companyId: ids.company,
  });
  if (!ok("POST /api/contacts (create)", r)) process.exit(1);
  ids.contact = r.json.id;

  r = await req("PUT", `/api/contacts/${ids.contact}`, {
    lastName: `${stamp}-x`,
  });
  ok("PUT /api/contacts/:id", r);

  // Deal
  r = await req("POST", "/api/deals", {
    name: `Deal ${stamp}`,
    companyId: ids.company,
    status: "open",
    amount: 1234.56,
  });
  if (!ok("POST /api/deals (create)", r)) process.exit(1);
  ids.deal = r.json.id;

  r = await req("PUT", `/api/deals/${ids.deal}`, {
    name: `Deal ${stamp} (edited)`,
    amount: 2000.5,
  });
  ok("PUT /api/deals/:id", r);

  // Task
  r = await req("POST", "/api/tasks", {
    text: `Task ${stamp}`,
    companyId: ids.company,
    dealId: ids.deal,
  });
  if (!ok("POST /api/tasks (create)", r)) process.exit(1);
  ids.task = r.json.id;

  r = await req("PUT", `/api/tasks/${ids.task}`, {
    text: `Task ${stamp} done`,
  });
  ok("PUT /api/tasks/:id", r);

  // Tag
  r = await req("POST", "/api/tags", {
    name: `tag-${stamp}`,
    color: "#336699",
  });
  if (!ok("POST /api/tags (create)", r)) process.exit(1);
  ids.tag = r.json.id;

  r = await req("PUT", `/api/tags/${ids.tag}`, { color: "#993366" });
  ok("PUT /api/tags/:id", r);

  // Notes
  r = await req("POST", "/api/contact_notes", {
    contactId: ids.contact,
    title: "E2E note",
    text: "hello",
  });
  if (!ok("POST /api/contact_notes (create)", r)) process.exit(1);
  ids.contactNote = r.json.id;

  r = await req("PUT", `/api/contact_notes/${ids.contactNote}`, {
    text: "hello (edited)",
  });
  ok("PUT /api/contact_notes/:id", r);

  r = await req("POST", "/api/company_notes", {
    companyId: ids.company,
    title: "E2E co note",
    text: "note",
  });
  if (!ok("POST /api/company_notes (create)", r)) process.exit(1);
  ids.companyNote = r.json.id;

  r = await req("PUT", `/api/company_notes/${ids.companyNote}`, {
    text: "note (edited)",
  });
  ok("PUT /api/company_notes/:id", r);

  r = await req("POST", "/api/deal_notes", {
    dealId: ids.deal,
    title: "E2E deal note",
    text: "dn",
  });
  if (!ok("POST /api/deal_notes (create)", r)) process.exit(1);
  ids.dealNote = r.json.id;

  r = await req("PUT", `/api/deal_notes/${ids.dealNote}`, {
    text: "dn (edited)",
  });
  ok("PUT /api/deal_notes/:id", r);

  // List (Content-Range)
  r = await req("GET", "/api/contacts?range=[0,9]");
  ok("GET /api/contacts?range=", r);

  // Gateway chat start (needs org AI config)
  r = await req("POST", "/api/gateway-chat/start", {});
  ok(
    "POST /api/gateway-chat/start",
    r,
    (s) => (s >= 200 && s < 300) || s === 400 || s === 403 || s === 404 || s === 503,
  );
  if (r.status === 200 && r.json?.threadId) {
    ids.threadId = r.json.threadId;
    const tr = await req("GET", `/api/threads/${ids.threadId}/messages`);
    ok("GET /api/threads/:id/messages", tr);
  }

  // Views
  r = await req("GET", "/api/views/contacts");
  ok("GET /api/views/contacts", r);

  // Api tokens list (no create — avoid extra secrets)
  r = await req("GET", "/api/api-tokens");
  ok("GET /api/api-tokens", r);

  // --- Cleanup: delete in dependency order ---
  const del = async (resource, id, label) => {
    const d = await req("DELETE", `/api/${resource}/${id}`);
    ok(`DELETE /api/${resource}/:id (${label})`, d);
  };

  await del("deal_notes", ids.dealNote, "deal note");
  await del("contact_notes", ids.contactNote, "contact note");
  await del("company_notes", ids.companyNote, "company note");
  await del("tasks", ids.task, "task");
  await del("deals", ids.deal, "deal");
  await del("contacts", ids.contact, "contact");
  await del("tags", ids.tag, "tag");
  await del("companies", ids.company, "company");

  const failed = results.filter((x) => !x.pass);
  console.log("\n---");
  if (failed.length === 0) {
    console.log(`All ${results.length} checks passed.`);
    process.exit(0);
  }
  console.log(`${failed.length} failed:`);
  for (const f of failed) console.log(`  - ${f.name} (${f.status}) ${f.path}`);
  process.exit(1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
