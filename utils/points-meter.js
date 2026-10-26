(() => {
 void import('/utils/api-key-handler.js?v=remove-rest-popup-1').then(module=>module.installApiKeyHandler());
 const original=window.fetch.bind(window);
 const session=()=>localStorage.getItem('btp_session')||'';
 let timer;
 const config=import('/utils/pointsConfig.js');
 let account=null;
 function exhausted(){
  let modal=document.getElementById('points-empty');
  if(!modal){modal=document.createElement('dialog');modal.id='points-empty';modal.style.cssText='max-width:380px;padding:28px;border:1px solid #78977a;border-radius:18px;background:#17251e;color:#f5f8f2';modal.innerHTML='<h2>Poin habis, beli Paket Pro Rp249k</h2><p>Tambah poin untuk melanjutkan fitur SEO.</p><a href="/billing">Beli Paket Pro Rp249k</a><form method="dialog"><button>Tutup</button></form>';document.body.appendChild(modal);}
  if(!modal.open)modal.showModal();
 }
 // Failed generation: the server refunds the points and flags it with X-Points-Refunded.
 function refunded(points,reason){
  let modal=document.getElementById('points-refunded');
  if(!modal){modal=document.createElement('dialog');modal.id='points-refunded';modal.style.cssText='max-width:380px;padding:28px;border:1px solid #78977a;border-radius:18px;background:#17251e;color:#f5f8f2';modal.innerHTML='<h2 style="margin:0 0 10px;font-size:20px">Gagal generate</h2><p data-points style="margin:0 0 8px"></p><p data-reason style="margin:0 0 16px;font-size:13px;opacity:.75"></p><form method="dialog"><button style="width:100%;padding:10px;border:0;border-radius:10px;background:#7c3aed;color:#fff;font-weight:700;cursor:pointer">OK, mengerti</button></form>';document.body.appendChild(modal);}
  modal.querySelector('[data-points]').textContent=points+' Poin sudah dikembalikan ke saldo Anda. Silakan coba lagi.';
  const note=modal.querySelector('[data-reason]');note.textContent=reason||'';note.hidden=!reason;
  if(!modal.open)modal.showModal();
 }
 window.BTPPoints={refresh:sync,showEmpty:exhausted,showRefund:refunded,getSnapshot:()=>session()?account:null};
 async function sync(){
  if(!session()){account=null;return;}
  const active=session();
  try{const r=await original('/api/billing',{headers:{'x-btp-session':active}});if(!r.ok||active!==session()){account=null;return;}const b=await r.json();
   account=b;window.dispatchEvent(new Event('points-updated'));
   localStorage.setItem('boster_poin',String(b.userPoints));window.dispatchEvent(new Event('credits-updated'));

  }catch{}
 }
 window.fetch=async(input,init)=>{
  const target=new URL(typeof input==='string'?input:input instanceof URL?input.href:input.url,location.href);
  if(target.origin!==location.origin)return original(input,init);
  const path=target.pathname;
  let b={};try{b=JSON.parse(init?.body||(input instanceof Request?await input.clone().text():'{}'));}catch{}
  const {requestActions,POINT_COSTS}=await config;
  const method=(init?.method||(input instanceof Request?input.method:'GET')).toUpperCase();
  const actions=requestActions(path,b,method);
  const cost=actions.reduce((n,a)=>n+POINT_COSTS[a],0);
  if(cost){
   await sync();
   if(!account || !session()) {exhausted();throw Error('Login untuk memakai poin akun.');}
   if(!account.isAdmin && !account.isUnlimited && account.userPoints<cost){exhausted();throw Error('Poin habis, beli Paket Pro Rp149k');}
   if(!account.isUnlimited && !window.confirm('Biaya aksi: '+cost+' poin. Poin dipotong setelah berhasil. Lanjutkan?'))throw Error('Dibatalkan. Poin tidak dipotong.');
   init={...init,headers:new Headers(init?.headers||(input instanceof Request?input.headers:undefined))};init.headers.set('x-btp-session',session());
  }
  const result=await original(input,init);
  if(result.status===402)exhausted();
  const back=Number(result.headers.get('x-points-refunded'))||0;
  if(back>0){const data=await result.clone().json().catch(()=>({}));refunded(back,typeof data.error==='string'?data.error:'');}
  if(cost||back){await sync();}
  return result;
 };
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',sync);else sync();
 window.addEventListener('focus',sync);
 // Logout: buang snapshot akun (poin / Unlimited) agar tidak tampil sebagai data tamu
 window.addEventListener('credits-updated',()=>{if(!session())account=null;});
})();
