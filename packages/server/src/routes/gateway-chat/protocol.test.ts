import { describe, expect, it } from "vitest";
import {
  createEmptyThreadEntityMemory,
  deriveToolAnswer,
  extractRecordReferences,
  resolveThreadEntityReference,
  updateThreadEntityMemory,
} from "@/routes/gateway-chat/protocol.js";

describe("deriveToolAnswer", () => {
  it("answers latest plural lookup queries directly from search results", () => {
    const answer = deriveToolAnswer("what are my latest deals", [
      {
        name: "search_deals",
        result: [
          "1. [[deals/42|Enterprise Renewal]] — Status: opportunity — $12,000",
          "2. [[deals/41|Expansion Pilot]] — Status: won — $3,500",
        ].join("\n"),
      },
    ]);

    expect(answer).toContain("Here are your latest deals:");
    expect(answer).toContain("Enterprise Renewal");
    expect(answer).toContain("Expansion Pilot");
  });

  it("answers latest singular lookup queries directly from the first result", () => {
    const answer = deriveToolAnswer("what is my latest deal", [
      {
        name: "search_deals",
        result: [
          "1. [[deals/42|Enterprise Renewal]] — Status: opportunity — $12,000",
          "2. [[deals/41|Expansion Pilot]] — Status: won — $3,500",
        ].join("\n"),
      },
    ]);

    expect(answer).toContain("Your latest deal is");
    expect(answer).toContain("Enterprise Renewal");
    expect(answer).not.toContain("Expansion Pilot");
  });

  it("does not short-circuit advice queries from get_deal lookup output", () => {
    const answer = deriveToolAnswer("what do you think about the deal", [
      {
        name: "get_deal",
        result: "Found: [[deals/42|Enterprise Renewal]] — Status: in-negotiation — $12,000",
      },
    ]);

    expect(answer).toBe("");
  });
});

describe("resolveThreadEntityReference", () => {
  it("resolves entity-specific follow-ups from structured thread memory", () => {
    let memory = createEmptyThreadEntityMemory();
    memory = updateThreadEntityMemory(
      memory,
      extractRecordReferences("[Acme](/objects/companies/7) — Category: software"),
    );
    memory = updateThreadEntityMemory(
      memory,
      extractRecordReferences("[touching company](/objects/deals/42) — Status: in-negotiation"),
    );

    expect(resolveThreadEntityReference("what do you think about the deal", memory)).toEqual({
      mode: "resolved",
      record: {
        entity: "deal",
        id: 42,
        name: "touching company",
      },
    });
    expect(resolveThreadEntityReference("what do you think about the company", memory)).toEqual({
      mode: "resolved",
      record: {
        entity: "company",
        id: 7,
        name: "Acme",
      },
    });
  });

  it("returns ambiguity when the last batch for an entity has multiple matches", () => {
    let memory = createEmptyThreadEntityMemory();
    memory = updateThreadEntityMemory(
      memory,
      extractRecordReferences(
        [
          "Here are your latest deals:",
          "- [touching company](/objects/deals/42) — Status: in-negotiation",
          "- [Expansion Pilot](/objects/deals/41) — Status: won",
        ].join("\n"),
      ),
    );

    expect(resolveThreadEntityReference("what do you think about the deal", memory)).toEqual({
      mode: "ambiguous",
      entity: "deal",
      candidates: [
        {
          entity: "deal",
          id: 42,
          name: "touching company",
        },
        {
          entity: "deal",
          id: 41,
          name: "Expansion Pilot",
        },
      ],
    });
  });

  it("uses current focus for pronoun-only follow-ups", () => {
    let memory = createEmptyThreadEntityMemory();
    memory = updateThreadEntityMemory(
      memory,
      extractRecordReferences("[touching company](/objects/deals/42) — Status: in-negotiation"),
    );

    expect(resolveThreadEntityReference("what do you think about it", memory)).toEqual({
      mode: "resolved",
      record: {
        entity: "deal",
        id: 42,
        name: "touching company",
      },
    });
  });
});
