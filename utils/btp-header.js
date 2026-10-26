/* Shared account controls for the Dashboard and Pengaturan. */
(function () {
  function applyTheme(theme) {
    document.documentElement.classList.toggle('dark', theme === 'dark');
    document.documentElement.style.colorScheme = theme;
    const button = document.getElementById('headerThemeToggle');
    if (button) {
      button.textContent = theme === 'dark' ? 'Light' : 'Dark';
      button.setAttribute('aria-pressed', String(theme === 'dark'));
      button.setAttribute('aria-label', theme === 'dark' ? 'Aktifkan tema terang' : 'Aktifkan tema gelap');
    }
  }
  function savedTheme() {
    return (localStorage.getItem('theme') || localStorage.getItem('btp_theme')) === 'dark' ? 'dark' : 'light';
  }
  applyTheme(savedTheme());
  function render() {
    document.querySelectorAll('.btp-upgrade').forEach((button) => {
      button.classList.toggle('animate-pulse', getCredits() <= 50);
    });
    const loggedIn = !!btpSession();
    const dashboardLogin = document.getElementById('dashboardGoogleLogin');
    if (dashboardLogin) dashboardLogin.hidden = loggedIn;
    const logout = document.getElementById('dashboardLogout');
    if (logout) {
      logout.disabled = !loggedIn;
      logout.onclick = async () => {
        logout.disabled = true;
        await BTPAuth.logout();
        location.replace('/login');
      };
    }
    const account = document.getElementById('headerAccount');
    const button = document.getElementById('headerAuthButton');
    if (!account || !button) return;
    account.hidden = !loggedIn;
    button.textContent = loggedIn ? 'Logout' : 'Login Google';
    button.onclick = async () => {
      if (!btpSession()) return BTPAuth.login();
      button.disabled = true;
      await BTPAuth.logout();
      location.replace('/login');
    };
    const email = localStorage.getItem('btp_user_email') || '';
    document.getElementById('profileName').textContent = localStorage.getItem('btp_yt_channel') || 'Akun Google';
    document.getElementById('profileHandle').textContent = email;
    const avatar = document.getElementById('profileAvatar');
    if (!avatar.querySelector('img')) avatar.textContent = (email[0] || 'G').toUpperCase();
    renderPoinUI();
    renderBonusBar();
  }
  window.BTPHeader = { render };
  document.addEventListener('DOMContentLoaded', () => {
    applyTheme(savedTheme());
    document.getElementById('headerThemeToggle').onclick = () => {
      const theme = document.documentElement.classList.contains('dark') ? 'light' : 'dark';
      localStorage.setItem('theme', theme);
      localStorage.setItem('btp_theme', theme);
      applyTheme(theme);
    };
    render();
  });
  window.addEventListener('credits-updated', render);
  window.addEventListener('storage', () => { applyTheme(savedTheme()); render(); });
})();
