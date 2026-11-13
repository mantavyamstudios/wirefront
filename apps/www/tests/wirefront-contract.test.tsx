// SPDX-License-Identifier: AGPL-3.0-only
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
// @vitest-environment jsdom
/** The contract helpers every ready-to-wire screen builds on (packages/ui/src/wirefront). */
import { Field } from "@base-ui/react/field";
import { Form } from "@base-ui/react/form";
import { act, cleanup, fireEvent, render, renderHook, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { z } from "zod";
import { useAction } from "@wirefront/ui/wirefront/action";
import { useActionForm } from "@wirefront/ui/wirefront/form";
import { toggleSort, useSelection, withFilter, withPage, withPageSize, withSearch } from "@wirefront/ui/wirefront/list";
import {
  interpolate,
  useCan,
  useColorScheme,
  useFormat,
  useMessages,
  useWirefront,
  WirefrontLink,
  WirefrontProvider,
} from "@wirefront/ui/wirefront/provider";
import { fail, type ListQuery, ok, settle } from "@wirefront/ui/wirefront/types";

afterEach(() => {
  cleanup();
  document.documentElement.className = "";
});

describe("settle", () => {
  it("treats resolving with nothing as success, passes results through and turns throws into failures", async () => {
    expect(await settle(async () => {}, 1)).toEqual({ ok: true, data: undefined });
    expect(await settle(async () => ok(5), 1)).toEqual({ ok: true, data: 5 });
    expect(await settle(async () => fail("nope", { email: "taken" }), 1)).toEqual({ ok: false, error: "nope", fieldErrors: { email: "taken" } });
    expect(await settle(async () => Promise.reject(new Error("offline")), 1)).toEqual({ ok: false, error: "offline" });
  });
});

describe("list helpers", () => {
  const q: ListQuery = { page: 3, pageSize: 10 };

  it("cycles sort asc → desc → off and returns to page 1", () => {
    const a = toggleSort(q, "name");
    expect(a).toEqual({ page: 1, pageSize: 10, sort: { id: "name", direction: "asc" } });
    const d = toggleSort(a, "name");
    expect(d.sort).toEqual({ id: "name", direction: "desc" });
    expect(toggleSort(d, "name").sort).toBeUndefined();
    expect(toggleSort(d, "email").sort).toEqual({ id: "email", direction: "asc" });
  });

  it("resets to page 1 on search and filter changes, and drops empty values", () => {
    expect(withSearch(q, "ada")).toMatchObject({ page: 1, search: "ada" });
    expect(withSearch(q, "").search).toBeUndefined();
    const f = withFilter(q, "role", ["admin"]);
    expect(f).toMatchObject({ page: 1, filters: { role: ["admin"] } });
    expect(withFilter(f, "role", []).filters).toBeUndefined();
  });

  it("keeps pages in range and keeps the first row visible when the page size changes", () => {
    expect(withPage(q, 0).page).toBe(1);
    expect(withPage(q, 99, 45).page).toBe(5);
    expect(withPageSize({ page: 3, pageSize: 10 }, 25).page).toBe(1); // row 21 is on page 1 of 25
    expect(withPageSize({ page: 7, pageSize: 10 }, 25).page).toBe(3); // row 61 is on page 3 of 25
  });

  it("selection only counts rows still shown", () => {
    const { result, rerender } = renderHook(({ ids }) => useSelection(ids), { initialProps: { ids: ["a", "b", "c"] } });
    act(() => result.current.toggle("a"));
    act(() => result.current.toggle("b"));
    expect(result.current.someSelected).toBe(true);
    rerender({ ids: ["b", "c"] });
    expect([...result.current.selected]).toEqual(["b"]);
    act(() => result.current.toggleAll());
    expect(result.current.allSelected).toBe(true);
    act(() => result.current.clear());
    expect(result.current.selected.size).toBe(0);
  });
});

describe("useAction", () => {
  it("tracks pending per key and reports success", async () => {
    let finish: () => void = () => {};
    const action = vi.fn(() => new Promise<void>((r) => (finish = r)));
    const onSuccess = vi.fn();
    const { result } = renderHook(() => useAction(action, { onSuccess }));
    let run: Promise<unknown> = Promise.resolve();
    act(() => {
      run = result.current.run("row-1", "row-1");
    });
    expect(result.current.isPending("row-1")).toBe(true);
    expect(result.current.isPending("row-2")).toBe(false);
    await act(async () => {
      finish();
      await run;
    });
    expect(result.current.isPending()).toBe(false);
    expect(onSuccess).toHaveBeenCalledWith(undefined, "row-1");
  });

  it("applies an optimistic change and rolls it back when the action fails", async () => {
    const rows = ["a", "b"];
    const undo = vi.fn();
    const optimistic = vi.fn(() => undo);
    const onError = vi.fn();
    const { result } = renderHook(() => useAction(async () => Promise.reject(new Error("Not allowed")), { optimistic, onError }));
    await act(async () => {
      await result.current.run("a");
    });
    expect(optimistic).toHaveBeenCalledWith("a");
    expect(undo).toHaveBeenCalled();
    expect(onError).toHaveBeenCalledWith("Not allowed", "a");
    expect(result.current.error).toBe("Not allowed");
    expect(rows).toEqual(["a", "b"]);
  });
});

const InviteSchema = z.object({ email: z.email("Enter a valid email") });

function InviteForm({ action, onSuccess }: { action: (v: { email: string }) => Promise<unknown>; onSuccess?: () => void }) {
  const form = useActionForm({ schema: InviteSchema, action: action as never, onSuccess });
  return (
    <Form {...form.formProps} aria-label="invite">
      <Field.Root name="email">
        <Field.Label>Email</Field.Label>
        <Field.Control defaultValue="" />
        <Field.Error data-testid="email-error" />
      </Field.Root>
      {form.formError ? <p role="alert">{form.formError}</p> : null}
      <button type="submit" disabled={form.pending}>
        Invite
      </button>
    </Form>
  );
}

describe("useActionForm with Base UI Form", () => {
  const typeEmail = (value: string) => fireEvent.change(screen.getByLabelText("Email"), { target: { value } });
  const submit = () => fireEvent.submit(screen.getByRole("form", { name: "invite" }));

  it("shows the schema's error on the field and doesn't call the action", async () => {
    const action = vi.fn(async () => {});
    render(<InviteForm action={action} />);
    typeEmail("not-an-email");
    submit();
    await waitFor(() => expect(screen.getByTestId("email-error").textContent).toBe("Enter a valid email"));
    expect(action).not.toHaveBeenCalled();
  });

  it("calls the action with parsed values and reports success", async () => {
    const action = vi.fn(async () => {});
    const onSuccess = vi.fn();
    render(<InviteForm action={action} onSuccess={onSuccess} />);
    typeEmail("ada@example.com");
    submit();
    await waitFor(() => expect(onSuccess).toHaveBeenCalled());
    expect(action).toHaveBeenCalledWith({ email: "ada@example.com" });
  });

  it("never fails silently: errors no field can show become the form error", async () => {
    const schema = z.object({ email: z.email("Enter a valid email"), plan: z.enum(["free", "pro"], "Choose a plan") });
    const action = vi.fn(async () => {});
    const { result } = renderHook(() => useActionForm({ schema, action }));
    await act(() => result.current.submit({ email: "ada@example.com" }));
    expect(result.current.formError).toBe("Choose a plan");
    expect(action).not.toHaveBeenCalled();
  });

  it("puts the server's field errors on the field and its message in an alert", async () => {
    render(<InviteForm action={async () => fail("Couldn't invite", { email: "Already a member" })} />);
    typeEmail("ada@example.com");
    submit();
    await waitFor(() => expect(screen.getByTestId("email-error").textContent).toBe("Already a member"));
    expect(screen.getByRole("alert").textContent).toBe("Couldn't invite");
  });
});

function AppLink(props: React.AnchorHTMLAttributes<HTMLAnchorElement>) {
  return <a data-app-link="" {...props} />;
}

describe("WirefrontProvider", () => {
  it("keeps default functions stable across renders, so effects depending on them don't loop", () => {
    const { result, rerender } = renderHook(() => useWirefront());
    const first = result.current;
    rerender();
    expect(result.current.now).toBe(first.now);
    expect(result.current.can).toBe(first.can);
    expect(result.current.toast).toBe(first.toast);
  });

  it("formats with the provider's locale, time zone and currency (UTC and en-US by default)", () => {
    const at = new Date("2026-04-14T21:30:00Z");
    const plain = renderHook(() => useFormat()).result.current;
    expect(plain.time(at)).toBe("9:30 PM");
    expect(plain.money(1234.5)).toBe("$1,234.50");
    const indian = renderHook(() => useFormat(), {
      wrapper: ({ children }) => (
        <WirefrontProvider locale="en-IN" timeZone="Asia/Kolkata" currency="INR">
          {children}
        </WirefrontProvider>
      ),
    }).result.current;
    expect(indian.date(at, { dateStyle: "medium" })).toBe("15 Apr 2026");
    expect(indian.money(1234.5)).toBe("₹1,234.50");
  });

  it("formats relative times against the provider's clock", () => {
    const now = () => new Date("2026-04-14T12:00:00Z");
    const { result } = renderHook(() => useFormat(), {
      wrapper: ({ children }) => <WirefrontProvider now={now}>{children}</WirefrontProvider>,
    });
    expect(result.current.relative("2026-04-14T11:57:00Z")).toBe("3 minutes ago");
    expect(result.current.relative("2026-04-15T12:00:00Z")).toBe("tomorrow");
  });

  it("applies copy overrides by namespace and interpolates placeholders", () => {
    const defaults = { invite: "Invite", count: "{n} members" };
    const { result } = renderHook(() => useMessages("membersTable", defaults), {
      wrapper: ({ children }) => <WirefrontProvider messages={{ "membersTable.invite": "Add people" }}>{children}</WirefrontProvider>,
    });
    expect(result.current.invite).toBe("Add people");
    expect(interpolate(result.current.count, { n: 4 })).toBe("4 members");
  });

  it("allows everything by default and uses the provider's permission check", () => {
    expect(renderHook(() => useCan()).result.current("delete", "member")).toBe(true);
    const { result } = renderHook(() => useCan(), {
      wrapper: ({ children }) => <WirefrontProvider can={(action) => action !== "delete"}>{children}</WirefrontProvider>,
    });
    expect(result.current("delete", "member")).toBe(false);
    expect(result.current("view")).toBe(true);
  });

  it("renders links with the app's link component, or <a> by default", () => {
    render(
      <>
        <WirefrontLink href="/plain">plain</WirefrontLink>
        <WirefrontProvider link={AppLink}>
          <WirefrontLink href="/app">app</WirefrontLink>
        </WirefrontProvider>
      </>,
    );
    expect(screen.getByText("plain").hasAttribute("data-app-link")).toBe(false);
    expect(screen.getByText("app").getAttribute("data-app-link")).toBe("");
  });

  it("follows the dark class on <html> unless the provider sets a colour scheme", async () => {
    const { result } = renderHook(() => useColorScheme());
    expect(result.current).toBe("light");
    act(() => document.documentElement.classList.add("dark"));
    await waitFor(() => expect(result.current).toBe("dark"));
    const forced = renderHook(() => useColorScheme(), {
      wrapper: ({ children }) => <WirefrontProvider colorScheme="light">{children}</WirefrontProvider>,
    });
    expect(forced.result.current).toBe("light");
  });
});
