// SPDX-License-Identifier: AGPL-3.0-only
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
/** API contracts → OpenAPI 3.1 and MSW handlers (scripts/lib/openapi.ts). */
import { describe, expect, it } from "vitest";
import { z } from "zod";
import { defineApi } from "@wirefront/ui/wirefront/api";
import { toMswHandlers, toOpenApi } from "../../../scripts/lib/openapi";

const Member = z
  .object({ id: z.string(), name: z.string(), email: z.email(), role: z.enum(["owner", "admin", "member"]) })
  .meta({ id: "Member" });
const MembersPage = z.object({ items: z.array(Member), total: z.number().int() }).meta({ id: "MembersPage" });

const api = defineApi({
  listMembers: {
    method: "GET",
    path: "/members",
    summary: "List members",
    query: z.object({ page: z.number().int().min(1), pageSize: z.number().int().optional(), search: z.string().optional() }),
    response: MembersPage,
  },
  inviteMember: {
    method: "POST",
    path: "/members/invitations",
    body: z.object({ email: z.email(), role: z.enum(["admin", "member"]) }),
    response: Member,
    errors: { 409: "Already a member" },
  },
  removeMember: { method: "DELETE", path: "/members/{id}", params: z.object({ id: z.string() }) },
});

type Doc = ReturnType<typeof toOpenApi> & {
  paths: Record<string, Record<string, Record<string, unknown>>>;
  components: { schemas: Record<string, unknown> };
};

function refs(value: unknown, out: string[] = []): string[] {
  if (Array.isArray(value)) for (const v of value) refs(v, out);
  else if (value && typeof value === "object")
    for (const [k, v] of Object.entries(value)) {
      if (k === "$ref" && typeof v === "string") out.push(v);
      else refs(v, out);
    }
  return out;
}

describe("toOpenApi", () => {
  const doc = toOpenApi(api, { title: "Members table" }) as Doc;

  it("produces an OpenAPI 3.1 document with every operation", () => {
    expect(doc.openapi).toBe("3.1.0");
    expect(doc.info).toEqual({ title: "Members table", version: "1.0.0" });
    expect(Object.keys(doc.paths).sort()).toEqual(["/members", "/members/invitations", "/members/{id}"]);
    expect(doc.paths["/members"]?.get?.operationId).toBe("listMembers");
    expect(doc.paths["/members/invitations"]?.post?.operationId).toBe("inviteMember");
    expect(doc.paths["/members/{id}"]?.delete?.operationId).toBe("removeMember");
  });

  it("names reusable schemas as components and every $ref resolves", () => {
    expect(Object.keys(doc.components.schemas).sort()).toEqual(["Member", "MembersPage"]);
    const all = refs(doc);
    expect(all.length).toBeGreaterThan(0);
    for (const r of all) {
      expect(r.startsWith("#/components/schemas/")).toBe(true);
      expect(doc.components.schemas[r.replace("#/components/schemas/", "")]).toBeDefined();
    }
  });

  it("marks path params required and optional query params optional", () => {
    const list = doc.paths["/members"]?.get?.parameters as { name: string; in: string; required: boolean }[];
    expect(list.map((p) => [p.name, p.in, p.required])).toEqual([
      ["page", "query", true],
      ["pageSize", "query", false],
      ["search", "query", false],
    ]);
    const remove = doc.paths["/members/{id}"]?.delete?.parameters as { name: string; in: string; required: boolean }[];
    expect(remove).toEqual([expect.objectContaining({ name: "id", in: "path", required: true })]);
  });

  it("describes bodies, success responses, 204s and declared errors", () => {
    const invite = doc.paths["/members/invitations"]?.post as { requestBody: unknown; responses: Record<string, unknown> };
    expect(invite.requestBody).toMatchObject({ required: true, content: { "application/json": { schema: { type: "object" } } } });
    expect(Object.keys(invite.responses).sort()).toEqual(["200", "409"]);
    expect(invite.responses["409"]).toEqual({ description: "Already a member" });
    const remove = doc.paths["/members/{id}"]?.delete as { responses: Record<string, unknown> } | undefined;
    expect(remove?.responses).toEqual({
      "204": { description: "No Content" },
    });
  });
});

describe("defineApi", () => {
  it("rejects a path parameter with no matching params schema", () => {
    expect(() => defineApi({ get: { method: "GET", path: "/members/{id}" } })).toThrow(/\{id\}/);
  });
});

describe("toMswHandlers", () => {
  it("writes one handler per operation, with MSW path params and fixtures", () => {
    const src = toMswHandlers(api, { contractImport: "./schema", fixturesImport: "./fixtures" });
    expect(src).toContain('import { http, HttpResponse, type HttpHandler } from "msw";');
    expect(src).toContain('http.get("/members", () => HttpResponse.json(fixtures.listMembers as never)),');
    expect(src).toContain('http.post("/members/invitations", () => HttpResponse.json(fixtures.inviteMember as never)),');
    expect(src).toContain('http.delete("/members/:id", () => new HttpResponse(null, { status: 204 })),');
  });
});
