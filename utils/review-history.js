(() => {
 const el=id=>document.getElementById(id), owner=document.body.dataset.view==='owner';
 let page=1, requestId=0;
 const task=new URLSearchParams(location.search).get('task');
 const node=(tag,text)=>{const n=document.createElement(tag);if(text!==undefined)n.textContent=text;return n;};
 const api=async path=>{const response=await btpApi(path);const data=await response.json();if(!response.ok)throw Error(data.error||'Gagal memuat feedback.');return data;};
 function videoCell(item){const td=node('td');const img=document.createElement('img');img.src=`https://i.ytimg.com/vi/${encodeURIComponent(item.video_id)}/hqdefault.jpg`;img.alt=`Thumbnail ${item.title}`;img.width=144;img.height=81;img.loading='lazy';td.append(img,node('strong',item.title));return td;}
 function renderReviews(data){
  el('records').replaceChildren();
  if(owner){
   el('title').textContent=data.task.title;
   el('summary').textContent=`${data.summary.total} feedback · Rating rata-rata ${data.summary.average_rating || '—'}/5 · ${data.summary.thumbnail_needs_work} orang menilai thumbnail belum menarik.`;
   el('description').textContent='Baca masukan asli di bawah untuk memahami bagian judul dan thumbnail yang perlu diperbaiki. Feedback ini tersimpan di BosterTubePro.';
  }else el('summary').textContent=`${data.total} review tersimpan · Halaman ${page}`;
  if(!data.reviews.length){el('records').append(node('p',owner?'Belum ada feedback untuk iklan ini. Feedback muncul setelah reviewer menyelesaikan review.':'Belum ada review. Kerjakan review di halaman Tugas untuk menyimpan masukan dan menerima poin.'));return;}
  const wrap=node('div');wrap.className='table-wrap';const table=node('table');const head=node('thead'),hr=node('tr');
  for(const label of owner?['Rating','Thumbnail menarik?','Feedback jujur','Tanggal (WIB)']:['Video','Rating','Feedback kamu','Tanggal (WIB)','Poin diterima'])hr.append(node('th',label));head.append(hr);table.append(head);
  const body=node('tbody');
  for(const item of data.reviews){const row=node('tr');if(!owner)row.append(videoCell(item));row.append(node('td',item.rating?`${item.rating}/5`:'Belum tercatat'));if(owner)row.append(node('td',item.thumbnailMenarik?'Ya':'Tidak'));const feedback=node('td',item.feedback);feedback.className='feedback-text';row.append(feedback,node('td',new Date(item.created_at).toLocaleString('id-ID',{timeZone:'Asia/Jakarta'})));if(!owner){const reward=node('td',`+${Number(item.reward).toLocaleString('id-ID')} Poin`);reward.className='earned';row.append(reward);}body.append(row);}
  table.append(body);wrap.append(table);el('records').append(wrap);
 }
 async function load(){
  const current=++requestId,session=btpSession();el('records').replaceChildren();el('summary').textContent='';el('pagination').hidden=true;el('refresh').disabled=true;el('status').textContent='Memuat feedback…';
  try{
   if(!session)throw Error('Login Google melalui Pengaturan untuk melihat review kamu.');
   if(owner&&!task){
    const data=await api('/api/task-ads');if(current!==requestId||session!==btpSession())return;
    el('title').textContent='Feedback iklan saya';el('summary').textContent=`${data.own.length} iklan`;el('records').replaceChildren();
    if(!data.own.length)el('records').append(node('p','Belum ada iklan. Pasang iklan untuk mendapatkan feedback dari kreator lain.'));
    for(const ad of data.own){const card=node('article');card.append(node('h2',ad.title));const link=node('a',`Lihat ${ad.feedback_count || 0} Feedback →`);link.href=`/iklan-saya/feedback?task=${ad.id}`;card.append(link);el('records').append(card);}
   }else{
    if(owner&&!/^\d{1,18}$/.test(task))throw Error('ID iklan tidak valid.');
    const data=await api(owner?`/api/tasks/${task}/feedbacks?page=${page}`:`/api/my-reviews?page=${page}`);if(current!==requestId||session!==btpSession())return;
    renderReviews(data);el('pagination').hidden=false;el('previous').disabled=page===1;el('next').disabled=!data.hasMore;el('page').textContent=`Halaman ${page}`;
   }
   el('status').textContent='';
  }catch(error){if(current===requestId)el('status').textContent=error.message;}
  finally{if(current===requestId)el('refresh').disabled=false;}
 }
 el('previous').onclick=()=>{if(page>1){page--;load();}};el('next').onclick=()=>{page++;load();};el('refresh').onclick=load;
 addEventListener('credits-updated',()=>{if(!btpSession()){++requestId;el('records').replaceChildren();el('summary').textContent='';el('pagination').hidden=true;el('status').textContent='Login untuk melihat feedback.';el('refresh').disabled=false;}});
 load();
})();
