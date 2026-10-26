/* Pengaturan: Akun Saya (profil, bahasa, logout), Kelola Channel, saldo & Riwayat Login.
   Paket harga & pembayaran hanya ada di /billing. */
(() => {
 const el = id => document.getElementById(id);
 const session = () => localStorage.getItem('btp_session') || '';
 const headers = () => ({'Content-Type':'application/json','x-btp-session':session()});
 const fmt = n => Number(n).toLocaleString('id-ID');
 const message = text => { el('message').textContent = text; };
 async function api(path, body) {
  if (!session()) throw Error('Login Google untuk melanjutkan.');
  const response = await fetch(path, {method: body ? 'POST' : 'GET', headers: headers(), cache: 'no-store', ...(body ? {body: JSON.stringify(body)} : {})});
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw Error(data.error || 'Permintaan gagal. Coba lagi.');
  return data;
 }

 // ===== Akun Saya =====
 function setAvatar(src) {
  const avatar = el('account-avatar');
  const email = localStorage.getItem('btp_user_email') || '';
  if (src) { const img = document.createElement('img'); img.src = src; img.alt = ''; img.referrerPolicy = 'no-referrer'; avatar.replaceChildren(img); }
  else avatar.textContent = (email[0] || 'G').toUpperCase();
 }
 function renderLocalProfile() {
  const email = localStorage.getItem('btp_user_email') || '';
  el('account-name').textContent = localStorage.getItem('btp_yt_channel') || (session() ? 'Akun Google' : 'Belum login');
  el('account-email').textContent = email || 'Login Google untuk melihat email';
  setAvatar(null);
 }
 async function loadAccount() {
  renderLocalProfile();
  if (!session()) { el('balance').textContent = '— Poin'; return; }
  const me = await api('/api/me');
  el('account-email').textContent = me.email;
  el('account-role').hidden = !me.is_admin;
  if (me.youtube?.channel_name) el('account-name').textContent = me.youtube.channel_name;
  el('balance').textContent = me.isUnlimited && me.is_admin ? `${fmt(me.userPoints)} Poin · ADMIN ∞` : `${fmt(me.userPoints)} Poin`;
 }
 const language = el('account-language');
 const currentLanguage = () => (window.BosterLanguage?.get() === 'en' ? 'en' : 'id');
 language.value = currentLanguage();
 language.addEventListener('change', () => window.BosterLanguage?.set(language.value));
 window.addEventListener('boster-language', () => { language.value = currentLanguage(); });

 document.querySelectorAll('[data-settings-logout]').forEach(button => {
  button.hidden = !session();
  button.addEventListener('click', async () => {
   button.disabled = true;
   if (window.BTPAuth) await window.BTPAuth.logout(); else localStorage.removeItem('btp_session');
   location.replace('/login');
  });
 });

 // ===== Kelola Channel =====
 const channelRoot = el('settings-channels');
 async function loadChannels() {
  channelRoot.textContent = 'Memuat channel…';
  try {
   const {channels} = await api('/api/channels');
   channelRoot.replaceChildren();
   if (!channels.length) channelRoot.textContent = 'Belum ada channel terhubung.';
   for (const channel of channels) {
    if (channel.active && channel.thumbnail) setAvatar(channel.thumbnail);
    const row = document.createElement('article');
    row.className = 'channel-row';
    const thumb = document.createElement(channel.thumbnail ? 'img' : 'span');
    thumb.className = 'channel-thumb';
    if (channel.thumbnail) { thumb.src = channel.thumbnail; thumb.alt = ''; thumb.referrerPolicy = 'no-referrer'; }
    else thumb.textContent = '▶';
    const info = document.createElement('div');
    info.className = 'channel-info';
    const name = document.createElement('p'); name.className = 'font-bold'; name.textContent = channel.channel_name || channel.channel_id;
    const meta = document.createElement('p'); meta.className = 'text-gray-500';
    meta.textContent = [channel.subscribers != null ? `${fmt(channel.subscribers)} subs` : null, `${fmt(channel.video_count)} video`, channel.active ? '✅ Aktif' : null].filter(Boolean).join(' · ');
    info.append(name, meta);
    const actions = document.createElement('div'); actions.className = 'channel-actions';
    if (!channel.active) for (const [action, label] of [['switch', 'Gunakan'], ['remove', 'Hapus Channel']]) {
     const button = document.createElement('button');
     button.type = 'button'; button.textContent = label;
     button.className = action === 'remove' ? 'settings-btn danger' : 'settings-btn';
     button.onclick = async () => {
      if (action === 'remove' && !confirm(`Hapus channel "${channel.channel_name || channel.channel_id}" dari akun?`)) return;
      button.disabled = true;
      try { await api('/api/channels', {action, channelId: channel.channel_id}); if (action === 'switch') location.reload(); else await loadChannels(); }
      catch (error) { message(error.message); button.disabled = false; }
     };
     actions.append(button);
    }
    row.append(thumb, info, actions);
    channelRoot.append(row);
   }
  } catch (error) { channelRoot.textContent = error.message; }
 }
 el('add-channel').onclick = async event => {
  const button = event.currentTarget;
  button.disabled = true;
  try { const data = await api('/api/channels', {action: 'link'}); location.assign(data.url); }
  catch (error) { message(error.message); button.disabled = false; }
 };
 window.addEventListener('settings-tab', event => { if (event.detail === 'channel') loadChannels(); });

 // ===== Riwayat Login =====
 async function loadLoginHistory() {
  const list = el('login-history');
  try {
   const {sessions} = await api('/api/login-history');
   list.replaceChildren();
   if (!sessions.length) { list.textContent = 'Belum ada riwayat login.'; return; }
   for (const item of sessions) {
    const li = document.createElement('li');
    li.textContent = new Date(item.created_at).toLocaleString('id-ID', {dateStyle: 'medium', timeStyle: 'short'}) + (item.current ? ' · Perangkat ini' : '');
    list.append(li);
   }
  } catch (error) { list.textContent = error.message; }
 }

 loadAccount().catch(error => message(error.message));
 loadChannels();
 loadLoginHistory();
 window.addEventListener('credits-updated', () => loadAccount().catch(error => message(error.message)));
})();
