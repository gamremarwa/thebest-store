/* ============================================================
   THE BEST — admin panel
   ============================================================ */
(function () {
  const CFG = window.STORE_CONFIG;
  // the admin panel is in English: keep it left-to-right even if the store was last viewed in Arabic
  document.documentElement.dir = "ltr"; document.documentElement.lang = "en";
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const content = $("#content");
  const S = { cats: [], products: [], orders: [] };
  const BADGES = ["New", "Best seller", "Limited", "Customizable"];
  const ILS = n => "₪" + (Number(n) || 0).toFixed(Number.isInteger(+n) ? 0 : 2);

  /* ---------- ui helpers ---------- */
  let tt;
  function toast(msg, err) { const t = $("#toast"); t.textContent = msg; t.className = "toast show" + (err ? " err" : ""); clearTimeout(tt); tt = setTimeout(() => t.className = "toast", 3000); }
  function modal(html) { $("#modal-card").innerHTML = html; $("#modal").hidden = false; return $("#modal-card"); }
  function closeModal() { $("#modal").hidden = true; $("#modal-card").innerHTML = ""; }
  $("#modal").addEventListener("click", e => { if (e.target.id === "modal") closeModal(); });
  function confirmBox(title, text, okLabel = "Delete") {
    return new Promise(res => {
      const m = modal(`<h2>${esc(title)}</h2><p>${text}</p><div class="modal-actions"><button class="btn" data-no>Cancel</button><button class="btn danger" data-yes>${esc(okLabel)}</button></div>`);
      m.querySelector("[data-no]").onclick = () => { closeModal(); res(false); };
      m.querySelector("[data-yes]").onclick = () => { closeModal(); res(true); };
    });
  }
  const cleanName = f => f.replace(/\.[^.]+$/, "").replace(/[_\-]+/g, " ").replace(/\b(img|image|dsc|photo|whatsapp image)\b/gi, "").replace(/\d{4,}/g, "").replace(/\s+/g, " ").trim().replace(/^./, c => c.toUpperCase());
  const catName = id => (S.cats.find(c => c.id === id) || {}).name || "—";
  async function reload(what = ["cats", "products"]) {
    if (what.includes("cats")) S.cats = await DB.listCategories();
    if (what.includes("products")) S.products = await DB.listProducts({ includeHidden: true });
    if (what.includes("orders")) { S.orders = await DB.listOrders(); }
  }
  function dropzone(el, onFiles) {
    const input = el.querySelector("input[type=file]");
    input.onchange = () => { onFiles([...input.files]); input.value = ""; };
    ["dragenter", "dragover"].forEach(ev => el.addEventListener(ev, e => { e.preventDefault(); el.classList.add("over"); }));
    ["dragleave", "drop"].forEach(ev => el.addEventListener(ev, e => { e.preventDefault(); el.classList.remove("over"); }));
    el.addEventListener("drop", e => onFiles([...e.dataTransfer.files].filter(f => f.type.startsWith("image/"))));
  }
  const dropHTML = (multi, label, sub, compact) => `<label class="drop ${compact ? "compact" : ""}"><input type="file" accept="image/*" ${multi ? "multiple" : ""}><svg viewBox="0 0 24 24"><path d="M12 16V4M7 9l5-5 5 5"/><path d="M4 16v3a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-3"/></svg><b>${label}</b><span>${sub}</span></label>`;
  async function pool(items, n, fn) {
    let i = 0;
    await Promise.all(Array.from({ length: Math.min(n, items.length) }, async () => { while (i < items.length) { const k = i++; await fn(items[k], k); } }));
  }
  function catOptions(sel, withNew) {
    return S.cats.map(c => `<option value="${c.id}" ${c.id === sel ? "selected" : ""}>${esc(c.name)}</option>`).join("") + (withNew ? `<option value="__new">+ Create new category…</option>` : "");
  }
  function quickCategory() {
    return new Promise(res => {
      const m = modal(`<h2>New category</h2><label class="fld"><span>Name</span><input id="qc-name" placeholder="e.g. Baby Shower"></label><label class="fld"><span>Short description <small>(optional)</small></span><input id="qc-desc"></label><div class="modal-actions"><button class="btn" data-no>Cancel</button><button class="btn primary" data-yes>Create</button></div>`);
      m.querySelector("#qc-name").focus();
      m.querySelector("[data-no]").onclick = () => { closeModal(); res(null); };
      m.querySelector("[data-yes]").onclick = async () => {
        const name = m.querySelector("#qc-name").value.trim(); if (!name) return;
        try { const c = await DB.saveCategory({ name, description: m.querySelector("#qc-desc").value.trim(), slug: I18N.hasArabic(name) ? "cat-" + Date.now().toString(36) : undefined }); await reload(["cats"]); closeModal(); toast("Category created"); res(c); }
        catch (e) { toast(e.message, true); }
      };
    });
  }
  function bindCatSelect(sel) {
    sel.addEventListener("change", async () => {
      if (sel.value !== "__new") return;
      const c = await quickCategory();
      sel.innerHTML = catOptions(c ? c.id : (S.cats[0] || {}).id, true);
    });
  }

  /* ================= DASHBOARD ================= */
  async function pageDashboard() {
    await reload(["cats", "products", "orders"]);
    const active = S.products.filter(p => p.is_active).length;
    const newOrders = S.orders.filter(o => o.status === "new").length;
    content.innerHTML = `
      <div class="stats">
        <div class="stat"><b>${S.products.length}</b><span>products (${active} visible)</span></div>
        <div class="stat"><b>${S.cats.length}</b><span>categories</span></div>
        <div class="stat"><b>${S.orders.length}</b><span>orders</span></div>
        <div class="stat"><b>${newOrders}</b><span>new orders to confirm</span></div>
      </div>
      <div class="modes">
        <a class="mode-card" href="#add/bulk"><div class="ic"><svg viewBox="0 0 24 24"><rect x="3" y="3" width="8" height="8" rx="2"/><rect x="13" y="3" width="8" height="8" rx="2"/><rect x="3" y="13" width="8" height="8" rx="2"/><rect x="13" y="13" width="8" height="8" rx="2"/></svg></div><h3>Upload many photos</h3><p>Pick a category, drop in a batch of photos — each photo becomes its own product.</p></a>
        <a class="mode-card" href="#add/single"><div class="ic"><svg viewBox="0 0 24 24"><rect x="4" y="3" width="16" height="18" rx="2"/><path d="M8 15l3-3 2 2 3-3"/><circle cx="9" cy="8" r="1.5"/></svg></div><h3>Add one product</h3><p>One product with several photos, a full description and options.</p></a>
      </div>
      <div class="card"><h2>Latest orders</h2><p class="sub">Orders also arrive on WhatsApp.</p>
        ${S.orders.slice(0, 5).map(orderHTML).join("") || `<div class="empty"><p class="big">No orders yet</p></div>`}
        ${S.orders.length > 5 ? `<a class="btn" href="#orders">See all orders</a>` : ""}
      </div>`;
    bindOrders();
  }

  /* ================= ADD PRODUCTS ================= */
  function pageAdd(mode) {
    mode = mode === "single" ? "single" : "bulk";
    const preCat = new URLSearchParams(location.hash.split("?")[1] || "").get("cat");
    content.innerHTML = `
      <div class="modes">
        <a class="mode-card ${mode === "bulk" ? "on" : ""}" href="#add/bulk${preCat ? "?cat=" + preCat : ""}"><div class="ic"><svg viewBox="0 0 24 24"><rect x="3" y="3" width="8" height="8" rx="2"/><rect x="13" y="3" width="8" height="8" rx="2"/><rect x="3" y="13" width="8" height="8" rx="2"/><rect x="13" y="13" width="8" height="8" rx="2"/></svg></div><h3>Many photos → many products</h3><p>Each photo becomes a separate product in the same category.</p></a>
        <a class="mode-card ${mode === "single" ? "on" : ""}" href="#add/single${preCat ? "?cat=" + preCat : ""}"><div class="ic"><svg viewBox="0 0 24 24"><rect x="4" y="3" width="16" height="18" rx="2"/><path d="M8 15l3-3 2 2 3-3"/><circle cx="9" cy="8" r="1.5"/></svg></div><h3>One product, many photos</h3><p>A single product with a gallery of photos.</p></a>
      </div>
      <div id="add-body"></div>`;
    if (mode === "bulk") bulkUI(preCat); else productForm(null, preCat);
  }

  function bulkUI(preCat) {
    const items = [];  // {file, url, name, price, compare, status}
    const body = $("#add-body");
    body.innerHTML = `
      <div class="card">
        <h2><span class="stepnum">1</span>Choose the category</h2><p class="sub">All photos in this batch go into this category.</p>
        <select id="b-cat" style="max-width:420px">${catOptions(preCat || (S.cats[0] || {}).id, true)}</select>
      </div>
      <div class="card">
        <h2><span class="stepnum">2</span>Drop your photos</h2><p class="sub">Select as many as you like — you can add more at any time.</p>
        <div id="b-drop">${dropHTML(true, "Drag photos here or click to choose", "JPG, PNG, WEBP or HEIC-converted · resized automatically")}</div>
        <div class="apply-all" id="b-apply" hidden>
          <h4>Fill details for all photos at once <small style="font-weight:400;color:var(--muted)">(optional — you can edit each one below)</small></h4>
          <div class="row">
            <label class="fld"><span>Base name</span><input id="a-name" placeholder="e.g. Wedding favor"></label>
            <label class="fld"><span>Price (₪)</span><input id="a-price" type="number" min="0" step="0.5" placeholder="25"></label>
            <label class="fld"><span>Old price (₪) <small>for a sale</small></span><input id="a-compare" type="number" min="0" step="0.5"></label>
            <label class="fld"><span>&nbsp;</span><button class="btn" id="a-go" type="button">Apply to all</button></label>
          </div>
          <label class="check"><input type="checkbox" id="a-number" checked> Number the names (Wedding favor 1, 2, 3…)</label>
          <label class="fld" style="margin-top:12px"><span>Description for all</span><textarea id="a-desc" placeholder="Handmade with care…"></textarea></label>
          <div style="display:flex;gap:16px;flex-wrap:wrap">${BADGES.map(b => `<label class="check"><input type="checkbox" data-abadge="${b}"> ${b}</label>`).join("")}<label class="check"><input type="checkbox" id="a-feat"> Show in best sellers</label></div>
        </div>
        <div class="bulk-grid" id="b-grid"></div>
      </div>
      <div class="sticky-actions" id="b-actions" hidden>
        <span class="info" id="b-info"></span>
        <button class="btn" id="b-clear" type="button">Clear all</button>
        <button class="btn primary" id="b-publish" type="button">Publish</button>
      </div>`;
    bindCatSelect($("#b-cat"));

    const grid = $("#b-grid");
    function draw() {
      grid.innerHTML = items.map((it, i) => `<div class="bulk-item ${it.status || ""}" data-i="${i}">
        <span class="num">${i + 1}</span>
        <button class="x" data-del="${i}" aria-label="Remove" ${it.status === "done" ? "hidden" : ""}>×</button>
        <img src="${it.url}" alt="">
        <div class="bi-body">
          <input data-f="name" value="${esc(it.name)}" placeholder="Product name">
          <div style="display:flex;gap:6px"><input data-f="price" type="number" min="0" step="0.5" value="${esc(it.price)}" placeholder="Price ₪"><input data-f="compare" type="number" min="0" step="0.5" value="${esc(it.compare)}" placeholder="Old ₪"></div>
        </div></div>`).join("");
      const pending = items.filter(i => i.status !== "done").length;
      $("#b-apply").hidden = !items.length;
      $("#b-actions").hidden = !items.length;
      $("#b-info").textContent = `${items.length} photo${items.length === 1 ? "" : "s"} → ${pending} product${pending === 1 ? "" : "s"} to publish in “${catName($("#b-cat").value)}”`;
      $("#b-publish").textContent = `Publish ${pending} product${pending === 1 ? "" : "s"}`;
      $("#b-publish").disabled = !pending;
    }
    grid.addEventListener("input", e => { const f = e.target.dataset.f; if (!f) return; items[+e.target.closest("[data-i]").dataset.i][f] = e.target.value; });
    grid.addEventListener("click", e => { const d = e.target.closest("[data-del]"); if (d) { URL.revokeObjectURL(items[+d.dataset.del].url); items.splice(+d.dataset.del, 1); draw(); } });
    $("#b-cat").addEventListener("change", draw);
    dropzone($("#b-drop .drop"), files => {
      files.forEach(f => items.push({ file: f, url: URL.createObjectURL(f), name: cleanName(f.name) || "", price: $("#a-price").value || "", compare: $("#a-compare").value || "" }));
      draw(); toast(`${files.length} photo${files.length === 1 ? "" : "s"} added`);
    });
    $("#a-go").onclick = () => {
      const base = $("#a-name").value.trim(), pr = $("#a-price").value, cp = $("#a-compare").value, num = $("#a-number").checked;
      let k = 0;
      items.forEach(it => { if (it.status === "done") return; k++; if (base) it.name = num ? `${base} ${k}` : base; if (pr !== "") it.price = pr; if (cp !== "") it.compare = cp; });
      draw(); toast("Applied to all photos");
    };
    $("#b-clear").onclick = () => { items.splice(0).forEach(i => URL.revokeObjectURL(i.url)); draw(); };
    $("#b-publish").onclick = async () => {
      const cat = $("#b-cat").value;
      if (!cat || cat === "__new") return toast("Choose a category first", true);
      const todo = items.filter(i => i.status !== "done");
      const missing = todo.filter(i => !i.name.trim() || i.price === "");
      if (missing.length) return toast(`${missing.length} product${missing.length > 1 ? "s need" : " needs"} a name and price`, true);
      const desc = $("#a-desc").value.trim();
      const badges = $$("[data-abadge]:checked").map(c => c.dataset.abadge);
      const featured = $("#a-feat").checked;
      const btn = $("#b-publish"); btn.disabled = true;
      $("#b-actions").insertAdjacentHTML("afterbegin", `<div style="flex-basis:100%"><div class="progress"><i id="b-prog"></i></div></div>`);
      let done = 0, failed = 0;
      await pool(todo, 3, async (it) => {
        try {
          const url = await DB.uploadImage(it.file);
          await DB.saveProduct({ category_id: cat, name: it.name.trim(), description: desc, price: +it.price, compare_price: it.compare ? +it.compare : null, images: [url], badges, is_active: true, featured, created_at: new Date(Date.now() - done).toISOString() });
          it.status = "done";
        } catch (e) { it.status = "fail"; failed++; console.error(e); }
        done++;
        $("#b-prog").style.width = (done / todo.length * 100) + "%";
        $("#b-info").textContent = `Uploading ${done} / ${todo.length}…`;
      });
      $("#b-prog")?.parentElement.parentElement.remove();
      draw(); await reload();
      if (failed) toast(`${todo.length - failed} published, ${failed} failed — try again`, true);
      else {
        toast(`🎉 ${todo.length} products published`);
        const m = modal(`<h2>Done! ${todo.length} products are live 🎉</h2><p>They're now in <b>${esc(catName(cat))}</b>.</p><div class="modal-actions"><button class="btn" data-more>Upload more</button><a class="btn" href="#products">See products</a><a class="btn primary" target="_blank" href="index.html#/c/${esc((S.cats.find(c => c.id === cat) || {}).slug)}">View in store ↗</a></div>`);
        m.querySelector("[data-more]").onclick = () => { closeModal(); items.splice(0); draw(); };
        m.querySelectorAll("a").forEach(a => a.addEventListener("click", closeModal));
      }
    };
    draw();
  }

  /* ---------- single product form (add + edit) ---------- */
  function productForm(p, preCat) {
    const editing = !!p;
    p = p || { name: "", description: "", price: "", compare_price: "", images: [], badges: [], is_active: true, featured: false, category_id: preCat || (S.cats[0] || {}).id };
    const imgs = (p.images || []).map(url => ({ url }));   // {url} existing, {file, url} new
    const target = editing ? content : $("#add-body");
    target.innerHTML = `
      <form id="pf">
        <div class="card">
          <h2>Photos</h2><p class="sub">Add as many photos as you like. Drag to reorder — the first photo is the cover.</p>
          <div id="pf-drop">${dropHTML(true, "Drag photos here or click to choose", "You can select several at once", true)}</div>
          <div class="img-list" id="pf-imgs"></div>
          <p class="hint">Tip: tap ★ to make a photo the cover.</p>
        </div>
        <div class="card">
          <h2>Details</h2><p class="sub">Prices are in shekels (₪). Customers see them converted to their currency automatically.</p>
          <label class="fld"><span>Product name *</span><input id="pf-name" required value="${esc(p.name)}" placeholder="e.g. Lace ribbon wedding favor"></label>
          <div class="row">
            <label class="fld"><span>Category *</span><select id="pf-cat">${catOptions(p.category_id, true)}</select></label>
            <label class="fld"><span>Price (₪) *</span><input id="pf-price" type="number" min="0" step="0.5" required value="${esc(p.price)}"></label>
            <label class="fld"><span>Old price (₪) <small>optional, shows a sale</small></span><input id="pf-compare" type="number" min="0" step="0.5" value="${esc(p.compare_price ?? "")}"></label>
          </div>
          <label class="fld"><span>Description</span><textarea id="pf-desc" rows="5" placeholder="Materials, size, what's included, customisation options…">${esc(p.description)}</textarea></label>
          <div class="ar-box">
            <div class="ar-head"><b>العربي</b><span>Filled in automatically when you save. You can write in English or Arabic — the other language is translated for you. Edit here if you want different wording.</span><button type="button" class="btn sm" id="pf-tr">Translate now</button></div>
            <label class="fld"><span>اسم المنتج</span><input id="pf-name-ar" dir="rtl" value="${esc(p.name_ar || "")}" placeholder="بيترجم تلقائياً"></label>
            <label class="fld"><span>الوصف</span><textarea id="pf-desc-ar" dir="rtl" rows="4" placeholder="بيترجم تلقائياً">${esc(p.description_ar || "")}</textarea></label>
          </div>
          <div style="display:flex;gap:16px;flex-wrap:wrap;margin-bottom:10px">${BADGES.map(b => `<label class="check"><input type="checkbox" data-badge="${b}" ${(p.badges || []).includes(b) ? "checked" : ""}> ${b}</label>`).join("")}</div>
          <div style="display:flex;gap:16px;flex-wrap:wrap">
            <label class="check"><input type="checkbox" id="pf-active" ${p.is_active ? "checked" : ""}> Visible in store</label>
            <label class="check"><input type="checkbox" id="pf-feat" ${p.featured ? "checked" : ""}> Show in best sellers</label>
          </div>
        </div>
        <div class="sticky-actions">
          <span class="info" id="pf-info"></span>
          ${editing ? `<button class="btn danger" type="button" id="pf-del">Delete</button><a class="btn" href="#products">Cancel</a>` : ""}
          <button class="btn primary" type="submit" id="pf-save">${editing ? "Save changes" : "Publish product"}</button>
        </div>
      </form>`;
    bindCatSelect($("#pf-cat"));
    const list = $("#pf-imgs");
    let dragFrom = null;
    function draw() {
      list.innerHTML = imgs.map((im, i) => `<div class="img-tile ${i === 0 ? "cover" : ""}" draggable="true" data-i="${i}">
        <img src="${esc(im.url)}" alt=""><div class="tools">${i ? `<button type="button" data-cover="${i}" title="Make cover">★</button>` : ""}<button type="button" data-rm="${i}" title="Remove">×</button></div>${im.busy ? `<div class="loading">Uploading…</div>` : ""}</div>`).join("");
      $("#pf-info").textContent = imgs.length ? `${imgs.length} photo${imgs.length > 1 ? "s" : ""}` : "No photos yet";
    }
    list.addEventListener("click", e => {
      const c = e.target.closest("[data-cover]"), r = e.target.closest("[data-rm]");
      if (c) { const [m] = imgs.splice(+c.dataset.cover, 1); imgs.unshift(m); draw(); }
      if (r) { imgs.splice(+r.dataset.rm, 1); draw(); }
    });
    list.addEventListener("dragstart", e => { const t = e.target.closest(".img-tile"); if (!t) return; dragFrom = +t.dataset.i; t.classList.add("dragging"); });
    list.addEventListener("dragend", () => { dragFrom = null; draw(); });
    list.addEventListener("dragover", e => { e.preventDefault(); $$(".img-tile", list).forEach(x => x.classList.remove("over")); e.target.closest(".img-tile")?.classList.add("over"); });
    list.addEventListener("drop", e => {
      e.preventDefault(); e.stopPropagation();
      const t = e.target.closest(".img-tile"); if (!t || dragFrom == null) return;
      const to = +t.dataset.i; const [m] = imgs.splice(dragFrom, 1); imgs.splice(to, 0, m); dragFrom = null; draw();
    });
    dropzone($("#pf-drop .drop"), files => { files.forEach(f => imgs.push({ file: f, url: URL.createObjectURL(f) })); draw(); });

    // if the English text is edited and the Arabic wasn't touched, re-translate it on save
    const orig = { name: p.name || "", description: p.description || "", name_ar: p.name_ar || "", description_ar: p.description_ar || "" };
    function translationFields() {
      const r = { name: $("#pf-name").value.trim(), description: $("#pf-desc").value.trim(), name_ar: $("#pf-name-ar").value.trim(), description_ar: $("#pf-desc-ar").value.trim() };
      if (r.name !== orig.name && r.name_ar === orig.name_ar) r.name_ar = "";
      if (r.description !== orig.description && r.description_ar === orig.description_ar) r.description_ar = "";
      return r;
    }
    $("#pf-tr").onclick = async e => {
      e.target.disabled = true; e.target.textContent = "Translating…";
      const r = await I18N.fillTranslations(translationFields());
      $("#pf-name").value = r.name || ""; $("#pf-desc").value = r.description || "";
      $("#pf-name-ar").value = r.name_ar || ""; $("#pf-desc-ar").value = r.description_ar || "";
      Object.assign(orig, r);
      e.target.disabled = false; e.target.textContent = "Translate now";
    };

    if (editing) $("#pf-del").onclick = async () => {
      if (await confirmBox("Delete this product?", `“${esc(p.name)}” will be removed from the store.`)) { await DB.deleteProducts([p.id]); toast("Product deleted"); location.hash = "#products"; }
    };
    $("#pf").onsubmit = async e => {
      e.preventDefault();
      const cat = $("#pf-cat").value;
      if (!cat || cat === "__new") return toast("Choose a category", true);
      if (!imgs.length) return toast("Add at least one photo", true);
      const btn = $("#pf-save"); btn.disabled = true; btn.textContent = "Saving…";
      try {
        for (const im of imgs) if (im.file && !im.uploaded) { im.busy = true; draw(); im.url = await DB.uploadImage(im.file); im.uploaded = true; im.busy = false; }
        draw();
        const row = {
          ...(editing ? { id: p.id, created_at: p.created_at } : {}),
          category_id: cat, ...translationFields(),
          price: +$("#pf-price").value || 0, compare_price: $("#pf-compare").value ? +$("#pf-compare").value : null,
          images: imgs.map(i => i.url), badges: $$("[data-badge]:checked").map(c => c.dataset.badge),
          is_active: $("#pf-active").checked, featured: $("#pf-feat").checked
        };
        const saved = await DB.saveProduct(row);
        await reload();
        toast(editing ? "Changes saved" : "Product published 🎉");
        if (editing) location.hash = "#products";
        else {
          const m = modal(`<h2>“${esc(row.name)}” is live 🎉</h2><div class="modal-actions"><button class="btn" data-more>Add another</button><a class="btn primary" target="_blank" href="index.html#/p/${saved.id}">View in store ↗</a></div>`);
          m.querySelector("[data-more]").onclick = () => { closeModal(); productForm(null, cat); };
          m.querySelector("a").addEventListener("click", closeModal);
        }
      } catch (err) { toast(err.message, true); btn.disabled = false; btn.textContent = editing ? "Save changes" : "Publish product"; }
    };
    draw();
  }

  /* ================= PRODUCTS ================= */
  async function pageProducts() {
    await reload();
    const sel = new Set();
    let q = "", cat = "", vis = "";
    content.innerHTML = `
      <div class="toolbar">
        <input id="pl-q" type="search" placeholder="Search products…">
        <select id="pl-cat"><option value="">All categories</option>${catOptions("")}</select>
        <select id="pl-vis"><option value="">All</option><option value="on">Visible</option><option value="off">Hidden</option></select>
        <a class="btn primary" href="#add">+ Add products</a>
      </div>
      <div class="bulkbar" id="pl-bar" hidden>
        <b id="pl-n"></b>
        <select id="pl-move"><option value="">Move to…</option>${catOptions("")}</select>
        <button class="btn sm" data-bulk="show">Show</button>
        <button class="btn sm" data-bulk="hide">Hide</button>
        <button class="btn sm danger" data-bulk="delete">Delete</button>
        <button class="btn sm" data-bulk="none" style="margin-left:auto">Clear selection</button>
      </div>
      <div class="plist" id="pl"></div>`;
    function filtered() {
      return S.products.filter(p => (!cat || p.category_id === cat) && (!vis || (vis === "on") === !!p.is_active) && (!q || (p.name + " " + catName(p.category_id)).toLowerCase().includes(q)));
    }
    function draw() {
      const list = filtered();
      $("#pl").innerHTML = list.map(p => `<div class="pitem ${sel.has(p.id) ? "sel" : ""} ${p.is_active ? "" : "hidden"}">
          <input type="checkbox" class="selbox" data-sel="${p.id}" ${sel.has(p.id) ? "checked" : ""} aria-label="Select">
          <div class="tags">${p.featured ? `<span class="tag star">★</span>` : ""}${p.is_active ? "" : `<span class="tag off">Hidden</span>`}</div>
          <img src="${esc((p.images || [])[0] || "")}" alt="" loading="lazy">
          <div class="pb"><h4 title="${esc(p.name)}">${esc(p.name)}</h4>
            <div class="meta"><span>${esc(catName(p.category_id))}</span><b>${ILS(p.price)}</b></div>
            <div class="meta"><span>${(p.images || []).length} photo${(p.images || []).length === 1 ? "" : "s"}</span></div>
            <div class="acts"><a class="btn sm" href="#edit/${p.id}">Edit</a><button class="btn sm" data-toggle="${p.id}">${p.is_active ? "Hide" : "Show"}</button></div>
          </div></div>`).join("") || `<div class="empty" style="grid-column:1/-1"><p class="big">No products</p><p><a class="btn primary" href="#add">Add your first products</a></p></div>`;
      $("#pl-bar").hidden = !sel.size; $("#pl-n").textContent = `${sel.size} selected`;
    }
    $("#pl-q").oninput = e => { q = e.target.value.toLowerCase(); draw(); };
    $("#pl-cat").onchange = e => { cat = e.target.value; draw(); };
    $("#pl-vis").onchange = e => { vis = e.target.value; draw(); };
    $("#pl").addEventListener("change", e => { const s = e.target.dataset.sel; if (s) { e.target.checked ? sel.add(s) : sel.delete(s); draw(); } });
    $("#pl").addEventListener("click", async e => {
      const t = e.target.closest("[data-toggle]"); if (!t) return;
      const p = S.products.find(x => x.id === t.dataset.toggle);
      await DB.saveProduct({ ...p, is_active: !p.is_active }); p.is_active = !p.is_active; draw(); toast(p.is_active ? "Now visible" : "Hidden from store");
    });
    $("#pl-move").onchange = async e => {
      const to = e.target.value; if (!to) return;
      await DB.saveProducts(S.products.filter(p => sel.has(p.id)).map(p => ({ ...p, category_id: to })));
      toast(`Moved ${sel.size} to ${catName(to)}`); sel.clear(); await reload(); draw(); e.target.value = "";
    };
    $("#pl-bar").addEventListener("click", async e => {
      const b = e.target.closest("[data-bulk]"); if (!b) return;
      const act = b.dataset.bulk, ids = [...sel];
      if (act === "none") { sel.clear(); return draw(); }
      if (act === "delete") { if (!(await confirmBox(`Delete ${ids.length} products?`, "This cannot be undone."))) return; await DB.deleteProducts(ids); toast(`${ids.length} deleted`); }
      else { await DB.saveProducts(S.products.filter(p => sel.has(p.id)).map(p => ({ ...p, is_active: act === "show" }))); toast(`${ids.length} updated`); }
      sel.clear(); await reload(); draw();
    });
    draw();
  }

  async function pageEdit(id) {
    await reload();
    const p = S.products.find(x => x.id === id);
    if (!p) { content.innerHTML = `<div class="empty"><p class="big">Product not found</p></div>`; return; }
    productForm(p);
  }

  /* ================= CATEGORIES ================= */
  async function pageCategories() {
    await reload();
    content.innerHTML = `<div class="toolbar"><span class="grow" style="color:var(--muted);font-size:14px">Categories appear in the store menu in this order.</span><button class="btn primary" id="c-add">+ New category</button></div>
      <div class="card" id="c-list"></div>`;
    function draw() {
      $("#c-list").innerHTML = S.cats.map((c, i) => {
        const n = S.products.filter(p => p.category_id === c.id).length;
        const cover = c.cover || (S.products.find(p => p.category_id === c.id)?.images || [])[0] || "";
        return `<div class="cat-row"><img src="${esc(cover)}" alt=""><div><h4>${esc(c.name)}</h4><p>${n} product${n === 1 ? "" : "s"}${c.description ? " · " + esc(c.description) : ""}</p></div>
          <div class="acts"><button class="btn sm" data-up="${i}" ${i ? "" : "disabled"}>↑</button><button class="btn sm" data-down="${i}" ${i < S.cats.length - 1 ? "" : "disabled"}>↓</button>
          <a class="btn sm" href="#add/bulk?cat=${c.id}">+ Photos</a><button class="btn sm" data-edit="${c.id}">Edit</button><button class="btn sm danger" data-del="${c.id}">Delete</button></div></div>`;
      }).join("") || `<div class="empty"><p class="big">No categories yet</p></div>`;
    }
    async function swap(a, b) {
      const A = S.cats[a], B = S.cats[b];
      await DB.saveCategory({ ...A, sort: b }); await DB.saveCategory({ ...B, sort: a });
      S.cats.forEach((c, i) => { if (c !== A && c !== B && c.sort !== i) c.sort = i; });
      await reload(["cats"]); draw();
    }
    function edit(c) {
      c = c || { name: "", description: "", cover: "" };
      let coverFile = null;
      const m = modal(`<h2>${c.id ? "Edit category" : "New category"}</h2>
        <label class="fld"><span>Name *</span><input id="ce-name" value="${esc(c.name)}"></label>
        <label class="fld"><span>Description</span><input id="ce-desc" value="${esc(c.description || "")}"></label>
        <div class="row"><label class="fld"><span>الاسم بالعربي <small>(تلقائي)</small></span><input id="ce-name-ar" dir="rtl" value="${esc(c.name_ar || "")}" placeholder="بيترجم تلقائياً"></label>
        <label class="fld"><span>الوصف بالعربي <small>(تلقائي)</small></span><input id="ce-desc-ar" dir="rtl" value="${esc(c.description_ar || "")}" placeholder="بيترجم تلقائياً"></label></div>
        <div class="fld"><span>Cover photo <small>(optional — otherwise the first product photo is used)</small></span>
          <div style="display:flex;gap:12px;align-items:center"><img id="ce-prev" src="${esc(c.cover || "")}" style="width:80px;height:80px;border-radius:14px;object-fit:cover;background:var(--cream)" alt=""><div id="ce-drop" style="flex:1">${dropHTML(false, "Choose cover", "", true)}</div></div></div>
        <div class="modal-actions"><button class="btn" data-no>Cancel</button><button class="btn primary" data-yes>Save</button></div>`);
      dropzone(m.querySelector("#ce-drop .drop"), files => { coverFile = files[0]; if (coverFile) m.querySelector("#ce-prev").src = URL.createObjectURL(coverFile); });
      m.querySelector("[data-no]").onclick = closeModal;
      m.querySelector("[data-yes]").onclick = async e => {
        const name = m.querySelector("#ce-name").value.trim(); if (!name) return toast("Name is required", true);
        e.target.disabled = true; e.target.textContent = "Saving…";
        try {
          const cover = coverFile ? await DB.uploadImage(coverFile) : c.cover || null;
          const description = m.querySelector("#ce-desc").value.trim();
          let name_ar = m.querySelector("#ce-name-ar").value.trim(), description_ar = m.querySelector("#ce-desc-ar").value.trim();
          if (name !== (c.name || "") && name_ar === (c.name_ar || "")) name_ar = "";
          if (description !== (c.description || "") && description_ar === (c.description_ar || "")) description_ar = "";
          await DB.saveCategory({ ...c, name, description, name_ar, description_ar, cover, slug: c.slug || DB.slugify(I18N.hasArabic(name) ? "cat-" + Date.now().toString(36) : name) });
          closeModal(); toast("Category saved"); await reload(["cats"]); draw();
        } catch (err) { toast(err.message, true); e.target.disabled = false; e.target.textContent = "Save"; }
      };
    }
    $("#c-add").onclick = () => edit();
    $("#c-list").addEventListener("click", async e => {
      const t = e.target.closest("button"); if (!t) return;
      if (t.dataset.up) swap(+t.dataset.up, +t.dataset.up - 1);
      if (t.dataset.down) swap(+t.dataset.down, +t.dataset.down + 1);
      if (t.dataset.edit) edit(S.cats.find(c => c.id === t.dataset.edit));
      if (t.dataset.del) {
        const c = S.cats.find(x => x.id === t.dataset.del), n = S.products.filter(p => p.category_id === c.id).length;
        if (await confirmBox(`Delete “${c.name}”?`, n ? `<b>${n} product${n > 1 ? "s" : ""}</b> in this category will be deleted too.` : "This category is empty.")) {
          await DB.deleteCategory(c.id); toast("Category deleted"); await reload(); draw();
        }
      }
    });
    draw();
  }

  /* ================= ORDERS ================= */
  function orderHTML(o) {
    const c = o.customer || {};
    const phone = (c.phone || "").replace(/\D/g, "");
    return `<div class="order" data-id="${o.id}">
      <div class="order-head"><b>#${o.id.slice(0, 6).toUpperCase()}</b><span class="status ${o.status}">${o.status}</span><span class="when">${new Date(o.created_at).toLocaleString()}</span>
        <select data-status="${o.id}">${["new", "confirmed", "done", "cancelled"].map(s => `<option ${s === o.status ? "selected" : ""}>${s}</option>`).join("")}</select></div>
      <ul>${(o.items || []).map(i => `<li>${esc(i.name)} × ${i.qty} — ${ILS(i.price_ils * i.qty)}${i.note ? ` <i>(${esc(i.note)})</i>` : ""}</li>`).join("")}</ul>
      <div class="cust"><b>Total: ${ILS(o.total_ils)}${o.currency && o.currency !== "ILS" ? ` · customer saw ${esc(o.total_display)}` : ""}</b></div>
      <div class="cust" style="margin-top:6px"><span>👤 ${esc(c.name)}</span><span>📞 ${esc(c.phone)}</span><span>📍 ${esc([c.country, c.city, c.address].filter(Boolean).join(", "))}</span>${c.date ? `<span>📅 ${esc(c.date)}</span>` : ""}${c.occasion ? `<span>🎉 ${esc(c.occasion)}</span>` : ""}${c.notes ? `<span>📝 ${esc(c.notes)}</span>` : ""}</div>
      <div style="display:flex;gap:8px;margin-top:12px;flex-wrap:wrap">${phone ? `<a class="btn sm" target="_blank" rel="noopener" href="https://wa.me/${phone}">WhatsApp customer</a>` : ""}<button class="btn sm danger" data-odel="${o.id}">Delete</button></div>
    </div>`;
  }
  function bindOrders() {
    $$("[data-status]").forEach(s => s.onchange = async () => { await DB.updateOrder(s.dataset.status, { status: s.value }); const o = S.orders.find(x => x.id === s.dataset.status); if (o) o.status = s.value; s.closest(".order").querySelector(".status").className = "status " + s.value; s.closest(".order").querySelector(".status").textContent = s.value; toast("Status updated"); updatePill(); });
    $$("[data-odel]").forEach(b => b.onclick = async () => { if (await confirmBox("Delete this order?", "It will be removed from the list.")) { await DB.deleteOrder(b.dataset.odel); b.closest(".order").remove(); S.orders = S.orders.filter(o => o.id !== b.dataset.odel); updatePill(); } });
  }
  async function pageOrders() {
    await reload(["cats", "orders"]);
    let f = "";
    content.innerHTML = `<div class="toolbar"><select id="o-f" style="max-width:220px"><option value="">All orders</option><option>new</option><option>confirmed</option><option>done</option><option>cancelled</option></select></div><div id="o-list"></div>`;
    const draw = () => { $("#o-list").innerHTML = S.orders.filter(o => !f || o.status === f).map(orderHTML).join("") || `<div class="empty"><p class="big">No orders</p><p>Orders placed in the store show up here and on WhatsApp.</p></div>`; bindOrders(); };
    $("#o-f").onchange = e => { f = e.target.value; draw(); };
    draw(); updatePill();
  }
  function updatePill() { $("#orders-new").textContent = S.orders.filter(o => o.status === "new").length || ""; }

  /* ================= SETTINGS ================= */
  const TEXT_KEYS = [
    ["announce", "Announcement bar", "one message per line", true],
    ["hero_kicker", "Hero badge"], ["hero_line1", "Hero line 1"], ["hero_line2", "Hero handwritten word"], ["hero_line3", "Hero line 2 end"],
    ["hero_text", "Hero text", "", true]
  ];
  async function pageSettings() {
    const s = await DB.getSettings();
    const val = (k, lang) => s[lang === "ar" ? k + "_ar" : k] || I18N.dict[lang][k] || "";
    const show = (k, lang) => k === "announce" ? val(k, lang).split("|").join("\n") : val(k, lang);
    content.innerHTML = `
      <form class="card" id="st">
        <h2>Store settings</h2><p class="sub">Changes apply to the live store right away. Edit the English <b>or</b> the Arabic — if you change only one side, the other is translated automatically.</p>
        <label class="fld"><span>WhatsApp number for orders <small>international format, no + (e.g. 972593894439)</small></span><input id="s-wa" dir="ltr" value="${esc(s.whatsapp || CFG.WHATSAPP_NUMBER)}"></label>
        ${TEXT_KEYS.map(([k, label, hint, multi]) => `<div class="row">
          <label class="fld"><span>${label} <small>${hint || ""}</small></span>${multi ? `<textarea data-k="${k}">${esc(show(k, "en"))}</textarea>` : `<input data-k="${k}" value="${esc(show(k, "en"))}">`}</label>
          <label class="fld"><span>بالعربي</span>${multi ? `<textarea dir="rtl" data-k-ar="${k}">${esc(show(k, "ar"))}</textarea>` : `<input dir="rtl" data-k-ar="${k}" value="${esc(show(k, "ar"))}">`}</label>
        </div>`).join("")}
        <button class="btn primary" id="st-save">Save settings</button>
      </form>
      <div class="card"><h2>Currency</h2><p class="sub">Prices are entered in ₪ and converted with live exchange rates for Jordan (JD), USD ($) and Europe (€).</p>
        <p style="font-size:14px">Today: ₪100 = ${Currency.format(100, "JOD")} · ${Currency.format(100, "USD")} · ${Currency.format(100, "EUR")}</p></div>
      ${DB.mode === "demo" ? `<div class="card"><h2>Demo mode</h2><p class="sub">Data is saved only in this browser until Supabase is connected (see SETUP.md).</p><button class="btn danger" id="s-reset">Reset demo data</button></div>` : ""}`;
    const before = {};
    TEXT_KEYS.forEach(([k]) => { before[k] = $(`[data-k="${k}"]`).value; before[k + "_ar"] = $(`[data-k-ar="${k}"]`).value; });
    $("#st").onsubmit = async e => {
      e.preventDefault();
      const btn = $("#st-save"); btn.disabled = true; btn.textContent = "Saving & translating…";
      try {
        const out = { whatsapp: $("#s-wa").value.replace(/\D/g, "") };
        for (const [k] of TEXT_KEYS) {
          let en = $(`[data-k="${k}"]`).value.trim(), ar = $(`[data-k-ar="${k}"]`).value.trim();
          const enChanged = en !== before[k].trim(), arChanged = ar !== before[k + "_ar"].trim();
          if (enChanged && !arChanged) ar = await I18N.translate(en, "ar").catch(() => ar);
          if (arChanged && !enChanged) en = await I18N.translate(ar, "en").catch(() => en);
          if (k === "announce") { en = en.split("\n").map(x => x.trim()).filter(Boolean).join("|"); ar = ar.split("\n").map(x => x.trim()).filter(Boolean).join("|"); }
          out[k] = en; out[k + "_ar"] = ar;
        }
        await DB.saveSettings(out);
        toast("Settings saved"); pageSettings();
      } catch (err) { toast(err.message, true); btn.disabled = false; btn.textContent = "Save settings"; }
    };
    const r = $("#s-reset"); if (r) r.onclick = async () => { if (await confirmBox("Reset demo data?", "All demo products and orders in this browser will be replaced with samples.", "Reset")) { await DB.resetDemo(); toast("Demo data reset"); } };
  }

  /* ================= router & auth ================= */
  const TITLES = { dashboard: "Dashboard", add: "Add products", products: "Products", categories: "Categories", orders: "Orders", settings: "Settings", edit: "Edit product" };
  async function route() {
    const h = location.hash.replace(/^#/, "").split("?")[0];
    const [page, arg] = h.split("/");
    const p = TITLES[page] ? page : "dashboard";
    $("#page-title").textContent = TITLES[p];
    $$("[data-nav]").forEach(a => a.classList.toggle("on", a.dataset.nav === (p === "edit" ? "products" : p)));
    $("#side").classList.remove("open");
    content.innerHTML = `<div class="empty"><p class="big">Loading…</p></div>`;
    try {
      if (p === "dashboard") await pageDashboard();
      if (p === "add") { if (!S.cats.length) await reload(["cats"]); pageAdd(arg); }
      if (p === "products") await pageProducts();
      if (p === "edit") await pageEdit(arg);
      if (p === "categories") await pageCategories();
      if (p === "orders") await pageOrders();
      if (p === "settings") await pageSettings();
    } catch (err) {
      console.error(err);
      content.innerHTML = `<div class="card"><h2>Something went wrong</h2><p class="sub">${esc(err.message)}</p><p class="sub">If you just connected Supabase, make sure the migration ran and your email is in the <code>admins</code> table.</p></div>`;
    }
    window.scrollTo(0, 0);
  }

  async function showApp(user) {
    $("#login").hidden = true; $("#app").hidden = false;
    $("#who").textContent = user.email;
    $("#mode-badge").textContent = DB.mode === "demo" ? "● Demo mode (this browser only)" : "● Connected to Supabase";
    try { await reload(["cats", "orders"]); updatePill(); } catch (e) {}
    route();
  }
  function showLogin() {
    $("#app").hidden = true; $("#login").hidden = false;
    if (DB.mode === "demo") { $("#email-wrap").hidden = true; $("#login-mode-note").innerHTML = `Demo mode — password: <b>${esc(CFG.DEMO_ADMIN_PASSWORD)}</b>. Connect Supabase to go live.`; }
    else $("#login-email").required = true;
  }
  $("#login-form").onsubmit = async e => {
    e.preventDefault(); $("#login-err").textContent = "";
    try { await DB.signIn($("#login-email").value.trim(), $("#login-pass").value); showApp(await DB.getUser()); }
    catch (err) { $("#login-err").textContent = err.message; }
  };
  $("#logout").onclick = async () => { await DB.signOut(); showLogin(); };
  $("#side-toggle").onclick = () => $("#side").classList.toggle("open");
  addEventListener("hashchange", () => { if (!$("#app").hidden) route(); });

  (async () => { const u = await DB.getUser(); u ? showApp(u) : showLogin(); })();
})();
