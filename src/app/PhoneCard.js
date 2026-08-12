'use client';

import { useEffect, useRef, useState } from 'react';

/**
 * One card in the reel-03 phone rack. Starts paused on a poster frame;
 * clicking the card plays it with sound and hides the play icon while it runs
 * (same click-to-play model as TestimonialPlayer).
 */
export default function PhoneCard({
  idx, videoSrc, poster, thumbClass, who, progressWidth, title, sub,
  icon, platformTitle, tagMono,
}) {
  const videoRef = useRef(null);
  const [playing, setPlaying] = useState(false);

  // The global cursor tracker (PageEffects) only re-checks data-cursor on
  // mouseover (element enter), not on click — so without this, clicking to
  // play without the mouse leaving/re-entering leaves the "play" cursor
  // bubble stuck on screen over an already-playing video.
  useEffect(() => {
    if (!playing) return;
    document.getElementById('cursor')?.classList.remove('play', 'link');
  }, [playing]);

  // Auto-pause once swiped/scrolled out of view — the rack scrolls
  // horizontally on mobile, so without this a video keeps playing (with
  // sound) off-screen after the user swipes to the next card.
  useEffect(() => {
    const v = videoRef.current;
    if (!v || !('IntersectionObserver' in window)) return;
    const io = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting && !v.paused) v.pause();
    }, { threshold: 0.2 });
    io.observe(v);
    return () => io.disconnect();
  }, []);

  function toggle() {
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) {
      v.muted = false;
      v.play().catch(() => {});
    } else {
      v.pause();
    }
  }

  return (
    <article className={`phone${playing ? ' is-playing' : ''}`} data-cursor={playing ? undefined : 'play'} onClick={toggle}>
      <div className="phone-idx">{idx}</div>
      <div className="phone-frame">
        <div className="phone-notch"></div>
        <div className="phone-screen">
          <div className={`thumb ${thumbClass}`}>
            <video
              ref={videoRef}
              src={videoSrc}
              poster={poster}
              loop
              playsInline
              preload="metadata"
              onPlay={() => setPlaying(true)}
              onPause={() => setPlaying(false)}
            />
          </div>
          <div className="scrim"></div>
          <div className="phone-ui top">
            <span className="who">{who}</span>
            <span className="dots">···</span>
          </div>
          <div className="play"></div>
          <div className="phone-progress"><span style={{ width: progressWidth }}></span></div>
          <div className="phone-ui bottom">
            <div className="cap">
              <div className="ttl">{title}</div>
              <div className="sub">{sub}</div>
            </div>
            <div className="rail-actions">
              <span className="ico">♥</span>
              <span className="ico">↗</span>
            </div>
          </div>
        </div>
      </div>
      <div className="phone-meta">
        <span className="platform" title={platformTitle}>{icon}</span>
        <span className="tag-mono">{tagMono}</span>
      </div>
    </article>
  );
}
