(() => {
  if (customElements.get('paypal-points')) return;
  class PayPalPoints extends HTMLElement {
    connectedCallback() {
      // Only remove legacy PayPal checkout keys; preserve sessions and other payments.
      for (const key of Object.keys(localStorage)) {
        if (/paypal.*order|order.*paypal/i.test(key)) localStorage.removeItem(key);
      }
      this.innerHTML = `<section class="paypal-section" style="margin:20px 0;padding:22px;background:#fff;color:#23354d;border:1px solid #cbd5df;border-radius:16px"><h2 style="font-size:20px;margin:0 0 8px;font-weight:800">PayPal · POIN dalam USD</h2><p data-business-payment style="font-size:13px;font-weight:600">Pembayaran via PayPal Bisnis BoosterTubePro</p><p style="font-size:13px;line-height:1.7">Harga QRIS dalam rupiah bersifat tetap. PayPal ditagih dalam USD; kurs dan biaya konversi mengikuti PayPal atau penerbit kartu. Poin otomatis masuk setelah pembayaran selesai. Pemeriksaan server berjalan setiap menit, termasuk jika halaman ditutup.</p><div data-plans class="payment-grid" style="display:grid;grid-template-columns:repeat(auto-fit,minmax(190px,1fr));gap:12px;margin-top:16px"></div><p data-status role="status" aria-live="polite" style="font-size:13px;margin:16px 0"></p></section>`;
      this.status = this.querySelector('[data-status]');
      this.querySelector('section').insertAdjacentHTML('beforeend', `<div data-checkout hidden style="max-width:460px;margin:20px auto;padding:24px;background:white;border:1px solid #dce2e8;border-radius:14px"><h3 data-summary style="font-weight:700;margin-bottom:18px"></h3><div data-paypal></div><div style="text-align:center;color:#687587;margin:16px 0">atau bayar dengan kartu</div><div data-card-message role="status"></div><form data-card-form hidden><div style="display:flex;gap:12px;align-items:center;margin-bottom:18px"><strong style="font-style:italic;color:#143581">VISA</strong><span aria-label="Mastercard" style="display:inline-flex"><span style="width:24px;height:24px;border-radius:50%;background:#d94337"></span><span style="width:24px;height:24px;border-radius:50%;background:#eda835;margin-left:-9px"></span></span><span style="font-size:12px;color:#687587">Debit / Kredit</span></div><label>Nama pada kartu</label><div data-field="name"></div><label>Nomor kartu</label><div data-field="number"></div><div style="display:grid;grid-template-columns:1fr 1fr;gap:12px"><div><label>Masa berlaku</label><div data-field="expiry"></div></div><div><label>CVV</label><div data-field="cvv"></div></div></div><button type="submit" data-pay style="width:100%;padding:13px;border-radius:8px;background:#25364b;color:white;margin-top:16px;font-weight:700">Bayar</button><p style="font-size:12px;color:#687587;margin-top:12px">Diproses aman oleh PayPal. Data kartu tidak disimpan BosterTubePro. Verifikasi bank mungkin diperlukan.</p></form></div>`);
      this.querySelector('[data-card-form]').addEventListener('submit', async event => {
        event.preventDefault();
        if (this.busy) return;
        this.busy = true;
        const button = this.querySelector('[data-pay]');
        button.disabled = true;
        this.status.textContent = 'Memproses pembayaran kartu…';
        try { await this.cardFields.submit(); }
        catch { this.status.textContent = 'Kartu belum dapat diproses. Periksa isian kartu atau gunakan PayPal.'; }
        finally { this.busy = false; button.disabled = false; }
      });
      this.renderPlans();
      this.onPricingLanguage = () => this.renderPlans();
      window.addEventListener('pricing-language', this.onPricingLanguage);
      this.addEventListener('click', async event => {
        const button = event.target.closest('button');
        if (!button || !this.contains(button)) return;
        button.disabled = true;
        try {
          if (button.dataset.plan) {
            await this.checkout(button.dataset.plan);
          } else if (button.dataset.order) await this.capture(button.dataset.order);
        } catch (e) { this.status.textContent = e.message; } finally { button.disabled = false; }
      });
      const params = new URLSearchParams(location.search);
      if (params.get('paypal') === 'return' && params.get('token')) {
        this.capture(params.get('token')).catch(e => { this.status.textContent = e.message; this.load(); });
      } else {
        if (params.get('paypal') === 'cancel') this.status.textContent = 'Pembayaran dibatalkan. POIN belum ditambahkan.';
        this.load();
      }
    }
    disconnectedCallback() { window.removeEventListener('pricing-language', this.onPricingLanguage); }
    async api(body) {
      const session = localStorage.getItem('btp_session');
      if (!session) throw Error('Login Google terlebih dahulu untuk membeli POIN.');
      const response = await fetch(body?.action === 'capture' ? '/api/paypal/capture-order' : '/api/paypal-payment', { method: body ? 'POST' : 'GET', cache: 'no-store', headers: { 'Content-Type': 'application/json', 'x-btp-session': session }, ...(body ? { body: JSON.stringify(body) } : {}) });
      const data = await response.json();
      if (!response.ok) throw Error(data.error || 'PayPal belum tersedia. Coba lagi.');
      return data;
    }
    async renderPlans() {
      try {
      const response = await fetch('/api/pricing-plans', {cache:'no-store'});
      if (!response.ok) throw Error('Harga belum dapat dimuat');
      const pricing = await response.json();
      const plans = pricing.plans.filter(p=>p.id!=='free').map(p=>[p.id,p.name,p.points,Number(p.paypal).toFixed(2),p.price,({pro:'MOST POPULAR',agency:'BEST VALUE'})[p.id] || '']).concat([['points1000','Top-up',pricing.topUp.points,Number(pricing.topUp.paypal).toFixed(2),pricing.topUp.idr,'']]);
      // Sultan bisa dibayar lewat checkout ini, tapi kartunya hanya tampil di /billing.
      this.plans = pricing.sultan ? plans.concat([['sultan',pricing.sultan.name,pricing.sultan.points,Number(pricing.sultan.paypal).toFixed(2),pricing.sultan.price,'UNLIMITED']]) : plans;
      const display = window.BTPPricing || {
        idr: n => 'Rp ' + Number(n).toLocaleString('id-ID'),
        prices: (idr,usd) => /^id(?:-|$)/i.test(navigator.language || '')
          ? ['Rp ' + Number(idr).toLocaleString('id-ID'), '$' + usd]
          : ['$' + usd, 'Rp ' + Number(idr).toLocaleString('id-ID')],
      };
      this.querySelector('[data-plans]').innerHTML = plans.map(([id,name,points,usd,idr,label]) => `<article class="payment-card" style="border:1px solid ${label ? '#0070ba' : '#dce2e8'};border-radius:12px;padding:16px;display:flex;flex-direction:column;gap:8px">${label ? `<small class="payment-badge">${label}</small>` : ""}<h3 style="font-weight:700">${name} · ${points.toLocaleString('id-ID')} POIN</h3><strong style="font-size:24px">${display.prices(idr,usd)[0]}</strong><small>${display.prices(idr,usd)[1]}</small><p style="color:${['pro','agency'].includes(id)?'#15803d':'#6b7280'}">${['pro','agency'].includes(id)?'✅ Termasuk Animasi Subscribe 15 Poin (5 Variasi)':'🔒 Animasi Subscribe (Khusus Pro)'}</p><button data-buy="${id}" style="padding:11px;border-radius:8px;background:#25364b;color:white;font-weight:700;cursor:pointer">Bayar QRIS ${display.idr(idr)}</button><button data-plan="${id}" style="margin-top:auto;padding:11px;border-radius:8px;background:#0070BA;color:white;font-weight:700;cursor:pointer">PayPal $${usd}</button></article>`).join('');
      if (this.hasAttribute('paypal-only')) this.querySelectorAll('[data-buy]').forEach(button => button.remove());
      } catch(e) { this.status.textContent=e.message; }
    }
    async sdk() {
      if (!window.btpPayPalSdk) window.btpPayPalSdk = (async () => {
        const response = await fetch('/api/paypal/config', {cache:'no-store'});
        const config = await response.json();
        if (!response.ok || !config.clientId || !['live', 'sandbox'].includes(config.mode)) throw Error('PayPal belum dikonfigurasi. Hubungi admin.');
        await new Promise((resolve, reject) => {
          const script = document.createElement('script');
          script.src = 'https://www.paypal.com/sdk/js?' + new URLSearchParams({'client-id':config.clientId,components:'buttons,card-fields',currency:'USD',intent:'capture'});
          script.onload = resolve;
          script.onerror = () => { script.remove(); reject(Error('SDK PayPal gagal dimuat. Coba lagi.')); };
          document.head.append(script);
        });
        return window.paypal;
      })().catch(error => { window.btpPayPalSdk = null; throw error; });
      return window.btpPayPalSdk;
    }
    async checkout(plan) {
      if (this.busy) return;
      if (!localStorage.getItem('btp_session')) throw Error('Login Google terlebih dahulu untuk membeli POIN.');
      const version = this.checkoutVersion = (this.checkoutVersion || 0) + 1;
      this.status.textContent = 'Memuat pilihan pembayaran…';
      const paypal = await this.sdk();
      if (version !== this.checkoutVersion || !this.isConnected) return;
      if (this.paypalButtons) await this.paypalButtons.close();
      if (this.cardFields) await this.cardFields.close?.();
      const selected = this.plans.find(p => p[0] === plan);
      const panel = this.querySelector('[data-checkout]');
      panel.hidden = false;
      this.querySelector('[data-summary]').textContent = `${selected[1]} · ${selected[2].toLocaleString('id-ID')} POIN · $${selected[3]} USD`;
      this.querySelector('[data-pay]').textContent = `Bayar $${selected[3]} USD`;
      this.querySelector('[data-card-form]').hidden = true;
      this.querySelector('[data-card-message]').textContent = '';
      this.querySelector('[data-paypal]').replaceChildren();
      this.querySelectorAll('[data-field]').forEach(el => { el.replaceChildren(); el.style.cssText = 'height:48px;border:1px solid #cbd5df;border-radius:8px;margin:6px 0 16px'; });
      const createOrder = async () => {
        this.busy = true;
        try { return (await this.api({action:'create',plan,embedded:true})).orderId; }
        catch (error) { this.busy = false; throw error; }
      };
      const onApprove = async data => { try { await this.capture(data.orderID); } finally { this.busy = false; } };
      const onError = () => { this.busy = false; this.status.textContent = 'Pembayaran belum selesai. Periksa kartu atau coba PayPal. Poin masuk setelah pembayaran terverifikasi.'; };
      this.paypalButtons = paypal.Buttons({fundingSource:paypal.FUNDING.PAYPAL,style:{layout:'vertical',color:'gold',label:'paypal'},createOrder,onApprove,onError,onCancel:() => {this.busy=false;this.status.textContent='Pembayaran dibatalkan.';}});
      await this.paypalButtons.render(this.querySelector('[data-paypal]'));
      this.cardFields = paypal.CardFields({createOrder,onApprove,onError,style:{input:{'font-size':'16px','color':'#25364b'},'.invalid':{color:'#b42318'}}});
      if (this.cardFields.isEligible()) {
        this.querySelector('[data-card-form]').hidden = false;
        await Promise.all([
          this.cardFields.NameField({placeholder:'Nama sesuai kartu'}).render(this.querySelector('[data-field="name"]')),
          this.cardFields.NumberField({placeholder:'Nomor kartu'}).render(this.querySelector('[data-field="number"]')),
          this.cardFields.ExpiryField({placeholder:'MM/YY'}).render(this.querySelector('[data-field="expiry"]')),
          this.cardFields.CVVField({placeholder:'CVV'}).render(this.querySelector('[data-field="cvv"]')),
        ]);
      } else {
        this.querySelector('[data-card-message]').textContent = 'Pembayaran kartu langsung belum tersedia untuk akun merchant atau wilayah Anda. Gunakan PayPal di atas.';
      }
      this.status.textContent = 'Pilih PayPal atau isi kartu di bawah.';
      panel.scrollIntoView({behavior:'smooth',block:'nearest'});
    }
    async capture(order) {
      if (!order) return;
      this.status.textContent = 'Memverifikasi pembayaran PayPal…';
      const returnUrl = new URL(location.href);
      for (const key of ['paypal', 'token', 'PayerID']) returnUrl.searchParams.delete(key);
      history.replaceState(null, '', returnUrl);
      const data = await this.api({ action: 'capture', order });
      if (!data.success) { this.status.textContent = data.message || 'Pembayaran belum terverifikasi.'; await this.load(); return; }
      if (typeof window.saveSaldo === 'function') window.saveSaldo(data.btp_poin);
      window.dispatchEvent(new Event('credits-updated'));
      this.status.textContent = data.alreadyCredited ? 'Pembayaran sudah tercatat. Saldo: ' + Number(data.btp_poin).toLocaleString('id-ID') + ' POIN.' : 'Pembayaran berhasil! ' + Number(data.pointsAdded).toLocaleString('id-ID') + ' Poin ditambahkan!';
      const toast = document.createElement('div');
      toast.setAttribute('role', 'status');
      toast.textContent = this.status.textContent;
      toast.style.cssText = 'position:fixed;bottom:90px;left:50%;transform:translateX(-50%);max-width:90vw;padding:14px 20px;background:#166534;color:white;border-radius:12px;box-shadow:0 4px 20px #0003;z-index:10000';
      document.body.append(toast);
      setTimeout(() => toast.remove(), 6000);
      await this.load();
    }
    async load() {
      window.dispatchEvent(new Event('transactions-updated'));
    }
  }
  customElements.define('paypal-points', PayPalPoints);
})();
