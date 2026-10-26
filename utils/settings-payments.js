document.getElementById('show-plans').addEventListener('click',()=>{buy('points1000',document.getElementById('show-plans'));});
const auth = () => ({'Content-Type':'application/json','x-btp-session':localStorage.getItem('btp_session')||''});
const money = n => 'Rp'+Number(n).toLocaleString('id-ID');
const fmt = n => Number(n).toLocaleString('id-ID');
const message = text => document.getElementById('message').textContent=text;
async function loadAccount(){
 if(!localStorage.getItem('btp_session')){ if(location.pathname.includes('billing')) message('Login Google untuk melihat saldo dan billing akun kamu.');return; }
 const r=await fetch('/api/billing',{headers:auth()});const b=await r.json();if(!r.ok)throw Error(b.error);
 document.getElementById('balance').textContent=fmt(b.userPoints)+' Poin';
 window.dispatchEvent(new Event('transactions-updated'));
}
async function buy(id,button){
 if(!localStorage.getItem('btp_session')){sessionStorage.setItem('btp_login_return','/pengaturan');location.assign('/api/auth/youtube');return;}
 if(id==='free'){
  button.disabled=true;
  try {let deviceId=localStorage.getItem('btp_free_device');if(!deviceId){deviceId=crypto.randomUUID();localStorage.setItem('btp_free_device',deviceId);}
   const r=await fetch('/api/qris-topup',{method:'POST',headers:auth(),body:JSON.stringify({action:'bonus',deviceId})});const d=await r.json();if(!r.ok)throw Error(d.error);await loadAccount();button.textContent='Free sudah dipakai - Beli Starter';
  }catch(e){message(e.message);}finally{button.disabled=false;}return;
 }
 await buyTopup(button,({starter:'qrisStarter',pro:'qrisPro',agency:'qrisAgency',points1000:'qrisPoints1000'})[id]);
}
document.addEventListener('click',e=>{const b=e.target.closest('[data-buy]');if(b)buy(b.dataset.buy,b);});
loadAccount().catch(e=>message(e.message));

const order=new URLSearchParams(location.search).get('order_id');if(order)fetch('/api/midtrans-status?order_id='+encodeURIComponent(order),{headers:auth()}).then(()=>loadAccount()).catch(e=>message(e.message));

let stopTopup=()=>{};
async function buyTopup(button,paket="qrisPoints1000"){
 button.disabled=true;
 try{
  const p=await BTPQris.processShopeePartnerQRIS(paket);
  const dialog=document.getElementById('topup'),status=document.getElementById('topup-status');
  document.getElementById('checkout-title').textContent=({qrisStarter:'Starter - 500 Poin',qrisPro:'Pro - 2.000 Poin',qrisAgency:'Agency - 5.000 Poin',qrisPoints1000:'1.000 Poin Tambahan'})[paket];
  document.getElementById('topup-total').textContent='Total bayar: '+money(p.amount);
  const instructions=`Silakan transfer sesuai nominal ${money(p.amount)} ke QRIS di atas. Setelah transfer, tunggu 1-2 menit, sistem akan otomatis verifikasi via notifikasi Shopee Partner. Jangan tutup halaman, saldo akan otomatis masuk. Jika 5 menit belum masuk, hubungi admin dengan bukti transfer.`;
  document.getElementById('topup-qr').hidden=false;
  status.className='mutation-status pending';status.textContent='Menunggu Pembayaran';
  document.getElementById('topup-instructions').textContent=instructions;
  dialog.showModal();stopTopup();
  stopTopup=BTPQris.poll(p.order_id,d=>{
   if(d.status==='PAID'){status.className='mutation-status success';status.textContent='Pembayaran berhasil. Poin paket telah masuk.';document.getElementById('topup-qr').hidden=true;loadAccount().catch(e=>message(e.message));}
   else if(['FAILED','EXPIRED'].includes(d.status)){status.className='mutation-status failed';status.textContent='Pembayaran kedaluwarsa atau ditolak. Jika sudah membayar, hubungi admin dengan bukti transfer.';document.getElementById('topup-qr').hidden=true;}
   else {status.className='mutation-status pending';status.textContent='Menunggu Pembayaran';}
  },()=>{status.textContent='Status belum dapat dimuat. Sistem mencoba kembali…';});
  dialog.onclose=()=>stopTopup();
 }catch(e){message(e.message);}finally{button.disabled=false;}
}

window.addEventListener('credits-updated',()=>loadAccount().catch(e=>message(e.message)));

// Channel controls reuse the authenticated account endpoints.
const channelRoot = document.getElementById('settings-channels');
async function channelApi(body) {
 if (!localStorage.getItem('btp_session')) throw Error('Login Google untuk mengelola channel.');
 const response = await fetch('/api/channels', {method: body ? 'POST' : 'GET', headers:auth(), cache:'no-store', ...(body ? {body:JSON.stringify(body)} : {})});
 const data = await response.json();
 if (!response.ok) throw Error(data.error || 'Channel belum dapat diproses.');
 return data;
}
async function loadChannels() {
 channelRoot.textContent = 'Memuat channel…';
 try {
  const {channels} = await channelApi(); channelRoot.replaceChildren();
  if (!channels.length) channelRoot.textContent = 'Belum ada channel terhubung.';
  for (const channel of channels) {
   const row = document.createElement('article');
   const title = document.createElement('p'); title.textContent = channel.channel_name + (channel.active ? ' · Aktif' : ''); row.append(title);
   if (!channel.active) for (const [action,label] of [['switch','Gunakan Channel'],['remove','Lepas Channel']]) {
    const button = document.createElement('button'); button.textContent = label;
    button.onclick = async () => {
     if (action === 'remove' && !confirm('Lepas channel ini dari akun?')) return;
     button.disabled = true;
     try { await channelApi({action,channelId:channel.channel_id}); if(action==='switch') location.reload(); else await loadChannels(); }
     catch(error) { channelRoot.textContent=error.message; }
    }; row.append(button);
   }
   channelRoot.append(row);
  }
 } catch(error) { channelRoot.textContent = error.message; }
}
document.getElementById('tab-channel').addEventListener('click', loadChannels);
document.getElementById('add-channel').onclick = async event => {
 event.target.disabled = true;
 try { const data = await channelApi({action:'link'}); location.assign(data.url); }
 catch(error) { channelRoot.textContent = error.message; event.target.disabled = false; }
};
loadChannels();

// Both payment sections read prices from the server's shared pricing configuration.
fetch('/api/pricing-plans', {cache:'no-store'}).then(r=>{if(!r.ok)throw Error('Harga belum dapat dimuat');return r.json();}).then(({plans,topUp})=>{
 for(const plan of plans){
  const card=document.querySelector(`[data-buy="${plan.id}"]`)?.closest('.package-card');
  if(card){card.querySelector('.package-points').textContent=fmt(plan.points)+' P';if(plan.id==='free')card.querySelector('.package-price').textContent=money(plan.price);}
 }
 window.BTPPricing?.update(plans,topUp);
 document.getElementById('show-plans').textContent='Beli Poin Tambahan '+fmt(topUp.points)+' Poin = '+money(topUp.idr);
}).catch(e=>message(e.message));
