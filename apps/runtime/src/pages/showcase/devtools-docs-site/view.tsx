// SPDX-License-Identifier: MIT
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
// Includes MIT-licensed code © 2026 Sean Brydon (devl.dev) · see https://github.com/mantavyamstudios/wirefront/blob/main/NOTICE.md
// Ported from devl.dev (sean-brydon/devl.dev, registry item `docs-site`).
"use client";

import { Button } from "@wirefront/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@wirefront/ui/dialog";
import { Kbd } from "@wirefront/ui/kbd";
import { cn } from "@wirefront/ui/lib/utils";
import { Sheet, SheetContent, SheetTitle } from "@wirefront/ui/sheet";
import { ScreenBoundary } from "@wirefront/ui/wirefront/boundary";
import { interpolate, useFormat, useMessages, WirefrontLink } from "@wirefront/ui/wirefront/provider";
import { ScrollRegion } from "@wirefront/ui/wirefront/scroll-region";
import { ArrowLeftIcon, ArrowRightIcon, CheckIcon, ChevronDownIcon, ChevronRightIcon, CopyIcon, CornerDownLeftIcon, FileTextIcon, HashIcon, InfoIcon, MenuIcon, PencilIcon, SearchIcon, ThumbsDownIcon, ThumbsUpIcon, TriangleAlertIcon, XIcon } from "lucide-react";
import { AnimatePresence, LayoutGroup, MotionConfig, motion } from "motion/react";
import { Fragment, type ReactNode, useEffect, useId, useLayoutEffect, useMemo, useRef, useState } from "react";
import type { DocsBlock, DocsLang, DocsPage, DocsSection } from "./schema";

/** Every string on the screen; override any of them with WirefrontProvider `messages` ("docsSite.<key>"). */
export const DOCS_SITE_MESSAGES = {
  docs: "Docs",
  openNav: "Open navigation",
  closeNav: "Close navigation",
  navigation: "Documentation",
  sections: "Sections",
  pages: "Pages",
  search: "Search docs",
  searchDialog: "Search documentation",
  searchInput: "Search the docs",
  searchPlaceholder: "Search guides and API reference…",
  results: "Results",
  noResults: "Nothing for “{query}”. Try another word.",
  pagesHeading: "Pages",
  dashboard: "Dashboard",
  updated: "Updated {date}",
  readTime: "{minutes} min read",
  onThisPage: "On this page",
  linkTo: "Link to {title}",
  helpful: "Was this page helpful?",
  yes: "Yes",
  no: "No",
  thanksYes: "Thanks! Glad it helped.",
  thanksNo: "Thanks. We read every one of these and fix the page.",
  edit: "Edit this page",
  previous: "Previous",
  next: "Next",
  backToTop: "Back to top",
  copy: "Copy code",
  copied: "Copied",
  copyFailed: "Couldn’t copy",
  codeSample: "Code sample",
  terminal: "terminal",
  languages: "Language",
  escape: "Esc",
};
type Messages = typeof DOCS_SITE_MESSAGES;

export interface DocsSiteProps {
  product: string;
  version?: string;
  pages: DocsPage[];
  /** The page to open first. */
  initialPage?: string;
  /** Top-bar links, each covering some sidebar groups; it goes to the first page in them. */
  topNav?: { label: string; groups: string[] }[];
  /** Language labels for code samples, in tab order. */
  languages: { id: DocsLang; label: string }[];
  dashboardHref?: string;
  editHref?: (pageId: string) => string;
  /** Records whether a page helped. The question is hidden without it. */
  onFeedback?: (pageId: string, helpful: boolean) => void;
  className?: string;
}

