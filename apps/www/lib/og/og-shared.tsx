import { readFileSync } from "node:fs";
import { readFile } from "node:fs/promises";
import path from "node:path";

import { OG_PALETTE } from "@workspace/ui/components/og/palette";

import { SITE_URL } from "@/lib/site";

/** Font family registered with `next/og` for share images. */
export const OG_FONT_FAMILY = "Inter";

/** `@fontsource/inter` (OFL); bun hoists it to the monorepo's root `node_modules`. */
const FONT_FILE = path.join(
  process.cwd(),
  "../../node_modules/@fontsource/inter/files/inter-latin-500-normal.woff"
);

let interMediumData: Promise<ArrayBuffer> | undefined;

/** Inter Medium (500), read once at build time for `next/og`. */
export function getOgFontData(): Promise<ArrayBuffer> {
  interMediumData ??= readFile(FONT_FILE).then(
    ({ buffer, byteOffset, byteLength }) =>
      buffer.slice(byteOffset, byteOffset + byteLength) as ArrayBuffer
  );
  return interMediumData;
}

let avatarSrc: string | undefined;

/** The GitHub avatar fetched by scripts/fetch-avatar.mts, as a data URL. */
function getOgAvatarSrc() {
  avatarSrc ??= `data:image/jpeg;base64,${readFileSync(
    path.join(process.cwd(), "public/brand/avatar-128.jpg")
  ).toString("base64")}`;
  return avatarSrc;
}

export function OgBrand() {
  return (
    <div tw="flex flex-row items-center">
      {/* oxlint-disable-next-line next/no-img-element, react-doctor/nextjs-no-img-element -- next/og renders plain <img>. */}
      <img
        alt=""
        height={52}
        src={getOgAvatarSrc()}
        style={{ borderRadius: 12 }}
        width={52}
      />
      <p
        style={{
          fontFamily: OG_FONT_FAMILY,
          letterSpacing: "-1.5px",
          marginLeft: 12,
        }}
        tw="text-white text-5xl font-bold"
      >
        Wirefront
      </p>
    </div>
  );
}

export interface OgPageContent {
  description?: string;
  title: string;
}

export function OgImageFrame({ title, description }: OgPageContent) {
  return (
    <div
      style={{ backgroundColor: OG_PALETTE.background }}
      tw="relative flex w-full h-full"
    >
      <div
        style={{ backgroundColor: OG_PALETTE.borderSubtle }}
        tw="absolute left-15 top-0 bottom-0 w-0.5 h-full"
      />
      <div
        style={{ backgroundColor: OG_PALETTE.borderSubtle }}
        tw="absolute right-15 top-0 bottom-0 w-0.5 h-full"
      />
      <div
        style={{ backgroundColor: OG_PALETTE.borderSubtle }}
        tw="absolute bottom-15 left-0 right-0 w-full h-0.5"
      />
      <div
        style={{ backgroundColor: OG_PALETTE.borderSubtle }}
        tw="absolute top-15 left-0 right-0 w-full h-0.5"
      />

      <div
        style={{ backgroundColor: OG_PALETTE.borderMuted }}
        tw="absolute top-15 left-[43.5px] w-[35px] h-0.5"
      />
      <div
        style={{ backgroundColor: OG_PALETTE.borderMuted }}
        tw="absolute left-15 top-[43.5px] h-[35px] w-0.5"
      />

      <div
        style={{ backgroundColor: OG_PALETTE.borderMuted }}
        tw="absolute bottom-15 left-[43.5px] w-[35px] h-0.5"
      />
      <div
        style={{ backgroundColor: OG_PALETTE.borderMuted }}
        tw="absolute left-15 bottom-[43.5px] h-[35px] w-0.5"
      />

      <div
        style={{ backgroundColor: OG_PALETTE.borderMuted }}
        tw="absolute top-15 right-[43.5px] w-[35px] h-0.5"
      />
      <div
        style={{ backgroundColor: OG_PALETTE.borderMuted }}
        tw="absolute right-15 top-[43.5px] h-[35px] w-0.5"
      />

      <div
        style={{ backgroundColor: OG_PALETTE.borderMuted }}
        tw="absolute bottom-15 right-[43.5px] w-[35px] h-0.5"
      />
      <div
        style={{ backgroundColor: OG_PALETTE.borderMuted }}
        tw="absolute right-15 bottom-[43.5px] h-[35px] w-0.5"
      />

      <div
        style={{
          backgroundSize: "100px 100px",
        }}
        tw="flex flex-col w-full h-full items-start justify-between p-26"
      >
        <OgBrand />

        <div
          style={{ gap: 40 }}
          tw="flex flex-row w-full justify-between items-end"
        >
          <div tw="flex flex-col">
            <p
              style={{ fontFamily: OG_FONT_FAMILY }}
              tw="text-white text-6xl font-medium mb-0"
            >
              {title}
            </p>
            {description ? (
              <p
                style={{ fontFamily: OG_FONT_FAMILY }}
                tw="text-white/60 text-2xl mt-6 -mb-2 max-w-xl"
              >
                {description}
              </p>
            ) : null}
          </div>

          <div tw="flex ml-6">
            <p
              style={{ fontFamily: OG_FONT_FAMILY }}
              tw="text-white/80 text-xl -mb-2"
            >
              {new URL(SITE_URL).host}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
