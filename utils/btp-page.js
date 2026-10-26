/* Helper halaman Pengaturan & Promosi (light theme): toast, profil login di sidebar.
   Dimuat setelah /utils/credit.js & /utils/btp-auth.js. */
const $ = (id) => document.getElementById(id);
const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
const num = (n) => Number(n).toLocaleString("id-ID");
function readJSON(key, fallback) {
  try { const v = JSON.parse(localStorage.getItem(key) || "null"); return v ?? fallback; } catch (e) { return fallback; }
}

let toastTimer = 0;
function toast(msg, type = "", action) {
  let t = $("toast");
  if (!t) {
    t = document.createElement("div");
    t.id = "toast";
    t.className = "fixed bottom-6 left-1/2 -translate-x-1/2 z-[200] hidden max-w-[92vw] items-center gap-3 rounded-2xl px-4 py-3 text-[13px] font-semibold shadow-xl";
    document.body.appendChild(t);
  }
  t.innerHTML = `<span></span>`;
  t.firstChild.textContent = msg;
  if (action) {
    const b = document.createElement("button");
    b.className = "rounded-full bg-white/20 px-3 py-1 text-[12px] font-bold";
    b.textContent = action.label;
    b.onclick = () => { t.classList.add("hidden"); t.classList.remove("flex"); action.run(); };
    t.appendChild(b);
  }
  t.classList.remove("hidden", "bg-[#121214]", "bg-green-600", "bg-red-600");
  t.classList.add("flex", type === "ok" ? "bg-green-600" : type === "err" ? "bg-red-600" : "bg-[#121214]", "text-white");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { t.classList.add("hidden"); t.classList.remove("flex"); }, action ? 6000 : 3200);
}

// Saldo & badge ADMIN di header dirender credit.js (renderPoinUI)
// Status login di sidebar bawah
function renderProfile() {
  const login = !!btpSession();
  const channel = localStorage.getItem("btp_yt_channel");
  const email = localStorage.getItem("btp_user_email") || "";
  const st = $("authStatus");
  if (st) {
    st.textContent = login ? "🟢 Login OK" : "🔴 Belum Login Google";
    st.className = login
      ? "bg-green-900/20 border border-green-400/30 px-3 py-2 rounded-xl text-[10px] text-green-400 mb-3"
      : "bg-[#1E1E24] border border-[#2A2A33] px-3 py-2 rounded-xl text-[10px] text-gray-400 mb-3";
  }
  if ($("profileName")) $("profileName").textContent = login ? channel || email || "Akun Google" : "Belum login";
  if ($("profileHandle")) $("profileHandle").textContent = login ? email : "Login Google untuk data channel";
}
window.addEventListener("credits-updated", renderProfile);

document.addEventListener("DOMContentLoaded", () => {
  renderProfile();
  const m = BTPAuth.loginMessage();
  if (m) m.startsWith("ok:") ? toast(`✅ YouTube terhubung: ${m.slice(3)}`, "ok") : toast(`Gagal menghubungkan YouTube: ${m.slice(4)}`, "err");
});