const ease = [0.23, 1, 0.32, 1] as const;
const spring = { type: "spring", stiffness: 520, damping: 42 } as const;
const KEYWORDS = /^(const|let|var|await|async|for|of|in|new|return|import|from|if|else|func|err|nil|range|def|print|True|False|None|curl)$/;
const TOKENS = /((?:\/\/|#).*$)|("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'|`(?:[^`\\]|\\.)*`)|(\s-[A-Za-z]\b|\s--?[a-z-]+)|(\b\d[\d_.]*\b)|([A-Za-z_$][\w$]*)/gm;

/** Light syntax colouring for samples in several languages. */
function highlight(code: string): ReactNode[] {
  const out: ReactNode[] = [];
  let last = 0;
  for (const m of code.matchAll(TOKENS)) {
    const at = m.index ?? 0;
    if (at > last) out.push(code.slice(last, at));
    const tok = m[0];
    const after = at + tok.length;
    const tone =
      m[1] && (m[1].startsWith("//") || /(^|\s)#/.test(code.slice(Math.max(0, at - 1), at + 1)))
        ? "text-muted-foreground italic"
        : m[2]
          ? "text-category-2-foreground"
          : m[3]
            ? "text-category-1-foreground"
            : m[4]
              ? "text-category-3-foreground"
              : m[5] && KEYWORDS.test(tok)
                ? "text-category-5-foreground"
                : m[5] && (/^[A-Z]/.test(tok) || code[after] === "(")
                  ? "text-category-1-foreground"
                  : null;
    out.push(
      tone ? (
        <span className={tone} key={at}>
          {tok}
        </span>
      ) : (
        tok
      ),
    );
    last = after;
  }
  if (last < code.length) out.push(code.slice(last));
  return out;
}

/** Text with `code` spans. */
function Inline({ text }: { text: string }) {
  let at = 0;
  return (
    <>
      {text.split(/(`[^`]+`)/g).filter(Boolean).map((part) => {
        const key = at;
        at += part.length;
        return part.length > 1 && part.startsWith("`") ? (
          <code className="rounded-md border bg-muted px-1 py-px font-mono text-[0.8125rem]" key={key}>
            {part.slice(1, -1)}
          </code>
        ) : (
          <Fragment key={key}>{part}</Fragment>
        );
      })}
    </>
  );
}

function CodeTabs({ samples, title, lang, onLang, languages, t }: { samples: Partial<Record<DocsLang, string>>; title?: string; lang: DocsLang; onLang: (l: DocsLang) => void; languages: { id: DocsLang; label: string }[]; t: Messages }) {
  const available = languages.filter((l) => samples[l.id]);
  const current = samples[lang] ? lang : (available[0]?.id ?? lang);
  const [copy, setCopy] = useState<"idle" | "copied" | "failed">("idle");
  useEffect(() => {
    if (copy === "idle") return;
    const id = window.setTimeout(() => setCopy("idle"), 1600);
    return () => window.clearTimeout(id);
  }, [copy]);
  const single = available.length === 1 && !title;
  return (
    <div className="overflow-hidden rounded-xl border bg-card shadow-xs/5">
      <div className="flex h-10 items-center gap-1 border-b bg-muted/40 ps-1.5 pe-1.5">
        {title ? <span className="hidden min-w-0 flex-1 truncate ps-1.5 pe-2 font-medium text-muted-foreground text-xs @2xl:block">{title}</span> : null}
        {single ? (
          <span className="px-1.5 font-mono text-muted-foreground text-xs">{t.terminal}</span>
        ) : (
          <fieldset className="m-0 flex min-w-0 gap-0.5 overflow-x-auto border-0 p-0 scrollbar-none">
            <legend className="sr-only">{t.languages}</legend>
            {available.map((l) => (
              <button aria-pressed={current === l.id} className={cn("relative h-7 shrink-0 cursor-pointer rounded-md px-2 font-medium text-xs outline-none focus-visible:ring-2 focus-visible:ring-ring", current === l.id ? "text-foreground" : "text-muted-foreground hover:text-foreground")} key={l.id} onClick={() => onLang(l.id)} type="button">
                {current === l.id ? <span className="absolute inset-0 rounded-md bg-background shadow-xs/5 ring-1 ring-border dark:bg-accent dark:ring-0" /> : null}
                <span className="relative">{l.label}</span>
              </button>
            ))}
          </fieldset>
        )}
        <button
          aria-label={copy === "copied" ? t.copied : copy === "failed" ? t.copyFailed : t.copy}
          className={cn("ms-auto flex size-8 shrink-0 cursor-pointer items-center justify-center rounded-md text-muted-foreground outline-none transition-[color,background-color,scale] duration-150 ease-out hover:bg-accent hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring active:scale-90", title && "@2xl:ms-1")}
          onClick={() => {
            if (!navigator.clipboard) {
              setCopy("failed");
              return;
            }
            navigator.clipboard.writeText(samples[current] ?? "").then(
              () => setCopy("copied"),
              () => setCopy("failed"),
            );
          }}
          type="button"
        >
          <AnimatePresence initial={false} mode="popLayout">
            <motion.span animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }} initial={{ opacity: 0, scale: 0.8 }} key={copy} transition={{ duration: 0.12 }}>
              {copy === "copied" ? <CheckIcon className="size-3.5 text-success" /> : copy === "failed" ? <XIcon className="size-3.5 text-destructive" /> : <CopyIcon className="size-3.5" />}
            </motion.span>
          </AnimatePresence>
        </button>
      </div>
      <ScrollRegion aria-label={title ?? t.codeSample} orientation="horizontal">
        <pre className="px-4 py-3 font-mono text-[12.5px] leading-6">
          <code>{highlight(samples[current] ?? "")}</code>
        </pre>
      </ScrollRegion>
    </div>
  );
}

