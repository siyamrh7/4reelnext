'use client';

import { useEffect } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

/**
 * All the vanilla-JS behavior from the original static site — custom cursor,
 * timecode, marquees, parallax, credits crawl, magnetic CTA — ported into a
 * single effect. Renders nothing itself; it just wires up DOM nodes rendered
 * by page.js.
 *
 * Everything is torn down on cleanup (event listeners removed, rAF loops
 * cancelled, gsap.context().revert() kills every tween/ScrollTrigger) so
 * React StrictMode's dev-mode double-invoke doesn't leave duplicate
 * listeners/triggers behind.
 */
export default function PageEffects() {
  useEffect(() => {
    const cleanups = [];

    // ---------- Rail: show only near top of page ----------
    const rail = document.querySelector('.rail');
    if (rail) {
      const updateRail = () => {
        const hide = window.scrollY > 120;
        rail.style.opacity = hide ? '0' : '';
        rail.style.transform = hide ? 'translateY(-50%) translateX(-12px)' : 'translateY(-50%)';
        rail.style.pointerEvents = hide ? 'none' : '';
      };
      updateRail();
      window.addEventListener('scroll', updateRail, { passive: true });
      cleanups.push(() => window.removeEventListener('scroll', updateRail));
    }

    // ---------- Cursor ----------
    const cursor = document.getElementById('cursor');
    if (cursor) {
      let cx = window.innerWidth / 2, cy = window.innerHeight / 2, tx = cx, ty = cy;
      let cursorRaf;
      const onMouseMove = (e) => { tx = e.clientX; ty = e.clientY; };
      const tickCursor = () => {
        cx += (tx - cx) * 0.22; cy += (ty - cy) * 0.22;
        cursor.style.transform = `translate(${cx}px,${cy}px) translate(-50%,-50%)`;
        cursorRaf = requestAnimationFrame(tickCursor);
      };
      const onMouseOver = (e) => {
        const t = e.target.closest('[data-cursor]');
        cursor.classList.remove('play', 'link');
        if (!t) return;
        const v = t.getAttribute('data-cursor');
        if (v === 'play') cursor.classList.add('play');
        if (v === 'link') cursor.classList.add('link');
      };
      window.addEventListener('mousemove', onMouseMove);
      document.addEventListener('mouseover', onMouseOver);
      cursorRaf = requestAnimationFrame(tickCursor);
      cleanups.push(() => {
        window.removeEventListener('mousemove', onMouseMove);
        document.removeEventListener('mouseover', onMouseOver);
        cancelAnimationFrame(cursorRaf);
      });
    }

    // ---------- Timecode ----------
    const tc = document.getElementById('timecode');
    if (tc) {
      const start = performance.now();
      const pad = (n, l = 2) => String(n).padStart(l, '0');
      let timecodeRaf;
      const frameTick = () => {
        const t = (performance.now() - start) / 1000;
        const h = Math.floor(t / 3600);
        const m = Math.floor((t % 3600) / 60);
        const s = Math.floor(t % 60);
        const f = Math.floor((t % 1) * 24);
        tc.textContent = `${pad(h)}:${pad(m)}:${pad(s)}:${pad(f)}`;
        timecodeRaf = requestAnimationFrame(frameTick);
      };
      timecodeRaf = requestAnimationFrame(frameTick);
      cleanups.push(() => cancelAnimationFrame(timecodeRaf));
    }

    // ---------- Marquees (services section) ----------
    document.querySelectorAll('[data-marquee]').forEach((track) => {
      const dir = parseFloat(track.dataset.marquee) || 1;
      const original = track.innerHTML;
      track.innerHTML = original + original;
      let x = 0;
      const speed = 0.6 * dir;
      let raf;
      const loop = () => {
        x -= speed;
        const w = track.scrollWidth / 2;
        if (dir > 0 && x <= -w) x = 0;
        if (dir < 0 && x >= 0) x = -w;
        track.style.transform = `translate3d(${x}px,0,0)`;
        raf = requestAnimationFrame(loop);
      };
      raf = requestAnimationFrame(loop);
      cleanups.push(() => {
        cancelAnimationFrame(raf);
        track.innerHTML = original;
        track.style.transform = '';
      });
    });

    // ---------- Phone parallax tilt ----------
    document.querySelectorAll('.phone').forEach((card) => {
      const thumb = card.querySelector('.thumb');
      const screen = card.querySelector('.phone-frame');
      const onMove = (e) => {
        const r = card.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width - .5;
        const py = (e.clientY - r.top) / r.height - .5;
        screen.style.transform = `perspective(1100px) rotateX(${(-py * 7).toFixed(2)}deg) rotateY(${(px * 9).toFixed(2)}deg)`;
        if (thumb) thumb.style.transform = `scale(1.06) translate(${(-px * 10).toFixed(1)}px,${(-py * 10).toFixed(1)}px)`;
      };
      const onLeave = () => {
        screen.style.transform = '';
        if (thumb) thumb.style.transform = '';
      };
      card.addEventListener('mousemove', onMove);
      card.addEventListener('mouseleave', onLeave);
      cleanups.push(() => {
        card.removeEventListener('mousemove', onMove);
        card.removeEventListener('mouseleave', onLeave);
      });
    });

    // ---------- Logo wall marquee ----------
    document.querySelectorAll('[data-lw]').forEach((track) => {
      const dir = parseFloat(track.dataset.lw || '-1');
      const half = track.scrollWidth / 2;
      let x = 0, last = performance.now();
      let raf;
      const tick = (t) => {
        const dt = Math.min(60, t - last); last = t;
        x += dir * dt * 0.04;
        if (dir < 0 && x <= -half) x += half;
        if (dir > 0 && x >= 0) x -= half;
        track.style.transform = `translate3d(${x}px,0,0)`;
        raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);
      cleanups.push(() => cancelAnimationFrame(raf));
    });

    // ---------- Magnetic CTA ----------
    const magnet = document.getElementById('magnet');
    if (magnet) {
      const btn = magnet.querySelector('.btn');
      const onMove = (e) => {
        const r = magnet.getBoundingClientRect();
        const x = (e.clientX - r.left - r.width / 2);
        const y = (e.clientY - r.top - r.height / 2);
        magnet.style.transform = `translate(${x * .25}px, ${y * .35}px)`;
        if (btn) btn.style.transform = `translate(${x * .12}px, ${y * .18}px)`;
      };
      const onLeave = () => {
        magnet.style.transform = '';
        if (btn) btn.style.transform = '';
      };
      magnet.addEventListener('mousemove', onMove);
      magnet.addEventListener('mouseleave', onLeave);
      cleanups.push(() => {
        magnet.removeEventListener('mousemove', onMove);
        magnet.removeEventListener('mouseleave', onLeave);
      });
    }

    // ---------- Chromatic aberration jolt on scroll ----------
    {
      let lastY = 0, jolt = 0, decayRaf;
      const onScroll = () => {
        const dy = Math.abs(window.scrollY - lastY);
        lastY = window.scrollY;
        jolt = Math.min(jolt + dy * 0.05, 6);
      };
      const decay = () => {
        jolt *= 0.92;
        document.documentElement.style.setProperty('--jolt', jolt.toFixed(2) + 'px');
        decayRaf = requestAnimationFrame(decay);
      };
      window.addEventListener('scroll', onScroll);
      decayRaf = requestAnimationFrame(decay);
      cleanups.push(() => {
        window.removeEventListener('scroll', onScroll);
        cancelAnimationFrame(decayRaf);
        document.documentElement.style.removeProperty('--jolt');
      });
    }

    // ---------- Mobile credits-crawl reveal (IntersectionObserver) ----------
    const isMobile = window.matchMedia('(max-width: 640px)').matches;
    let io;
    if (isMobile) {
      const crawl = document.getElementById('crawl');
      if (crawl && 'IntersectionObserver' in window) {
        io = new IntersectionObserver((entries) => {
          entries.forEach((en) => {
            if (en.isIntersecting) {
              en.target.classList.add('visible');
              io.unobserve(en.target);
            }
          });
        }, { threshold: 0.15, rootMargin: '0px 0px -10% 0px' });
        Array.from(crawl.children).forEach((child) => io.observe(child));
        cleanups.push(() => io.disconnect());
      }
    }

    // ---------- GSAP (scoped — ctx.revert() tears down every tween/ScrollTrigger) ----------
    gsap.registerPlugin(ScrollTrigger);
    const ctx = gsap.context(() => {
      // Hero logo reveal
      gsap.to('.mega-logo', { opacity: 1, y: 0, duration: 1.2, ease: 'expo.out', delay: .2 });
      gsap.from('.mega-logo .logo-img.main', { scale: .92, duration: 1.4, ease: 'expo.out', delay: .2 });
      gsap.from('.mega-logo .card-stack span', { opacity: 0, y: 20, scale: .9, duration: 1.0, ease: 'expo.out', stagger: .08, delay: .4 });

      // Scroll: card stack fans out, main logo lifts forward (3D)
      gsap.to('.mega-logo .card-stack span:nth-child(1)', { rotate: -12, x: '-12%', y: '8%', scrollTrigger: { trigger: '#reel-01', start: 'top top', end: 'bottom top', scrub: .4 } });
      gsap.to('.mega-logo .card-stack span:nth-child(2)', { rotate: 9, x: '10%', y: '-4%', scrollTrigger: { trigger: '#reel-01', start: 'top top', end: 'bottom top', scrub: .4 } });
      gsap.to('.mega-logo .card-stack span:nth-child(3)', { rotate: -3, y: '-6%', scrollTrigger: { trigger: '#reel-01', start: 'top top', end: 'bottom top', scrub: .4 } });
      gsap.to('.mega-logo .logo-img.main', { scale: 1.08, scrollTrigger: { trigger: '#reel-01', start: 'top top', end: 'bottom top', scrub: .4 } });
      gsap.to('.mega-logo', { yPercent: -22, scrollTrigger: { trigger: '#reel-01', start: 'top top', end: 'bottom top', scrub: .4 } });

      // Hover: 3D tilt of the entire stack like flipping through a contact sheet
      const mega = document.getElementById('mega');
      if (mega) {
        const stack = mega.querySelector('.logo-stack');
        const onMegaMove = (e) => {
          const r = mega.getBoundingClientRect();
          const px = (e.clientX - r.left) / r.width - .5;
          const py = (e.clientY - r.top) / r.height - .5;
          gsap.to(stack, { rotateY: px * 16, rotateX: -py * 12, transformPerspective: 1400, duration: .6, ease: 'power3.out' });
          gsap.to('.mega-logo .card-stack span:nth-child(1)', { x: px * -18, y: py * -10, duration: .8, ease: 'power3.out' });
          gsap.to('.mega-logo .card-stack span:nth-child(2)', { x: px * 18, y: py * 10, duration: .8, ease: 'power3.out' });
        };
        const onMegaLeave = () => {
          gsap.to(stack, { rotateY: 0, rotateX: 0, duration: .7, ease: 'power3.out' });
          gsap.to('.mega-logo .card-stack span', { x: 0, y: 0, duration: .7, ease: 'power3.out' });
        };
        mega.addEventListener('mousemove', onMegaMove);
        mega.addEventListener('mouseleave', onMegaLeave);
        cleanups.push(() => {
          mega.removeEventListener('mousemove', onMegaMove);
          mega.removeEventListener('mouseleave', onMegaLeave);
        });
      }

      gsap.from('[data-fade]', { opacity: 0, y: 18, duration: 1, ease: 'power2.out', delay: .9 });

      // View counters
      ScrollTrigger.create({
        trigger: '#reel-03',
        start: 'top 60%',
        once: true,
        onEnter: () => {
          document.querySelectorAll('[data-count]').forEach((el) => {
            const target = parseFloat(el.dataset.count);
            gsap.fromTo(el, { innerText: 0 }, {
              innerText: target, duration: 1.8, ease: 'power2.out',
              snap: { innerText: 0.1 },
              onUpdate() { el.textContent = Number(el._gsap.innerText ? el.innerText : el.textContent).toFixed(1) + 'M'; },
            });
          });
        },
      });

      // Section parallax + rail tracking
      const railItems = document.querySelectorAll('.rail .item');
      document.querySelectorAll('.reel').forEach((s) => {
        ScrollTrigger.create({
          trigger: s, start: 'top 50%', end: 'bottom 50%',
          onToggle: ({ isActive }) => {
            if (!isActive) return;
            const id = s.dataset.reel;
            railItems.forEach((r) => r.classList.toggle('active', r.dataset.reel === id));
            const reelNum = document.getElementById('reel-num');
            if (reelNum) reelNum.textContent = `0${id}/04`;
          },
        });
      });

      // Hero tiles drift
      gsap.to('.hero-bg .tile', {
        yPercent: -20, ease: 'none',
        scrollTrigger: { trigger: '#reel-01', start: 'top top', end: 'bottom top', scrub: true },
      });

      // Roster head reveal
      gsap.from('.roster-head h2', {
        y: 60, opacity: 0, duration: 1, ease: 'expo.out',
        scrollTrigger: { trigger: '.roster-head', start: 'top 75%' },
      });
      gsap.from('.svc', {
        y: 40, opacity: 0, duration: .8, stagger: .08, ease: 'expo.out',
        scrollTrigger: { trigger: '.svc-grid', start: 'top 80%' },
      });

      // Credits crawl — desktop only pinned scrub. Mobile handled above via IntersectionObserver.
      if (!isMobile) {
        const stage = document.querySelector('.credits-stage');
        const crawl = document.getElementById('crawl');
        if (stage && crawl) {
          const scrollDistance = () => Math.max(0, crawl.scrollHeight - stage.clientHeight);
          ScrollTrigger.create({
            trigger: '.credits-stage',
            start: 'top top',
            end: () => '+=' + scrollDistance(),
            pin: true,
            scrub: true,
            onUpdate: (self) => {
              crawl.style.transform = `translate3d(0, ${-scrollDistance() * self.progress}px, 0)`;
            },
          });
        }
      }

      // CTA reveal
      gsap.from('.cta-headline, .magnet, .cta-eyebrow', {
        y: 60, opacity: 0, duration: 1, ease: 'expo.out', stagger: .12,
        scrollTrigger: { trigger: '.cta-wrap', start: 'top 75%' },
      });
    });

    return () => {
      cleanups.forEach((fn) => fn());
      ctx.revert();
    };
  }, []);

  return null;
}
