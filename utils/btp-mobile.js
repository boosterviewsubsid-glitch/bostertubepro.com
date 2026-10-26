/* Sidebar mobile (< md / 768px): sidebar jadi drawer, dibuka lewat tombol ☰ di header kiri atas,
   dengan overlay hitam 50%. Di desktop sidebar tetap tampil (md:translate-x-0). Hanya layout, tanpa logic API. */
(function () {
  let sidebarOpen = false;
  function init() {
    const aside = document.getElementById("btpSidebar");
    const main = document.querySelector("main");
    if (!aside || !main) return;

    const overlay = document.createElement("div");
    overlay.className = "fixed inset-0 z-40 bg-black/50 hidden md:hidden";
    document.body.appendChild(overlay);

    const bar = document.createElement("div");
    bar.className = "btp-mobilebar md:hidden sticky top-0 z-30 -mx-3 -mt-3 mb-3 flex items-center gap-3 px-3 py-2.5 bg-[#121214] text-white";
    bar.innerHTML = `<button type="button" aria-label="Buka menu" aria-controls="btpSidebar" aria-expanded="false" class="w-9 h-9 rounded-lg bg-[#1E1E24] text-[18px] leading-none flex items-center justify-center shrink-0">☰</button><img src="/b-logo.png" width="28" height="28" alt="Logo B merah BosterTubePro" class="w-7 h-7 rounded-lg object-contain shrink-0"><span class="font-bold text-[14px] truncate">BosterTubePro</span>`;
    main.prepend(bar);
    const btn = bar.querySelector("button");

    const setSidebarOpen = (open) => {
      sidebarOpen = open;
      aside.classList.toggle("-translate-x-full", !open);
      overlay.classList.toggle("hidden", !open);
      btn.setAttribute("aria-expanded", String(open));
      btn.textContent = open ? "✕" : "☰";
      document.body.style.overflow = open ? "hidden" : "";
    };
    btn.addEventListener("click", () => setSidebarOpen(!sidebarOpen));
    overlay.addEventListener("click", () => setSidebarOpen(false));
    aside.addEventListener("click", (e) => { if (e.target.closest("a,button")) setSidebarOpen(false); });
    document.addEventListener("keydown", (e) => { if (e.key === "Escape" && sidebarOpen) setSidebarOpen(false); });
    window.matchMedia("(min-width: 768px)").addEventListener("change", (e) => { if (e.matches && sidebarOpen) setSidebarOpen(false); });
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
