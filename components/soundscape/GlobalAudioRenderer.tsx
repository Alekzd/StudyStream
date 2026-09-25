"use client";

import { useEffect, useState } from "react";
import { soundscape } from "@/lib/soundscape";

/**
 * GlobalAudioRenderer:
 * Seamless, non-interrupting background audio player.
 * Plays YouTube video streams on continuous loop across page and room transitions.
 */
export function GlobalAudioRenderer() {
  const [youtubeVideoId, setYoutubeVideoId] = useState<string | null>(null);
  const [isMuted, setIsMuted] = useState(false);

  useEffect(() => {
    const sync = () => {
      setYoutubeVideoId(soundscape.getYoutubeVideoId());
      setIsMuted(soundscape.getIsMuted());
    };
    sync();
    return soundscape.subscribe(sync);
  }, []);

  if (!youtubeVideoId || isMuted) return null;

  return (
    <div
      className="fixed pointer-events-none opacity-0 -top-[9999px] -left-[9999px] w-px h-px overflow-hidden"
      aria-hidden="true"
    >
      <iframe
        key={youtubeVideoId}
        src={`https://www.youtube-nocookie.com/embed/${youtubeVideoId}?autoplay=1&loop=1&playlist=${youtubeVideoId}&enablejsapi=1&controls=0`}
        title="StudyStream Background Ambient Audio"
        allow="autoplay; encrypted-media"
        className="w-px h-px"
      />
    </div>
  );
}
