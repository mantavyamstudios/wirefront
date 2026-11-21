// SPDX-License-Identifier: MIT
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
// Includes MIT-licensed code © 2026 Sean Brydon (devl.dev) · see https://github.com/mantavyamstudios/wirefront/blob/main/NOTICE.md
// Ported from devl.dev (sean-brydon/devl.dev, registry item `help-centre`).
"use client";

import { Button } from "@wirefront/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@wirefront/ui/dialog";
import { Input } from "@wirefront/ui/input";
import { Kbd } from "@wirefront/ui/kbd";
import { cn } from "@wirefront/ui/lib/utils";
import { Textarea } from "@wirefront/ui/textarea";
import { useAction } from "@wirefront/ui/wirefront/action";
import { ScreenBoundary } from "@wirefront/ui/wirefront/boundary";
import { interpolate, useFormat, useMessages } from "@wirefront/ui/wirefront/provider";
import type { Action } from "@wirefront/ui/wirefront/types";
import { ArrowLeftRightIcon, ArrowRightIcon, CheckIcon, ChevronLeftIcon, ChevronRightIcon, CircleAlertIcon, ClockIcon, CornerDownLeftIcon, CreditCardIcon, FileTextIcon, InfoIcon, LifeBuoyIcon, MailIcon, MessageCircleIcon, PlugIcon, RocketIcon, SearchIcon, SearchXIcon, ShieldCheckIcon, ThumbsDownIcon, ThumbsUpIcon, XIcon } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { Fragment, type ReactNode, useEffect, useId, useRef, useState } from "react";
import type { ArticleFeedback, HelpArticle, HelpCategory, HelpIcon, HelpTone, SupportRequest } from "./schema";

/** Every string on the screen; override any of them with WirefrontProvider `messages` ("helpCentre.<key>"). */
export const HELP_CENTRE_MESSAGES = {
  helpCentre: "Help Centre",
  howCanWeHelp: "How can we help?",
  intro: "Search {count} guides from the {product} team, or browse by topic.",
  popular: "Popular:",
  browse: "Browse by topic",
  articlesCount: "{count} articles",
  articleOne: "1 article",
  popularArticles: "Popular articles",
  stillStuck: "Still stuck?",
  replyIn: "Our support team replies in about {time} on weekdays.",
  contactSupport: "Contact support",
  contactUs: "Contact us",
  contact: "Contact",
  search: "Search help articles",
  searchHero: "Search for answers, e.g. “payout”",
  searchCompact: "Search help",
  clearSearch: "Clear search",
  results: "Results",
  noArticles: "No articles match “{query}”",
  seeAll: "See all results for “{query}”",
  breadcrumb: "Breadcrumb",
  topics: "Topics",
  searchCrumb: "Search",
  resultsFor: "Results for “{query}”",
  found: "{count} articles found",
  foundOne: "1 article found",
  catMeta: "{count} · updated {date}",
  nothingMatched: "Nothing matched that",
  nothingHint: "Try fewer or different words, or ask us directly. A person reads every message.",
  browseTopics: "Browse topics",
  writtenBy: "Written by {author}",
  support: "{product} Support",
  updated: "Updated {date}",
  readTime: "{minutes} min read",
  feedbackRegion: "Article feedback",
  gladHelped: "Glad it helped.",
  gladHint: "Your vote helps others find the right answer.",
  thanksFix: "Thanks, we’ll use this to fix the article.",
  thanksFixHint: "The docs team reviews every note within a week.",
  didItAnswer: "Did this answer your question?",
  yes: "Yes",
  no: "No",
  whatWrong: "What went wrong?",
  tellMore: "Tell us more (optional)",
  cancel: "Cancel",
  sendFeedback: "Send feedback",
  related: "Related articles",
  onThisPage: "On this page",
  searchButton: "Search",
  sentTitle: "Message sent",
  contactTitle: "Contact support",
  sentHint: "We’ve emailed you a copy. Replies land in your inbox.",
  contactHint: "A real person replies, usually within {time}.",
  close: "Close",
  ticketOpen: "Ticket #{ticket} is open",
  done: "Done",
  topic: "Topic",
  message: "How can we help?",
  messagePlaceholder: "Describe what happened and what you expected. Include any IDs you have.",
  messageTooShort: "Add a few more words so we can help on the first reply.",
  email: "Your email",
  send: "Send",
};
type Messages = typeof HELP_CENTRE_MESSAGES;

export interface HelpCentreProps {
  productName: string;
  categories: HelpCategory[];
  articles: HelpArticle[];
  popularSearches?: string[];
  /** e.g. "4 min"; shown in the contact prompts. */
  replyTime?: string;
  /** A status line in the header, e.g. from your status page. */
  status?: { label: string; ok: boolean };
  /** Reasons offered when an article did not help. */
  feedbackReasons?: string[];
  /** Records feedback. The question is hidden without it. */
  onFeedback?: Action<ArticleFeedback>;
  /** Opens a ticket and returns its number. Contact buttons are hidden without it. */
  onContact?: Action<SupportRequest, { ticket: string }>;
  /** Prefills the contact email, e.g. the signed-in user's. */
  email?: string;
  className?: string;
}

const easeOut = [0.23, 1, 0.32, 1] as const;
const spring = { type: "spring", stiffness: 520, damping: 46, mass: 1 } as const;
const press = "transition-[color,background-color,box-shadow,scale,border-color] duration-150 ease-out active:scale-[0.97]";
const ring = "outline-none focus-visible:ring-2 focus-visible:ring-ring";
const icons: Record<HelpIcon, ReactNode> = { rocket: <RocketIcon />, payments: <ArrowLeftRightIcon />, invoices: <FileTextIcon />, billing: <CreditCardIcon />, security: <ShieldCheckIcon />, integrations: <PlugIcon /> };
const toneTile: Record<HelpTone, string> = {
  sky: "border bg-background text-category-1-foreground dark:bg-input/32",
  emerald: "border bg-background text-category-2-foreground dark:bg-input/32",
  amber: "border bg-background text-category-3-foreground dark:bg-input/32",
  violet: "border bg-background text-category-5-foreground dark:bg-input/32",
  rose: "border bg-background text-category-4-foreground dark:bg-input/32",
  teal: "border bg-background text-category-6-foreground dark:bg-input/32",
};

