import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";

import { highlightCode } from "@/lib/shiki";

import manifestJson from "./flows.manifest.json";

/** One Dart file of a subflow, highlighted for both themes. */
export interface FlowSourceFile {
  code: string;
  html: string;
  /** Display path: relative to the subflow folder, or `lib/…` for shared files. */
  path: string;
  /** `flow` = inside the subflow folder; `shared` = imported from elsewhere. */
  scope: "flow" | "shared";
}

interface ManifestSubflow {
  dir: string;
  entryFile: string;
  localDeps: string[];
  slug: string;
}

const manifest = manifestJson as {
  categories: { slug: string; subflows: ManifestSubflow[] }[];
};

/** `apps/runtime/lib`, resolved from `apps/www` (the Next.js cwd). */
const RUNTIME_LIB = path.resolve(process.cwd(), "../runtime/lib");

function dartFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const full = path.join(dir, name);
    if (statSync(full).isDirectory()) {
      return dartFiles(full);
    }
    return name.endsWith(".dart") ? [full] : [];
  });
}

/**
 * Every Dart file a subflow is built from: the entry widget first, then the
 * rest of its folder, then files it imports from elsewhere in `lib/`.
 */
export async function getFlowSourceFiles(
  categorySlug: string,
  subflowSlug: string
): Promise<FlowSourceFile[] | null> {
  const sub = manifest.categories
    .find((category) => category.slug === categorySlug)
    ?.subflows.find((item) => item.slug === subflowSlug);
  if (!sub) {
    return null;
  }

  const flowDir = path.join(RUNTIME_LIB, "flows", sub.dir);
  const entry = path.join(RUNTIME_LIB, sub.entryFile);
  const own = dartFiles(flowDir).toSorted((a, b) => {
    if (a === entry) {
      return -1;
    }
    if (b === entry) {
      return 1;
    }
    return a.localeCompare(b);
  });
  const shared = sub.localDeps
    .filter((dep) => dep.endsWith(".dart"))
    .map((dep) => path.join(RUNTIME_LIB, dep))
    .filter((file) => existsSync(file));

  const toFile = async (
    file: string,
    scope: FlowSourceFile["scope"]
  ): Promise<FlowSourceFile> => {
    const code = readFileSync(file, "utf-8");
    return {
      code,
      html: await highlightCode(code, "dart"),
      path:
        scope === "flow"
          ? path.relative(flowDir, file)
          : `lib/${path.relative(RUNTIME_LIB, file)}`,
      scope,
    };
  };

  return Promise.all([
    ...own.map((file) => toFile(file, "flow")),
    ...shared.map((file) => toFile(file, "shared")),
  ]);
}
