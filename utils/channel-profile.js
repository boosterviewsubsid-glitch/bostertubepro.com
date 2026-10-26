(() => {
 const form=document.getElementById('channel-profile');
 if(!form)return;
 const status=document.getElementById('profile-status');
 const permissions=document.createElement('p');permissions.setAttribute('role','status');
 permissions.textContent='Memeriksa izin upload dan kelola video YouTube…';form.before(permissions);
 const reconnect=document.createElement('a');reconnect.href='/api/auth/youtube';reconnect.textContent='Hubungkan ulang YouTube';reconnect.hidden=true;permissions.after(reconnect);
 fetch('/api/youtube-permissions',{headers:{'x-btp-session':localStorage.getItem('btp_session')||''}}).then(async response=>{const data=await response.json();if(!response.ok)throw Error(data.error);permissions.textContent='✅ Izin upload dan kelola video YouTube tersedia.';}).catch(error=>{permissions.textContent=error.message;reconnect.hidden=false;});

 const request=async(body)=>{
  const response=await fetch('/api/channel-profile',{method:body?'POST':'GET',headers:{'Content-Type':'application/json','x-btp-session':localStorage.getItem('btp_session')||''},...(body?{body:JSON.stringify(body)}:{})});
  const data=await response.json();if(!response.ok)throw Error(data.error);return data;
 };
 request().then(data=>['whatsapp','facebook','instagram'].forEach(key=>form.elements[key].value=data[key]||'')).catch(e=>status.textContent=e.message);
 form.addEventListener('submit',async event=>{
  event.preventDefault();const button=form.querySelector('button');button.disabled=true;status.textContent='Menyimpan…';
  try{await request(Object.fromEntries(new FormData(form)));status.textContent='Link Profil Channel tersimpan. Generate ulang deskripsi di Upload untuk memasukkan link terbaru.';}catch(e){status.textContent=e.message;}finally{button.disabled=false;}
 });
})();
