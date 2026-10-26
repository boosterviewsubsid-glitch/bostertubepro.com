/* Auth guard halaman member (Dashboard, Analytics, Audit, Promosi, Tugas Iklan, Kompetitor, Billing).
   Wajib dimuat PALING ATAS di <head>, sebelum script lain: tanpa sesi login (localStorage "btp_session")
   halaman disembunyikan dan langsung diarahkan ke /login?next=..., jadi data poin/akun tidak pernah tampil.
   Pengecualian: hasil login dari youtube-callback (/#pengaturan?youtube_connected=...) diproses dulu oleh btp-auth.js. */
(function () {
  if (/[?&](youtube_connected|youtube_error)=/.test(location.hash)) return;
  var isAuthenticated = function () { try { return !!localStorage.getItem("btp_session"); } catch (e) { return false; } };
  var redirected = false;
  var toLogin = function () {
    if (redirected) return;
    redirected = true;
    document.documentElement.style.display = "none";
    location.replace("/login?next=" + encodeURIComponent(location.pathname + location.search));
  };
  if (!isAuthenticated()) return toLogin();
  // Logout / sesi habis (401) di tab ini atau tab lain: tinggalkan halaman member
  window.addEventListener("storage", function (e) { if ((e.key === "btp_session" || e.key === null) && !isAuthenticated()) toLogin(); });
  window.addEventListener("credits-updated", function () { if (!isAuthenticated()) toLogin(); });
  window.addEventListener("pageshow", function (e) { if (e.persisted && !isAuthenticated()) toLogin(); });
})();
