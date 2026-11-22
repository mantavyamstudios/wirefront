// SPDX-License-Identifier: MIT
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
"use client";

import { ScreenBoundary } from "@wirefront/ui/wirefront/boundary";
import { interpolate, useMessages } from "@wirefront/ui/wirefront/provider";
import { useEffect, useRef, useState } from "react";
import {
  Circle as CircleIcon,
  EyeIcon,
  EyeOffIcon,
  Hand,
  LockIcon,
  Maximize,
  Maximize2,
  MinusIcon,
  MousePointer2,
  PlusIcon,
  Share2,
  SlidersHorizontal,
  Square,
  Type,
  UnlockIcon,
  type LucideIcon,
} from "lucide-react";
import { Avatar, AvatarFallback } from "@wirefront/ui/avatar";
import { Separator } from "@wirefront/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetTrigger,
} from "@wirefront/ui/sheet";
import { Slider } from "@wirefront/ui/slider";
import { Tooltip, TooltipContent, TooltipTrigger } from "@wirefront/ui/tooltip";
import { cn } from "@wirefront/ui/lib/utils";

import type { CanvasShape } from "./schema";

/** Every string on the screen; override any of them with WirefrontProvider `messages` ("canvasEditor.<key>"). */
export const CANVAS_EDITOR_MESSAGES = {
  tools: "Tools",
  move: "Move",
  hand: "Hand",
  frame: "Frame",
  ellipse: "Ellipse",
  text: "Text",
  frameName: "Frame {n}",
  ellipseName: "Ellipse {n}",
  textName: "Text {n}",
  textDefault: "Text",
  openInspector: "Open inspector",
  inspector: "Inspector",
  collaborators: "People here",
  share: "Share",
  zoomOut: "Zoom out",
  zoomIn: "Zoom in",
  fit: "Fit to screen",
  fullscreen: "Fullscreen",
  selectedSize: "1 selected · {width} × {height}",
  layersOne: "1 layer · drag a tool to draw",
  layers: "{count} layers · drag a tool to draw",
  design: "Design",
  noSelection: "No selection",
  noSelectionHint:
    "Pick a shape on the canvas, or grab a tool (F, O, T) and drag to create one.",
  position: "Position",
  size: "Size",
  fill: "Fill",
  fillColor: "Fill {color}",
  opacity: "Opacity",
  layersTitle: "Layers",
  delete: "Delete",
  noLayers: "No layers yet.",
  hide: "Hide {name}",
  show: "Show {name}",
  lock: "Lock {name}",
  unlock: "Unlock {name}",
};

type ShapeType = "rectangle" | "ellipse" | "text";
type Tool = "move" | "hand" | "frame" | "ellipse" | "text";

/** A shape on the canvas. */
export type Shape = CanvasShape;

const SWATCHES = ["#3b82f6", "#8b5cf6", "#10b981", "#f59e0b", "#ef4444"];

const TOOL_ICON: Record<Tool, LucideIcon> = {
  move: MousePointer2,
  hand: Hand,
  frame: Square,
  ellipse: CircleIcon,
  text: Type,
};
const TOOL_SHORTCUT: Record<Tool, string> = {
  move: "V",
  hand: "H",
  frame: "F",
  ellipse: "O",
  text: "T",
};
const TOOL_ORDER = Object.keys(TOOL_ICON) as Tool[];

interface Point {
  x: number;
  y: number;
}

type DragState =
  | {
      kind: "create";
      type: ShapeType;
      startW: Point;
      currentW: Point;
      fill: string;
    }
  | { kind: "move"; id: string; startW: Point; startShape: Shape }
  | { kind: "pan"; startScreen: Point; startPan: Point };

let idCounter = 1;
function nextId(prefix: string): string {
  return `${prefix}-${idCounter++}`;
}

const TINT = [
  "",
  "bg-category-1-strong",
  "bg-category-2-strong",
  "bg-category-3-strong",
  "bg-category-4-strong",
  "bg-category-5-strong",
  "bg-category-6-strong",
  "bg-category-7-strong",
  "bg-category-8-strong",
];
const initialsOf = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join("");

export interface CanvasCollaborator {
  name: string;
  /** One of the eight category colours. */
  color: number;
}

export interface CanvasEditorProps {
  /** The shapes the canvas opens with (getCanvas). */
  defaultShapes: Shape[];
  /** Called with every shape after each finished edit (a drag ending, an inspector change). Save it with saveCanvas. */
  onChange?: (shapes: Shape[]) => void;
  /** People with the file open. Hidden when empty. */
  collaborators?: CanvasCollaborator[];
  /** Open your share dialog. Hidden when not given. */
  onShare?: () => void;
  /** The shape selected when the canvas opens. */
  defaultSelectedId?: string;
  className?: string;
}

