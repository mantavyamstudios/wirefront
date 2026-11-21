// SPDX-License-Identifier: MIT
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
// @vitest-environment jsdom
/**
 * The wiring contract of the dashboard screens.
 */
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { WirefrontProvider } from "@wirefront/ui/wirefront/provider";
import * as analytics from "@/pages/showcase/dashboards-analytics/fixtures";
import { PageviewAnalytics } from "@/pages/showcase/dashboards-analytics/view";
import * as revenue from "@/pages/showcase/dashboards-revenue/fixtures";
import { RevenueDashboard } from "@/pages/showcase/dashboards-revenue/view";
import * as services from "@/pages/showcase/dashboards-services/fixtures";
import { ServiceHealth } from "@/pages/showcase/dashboards-services/view";
import * as engineering from "@/pages/showcase/dashboards-engineering/fixtures";
import { EngineeringVelocity } from "@/pages/showcase/dashboards-engineering/view";
import * as support from "@/pages/showcase/dashboards-support/fixtures";
import { SupportQueue } from "@/pages/showcase/dashboards-support/view";
import * as market from "@/pages/showcase/dashboards-market/fixtures";
import { MarketsDashboard } from "@/pages/showcase/dashboards-market/view";
import * as revenueStory from "@/pages/showcase/dashboards-revenue-overview/fixtures";
import { RevenueStory } from "@/pages/showcase/dashboards-revenue-overview/view";
import * as consoleData from "@/pages/showcase/dashboards-status-console/fixtures";
import { StatusConsole } from "@/pages/showcase/dashboards-status-console/view";
import * as pipeline from "@/pages/showcase/dashboards-pipeline-today/fixtures";
import { PipelineToday } from "@/pages/showcase/dashboards-pipeline-today/view";
import * as home from "@/pages/showcase/dashboards-home/fixtures";
import { HomeDashboard } from "@/pages/showcase/dashboards-home/view";

afterEach(cleanup);

describe("PageviewAnalytics", () => {
  it("formats the period, names countries and changes range", () => {
    const onRangeChange = vi.fn();
    render(
      <WirefrontProvider locale="en-US">
        <PageviewAnalytics data={analytics.statsFor("30d")} onRangeChange={onRangeChange} range="30d" />
      </WirefrontProvider>,
    );
    expect(screen.getByRole("heading", { name: "Last 30 days" })).toBeTruthy();
    expect(screen.getByText("128,430")).toBeTruthy();
    expect(screen.getByText("+18%")).toBeTruthy();
    expect(screen.getByRole("img", { name: "Daily pageviews for the last 30 days; the last 4 days are still being counted" })).toBeTruthy();
    expect(screen.getByText("United States")).toBeTruthy();
    // Source shares are of all sources (4,820 of 12,610 is 38%).
    expect(screen.getByText("38%")).toBeTruthy();
    expect(screen.getByText("+220%")).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Export CSV" })).toBeNull();
    fireEvent.click(screen.getByRole("radio", { name: "7d" }));
    expect(onRangeChange).toHaveBeenCalledWith("7d");
  });

  it("exports the range and shows a failure", async () => {
    const onExport = vi.fn(async () => {
      throw new Error("Export failed.");
    });
    render(<PageviewAnalytics data={analytics.statsFor("7d")} onExport={onExport} onRangeChange={() => {}} range="7d" />);
    fireEvent.click(screen.getByRole("button", { name: "Export CSV" }));
    await waitFor(() => expect(onExport).toHaveBeenCalledWith("7d"));
    expect((await screen.findByRole("alert")).textContent).toBe("Export failed.");
  });

  it("shows empty, loading and error states", () => {
    const onRetry = vi.fn();
    const { rerender } = render(<PageviewAnalytics data={analytics.emptyStats} onRangeChange={() => {}} range="30d" />);
    expect(screen.getByText("No views in this period yet.")).toBeTruthy();
    rerender(<PageviewAnalytics onRangeChange={() => {}} range="30d" status="loading" />);
    expect(screen.getByRole("main").getAttribute("aria-busy")).toBe("true");
    rerender(<PageviewAnalytics error="Down." onRangeChange={() => {}} onRetry={onRetry} range="30d" status="error" />);
    fireEvent.click(screen.getByRole("button", { name: "Try again" }));
    expect(onRetry).toHaveBeenCalled();
  });
});

