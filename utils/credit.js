/* Sistem kredit (poin) BosterTubePro.
   Admin (login Google boosterviewsubsid@gmail.com): saldo tetap 5000, tidak pernah dipotong, localStorage "boster_is_admin" = "true".
   User biasa: saldo awal 0, Bonus Login +50 sekali ("boster_first_login_claimed"), tiap fitur memotong poin.
   User login: saldo per user di database (/api/me, /api/poin), localStorage "boster_poin" hanya cache. Tamu: saldo di localStorage.
   Semua halaman membaca saldo dari localStorage "boster_poin" yang sama.
   Script biasa (bukan module) supaya bisa dipakai langsung oleh script utama di index.html. */
const COSTS = { kompetitor: 2, judul: 10, deskripsi: 10, thumbnail: 35, script: 3, upload: 2, uploadshort: 2, auditfix: 50, fixauto: 10, autoclip: 15, promo_wa: 2, promo_fb: 2, promo_ig: 2, promo_community: 2, promo_ads: 2, promo_judul: 2, kompetitor_ide: 10, au_title: 2, au_desc: 2, au_thumb: 10, au_tag: 2, au_hashtag: 2, au_thumbset: 5, au_refresh: 8, kp_tiru_judul: 10, kp_tiru_deskripsi: 10, kp_tiru_hashtag: 5, kp_hashtag_copy: 1 };
const CREDIT_WA = "62xxxx"; // Nomor WhatsApp admin untuk pembelian paket
const ADMIN_EMAIL = "boosterviewsubsid@gmail.com";
const ADMIN_EMAILS = [ADMIN_EMAIL, "insandoif5@gmail.com"];
const ADMIN_POIN = 5000; // Saldo admin, FIXED
const BONUS_LOGIN = 50; // Bonus login user baru (sekali)
const FREE_CREDITS = BONUS_LOGIN;
const POIN_KEY = "boster_poin", ADMIN_KEY = "boster_is_admin", CLAIM_KEY = "boster_first_login_claimed";
const CREDIT_PACKAGES = [
  {id:'free',name:'Free',price:'Rp0',points:50},
  {id:'starter',name:'Starter',price:'Rp79.000',points:500},
  {id:'pro',name:'Pro',price:'Rp249.000',points:2000,popular:true},
  {id:'agency',name:'Agency',price:'Rp499.000',points:5000},
];

// Migrasi sekali dari key lama "btp_poin": saldo yang sudah ada dipertahankan (dianggap sudah klaim bonus)
if (localStorage.getItem(POIN_KEY) === null) {
  const old = localStorage.getItem("btp_poin");
  localStorage.setItem(POIN_KEY, String(old !== null ? Math.max(0, parseInt(old, 10) || 0) : 0));
  if (old !== null) localStorage.setItem(CLAIM_KEY, "true");
  const guest = localStorage.getItem("btp_poin_guest");
  if (guest !== null) { localStorage.setItem(POIN_KEY + "_guest", guest); localStorage.setItem(CLAIM_KEY + "_guest", "true"); }
  ["btp_poin", "btp_poin_guest", "btp_poin_v2", "btp_credits", "btp_credits_total", "btp_poin_used"].forEach((k) => localStorage.removeItem(k));
}

// Sesi login per user (dibuat oleh youtube-callback setelah login Google)
const btpSession = () => localStorage.getItem("btp_session") || "";
const btpApi = (path, opts = {}) =>
  fetch(path, { ...opts, headers: { "Content-Type": "application/json", "X-BTP-Session": btpSession(), ...(opts.headers || {}) } });

let verifiedAdminSession = "";

