import { loader } from "fumadocs-core/source";
import type { InferPageType } from "fumadocs-core/source";

import { flows } from "@/.source";

/** Flutter flow pages — `content/flows/<category>/<subflow>.mdx` at `/flows/*`. */
export const flowsSource = loader({
  baseUrl: "/flows",
  source: flows.toFumadocsSource(),
});

export type FlowDocPage = InferPageType<typeof flowsSource>;
