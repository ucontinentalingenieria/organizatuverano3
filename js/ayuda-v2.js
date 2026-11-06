/* Ayuda flotante v2 (inicio y portal del estudiante).
   Panel lateral en escritorio y hoja inferior en el celular: contacto, cómo funciona, preguntas con buscador, fechas y glosario.
   PROTOTIPO: contactos de ejemplo; las fechas se leen de la configuración de la campaña si existe. */
(function () {
  if (window.__ucAyuda) return; window.__ucAyuda = true;
  const CFG = (window.UCP && UCP.config) || {};
  const INTRANET = CFG.intranet || 'https://estudiantes.ucontinental.edu.pe/';
  const COSTOS = CFG.simuladorCostos || INTRANET;
  const CONTACTO = { whatsapp: 'https://wa.me/51959161505?text=' + encodeURIComponent('Hola, tengo una consulta sobre los cursos de verano.'), correo: 'mesadeayuda.demo@continental.edu.pe', horario: 'de lunes a viernes, de 8:00 a 20:00' };
  const MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
  const f = (iso) => { if (!iso) return 'Por anunciar'; const [y, m, d] = iso.slice(0, 10).split('-'); return `${+d} de ${MESES[+m - 1]}`; };
  const camp = () => { const d = { inicio: '2026-10-26', cierre: '2026-11-13', horarios: '2026-11-20', matInicio: '2026-12-01', matFin: '2026-12-15' }; try { return Object.assign(d, JSON.parse(localStorage.getItem('uc_proto_campana') || '{}')); } catch (e) { return d; } };
  const quieto = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  const ICO = {
    ayuda: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M9.1 9a3 3 0 0 1 5.8 1c0 2-3 2.6-3 4.5"/><circle cx="12" cy="18" r=".6" fill="currentColor"/></svg>',
    wa: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2Zm0 18.2a8.2 8.2 0 0 1-4.2-1.1l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2Zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8s-.4-.1-.6.1-.7.8-.8 1-.3.2-.5.1a6.7 6.7 0 0 1-3.3-2.9c-.3-.4.3-.4.7-1.3.1-.2 0-.3 0-.4l-.8-1.8c-.2-.5-.4-.4-.6-.4h-.5a1 1 0 0 0-.7.3 3 3 0 0 0-.9 2.2 5.2 5.2 0 0 0 1.1 2.7 11.8 11.8 0 0 0 4.5 4c1.7.7 2.3.8 3.2.6a2.7 2.7 0 0 0 1.8-1.2 2.2 2.2 0 0 0 .1-1.2c0-.1-.2-.2-.5-.3Z"/></svg>',
    mail: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/></svg>',
    reloj: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>',
    buscar: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>',
    cerrar: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M6 6l12 12M18 6 6 18"/></svg>',
    ext: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5"/></svg>'
  };

  const css = document.createElement('style');
  css.textContent = `
  .uca-btn{position:fixed;right:20px;bottom:20px;z-index:44;min-height:64px;padding:6px 22px 6px 6px;border-radius:999px;border:1px solid rgba(255,255,255,.22);background:linear-gradient(135deg,#6A10BC 0%,#3D0075 100%);color:#fff;font:700 15px Sora,'DM Sans',system-ui,sans-serif;display:flex;align-items:center;gap:12px;cursor:pointer;box-shadow:0 14px 34px rgba(43,0,87,.38),inset 0 1px 0 rgba(255,255,255,.18);transition:bottom .25s,transform .18s cubic-bezier(.23,1,.32,1),box-shadow .25s;-webkit-tap-highlight-color:transparent;touch-action:manipulation}
  @media (hover:hover) and (pointer:fine){.uca-btn:hover{transform:translateY(-2px);box-shadow:0 18px 40px rgba(43,0,87,.46),inset 0 1px 0 rgba(255,255,255,.22)}}
  .uca-btn:active{transform:scale(.97)}
  .uca-btn .ico{position:relative;width:52px;height:52px;flex:none;border-radius:999px;background:#fff;padding:2px;box-shadow:0 0 0 2px rgba(185,225,255,.9),0 6px 14px rgba(0,0,0,.25)}
  .uca-btn .ico svg{width:100%;height:100%;display:block;border-radius:999px}
  .uca-btn .ico::after{content:"";position:absolute;inset:-5px;border-radius:999px;border:2px solid rgba(185,225,255,.8);animation:ucaPulso 2.8s ease-out infinite}
  .uca-btn .punto{position:absolute;right:-1px;bottom:1px;width:14px;height:14px;border-radius:99px;background:#22C55E;border:2.5px solid #3D0075;box-shadow:0 0 0 0 rgba(34,197,94,.6);animation:ucaOnline 2.4s ease-out infinite}
  .uca-btn .txt{display:flex;flex-direction:column;align-items:flex-start;line-height:1.2}
  .uca-btn .txt small{font:500 12.5px 'DM Sans',system-ui,sans-serif;color:#DCCBF2;letter-spacing:.01em}
  .uca-burbuja{position:fixed;right:20px;z-index:44;max-width:240px;padding:10px 14px;border-radius:16px 16px 4px 16px;background:#fff;color:#000;font:500 14px/1.4 'DM Sans',system-ui,sans-serif;box-shadow:0 12px 30px rgba(0,0,0,.16);border:1px solid #E3E3E3;opacity:0;transform:translateY(8px);transition:opacity .3s,transform .3s;pointer-events:none}
  .uca-burbuja.on{opacity:1;transform:none}
  .uca-burbuja b{color:#5A00AA}
  @keyframes ucaOnline{0%{box-shadow:0 0 0 0 rgba(34,197,94,.55)}70%,100%{box-shadow:0 0 0 8px rgba(34,197,94,0)}}
  @keyframes ucaPulso{0%{transform:scale(.96);opacity:.8}100%{transform:scale(1.28);opacity:0}}
  .uca .canal{display:grid;grid-template-columns:48px minmax(0,1fr);gap:12px;align-items:start;padding:16px;border-radius:18px;border:1px solid #E3E3E3;background:#fff}
  .uca .canal + .canal{margin-top:10px}
  .uca .canal .ic{width:48px;height:48px;border-radius:14px;background:#F5F0FB;color:#5A00AA;display:flex;align-items:center;justify-content:center}
  .uca .canal .ic svg{width:24px;height:24px}
  .uca .canal b{display:block;font:700 16px Sora,sans-serif}
  .uca .canal p{margin:2px 0 12px;font-size:14px;color:#3A3A3A}
  .uca .canal .acc{display:flex;flex-wrap:wrap;gap:8px}
  .uca .canal .acc a,.uca .canal .acc button{min-height:44px;padding:0 16px;border-radius:999px;display:inline-flex;align-items:center;gap:8px;font:700 14px 'DM Sans',sans-serif;text-decoration:none;cursor:pointer;border:0}
  .uca .canal .acc svg{width:18px;height:18px}
  .uca .b-dir{background:#5A00AA;color:#fff} .uca .b-dir:hover{background:#3D0075}
  .uca .b-wa{background:#1B7A43;color:#fff} .uca .b-wa:hover{background:#145C34;color:#fff}
  .uca .b-ml{background:#F5F5F5;color:#000;border:1px solid #E3E3E3 !important} .uca .b-ml:hover{background:#EBEBEB;color:#000}
  .uca-btn:focus-visible,.uca *:focus-visible{outline:3px solid #B9E1FF;outline-offset:2px;box-shadow:0 0 0 2px #000}
  .uca-fondo{position:fixed;inset:0;z-index:80;background:rgba(0,0,0,0);display:flex;justify-content:flex-end;transition:background .25s}
  .uca-fondo.on{background:rgba(0,0,0,.55)}
  .uca{background:#fff;width:min(460px,100%);height:100%;overflow-y:auto;overscroll-behavior:contain;font:15px/1.5 'DM Sans',system-ui,sans-serif;color:#000;display:flex;flex-direction:column;transform:translateX(100%);transition:transform .32s cubic-bezier(.2,.7,.2,1)}
  .uca-fondo.on .uca{transform:none}
  .uca header{position:sticky;top:0;z-index:2;background:#5A00AA;color:#fff;padding:22px 20px 20px;display:flex;flex-direction:column;gap:16px}
  .uca .tope{display:flex;justify-content:space-between;align-items:flex-start;gap:12px}
  .uca .asa{display:none}
  .uca h2{font:700 22px/1.2 Sora,sans-serif;margin:0}
  .uca header p{margin:4px 0 0;font-size:14.5px}
  .uca .cerrar{width:44px;height:44px;flex:none;border-radius:999px;border:0;background:rgba(255,255,255,.14);color:#fff;cursor:pointer;display:flex;align-items:center;justify-content:center;transition:background .2s}
  .uca .cerrar:hover{background:rgba(255,255,255,.26)} .uca .cerrar svg{width:20px;height:20px}
  .uca .buscar{display:flex;align-items:center;gap:10px;background:#fff;border-radius:999px;padding:0 16px;min-height:50px;color:#5A00AA}
  .uca .buscar svg{width:20px;height:20px;flex:none}
  .uca .buscar input{flex:1;min-width:0;border:0;outline:none;background:transparent;font:500 15.5px 'DM Sans',sans-serif;color:#000;min-height:48px}
  .uca .cuerpo{padding:20px;display:flex;flex-direction:column;gap:26px}
  .uca h3{font:700 13px 'DM Sans',sans-serif;letter-spacing:.08em;text-transform:uppercase;margin:0 0 10px;color:#5A00AA}
  .uca .contacto{display:grid;grid-template-columns:1fr 1fr;gap:10px}
  .uca .contacto a{min-height:84px;border-radius:18px;padding:14px;display:flex;flex-direction:column;justify-content:space-between;gap:8px;text-decoration:none;font-weight:700;transition:transform .2s,box-shadow .2s}
  .uca .contacto a:hover{transform:translateY(-2px);box-shadow:0 10px 22px rgba(0,0,0,.12)}
  .uca .contacto a svg{width:24px;height:24px}
  .uca .contacto .wa{background:#1B7A43;color:#fff} .uca .contacto .ml{background:#F5F5F5;color:#000;border:1px solid #E3E3E3}
  .uca .contacto small{display:block;font-weight:500;font-size:12.5px;opacity:.9}
  .uca .horario{grid-column:1/-1;display:flex;align-items:center;gap:8px;font-size:13.5px;color:#3A3A3A}
  .uca .horario svg{width:18px;height:18px;color:#5A00AA;flex:none}
  .uca ol.pasos{margin:0;padding:0;list-style:none;display:flex;flex-direction:column}
  .uca ol.pasos li{display:grid;grid-template-columns:32px 1fr;gap:0 14px}
  .uca ol.pasos .n{display:flex;flex-direction:column;align-items:center}
  .uca ol.pasos .n b{width:32px;height:32px;border-radius:99px;background:#5A00AA;color:#fff;display:flex;align-items:center;justify-content:center;font:700 14px Sora,sans-serif}
  .uca ol.pasos li.portal .n b{background:#000;color:#B9E1FF}
  .uca ol.pasos .n i{flex:1;width:2px;background:#E3E3E3;margin:4px 0}
  .uca ol.pasos li:last-child .n i{display:none}
  .uca ol.pasos .t{padding:4px 0 16px} .uca ol.pasos .t b{display:block;font:700 15px Sora,sans-serif} .uca ol.pasos .t span{font-size:14px;color:#555}
  .uca .faq{display:flex;flex-direction:column;gap:8px}
  .uca details{border:1px solid #E3E3E3;border-radius:14px;background:#fff;transition:border-color .2s}
  .uca details:hover,.uca details[open]{border-color:#5A00AA}
  .uca summary{cursor:pointer;min-height:52px;display:flex;align-items:center;gap:12px;padding:10px 14px;font-weight:700;list-style:none}
  .uca summary::-webkit-details-marker{display:none}
  .uca summary::after{content:'+';margin-left:auto;width:28px;height:28px;flex:none;border-radius:99px;background:#F5F5F5;color:#5A00AA;display:flex;align-items:center;justify-content:center;font:700 18px Sora,sans-serif;transition:transform .2s,background .2s,color .2s}
  .uca details[open] summary::after{transform:rotate(45deg);background:#5A00AA;color:#fff}
  .uca details p{margin:0;padding:0 14px 14px;color:#3A3A3A;font-size:14.5px}
  .uca details a{color:#5A00AA;font-weight:700}
  .uca .vacio{margin:0;padding:16px;border-radius:14px;background:#F5F5F5;text-align:center;color:#555;font-size:14.5px}
  .uca .fechas{display:flex;flex-direction:column;background:#000;color:#fff;border-radius:18px;padding:6px 16px}
  .uca .fechas div{display:flex;justify-content:space-between;gap:12px;padding:12px 0;border-top:1px solid #2A2A2A;font-size:14.5px}
  .uca .fechas div:first-child{border-top:0} .uca .fechas dt{color:#B9E1FF} .uca .fechas dd{margin:0;font-weight:700;text-align:right}
  .uca dl.glosario{margin:0;padding:0 14px 14px;display:flex;flex-direction:column;gap:2px}
  .uca dl.glosario dt{color:#5A00AA;font-weight:700;margin-top:8px} .uca dl.glosario dd{margin:0;color:#3A3A3A;font-size:14.5px}
  .uca .portal{display:flex;align-items:center;justify-content:center;gap:8px;min-height:52px;border-radius:999px;background:#000;color:#fff;font-weight:700;text-decoration:none;transition:background .2s}
  .uca .portal:hover{background:#3A3A3A;color:#fff} .uca .portal svg{width:18px;height:18px}
  .uca .demo{font-size:12.5px;color:#555;text-align:center;margin:0}
  @media (max-width:760px){.uca-btn{right:12px;padding:6px}.uca-btn .txt{display:none}.uca-burbuja{right:12px}}
  @media (max-width:600px){
    .uca-fondo{align-items:flex-end}
    .uca{width:100%;height:auto;max-height:92vh;border-radius:24px 24px 0 0;transform:translateY(100%)}
    .uca header{border-radius:24px 24px 0 0;padding-top:12px}
    .uca .asa{display:block;width:44px;height:5px;border-radius:9px;background:rgba(255,255,255,.45);margin:0 auto}
  }
  @media (prefers-reduced-motion: reduce){.uca-btn,.uca,.uca-fondo,.uca-burbuja{transition:none}.uca-btn .ico::after,.uca-btn .punto{animation:none}}`;
  document.head.appendChild(css);

  const btn = document.createElement('button');
  btn.type = 'button'; btn.className = 'uca-btn'; btn.setAttribute('aria-haspopup', 'dialog'); btn.setAttribute('aria-label', '¿Necesitas ayuda?');
  btn.innerHTML = `<span class="ico" aria-hidden="true"><svg viewBox="0 0 64 64" aria-hidden="true"><defs><radialGradient id="ucaFondo" cx=".5" cy=".3" r=".9"><stop offset="0" stop-color="#EAF6FF"/><stop offset="1" stop-color="#B9E1FF"/></radialGradient><linearGradient id="ucaPiel" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FFDDBF"/><stop offset="1" stop-color="#F0B890"/></linearGradient><linearGradient id="ucaSaco" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#6A10BC"/><stop offset="1" stop-color="#3D0075"/></linearGradient><linearGradient id="ucaPelo" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#4A2E25"/><stop offset="1" stop-color="#1F120E"/></linearGradient></defs><rect width="64" height="64" fill="url(#ucaFondo)"/><path d="M10 64c1-12 9-18 22-18s21 6 22 18Z" fill="url(#ucaSaco)"/><path d="M24.5 46.5 32 58l7.5-11.5-3.2-1.6h-9.6Z" fill="#fff"/><path d="M24.5 46.5 32 58l-9-4.5Zm15 0L32 58l9-4.5Z" fill="#2B0057" opacity=".55"/><path d="M27 40h10v7.5c-1.6 2.4-8.4 2.4-10 0Z" fill="#E9AE86"/><path d="M20.5 28c-3 9 0 17 4 22-6-3-8-12-4-22Z" fill="url(#ucaPelo)"/><path d="M43.5 28c3 9 0 17-4 22 6-3 8-12 4-22Z" fill="url(#ucaPelo)"/><ellipse cx="32" cy="28" rx="10.4" ry="12.6" fill="url(#ucaPiel)"/><path d="M20.8 27c-1.6-11 6-17 12.4-17 7 0 13 5.6 10.2 17-.8-6-4.8-9.6-10-9.6-5.8 0-9.8 3.4-12.6 9.6Z" fill="url(#ucaPelo)"/><path d="M25 14.5c3-2.2 8-2.6 12 0" fill="none" stroke="#fff" stroke-opacity=".18" stroke-width="1.4" stroke-linecap="round"/><path d="M19.8 28c-1.2-11 6-18 13.2-18s14 7 12.2 18" fill="none" stroke="#1B1B22" stroke-width="2" stroke-linecap="round"/><rect x="17.6" y="25.5" width="4" height="8" rx="2" fill="#1B1B22"/><rect x="42.4" y="25.5" width="4" height="8" rx="2" fill="#1B1B22"/><path d="M44.6 32.5c-.2 5.6-4.4 8.6-9.4 8.6" fill="none" stroke="#1B1B22" stroke-width="1.5" stroke-linecap="round"/><circle cx="34.6" cy="41.1" r="1.8" fill="#1B1B22"/><path d="M25.2 23.6c1.4-1 3.2-1 4.4-.2M34.4 23.4c1.2-.8 3-.8 4.4.2" fill="none" stroke="#3A2218" stroke-width="1.1" stroke-linecap="round"/><ellipse cx="27.6" cy="27.6" rx="1.35" ry="1.6" fill="#2A1710"/><ellipse cx="36.4" cy="27.6" rx="1.35" ry="1.6" fill="#2A1710"/><circle cx="28" cy="27" r=".45" fill="#fff"/><circle cx="36.8" cy="27" r=".45" fill="#fff"/><path d="M32 28.5c-.5 2.4-.9 3.4.2 3.9" fill="none" stroke="#D9A07C" stroke-width="1" stroke-linecap="round"/><path d="M28.2 35c2.4 2.2 5.2 2.2 7.6 0" fill="none" stroke="#B5524A" stroke-width="1.5" stroke-linecap="round"/><ellipse cx="24.6" cy="32" rx="2.4" ry="1.5" fill="#F29A8E" opacity=".28"/><ellipse cx="39.4" cy="32" rx="2.4" ry="1.5" fill="#F29A8E" opacity=".28"/></svg><span class="punto"></span></span><span class="txt">¿Necesitas ayuda?<small>Te orientamos con tus dudas</small></span>`;
  document.body.appendChild(btn);
  const burbuja = document.createElement('div'); burbuja.className = 'uca-burbuja'; burbuja.setAttribute('aria-hidden', 'true');
  burbuja.innerHTML = '¡Hola! <b>¿Tienes dudas?</b> Te ayudamos a planificar tu verano.';
  document.body.appendChild(burbuja);
  const verBurbuja = () => { if (capa || sessionStorage.getItem('uca_burbuja')) return; burbuja.style.bottom = (parseInt(btn.style.bottom || '20') + 72) + 'px'; burbuja.classList.add('on'); sessionStorage.setItem('uca_burbuja', '1'); setTimeout(() => burbuja.classList.remove('on'), 6000); };
  setTimeout(verBurbuja, 5000);

  const FAQ = [
    ['¿Este portal me matricula?', `No. Aquí solo consultas tu avance, tus rutas y los cursos de verano que podrías llevar. La matrícula oficial se realiza en el <a href="${INTRANET}" target="_blank" rel="noopener">Portal del Estudiante</a>.`],
    ['¿Cuándo sabré qué cursos se abren?', (c) => `La oferta horaria de los cursos de verano se publica el <b>${f(c.horarios)}</b>. La verás en el Portal del Estudiante.`], ['¿Cuánto cuestan los cursos de verano?', `Depende de tu escala de pagos. Consúltalo en el <a href="${COSTOS}" target="_blank" rel="noopener">simulador de costos del Portal del Estudiante</a>.`],
    ['¿Cuántos créditos puedo llevar?', 'Hasta 11 créditos por verano, en asignaturas hasta el 6.° periodo de tu plan de estudios.'],
    ['¿Qué pasa si dos sesiones en vivo coinciden?', 'No hay problema: todas las sesiones en vivo quedan grabadas y puedes verlas después.']
  ];
  const sinTilde = (s) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

  let capa = null;
  function abrir() {
    const glos = (window.UCP && UCP.terminos && UCP.terminos.glosario) || [], CARRERA = String((window.UCP && UCP.carreraActual) || '').replace(/"/g, '');
    burbuja.classList.remove('on');
    capa = document.createElement('div'); capa.className = 'uca-fondo';
    capa.innerHTML = `<aside class="uca" role="dialog" aria-modal="true" aria-labelledby="uca-t">
      <header><span class="asa" aria-hidden="true"></span>
        <div class="tope"><div><h2 id="uca-t">¿Necesitas ayuda?</h2><p>Elige con quién hablar y te orientamos.</p></div><button type="button" class="cerrar" aria-label="Cerrar ayuda">${ICO.cerrar}</button></div>
        </header>
      <div class="cuerpo">
        <section aria-labelledby="uca-h1"><h3 id="uca-h1">¿Sobre qué es tu duda?</h3>
          <div class="canal"><span class="ic" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 9 12 4 2 9l10 5 10-5Z"/><path d="M6 11v5c0 1.5 2.7 3 6 3s6-1.5 6-3v-5"/></svg></span><div><b>Temas académicos</b><p>Qué asignaturas llevar, tu plan de estudios, tu ruta o tu avance.</p><div class="acc"><button type="button" class="b-dir" data-directores="1" ${CARRERA ? `data-solo="1" data-carrera="${CARRERA}"` : ''}>${CARRERA ? 'Contactar a mi director' : 'Ver directores de programa'}</button></div></div></div>
          <div class="canal"><span class="ic" aria-hidden="true">${ICO.mail}</span><div><b>Dudas generales</b><p>Uso de este portal, matrícula, pagos o accesos. Escríbenos al CAS.</p><div class="acc"><a class="b-wa" href="${CONTACTO.whatsapp}" target="_blank" rel="noopener">${ICO.wa}WhatsApp</a><a class="b-ml" href="mailto:${CONTACTO.correo}?subject=${encodeURIComponent('Consulta sobre cursos de verano')}">Correo</a></div></div></div>
          <p class="horario" style="margin:12px 0 0">${ICO.reloj}Atendemos ${CONTACTO.horario}</p>
        </section>
        ${glos.length ? `<details><summary>Glosario de términos</summary><dl class="glosario">${glos.map(([t, d]) => `<dt>${t}</dt><dd>${d}</dd>`).join('')}</dl></details>` : ''}
        <a class="portal" href="${INTRANET}" target="_blank" rel="noopener">Ir al Portal del Estudiante ${ICO.ext}</a>
      </div></aside>`;
    document.body.appendChild(capa);
    requestAnimationFrame(() => requestAnimationFrame(() => capa && capa.classList.add('on')));
    capa.addEventListener('click', (e) => { if (e.target === capa || e.target.closest('.cerrar')) cerrar(); });
    capa.querySelector('[data-directores]').addEventListener('click', () => setTimeout(cerrar, 0));
    capa.querySelector('.cerrar').focus();
  }
  function cerrar() {
    if (!capa) return; const c = capa; capa = null; c.classList.remove('on');
    setTimeout(() => c.remove(), quieto ? 0 : 320); btn.focus();
  }
  btn.addEventListener('click', abrir);
  document.addEventListener('keydown', (e) => {
    if (!capa) return;
    if (e.key === 'Escape') cerrar();
    if (e.key === 'Tab') { const el = [...capa.querySelectorAll('button, a, summary')].filter((x) => x.offsetParent); const i = el.indexOf(document.activeElement); if (e.shiftKey && i <= 0) { e.preventDefault(); el.at(-1).focus(); } else if (!e.shiftKey && i === el.length - 1) { e.preventDefault(); el[0].focus(); } }
  });
  // Sube el botón cuando hay una barra fija abajo (por ejemplo, en el celular)
  setInterval(() => {
    let alto = 0;
    document.querySelectorAll('body *').forEach((el) => { if (el === btn || el.closest('.uca-fondo')) return; const st = getComputedStyle(el); if (st.position === 'fixed' && st.bottom === '0px' && el.offsetHeight > 30 && el.offsetHeight < 200 && el.getBoundingClientRect().width > innerWidth * 0.8) alto = Math.max(alto, el.offsetHeight); });
    btn.style.bottom = (alto ? alto + 12 : 20) + 'px';
  }, 700);
})();
