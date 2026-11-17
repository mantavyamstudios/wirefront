// SPDX-License-Identifier: AGPL-3.0-only
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { fail } from "@wirefront/ui/wirefront/types";
import { WirefrontProvider } from "@wirefront/ui/wirefront/provider";
import type { ReactNode } from "react";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import * as compact from "@/pages/showcase/profile-compact-card/fixtures";
import { MemberRoster } from "@/pages/showcase/profile-compact-card/view";
import * as creds from "@/pages/showcase/profile-credentials/fixtures";
import { CredentialsSessions } from "@/pages/showcase/profile-credentials/view";
import * as directory from "@/pages/showcase/profile-directory/fixtures";
import { ContactDirectory } from "@/pages/showcase/profile-directory/view";
import * as hero from "@/pages/showcase/profile-hero/fixtures";
import { ProfilePage } from "@/pages/showcase/profile-hero/view";
import * as hover from "@/pages/showcase/profile-hover-card/fixtures";
import { PersonHoverCard } from "@/pages/showcase/profile-hover-card/view";
import * as intros from "@/pages/showcase/profile-introductions/fixtures";
import { SuggestedIntros } from "@/pages/showcase/profile-introductions/view";
import * as org from "@/pages/showcase/profile-org-chart/fixtures";
import { OrgChart } from "@/pages/showcase/profile-org-chart/view";
import * as presence from "@/pages/showcase/profile-presence-rail/fixtures";
import { PresenceRail } from "@/pages/showcase/profile-presence-rail/view";
import * as skills from "@/pages/showcase/profile-skills/fixtures";
import { SkillEndorsements } from "@/pages/showcase/profile-skills/view";
import * as social from "@/pages/showcase/profile-social-profile/fixtures";
import { SocialProfile } from "@/pages/showcase/profile-social-profile/view";
import * as team from "@/pages/showcase/profile-team-grid/fixtures";
import { TeamDirectory } from "@/pages/showcase/profile-team-grid/view";

beforeAll(() => {
  vi.stubGlobal(
    "ResizeObserver",
    class {
      observe() {}
      unobserve() {}
      disconnect() {}
    },
  );
  vi.stubGlobal("matchMedia", () => ({ matches: false, addEventListener() {}, removeEventListener() {} }));
  Element.prototype.scrollTo = () => {};
  Element.prototype.scrollIntoView = () => {};
  Element.prototype.getAnimations = () => [];
});
afterEach(cleanup);

const at = (now: string, ui: ReactNode) =>
  render(
    <WirefrontProvider locale="en-US" now={() => new Date(now)} timeZone="UTC">
      {ui}
    </WirefrontProvider>,
  );

