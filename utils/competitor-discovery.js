let competitorPlanState = null;
function competitorLanguage() {
  try { return localStorage.getItem('boster_language') || 'id'; } catch { return 'id'; }
}
function competitorCopy() {
  const id = {
    analyze:'Analisa', points:'Poin', competitors:'Kompetitor', selected:'Om pilih', needs:'Video membutuhkan', upgrade:'Upgrade biar bisa lebih banyak!',
    free:'💡 Paket Free cuma 1 Kompetitor!', starter:'🔒 Butuh Lebih Banyak Kompetitor?', pro:'🚀 Mau 30 Video MAX?', agency:'✅ Paket Agency aktif!',
    freeButton:'Lihat Paket - Mulai Rp79.000', starterButton:'Upgrade ke Pro / Agency', proButton:'Upgrade ke Agency $29.99 - Best Value',
    unlimited:'Channel Tanpa Batas + Priority AI', limit:'cuma', settings:'Lihat di Pengaturan',
    free_label:'GRATIS', remaining:'Sisa', video:'video', quotaLeft:'Sisa kuota gratis Anda: {n} video lagi bulan ini. Reset tiap tanggal 1.',
  };
  const en = {analyze:'Analyze',points:'Points',competitors:'Competitors',selected:'You selected',needs:'videos require',upgrade:'Upgrade for more competitors!',free:'💡 Free includes only 1 competitor!',starter:'🔒 Need more competitors?',pro:'🚀 Want 30 videos MAX?',agency:'✅ Agency plan is active!',freeButton:'View plans - From Rp79.000',starterButton:'Upgrade to Pro / Agency',proButton:'Upgrade to Agency $29.99 - Best Value',unlimited:'Unlimited channels + Priority AI',limit:'allows only',settings:'See Settings',free_label:'FREE',remaining:'Left',video:'videos',quotaLeft:'Your free quota: {n} more videos this month. Resets on the 1st.'};
  const ms = {...id,analyze:'Analisis',competitors:'Pesaing',selected:'Anda pilih',needs:'Video memerlukan',upgrade:'Naik taraf untuk lebih banyak pesaing!',free:'💡 Pelan Free hanya 1 pesaing!',starter:'🔒 Perlukan lebih banyak pesaing?',pro:'🚀 Mahu 30 Video MAX?',agency:'✅ Pelan Agency aktif!',freeButton:'Lihat Pelan - Dari Rp79.000',starterButton:'Naik Taraf ke Pro / Agency',proButton:'Naik Taraf ke Agency $29.99 - Best Value',unlimited:'Saluran Tanpa Had + Priority AI',limit:'hanya',settings:'Lihat Tetapan',remaining:'Baki',quotaLeft:'Baki kuota percuma anda: {n} video lagi bulan ini. Set semula setiap 1 haribulan.'};
  return competitorLanguage() === 'en' ? en : competitorLanguage() === 'ms' ? ms : id;
}
function competitorLimitMessage() {
  const t=competitorCopy(), {plan,limit}=competitorPlanState;
  return `💡 ${plan.toUpperCase()} ${t.limit} ${limit} ${t.competitors}. ${t.settings}: Starter Rp49k=3, Pro Rp149k=10, Agency Rp399k=30`;
}
// Green while Agency's monthly free quota covers the selection, purple when the analysis costs points.
function setCompetitorButton(label, free) {
  const btn=$('kpBtn');
  btn.textContent=label;
  btn.style.backgroundImage=free?'linear-gradient(to right,#059669,#10b981)':'linear-gradient(to right,#7c3aed,#6d28d9)';
}
function renderCompetitorPlan() {
  if (!competitorPlanState) return;
  const {plan,limit}=competitorPlanState, count=Number($('jumlahVideo').value), t=competitorCopy();
  if (competitorPlanState.isUnlimited) {
    $('kpPlanAdvice').hidden=true;
    $('kpBtn').textContent=`${t.analyze} · Unlimited · 0 Poin`;
    [...$('jumlahVideo').options].forEach(o=>{o.textContent=`${o.value} Video · 0 Poin${o.value==='30'?' - MAX':''}`;});
    return;
  }
  const prices = {starter:'Starter 500 P (Rp79.000 / $4.99)',pro:'Pro 2.000 P (Rp249.000 / $14.99)',agency:'Agency 5.000 P (Rp499.000 / $29.99)'};
  const box=$('kpPlanAdvice');
  box.hidden=plan!=='free' && plan!=='agency' && count<=limit;
  const recommendations=plan==='free' ? `${prices.starter} = 3 ${t.competitors} | ${prices.pro} = 10 ${t.competitors} | ${prices.agency} = 30 Video (60 ${t.points}) MAX` : plan==='starter' ? `${prices.pro} = 10 ${t.competitors} | ${prices.agency} = 30 Video (60 ${t.points}) MAX — ${t.unlimited}` : `${prices.agency} = 30 Video (60 ${t.points}) MAX — ${t.unlimited}`;
  const quota=competitorPlanState.freeQuota, quotaLine=quota?`<p class="text-xs mt-1 font-bold">${t.quotaLeft.replace('{n}',quota.remaining)}</p>`:'';
  box.innerHTML=`<p class="text-sm font-bold">${t[plan]}</p>${quotaLine}<p class="text-xs mt-1">${plan==='agency' ? recommendations : `${plan==='free'?'Free 50 P (Rp0)':prices[plan]} = ${limit} ${t.competitors}. ${t.selected} ${count} ${t.needs} ${count} ${t.competitors}. ${t.upgrade}`}</p>${plan==='agency'?'':`<p class="text-xs mt-1">${recommendations}</p><a href="/pengaturan" class="mt-2 inline-block text-center bg-purple-600 text-white text-xs px-3 py-2 rounded w-full">${t[plan+'Button']}</a>`}`;
  if (quota && count<=quota.remaining) setCompetitorButton(`${t.analyze} (${t.free_label} - ${t.remaining} ${quota.remaining}/${quota.limit} ${t.video})`, true);
  else setCompetitorButton(`${t.analyze} (${count*2} ${t.points})`, false);
  [...$('jumlahVideo').options].forEach(o=>{o.textContent=`${o.value} Video (${Number(o.value)*2} ${t.points})${o.value==='30'?' - MAX':''}`;});
}
window.addEventListener('boster-language',renderCompetitorPlan);
window.addEventListener('storage',e=>{if(e.key==='boster_language')renderCompetitorPlan();});
async function initCompetitorPlans() {
  $('kpBtn').disabled=true;
  try {
    const response=await btpApi('/api/kompetitor/discover',{method:'POST',body:JSON.stringify({action:'limits'})});
    if(!response.ok) throw new Error('Plan unavailable');
    competitorPlanState=await response.json();
    $('jumlahVideo').value=String(competitorPlanState.limit>=10?10:1);
    updateCompetitorChoice();
    loadCompetitors();
  } catch(error) { if(!window.BTPApiStatus?.isSoftError(error)) $('kpDiscoveryNote').textContent=error.message; }
}
/* Free automatic recommendations; only an explicit niche reanalysis costs points. */
let competitorFeed = null, competitorSort = 'viral', competitorBusy = false;
const competitorViews = v => Number(v.statistics?.viewCount) || 0;
const competitorVph = v => competitorViews(v) / Math.max(1,(Date.now()-Date.parse(v.snippet?.publishedAt))/3600e3 || 1);
// Public API has no attributed subscriber gains: this tab uses a clearly labelled proxy.
const competitorMagnet = v => v.channel?.statistics?.hiddenSubscriberCount ? 0 : competitorViews(v) / Math.max(1, Number(v.channel?.statistics?.subscriberCount) || 0);
function competitorSkeletons() {
  $('kpDiscoveryGrid').innerHTML = Array.from({length:10},()=>'<div class="kp-skeleton" aria-hidden="true"><div class="kp-skeleton-thumb"></div><div class="kp-skeleton-line"></div><div class="kp-skeleton-line" style="width:60%"></div></div>').join('');
}
function categoryLabel() {
  return $('kategoriNiche').value === '10' ? 'Musik' : $('kategoriNiche').selectedOptions[0].textContent;
}
function updateCompetitorChoice() {
  $('kpDetected').textContent = `Kategori Channel Kamu Pilihanmu: ${categoryLabel()}`;
  renderCompetitorPlan();
}
async function loadCompetitors(manual = false, refresh = false) {
  if (competitorBusy || !competitorPlanState) return;
  if(manual && Number($('jumlahVideo').value)>competitorPlanState.limit) return toast(competitorLimitMessage(), 'err');
  if (refresh) {
    $('kategoriNiche').value = '10';
    $('jumlahVideo').value = competitorPlanState.limit>=10?'10':'1';
    updateCompetitorChoice();
    try {
      const channelId = competitorFeed?.channelId || JSON.parse(localStorage.getItem('bostertube_user') || 'null')?.youtubeAccount?.channelId;
      if (channelId) Object.keys(localStorage).forEach(key => {
        if (key.startsWith(`kompetitor_${channelId}_`)) localStorage.removeItem(key);
      });
    } catch { /* Refresh also works when browser storage is unavailable. */ }
  }
  const categoryId = $('kategoriNiche').value;
  const count = Number($('jumlahVideo').value), quota = competitorPlanState.freeQuota, cost = quota && count<=quota.remaining ? 0 : count*2;
  if (manual && !competitorPlanState.isUnlimited && !checkIsAdmin() && getCredits() < cost) return showModalPoinHabis(getCredits(),cost);
  competitorBusy = true;
  $('kpBtn').disabled = true;
  $('btnRefresh').disabled = true;
  $('kategoriNiche').disabled = true;
  $('jumlahVideo').disabled = true;
  $('kpRetry').hidden = true;
  $('kpDiscoveryGrid').setAttribute('aria-busy','true');
  $('kpDiscoveryNote').textContent = manual || refresh ? `Mencari video ${categoryLabel()} terpopuler...` : 'Membaca video channel dan mencari 10 rekomendasi gratis…';
  if (!competitorFeed) competitorSkeletons();
  try {
    const response = await btpApi('/api/kompetitor/discover', {method:'POST',body:JSON.stringify(refresh ? {action:'refresh'} : manual ? {action:'category',categoryId,count} : {action:'auto'})});
    const result = await response.json();
    if (!response.ok) {
      if(result.code==='PLAN_LIMIT') { competitorPlanState={...competitorPlanState,plan:result.plan,limit:result.limit}; renderCompetitorPlan(); throw new Error(competitorLimitMessage()); }
      throw new Error(result.error || 'Rekomendasi belum tersedia.');
    }
    competitorFeed = result;
    if (result.freeQuota !== undefined) competitorPlanState = {...competitorPlanState, freeQuota: result.freeQuota};
    // Apply the authoritative balance even if browser history storage is unavailable.
    if (typeof result.btp_poin === 'number') saveSaldo(result.btp_poin);
    if (!manual && [...$('kategoriNiche').options].some(o=>o.value===String(result.categoryId))) $('kategoriNiche').value = String(result.categoryId);
    updateCompetitorChoice();
    try {
      localStorage.setItem(`kompetitor_${result.channelId}_${manual ? categoryId : $('kategoriNiche').value}`, JSON.stringify(result.videos));
    } catch { /* Browser storage is optional; the server caches category results. */ }
    $('kpFeedCost').textContent = result.cost ? `${result.cost} Poin` : 'GRATIS · 0 Poin';
    $('kpDiscoveryTitle').textContent = manual || refresh ? `Video Terpopuler Kategori ${result.niche}` : 'Top 10 Video di Niche Kamu Minggu Ini';
    renderCompetitors();
    if (manual) toast(`Analisa selesai · ${result.cost ? `${result.cost} Poin` : 'GRATIS'}`, 'ok');
  } catch(error){if(window.BTPApiStatus?.isSoftError(error))return;
    if (!competitorFeed) $('kpDiscoveryGrid').replaceChildren();
    $('kpDiscoveryNote').textContent = error.message;
    // Retry is only for the free initial feed; paid requests use Analisa again.
    competitorRetryRefresh = refresh;
    $('kpRetry').hidden = manual;
  } finally {
    competitorBusy = false;
    $('kpBtn').disabled = false;
    $('btnRefresh').disabled = false;
    $('kategoriNiche').disabled = false;
    $('jumlahVideo').disabled = false;
    $('kpDiscoveryGrid').setAttribute('aria-busy','false');
  }
}
function renderCompetitors() {
  if (!competitorFeed) return;
  const metric = competitorSort === 'views' ? competitorViews : competitorSort === 'magnet' ? competitorMagnet : competitorVph;
  const videos = [...competitorFeed.videos].sort((a,b)=>metric(b)-metric(a));
  $('kpDiscoveryGrid').setAttribute('aria-labelledby',`kpTab-${competitorSort}`);
  $('kpDiscoveryNote').textContent = competitorFeed.mode === 'category' ? `Menampilkan ${videos.length} video terpopuler kategori ${competitorFeed.niche} minggu ini. Peringkat mostPopular Indonesia; video dapat terbit sebelum minggu ini. ${competitorSort === 'magnet' ? 'Subscriber Magnet: rasio views/subscriber.' : 'VPH: rata-rata views/jam sejak terbit.'}` : `${videos.length} video · 1 video per kompetitor · Viral: rata-rata views/jam sejak terbit. ${competitorSort === 'magnet' ? 'Subscriber Magnet: rasio views/subscriber, bukan subscriber baru aktual. ' : ''}${videos.some(v=>!v.weekly) ? 'Channel tanpa upload minggu ini menampilkan video terlaris sepanjang waktu (ditandai).' : 'Video terlaris dari 7 hari terakhir.'}${competitorFeed.stale ? ' Menampilkan cache terakhir karena API belum tersedia.' : ''}${competitorFeed.partial ? ' Sebagian channel belum dapat dimuat.' : ''}`;
  $('kpDiscoveryGrid').innerHTML = videos.map(v => {
    const thumb = v.snippet?.thumbnails?.medium?.url || v.snippet?.thumbnails?.default?.url || '';
    return `<button type="button" class="kp-video-card" data-discovery-video="${esc(v.id)}" aria-label="Analisis ${esc(v.snippet?.title)}">
      <img src="${esc(thumb)}" alt="" loading="lazy"><div style="padding:10px"><h3>${esc(v.snippet?.title)}</h3><p class="text-[10px] text-gray-500 mt-1 truncate">${esc(v.snippet?.channelTitle)}</p><p class="text-[11px] font-bold mt-2">${short(competitorViews(v))} views</p><p class="text-[10px] text-gray-500">${short(competitorVph(v))} VPH rata-rata</p><p class="text-[10px] text-gray-500 mt-1">${v.weekly ? '7 hari terakhir' : 'Terlaris sepanjang waktu'}</p></div></button>`;
  }).join('');
}
let activeCompetitor = null, competitorModalVersion = 0;
const competitorContent = new Map();
const competitorContentBusy = new Set();
const competitorTabLabels = {judul:'🎬 Judul (5 Poin)',deskripsi:'📝 Deskripsi (5 Poin)',keyword:'🔑 Kata Kunci (3 Poin)',tag:'🏷️ Tag (3 Poin)',hashtag:'#️⃣ Hashtag (2 Poin)',detail:'📊 Detail'};
const statNumber = value => value == null ? '—' : Number(value).toLocaleString('id-ID',{maximumFractionDigits:1});
const statUsd = value => Number(value).toLocaleString('en-US',{style:'currency',currency:'USD',minimumFractionDigits:2,maximumFractionDigits:2});
const earningRange = value => value ? `${statUsd(value.low)} – ${statUsd(value.high)}` : '—';
function competitorChart(rows, title, estimated) {
  const max = Math.max(1,...rows.map(r=>r.views||0));
  return `<figure class="kp-chart"><figcaption>${title} · ${estimated ? 'Estimasi' : 'YouTube Analytics'}</figcaption><div class="kp-chart-bars" role="img" aria-label="${title}, ${estimated ? 'estimasi rata-rata VPH, bukan tren aktual' : 'views harian'}">${rows.map(r=>`<div style="height:${Math.max(1,(r.views||0)/max*100)}%" title="${esc(r.day)}: ${statNumber(r.views)} views"></div>`).join('')}</div><details><summary>Data harian</summary><table><thead><tr><th>Tanggal</th><th>Views</th></tr></thead><tbody>${rows.map(r=>`<tr><td>${esc(r.day)}</td><td>${statNumber(r.views)}</td></tr>`).join('')}</tbody></table></details></figure>`;
}
function renderCompetitorStats(stats, v) {
  const estimated = stats.estimated ? 'Estimasi · ' : '';
  const ratio = v.channel?.statistics?.hiddenSubscriberCount || !Number(v.channel?.statistics?.subscriberCount) ? 'Tidak tersedia' : competitorMagnet(v).toFixed(2)+'x';
  const card = (value,label,note='')=>`<div class="kp-out kp-stat"><b>${value}</b><span>${label}</span><small>${note}</small></div>`;
  $('kpStats').innerHTML = `<div class="kp-stat-grid">${card(statNumber(stats.totalViews),'Views Keseluruhan',`${estimated}${statNumber(stats.views28)} dalam 28 hari`)}${card(statNumber(stats.views28),estimated+'Views 28 Hari Terakhir',`~${statNumber(stats.views28 == null ? null : stats.views28/28)} / hari`)}${card(statNumber(stats.views7),estimated+'Views 7 Hari Terakhir',`~${statNumber(stats.views7 == null ? null : stats.views7/7)} / hari`)}</div>
    <p class="kp-source">${esc(stats.source)}</p>
    <div class="kp-secondary-grid">${card(statNumber(stats.vph),'VPH rata-rata sejak terbit (Views Per Hour)','VPH 48 jam terakhir: belum tersedia dari API publik')}${card(esc(ratio),'Subscriber Magnet (views/subscriber)','Indikator potensi; bukan subscriber baru aktual.')}</div>
    <div class="kp-out kp-earnings"><strong>Simulasi Penghasilan</strong><dl><div><dt>Total</dt><dd>${earningRange(stats.earningsTotal)}</dd></div><div><dt>Estimasi Bulanan (28 hari)</dt><dd>${earningRange(stats.earnings28)}</dd></div><div><dt>Estimasi Mingguan (7 hari)</dt><dd>${earningRange(stats.earnings7)}</dd></div></dl><p class="kp-source">Simulasi pendapatan iklan bruto, bukan pendapatan aktual kreator. Asumsi CPM niche Film &amp; Animation $0.80-$3.00 per 1.000 views. Views tidak selalu termonetisasi; Shorts memakai pembagian pendapatan berbeda.</p></div>`;
  $('kp-panel-detail').innerHTML = `<p class="kp-source">Gratis · sudah termasuk analisa. ${esc(stats.source)}</p>${competitorChart(stats.series.slice(-7),'Views 7 hari',stats.estimated)}${competitorChart(stats.series,'Views 28 hari',stats.estimated)}
    <div class="kp-out"><p>Engagement rate (like + komentar / views): <b>${statNumber(stats.engagementRate)}${stats.engagementRate == null ? '' : '%'}</b></p><p>Like/View ratio: <b>${statNumber(stats.likeViewRatio)}${stats.likeViewRatio == null ? '' : '%'}</b></p><p>Waktu upload: ${stats.publishedAt ? esc(new Date(stats.publishedAt).toLocaleString('id-ID',{timeZone:'Asia/Jakarta'}))+' WIB' : 'Tidak tersedia'}</p><p>Durasi: ${esc(isoMin(stats.duration).toFixed(1))} menit</p></div>
    <div class="kp-out"><b>Kenapa video ini relevan dengan channel kamu?</b><p>${esc(v.relevance || 'Video dari kategori pilihan channel kamu.')}</p></div>
    <div class="kp-out"><b>Channel authority &amp; Subscriber Magnet</b><p>${esc(v.snippet?.channelTitle)} · ${v.channel?.statistics?.hiddenSubscriberCount ? 'Subscriber disembunyikan' : statNumber(v.channel?.statistics?.subscriberCount)+' subscriber'} · ${statNumber(v.channel?.statistics?.viewCount)} total views channel · ${statNumber(v.channel?.statistics?.videoCount)} video.</p><p>Subscriber Magnet ${esc(ratio)} = views video / subscriber channel. Skor authority resmi tidak tersedia dari API publik.</p></div>`;
}
async function loadCompetitorStats(v, version) {
  try {
    const response = await btpApi('/api/kompetitor/stats?videoId='+encodeURIComponent(v.id));
    const stats = await response.json();
    if (!response.ok) throw new Error(stats.error || 'Statistik belum tersedia.');
    if (version !== competitorModalVersion) return;
    renderCompetitorStats(stats,v);
  } catch(error){if(window.BTPApiStatus?.isSoftError(error))return;
    if (version !== competitorModalVersion) return;
    $('kpStats').innerHTML = `<p class="kp-out" role="alert">${esc(error.message)} <button class="kp-tiru" data-stats-retry>Coba lagi</button></p>`;
    $('kp-panel-detail').textContent = 'Statistik belum tersedia. Gunakan Coba lagi di bagian atas.';
  }
}
function showCompetitorTab(type) {
  document.querySelectorAll('[data-content-tab]').forEach(b=>{const selected=b.dataset.contentTab===type;b.setAttribute('aria-selected',String(selected));b.tabIndex=selected?0:-1;});
  document.querySelectorAll('.kp-content-panel').forEach(panel=>{panel.hidden=panel.id!==`kp-panel-${type}`;});
}
function renderCompetitorContent(type, items) {
  const panel = $('kp-panel-'+type);
  if (type==='deskripsi') {
    panel.innerHTML=items.map((text,i)=>`<article class="kp-out"><div class="kp-content-actions"><b>Versi ${i+1}</b>${copyBtn(text)}<button class="kp-tiru" data-use-description="${esc(text)}">Pakai di Upload</button></div><pre class="kp-description">${esc(text)}</pre></article>`).join('');
  } else if(type==='judul') {
    panel.innerHTML=items.map((text,i)=>`<div class="kp-out kp-content-actions"><span>${i+1}. ${esc(text)}</span>${copyBtn(text)}</div>`).join('');
  } else {
    const text=items.join(type==='hashtag'?' ':', ');
    panel.innerHTML=`<div class="kp-out"><div class="kp-content-actions"><b>${items.length} ${type==='keyword'?'kata kunci':type==='tag'?'tag YouTube':'hashtag'}</b>${copyBtn(text,type==='keyword'?'Copy All':'Copy')}</div><p class="kp-description">${esc(text)}</p>${type==='tag'?`<small>${text.length}/500 karakter</small>`:''}${type==='hashtag'?'<small>Ide hashtag relevan; performa viral tidak dijamin.</small>':''}</div>`;
  }
}
async function generateCompetitorContent(type) {
  const v=activeCompetitor;
  if(!v || !Object.hasOwn(competitorTabLabels,type) || type==='detail') return;
  const key=v.id+':'+type;
  if(competitorContentBusy.has(key)) return;
  if(competitorContent.has(key)) return renderCompetitorContent(type,competitorContent.get(key));
  const version=competitorModalVersion, panel=$('kp-panel-'+type);
  competitorContentBusy.add(key);
  panel.innerHTML='<div class="kp-out" role="status">Membuat konten…</div>';
  try {
    const response=await btpApi('/api/kompetitor/content',{method:'POST',body:JSON.stringify({videoId:v.id,type})});
    const result=await response.json();
    if(!response.ok) throw new Error(result.error || 'Generate gagal.');
    competitorContent.set(key,result.items);
    if(version===competitorModalVersion) renderCompetitorContent(type,result.items);
  } catch(error){if(window.BTPApiStatus?.isSoftError(error))return;
    if(version===competitorModalVersion) panel.innerHTML=`<p role="alert" class="kp-out">${esc(error.message)}</p><button class="kp-tiru" data-generate-content="${type}">Coba generate lagi · ${competitorTabLabels[type]}</button>`;
  } finally { competitorContentBusy.delete(key); }
}
function openCompetitorVideo(id) {
  const v = competitorFeed?.videos.find(v=>v.id === id);
  if (!v) return;
  activeCompetitor=v;
  const version=++competitorModalVersion;
  $('kpVideoDetails').innerHTML = `<h2 id="kpModalTitle" class="text-[18px] font-extrabold mt-2">${esc(v.snippet?.title)}</h2><p class="text-[12px] text-gray-500 mt-1">${esc(v.snippet?.channelTitle)}</p>
    <div id="kpStats" aria-live="polite"><div class="kp-stat-grid">${Array.from({length:3},()=>'<div class="kp-skeleton kp-out">Memuat statistik…</div>').join('')}</div></div>
    <a class="kp-tiru" href="https://www.youtube.com/watch?v=${encodeURIComponent(v.id)}" target="_blank" rel="noopener">Tonton di YouTube ↗</a>
    <div class="kp-content-tabs" role="tablist" aria-label="Ide konten dan detail video">${Object.entries(competitorTabLabels).map(([key,label])=>`<button type="button" role="tab" class="kp-tiru" id="kp-content-${key}" data-content-tab="${key}" aria-controls="kp-panel-${key}" aria-selected="${key==='judul'}" tabindex="${key==='judul'?0:-1}">${label}</button>`).join('')}</div>
    ${Object.entries(competitorTabLabels).map(([key,label])=>`<section class="kp-content-panel" id="kp-panel-${key}" role="tabpanel" aria-labelledby="kp-content-${key}" ${key!=='judul'?'hidden':''}>${key==='detail'?'Memuat detail…':`<p class="kp-source">Hasil orisinal terinspirasi topik video. Biaya hanya saat generate; salin dan buka ulang hasil gratis selama halaman ini terbuka.</p><button class="kp-tiru" data-generate-content="${key}">Generate ${label}</button>`}</section>`).join('')}`;
  for(const type of Object.keys(competitorTabLabels)) if(competitorContent.has(id+':'+type)) renderCompetitorContent(type,competitorContent.get(id+':'+type));
  const modal = $('kpVideoModal');
  if (!modal.open) modal.showModal();
  loadCompetitorStats(v,version);
}
$('kpVideoDetails').addEventListener('click',e=>{
  const tab=e.target.closest('[data-content-tab]');
  if(tab) {showCompetitorTab(tab.dataset.contentTab);if(tab.dataset.contentTab!=='detail') generateCompetitorContent(tab.dataset.contentTab);return;}
  const generate=e.target.closest('[data-generate-content]');
  if(generate) {generateCompetitorContent(generate.dataset.generateContent);return;}
  if(e.target.closest('[data-stats-retry]') && activeCompetitor) loadCompetitorStats(activeCompetitor,competitorModalVersion);
  const upload=e.target.closest('[data-use-description]');
  if(upload) location.href='/upload#'+new URLSearchParams({competitorDescription:upload.dataset.useDescription}).toString();
});
$('kpVideoDetails').addEventListener('keydown',e=>{
  if(!e.target.matches('[data-content-tab]') || !['ArrowLeft','ArrowRight','Home','End'].includes(e.key)) return;
  const tabs=[...document.querySelectorAll('[data-content-tab]')], index=tabs.indexOf(e.target);
  const next=e.key==='Home'?0:e.key==='End'?tabs.length-1:(index+(e.key==='ArrowRight'?1:-1)+tabs.length)%tabs.length;
  e.preventDefault();showCompetitorTab(tabs[next].dataset.contentTab);tabs[next].focus();
});
$('kategoriNiche').addEventListener('change',updateCompetitorChoice);
$('jumlahVideo').addEventListener('change',()=>{updateCompetitorChoice();if(competitorPlanState && Number($('jumlahVideo').value)>competitorPlanState.limit)toast(competitorLimitMessage(),'err');});
updateCompetitorChoice();
let competitorRetryRefresh = false;
$('btnRefresh').addEventListener('click',()=>loadCompetitors(false, true));
$('kpRetry').addEventListener('click',()=>loadCompetitors(false, competitorRetryRefresh));
$('kpDiscoveryGrid').addEventListener('click',e=>{ const b=e.target.closest('[data-discovery-video]'); if(b) openCompetitorVideo(b.dataset.discoveryVideo); });
$('kpTabs').addEventListener('click',e=>{
  const tab=e.target.closest('[data-sort]'); if(!tab) return;
  competitorSort=tab.dataset.sort;
  $('kpTabs').querySelectorAll('[data-sort]').forEach(b=>{b.setAttribute('aria-selected',String(b===tab));b.tabIndex=b===tab?0:-1;});
  renderCompetitors();
});
$('kpTabs').addEventListener('keydown',e=>{
  if(!['ArrowLeft','ArrowRight','Home','End'].includes(e.key)) return;
  const tabs=[...$('kpTabs').querySelectorAll('[data-sort]')], index=tabs.indexOf(document.activeElement);
  const next=e.key==='Home'?0:e.key==='End'?tabs.length-1:(index+(e.key==='ArrowRight'?1:-1)+tabs.length)%tabs.length;
  e.preventDefault();tabs[next].click();tabs[next].focus();
});
$('kpVideoDetails').addEventListener('click',async e=>{
  const button=e.target.closest('[data-copy]'); if(!button) return;
  try { await navigator.clipboard.writeText(button.dataset.copy); toast('Tercopy!','ok'); } catch { toast('Clipboard tidak tersedia. Salin judul secara manual.','err'); }
});
$('kpVideoModal').addEventListener('click',e=>{if(e.target===$('kpVideoModal')) $('kpVideoModal').close();});
initCompetitorPlans();
