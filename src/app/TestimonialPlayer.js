'use client';

import { useRef, useState } from 'react';

/**
 * The featured testimonial phone. Starts paused on a poster frame; clicking
 * anywhere on the card plays it with sound (a user gesture, so the browser's
 * autoplay-with-audio restriction doesn't block it) and hides the play icon
 * while it's running.
 */
export default function TestimonialPlayer() {
  const videoRef = useRef(null);
  const [playing, setPlaying] = useState(false);

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
    <div className={`feat-reel${playing ? ' is-playing' : ''}`} data-cursor="play" onClick={toggle}>
      <div className="feat-phone">
        <div className="feat-notch"></div>
        <div className="feat-screen t-grad-a">
          <video
            ref={videoRef}
            className="feat-video"
            src="/videos/testimonial.mp4"
            poster="/videos/posters/testimonial.jpg"
            loop
            playsInline
            preload="metadata"
            onPlay={() => setPlaying(true)}
            onPause={() => setPlaying(false)}
          />
          <div className="feat-prog"><span className="on"></span><span className="partial"></span><span></span><span></span></div>
          <div className="feat-status"><span>09:41</span><span>● LIVE</span></div>
          <div className="feat-tag">FEATURED</div>
          <div className="feat-time">0:42</div>
          <div className="feat-play"><span className="tri"></span></div>
          <div className="feat-rail">
            <div className="b">♥<span className="c">218K</span></div>
            <div className="b">💬<span className="c">3.4K</span></div>
            <div className="b">↗<span className="c">SHARE</span></div>
          </div>
          <div className="feat-cap">
            <span className="handle">@mistermobility</span>
            <span>Hook · body · payoff in één take — zo bouw je 280K views</span>
          </div>
        </div>
      </div>
    </div>
  );
}
