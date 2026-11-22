// SPDX-License-Identifier: MIT
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
// @vitest-environment jsdom
/**
 * The wiring contract of the filter screens.
 */
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { WirefrontProvider } from "@wirefront/ui/wirefront/provider";
import { afterEach, describe, expect, it, vi } from "vitest";
import * as chipsFixtures from "@/pages/showcase/filter-chips/fixtures";
import {
  CustomerFilterChips,
  type CustomersListQuery,
} from "@/pages/showcase/filter-chips/view";
import * as facetedFixtures from "@/pages/showcase/filter-faceted/fixtures";
import {
  IssueFilterBar,
  type IssuesListQuery,
} from "@/pages/showcase/filter-faceted/view";
import * as sidebarFixtures from "@/pages/showcase/filter-sidebar/fixtures";
import {
  ProductFilterSidebar,
  type ProductsListQuery,
} from "@/pages/showcase/filter-sidebar/view";
import * as toolbarFixtures from "@/pages/showcase/filter-toolbar/fixtures";
import {
  type ProjectsListQuery,
  ProjectsToolbar,
  type ProjectsToolbarProps,
} from "@/pages/showcase/filter-toolbar/view";

afterEach(cleanup);

describe("ProjectsToolbar", () => {
  const items = toolbarFixtures.listProjects.items;
  const renderIt = (props: Partial<ProjectsToolbarProps> = {}) => {
    const onQueryChange = vi.fn<(q: ProjectsListQuery) => void>();
    render(
      <WirefrontProvider
        locale="en-US"
        now={() => new Date(toolbarFixtures.now)}
      >
        <ProjectsToolbar
          onQueryChange={onQueryChange}
          overall={16}
          projects={items}
          query={{ page: 1, pageSize: 5 }}
          total={12}
          {...props}
        />
      </WirefrontProvider>
    );
    return onQueryChange;
  };

  it("reports search as a query from page 1, and '/' focuses the search", () => {
    const onQueryChange = renderIt({ query: { page: 3, pageSize: 5 } });
    fireEvent.change(
      screen.getByRole("searchbox", { name: "Search projects" }),
      { target: { value: "atlas" } }
    );
    expect(onQueryChange).toHaveBeenLastCalledWith({
      page: 1,
      pageSize: 5,
      search: "atlas",
    });
    fireEvent.keyDown(window, { key: "/" });
    expect(document.activeElement).toBe(screen.getByRole("searchbox"));
  });

  it("shows the counts, formats activity from the provider's clock and pages through results", () => {
    const onQueryChange = renderIt();
    expect(screen.getByText("Showing 12 of 16 projects")).toBeTruthy();
    expect(screen.getByText("yesterday")).toBeTruthy();
    expect(screen.getByText("Page 1 of 3")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Next" }));
    expect(onQueryChange).toHaveBeenLastCalledWith({ page: 2, pageSize: 5 });
    expect(
      (screen.getByRole("button", { name: "Previous" }) as HTMLButtonElement)
        .disabled
    ).toBe(true);
  });

  it("counts active filters and clears them all", () => {
    const onQueryChange = renderIt({
      query: {
        page: 2,
        pageSize: 5,
        search: "a",
        filters: { status: "paused", owner: "me" },
      },
    });
    fireEvent.click(screen.getByRole("button", { name: /Clear \(3\)/ }));
    expect(onQueryChange).toHaveBeenLastCalledWith({
      page: 1,
      pageSize: 5,
      search: undefined,
      filters: undefined,
    });
  });

  it("applies a saved view and hides what isn't wired", () => {
    const onQueryChange = renderIt({ savedViews: toolbarFixtures.savedViews });
    expect(screen.queryByRole("button", { name: "View options" })).toBeNull();
    expect(screen.queryByRole("button", { name: /New view/ })).toBeNull();
    expect(screen.queryByRole("button", { name: /More filters/ })).toBeNull();
    expect(screen.queryByRole("link")).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Q2 — Active" }));
    expect(onQueryChange).toHaveBeenLastCalledWith(
      toolbarFixtures.defaultQuery
    );
  });

  it("links projects, and shows loading, error and empty states", () => {
    renderIt({ projectHref: (p) => `/projects/${p.id}` });
    expect(
      screen.getByRole("link", { name: items[0]?.name }).getAttribute("href")
    ).toBe(`/projects/${items[0]?.id}`);
    cleanup();
    const onRetry = vi.fn();
    renderIt({ status: "error", error: "Timed out.", onRetry });
    expect(screen.getByRole("alert").textContent).toContain("Timed out.");
    fireEvent.click(screen.getByRole("button", { name: "Try again" }));
    expect(onRetry).toHaveBeenCalled();
    cleanup();
    renderIt({ status: "loading" });
    expect(document.querySelector("[aria-busy='true']")).toBeTruthy();
    cleanup();
    const onQueryChange = renderIt({
      projects: [],
      total: 0,
      query: { page: 1, pageSize: 5, filters: { status: "archived" } },
    });
    expect(screen.getByText("No projects match these filters.")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Reset filters" }));
    expect(onQueryChange).toHaveBeenCalledWith({
      page: 1,
      pageSize: 5,
      search: undefined,
      filters: undefined,
    });
  });
});

describe("IssueFilterBar", () => {
  const renderIt = (
    query: IssuesListQuery,
    extra: { counts?: boolean } = {}
  ) => {
    const onQueryChange = vi.fn<(q: IssuesListQuery) => void>();
    render(
      <IssueFilterBar
        counts={
          extra.counts
            ? facetedFixtures.countFacets(facetedFixtures.issues)
            : undefined
        }
        issues={facetedFixtures.issues.slice(0, 3)}
        labels={facetedFixtures.listLabels}
        onQueryChange={onQueryChange}
        overall={18}
        people={facetedFixtures.listPeople}
        query={query}
        total={3}
      />
    );
    return onQueryChange;
  };

  it("announces each facet's selection and counts the filters", () => {
    renderIt({
      page: 1,
      pageSize: 20,
      filters: { status: ["todo", "done"], label: ["bug"] },
    });
    expect(
      screen.getByRole("button", { name: "Status: Todo, Done" })
    ).toBeTruthy();
    expect(
      screen.getByRole("button", { name: "Filter by Priority" })
    ).toBeTruthy();
    expect(screen.getByText("3 filters")).toBeTruthy();
    expect(screen.getByText(/3 of 18 issues/)).toBeTruthy();
    expect(screen.queryByRole("button", { name: /Add filter/ })).toBeNull();
  });

  it("adds a value to a facet from page 1, searches its options and shows counts", async () => {
    const onQueryChange = renderIt(
      { page: 2, pageSize: 20, filters: { assignee: ["ada"] } },
      { counts: true }
    );
    fireEvent.click(
      screen.getByRole("button", { name: "Assignee: Ada Lovelace" })
    );
    const group = await screen.findByRole("group", { name: "Assignee" });
    expect(group.textContent).toContain("Grace Hopper6");
    fireEvent.change(
      screen.getByRole("textbox", { name: "Filter assignee…" }),
      { target: { value: "lin" } }
    );
    expect(screen.queryByText("Grace Hopper")).toBeNull();
    fireEvent.click(screen.getByRole("checkbox", { name: /Linus Torvalds/ }));
    expect(onQueryChange).toHaveBeenLastCalledWith({
      page: 1,
      pageSize: 20,
      filters: { assignee: ["ada", "linus"] },
    });
  });

  it("clearing a facet's last value drops it from the query, and reset clears all", async () => {
    const onQueryChange = renderIt({
      page: 1,
      pageSize: 20,
      filters: { priority: ["high"], label: ["bug"] },
    });
    fireEvent.click(screen.getByRole("button", { name: "Priority: High" }));
    fireEvent.click(await screen.findByRole("button", { name: "Clear" }));
    expect(onQueryChange).toHaveBeenLastCalledWith({
      page: 1,
      pageSize: 20,
      filters: { label: ["bug"] },
    });
    fireEvent.click(
      screen.getAllByRole("button", { name: "Reset filters" })[0] as HTMLElement
    );
    expect(onQueryChange).toHaveBeenLastCalledWith({
      page: 1,
      pageSize: 20,
      filters: undefined,
    });
  });

  it("names status and priority for screen readers and marks unassigned issues", () => {
    renderIt({ page: 1, pageSize: 20 });
    expect(
      screen.getAllByRole("img", { name: "In Progress" }).length
    ).toBeGreaterThan(0);
    cleanup();
    render(
      <IssueFilterBar
        issues={facetedFixtures.issues.filter((i) => i.assigneeId === null)}
        labels={facetedFixtures.listLabels}
        onQueryChange={() => {}}
        people={facetedFixtures.listPeople}
        query={{ page: 1, pageSize: 20 }}
        total={1}
      />
    );
    expect(screen.getByText("Unassigned")).toBeTruthy();
  });
});

describe("CustomerFilterChips", () => {
  const renderIt = (
    query: CustomersListQuery,
    extra: Partial<Parameters<typeof CustomerFilterChips>[0]> = {}
  ) => {
    const onQueryChange = vi.fn<(q: CustomersListQuery) => void>();
    render(
      <WirefrontProvider
        currency="USD"
        locale="en-US"
        now={() => new Date(chipsFixtures.now)}
      >
        <CustomerFilterChips
          countries={chipsFixtures.countries}
          customers={chipsFixtures.customers.slice(0, 3)}
          onQueryChange={onQueryChange}
          query={query}
          total={3}
          {...extra}
        />
      </WirefrontProvider>
    );
    return onQueryChange;
  };

  it("shows each filter as a chip with its operator and formatted value", () => {
    renderIt(chipsFixtures.defaultQuery);
    expect(
      screen.getByRole("button", { name: "Edit Status: Active, Trial" })
    ).toBeTruthy();
    expect(
      screen.getByRole("button", { name: "Edit Country: US, CA" })
    ).toBeTruthy();
    expect(screen.getByText("is not")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Edit MRR: $500" })).toBeTruthy();
    expect(screen.getByText(/4 filters applied/)).toBeTruthy();
    expect(screen.getByText("$1,200")).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Share" })).toBeNull();
  });

  it("removes a chip, and removing Country also drops its exclude flag", () => {
    const onQueryChange = renderIt(chipsFixtures.defaultQuery);
    fireEvent.click(
      screen.getByRole("button", { name: "Remove Country filter" })
    );
    expect(onQueryChange).toHaveBeenLastCalledWith({
      page: 1,
      pageSize: 20,
      filters: { status: ["active", "trial"], plan: "pro", mrrMin: 500 },
    });
  });

  it("adds a chip as a draft that filters nothing until it has a value", async () => {
    const onQueryChange = renderIt({ page: 1, pageSize: 20 });
    fireEvent.click(screen.getByRole("button", { name: "Add filter" }));
    fireEvent.click(await screen.findByRole("button", { name: "Status" }));
    expect(onQueryChange).not.toHaveBeenCalled();
    expect(screen.getByRole("button", { name: "Edit Status: —" })).toBeTruthy();
    fireEvent.click(await screen.findByRole("checkbox", { name: "Churned" }));
    expect(onQueryChange).toHaveBeenLastCalledWith({
      page: 1,
      pageSize: 20,
      filters: { status: ["churned"] },
    });
  });

  it("flips Country between is and is not, names countries for the locale, and clears everything", async () => {
    const onQueryChange = renderIt(
      { page: 1, pageSize: 20, search: "co", filters: { country: ["GB"] } },
      { onShare: vi.fn() }
    );
    fireEvent.click(screen.getByRole("button", { name: "Edit Country: GB" }));
    expect(
      await screen.findByRole("checkbox", { name: /United Kingdom/ })
    ).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "is not" }));
    expect(onQueryChange).toHaveBeenLastCalledWith({
      page: 1,
      pageSize: 20,
      search: "co",
      filters: { country: ["GB"], excludeCountry: true },
    });
    fireEvent.click(screen.getByRole("button", { name: "Clear all" }));
    expect(onQueryChange).toHaveBeenLastCalledWith({
      page: 1,
      pageSize: 20,
      search: undefined,
      filters: undefined,
    });
  });
});

