/* ============================================================
   Motion: a thread that follows the cursor, paper scraps that
   drift with scroll + mouse, a stitched seam that sews itself
   down the page as you scroll, reveal-on-scroll and card tilt.
   ============================================================ */
(function () {
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const touch = matchMedia("(hover: none)").matches;
  const C = { thread: "#b07a4f", dark: "#5a3825", cream: "#f3e6d6", gold: "#c8963e", latte: "#d9b99b", rose: "#c46a5a" };

  let mouse = { x: innerWidth * 0.7, y: 200, active: false };
  let lastScroll = window.scrollY, scrollVel = 0;  // bare `scrollY` below = window.scrollY

  addEventListener("pointermove", e => { if (e.pointerType === "mouse") { mouse.x = e.clientX; mouse.y = e.clientY; mouse.active = true; } }, { passive: true });

  /* ---------------- 1. thread rope ---------------- */
  const canvas = document.getElementById("thread-canvas");
  const ctx = canvas && canvas.getContext("2d");
  const N = 26, SEG = 8;
  const pts = [];
  function resizeCanvas() {
    if (!canvas) return;
    const dpr = Math.min(devicePixelRatio || 1, 2);
    canvas.width = innerWidth * dpr; canvas.height = innerHeight * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  function initRope() {
    pts.length = 0;
    const ax = touch ? innerWidth - 26 : mouse.x, ay = touch ? -4 : mouse.y;
    for (let i = 0; i < N; i++) pts.push({ x: ax, y: ay + i * SEG, px: ax, py: ay + i * SEG });
  }
  let anchor = { x: mouse.x, y: mouse.y };
  function stepRope() {
    // anchor: cursor on desktop, swaying pin on touch screens
    if (touch) {
      anchor.x = innerWidth - 26 + Math.sin(performance.now() / 900) * 4;
      anchor.y = -4;
    } else {
      anchor.x += (mouse.x - anchor.x) * 0.35;
      anchor.y += (mouse.y - anchor.y) * 0.35;
    }
    const gust = Math.max(-30, Math.min(30, scrollVel)) * 0.06;
    for (let i = 1; i < N; i++) {
      const p = pts[i];
      const vx = (p.x - p.px) * 0.97, vy = (p.y - p.py) * 0.97;
      p.px = p.x; p.py = p.y;
      p.x += vx + (touch ? -gust * (i / N) : 0);
      p.y += vy + 0.45;
    }
    pts[0].x = anchor.x; pts[0].y = anchor.y;
    for (let k = 0; k < 6; k++) {
      for (let i = 0; i < N - 1; i++) {
        const a = pts[i], b = pts[i + 1];
        const dx = b.x - a.x, dy = b.y - a.y, d = Math.hypot(dx, dy) || 0.001;
        const diff = (d - SEG) / d;
        if (i === 0) { b.x -= dx * diff; b.y -= dy * diff; }
        else { a.x += dx * diff * 0.5; a.y += dy * diff * 0.5; b.x -= dx * diff * 0.5; b.y -= dy * diff * 0.5; }
      }
    }
  }
  function drawRope() {
    ctx.clearRect(0, 0, innerWidth, innerHeight);
    if (!touch && !mouse.active) return;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(pts[0].x, pts[0].y);
    for (let i = 1; i < N - 1; i++) {
      const mx = (pts[i].x + pts[i + 1].x) / 2, my = (pts[i].y + pts[i + 1].y) / 2;
      ctx.quadraticCurveTo(pts[i].x, pts[i].y, mx, my);
    }
    ctx.lineTo(pts[N - 1].x, pts[N - 1].y);
    ctx.strokeStyle = "rgba(59,36,24,.12)"; ctx.lineWidth = 4; ctx.stroke();
    ctx.strokeStyle = C.thread; ctx.lineWidth = 2; ctx.stroke();
    ctx.setLineDash([3, 5]); ctx.strokeStyle = "rgba(255,240,220,.55)"; ctx.lineWidth = 1; ctx.stroke(); ctx.setLineDash([]);
    // a wooden button at the end
    const e = pts[N - 1], f = pts[N - 3];
    const ang = Math.atan2(e.y - f.y, e.x - f.x);
    ctx.save(); ctx.translate(e.x, e.y); ctx.rotate(ang);
    ctx.fillStyle = C.gold; ctx.beginPath(); ctx.arc(6, 0, 8, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = C.dark; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.arc(6, 0, 5.5, 0, Math.PI * 2); ctx.stroke();
    ctx.fillStyle = C.dark;
    [[4, -2], [8, -2], [4, 2], [8, 2]].forEach(([x, y]) => { ctx.beginPath(); ctx.arc(x, y, 1, 0, Math.PI * 2); ctx.fill(); });
    ctx.restore();
    // anchor pin
    ctx.fillStyle = touch ? C.dark : "rgba(90,56,37,.9)";
    ctx.beginPath(); ctx.arc(pts[0].x, pts[0].y, touch ? 4 : 3, 0, Math.PI * 2); ctx.fill();
  }

  /* ---------------- 2. paper scraps ---------------- */
  const SHAPES = [
    c => `<svg viewBox="0 0 100 80"><path d="M4 8 L22 2 L40 9 L58 3 L77 8 L96 4 L92 30 L97 52 L91 76 L70 72 L50 78 L30 72 L8 77 L3 50 L7 28 Z" fill="${c}"/><path d="M14 22 H86 M14 38 H72" stroke="rgba(59,36,24,.18)" stroke-width="2" stroke-dasharray="4 4"/></svg>`,
    c => `<svg viewBox="0 0 100 90"><path d="M50 86 C 10 60, 2 30, 24 14 C 38 4, 50 18, 50 26 C 50 18, 62 4, 76 14 C 98 30, 90 60, 50 86 Z" fill="${c}"/><path d="M50 76 C 20 56, 14 34, 28 22" fill="none" stroke="rgba(255,253,249,.7)" stroke-width="2" stroke-dasharray="4 4"/></svg>`,
    c => `<svg viewBox="0 0 100 100"><circle cx="50" cy="50" r="44" fill="${c}"/><circle cx="50" cy="50" r="34" fill="none" stroke="rgba(59,36,24,.25)" stroke-width="2"/><circle cx="40" cy="40" r="5" fill="rgba(59,36,24,.45)"/><circle cx="60" cy="40" r="5" fill="rgba(59,36,24,.45)"/><circle cx="40" cy="60" r="5" fill="rgba(59,36,24,.45)"/><circle cx="60" cy="60" r="5" fill="rgba(59,36,24,.45)"/></svg>`,
    c => `<svg viewBox="0 0 100 100"><path d="M50 4 L61 37 L96 38 L68 59 L78 94 L50 73 L22 94 L32 59 L4 38 L39 37 Z" fill="${c}"/></svg>`,
    c => `<svg viewBox="0 0 120 70"><path d="M2 6 h88 l28 29 l-28 29 h-88 z" fill="${c}"/><circle cx="92" cy="35" r="6" fill="#faf5ef"/><path d="M14 24 H70 M14 44 H56" stroke="rgba(59,36,24,.25)" stroke-width="3" stroke-linecap="round"/></svg>`,
    c => `<svg viewBox="0 0 100 100"><path d="M0 10 l10 -10 l10 10 l10 -10 l10 10 l10 -10 l10 10 l10 -10 l10 10 l10 -10 l10 10 v80 l-10 10 l-10 -10 l-10 10 l-10 -10 l-10 10 l-10 -10 l-10 10 l-10 -10 l-10 10 l-10 -10 z" fill="${c}"/><path d="M0 30 H100 M0 50 H100 M0 70 H100" stroke="rgba(255,253,249,.4)" stroke-width="6"/></svg>`,
    c => `<svg viewBox="0 0 100 60"><path d="M50 30 C 30 0, 0 6, 10 30 C 0 54, 30 60, 50 30 C 70 0, 100 6, 90 30 C 100 54, 70 60, 50 30 Z" fill="${c}"/><circle cx="50" cy="30" r="7" fill="rgba(59,36,24,.5)"/></svg>`,
    c => `<svg viewBox="0 0 100 100"><path d="M50 95 C 50 60, 20 50, 10 20 C 40 20, 50 40, 50 60 C 50 40, 60 20, 90 20 C 80 50, 50 60, 50 95" fill="${c}"/><path d="M50 95 V 40" stroke="rgba(59,36,24,.3)" stroke-width="2"/></svg>`
  ];
  const COLORS = [C.latte, C.cream, C.gold, "#e3c6a6", C.caramel, "#e8b4a6", "#cfa77f"];
  const scraps = [];
  function buildScraps() {
    const host = document.getElementById("scraps");
    if (!host || reduce) return;
    host.innerHTML = "";
    scraps.length = 0;
    const count = innerWidth < 760 ? 8 : 16;
    for (let i = 0; i < count; i++) {
      const el = document.createElement("div");
      el.className = "scrap";
      const size = 26 + Math.random() * (innerWidth < 760 ? 26 : 46);
      el.style.width = size + "px"; el.style.height = size + "px";
      // keep scraps near the left / right gutters so they never cover text
      const side = i % 2 === 0;
      const x = side ? Math.random() * 12 : 88 + Math.random() * 10;
      el.style.left = x + "vw";
      el.innerHTML = SHAPES[i % SHAPES.length](COLORS[i % COLORS.length]);
      host.appendChild(el);
      scraps.push({ el, baseY: Math.random() * (innerHeight + 200), depth: 0.15 + Math.random() * 0.55, rot: Math.random() * 360, spin: (Math.random() - 0.5) * 0.25, sway: Math.random() * Math.PI * 2 });
    }
  }
  function moveScraps(t) {
    const H = innerHeight + 200;
    const mx = (mouse.x / innerWidth - 0.5), my = (mouse.y / innerHeight - 0.5);
    for (const s of scraps) {
      let y = (s.baseY - scrollY * s.depth) % H; if (y < 0) y += H; y -= 100;
      const x = Math.sin(t / 2400 + s.sway) * 12 - mx * 40 * s.depth;
      const r = s.rot + scrollY * s.spin + Math.sin(t / 1800 + s.sway) * 8;
      s.el.style.transform = `translate3d(${x}px, ${y - my * 30 * s.depth}px, 0) rotate(${r}deg)`;
    }
  }

  /* ---------------- 3. stitched seam ---------------- */
  const seam = document.getElementById("seam");
  let seamPath, seamReveal, needle, seamLen = 0;
  function buildSeam() {
    if (!seam) return;
    const main = document.getElementById("view");
    const top = main.offsetTop + 20;
    const H = document.documentElement.scrollHeight;
    const bottom = H - 120;
    const W = innerWidth;
    seam.setAttribute("viewBox", `0 0 ${W} ${H}`);
    seam.style.height = H + "px";
    const span = bottom - top;
    if (span < 400) { seam.innerHTML = ""; seamLen = 0; return; }
    const loops = Math.max(2, Math.round(span / 900));
    const xL = W < 760 ? 10 : Math.max(24, W * 0.03), xR = W - xL;
    let d = `M ${xR} ${top}`;
    const step = span / loops;
    for (let i = 0; i < loops; i++) {
      const y0 = top + i * step, y1 = y0 + step;
      const from = i % 2 === 0 ? xR : xL, to = i % 2 === 0 ? xL : xR;
      d += ` C ${from} ${y0 + step * 0.55}, ${to} ${y1 - step * 0.55}, ${to} ${y1}`;
    }
    seam.innerHTML = `
      <defs><mask id="seam-mask" maskUnits="userSpaceOnUse"><path id="seam-reveal" d="${d}" stroke="#fff" stroke-width="14" fill="none"/></mask></defs>
      <path d="${d}" fill="none" stroke="rgba(176,122,79,.15)" stroke-width="2" stroke-dasharray="2 12"/>
      <path id="seam-path" d="${d}" fill="none" stroke="${C.thread}" stroke-width="2.4" stroke-dasharray="12 9" stroke-linecap="round" mask="url(#seam-mask)"/>
      <g id="seam-needle"><path d="M-2 -22 L0 18 L2 -22 Z" fill="#8a8f96" stroke="none"/><ellipse cx="0" cy="-17" rx="1" ry="3" fill="#faf5ef" stroke="none"/></g>`;
    seamPath = seam.querySelector("#seam-path");
    seamReveal = seam.querySelector("#seam-reveal");
    needle = seam.querySelector("#seam-needle");
    seamLen = seamPath.getTotalLength();
    seamReveal.style.strokeDasharray = seamLen;
    updateSeam();
  }
  function updateSeam() {
    if (!seamLen) return;
    const max = document.documentElement.scrollHeight - innerHeight;
    const p = Math.min(1, Math.max(0.02, (scrollY + innerHeight * 0.5) / (max + innerHeight * 0.5)));
    const L = seamLen * p;
    seamReveal.style.strokeDashoffset = seamLen - L;
    const a = seamPath.getPointAtLength(L), b = seamPath.getPointAtLength(Math.max(0, L - 4));
    const ang = Math.atan2(a.y - b.y, a.x - b.x) * 180 / Math.PI - 90;
    needle.setAttribute("transform", `translate(${a.x} ${a.y}) rotate(${ang})`);
  }

  /* ---------------- 4. reveal + tilt + header ---------------- */
  const io = "IntersectionObserver" in window ? new IntersectionObserver(entries => {
    entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } });
  }, { rootMargin: "0px 0px -8% 0px", threshold: 0.08 }) : null;

  function bindReveal(root = document) {
    root.querySelectorAll(".reveal:not(.in)").forEach(el => io ? io.observe(el) : el.classList.add("in"));
  }
  function bindTilt(root = document) {
    if (touch || reduce) return;
    root.querySelectorAll("[data-tilt]").forEach(el => {
      if (el._tilt) return; el._tilt = true;
      el.addEventListener("pointermove", e => {
        const r = el.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width - 0.5, y = (e.clientY - r.top) / r.height - 0.5;
        el.style.transform = `perspective(900px) rotateY(${x * 10}deg) rotateX(${-y * 10}deg) translateY(-4px)`;
      });
      el.addEventListener("pointerleave", () => { el.style.transform = ""; });
    });
  }
  function moveHero() {
    const art = document.querySelector(".hero-art");
    if (!art) return;
    const mx = (mouse.x / innerWidth - 0.5), my = (mouse.y / innerHeight - 0.5);
    art.querySelectorAll(".polaroid").forEach((p, i) => {
      const k = (i + 1) * 8;
      p.style.transform = `translate(${mx * k}px, ${my * k - scrollY * 0.06 * (i + 1)}px) rotate(calc(var(--r) + ${mx * 4}deg))`;
    });
  }

  /* ---------------- loop ---------------- */
  const header = document.getElementById("header");
  function frame(t) {
    scrollVel = scrollY - lastScroll; lastScroll = scrollY;
    if (ctx && !reduce) { stepRope(); drawRope(); }
    moveScraps(t);
    updateSeam();
    if (!touch) moveHero();
    if (header) header.classList.toggle("scrolled", scrollY > 10);
    requestAnimationFrame(frame);
  }

  let seamTimer;
  function refresh() {
    bindReveal(); bindTilt();
    clearTimeout(seamTimer);
    seamTimer = setTimeout(buildSeam, 60);
  }

  addEventListener("resize", () => { resizeCanvas(); buildScraps(); refresh(); });
  resizeCanvas(); initRope(); buildScraps();
  if ("ResizeObserver" in window) {
    let last = 0;
    new ResizeObserver(() => { const h = document.documentElement.scrollHeight; if (Math.abs(h - last) > 40) { last = h; refresh(); } }).observe(document.body);
  }
  requestAnimationFrame(frame);

  window.FX = { refresh };
})();
