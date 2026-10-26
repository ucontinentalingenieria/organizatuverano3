/* Pantalla de carga · se muestra hasta que la página termina de cargar (máx. 4 s). */
(function () {
  if (window.__ucCargador) return; window.__ucCargador = true;
  var css = document.createElement('style');
  css.textContent =
    '#uc-carga{position:fixed;inset:0;z-index:200000;background:#5A00AA;color:#fff;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:22px;font-family:"DM Sans",system-ui,sans-serif;transition:opacity .45s ease,visibility .45s}' +
    '#uc-carga.fin{opacity:0;visibility:hidden}' +
    '#uc-carga .marca{display:flex;flex-direction:column;align-items:center;gap:6px;animation:ucCSube .6s cubic-bezier(.2,.7,.2,1) both}' +
    '#uc-carga .sol{width:64px;height:64px;border-radius:20px;background:#B9E1FF;color:#5A00AA;display:flex;align-items:center;justify-content:center;animation:ucCLate 1.4s ease-in-out infinite}' +
    '#uc-carga b{font:700 19px/1.2 Sora,"DM Sans",sans-serif;letter-spacing:.01em}' +
    '#uc-carga small{font-size:12px;font-weight:700;letter-spacing:.1em;color:#B9E1FF}' +
    '#uc-carga .pista{width:180px;height:4px;border-radius:99px;background:rgba(255,255,255,.18);overflow:hidden}' +
    '#uc-carga .pista i{display:block;width:40%;height:100%;border-radius:99px;background:#B9E1FF;animation:ucCBarra 1.1s cubic-bezier(.4,0,.2,1) infinite}' +
    '#uc-carga p{margin:0;font-size:14px;color:#E6D9F5}' +
    '@keyframes ucCBarra{0%{transform:translateX(-110%)}100%{transform:translateX(260%)}}' +
    '@keyframes ucCLate{0%,100%{transform:scale(1)}50%{transform:scale(1.06)}}' +
    '@keyframes ucCSube{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:none}}' +
    '@media (prefers-reduced-motion: reduce){#uc-carga .sol,#uc-carga .pista i,#uc-carga .marca{animation:none}#uc-carga .pista i{width:100%}}';
  document.head.appendChild(css);
  var el = document.createElement('div');
  el.id = 'uc-carga'; el.setAttribute('role', 'status'); el.setAttribute('aria-live', 'polite');
  el.innerHTML =
    '<div class="marca"><span class="sol" aria-hidden="true"><svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><circle cx="12" cy="12" r="4.2"></circle><path d="M12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2M5.3 5.3l1.4 1.4M17.3 17.3l1.4 1.4M5.3 18.7l1.4-1.4M17.3 6.7l1.4-1.4"></path></svg></span>' +
    '<b>Cursos de verano</b><small>UNIVERSIDAD CONTINENTAL · A DISTANCIA</small></div>' +
    '<div class="pista" aria-hidden="true"><i></i></div><p>Preparando tu consulta…</p>';
  function poner() { (document.body || document.documentElement).appendChild(el); }
  if (document.body) poner(); else document.addEventListener('DOMContentLoaded', poner);
  var t0 = Date.now(), listo = false;
  function quitar() {
    if (listo) return; listo = true;
    var espera = Math.max(0, 600 - (Date.now() - t0));
    setTimeout(function () { el.classList.add('fin'); setTimeout(function () { el.remove(); }, 500); }, espera);
  }
  if (document.readyState === 'complete') quitar(); else window.addEventListener('load', quitar);
  setTimeout(quitar, 4000);
})();
