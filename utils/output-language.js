// Shared browser preference for Audit, Upload and channel settings.
(function () {
 const options = [['id','🇮🇩 Indonesia (Default)'],['ms','🇲🇾 Melayu Malaysia'],['en','🇺🇸 English'],['id-en','🇮🇩 + 🇺🇸 Bilingual ID-EN']];
 const valid = value => options.some(([code]) => code === value) ? value : 'id';
 const get = () => { try { return valid(localStorage.getItem('boster_language')); } catch { return 'id'; } };
 const set = value => { value=valid(value); try { localStorage.setItem('boster_language',value); } catch {} window.dispatchEvent(new CustomEvent('boster-language',{detail:value})); };
 const badge = value => ({id:'[ID]',ms:'[MS]',en:'[EN]','id-en':'[ID] [EN]'}[valid(value)]);
 const card = (label='🌐 Bahasa Output:') => `<div class="mb-4 rounded-xl border border-purple-200 p-3"><label class="flex flex-wrap items-center gap-3"><span>${label}</span><select data-output-language aria-label="${label}" class="rounded-lg border border-purple-300 bg-transparent p-2">${options.map(([code,name])=>`<option value="${code}" ${code===get()?'selected':''}>${name}</option>`).join('')}</select><span class="text-xs text-gray-500">AI akan generate judul/deskripsi/tag sesuai bahasa ini (2 Poin)</span></label></div>`;
 document.addEventListener('change',event=>{if(event.target.matches('[data-output-language]'))set(event.target.value);});
 window.addEventListener('boster-language',()=>document.querySelectorAll('[data-output-language]').forEach(el=>el.value=get()));
 window.addEventListener('storage',event=>{if(event.key==='boster_language')window.dispatchEvent(new CustomEvent('boster-language',{detail:get()}));});
 window.BosterLanguage={options,get,set,badge,card};
})();
