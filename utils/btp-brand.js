/* Shared UI identity across the standalone application pages. */
(function () {
  function renderChannel() {
    document.querySelectorAll('[data-brand-channel]').forEach(function (label) {
      label.textContent = localStorage.getItem('btp_yt_channel') || 'Channel YouTube kamu';
    });
  }
  renderChannel();
  window.addEventListener('storage', renderChannel);
})();
