import { Laptop, Smartphone, Tablet } from "lucide-react";
import type { LucideIcon } from "lucide-react";

export type FlowDevice = "phone" | "tablet" | "desktop";

interface Rect {
  height: number;
  left: number;
  top: number;
  width: number;
}

/**
 * One simulated device. All numbers are CSS px at 1×; the frame is scaled
 * as a whole to fit the preview panel.
 */
export interface FlowDeviceSpec {
  /** Bounding box of the whole device (body, buttons, base). */
  frame: { height: number; width: number };
  Icon: LucideIcon;
  id: FlowDevice;
  label: string;
  model: string;
  /** Display glass, relative to `frame`. */
  screen: Rect & { radius: string };
  /** The app viewport (iframe) inside the screen. */
  viewport: { height: number; top: number; width: number };
}

// Bodies are drawn to scale from the published dimensions: px-per-mm comes
// from each display's size and resolution. Corner radii aren't published;
// they're estimates from product photos.

// Galaxy S23 Ultra: 6.8″ 1440×3088 @ 3.75 → 384×824 at ≈ 5.26 px/mm. The
// display curves over the side edges, so from the front the bezel is only
// ≈ 1.4 mm all round (measured on Samsung's 78.1×163.4 mm dimension
// drawing) with near-square ≈ 2.5 mm corners.
const PHONE_RIM = 2;
const PHONE_INSET_X = 8;
const PHONE_INSET_Y = 8;
const PHONE_SIDE = 4; // room for the side keys
const PHONE_BODY_RADIUS = 14;
const PHONE_SCREEN_RADIUS = 6;

// Galaxy Tab S7+: 12.4″ 1752×2800 @ 2 → 876×1400 (portrait); display ≈
// 167.1×267.0 mm, body 185×285 mm → 5.24 px/mm → 9 mm bezels.
// Bezels drawn at half the computed 9 mm for a lighter look.
const TABLET_INSET = 23.5;
const TABLET_BODY_RADIUS = 30;
const TABLET_SCREEN_RADIUS = 10;

// MacBook Pro 14″: 1512×982 scaled; lid only (no base or notch) so the app
// gets the whole display.
const MAC_INSET_X = 24;
const MAC_INSET_TOP = 24;
const MAC_CHIN = 36;
const MAC_LID_RADIUS = 26;

export const FLOW_DEVICES: Record<FlowDevice, FlowDeviceSpec> = {
  phone: {
    id: "phone",
    label: "Phone",
    model: "Galaxy S23 Ultra",
    Icon: Smartphone,
    frame: {
      width: 384 + PHONE_INSET_X * 2 + PHONE_SIDE * 2,
      height: 824 + PHONE_INSET_Y * 2,
    },
    screen: {
      left: PHONE_SIDE + PHONE_INSET_X,
      top: PHONE_INSET_Y,
      width: 384,
      height: 824,
      radius: `${PHONE_SCREEN_RADIUS}px`,
    },
    viewport: { width: 384, height: 824, top: 0 },
  },
  tablet: {
    id: "tablet",
    label: "Tablet",
    model: "Galaxy Tab S7+",
    Icon: Tablet,
    frame: { width: 876 + TABLET_INSET * 2, height: 1400 + TABLET_INSET * 2 },
    screen: {
      left: TABLET_INSET,
      top: TABLET_INSET,
      width: 876,
      height: 1400,
      radius: `${TABLET_SCREEN_RADIUS}px`,
    },
    viewport: { width: 876, height: 1400, top: 0 },
  },
  desktop: {
    id: "desktop",
    label: "Desktop",
    model: "MacBook Pro 14″",
    Icon: Laptop,
    frame: {
      width: 1512 + MAC_INSET_X * 2,
      height: 982 + MAC_INSET_TOP + MAC_CHIN,
    },
    screen: {
      left: MAC_INSET_X,
      top: MAC_INSET_TOP,
      width: 1512,
      height: 982,
      radius: "8px 8px 0 0",
    },
    viewport: { width: 1512, height: 982, top: 0 },
  },
};