describe("HomeDashboard", () => {
  const at = (iso: string) => () => new Date(iso);

  it("greets by the provider's clock, says when tasks are due and counts what's left", () => {
    render(
      <WirefrontProvider locale="en-US" now={at(home.now)} timeZone="UTC">
        <HomeDashboard data={home.getToday} shortcuts={home.shortcuts} stats={home.stats} userName="Ada" />
      </WirefrontProvider>,
    );
    expect(screen.getByRole("heading", { level: 1, name: "Good morning, Ada." })).toBeTruthy();
    expect(screen.getByText("Saturday, Apr 25")).toBeTruthy();
    expect(screen.getByText("3 things on your plate today.")).toBeTruthy();
    expect(screen.getAllByText("Today")).toHaveLength(3);
    expect(screen.getAllByText("Tomorrow")).toHaveLength(2);
    expect(screen.getByText("4 events")).toBeTruthy();
    expect(screen.getByText("10:00 AM")).toBeTruthy();
    expect(screen.getByRole("link", { name: "Invite teammate" }).getAttribute("href")).toBe("#invite");
    expect(screen.queryByRole("button", { name: "New" })).toBeNull();
    // Read-only without onSetTaskDone.
    expect((screen.getByRole("button", { name: "Mark “Sketch onboarding step 2” done" }) as HTMLButtonElement).disabled).toBe(true);
  });

  it("ticks a task at once and rolls it back when saving fails", async () => {
    let reject: (e: Error) => void = () => {};
    const onSetTaskDone = vi.fn(() => new Promise<void>((_, r) => (reject = r)));
    render(
      <WirefrontProvider now={at("2026-04-25T19:00:00Z")} timeZone="UTC">
        <HomeDashboard data={home.getToday} onSetTaskDone={onSetTaskDone} userName="Ada" />
      </WirefrontProvider>,
    );
    expect(screen.getByRole("heading", { level: 1, name: "Good evening, Ada." })).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Mark “Sketch onboarding step 2” done" }));
    expect(onSetTaskDone).toHaveBeenCalledWith({ id: "t2", done: true });
    expect(screen.getByRole("button", { name: "Mark “Sketch onboarding step 2” not done" })).toBeTruthy();
    expect(screen.getByText("2 things on your plate today.")).toBeTruthy();
    reject(new Error("Couldn’t save."));
    expect((await screen.findByRole("alert")).textContent).toBe("Couldn’t save.");
    expect(screen.getByRole("button", { name: "Mark “Sketch onboarding step 2” done" })).toBeTruthy();
  });

  it("shows empty and error states", () => {
    const { rerender } = render(<HomeDashboard data={home.emptyToday} userName="Ada" />);
    expect(screen.getByText("No tasks yet.")).toBeTruthy();
    expect(screen.getByText("Nothing scheduled.")).toBeTruthy();
    rerender(<HomeDashboard error="Down." onRetry={() => {}} status="error" userName="Ada" />);
    expect(screen.getByText("Couldn’t load your day")).toBeTruthy();
  });
});