function CanvasEditorScreen({
  defaultShapes,
  onChange,
  collaborators = [],
  onShare,
  defaultSelectedId,
  className,
}: CanvasEditorProps) {
  const t = useMessages("canvasEditor", CANVAS_EDITOR_MESSAGES);
  const [shapes, setShapes] = useState<Shape[]>(defaultShapes);
  const [selectedId, setSelectedId] = useState<string | null>(
    defaultSelectedId ?? null
  );
  const rootRef = useRef<HTMLDivElement>(null);
  const defaultName = (type: ShapeType, n: number) =>
    interpolate(
      type === "rectangle"
        ? t.frameName
        : type === "ellipse"
          ? t.ellipseName
          : t.textName,
      { n }
    );
  const [tool, setTool] = useState<Tool>("move");
  const [zoom, setZoom] = useState(0.85);
  const [pan, setPan] = useState<Point>({ x: 80, y: 60 });
  const [drag, setDrag] = useState<DragState | null>(null);
  const [spaceDown, setSpaceDown] = useState(false);
  const [creationCount, setCreationCount] = useState(1);

  const canvasRef = useRef<HTMLDivElement>(null);

  const selectedShape = shapes.find((s) => s.id === selectedId) ?? null;
  const isPanGesture = tool === "hand" || spaceDown;

  const updateShape = (id: string, patch: Partial<Shape>) => {
    setShapes((prev) =>
      prev.map((s) => (s.id === id ? { ...s, ...patch } : s))
    );
  };

  const screenToWorld = (clientX: number, clientY: number): Point => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return { x: 0, y: 0 };
    return {
      x: (clientX - rect.left - pan.x) / zoom,
      y: (clientY - rect.top - pan.y) / zoom,
    };
  };

  // Active touch/pen pointers, for two-finger pinch-zoom + pan.
  const pointersRef = useRef(new Map<number, Point>());
  const pinchRef = useRef<{
    startDist: number;
    startMid: Point;
    startZoom: number;
    startPan: Point;
  } | null>(null);

  const pointerPair = () => {
    const pts = [...pointersRef.current.values()];
    const rect = canvasRef.current?.getBoundingClientRect();
    if (pts.length < 2 || !rect) return null;
    const [a, b] = pts as [Point, Point];
    return {
      dist: Math.hypot(a.x - b.x, a.y - b.y),
      mid: { x: (a.x + b.x) / 2 - rect.left, y: (a.y + b.y) / 2 - rect.top },
    };
  };

  const onCanvasPointerDown = (e: React.PointerEvent) => {
    if (e.pointerType === "mouse" && e.button !== 0) return;
    if (e.pointerType !== "mouse") {
      pointersRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
      const pair = pointerPair();
      if (pair) {
        // Second finger down: cancel any single-pointer drag and pinch instead.
        setDrag(null);
        pinchRef.current = {
          startDist: pair.dist,
          startMid: pair.mid,
          startZoom: zoom,
          startPan: { ...pan },
        };
        return;
      }
    }
    const target = e.target as HTMLElement;
    const shapeEl = target.closest<HTMLElement>("[data-shape-id]");
    const clickedShapeId = shapeEl?.dataset.shapeId ?? null;
    const world = screenToWorld(e.clientX, e.clientY);

    if (isPanGesture) {
      setDrag({
        kind: "pan",
        startScreen: { x: e.clientX, y: e.clientY },
        startPan: { ...pan },
      });
      return;
    }

    if (clickedShapeId) {
      const shape = shapes.find((s) => s.id === clickedShapeId);
      if (!shape) return;
      setSelectedId(shape.id);
      if (tool === "move" && !shape.locked) {
        setDrag({
          kind: "move",
          id: shape.id,
          startW: world,
          startShape: shape,
        });
      }
      return;
    }

    if (tool === "frame" || tool === "ellipse" || tool === "text") {
      const shapeType: ShapeType =
        tool === "frame" ? "rectangle" : (tool as ShapeType);
      const fill = SWATCHES[creationCount % SWATCHES.length] ?? "#3b82f6";
      setDrag({
        kind: "create",
        type: shapeType,
        startW: world,
        currentW: world,
        fill,
      });
      setSelectedId(null);
      return;
    }

    setSelectedId(null);
  };

  // Window listeners read the latest helpers through a ref, so they don't
  // re-subscribe on every render.
  const latest = useRef({
    pointerPair,
    screenToWorld,
    defaultName,
    textDefault: t.textDefault,
  });
  latest.current = {
    pointerPair,
    screenToWorld,
    defaultName,
    textDefault: t.textDefault,
  };

  // Pinch: track touch pointers at the window level.
  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      if (!pointersRef.current.has(e.pointerId)) return;
      pointersRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
      const pinch = pinchRef.current;
      const pair = latest.current.pointerPair();
      if (!pinch || !pair) return;
      const next = Math.min(
        4,
        Math.max(0.25, pinch.startZoom * (pair.dist / pinch.startDist))
      );
      // Keep the world point under the starting midpoint under the fingers.
      const wx = (pinch.startMid.x - pinch.startPan.x) / pinch.startZoom;
      const wy = (pinch.startMid.y - pinch.startPan.y) / pinch.startZoom;
      setZoom(next);
      setPan({ x: pair.mid.x - wx * next, y: pair.mid.y - wy * next });
    };
    const onEnd = (e: PointerEvent) => {
      pointersRef.current.delete(e.pointerId);
      if (pointersRef.current.size < 2) pinchRef.current = null;
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onEnd);
    window.addEventListener("pointercancel", onEnd);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onEnd);
      window.removeEventListener("pointercancel", onEnd);
    };
  }, []);

  // Window-level pointermove + pointerup for an active single-pointer drag.
  useEffect(() => {
    if (!drag) return;
    const onMove = (e: PointerEvent) => {
      if (pinchRef.current) return;
      if (drag.kind === "pan") {
        const dx = e.clientX - drag.startScreen.x;
        const dy = e.clientY - drag.startScreen.y;
        setPan({ x: drag.startPan.x + dx, y: drag.startPan.y + dy });
        return;
      }
      const world = latest.current.screenToWorld(e.clientX, e.clientY);
      if (drag.kind === "create") {
        setDrag({ ...drag, currentW: world });
        return;
      }
      if (drag.kind === "move") {
        const dx = world.x - drag.startW.x;
        const dy = world.y - drag.startW.y;
        setShapes((prev) =>
          prev.map((s) =>
            s.id === drag.id
              ? {
                  ...s,
                  x: drag.startShape.x + dx,
                  y: drag.startShape.y + dy,
                }
              : s
          )
        );
      }
    };
    const onUp = () => {
      if (drag.kind === "create") {
        const x1 = Math.min(drag.startW.x, drag.currentW.x);
        const y1 = Math.min(drag.startW.y, drag.currentW.y);
        const w = Math.abs(drag.currentW.x - drag.startW.x);
        const h = Math.abs(drag.currentW.y - drag.startW.y);
        if (w >= 4 && h >= 4) {
          const id = nextId(drag.type);
          const next = creationCount + 1;
          setShapes((prev) => [
            ...prev,
            {
              id,
              type: drag.type,
              x: x1,
              y: y1,
              width: drag.type === "text" ? Math.max(w, 80) : w,
              height: drag.type === "text" ? Math.max(h, 32) : h,
              fill: drag.fill,
              opacity: 100,
              visible: true,
              locked: false,
              text:
                drag.type === "text" ? latest.current.textDefault : undefined,
              name: latest.current.defaultName(drag.type, creationCount),
            },
          ]);
          setSelectedId(id);
          setCreationCount(next);
          setTool("move");
        }
      }
      setDrag(null);
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onUp);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onUp);
    };
  }, [drag, creationCount]);

  // Keyboard shortcuts: tools, delete, escape, space-to-pan.
  useEffect(() => {
    const isTypingTarget = (el: EventTarget | null) => {
      if (!(el instanceof HTMLElement)) return false;
      return (
        el.tagName === "INPUT" ||
        el.tagName === "TEXTAREA" ||
        el.isContentEditable
      );
    };
    const onKey = (e: KeyboardEvent) => {
      if (isTypingTarget(e.target)) return;
      if (e.code === "Space") {
        e.preventDefault();
        setSpaceDown(true);
        return;
      }
      if (e.key === "Escape") {
        setSelectedId(null);
        return;
      }
      if (e.key === "Delete" || e.key === "Backspace") {
        if (selectedId) {
          e.preventDefault();
          setShapes((prev) => prev.filter((s) => s.id !== selectedId));
          setSelectedId(null);
        }
        return;
      }
      const k = e.key.toLowerCase();
      if (k === "v") setTool("move");
      else if (k === "h") setTool("hand");
      else if (k === "r" || k === "f") setTool("frame");
      else if (k === "o") setTool("ellipse");
      else if (k === "t") setTool("text");
    };
    const onKeyUp = (e: KeyboardEvent) => {
      if (e.code === "Space") setSpaceDown(false);
    };
    window.addEventListener("keydown", onKey);
    window.addEventListener("keyup", onKeyUp);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("keyup", onKeyUp);
    };
  }, [selectedId]);

  // Wheel: cmd/ctrl-wheel zooms (centered on cursor); plain wheel pans.
  useEffect(() => {
    const el = canvasRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      const rect = el.getBoundingClientRect();
      const sx = e.clientX - rect.left;
      const sy = e.clientY - rect.top;
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        const factor = Math.exp(-e.deltaY * 0.01);
        setZoom((current) => {
          const next = Math.min(4, Math.max(0.25, current * factor));
          const wx = (sx - pan.x) / current;
          const wy = (sy - pan.y) / current;
          setPan({ x: sx - wx * next, y: sy - wy * next });
          return next;
        });
      } else {
        e.preventDefault();
        setPan((p) => ({ x: p.x - e.deltaX, y: p.y - e.deltaY }));
      }
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, [pan.x, pan.y]);

  const onZoomChange = (delta: number) => {
    const el = canvasRef.current;
    if (!el) {
      setZoom((z) => Math.min(4, Math.max(0.25, z + delta)));
      return;
    }
    const rect = el.getBoundingClientRect();
    const sx = rect.width / 2;
    const sy = rect.height / 2;
    setZoom((current) => {
      const next = Math.min(4, Math.max(0.25, current + delta));
      const wx = (sx - pan.x) / current;
      const wy = (sy - pan.y) / current;
      setPan({ x: sx - wx * next, y: sy - wy * next });
      return next;
    });
  };

  const onFitToScreen = () => {
    const el = canvasRef.current;
    const visible = shapes.filter((s) => s.visible);
    if (!el || visible.length === 0) {
      setZoom(1);
      setPan({ x: 0, y: 0 });
      return;
    }
    const rect = el.getBoundingClientRect();
    const minX = Math.min(...visible.map((s) => s.x));
    const minY = Math.min(...visible.map((s) => s.y));
    const maxX = Math.max(...visible.map((s) => s.x + s.width));
    const maxY = Math.max(...visible.map((s) => s.y + s.height));
    const w = maxX - minX;
    const h = maxY - minY;
    const padding = 80;
    const scaleX = (rect.width - padding * 2) / w;
    const scaleY = (rect.height - padding * 2) / h;
    const next = Math.min(4, Math.max(0.25, Math.min(scaleX, scaleY)));
    const cx = (minX + maxX) / 2;
    const cy = (minY + maxY) / 2;
    setZoom(next);
    setPan({
      x: rect.width / 2 - cx * next,
      y: rect.height / 2 - cy * next,
    });
  };

  // Report the shapes once an edit finishes (not on every pointer move).
  const reported = useRef(shapes);
  useEffect(() => {
    if (drag || shapes === reported.current) return;
    reported.current = shapes;
    onChange?.(shapes);
  }, [shapes, drag, onChange]);

  const visibleShapes = shapes.filter((s) => s.visible);
  const previewRect =
    drag?.kind === "create"
      ? {
          x: Math.min(drag.startW.x, drag.currentW.x),
          y: Math.min(drag.startW.y, drag.currentW.y),
          width: Math.abs(drag.currentW.x - drag.startW.x),
          height: Math.abs(drag.currentW.y - drag.startW.y),
          fill: drag.fill,
          type: drag.type,
        }
      : null;

  const inspector = (className?: string) => (
    <Inspector
      className={className}
      shape={selectedShape}
      shapes={shapes}
      selectedId={selectedId}
      onSelect={setSelectedId}
      onUpdate={updateShape}
      onToggleVisible={(id) =>
        setShapes((prev) =>
          prev.map((s) => (s.id === id ? { ...s, visible: !s.visible } : s))
        )
      }
      onToggleLocked={(id) =>
        setShapes((prev) =>
          prev.map((s) => (s.id === id ? { ...s, locked: !s.locked } : s))
        )
      }
      onDelete={(id) => {
        setShapes((prev) => prev.filter((s) => s.id !== id));
        if (selectedId === id) setSelectedId(null);
      }}
    />
  );

  const cursorClass =
    drag?.kind === "pan"
      ? "cursor-grabbing"
      : isPanGesture
        ? "cursor-grab"
        : tool === "frame" || tool === "ellipse" || tool === "text"
          ? "cursor-crosshair"
          : "cursor-default";

  return (
    <div
      className={cn(
        "relative h-svh w-full select-none overflow-hidden bg-foreground/2 text-foreground",
        className
      )}
      ref={rootRef}
    >
      <DotGrid pan={pan} zoom={zoom} />

      <div
        ref={canvasRef}
        // touch-none: the canvas owns all touch gestures (no page scroll/zoom).
        className={cn("absolute inset-0 touch-none", cursorClass)}
        onPointerDown={onCanvasPointerDown}
      >
        <div
          className="absolute top-0 inset-s-0"
          style={{
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
            transformOrigin: "0 0",
          }}
        >
          {visibleShapes.map((s) => (
            <ShapeRender
              key={s.id}
              shape={s}
              isSelected={s.id === selectedId}
              zoom={zoom}
              tool={tool}
            />
          ))}
          {previewRect && previewRect.width > 0 && previewRect.height > 0 ? (
            <div
              className="pointer-events-none absolute"
              style={{
                left: previewRect.x,
                top: previewRect.y,
                width: previewRect.width,
                height: previewRect.height,
              }}
            >
              <div
                className={cn(
                  "size-full",
                  previewRect.type === "ellipse" ? "rounded-full" : "rounded-md"
                )}
                style={{
                  backgroundColor: previewRect.fill,
                  opacity: 0.6,
                }}
              />
              <div
                className="pointer-events-none absolute inset-0 border-2 border-category-1 border-dashed"
                style={{
                  borderRadius:
                    previewRect.type === "ellipse" ? "9999px" : "6px",
                }}
              />
            </div>
          ) : null}
        </div>
      </div>

      <ToolsPalette
        tool={tool}
        onChangeTool={setTool}
        mobileExtra={
          <Sheet>
            <SheetTrigger
              aria-label={t.openInspector}
              className="grid size-11 shrink-0 place-items-center rounded-md text-foreground/70 hover:bg-foreground/6 hover:text-foreground"
            >
              <SlidersHorizontal className="size-4" />
            </SheetTrigger>
            <SheetContent
              side="bottom"
              className="max-h-[70svh] pb-[env(safe-area-inset-bottom)]"
            >
              <SheetTitle className="sr-only">{t.inspector}</SheetTitle>
              {inspector(
                "w-full border-0 bg-transparent pt-12 shadow-none backdrop-blur-none"
              )}
            </SheetContent>
          </Sheet>
        }
      />
      {collaborators.length || onShare ? (
        <CollabBar collaborators={collaborators} onShare={onShare} />
      ) : null}
      <ZoomControls
        zoom={zoom}
        onIn={() => onZoomChange(0.1)}
        onOut={() => onZoomChange(-0.1)}
        onFit={onFitToScreen}
        onFullscreen={() => void rootRef.current?.requestFullscreen?.()}
      />
      <StatusPill selected={selectedShape} total={shapes.length} />

      {/* Floating inspector from md up; a bottom sheet below that. */}
      <div className="hidden md:block">{inspector()}</div>
    </div>
  );
}