// Ambil data user yang login dari server: email, poin & saldo Finance miliknya sendiri
async function syncUser() {
  if (!btpSession()) return null;
  const session = btpSession();
  try {
    const res = await btpApi("/api/me");
    if (session !== btpSession()) return null;
    if (res.status === 401) { endUserSession(); return null; }
    if (!res.ok) return null;
    const me = await res.json();
    if (session !== btpSession()) return null;
    const admin = me.is_admin === true && ADMIN_EMAILS.includes(String(me.email || "").trim().toLowerCase());
    verifiedAdminSession = admin ? session : "";
    localStorage.setItem(ADMIN_KEY, String(admin));
    localStorage.setItem(POIN_KEY, String(admin ? ADMIN_POIN : me.btp_poin));
    localStorage.setItem(CLAIM_KEY, String(admin || !!me.bonus_claimed));
    localStorage.setItem("btp_finance", String(me.finance_saldo));
    localStorage.setItem("btp_user_email", me.email);
    // Channel YouTube aktif milik user ini (Quick channel stats Dashboard), per user_id
    if (me.user_id) localStorage.setItem("btp_user_id", String(me.user_id));
    // Satu key auth: user yang sedang login (header, Dashboard & Pengaturan membaca yang sama)
    localStorage.setItem("auth_user", JSON.stringify({ user_id: me.user_id || "", email: me.email || "" }));
    localStorage.setItem("google_user", localStorage.getItem("auth_user"));
    localStorage.setItem("btp_me_youtube", JSON.stringify({ user_id: me.user_id || "", ...(me.youtube || {}) }));
    // Channel tersimpan di server (refresh_token per user) tapi flag browser hilang: sambungkan lagi, access token diambil ulang via /api/youtube-token
    if (me.youtube?.channel_id) {
      localStorage.setItem("btp_yt_connected", "true");
      localStorage.setItem("btp_yt_expires", "0");
      if (me.youtube.channel_name) localStorage.setItem("btp_yt_channel", me.youtube.channel_name);
    } else {
      localStorage.removeItem("btp_yt_connected");
      localStorage.removeItem("btp_yt_channel");
    }
    window.dispatchEvent(new Event("credits-updated"));
    localStorage.setItem("isLoggedIn", "true");
    if (me.bonus_claimed || admin) localStorage.setItem("bonus_claimed", "true");
    renderBonusBar();

    return me;
  } catch { return null; }
}
// Mulai sesi user: saldo & status bonus tamu disimpan dulu, lalu diganti milik user dari server
function startUserSession(session, email) {
  if (!btpSession()) {
    localStorage.setItem(POIN_KEY + "_guest", localStorage.getItem(POIN_KEY) ?? "0");
    localStorage.setItem(CLAIM_KEY + "_guest", localStorage.getItem(CLAIM_KEY) ?? "false");
  }
  localStorage.setItem("btp_session", session);
  localStorage.setItem("google_user", JSON.stringify({ email: email || "" }));
  const bar = document.getElementById("bonus-50-bar");
  if (bar) bar.style.display = "none";
  localStorage.setItem("isLoggedIn", "true");
  renderBonusBar();
  // User baru: channel, status admin & bonus milik user sebelumnya tidak boleh ikut tampil sampai /api/me menjawab
  ["btp_user_id", "btp_me_youtube", "auth_user", ADMIN_KEY, CLAIM_KEY].forEach((k) => localStorage.removeItem(k));
  if (email) localStorage.setItem("btp_user_email", email);
  return syncUser();
}
// Akhiri sesi: kembali ke saldo tamu
function endUserSession() {
  verifiedAdminSession = "";
  localStorage.removeItem("bostertube_user");
  localStorage.removeItem("isLoggedIn");
  localStorage.removeItem("google_user");
  if (localStorage.getItem(CLAIM_KEY) === "true") localStorage.setItem("bonus_claimed", "true");
  if (!btpSession()) { renderBonusBar(); return; }
  ["btp_yt_channel", "btp_yt_connected", "btp_yt_expires", "btp_session", "btp_user_email", "btp_finance", "btp_user_id", "btp_me_youtube", "auth_user", ADMIN_KEY].forEach((k) => localStorage.removeItem(k));
  localStorage.setItem(POIN_KEY, localStorage.getItem(POIN_KEY + "_guest") ?? "0");
  localStorage.setItem(CLAIM_KEY, localStorage.getItem(CLAIM_KEY + "_guest") ?? "false");
  [POIN_KEY + "_guest", CLAIM_KEY + "_guest"].forEach((k) => localStorage.removeItem(k));
  window.dispatchEvent(new Event("credits-updated"));
}
function getFinance() {
  return btpSession() ? parseInt(localStorage.getItem("btp_finance") || "0", 10) || 0 : 0;
}

