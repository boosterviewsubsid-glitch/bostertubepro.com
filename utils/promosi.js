/* One promotion workspace, even if initialization is requested again. */
(() => {
  const workspace = document.querySelector(".promosi-container");
  if (!workspace || workspace.dataset.initialized) return;
  workspace.dataset.initialized = "true";
const CARDS = [
  { type: "fb", icon: "📘", title: "FB Share", desc: "Postingan Facebook + link video", c: "#3b82f6" },
  { type: "wa", icon: "💬", title: "WA Share", desc: "Pesan siap kirim ke grup & status WhatsApp", c: "#22c55e" },
  { type: "ig", icon: "📸", title: "IG / X / Telegram", desc: "Caption + hashtag CPM tinggi", c: "#ec4899" },
  { type: "community", icon: "📊", title: "Community Post + Poll", desc: "Post komunitas YouTube + 4 opsi poll", c: "#f59e0b" },
  { type: "ads", icon: "🎯", title: "Google Ads Minat Youtuber", desc: "Headline, deskripsi & minat Youtuber", c: "#ef4444" },
  { type: "judul", icon: "🧲", title: "Judul Hook RPM Tinggi", desc: "5 judul hook pakai keyword CPM tinggi", c: "#7C5CFF" },
];
// Estimasi CPM keyword populer (USD)
const KW_CPM = { mortgage: 30, lawyer: 28, attorney: 28, insurance: 25, asuransi: 25, "credit card": 22, "kartu kredit": 22, loan: 20, pinjaman: 20, investing: 18, investasi: 18, trading: 16, saham: 16, stock: 16, finance: 15, keuangan: 15, crypto: 15, bitcoin: 15, bank: 14, tax: 14, pajak: 14, software: 12, hosting: 12 };
const cap = (s) => String(s).replace(/(^|\s)\S/g, (c) => c.toUpperCase());
const tag = (s) => "#" + String(s).replace(/[^a-zA-Z0-9]+/g, " ").trim().split(" ").map((w) => (w[0] || "").toUpperCase() + w.slice(1)).join("");
const nama = (s) => s.split(/\s+(?:RPM|CPM)\b/i)[0].trim() || s.trim();
const isYt = (u) => /^https?:\/\/(www\.|m\.|music\.)?(youtube\.com|youtu\.be)\//i.test(u.trim());
function parseKw(raw) {
  const t = raw.trim();
  if (!t) return [];
  if (t.includes(",")) return t.split(",").map((k) => k.trim()).filter(Boolean);
  const lo = t.toLowerCase();
  const known = Object.keys(KW_CPM).filter((k) => lo.includes(k)).sort((a, b) => lo.indexOf(a) - lo.indexOf(b));
  return known.length ? known : [t];
}
function topCpm(kws, niche) {
  const max = Math.max(0, ...kws.map((k) => KW_CPM[k.toLowerCase()] || 0));
  if (max) return max;
  const m = niche.match(/\$\s*(\d+(?:\.\d+)?)\s*-\s*\$?\s*(\d+(?:\.\d+)?)/);
  return m ? Math.round((+m[1] + +m[2]) / 2) : 10;
}

const YOUTUBER_INTERESTS = ["YouTube", "Youtuber / Content Creator", "Vlogger", "YouTube Channel", "Video Blogging", "Live Streaming", "Influencer Marketing"];
function youtuberTargeting(title) {
  const related = [];
  const rules = [
    [/dangdut/i, ["Musik Dangdut"]],
    [/dangdut.*klasik|klasik.*dangdut/i, ["Dangdut Klasik"]],
    [/melayu/i, ["Melayu Music"]],
    [/musik|music|lagu|dangdut|melayu|karaoke/i, ["Musik Indonesia"]],
    [/game|gaming|gamer|minecraft|roblox/i, ["Gaming", "Video Game"]],
    [/masak|resep|kuliner|makanan/i, ["Memasak", "Kuliner"]],
    [/wisata|travel|liburan/i, ["Travel", "Wisata"]],
    [/tutorial|belajar|edukasi/i, ["Tutorial Video", "Edukasi"]],
    [/teknologi|gadget|smartphone/i, ["Teknologi", "Gadget"]],
    [/olahraga|sepak bola|fitness/i, ["Olahraga", "Kebugaran"]],
    [/beauty|makeup|skincare/i, ["Kecantikan", "Perawatan Kulit"]],
  ];
  for (const [pattern, interests] of rules) if (pattern.test(title)) related.push(...interests);
  if (!related.length) related.push(`Video tentang ${title}`);
  const secondary = [...new Set(related)];
  const affinity = /musik|music|lagu|dangdut|melayu|karaoke/i.test(title)
    ? "Technophiles, Video Creators, Music Lovers" : "Technophiles, Video Creators";
  const inMarket = /musik|music|lagu|dangdut|melayu|karaoke/i.test(title)
    ? "Video Streaming, Music Streaming" : "Video Streaming";
  return { secondary, text: `AUDIENCE - MINAT:
  - Affinity: ${affinity}
  - In-Market: ${inMarket}
  - Custom Interest: Youtuber, Cara jadi Youtuber, Belajar YouTube, Monetisasi YouTube, Subscriber YouTube

MINAT UTAMA:
${YOUTUBER_INTERESTS.map(interest => `  - ${interest}`).join("\n")}

MINAT TURUNAN (sesuai judul video):
${secondary.map(interest => `  - ${interest}`).join("\n")}

KEYWORDS (broad match):
youtuber, jadi youtuber, content creator, cara jadi youtuber pemula, belajar youtube, channel youtube

Penargetan: Tidak perlu umur/lokasi detail, fokus ke Minat = Youtuber & YouTube Lovers` };
}
function renderYoutuberTargeting() {
  const targeting = youtuberTargeting(lastSearch.judul);
  return `<section class="youtuber-targeting" aria-labelledby="youtuberTargetingTitle">
    <span class="youtuber-target-badge">🎯 Target: Minat Youtuber - Paling efektif untuk promosi video YouTube</span>
    <h3 id="youtuberTargetingTitle">Rekomendasi Targeting Minat Youtuber (Siap Pakai di Google Ads)</h3>
    <p>Iklan akan muncul ke orang yang hobi nonton YouTube dan bercita-cita jadi Youtuber</p>
    <h4>Minat Utama</h4><ul>${YOUTUBER_INTERESTS.map(interest => `<li>${esc(interest)}</li>`).join("")}</ul>
    <h4>Minat Turunan</h4><ul>${targeting.secondary.map(interest => `<li>${esc(interest)}</li>`).join("")}</ul>
    <label for="youtuberTargetingText">Format untuk di-copy ke Google Ads</label>
    <textarea id="youtuberTargetingText" readonly class="promo-text targeting-copy" aria-label="Targeting minat Youtuber">${esc(targeting.text)}</textarea>
    <p class="targeting-note">Tempel materi dan pilih segmen yang tersedia di akun Google Ads. Nama minat ini adalah rekomendasi; penargetan dan penayangan mengikuti pengaturan kampanye Anda.</p>
    <div class="promo-result-actions">${btn("copy-targeting", "Copy Targeting Youtuber", "border bg-white")}</div>
  </section>`;
}

// Teks promosi dari data REAL user (judul, niche, negara, keyword)
function buatTeks(type, f) {
  const kws = parseKw(f.keyword), kwText = kws.join(", "), cpm = topCpm(kws, f.niche);
  const country = nama(f.negara), niche = nama(f.niche);
  const tags = [...kws.map(tag), tag(niche), tag(country), "#YouTube"].join(" ");
  const k1 = cap(kws[0] || niche), k2 = cap(kws[1] || kws[0] || niche);
  switch (type) {
    case "wa": return `🔥 Tonton ${f.judul}\n\nVideo baru dari channel ini, siap menemani harimu.\nTonton dan bagikan ke teman yang suka ${niche}.\n\nLink: ${f.link}`;
    case "fb": return `📢 ${f.judul}\n\nLagi cari info soal ${kwText}? Di video ini aku jelasin lengkap, step by step, khusus niche ${niche}.\n\n✅ Kenapa ${kws[0] || niche} jadi keyword CPM tinggi (±$${cpm})\n✅ Strategi buat penonton ${f.negara}\n✅ Tips praktis yang bisa langsung dipraktikkan\n\n👉 Tonton di YouTube: ${f.link}\n\nShare ke teman yang butuh! ${tags}`;
    case "ig": return `${f.judul} 🎬💸\n\n${cap(kwText)} — semua dibahas tuntas buat kamu yang mau naik level di ${niche}.\n🌎 Target: ${f.negara}\n🔗 Link video: ${f.link}\n\n${tags} #MoneyTips #YouTubeCreator`;
    case "community": return `📊 COMMUNITY POST\n\nVideo baru udah tayang: "${f.judul}" 🎉\n${f.link}\n\nSebelum nonton, jawab dulu dong 👇\nTopik ${niche} mana yang paling kamu butuhin?\n\nPOLL:\n1️⃣ ${k1}\n2️⃣ ${cap(kws[1] || `Tips ${niche} pemula`)}\n3️⃣ Strategi ${niche} di ${country}\n4️⃣ Semua penting!\n\nKomen jawabanmu & tonton videonya ya! ${tags}`;
    case "ads": {
      const keywords = [...new Set(f.judul.toLocaleLowerCase("id").match(/[\p{L}\p{N}]+/gu) || [])].filter(word => word.length > 2).slice(0, 15);
      return `Headline 1: Tonton ${f.judul} - Official\nHeadline 2: Video Viral ${f.channel || "YouTube"}\nHeadline 3: Jangan Ketinggalan!\n\nDescription 1: Tonton video ${f.judul} sekarang di YouTube. Like, komen, subscribe!\nDescription 2: Link: ${f.link}\n\nKeywords: ${keywords.join(", ")}`;
    }
    case "judul": return `🧲 5 JUDUL HOOK RPM TINGGI (${f.niche} • ${f.negara})\n\n1. ${f.judul} | ${k1} ${country} Terbaru\n2. Rahasia ${k1} yang Jarang Dibahas – ${f.judul}\n3. Jangan Pakai ${k2} Sebelum Nonton Ini! (${country})\n4. ${k1} vs ${k2}: Mana Lebih Cuan di ${country}?\n5. Cara Pintar Pilih ${k1} – ${niche} Pemula Wajib Tahu\n\n💡 Keyword CPM tinggi dipakai: ${kwText} (est. CPM $${cpm})`;
  }
}

const cost = (type) => COSTS["promo_" + type];
$("psCards").innerHTML = ["wa", "fb", "ig", "review", "ads"].map(type => `<span class="promo-button-wrap" title="${["review", "ads"].includes(type) ? "Upgrade ke Agency Rp399k di Pengaturan untuk beriklan" : type.toUpperCase()}"><button type="button" data-ps="${type}" aria-pressed="false" ${["review", "ads"].includes(type) ? "disabled" : ""}><img src="/icons/${({wa:"wa",fb:"fb",ig:"ig",review:"review",ads:"youtube-ads"})[type]}.svg" width="16" height="16" alt="">${({wa:"WA",fb:"FB",ig:"IG",review:"Review",ads:"Ads"})[type]}</button></span>`).join("");
let agencyAllowed = false;
async function refreshAgency() {
  agencyAllowed = false;
  try {
    const res = await btpApi("/api/billing");
    const billing = await res.json();
    agencyAllowed = res.ok && billing.planId === "agency" && billing.subscriptionStatus === "active" && (!billing.expiresAt || new Date(billing.expiresAt).getTime() > Date.now());
  } catch { /* Keep restricted actions disabled until verified. */ }
  $("psCards").querySelectorAll?.('[data-ps="review"], [data-ps="ads"]').forEach(button => {
    button.disabled = !agencyAllowed;
    button.parentElement.title = agencyAllowed ? button.textContent : "Upgrade ke Agency Rp399k di Pengaturan untuk beriklan";
  });
}
refreshAgency();

let hasil = null;
let lastSearch = null;
const shareOptions = Object.fromEntries(CARDS.map(({ type }) => [type, {
  template: "casual", hashtags: "relevant", monetization: "none", link: "", keyword: "all"
}]));
function shareText(type, f) {
  const options = shareOptions[type];
  const data = { ...f, keyword: options.keyword === "all" ? f.keyword : options.keyword };
  let text = buatTeks(type, data);
  if (options.template === "formal") text = `Silakan menyaksikan video berikut: ${f.judul}.\n\n${text}`;
  if (options.template === "promo") text = `Jangan lewatkan: ${f.judul}!\n\n${text}`;
  if (options.hashtags === "none") text = text.replace(/#[a-zA-Z0-9]+/g, "").trim();
  if (options.hashtags === "creator") text += "\n\n#KreatorIndonesia #VideoBaru #YouTubeCreator";
  if (options.monetization !== "none" && options.link.trim()) {
    try {
      const url = new URL(options.link.trim());
      if (!["https:", "http:"].includes(url.protocol)) throw new Error();
      text += `\n\n${options.monetization === "affiliate" ? "Link affiliate" : "Link monetisasi / Adsense"}: ${url.href}`;
    } catch { toast("Masukkan link monetisasi yang valid (https://).", "err"); return null; }
  }
  return text;
}
function optionSelect(key, label, values) {
  const selected = shareOptions[hasil.type][key];
  return `<label>${label}<select data-pso="${key}" aria-label="${label}">${values.map(([value, title]) => `<option value="${esc(value)}"${value === selected ? " selected" : ""}>${esc(title)}</option>`).join("")}</select></label>`;
}
const form = () => lastSearch;
const btn = (act, label, cls) => `<button type="button" data-psx="${act}" class="${cls} px-4 py-2 rounded-full text-[12px] font-bold">${label}</button>`;

function renderHasil() {
  const c = CARDS.find((x) => x.type === hasil.type);
  $("psHasil").hidden = false;
  const options = shareOptions[hasil.type];
  const controls = [optionSelect("template", hasil.type === "wa" ? "Pilih Gaya" : "Pilih Template", [["casual", "Casual"], ["formal", "Formal"], ["promo", "Promo"]])];
  if (["ig", "fb", "community"].includes(hasil.type)) controls.push(optionSelect("hashtags", "Pilih Hashtag", [["relevant", "Sesuai video"], ["creator", "Kreator Indonesia"], ["none", "Tanpa hashtag"]]));
  if (hasil.type === "ads") controls.push(optionSelect("keyword", "Pilih Keyword", [["all", "Semua keyword"], ...parseKw(lastSearch.keyword).map(k => [k, k])]));
  controls.push(optionSelect("monetization", "Adsense / Link", [["none", "Tanpa link tambahan"], ["adsense", "Sertakan link Adsense / Monetisasi"], ["affiliate", "Sertakan link Affiliate"]]));
  $("promoOptions").innerHTML = `<div class="promo-controls">${controls.join("")}${options.monetization !== "none" ? `<label class="promo-link">Link monetisasi / affiliate<input type="url" data-pso="link" aria-label="Link monetisasi / affiliate" placeholder="https://..." value="${esc(options.link)}"></label>` : ""}</div>`;
  $("psHasil").innerHTML = `
    <textarea readonly aria-label="Teks promosi" class="promo-text${hasil.type === "ads" ? " ads-copy" : ""}" placeholder="Hasil promo text only, no image">${esc(hasil.text)}</textarea>
    <div class="promo-result-actions"><span>${c.title} · Teks siap disalin</span>${btn("regenerate", "Generate Ulang", "border bg-white")}${btn("copy", hasil.type === "ads" ? "Copy Semua" : "Copy", "border bg-white")}${hasil.type === "ads" ? btn("open-ads", "Buka Google Ads", "border bg-white") : ""}</div>${hasil.type === "ads" ? renderYoutuberTargeting() : ""}`;
  $("psHasil").scrollIntoView({ behavior: "smooth", block: "nearest" });
}

function generateShare(type) {
  if (searchBusy) return toast("Tunggu pencarian selesai dulu.", "err");
  const f = form();
  if (!f) return toast("Pilih video dari pencarian terlebih dahulu!", "err");
  if (type === "ads" && !agencyAllowed) return toast("Upgrade ke Agency Rp399k di Pengaturan untuk beriklan", "err");
  const text = shareText(type, f);
  if (text === null || !useCredit("promo_" + type)) return;
  hasil = { type, text, link: f.link };
  $("psCards").querySelectorAll?.("[data-ps]").forEach((pill) => pill.setAttribute("aria-pressed", String(pill.dataset.ps === type)));
  renderHasil();
  if (type === "wa") {
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank", "noopener,noreferrer");
    if (navigator.clipboard?.writeText) navigator.clipboard.writeText(text).catch(() => toast("Salin teks lewat tombol Copy.", "err"));
    else toast("Salin teks lewat tombol Copy.", "err");
  }
  if (type === "fb") window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(f.link)}`, "_blank", "noopener,noreferrer");
  if (type === "ads") {
    $("psFetch").textContent = "Headline, deskripsi, dan minat Youtuber siap. Buka Google Ads untuk menyalin materi lengkap, lalu tempel dan atur kampanye; iklan belum tayang.";
  }
  toast(`${CARDS.find((c) => c.type === type).title} dibuat! -${cost(type)} Poin`, "ok");
}

$("psHasil").addEventListener("click", async (e) => {
  const b = e.target.closest('[data-psx]');
  if (!b || !hasil) return;
  if (b.dataset.psx === "open-ads") {
    if (!agencyAllowed) return toast("Upgrade ke Agency Rp399k di Pengaturan untuk beriklan", "err");
    window.open("https://ads.google.com/home/campaigns/new?campaignType=VIDEO", "_blank", "noopener,noreferrer");
    try {
      await navigator.clipboard.writeText(`${hasil.text}\n\n${youtuberTargeting(lastSearch.judul).text}`);
      toast("Materi iklan + minat Youtuber tersalin. Tempel di Google Ads.", "ok");
    } catch {
      toast("Google Ads dibuka. Gunakan Copy Semua dan Copy Targeting Youtuber, atau salin teks secara manual.", "err");
    }
    return;
  }
  if (b.dataset.psx === "regenerate") return generateShare(hasil.type);
  try {
    const targetingOnly = b.dataset.psx === "copy-targeting";
    const text = targetingOnly ? youtuberTargeting(lastSearch.judul).text
      : hasil.type === "ads" ? `${hasil.text}\n\n${youtuberTargeting(lastSearch.judul).text}` : hasil.text;
    await navigator.clipboard.writeText(text);
    toast("Teks tercopy!", "ok");
  } catch {
    $("psHasil").querySelector(b.dataset.psx === "copy-targeting" ? "#youtuberTargetingText" : "textarea").select();
    toast("Pilih teks lalu salin secara manual.", "err");
  }
});
$("promoOptions").addEventListener("input", (e) => {
  if (!hasil) return;
  if (e.target.dataset.pso === "link") shareOptions[hasil.type].link = e.target.value;
});
$("promoOptions").addEventListener("change", (e) => {
  const key = e.target.dataset.pso;
  if (!hasil || !key) return;
  shareOptions[hasil.type][key] = e.target.value;
  const text = shareText(hasil.type, lastSearch);
  if (text !== null) hasil.text = text;
  renderHasil();
});
$("psCards").addEventListener("click", (e) => { const b = e.target.closest("[data-ps]"); if (b && !b.disabled) { if (b.dataset.ps === "review") createReview(b); else generateShare(b.dataset.ps); } });

// Pencarian berbayar dilakukan di server; Refresh hanya mereset tampilan.
let searchBusy = false;
let searchVersion = 0;
function clearSearch() {
  lastSearch = null;
  $("psCards").querySelectorAll?.("[data-ps]").forEach((pill) => pill.setAttribute("aria-pressed", "false"));
  $("hasilOtomatis").hidden = true;
  $("psEmpty").hidden = false;
  $("linkIklan").value = "";
  $("linkIklanLabel").textContent = "Terisi otomatis dari pencarian di atas";
  for (const id of ["autoJudul", "autoNiche", "autoTarget", "autoKeyword"]) $(id).textContent = "-";
  hasil = null;
  $("psHasil").hidden = true;
  $("psHasil").innerHTML = "";
  $("promoOptions").innerHTML = "";
  $("psFetch").textContent = "";
}
function refreshGratis() {
  closeSuggestions();
  ++searchVersion;
  $("psLink").value = "";
  clearSearch();
  $("psLink").focus();
}
async function cariBayar(selectedLink) {
  if (searchBusy) return;
  const link = typeof selectedLink === "string" ? selectedLink : $("psLink").value.trim();
  if (!link) return toast("Paste link YouTube dulu!", "err");
  if (!isYt(link)) return toast("Masukkan Link Video YouTube yang valid dulu!", "err");
  if (!btpSession()) return toast("Login dulu untuk Cari video.", "err");
  const version = ++searchVersion;
  const session = btpSession();
  clearSearch();
  searchBusy = true;
  $("btnCari").disabled = true;
  $("btnCari").textContent = "Mencari…";
  $("psFetch").textContent = "Mengambil judul video…";
  try {
    const res = await btpApi("/api/promotion-search", { method: "POST", body: JSON.stringify({ link }) });
    const data = await res.json();
    if (session !== btpSession()) return;
    if (typeof data.btp_poin === "number") saveSaldo(data.btp_poin);
    if (!res.ok) throw new Error(data.error || "Pencarian gagal. Coba lagi.");
    if (version !== searchVersion) return;
    closeSuggestions();
    lastSearch = data.search;
    $("autoJudul").textContent = lastSearch.judul;
    $("autoThumb").src = lastSearch.thumbnail;
    $("autoChannel").textContent = lastSearch.channel;
    $("psEmpty").hidden = true;
    $("linkIklan").value = lastSearch.link;
    $("linkIklanLabel").textContent = lastSearch.link;
    $("judulIklan").value = lastSearch.judul.slice(0,150);
    $("deskripsiIklan").value = `Mohon feedback untuk thumbnail dan judul video "${lastSearch.judul}".`.slice(0,1000);
    $("autoNiche").textContent = lastSearch.niche;
    $("autoTarget").textContent = lastSearch.negara;
    $("autoKeyword").textContent = lastSearch.keyword;
    $("hasilOtomatis").hidden = false;
    hasil = { type: "fb", text: "", link: lastSearch.link };
    $("psFetch").textContent = "Video siap · Generate teks 2 Poin.";
  } catch (err) {
    if (version === searchVersion && session === btpSession()) $("psFetch").textContent = err.message;
  } finally {
    searchBusy = false;
    $("btnCari").disabled = false;
    $("btnCari").textContent = "Cari 2 Poin";
  }
}
$("psLink").addEventListener("input", () => { ++searchVersion; clearSearch(); closeSuggestions(); queueSuggestions(); });
$("psLink").addEventListener("keydown", (event) => { if (event.key === "Enter") { event.preventDefault(); if (isYt($("psLink").value)) cariBayar(); else loadSuggestions(); } });
$("btnRefresh").addEventListener("click", refreshGratis);
$("btnCari").addEventListener("click", () => isYt($("psLink").value) ? cariBayar() : loadSuggestions());
window.addEventListener("storage", (event) => { if (event.key === "btp_session") { ++searchVersion; clearSearch(); } });
window.addEventListener("credits-updated", () => { refreshAgency(); if (!btpSession()) { ++searchVersion; clearSearch(); } });

let suggestionTimer;
let suggestionVersion = 0;
let suggestedVideos = [];
function closeSuggestions() {
  ++suggestionVersion;
  clearTimeout(suggestionTimer);
  $("videoSuggestions").hidden = true;
  $("psLink").setAttribute?.("aria-expanded", "false");
}
function queueSuggestions() { clearTimeout(suggestionTimer); ++suggestionVersion; suggestionTimer = setTimeout(loadSuggestions, 450); }
async function loadSuggestions() {
  const query = $("psLink").value.trim();
  if (query.length < 3) return closeSuggestions();
  const version = ++suggestionVersion;
  $("videoSuggestions").hidden = false;
  $("psLink").setAttribute?.("aria-expanded", "true");
  $("videoSuggestions").innerHTML = '<p role="status">Mencari video…</p>';
  try {
    const res = await btpApi(`/api/promotion-suggestions?q=${encodeURIComponent(query)}`);
    const data = await res.json();
    if (version !== suggestionVersion || query !== $("psLink").value.trim()) return;
    if (!res.ok) throw Error(data.error || "Pencarian gagal.");
    suggestedVideos = (data.videos || []).slice(0, 5);
    $("videoSuggestions").innerHTML = suggestedVideos.length ? suggestedVideos.map((v, i) => `<button type="button" role="option" aria-selected="false" data-video="${i}"><img src="${esc(v.thumbnail)}" width="40" height="30" alt=""><span><strong>${esc(v.judul)}</strong><small>${esc(v.channel)}</small></span></button>`).join("") : '<p role="status">Video tidak ditemukan. Coba judul lain.</p>';
  } catch (error) { if (version === suggestionVersion) $("videoSuggestions").innerHTML = `<p role="status">${esc(error.message)}</p>`; }
}
$("psLink").addEventListener("focus", () => { if (!lastSearch) queueSuggestions(); });
$("psLink").addEventListener("keydown", event => {
  if (event.key === "Escape") closeSuggestions();
  if (event.key === "ArrowDown") { event.preventDefault(); $("videoSuggestions").querySelector("button")?.focus(); }
});
$("videoSuggestions").addEventListener("click", event => {
  const button = event.target.closest("[data-video]");
  if (!button) return;
  const video = suggestedVideos[Number(button.dataset.video)];
  closeSuggestions(); cariBayar(video.link);
});
$("videoSuggestions").addEventListener("keydown", event => {
  if (event.key === "Escape") { closeSuggestions(); $("psLink").focus(); }
  if (["ArrowDown", "ArrowUp"].includes(event.key)) {
    event.preventDefault();
    const buttons = [...$("videoSuggestions").querySelectorAll("button")];
    buttons[(buttons.indexOf(event.target) + (event.key === "ArrowDown" ? 1 : buttons.length - 1)) % buttons.length]?.focus();
  }
});
document.addEventListener("click", event => { if (!event.target.closest(".video-search-input")) closeSuggestions(); });
async function createReview(button) {
  if (!agencyAllowed || !lastSearch || searchBusy) return;
  $("jenisTugas").value = "review";
  $("judulIklan").value = lastSearch.judul.slice(0, 150);
  $("deskripsiIklan").value = `Mohon feedback jujur tentang thumbnail dan judul video: ${lastSearch.judul}`.slice(0, 600);
  $("reviewInstallDialog").showModal();
  dispatchEvent(new Event("review-budget-update"));
  $("judulIklan").focus();
  $("psFetch").textContent = "Periksa tugas dan centang persetujuan sebelum memasang iklan.";
}

})();
