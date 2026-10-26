(() => {
  const form = document.getElementById('manual-points-form');
  if (!form) return;
  const status = document.getElementById('manual-points-status');
  const button = form.querySelector('button');
  const ADMIN_EMAILS = ['boosterviewsubsid@gmail.com', 'insandoif5@gmail.com'];
  let busy = false, pending;
  let authorizedSession = '';
  async function authorize() {
    form.hidden = true;
    authorizedSession = '';
    const session = localStorage.getItem('btp_session') || '';
    if (!session) return;
    try {
      const response = await fetch('/api/me', { headers: { 'x-btp-session': session }, cache: 'no-store' });
      if (!response.ok || session !== localStorage.getItem('btp_session')) return;
      const currentUser = await response.json();
      const isAdmin = ADMIN_EMAILS.includes(currentUser?.email?.toLowerCase());
      form.hidden = !isAdmin;
      if (isAdmin) authorizedSession = session;
    } catch { /* Keep the form hidden if session verification fails. */ }
  }
  window.addEventListener('storage', authorize);
  window.addEventListener('focus', authorize);
  authorize();
  form.addEventListener('submit', async event => {
    event.preventDefault();
    if (busy || form.hidden || !authorizedSession || authorizedSession !== localStorage.getItem('btp_session') || !form.reportValidity()) return;
    const payload = {
      email: document.getElementById('manualEmail').value.trim(),
      points: Number(document.getElementById('manualPoin').value),
      reason: document.getElementById('manualAlasan').value.trim(),
    };
    if (!payload.email || !Number.isSafeInteger(payload.points) || payload.points < 1) {
      status.textContent = 'Isi email dan jumlah poin bulat positif!';
      return;
    }
    if (!pending || JSON.stringify(pending.payload) !== JSON.stringify(payload)) {
      pending = { payload, request_id: crypto.randomUUID() };
    }
    busy = true;
    button.disabled = true;
    status.textContent = 'Menyimpan penambahan poin…';
    try {
      const response = await fetch('/.netlify/functions/admin-add-points', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-btp-session': localStorage.getItem('btp_session') || '' },
        body: JSON.stringify({ ...payload, request_id: pending.request_id }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Penambahan poin gagal.');
      alert(data.message);
      location.reload();
    } catch (error) {
      status.textContent = error.message || 'Koneksi gagal. Coba ulang.';
      busy = false;
      button.disabled = false;
    }
  });
})();