function DotGrid({ pan, zoom }: { pan: Point; zoom: number }) {
  const size = 24 * zoom;
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0"
      style={{
        backgroundImage:
          "radial-gradient(color-mix(in oklab, var(--color-foreground) 18%, transparent) 1px, transparent 1px)",
        backgroundSize: `${size}px ${size}px`,
        backgroundPosition: `${pan.x}px ${pan.y}px`,
      }}
    />
  );
}

function ShapeRender({
  shape,
  isSelected,
  zoom,
  tool,
}: {
  shape: Shape;
  isSelected: boolean;
  zoom: number;
  tool: Tool;
}) {
  const cursor =
    shape.locked || tool !== "move" ? "cursor-default" : "cursor-move";
  return (
    <div
      data-shape-id={shape.id}
      className={cn("absolute", cursor)}
      style={{
        left: shape.x,
        top: shape.y,
        width: shape.width,
        height: shape.height,
        opacity: shape.opacity / 100,
      }}
    >
      {shape.type === "ellipse" ? (
        <div
          className="size-full rounded-full"
          style={{ backgroundColor: shape.fill }}
        />
      ) : shape.type === "text" ? (
        <div
          className="flex size-full items-center justify-start font-heading"
          style={{
            color: shape.fill,
            fontSize: Math.max(16, shape.height * 0.5),
            lineHeight: 1,
          }}
        >
          {shape.text}
        </div>
      ) : (
        <div
          className="size-full rounded-md"
          style={{ backgroundColor: shape.fill }}
        />
      )}
      {isSelected ? <SelectionFrame shape={shape} zoom={zoom} /> : null}
    </div>
  );
}

