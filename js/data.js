/* ============================================================
   Data layer: Supabase when configured, otherwise a local DEMO
   store kept in IndexedDB (this browser only).
   ============================================================ */
(function () {
  const CFG = window.STORE_CONFIG;
  const useSupabase = !!(CFG.SUPABASE_URL && CFG.SUPABASE_ANON_KEY && window.supabase);
  const sb = useSupabase ? window.supabase.createClient(CFG.SUPABASE_URL, CFG.SUPABASE_ANON_KEY) : null;

  const uid = () => (crypto.randomUUID ? crypto.randomUUID() : "id-" + Date.now().toString(36) + Math.random().toString(36).slice(2));
  const slugify = s => (s || "").toString().toLowerCase().trim().replace(/[^a-z0-9؀-ۿ]+/g, "-").replace(/^-+|-+$/g, "") || uid().slice(0, 8);

  /* ---------- image helpers ---------- */
  function compressImage(file, maxSide = 1600, quality = 0.85) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const url = URL.createObjectURL(file);
      img.onload = () => {
        let { width: w, height: h } = img;
        const scale = Math.min(1, maxSide / Math.max(w, h));
        w = Math.round(w * scale); h = Math.round(h * scale);
        const c = document.createElement("canvas");
        c.width = w; c.height = h;
        c.getContext("2d").drawImage(img, 0, 0, w, h);
        URL.revokeObjectURL(url);
        c.toBlob(b => b ? resolve(b) : reject(new Error("Compression failed")), "image/webp", quality);
      };
      img.onerror = () => { URL.revokeObjectURL(url); reject(new Error("Not an image: " + file.name)); };
      img.src = url;
    });
  }
  const blobToDataURL = b => new Promise(r => { const fr = new FileReader(); fr.onload = () => r(fr.result); fr.readAsDataURL(b); });

  /* ---------- placeholder art for demo products ---------- */
  const PALETTES = [
    ["#f3e6d6", "#b07a4f", "#5a3825"], ["#efe1cf", "#c8963e", "#3b2418"],
    ["#f6ede2", "#9c6b4a", "#4a2c1d"], ["#ead7c3", "#7b4f35", "#2e1b12"],
    ["#f8efe4", "#d0a072", "#6b4430"]
  ];
  function placeholder(seed, kind) {
    const p = PALETTES[seed % PALETTES.length];
    const shapes = {
      box: `<rect x="150" y="230" width="300" height="230" rx="10" fill="${p[1]}"/><rect x="130" y="190" width="340" height="60" rx="10" fill="${p[2]}"/><rect x="285" y="190" width="30" height="270" fill="${p[0]}" opacity=".85"/><path d="M300 190 C 250 120, 190 150, 230 190 Z M300 190 C 350 120, 410 150, 370 190 Z" fill="none" stroke="${p[0]}" stroke-width="14"/>`,
      jar: `<rect x="200" y="200" width="200" height="270" rx="40" fill="${p[1]}"/><rect x="215" y="165" width="170" height="45" rx="10" fill="${p[2]}"/><path d="M200 300 h200" stroke="${p[0]}" stroke-width="10" stroke-dasharray="14 10"/><circle cx="300" cy="380" r="38" fill="${p[0]}"/>`,
      heart: `<path d="M300 470 C 120 350, 140 200, 230 200 C 270 200, 300 230, 300 260 C 300 230, 330 200, 370 200 C 460 200, 480 350, 300 470 Z" fill="${p[1]}"/><path d="M300 440 C 160 345, 175 230, 232 228" fill="none" stroke="${p[0]}" stroke-width="8" stroke-dasharray="12 9"/>`,
      candle: `<rect x="230" y="250" width="140" height="220" rx="14" fill="${p[1]}"/><path d="M300 250 v-30" stroke="${p[2]}" stroke-width="6"/><path d="M300 225 C 280 195, 295 170, 300 150 C 305 170, 320 195, 300 225 Z" fill="#e8a64a"/><rect x="230" y="330" width="140" height="40" fill="${p[0]}" opacity=".8"/>`,
      tag: `<path d="M180 220 h200 l80 120 l-80 120 h-200 z" fill="${p[1]}"/><circle cx="380" cy="340" r="16" fill="${p[0]}"/><path d="M380 340 C 470 300, 500 220, 450 170" fill="none" stroke="${p[2]}" stroke-width="5"/><path d="M215 300 h120 M215 340 h90 M215 380 h110" stroke="${p[0]}" stroke-width="10" stroke-linecap="round"/>`
    };
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 600"><defs><pattern id="d" width="24" height="24" patternUnits="userSpaceOnUse"><circle cx="2" cy="2" r="1.6" fill="${p[1]}" opacity=".25"/></pattern></defs><rect width="600" height="600" fill="${p[0]}"/><rect width="600" height="600" fill="url(#d)"/><circle cx="300" cy="330" r="210" fill="#fff" opacity=".35"/>${shapes[kind] || shapes.box}<path d="M40 560 C 180 520, 420 600, 560 540" fill="none" stroke="${p[2]}" stroke-width="3" stroke-dasharray="10 8" opacity=".5"/></svg>`;
    return "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg);
  }

  /* ---------- DEMO backend (IndexedDB) ---------- */
  const IDB = {
    db: null,
    open() {
      if (this.db) return Promise.resolve(this.db);
      return new Promise((res, rej) => {
        const r = indexedDB.open("thebest-demo", 1);
        r.onupgradeneeded = () => r.result.createObjectStore("kv");
        r.onsuccess = () => { this.db = r.result; res(this.db); };
        r.onerror = () => rej(r.error);
      });
    },
    async get(k) { const db = await this.open(); return new Promise(res => { const q = db.transaction("kv").objectStore("kv").get(k); q.onsuccess = () => res(q.result); q.onerror = () => res(undefined); }); },
    async set(k, v) { const db = await this.open(); return new Promise((res, rej) => { const t = db.transaction("kv", "readwrite"); t.objectStore("kv").put(v, k); t.oncomplete = res; t.onerror = () => rej(t.error); }); }
  };

  function seedData() {
    const cats = [
      { name: "Weddings & Engagements", name_ar: "أعراس وخطوبة", slug: "weddings", description: "Giveaways, favors and keepsakes for your big day", description_ar: "توزيعات وتذكارات ليومك الكبير", kind: "heart" },
      { name: "Newborns & Birthdays", name_ar: "مواليد وأعياد ميلاد", slug: "newborns-birthdays", description: "Sweet welcomes and birthday surprises", description_ar: "استقبال حلو للمولود ومفاجآت أعياد الميلاد", kind: "jar" },
      { name: "Ramadan, Eid & Graduation", name_ar: "رمضان والأعياد والتخرج", slug: "seasonal", description: "Festive pieces for every celebration", description_ar: "قطع احتفالية لكل مناسبة", kind: "candle" },
      { name: "Gift Boxes & Custom Gifts", name_ar: "بوكسات وهدايا مخصصة", slug: "gift-boxes", description: "Curated boxes made just for them", description_ar: "بوكسات مختارة ومعمولة خصيصاً إلهم", kind: "box" }
    ].map((c, i) => ({ id: uid(), name: c.name, name_ar: c.name_ar, slug: c.slug, description: c.description, description_ar: c.description_ar, cover: placeholder(i, c.kind), sort: i, created_at: new Date().toISOString() }));

    const names = {
      weddings: [["Lace Ribbon Favor", "توزيعة بشريطة دانتيل"], ["Mini Rose Jar", "مرطبان ورد صغير"], ["Engraved Wooden Tag", "تاغ خشبي محفور"], ["Pearl Thank-You Box", "بوكس شكر باللؤلؤ"], ["Bride's Keepsake Pouch", "صرة تذكار العروس"]],
      "newborns-birthdays": [["Baby Welcome Jar", "مرطبان أهلاً بالمولود"], ["Knitted Bear Favor", "توزيعة دبدوب كروشيه"], ["Birthday Candle Set", "طقم شموع عيد ميلاد"], ["Name Banner Tag", "تاغ باسم المولود"], ["Cloud Gift Bag", "كيس هدية غيمة"]],
      seasonal: [["Crescent Lantern Favor", "توزيعة فانوس وهلال"], ["Eid Sweets Box", "بوكس حلو العيد"], ["Graduation Cap Tag", "تاغ قبعة التخرج"], ["Date Gift Jar", "مرطبان تمر هدية"], ["Ramadan Candle", "شمعة رمضان"]],
      "gift-boxes": [["Coffee Lover Box", "بوكس محبي القهوة"], ["Self-Care Box", "بوكس العناية بالذات"], ["Handwritten Letter Box", "بوكس رسالة بخط اليد"], ["Mini Hamper", "سلة هدايا صغيرة"], ["Custom Name Box", "بوكس بالاسم"]]
    };
    const kinds = ["heart", "jar", "tag", "box", "candle"];
    const products = [];
    let n = 0;
    cats.forEach(c => {
      names[c.slug].forEach(([name, name_ar], j) => {
        n++;
        products.push({
          id: uid(), category_id: c.id, name, name_ar,
          description: "Handmade with care, piece by piece. Every item can be customised with names, dates and colours — just add a note with your order.",
          description_ar: "مصنوعة بعناية، قطعة قطعة. كل قطعة ممكن نخصصها بالأسماء والتواريخ والألوان — بس ضيف ملاحظة مع طلبك.",
          price: [12, 18, 25, 35, 45, 60, 8, 15][n % 8],
          compare_price: n % 4 === 0 ? [12, 18, 25, 35, 45, 60, 8, 15][n % 8] + 10 : null,
          images: [placeholder(n, kinds[j % 5]), placeholder(n + 2, kinds[(j + 1) % 5]), placeholder(n + 3, kinds[(j + 3) % 5])],
          badges: n % 5 === 0 ? ["Best seller"] : n % 3 === 0 ? ["New"] : [],
          is_active: true, featured: n % 3 === 0, created_at: new Date(Date.now() - n * 3600e3).toISOString()
        });
      });
    });
    return { categories: cats, products, orders: [], settings: {} };
  }

  let demoState = null;
  async function demo() {
    if (!demoState) {
      demoState = await IDB.get("state");
      if (!demoState) { demoState = seedData(); await IDB.set("state", demoState); }
    }
    return demoState;
  }
  const saveDemo = () => IDB.set("state", demoState);

  /* ---------- public API ---------- */
  const sortCats = a => a.sort((x, y) => (x.sort ?? 0) - (y.sort ?? 0));
  const byNewest = a => a.sort((x, y) => (y.created_at || "").localeCompare(x.created_at || ""));
  function throwIf(error) { if (error) throw new Error(error.message || String(error)); }

  const DB = {
    mode: useSupabase ? "supabase" : "demo",
    uid, slugify, compressImage, placeholder,

    async listCategories() {
      if (sb) { const { data, error } = await sb.from("categories").select("*").order("sort"); throwIf(error); return data; }
      return sortCats([...(await demo()).categories]);
    },
    async saveCategory(cat) {
      const row = { ...cat };
      if (window.I18N && !row._skipTranslate) await I18N.fillTranslations(row);
      delete row._skipTranslate;
      if (!row.id) row.id = uid();
      if (!row.slug) row.slug = slugify(row.name);
      if (row.sort == null) row.sort = (await this.listCategories()).length;
      if (sb) { const { data, error } = await sb.from("categories").upsert(row).select().single(); throwIf(error); return data; }
      const s = await demo(); const i = s.categories.findIndex(c => c.id === row.id);
      row.created_at = row.created_at || new Date().toISOString();
      if (i >= 0) s.categories[i] = { ...s.categories[i], ...row }; else s.categories.push(row);
      await saveDemo(); return row;
    },
    async deleteCategory(id) {
      if (sb) { const { error } = await sb.from("categories").delete().eq("id", id); throwIf(error); return; }
      const s = await demo(); s.categories = s.categories.filter(c => c.id !== id);
      s.products = s.products.filter(p => p.category_id !== id); await saveDemo();
    },

    async listProducts({ categoryId, includeHidden = false } = {}) {
      if (sb) {
        let q = sb.from("products").select("*").order("created_at", { ascending: false });
        if (categoryId) q = q.eq("category_id", categoryId);
        if (!includeHidden) q = q.eq("is_active", true);
        const { data, error } = await q; throwIf(error); return data;
      }
      let list = [...(await demo()).products];
      if (categoryId) list = list.filter(p => p.category_id === categoryId);
      if (!includeHidden) list = list.filter(p => p.is_active);
      return byNewest(list);
    },
    async getProduct(id) {
      if (sb) { const { data, error } = await sb.from("products").select("*").eq("id", id).maybeSingle(); throwIf(error); return data; }
      return (await demo()).products.find(p => p.id === id) || null;
    },
    async saveProducts(rows) {
      rows = rows.map(r => ({ ...r, id: r.id || uid(), created_at: r.created_at || new Date().toISOString() }));
      if (window.I18N) {
        // translate only rows missing a side; same text shared across a bulk batch is translated once
        const memo = {};
        for (const r of rows) {
          if (r._skipTranslate) { delete r._skipTranslate; continue; }
          const key = JSON.stringify([r.name, r.description, r.name_ar, r.description_ar]);
          if (!memo[key]) memo[key] = await I18N.fillTranslations({ name: r.name, description: r.description, name_ar: r.name_ar, description_ar: r.description_ar });
          Object.assign(r, memo[key]);
        }
      }
      if (sb) { const { data, error } = await sb.from("products").upsert(rows).select(); throwIf(error); return data; }
      const s = await demo();
      rows.forEach(r => { const i = s.products.findIndex(p => p.id === r.id); if (i >= 0) s.products[i] = { ...s.products[i], ...r }; else s.products.push(r); });
      await saveDemo(); return rows;
    },
    async saveProduct(row) { return (await this.saveProducts([row]))[0]; },
    async deleteProducts(ids) {
      if (sb) { const { error } = await sb.from("products").delete().in("id", ids); throwIf(error); return; }
      const s = await demo(); s.products = s.products.filter(p => !ids.includes(p.id)); await saveDemo();
    },

    /* Upload one image (File/Blob). Returns a public URL. */
    async uploadImage(file) {
      const blob = await compressImage(file);
      if (sb) {
        const path = `${new Date().getFullYear()}/${uid()}.webp`;
        const { error } = await sb.storage.from(CFG.STORAGE_BUCKET).upload(path, blob, { contentType: "image/webp", cacheControl: "31536000" });
        throwIf(error);
        return sb.storage.from(CFG.STORAGE_BUCKET).getPublicUrl(path).data.publicUrl;
      }
      return blobToDataURL(await compressImage(file, 1000, 0.8));
    },

    async createOrder(order) {
      const row = { id: uid(), status: "new", created_at: new Date().toISOString(), ...order };
      if (sb) { const { error } = await sb.from("orders").insert(row); if (error) console.warn("Order not saved:", error.message); return row; }
      const s = await demo(); s.orders.unshift(row); await saveDemo(); return row;
    },
    async listOrders() {
      if (sb) { const { data, error } = await sb.from("orders").select("*").order("created_at", { ascending: false }); throwIf(error); return data; }
      return [...(await demo()).orders];
    },
    async updateOrder(id, patch) {
      if (sb) { const { error } = await sb.from("orders").update(patch).eq("id", id); throwIf(error); return; }
      const s = await demo(); const o = s.orders.find(x => x.id === id); if (o) Object.assign(o, patch); await saveDemo();
    },
    async deleteOrder(id) {
      if (sb) { const { error } = await sb.from("orders").delete().eq("id", id); throwIf(error); return; }
      const s = await demo(); s.orders = s.orders.filter(o => o.id !== id); await saveDemo();
    },

    async getSettings() {
      if (sb) { const { data } = await sb.from("settings").select("*"); const o = {}; (data || []).forEach(r => o[r.key] = r.value); return o; }
      return { ...((await demo()).settings || {}) };
    },
    async saveSettings(obj) {
      if (sb) { const rows = Object.entries(obj).map(([key, value]) => ({ key, value })); const { error } = await sb.from("settings").upsert(rows); throwIf(error); return; }
      const s = await demo(); s.settings = { ...(s.settings || {}), ...obj }; await saveDemo();
    },

    /* ---------- auth ---------- */
    async signIn(email, password) {
      if (sb) { const { error } = await sb.auth.signInWithPassword({ email, password }); throwIf(error); return true; }
      if (password !== CFG.DEMO_ADMIN_PASSWORD) throw new Error("Wrong password (demo password: " + CFG.DEMO_ADMIN_PASSWORD + ")");
      sessionStorage.setItem("tb_demo_admin", "1"); return true;
    },
    async signOut() { if (sb) await sb.auth.signOut(); sessionStorage.removeItem("tb_demo_admin"); },
    async getUser() {
      if (sb) { const { data } = await sb.auth.getSession(); return data.session ? data.session.user : null; }
      return sessionStorage.getItem("tb_demo_admin") ? { email: "demo@admin" } : null;
    },
    async resetDemo() { demoState = seedData(); await saveDemo(); }
  };

  window.DB = DB;
})();
