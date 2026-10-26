(async () => {
 const status = document.getElementById('referral-status');
 const button = document.getElementById('copy-referral');
 const input = document.getElementById('referral-link');
 try {
  const session = localStorage.getItem('btp_session') || '';
  const response = await fetch('/api/referrals', {headers:{'x-btp-session':session}});
  if (!response.ok) throw Error(response.status === 401 ? 'Login untuk melihat statistik referral.' : 'Statistik referral belum dapat dimuat. Muat ulang untuk mencoba lagi.');
  const data = await response.json();
  document.getElementById('referral-total').textContent = `Total Poin dari Referral: ${Number(data.total_points).toLocaleString('id-ID')} Poin`;
  input.value = `${location.origin}/?ref=${encodeURIComponent(data.code)}`;
  button.disabled = false;
  button.onclick = async () => {
   try { await navigator.clipboard.writeText(input.value); status.textContent = 'Tautan berhasil disalin.'; }
   catch { input.select(); status.textContent = 'Salin tautan dari kolom di atas.'; }
  };
 } catch (error) { status.textContent = error.message; }
})();
