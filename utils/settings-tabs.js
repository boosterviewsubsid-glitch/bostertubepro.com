(() => {
  let adminAllowed = false;
  // Purchases live on /billing; forward old ?tab=pembelian and PayPal return links there.
  const params = new URLSearchParams(location.search);
  if (params.has('paypal') || params.get('tab') === 'pembelian') {
    params.delete('tab');
    location.replace('/billing' + (params.toString() ? '?' + params : ''));
    return;
  }
  const tabs = [...document.querySelectorAll('[data-settings-tab]')];
  function selectedTab() {
    // Akun Saya is the default; old ?tab=saldo / #saldo links now land on Referal & Keamanan.
    const requested = new URLSearchParams(location.search).get('tab');
    if (requested === 'google-api') return adminAllowed ? requested : 'akun';
    if (requested === 'channel' || requested === 'referal') return requested;
    if (requested === 'saldo' || ['#saldo', '#saldo-poin'].includes(location.hash)) return 'referal';
    return 'akun';
  }
  function activate(value, updateURL = false) {
    if (value === 'google-api' && !adminAllowed) value = 'akun';
    tabs.forEach(tab => {
      const selected = tab.dataset.settingsTab === value;
      tab.setAttribute('aria-selected', String(selected));
      tab.tabIndex = selected ? 0 : -1;
      tab.classList.toggle('tab-active', selected);
      document.getElementById(tab.getAttribute('aria-controls')).hidden = !selected;
    });
    if (updateURL) {
      const url = new URL(location.href);
      url.searchParams.set('tab', value);
      url.hash = '';
      history.pushState(null, '', url);
    }
    if (value === 'referal' && ['#saldo', '#saldo-poin'].includes(location.hash)) {
      requestAnimationFrame(() => document.querySelector(location.hash)?.scrollIntoView({ block: 'start' }));
    }
  }
  tabs.forEach(tab => {
    tab.addEventListener('click', () => { activate(tab.dataset.settingsTab, true); window.dispatchEvent(new CustomEvent('settings-tab', {detail: tab.dataset.settingsTab})); });
    tab.addEventListener('keydown', event => {
      const visible = tabs.filter(item => !item.hidden);
      const index = visible.indexOf(tab);
      let next;
      if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') next = visible[(index + (event.key === 'ArrowLeft' ? visible.length - 1 : 1)) % visible.length];
      else if (event.key === 'Home') next = visible[0];
      else if (event.key === 'End') next = visible[visible.length - 1];
      if (!next) return;
      event.preventDefault();
      next.focus();
      activate(next.dataset.settingsTab, true);
    });
  });
  window.addEventListener('popstate', () => activate(selectedTab()));
  window.addEventListener('hashchange', () => activate(selectedTab()));
  activate(selectedTab());
  async function authorize() {
    adminAllowed = false;
    window.dispatchEvent(new CustomEvent('google-api-access', {detail: false}));
    const tab = document.getElementById('tab-google-api');
    if (tab) tab.hidden = true;
    activate(selectedTab());
    const session = localStorage.getItem('btp_session') || '';
    if (!session) return;
    try {
      const response = await fetch('/api/me', {headers: {'x-btp-session': session}});
      if (!response.ok || session !== localStorage.getItem('btp_session')) return;
      const user = await response.json();
      adminAllowed = user.email === 'boosterviewsubsid@gmail.com' || ['admin', 'ADMIN'].includes(user.role);
      if (tab) tab.hidden = !adminAllowed;
      window.dispatchEvent(new CustomEvent('google-api-access', {detail: adminAllowed}));
      activate(selectedTab());
    } catch { /* Keep the admin tab hidden when authentication fails. */ }
  }
  window.addEventListener('storage', authorize);
  window.addEventListener('focus', authorize);
  authorize();
})();
