/** Vanilla-style motion: falls, dust, scroll, sprites, lamp, reveals. */

const EASE = "cubic-bezier(.2,.8,.2,1)";

type Streak = {
  x: number;
  v: number;
  len: number;
  phase: number;
  sw: number;
  sprite: HTMLCanvasElement;
  kind: "ghost" | "lava";
};

type Particle = { u: number; v: number; r: number; phase: number; speed: number };

type FallCanvas = {
  el: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  streaks: Streak[];
  speed: number;
  kind: "ghost" | "lava";
  seamBody?: boolean;
};

type DustCanvas = {
  el: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  kind: string;
  particles: Particle[];
  box?: { x: number; y: number; w: number; h: number };
  speed: number;
};

type GhostEl = {
  el: HTMLElement;
  phase: number;
  baseL: number;
  baseT: number;
  pushX: number;
  pushY: number;
};

type BatEl = {
  el: HTMLElement;
  phase: number;
  y0: number;
  dur: number;
  wPct: number;
  flap: number;
  down: boolean;
};

let ghostSprites: HTMLCanvasElement[] = [];
let lavaSprites: HTMLCanvasElement[] = [];

function makeStreakSprite(grads: [string, string, string][]): HTMLCanvasElement[] {
  const out: HTMLCanvasElement[] = [];
  for (const [a, b, c] of grads) {
    for (let i = 0; i < 2; i++) {
      const cvs = document.createElement("canvas");
      cvs.width = 8;
      cvs.height = 160;
      const ctx = cvs.getContext("2d")!;
      const g = ctx.createLinearGradient(0, 0, 0, 160);
      g.addColorStop(0, a);
      g.addColorStop(0.35 + i * 0.15, b);
      g.addColorStop(1, c);
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, 8, 160);
      out.push(cvs);
    }
  }
  return out;
}

function ensureSprites() {
  if (ghostSprites.length) return;
  ghostSprites = makeStreakSprite([
    ["rgba(190,240,255,0)", "rgba(210,248,255,.95)", "rgba(120,200,255,0)"],
    ["rgba(120,190,255,0)", "rgba(140,215,255,.8)", "rgba(90,150,255,0)"],
  ]);
  lavaSprites = makeStreakSprite([
    ["rgba(255,190,80,0)", "rgba(255,236,150,1)", "rgba(255,120,30,0)"],
    ["rgba(255,120,30,0)", "rgba(255,150,50,.9)", "rgba(255,80,20,0)"],
  ]);
}

function inView(el: Element, margin = 50): boolean {
  const r = el.getBoundingClientRect();
  return r.bottom > -margin && r.top < window.innerHeight + margin;
}

function sizeCanvas(el: HTMLCanvasElement) {
  const w = el.offsetWidth;
  const h = el.offsetHeight;
  if (!w || !h) return;
  const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
  el.width = Math.round(w * dpr);
  el.height = Math.round(h * dpr);
  const ctx = el.getContext("2d");
  if (ctx) ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}

function initFall(el: HTMLCanvasElement): FallCanvas {
  ensureSprites();
  sizeCanvas(el);
  const kind = (el.dataset.kind as "ghost" | "lava") || "ghost";
  const speed = parseFloat(el.dataset.speed || "1");
  const seamBody = el.dataset.seamBody === "1";
  const w = el.offsetWidth;
  const h = el.offsetHeight;
  const sprites = kind === "lava" ? lavaSprites : ghostSprites;
  const n =
    kind === "lava"
      ? Math.round(w / 3) * 3
      : Math.round(w / 2.2) * 2;
  const streaks: Streak[] = [];
  for (let i = 0; i < Math.max(n, 4); i++) {
    const x = kind === "lava" ? w * (0.25 + Math.random() * 0.5) : Math.random() * w;
    const len = kind === "lava" ? 30 + Math.random() * 70 : 60 + Math.random() * 220;
    const v = kind === "lava" ? 195 + Math.random() * 155 : 420 + Math.random() * 340;
    streaks.push({
      x,
      v,
      len,
      phase: Math.random() * h,
      sw: kind === "lava" ? 1 + Math.random() * 2.2 : 0.8 + Math.random() * 3.2,
      sprite: sprites[Math.random() < 0.45 ? 0 : 1]!,
      kind,
    });
  }
  return {
    el,
    ctx: el.getContext("2d")!,
    streaks,
    speed,
    kind,
    seamBody,
  };
}

