// SPDX-License-Identifier: AGPL-3.0-only
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
// Includes MIT-licensed code © 2026 Sean Brydon (devl.dev) · see https://github.com/mantavyamstudios/wirefront/blob/main/NOTICE.md
// Showcase only: a sample library in devl.dev's frame. There is no audio here; a timer stands in
// for the media element and moves the position while "playing". Not shipped by the registry.
import { useEffect, useState } from "react";
import { DevlFrame } from "../_devl-frame";
import * as fixtures from "./fixtures";
import { MusicPlayer } from "./view";

export function PersonalMusicPlayerShowcasePage() {
  const [trackId, setTrackId] = useState(fixtures.listTracks[0]?.id ?? "");
  const [position, setPosition] = useState(fixtures.startPosition);
  const [playing, setPlaying] = useState(true);
  const duration = fixtures.listTracks.find((t) => t.id === trackId)?.duration ?? 0;

  useEffect(() => {
    if (!playing) return;
    const id = setInterval(() => setPosition((p) => Math.min(duration, p + 0.25)), 250);
    return () => clearInterval(id);
  }, [playing, duration]);

  return (
    <DevlFrame>
      <MusicPlayer
        appName={fixtures.appName}
        likedIds={fixtures.listLikedTracks}
        links={fixtures.links}
        onPlayingChange={setPlaying}
        onSeek={setPosition}
        onToggleLike={async () => {}}
        onTrackChange={(id) => {
          setTrackId(id);
          setPosition(0);
        }}
        playing={playing}
        playlists={fixtures.listPlaylists}
        position={position}
        tracks={fixtures.listTracks}
      />
    </DevlFrame>
  );
}
