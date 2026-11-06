/* Pantalla de carga · avanza con tareas reales (maquetado, tipografías, foto principal) y se quita
   en cuanto la página es usable, sin esperar a que termine de descargarse todo (máx. 3,5 s). */
(function () {
  if (window.__ucCargador) return; window.__ucCargador = true;
  var css = document.createElement('style');
  css.textContent =
    '#uc-carga{position:fixed;inset:0;z-index:200000;background:radial-gradient(120% 90% at 80% 0%,#6A10BC 0%,#5A00AA 45%,#2B0057 100%);color:#fff;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:26px;font-family:"DM Sans",system-ui,sans-serif;transition:opacity .5s cubic-bezier(.23,1,.32,1),visibility .5s,transform .5s cubic-bezier(.23,1,.32,1)}' +
    '#uc-carga.fin{opacity:0;visibility:hidden;transform:scale(1.02)}' +
    '#uc-carga .halo{position:absolute;left:50%;top:50%;width:min(120vw,760px);aspect-ratio:1;transform:translate(-50%,-50%);pointer-events:none;opacity:.5}' +
    '#uc-carga .halo svg{width:100%;height:100%;animation:ucCGira 60s linear infinite}' +
    '#uc-carga .marca{position:relative;display:flex;flex-direction:column;align-items:center;gap:14px;animation:ucCSube .6s cubic-bezier(.23,1,.32,1) both}' +
    '#uc-carga .logo{background:#fff;border-radius:18px;padding:14px 22px;box-shadow:0 18px 40px -12px rgba(20,0,40,.55);display:flex}' +
    '#uc-carga .logo img{height:34px;width:auto;display:block}' +
    '#uc-carga .sol{width:56px;height:56px;border-radius:18px;background:#B9E1FF;color:#5A00AA;display:flex;align-items:center;justify-content:center;animation:ucCLate 1.6s ease-in-out infinite}' +
    '#uc-carga .sol svg{animation:ucCGira 12s linear infinite}' +
    '#uc-carga b{font:700 20px/1.2 Sora,"DM Sans",sans-serif;letter-spacing:.01em}' +
    '#uc-carga small{font-size:11.5px;font-weight:700;letter-spacing:.12em;color:#B9E1FF}' +
    '#uc-carga .pista{position:relative;width:200px;height:5px;border-radius:99px;background:rgba(255,255,255,.18);overflow:hidden}' +
    '#uc-carga .pista i{display:block;width:100%;height:100%;border-radius:99px;background:linear-gradient(90deg,#B9E1FF,#fff);transform-origin:left;transform:scaleX(.06);transition:transform .45s cubic-bezier(.23,1,.32,1)}' +
    '#uc-carga p{position:relative;margin:0;font-size:14px;color:#E6D9F5;min-height:1.3em}' +
    '@keyframes ucCGira{to{transform:rotate(360deg)}}' +
    '@keyframes ucCLate{0%,100%{transform:scale(1)}50%{transform:scale(1.07)}}' +
    '@keyframes ucCSube{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:none}}' +
    '@media (prefers-reduced-motion: reduce){#uc-carga,#uc-carga *{animation:none!important;transition-duration:.01s!important}}';
  document.head.appendChild(css);
  var rays = '';
  for (var k = 0; k < 24; k++) { var a = k * Math.PI / 12, r2 = k % 2 ? 90 : 98; rays += '<path d="M' + (100 + 62 * Math.cos(a)).toFixed(1) + ' ' + (100 + 62 * Math.sin(a)).toFixed(1) + 'L' + (100 + r2 * Math.cos(a)).toFixed(1) + ' ' + (100 + r2 * Math.sin(a)).toFixed(1) + '"/>'; }
  var el = document.createElement('div');
  el.id = 'uc-carga'; el.setAttribute('role', 'status'); el.setAttribute('aria-live', 'polite');
  el.innerHTML =
    '<div class="halo" aria-hidden="true"><svg viewBox="0 0 200 200" fill="none" stroke="#FFE9B8" stroke-width="1.2" stroke-linecap="round" opacity=".35">' + rays + '</svg></div>' +
    '<div class="marca"><span class="logo"><img src="img/logo.svg" alt="Universidad Continental" onerror="this.parentNode.style.display=\'none\'"></span>' +
    '<span class="sol" aria-hidden="true"><svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><circle cx="12" cy="12" r="4.2"></circle><path d="M12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2M5.3 5.3l1.4 1.4M17.3 17.3l1.4 1.4M5.3 18.7l1.4-1.4M17.3 6.7l1.4-1.4"></path></svg></span>' +
    '<b>Cursos de verano</b><small>MODALIDAD A DISTANCIA</small></div>' +
    '<div class="pista" aria-hidden="true"><i></i></div><p>Preparando tu consulta…</p>';
  function poner() { (document.body || document.documentElement).appendChild(el); }
  if (document.body) poner(); else document.addEventListener('DOMContentLoaded', poner);

  var barra, txt, hecho = 0, TOTAL = 3, t0 = Date.now(), listo = false;
  function avanzar(msg) {
    hecho = Math.min(TOTAL, hecho + 1);
    barra = barra || el.querySelector('.pista i'); txt = txt || el.querySelector('p');
    if (barra) barra.style.transform = 'scaleX(' + (0.12 + 0.88 * hecho / TOTAL).toFixed(2) + ')';
    if (txt && msg) txt.textContent = msg;
    if (hecho >= TOTAL) quitar();
  }
  function quitar() {
    if (listo) return; listo = true;
    var espera = Math.max(0, 700 - (Date.now() - t0));
    setTimeout(function () { el.classList.add('fin'); setTimeout(function () { el.remove(); }, 650); }, espera);
  }
  // 1) La página ya está maquetada (aparece la sección principal)
  var ok1 = false; function pagina() { if (ok1) return; ok1 = true; avanzar('Cargando tipografías…'); }
  (function esperar() { if (document.getElementById('inicio') || document.querySelector('main,#app,#root')) pagina(); else setTimeout(esperar, 40); })();
  setTimeout(pagina, 1500);
  // 2) Tipografías (con tope de 1,5 s para no bloquear)
  var fu = false; function fuentes() { if (fu) return; fu = true; avanzar('Cargando imágenes…'); }
  try { (document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve()).then(fuentes); } catch (e) { fuentes(); }
  setTimeout(fuentes, 1500);
  // 3) Foto principal lista para mostrarse
  var im = new Image(), fo = false; function foto() { if (fo) return; fo = true; avanzar('¡Listo!'); }
  im.onload = foto; im.onerror = foto; im.src = 'img/verano-estudiante.webp';
  if (im.decode) im.decode().then(foto, foto);
  setTimeout(foto, 2500);
  setTimeout(quitar, 3500);
})();