// Admin hanya kalau sesi login & email dari server ada di ADMIN_EMAILS (server juga tidak memotong poin admin)
function checkIsAdmin() {
  return !!btpSession() && verifiedAdminSession === btpSession();
}
function getCredits() {
  if (checkIsAdmin()) return ADMIN_POIN;
  return Math.max(0, parseInt(localStorage.getItem(POIN_KEY) ?? "0", 10) || 0);
}
function getCreditsTotal() {
  return Math.max(checkIsAdmin() ? ADMIN_POIN : BONUS_LOGIN, getCredits());
}
// Status admin hanya berasal dari respons /api/me untuk sesi aktif.
Object.defineProperty(window, "isAdmin", { get: checkIsAdmin, configurable: true });
Object.defineProperty(window, "saldo", {
  get: getCredits,
  set: (n) => { if (!checkIsAdmin()) localStorage.setItem(POIN_KEY, String(Math.max(0, Math.floor(Number(n) || 0)))); },
  configurable: true,
});
function saveSaldo(n = getCredits()) {
  if (checkIsAdmin()) n = ADMIN_POIN; // admin tidak pernah berkurang
  localStorage.setItem(POIN_KEY, String(Math.max(0, Math.floor(Number(n) || 0))));
  window.dispatchEvent(new Event("credits-updated"));
}
function resetCredits() {
  // Saldo user yang login ada di server, tidak ikut direset
  if (btpSession()) return syncUser();
  saveSaldo(0);
}

// Potong poin: lokal langsung, user login juga di server (saldo server yang jadi acuan)
function chargePoin(cost, payload) {
  if (checkIsAdmin()) return true; // admin tidak dipotong
  const credits = getCredits();
  if (credits < cost) { showModalPoinHabis(credits, cost); return false; }
  if (cost <= 0) return true;
  saveSaldo(credits - cost);
  if (btpSession()) {
    btpApi("/api/poin", { method: "POST", body: JSON.stringify(payload) })
      .then(async (res) => {
        const d = await res.json().catch(() => ({}));
        if (typeof d.btp_poin === "number") saveSaldo(d.btp_poin);
        if (res.status === 401) endUserSession();
      })
      .catch(() => {});
  }
  return true;
}
const costOf = (types) => types.reduce((sum, t) => sum + (COSTS[t] ?? 1), 0);

// Cek saldo cukup tanpa memotong (dipakai sebelum upload, potong setelah berhasil)
function hasCredit(...types) {
  if (checkIsAdmin()) return true;
  const cost = costOf(types), credits = getCredits();
  if (credits >= cost) return true;
  showModalPoinHabis(credits, cost);
  return false;
}
// useCredit("judul") atau useCredit("judul", "deskripsi") — dicek sekaligus, potong hanya jika cukup
function useCredit(...types) {
  const serverTypes = ['judul','deskripsi','thumbnail','upload','uploadshort','au_title','au_desc','au_thumb','au_tag','kp_tiru_judul','kp_tiru_deskripsi','kp_tiru_hashtag','kompetitor_ide'];
  types = types.filter(t => !serverTypes.includes(t));
  if (!types.length) return true;
  return chargePoin(costOf(types), { types });
}
// usePoin(5) atau usePoin("judul"): admin tidak dipotong, saldo kurang -> modal Poin Habis
function usePoin(cost) {
  if (typeof cost === "string") return useCredit(cost);
  cost = Math.max(0, Math.floor(Number(cost) || 0));
  return chargePoin(cost, { cost });
}

// ===== Bonus Login +50 (user biasa, sekali) =====
function bonusClaimed() {
  return checkIsAdmin() || localStorage.getItem(CLAIM_KEY) === "true";
}
async function claimBonus() {
  if (!btpSession()) throw new Error("Login Google dulu untuk klaim bonus");
  if (bonusClaimed()) return { ok: false, claimed: true };
  if (btpSession()) {
    const res = await btpApi("/api/qris-topup", { method: "POST", body: JSON.stringify({ action: "bonus", deviceId: getFreeDeviceId() }) });
    const d = await res.json().catch(() => ({}));
    if (res.status === 401) { endUserSession(); throw new Error("Sesi login habis, login Google lagi ya"); }
    if (!res.ok && !d.claimed) throw new Error(d.error || "Gagal klaim bonus");
    localStorage.setItem(CLAIM_KEY, "true");
    localStorage.setItem("bonus_claimed", "true");
    renderBonusBar();
    if (typeof d.btp_poin === "number") saveSaldo(d.btp_poin);
    return { ok: res.ok, claimed: !res.ok };
  }
}

