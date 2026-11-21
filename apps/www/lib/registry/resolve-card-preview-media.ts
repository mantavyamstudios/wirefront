import type { ComponentGalleryCardPreview } from "@/lib/registry/types";

export interface ResolvedCardPreviewMedia {
  poster?: string;
  videoMp4?: string;
  videoWebm?: string;
}

let preferredVideoFormat: "webm" | "mp4" | null = null;

export const resolveCardPreviewMedia = (
  cardPreview?: ComponentGalleryCardPreview
): ResolvedCardPreviewMedia | null => {
  const { poster, videoMp4, videoWebm } = cardPreview ?? {};
  return (poster ?? videoMp4 ?? videoWebm)
    ? { poster, videoMp4, videoWebm }
    : null;
};

export const getPreferredCardPreviewVideoSrc = (
  media: ResolvedCardPreviewMedia
): string | null => {
  if (!(media.videoWebm ?? media.videoMp4)) {
    return null;
  }

  if (typeof window === "undefined") {
    return media.videoMp4 ?? media.videoWebm ?? null;
  }

  if (!preferredVideoFormat) {
    const probe = document.createElement("video");
    const supportsWebm = Boolean(
      probe.canPlayType('video/webm; codecs="vp9,opus"')
    );
    preferredVideoFormat = supportsWebm ? "webm" : "mp4";
  }

  if (preferredVideoFormat === "webm" && media.videoWebm) {
    return media.videoWebm;
  }

  return media.videoMp4 ?? media.videoWebm ?? null;
};

const warmedVideoUrls = new Set<string>();

export const warmCardPreviewVideo = (url: string) => {
  if (typeof window === "undefined" || warmedVideoUrls.has(url)) {
    return;
  }

  warmedVideoUrls.add(url);

  const video = document.createElement("video");
  video.preload = "auto";
  video.muted = true;
  video.playsInline = true;
  video.src = url;
  video.load();
};