function Block({ block, lang, onLang, languages, t }: { block: DocsBlock; lang: DocsLang; onLang: (l: DocsLang) => void; languages: { id: DocsLang; label: string }[]; t: Messages }) {
  switch (block.type) {
    case "p":
      return (
        <p className="text-pretty text-[15px] text-foreground/85 leading-7">
          <Inline text={block.text} />
        </p>
      );
    case "list":
      return (
        <ul className="flex flex-col gap-1 ps-1">
          {block.items.map((it) => (
            <li className="flex gap-3 text-[15px] leading-7" key={it}>
              <span aria-hidden className="mt-3.25 size-1 shrink-0 rounded-full bg-muted-foreground/70" />
              <span className="text-foreground/85">
                <Inline text={it} />
              </span>
            </li>
          ))}
        </ul>
      );
    case "steps":
      return (
        <ol className="relative flex flex-col gap-3 before:absolute before:inset-s-3 before:top-3 before:bottom-3 before:w-px before:bg-border">
          {block.items.map((it, i) => (
            <li className="relative flex gap-3" key={it}>
              <span aria-hidden className="z-10 flex size-6 shrink-0 items-center justify-center rounded-full border bg-background font-medium text-xs tabular-nums">
                {i + 1}
              </span>
              <span className="text-pretty text-[15px] text-foreground/85 leading-6">
                <Inline text={it} />
              </span>
            </li>
          ))}
        </ol>
      );
    case "callout": {
      const Icon = block.tone === "info" ? InfoIcon : TriangleAlertIcon;
      return (
        <div className={cn("flex gap-3 rounded-xl border px-4 py-3.5", block.tone === "info" ? "border-info/16 bg-info/4 dark:border-info/14 dark:bg-info/6" : "border-warning/20 bg-warning/5 dark:border-warning/14 dark:bg-warning/6")} role="note">
          <Icon aria-hidden className={cn("mt-0.75 size-4 shrink-0", block.tone === "info" ? "text-info-foreground" : "text-warning-foreground")} />
          <div className="min-w-0">
            <div className="font-medium">{block.title}</div>
            <p className="mt-1 text-pretty text-muted-foreground leading-6">
              <Inline text={block.text} />
            </p>
          </div>
        </div>
      );
    }
    case "code":
      return <CodeTabs lang={lang} languages={languages} onLang={onLang} samples={block.samples} t={t} title={block.title} />;
    case "table":
      return (
        <ScrollRegion aria-label={block.head.join(", ")} className="rounded-xl border" orientation="horizontal">
          <table className="w-full min-w-105 text-start text-sm">
            <thead className="bg-muted/30">
              <tr>
                {block.head.map((h) => (
                  <th className="border-b px-3.5 py-2 text-start font-medium text-muted-foreground text-xs" key={h}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {block.rows.map((r) => (
                <tr className="border-b last:border-b-0" key={r.join("|")}>
                  {r.map((c, col) => (
                    <td className={cn("px-3.5 py-2 align-baseline leading-6", col === 0 ? "font-mono text-[0.8125rem] text-foreground" : "text-foreground/85")} key={`${block.head[col] ?? ""}:${c}`}>
                      {c}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </ScrollRegion>
      );
  }
}

interface SearchHit {
  id: string;
  page: DocsPage;
  section?: DocsSection;
}

function SearchDialog({ open, onOpenChange, pages, onPick, t }: { open: boolean; onOpenChange: (open: boolean) => void; pages: DocsPage[]; onPick: (page: string, section?: string) => void; t: Messages }) {
  const uid = useId();
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const hits = useMemo<SearchHit[]>(() => {
    const q = query.trim().toLowerCase();
    const all: SearchHit[] = pages.flatMap((p) => [{ id: p.id, page: p }, ...p.sections.map((s) => ({ id: `${p.id}#${s.id}`, page: p, section: s }))]);
    if (!q) return all.filter((h) => !h.section).slice(0, 8);
    const score = (h: SearchHit) => {
      const title = (h.section ? h.section.title : h.page.title).toLowerCase();
      if (title.startsWith(q)) return 0;
      if (title.includes(q)) return 1;
      if (h.page.title.toLowerCase().includes(q)) return 2;
      const body = h.section ? h.section.blocks.map((b) => ("text" in b ? b.text : "")).join(" ") : h.page.lead;
      return body.toLowerCase().includes(q) ? 3 : 9;
    };
    return all
      .map((h) => ({ h, s: score(h) }))
      .filter((x) => x.s < 9)
      .sort((a, b) => a.s - b.s)
      .slice(0, 10)
      .map((x) => x.h);
  }, [pages, query]);
  const optionId = (h: SearchHit) => `${uid}-${h.id.replace(/[^\w-]/g, "-")}`;
  const current = hits[active];

  const mark = (text: string) => {
    const q = query.trim();
    const i = q ? text.toLowerCase().indexOf(q.toLowerCase()) : -1;
    if (i < 0) return text;
    return (
      <>
        {text.slice(0, i)}
        <mark className="rounded-sm bg-warning/24 text-foreground">{text.slice(i, i + q.length)}</mark>
        {text.slice(i + q.length)}
      </>
    );
  };

  return (
    <Dialog
      onOpenChange={(next) => {
        onOpenChange(next);
        if (!next) {
          setQuery("");
          setActive(0);
        }
      }}
      open={open}
    >
      <DialogContent className="top-16 flex max-h-110 translate-y-0 flex-col gap-0 overflow-hidden p-0 sm:max-w-xl" showCloseButton={false}>
        <DialogTitle className="sr-only">{t.searchDialog}</DialogTitle>
        <div className="flex items-center gap-2 border-b px-3">
          <SearchIcon aria-hidden className="size-4 shrink-0 text-muted-foreground" />
          <input
            aria-activedescendant={current ? optionId(current) : undefined}
            aria-autocomplete="list"
            aria-controls={`${uid}-list`}
            aria-expanded={hits.length > 0}
            aria-label={t.searchInput}
            className="h-12 min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            onChange={(e) => {
              setQuery(e.target.value);
              setActive(0);
            }}
            onKeyDown={(e) => {
              if (e.key === "ArrowDown") {
                e.preventDefault();
                setActive((a) => Math.min(hits.length - 1, a + 1));
              } else if (e.key === "ArrowUp") {
                e.preventDefault();
                setActive((a) => Math.max(0, a - 1));
              } else if (e.key === "Enter" && current) {
                onPick(current.page.id, current.section?.id);
              }
            }}
            placeholder={t.searchPlaceholder}
            role="combobox"
            value={query}
          />
          <Kbd>{t.escape}</Kbd>
        </div>
        <div aria-label={t.results} className="min-h-0 flex-1 overflow-y-auto p-1.5" id={`${uid}-list`} role="listbox">
          {hits.length === 0 ? (
            <div className="px-4 py-10 text-center text-muted-foreground text-sm" role="presentation">
              {interpolate(t.noResults, { query })}
            </div>
          ) : (
            <>
              {query ? null : (
                <div className="px-2.5 pt-1.5 pb-1 font-medium text-muted-foreground text-xs" role="presentation">
                  {t.pagesHeading}
                </div>
              )}
              {hits.map((h, i) => (
                <div
                  aria-selected={i === active}
                  className={cn("flex cursor-pointer items-center gap-3 rounded-lg px-2.5 py-2", i === active && "bg-accent")}
                  id={optionId(h)}
                  key={h.id}
                  onClick={() => onPick(h.page.id, h.section?.id)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      onPick(h.page.id, h.section?.id);
                    }
                  }}
                  onMouseMove={() => setActive(i)}
                  role="option"
                  tabIndex={-1}
                >
                  <span aria-hidden className="flex size-7 shrink-0 items-center justify-center rounded-lg border bg-card text-muted-foreground">
                    {h.section ? <HashIcon className="size-3.5" /> : <FileTextIcon className="size-3.5" />}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-medium">{mark(h.section ? h.section.title : h.page.title)}</span>
                    <span className="block truncate text-muted-foreground text-xs">
                      {h.page.group}
                      {h.section ? ` › ${h.page.title}` : ""}
                    </span>
                  </span>
                  {i === active ? <CornerDownLeftIcon aria-hidden className="size-3.5 shrink-0 text-muted-foreground" /> : null}
                </div>
              ))}
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function scrollToSection(box: HTMLElement | null, id: string, smooth = true) {
  const el = box?.querySelector<HTMLElement>(`[data-section="${id}"]`);
  if (box && el) box.scrollTo({ top: el.offsetTop - 16, behavior: smooth ? "smooth" : "auto" });
}

function DocsSiteScreen({ product, version, pages, initialPage, topNav = [], languages, dashboardHref, editHref, onFeedback, className }: DocsSiteProps) {
  const t = useMessages("docsSite", DOCS_SITE_MESSAGES);
  const fmt = useFormat();
  const [pageId, setPageId] = useState(initialPage ?? pages[0]?.id ?? "");
  const [lang, setLang] = useState<DocsLang>(languages[0]?.id ?? "node");
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const [search, setSearch] = useState(false);
  const [drawer, setDrawer] = useState(false);
  const [tocOpen, setTocOpen] = useState(false);
  const [feedback, setFeedback] = useState<Record<string, boolean>>({});
  const [closedGroups, setClosedGroups] = useState<Set<string>>(() => new Set());
  const rootRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const pendingSection = useRef<string | null>(null);

  const page = pages.find((p) => p.id === pageId) ?? pages[0];
  const index = page ? pages.indexOf(page) : -1;
  const prev = pages[index - 1];
  const next = pages[index + 1];
  const groups = Array.from(new Set(pages.map((p) => p.group)));

  const go = (id: string, section?: string) => {
    setSearch(false);
    setDrawer(false);
    setTocOpen(false);
    if (id === page?.id) {
      if (section) scrollToSection(scrollRef.current, section);
      else scrollRef.current?.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    pendingSection.current = section ?? null;
    setPageId(id);
  };

  // On a new page: jump to the requested section, or the top.
  useLayoutEffect(() => {
    const box = scrollRef.current;
    if (!box || !page) return;
    if (pendingSection.current) {
      scrollToSection(box, pendingSection.current, false);
      pendingSection.current = null;
    } else box.scrollTop = 0;
    setActiveSection(page.sections[0]?.id ?? null);
  }, [page]);

  const onScroll = () => {
    const box = scrollRef.current;
    if (!box || !page) return;
    let current = page.sections[0]?.id ?? null;
    for (const s of page.sections) {
      const el = box.querySelector<HTMLElement>(`[data-section="${s.id}"]`);
      if (el && el.offsetTop - 120 <= box.scrollTop) current = s.id;
    }
    if (box.scrollTop + box.clientHeight >= box.scrollHeight - 4) current = page.sections.at(-1)?.id ?? current;
    if (current !== activeSection) setActiveSection(current);
  };

  // ⌘K or / opens search; [ and ] move between pages.
  const keysRef = useRef<(e: KeyboardEvent) => void>(() => {});
  keysRef.current = (e) => {
    if (search) return;
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
      e.preventDefault();
      setSearch(true);
      return;
    }
    const target = e.target as HTMLElement;
    if (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || e.metaKey || e.ctrlKey || e.altKey) return;
    if (e.key === "/") {
      e.preventDefault();
      setSearch(true);
    } else if (e.key === "[" && prev) go(prev.id);
    else if (e.key === "]" && next) go(next.id);
  };
  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    const onKey = (e: KeyboardEvent) => keysRef.current(e);
    el.addEventListener("keydown", onKey);
    return () => el.removeEventListener("keydown", onKey);
  }, []);

  if (!page) return null;

  const sidebar = (
    <nav aria-label={t.navigation} className="flex flex-col gap-6 px-3 py-5">
      {groups.map((g) => {
        const closed = closedGroups.has(g);
        return (
          <div key={g}>
            <button
              aria-expanded={!closed}
              className="group/g mb-1 flex h-6 w-full cursor-pointer items-center justify-between rounded-md px-2.5 text-start font-medium text-foreground text-xs outline-none focus-visible:ring-2 focus-visible:ring-ring"
              onClick={() =>
                setClosedGroups((c) => {
                  const n = new Set(c);
                  if (n.has(g)) n.delete(g);
                  else n.add(g);
                  return n;
                })
              }
              type="button"
            >
              {g}
              <ChevronDownIcon aria-hidden className={cn("size-3.5 text-muted-foreground transition-[rotate,color] duration-200 group-hover/g:text-foreground", closed && "-rotate-90 rtl:rotate-90")} />
            </button>
            <AnimatePresence initial={false}>
              {closed ? null : (
                <motion.ul animate={{ height: "auto", opacity: 1 }} className="flex flex-col overflow-hidden" exit={{ height: 0, opacity: 0 }} initial={{ height: 0, opacity: 0 }} transition={{ duration: 0.2, ease }}>
                  {pages
                    .filter((p) => p.group === g)
                    .map((p) => {
                      const on = p.id === page.id;
                      return (
                        <li key={p.id}>
                          <button aria-current={on ? "page" : undefined} className={cn("relative flex h-8 w-full cursor-pointer items-center rounded-lg px-2.5 text-start text-[13px] outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring", on ? "font-medium text-foreground" : "text-muted-foreground hover:bg-accent/60 hover:text-foreground")} onClick={() => go(p.id)} type="button">
                            {on ? <motion.span className="absolute inset-0 rounded-lg bg-accent" layoutId="docs-nav-pill" transition={spring} /> : null}
                            <span className="relative truncate">{p.title}</span>
                            {p.badge ? <span className="relative ms-auto rounded-full bg-info/12 px-1.5 font-medium text-[10px] text-info-foreground">{p.badge}</span> : null}
                          </button>
                        </li>
                      );
                    })}
                </motion.ul>
              )}
            </AnimatePresence>
          </div>
        );
      })}
    </nav>
  );

  const toc = (
    <LayoutGroup id="docs-toc">
      <ul className="relative flex flex-col border-s">
        {page.sections.map((s) => {
          const on = s.id === activeSection;
          return (
            <li className="relative" key={s.id}>
              {on ? <motion.span className="absolute inset-y-1 -inset-s-px w-0.5 rounded-full bg-foreground" layoutId="toc-rail" transition={spring} /> : null}
              <button aria-current={on ? "location" : undefined} className={cn("w-full cursor-pointer rounded-e-md py-1.5 ps-3.5 pe-2 text-start text-[13px] outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring", on ? "font-medium text-foreground" : "text-muted-foreground hover:text-foreground")} onClick={() => go(page.id, s.id)} type="button">
                {s.title}
              </button>
            </li>
          );
        })}
      </ul>
    </LayoutGroup>
  );

  const answered = feedback[page.id];

  return (
    <MotionConfig reducedMotion="user">
      <div className={cn("@container relative isolate flex h-svh w-full flex-col overflow-hidden bg-background text-foreground text-sm outline-none", className)} ref={rootRef}>
        <header className="flex h-14 shrink-0 items-center gap-3 border-b px-3 @3xl:px-5">
          <Button aria-label={t.openNav} className="@4xl:hidden" onClick={() => setDrawer(true)} size="icon-sm" variant="ghost">
            <MenuIcon />
          </Button>
          <button className="flex shrink-0 cursor-pointer items-center gap-2 rounded-md outline-none focus-visible:ring-2 focus-visible:ring-ring" onClick={() => pages[0] && go(pages[0].id)} type="button">
            <svg aria-hidden="true" className="size-6" viewBox="0 0 24 24">
              <rect className="fill-foreground" height="24" rx="7" width="24" />
              <path className="stroke-background" d="M7 17 12 7l5 10M9.2 13h5.6" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
            </svg>
            <span className="font-heading font-semibold tracking-tight">{product}</span>
            <span className="hidden text-muted-foreground @md:inline">{t.docs}</span>
          </button>
          {version ? <span className="hidden rounded-md border px-1.5 py-0.5 font-mono text-[11px] text-muted-foreground @xl:inline">{version}</span> : null}
          {topNav.length ? (
            <LayoutGroup id="docs-top">
              <nav aria-label={t.sections} className="ms-2 hidden items-center gap-1 @4xl:flex">
                {topNav.map((l) => {
                  const on = l.groups.includes(page.group);
                  const target = pages.find((p) => l.groups.includes(p.group));
                  return (
                    <button aria-current={on ? "page" : undefined} className={cn("relative flex h-14 cursor-pointer items-center px-2.5 outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset", on ? "font-medium text-foreground" : "text-muted-foreground hover:text-foreground")} disabled={!target} key={l.label} onClick={() => target && go(target.id)} type="button">
                      {l.label}
                      {on ? <motion.span className="absolute inset-x-2.5 -bottom-px h-0.5 rounded-full bg-foreground" layoutId="docs-top-line" transition={spring} /> : null}
                    </button>
                  );
                })}
              </nav>
            </LayoutGroup>
          ) : null}
          <div className="ms-auto flex items-center gap-2">
            <button className="flex h-8 cursor-pointer items-center gap-2 rounded-lg border bg-background px-2.5 text-muted-foreground shadow-xs/5 outline-none transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring @xl:w-56 dark:bg-input/32" onClick={() => setSearch(true)} type="button">
              <SearchIcon aria-hidden className="size-4" />
              <span className="sr-only flex-1 text-start @xl:not-sr-only">{t.search}</span>
              <Kbd className="hidden @xl:inline-flex">⌘K</Kbd>
            </button>
            {dashboardHref ? (
              <WirefrontLink className="hidden h-8 items-center rounded-lg border px-3 font-medium text-sm outline-none hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring @2xl:inline-flex" href={dashboardHref} rel="noreferrer" target="_blank">
                {t.dashboard}
              </WirefrontLink>
            ) : null}
          </div>
        </header>

        <div className="flex min-h-0 flex-1">
          <aside aria-label={t.pages} className="hidden w-60 shrink-0 overflow-y-auto border-e scrollbar-thin @4xl:block">
            {sidebar}
          </aside>

          <div className="min-w-0 flex-1 overflow-y-auto scroll-pt-4 scrollbar-thin" onScroll={onScroll} ref={scrollRef}>
            <div className="mx-auto flex max-w-260 gap-10 px-4 pt-8 pb-16 @3xl:px-10">
              <motion.article animate={{ opacity: 1, y: 0 }} className="min-w-0 max-w-170 flex-1" initial={{ opacity: 0, y: 6 }} key={page.id} transition={{ duration: 0.2, ease }}>
                <div className="flex items-center gap-1.5 text-muted-foreground text-xs">
                  <span>{page.group}</span>
                  <ChevronRightIcon aria-hidden className="size-3 rtl:-scale-x-100" />
                  <span className="text-foreground">{page.title}</span>
                </div>
                <h1 className="mt-3 text-balance font-heading font-semibold text-3xl tracking-tight">{page.title}</h1>
                <p className="mt-3 text-pretty text-[17px] text-muted-foreground leading-7">{page.lead}</p>
                <div className="mt-4 flex items-center gap-3 text-muted-foreground text-xs">
                  <span>{interpolate(t.updated, { date: fmt.date(`${page.updatedAt}T00:00:00Z`, { month: "short", day: "numeric", timeZone: "UTC" }) })}</span>
                  <span aria-hidden className="size-0.5 rounded-full bg-muted-foreground" />
                  <span>{interpolate(t.readTime, { minutes: page.minutes })}</span>
                </div>

                {page.sections.length > 1 ? (
                  <div className="mt-6 rounded-xl border @6xl:hidden">
                    <button aria-expanded={tocOpen} className="flex h-10 w-full cursor-pointer items-center justify-between rounded-xl px-3.5 font-medium outline-none focus-visible:ring-2 focus-visible:ring-ring" onClick={() => setTocOpen((o) => !o)} type="button">
                      {t.onThisPage}
                      <ChevronDownIcon aria-hidden className={cn("size-4 text-muted-foreground transition-transform duration-200", tocOpen && "rotate-180")} />
                    </button>
                    <AnimatePresence initial={false}>
                      {tocOpen ? (
                        <motion.div animate={{ height: "auto", opacity: 1 }} className="overflow-hidden" exit={{ height: 0, opacity: 0 }} initial={{ height: 0, opacity: 0 }} transition={{ duration: 0.2, ease }}>
                          <div className="px-3.5 pb-3">{toc}</div>
                        </motion.div>
                      ) : null}
                    </AnimatePresence>
                  </div>
                ) : null}

                {page.sections.map((s) => (
                  <section className="mt-10 flex flex-col gap-4" data-section={s.id} key={s.id}>
                    <h2 className="group/h flex items-center gap-2 font-heading font-semibold text-xl tracking-tight">
                      {s.title}
                      <button aria-label={interpolate(t.linkTo, { title: s.title })} className="cursor-pointer rounded text-muted-foreground opacity-0 outline-none transition-opacity focus-visible:opacity-100 focus-visible:ring-2 focus-visible:ring-ring group-hover/h:opacity-100" onClick={() => go(page.id, s.id)} type="button">
                        <HashIcon aria-hidden className="size-4" />
                      </button>
                    </h2>
                    {s.blocks.map((b) => (
                      <Block block={b} key={JSON.stringify(b)} lang={lang} languages={languages} onLang={setLang} t={t} />
                    ))}
                  </section>
                ))}

                <div className="mt-12 flex flex-wrap items-center gap-3 border-t pt-6">
                  {onFeedback ? (
                    <AnimatePresence initial={false} mode="wait">
                      {answered !== undefined ? (
                        <motion.p animate={{ opacity: 1 }} className="text-muted-foreground" exit={{ opacity: 0 }} initial={{ opacity: 0 }} key="thanks" role="status" transition={{ duration: 0.15 }}>
                          {answered ? t.thanksYes : t.thanksNo}
                        </motion.p>
                      ) : (
                        <motion.div animate={{ opacity: 1 }} className="flex items-center gap-3" exit={{ opacity: 0 }} initial={{ opacity: 0 }} key="ask" transition={{ duration: 0.15 }}>
                          <span className="text-muted-foreground">{t.helpful}</span>
                          {[true, false].map((helpful) => (
                            <Button
                              key={String(helpful)}
                              onClick={() => {
                                setFeedback((f) => ({ ...f, [page.id]: helpful }));
                                onFeedback(page.id, helpful);
                              }}
                              size="sm"
                              variant="outline"
                            >
                              {helpful ? <ThumbsUpIcon /> : <ThumbsDownIcon />}
                              {helpful ? t.yes : t.no}
                            </Button>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  ) : null}
                  {editHref ? (
                    <WirefrontLink className="ms-auto flex items-center gap-1.5 rounded text-muted-foreground text-xs outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring @6xl:hidden" href={editHref(page.id)} rel="noreferrer" target="_blank">
                      <PencilIcon aria-hidden className="size-3.5" />
                      {t.edit}
                    </WirefrontLink>
                  ) : null}
                </div>

                <div className="mt-6 grid grid-cols-1 gap-3 @xl:grid-cols-2">
                  {prev ? (
                    <button className="group/pn flex cursor-pointer flex-col items-start gap-1 rounded-xl border p-4 text-start outline-none transition-[border-color,scale] duration-150 ease-out hover:border-foreground/20 focus-visible:ring-2 focus-visible:ring-ring active:scale-[0.98]" onClick={() => go(prev.id)} type="button">
                      <span className="flex items-center gap-1.5 text-muted-foreground text-xs">
                        <ArrowLeftIcon aria-hidden className="size-3.5 transition-transform duration-150 group-hover/pn:-translate-x-0.5 rtl:-scale-x-100" />
                        {t.previous} <Kbd className="h-4 text-[10px]">[</Kbd>
                      </span>
                      <span className="font-medium">{prev.title}</span>
                    </button>
                  ) : (
                    <span className="hidden @xl:block" />
                  )}
                  {next ? (
                    <button className="group/pn flex cursor-pointer flex-col items-end gap-1 rounded-xl border p-4 text-end outline-none transition-[border-color,scale] duration-150 ease-out hover:border-foreground/20 focus-visible:ring-2 focus-visible:ring-ring active:scale-[0.98]" onClick={() => go(next.id)} type="button">
                      <span className="flex items-center gap-1.5 text-muted-foreground text-xs">
                        <Kbd className="h-4 text-[10px]">]</Kbd> {t.next}
                        <ArrowRightIcon aria-hidden className="size-3.5 transition-transform duration-150 group-hover/pn:translate-x-0.5 rtl:-scale-x-100" />
                      </span>
                      <span className="font-medium">{next.title}</span>
                    </button>
                  ) : null}
                </div>
              </motion.article>

              <aside aria-label={t.onThisPage} className="sticky top-8 hidden h-fit w-52 shrink-0 @6xl:block">
                <div className="mb-2 font-medium text-xs">{t.onThisPage}</div>
                {toc}
                <div className="mt-6 flex flex-col gap-2 border-t pt-4 text-muted-foreground text-xs">
                  {editHref ? (
                    <WirefrontLink className="flex items-center gap-1.5 rounded outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring" href={editHref(page.id)} rel="noreferrer" target="_blank">
                      <PencilIcon aria-hidden className="size-3.5" />
                      {t.edit}
                    </WirefrontLink>
                  ) : null}
                  <button className="flex cursor-pointer items-center gap-1.5 rounded text-start outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring" onClick={() => scrollRef.current?.scrollTo({ top: 0, behavior: "smooth" })} type="button">
                    <ArrowLeftIcon aria-hidden className="size-3.5 rotate-90" />
                    {t.backToTop}
                  </button>
                </div>
              </aside>
            </div>
          </div>
        </div>

        <Sheet onOpenChange={setDrawer} open={drawer}>
          <SheetContent className="w-68 max-w-[calc(100%-3rem)] gap-0 p-0" showCloseButton={false} side="left">
            <div className="flex h-12 items-center justify-between border-b ps-4 pe-2">
              <SheetTitle className="font-medium text-sm">
                {product} {t.docs} {version ? <span className="font-mono text-muted-foreground text-xs">{version}</span> : null}
              </SheetTitle>
              <Button aria-label={t.closeNav} onClick={() => setDrawer(false)} size="icon-sm" variant="ghost">
                <XIcon />
              </Button>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto">{sidebar}</div>
          </SheetContent>
        </Sheet>

        <SearchDialog onOpenChange={setSearch} onPick={go} open={search} pages={pages} t={t} />
      </div>
    </MotionConfig>
  );
}

export function DocsSite(props: DocsSiteProps) {
  return (
    <ScreenBoundary name="DocsSite">
      <DocsSiteScreen {...props} />
    </ScreenBoundary>
  );
}