function SelectionFrame({ shape, zoom }: { shape: Shape; zoom: number }) {
  const handle = 8 / zoom;
  const stroke = 1.5 / zoom;
  const ringInset = -stroke;
  const handles: { id: string; left: number; top: number }[] = [
    { id: "nw", left: 0, top: 0 },
    { id: "n", left: shape.width / 2, top: 0 },
    { id: "ne", left: shape.width, top: 0 },
    { id: "w", left: 0, top: shape.height / 2 },
    { id: "e", left: shape.width, top: shape.height / 2 },
    { id: "sw", left: 0, top: shape.height },
    { id: "s", left: shape.width / 2, top: shape.height },
    { id: "se", left: shape.width, top: shape.height },
  ];
  return (
    <>
      <div
        className="pointer-events-none absolute"
        style={{
          inset: ringInset,
          border: `${stroke}px solid rgb(59 130 246)`,
        }}
      />
      {handles.map((p) => (
        <div
          key={p.id}
          className="pointer-events-none absolute bg-category-1"
          style={{
            left: p.left - handle / 2,
            top: p.top - handle / 2,
            width: handle,
            height: handle,
            border: `${stroke}px solid white`,
          }}
        />
      ))}
    </>
  );
}

function ToolsPalette({
  tool,
  onChangeTool,
  mobileExtra,
}: {
  tool: Tool;
  onChangeTool: (t: Tool) => void;
  mobileExtra?: React.ReactNode;
}) {
  const t = useMessages("canvasEditor", CANVAS_EDITOR_MESSAGES);
  // Vertical palette top-left on md+; a horizontal bottom bar (wraps if needed) on
  // phones (thumb reach, and it keeps the top free for zoom/collab).
  return (
    <div
      role="toolbar"
      aria-label={t.tools}
      className="absolute bottom-[calc(0.75rem+env(safe-area-inset-bottom))] left-1/2 z-10 flex max-w-[calc(100vw-1.5rem)] -translate-x-1/2 rounded-xl border border-border bg-card/85 p-1 shadow-lg backdrop-blur md:top-3 md:bottom-auto md:left-3 md:translate-x-0"
    >
      <div className="flex min-w-0 flex-row flex-wrap justify-center gap-0.5 md:flex-col md:flex-nowrap">
        {TOOL_ORDER.map((id) => {
          const Icon = TOOL_ICON[id];
          const isActive = tool === id;
          const label = t[id];
          return (
            <Tooltip key={id}>
              <TooltipTrigger
                aria-label={label}
                aria-pressed={isActive}
                onClick={() => onChangeTool(id)}
                className={cn(
                  "grid size-9 shrink-0 place-items-center rounded-md transition-colors pointer-coarse:size-11",
                  isActive
                    ? "bg-foreground/10 text-foreground"
                    : "text-foreground/70 hover:bg-foreground/6 hover:text-foreground"
                )}
              >
                <Icon className="size-4" />
              </TooltipTrigger>
              <TooltipContent side="right">
                <span className="flex items-center gap-2">
                  {label}
                  <span className="rounded border border-border bg-muted px-1 font-mono text-[10px] text-muted-foreground">
                    {TOOL_SHORTCUT[id]}
                  </span>
                </span>
              </TooltipContent>
            </Tooltip>
          );
        })}
      </div>
      {mobileExtra ? (
        <>
          <Separator
            orientation="vertical"
            className="mx-0.5 h-6 self-center md:hidden"
          />
          <div className="md:hidden">{mobileExtra}</div>
        </>
      ) : null}
    </div>
  );
}

