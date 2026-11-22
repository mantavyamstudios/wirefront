// SPDX-License-Identifier: MIT
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
import * as z from "zod";
import { defineApi } from "@wirefront/ui/wirefront/api";

export const CanvasShape = z
  .object({
    id: z.string(),
    type: z.enum(["rectangle", "ellipse", "text"]),
    name: z.string(),
    x: z.number(),
    y: z.number(),
    width: z.number().min(0),
    height: z.number().min(0),
    /** Any CSS colour. */
    fill: z.string(),
    /** 0–100. */
    opacity: z.number().min(0).max(100),
    visible: z.boolean(),
    locked: z.boolean(),
    text: z.string().optional(),
  })
  .meta({ id: "CanvasShape" });
export type CanvasShape = z.infer<typeof CanvasShape>;

const ById = z.object({ id: z.string() });

/** The backend operations this screen calls. */
export const api = defineApi({
  getCanvas: {
    method: "GET",
    path: "/canvases/{id}",
    summary: "A canvas's shapes",
    params: ById,
    response: z.array(CanvasShape),
  },
  saveCanvas: {
    method: "PUT",
    path: "/canvases/{id}",
    summary: "Save a canvas's shapes",
    params: ById,
    body: z.array(CanvasShape),
  },
});
