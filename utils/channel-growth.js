/* Account data is loaded from the authenticated server session. Browser storage is only a channel-scoped cache. */
(() => {
  const root = document.getElementById('channelGrowth');
  if (!root) return;
  const escape = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const number = n => n == null ? 'Disembunyikan' : Number(n).toLocaleString('id-ID');
  const date = d => new Date(d).toLocaleDateString('id-ID', {day:'numeric',month:'short',year:'numeric'});
  const image = url => { try { const u = new URL(url); return u.protocol === 'https:' ? escape(u.href) : ''; } catch { return ''; } };
  let job = 0, activeSession = '';
  function guest() {
    root.innerHTML = '<span class="growth-eyebrow">CHANNEL & PERKEMBANGAN</span><h1>Ruang tumbuh channel kamu</h1><p>Hubungkan akun untuk melihat video, kategori, dan progres channel sendiri.</p><button type="button" class="growth-button" data-growth-connect>Hubungkan Channel YouTube</button>';
  }
  const chart = snapshots => {
    if (snapshots.length < 2) return '<p>Snapshot pertama tersimpan. Buka kembali besok untuk melihat perubahan views dan subscriber.</p>';
    const values = snapshots.map(s => Number(s.views));
    const min = Math.min(...values), span = Math.max(...values) - min || 1;
    const points = values.map((v,i) => `${10+i/(values.length-1)*580},${115-(v-min)/span*100}`).join(' ');
    return `<svg class="growth-chart" viewBox="0 0 600 130" role="img" aria-label="Total views dari ${escape(date(snapshots[0].day))} sampai ${escape(date(snapshots.at(-1).day))}: ${number(values[0])} menjadi ${number(values.at(-1))}"><polyline points="${points}" fill="none" stroke="#28776b" stroke-width="3"/></svg><p>${escape(date(snapshots[0].day))} — ${escape(date(snapshots.at(-1).day))} · total views harian</p>`;
  };
  function render(data) {
    const {channel:c,niche,snapshots,history,videos} = data, s = c.statistics;
    const first = snapshots[0], last = snapshots.at(-1);
    const delta = (key) => first && last && first[key] != null && last[key] != null && snapshots.length > 1 ? `${Number(last[key])-Number(first[key]) >= 0 ? '+' : ''}${number(Number(last[key])-Number(first[key]))}` : '—';
    const avatar = image((c.snippet.thumbnails?.medium || c.snippet.thumbnails?.default)?.url);
    root.innerHTML = `<div class="growth-heading">${avatar ? `<img class="growth-avatar" src="${avatar}" alt="Avatar ${escape(c.snippet.title)}">` : ''}<div><span class="growth-eyebrow">CHANNEL & PERKEMBANGAN</span><h1>${escape(c.snippet.title)} — ${s.hiddenSubscriberCount ? 'Subscriber disembunyikan' : number(s.subscriberCount)+' subs'}</h1><p>Kategori: ${escape(niche || 'Belum cukup video untuk mendeteksi kategori')}</p></div><button type="button" class="growth-button" data-growth-refresh>Refresh progres</button></div>
    <div class="growth-layout"><div><h2>Lihat perkembangan · 30 hari</h2><div class="growth-stats"><div><strong>${delta('subscribers')}</strong><p>Perubahan subscriber</p></div><div><strong>${delta('views')}</strong><p>Perubahan total views</p></div></div>${chart(snapshots)}<p>Dicatat saat dashboard dibuka · ${escape(date(data.updatedAt))}</p></div><div><h2>Log perbaikan channel</h2><ul class="growth-history">${history.length ? history.map(log => `<li><time>${escape(new Date(log.created_at).toLocaleString('id-ID'))}</time>${escape(log.video_title)} — ${escape(({title:'Judul',desc:'Deskripsi',tag:'Tag',thumb:'Thumbnail'})[log.kind] || log.kind)} ${log.action === 'applied' ? 'diperbaiki di YouTube' : 'disiapkan; terapkan di YouTube Studio'}</li>`).join('') : '<li>Belum ada perbaikan tercatat untuk channel ini. Mulai dari Audit Studio.</li>'}</ul><a href="/audit" class="growth-button">Buka Audit Studio</a></div></div>
    <h2 style="margin-top:24px">Video terbaru channel kamu</h2><div class="growth-feed">${videos.slice(0,4).map(v=>`<a href="https://www.youtube.com/watch?v=${encodeURIComponent(v.id)}" target="_blank" rel="noopener noreferrer"><img src="${image((v.snippet.thumbnails?.medium || v.snippet.thumbnails?.default)?.url)}" loading="lazy" alt="">${escape(v.snippet.title)}</a>`).join('') || '<p>Channel ini belum memiliki video yang tersedia.</p>'}</div><h2 style="margin-top:24px">Kompetitor sesuai kategori</h2><div id="growthCompetitors"><p>${niche ? 'Memuat rekomendasi kompetitor…' : 'Upload video untuk mulai mendeteksi kompetitor.'}</p></div><p><a href="/kompetitor">Lihat semua kompetitor & pencarian manual</a></p>`;
  }
  async function load() {
    const current = ++job;
    if (!btpSession()) { guest(); return; }
    const session = btpSession();
    activeSession = session;
    root.innerHTML = '<p role="status">Memuat channel dan perkembangan kamu…</p><div class="growth-loading" aria-hidden="true"></div>';
    try {
      const response = await btpApi('/api/channel-growth');
      const data = await response.json();
      if (current !== job || session !== btpSession()) return;
      if (response.status === 401 || response.status === 409) { guest(); return; }
      if (!response.ok) throw new Error(data.error || 'Progres belum tersedia.');
      render(data);
      try {
        localStorage.setItem(`bostertube_${data.channel.id}_data`, JSON.stringify(data));
        localStorage.setItem(`history_${data.channel.id}`, JSON.stringify(data.history));
        // Tokens remain in the existing session/server flow, never in the persistent profile cache.
        localStorage.setItem('bostertube_user', JSON.stringify({userId:data.userId,youtubeAccount:{channelId:data.channel.id,channelTitle:data.channel.snippet.title,avatar:(data.channel.snippet.thumbnails?.default || {}).url}}));
      } catch { /* Storage may be unavailable; live data stays usable. */ }
      if (!data.niche) return;
      const result = await btpApi('/api/kompetitor/discover', {method:'POST',body:JSON.stringify({action:'auto'})});
      const competitors = await result.json();
      if (current !== job || session !== btpSession()) return;
      const feed = document.getElementById('growthCompetitors');
      if (!result.ok || competitors.channelId !== data.channel.id) { feed.textContent = 'Rekomendasi belum tersedia. Coba melalui halaman Kompetitor.'; return; }
      feed.innerHTML = `<div class="growth-feed">${competitors.videos.filter(v => v.snippet?.channelId !== data.channel.id).slice(0,4).map(v=>`<a href="https://www.youtube.com/watch?v=${encodeURIComponent(v.id)}" target="_blank" rel="noopener noreferrer"><img src="${image((v.snippet.thumbnails?.medium || {}).url)}" loading="lazy" alt="">${escape(v.snippet.title)}<p>${escape(v.snippet.channelTitle)}</p></a>`).join('') || '<p>Belum ada kompetitor yang cocok dengan kategori channel ini.</p>'}</div>`;
    } catch (error) {
      if (current !== job || session !== btpSession()) return;
      const feed = document.getElementById('growthCompetitors');
      if (feed) { feed.textContent = 'Rekomendasi belum dapat dimuat. Buka halaman Kompetitor untuk mencoba lagi.'; return; }
      root.innerHTML = `<p role="alert" class="growth-warning">${escape(error.message)}</p><button type="button" class="growth-button" data-growth-refresh>Coba lagi</button> <button type="button" class="growth-button" data-growth-connect>Hubungkan Channel YouTube</button>`;
    }
  }
  root.addEventListener('click', e => {
    if (e.target.closest('[data-growth-connect]')) window.BTPAuth?.login();
    if (e.target.closest('[data-growth-refresh]')) load();
  });
  window.BTPGrowth = {load};
  window.addEventListener('credits-updated', () => {
    if (!btpSession()) { ++job; activeSession = ''; guest(); }
    else if (btpSession() !== activeSession) load();
  });
  window.addEventListener('storage', e => { if (e.key === 'btp_session') { if (!btpSession()) { ++job; guest(); } else load(); } });
  load();
})();