function CollabBar({
  collaborators,
  onShare,
}: {
  collaborators: CanvasCollaborator[];
  onShare?: () => void;
}) {
  const t = useMessages("canvasEditor", CANVAS_EDITOR_MESSAGES);
  return (
    <div className="absolute top-3 left-3 z-10 flex items-center gap-2 rounded-full border border-border bg-card/85 px-2 py-1 shadow-lg backdrop-blur md:left-1/2 md:-translate-x-1/2">
      {collaborators.length ? (
        <ul aria-label={t.collaborators} className="flex -space-x-1.5">
          {collaborators.map((c, i) => (
            <li className={cn(i > 1 && "max-sm:hidden")} key={c.name}>
              <Avatar
                className={cn(
                  "size-7 text-white ring-2 ring-card",
                  TINT[c.color]
                )}
                title={c.name}
              >
                <AvatarFallback className="bg-transparent font-medium text-[10px] text-white">
                  <span aria-hidden>{initialsOf(c.name)}</span>
                  <span className="sr-only">{c.name}</span>
                </AvatarFallback>
              </Avatar>
            </li>
          ))}
        </ul>
      ) : null}
      {collaborators.length && onShare ? (
        <Separator className="h-5" orientation="vertical" />
      ) : null}
      {onShare ? (
        <button
          className="inline-flex items-center gap-1.5 rounded-full bg-foreground px-2.5 py-1 font-medium text-[11px] text-background hover:bg-foreground/90 pointer-coarse:min-h-9"
          onClick={onShare}
          type="button"
        >
          <Share2 aria-hidden className="size-3" />
          {t.share}
        </button>
      ) : null}
    </div>
  );
}

