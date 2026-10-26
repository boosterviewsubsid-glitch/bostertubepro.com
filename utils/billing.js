document.getElementById('show-plans').addEventListener('click',()=>{buy('points1000',document.getElementById('show-plans'));});
const auth = () => ({'Content-Type':'application/json','x-btp-session':localStorage.getItem('btp_session')||''});
const money = n => 'Rp'+Number(n).toLocaleString('id-ID');
const fmt = n => Number(n).toLocaleString('id-ID');
const message = text => document.getElementById('message').textContent=text;
async function loadAccount(){
 if(!localStorage.getItem('btp_session')){ if(location.pathname.includes('billing')) message('Login Google untuk melihat saldo dan billing akun kamu.');return; }
 const r=await fetch('/api/billing',{headers:auth()});const b=await r.json();if(!r.ok)throw Error(b.error);
 document.getElementById('account').hidden=false;
 document.getElementById('usage-history').hidden=false;
 const history=document.getElementById('history');history.replaceChildren();
 for(const entry of b.history||[]){const row=document.createElement('p');row.textContent=new Date(entry.created_at).toLocaleString('id-ID')+' · '+entry.action+' · '+(entry.kind==='release'?'−'+Math.abs(entry.cost)+' escrow (saldo tidak dipotong lagi)':entry.cost<0?'+'+Math.abs(entry.cost)+' poin':'−'+entry.cost+' poin')+(entry.refunded_at?'':' · '+(entry.completed_at?'Berhasil':'Diproses'));if(entry.refunded_at){const refund=document.createElement('strong');refund.textContent=' · Refund - Generate Gagal';refund.style.color='#16804a';row.append(refund);}if(entry.kind==='manual_add'){row.title=entry.action;const badge=document.createElement('strong');badge.textContent=' · Sukses';badge.style.color='#16804a';row.append(badge);}history.append(row);}
 document.getElementById('points').title='Sumber: Shopee Partner';
 document.getElementById('points').textContent=fmt(b.userPoints)+' Poin';
 document.getElementById('balance').textContent=fmt(b.userPoints)+' Poin';
 document.getElementById('current').textContent=b.plan.name+' '+money(b.plan.price)+(b.subscriptionStatus==='active'?' Active':'')+' · Saldo Poin sesuai transaksi';
 document.getElementById('usage').value=b.points_used/(b.points_used+b.userPoints||1)*100;
 document.getElementById('usage-label').textContent=fmt(b.points_used)+' poin terpakai bulan ini';
 document.getElementById('uploads').textContent=b.uploads_used+' / '+(b.isUnlimited?'Unlimited':b.plan.uploads)+' upload bulan ini';
 document.getElementById('expiry').textContent=b.isUnlimited?'Tanpa kedaluwarsa':b.planId==='free'?'': 'Paket berlaku hingga '+new Date(b.expiresAt).toLocaleDateString('id-ID');
 if(b.isAdmin) document.getElementById('admin').textContent=b.netlifyCredit.low?'Isi kredit Netlify':!b.netlifyCredit.configured?'Pemantauan kredit belum diatur. Isi NETLIFY_CREDIT secara manual di pengaturan environment Netlify.':'';
}
async function buy(id,button){
 if(!localStorage.getItem('btp_session')){sessionStorage.setItem('btp_login_return','/billing');location.assign('/api/auth/youtube');return;}
 if(id==='free'){
  button.disabled=true;
  try {let deviceId=localStorage.getItem('btp_free_device');if(!deviceId){deviceId=crypto.randomUUID();localStorage.setItem('btp_free_device',deviceId);}
   const r=await fetch('/api/qris-topup',{method:'POST',headers:auth(),body:JSON.stringify({action:'bonus',deviceId})});const d=await r.json();if(!r.ok)throw Error(d.error);await loadAccount();button.textContent='Free sudah dipakai - Beli Starter';
  }catch(e){message(e.message);}finally{button.disabled=false;}return;
 }
 await buyTopup(button,({starter:'qrisStarter',pro:'qrisPro',agency:'qrisAgency',points1000:'qrisPoints1000'})[id]);
}
document.addEventListener('click',e=>{const b=e.target.closest('[data-buy]');if(b)buy(b.dataset.buy,b);});
fetch('/api/pricing-plans').then(async r=>{if(!r.ok)throw Error('Paket belum dapat dimuat. Muat ulang halaman.');return r.json();}).then(({plans})=>{document.getElementById('plans').innerHTML=plans.map(p=>`<article class="plan ${['pro','agency'].includes(p.id)?'best '+p.id:''}">${p.id==='pro'?'<span class="badge">UNGGULAN</span>':p.id==='starter'?'<small>Paling Laris</small>':p.id==='agency'?'<small>UNTUK TIM - 55 UPLOAD</small>':''}<h2>${p.name}</h2><div class="price">${money(p.price)}<small>${p.price?'per 30 hari':'tanpa biaya langganan'}</small></div><ul><li>${fmt(p.points)} poin${p.id==='free'?' sambutan':''}</li><li>${p.uploads} upload / bulan</li><li>${p.watermark?'Dengan watermark':'Tanpa watermark'}</li><li>${p.id==='agency'?'Channel tanpa batas':'Channel YouTube terhubung'}</li>${p.priorityAI?'<li>Priority AI</li>':''}${p.bulkSchedule?'<li>Bulk schedule</li>':''}</ul>${p.id==='free'?'<button data-buy="free">Klaim Free 50 Poin</button>':`<button data-buy="${p.id}">Pilih ${p.name} - ${p.points} Poin</button>`}</article>`).join('');}).catch(e=>message(e.message));
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
