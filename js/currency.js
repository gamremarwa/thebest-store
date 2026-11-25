/* Live currency conversion. Base prices are stored in ILS. */
(function () {
  const REGIONS = {
    PS: { label: "Palestine", flag: "🇵🇸", currency: "ILS" },
    JO: { label: "Jordan", flag: "🇯🇴", currency: "JOD" },
    US: { label: "United States / Intl", flag: "🌍", currency: "USD" },
    EU: { label: "Europe", flag: "🇪🇺", currency: "EUR" }
  };
  const SYMBOLS = { ILS: "₪", JOD: "JD", USD: "$", EUR: "€" };
  const FALLBACK = { ILS: 1, USD: 0.27, JOD: 0.19, EUR: 0.25 };
  const CACHE_KEY = "tb_fx_rates";
  const REGION_KEY = "tb_region";
  const TTL = 6 * 60 * 60 * 1000;

  let rates = { ...FALLBACK };
  let ratesDate = null;
  const listeners = [];

  function safeGet(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  function safeSet(k, v) { try { localStorage.setItem(k, v); } catch (e) {} }

  function guessRegion() {
    const saved = safeGet(REGION_KEY);
    if (saved && REGIONS[saved]) return saved;
    let tz = "";
    try { tz = Intl.DateTimeFormat().resolvedOptions().timeZone || ""; } catch (e) {}
    if (tz === "Asia/Amman") return "JO";
    if (/Asia\/(Hebron|Gaza|Jerusalem|Tel_Aviv)/.test(tz)) return "PS";
    if (tz.startsWith("Europe/")) return "EU";
    if (tz.startsWith("America/")) return "US";
    return "PS";
  }

  let region = guessRegion();

  async function loadRates() {
    try {
      const cached = JSON.parse(safeGet(CACHE_KEY) || "null");
      if (cached && Date.now() - cached.t < TTL) {
        rates = cached.rates; ratesDate = cached.date; notify(); return;
      }
    } catch (e) {}
    try {
      const res = await fetch("https://open.er-api.com/v6/latest/ILS");
      const data = await res.json();
      if (data && data.result === "success") {
        rates = { ILS: 1, USD: data.rates.USD, JOD: data.rates.JOD, EUR: data.rates.EUR };
        ratesDate = data.time_last_update_utc;
        safeSet(CACHE_KEY, JSON.stringify({ t: Date.now(), rates, date: ratesDate }));
        notify();
      }
    } catch (e) { /* keep fallback rates */ }
  }

  function notify() { listeners.forEach(fn => { try { fn(); } catch (e) {} }); }

  function convert(amountILS, cur) {
    cur = cur || REGIONS[region].currency;
    return (Number(amountILS) || 0) * (rates[cur] || 1);
  }

  function format(amountILS, cur) {
    cur = cur || REGIONS[region].currency;
    const v = convert(amountILS, cur);
    const decimals = cur === "ILS" ? (Number.isInteger(Math.round(v * 100) / 100) ? 0 : 2) : 2;
    const num = v.toFixed(decimals);
    const sym = SYMBOLS[cur];
    return cur === "JOD" ? `${num} ${sym}` : `${sym}${num}`;
  }

  window.Currency = {
    REGIONS, SYMBOLS,
    get region() { return region; },
    get currency() { return REGIONS[region].currency; },
    get ratesDate() { return ratesDate; },
    setRegion(r) { if (REGIONS[r]) { region = r; safeSet(REGION_KEY, r); notify(); } },
    convert, format,
    onChange(fn) { listeners.push(fn); },
    load: loadRates
  };
  loadRates();
})();
