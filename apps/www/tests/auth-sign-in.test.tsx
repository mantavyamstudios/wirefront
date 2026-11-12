// SPDX-License-Identifier: AGPL-3.0-only
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
// @vitest-environment jsdom
/**
 * The sign-in screen's wiring contract, as a builder relies on it: what the
 * actions receive, what they can return, and what the screen shows back.
 */
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { AnchorHTMLAttributes } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { WirefrontProvider } from "@wirefront/ui/wirefront/provider";
import { fail, ok } from "@wirefront/ui/wirefront/types";
import { api } from "@/pages/showcase/auth-sign-in/schema";
import { SignIn } from "@/pages/showcase/auth-sign-in/view";

afterEach(cleanup);

function AppLink(props: AnchorHTMLAttributes<HTMLAnchorElement>) {
  return <a data-app-link {...props} />;
}

const session = { userId: "usr_01", redirectTo: "/dashboard" };

function fillAndSubmit(email: string, password: string) {
  fireEvent.change(screen.getByLabelText("Email"), { target: { value: email } });
  fireEvent.change(screen.getByLabelText("Password"), { target: { value: password } });
  fireEvent.click(screen.getByRole("button", { name: "Sign in" }));
}

describe("SignIn", () => {
  it("validates before calling the backend", async () => {
    const onSignIn = vi.fn();
    render(<SignIn onSignIn={onSignIn} product="Acme" />);
    fillAndSubmit("not-an-email", "");
    expect(await screen.findByText("Enter a valid email address.")).toBeTruthy();
    expect(screen.getByText("Enter your password.")).toBeTruthy();
    expect(onSignIn).not.toHaveBeenCalled();
  });

  it("sends the validated input and reports the session on success", async () => {
    const onSignIn = vi.fn(async () => ok(session));
    const onSuccess = vi.fn();
    render(<SignIn onSignIn={onSignIn} onSuccess={onSuccess} product="Acme" />);
    fillAndSubmit("ada@acme.dev", "correct-horse");
    expect(await screen.findByText("Signed in")).toBeTruthy();
    expect(onSignIn).toHaveBeenCalledWith({ email: "ada@acme.dev", password: "correct-horse" });
    expect(onSuccess).toHaveBeenCalledWith(session);
  });

  it("shows field errors and form errors the backend returns", async () => {
    render(
      <SignIn onSignIn={async () => fail("Too many attempts.", { password: "Wrong password." })} product="Acme" />,
    );
    fillAndSubmit("ada@acme.dev", "nope-nope");
    expect(await screen.findByText("Wrong password.")).toBeTruthy();
    expect(screen.getByRole("alert").textContent).toBe("Too many attempts.");
  });

  it("shows a thrown error instead of failing silently", async () => {
    render(
      <SignIn
        onSignIn={async () => {
          throw new Error("Network unreachable");
        }}
        product="Acme"
      />,
    );
    fillAndSubmit("ada@acme.dev", "correct-horse");
    await waitFor(() => expect(screen.getByRole("alert").textContent).toBe("Network unreachable"));
  });

  it("signs in with a passkey when the builder wires one", async () => {
    const onPasskey = vi.fn(async () => ok(session));
    const onSuccess = vi.fn();
    render(<SignIn onPasskey={onPasskey} onSignIn={vi.fn()} onSuccess={onSuccess} product="Acme" />);
    fireEvent.click(screen.getByRole("button", { name: "Passkey" }));
    expect(await screen.findByText("Signed in")).toBeTruthy();
    expect(onSuccess).toHaveBeenCalledWith(session);
  });

  it("emails a sign-in link to the address in the form", async () => {
    const onMagicLink = vi.fn(async () => {});
    const onSignIn = vi.fn();
    render(<SignIn onMagicLink={onMagicLink} onSignIn={onSignIn} product="Acme" />);
    const send = screen.getByRole("button", { name: "Email me a sign-in link" });
    fireEvent.click(send);
    expect(await screen.findByText("Enter a valid email address.")).toBeTruthy();
    expect(onMagicLink).not.toHaveBeenCalled();

    fireEvent.change(screen.getByLabelText("Email"), { target: { value: "ada@acme.dev" } });
    fireEvent.click(send);
    const sent = await screen.findByText("Check ada@acme.dev for a sign-in link.");
    expect(sent.getAttribute("role")).toBe("status");
    expect(onMagicLink).toHaveBeenCalledWith({ email: "ada@acme.dev" });
    expect(onSignIn).not.toHaveBeenCalled();
  });

  it("starts OAuth with the chosen provider", async () => {
    const onProvider = vi.fn(async () => ok(session));
    const onSuccess = vi.fn();
    render(
      <SignIn
        onProvider={onProvider}
        onSignIn={vi.fn()}
        onSuccess={onSuccess}
        product="Acme"
        providers={[
          { id: "google", name: "Google" },
          { id: "github", name: "GitHub" },
        ]}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Continue with GitHub" }));
    expect(await screen.findByText("Signed in")).toBeTruthy();
    expect(onProvider).toHaveBeenCalledWith("github");
    expect(onSuccess).toHaveBeenCalledWith(session);
  });

  it("shows only the options the builder wires", () => {
    render(<SignIn onSignIn={vi.fn()} product="Acme" />);
    expect(screen.queryByRole("button", { name: "Passkey" })).toBeNull();
    expect(screen.queryByText("SSO")).toBeNull();
    expect(screen.queryByText("Forgot password?")).toBeNull();
    expect(screen.queryByText("Sign up")).toBeNull();
    expect(screen.queryByText("Email me a sign-in link")).toBeNull();
  });

  it("hides providers until the builder wires onProvider", () => {
    render(<SignIn onSignIn={vi.fn()} product="Acme" providers={[{ id: "google", name: "Google" }]} />);
    expect(screen.queryByText("Google")).toBeNull();
  });

  it("renders links through the builder's router and copy from their messages", () => {
    render(
      <WirefrontProvider link={AppLink} messages={{ "signIn.title": "Welcome to {product}" }}>
        <SignIn forgotPasswordHref="/forgot" onSignIn={vi.fn()} product="Acme" signUpHref="/join" />
      </WirefrontProvider>,
    );
    expect(screen.getByRole("heading").textContent).toBe("Welcome to Acme");
    expect(screen.getByText("Sign up").closest("a")?.getAttribute("href")).toBe("/join");
    expect(screen.getByText("Forgot password?").hasAttribute("data-app-link")).toBe(true);
  });

  it("shows an error that arrived with the page", () => {
    render(<SignIn error="Your session expired." onSignIn={vi.fn()} product="Acme" />);
    expect(screen.getByRole("alert").textContent).toBe("Your session expired.");
  });

  it("describes its backend operations", () => {
    expect(Object.keys(api)).toEqual(["signIn", "signInWithPasskey", "sendMagicLink", "startOAuth"]);
    expect(api.signIn.body.safeParse({ email: "ada@acme.dev", password: "x" }).success).toBe(true);
  });
});
