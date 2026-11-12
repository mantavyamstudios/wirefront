// SPDX-License-Identifier: AGPL-3.0-only
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
/**
 * A screen's API contract: the backend operations it needs, described with
 * the same zod schemas the screen uses. Wirefront generates an OpenAPI 3.1
 * document and mock handlers from it, so the builder's backend has a spec to
 * implement and the screen can run against mocks before the backend exists.
 *
 *   export const api = defineApi({
 *     listMembers: { method: "GET", path: "/members", query: MembersQuery, response: MembersPage },
 *     removeMember: { method: "DELETE", path: "/members/{id}", params: z.object({ id: z.string() }) },
 *   });
 *
 * Paths use OpenAPI's {param} syntax. Name reusable schemas with
 * `.meta({ id: "Member" })` so they become named components.
 */
import type { z } from "zod";

export type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

export interface ApiOperation {
  method: HttpMethod;
  path: string;
  summary?: string;
  /** Path parameters; every {name} in the path must be a key. */
  params?: z.ZodObject;
  /** Query string parameters. */
  query?: z.ZodObject;
  /** Request body (JSON). */
  body?: z.ZodType;
  /** Success response body (JSON). Omit for 204 No Content. */
  response?: z.ZodType;
  /** Error responses the screen handles, status → description. */
  errors?: Record<number, string>;
}

export type ApiContract = Record<string, ApiOperation>;

/** Declare a screen's API contract (identity function, for types and tooling). */
export function defineApi<Contract extends ApiContract>(contract: Contract): Contract {
  for (const [name, op] of Object.entries(contract)) {
    const inPath = [...op.path.matchAll(/\{(\w+)\}/g)].map((m) => m[1]);
    const declared = op.params ? Object.keys(op.params.shape) : [];
    const missing = inPath.filter((p) => !declared.includes(p as string));
    if (missing.length) throw new Error(`${name}: path ${op.path} has {${missing.join("}, {")}} but no matching params`);
  }
  return contract;
}
