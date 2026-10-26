/* Login Google BosterTubePro (OAuth server: /api/auth/youtube -> /api/auth/callback).
   Menggantikan Google Identity Services di browser: halaman tetap memanggil
   google.accounts.oauth2.initTokenClient({ callback }) & tokenClient.requestAccessToken().
   Access token disimpan di sessionStorage "btp_token" ({ token, exp }), sesi user (poin boster_poin) di localStorage "btp_session" (credit.js).
   Wajib dimuat SETELAH /utils/credit.js. */
(async function () {
  const referral = new URLSearchParams(location.search).get("ref");
  if (referral && /^BTP-[A-Z0-9-]{4,60}$/.test(referral.toUpperCase())) {
    localStorage.setItem("btp_referral", referral.toUpperCase());
  }

  const TOKEN_KEY = "btp_token", RETURN_KEY = "btp_login_return", MSG_KEY = "btp_login_msg";
  const saveToken = (token, expiresIn) =>
    sessionStorage.setItem(TOKEN_KEY, JSON.stringify({ token, exp: Date.now() + (Number(expiresIn) || 3600) * 1000 - 60000 }));
  const readToken = () => {
    try {
      const t = JSON.parse(sessionStorage.getItem(TOKEN_KEY) || "null");
      return t && t.token && t.exp > Date.now() ? t : null;
    } catch (e) { return null; }
  };

  // 1. Hasil login dari youtube-callback: /#pengaturan?youtube_connected=true&yt_token=...&btp_session=...
  const query = location.hash.split("?")[1];
  if (query) {
    const p = new URLSearchParams(query);
    if (p.get("youtube_connected") === "true" && p.get("yt_token")) {
      saveToken(p.get("yt_token"), p.get("yt_expires"));
      localStorage.setItem("btp_yt_connected", "true");
      localStorage.setItem("btp_yt_channel", p.get("yt_channel") || "YouTube Channel");
      if (p.get("btp_session")) await startUserSession(p.get("btp_session"), p.get("yt_email"));
      sessionStorage.setItem(MSG_KEY, "ok:" + (p.get("yt_channel") || ""));
    } else if (p.get("youtube_error")) {
      sessionStorage.setItem(MSG_KEY, "err:" + p.get("youtube_error"));
    }
    if (p.has("youtube_connected") || p.has("youtube_error")) {
      // Hapus token dari URL & riwayat, lalu kembali ke halaman asal tombol Login
      const back = sessionStorage.getItem(RETURN_KEY) || "/";
      sessionStorage.removeItem(RETURN_KEY);
      history.replaceState(null, "", location.pathname + location.search);
      if (back !== location.pathname + location.search) location.replace(back);
    }
  }

  // 2. Access token baru dari refresh_token tersimpan di server (user yang sudah login)
  let refreshing = null;
  function refreshToken(force = false) {
    if (!btpSession()) return Promise.resolve(null);
    const session = btpSession();
    refreshing = refreshing || btpApi(force ? "/api/youtube-token?force=1" : "/api/youtube-token", { method: "POST" })
      .then(async (res) => {
        const d = await res.json().catch(() => ({}));
        if (session !== btpSession() || !res.ok || !d.access_token) return null;
        saveToken(d.access_token, ((d.expires_at || 0) - Date.now()) / 1000 || 3600);
        return readToken();
      })
      .catch(() => null)
      .finally(() => { refreshing = null; });
    return refreshing;
  }

  function login() {
    // On /login, honour ?next= (same-site paths only) so guarded pages like /billing reopen after login.
    const next = new URLSearchParams(location.search).get("next") || "";
    const onLogin = location.pathname === "/login" || location.pathname === "/login.html";
    sessionStorage.setItem(RETURN_KEY, onLogin ? (/^\/(?!\/)/.test(next) ? next : "/") : location.pathname + location.search);
    const ref = localStorage.getItem("btp_referral") || "";
    location.href = "/api/auth/youtube" + (ref ? "?ref=" + encodeURIComponent(ref) : "");
  }

  async function logout() {
    sessionStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem("btp_yt_connected");
    localStorage.removeItem("btp_yt_channel");
    localStorage.removeItem("bostertube_user");
    endUserSession();
  }

  window.BTPAuth = { login, logout, refreshToken, readToken, loginMessage: () => { const m = sessionStorage.getItem(MSG_KEY); sessionStorage.removeItem(MSG_KEY); return m; } };

  // 3. Pengganti google.accounts.oauth2 untuk halaman lama (Dashboard, Analytics, Audit)
  window.google = window.google || {};
  google.accounts = google.accounts || {};
  google.accounts.oauth2 = {
    initTokenClient(cfg) {
      // Token sesi ini habis tapi user masih login: ambil token baru otomatis
      if (!readToken() && btpSession()) {
        refreshToken().then((t) => {
          if(t) cfg.callback({ access_token: t.token, expires_in: Math.round((t.exp - Date.now()) / 1000) + 60 });
          else cfg.error_callback?.({ type: 'session_expired' });
        });
      }
      return {
        // opts.prompt = minta izin ulang (mis. izin pendapatan) -> selalu lewat login Google
        requestAccessToken(opts) {
          const give = (t) => cfg.callback({ access_token: t.token, expires_in: Math.round((t.exp - Date.now()) / 1000) + 60 });
          if (opts && opts.prompt) return login();
          const t = readToken();
          if (t) return give(t);
          refreshToken().then((n) => (n ? give(n) : login()));
        },
      };
    },
  };
})();

// Inbox navigation is granted only after the server verifies the active session.
(()=>{
 let generation=0,lastSession=null;
 async function update(){
  const current=++generation,session=btpSession();lastSession=session;
  document.querySelectorAll('[data-admin-inbox]').forEach(n=>n.remove());
  if(!session)return;
  try{
   const response=await btpApi('/api/admin/inbox?type=pengaduan');
   if(!response.ok)return;
   const data=await response.json();
   if(current!==generation||session!==btpSession())return;
   document.querySelectorAll('aside a[href="/pengaturan"]:not([data-react-settings]),.sidebar a[href="/pengaturan"]:not([data-react-settings])').forEach(settings=>{
    const link=document.createElement('a');link.href='/admin/komunikasi';link.dataset.adminInbox='true';link.className=settings.className;
    link.textContent=`📥 Admin - Kotak Masuk (${data.total})`;settings.after(link);
   });
  }catch{}
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',update);else update();
 window.addEventListener('storage',e=>{if(e.key==='btp_session')update();});
 window.addEventListener('credits-updated',()=>{if(btpSession()!==lastSession)update();});
 window.addEventListener('btp:inbox-changed',update);
})();
