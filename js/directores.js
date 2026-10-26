/* Directorio de directores de programa · Modalidad A Distancia.
   Completa "director" y "correo" de cada carrera. Se abre como ventana flotante
   desde cualquier enlace con href="#directores". */
(function () {
  const CARRERAS = [
    { carrera: 'Administración', director: '', correo: '' },
    { carrera: 'Administración y Finanzas', director: '', correo: '' },
    { carrera: 'Administración y Gestión del Talento Humano', director: '', correo: '' },
    { carrera: 'Administración y Gestión Pública', director: '', correo: '' },
    { carrera: 'Administración y Marketing', director: '', correo: '' },
    { carrera: 'Administración y Negocios Digitales', director: '', correo: '' },
    { carrera: 'Administración y Negocios Internacionales', director: '', correo: '' },
    { carrera: 'Ciencia de la Computación', director: '', correo: '' },
    { carrera: 'Contabilidad y Finanzas', director: '', correo: '' },
    { carrera: 'Derecho', director: '', correo: '' },
    { carrera: 'Educación con especialidad en innovación y aprendizaje digital', director: '', correo: '' },
    { carrera: 'Ingeniería Ambiental', director: '', correo: '' },
    { carrera: 'Ingeniería de Sistemas e Informática', director: '', correo: '' },
    { carrera: 'Ingeniería Empresarial', director: '', correo: '' },
    { carrera: 'Ingeniería Industrial', director: '', correo: '' },
    { carrera: 'Psicología', director: '', correo: '' }
  ];
  window.UCP = window.UCP || {};
  const sinTilde = (s) => String(s || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  const esc = (s) => String(s || '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  const css = document.createElement('style');
  css.textContent = `
  .ucd-fondo{position:fixed;inset:0;z-index:100000;background:rgba(0,0,0,.5);display:flex;align-items:center;justify-content:center;padding:16px;opacity:0;transition:opacity .2s}
  .ucd-fondo.on{opacity:1}
  .ucd{width:100%;max-width:640px;max-height:min(86vh,760px);display:flex;flex-direction:column;background:#fff;border-radius:24px;overflow:hidden;box-shadow:0 30px 70px rgba(0,0,0,.3);font-family:'DM Sans',system-ui,sans-serif;color:#000;transform:translateY(16px);transition:transform .25s cubic-bezier(.2,.7,.2,1)}
  .ucd-fondo.on .ucd{transform:none}
  .ucd header{background:#5A00AA;color:#fff;padding:20px 22px 16px;display:flex;flex-direction:column;gap:12px}
  .ucd .tope{display:flex;justify-content:space-between;align-items:flex-start;gap:12px}
  .ucd .eti{font-size:12px;font-weight:700;letter-spacing:.08em;color:#B9E1FF}
  .ucd h2{margin:4px 0 2px;font:700 21px/1.25 Sora,sans-serif;color:#fff}
  .ucd header p{margin:0;font-size:14px;color:#fff}
  .ucd .cerrar{width:44px;height:44px;flex:none;border-radius:99px;border:0;background:rgba(255,255,255,.15);color:#fff;font-size:20px;cursor:pointer}
  .ucd .cerrar:hover{background:rgba(255,255,255,.28)}
  .ucd .buscar{display:flex;align-items:center;gap:10px;background:#fff;border-radius:999px;padding:0 16px;min-height:48px}
  .ucd .buscar input{flex:1;min-width:0;border:0;outline:none;font:500 15px 'DM Sans',sans-serif;background:transparent;color:#000}
  .ucd .buscar svg{width:18px;height:18px;flex:none;color:#5A00AA}
  .ucd .lista{overflow:auto;padding:12px 14px 16px;display:flex;flex-direction:column;gap:8px;background:#FAFAFA}
  .ucd .item{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:6px 14px;align-items:center;background:#fff;border:1px solid #E3E3E3;border-radius:16px;padding:12px 14px;transition:border-color .15s}
  .ucd .item:hover{border-color:#5A00AA}
  .ucd .item.tuya{border:2px solid #5A00AA;background:#FAF7FD}
  .ucd .lista:has(.item:only-child) .item.tuya .tag{display:none}
  .ucd .item b{font:700 15px/1.3 Sora,sans-serif}
  .ucd .item .dir{font-size:13.5px;color:#3A3A3A}
  .ucd .item .tag{display:inline-block;margin-left:6px;padding:1px 8px;border-radius:999px;background:#5A00AA;color:#fff;font:700 11.5px 'DM Sans',sans-serif;vertical-align:2px}
  .ucd .acc{display:flex;gap:6px}
  .ucd .acc a,.ucd .acc button{min-height:44px;padding:0 14px;border-radius:999px;display:inline-flex;align-items:center;gap:6px;font:700 13.5px 'DM Sans',sans-serif;text-decoration:none;cursor:pointer}
  .ucd .acc a{background:#5A00AA;color:#fff;border:0}
  .ucd .acc a:hover{background:#3D0075;color:#fff}
  .ucd .acc button{background:#fff;color:#5A00AA;border:1.5px solid #5A00AA}
  .ucd .acc button:hover{background:#F2F2F2}
  .ucd .pend{font-size:13px;font-weight:700;color:#555;padding:6px 12px;border-radius:999px;background:#F2F2F2;white-space:nowrap}
  .ucd .vacio{text-align:center;color:#555;padding:24px 10px}
  .ucd footer{padding:12px 20px;font-size:13px;color:#3A3A3A;border-top:1px solid #EFEFEF;background:#fff}
  @media (max-width:600px){.ucd-fondo{align-items:flex-end;padding:0}.ucd{border-radius:24px 24px 0 0;max-height:92vh}.ucd .item{grid-template-columns:minmax(0,1fr)}.ucd .acc{flex-wrap:wrap}}
  @media (prefers-reduced-motion: reduce){.ucd-fondo,.ucd{transition:none}}`;
  document.head.appendChild(css);

  let capa = null, previo = null;
  function cerrar() { if (!capa) return; capa.classList.remove('on'); const c = capa; capa = null; setTimeout(() => c.remove(), 200); document.removeEventListener('keydown', tecla); previo && previo.focus && previo.focus(); }
  function tecla(e) { if (e.key === 'Escape') cerrar(); }
  function pintar(q, tuya, solo) {
    const n = sinTilde(q), L = CARRERAS.filter((x) => solo ? sinTilde(x.carrera) === sinTilde(tuya) : (!n || sinTilde(x.carrera + ' ' + x.director).includes(n)));
    L.sort((a, b) => (sinTilde(b.carrera) === sinTilde(tuya)) - (sinTilde(a.carrera) === sinTilde(tuya)));
    return L.length ? L.map((x) => {
      const es = tuya && sinTilde(x.carrera) === sinTilde(tuya);
      const acc = x.correo
        ? `<div class="acc"><a href="mailto:${esc(x.correo)}?subject=${encodeURIComponent('Consulta sobre cursos de verano · ' + x.carrera)}">Escribir</a><button type="button" data-copiar="${esc(x.correo)}">Copiar correo</button></div>`
        : `<span class="pend">Correo por confirmar</span>`;
      return `<div class="item${es ? ' tuya' : ''}"><div><b>${esc(x.carrera)}</b>${es ? '<span class="tag">Tu carrera</span>' : ''}<div class="dir">${x.director ? esc(x.director) + ' · ' : ''}${x.correo ? esc(x.correo) : 'Director de programa'}</div></div>${acc}</div>`;
    }).join('') : '<p class="vacio">No encontramos esa carrera. Revisa cómo la escribiste.</p>';
  }
  function abrir(tuya, solo) {
    if (capa) return;
    solo = !!(solo && tuya && CARRERAS.some((x) => sinTilde(x.carrera) === sinTilde(tuya)));
    previo = document.activeElement;
    capa = document.createElement('div'); capa.className = 'ucd-fondo';
    capa.innerHTML = `<div class="ucd" role="dialog" aria-modal="true" aria-labelledby="ucd-t">
      <header><div class="tope"><div><span class="eti">MODALIDAD A DISTANCIA</span><h2 id="ucd-t">${solo ? 'Tu director de programa' : 'Directores de programa'}</h2><p>${solo ? esc(tuya) : 'Tus dudas sobre tus asignaturas y tu ruta, a tu director de programa.'}</p></div><button type="button" class="cerrar" aria-label="Cerrar">✕</button></div>
      ${solo ? '' : `<label class="buscar"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg><span style="position:absolute;left:-9999px">Buscar carrera</span><input type="search" placeholder="Busca tu carrera" autocomplete="off"></label>`}</header>
      <div class="lista" role="list">${pintar('', tuya, solo)}</div>
      <footer>${solo ? 'Escríbele desde tu correo institucional @continental.edu.pe. Indica tu nombre y tu código de estudiante.' : CARRERAS.length + ' carreras · Escríbeles desde tu correo institucional @continental.edu.pe.'}</footer></div>`;
    document.body.appendChild(capa);
    const lista = capa.querySelector('.lista'), inp = capa.querySelector('input');
    inp && inp.addEventListener('input', () => { lista.innerHTML = pintar(inp.value, tuya); });
    capa.addEventListener('click', (e) => {
      if (e.target === capa || e.target.closest('.cerrar')) return cerrar();
      const b = e.target.closest('[data-copiar]');
      if (b) { const t = b.dataset.copiar; (navigator.clipboard ? navigator.clipboard.writeText(t) : Promise.reject()).then(() => { b.textContent = 'Copiado ✓'; setTimeout(() => { b.textContent = 'Copiar correo'; }, 1600); }).catch(() => {}); }
    });
    document.addEventListener('keydown', tecla);
    requestAnimationFrame(() => { capa && capa.classList.add('on'); (inp || capa.querySelector('.cerrar')).focus(); });
  }
  UCP.directores = { lista: CARRERAS, abrir };
  document.addEventListener('click', (e) => {
    const a = e.target.closest && e.target.closest('a[href$="#directores"],[data-directores]');
    if (!a) return;
    e.preventDefault();
    abrir(a.dataset.carrera || (UCP.carreraActual || ''), a.dataset.solo === '1');
  }, true);
})();