export const FLOW_DEVICE_ORDER: FlowDevice[] = ["phone", "tablet", "desktop"];

/** Brushed-metal edge shared by all three devices (dark "titanium" finish). */
const METAL =
  "linear-gradient(145deg, #74767b 0%, #2c2d31 32%, #5b5d62 58%, #1f2023 100%)";
const BODY_SHADOW =
  "0 50px 100px -30px rgb(0 0 0 / 0.45), 0 30px 60px -30px rgb(0 0 0 / 0.35), inset 0 0 0 1px rgb(255 255 255 / 0.06)";

/**
 * The spec turned on its side for a landscape screen (phone and tablet only;
 * the laptop is always landscape). Keys end up on the top edge.
 */
export function orientDevice(
  spec: FlowDeviceSpec,
  landscape: boolean
): FlowDeviceSpec {
  if (!landscape || spec.id === "desktop") {
    return spec;
  }
  return {
    ...spec,
    frame: { width: spec.frame.height, height: spec.frame.width },
    screen: {
      ...spec.screen,
      left: spec.screen.top,
      top: spec.screen.left,
      width: spec.screen.height,
      height: spec.screen.width,
    },
    viewport: {
      width: spec.viewport.height,
      height: spec.viewport.width,
      top: 0,
    },
  };
}

/** Device body drawn behind the screen. Purely decorative. */
export function FlowDeviceChrome({
  device,
  landscape = false,
}: {
  device: FlowDevice;
  landscape?: boolean;
}) {
  const { frame } = orientDevice(FLOW_DEVICES[device], landscape);

  if (device === "phone") {
    // Portrait: keys on the right edge. Landscape: rotated onto the top edge.
    const keys = [
      { at: 0.21, length: 0.12 },
      { at: 0.37, length: 0.065 },
    ];
    if (landscape) {
      const bodyHeight = frame.height - PHONE_SIDE * 2;
      return (
        <div aria-hidden className="absolute inset-0">
          {keys.map((key) => (
            <div
              className="absolute rounded-t-[2px]"
              key={key.at}
              style={{
                top: 1,
                left: frame.width * key.at,
                width: frame.width * key.length,
                height: PHONE_SIDE - 1,
                background: METAL,
              }}
            />
          ))}
          <Body
            height={bodyHeight}
            left={0}
            radius={PHONE_BODY_RADIUS}
            rim={PHONE_RIM}
            top={PHONE_SIDE}
            width={frame.width}
          />
        </div>
      );
    }
    const bodyWidth = frame.width - PHONE_SIDE * 2;
    return (
      <div aria-hidden className="absolute inset-0">
        {keys.map((key) => (
          <div
            className="absolute rounded-r-[2px]"
            key={key.at}
            style={{
              left: PHONE_SIDE + bodyWidth - 1,
              top: frame.height * key.at,
              width: PHONE_SIDE - 1,
              height: frame.height * key.length,
              background: METAL,
            }}
          />
        ))}
        <Body
          height={frame.height}
          left={PHONE_SIDE}
          radius={PHONE_BODY_RADIUS}
          rim={PHONE_RIM}
          width={bodyWidth}
        />
      </div>
    );
  }

  return (
    <div aria-hidden className="absolute inset-0">
      <Body
        height={frame.height}
        left={0}
        radius={device === "tablet" ? TABLET_BODY_RADIUS : MAC_LID_RADIUS}
        rim={2}
        width={frame.width}
      />
    </div>
  );
}

function Body({
  height,
  left,
  radius,
  rim,
  top = 0,
  width,
}: {
  height: number;
  left: number;
  radius: number;
  rim: number;
  top?: number;
  width: number;
}) {
  return (
    <div
      className="absolute"
      style={{
        left,
        top,
        width,
        height,
        borderRadius: radius,
        padding: rim,
        background: METAL,
        boxShadow: BODY_SHADOW,
      }}
    >
      <div
        className="size-full bg-[#0a0a0b]"
        style={{ borderRadius: radius - rim }}
      />
    </div>
  );
}
