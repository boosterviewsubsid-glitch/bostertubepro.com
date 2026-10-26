const host=document.getElementById('admin-key-usage');
async function refresh(){
 host.hidden=true;host.replaceChildren();
 const session=localStorage.getItem('btp_session');if(!session)return;
 try{
  const me=await fetch('/api/me',{headers:{'x-btp-session':session}});if(!me.ok)return;
  const user=await me.json();if(user.email!=='boosterviewsubsid@gmail.com'||user.role!=='ADMIN')return;
  const r=await fetch('/api/admin-keys',{headers:{'x-btp-session':session}});if(!r.ok)throw Error();
  const d=await r.json();if(session!==localStorage.getItem('btp_session'))return;
  const keys=d.keys.filter(k=>k.provider==='youtube');
  const owner=document.createElement('h2');owner.textContent='Dashboard Owner - Mis. Memet Melany | System Upload 2 Menit';owner.style.cssText='font-weight:800;font-size:16px;margin-bottom:2px';
  const by=document.createElement('p');by.textContent='Upload YouTube 2 Menit By Mis. Memet Melany';by.style.cssText='font-size:12px;color:#6b7280;margin-bottom:10px';host.append(owner,by);
  if(d.quota){const q=d.quota,fmt=n=>Number(n).toLocaleString('id-ID');const monitor=document.createElement('p');monitor.style.cssText='font-weight:700;margin-bottom:8px';monitor.textContent=`Kuota: ${fmt(q.used)} / ${fmt(q.limit)} - ${q.activeKeys} Key Aktif${q.adminKey?' · Key Admin terpisah':''}`;host.append(monitor);}
  const title=document.createElement('h3');title.textContent='YouTube Keys Usage Hari Ini';host.append(title);
  const rows=document.createElement('p');rows.textContent=Array.from({length:20},(_,i)=>{const k=keys.find(k=>k.slot===i+1);return `Key${i+1}: ${k?`${k.percent.toFixed(1)}% terpakai (${k.status})`:'Belum diisi'}`;}).join(' · ');host.append(rows);
  const note=document.createElement('p');const remaining=keys.reduce((sum,k)=>sum+(k.status==='Habis'?0:Math.max(0,10000-k.units)),0);note.textContent=`Sisa quota estimasi: ${remaining.toLocaleString('id-ID')} unit. Berdasarkan pemakaian key di aplikasi; kuota aktual dibagi per proyek Google Cloud. Reset tengah malam Pasifik. Upload OAuth tercatat pada proyek OAuth, terpisah dari key ini.`;host.append(note);
  const link=document.createElement('a');link.href='/pengaturan?tab=google-api';link.textContent='Kelola API Keys →';host.append(link);host.hidden=false;
 }catch{host.textContent='Pemakaian YouTube key belum dapat dimuat.';host.hidden=false;}
}
window.addEventListener('focus',refresh);window.addEventListener('storage',refresh);refresh();
