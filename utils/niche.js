// Deteksi niche & bahasa universal untuk semua channel (dalam & luar negeri)
// Dipakai index.html: BTP_NICHE.detect(video), BTP_NICHE.channel(videos), BTP_NICHE.PROFILES, BTP_NICHE.applyLang(root, lang)
(function () {
  // Pola per niche: judul x3, tag x2, deskripsi x1, kategori YouTube +3
  const RULES = {
    gaming: /mobile legends?|\bmlbb\b|free ?fire|\bpubg\b|minecraft|roblox|valorant|genshin|fortnite|\bgta\b|gaming|gameplay|\bgamer?s?\b|mabar|push rank|mythic|esports?|walkthrough|let'?s play|speedrun|ranked/,
    edukasi: /tutorial|how to|\bcara\b|belajar|edukasi|education|explained|psikologi|psychology|sains|science|sejarah|history|lesson|kursus|course|pelajaran|matematika|panduan|\bguide\b|tips|learn|fakta|facts/,
    food: /masak|resep|kuliner|masakan|cooking|recipe|\bfood\b|dapur|street food|mukbang|\bmakan\b|sambal|kitchen|\bchef\b/,
    vlog: /\bvlog|travel|traveling|jalan[- ]jalan|\btrip\b|liburan|wisata|explore|daily life|keseharian|backpack|\btour\b|day in my life|staycation|road ?trip/,
    tech: /review|unboxing|gadget|smartphone|iphone|samsung|xiaomi|laptop|teknologi|\btech\b|android|\bpc\b build/,
    komedi: /komedi|comedy|lucu|ngakak|sketsa|prank|stand ?up|funny|meme/,
    news: /berita|\bnews\b|breaking|terkini|liputan|update hari ini/,
    music: /\blagu\b|music|musik|cover|lirik|\bsong\b|lyrics|official (audio|video)|\bpiano\b|akustik|acoustic|instrumental/,
  };
  const CATEGORY = { 20: "gaming", 27: "edukasi", 26: "edukasi", 19: "vlog", 10: "music", 28: "tech", 23: "komedi", 34: "komedi", 25: "news", 22: "vlog" };
  const ORDER = ["gaming", "edukasi", "food", "vlog", "tech", "komedi", "news", "music"];

  const EN_WORDS = new Set("the and you your to of for with how this is my in best why what that are it on top ways will can never most every from get make life peaceful relaxing".split(" "));
  const ID_WORDS = new Set("yang dan di ke ini itu untuk dengan cara lagu aku kamu tidak bikin dari paling banget jadi gak sama hati hidup terbaru enak lucu masak resep jalan".split(" "));

  function detectLang(v) {
    const code = String(v.defaultLanguage || v.defaultAudioLanguage || v.lang || "").toLowerCase();
    if (/^en/.test(code)) return "en";
    if (/^(id|ms|jv|su)/.test(code)) return "id";
    const words = `${v.title || ""} ${String(v.description || "").slice(0, 300)}`.toLowerCase().match(/[a-z']+/g) || [];
    let en = 0, id = 0;
    for (const w of words) { if (EN_WORDS.has(w)) en++; if (ID_WORDS.has(w)) id++; }
    return en >= 2 && en > id * 1.5 ? "en" : "id";
  }

  // { niche, topic, lang, score } - niche "intl" kalau konten berbahasa Inggris (topic = genre aslinya)
  function detect(v) {
    const title = String(v.title || "").toLowerCase(), tags = (v.tags || []).join(" ").toLowerCase(), desc = String(v.description || "").slice(0, 400).toLowerCase();
    const score = {};
    for (const k of ORDER) {
      const re = RULES[k];
      score[k] = (re.test(title) ? 3 : 0) + (re.test(tags) ? 2 : 0) + (re.test(desc) ? 1 : 0);
    }
    const cat = CATEGORY[Number(v.categoryId)];
    if (cat) score[cat] += 3;
    let topic = "umum", best = 0;
    for (const k of ORDER) if (score[k] > best) { best = score[k]; topic = k; }
    const lang = detectLang(v);
    return { niche: lang === "en" ? "intl" : topic, topic, lang, score: best };
  }

  // Niche & bahasa mayoritas channel (video public saja kalau statusnya diketahui)
  function channel(videos) {
    const list = (videos || []).filter((v) => !v.privacy || v.privacy === "public");
    const counts = {}, langs = { id: 0, en: 0 };
    for (const v of list.length ? list : videos || []) {
      const d = v._niche || detect(v);
      counts[d.niche] = (counts[d.niche] || 0) + 1;
      langs[d.lang]++;
    }
    const ranked = Object.entries(counts).sort((a, b) => b[1] - a[1]);
    const lang = langs.en > langs.id ? "en" : "id";
    // "umum" hanya menang kalau tidak ada niche lain yang jelas
    const top = ranked.find(([k]) => k !== "umum") || ranked[0];
    const niche = lang === "en" ? "intl" : top && (top[0] !== "umum" && top[1] >= Math.max(1, ranked[0][1] * 0.35)) ? top[0] : ranked[0]?.[0] || "umum";
    return { niche, lang, counts, total: list.length || (videos || []).length };
  }

  // mix = rekomendasi, tier1 = full RPM tinggi, mult = pengali RPM benchmark wilayah untuk niche ini (CPM edukasi/tech jauh lebih mahal)
  const PROFILES = {
    gaming: { label: "Gaming", labelEn: "Gaming", emoji: "🎮", upload: "gaming", group: "gaming", rpm: "$4 - $6", mult: 1.5, global: true,
      geo: { mix: { US: 40, KR: 20, JP: 15, ID: 25 }, tier1: { US: 50, KR: 20, JP: 15, GB: 15 },
        why: "Advertiser game (mobile game, hardware, top up) bayar CPM Tier 1 mahal di USA, Korea & Jepang - pasar gaming terbesar di dunia." },
      thumb: { texts: ["AUTO MYTHIC!", "RAHASIA PRO PLAYER!", "1 VS 5 AUTO MENANG!"], look: "Merah / neon, karakter game, efek glow, teks besar" } },
    edukasi: { label: "Edukasi / Tutorial", labelEn: "Education / Tutorial", emoji: "🎓", upload: "tutorial", group: "edukasi", rpm: "$8 - $12", mult: 2, global: true,
      geo: { mix: { US: 50, GB: 20, CA: 15, ID: 15 }, tier1: { US: 55, GB: 20, CA: 15, AU: 10 },
        why: "Edukasi = CPM paling mahal di dunia (advertiser kursus, software, finance). Penonton USA/UK/Kanada bayar 10-20x Indonesia." },
      thumb: { texts: ["TERBUKTI AMPUH!", "JARANG ORANG TAHU!", "5 MENIT LANGSUNG BISA!"], look: "Biru profesional, ikon buku / lampu ide, bersih" } },
    vlog: { label: "Vlog / Travel", labelEn: "Vlog / Travel", emoji: "✈️", upload: "vlog", group: "vlog", rpm: "$3 - $5", mult: 1, global: true,
      geo: { mix: { SG: 30, AU: 25, US: 25, ID: 20 }, tier1: { SG: 35, AU: 30, US: 35 },
        why: "Penonton travel Singapura & Australia paling sering liburan ke Indonesia - CPM travel/hotel/airline tinggi, USA paling mahal." },
      thumb: { texts: ["TEMPAT INI GILA!", "GAK NYANGKA SEINDAH INI!", "WAJIB KE SINI!"], look: "Foto travel cerah, face cam, warna hangat" } },
    food: { label: "Kuliner / Food", labelEn: "Food / Cooking", emoji: "🍜", upload: "kuliner", group: "food", rpm: "$2.5 - $4", mult: 0.9, global: true,
      geo: { mix: { US: 35, AU: 20, SG: 15, ID: 30 }, tier1: { US: 45, AU: 25, SG: 15, GB: 15 },
        why: "Masakan Indonesia lagi naik daun di USA & Australia, advertiser food & kitchen bayar CPM tinggi. Tetap 30% Indonesia untuk volume." },
      thumb: { texts: ["ANTI GAGAL!", "RASA RESTORAN!", "BIKIN NAGIH!"], look: "Close-up makanan, uap panas, warna menggugah selera" } },
    intl: { label: "International (English)", labelEn: "International (English)", emoji: "🌍", upload: "intl", group: "intl", rpm: "$6 - $15", mult: 1.8, global: true, lang: "en",
      geo: { mix: { US: 50, GB: 20, CA: 15, AU: 15 }, tier1: { US: 55, GB: 20, CA: 15, AU: 10 },
        why: "English content competes globally: USA, UK, Canada & Australia are Tier 1 markets with the highest CPM on YouTube - SULTAN!" },
      thumb: { texts: ["YOU NEED THIS!", "WATCH TILL THE END", "THIS CHANGED EVERYTHING"], look: "Clean modern style, bold English text, premium colors" } },
    music: { label: "Musik", labelEn: "Music", emoji: "🎵", upload: "umum", group: "music", rpm: "$1 - $2.5", mult: 1, global: false,
      geo: { mix: { ID: 60, MY: 20, SG: 10, US: 10 }, tier1: { US: 35, SG: 25, GB: 15, AU: 15, CA: 10 },
        why: "Musik berbahasa Indonesia paling gampang diterima di Malaysia & Singapura, diaspora USA bayar CPM tertinggi." },
      thumb: { texts: ["LAGU INI BIKIN MERINDING!", "DENGERIN SAMPAI REFF!", "VIRAL BANGET!"], look: "Panggung / studio musik, cahaya dramatis" } },
    tech: { label: "Teknologi", labelEn: "Tech", emoji: "📱", upload: "tutorial", group: "tech", rpm: "$4 - $8", mult: 1.6, global: true,
      geo: { mix: { US: 40, GB: 15, SG: 15, ID: 30 }, tier1: { US: 50, GB: 20, CA: 15, AU: 15 },
        why: "Advertiser gadget & software bayar CPM tinggi di USA/UK, Singapura paling dekat dan melek teknologi." },
      thumb: { texts: ["JANGAN BELI DULU!", "WORTH IT?", "REVIEW JUJUR!"], look: "Gadget close-up, latar gelap, aksen biru" } },
    komedi: { label: "Komedi", labelEn: "Comedy", emoji: "😂", upload: "umum", group: "komedi", rpm: "$0.5 - $1.5", mult: 0.8, global: false,
      geo: { mix: { ID: 65, MY: 15, SG: 10, US: 10 }, tier1: { SG: 35, MY: 25, US: 25, AU: 15 },
        why: "Humor berbahasa Indonesia paling nyambung di Malaysia & Singapura - CPM 3-8x lebih tinggi dari Indonesia." },
      thumb: { texts: ["NGAKAK PARAH!", "ENDINGNYA GAK NYANGKA!", "JANGAN DITONTON SENDIRIAN!"], look: "Ekspresi lucu, warna cerah" } },
    news: { label: "Berita", labelEn: "News", emoji: "📰", upload: "umum", group: "news", rpm: "$1 - $3", mult: 1, global: false,
      geo: { mix: { ID: 65, MY: 15, SG: 10, US: 10 }, tier1: { US: 40, GB: 20, CA: 15, AU: 15, SG: 10 },
        why: "Penonton berita diaspora di Malaysia, Singapura & USA bayar CPM lebih tinggi dari Indonesia." },
      thumb: { texts: ["TERUNGKAP!", "FAKTA SEBENARNYA!", "UPDATE TERBARU!"], look: "Gaya berita, merah-putih, teks tegas" } },
    umum: { label: "Umum", labelEn: "General", emoji: "🔥", upload: "umum", group: "umum", rpm: "$1 - $3", mult: 1, global: false,
      geo: { mix: { ID: 65, MY: 15, SG: 10, US: 10 }, tier1: { US: 40, GB: 20, CA: 15, AU: 15, SG: 10 },
        why: "Malaysia & Singapura paham bahasa Indonesia dengan CPM 3-8x lebih tinggi, USA paling mahal tapi penontonnya sedikit." },
      thumb: { texts: ["WAJIB TONTON!", "GAK NYANGKA!", "VIRAL!"], look: "Kontras tinggi, warna cerah" } },
  };
  const profile = (k) => PROFILES[k] || PROFILES.umum;
  const label = (k, lang) => (lang === "en" ? profile(k).labelEn : profile(k).label);

  // Ganti teks UI sesuai bahasa video: elemen [data-en] (innerHTML) & [data-en-ph] (placeholder); teks asli disimpan di data-idn
  function applyLang(root, lang) {
    (root || document).querySelectorAll("[data-en]").forEach((el) => {
      if (el.dataset.idn == null) el.dataset.idn = el.innerHTML;
      el.innerHTML = lang === "en" ? el.dataset.en : el.dataset.idn;
    });
    (root || document).querySelectorAll("[data-en-ph]").forEach((el) => {
      if (el.dataset.idnPh == null) el.dataset.idnPh = el.placeholder;
      el.placeholder = lang === "en" ? el.dataset.enPh : el.dataset.idnPh;
    });
  }

  window.BTP_NICHE = { detect, detectLang, channel, PROFILES, profile, label, applyLang };
})();