function ZoomControls({
  zoom,
  onIn,
  onOut,
  onFit,
  onFullscreen,
}: {
  zoom: number;
  onIn: () => void;
  onOut: () => void;
  onFit: () => void;
  onFullscreen: () => void;
}) {
  const t = useMessages("canvasEditor", CANVAS_EDITOR_MESSAGES);
  return (
    <div className="absolute top-3 inset-e-3 z-10 flex items-center gap-0.5 rounded-full border border-border bg-card/85 p-1 shadow-lg backdrop-blur">
      <Tooltip>
        <TooltipTrigger
          aria-label={t.zoomOut}
          onClick={onOut}
          className="grid size-7 place-items-center rounded-full text-foreground/70 hover:bg-foreground/6 hover:text-foreground pointer-coarse:size-9"
        >
          <MinusIcon className="size-3.5" />
        </TooltipTrigger>
        <TooltipContent>{t.zoomOut}</TooltipContent>
      </Tooltip>
      <span className="min-w-10.5 px-2 text-center font-mono text-foreground/80 text-xs tabular-nums">
        {Math.round(zoom * 100)}%
      </span>
      <Tooltip>
        <TooltipTrigger
          aria-label={t.zoomIn}
          onClick={onIn}
          className="grid size-7 place-items-center rounded-full text-foreground/70 hover:bg-foreground/6 hover:text-foreground pointer-coarse:size-9"
        >
          <PlusIcon className="size-3.5" />
        </TooltipTrigger>
        <TooltipContent>{t.zoomIn}</TooltipContent>
      </Tooltip>
      <Separator orientation="vertical" className="mx-1 h-5" />
      <Tooltip>
        <TooltipTrigger
          aria-label={t.fit}
          onClick={onFit}
          className="grid size-7 place-items-center rounded-full text-foreground/70 hover:bg-foreground/6 hover:text-foreground pointer-coarse:size-9"
        >
          <Maximize2 className="size-3.5" />
        </TooltipTrigger>
        <TooltipContent>{t.fit}</TooltipContent>
      </Tooltip>
      <Tooltip>
        <TooltipTrigger
          aria-label={t.fullscreen}
          onClick={onFullscreen}
          className="grid size-7 place-items-center rounded-full text-foreground/70 hover:bg-foreground/6 hover:text-foreground max-sm:hidden pointer-coarse:size-9"
        >
          <Maximize className="size-3.5" />
        </TooltipTrigger>
        <TooltipContent>{t.fullscreen}</TooltipContent>
      </Tooltip>
    </div>
  );
}

