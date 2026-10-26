/* Daily creator feedback: rewards never depend on video playback. */
(() => {
  let mission = null, interval, busy = false, scrollSent = false, scrollPending = false, observer, resizeObserver, deadline = 0;
  const el = id => document.getElementById(id);
  const api = async (body, path = '/api/review-missions') => {
    const response = await btpApi(path, body ? { method: 'POST', body: JSON.stringify(body) } : {});
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Gagal memuat misi');
    return data;
  };
  const text = (id, value) => { if (el(id)) el(id).textContent = value; };
  const message = value => { text('reviewMessage', value); text('reviewModalMessage', value); };
  let agencyEligible = false;
  function eligible() { return !!btpSession() && agencyEligible; }
  function updateSubscription() {
    const unlocked = eligible();
    const button = el('reviewStart');
    if (button) {
      button.disabled = busy;
      button.textContent = unlocked ? 'Mulai / Lanjutkan Review' : 'Berlangganan Rp499.000 Dulu';
      button.classList.toggle('subscription-locked', !unlocked);
    }
    if (el('barLangganan')) el('barLangganan').hidden = unlocked;
    if (el('reviewSubscriptionBadge')) el('reviewSubscriptionBadge').hidden = unlocked;
  }
  async function status() {
    const data = await api();
    agencyEligible = data.eligible === true;
    updateSubscription();
    text('reviewProgress', `${data.completed}/${data.isUnlimited ? '∞' : 3} review · ${data.earned || 0} poin hari ini · reset pukul 00.00 WIB`);
    const list = el('reviewFeedback');
    if (list) {
      list.replaceChildren();
      if (!data.feedback.length) list.textContent = 'Belum ada feedback. Pasang Iklan Tugas untuk video publik channel kamu.';
      data.feedback.forEach(item => {
        const row = document.createElement('p');
        row.textContent = `${item.title} — Thumbnail: ${item.thumbnail_interesting ? 'menarik' : 'perlu perbaikan'} · Saran judul: ${item.suggestion}`;
        list.append(row);
      });
      const queue = el('reviewOwnQueue'); queue.replaceChildren();

    }
    return data;
  }
  async function start(adId) {
    updateSubscription();
    if (!eligible()) { location.href = '/billing#plans'; return; }
    if (busy) return;
    busy = true; clearInterval(interval); el('reviewStart').disabled = true;
    message('Menyiapkan bahan review…');
    try {
      const data = await api({ action: 'start', ...(adId ? { adId } : {}) });
      if (data.empty) { message('Belum ada video kreator lain yang tersedia. Coba lagi nanti; poin hanya diberikan untuk review yang selesai.'); return; }
      mission = data; scrollSent = !!data.scrolled;
      el('reviewWork').hidden = false; el('reviewWorkDialog').showModal(); el('reviewQuestions').hidden = false;
      el('reviewForm').reset(); el('reviewForm').noValidate = true; el('reviewClaim').disabled = false;
      text('reviewTitle', data.title);
      text('reviewTask', `${data.task_title} — ${data.description}`);
      text('reviewClaim', `Submit Review · +${data.reward} Poin ke Saldo`);
      el('reviewThumbnail').src = `https://i.ytimg.com/vi/${data.video_id}/hqdefault.jpg`;
      el('reviewPlayer').replaceChildren(); el('reviewWatch').hidden = false;
      deadline = Date.now() + data.remaining * 1000;
      const tick = () => {
        const seconds = Math.max(0, Math.ceil((deadline - Date.now()) / 1000));
        text('reviewTimer', `Review thumbnail & judul: ${seconds} detik`);
        if (!seconds) { clearInterval(interval); el('reviewQuestions').hidden = false; el('reviewClaim').disabled = busy; }
      };
      tick(); interval = setInterval(tick, 1000);
      message('Pelajari thumbnail dan judul. Scroll minimal 50% halaman, lalu berikan feedback. Memutar video tidak diwajibkan.');
      el('reviewWatch').click(); setupScroll();
    } catch (e) { message(e.message); }
    finally { busy = false; updateSubscription(); }
  }
  function setupScroll() {
    observer?.disconnect(); resizeObserver?.disconnect();
    const dialog = el('reviewWorkDialog');
    let marker = el('reviewScrollMarker');
    if (!marker) { marker = document.createElement('span'); marker.id = 'reviewScrollMarker'; marker.setAttribute('aria-hidden', 'true'); dialog.append(marker); }
    const position = () => {
      marker.style.top = '0px';
      const distance = dialog.scrollHeight - dialog.clientHeight;
      marker.style.top = `${dialog.clientHeight + Math.max(0, distance) * 0.5 - 1}px`;
      text('reviewScrollStatus', scrollSent ? '✓ Scroll 50% terpenuhi' : 'Scroll setidaknya 50% halaman modal sebelum mengirim feedback');
    };
    position();
    observer = new IntersectionObserver(entries => {
      if (entries.some(entry => entry.isIntersecting)) recordScroll();
    }, { root: dialog, threshold: 0 });
    observer.observe(marker);
    resizeObserver = new ResizeObserver(position); resizeObserver.observe(el('reviewWork'));
  }
  async function recordScroll() {
    if (!mission || scrollSent || scrollPending) return;
    const dialog = el('reviewWorkDialog');
    const distance = dialog.scrollHeight - dialog.clientHeight;
    if (distance > 0 && dialog.scrollTop / distance < 0.5) return;
    const current = mission;
    scrollPending = true;
    text('reviewScrollStatus', 'Menyimpan progres scroll…');
    try {
      await api({ action: 'scroll', id: current.id });
      if (mission === current) { scrollSent = true; text('reviewScrollStatus', '✓ Scroll 50% terpenuhi'); }
    } catch { message('Scroll belum tersimpan. Scroll kembali untuk mencoba lagi.'); }
    finally { scrollPending = false; }
  }
  async function init() {
    updateSubscription();
    const root = el('reviewMissions');
    if (root) el('reviewStart').onclick = () => start();
    if (!btpSession()) { if (root) message('Login Google untuk memulai misi review dan menerima feedback.'); return; }
    if (root) {
      const dialog=document.createElement('dialog');dialog.id='reviewWorkDialog';dialog.className='review-panel review-work-dialog';const close=document.createElement('button');close.type='button';close.textContent='Tutup';close.onclick=()=>dialog.close();const notice=document.createElement('p');notice.id='reviewModalMessage';notice.setAttribute('role','status');notice.setAttribute('aria-live','polite');dialog.append(close,notice,el('reviewWork'));document.body.append(dialog);dialog.addEventListener('scroll',recordScroll,{passive:true});
      el('reviewStart').onclick = () => start();
      document.addEventListener('task-ad-start', event => start(event.detail.adId));
      el('reviewWatch').onclick = () => {
        if (!mission) return;
        const frame = document.createElement('iframe'); frame.title = 'Video opsional untuk memahami konteks';
        frame.src = `https://www.youtube-nocookie.com/embed/${mission.video_id}?autoplay=0&rel=0`;
        frame.allow = 'encrypted-media; picture-in-picture'; frame.allowFullscreen = true;
        el('reviewPlayer').replaceChildren(frame); el('reviewWatch').hidden = true;
      };
      addEventListener('scroll', recordScroll, { passive: true });
      el('reviewForm').elements.suggestion.addEventListener('paste',event=>{event.preventDefault();message('Tulis feedback sendiri, jangan menyalin teks.');});
      el('reviewForm').onsubmit = async event => {
        event.preventDefault(); if (busy || !mission) return;
        busy = true; el('reviewClaim').disabled = true;
        try {
          const form = new FormData(event.target);
          const feedback = String(form.get('suggestion') || '').trim();
          const rating = Number(form.get('rating'));
          if (!Number.isInteger(rating) || rating < 1 || rating > 5) throw Error('Rating wajib 1–5');
          if (!['yes', 'no'].includes(form.get('thumbnail'))) throw Error('Pilih apakah thumbnail menarik');
          const words = feedback.normalize('NFKC').toLowerCase().match(/[\p{L}\p{N}]+/gu) || [];
          if (words.length < 15 || new Set(words).size < 15) throw Error('Feedback minimal 15 kata unik');
          if (feedback.length > 2000) throw Error('Feedback maksimal 2000 karakter');
          if (!scrollSent) throw Error('Scroll setidaknya 50% halaman modal sebelum mengirim feedback');
          if (Date.now() < deadline) throw Error('Selesaikan waktu review thumbnail dan judul terlebih dahulu');
          const reward = mission.reward;
          el('reviewClaim').setAttribute('aria-busy', 'true');
          text('reviewClaim', 'Mengirim…');
          const data = await api({ rating, thumbnailMenarik: String(form.get('thumbnail')), feedback, videoId: mission.video_id, taskId: String(mission.ad_id) }, `/api/tasks/${mission.ad_id}/review`);
          localStorage.setItem('boster_poin', String(data.btp_poin)); dispatchEvent(new Event('credits-updated'));
          el('reviewWorkDialog')?.close(); mission = null; clearInterval(interval); el('reviewWork').hidden = true; el('reviewPlayer').replaceChildren();
          message(`Review berhasil! Feedback kamu tersimpan di BosterTubePro, +${reward} Poin masuk saldo ${Number(data.btp_poin).toLocaleString('id-ID')}`); dispatchEvent(new CustomEvent('points-notice',{detail:el('reviewMessage').textContent})); dispatchEvent(new Event('task-ads-updated'));
          // Payment has succeeded; a failed progress refresh must not appear as a failed claim.
          status().catch(() => {});
          busy = false;

        } catch (e) { message(e.message); dispatchEvent(new CustomEvent('points-notice', { detail: e.message })); el('reviewClaim').disabled = false; }
        finally { busy = false; el('reviewClaim').setAttribute('aria-busy', 'false'); if (mission) text('reviewClaim', `Submit Review · +${mission.reward} Poin ke Saldo`); }
      };

    }
    try {
      const data = await status();
      if (eligible() && !data.prompted && (data.isUnlimited || data.completed < 3)) {
        const prompt = await api({ action: 'prompt' });
        if (prompt.show) {
          const dialog = document.createElement('dialog'); dialog.className = 'review-dialog';
          dialog.innerHTML = '<h3>Misi Harian Tugas Iklan — Dapat 30–150 Poin!</h3><p>Bantu review thumbnail dan judul 3 video kreator lain (60 detik per review). Poin untuk aktivitas review dan audit channel. Khusus member berlangganan Agency Rp499.000. Reward mengikuti iklan. Pemutaran video opsional.</p><a href="/tugas#misi-review">Mulai Misi (3 Video)</a><button type="button">Nanti Aja</button>';
          dialog.querySelector('button').onclick = () => dialog.close();
          dialog.addEventListener('close', () => dialog.remove()); document.body.append(dialog); dialog.showModal();
          if (root) dialog.querySelector('a').onclick = event => { event.preventDefault(); dialog.close(); root.scrollIntoView({ behavior: 'smooth' }); start(); };
        }
      }
      if (root && location.hash === '#misi-review') { root.scrollIntoView(); }
    } catch (e) { if (root) message(e.message + ' Coba muat ulang halaman.'); }
  }
  addEventListener('credits-updated', updateSubscription);
  addEventListener('storage', updateSubscription);
  addEventListener('storage', event => { if (event.key === 'btp_session') location.reload(); });
  addEventListener('credits-updated', () => { if (!btpSession()) { clearInterval(interval); mission = null; el('reviewWork')?.setAttribute('hidden', ''); el('reviewPlayer')?.replaceChildren(); el('reviewFeedback')?.replaceChildren(); el('reviewOwnQueue')?.replaceChildren(); text('reviewProgress', 'Login untuk melihat progres'); message('Login Google untuk memulai misi review.'); document.querySelector('.review-dialog')?.close(); } });
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
