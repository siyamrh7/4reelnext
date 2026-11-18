import PageEffects from './PageEffects';
import BookingWidget from './BookingWidget';
import TestimonialPlayer from './TestimonialPlayer';
import PhoneCard from './PhoneCard';

const HERO_TILES = [
  { cls: 't1', label: 'CAM 01 · 24FPS' },
  { cls: 't2', label: 'CAM 02 · 60FPS' },
  { cls: 't3', label: 'CAM 03 · 120FPS' },
  { cls: 't4', label: 'VFX SLATE' },
  { cls: 't5', label: 'CAM 05 · 24FPS' },
  { cls: 't6', label: 'CAM 06 · 30FPS' },
  { cls: 't7', label: 'PROXY 4K' },
  { cls: 't8', label: 'CAM 08 · 24FPS' },
  { cls: 't9', label: 'CAM 09 · 24FPS' },
  { cls: 't1', label: 'CAM 10 · 24FPS' },
  { cls: 't2', label: 'CAM 11 · 60FPS' },
  { cls: 't6', label: 'CAM 12 · 30FPS' },
  { cls: 't3', label: 'CAM 13 · 24FPS' },
  { cls: 't9', label: 'CAM 14 · 24FPS' },
  { cls: 't5', label: 'CAM 15 · 24FPS' },
  { cls: 't7', label: 'PROXY 4K' },
  { cls: 't8', label: 'CAM 17 · 24FPS' },
  { cls: 't1', label: 'CAM 18 · 24FPS' },
];

// 12 unique client logos, each repeated 2x for a seamless marquee loop — the
// second half (aria-hidden) is what makes the scroll wrap invisibly. Each
// logo needs its own CSS class (globals.css .lw-slot img.lw-*) that caps
// max-height/max-width — without it, an image renders at its native
// intrinsic size, which for these source files ranges from tiny SVGs to a
// huge multi-thousand-pixel-wide PNG, blowing out the whole marquee row.
const LOGO_BRANDS = [
  { file: 'logo-01.png', alt: 'Moise', cls: 'lw-moise' },
  { file: 'logo-02.webp', alt: 'Fit Preps', cls: 'lw-fitpreps' },
  { file: 'logo-03.svg', alt: 'Kalea', cls: 'lw-kalea' },
  { file: 'logo-04.webp', alt: 'Label A Team', cls: 'lw-labelateam' },
  { file: 'logo-05.svg', alt: 'Reform Pilates', cls: 'lw-reform' },
  { file: 'logo-06.png', alt: 'NoordCode', cls: 'lw-noord' },
  { file: 'logo-07.svg', alt: 'Bergman Clinics', cls: 'lw-bergman' },
  { file: 'logo-08.svg', alt: 'Bear Baby Boutique', cls: 'lw-bear' },
  { file: 'logo-09.png', alt: 'Kas Douma Dakdekkers', cls: 'lw-douma' },
  { file: 'logo-10.png', alt: 'Mister Mobility', cls: 'lw-mrmobility' },
  { file: 'logo-11.svg', alt: 'Den Engelsen Exclusive', cls: 'lw-denengelsen' },
  { file: 'logo-12.svg', alt: 'Transhair', cls: 'lw-transhair' },
];
// Second copy must be exactly half the track (aria-hidden at i >= LOGO_BRANDS.length).
const LOGO_FILES = [...LOGO_BRANDS, ...LOGO_BRANDS];