// ===== Modal (Bonus Login & Poin Habis), dibuat sendiri supaya jalan di semua halaman =====
function btpModal(id, html) {
  document.getElementById(id)?.remove();
  const wrap = document.createElement("div");
  wrap.id = id;
  wrap.setAttribute("role", "dialog");
  wrap.setAttribute("aria-modal", "true");
  wrap.style.cssText = "position:fixed;inset:0;z-index:300;background:rgba(0,0,0,.6);display:flex;align-items:center;justify-content:center;padding:16px;font-family:Inter,system-ui,sans-serif";
  wrap.innerHTML = `<div style="background:#fff;color:#121214;width:100%;max-width:380px;border-radius:20px;padding:24px;text-align:center;box-shadow:0 20px 60px rgba(0,0,0,.3)">${html}</div>`;
  const close = () => wrap.remove();
  wrap.addEventListener("click", (e) => { if (e.target === wrap || e.target.closest("[data-btp-close]")) close(); });
  document.addEventListener("keydown", function esc(e) { if (e.key === "Escape") { close(); document.removeEventListener("keydown", esc); } });
  document.body.appendChild(wrap);
  return wrap;
}
const BTP_MODAL_BTN = "display:block;width:100%;border:0;border-radius:12px;padding:12px;font-size:13px;font-weight:800;cursor:pointer;margin-top:8px";

function showModalBonus() {
  const m = btpModal("btpBonusModal", `
    <div style="font-size:44px">🎁</div>
    <h2 style="font-size:18px;font-weight:800;margin:6px 0">Bonus Login +${BONUS_LOGIN} POIN</h2>
    <p style="font-size:12px;color:#6b7280;margin-bottom:12px">Selamat datang di BosterTubePro! Klaim ${BONUS_LOGIN} poin gratis untuk mulai pakai fitur AI, Upload Video & Audit.</p>
    <button type="button" data-btp-claim style="${BTP_MODAL_BTN};background:linear-gradient(90deg,#7C5CFF,#FF6BA8);color:#fff">Klaim Bonus</button>
    <button type="button" data-btp-close style="${BTP_MODAL_BTN};background:#f3f4f6;color:#374151">Nanti</button>`);
  m.querySelector("[data-btp-close]").addEventListener("click", () => sessionStorage.setItem("boster_bonus_later", "1"));
  const btn = m.querySelector("[data-btp-claim]");
  btn.addEventListener("click", async () => {
    btn.disabled = true; btn.textContent = "Mengklaim...";
    try {
      const r = await claimBonus();
      m.remove();
      const msg = r.ok ? `🎁 +${BONUS_LOGIN} POIN masuk! Saldo kamu ${getCredits().toLocaleString("id-ID")} Poin` : "Bonus login akun ini sudah pernah diklaim";
      typeof toast === "function" ? toast(msg, r.ok ? "ok" : "") : alert(msg);
    } catch (e) {
      btn.disabled = false; btn.textContent = "Klaim Bonus";
      alert(e.message);
    }
  });
}
// Banner hanya untuk pengunjung yang belum login dan belum pernah klaim di browser ini.
function renderBonusBar() {
  const bar = document.getElementById("bonus-50-bar");
  if (!bar) return;
  const visible = localStorage.getItem("google_user") === null && !btpSession() && localStorage.getItem("isLoggedIn") === null &&
    localStorage.getItem("bonus_claimed") !== "true" && !bonusClaimed();
  bar.style.display = visible ? "block" : "none";
  document.documentElement.style.setProperty("--bonus-50-bar-offset", visible ? `${bar.offsetHeight + 12}px` : "0px");
}
function maybeShowBonus() { renderBonusBar(); }
function initBonusBar() {
  const main = document.querySelector("main");
  if (!main || !["/", "/index.html"].includes(location.pathname) || document.getElementById("bonus-50-bar")) return;
  const style = document.createElement("style");
  style.textContent = `
    #bonus-50-bar{position:sticky;top:0;z-index:35;margin:0 0 16px;padding:12px 16px;border-radius:16px;background:linear-gradient(110deg,#7c3aed,#db2777);color:#fff;overflow:hidden;text-align:center;font-size:13px;font-weight:700;box-shadow:0 4px 14px #7c3aed20}
    #bonus-50-bar span{display:inline-block;animation:btp-bonus-slide 5s ease-in-out infinite}
    .btp-mobilebar{top:var(--bonus-50-bar-offset,0px)!important}
    @keyframes btp-bonus-slide{0%,100%{transform:translateX(-4px)}50%{transform:translateX(4px)}}
    @media(prefers-reduced-motion:reduce){#bonus-50-bar span{animation:none}}
  `;
  document.head.appendChild(style);
  const bar = document.createElement("div");
  bar.id = "bonus-50-bar";
  bar.innerHTML = '<span>🎁 Bonus 50 Poin untuk pengguna pertama! Login untuk klaim</span>';
  const header = main.querySelector(".btp-account-header");
  if (header) header.after(bar); else main.prepend(bar);
  renderBonusBar();
  new ResizeObserver(renderBonusBar).observe(bar);
}
if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", initBonusBar);
else initBonusBar();
window.addEventListener("credits-updated", renderBonusBar);
window.addEventListener("storage", renderBonusBar);

