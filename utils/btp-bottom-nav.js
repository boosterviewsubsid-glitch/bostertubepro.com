/* Shell HP (≤ 768px), sama di semua halaman yang memuat script ini:
   - Header atas fixed: [☰] [Logo BosterTubePro] [Sisa Poin]. ☰ membuka drawer kiri: grup Utama, Bisnis, Akun (tanpa duplikat); klik luar = tutup.
   - Bottom nav fixed 70px: [Dashboard] [Upload] [Billing] [Akun]. Akun membuka panel profil (Pengaturan, Bantuan, legal, Logout).
   - Badge "Powered by Netlify" yang melayang di pojok kanan bawah disembunyikan (HP & desktop) supaya tidak menutupi
     Billing / chat bubble; teks kecilnya dipindah ke footer, bawah drawer & panel Akun.
   Desktop tidak berubah (sidebar kiri). Badge ADMIN hanya tampilan; hak unlimited tetap dicek server (/api/billing). */
(() => {
  if (document.getElementById('btpBottomNav')) return;
  const ADMIN_WHITELIST = ['boosterviewsubsid@gmail.com', 'insandoif5@gmail.com'];
  const style = document.createElement('style');
  style.textContent = `#btpBottomNav,#btpAccountSheet,#btpTopBar,#btpDrawer{display:none}
#nl-badge-frame,#nl-hud-frame{display:none!important}
@media(max-width:768px){
.btp-mobilebar,body.dashboard-page>div.flex>aside{display:none!important}
body.btp-has-bottom-nav{padding-top:calc(56px + env(safe-area-inset-top))!important;padding-bottom:calc(78px + env(safe-area-inset-bottom))!important}
body.btp-has-bottom-nav #bonus-50-bar{top:calc(62px + env(safe-area-inset-top))!important}
#btpTopBar{display:grid;grid-template-columns:48px 1fr auto;align-items:center;gap:8px;position:fixed;top:0;left:0;right:0;z-index:95;height:calc(56px + env(safe-area-inset-top));padding:env(safe-area-inset-top) 10px 0;background:#fff;border-bottom:1px solid #eceef5;box-shadow:0 4px 18px rgba(17,17,40,.08);font-family:Inter,system-ui,sans-serif}
#btpTopBar .burger{display:flex;align-items:center;justify-content:center;width:44px;height:44px;border:0;border-radius:12px;background:#f3f0ff;color:#121214;font-size:24px;line-height:1;cursor:pointer}
#btpTopBar .logo{display:flex;align-items:center;justify-content:center;gap:8px;min-width:0;color:#121214;font-weight:800;font-size:15px;text-decoration:none}
#btpTopBar .logo img{width:30px;height:30px;border-radius:8px;object-fit:contain;flex-shrink:0}
#btpTopBar .logo span{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
#btpTopBar .poin{display:flex;align-items:center;gap:4px;max-width:120px;padding:7px 10px;border-radius:999px;background:#fef3c7;color:#b45309;font-size:12px;font-weight:800;white-space:nowrap;text-decoration:none}
#btpTopBar .poin b{overflow:hidden;text-overflow:ellipsis}
#btpTopBar .poin.admin{background:#121214;color:#fde047}
#btpDrawer:not([hidden]){display:block;position:fixed;inset:0;z-index:100;background:rgba(0,0,0,.5)}
#btpDrawer .panel{position:absolute;top:0;bottom:0;left:0;width:min(84vw,320px);display:flex;flex-direction:column;overflow-y:auto;padding:calc(14px + env(safe-area-inset-top)) 12px calc(14px + env(safe-area-inset-bottom));background:#fff;color:#121214;font:500 14px/1.4 Inter,system-ui,sans-serif;box-shadow:8px 0 30px rgba(0,0,0,.2);animation:btp-drawer-in .18s ease-out}
@keyframes btp-drawer-in{from{transform:translateX(-100%)}to{transform:none}}
@media(prefers-reduced-motion:reduce){#btpDrawer .panel{animation:none}}
#btpDrawer .head{display:flex;align-items:center;gap:10px;padding:0 6px 12px;margin-bottom:6px;border-bottom:1px solid #eceef5}
#btpDrawer .head img{width:36px;height:36px;border-radius:10px}
#btpDrawer .head b{flex:1;font-size:16px}
#btpDrawer .close{width:36px;height:36px;border:0;border-radius:10px;background:#f4f4f7;font-size:16px;cursor:pointer}
#btpDrawer .item{display:flex;align-items:center;gap:12px;width:100%;min-height:48px;padding:0 10px;border:0;border-radius:12px;background:none;color:inherit;font:inherit;font-weight:700;text-align:left;text-decoration:none;cursor:pointer}
#btpDrawer .item[aria-current=page]{background:#efeaff;color:#5b3fd6}
#btpDrawer .item>span:first-child{width:26px;font-size:20px;text-align:center;flex-shrink:0}
#btpDrawer .ai{margin:4px 0;padding:8px 10px 10px;border-radius:14px;background:#f6f4ff}
#btpDrawer .ai p{margin:0 0 6px;font-weight:800}
#btpDrawer .ai a{display:flex;justify-content:space-between;padding:8px 4px 8px 38px;color:#3f3f46;font-size:13px;font-weight:600;text-decoration:none}
#btpDrawer .ai a small{color:#7C5CFF;font-weight:800;font-size:12px}
#btpDrawer .group{margin:10px 10px 2px;color:#9ca3af;font-size:11px;font-weight:800;letter-spacing:.08em;text-transform:uppercase}
#btpDrawer .item.sub{min-height:42px;font-weight:600;color:#3f3f46}
#btpDrawer .logout{margin-top:4px;justify-content:center;background:#fee2e2;color:#b91c1c;font-weight:800}
#btpDrawer .logout.login{background:#7C5CFF;color:#fff}
.btp-legal-mini{margin-top:auto;padding:14px 6px 0;color:#8b8ba3;font-size:11px;line-height:1.7;text-align:center}
.btp-legal-mini a{color:inherit}
.btp-legal-mini .powered{display:block;margin-top:4px;font-size:10px;opacity:.8}
#btpBottomNav{display:grid;grid-template-columns:repeat(4,1fr);position:fixed;left:0;right:0;bottom:0;z-index:90;height:calc(70px + env(safe-area-inset-bottom));padding:6px 6px env(safe-area-inset-bottom);background:#fff;border-top:1px solid #eceef5;box-shadow:0 -6px 24px rgba(17,17,40,.12)}
#btpBottomNav a,#btpBottomNav button{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:3px;height:58px;border:0;border-radius:14px;background:transparent;color:#52525b;font:700 12px/1.1 Inter,system-ui,sans-serif;text-decoration:none;cursor:pointer;-webkit-tap-highlight-color:transparent}
#btpBottomNav span{font-size:26px;line-height:1}
#btpBottomNav [aria-current=page],#btpBottomNav [aria-expanded=true]{background:#efeaff;color:#5b3fd6}
body.btp-has-bottom-nav #btpAi{bottom:calc(86px + env(safe-area-inset-bottom))!important;right:16px!important}
body.btp-has-bottom-nav #btpAi .ai-panel{bottom:calc(160px + env(safe-area-inset-bottom))!important;max-height:calc(100dvh - 230px)!important}
#btpAccountSheet:not([hidden]){display:block;position:fixed;inset:0;z-index:89;background:rgba(0,0,0,.45)}
#btpAccountSheet .sheet{position:absolute;left:0;right:0;bottom:calc(70px + env(safe-area-inset-bottom));max-height:calc(100dvh - 140px);overflow-y:auto;padding:18px 16px 12px;border-radius:20px 20px 0 0;background:#fff;color:#121214;font:500 14px/1.4 Inter,system-ui,sans-serif;box-shadow:0 -10px 30px rgba(0,0,0,.18)}
#btpAccountSheet .profile{display:flex;align-items:center;gap:12px;padding-bottom:14px;margin-bottom:6px;border-bottom:1px solid #eceef5}
#btpAccountSheet .avatar{display:flex;align-items:center;justify-content:center;width:44px;height:44px;flex-shrink:0;border-radius:50%;background:linear-gradient(135deg,#7C5CFF,#FF6BA8);color:#fff;font-weight:800;font-size:18px}
#btpAccountSheet .who{min-width:0;flex:1}
#btpAccountSheet .who b,#btpAccountSheet .who small{display:block;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
#btpAccountSheet .who small{color:#71717a;font-size:12px}
#btpAccountSheet .admin{flex-shrink:0;padding:5px 10px;border-radius:999px;background:#121214;color:#fde047;font-size:11px;font-weight:800;letter-spacing:.08em}
#btpAccountSheet .item{display:flex;align-items:center;gap:12px;width:100%;min-height:50px;padding:0 6px;border:0;border-bottom:1px solid #f4f4f7;background:none;color:inherit;font:inherit;font-weight:600;text-align:left;text-decoration:none;cursor:pointer}
#btpAccountSheet .item span{width:26px;font-size:20px;text-align:center}
#btpAccountSheet .auth{justify-content:center;margin-top:12px;border:0;border-radius:12px;background:#fee2e2;color:#b91c1c;font-weight:800}
#btpAccountSheet .auth.login{background:#7C5CFF;color:#fff}
#btpAccountSheet .terms{margin:12px 4px 0;color:#6b7280;font-size:11px}
}`;
  document.head.append(style);

  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
  const loggedIn = () => !!localStorage.getItem('btp_session');
  const email = () => (localStorage.getItem('btp_user_email') || '').trim().toLowerCase();
  const account = () => window.BTPPoints?.getSnapshot?.() || null;
  const isAdmin = () => loggedIn() && (ADMIN_WHITELIST.includes(email()) || !!account()?.isAdmin);
  const isUnlimited = () => isAdmin() || !!account()?.isUnlimited;
  const legalMini = `<div class="btp-legal-mini"><a href="/privacy-policy">Kebijakan Privasi</a> | <a href="/terms">Syarat Layanan</a> | <a href="https://www.youtube.com/t/terms" target="_blank" rel="noopener noreferrer">YouTube ToS</a> | <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer">Google Privacy</a><span class="powered">Powered by <a href="https://www.netlify.com" target="_blank" rel="noopener noreferrer">Netlify</a></span></div>`;

  async function authAction(button) {
    if (!loggedIn()) return window.BTPAuth ? window.BTPAuth.login() : location.assign('/login');
    button.disabled = true;
    if (window.BTPAuth) await window.BTPAuth.logout();
    else localStorage.removeItem('btp_session');
    location.replace('/login');
  }

  const init = () => {
    const path = location.pathname.replace(/\/$/, '') || '/';
    const at = (...paths) => paths.includes(path);

    // ===== Header atas =====
    const bar = document.createElement('header');
    bar.id = 'btpTopBar';
    bar.innerHTML = `<button type="button" class="burger" aria-label="Buka menu" aria-haspopup="dialog" aria-controls="btpDrawer" aria-expanded="false">☰</button>
<a class="logo" href="/"><img src="/b-logo.png" width="30" height="30" alt=""><span>BosterTubePro</span></a>
<a class="poin" href="/billing" aria-label="Sisa poin, buka Billing">💰 <b data-poin>—</b></a>`;
    const burger = bar.querySelector('.burger');
    const poin = bar.querySelector('.poin');
    const renderPoin = () => {
      const value = poin.querySelector('[data-poin]');
      const admin = isAdmin();
      poin.classList.toggle('admin', admin);
      if (isUnlimited()) { value.textContent = admin ? 'ADMIN ∞' : '∞ Unlimited'; return; }
      const points = account()?.userPoints ?? (loggedIn() ? localStorage.getItem('boster_poin') : null);
      value.textContent = points == null || points === '' ? (loggedIn() ? '—' : 'Login') : Number(points).toLocaleString('id-ID');
    };

    // ===== Drawer kiri (☰) =====
    const drawer = document.createElement('div');
    drawer.id = 'btpDrawer';
    drawer.hidden = true;
    const link = (href, icon, label, active, cls = 'item') =>
      `<a class="${cls}" href="${href}"${active ? ' aria-current="page"' : ''}><span aria-hidden="true">${icon}</span><span>${label}</span></a>`;
    const renderDrawer = () => {
      drawer.innerHTML = `<nav class="panel" role="dialog" aria-modal="true" aria-label="Menu">
<div class="head"><img src="/b-logo.png" width="36" height="36" alt=""><b>BosterTubePro</b><button type="button" class="close" data-close aria-label="Tutup menu">✕</button></div>
<p class="group">Utama</p>
${link('/', '🏠', 'Dashboard', at('/', '/index.html'))}
${link('/upload', '⬆️', 'Upload YouTube', at('/upload', '/upload.html'))}
<div class="ai"><p>🧠 Bedah &amp; Riset SEO</p>
<a href="/#bedahRisetAI">Bedah Channel <small>25 poin</small></a>
<a href="/#bedahRisetAI">Riset Video <small>2 poin</small></a>
<a href="/#bedahRisetAI">Ide Konten SEO <small>10 poin</small></a></div>
<p class="group">Bisnis</p>
${link('/billing', '💳', 'Billing &amp; Beli Poin', at('/billing', '/billing.html'))}
${link('/analytics', '📈', 'Analytics', at('/analytics'))}
${link('/kompetitor', '👥', 'Kompetitor', at('/kompetitor'))}
<p class="group">Akun</p>
${link('/pengaturan?tab=akun', '👤', 'Akun Saya', false)}
${link('/pengaturan', '⚙️', 'Pengaturan', at('/pengaturan', '/pengaturan.html'))}
${link('/bantuan', '💬', 'Bantuan', at('/bantuan'))}
${email() === 'boosterviewsubsid@gmail.com' && loggedIn() ? link('/pemakaian-gemini', '✨', 'Pemakaian Gemini', at('/pemakaian-gemini', '/pemakaian-gemini.html')) : ''}
<button type="button" class="item logout${loggedIn() ? '' : ' login'}" data-auth>${loggedIn() ? '🚪 Logout' : 'Login Google'}</button>
${legalMini}</nav>`;
      drawer.querySelector('[data-auth]').addEventListener('click', (e) => authAction(e.currentTarget));
    };
    const setDrawer = (open) => {
      if (open) { setSheet(false); renderDrawer(); }
      drawer.hidden = !open;
      burger.setAttribute('aria-expanded', String(open));
      document.documentElement.style.overflow = open ? 'hidden' : '';
      if (open) drawer.querySelector('[data-close]').focus();
    };
    burger.addEventListener('click', () => setDrawer(drawer.hidden));
    drawer.addEventListener('click', (e) => {
      if (e.target === drawer || e.target.closest('[data-close]')) setDrawer(false);
      else if (e.target.closest('a')) setDrawer(false);
    });

    // ===== Bottom nav =====
    const nav = document.createElement('nav');
    nav.id = 'btpBottomNav';
    nav.setAttribute('aria-label', 'Menu utama');
    const item = (href, icon, label, active) =>
      `<a href="${href}"${active ? ' aria-current="page"' : ''}><span aria-hidden="true">${icon}</span>${label}</a>`;
    nav.innerHTML = item('/', '🏠', 'Dashboard', at('/', '/index.html')) +
      item('/upload', '⬆️', 'Upload', at('/upload', '/upload.html')) +
      item('/billing#pricing', '💳', 'Billing', at('/billing', '/billing.html')) +
      `<button type="button" aria-haspopup="dialog" aria-controls="btpAccountSheet" aria-expanded="false"${at('/pengaturan') ? ' aria-current="page"' : ''}><span aria-hidden="true">👤</span>Akun</button>`;

    // ===== Panel Akun =====
    const sheet = document.createElement('div');
    sheet.id = 'btpAccountSheet';
    sheet.hidden = true;
    const accountBtn = nav.querySelector('button');
    const setSheet = (open) => {
      if (open) render();
      sheet.hidden = !open;
      accountBtn.setAttribute('aria-expanded', String(open));
    };
    const render = () => {
      const mail = email();
      const name = localStorage.getItem('btp_yt_channel') || (loggedIn() ? 'Akun Google' : 'Belum login');
      const row = (href, icon, label) => `<a class="item" href="${href}"><span aria-hidden="true">${icon}</span>${label}</a>`;
      sheet.innerHTML = `<div class="sheet" role="dialog" aria-modal="true" aria-label="Akun">
<div class="profile"><div class="avatar" aria-hidden="true">${esc((mail[0] || 'G').toUpperCase())}</div>
<div class="who"><b>${esc(name)}</b><small>${esc(mail || 'Login Google untuk mulai')}</small></div>${isAdmin() ? '<span class="admin">ADMIN</span>' : ''}</div>
${row('/pengaturan', '👤', 'Profil &amp; Pengaturan')}${row('/billing', '💳', isUnlimited() ? 'Poin: ∞ Unlimited' : 'Billing &amp; Beli Poin')}${row('/bantuan', '💬', 'Bantuan &amp; Pengaduan')}${row('/privacy-policy', '🔒', 'Kebijakan Privasi')}${row('/terms', '📜', 'Syarat &amp; Ketentuan')}
<button type="button" class="item auth${loggedIn() ? '' : ' login'}" data-auth>${loggedIn() ? '🚪 Logout' : 'Login Google'}</button>
<p class="terms">S&amp;K: Animasi Subscribe butuh paket Pro $14.99/Rp249k atau Agency, biaya 15 Poin/video.</p>${legalMini}</div>`;
      sheet.querySelector('[data-auth]').addEventListener('click', (e) => authAction(e.currentTarget));
    };
    accountBtn.addEventListener('click', () => { setDrawer(false); setSheet(sheet.hidden); });
    sheet.addEventListener('click', (e) => { if (e.target === sheet) setSheet(false); });
    document.addEventListener('keydown', (e) => {
      if (e.key !== 'Escape') return;
      if (!drawer.hidden) setDrawer(false);
      if (!sheet.hidden) setSheet(false);
    });
    const refresh = () => { renderPoin(); if (!sheet.hidden) render(); };
    window.addEventListener('credits-updated', refresh);
    window.addEventListener('points-updated', refresh);
    window.addEventListener('storage', refresh);

    document.body.prepend(bar);
    document.body.append(drawer, sheet, nav);
    document.body.classList.add('btp-has-bottom-nav');
    renderPoin();
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