function StatusPill({
  selected,
  total,
}: {
  selected: Shape | null;
  total: number;
}) {
  const t = useMessages("canvasEditor", CANVAS_EDITOR_MESSAGES);
  return (
    <div
      aria-live="polite"
      className="absolute bottom-3 inset-s-3 z-10 hidden rounded-md border border-border bg-card/85 px-2 py-1 font-mono text-[10px] text-foreground/70 uppercase tracking-[0.2em] backdrop-blur md:block"
    >
      {selected
        ? interpolate(t.selectedSize, {
            width: Math.round(selected.width),
            height: Math.round(selected.height),
          })
        : interpolate(total === 1 ? t.layersOne : t.layers, { count: total })}
    </div>
  );
}

function Inspector({
  className,
  shape,
  shapes,
  selectedId,
  onSelect,
  onUpdate,
  onToggleVisible,
  onToggleLocked,
  onDelete,
}: {
  className?: string;
  shape: Shape | null;
  shapes: Shape[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onUpdate: (id: string, patch: Partial<Shape>) => void;
  onToggleVisible: (id: string) => void;
  onToggleLocked: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  const t = useMessages("canvasEditor", CANVAS_EDITOR_MESSAGES);
  return (
    <div
      className={cn(
        "absolute inset-e-3 bottom-3 z-10 w-72 overflow-hidden rounded-xl border border-border bg-card/85 shadow-lg backdrop-blur",
        className && "static",
        className
      )}
    >
      <h2 className="border-border border-b px-3 py-2 font-medium text-[11px]">
        {t.design}
      </h2>

      {!shape ? (
        <div className="px-3 py-6 text-center">
          <div className="font-mono text-[10px] text-muted-foreground uppercase tracking-[0.15em]">
            {t.noSelection}
          </div>
          <p className="mt-2 text-muted-foreground text-xs leading-relaxed">
            {t.noSelectionHint}
          </p>
        </div>
      ) : (
        <div className="space-y-3 px-3 py-2">
          <InspectorSection title={t.position}>
            <div className="grid grid-cols-2 gap-2">
              <NumberField
                label="X"
                value={Math.round(shape.x)}
                onChange={(v) => onUpdate(shape.id, { x: v })}
              />
              <NumberField
                label="Y"
                value={Math.round(shape.y)}
                onChange={(v) => onUpdate(shape.id, { y: v })}
              />
            </div>
          </InspectorSection>
          <InspectorSection title={t.size}>
            <div className="grid grid-cols-2 gap-2">
              <NumberField
                label="W"
                value={Math.round(shape.width)}
                onChange={(v) => onUpdate(shape.id, { width: Math.max(4, v) })}
              />
              <NumberField
                label="H"
                value={Math.round(shape.height)}
                onChange={(v) => onUpdate(shape.id, { height: Math.max(4, v) })}
              />
            </div>
          </InspectorSection>
          <InspectorSection title={t.fill}>
            <div className="space-y-2">
              <div className="flex items-center gap-1.5">
                {SWATCHES.map((c) => (
                  <button
                    key={c}
                    type="button"
                    aria-label={interpolate(t.fillColor, { color: c })}
                    onClick={() => onUpdate(shape.id, { fill: c })}
                    className={cn(
                      "size-5 rounded-md border transition-shadow",
                      shape.fill === c
                        ? "border-foreground/60 ring-2 ring-foreground/20 ring-offset-2 ring-offset-card"
                        : "border-border hover:border-foreground/40"
                    )}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
              <div className="flex items-center gap-2">
                <span className="w-8 font-mono text-[10px] text-muted-foreground tabular-nums">
                  {shape.opacity}%
                </span>
                <span className="sr-only" id={`opacity-label-${shape.id}`}>
                  {t.opacity}
                </span>
                <Slider
                  aria-labelledby={`opacity-label-${shape.id}`}
                  className="flex-1"
                  max={100}
                  min={0}
                  value={[shape.opacity]}
                  onValueChange={(v) =>
                    onUpdate(shape.id, {
                      opacity: Math.round(Array.isArray(v) ? (v[0] ?? 0) : v),
                    })
                  }
                />
              </div>
            </div>
          </InspectorSection>
        </div>
      )}

      <Separator />

      <div className="px-3 py-2">
        <div className="mb-1.5 flex items-center justify-between">
          <h3 className="font-mono text-[10px] text-muted-foreground uppercase tracking-[0.15em]">
            {t.layersTitle}
          </h3>
          {shape ? (
            <button
              type="button"
              onClick={() => onDelete(shape.id)}
              className="font-mono text-[10px] text-muted-foreground uppercase tracking-[0.15em] hover:text-destructive"
            >
              {t.delete}
            </button>
          ) : null}
        </div>
        <div className="space-y-0.5">
          {shapes.length === 0 ? (
            <p className="px-1.5 py-2 text-muted-foreground text-[11px]">
              {t.noLayers}
            </p>
          ) : (
            [...shapes].reverse().map((layer) => {
              const isActive = selectedId === layer.id;
              return (
                <div
                  key={layer.id}
                  className={cn(
                    "flex w-full items-center gap-2 rounded-md px-1.5 py-1 text-start text-[11px] transition-colors pointer-coarse:min-h-11 pointer-coarse:text-xs",
                    isActive
                      ? "bg-category-1/10 text-category-1-foreground"
                      : "hover:bg-foreground/5"
                  )}
                >
                  <button
                    type="button"
                    onClick={() => onToggleVisible(layer.id)}
                    aria-label={interpolate(layer.visible ? t.hide : t.show, {
                      name: layer.name,
                    })}
                    className="grid size-6 place-items-center rounded text-muted-foreground hover:text-foreground pointer-coarse:size-9"
                  >
                    {layer.visible ? (
                      <EyeIcon className="size-3" />
                    ) : (
                      <EyeOffIcon className="size-3" />
                    )}
                  </button>
                  <button
                    aria-pressed={isActive}
                    className="flex min-w-0 flex-1 cursor-pointer items-center gap-2 self-stretch rounded text-start outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    onClick={() => onSelect(layer.id)}
                    type="button"
                  >
                    <ShapeIcon type={layer.type} />
                    <span className="flex-1 truncate">{layer.name}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => onToggleLocked(layer.id)}
                    aria-label={interpolate(layer.locked ? t.unlock : t.lock, {
                      name: layer.name,
                    })}
                    className="grid size-6 place-items-center rounded text-muted-foreground hover:text-foreground pointer-coarse:size-9"
                  >
                    {layer.locked ? (
                      <LockIcon className="size-3" />
                    ) : (
                      <UnlockIcon className="size-3" />
                    )}
                  </button>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}

function ShapeIcon({ type }: { type: ShapeType }) {
  if (type === "ellipse")
    return <CircleIcon className="size-3 shrink-0 text-foreground/60" />;
  if (type === "text")
    return <Type className="size-3 shrink-0 text-foreground/60" />;
  return <Square className="size-3 shrink-0 text-foreground/60" />;
}

function InspectorSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <div className="font-mono text-[10px] text-muted-foreground uppercase tracking-[0.15em]">
        {title}
      </div>
      {children}
    </div>
  );
}

function NumberField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
}) {
  const [local, setLocal] = useState(String(value));
  useEffect(() => setLocal(String(value)), [value]);
  return (
    <label className="flex items-center gap-1.5 rounded-md border border-border bg-background px-2 py-1 has-focus:border-foreground/40">
      <span className="font-mono text-[10px] text-muted-foreground">
        {label}
      </span>
      <input
        type="text"
        inputMode="numeric"
        value={local}
        onChange={(e) => setLocal(e.target.value)}
        onBlur={() => {
          const n = Number(local);
          if (Number.isFinite(n)) onChange(n);
          else setLocal(String(value));
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter") (e.target as HTMLInputElement).blur();
        }}
        className="w-full bg-transparent font-mono text-[11px] text-foreground tabular-nums outline-none"
      />
    </label>
  );
}

export function CanvasEditor(props: CanvasEditorProps) {
  return (
    <ScreenBoundary name="CanvasEditor">
      <CanvasEditorScreen {...props} />
    </ScreenBoundary>
  );
}
