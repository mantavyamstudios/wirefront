// SPDX-License-Identifier: AGPL-3.0-only
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
// @vitest-environment jsdom
/**
 * The wiring contract of the auth screens after sign-in: what each action
 * receives, and what the screen shows for success, failure and unwired options.
 */
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { fail, ok } from "@wirefront/ui/wirefront/types";
import { ForgotPassword } from "@/pages/showcase/auth-forgot-password/view";
import { MagicLinkSent } from "@/pages/showcase/auth-magic-link-sent/view";
import { OtpVerify } from "@/pages/showcase/auth-otp-verify/view";
import { ResetPassword } from "@/pages/showcase/auth-reset-password/view";
import { SignUp } from "@/pages/showcase/auth-sign-up/view";
import { TwoFactor } from "@/pages/showcase/auth-two-factor/view";
import { VerifyEmail } from "@/pages/showcase/auth-verify-email/view";

afterEach(cleanup);

const session = { userId: "usr_01", redirectTo: "/dashboard" };
const type = (label: string | RegExp, value: string) => fireEvent.change(screen.getByLabelText(label), { target: { value } });
const click = (name: string | RegExp) => fireEvent.click(screen.getByRole("button", { name }));

/** Type a code into an OTP field, one digit per input. The first digit is named by the field's label. */
function enterCode(field: string, code: string) {
  [...code].forEach((digit, i) => {
    const label = i === 0 ? field : `Digit ${i + 1} of ${code.length}`;
    const input = screen.getAllByLabelText(label).find((el) => el.tagName === "INPUT");
    if (!input) throw new Error(`no input labelled "${label}"`);
    fireEvent.change(input, { target: { value: digit } });
  });
}

describe("SignUp", () => {
  it("validates, sends the details and reports the account", async () => {
    const onSignUp = vi.fn(async () => ok({ userId: "usr_02" }));
    const onSuccess = vi.fn();
    render(<SignUp onSignUp={onSignUp} onSuccess={onSuccess} product="Acme" />);
    click("Create account");
    expect(await screen.findByText("Enter a valid email address.")).toBeTruthy();
    expect(onSignUp).not.toHaveBeenCalled();

    type("Name", "Ada");
    type("Work email", "ada@acme.dev");
    type("Password", "correct-horse");
    click("Create account");
    expect(await screen.findByText("Account created")).toBeTruthy();
    expect(onSignUp).toHaveBeenCalledWith({ name: "Ada", email: "ada@acme.dev", password: "correct-horse" });
    expect(onSuccess).toHaveBeenCalledWith({ userId: "usr_02" });
  });

  it("shows the backend's field error and hides unwired links", async () => {
    render(<SignUp onSignUp={async () => fail(undefined, { email: "Already registered." })} product="Acme" />);
    type("Work email", "ada@acme.dev");
    type("Password", "correct-horse");
    click("Create account");
    expect(await screen.findByText("Already registered.")).toBeTruthy();
    expect(screen.queryByText("Terms")).toBeNull();
    expect(screen.queryByText("Sign in")).toBeNull();
  });
});

describe("ForgotPassword", () => {
  it("sends the link, confirms, and resends to the same address", async () => {
    const onSend = vi.fn(async () => {});
    render(<ForgotPassword expiresInMinutes={30} onSend={onSend} resendAfter={0} />);
    type("Email", "ada@acme.dev");
    click("Send reset link");
    expect(await screen.findByText("We sent a reset link to ada@acme.dev. It expires in 30 minutes.")).toBeTruthy();
    expect(onSend).toHaveBeenCalledWith({ email: "ada@acme.dev" });
    click("Resend");
    await waitFor(() => expect(onSend).toHaveBeenCalledTimes(2));
    expect(onSend).toHaveBeenLastCalledWith({ email: "ada@acme.dev" });
  });
});

describe("ResetPassword", () => {
  it("checks the confirmation, then sends the token with the new password", async () => {
    const onReset = vi.fn(async () => {});
    render(<ResetPassword onReset={onReset} token="tok_1" />);
    type("New password", "correct-horse");
    type("Confirm password", "correct-hose");
    click("Update password");
    expect(await screen.findByText("The passwords don’t match.")).toBeTruthy();
    expect(onReset).not.toHaveBeenCalled();

    type("Confirm password", "correct-horse");
    click("Update password");
    expect(await screen.findByText("Password updated")).toBeTruthy();
    expect(onReset).toHaveBeenCalledWith({ token: "tok_1", password: "correct-horse" });
  });

  it("shows an expired link instead of the form", () => {
    render(<ResetPassword forgotPasswordHref="/forgot" linkError="Expired." onReset={vi.fn()} token="tok_1" />);
    expect(screen.getByText("This link has expired")).toBeTruthy();
    expect(screen.queryByLabelText("New password")).toBeNull();
    expect(screen.getByText("Request a new link").closest("a")?.getAttribute("href")).toBe("/forgot");
  });
});

describe("code screens", () => {
  it("VerifyEmail verifies a complete code and shows the backend's error", async () => {
    const onVerify = vi.fn(async ({ code }: { code: string }) => (code === "111111" ? fail("Wrong code.") : undefined));
    render(<VerifyEmail email="ada@acme.dev" onVerify={onVerify} />);
    enterCode("Verification code", "111111");
    expect((await screen.findByRole("alert")).textContent).toBe("Wrong code.");
    expect(screen.queryByText("Resend")).toBeNull();
    // The field stays filled after a wrong code; the user corrects it and presses Verify.
    enterCode("Verification code", "123456");
    click("Verify email");
    expect(await screen.findByText("Email verified")).toBeTruthy();
    expect(onVerify).toHaveBeenLastCalledWith({ code: "123456" });
  });

  it("OtpVerify signs in with the code and reports the session", async () => {
    const onVerify = vi.fn(async () => ok(session));
    const onSuccess = vi.fn();
    render(<OtpVerify email="ada@acme.dev" onSuccess={onSuccess} onVerify={onVerify} />);
    enterCode("One-time code", "123456");
    await waitFor(() => expect(onSuccess).toHaveBeenCalledWith(session));
    expect(onVerify).toHaveBeenCalledWith({ code: "123456" });
  });

  it("TwoFactor sends the method, code and remember choice, or a recovery code", async () => {
    const onVerify = vi.fn(async () => ok(session));
    render(<TwoFactor onVerify={onVerify} rememberDays={30} />);
    enterCode("Authentication code", "123456");
    fireEvent.click(screen.getByRole("switch"));
    click("Verify");
    await waitFor(() => expect(onVerify).toHaveBeenCalledWith({ method: "totp", code: "123456", rememberDevice: true }));

    click("Use a recovery code instead");
    type("Recovery code", "abcde-12345");
    click("Verify");
    await waitFor(() => expect(onVerify).toHaveBeenLastCalledWith({ method: "recovery", code: "abcde-12345" }));
  });
});

describe("MagicLinkSent", () => {
  it("resends when wired and hides what isn't", async () => {
    const onResend = vi.fn(async () => {});
    render(<MagicLinkSent email="ada@acme.dev" onResend={onResend} resendAfter={0} />);
    click("Resend link");
    await waitFor(() => expect(onResend).toHaveBeenCalled());
    expect(screen.queryByText(/Open /)).toBeNull();
    expect(screen.queryByText("use a different email")).toBeNull();
  });
});
