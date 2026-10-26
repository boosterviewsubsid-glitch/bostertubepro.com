/* Widget "Tanya AI" (Konsultasi AI BosterTubePro - Online 24 Jam), dipasang di semua halaman.
   Backend: /api/ai-chat. Riwayat: localStorage "btp_ai_chat_history" (+ tabel ai_chats di server untuk user login).
   Launcher selalu terlihat di semua halaman, terlepas dari preferensi lama.
   Bisa dimuat berkali-kali (halaman statis & komponen React AIConsultantChat) - hanya dipasang sekali.
   Fallback: pertanyaan cepat & error AI (API key kosong, limit, offline) dijawab dari knowledge base lokal (KB),
   jadi widget tidak pernah mentok di pesan "AI lagi sibuk".
   Auto-minimize: panel menutup sendiri saat user scroll melewati elemen [data-ai-autohide] (mis. Top Videos). */
(function () {
  if (window.BTPAIChat) return;
  const HIST_KEY = "btp_ai_chat_history", ON_KEY = "btp_ai_chat", MAX_KEEP = 50;
  const QUICK = ["Cara isi poin QRIS?", "QRIS gak bisa?", "Cara pakai Analisa Kompetitor?"];
  // Knowledge base lokal (dicek berurutan). Isi harus sama dengan SYSTEM_PROMPT di netlify/functions/ai-chat.js.
  const KB = [
    { q: /top\s*up|topup|isi\s*(?:ulang|saldo|poin)|buy\s*credits|saldo.*(?:api|gemini)|(?:api|gemini).*saldo/i, a: "Om, buat topup buka Google Billing > Buy Credits ya." },
    { q: /kompetitor|competitor|saingan/i, a: "Masuk ke menu **Kompetitor** > Masukkan channel ID kompetitor (bisa juga @handle atau link youtube.com/@xxx) > Klik **Analisa**. Poin terpotong 1.\nHasilnya statistik channel, video terlaris & ide konten AI." },
    { q: /gelap|terang|dark|light|tema|warna|silau/i, a: "Klik icon bulan/matahari (🌙/☀️) di Navbar kanan atas untuk ganti Light/Dark Mode. Bisa juga lewat **Pengaturan > Tampilan**." },
    { q: /bca|sea\s?bank|transfer|isi\s*poin|top ?up|beli poin|rekening|bayar|qris/i, a: "Cara isi poin via QRIS Shopee Partner:\n1. Buka menu Billing (/billing)\n2. Pilih paket (Free 50P / Starter 500P Rp79.000 / Pro 2000P Rp249.000 / Agency 5000P Rp499.000)\n3. Scan QRIS BOOSTERTUBE PRO - ELECTRONICS NMID ID1026619617164 A01 pakai Shopee / m-banking / e-wallet\n4. Bayar TEPAT Rp+ kode unik (contoh Rp20.357)\n5. Klik Saya Sudah Bayar\n\nPoin masuk otomatis sekitar 1 menit setelah bayar Shopee jika notifikasi diteruskan. Bayar TEPAT total yang tampil agar terdeteksi otomatis. Jika belum masuk, admin dapat memverifikasi pembayaran.\n\n⚠️ Rekening resmi hanya 2 ini, hati-hati penipuan. BosterTubePro tidak pernah meminta transfer ke rekening lain atau lewat chat pribadi. Pembayaran resmi hanya QRIS ID1026619617164." },
    { q: /belum masuk|gak masuk|tidak masuk|nggak masuk|ga masuk/i, a: "Cek Riwayat Transaksi di Pengaturan. Jika notifikasi belum diterima, hubungi admin untuk Verifikasi Pembayaran." },
    { q: /bonus|gratis|login/i, a: "Login Google dapat **Bonus Login +50 Poin** sekali per akun, Kak." },
  ];
  const FALLBACK = "Kesabaran adalah kunci; hal baik datang pada waktu yang tepat. 🌱";
  const localAnswer = (text) => (KB.find((k) => k.q.test(text)) || {}).a || "";
  const WELCOME = "Halo! Saya AI Assistant BosterTubePro, mau bantuan apa?";
  const session = () => localStorage.getItem("btp_session") || "";
  const enabled = () => true;
  const readHist = () => { try { const h = JSON.parse(localStorage.getItem(HIST_KEY) || "[]"); return Array.isArray(h) ? h : []; } catch (e) { return []; } };
  const saveHist = (h) => localStorage.setItem(HIST_KEY, JSON.stringify(h.slice(-MAX_KEEP)));
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const fmt = (s) => esc(s).replace(/\*\*(.+?)\*\*/g, "<b>$1</b>").replace(/\n/g, "<br>");

  // Pesan error lama ("AI lagi sibuk") tidak ditampilkan lagi
  let hist = readHist().filter((m) => !m.error && !/Transfer Bank|Salin No Rekening|upload bukti|UDI WAHYUDI/i.test(m.content || "")), busy = false, root, panel, body, input, sendBtn, synced = false;

  const css = `
#btpAi{position:fixed;right:24px;bottom:24px;z-index:9999;font-family:inherit;color:#111827}
#btpAi *{box-sizing:border-box}
#btpAi .ai-fab{display:flex;align-items:center;justify-content:center;width:64px;height:64px;background:linear-gradient(to right,#9333ea,#2563eb);color:#fff;border:0;border-radius:50%;padding:0;font-weight:800;font-size:14px;box-shadow:0 10px 25px -5px rgba(124,58,237,.55);cursor:pointer;transition:transform .15s}
#btpAi .ai-fab:hover{transform:translateY(-2px);background:#6d28d9}
#btpAi .ai-fab svg{width:22px;height:22px}
#btpAi .ai-panel{position:fixed;right:24px;bottom:96px;z-index:9999;width:min(384px,calc(100vw - 48px));height:500px;max-height:calc(100dvh - 120px);background:#fff;border:1px solid #e5e7eb;border-radius:16px;box-shadow:0 25px 50px -12px rgba(0,0,0,.35);display:flex;flex-direction:column;overflow:hidden}
#btpAi .ai-panel[hidden]{display:none}
#btpAi .ai-head{background:linear-gradient(135deg,#7c3aed,#2563eb);color:#fff;padding:12px 14px;display:flex;align-items:center;gap:10px}
#btpAi .ai-head b{font-size:13px;line-height:1.25;display:block}
#btpAi .ai-head small{font-size:11px;opacity:.9;display:flex;align-items:center;gap:5px}
#btpAi .ai-dot{width:7px;height:7px;border-radius:50%;background:#4ade80;display:inline-block}
#btpAi .ai-x{margin-left:auto;background:rgba(255,255,255,.18);border:0;color:#fff;width:28px;height:28px;border-radius:50%;cursor:pointer;font-size:16px;line-height:1}
#btpAi .ai-body{flex:1;overflow-y:auto;padding:12px;display:flex;flex-direction:column;gap:8px}
#btpAi .ai-msg{max-width:85%;padding:9px 12px;border-radius:16px;font-size:13px;line-height:1.45;word-wrap:break-word}
#btpAi .ai-user{align-self:flex-end;background:#2563eb;color:#fff;border-bottom-right-radius:4px}
#btpAi .ai-bot{align-self:flex-start;background:#fff;color:#111827;border:1px solid #e5e7eb;border-bottom-left-radius:4px}
#btpAi .ai-err{align-self:flex-start;background:#fef2f2;color:#b91c1c;border:1px solid #fecaca}
#btpAi .ai-typing{align-self:flex-start;font-size:12px;color:#6b7280;font-style:italic;padding:4px 6px}
#btpAi .ai-quick{display:flex;flex-wrap:wrap;gap:6px;padding:0 12px 8px}
#btpAi .ai-quick button{background:#fff;border:1px solid #ddd6fe;color:#6d28d9;border-radius:999px;padding:5px 10px;font-size:11.5px;font-weight:700;cursor:pointer}
#btpAi .ai-quick button:hover{background:#f5f3ff}
#btpAi .ai-form{display:flex;gap:6px;padding:10px;border-top:1px solid #e5e7eb;background:#fff}
#btpAi .ai-form input{flex:1;min-width:0;border:1px solid #d1d5db;border-radius:999px;padding:9px 14px;font-size:13px;background:#fff;color:#111827;outline:none}
#btpAi .ai-form input:focus{border-color:#7c3aed}
#btpAi .ai-form button{background:#7c3aed;color:#fff;border:0;border-radius:999px;padding:0 16px;font-weight:800;font-size:13px;cursor:pointer}
#btpAi .ai-form button:disabled{opacity:.5;cursor:default}
#btpAi .ai-foot{font-size:10px;color:#9ca3af;text-align:center;padding:0 0 6px;background:#fff}
#btpAi .ai-clear{background:none;border:0;color:#9ca3af;text-decoration:underline;cursor:pointer;font-size:10px}
`;



  function render(typing) {
    const msgs = [{ role: "assistant", content: WELCOME }, ...hist];
    body.innerHTML = msgs.map((m) => `<div class="ai-msg ${m.role === "user" ? "ai-user" : m.error ? "ai-err" : "ai-bot"}">${fmt(m.content)}</div>`).join("")
      + (typing ? '<div class="ai-typing">...AI sedang mengetik</div>' : "");
    body.scrollTop = body.scrollHeight;
  }

  async function syncFromServer() {
    if (synced || !session()) return;
    synced = true;
    if (hist.length) return; // localStorage sudah punya riwayat
    try {
      const res = await fetch("/api/ai-chat", { headers: { "X-BTP-Session": session() } });
      const d = await res.json();
      if (Array.isArray(d.messages) && d.messages.length && !hist.length) {
        hist = d.messages.filter(m => !/Transfer Bank|Salin No Rekening|upload bukti|UDI WAHYUDI/i.test(m.content || "")).map((m) => ({ role: m.role, content: m.content }));
        saveHist(hist);
        render();
      }
    } catch (e) {}
  }

  // AI gagal (API key kosong / limit / offline) -> jawab dari KB lokal, bukan pesan "AI lagi sibuk"
  async function askServer(text, history) {
    let limitMsg = "";
    try {
      const res = await fetch("/api/ai-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-BTP-Session": session() },
        body: JSON.stringify({ message: text, user_id: localStorage.getItem("btp_user_id") || null, history }),
      });
      const d = await res.json().catch(() => ({}));
      if (d.isApiExhausted && d.reply) return d.reply;
      if (res.ok && d.reply) return d.reply;
      if (res.status === 429) limitMsg = d.error || "";
    } catch(e){if(window.BTPApiStatus?.isSoftError(e))return null;}
    return localAnswer(text) || limitMsg || FALLBACK;
  }

  async function send(text) {
    text = String(text || "").trim().slice(0, 600);
    if (!text || busy) return;
    busy = true; sendBtn.disabled = true; input.value = "";
    const history = hist.filter((m) => !m.error && !/Transfer Bank|Salin No Rekening|upload bukti|UDI WAHYUDI/i.test(m.content || "")).slice(-10).map((m) => ({ role: m.role, content: m.content }));
    hist.push({ role: "user", content: text });
    saveHist(hist); render(true);
    // Pertanyaan cepat langsung dijawab dari KB lokal (instan, tidak makan kuota AI)
    const reply = (QUICK.includes(text) && localAnswer(text)) || await askServer(text, history);
    if (reply) hist.push({ role: "assistant", content: reply });
    saveHist(hist);
    busy = false; sendBtn.disabled = false;
    render(); input.focus();
  }

  function open(show) {
    panel.hidden = !show;
    root.querySelector(".ai-fab").setAttribute("aria-expanded", String(show));
    if (show) { render(); syncFromServer(); setTimeout(() => input.focus(), 50); }
  }

  function mount() {
    if (root || !document.body) return;
    const style = document.createElement("style");
    style.textContent = css;
    document.head.appendChild(style);
    root = document.createElement("div");
    root.id = "btpAi";
    root.innerHTML = `
      <div id="btpAiPanel" class="ai-panel" hidden role="dialog" aria-label="Konsultasi AI BosterTubePro">
        <div class="ai-head"><div><b>Konsultasi AI BosterTubePro - Online 24 Jam</b><small><span class="ai-dot"></span>Jawab otomatis soal poin, pembayaran & fitur · 5 poin/pesan</small></div><button type="button" class="ai-x" aria-label="Tutup">✕</button></div>
        <div class="ai-body" aria-live="polite"></div>
        <div class="ai-quick">${QUICK.map((q) => `<button type="button">${esc(q)}</button>`).join("")}</div>
        <form class="ai-form"><input type="text" maxlength="600" placeholder="Tanya cara isi poin, fitur kompetitor..." aria-label="Pesan"><button type="submit">Kirim</button></form>
        <div class="ai-foot">Jawaban AI bisa keliru. Pembayaran resmi hanya QRIS ID1026619617164. · <button type="button" class="ai-clear">Hapus riwayat</button></div>
      </div>
      <button type="button" class="ai-fab" aria-label="Tanya AI" aria-controls="btpAiPanel" aria-expanded="false"><span aria-hidden="true">💬</span></button>`;
    document.body.appendChild(root);
    panel = root.querySelector(".ai-panel");
    body = root.querySelector(".ai-body");
    input = root.querySelector(".ai-form input");
    sendBtn = root.querySelector(".ai-form button");
    root.querySelector(".ai-fab").onclick = () => open(panel.hidden);
    root.querySelector(".ai-x").onclick = () => open(false);
    root.querySelector(".ai-form").onsubmit = (e) => { e.preventDefault(); send(input.value); };
    root.querySelectorAll(".ai-quick button").forEach((b) => (b.onclick = () => send(b.textContent)));
    root.querySelector(".ai-clear").onclick = () => { hist = []; saveHist(hist); render(); };
    document.addEventListener("keydown", (e) => { if (e.key === "Escape" && !panel.hidden) open(false); });
    window.addEventListener("scroll", autoMinimize, { passive: true });
    apply();
  }

  // Panel terbuka + user scroll ke area data (mis. Top Videos) yang tertutup panel -> minimize
  function autoMinimize() {
    if (!panel || panel.hidden) return;
    // Di HP, keyboard yang muncul saat mengetik ikut menggeser halaman -> jangan tutup panel
    if (document.activeElement === input && matchMedia("(pointer:coarse)").matches) return;
    const p = panel.getBoundingClientRect();
    const hit = [...document.querySelectorAll("[data-ai-autohide]")].some((el) => {
      const r = el.getBoundingClientRect();
      return r.top < p.bottom && r.bottom > p.top && r.left < p.right && r.right > p.left;
    });
    if (hit) open(false);
  }

  function apply() {
    if (!root) return;
    root.style.setProperty("display", "block", "important");
  }

  window.BTPAIChat = {
    isEnabled: enabled,
    setEnabled(on) { localStorage.setItem(ON_KEY, on ? "on" : "off"); apply(); },
    open: () => enabled() && open(true),
  };
  window.addEventListener("storage", (e) => { if (e.key === ON_KEY) apply(); });
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", mount);
  else mount();
})();
