(async()=>{
 const {COSTS}=await import('/utils/pointsConfig.js');
 // 3 tombol Analytics AI (poin) tampil di tab Audit Video; tab Analytics khusus data REAL API tanpa AI.
 const analytics=location.pathname.startsWith('/audit')&&!location.pathname.startsWith('/audit-');
 const items=analytics?[['deep','Analisa mendalam','analytics_deep'],['bestTime','Analisa waktu tayang','analytics_bestTime'],['keyword','Generate keyword','analytics_keyword']]:[['analyzeChannel','Bedah channel','dashboard_analyzeChannel'],['competitorVideo','Riset video','dashboard_competitorVideo'],['contentIdea','Generate ide konten','dashboard_contentIdea']];
 const section=document.createElement('section');section.id=analytics?'analyticsAI':'bedahRisetAI';section.style.cssText='scroll-margin-top:72px;margin:0 0 16px;padding:16px;border:1px solid #78977a;border-radius:16px;background:var(--card-bg,#f4f7f2);color:var(--text,#23372b)';
 // Analytics: kartu hijau muda, 3 tombol 1 baris di desktop, stack full width di HP.
 if(analytics){section.className='btp-ai-card';section.style.cssText='';const css=document.createElement('style');css.textContent='.btp-ai-card{scroll-margin-top:72px;margin:0 0 20px;padding:16px;border:1px solid #86EFAC;border-radius:16px;background:#F0FDF4;color:#14532D}.btp-ai-card .btp-ai-actions{display:flex;gap:8px;margin-top:8px}.btp-ai-card .btp-ai-actions button{flex:1 1 0;min-height:44px;padding:10px 14px;border:1px solid #22C55E;border-radius:12px;background:#fff;color:#14532D;font-weight:700;cursor:pointer}.btp-ai-card .btp-ai-actions button:disabled{opacity:.6;cursor:wait}.btp-ai-card [role=status]{margin-top:10px}.btp-ai-card [role=status]:empty{display:none}@media (max-width:767px){.btp-ai-card .btp-ai-actions{flex-direction:column}.btp-ai-card .btp-ai-actions button{width:100%}}html.dark .btp-ai-card{background:rgba(34,197,94,.08);border-color:rgba(34,197,94,.4);color:#DCFCE7}html.dark .btp-ai-card .btp-ai-actions button{background:#1f2937;color:#DCFCE7;border-color:rgba(34,197,94,.5)}';document.head.append(css);}
 const title=document.createElement('h2');title.style.cssText='margin:0 0 4px;font-size:16px;font-weight:800';title.textContent=analytics?'Analytics AI':'Bedah & Riset AI';section.append(title);
 const output=document.createElement('p');output.style.whiteSpace='pre-wrap';output.setAttribute('role','status');
 const actions=analytics?document.createElement('div'):section;if(analytics){actions.className='btp-ai-actions';section.append(actions);}
 items.forEach(([action,label,key])=>{const button=document.createElement('button');button.type='button';button.textContent=label+' · '+COSTS[key]+' poin';if(!analytics)button.style.cssText='margin:8px 8px 0 0;min-height:44px;padding:10px 14px;border:1px solid #78977a;border-radius:12px;background:#fff;font-weight:700;cursor:pointer';button.onclick=async()=>{section.querySelectorAll('button').forEach(b=>b.disabled=true);output.textContent='Memproses AI…';try{const r=await fetch('/api/analytics-ai',{method:'POST',headers:{'Content-Type':'application/json','x-btp-session':localStorage.getItem('btp_session')||''},body:JSON.stringify({action})});const d=await r.json();if(!r.ok)throw Error(d.error);output.textContent=d.text;}catch(e){if(window.BTPApiStatus?.isSoftError(e))return;output.textContent=e.message;}finally{section.querySelectorAll('button').forEach(b=>b.disabled=false);}};actions.append(button);});
 section.append(output);
 // Dashboard: tepat di bawah banner poin (paling atas), bukan di bawah footer.
 const banner=!analytics&&document.getElementById('pointsBanner');
 // Audit Video: tepat di bawah status bar, di atas kartu ringkasan audit.
 const auditAnchor=analytics&&document.getElementById('statusBar');
 if(banner)banner.after(section);else if(auditAnchor)auditAnchor.after(section);else (document.querySelector('main')||document.body).append(section);
 if(location.hash==='#'+section.id)section.scrollIntoView();
})();