function drawFall(fc: FallCanvas, t: number) {
  if (!inView(fc.el)) return;
  sizeCanvas(fc.el);
  const { ctx, el, streaks, speed, kind, seamBody } = fc;
  const w = el.offsetWidth;
  const h = el.offsetHeight;
  ctx.globalCompositeOperation = "source-over";
  ctx.clearRect(0, 0, w, h);
  if (seamBody) {
    const g = ctx.createLinearGradient(0, 0, w, 0);
    g.addColorStop(0, "rgba(80,150,255,0)");
    g.addColorStop(0.18, "rgba(90,175,255,.7)");
    g.addColorStop(0.5, "rgba(175,238,255,.96)");
    g.addColorStop(0.82, "rgba(90,175,255,.7)");
    g.addColorStop(1, "rgba(80,150,255,0)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
  }
  ctx.globalCompositeOperation = "lighter";
  for (const s of streaks) {
    const vy = s.v * speed;
    const y = (((t * vy + s.phase) % (h + s.len)) - s.len) % (h + s.len);
    const edge = kind === "ghost" ? 1 - Math.pow(Math.abs(s.x / w - 0.5) * 2, 2) * 0.6 : 1;
    ctx.globalAlpha = (0.18 + Math.random() * 0.55) * edge;
    ctx.drawImage(s.sprite, s.x, y, s.sw, s.len);
    ctx.drawImage(s.sprite, s.x, y - h - s.len, s.sw, s.len);
  }
  ctx.globalAlpha = 1;
}

function initDust(el: HTMLCanvasElement): DustCanvas {
  sizeCanvas(el);
  const kind = el.dataset.dust || "wisp";
  const speed = parseFloat(el.dataset.speed || "1");
  const bx = el.dataset.x ? parseFloat(el.dataset.x) : 0;
  const by = el.dataset.y ? parseFloat(el.dataset.y) : 0;
  const bw = el.dataset.w ? parseFloat(el.dataset.w) : 100;
  const bh = el.dataset.h ? parseFloat(el.dataset.h) : 100;
  const count = parseInt(el.dataset.count || "50", 10);
  const particles: Particle[] = [];
  for (let i = 0; i < count; i++) {
    particles.push({
      u: Math.random(),
      v: Math.random(),
      r: Math.random(),
      phase: Math.random() * Math.PI * 2,
      speed: 0.4 + Math.random() * 0.8,
    });
  }
  return {
    el,
    ctx: el.getContext("2d")!,
    kind,
    particles,
    box: kind === "wisp" || kind === "mote" || kind === "spray" || kind === "bubble" || kind === "shimmer"
      ? { x: bx, y: by, w: bw, h: bh }
      : undefined,
    speed,
  };
}

function drawDust(dc: DustCanvas, t: number) {
  if (!inView(dc.el)) return;
  sizeCanvas(dc.el);
  const { ctx, el, particles, kind, box, speed } = dc;
  const w = el.offsetWidth;
  const h = el.offsetHeight;
  ctx.clearRect(0, 0, w, h);
  ctx.globalCompositeOperation = "lighter";

  const bx = ((box?.x ?? 0) / 100) * w;
  const by = ((box?.y ?? 0) / 100) * h;
  const bw = ((box?.w ?? 100) / 100) * w;
  const bh = ((box?.h ?? 100) / 100) * h;

  for (const p of particles) {
    let px: number, py: number, alpha = 1, rad = 2;
    if (kind === "wisp") {
      p.v -= 0.02 * p.speed * speed * 0.016;
      if (p.v < 0.35) {
        p.v = 0.98;
        p.u = 0.2 + Math.random() * 0.6;
      }
      px = p.u * w + Math.sin(t * 2 + p.phase) * w * 0.012;
      py = p.v * h;
      rad = 0.8 + p.r * 1.8;
      alpha = Math.min(1, p.v * 4) * Math.abs(Math.sin(t * 2 + p.phase));
      ctx.fillStyle = `rgba(190,240,255,${alpha * 0.9})`;
    } else if (kind === "mote") {
      p.v -= 0.008 * p.speed * speed * 0.02;
      if (p.v < 0) p.v = 1;
      px = bx + p.u * bw + Math.sin(t + p.phase) * bw * 0.02;
      py = by + p.v * bh;
      rad = 0.6 + p.r * 1.4;
      alpha = 0.25 + p.r * 0.5;
      ctx.fillStyle = `rgba(170,225,255,${alpha})`;
    } else if (kind === "spray") {
      const life = ((t * speed * 0.8 + p.phase) % 1 + 1) % 1;
      px = bx + (p.u + (p.r - 0.5) * 0.6) * bw;
      py = by + life * life * bh * 0.9;
      rad = 0.7 + p.r * 1.6;
      alpha = 1 - life;
      ctx.fillStyle = `rgba(200,245,255,${alpha})`;
    } else if (kind === "bubble") {
      const life = ((t * speed * 0.16 + p.phase) % 1 + 1) % 1;
      px = bx + p.u * bw + Math.sin(t * 1.4 + p.phase) * bw * 0.03;
      py = by + bh - life * bh;
      rad = (2 + p.r * 7) * (w / 1440);
      const a = Math.sin(life * Math.PI) * 0.9;
      const g = ctx.createRadialGradient(px - rad * 0.2, py - rad * 0.2, 0, px, py, rad);
      g.addColorStop(0, `rgba(255,240,180,${a})`);
      g.addColorStop(0.5, `rgba(255,170,70,${0.55 * a})`);
      g.addColorStop(1, "rgba(255,120,30,0)");
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(px, py, rad, 0, Math.PI * 2);
      ctx.fill();
      continue;
    } else if (kind === "shimmer") {
      const spread = 0.3 + p.v * 0.7;
      px = bx + (0.5 + (p.u - 0.5) * spread) * bw;
      py = by + p.r * bh;
      alpha = Math.max(0, Math.sin(t * (1.2 + p.r * 2) + p.phase)) * 0.8;
      const len = 12 + p.r * 20;
      ctx.fillStyle = `rgba(255,240,205,${alpha})`;
      ctx.fillRect(px - len / 2, py, len, 1.2);
      continue;
    } else {
      continue;
    }
    ctx.beginPath();
    ctx.arc(px, py, rad, 0, Math.PI * 2);
    ctx.fill();
  }
}

export type DescentController = { destroy: () => void };

export function bootDescent(root: HTMLElement): DescentController {
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const scroller = root.querySelector<HTMLElement>("#descent-scroller")!;
  const lamp = root.querySelector<HTMLElement>(".descent-lamp")!;
  const heroArt = root.querySelector<HTMLElement>("#top .descent-art")!;
  const heroCopy = root.querySelector<HTMLElement>(".descent-hero-copy")!;
  const nav = root.querySelector<HTMLElement>(".descent-nav")!;

  const fallEls = [...root.querySelectorAll<HTMLCanvasElement>("canvas.descent-fall")];
  const dustEls = [...root.querySelectorAll<HTMLCanvasElement>("canvas.descent-dust")];
  const falls = fallEls.map(initFall);
  const dusts = dustEls.map(initDust);

  const ghostEls: GhostEl[] = [...root.querySelectorAll<HTMLElement>(".descent-ghost")].map((el) => ({
    el,
    phase: Math.random() * 10,
    baseL: parseFloat(el.dataset.l || "50"),
    baseT: parseFloat(el.dataset.t || "50"),
    pushX: 0,
    pushY: 0,
  }));

  const batEls: BatEl[] = [...root.querySelectorAll<HTMLElement>(".descent-bat")].map((el) => ({
    el,
    phase: Math.random(),
    y0: parseFloat(el.dataset.y0 || "20"),
    dur: 9 + Math.random() * 7,
    wPct: 1.6 + Math.random() * 1.6,
    flap: 0,
    down: false,
  }));

  let scrollCur = 0;
  let lampCurX = window.innerWidth / 2;
  let lampCurY = window.innerHeight / 2;
  let mx = lampCurX;
  let my = lampCurY;
  let lastT = performance.now();
  let raf = 0;
  let destroyed = false;

  const setBodyHeight = () => {
    document.body.style.height = `${scroller.offsetHeight}px`;
    document.body.style.background = "#110A2A";
  };
  setBodyHeight();

  const onResize = () => {
    falls.forEach((f) => initFall(f.el));
    dusts.forEach((d) => initDust(d.el));
    setBodyHeight();
  };
  window.addEventListener("resize", onResize);

  const onScroll = () => {
    /* native scroll drives target */
  };
  window.addEventListener("scroll", onScroll, { passive: true });

  const onMove = (e: PointerEvent) => {
    mx = e.clientX;
    my = e.clientY;
    if (lamp && window.matchMedia("(pointer: fine)").matches) {
      lamp.style.opacity = "1";
    }
  };
  window.addEventListener("pointermove", onMove);

  const heroH = () => root.querySelector<HTMLElement>("#top")?.offsetHeight ?? 800;

  const revealBlocks = [...root.querySelectorAll<HTMLElement>(".descent-copy")];
  const revealed = new Set<HTMLElement>();

  const tick = (now: number) => {
    if (destroyed) return;
    const dt = Math.min((now - lastT) / 1000, 0.05);
    lastT = now;

    const target = window.scrollY;
    if (reduced) scrollCur = target;
    else scrollCur += (target - scrollCur) * (1 - Math.exp(-7.5 * dt));
    if (Math.abs(target - scrollCur) < 0.05) scrollCur = target;

    scroller.style.transform = `translate3d(0, ${-scrollCur}px, 0)`;

    const hh = heroH();
    const hp = Math.min(1, Math.max(0, scrollCur / hh));
    heroArt.style.transform = `translate3d(0, ${scrollCur * 0.32}px, 0)`;
    heroCopy.style.transform = `translate3d(0, ${scrollCur * 0.55}px, 0)`;
    root.style.setProperty("--lsx", `${hp * 0.18}em`);

    const t = now / 1000;
    if (!reduced) {
      for (const f of falls) drawFall(f, t);
      for (const d of dusts) drawDust(d, t);

      for (const g of ghostEls) {
        const repulseX = (() => {
          const art = g.el.offsetParent as HTMLElement;
          if (!art) return 0;
          const rect = art.getBoundingClientRect();
          const gx = rect.left + (g.baseL / 100) * rect.width;
          const gy = rect.top + (g.baseT / 100) * rect.height;
          const dx = gx - mx;
          const dy = gy - my;
          const dist = Math.hypot(dx, dy);
          if (dist > 260) return 0;
          const push = Math.pow(1 - dist / 260, 1.5) * 90;
          const nx = dx / (dist || 1);
          g.pushX += (nx * push - g.pushX) * (1 - Math.exp(-3 * dt));
          return g.pushX;
        })();

        const driftX = Math.sin(t * 0.35 + g.phase) * 1.2 + repulseX * 0.02;
        const driftY = Math.sin(t * 0.9 + g.phase) * 1.4;
        const rot = Math.sin(t * 0.7 + g.phase) * 6 + repulseX * 0.05;
        g.el.style.transform = `translate3d(calc(-50% + ${driftX}%), calc(-50% + ${driftY}%), 0) rotate(${rot}deg)`;
      }

      for (const b of batEls) {
        const p = ((t + b.phase * b.dur) % b.dur) / b.dur;
        const x = -8 + p * 116;
        const y = b.y0 + Math.sin(p * 9 + b.phase * 6) * 3;
        b.flap += dt;
        if (b.flap > 1 / (8 + Math.random() * 4)) {
          b.flap = 0;
          b.down = !b.down;
          b.el.classList.toggle("is-down", b.down);
        }
        b.el.style.left = `${x}%`;
        b.el.style.top = `${y}%`;
      }

      lampCurX += (mx - lampCurX) * (1 - Math.exp(-10 * dt));
      lampCurY += (my - lampCurY) * (1 - Math.exp(-10 * dt));
      lamp.style.transform = `translate3d(${lampCurX - 260}px, ${lampCurY - 260}px, 0)`;
    } else {
      if (falls[0]) drawFall(falls[0], 0);
    }

    for (const block of revealBlocks) {
      if (revealed.has(block)) continue;
      const r = block.getBoundingClientRect();
      if (r.top < window.innerHeight * 0.8) {
        revealed.add(block);
        block.classList.add("is-visible");
        if (reduced) {
          block.querySelectorAll<HTMLElement>(".ln > span, .descent-rule").forEach((el) => {
            el.style.transform = "none";
          });
        }
      }
    }

    raf = requestAnimationFrame(tick);
  };

  raf = requestAnimationFrame(tick);

  if (!reduced) {
    nav.animate([{ transform: "translateY(-100%)" }, { transform: "translateY(0)" }], {
      duration: 900,
      delay: 500,
      easing: EASE,
      fill: "forwards",
    });

    const letters = root.querySelectorAll<HTMLElement>(".descent-hero-copy .ch");
    letters.forEach((el, i) => {
      el.animate(
        [{ transform: "translateY(110%)" }, { transform: "translateY(0)" }],
        { duration: 1200, delay: 250 + i * 70, easing: EASE, fill: "forwards" },
      );
    });

    const sub = root.querySelector<HTMLElement>(".descent-sub");
    sub?.animate(
      [
        { letterSpacing: "1.4em", transform: "translateY(14px)", clipPath: "inset(0 50% 0 50%)" },
        { letterSpacing: ".62em", transform: "translateY(0)", clipPath: "inset(0 0 0 0)" },
      ],
      { duration: 1600, delay: 900, easing: EASE, fill: "forwards" },
    );

    heroArt.animate([{ transform: "scale(1.09)" }, { transform: "scale(1)" }], {
      duration: 2600,
      easing: EASE,
      fill: "forwards",
    });
  } else {
    nav.style.transform = "none";
    root.querySelectorAll<HTMLElement>(".descent-copy").forEach((b) => b.classList.add("is-visible"));
  }

  return {
    destroy: () => {
      destroyed = true;
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", onResize);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("pointermove", onMove);
      document.body.style.height = "";
      document.body.style.background = "";
    },
  };
}
