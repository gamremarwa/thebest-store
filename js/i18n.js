/* ============================================================
   Languages (English / Arabic) + automatic translation helper
   ============================================================ */
(function () {
  const KEY = "tb_lang";
  const DICT = {
    en: {
      tagline: "handmade with warmth",
      search_ph: "Search favors, boxes, candles…",
      all: "All", wishlist: "Wishlist", cart: "Cart", home: "Home", shop: "Shop", saved: "Saved",
      menu_title: "Shop by occasion",
      footer_text: "Handmade gifts and giveaways, stitched, wrapped and made with warmth for every occasion.",
      f_shop: "Shop", f_order: "Order", your_cart: "Your cart", order_wa: "Order on WhatsApp",
      managed_by: "Managed by", rights: "All rights reserved.",
      announce: "Handmade with love|Custom names & dates on every order|Order easily on WhatsApp|Gifts & giveaways for every occasion",
      hero_kicker: "Handmade, piece by piece", hero_line1: "Little gifts,", hero_line2: "big", hero_line3: "feelings.",
      hero_text: "Favors, giveaways and gift boxes stitched, wrapped and made by hand for weddings, newborns, birthdays and every season in between.",
      shop_collection: "Shop the collection", custom_order: "Custom order",
      custom_msg: "Hi The Best! I'd like to ask about a custom order.",
      stat_pieces: "handmade pieces", stat_occasions: "occasions", stat_love: "made with love",
      cap1: "for the bride", cap2: "sweet welcome", cap3: "made by hand",
      eb_occasion: "shop by occasion", h_every_moment: "Something for every moment", all_categories: "All categories →", explore: "Explore →",
      eb_loved: "most loved", h_best: "Best sellers",
      eb_easy: "ordering is easy", band_h: "Pick, personalise, and we'll stitch the rest.",
      band_p: "Every order is confirmed with you personally on WhatsApp — names, dates, colours and quantities, all exactly how you imagine them.",
      start_shopping: "Start shopping",
      s1h: "Choose your pieces", s1p: "Add favors and gifts to your cart.",
      s2h: "Add your details", s2p: "Names, event date, colours — anything special.",
      s3h: "Confirm on WhatsApp", s3p: "Your order is sent straight to us.",
      eb_fresh: "fresh from the workshop", h_new: "New in", see_all: "See everything →",
      pr1h: "Handmade", pr1p: "Every piece is made by hand, never mass-produced.",
      pr2h: "Personalised", pr2p: "Names, dates and colours on request.",
      pr3h: "Made on time", pr3p: "Tell us your event date and we plan around it.",
      pr4h: "Confirmed with you", pr4p: "We review every detail with you before we start.",
      f_all: "All", f_new: "New", f_best: "Best sellers", f_sale: "On sale",
      sort_new: "Newest", sort_low: "Price: low to high", sort_high: "Price: high to low",
      add_to_cart: "Add to cart", quick_add: "+ Add to cart", save_wish: "Save to wishlist",
      coming_soon: "Coming soon", coming_soon_p: "New handmade pieces are on the way.",
      nothing_here: "Nothing here yet", try_filter: "Try another filter.", back_shop: "Back to shop",
      categories: "Categories", h_shop_occasion: "Shop by occasion", cats_sub: "Handmade favors, giveaways and gifts for every celebration.",
      pieces: n => `${n} piece${n === 1 ? "" : "s"} →`, no_cats: "No categories yet", check_soon: "Check back soon.",
      search: "Search", results: n => `${n} result${n === 1 ? "" : "s"}`, no_match: "No matches", no_match_p: "Try another word, like “box” or “candle”.",
      default_desc: "Handmade with care. Message us for custom names, colours and quantities.",
      personal_label: "Personalisation (optional)", personal_ph: "Names, date, colours, wording…",
      order_now_wa: "Order this now on WhatsApp",
      perk1: "Handmade to order — every piece is unique", perk2: "Custom names, dates & colours available", perk3: "Details confirmed with you on WhatsApp",
      eb_also: "you may also love", more_from: n => `More from ${n}`, the_shop: "the shop",
      saved_title: "Saved for later", saved_count: n => `${n} piece${n === 1 ? "" : "s"} you love.`, nothing_saved: "Nothing saved yet", nothing_saved_p: "Tap the heart on any piece to keep it here.",
      cart_empty: "Your cart is empty", cart_empty_p: "Let's find something lovely.",
      remove: "Remove", almost: "almost there", your_details: "Your details",
      full_name: "Full name *", phone: "Phone / WhatsApp *", country: "Country", city: "City *", address: "Address",
      event_date: "Event / delivery date", occasion: "Occasion", occasion_ph: "Wedding, birthday…", notes: "Notes", notes_ph: "Colours, names, packaging…",
      summary: "Order summary", total: "Total", delivery_note: "Delivery is arranged and confirmed with you on WhatsApp.", send_wa: "Send order on WhatsApp",
      thanks: "Thank you! 🤎", thanks_p: ref => `Your order <b>#${ref}</b> is ready. If WhatsApp didn't open, tap the button below to send it — we'll confirm all the details with you there.`,
      open_wa: "Open WhatsApp", keep_shopping: "Keep shopping",
      lost: "Oops — lost thread", lost_p: "We couldn't find that page.",
      added: n => `Added <b>${n}</b> · <a href="#/cart">View cart</a>`, wished: "Saved to your wishlist ♡", unwished: "Removed from wishlist",
      prices_now: c => `Prices now in ${c}`, rates_note: "Prices update with live exchange rates.", load_fail: "Couldn't load the shop. Please refresh.",
      wa_hello: "Hello The Best! 👋\nI'd like to order:", wa_note: "Note", wa_link: "Link",
      wa_new: ref => `🛍️ *New order — The Best* (#${ref})`, wa_total: "Total",
      regions: { PS: "Palestine", JO: "Jordan", US: "United States / Intl", EU: "Europe" },
      title_suffix: "The Best — Handmade Gifts & Giveaways", lang_switch: "عربي"
    },
    ar: {
      tagline: "مصنوعة بدفا وحب",
      search_ph: "ابحث عن توزيعات، بوكسات، شموع…",
      all: "الكل", wishlist: "المفضلة", cart: "السلة", home: "الرئيسية", shop: "تسوق", saved: "المحفوظ",
      menu_title: "تسوق حسب المناسبة",
      footer_text: "هدايا وتوزيعات مصنوعة يدوياً، مخيطة ومغلفة بكل دفا لكل مناسبة.",
      f_shop: "تسوق", f_order: "الطلب", your_cart: "سلتك", order_wa: "اطلب عبر واتساب",
      managed_by: "بإدارة", rights: "جميع الحقوق محفوظة.",
      announce: "مصنوعة يدوياً بحب|أسماء وتواريخ حسب الطلب|اطلب بسهولة عبر واتساب|هدايا وتوزيعات لكل مناسبة",
      hero_kicker: "صناعة يدوية، قطعة قطعة", hero_line1: "هدايا صغيرة،", hero_line2: "ومشاعر", hero_line3: "كبيرة.",
      hero_text: "توزيعات وهدايا وبوكسات مخيطة ومغلفة يدوياً للأعراس والمواليد وأعياد الميلاد وكل المواسم.",
      shop_collection: "تسوق المجموعة", custom_order: "طلب خاص",
      custom_msg: "مرحبا The Best! حابة أسأل عن طلب خاص.",
      stat_pieces: "قطعة يدوية", stat_occasions: "مناسبات", stat_love: "مصنوعة بحب",
      cap1: "للعروس", cap2: "أهلاً بالمولود", cap3: "صنع يدوي",
      eb_occasion: "تسوق حسب المناسبة", h_every_moment: "لكل لحظة إشي حلو", all_categories: "كل الأقسام ←", explore: "استكشف ←",
      eb_loved: "الأكثر حباً", h_best: "الأكثر مبيعاً",
      eb_easy: "الطلب سهل", band_h: "اختار، خصّص، والباقي علينا.",
      band_p: "كل طلب بنأكده معك شخصياً على واتساب — الأسماء والتواريخ والألوان والكميات، تماماً متل ما بتتخيلها.",
      start_shopping: "ابدأ التسوق",
      s1h: "اختار قطعك", s1p: "ضيف التوزيعات والهدايا لسلتك.",
      s2h: "ضيف تفاصيلك", s2p: "أسماء، تاريخ المناسبة، ألوان — أي إشي مميز.",
      s3h: "أكّد على واتساب", s3p: "طلبك بيوصلنا مباشرة.",
      eb_fresh: "جديد من المشغل", h_new: "وصل حديثاً", see_all: "شوف الكل ←",
      pr1h: "صناعة يدوية", pr1p: "كل قطعة مصنوعة باليد، مش إنتاج جماعي.",
      pr2h: "مخصصة إلك", pr2p: "أسماء وتواريخ وألوان حسب طلبك.",
      pr3h: "بالوقت", pr3p: "احكيلنا تاريخ مناسبتك ومنرتب شغلنا عليه.",
      pr4h: "بنأكد معك", pr4p: "بنراجع كل التفاصيل معك قبل ما نبلش.",
      f_all: "الكل", f_new: "جديد", f_best: "الأكثر مبيعاً", f_sale: "عروض",
      sort_new: "الأحدث", sort_low: "السعر: من الأقل", sort_high: "السعر: من الأعلى",
      add_to_cart: "أضف للسلة", quick_add: "+ أضف للسلة", save_wish: "احفظ بالمفضلة",
      coming_soon: "قريباً", coming_soon_p: "قطع يدوية جديدة عالطريق.",
      nothing_here: "ما في إشي هون", try_filter: "جرّب فلتر تاني.", back_shop: "رجوع للمتجر",
      categories: "الأقسام", h_shop_occasion: "تسوق حسب المناسبة", cats_sub: "توزيعات وهدايا يدوية لكل احتفال.",
      pieces: n => `${n} قطعة ←`, no_cats: "ما في أقسام لسا", check_soon: "ارجع قريباً.",
      search: "بحث", results: n => `${n} نتيجة`, no_match: "ما في نتائج", no_match_p: "جرّب كلمة تانية، متل «بوكس» أو «شمعة».",
      default_desc: "مصنوعة بعناية. راسلنا لتخصيص الأسماء والألوان والكميات.",
      personal_label: "التخصيص (اختياري)", personal_ph: "أسماء، تاريخ، ألوان، عبارة…",
      order_now_wa: "اطلب هاي القطعة هلأ عبر واتساب",
      perk1: "تنصنع حسب الطلب — كل قطعة فريدة", perk2: "أسماء وتواريخ وألوان حسب طلبك", perk3: "منأكد التفاصيل معك على واتساب",
      eb_also: "ممكن يعجبك كمان", more_from: n => `المزيد من ${n}`, the_shop: "المتجر",
      saved_title: "محفوظ لبعدين", saved_count: n => `${n} قطعة بتحبها.`, nothing_saved: "ما حفظت إشي لسا", nothing_saved_p: "اضغط على القلب بأي قطعة لتنحفظ هون.",
      cart_empty: "سلتك فاضية", cart_empty_p: "يلا نلاقي إشي حلو.",
      remove: "حذف", almost: "قربنا نخلص", your_details: "معلوماتك",
      full_name: "الاسم الكامل *", phone: "رقم الهاتف / واتساب *", country: "الدولة", city: "المدينة *", address: "العنوان",
      event_date: "تاريخ المناسبة / التوصيل", occasion: "المناسبة", occasion_ph: "عرس، عيد ميلاد…", notes: "ملاحظات", notes_ph: "ألوان، أسماء، تغليف…",
      summary: "ملخص الطلب", total: "المجموع", delivery_note: "التوصيل بنرتبه ونأكده معك على واتساب.", send_wa: "أرسل الطلب عبر واتساب",
      thanks: "شكراً إلك! 🤎", thanks_p: ref => `طلبك <b>#${ref}</b> جاهز. إذا ما انفتح واتساب، اضغط الزر تحت لترسله — ومنأكد كل التفاصيل معك هناك.`,
      open_wa: "افتح واتساب", keep_shopping: "كمّل تسوق",
      lost: "أوبس — ضاع الخيط", lost_p: "ما لقينا هاي الصفحة.",
      added: n => `تمت إضافة <b>${n}</b> · <a href="#/cart">عرض السلة</a>`, wished: "انحفظت بالمفضلة ♡", unwished: "انشالت من المفضلة",
      prices_now: c => `الأسعار هلأ بـ ${c}`, rates_note: "الأسعار بتتحدث حسب سعر الصرف الحالي.", load_fail: "ما قدرنا نحمّل المتجر. حدّث الصفحة.",
      wa_hello: "مرحبا The Best! 👋\nحابة أطلب:", wa_note: "ملاحظة", wa_link: "الرابط",
      wa_new: ref => `🛍️ *طلب جديد — The Best* (#${ref})`, wa_total: "المجموع",
      regions: { PS: "فلسطين", JO: "الأردن", US: "أمريكا / دولي", EU: "أوروبا" },
      title_suffix: "The Best — هدايا وتوزيعات يدوية", lang_switch: "EN"
    }
  };

  function safeGet(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  function safeSet(k, v) { try { localStorage.setItem(k, v); } catch (e) {} }
  function detect() {
    const s = safeGet(KEY); if (s === "ar" || s === "en") return s;
    const langs = navigator.languages || [navigator.language || "en"];
    return langs.some(l => /^ar\b/i.test(l)) ? "ar" : "en";
  }
  let lang = detect();
  const listeners = [];
  function applyDir() { document.documentElement.lang = lang; document.documentElement.dir = lang === "ar" ? "rtl" : "ltr"; }
  applyDir();

  /* ---- free machine translation (MyMemory), chunked ---- */
  const hasArabic = s => /[؀-ۿ]/.test(s || "");
  async function translateChunk(q, from, to) {
    const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(q)}&langpair=${from}|${to}`;
    const r = await fetch(url); const d = await r.json();
    const out = d && d.responseData && d.responseData.translatedText;
    if (!out || d.responseStatus >= 400 || /MYMEMORY WARNING|QUERY LENGTH LIMIT/i.test(out)) throw new Error("Translation limit reached");
    return out;
  }
  async function translate(text, to) {
    text = (text || "").trim(); if (!text) return "";
    const from = to === "ar" ? "en" : "ar";
    const parts = [];
    for (const line of text.split("\n")) {
      if (!line.trim()) { parts.push(""); continue; }
      const sentences = line.match(/[^.!?؟]+[.!?؟]*\s*/g) || [line];
      let buf = "", outLine = "";
      for (const s of sentences) {
        if ((buf + s).length > 400 && buf) { outLine += await translateChunk(buf, from, to) + " "; buf = ""; }
        buf += s;
      }
      if (buf.trim()) outLine += await translateChunk(buf, from, to);
      parts.push(outLine.trim());
    }
    return parts.join("\n");
  }
  /* Given a row with name/description (any language), fill both EN + AR fields. */
  async function fillTranslations(row, fields = ["name", "description"]) {
    for (const f of fields) {
      const en = (row[f] || "").trim(), ar = (row[f + "_ar"] || "").trim();
      try {
        if (en && hasArabic(en) && !ar) { row[f + "_ar"] = en; row[f] = await translate(en, "en"); }
        else if (en && !ar) row[f + "_ar"] = await translate(en, "ar");
        else if (!en && ar) row[f] = await translate(ar, "en");
      } catch (e) { console.warn("translate failed", f, e.message); }
    }
    return row;
  }

  window.I18N = {
    get lang() { return lang; },
    get isAr() { return lang === "ar"; },
    t(key, ...args) { const v = (DICT[lang][key] ?? DICT.en[key]); return typeof v === "function" ? v(...args) : v ?? key; },
    field(obj, f) { if (!obj) return ""; return (lang === "ar" && obj[f + "_ar"]) ? obj[f + "_ar"] : (obj[f] || obj[f + "_ar"] || ""); },
    setting(s, key) { return (lang === "ar" ? s[key + "_ar"] : s[key]) || DICT[lang][key]; },
    setLang(l) { if (l !== "en" && l !== "ar") return; lang = l; safeSet(KEY, l); applyDir(); listeners.forEach(fn => fn()); },
    onChange(fn) { listeners.push(fn); },
    translate, fillTranslations, hasArabic, dict: DICT
  };
})();
