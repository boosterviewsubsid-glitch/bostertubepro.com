(() => {
  const labels = { success: 'Sukses', failed: 'Gagal', unverified: 'Belum Terverifikasi', pending: 'Menunggu Pembayaran' };
  const escape = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  class TransactionHistory extends HTMLElement {
    connectedCallback() {
      this.rows = []; this.filter = ''; this.search = '';
      this.innerHTML = `<section class="mutation-card"><div class="mutation-heading"><div><h2>Riwayat Transaksi</h2><p>Pantau status pembayaran dan poin secara otomatis.</p></div></div><div class="mutation-tools"><div class="mutation-filters" role="group" aria-label="Filter status">${[['','Semua'],['success','Sukses'],['failed','Gagal'],['unverified','Belum Terverifikasi']].map(([id,label]) => `<button type="button" data-filter="${id}" aria-pressed="${!id}">${label}</button>`).join('')}</div><input type="search" placeholder="Cari tanggal atau nominal…" aria-label="Cari tanggal atau nominal"></div><div class="mutation-scroll"><table><thead><tr>${['Tanggal','Metode','Paket','Nominal','Status'].map(x=>`<th scope="col">${x}</th>`).join('')}</tr></thead><tbody></tbody></table></div><p class="mutation-message" role="status" aria-live="polite"></p></section>`;
      this.message = this.querySelector('[role=status]');
      this.addEventListener('input', e => { if (e.target.matches('input')) { this.search = e.target.value; this.render(); } });
      this.addEventListener('click', e => this.click(e));
      this.refresh = () => this.load();
      window.addEventListener('transactions-updated', this.refresh);
      this.load();
    }
    disconnectedCallback() { window.removeEventListener('transactions-updated', this.refresh); }
    async api(path, method = 'GET') {
      const session = localStorage.getItem('btp_session');
      if (!session) throw Error('Login untuk melihat riwayat transaksi.');
      const res = await fetch(path, { method, cache:'no-store', headers:{'x-btp-session':session} });
      const data = await res.json();
      if (!res.ok) throw Error(data.error || 'Transaksi belum dapat diproses.');
      return data;
    }
    async load() {
      if (this.loading) return;
      this.loading = true;
      this.message.textContent = 'Memuat riwayat transaksi…';
      try { const data = await this.api('/api/transactions'); this.rows = data.transactions; this.render(); this.message.textContent = `${this.rows.length} transaksi diperbarui otomatis.`; }
      catch(e) { this.message.textContent = e.message; }
      finally { this.loading = false; }
    }
    render() {
      const query = this.search.toLowerCase().trim();
      const rows = this.rows.filter(r => {
        const date = new Date(r.created_at);
        const nominal = ['paypal','paypal_card'].includes(r.method) ? `$${r.usd} USD` : `Rp${Number(r.amount).toLocaleString('id-ID')}`;
        const text = `${date.toLocaleString('id-ID')} ${date.toLocaleDateString('en-GB')} ${String(r.created_at).slice(0,10)} ${nominal} ${r.usd || r.amount} ${r.nominal_asli || (r.method === 'qris' ? Math.floor(Number(r.amount)/1000)*1000 : '')}`.toLowerCase();
        return (!this.filter || r.status === this.filter) && (!query || text.includes(query) || text.replace(/[.,]/g,'').includes(query.replace(/[.,]/g,'')));
      });
      this.querySelector('tbody').innerHTML = rows.length ? rows.map(r => {
        const paypal = ['paypal','paypal_card'].includes(r.method), manual = r.method === 'manual_admin';
        const plan = r.plan_id.replace(/^(paypal_|qris_)/,'').replace(/points1000/i,'Top-up');
        return `<tr${manual ? ` title="${escape(r.alasan || '')}"` : ''}><td>${escape(new Date(r.created_at).toLocaleString('id-ID'))}</td><td>${manual ? 'Manual by Admin' : paypal ? (r.method === 'paypal_card' ? 'Kartu via PayPal' : 'PayPal') : 'QRIS Shopee Partner'}</td><td>${manual ? 'Tambah Poin Manual' : escape(plan)}<small>${Number(r.poin).toLocaleString('id-ID')} POIN</small></td><td>${manual ? '+'+Number(r.poin).toLocaleString('id-ID')+' poin' : paypal ? `$${escape(r.usd)} USD` : `Rp${Number(r.amount).toLocaleString('id-ID')}`}</td><td><span class="mutation-status ${escape(r.status)}">${labels[r.status] || 'Pending'}</span></td></tr>`;
      }).join('') : '<tr><td colspan="5" style="text-align:center;padding:32px">Tidak ada transaksi yang cocok.</td></tr>';
    }
    async click(event) {
      const button = event.target.closest('button');
      if (!button || !this.contains(button)) return;
      if (button.hasAttribute('data-filter')) {
        this.filter = button.dataset.filter;
        this.querySelectorAll('[data-filter]').forEach(b=>b.setAttribute('aria-pressed',String(b === button)));
        this.render(); return;
      }

    }
  }
  customElements.define('transaction-history', TransactionHistory);
})();
