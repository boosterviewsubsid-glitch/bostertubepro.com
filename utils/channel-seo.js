(() => {
 class ChannelSEO extends HTMLElement {
  connectedCallback(){
   this.innerHTML='<section style="margin:20px 0;padding:24px;border:1px solid #cbd5df;border-radius:18px;background:#fff;color:#23354d"><a href="/audit-channel" style="font-weight:800;letter-spacing:.08em">AUDIT CHANNEL</a><div style="display:flex;align-items:center;gap:20px;margin:20px 0"><svg width="96" height="96" viewBox="0 0 100 100" aria-label="Progress SEO channel"><circle cx="50" cy="50" r="42" fill="none" stroke="#e4e9ef" stroke-width="8"/><circle data-ring cx="50" cy="50" r="42" fill="none" stroke="#217c71" stroke-width="8" stroke-dasharray="264" stroke-dashoffset="264" transform="rotate(-90 50 50)"/><text data-score x="50" y="55" text-anchor="middle" font-size="20" fill="currentColor">—</text></svg><p data-summary role="status">Memuat SEO channel…</p></div><div data-checks></div><button data-analyze style="margin-top:18px;padding:12px 18px;background:#217c71;color:white;border:0;border-radius:10px;cursor:pointer">Perbaiki Sekarang · Saran AI</button><p data-note style="font-size:12px;margin-top:12px"></p><p data-error role="alert"></p><div data-advice style="white-space:pre-wrap;line-height:1.8;margin-top:20px"></div></section>';
   this.querySelector('[data-analyze]').onclick=()=>this.load(true);this.load(false);
  }
  async load(analyze){
   const button=this.querySelector('button');button.disabled=true;this.querySelector('[data-error]').textContent='';
   try{
    const session=localStorage.getItem('btp_session');if(!session)throw Error('Hubungkan channel YouTube di Pengaturan untuk melihat skor SEO.');
    if(analyze)this.querySelector('[data-advice]').textContent='Menganalisis channel dengan Gemini…';
    const r=await fetch('/api/channel-seo',{method:analyze?'POST':'GET',headers:{'x-btp-session':session},cache:'no-store'});
    const d=await r.json();if(!r.ok)throw Error(d.error);
    this.querySelector('[data-score]').textContent=d.score+'%';this.querySelector('[data-ring]').setAttribute('stroke-dashoffset',String(264*(1-d.score/100)));
    this.querySelector('[data-summary]').textContent=`SEO Channel: ${d.score}% — ${d.needs.length?'Perlu Perbaikan di '+d.needs.join(', '):'Semua komponen tersedia'}`;
    const list=this.querySelector('[data-checks]');list.replaceChildren();for(const c of d.checks){const p=document.createElement('p');p.textContent=`${c.done?'✓':'○'} ${c.name} (${c.weight}%)`;p.style.margin='8px 0';list.append(p);}
    this.querySelector('[data-note]').textContent=d.note;this.querySelector('[data-advice]').textContent=d.advice||'';
   }catch(e){this.querySelector('[data-error]').textContent=e.message;if(analyze)this.querySelector('[data-advice]').textContent='';else this.querySelector('[data-summary]').textContent='Skor belum tersedia';}finally{button.disabled=false;}
  }
 }
 customElements.define('channel-seo',ChannelSEO);
})();
