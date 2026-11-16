// SPDX-License-Identifier: AGPL-3.0-only
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
// @vitest-environment jsdom
/**
 * The wiring contract of the sign-in and sign-up layout variants.
 */
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { fail } from "@wirefront/ui/wirefront/types";
import { CenteredSignIn } from "@/pages/showcase/auth-centered-signin/view";
import { CenteredSignUp } from "@/pages/showcase/auth-centered-signup/view";
import { GlassSignUp } from "@/pages/showcase/auth-glass-signup/view";
import { SplitSignIn } from "@/pages/showcase/auth-left-signin/view";
import { HeroSignIn } from "@/pages/showcase/auth-right-signin/view";
import { InsetSignIn } from "@/pages/showcase/inset-login/view";

afterEach(cleanup);

const typeIn = (label: string, value: string) => fireEvent.change(screen.getByLabelText(label), { target: { value } });

const SIGN_INS = [
  ["CenteredSignIn", CenteredSignIn],
  ["SplitSignIn", SplitSignIn],
  ["HeroSignIn", HeroSignIn],
  ["InsetSignIn", InsetSignIn],
] as const;

describe.each(SIGN_INS)("%s", (_, SignIn) => {
  // InsetSignIn draws its artwork with WebGL, which jsdom doesn't implement;
  // without a context the mesh simply doesn't start.
  beforeEach(() => {
    vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(null);
  });

  it("hides what isn't wired", () => {
    render(<SignIn onSignIn={async () => {}} providers={[{ id: "github", name: "GitHub" }]} />);
    expect(screen.queryByRole("button", { name: /GitHub/ })).toBeNull();
    expect(screen.queryByRole("link", { name: /Forgot password/ })).toBeNull();
    expect(screen.queryByRole("link", { name: /Sign up/ })).toBeNull();
  });

  it("validates, signs in, shows failures and links through the app", async () => {
    const onSignIn = vi.fn(async () => fail("Wrong email or password."));
    const onProvider = vi.fn(async () => {});
    render(<SignIn forgotPasswordHref="/forgot" onProvider={onProvider} onSignIn={onSignIn} providers={[{ id: "github", name: "GitHub" }]} signUpHref="/join" />);
    fireEvent.click(screen.getByRole("button", { name: "Sign in" }));
    expect(await screen.findByText("Enter a valid email address.")).toBeTruthy();
    expect(screen.getByText("Enter your password.")).toBeTruthy();
    expect(onSignIn).not.toHaveBeenCalled();

    typeIn("Email", "ada@example.com");
    typeIn("Password", "hunter22");
    fireEvent.click(screen.getByRole("button", { name: "Show password" }));
    expect(screen.getByLabelText("Password").getAttribute("type")).toBe("text");
    fireEvent.click(screen.getByRole("button", { name: "Sign in" }));
    await waitFor(() => expect(onSignIn).toHaveBeenCalledWith({ email: "ada@example.com", password: "hunter22" }));
    expect((await screen.findByRole("alert")).textContent).toBe("Wrong email or password.");

    fireEvent.click(screen.getByRole("button", { name: /GitHub/ }));
    await waitFor(() => expect(onProvider).toHaveBeenCalledWith("github"));
    expect(screen.getByRole("link", { name: "Forgot password?" }).getAttribute("href")).toBe("/forgot");
    expect(screen.getByRole("link", { name: "Sign up" }).getAttribute("href")).toBe("/join");
  });
});

describe("InsetSignIn extras", () => {
  beforeEach(() => {
    vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(null);
  });

  it("tags the last-used provider and links the magic link page", () => {
    render(
      <InsetSignIn
        lastUsedProvider="google"
        magicLinkHref="/magic"
        onProvider={async () => {}}
        onSignIn={async () => {}}
        providers={[
          { id: "github", name: "GitHub" },
          { id: "google", name: "Google" },
        ]}
      />,
    );
    expect(screen.getByRole("button", { name: "Google, Last used" })).toBeTruthy();
    expect(screen.getByRole("link", { name: "Sign in with Magic Link" }).getAttribute("href")).toBe("/magic");
  });
});

describe("CenteredSignUp", () => {
  it("rates the password, requires the terms when linked and creates the account", async () => {
    const onSignUp = vi.fn(async () => {});
    const onSuccess = vi.fn();
    render(<CenteredSignUp highlights={["No credit card"]} onSignUp={onSignUp} onSuccess={onSuccess} privacyHref="/privacy" signInHref="/sign-in" termsHref="/terms" />);
    expect(screen.getByText("No credit card")).toBeTruthy();
    typeIn("Full name", "Ada Lovelace");
    typeIn("Email", "ada@example.com");
    typeIn("Password", "short");
    expect(screen.getByText("Password strength:").parentElement?.textContent).toBe("Password strength: Weak");
    fireEvent.click(screen.getByRole("button", { name: "Create account" }));
    expect(await screen.findByText("Use at least 8 characters.")).toBeTruthy();

    typeIn("Password", "correct-horse-1");
    expect(screen.getByText("Password strength:").parentElement?.textContent).toBe("Password strength: Strong");
    fireEvent.click(screen.getByRole("button", { name: "Create account" }));
    expect((await screen.findByRole("alert")).textContent).toBe("Agree to the terms to continue.");
    expect(onSignUp).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole("checkbox", { name: /I agree to the/ }));
    fireEvent.click(screen.getByRole("button", { name: "Create account" }));
    const input = { name: "Ada Lovelace", email: "ada@example.com", password: "correct-horse-1" };
    await waitFor(() => expect(onSignUp).toHaveBeenCalledWith(input));
    expect(onSuccess).toHaveBeenCalledWith(input);
    expect(screen.getByRole("link", { name: "Terms" }).getAttribute("href")).toBe("/terms");
  });

  it("skips the agreement when no terms are linked", async () => {
    const onSignUp = vi.fn(async () => {});
    render(<CenteredSignUp onSignUp={onSignUp} />);
    expect(screen.queryByRole("checkbox")).toBeNull();
    typeIn("Full name", "Ada");
    typeIn("Email", "ada@example.com");
    typeIn("Password", "longenough");
    fireEvent.click(screen.getByRole("button", { name: "Create account" }));
    await waitFor(() => expect(onSignUp).toHaveBeenCalled());
  });
});

describe("GlassSignUp", () => {
  it("names required fields, creates the account and shows a clash", async () => {
    const onSignUp = vi.fn(async () => fail("An account with this email already exists.", { email: "Already registered." }));
    render(<GlassSignUp onSignUp={onSignUp} signInHref="/sign-in" />);
    // The visual asterisk is hidden; screen readers hear "(required)".
    fireEvent.change(screen.getByRole("textbox", { name: "Email (required)" }), { target: { value: "ada@example.com" } });
    fireEvent.change(screen.getByLabelText(/^Password/), { target: { value: "longenough" } });
    fireEvent.click(screen.getByRole("button", { name: "Create account" }));
    await waitFor(() => expect(onSignUp).toHaveBeenCalledWith({ email: "ada@example.com", password: "longenough" }));
    expect(await screen.findByText("Already registered.")).toBeTruthy();
    expect(screen.getByRole("link", { name: "Sign in" }).getAttribute("href")).toBe("/sign-in");
  });
});