export default function Page() {
  return (
    <>
      <PageEffects />

      {/* Persistent chrome */}
      <div className="grain"></div>
      <div className="scanlines"></div>
      <div className="vignette"></div>

      <a className="wordmark" href="#reel-01" data-cursor="link">
        <span className="dot"></span>
        <span className="text">4REEL.AGENCY</span>
      </a>

      <div className="timecode">
        <span className="label">REC</span>
        <span className="val" id="timecode">00:00:00:00</span>
      </div>

      <div className="rec">
        <span className="blink"></span>
        <span>REC ●</span>
      </div>

      <a className="scroll-hint" href="#reel-02" data-cursor="link" style={{ textDecoration: 'none', color: 'inherit' }}>
        <span>SCROLL</span>
        <span className="bar"></span>
        <span id="reel-num">01/04</span>
      </a>

      <nav className="rail collapsed" aria-label="reels">
        <a href="#reel-01" className="item active" data-reel="1"><span className="tick"></span><span className="label">R 01 — OPENING</span></a>
        <a href="#reel-02" className="item" data-reel="2"><span className="tick"></span><span className="label">R 02 — WERK</span></a>
        <a href="#reel-03" className="item" data-reel="3"><span className="tick"></span><span className="label">R 03 — CASES</span></a>
        <a href="#reel-04" className="item" data-reel="4"><span className="tick"></span><span className="label">R 04 — SLOT</span></a>
      </nav>

      <div className="cursor" id="cursor"></div>

      {/* ============== REEL 01 ============== */}
      <section className="reel hero" id="reel-01" data-reel="1" data-screen-label="01 Hook">
        <div className="hero-bg" aria-hidden="true">
          {HERO_TILES.map((t, i) => (
            <div className={`tile ${t.cls}`} key={i}>
              <span className="crop"></span><span className="crop br"></span><span className="scrub">{t.label}</span>
            </div>
          ))}
        </div>

        <span className="crosshair ch-tl"></span>
        <span className="crosshair ch-tr"></span>
        <span className="crosshair ch-bl"></span>
        <span className="crosshair ch-br"></span>

        <div className="hero-inner">
          <div className="h-eyebrow">
            <span className="pill"><span className="d"></span> NOW RECORDING / VOL.04</span>
            <span>SHORT-FORM CONTENT AGENCY · AMERSFOORT · EST. 2025</span>
          </div>

          <h1 className="mega-logo" id="mega" aria-label="4REEL Agency">
            <span className="logo-stack">
              <span className="card-stack" aria-hidden="true">
                <span data-label="FRAME 02 — TAKE 04"></span>
                <span data-label="FRAME 01 — TAKE 12"></span>
                <span data-label="FRAME 03 — SELECTED"></span>
              </span>
              <span className="vf tl" aria-hidden="true"></span>
              <span className="vf tr" aria-hidden="true"></span>
              <span className="vf bl" aria-hidden="true"></span>
              <span className="vf br" aria-hidden="true"></span>

              <img className="logo-img main" src="/images/mega-logo.png" alt="4REEL" />
            </span>
            <span className="logo-studio"><span className="acc">●</span> AGENCY <span className="tick"></span> EST. <span className="est">2025</span></span>
          </h1>

          <p className="tag" data-fade>Short form content, <em>frame voor frame</em> gebouwd om te scoren.</p>
        </div>

        <div className="hero-foot">
          <div className="c"><span className="led"></span> ROL A · TAKE 04 · ISO 800</div>
          <div className="c center">— SCROLL NAAR REEL 02 —</div>
          <div className="c right">52.1561° N · 5.3878° O · AMERSFOORT</div>
        </div>
      </section>

      {/* ============== REEL 02 ============== */}
      <section className="reel" id="reel-02" data-reel="2" data-screen-label="02 What We Shoot">
        <div className="reel-slate">
          <span className="num">REEL 02 / 04</span>
          <span className="title">— Wat we maken &amp; wat het kost —</span>
          <span className="meta">4 SERVICES · 3 PAKKETTEN</span>
        </div>

        <div className="services">
          <div className="marquee row-a"><div className="track" data-marquee="-1">
            <span className="item">ORGANIC CONTENT <span className="star">✦</span></span>
            <span className="item outline">ADS CONTENT <span className="star">✦</span></span>
            <span className="item">AI EDITS <span className="star">✦</span></span>
            <span className="item outline">MOTION GRAPHICS <span className="star">✦</span></span>
            <span className="item">ANIMATED MOTION <span className="star">✦</span></span>
            <span className="item outline">ORGANIC CONTENT <span className="star">✦</span></span>
            <span className="item">ADS CONTENT <span className="star">✦</span></span>
            <span className="item outline">AI EDITS <span className="star">✦</span></span>
            <span className="item">MOTION GRAPHICS <span className="star">✦</span></span>
            <span className="item outline">ANIMATED MOTION <span className="star">✦</span></span>
          </div></div>
          <div className="marquee row-b"><div className="track" data-marquee="1">
            <span className="item">SCROLL · STOP <span className="star">●</span></span>
            <span className="item outline">FRAME · BY · FRAME <span className="star">●</span></span>
            <span className="item">CUT · SHARP <span className="star">●</span></span>
            <span className="item outline">REEL · IT · IN <span className="star">●</span></span>
            <span className="item">SCROLL · STOP <span className="star">●</span></span>
            <span className="item outline">FRAME · BY · FRAME <span className="star">●</span></span>
            <span className="item">CUT · SHARP <span className="star">●</span></span>
            <span className="item outline">REEL · IT · IN <span className="star">●</span></span>
          </div></div>
          <div className="marquee row-c"><div className="track" data-marquee="-1">
            <span className="item outline">TIKTOK <span className="star">✦</span></span>
            <span className="item">REELS <span className="star">✦</span></span>
            <span className="item outline">SHORTS <span className="star">✦</span></span>
            <span className="item">DELIVERED ✦</span>
            <span className="item outline">DOOH <span className="star">✦</span></span>
            <span className="item">SCRIPTED ✦</span>
            <span className="item outline">TIKTOK <span className="star">✦</span></span>
            <span className="item">REELS <span className="star">✦</span></span>
            <span className="item outline">SHORTS <span className="star">✦</span></span>
            <span className="item">AD ✦</span>
          </div></div>

          <div className="svc-grid">
            <a className="svc" href="#plan" data-cursor="link">
              <div>
                <div className="idx">SVC / 001 →</div>
                <h3>Organic content</h3>
                <p>Voor merken die elke dag gezien willen worden, zonder dat het als reclame aanvoelt.</p>
              </div>
              <div className="meta"><span>9:16 · 16:9 · TIKTOK · REELS</span></div>
              <div className="ico"><svg viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M6 6h20v20H6z"/><path d="M13 11l8 5-8 5z" fill="currentColor" stroke="none"/></svg></div>
            </a>
            <a className="svc" href="#plan" data-cursor="link">
              <div>
                <div className="idx">SVC / 002 →</div>
                <h3>Ads content</h3>
                <p>Performance creative die tikt. Hooks getest, varianten gedraaid, CTA&apos;s geslepen. Gebouwd op Meta, TikTok en YouTube — gemeten in CTR, CPA en ROAS.</p>
              </div>
              <div className="meta"><span>META · TIKTOK · YOUTUBE ·</span></div>
              <div className="ico"><svg viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M4 22l8-12 6 8 4-5 6 9z"/><circle cx="22" cy="9" r="2" fill="currentColor" stroke="none"/></svg></div>
            </a>
            <a className="svc" href="#plan" data-cursor="link">
              <div>
                <div className="idx">SVC / 003 →</div>
                <h3>AI Edits</h3>
                <p>Visuals die je niet verwacht voor dit budget. AI maakt effecten mogelijk die vroeger alleen voor grote producties waren weggelegd, wij zetten ze in voor jouw content</p>
              </div>
              <div className="meta"><span>RUNWAY · KLING · LUMA ·</span></div>
              <div className="ico"><svg viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M8 8h16v16H8z"/><path d="M12 14h8M12 18h5"/><circle cx="22" cy="18" r="1.5" fill="currentColor"/></svg></div>
            </a>
            <a className="svc" href="#plan" data-cursor="link">
              <div>
                <div className="idx">SVC / 004 →</div>
                <h3>Animated motion</h3>
                <p>Typografie die leeft, logo&apos;s bewegen. Kinetische identiteiten, infographics en  end cards die je tot het laatste moment laten kijken.</p>
              </div>
              <div className="meta"><span>AFTER EFFECTS · PREMIERE PRO</span></div>
              <div className="ico"><svg viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="16" cy="16" r="10"/><path d="M6 16h20M16 6v20"/></svg></div>
            </a>
          </div>

          {/* ============== PAKKETTEN ============== */}
          <div id="pricing"></div>
          <div className="pricing-head">
            <div className="num">PAKKETTEN / 03</div>
            <h3>Drie cuts. <span className="stroke">Eén</span> doel: <span className="acc">groei.</span></h3>
            <div className="meta">PRIJZEN EXCL. BTW · MAANDELIJKS ·</div>
          </div>

          <div className="pricing-grid">
            <div className="pkg">
              <div className="pkg-top">
                <span className="pkg-tag">PKG / 01</span>
                <span className="pkg-tag right">STARTER</span>
              </div>
              <h4 className="pkg-name">Starter</h4>
              <div className="pkg-sub">Merken die serieus starten met content.</div>
              <div className="pkg-price"><span className="from">vanaf</span><span className="amt">€1.495</span><span className="per">/mnd</span></div>
              <ul className="pkg-list">
                <li><span className="b">4</span> static posts</li>
                <li>4 video&apos;s — 30 sec - 60 sec</li>
                <li><span className="b">4</span> stories</li>
                <li>Social media management <span className="d">— posting</span></li>
                <li>Content strategie <span className="d">— per kwartaal</span></li>
              </ul>
              <a className="pkg-cta" href="#plan">Plan een gesprek <span className="arrow">→</span></a>
            </div>

            <div className="pkg featured">
              <div className="pkg-top">
                <span className="pkg-tag">PKG / 02</span>
                <span className="pkg-tag right accent">MEEST GEKOZEN</span>
              </div>
              <h4 className="pkg-name">Grow</h4>
              <div className="pkg-sub">Voor merken die serieus willen schalen.</div>
              <div className="pkg-price"><span className="from">vanaf</span><span className="amt">€2495</span><span className="per">/mnd</span></div>
              <ul className="pkg-list">
                <li><span className="b">8</span> static posts</li>
                <li><span className="b">8</span> video&apos;s <span className="d">— 45–60 sec</span></li>
                <li><span className="b">8</span> stories</li>
                <li>Social media management <span className="d">— posting</span></li>
                <li>Content strategie <span className="d">— per kwartaal</span></li>
                <li></li>
              </ul>
              <a className="pkg-cta" href="#plan">Plan een gesprek <span className="arrow">→</span></a>
            </div>

            <div className="pkg">
              <div className="pkg-top">
                <span className="pkg-tag">PKG / 03</span>
                <span className="pkg-tag right">CUSTOM</span>
              </div>
              <h4 className="pkg-name">CUSTOM</h4>
              <div className="pkg-sub">Voor merken die maximaal willen gaan.</div>
              <div className="pkg-price"><span className="from">vanaf</span><span className="amt" style={{ fontSize: '26px' }}>Op maat</span><span className="per">/scope</span></div>
              <ul className="pkg-list">
                <li>Eigen volume <span className="d">— statics, video&apos;s, stories</span></li>
                <li>Ads + organic mix</li>
                <li>AI-edits &amp; motion on demand</li>
                <li>Custom boost budget</li>
                <li></li>
                <li></li>
              </ul>
              <a className="pkg-cta" href="#plan">Plan een gesprek <span className="arrow">→</span></a>
            </div>
          </div>
        </div>
      </section>

      {/* ============== LOGO WALL ============== */}
      <section className="logo-wall" data-screen-label="Logo wall" aria-label="Vertrouwd door">
        <div className="lw-head">
          <span className="lw-eyebrow">[ VERTROUWD DOOR ]</span>
          <span className="lw-meta">12+ MERKEN · NL &amp; BE</span>
        </div>
        <div className="lw-marquee">
          <div className="lw-track" data-lw="-1">
            {LOGO_FILES.map((logo, i) => (
              <span className="lw-slot" aria-hidden={i >= LOGO_BRANDS.length ? true : undefined} key={i}>
                <img src={`/logos/${logo.file}`} alt={i >= LOGO_BRANDS.length ? '' : logo.alt} className={logo.cls} />
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ============== TESTIMONIAL VIDEO ============== */}
      <section className="testi" data-screen-label="Testimonials" aria-label="Klanten aan het woord">
        <div className="reel-slate">
          <span className="num">B-ROLL / 02.5</span>
          <span className="title">— Testimonial —</span>
          <span className="meta">SOUND ON · 0:42</span>
        </div>

        <div className="feat-wrap">
          <TestimonialPlayer />

          <aside className="feat-side">
            <div className="feat-meta">
              <span>CASE / 01</span>
              <span className="acc">MISTER MOBILITY</span>
            </div>
            <blockquote className="feat-quote">“In drie maanden van onzichtbaar naar <em>280K</em> views. Geen geluk — strategie, hooks, en een team dat <em>begrijpt</em> hoe TikTok werkt.”</blockquote>
            <div className="feat-author">
              <span className="n">Jeroen Meerman</span>
              <span className="r">Head of Brand · MISTER MOBILITY</span>
            </div>
            <div className="feat-stats">
              <div><span className="k">VIEWS / 90D</span><span className="v">280<span className="acc">K</span></span></div>
              <div><span className="k">CTR</span><span className="v">+<span className="acc">48%</span></span></div>
              <div><span className="k">CPA</span><span className="v">−<span className="acc">18%</span></span></div>
            </div>
          </aside>
        </div>
      </section>

      {/* ============== REEL 03 ============== */}
      <section className="reel roster" id="reel-03" data-reel="3" data-screen-label="03 Roster">
        <div className="reel-slate">
          <span className="num">REEL 03 / 04</span>
          <span className="title">— De selectie —</span>
          <span className="meta">42 FILMS · 12 MERKEN</span>
        </div>

        <div className="roster-head">
          <h2 style={{ fontSize: '90px' }}>Wij maken <span className="stroke">geen content.</span><br/>Wij maken <span style={{ color: 'var(--accent)' }}>momentum.</span></h2>
          <div className="right">
            <span>FILTER · ALLES</span>
            <span>SORTERING · TRENDING ↗</span>
            <span>WEERGAVE · 4 REELS</span>
          </div>
        </div>

        <div className="phone-rack" id="bento">
          <PhoneCard
            idx="R / 01"
            videoSrc="/videos/branding-video.mp4"
            poster="/videos/posters/branding-video.jpg"
            thumbClass="g-a"
            who="@reformweesp"
            progressWidth="42%"
            title={'"DIT IS RE:FORM WEESP"'}
            sub="RE:FORM WEESP - ORGANIC"
            platformTitle="TikTok"
            icon={<svg viewBox="0 0 24 24" fill="currentColor"><path d="M16 3v3.2a4.8 4.8 0 0 0 4.8 4.8V14a8 8 0 0 1-4.8-1.6V17a5 5 0 1 1-5-5h.6v3.4a1.6 1.6 0 1 0 1.6 1.6V3z"/></svg>}
            tagMono="VIRAL · 0:32 · 9:16"
          />

          <PhoneCard
            idx="R / 02"
            videoSrc="/videos/meta-ad.mp4"
            poster="/videos/posters/meta-ad.jpg"
            thumbClass="g-c"
            who="@laqlour"
            progressWidth="18%"
            title={'"LAQLOUR FEMME AD"'}
            sub="LAQLOUR - META AD"
            platformTitle="Instagram"
            icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><rect x="3" y="3" width="18" height="18" rx="4"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="1" fill="currentColor"/></svg>}
            tagMono="FILM · 0:30 · 9:16"
          />

          <PhoneCard
            idx="R / 03"
            videoSrc="/videos/organische-content.mp4"
            poster="/videos/posters/organische-content.jpg"
            thumbClass="g-e"
            who="@mistermobility"
            progressWidth="71%"
            title={'"BMW M5 TOURING KLEUREN"'}
            sub="MISTER MOBILITY - ORGANIC"
            platformTitle="TikTok"
            icon={<svg viewBox="0 0 24 24" fill="currentColor"><path d="M16 3v3.2a4.8 4.8 0 0 0 4.8 4.8V14a8 8 0 0 1-4.8-1.6V17a5 5 0 1 1-5-5h.6v3.4a1.6 1.6 0 1 0 1.6 1.6V3z"/></svg>}
            tagMono="AI EDIT · 0:18 · 9:16"
          />

          <PhoneCard
            idx="R / 04"
            videoSrc="/videos/personal-branding.mp4"
            poster="/videos/posters/personal-branding.jpg"
            thumbClass="g-b"
            who="@eduarddewilde"
            progressWidth="88%"
            title={'"90-MIN COFFEE RULE"'}
            sub="EDUARD DE WILDE - PERSONAL BRANDING"
            platformTitle="YouTube"
            icon={<svg viewBox="0 0 24 24" fill="currentColor"><path d="M21.6 7.2a3 3 0 0 0-2.1-2.1C17.6 4.6 12 4.6 12 4.6s-5.6 0-7.5.5A3 3 0 0 0 2.4 7.2 31 31 0 0 0 2 12a31 31 0 0 0 .4 4.8 3 3 0 0 0 2.1 2.1c1.9.5 7.5.5 7.5.5s5.6 0 7.5-.5a3 3 0 0 0 2.1-2.1 31 31 0 0 0 .4-4.8 31 31 0 0 0-.4-4.8zM10 15.4V8.6L15.6 12z"/></svg>}
            tagMono="SOCIAL · 0:24 · 9:16"
          />
        </div>
      </section>

      {/* ============== REEL 04 ============== */}
      <section className="reel credits" id="reel-04" data-reel="4" data-screen-label="04 Credits">
        <div className="reel-slate">
          <span className="num">REEL 04 / 04</span>
          <span className="title">— Aftiteling —</span>
          <span className="meta">FADE NAAR ZWART</span>
        </div>

        <div className="credits-stage">
          <div className="crawl" id="crawl">
            <div className="big">EEN PRODUCTIE VAN <span className="acc">4REEL</span></div>

            <div>
              <h4>— REGIE —</h4>
              <div className="row"><span className="l">OPRICHTER &amp; CREATIVE DIRECTOR</span><span className="dot"></span><span className="r">Paolo van Oudenallen</span></div>
              <div className="row"><span className="l">EDITOR</span><span className="dot"></span><span className="r">Matthew van Senten</span></div>
              <div className="row"><span className="l">OPERATIONAL &amp; STRATEGY</span><span className="dot"></span><span className="r">Ray Drisdale</span></div>
              <div className="row"><span className="l">SALES &amp; FINANCE</span><span className="dot"></span><span className="r">Boy Hardenberg</span></div>
              <div className="row"><span className="l">PROJECT MANAGER</span><span className="dot"></span><span className="r">Rick Brouwer</span></div>
            </div>

            <div>
              <h4>— HET PROCES —</h4>
              <div className="row"><span className="l">AKTE I · BRIEF</span><span className="dot"></span><span className="r">Jij vertelt wat je wilt. Wij komen terug met ideeën die werken.</span></div>
              <div className="row"><span className="l">AKTE II · OPNAME</span><span className="dot"></span><span className="r">Op locatie of volledig remote, we regelen de productie van begin tot eind.</span></div>
              <div className="row"><span className="l">AKTE III · MONTAGE</span><span className="dot"></span><span className="r">Wij editen, jij keurt goed. Zo vaak als nodig, tot de content naar wens is.</span></div>
              <div className="row"><span className="l">SLOT</span><span className="dot"></span><span className="r">Live. En we meten wat het doet.</span></div>
            </div>

            <div>
              <h4>— LOCATIES —</h4>
              <div className="row"><span className="l">HOOFDKWARTIER</span><span className="dot"></span><span className="r">Argonweg 11A, 3812 RB Amersfoort</span></div>
            </div>

            <div className="big">JOUW MERK ONZE KENNIS</div>
          </div>
        </div>
      </section>

      <div className="cta-wrap">
        <div className="cta-eyebrow">— EINDE —  DRUK OP PLAY VOOR DE JOUWE  —</div>
        <h2 className="cta-headline"><span>Jouw merk.</span><span className="stroke">STRAK GEPOSITIONEERD</span><span className="acc">Online.</span></h2>
        <a className="magnet" href="#plan" id="magnet" data-cursor="link">
          <span className="btn">START JOUW REEL <span className="arrow">→</span></span>
        </a>
        <div style={{ marginTop: '18px', fontFamily: "'IBM Plex Mono',monospace", fontSize: '11px', letterSpacing: '.22em', textTransform: 'uppercase', opacity: .6 }}>
          of <a href="#plan" style={{ color: 'var(--accent)', textDecoration: 'none', borderBottom: '1px solid var(--accent)', paddingBottom: '2px' }}>STEL JE VRAAG DIRECT →</a>
        </div>
      </div>

      {/* ============== PLAN + CONTACT ============== */}
      <section className="plan" id="plan" data-screen-label="Plan een gesprek" aria-label="Plan een gesprek of stel een vraag">
        <div className="plan-inner">
          <div className="plan-head">
            <span className="num">REEL 04.5 / CONTACT</span>
            <span className="title">— Twee manieren om één gesprek te starten —</span>
            <span className="meta"><span className="dot"></span> ANTWOORD &lt; 24U</span>
          </div>

          <BookingWidget />
        </div>
      </section>

      <div className="contact-grid">
        <div>
          <span className="lbl">AGENCY</span>
          <span className="val">Amersfoort · NL</span>
        </div>
        <a href="https://instagram.com/4reel.nl" target="_blank" rel="noopener">
          <span className="lbl">Volg ons</span>
          <span className="val">@4REEL.NL</span>
        </a>
      </div>

      <div className="footer">
        <div>©2025 4REEL AGENCY · ALLE RECHTEN VOORBEHOUDEN</div>
        <div className="center">PROD. NR. 4R-V04 · MASTER 23.976FPS · DCP</div>
        <div className="right">EINDE VAN DE REEL</div>
      </div>
    </>
  );
}
