/* ============================================================
   THE BEST — storefront (English / Arabic)
   ============================================================ */
(function () {
  const CFG = window.STORE_CONFIG;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const t = (k, ...a) => I18N.t(k, ...a);
  const F = (o, f) => I18N.field(o, f);
  const view = $("#view");

  const state = { categories: [], products: [], settings: {}, loaded: false };
  const ls = {
    get(k, d) { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
  };
  let cart = ls.get("tb_cart", []);
  let wish = ls.get("tb_wish", []);

  const waNumber = () => (state.settings.whatsapp || CFG.WHATSAPP_NUMBER).replace(/\D/g, "");
  const price = ils => Currency.format(ils);
  const catById = id => state.categories.find(c => c.id === id);
  const prodById = id => state.products.find(p => p.id === id);
  const catCover = (c, i) => c.cover || (state.products.find(p => p.category_id === c.id)?.images?.[0]) || DB.placeholder(i, ["heart", "jar", "candle", "box", "tag"][i % 5]);
  const firstImg = p => (p.images && p.images[0]) || DB.placeholder(3, "box");
  const S = key => I18N.setting(state.settings, key);
  const arrow = I18N.isAr ? "M19 12H5M11 6l-6 6 6 6" : "M5 12h14M13 6l6 6-6 6";

  let toastT;
  function toast(html) {
    const el = $("#toast"); el.innerHTML = html; el.classList.add("show");
    clearTimeout(toastT); toastT = setTimeout(() => el.classList.remove("show"), 2600);
  }

  /* ---------- cart / wishlist ---------- */
  function saveCart() { ls.set("tb_cart", cart); updateCounts(); }
  function addToCart(id, qty = 1, note = "") {
    const ex = cart.find(i => i.id === id && (i.note || "") === note);
    if (ex) ex.qty += qty; else cart.push({ id, qty, note });
    saveCart();
    toast(t("added", esc(F(prodById(id), "name"))));
    const b = $('a[href="#/cart"] .count'); if (b) b.animate([{ transform: "scale(1)" }, { transform: "scale(1.6)" }, { transform: "scale(1)" }], { duration: 400 });
  }
  function toggleWish(id) {
    wish = wish.includes(id) ? wish.filter(x => x !== id) : [...wish, id];
    ls.set("tb_wish", wish); updateCounts();
    return wish.includes(id);
  }
  function updateCounts() {
    cart = cart.filter(i => !state.loaded || prodById(i.id));
    const n = cart.reduce((a, i) => a + i.qty, 0);
    $("#cart-count").textContent = n || ""; const m = $("#cart-count-m"); if (m) m.textContent = n || "";
    $("#wish-count").textContent = wish.length || "";
  }

  /* ---------- templates ---------- */
  const heart = `<svg viewBox="0 0 24 24"><path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z"/></svg>`;
  const waIcon = `<svg viewBox="0 0 24 24"><path d="M4 20l1.3-4A8 8 0 1 1 8 18.7z"/></svg>`;
  const BADGE_AR = { "New": "جديد", "Best seller": "الأكثر مبيعاً", "Limited": "كمية محدودة", "Customizable": "قابل للتخصيص" };
  const badgeText = b => I18N.isAr ? (BADGE_AR[b] || b) : b;

  function productCard(p, i = 0) {
    const imgs = p.images || [];
    const off = p.compare_price && p.compare_price > p.price ? Math.round((1 - p.price / p.compare_price) * 100) : 0;
    const badges = [...(p.badges || [])].slice(0, 1).map(b => `<span class="badge">${esc(badgeText(b))}</span>`).join("") + (off ? `<span class="badge sale">-${off}%</span>` : "");
    const name = F(p, "name");
    return `<article class="pcard reveal" style="--d:${(i % 4) * 0.07}s">
      <a href="#/p/${p.id}" class="pcard-img">${badges}
        <img class="main" src="${esc(imgs[0] || firstImg(p))}" alt="${esc(name)}" loading="lazy">
        ${imgs[1] ? `<img class="alt" src="${esc(imgs[1])}" alt="" loading="lazy">` : ""}
      </a>
      <button class="wish ${wish.includes(p.id) ? "on" : ""}" data-wish="${p.id}" aria-label="${t("save_wish")}">${heart}</button>
      <button class="quick-add" data-add="${p.id}">${t("quick_add")}</button>
      <div class="pcard-body">
        <a href="#/p/${p.id}"><p class="pcard-name">${esc(name)}</p></a>
        <div class="price"><b data-price="${p.price}">${price(p.price)}</b>${off ? `<s data-price="${p.compare_price}">${price(p.compare_price)}</s>` : ""}</div>
      </div>
    </article>`;
  }
  const emptyBlock = (title, text, cta = `<a class="btn" href="#/">${t("back_shop")}</a>`) =>
    `<div class="empty reveal"><p class="big">${title}</p><p>${text}</p>${cta}</div>`;

  function gridWithFilters(list, id) {
    return `<div class="filters" id="${id}-filters">
        <button class="chip on" data-filter="all">${t("f_all")}</button>
        <button class="chip" data-filter="new">${t("f_new")}</button>
        <button class="chip" data-filter="best">${t("f_best")}</button>
        <button class="chip" data-filter="sale">${t("f_sale")}</button>
        <select data-sort aria-label="Sort"><option value="new">${t("sort_new")}</option><option value="low">${t("sort_low")}</option><option value="high">${t("sort_high")}</option></select>
      </div>
      <div class="grid" id="${id}-grid">${list.map(productCard).join("") || emptyBlock(t("coming_soon"), t("coming_soon_p"))}</div>`;
  }
  function bindFilters(list, id) {
    const box = $(`#${id}-filters`); if (!box) return;
    let filter = "all", sort = "new";
    const run = () => {
      let l = [...list];
      if (filter === "new") l = l.filter(p => (p.badges || []).includes("New") || Date.now() - new Date(p.created_at) < 14 * 864e5);
      if (filter === "best") l = l.filter(p => p.featured || (p.badges || []).includes("Best seller"));
      if (filter === "sale") l = l.filter(p => p.compare_price && p.compare_price > p.price);
      if (sort === "low") l.sort((a, b) => a.price - b.price);
      if (sort === "high") l.sort((a, b) => b.price - a.price);
      $(`#${id}-grid`).innerHTML = l.map(productCard).join("") || emptyBlock(t("nothing_here"), t("try_filter"), "");
      FX.refresh();
    };
    box.addEventListener("click", e => { const c = e.target.closest("[data-filter]"); if (!c) return; $$(".chip", box).forEach(x => x.classList.toggle("on", x === c)); filter = c.dataset.filter; run(); });
    box.querySelector("[data-sort]").addEventListener("change", e => { sort = e.target.value; run(); });
  }
  const ocard = (c, i, sub) => `<a class="ocard reveal" data-tilt style="--d:${(i % 4) * 0.08}s;--rot:${i % 2 ? 2 : -2}deg" href="#/c/${esc(c.slug)}"><img src="${esc(catCover(c, i))}" alt="" loading="lazy"><div class="ocard-body"><h3>${esc(F(c, "name"))}</h3><p>${esc(F(c, "description"))}</p><span>${sub}</span></div></a>`;

  /* ---------- views ---------- */
  function viewHome() {
    const imgs = state.products.slice(0, 6).map(firstImg);
    const featured = state.products.filter(p => p.featured).slice(0, 8);
    const newest = state.products.slice(0, 12);
    const deco = i => imgs[i] || DB.placeholder(i, ["heart", "box", "jar"][i % 3]);
    const stampText = I18N.isAr ? "صناعة يدوية • بكل دفا • THE BEST • " : "HANDMADE • WITH WARMTH • THE BEST • ";
    return `
    <section class="hero">
      <div class="hero-glow"></div>
      <div class="wrap hero-inner">
        <div>
          <span class="hero-kicker reveal in"><i></i>${esc(S("hero_kicker"))}</span>
          <h1>
            <span class="line"><span style="--d:.05s">${esc(S("hero_line1"))}</span></span>
            <span class="line"><span style="--d:.18s"><em>${esc(S("hero_line2"))}</em> ${esc(S("hero_line3"))}</span></span>
          </h1>
          <p class="lead reveal" style="--d:.3s">${esc(S("hero_text"))}</p>
          <div class="hero-cta reveal" style="--d:.4s">
            <a href="#/categories" class="btn">${t("shop_collection")} <svg viewBox="0 0 24 24"><path d="${arrow}"/></svg></a>
            <a href="https://wa.me/${waNumber()}?text=${encodeURIComponent(t("custom_msg"))}" target="_blank" rel="noopener" class="btn btn-outline">${t("custom_order")}</a>
          </div>
          <div class="hero-stats reveal" style="--d:.5s">
            <div><b>${state.products.length}+</b><span>${t("stat_pieces")}</span></div>
            <div><b>${state.categories.length}</b><span>${t("stat_occasions")}</span></div>
            <div><b>100%</b><span>${t("stat_love")}</span></div>
          </div>
        </div>
        <div class="hero-art">
          <figure class="polaroid p1"><img src="${esc(deco(0))}" alt=""><figcaption>${t("cap1")}</figcaption></figure>
          <figure class="polaroid p2"><img src="${esc(deco(1))}" alt=""><figcaption>${t("cap2")}</figcaption></figure>
          <figure class="polaroid p3"><img src="${esc(deco(2))}" alt=""><figcaption>${t("cap3")}</figcaption></figure>
          <svg class="yarn" viewBox="0 0 100 100"><circle cx="50" cy="50" r="40" fill="#b07a4f" stroke="none"/><path d="M18 40 C 40 30, 70 30, 88 44 M14 56 C 40 44, 70 46, 90 60 M22 72 C 44 60, 68 62, 82 74 M40 12 C 30 40, 34 70, 48 90 M62 12 C 52 40, 56 70, 70 86" stroke="#7b4f35" stroke-width="3"/><path d="M88 60 C 100 80, 80 96, 60 99" stroke="#b07a4f" stroke-width="3"/></svg>
          <svg class="stamp" viewBox="0 0 120 120"><defs><path id="circ" d="M60 60 m -44 0 a 44 44 0 1 1 88 0 a 44 44 0 1 1 -88 0"/></defs><circle cx="60" cy="60" r="56" fill="#3b2418" stroke="none"/><text font-family="DM Sans, Tajawal" font-size="11.5" font-weight="700" letter-spacing="${I18N.isAr ? 0 : 3.2}" fill="#f3e6d6" stroke="none"><textPath href="#circ">${stampText}</textPath></text><path d="M60 72 C 44 62, 44 48, 54 46 C 58 45, 60 48, 60 50 C 60 48, 62 45, 66 46 C 76 48, 76 62, 60 72 Z" fill="#c8963e" stroke="none"/></svg>
        </div>
      </div>
    </section>

    <section class="section" style="padding-top:10px"><div class="wrap"><div class="circles">
      ${state.categories.map((c, i) => `<a class="circle reveal" style="--d:${i * 0.06}s" href="#/c/${esc(c.slug)}"><div class="circle-img"><img src="${esc(catCover(c, i))}" alt="" loading="lazy"></div><p>${esc(F(c, "name"))}</p></a>`).join("")}
    </div></div></section>

    <section class="section"><div class="wrap">
      <div class="section-head reveal"><div><p class="eyebrow">${t("eb_occasion")}</p><h2 class="h2">${t("h_every_moment")}</h2></div><a class="link-more" href="#/categories">${t("all_categories")}</a></div>
      <div class="cards">${state.categories.slice(0, 8).map((c, i) => ocard(c, i, t("explore"))).join("")}</div>
    </div></section>

    ${featured.length ? `<section class="section"><div class="wrap">
      <div class="section-head reveal"><div><p class="eyebrow">${t("eb_loved")}</p><h2 class="h2">${t("h_best")}</h2></div></div>
      <div class="grid">${featured.map(productCard).join("")}</div></div></section>` : ""}

    <section class="section"><div class="wrap">
      <div class="band reveal">
        <svg class="steam" viewBox="0 0 60 80"><path d="M15 70 C 5 55, 25 45, 15 30 C 8 20, 18 10, 15 4"/><path d="M30 70 C 20 55, 40 45, 30 30 C 23 20, 33 10, 30 4"/><path d="M45 70 C 35 55, 55 45, 45 30 C 38 20, 48 10, 45 4"/></svg>
        <div>
          <p class="eyebrow">${t("eb_easy")}</p>
          <h2>${t("band_h")}</h2>
          <p>${t("band_p")}</p>
          <a class="btn btn-light" href="#/categories">${t("start_shopping")}</a>
        </div>
        <div class="steps">
          ${[1, 2, 3].map(n => `<div class="step"><b>${n}</b><p><strong>${t(`s${n}h`)}</strong>${t(`s${n}p`)}</p></div>`).join("")}
        </div>
      </div>
    </div></section>

    <section class="section"><div class="wrap">
      <div class="section-head reveal"><div><p class="eyebrow">${t("eb_fresh")}</p><h2 class="h2">${t("h_new")}</h2></div><a class="link-more" href="#/categories">${t("see_all")}</a></div>
      ${gridWithFilters(newest, "home")}
    </div></section>

    <section class="section"><div class="wrap promises">
      ${["M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5 18 18M6 18l2.5-2.5M15.5 8.5 18 6", "M4 7h16v13H4zM4 7l8 6 8-6", "M3 12a9 9 0 1 0 18 0 9 9 0 0 0-18 0M12 7v5l3 2", "M5 12l5 5L20 7"]
        .map((d, i) => `<div class="promise reveal" style="--d:${i * 0.08}s"><svg viewBox="0 0 24 24"><path d="${d}"/></svg><h4>${t(`pr${i + 1}h`)}</h4><p>${t(`pr${i + 1}p`)}</p></div>`).join("")}
    </div></section>`;
  }

  const crumbs = (...parts) => `<div class="crumbs"><a href="#/">${t("home")}</a>${parts.map(p => ` / ${p}`).join("")}</div>`;

  function viewCategories() {
    return `<div class="wrap"><div class="page-head reveal">${crumbs(`<span>${t("categories")}</span>`)}<h1>${t("h_shop_occasion")}</h1><p>${t("cats_sub")}</p></div>
      <div class="section"><div class="cards">${state.categories.map((c, i) => ocard(c, i, t("pieces", state.products.filter(p => p.category_id === c.id).length))).join("") || emptyBlock(t("no_cats"), t("check_soon"))}</div></div></div>`;
  }
  function viewCategory(slug) {
    const c = state.categories.find(x => x.slug === slug);
    if (!c) return viewNotFound();
    const list = state.products.filter(p => p.category_id === c.id);
    setTimeout(() => bindFilters(list, "cat"));
    return `<div class="wrap"><div class="page-head reveal">${crumbs(`<a href="#/categories">${t("categories")}</a>`, `<span>${esc(F(c, "name"))}</span>`)}<h1>${esc(F(c, "name"))}</h1><p>${esc(F(c, "description"))}</p></div>
      <div class="section" style="padding-top:20px">${gridWithFilters(list, "cat")}</div></div>`;
  }
  function viewSearch(q) {
    const s = q.toLowerCase();
    const list = state.products.filter(p => [p.name, p.name_ar, p.description, p.description_ar, catById(p.category_id)?.name, catById(p.category_id)?.name_ar].join(" ").toLowerCase().includes(s));
    setTimeout(() => bindFilters(list, "search"));
    return `<div class="wrap"><div class="page-head reveal">${crumbs(`<span>${t("search")}</span>`)}<h1>“${esc(q)}”</h1><p>${t("results", list.length)}</p></div>
      <div class="section" style="padding-top:20px">${list.length ? gridWithFilters(list, "search") : emptyBlock(t("no_match"), t("no_match_p"))}</div></div>`;
  }

  function viewProduct(id) {
    const p = prodById(id);
    if (!p) return viewNotFound();
    const c = catById(p.category_id);
    const imgs = p.images && p.images.length ? p.images : [firstImg(p)];
    const off = p.compare_price && p.compare_price > p.price ? Math.round((1 - p.price / p.compare_price) * 100) : 0;
    const related = state.products.filter(x => x.category_id === p.category_id && x.id !== p.id).slice(0, 4);
    const prev = I18N.isAr ? "m9 6 6 6-6 6" : "m15 6-6 6 6 6", next = I18N.isAr ? "m15 6-6 6 6 6" : "m9 6 6 6-6 6";
    setTimeout(() => bindProduct(p, imgs));
    return `<div class="wrap">
      <div style="padding-top:24px">${crumbs(c ? `<a href="#/c/${esc(c.slug)}">${esc(F(c, "name"))}</a>` : "", `<span>${esc(F(p, "name"))}</span>`)}</div>
      <div class="pdp">
        <div class="gallery reveal">
          <div class="thumbs">${imgs.map((src, i) => `<button class="${i ? "" : "on"}" data-i="${i}" aria-label="${i + 1}"><img src="${esc(src)}" alt=""></button>`).join("")}</div>
          <div class="stage" id="stage"><img id="stage-img" src="${esc(imgs[0])}" alt="${esc(F(p, "name"))}">
            ${imgs.length > 1 ? `<div class="stage-nav"><button data-nav="-1" aria-label="Previous"><svg viewBox="0 0 24 24"><path d="${prev}"/></svg></button><button data-nav="1" aria-label="Next"><svg viewBox="0 0 24 24"><path d="${next}"/></svg></button></div>` : ""}
          </div>
        </div>
        <div class="pdp-info reveal" style="--d:.1s">
          ${(p.badges || []).map(b => `<span class="hero-kicker" style="margin-inline-end:6px">${esc(badgeText(b))}</span>`).join("")}
          <h1>${esc(F(p, "name"))}</h1>
          <div class="price"><b data-price="${p.price}">${price(p.price)}</b>${off ? `<s data-price="${p.compare_price}">${price(p.compare_price)}</s><span class="off">-${off}%</span>` : ""}</div>
          <p class="pdp-desc">${esc(F(p, "description") || t("default_desc"))}</p>
          <div class="field"><label for="p-note">${t("personal_label")}</label><textarea id="p-note" placeholder="${t("personal_ph")}"></textarea></div>
          <div class="buy-row">
            <div class="qty" dir="ltr"><button data-q="-1" aria-label="-">−</button><input id="p-qty" type="number" min="1" value="1" aria-label="Quantity"><button data-q="1" aria-label="+">+</button></div>
            <button class="btn" id="p-add">${t("add_to_cart")}</button>
            <button class="icon-btn wish ${wish.includes(p.id) ? "on" : ""}" style="position:static;box-shadow:inset 0 0 0 1.5px var(--sand)" data-wish="${p.id}" aria-label="${t("save_wish")}">${heart}</button>
          </div>
          <button class="btn btn-wa btn-block" id="p-wa">${waIcon}${t("order_now_wa")}</button>
          <div class="perks">
            <div><svg viewBox="0 0 24 24"><path d="M12 3v18M3 12h18"/></svg>${t("perk1")}</div>
            <div><svg viewBox="0 0 24 24"><path d="M4 7h16v13H4zM4 7l8 6 8-6"/></svg>${t("perk2")}</div>
            <div><svg viewBox="0 0 24 24"><path d="M5 12l5 5L20 7"/></svg>${t("perk3")}</div>
          </div>
        </div>
      </div>
      ${related.length ? `<div class="section"><div class="section-head reveal"><div><p class="eyebrow">${t("eb_also")}</p><h2 class="h2">${t("more_from", esc(c ? F(c, "name") : t("the_shop")))}</h2></div></div><div class="grid">${related.map(productCard).join("")}</div></div>` : ""}
    </div>`;
  }
  function bindProduct(p, imgs) {
    let cur = 0;
    const show = i => { cur = (i + imgs.length) % imgs.length; const im = $("#stage-img"); im.style.opacity = 0; setTimeout(() => { im.src = imgs[cur]; im.style.opacity = 1; }, 150); $$(".thumbs button").forEach((b, j) => b.classList.toggle("on", j === cur)); };
    $$(".thumbs button").forEach(b => b.onclick = () => show(+b.dataset.i));
    $$("[data-nav]").forEach(b => b.onclick = e => { e.stopPropagation(); show(cur + +b.dataset.nav); });
    const stage = $("#stage");
    stage.onclick = () => stage.classList.toggle("zoom");
    stage.onpointermove = e => { if (!stage.classList.contains("zoom")) return; const r = stage.getBoundingClientRect(); $("#stage-img").style.transformOrigin = `${(e.clientX - r.left) / r.width * 100}% ${(e.clientY - r.top) / r.height * 100}%`; };
    stage.onmouseleave = () => stage.classList.remove("zoom");
    let sx = 0; stage.ontouchstart = e => sx = e.touches[0].clientX;
    stage.ontouchend = e => { const dx = e.changedTouches[0].clientX - sx; if (Math.abs(dx) > 40) show(cur + ((dx < 0) !== I18N.isAr ? 1 : -1)); };
    const qty = $("#p-qty");
    $$("[data-q]").forEach(b => b.onclick = () => qty.value = Math.max(1, (+qty.value || 1) + +b.dataset.q));
    $("#p-add").onclick = () => addToCart(p.id, Math.max(1, +qty.value || 1), $("#p-note").value.trim());
    $("#p-wa").onclick = () => {
      const q = Math.max(1, +qty.value || 1), note = $("#p-note").value.trim();
      openWhatsApp(`${t("wa_hello")}\n• ${F(p, "name")} × ${q} — ${price(p.price * q)}${note ? `\n  ${t("wa_note")}: ${note}` : ""}\n\n${t("wa_link")}: ${location.href}`);
    };
  }

  function viewWishlist() {
    const list = wish.map(prodById).filter(Boolean);
    return `<div class="wrap"><div class="page-head reveal">${crumbs(`<span>${t("wishlist")}</span>`)}<h1>${t("saved_title")}</h1><p>${t("saved_count", list.length)}</p></div>
      <div class="section" style="padding-top:20px">${list.length ? `<div class="grid">${list.map(productCard).join("")}</div>` : emptyBlock(t("nothing_saved"), t("nothing_saved_p"))}</div></div>`;
  }

  function cartTotals() {
    const lines = cart.map(i => ({ ...i, p: prodById(i.id) })).filter(l => l.p);
    return { lines, total: lines.reduce((a, l) => a + l.p.price * l.qty, 0) };
  }
  function viewCart() {
    const { lines, total } = cartTotals();
    if (!lines.length) return `<div class="wrap"><div class="page-head reveal"><h1>${t("your_cart")}</h1></div>${emptyBlock(t("cart_empty"), t("cart_empty_p"))}</div>`;
    const R = Currency.REGIONS, RN = t("regions");
    setTimeout(bindCart);
    return `<div class="wrap"><div class="page-head reveal">${crumbs(`<span>${t("cart")}</span>`)}<h1>${t("your_cart")}</h1></div>
      <div class="cart">
        <div>
          <div class="reveal">${lines.map((l, idx) => `<div class="cart-item">
              <a href="#/p/${l.p.id}"><img src="${esc(firstImg(l.p))}" alt=""></a>
              <div><h4>${esc(F(l.p, "name"))}</h4><div class="price"><b data-price="${l.p.price}">${price(l.p.price)}</b></div>${l.note ? `<p class="note">“${esc(l.note)}”</p>` : ""}<button class="remove" data-remove="${idx}">${t("remove")}</button></div>
              <div class="qty" dir="ltr"><button data-cq="-1" data-idx="${idx}">−</button><input value="${l.qty}" data-cqi="${idx}" type="number" min="1" aria-label="Quantity"><button data-cq="1" data-idx="${idx}">+</button></div>
            </div>`).join("")}</div>
          <form class="reveal" id="checkout" style="margin-top:34px" autocomplete="on">
            <p class="eyebrow">${t("almost")}</p><h2 class="h2" style="font-size:32px;margin-bottom:18px">${t("your_details")}</h2>
            <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:0 16px">
              <div class="field"><label for="c-name">${t("full_name")}</label><input id="c-name" required autocomplete="name"></div>
              <div class="field"><label for="c-phone">${t("phone")}</label><input id="c-phone" required type="tel" autocomplete="tel" dir="ltr"></div>
              <div class="field"><label for="c-country">${t("country")}</label><select id="c-country">${Object.entries(R).map(([k, r]) => `<option value="${k}" ${k === Currency.region ? "selected" : ""}>${r.flag} ${RN[k]}</option>`).join("")}</select></div>
              <div class="field"><label for="c-city">${t("city")}</label><input id="c-city" required autocomplete="address-level2"></div>
              <div class="field" style="grid-column:1/-1"><label for="c-address">${t("address")}</label><input id="c-address" autocomplete="street-address"></div>
              <div class="field"><label for="c-date">${t("event_date")}</label><input id="c-date" type="date"></div>
              <div class="field"><label for="c-occasion">${t("occasion")}</label><input id="c-occasion" placeholder="${t("occasion_ph")}"></div>
              <div class="field" style="grid-column:1/-1"><label for="c-notes">${t("notes")}</label><textarea id="c-notes" placeholder="${t("notes_ph")}"></textarea></div>
            </div>
          </form>
        </div>
        <aside class="summary reveal" style="--d:.1s">
          <h3>${t("summary")}</h3>
          ${lines.map(l => `<div class="sum-row"><span>${esc(F(l.p, "name"))} × ${l.qty}</span><span data-price="${l.p.price * l.qty}">${price(l.p.price * l.qty)}</span></div>`).join("")}
          <div class="sum-row total"><span>${t("total")}</span><span data-price="${total}">${price(total)}</span></div>
          <p class="fineprint">${t("delivery_note")}</p>
          <button class="btn btn-wa btn-block" style="margin-top:18px" form="checkout" type="submit">${waIcon}${t("send_wa")}</button>
        </aside>
      </div></div>`;
  }
  function bindCart() {
    $$("[data-remove]").forEach(b => b.onclick = () => { cart.splice(+b.dataset.remove, 1); saveCart(); render(); });
    $$("[data-cq]").forEach(b => b.onclick = () => { const i = cart[+b.dataset.idx]; i.qty = Math.max(1, i.qty + +b.dataset.cq); saveCart(); render(true); });
    $$("[data-cqi]").forEach(inp => inp.onchange = () => { cart[+inp.dataset.cqi].qty = Math.max(1, +inp.value || 1); saveCart(); render(true); });
    $("#c-country").onchange = e => Currency.setRegion(e.target.value);
    const draft = ls.get("tb_customer", {});
    ["name", "phone", "city", "address"].forEach(k => { const el = $("#c-" + k); if (el && draft[k]) el.value = draft[k]; });
    $("#checkout").onsubmit = async e => {
      e.preventDefault();
      const v = k => $("#c-" + k).value.trim();
      const regionKey = $("#c-country").value;
      const customer = { name: v("name"), phone: v("phone"), country: t("regions")[regionKey], city: v("city"), address: v("address"), date: v("date"), occasion: v("occasion"), notes: v("notes"), lang: I18N.lang };
      ls.set("tb_customer", { name: customer.name, phone: customer.phone, city: customer.city, address: customer.address });
      const { lines, total } = cartTotals();
      const cur = Currency.currency;
      const items = lines.map(l => ({ id: l.p.id, name: l.p.name, name_ar: l.p.name_ar || "", qty: l.qty, price_ils: l.p.price, note: l.note || "" }));
      const order = await DB.createOrder({ customer, items, total_ils: total, currency: cur, total_display: price(total) });
      const ref = order.id.slice(0, 6).toUpperCase();
      const msg = [
        t("wa_new", ref), "",
        ...lines.map(l => `• ${F(l.p, "name")} × ${l.qty} — ${price(l.p.price * l.qty)}${l.note ? `\n   ✎ ${l.note}` : ""}`),
        "", `*${t("wa_total")}: ${price(total)}*${cur !== "ILS" ? ` (₪${total.toFixed(2)})` : ""}`, "",
        `👤 ${customer.name}`, `📞 ${customer.phone}`, `📍 ${customer.country}, ${customer.city}${customer.address ? " — " + customer.address : ""}`,
        ...[customer.date && `📅 ${customer.date}`, customer.occasion && `🎉 ${customer.occasion}`, customer.notes && `📝 ${customer.notes}`].filter(Boolean)
      ].join("\n");
      sessionStorage.setItem("tb_last_msg", msg);
      cart = []; saveCart();
      openWhatsApp(msg);
      location.hash = "#/thanks/" + ref;
    };
  }
  function openWhatsApp(msg) {
    const url = `https://wa.me/${waNumber()}?text=${encodeURIComponent(msg)}`;
    const w = window.open(url, "_blank", "noopener");
    if (!w) location.href = url;
  }
  function viewThanks(ref) {
    const msg = sessionStorage.getItem("tb_last_msg") || "";
    return `<div class="wrap">${emptyBlock(t("thanks"), t("thanks_p", esc(ref)),
      `<div style="display:flex;gap:10px;justify-content:center;flex-wrap:wrap;margin-top:18px"><a class="btn btn-wa" target="_blank" rel="noopener" href="https://wa.me/${waNumber()}?text=${encodeURIComponent(msg)}">${t("open_wa")}</a><a class="btn btn-outline" href="#/">${t("keep_shopping")}</a></div>`)}</div>`;
  }
  const viewNotFound = () => `<div class="wrap">${emptyBlock(t("lost"), t("lost_p"))}</div>`;
  const viewLoading = () => `<div class="wrap section"><div class="grid">${Array.from({ length: 8 }, () => `<div><div class="skel" style="aspect-ratio:3/4"></div><div class="skel" style="height:14px;margin-top:12px;width:70%"></div></div>`).join("")}</div></div>`;

  /* ---------- chrome ---------- */
  function renderStatic() {
    $$("[data-i18n]").forEach(el => el.textContent = t(el.dataset.i18n));
    $$("[data-i18n-ph]").forEach(el => el.placeholder = t(el.dataset.i18nPh));
    $("#lang-btn").textContent = t("lang_switch");
  }
  function renderChrome() {
    renderStatic();
    const route = location.hash;
    $("#catnav").innerHTML = `<a href="#/" class="${route === "" || route === "#/" ? "active" : ""}">${t("all")}</a>` +
      state.categories.map(c => `<a href="#/c/${esc(c.slug)}" class="${route === "#/c/" + c.slug ? "active" : ""}">${esc(F(c, "name"))}</a>`).join("");
    $("#drawer-links").innerHTML = state.categories.map((c, i) => `<a href="#/c/${esc(c.slug)}"><img src="${esc(catCover(c, i))}" alt="">${esc(F(c, "name"))}</a>`).join("") + `<a href="#/wishlist">♡ ${t("wishlist")}</a><a href="#/cart">${t("cart")}</a>`;
    $("#footer-cats").innerHTML = state.categories.map(c => `<a href="#/c/${esc(c.slug)}">${esc(F(c, "name"))}</a>`).join("");
    const ann = S("announce").split("|");
    $("#announce").innerHTML = [...ann, ...ann].map(a => `<span>${esc(a.trim())}</span>`).join("");
    $("#footer-wa").href = `https://wa.me/${waNumber()}`;
    $("#year").textContent = new Date().getFullYear();
    $("#managed-by").textContent = I18N.isAr ? "تسنيم غمري" : CFG.MANAGED_BY;
    $("#rights-holder").textContent = CFG.RIGHTS_HOLDER;
    renderRegion();
  }
  function renderRegion() {
    const R = Currency.REGIONS, cur = Currency.region, RN = t("regions");
    $("#region-flag").textContent = R[cur].flag; $("#region-cur").textContent = R[cur].currency;
    $("#region-menu").innerHTML = Object.entries(R).map(([k, r]) => `<li><button role="option" aria-selected="${k === cur}" data-region="${k}">${r.flag} ${RN[k]}<small>${Currency.SYMBOLS[r.currency]} ${r.currency}</small></button></li>`).join("") +
      `<li class="region-note">${t("rates_note")}</li>`;
  }
  function repaintPrices() { $$("[data-price]").forEach(el => el.textContent = price(+el.dataset.price)); renderRegion(); }

  /* ---------- router ---------- */
  function render(keepScroll) {
    const h = decodeURIComponent(location.hash.replace(/^#\/?/, ""));
    const r = h.split("/")[0], a = h.split("/").slice(1).join("/");
    let html;
    if (!state.loaded) html = viewLoading();
    else if (!r) html = viewHome();
    else if (r === "categories") html = viewCategories();
    else if (r === "c") html = viewCategory(a);
    else if (r === "p") html = viewProduct(a);
    else if (r === "cart") html = viewCart();
    else if (r === "wishlist") html = viewWishlist();
    else if (r === "search") html = viewSearch(a);
    else if (r === "thanks") html = viewThanks(a);
    else html = viewNotFound();
    const y = scrollY;
    view.innerHTML = `<div class="page-enter">${html}</div>`;
    if (!r && state.loaded) setTimeout(() => bindFilters(state.products.slice(0, 12), "home"));
    if (state.loaded) renderChrome(); else renderStatic();
    if (keepScroll) { scrollTo(0, y); $$(".reveal", view).forEach(e => e.classList.add("in")); } else scrollTo(0, 0);
    const pr = r === "p" && prodById(a), ct = r === "c" && state.categories.find(c => c.slug === a);
    document.title = (pr ? F(pr, "name") + " — " : ct ? F(ct, "name") + " — " : "") + t("title_suffix");
    $("#drawer").classList.remove("open");
    requestAnimationFrame(() => FX.refresh());
  }

  /* ---------- events ---------- */
  document.addEventListener("click", e => {
    const add = e.target.closest("[data-add]");
    if (add) { e.preventDefault(); addToCart(add.dataset.add); return; }
    const w = e.target.closest("[data-wish]");
    if (w) { e.preventDefault(); const on = toggleWish(w.dataset.wish); $$(`[data-wish="${w.dataset.wish}"]`).forEach(b => b.classList.toggle("on", on)); toast(on ? t("wished") : t("unwished")); return; }
    const reg = e.target.closest("[data-region]");
    if (reg) { Currency.setRegion(reg.dataset.region); $("#region").classList.remove("open"); toast(t("prices_now", Currency.currency)); return; }
    if (e.target.closest("#region-btn")) { $("#region").classList.toggle("open"); return; }
    if (!e.target.closest("#region")) $("#region").classList.remove("open");
  });
  $("#lang-btn").onclick = () => I18N.setLang(I18N.isAr ? "en" : "ar");
  I18N.onChange(() => location.reload());
  $("#search-form").addEventListener("submit", e => { e.preventDefault(); const q = $("#search-input").value.trim(); if (q) location.hash = "#/search/" + encodeURIComponent(q); });
  $("#menu-btn").onclick = () => $("#drawer").classList.add("open");
  $("#drawer-close").onclick = () => $("#drawer").classList.remove("open");
  $("#drawer").onclick = e => { if (e.target.id === "drawer") $("#drawer").classList.remove("open"); };
  addEventListener("hashchange", () => render());
  Currency.onChange(repaintPrices);

  /* ---------- boot ---------- */
  render();
  updateCounts();
  (async () => {
    try {
      const [cats, prods, settings] = await Promise.all([DB.listCategories(), DB.listProducts(), DB.getSettings().catch(() => ({}))]);
      state.categories = cats || []; state.products = prods || []; state.settings = settings || {};
    } catch (err) { console.error(err); toast(t("load_fail")); }
    state.loaded = true;
    updateCounts();
    render(true);
    window.scrollTo(0, 0);
  })();
})();
