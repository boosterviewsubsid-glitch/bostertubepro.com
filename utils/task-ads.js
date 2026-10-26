(() => {
 const el=id=>document.getElementById(id), fmt=n=>Number(n).toLocaleString('id-ID');
 let balance=0, page=0, feed=[], installing=false, isAdmin=false;
 const api=async body=>{const response=await btpApi('/api/task-ads',body?{method:'POST',body:JSON.stringify(body)}:{});const data=await response.json();if(!response.ok)throw Error(data.error||'Gagal memuat iklan');return data;};
 function updateLoginWarning(){
  const warning=el('loginWarning');
  if(!warning)return;
  let user=null;
  try{user=JSON.parse(localStorage.getItem('bostertube_user'));}catch{}
  const sudahLogin=!!user?.youtubeAccount || (!!btpSession() && localStorage.getItem('btp_yt_connected')==='true');
  warning.style.display=sudahLogin?'none':'block';
 }
 async function refresh(){
  updateLoginWarning();
  isAdmin=false;el('listTugas')?.replaceChildren();
  if(!btpSession()){if(el('taskMessage'))el('taskMessage').textContent='Login dan hubungkan channel di Pengaturan untuk melihat tugas.';document.querySelectorAll('[data-task-count]').forEach(n=>n.textContent='0 tugas');return;}
  try{
   const session=btpSession();
   const data=el('listTugas')?await api():await (async()=>{const response=await btpApi('/api/my-tasks');const result=await response.json();if(!response.ok)throw Error(result.error||'Gagal memuat promosi');return {...result,tasks:[]};})();
   if(session!==btpSession())return;
   isAdmin=!!data.is_admin; balance=Number(data.btp_poin); updateBalance(); dispatchEvent(new Event('review-budget-update'));
   if(el('agencyFields')){el('agencyFields').disabled=!data.canAdvertise;el('agencyLock').hidden=!!data.canAdvertise;}
   document.querySelectorAll('[data-task-count]').forEach(n=>n.textContent=`${data.tasks.length} tugas`);
   if(el('listTugas')){
    el('taskMessage').textContent=data.tasks.length?'Pilih tugas untuk mulai memberi feedback.':'Belum ada tugas yang tersedia untuk kamu. Cek lagi nanti.';
    feed=[...data.tasks]; page=0;
    // Fisher–Yates: each reload creates a fresh order. New tasks receive a second
    // candidate for the first page, then IDs are deduplicated across all pages.
    const shuffle=items=>{for(let i=items.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[items[i],items[j]]=[items[j],items[i]];}return items;};
    const candidates=shuffle([...feed,...feed.filter(a=>(a.reviews-a.remaining)/a.reviews<.2)]);
    feed=[...new Map(candidates.map(a=>[a.id,a])).values()];
    const linkedTask=new URLSearchParams(location.search).get('task');if(linkedTask)feed.sort((a,b)=>Number(String(b.id)===linkedTask)-Number(String(a.id)===linkedTask));
    renderFeed(data.eligible);
   }
   if(el('ownAds')){
    renderOwnAds(data.own);
   }
  }catch(e){if(el('taskMessage'))el('taskMessage').textContent=e.message+' Muat ulang untuk mencoba lagi.';if(el('iklanMessage'))el('iklanMessage').textContent=e.message;if(el('ownAds')){el('ownAds').textContent=e.message+' ';const retry=document.createElement('button');retry.textContent='Muat ulang';retry.onclick=refresh;el('ownAds').append(retry);}}
 }
 function promotionState(ad){return ad.compliance_blocked?'blocked':Number(ad.total_done??ad.reviews-ad.remaining)>=Number(ad.reviews)?'completed':Number(ad.escrow??ad.remaining*(ad.price??ad.reward))<=0?'exhausted':'active';}
 function renderOwnAds(ads){
  const root=el('ownAds'),history=el('completedAds');root.replaceChildren();history?.replaceChildren();root.classList.add('owner-promotion-list');
  if(!ads.length)root.textContent='Belum ada iklan promosi milik kamu.';
  const render=(ad,target)=>{
   const state=promotionState(ad),row=document.createElement('article');row.className='owner-promotion';
   const image=document.createElement('img');image.src=`https://i.ytimg.com/vi/${encodeURIComponent(ad.video_id)}/hqdefault.jpg`;image.alt=ad.title;image.loading='lazy';
   const info=document.createElement('div'),title=document.createElement('h3');title.textContent=ad.title;
   const budget=document.createElement('p');budget.textContent=`Budget Poin: ${fmt(ad.reviews*(ad.price??ad.reward))} · Terpakai: ${fmt((ad.total_done??ad.reviews-ad.remaining)*(ad.price??ad.reward))} Poin · Sisa: ${fmt(ad.escrow??ad.remaining*(ad.price??ad.reward))} Poin`;
   const progress=document.createElement('p');progress.textContent=`Progress: ${ad.total_done??ad.reviews-ad.remaining}/${ad.reviews} review`;
   const badge=document.createElement('span');badge.className=`promotion-status ${state}`;badge.textContent={active:'Aktif - Berjalan',completed:'Promosi Selesai ✓',exhausted:'Budget Habis',blocked:'Diblokir'}[state];
   info.append(title,budget,progress,badge);
   const actions=document.createElement('div');actions.className='promotion-owner-actions';const remove=document.createElement('button');remove.type='button';remove.className='moderation-action';remove.textContent=state==='active'?'Hentikan & Hapus':'Hapus dari Daftar';remove.onclick=()=>ownerDeleteDialog(ad);
   const feedback=document.createElement('a');feedback.href=`/iklan-saya/feedback?task=${ad.id}`;feedback.textContent=`Lihat Feedback (${fmt(ad.feedback_count||0)})`;actions.append(remove,feedback);row.append(image,info,actions);target.append(row);
  };
  ads.forEach(ad=>render(ad,root));
  const completed=ads.filter(ad=>promotionState(ad)==='completed');if(history){if(!completed.length)history.textContent='Belum ada promosi selesai.';completed.forEach(ad=>render(ad,history));}
 }
 function ownerDeleteDialog(ad){
  const dialog=document.createElement('dialog');dialog.className='review-install-dialog';dialog.setAttribute('aria-label','Konfirmasi hapus promosi');
  const title=document.createElement('h2');title.textContent=`Yakin hapus promosi “${ad.title}” dari daftar?`;
  const note=document.createElement('p');const refund=ad.compliance_blocked?0:Number(ad.escrow??ad.remaining*(ad.price??ad.reward));note.textContent=`Sisa ${fmt(refund)} Poin yang belum terpakai akan dikembalikan ke saldo pemilik. Saldo Kamu: ${fmt(balance)} Poin. Catatan disimpan setidaknya 30 hari untuk audit.`;
  const status=document.createElement('p');status.setAttribute('role','status');const cancel=document.createElement('button');cancel.type='button';cancel.textContent='Batal';cancel.onclick=()=>dialog.close();const confirm=document.createElement('button');confirm.type='button';confirm.textContent='Ya, Hapus';
  confirm.onclick=async()=>{confirm.disabled=true;cancel.disabled=true;status.textContent='Menghapus…';try{const response=await btpApi(`/api/tasks/${ad.id}`,{method:'DELETE'});const data=await response.json();if(!response.ok)throw Error(data.error||'Gagal menghapus promosi');balance=Number(data.btp_poin);localStorage.setItem('boster_poin',String(balance));dispatchEvent(new Event('credits-updated'));dialog.close();dispatchEvent(new CustomEvent('points-notice',{detail:`Promosi dihapus, ${fmt(data.refund)} Poin dikembalikan ke pemilik. Saldo Kamu: ${fmt(balance)} Poin`}));dispatchEvent(new Event('task-ads-updated'));}catch(error){status.textContent=error.message;}finally{confirm.disabled=false;cancel.disabled=false;}};
  dialog.append(title,note,status,cancel,confirm);dialog.onclose=()=>dialog.remove();document.body.append(dialog);dialog.showModal();
 }
 function updateBalance(){if(el('taskBalance'))el('taskBalance').textContent=`Saldo Poin Kamu: ${fmt(balance)}`;}
 function renderFeed(eligible){
  const root=el('listTugas');root.replaceChildren();
  feed.slice(page*10,page*10+10).forEach(ad=>{
   const card=document.createElement('article');card.className='tugas-card';
   const image=document.createElement('img');image.src=`https://i.ytimg.com/vi/${ad.video_id}/hqdefault.jpg`;image.alt='Thumbnail video';image.loading='lazy';image.style.cssText='width:100%;aspect-ratio:16/9;object-fit:cover;border-radius:10px';
   const title=document.createElement('h3');title.textContent=ad.title;
   const meta=document.createElement('p');meta.textContent=`Kreator Anonim · ${ad.reward} Poin → Masuk Saldo`;
   const progress=document.createElement('p');progress.textContent=`${ad.reviews-ad.remaining}/${ad.reviews} review selesai`;
   const button=document.createElement('button');button.type='button';button.textContent='Kerjakan Review';button.disabled=!eligible;
   button.onclick=()=>document.dispatchEvent(new CustomEvent('task-ad-start',{detail:{adId:ad.id}}));
   card.dataset.taskId=ad.id;card.append(image,title,meta,progress,button);if(isAdmin)card.append(actionButton('Laporkan',ad,'report'),actionButton('Hapus Iklan',ad,'delete'));root.append(card);
  });
  let nav=el('taskPagination');if(!nav){nav=document.createElement('nav');nav.id='taskPagination';nav.setAttribute('aria-label','Halaman tugas');root.after(nav);}nav.replaceChildren();
  for(const [label,next] of [['← Sebelumnya',page-1],['Berikutnya →',page+1]]){const button=document.createElement('button');button.textContent=label;button.disabled=next<0||next*10>=feed.length;button.onclick=()=>{page=next;renderFeed(eligible);};nav.append(button);}
 }
 function actionButton(label,ad,action){const b=document.createElement('button');b.type='button';b.className='moderation-action';b.textContent=label;b.onclick=()=>moderationDialog(ad,action);return b;}
 function moderationDialog(ad,action){
  if(!isAdmin)return;
  const dialog=document.createElement('dialog');dialog.className='review-install-dialog';dialog.setAttribute('aria-label',action==='delete'?'Hapus iklan':'Laporkan iklan');
  const heading=document.createElement('h2');heading.textContent=action==='delete'?'Hapus iklan':'Laporkan konten';
  const title=document.createElement('p');title.textContent=ad.title;
  const note=document.createElement('p');note.textContent=action==='delete'?`Sisa escrow ${fmt(ad.escrow??ad.remaining*(ad.price??ad.reward))} Poin dikembalikan jika iklan tidak diblokir. Pornografi/Judi: 0% refund, poin hangus. Penghapusan tidak dapat dibatalkan.`:'Laporan dikirim ke admin untuk diperiksa. Laporan tidak langsung menghapus iklan.';
  const form=document.createElement('form');const label=document.createElement('label');label.textContent='Alasan ';
  const reason=document.createElement('select');for(const text of ['Salah upload','Pornografi','Judi','Lainnya']){const option=document.createElement('option');option.textContent=text;reason.append(option);}label.append(reason);
  const detailLabel=document.createElement('label');detailLabel.textContent='Keterangan ';const details=document.createElement('textarea');details.required=true;details.minLength=3;details.maxLength=2000;detailLabel.append(details);
  const status=document.createElement('p');status.setAttribute('role','status');const submit=document.createElement('button');submit.type='submit';submit.textContent=action==='delete'?'Konfirmasi hapus':'Kirim laporan';
  const cancel=document.createElement('button');cancel.type='button';cancel.textContent='Batal';cancel.onclick=()=>dialog.close();
  form.append(label,detailLabel,status,submit,cancel);dialog.append(heading,title,note,form);document.body.append(dialog);dialog.onclose=()=>dialog.remove();dialog.showModal();
  form.onsubmit=async event=>{event.preventDefault();submit.disabled=true;cancel.disabled=true;status.textContent='Memproses…';try{
   const response=await btpApi(`/api/tasks/${ad.id}/${action}`,{method:'POST',body:JSON.stringify({reason:reason.value,details:details.value})});const data=await response.json();if(!response.ok)throw Error(data.error||'Gagal memproses');
   if(typeof data.btp_poin==='number'){localStorage.setItem('boster_poin',String(data.btp_poin));dispatchEvent(new Event('credits-updated'));}
   dialog.close();dispatchEvent(new CustomEvent('points-notice',{detail:action==='delete'?`Iklan dihapus. Refund ${fmt(data.refund)} Poin. Notifikasi masuk antrean email.`:'Laporan tersimpan. Notifikasi masuk antrean email admin.'}));dispatchEvent(new Event('task-ads-updated'));
  }catch(error){status.textContent=error.message;}finally{submit.disabled=false;cancel.disabled=false;}};
 }
 function init(){
  const workspace=el('formIklan')||el('listTugas');
  if(!workspace||workspace.dataset.initialized)return;
  workspace.dataset.initialized='true';
  if(el('formIklan')){

   el('openReviewInstall').onclick=()=>{el('reviewInstallDialog').showModal();update();};
   el('closeReviewInstall').onclick=()=>el('reviewInstallDialog').close();
   const price=5;
   const update=()=>{const total=price*Number(el('budgetIklan').value);el('saldoReview').textContent=`Saldo: ${fmt(balance)} Poin${!isAdmin&&balance<total?' · Saldo kurang':''}`;el('btnPasangIklan').disabled=installing||(!isAdmin&&balance<total);el('iklanTotal').textContent=`${fmt(total)} Poin`;};
   addEventListener('review-budget-update',update);
   el('budgetIklan').onchange=update;
   el('formIklan').onsubmit=async event=>{event.preventDefault();if(installing||el('agencyFields')?.disabled)return;if(!el('linkIklan').value){el('iklanMessage').textContent='Cari video melalui pencarian di atas terlebih dahulu.';return;}const button=el('btnPasangIklan');installing=true;button.disabled=true;el('iklanMessage').textContent='Memvalidasi video dan mengunci budget…';try{const data=await api({link:el('linkIklan').value,title:el('judulIklan').value,taskType:el('jenisTugas').value,complianceAccepted:el('taskCompliance').checked,description:el('deskripsiIklan').value,package:'hemat',reviews:el('budgetIklan').value});balance=Number(data.btp_poin);localStorage.setItem('boster_poin',String(data.btp_poin));dispatchEvent(new Event('credits-updated'));const link=el('linkIklan').value;el('formIklan').reset();el('linkIklan').value=link;update();el('iklanMessage').textContent=`Tugas dipasang! ${fmt(data.escrow)} Poin ditahan untuk reviewer`;dispatchEvent(new CustomEvent('points-notice',{detail:el('iklanMessage').textContent})); await refresh();}catch(e){el('iklanMessage').textContent=e.message;}finally{installing=false;update();}};
  }
  refresh();
 }
 addEventListener('credits-updated',()=>{balance=Number(localStorage.getItem('boster_poin')||balance);updateBalance();dispatchEvent(new Event('review-budget-update'));});
 addEventListener('focus',()=>{if(el('taskBalance')||el('ownAds'))refresh();});
 setInterval(async()=>{if(!el('taskBalance')||document.hidden||!btpSession())return;try{const response=await btpApi('/api/billing');if(response.ok){const data=await response.json();balance=Number(data.userPoints);updateBalance();}}catch{}},30000);
 addEventListener('points-notice',event=>{document.getElementById('pointsToast')?.remove();const toast=document.createElement('div');toast.id='pointsToast';toast.setAttribute('role','status');toast.textContent=event.detail;(document.querySelector('dialog[open]')||document.body).append(toast);setTimeout(()=>toast.remove(),8000);});
 addEventListener('storage',event=>{updateLoginWarning();if(event.key==='boster_poin'&&btpSession()){balance=Number(event.newValue||0);updateBalance();dispatchEvent(new Event('review-budget-update'));}});
 addEventListener('credits-updated',updateLoginWarning);
 addEventListener('task-ads-updated',refresh);
 addEventListener('credits-updated',()=>{if(!btpSession()){if(el('agencyFields')){el('agencyFields').disabled=true;el('agencyLock').hidden=false;}el('listTugas')?.replaceChildren();el('ownAds')?.replaceChildren();el('completedAds')?.replaceChildren();document.querySelectorAll('[data-task-count]').forEach(n=>n.textContent='0 tugas');}});
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
