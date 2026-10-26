(() => {
  const api = async (path, options = {}) => {
    const session = localStorage.getItem('btp_session');
    if (!session) throw new Error('Login Google di Pengaturan untuk isi poin.');
    const res = await fetch(path, { ...options, headers: { 'Content-Type': 'application/json', 'X-BTP-Session': session }, cache: 'no-store' });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Pembayaran gagal dimuat');
    return data;
  };
  window.BTPQris = {
    async create(paket) {
      const payment = await api('/api/create-qris', { method: 'POST', body: JSON.stringify({ paket }) });
      window.dispatchEvent(new Event('transactions-updated'));
      return payment;
    },
    processShopeePartnerQRIS: (paket) => window.BTPQris.create(paket),
    poll(orderId, update, error) {
      let stopped = false, timer;
      async function tick() {
        try {
          const data = await api('/api/check-payment?ref=' + encodeURIComponent(orderId));
          if (stopped) return;
          if (typeof data.btp_poin === 'number' && typeof saveSaldo === 'function') saveSaldo(data.btp_poin);
          if (data.status === 'PAID') {
            window.BTPPoints?.refresh();
            window.dispatchEvent(new Event('transactions-updated'));
          }
          update(data);
          if (['PAID', 'FAILED', 'EXPIRED'].includes(data.status)) return;
        } catch (e) { if (!stopped) error(e); }
        if (!stopped) timer = setTimeout(tick, 5000);
      }
      tick();
      return () => { stopped = true; clearTimeout(timer); };
    }
  };
})();