function useReducedMotionAfterMount() {
  const prefers = useReducedMotion();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  return mounted && Boolean(prefers);
}

const slug = (s: string) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

/** Highlights each searched word. */
function Mark({ text, query }: { text: string; query: string }) {
  const words = query
    .trim()
    .toLowerCase()
    .split(/\s+/)
    .filter((w) => w.length > 1);
  if (!words.length) return <>{text}</>;
  const re = new RegExp(`(${words.map((w) => w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|")})`, "gi");
  let at = 0;
  return (
    <>
      {text
        .split(re)
        .filter(Boolean)
        .map((part) => {
          const key = at;
          at += part.length;
          return words.includes(part.toLowerCase()) ? (
            <mark className="rounded-[calc(var(--radius)*0.3)] bg-warning/25 text-foreground" key={key}>
              {part}
            </mark>
          ) : (
            <Fragment key={key}>{part}</Fragment>
          );
        })}
    </>
  );
}

function score(a: HelpArticle, query: string) {
  const words = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
  if (!words.length) return 0;
  const title = a.title.toLowerCase();
  const text = `${a.summary} ${a.body.map((b) => ("text" in b ? b.text : b.items.join(" "))).join(" ")}`.toLowerCase();
  let s = 0;
  for (const w of words) {
    if (title.includes(w)) s += 3;
    else if (text.includes(w)) s += 1;
    else return 0;
  }
  return s;
}
const search = (articles: HelpArticle[], query: string) =>
  articles
    .map((a) => ({ a, s: score(a, query) }))
    .filter((x) => x.s > 0)
    .sort((x, y) => y.s - x.s)
    .map((x) => x.a);

type View = { name: "home" } | { name: "category"; id: string } | { name: "results"; query: string } | { name: "article"; id: string };

