/* Botón flotante de ayuda (landing y portal).
   Muestra cómo funciona el proceso, el calendario académico y el contacto de la mesa de ayuda.
   PROTOTIPO: fechas y contactos de ejemplo; el calendario se lee de la configuración de la campaña si existe. */
(function () {
  if (window.__ucAyuda) return; window.__ucAyuda = true;
  const INTRANET = (window.UCP && UCP.config && UCP.config.intranet) || 'https://estudiantes.ucontinental.edu.pe/';
  const CONTACTO = { whatsapp: 'https://wa.me/?text=' + encodeURIComponent('Hola, tengo una consulta sobre los cursos de verano.'), correo: 'mesadeayuda.demo@continental.edu.pe', horario: 'Lunes a viernes, de 8:00 a 20:00' };
  const f = (iso) => { if (!iso) return 'Por anunciar'; const [y, m, d] = iso.slice(0, 10).split('-'); return `${d}/${m}/${y}`; };
  const camp = () => { const d = { inicio: '2026-10-26', cierre: '2026-11-13', horarios: '2026-11-20', matInicio: '2026-12-01', matFin: '2026-12-15' }; try { return Object.assign(d, JSON.parse(localStorage.getItem('uc_proto_campana') || '{}')); } catch (e) { return d; } };

  const css = document.createElement('style');
  css.textContent = `
  .uc-ayuda-btn{position:fixed;right:20px;bottom:20px;z-index:44;min-height:52px;padding:0 20px 0 14px;border-radius:999px;border:0;background:#5A00AA;color:#fff;font:700 15px 'DM Sans',system-ui,sans-serif;display:flex;align-items:center;gap:10px;cursor:pointer;box-shadow:0 10px 28px rgba(0,0,0,.30);transition:bottom .2s}
  .uc-ayuda-btn:hover{background:#5A00AA}
  .uc-ayuda-btn:focus-visible,.uc-ayuda *:focus-visible{outline:3px solid #B9E1FF;outline-offset:2px}
  .uc-ayuda-btn .ico{width:30px;height:30px;border-radius:999px;background:#B9E1FF;color:#000000;display:flex;align-items:center;justify-content:center;font:700 17px Sora,sans-serif}
  .uc-ayuda-fondo{position:fixed;inset:0;background:rgba(0,0,0,.55);z-index:80;display:flex;justify-content:flex-end}
  .uc-ayuda{background:#fff;width:min(440px,100%);height:100%;overflow-y:auto;font:15px/1.5 'DM Sans',system-ui,sans-serif;color:#000000;display:flex;flex-direction:column}
  .uc-ayuda header{background:#5A00AA;color:#fff;padding:20px;display:flex;justify-content:space-between;gap:12px;align-items:flex-start}
  .uc-ayuda h2{font:700 20px Sora,sans-serif;margin:0}
  .uc-ayuda header p{margin:4px 0 0;color:#FFFFFF;font-size:14px}
  .uc-ayuda .cerrar{width:42px;height:42px;flex:none;border-radius:999px;border:2px solid rgba(255,255,255,.5);background:none;color:#fff;font-size:18px;cursor:pointer}
  .uc-ayuda .cuerpo{padding:20px;display:flex;flex-direction:column;gap:18px}
  .uc-ayuda h3{font:700 15px Sora,sans-serif;margin:0 0 8px;color:#5A00AA}
  .uc-ayuda ol{margin:0;padding:0;list-style:none;display:flex;flex-direction:column;gap:10px}
  .uc-ayuda ol li{display:flex;gap:12px}
  .uc-ayuda ol li span{width:28px;height:28px;flex:none;border-radius:999px;background:#5A00AA;color:#fff;display:flex;align-items:center;justify-content:center;font:700 14px Sora,sans-serif}
  .uc-ayuda ol li.int span{background:#B9E1FF;color:#000000}
  .uc-ayuda .nota{background:#B9E1FF;border-left:5px solid #B9E1FF;border-radius:12px;padding:12px 14px;color:#000000}
  .uc-ayuda dl{margin:0;display:grid;grid-template-columns:auto 1fr;gap:6px 14px;font-size:14.5px}
  .uc-ayuda dt{color:#555555} .uc-ayuda dd{margin:0;font-weight:700}
  .uc-ayuda .acciones{display:flex;flex-wrap:wrap;gap:8px}
  .uc-ayuda .acciones a{min-height:44px;padding:0 16px;border-radius:999px;display:inline-flex;align-items:center;font-weight:700;text-decoration:none;border:2px solid #5A00AA;color:#5A00AA;background:#fff}
  .uc-ayuda .acciones a.wa{background:#1B7A43;border-color:#1B7A43;color:#fff}
  .uc-ayuda .acciones a.int{background:#000000;border-color:#000000;color:#fff}
  .uc-ayuda .demo{font-size:12.5px;color:#555555}
  .uc-ayuda section.contacto{background:#F2F2F2;border-radius:16px;padding:16px}
  .uc-ayuda details{border:1px solid #E3E3E3;border-radius:12px;margin-top:8px;background:#fff}
  .uc-ayuda details summary{cursor:pointer;min-height:44px;display:flex;align-items:center;padding:8px 14px;font-weight:700;color:#000000;list-style:none}
  .uc-ayuda details summary::-webkit-details-marker{display:none}
  .uc-ayuda details summary::after{content:'+';margin-left:auto;padding-left:12px;color:#5A00AA;font:700 18px Sora,sans-serif}
  .uc-ayuda details[open] summary::after{content:'–'}
  .uc-ayuda details p{margin:0;padding:0 14px 12px;color:#3A3A3A;font-size:14.5px}
  .uc-ayuda details a{color:#5A00AA;font-weight:700}
  .uc-ayuda details.glo{margin-top:0}.uc-ayuda details.glo dl{padding:0 14px 12px}
  .uc-ayuda dl.glosario{grid-template-columns:1fr;gap:2px}.uc-ayuda dl.glosario dt{color:#5A00AA;font-weight:700;margin-top:8px}.uc-ayuda dl.glosario dd{font-weight:400;color:#3A3A3A}
  @media (max-width:600px){.uc-ayuda-btn{right:12px;padding:0 16px 0 12px}.uc-ayuda-btn .txt{display:none}.uc-ayuda-btn{padding:0 11px}}
  @media (prefers-reduced-motion: reduce){.uc-ayuda-btn{transition:none}}`;
  document.head.appendChild(css);

  const btn = document.createElement('button');
  btn.type = 'button'; btn.className = 'uc-ayuda-btn'; btn.setAttribute('aria-haspopup', 'dialog'); btn.setAttribute('aria-label', '¿Necesitas ayuda?');
  btn.innerHTML = '<span class="ico" aria-hidden="true">?</span><span class="txt">¿Necesitas ayuda?</span>';
  document.body.appendChild(btn);

  let capa = null;
  function abrir() {
    const c = camp();
    capa = document.createElement('div'); capa.className = 'uc-ayuda-fondo';
    capa.innerHTML = `<aside class="uc-ayuda" role="dialog" aria-modal="true" aria-labelledby="uc-ay-t">
      <header><div><h2 id="uc-ay-t">¿Necesitas ayuda?</h2><p>Te respondemos tus dudas sobre los cursos de verano</p></div><button type="button" class="cerrar" aria-label="Cerrar ayuda">✕</button></header>
      <div class="cuerpo">
        <section class="contacto"><h3>Habla con nosotros</h3><p style="margin:0 0 10px;color:#3A3A3A"><b>Tus dudas sobre tus asignaturas, a tu director de programa</b>${(window.UCP && UCP.config && UCP.config.directoresPrograma) ? ` (<a href="${UCP.config.directoresPrograma}" target="_blank" rel="noopener">ver directores por programa</a>)` : ''}. Para dudas sobre este portal: mesa de ayuda · ${CONTACTO.horario}</p>
          <div class="acciones"><a class="wa" href="${CONTACTO.whatsapp}" target="_blank" rel="noopener">Escribir por WhatsApp</a><a href="mailto:${CONTACTO.correo}?subject=${encodeURIComponent('Consulta sobre cursos de verano')}">Enviar un correo</a></div></section>
        <section><h3>Preguntas frecuentes</h3>
          <details><summary>¿Este portal me matricula?</summary><p>No. Aquí solo consultas tu avance, tus rutas y los cursos de verano que podrías llevar. La matrícula oficial se realiza en el <a href="${INTRANET}" target="_blank" rel="noopener">Portal del Estudiante</a>.</p></details>
          <details><summary>¿Cuándo sabré qué cursos se abren?</summary><p>La oferta horaria de los cursos de verano se publica el <b>${f(c.horarios)}</b>. La verás en el Portal del Estudiante.</p></details>
          <details><summary>¿Cuánto cuestan los cursos de verano?</summary><p>Depende de tu escala de pagos. Consúltalo en el <a href="${(window.UCP && UCP.config && UCP.config.simuladorCostos) || INTRANET}" target="_blank" rel="noopener">simulador de costos del Portal del Estudiante</a>.</p></details>
        </section>
        <section><h3>Fechas clave</h3><dl>
          <dt>Oferta horaria</dt><dd>${f(c.horarios)}</dd>
          <dt>Matrícula oficial</dt><dd>${f(c.matInicio)} al ${f(c.matFin)}</dd></dl></section>
        <details class="glo"><summary>Glosario de términos</summary><dl class="glosario">${((window.UCP && UCP.terminos && UCP.terminos.glosario) || []).map(([t, d]) => `<dt>${t}</dt><dd>${d}</dd>`).join('')}</dl></details>
      </div></aside>`;
    document.body.appendChild(capa);
    capa.addEventListener('click', (e) => { if (e.target === capa || e.target.closest('.cerrar')) cerrar(); });
    capa.querySelector('.cerrar').focus();
  }
  function cerrar() { if (capa) { capa.remove(); capa = null; btn.focus(); } }
  btn.addEventListener('click', abrir);
  document.addEventListener('keydown', (e) => {
    if (!capa) return;
    if (e.key === 'Escape') cerrar();
    if (e.key === 'Tab') { const el = [...capa.querySelectorAll('button, a')]; const i = el.indexOf(document.activeElement); if (e.shiftKey && i <= 0) { e.preventDefault(); el.at(-1).focus(); } else if (!e.shiftKey && i === el.length - 1) { e.preventDefault(); el[0].focus(); } }
  });
  // Sube el botón cuando hay una barra fija abajo (por ejemplo, en el celular)
  setInterval(() => {
    let alto = 0;
    document.querySelectorAll('body *').forEach((el) => { if (el === btn || el.closest('.uc-ayuda-fondo')) return; const st = getComputedStyle(el); if (st.position === 'fixed' && st.bottom === '0px' && el.offsetHeight > 30 && el.offsetHeight < 200 && el.getBoundingClientRect().width > innerWidth * 0.8) alto = Math.max(alto, el.offsetHeight); });
    btn.style.bottom = (alto ? alto + 12 : 20) + 'px';
  }, 700);
})();
