// SPDX-License-Identifier: AGPL-3.0-only
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
import { z } from "zod";
import { defineApi } from "@wirefront/ui/wirefront/api";

export const FlagStatus = z.enum(["stable", "beta", "experimental"]).meta({ id: "FlagStatus" });
export type FlagStatus = z.infer<typeof FlagStatus>;

export const FeatureFlag = z
  .object({ key: z.string(), description: z.string(), status: FlagStatus, enabled: z.boolean() })
  .meta({ id: "FeatureFlag" });
export type FeatureFlag = z.infer<typeof FeatureFlag>;

export const FlagGroup = z.object({ id: z.string(), title: z.string(), flags: z.array(FeatureFlag) }).meta({ id: "FlagGroup" });
export type FlagGroup = z.infer<typeof FlagGroup>;

export const ApiEnvironment = z.object({ id: z.string(), label: z.string(), host: z.string() }).meta({ id: "ApiEnvironment" });
export type ApiEnvironment = z.infer<typeof ApiEnvironment>;

export const DeveloperSettings = z
  .object({
    groups: z.array(FlagGroup),
    debug: z.boolean(),
    environments: z.array(ApiEnvironment),
    /** The id of the environment the client talks to. */
    environment: z.string(),
    /** Only admins can switch environments. */
    canSwitchEnvironment: z.boolean(),
  })
  .meta({ id: "DeveloperSettings" });
export type DeveloperSettings = z.infer<typeof DeveloperSettings>;

export const LogLevel = z.enum(["debug", "info", "warn", "error"]).meta({ id: "LogLevel" });
export type LogLevel = z.infer<typeof LogLevel>;

/** One line of the debug console. */
export const DebugLogLine = z
  .object({ id: z.string(), at: z.iso.datetime({ offset: true }), level: LogLevel, channel: z.string(), message: z.string() })
  .meta({ id: "DebugLogLine" });
export type DebugLogLine = z.infer<typeof DebugLogLine>;

export const SetFlagInput = z.object({ key: z.string(), enabled: z.boolean() }).meta({ id: "SetFlagInput" });
export type SetFlagInput = z.infer<typeof SetFlagInput>;

/** The backend operations this screen calls. */
export const api = defineApi({
  getDeveloperSettings: { method: "GET", path: "/me/developer", summary: "Feature flags, debug mode and API environment", response: DeveloperSettings },
  setFlag: { method: "PUT", path: "/me/flags/{key}", summary: "Turn a feature flag on or off for this account", params: z.object({ key: z.string() }), body: SetFlagInput.pick({ enabled: true }) },
  setDebug: { method: "PUT", path: "/me/developer/debug", summary: "Turn debug mode on or off", body: z.object({ enabled: z.boolean() }) },
  setEnvironment: {
    method: "PUT",
    path: "/me/developer/environment",
    summary: "Point the client at another API environment (admins only)",
    body: z.object({ environment: z.string() }),
    errors: { 403: "Only admins can switch environments" },
  },
});