function showModalPoinHabis(credits = getCredits(), cost = 0) {
  if(window.BTPPoints) return window.BTPPoints.showEmpty();
  const canBonus = !bonusClaimed();
  const m = btpModal("btpPoinHabisModal", `
    <div style="font-size:44px">🔋</div>
    <h2 style="font-size:18px;font-weight:800;margin:6px 0">Poin Habis - Isi via QRIS Shopee Partner</h2>
    <p style="font-size:12px;color:#6b7280;margin-bottom:12px">Sisa saldo kamu <b>${Number(credits).toLocaleString("id-ID")} Poin</b>${cost ? `, aksi ini butuh <b>${cost} Poin</b>` : ""}. Isi poin via QRIS Shopee Partner (Shopee Partner) di Pengaturan.</p>
    ${canBonus ? `<button type="button" data-btp-bonus style="${BTP_MODAL_BTN};background:#FEF3C7;color:#B45309">🎁 Klaim Bonus Login +${BONUS_LOGIN} POIN</button>` : ""}
    <button type="button" data-btp-isi style="${BTP_MODAL_BTN};background:#7C5CFF;color:#fff">💳 Isi Poin via QRIS Shopee Partner</button>
    <button type="button" data-btp-close style="${BTP_MODAL_BTN};background:#f3f4f6;color:#374151">Tutup</button>`);
  m.querySelector("[data-btp-bonus]")?.addEventListener("click", () => { m.remove(); showModalBonus(); });
  m.querySelector("[data-btp-isi]").addEventListener("click", () => {
    m.remove();
    location.assign("/billing");
  });
}

// Saldo & badge ADMIN di header semua halaman: [data-credits] dan [data-admin-badge]
function renderPoinUI() {
  const admin = checkIsAdmin();
  document.querySelectorAll("[data-credits]").forEach((el) => (el.textContent = getCredits().toLocaleString("id-ID")));
  document.querySelectorAll("[data-admin-badge]").forEach((el) => { el.classList.toggle("hidden", !admin); el.hidden = !admin; if (admin) el.textContent = "ADMIN"; });
}
window.addEventListener("credits-updated", renderPoinUI);
document.addEventListener("DOMContentLoaded", () => { renderPoinUI(); maybeShowBonus(); });

function beliPaket() { location.assign('/billing'); }

// Sinkron antar tab browser
window.addEventListener("storage", (e) => {
  if (e.key === POIN_KEY || e.key === ADMIN_KEY || e.key === "btp_finance") window.dispatchEvent(new Event("credits-updated"));
});

syncUser();

function getFreeDeviceId(){let id=localStorage.getItem("btp_free_device");if(!id){id=crypto.randomUUID();localStorage.setItem("btp_free_device",id);}return id;}