describe("RevenueDashboard", () => {
  it("derives MRR, ARR and growth from the trend and formats money in the provider's currency", () => {
    const onRangeChange = vi.fn();
    render(
      <WirefrontProvider currency="USD" locale="en-US">
        <RevenueDashboard accountsHref="/accounts" data={revenue.revenueFor("24m")} onRangeChange={onRangeChange} range="24m" />
      </WirefrontProvider>,
    );
    expect(screen.getByText("$142.4K")).toBeTruthy();
    expect(screen.getByText("$1.7M ARR · 5,783 paying accounts")).toBeTruthy();
    expect(screen.getByText("0.6%")).toBeTruthy();
    expect(screen.getByRole("img", { name: "Monthly recurring revenue over 24 months, from $68.4K to $142.4K" })).toBeTruthy();
    expect(screen.getByText("+$3.8K")).toBeTruthy();
    expect(screen.getByText("-$2.5K")).toBeTruthy();
    expect(screen.getByRole("meter", { name: "Net revenue retention" }).getAttribute("aria-valuetext")).toBe("112%");
    expect(screen.getByRole("link", { name: /View all/ }).getAttribute("href")).toBe("/accounts");
    fireEvent.click(screen.getByRole("radio", { name: "3m" }));
    expect(onRangeChange).toHaveBeenCalledWith("3m");
  });

  it("exports the range and handles empty and error states", async () => {
    const onExport = vi.fn(async () => {});
    const { rerender } = render(<RevenueDashboard data={revenue.emptyRevenue} onExport={onExport} onRangeChange={() => {}} range="12m" />);
    expect(screen.getByText("No revenue in this range yet.")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Export" }));
    await waitFor(() => expect(onExport).toHaveBeenCalledWith("12m"));
    rerender(<RevenueDashboard error="Down." onRangeChange={() => {}} range="12m" status="error" />);
    expect(screen.getByText("Couldn’t load revenue")).toBeTruthy();
  });
});

describe("ServiceHealth", () => {
  it("summarises health, formats rates and flags trouble", () => {
    const onWindowChange = vi.fn();
    render(
      <WirefrontProvider locale="en-US">
        <ServiceHealth onWindowChange={onWindowChange} scope="acme/platform" services={services.listServiceHealth} window="1h" />
      </WirefrontProvider>,
    );
    expect(screen.getByText("acme/platform · 6 services")).toBeTruthy();
    expect(screen.getByText("3/6")).toBeTruthy();
    expect(screen.getByText("24.7K")).toBeTruthy();
    expect(screen.getByText("1.40%")).toBeTruthy();
    expect(screen.getByText("814ms").className).toContain("category-3");
    expect(screen.getByText("100.00%").className).toContain("category-4");
    expect(screen.getByRole("img", { name: "billing-svc error rate over the last 1h, now 1.40%" })).toBeTruthy();
    fireEvent.click(screen.getByRole("radio", { name: "24h" }));
    expect(onWindowChange).toHaveBeenCalledWith("24h");
  });

  it("shows empty and error states", () => {
    const onRetry = vi.fn();
    const { rerender } = render(<ServiceHealth onWindowChange={() => {}} services={[]} window="1h" />);
    expect(screen.getByText("No services reporting yet.")).toBeTruthy();
    rerender(<ServiceHealth error="Down." onRetry={onRetry} onWindowChange={() => {}} status="error" window="1h" />);
    fireEvent.click(screen.getByRole("button", { name: "Try again" }));
    expect(onRetry).toHaveBeenCalled();
  });
});

describe("EngineeringVelocity", () => {
  it("formats DORA units, judges direction per metric and totals PR weeks", () => {
    const onRangeChange = vi.fn();
    render(
      <WirefrontProvider locale="en-US">
        <EngineeringVelocity data={engineering.getVelocity} onRangeChange={onRangeChange} range="30d" />
      </WirefrontProvider>,
    );
    expect(screen.getByText("14 / day")).toBeTruthy();
    expect(screen.getByText("2h 18m")).toBeTruthy();
    expect(screen.getByText("4.2%")).toBeTruthy();
    expect(screen.getByText("32m 00s")).toBeTruthy();
    // Lead time fell 22%: good news.
    expect(screen.getByText("22%").className).toContain("category-2");
    // Change failure rate rose 6%: bad news.
    expect(screen.getByText("6%").className).toContain("category-4");
    expect(screen.getByText("434")).toBeTruthy();
    expect(screen.getByText("merged · 39 closed")).toBeTruthy();
    expect(screen.getByRole("listitem", { name: "Week of Jun 15: 73 merged, 10 open, 6 closed" })).toBeTruthy();
    expect(screen.getByText("9m 14s", { selector: "dd" })).toBeTruthy();
    fireEvent.click(screen.getByRole("radio", { name: "90d" }));
    expect(onRangeChange).toHaveBeenCalledWith("90d");
  });

  it("shows empty and error states", () => {
    const { rerender } = render(<EngineeringVelocity data={engineering.emptyVelocity} onRangeChange={() => {}} range="7d" />);
    expect(screen.getAllByText("Nothing in this period yet.")).toHaveLength(2);
    rerender(<EngineeringVelocity error="Down." onRangeChange={() => {}} range="7d" status="error" />);
    expect(screen.getByText("Couldn’t load engineering metrics")).toBeTruthy();
  });
});

describe("SupportQueue", () => {
  it("counts the queue, says how overdue each breach is by the provider clock and ranks agents", () => {
    render(
      <WirefrontProvider locale="en-US" now={() => new Date(support.now)}>
        <SupportQueue breachesHref="/breaches" data={support.getQueueOverview} scope="acme/help" />
      </WirefrontProvider>,
    );
    expect(screen.getByText("Support · acme/help")).toBeTruthy();
    expect(screen.getByText("157")).toBeTruthy();
    expect(screen.getByText("of 769 total")).toBeTruthy();
    expect(screen.getByRole("img", { name: "Tickets by state: Open 84, In progress 32, Waiting 41, Resolved 612" })).toBeTruthy();
    const table = screen.getByRole("table", { name: "Tickets breaching SLA" });
    expect(table.textContent).toContain("41m over");
    expect(table.textContent).toContain("p0 first response");
    expect(screen.getByText("-38% vs week")).toBeTruthy();
    expect(screen.getAllByText("74% load").length).toBeGreaterThan(0);
    expect(screen.getByRole("link", { name: /View all/ }).getAttribute("href")).toBe("/breaches");
  });

  it("shows empty and error states", () => {
    const { rerender } = render(<SupportQueue data={support.emptyQueue} />);
    expect(screen.getByText("Nothing is breaching SLA.")).toBeTruthy();
    rerender(<SupportQueue error="Down." status="error" />);
    expect(screen.getByText("Couldn’t load the queue")).toBeTruthy();
  });
});

describe("MarketsDashboard", () => {
  it("prices in the provider's currency, colours moves and features a chosen ticker", () => {
    const onSelectTicker = vi.fn();
    const onRangeChange = vi.fn();
    render(
      <WirefrontProvider currency="USD" locale="en-US" timeZone="UTC">
        <MarketsDashboard data={market.getMarketOverview} onRangeChange={onRangeChange} onSelectTicker={onSelectTicker} portfolioName="Index" range="1D" />
      </WirefrontProvider>,
    );
    expect(screen.getByRole("heading", { name: "ACME Acme Holdings" })).toBeTruthy();
    expect(screen.getByText("$184.62")).toBeTruthy();
    expect(screen.getByText("+$4.34 today · vol 2.4M")).toBeTruthy();
    expect(screen.getByText("$184,620")).toBeTruthy();
    expect(screen.getByText("-0.84%").className).toContain("category-4");
    expect(screen.getByRole("link", { name: "Fed signals one more rate cut before EOY" }).getAttribute("href")).toBe("#news-3");
    expect(screen.getByText("2:42 PM")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Show RSND" }));
    expect(onSelectTicker).toHaveBeenCalledWith("RSND");
    fireEvent.click(screen.getByRole("radio", { name: "1Y" }));
    expect(onRangeChange).toHaveBeenCalledWith("1Y");
    expect(screen.queryByRole("button", { name: "Add ticker" })).toBeNull();
  });

  it("shows empty and error states", () => {
    const { rerender } = render(<MarketsDashboard data={{ ...market.getMarketOverview, watchlist: [], headlines: [] }} onRangeChange={() => {}} range="1D" />);
    expect(screen.getByText("Your watchlist is empty.")).toBeTruthy();
    expect(screen.getByText("No headlines yet.")).toBeTruthy();
    rerender(<MarketsDashboard error="Down." onRangeChange={() => {}} range="1D" status="error" />);
    expect(screen.getByText("Couldn’t load markets")).toBeTruthy();
  });
});

describe("RevenueStory", () => {
  // The chart measures its box; jsdom has no ResizeObserver.
  beforeEach(() => {
    vi.stubGlobal(
      "ResizeObserver",
      class {
        observe() {}
        disconnect() {}
      },
    );
  });
  afterEach(() => vi.unstubAllGlobals());

  const renderIt = (props: Partial<Parameters<typeof RevenueStory>[0]> = {}) =>
    render(
      <WirefrontProvider currency="USD" locale="en-US" now={() => new Date(revenueStory.now)}>
        <RevenueStory data={revenueStory.getRevenueStory} store={revenueStory.store} updatedAt={revenueStory.updatedAt} {...props} />
      </WirefrontProvider>,
    );

  it("tells the period's story in the provider's currency and changes range", () => {
    const onRangeChange = vi.fn();
    renderIt({ onRangeChange, nav: [{ label: "Revenue", href: "/revenue", icon: null, current: true }] });
    expect(screen.getByText("Last 30 days")).toBeTruthy();
    // The summary is one sentence built from messages and live figures.
    expect(document.body.textContent).toMatch(/\$[\d,]+ this period, (up|down) \$[\d.]+K on the last one — (led by|most of it from|mostly from) \w/);
    expect(document.body.textContent).toMatch(/Best day was Nov 28 at \$12\.9K, during the Black Friday sale\. Slowest was Dec 9 at \$6\.3K, during the shipping delay\./);
    expect(screen.getByText("Updated 2 minutes ago")).toBeTruthy();
    expect(screen.getByRole("link", { name: "Revenue" }).getAttribute("aria-current")).toBe("page");
    expect(screen.getByRole("heading", { name: "Where it came from" })).toBeTruthy();
    expect(screen.getByRole("button", { name: /Black Friday sale/ })).toBeTruthy();
    fireEvent.click(screen.getByRole("radio", { name: "12m, Last 12 months" }));
    expect(onRangeChange).toHaveBeenCalledWith("12m");
    expect(document.body.textContent).toMatch(/Best week was the week of \w{3} \d+/);
  });

  it("shows loading and error states", () => {
    const onRetry = vi.fn();
    const { rerender } = renderIt({ data: undefined, status: "loading" });
    expect(screen.getByRole("main").getAttribute("aria-busy")).toBe("true");
    expect(screen.queryByRole("button", { name: "Export" })).toBeNull();
    rerender(
      <WirefrontProvider>
        <RevenueStory error="Down." onRetry={onRetry} status="error" store={revenueStory.store} />
      </WirefrontProvider>,
    );
    fireEvent.click(screen.getByRole("button", { name: "Try again" }));
    expect(onRetry).toHaveBeenCalled();
  });
});

describe("StatusConsole", () => {
  // The timeline scrolls to its latest update; jsdom has no Element.scrollTo.
  beforeEach(() => {
    Element.prototype.scrollTo = () => {};
  });

  const renderIt = (props: Partial<Parameters<typeof StatusConsole>[0]> = {}) =>
    render(
      <WirefrontProvider locale="en-GB" now={() => new Date(consoleData.now)} timeZone="Europe/London">
        <StatusConsole currentUserId="maya" data={consoleData.getStatus} updatedAt={consoleData.now} {...props} />
      </WirefrontProvider>,
    );

  it("shows health, the incident's progress and hides actions that aren't wired", () => {
    renderIt();
    expect(screen.getByRole("status").textContent).toContain("1 degraded");
    expect(screen.getByRole("button", { name: "Webhook delivery Degraded eu-west" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Webhook delivery Degraded eu-west" }).closest("li")?.textContent).toContain("p95 4.1s2.40% errors99.71% uptime");
    expect(screen.getByRole("heading", { name: "Webhook deliveries delayed in eu-west" })).toBeTruthy();
    expect(screen.getByText("Investigating", { selector: "li[aria-current='step'] span" })).toBeTruthy();
    expect(screen.getByText("14:02")).toBeTruthy();
    expect(screen.getByText("Primary · 14:06 London")).toBeTruthy();
    expect(screen.queryByRole("button", { name: /Page/ })).toBeNull();
    expect(screen.queryByRole("textbox", { name: "Post an update" })).toBeNull();
    expect(screen.queryByRole("button", { name: /Roll back/ })).toBeNull();
  });

  it("filters deploys by service with the number keys and clears with Escape", async () => {
    renderIt();
    fireEvent.keyDown(screen.getByRole("button", { name: "Auth Operational global" }), { key: "6" });
    expect(screen.getByRole("button", { name: "Auth Operational global" }).getAttribute("aria-pressed")).toBe("true");
    expect(screen.getByText("Rotate JWT signing keys")).toBeTruthy();
    // Filtered-out deploys animate away first.
    await waitFor(() => expect(screen.queryByText("Starter pricing copy")).toBeNull());
    fireEvent.keyDown(screen.getByRole("button", { name: "Auth Operational global" }), { key: "Escape" });
    expect(screen.getByText("Starter pricing copy")).toBeTruthy();
  });

  it("pages, posts updates and rolls back through the app", async () => {
    const onPage = vi.fn(async () => {});
    const onPostUpdate = vi.fn(async () => {});
    const onRollback = vi.fn(async () => {});
    renderIt({ onPage, onPostUpdate, onRollback });
    fireEvent.click(screen.getAllByRole("button", { name: /Page/ })[0] as HTMLElement);
    await waitFor(() => expect(onPage).toHaveBeenCalledWith("sam"));
    expect(await screen.findByText("Paged Sam")).toBeTruthy();
    fireEvent.change(screen.getByRole("textbox", { name: "Post an update" }), { target: { value: "  Looking at partition 7  " } });
    fireEvent.click(screen.getByRole("button", { name: "Post update" }));
    await waitFor(() => expect(onPostUpdate).toHaveBeenCalledWith({ text: "Looking at partition 7" }));
    fireEvent.click(screen.getByRole("button", { name: "Roll back 7c2e91a" }));
    await waitFor(() => expect(onRollback).toHaveBeenCalledWith("d1"));
  });

  it("switches environment and shows a quiet one", () => {
    const onEnvironmentChange = vi.fn();
    const { rerender } = renderIt({ environments: ["Production", "Staging"], environment: "Production", onEnvironmentChange });
    fireEvent.click(screen.getByRole("radio", { name: "Staging" }));
    expect(onEnvironmentChange).toHaveBeenCalledWith("Staging");
    rerender(
      <WirefrontProvider>
        <StatusConsole data={consoleData.quietStatus} />
      </WirefrontProvider>,
    );
    expect(screen.getByText("No open incidents.")).toBeTruthy();
    expect(screen.getByRole("status").textContent).toContain("All systems operational");
  });
});

describe("PipelineToday", () => {
  // The board watches its size and scrolls chips into view; jsdom has neither.
  beforeEach(() => {
    vi.stubGlobal(
      "ResizeObserver",
      class {
        observe() {}
        disconnect() {}
      },
    );
    Element.prototype.scrollTo = () => {};
  });
  afterEach(() => vi.unstubAllGlobals());

  const renderIt = (props: Partial<Parameters<typeof PipelineToday>[0]> = {}) =>
    render(
      <WirefrontProvider currency="USD" locale="en-GB" now={() => new Date(pipeline.now)} timeZone="Europe/London">
        <PipelineToday currentUserId="maren" data={pipeline.getPipeline} target={pipeline.target} workspace="Kestrel" {...props} />
      </WirefrontProvider>,
    );

  it("greets by the provider clock, counts focus signals and hides unwired actions", () => {
    renderIt();
    expect(screen.getByRole("heading", { level: 1, name: "Good morning, Maren" })).toBeTruthy();
    expect(screen.getByText("Tuesday 27 October")).toBeTruthy();
    expect(screen.getByText(/accounts? needs? you today\./)).toBeTruthy();
    expect(screen.getByRole("meter").getAttribute("aria-label")).toMatch(/^\d+% of target$/);
    expect(screen.queryByRole("button", { name: /^Email / })).toBeNull();
    expect(screen.getAllByRole("button", { name: /^Open / }).length).toBeGreaterThan(0);
  });

  it("moves a deal from the detail panel, saves it and undoes it when saving fails", async () => {
    const onDealMove = vi.fn(async () => {
      throw new Error("CRM is read-only.");
    });
    renderIt({ onDealMove });
    const card = screen.getAllByRole("button", { expanded: false }).find((el) => el.getAttribute("aria-roledescription") === "draggable deal") as HTMLElement;
    const company = card.querySelector(".font-medium")?.textContent ?? "";
    fireEvent.click(card);
    const panel = screen.getByRole("region", { name: company });
    const next = Array.from(panel.querySelectorAll("button")).find((b) => /^(Move to|Mark as won)/.test(b.textContent ?? "")) as HTMLElement;
    fireEvent.click(next);
    await waitFor(() => expect(onDealMove).toHaveBeenCalledWith(expect.objectContaining({ dealId: expect.any(String) })));
    expect(await screen.findByText(`Couldn’t move ${company}: CRM is read-only.`)).toBeTruthy();
  });

  it("acts on a focus signal through the app", async () => {
    const onSignalAction = vi.fn(async () => {});
    renderIt({ onSignalAction });
    const signal = pipeline.getPipeline.signals[0];
    fireEvent.click(screen.getByRole("button", { name: `Email ${signal?.contact}` }));
    await waitFor(() => expect(onSignalAction).toHaveBeenCalledWith({ signalId: signal?.id, action: "email" }));
    expect(screen.getByRole("status").textContent).toContain(`Follow-up sent to ${signal?.contact}`);
  });

  it("shows loading and error states", () => {
    const { rerender } = renderIt({ data: undefined, status: "loading" });
    expect(document.querySelector("[aria-busy='true']")).toBeTruthy();
    rerender(
      <WirefrontProvider>
        <PipelineToday currentUserId="maren" error="Down." status="error" target={1} workspace="Kestrel" />
      </WirefrontProvider>,
    );
    expect(screen.getByText("Couldn’t load your pipeline")).toBeTruthy();
  });
});
