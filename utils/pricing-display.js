(() => {
  const selector = document.getElementById('pricing-language');
  let language;
  try { language = localStorage.getItem('btp_pricing_language'); } catch {}
  if (!['id-ID', 'en-US'].includes(language)) language = /^id(?:-|$)/i.test(navigator.language || '') ? 'id-ID' : 'en-US';
  const idr = value => 'Rp ' + Number(value).toLocaleString('id-ID');
  const usd = value => '$' + Number(value).toFixed(2);
  const prices = (rupiah, dollars) => language === 'id-ID' ? [idr(rupiah), usd(dollars)] : [usd(dollars), idr(rupiah)];
  let packages = [];
  const render = () => {
    for (const plan of packages) {
      const [primary, secondary] = prices(plan.idr, plan.paypal);
      const price = document.querySelector(`[data-price="${plan.id}"]`);
      const sub = document.querySelector(`[data-secondary-price="${plan.id}"]`);
      if (price) price.textContent = primary;
      if (sub) sub.textContent = secondary;
    }
  };
  window.BTPPricing = { idr, usd, prices, update(plans, topUp) {
    packages = plans.filter(p => p.id !== 'free').map(p => ({...p, idr:p.price})).concat([{...topUp, id:'points1000'}]);
    render();
  } };
  if (selector) {
    selector.value = language;
    selector.addEventListener('change', () => {
      language = selector.value;
      try { localStorage.setItem('btp_pricing_language', language); } catch {}
      render();
      window.dispatchEvent(new Event('pricing-language'));
    });
  }
  // Apply the browser preference immediately to the static fallback prices.
  document.querySelectorAll('[data-price]').forEach(el => {
    const secondary = document.querySelector(`[data-secondary-price="${el.dataset.price}"]`);
    if (language === 'en-US' && secondary) [el.textContent, secondary.textContent] = [secondary.textContent, el.textContent];
  });
  document.addEventListener('click', async event => {
    const button = event.target.closest('[data-paypal-plan]');
    if (!button) return;
    button.disabled = true;
    try {
      const checkout = document.querySelector('paypal-points');
      if (!checkout?.plans) throw Error('Pilihan PayPal sedang dimuat. Coba lagi sebentar.');
      await checkout.checkout(button.dataset.paypalPlan);
    } catch (error) {
      document.getElementById('message').textContent = error.message;
    } finally { button.disabled = false; }
  });
})();