function SearchBox({ articles, categories, onOpen, onSearch, size, initial = "", t }: { articles: HelpArticle[]; categories: HelpCategory[]; onOpen: (id: string) => void; onSearch: (q: string) => void; size: "hero" | "compact"; initial?: string; t: Messages }) {
  const [query, setQuery] = useState(initial);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const listId = useId();
  const reduce = useReducedMotionAfterMount();
  const results = search(articles, query).slice(0, 5);
  const showList = open && query.trim().length > 0;
  const hero = size === "hero";
  // Close the suggestions when focus leaves the search box.
  const boxRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = boxRef.current;
    if (!el) return;
    const onOut = (e: FocusEvent) => {
      if (!el.contains(e.relatedTarget as Node | null)) setOpen(false);
    };
    el.addEventListener("focusout", onOut);
    return () => el.removeEventListener("focusout", onOut);
  }, []);
  const pick = (id: string) => {
    onOpen(id);
    setOpen(false);
  };
  const commit = () => {
    const hit = results[active];
    if (active >= 0 && hit) onOpen(hit.id);
    else if (query.trim()) onSearch(query.trim());
    setOpen(false);
  };

  return (
    <div className="relative w-full" ref={boxRef}>
      <div className={cn("relative flex items-center rounded-xl border border-input bg-background text-foreground shadow-xs/5 transition-shadow has-focus-visible:border-ring has-focus-visible:ring-[3px] has-focus-visible:ring-ring/24 dark:bg-input/32", hero ? "h-12 @lg:h-13" : "h-9")}>
        <SearchIcon aria-hidden className={cn("pointer-events-none absolute text-muted-foreground", hero ? "inset-s-4 size-4.5" : "inset-s-3 size-4")} />
        <input
          aria-activedescendant={active >= 0 && showList ? `${listId}-${active}` : undefined}
          aria-autocomplete="list"
          aria-controls={listId}
          aria-expanded={showList}
          aria-label={t.search}
          className={cn("size-full min-w-0 bg-transparent outline-none placeholder:text-muted-foreground/72 [&::-webkit-search-cancel-button]:hidden", hero ? "ps-11 pe-11 text-base" : "ps-9 pe-8 text-sm")}
          data-help-search=""
          onChange={(e) => {
            setQuery(e.target.value);
            setActive(-1);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={(e) => {
            if (e.key === "ArrowDown") {
              e.preventDefault();
              setOpen(true);
              setActive((a) => Math.min(results.length - 1, a + 1));
            } else if (e.key === "ArrowUp") {
              e.preventDefault();
              setActive((a) => Math.max(-1, a - 1));
            } else if (e.key === "Enter") {
              e.preventDefault();
              commit();
            } else if (e.key === "Escape") {
              if (showList) setOpen(false);
              else setQuery("");
            }
          }}
          placeholder={hero ? t.searchHero : t.searchCompact}
          role="combobox"
          type="search"
          value={query}
        />
        {query ? (
          <button aria-label={t.clearSearch} className={cn("absolute flex size-7 cursor-pointer items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground", ring, hero ? "inset-e-3" : "inset-e-1")} onClick={() => setQuery("")} type="button">
            <XIcon aria-hidden className="size-4" />
          </button>
        ) : hero ? (
          <Kbd className="absolute inset-e-4 hidden @lg:inline-flex">/</Kbd>
        ) : null}
      </div>

      <AnimatePresence>
        {showList ? (
          <motion.div animate={{ opacity: 1, y: 0, scale: 1 }} className="absolute inset-x-0 top-full z-30 mt-2 origin-top overflow-hidden rounded-xl border bg-popover text-start text-popover-foreground shadow-lg/5" exit={{ opacity: 0, scale: 0.98, transition: { duration: 0.1 } }} initial={reduce ? { opacity: 0 } : { opacity: 0, y: -4, scale: 0.98 }} transition={{ duration: 0.16, ease: easeOut }}>
            <div aria-label={t.results} className="p-1.5" id={listId} role="listbox">
              {results.length ? (
                results.map((a, i) => {
                  const cat = categories.find((c) => c.id === a.categoryId);
                  return (
                    <div
                      aria-selected={active === i}
                      className={cn("flex w-full cursor-pointer items-center gap-3 rounded-lg px-2.5 py-2 text-start", active === i ? "bg-accent" : "hover:bg-accent/60")}
                      id={`${listId}-${i}`}
                      key={a.id}
                      onClick={() => pick(a.id)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          pick(a.id);
                        }
                      }}
                      onMouseDown={(e) => e.preventDefault()}
                      onMouseEnter={() => setActive(i)}
                      role="option"
                      tabIndex={-1}
                    >
                      <span aria-hidden className={cn("flex size-8 shrink-0 items-center justify-center rounded-lg [&_svg]:size-4", cat && toneTile[cat.tone])}>
                        {cat ? icons[cat.icon] : null}
                      </span>
                      <span className="flex min-w-0 flex-1 flex-col">
                        <span className="truncate font-medium text-sm">
                          <Mark query={query} text={a.title} />
                        </span>
                        <span className="truncate text-muted-foreground text-xs">{cat?.name}</span>
                      </span>
                      {active === i ? <CornerDownLeftIcon aria-hidden className="size-3.5 shrink-0 text-muted-foreground" /> : null}
                    </div>
                  );
                })
              ) : (
                <div className="flex items-center gap-2.5 px-2.5 py-2 text-muted-foreground text-sm" role="presentation">
                  <SearchXIcon aria-hidden className="size-4" /> {interpolate(t.noArticles, { query: query.trim() })}
                </div>
              )}
            </div>
            <button
              className="flex w-full cursor-pointer items-center justify-between gap-2 border-t px-4 py-2.5 text-muted-foreground text-xs hover:bg-accent/60 hover:text-foreground"
              onClick={() => {
                onSearch(query.trim());
                setOpen(false);
              }}
              onMouseDown={(e) => e.preventDefault()}
              tabIndex={-1}
              type="button"
            >
              <span className="truncate">{interpolate(t.seeAll, { query: query.trim() })}</span>
              <Kbd>↵</Kbd>
            </button>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

function ArticleRow({ article, category, query = "", onOpen }: { article: HelpArticle; category?: HelpCategory; query?: string; onOpen: () => void }) {
  return (
    <li>
      <button className={cn("group/row flex w-full cursor-pointer items-start gap-3 rounded-xl px-3 py-3 text-start hover:bg-accent/60", ring, press, "active:scale-[0.99]")} onClick={onOpen} type="button">
        <FileTextIcon aria-hidden className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
        <span className="flex min-w-0 flex-1 flex-col gap-0.5">
          <span className="font-medium">
            <Mark query={query} text={article.title} />
          </span>
          <span className="line-clamp-2 text-pretty text-muted-foreground text-xs leading-5">
            <Mark query={query} text={article.summary} />
          </span>
          {category ? <span className="mt-1 text-muted-foreground text-xs">{category.name}</span> : null}
        </span>
        <ChevronRightIcon aria-hidden className="mt-0.5 size-4 shrink-0 text-muted-foreground transition-transform duration-150 ease-out rtl:-scale-x-100 [@media(hover:hover)]:group-hover/row:translate-x-0.5" />
      </button>
    </li>
  );
}

function ContactDialog({ open, onOpenChange, categories, initialTopic, email, replyTime, onContact, t }: { open: boolean; onOpenChange: (open: boolean) => void; categories: HelpCategory[]; initialTopic: string; email?: string; replyTime?: string; onContact: Action<SupportRequest, { ticket: string }>; t: Messages }) {
  const reduce = useReducedMotionAfterMount();
  const errId = useId();
  const msgId = useId();
  const [topic, setTopic] = useState(initialTopic);
  const [message, setMessage] = useState("");
  const [address, setAddress] = useState(email ?? "");
  const [tooShort, setTooShort] = useState(false);
  const [ticket, setTicket] = useState<string | null>(null);
  const msgRef = useRef<HTMLTextAreaElement>(null);
  const send = useAction(onContact, {
    onSuccess: (result) => {
      setTicket(result.ticket);
      setMessage("");
    },
  });
  // Reset when the dialog opens for a new request.
  const [shownOpen, setShownOpen] = useState(open);
  if (shownOpen !== open) {
    setShownOpen(open);
    if (open) {
      setTopic(initialTopic);
      setTicket(null);
      setTooShort(false);
    }
  }

  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent className="flex max-w-md flex-col gap-4 p-5" initialFocus={msgRef} showCloseButton={false}>
        <div className="flex items-start gap-3">
          <div className="flex min-w-0 flex-1 flex-col gap-0.5">
            <DialogTitle className="font-heading font-semibold text-base">{ticket ? t.sentTitle : t.contactTitle}</DialogTitle>
            <DialogDescription className="text-pretty text-muted-foreground text-xs">{ticket ? t.sentHint : replyTime ? interpolate(t.contactHint, { time: replyTime }) : null}</DialogDescription>
          </div>
          <Button aria-label={t.close} className="-me-2 -mt-1" onClick={() => onOpenChange(false)} size="icon-sm" variant="ghost">
            <XIcon />
          </Button>
        </div>
        {ticket ? (
          <motion.div animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center gap-3 rounded-xl bg-muted/60 px-4 py-6 text-center" initial={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.97 }} transition={{ duration: 0.22, ease: easeOut }}>
            <span aria-hidden className="flex size-10 items-center justify-center rounded-full bg-success/12 text-success-foreground">
              <CheckIcon className="size-5" />
            </span>
            <span className="font-medium" role="status">
              {interpolate(t.ticketOpen, { ticket })}
            </span>
            <Button className={press} onClick={() => onOpenChange(false)} size="sm" variant="outline">
              {t.done}
            </Button>
          </motion.div>
        ) : (
          <form
            className="flex flex-col gap-4"
            noValidate
            onSubmit={(e) => {
              e.preventDefault();
              if (message.trim().length < 10) {
                setTooShort(true);
                msgRef.current?.focus();
                return;
              }
              send.run({ topic, message: message.trim(), email: address });
            }}
          >
            <fieldset className="m-0 flex min-w-0 flex-col gap-2 border-0 p-0">
              <legend className="mb-2 font-medium text-xs">{t.topic}</legend>
              <div className="flex flex-wrap gap-1.5">
                {categories.map((c) => {
                  const on = topic === c.name;
                  return (
                    <button aria-pressed={on} className={cn("h-8 cursor-pointer rounded-full border px-3 text-xs", ring, press, on ? "border-primary bg-primary text-primary-foreground" : "bg-background hover:bg-accent dark:bg-input/32")} key={c.id} onClick={() => setTopic(c.name)} type="button">
                      {c.name}
                    </button>
                  );
                })}
              </div>
            </fieldset>
            <div className="flex flex-col gap-2">
              <label className="font-medium text-xs" htmlFor={msgId}>
                {t.message}
              </label>
              <Textarea
                id={msgId}
                aria-describedby={tooShort ? errId : undefined}
                aria-invalid={tooShort || undefined}
                onChange={(e) => {
                  setMessage(e.target.value);
                  if (tooShort && e.target.value.trim().length >= 10) setTooShort(false);
                }}
                placeholder={t.messagePlaceholder}
                ref={msgRef}
                value={message}
              />
              {tooShort ? (
                <span className="text-destructive-foreground text-xs" id={errId}>
                  {t.messageTooShort}
                </span>
              ) : null}
            </div>
            {send.error ? (
              <p className="text-destructive text-xs" role="alert">
                {send.error}
              </p>
            ) : null}
            <div className="flex items-center gap-2">
              <Input aria-label={t.email} className="flex-1" onChange={(e) => setAddress(e.target.value)} type="email" value={address} />
              <Button className={press} disabled={send.isPending()} type="submit">
                {t.send}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}

function HelpCentreScreen({ productName, categories, articles, popularSearches = [], replyTime, status, feedbackReasons = [], onFeedback, onContact, email, className }: HelpCentreProps) {
  const t = useMessages("helpCentre", HELP_CENTRE_MESSAGES);
  const fmt = useFormat();
  const reduce = useReducedMotionAfterMount();
  const [view, setView] = useState<View>({ name: "home" });
  const [feedback, setFeedback] = useState<Record<string, { vote: "up" | "down"; reason?: string; note?: string; sent?: boolean }>>({});
  const [activeHeading, setActiveHeading] = useState<string | null>(null);
  const [contactOpen, setContactOpen] = useState(false);
  const [heroKey, setHeroKey] = useState(0);
  const rootRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const day = (iso: string) => fmt.date(`${iso}T00:00:00Z`, { dateStyle: "medium", timeZone: "UTC" });

  const sendFeedback = useAction(onFeedback ?? (async () => {}));

  const go = (v: View) => {
    setView(v);
    scrollRef.current?.scrollTo({ top: 0 });
  };
  const cat = (id: string) => categories.find((c) => c.id === id);
  const count = (id: string) => articles.filter((a) => a.categoryId === id).length;
  const article = view.name === "article" ? articles.find((a) => a.id === view.id) : undefined;
  const headings = article ? article.body.flatMap((b) => (b.type === "h2" ? [b.text] : [])) : [];

  useEffect(() => {
    const box = scrollRef.current;
    if (!box || !article) return;
    const onScroll = () => {
      const els = Array.from(box.querySelectorAll<HTMLElement>("[data-heading]"));
      const top = box.getBoundingClientRect().top + 96;
      let current: string | null = els[0]?.dataset.heading ?? null;
      for (const el of els) if (el.getBoundingClientRect().top <= top) current = el.dataset.heading ?? current;
      if (box.scrollTop + box.clientHeight >= box.scrollHeight - 4 && els.length) current = els.at(-1)?.dataset.heading ?? current;
      setActiveHeading(current);
    };
    onScroll();
    box.addEventListener("scroll", onScroll, { passive: true });
    return () => box.removeEventListener("scroll", onScroll);
  }, [article]);

  // "/" jumps to search from anywhere outside a text field.
  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (e.key === "/" && !target.closest("input, textarea")) {
        e.preventDefault();
        el.querySelector<HTMLInputElement>("[data-help-search]")?.focus();
      }
    };
    el.addEventListener("keydown", onKey);
    return () => el.removeEventListener("keydown", onKey);
  }, []);

  const jumpTo = (h: string) => {
    const box = scrollRef.current;
    const el = box?.querySelector<HTMLElement>(`[data-heading="${slug(h)}"]`);
    if (box && el) box.scrollTo({ top: el.offsetTop - 24, behavior: reduce ? "auto" : "smooth" });
  };
  const articlesLabel = (n: number) => (n === 1 ? t.articleOne : interpolate(t.articlesCount, { count: n }));

  const crumbs = (items: { label: string; onClick?: () => void }[]) => {
    const parent = [...items].reverse().find((c) => c.onClick && c !== items.at(-1));
    return (
      <>
        {parent ? (
          <button className={cn("-ms-1 flex w-fit cursor-pointer items-center gap-0.5 rounded text-muted-foreground text-xs hover:text-foreground @lg:hidden", ring)} onClick={parent.onClick} type="button">
            <ChevronLeftIcon aria-hidden className="size-4 rtl:-scale-x-100" /> {parent.label}
          </button>
        ) : null}
        <nav aria-label={t.breadcrumb} className="hidden min-w-0 items-center gap-1 text-muted-foreground text-xs @lg:flex">
          {items.map((c, i) => (
            <span className="flex min-w-0 items-center gap-1" key={c.label}>
              {i > 0 ? <ChevronRightIcon aria-hidden className="size-3.5 shrink-0 opacity-60 rtl:-scale-x-100" /> : null}
              {c.onClick ? (
                <button className={cn("cursor-pointer truncate rounded hover:text-foreground", ring)} onClick={c.onClick} type="button">
                  {c.label}
                </button>
              ) : (
                <span aria-current="page" className="truncate text-foreground">
                  {c.label}
                </span>
              )}
            </span>
          ))}
        </nav>
      </>
    );
  };

  const rail = (activeCat?: string, activeArticle?: string) => (
    <nav aria-label={t.topics} className="sticky top-0 hidden w-52 shrink-0 self-start pt-11 @4xl:block">
      <p className="mb-2 px-2 font-medium text-xs">{t.topics}</p>
      <ul className="flex flex-col gap-px">
        {categories.map((tc) => {
          const on = tc.id === activeCat;
          const inCat = on && activeArticle ? articles.filter((a) => a.categoryId === tc.id) : [];
          return (
            <li key={tc.id}>
              <button aria-current={on && !activeArticle ? "page" : undefined} className={cn("flex h-8 w-full cursor-pointer items-center gap-2.5 rounded-md px-2 text-start [&_svg]:size-4", ring, on ? "bg-accent font-medium text-foreground" : "text-muted-foreground hover:bg-accent/60 hover:text-foreground")} onClick={() => go({ name: "category", id: tc.id })} type="button">
                <span aria-hidden className={cn("shrink-0", on ? "text-foreground" : "opacity-80")}>
                  {icons[tc.icon]}
                </span>
                <span className="truncate">{tc.name}</span>
              </button>
              {inCat.length > 0 ? (
                <ul className="my-1 ms-4 flex flex-col border-s ps-2">
                  {inCat.map((a) => (
                    <li key={a.id}>
                      <button aria-current={a.id === activeArticle ? "page" : undefined} className={cn("w-full cursor-pointer rounded-md px-2 py-1.5 text-start text-xs leading-5", ring, a.id === activeArticle ? "font-medium text-foreground" : "text-muted-foreground hover:text-foreground")} onClick={() => go({ name: "article", id: a.id })} type="button">
                        {a.title}
                      </button>
                    </li>
                  ))}
                </ul>
              ) : null}
            </li>
          );
        })}
      </ul>
    </nav>
  );

  const contactCard = onContact ? (
    <section className="flex flex-col gap-4 rounded-xl border bg-card p-5 @2xl:flex-row @2xl:items-center">
      <span aria-hidden className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-muted text-foreground">
        <LifeBuoyIcon className="size-5" />
      </span>
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <h2 className="font-heading font-semibold">{t.stillStuck}</h2>
        {replyTime ? <p className="text-pretty text-muted-foreground">{interpolate(t.replyIn, { time: replyTime })}</p> : null}
      </div>
      <div className="flex gap-2">
        <Button className={press} onClick={() => setContactOpen(true)}>
          <MessageCircleIcon /> {t.contactSupport}
        </Button>
      </div>
    </section>
  ) : null;

  let body: ReactNode = null;
  if (view.name === "home") {
    const popular = articles.filter((a) => a.popular);
    body = (
      <>
        <section className="border-b bg-muted/30 px-4 pt-12 pb-10 @2xl:pt-16 @2xl:pb-14">
          <div className="mx-auto flex max-w-xl flex-col items-center gap-5 text-center">
            <div className="flex flex-col gap-1.5">
              <h1 className="text-balance font-heading font-semibold text-2xl tracking-tight @2xl:text-3xl">{t.howCanWeHelp}</h1>
              <p className="text-pretty text-muted-foreground">{interpolate(t.intro, { count: articles.length, product: productName })}</p>
            </div>
            <SearchBox articles={articles} categories={categories} key={heroKey} onOpen={(id) => go({ name: "article", id })} onSearch={(q) => go({ name: "results", query: q })} size="hero" t={t} />
            {popularSearches.length ? (
              <div className="flex flex-wrap items-center justify-center gap-1.5 text-xs">
                <span className="text-muted-foreground">{t.popular}</span>
                {popularSearches.map((p) => (
                  <button className={cn("h-7 cursor-pointer rounded-full border bg-background px-2.5 text-muted-foreground hover:border-foreground/20 hover:text-foreground dark:bg-input/32", ring, press)} key={p} onClick={() => go({ name: "results", query: p })} type="button">
                    {p}
                  </button>
                ))}
              </div>
            ) : null}
          </div>
        </section>

        <div className="mx-auto flex w-full max-w-5xl flex-col gap-10 px-4 py-10 @2xl:px-8">
          <section aria-labelledby="hc-cats" className="flex flex-col gap-3">
            <h2 className="font-medium" id="hc-cats">
              {t.browse}
            </h2>
            <ul className="grid grid-cols-1 gap-3 @lg:grid-cols-2 @4xl:grid-cols-3">
              {categories.map((c, i) => (
                <motion.li animate={{ opacity: 1, y: 0 }} initial={reduce ? false : { opacity: 0, y: 6 }} key={c.id} transition={{ duration: 0.25, ease: easeOut, delay: Math.min(i, 6) * 0.03 }}>
                  <button className={cn("group/cat flex h-full w-full cursor-pointer items-start gap-3.5 rounded-xl border bg-card p-4 text-start hover:border-foreground/16 hover:bg-accent/32", ring, press, "active:scale-[0.98]")} onClick={() => go({ name: "category", id: c.id })} type="button">
                    <span aria-hidden className={cn("flex size-9 shrink-0 items-center justify-center rounded-lg shadow-xs/5 [&_svg]:size-4", toneTile[c.tone])}>
                      {icons[c.icon]}
                    </span>
                    <span className="flex min-w-0 flex-1 flex-col gap-1">
                      <span className="flex items-center justify-between gap-2 font-medium">
                        {c.name}
                        <ArrowRightIcon aria-hidden className="size-4 shrink-0 text-muted-foreground/0 transition-[color,translate] duration-150 ease-out rtl:-scale-x-100 [@media(hover:hover)]:group-hover/cat:translate-x-0.5 [@media(hover:hover)]:group-hover/cat:text-muted-foreground" />
                      </span>
                      <span className="text-muted-foreground text-xs leading-5">{c.description}</span>
                      <span className="mt-1 text-muted-foreground text-xs tabular-nums">{articlesLabel(count(c.id))}</span>
                    </span>
                  </button>
                </motion.li>
              ))}
            </ul>
          </section>

          {popular.length ? (
            <section aria-labelledby="hc-popular" className="flex flex-col gap-3">
              <h2 className="font-medium" id="hc-popular">
                {t.popularArticles}
              </h2>
              <ul className="grid grid-cols-1 divide-y overflow-hidden rounded-xl border bg-card @3xl:grid-cols-2 @3xl:divide-y-0 [&_button]:rounded-none [&_button]:px-4 @3xl:[&>li:nth-child(even)]:border-s @3xl:[&>li:nth-child(n+3)]:border-t">
                {popular.map((a) => (
                  <ArticleRow article={a} category={cat(a.categoryId)} key={a.id} onOpen={() => go({ name: "article", id: a.id })} />
                ))}
              </ul>
            </section>
          ) : null}

          {contactCard}
        </div>
      </>
    );
  } else if (view.name === "category" || view.name === "results") {
    const c = view.name === "category" ? cat(view.id) : undefined;
    const list = view.name === "category" ? articles.filter((a) => a.categoryId === view.id) : search(articles, view.query);
    const latest = [...list].sort((a, z) => z.updatedAt.localeCompare(a.updatedAt))[0];
    body = (
      <div className="mx-auto flex w-full max-w-6xl gap-10 px-4 py-8 @2xl:px-8 @2xl:py-10">
        {rail(c?.id)}
        <div className="flex min-w-0 max-w-2xl flex-1 flex-col">
          {crumbs([{ label: t.helpCentre, onClick: () => go({ name: "home" }) }, { label: c ? c.name : t.searchCrumb }])}
          <div className="mt-5 flex items-start gap-4 border-b pb-6">
            {c ? (
              <span aria-hidden className={cn("flex size-10 shrink-0 items-center justify-center rounded-lg shadow-xs/5 [&_svg]:size-5", toneTile[c.tone])}>
                {icons[c.icon]}
              </span>
            ) : null}
            <div className="flex min-w-0 flex-col gap-1">
              <h1 className="text-balance font-heading font-semibold text-2xl tracking-tight">{c ? c.name : interpolate(t.resultsFor, { query: view.name === "results" ? view.query : "" })}</h1>
              <p className="text-pretty text-muted-foreground">{c ? c.description : list.length === 1 ? t.foundOne : interpolate(t.found, { count: list.length })}</p>
              {c && latest ? <p className="mt-1 text-muted-foreground text-xs tabular-nums">{interpolate(t.catMeta, { count: articlesLabel(list.length), date: day(latest.updatedAt) })}</p> : null}
            </div>
          </div>
          {list.length ? (
            <ul className="mt-6 divide-y overflow-hidden rounded-xl border bg-card [&_button]:rounded-none [&_button]:px-4">
              {list.map((a) => (
                <ArticleRow article={a} category={view.name === "results" ? cat(a.categoryId) : undefined} key={a.id} onOpen={() => go({ name: "article", id: a.id })} query={view.name === "results" ? view.query : ""} />
              ))}
            </ul>
          ) : (
            <div className="mt-6 flex flex-col items-center gap-4 rounded-xl border border-dashed px-6 py-12 text-center">
              <span aria-hidden className="flex size-10 items-center justify-center rounded-lg border bg-background text-muted-foreground shadow-xs/5 dark:bg-input/32">
                <SearchXIcon className="size-4.5" />
              </span>
              <div className="flex max-w-xs flex-col gap-1">
                <span className="font-medium">{t.nothingMatched}</span>
                <span className="text-pretty text-muted-foreground text-xs">{t.nothingHint}</span>
              </div>
              <div className="flex gap-2">
                <Button className={press} onClick={() => go({ name: "home" })} size="sm" variant="outline">
                  {t.browseTopics}
                </Button>
                {onContact ? (
                  <Button className={press} onClick={() => setContactOpen(true)} size="sm">
                    {t.contactSupport}
                  </Button>
                ) : null}
              </div>
            </div>
          )}
          {contactCard ? <div className="mt-10">{contactCard}</div> : null}
        </div>
      </div>
    );
  } else if (article) {
    const c = cat(article.categoryId);
    const fb = feedback[article.id];
    const related = articles.filter((a) => a.categoryId === article.categoryId && a.id !== article.id).slice(0, 3);
    const setFb = (patch: Partial<NonNullable<typeof fb>> | null) =>
      setFeedback((f) => {
        if (!patch) {
          const { [article.id]: _, ...rest } = f;
          return rest;
        }
        return { ...f, [article.id]: { ...(f[article.id] ?? { vote: "up" }), ...patch } };
      });
    body = (
      <div className="mx-auto flex w-full max-w-6xl gap-10 px-4 py-8 @2xl:px-8 @2xl:py-10">
        {rail(article.categoryId, article.id)}
        <article className="flex min-w-0 max-w-2xl flex-1 flex-col">
          {crumbs([{ label: t.helpCentre, onClick: () => go({ name: "home" }) }, { label: c?.name ?? "", onClick: () => go({ name: "category", id: article.categoryId }) }, { label: article.title }])}
          <header className="mt-5 border-b pb-6">
            <h1 className="text-balance font-heading font-semibold text-2xl tracking-tight @2xl:text-3xl">{article.title}</h1>
            <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-2 text-muted-foreground text-xs">
              <span className="flex items-center gap-2">
                <span aria-hidden className="flex size-6 items-center justify-center rounded-full bg-foreground font-medium text-[10px] text-background">
                  {productName.slice(0, 1)}
                </span>
                <span>{interpolate(t.writtenBy, { author: interpolate(t.support, { product: productName }) })}</span>
              </span>
              <span>{interpolate(t.updated, { date: day(article.updatedAt) })}</span>
              <span className="flex items-center gap-1 tabular-nums">
                <ClockIcon aria-hidden className="size-3.5" /> {interpolate(t.readTime, { minutes: article.minutes })}
              </span>
            </div>
          </header>

          <div className="mt-6 flex flex-col gap-4 text-[15px] text-foreground/90 leading-7">
            {article.body.map((b) => {
              const key = JSON.stringify(b);
              if (b.type === "p")
                return (
                  <p className="text-pretty" key={key}>
                    {b.text}
                  </p>
                );
              if (b.type === "h2")
                return (
                  <h2 className="mt-6 scroll-mt-6 font-heading font-semibold text-foreground text-lg tracking-tight first:mt-0" data-heading={slug(b.text)} id={`hc-${slug(b.text)}`} key={key}>
                    {b.text}
                  </h2>
                );
              if (b.type === "list")
                return (
                  <ul className="flex flex-col gap-2" key={key}>
                    {b.items.map((it) => {
                      const [lead, ...rest] = it.split(": ");
                      return (
                        <li className="flex gap-3" key={it}>
                          <span aria-hidden className="mt-[0.7rem] size-1.5 shrink-0 rounded-full bg-foreground/40" />
                          <span className="text-pretty">
                            {rest.length ? (
                              <>
                                <span className="font-medium text-foreground">{lead}:</span> {rest.join(": ")}
                              </>
                            ) : (
                              it
                            )}
                          </span>
                        </li>
                      );
                    })}
                  </ul>
                );
              if (b.type === "steps")
                return (
                  <ol className="flex flex-col gap-3.5" key={key}>
                    {b.items.map((it, n) => (
                      <li className="relative flex gap-3.5" key={it}>
                        <span aria-hidden className="flex size-6 shrink-0 items-center justify-center rounded-full border bg-background font-medium text-xs tabular-nums shadow-xs/5">
                          {n + 1}
                        </span>
                        <span className="text-pretty pt-px leading-6">{it}</span>
                      </li>
                    ))}
                  </ol>
                );
              return (
                <div className={cn("flex gap-3 rounded-lg border-s-2 px-4 py-3 text-sm leading-6", b.tone === "info" ? "border-info bg-info/6 dark:bg-info/10" : "border-warning bg-warning/8 dark:bg-warning/10")} key={key} role="note">
                  {b.tone === "info" ? <InfoIcon aria-hidden className="mt-1 size-4 shrink-0 text-info-foreground" /> : <CircleAlertIcon aria-hidden className="mt-1 size-4 shrink-0 text-warning-foreground" />}
                  <p className="text-pretty">{b.text}</p>
                </div>
              );
            })}
          </div>

          {onFeedback ? (
            <section aria-label={t.feedbackRegion} className="mt-12 border-t pt-6">
              <AnimatePresence initial={false} mode="popLayout">
                {fb?.sent || fb?.vote === "up" ? (
                  <motion.div animate={{ opacity: 1, scale: 1 }} className="flex items-center gap-3" initial={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.98 }} key="thanks" role="status" transition={{ duration: 0.2, ease: easeOut }}>
                    <span aria-hidden className="flex size-8 shrink-0 items-center justify-center rounded-full bg-success/12 text-success-foreground">
                      <CheckIcon className="size-4" />
                    </span>
                    <div className="flex flex-col">
                      <span className="font-medium">{fb.vote === "up" ? t.gladHelped : t.thanksFix}</span>
                      <span className="text-muted-foreground text-xs">{fb.vote === "up" ? t.gladHint : t.thanksFixHint}</span>
                    </div>
                  </motion.div>
                ) : (
                  <motion.div className="flex flex-col gap-4" exit={{ opacity: 0, scale: 0.98, transition: { duration: 0.12 } }} key="ask" layout={reduce ? false : "size"} transition={spring}>
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <span className="font-medium">{t.didItAnswer}</span>
                      <div className="flex gap-2">
                        <Button
                          aria-pressed={false}
                          className={press}
                          onClick={() => {
                            setFb({ vote: "up" });
                            sendFeedback.run({ articleId: article.id, helpful: true });
                          }}
                          size="sm"
                          variant="outline"
                        >
                          <ThumbsUpIcon /> {t.yes}
                        </Button>
                        <Button aria-pressed={fb?.vote === "down"} className={cn(press, fb?.vote === "down" && "border-foreground/30 bg-accent")} onClick={() => setFb({ vote: "down" })} size="sm" variant="outline">
                          <ThumbsDownIcon /> {t.no}
                        </Button>
                      </div>
                    </div>
                    {fb?.vote === "down" ? (
                      <motion.form
                        animate={{ opacity: 1, y: 0 }}
                        className="flex flex-col gap-3"
                        initial={reduce ? { opacity: 0 } : { opacity: 0, y: -4 }}
                        onSubmit={(e) => {
                          e.preventDefault();
                          setFb({ sent: true });
                          sendFeedback.run({ articleId: article.id, helpful: false, reason: fb.reason, note: fb.note });
                        }}
                        transition={{ duration: 0.2, ease: easeOut }}
                      >
                        {feedbackReasons.length ? (
                          <fieldset className="m-0 flex min-w-0 flex-col gap-2 border-0 p-0">
                            <legend className="mb-2 text-muted-foreground text-xs">{t.whatWrong}</legend>
                            <div className="flex flex-wrap gap-1.5">
                              {feedbackReasons.map((r) => {
                                const on = fb.reason === r;
                                return (
                                  <button aria-pressed={on} className={cn("h-8 cursor-pointer rounded-full border px-3 text-xs", ring, press, on ? "border-primary bg-primary text-primary-foreground" : "bg-background text-foreground hover:bg-accent dark:bg-input/32")} key={r} onClick={() => setFb({ reason: r })} type="button">
                                    {r}
                                  </button>
                                );
                              })}
                            </div>
                          </fieldset>
                        ) : null}
                        <Textarea aria-label={t.tellMore} onChange={(e) => setFb({ note: e.target.value })} placeholder={t.tellMore} value={fb.note ?? ""} />
                        <div className="flex items-center justify-end gap-2">
                          <Button className={press} onClick={() => setFb(null)} size="sm" type="button" variant="ghost">
                            {t.cancel}
                          </Button>
                          <Button className={press} disabled={feedbackReasons.length > 0 && !fb.reason} size="sm" type="submit">
                            {t.sendFeedback}
                          </Button>
                        </div>
                      </motion.form>
                    ) : null}
                  </motion.div>
                )}
              </AnimatePresence>
              {sendFeedback.error ? (
                <p className="mt-2 text-destructive text-xs" role="alert">
                  {sendFeedback.error}
                </p>
              ) : null}
            </section>
          ) : null}

          {related.length > 0 ? (
            <section aria-labelledby="hc-related" className="mt-10 flex flex-col gap-3">
              <h2 className="font-medium" id="hc-related">
                {t.related}
              </h2>
              <ul className="divide-y overflow-hidden rounded-xl border bg-card [&_button]:rounded-none [&_button]:px-4">
                {related.map((a) => (
                  <ArticleRow article={a} key={a.id} onOpen={() => go({ name: "article", id: a.id })} />
                ))}
              </ul>
            </section>
          ) : null}

          {contactCard ? <div className="mt-10">{contactCard}</div> : null}
        </article>

        {headings.length > 1 ? (
          <aside aria-label={t.onThisPage} className="sticky top-0 hidden w-44 shrink-0 self-start pt-11 @6xl:block">
            <h2 className="mb-2 font-medium text-xs">{t.onThisPage}</h2>
            <ul className="relative flex flex-col border-s">
              {headings.map((h) => {
                const on = activeHeading === slug(h);
                return (
                  <li className="relative" key={h}>
                    {on ? <motion.span className="absolute inset-y-1 -inset-s-px w-0.5 rounded-full bg-foreground" layoutId="hc-toc" transition={reduce ? { duration: 0 } : spring} /> : null}
                    <button aria-current={on ? "location" : undefined} className={cn("w-full cursor-pointer rounded-e-md py-1.5 ps-3 text-start text-xs leading-5 transition-colors", ring, on ? "font-medium text-foreground" : "text-muted-foreground hover:text-foreground")} onClick={() => jumpTo(h)} type="button">
                      {h}
                    </button>
                  </li>
                );
              })}
            </ul>
          </aside>
        ) : null}
      </div>
    );
  }

  const viewKey = view.name === "article" ? `a-${view.id}` : view.name === "category" ? `c-${view.id}` : view.name === "results" ? `r-${view.query}` : "home";
  const initialTopic = article ? (cat(article.categoryId)?.name ?? "") : (categories[0]?.name ?? "");

  return (
    <div className={cn("@container relative isolate flex h-svh w-full flex-col overflow-hidden bg-background text-foreground text-sm", className)} ref={rootRef}>
      <header className="flex h-14 shrink-0 items-center gap-3 border-b px-4 @2xl:px-6">
        <button
          className={cn("flex shrink-0 cursor-pointer items-center gap-2.5 rounded-lg", ring)}
          onClick={() => {
            go({ name: "home" });
            setHeroKey((k) => k + 1);
          }}
          type="button"
        >
          <span aria-hidden className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <svg aria-hidden="true" className="size-4" fill="none" viewBox="0 0 16 16">
              <path d="M8 1.5 14 8l-6 6.5L2 8z" fill="currentColor" opacity=".9" />
              <path d="M8 1.5V14.5" stroke="var(--primary)" strokeWidth="1.2" />
            </svg>
          </span>
          <span className="font-heading font-semibold">{productName}</span>
          <span className="hidden text-muted-foreground @md:inline">{t.helpCentre}</span>
        </button>
        {view.name !== "home" ? (
          <div className="ms-2 hidden w-full max-w-xs @3xl:block">
            <SearchBox articles={articles} categories={categories} initial={view.name === "results" ? view.query : ""} key={viewKey} onOpen={(id) => go({ name: "article", id })} onSearch={(q) => go({ name: "results", query: q })} size="compact" t={t} />
          </div>
        ) : null}
        <div className="ms-auto flex items-center gap-2">
          {status ? (
            <span className="hidden items-center gap-1.5 rounded-full border px-2.5 py-1 text-muted-foreground text-xs @2xl:flex">
              <span aria-hidden className={cn("size-1.5 rounded-full", status.ok ? "bg-success" : "bg-warning")} /> {status.label}
            </span>
          ) : null}
          {view.name !== "home" ? (
            <Button aria-label={t.searchButton} className="@3xl:hidden" onClick={() => go({ name: "home" })} size="icon-sm" variant="ghost">
              <SearchIcon />
            </Button>
          ) : null}
          {onContact ? (
            <Button className={press} onClick={() => setContactOpen(true)} size="sm" variant="outline">
              <MailIcon /> <span className="hidden @md:inline">{t.contactUs}</span>
              <span className="@md:hidden">{t.contact}</span>
            </Button>
          ) : null}
        </div>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto" ref={scrollRef}>
        <motion.div animate={{ opacity: 1, y: 0 }} initial={reduce ? { opacity: 0 } : { opacity: 0, y: 6 }} key={viewKey} transition={{ duration: 0.2, ease: easeOut }}>
          {body}
        </motion.div>
      </div>

      {onContact ? <ContactDialog categories={categories} email={email} initialTopic={initialTopic} onContact={onContact} onOpenChange={setContactOpen} open={contactOpen} replyTime={replyTime} t={t} /> : null}
    </div>
  );
}

export function HelpCentre(props: HelpCentreProps) {
  return (
    <ScreenBoundary name="HelpCentre">
      <HelpCentreScreen {...props} />
    </ScreenBoundary>
  );
}