describe("profile", () => {
  it("ProfilePage follows optimistically and reverts when it fails", async () => {
    const onToggleFollow = vi.fn(async () => fail("Couldn’t follow."));
    at(hero.now, <ProfilePage onToggleFollow={onToggleFollow} profile={hero.getProfile} />);
    expect(screen.getAllByText("12.4K").length).toBeGreaterThan(0);
    fireEvent.click(screen.getByRole("button", { name: "Follow" }));
    expect(onToggleFollow).toHaveBeenCalledWith(true);
    expect(await screen.findByText("Couldn’t follow.")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Follow" }).getAttribute("aria-pressed")).toBe("false");
    expect(screen.getByText("Joined Apr 2021")).toBeTruthy();
  });

  it("PersonHoverCard shows each person's own card and mutuals", () => {
    at("2026-04-26T12:00:00Z", <PersonHoverCard inline person={hover.james} />);
    expect(screen.getByText("James Lin")).toBeTruthy();
    expect(screen.getByText("Followed by Maya, Riya and 3 others you follow")).toBeTruthy();
    expect(screen.queryByRole("button", { name: /Follow/ })).toBeNull();
  });

  it("MemberRoster shows activity from timestamps and reads permissions without an action", () => {
    at(compact.now, <MemberRoster roster={compact.listRoster} />);
    expect(screen.getByText("Workspace members · 5 of 28")).toBeTruthy();
    expect(screen.getAllByText("active now").length).toBeGreaterThan(0);
    expect(screen.queryByRole("button", { name: /Permission for/ })).toBeNull();
    expect(screen.getByText("Owner")).toBeTruthy();
  });

  it("TeamDirectory counts people and cities and filters by search", () => {
    render(<TeamDirectory company="Acme" people={team.listTeammates} />);
    expect(screen.getByText("Acme · 6 teammates · 6 cities")).toBeTruthy();
    fireEvent.change(screen.getByRole("searchbox", { name: "Search teammates" }), { target: { value: "designer" } });
    expect(screen.getAllByRole("listitem")).toHaveLength(1);
    expect(screen.getByRole("link", { name: "Email Dani Kim" }).getAttribute("href")).toBe("mailto:dani@acme.dev");
  });

  it("ContactDirectory groups by last name and runs contact actions", () => {
    const onMessage = vi.fn();
    render(<ContactDirectory company="Acme" onMessage={onMessage} people={directory.listContacts} />);
    expect(screen.getByRole("heading", { name: /^P/ }).textContent).toBe("P3");
    fireEvent.click(screen.getByRole("button", { name: "Message Riya Patel" }));
    expect(onMessage).toHaveBeenCalledWith("riya");
    fireEvent.change(screen.getByRole("searchbox", { name: "Find people" }), { target: { value: "zzz" } });
    expect(screen.getByText("Nobody matches “zzz”.")).toBeTruthy();
  });

  it("OrgChart computes depth and loads unloaded reports", async () => {
    const onLoadReports = vi.fn(async () => {});
    render(<OrgChart company="Acme" onLoadReports={onLoadReports} people={org.listOrg.people} total={28} />);
    expect(screen.getByText("Acme · 28 people · 4 levels deep")).toBeTruthy();
    fireEvent.click(screen.getAllByRole("button", { name: "Show 3 reports of Carlos Mendes" })[0] as HTMLElement);
    expect(onLoadReports).toHaveBeenCalledWith("carlos");
    fireEvent.click(screen.getAllByRole("button", { name: "Hide 2 reports of Mia Lloyd" })[0] as HTMLElement);
    expect(screen.getAllByRole("button", { name: "Show 2 reports of Mia Lloyd" }).length).toBeGreaterThan(0);
  });

  it("SkillEndorsements totals endorsements and endorses optimistically", async () => {
    const onEndorse = vi.fn(async () => {});
    render(<SkillEndorsements onEndorse={onEndorse} person="Maya Okafor" skills={skills.listSkills} />);
    expect(screen.getByText("186 endorsements across 12 skills.")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Endorse Rust" }));
    expect(onEndorse).toHaveBeenCalledWith({ id: "rust", endorsed: true });
    expect(screen.getByText("187 endorsements across 12 skills.")).toBeTruthy();
  });

  it("PresenceRail counts presence and toggles do not disturb", () => {
    const onSetPresence = vi.fn(async () => {});
    render(<PresenceRail meId={presence.me.id} onSetPresence={onSetPresence} people={presence.listPresence} workspace="Acme studios" />);
    expect(screen.getByText(/^6 people active right now/)).toBeTruthy();
    fireEvent.click(screen.getAllByRole("button", { name: "Turn on do not disturb" })[0] as HTMLElement);
    expect(onSetPresence).toHaveBeenCalledWith("dnd");
  });

  it("SuggestedIntros dismisses and follows", () => {
    const onDismiss = vi.fn(async () => {});
    const onFollow = vi.fn(async () => {});
    render(<SuggestedIntros onDismiss={onDismiss} onFollow={onFollow} suggestions={intros.listSuggestions} />);
    fireEvent.click(screen.getByRole("button", { name: "Dismiss Naomi Park" }));
    expect(screen.queryByText("Naomi Park")).toBeNull();
    const helena = screen.getByText("Helena Marsh").closest("li") as HTMLElement;
    fireEvent.click(within(helena).getByRole("button", { name: /Follow/ }));
    expect(onFollow).toHaveBeenCalledWith({ id: "helena", following: true });
    expect(within(helena).getByText("8,402 followers")).toBeTruthy();
  });

  it("CredentialsSessions signs devices out and keeps this one", () => {
    const onSignOutAll = vi.fn(async () => {});
    at(creds.now, <CredentialsSessions data={creds.getCredentials} onSignOut={async () => {}} onSignOutAll={onSignOutAll} />);
    expect(screen.getByText("Your account is protected with two-factor and a passkey.")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Sign out Pixel 8" }));
    expect(screen.queryByText("Pixel 8")).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Sign out everywhere" }));
    expect(onSignOutAll).toHaveBeenCalled();
    expect(screen.getByText("1 devices · 1 active now")).toBeTruthy();
  });

  it("SocialProfile likes a post through onReact", async () => {
    const onReact = vi.fn(async () => {});
    at(
      social.now,
      <SocialProfile media={social.listMedia} onReact={onReact} postUrl={(id) => `#${id}`} posts={social.listPosts} profileUrl="#me" replies={social.listReplies} user={social.getSocialProfile} />,
    );
    const like = screen.getAllByRole("button", { name: "Like" })[0] as HTMLElement;
    fireEvent.click(like);
    expect(onReact).toHaveBeenCalledWith(expect.objectContaining({ kind: "like", on: true }));
    await waitFor(() => expect(screen.getAllByRole("button", { name: "Unlike" }).length).toBeGreaterThan(0));
  });
});
