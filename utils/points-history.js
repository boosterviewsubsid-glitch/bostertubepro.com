(() => {
 const root=document.getElementById('pointsHistory');
 if(!root)return;
 let loading=false;
 async function refresh(){
  if(loading)return;
  if(!btpSession()){root.textContent='Login untuk melihat Riwayat Poin.';return;}
  loading=true;
  try{
   const response=await btpApi('/api/billing');const data=await response.json();
   if(!response.ok)throw Error(data.error||'Riwayat belum tersedia');
   root.replaceChildren();
   if(!data.history.length)root.textContent='Belum ada transaksi poin.';
   for(const entry of data.history){
    const row=document.createElement('p');
    const amount=entry.kind==='release'?`−${Math.abs(entry.cost)} escrow (saldo tidak dipotong lagi)`:entry.cost<0?`+${Math.abs(entry.cost)} Poin`:`−${entry.cost} Poin`;
    row.textContent=`${new Date(entry.created_at).toLocaleString('id-ID')} · ${entry.action} · ${amount}`;
    if(entry.refunded_at){const refund=document.createElement('strong');refund.textContent=' · Refund - Generate Gagal';refund.style.color='#16804a';row.append(refund);}
    if(entry.kind==='manual_add'){row.title=entry.action;const badge=document.createElement('strong');badge.textContent=' · Sukses';badge.style.color='#16804a';row.append(badge);}root.append(row);
   }
  }catch(error){root.textContent=error.message;}finally{loading=false;}
 }
 refresh();addEventListener('credits-updated',refresh);addEventListener('focus',refresh);addEventListener('storage',event=>{if(event.key==='boster_poin'||event.key==='btp_session')refresh();});
})();