describe("ProductFilterSidebar", () => {
  const renderIt = (query: ProductsListQuery) => {
    const onQueryChange = vi.fn<(q: ProductsListQuery) => void>();
    render(
      <WirefrontProvider currency="USD" locale="en-US">
        <ProductFilterSidebar
          categories={sidebarFixtures.listCategories}
          colors={sidebarFixtures.listColors}
          counts={sidebarFixtures.listProducts.counts}
          onQueryChange={onQueryChange}
          overall={24}
          products={sidebarFixtures.listProducts.items}
          productHref={(p) => `/p/${p.id}`}
          query={query}
          total={6}
        />
      </WirefrontProvider>
    );
    return onQueryChange;
  };

  it("sets category, rating and toggle filters from page 1", () => {
    const onQueryChange = renderIt({ page: 2, pageSize: 24 });
    fireEvent.click(screen.getByRole("checkbox", { name: /Drinkware/ }));
    expect(onQueryChange).toHaveBeenLastCalledWith({
      page: 1,
      pageSize: 24,
      filters: { category: ["drinkware"] },
    });
    fireEvent.click(screen.getByRole("radio", { name: /4 & up/ }));
    expect(onQueryChange).toHaveBeenLastCalledWith({
      page: 1,
      pageSize: 24,
      filters: { ratingMin: 4 },
    });
    fireEvent.click(screen.getByRole("switch", { name: "On sale" }));
    expect(onQueryChange).toHaveBeenLastCalledWith({
      page: 1,
      pageSize: 24,
      filters: { onSale: true },
    });
  });

  it("turning a toggle off removes it, and counts what's active", () => {
    const onQueryChange = renderIt({
      page: 1,
      pageSize: 24,
      filters: { onSale: true, color: ["moss", "sky"], priceMax: 100 },
    });
    // Two colours, a price range and a toggle.
    expect(
      screen.getByRole("heading", { name: "Filters" }).nextElementSibling
        ?.textContent
    ).toBe("4");
    fireEvent.click(screen.getByRole("switch", { name: "On sale" }));
    expect(onQueryChange).toHaveBeenLastCalledWith({
      page: 1,
      pageSize: 24,
      filters: { color: ["moss", "sky"], priceMax: 100 },
    });
    expect(screen.getByText("$0 – $100")).toBeTruthy();
  });

  it("narrows the sections by search and shows products as links with formatted prices", () => {
    renderIt({ page: 1, pageSize: 24 });
    fireEvent.change(screen.getByRole("textbox", { name: "Search filters" }), {
      target: { value: "col" },
    });
    expect(screen.queryByRole("group", { name: "Category" })).toBeNull();
    expect(screen.getByRole("group", { name: "Color" })).toBeTruthy();
    expect(
      screen.getByRole("link", { name: "Specimen Tee" }).getAttribute("href")
    ).toBe("/p/p01");
    expect(screen.getByText("$38")).toBeTruthy();
    expect(screen.getByText("Rated 4.6 out of 5")).toBeTruthy();
    expect(screen.getByText("Showing 6 of 24 products.")).toBeTruthy();
  });
});
