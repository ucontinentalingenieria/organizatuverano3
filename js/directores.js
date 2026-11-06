/* Directorio de directores de programa · Modalidad A Distancia.
   Se abre como ventana flotante desde cualquier enlace con href="#directores".
   Cada director aparece una sola vez con todas las carreras que dirige. */
(function () {
  // Evita registrar la ventana dos veces (si el script se carga repetido, quedaba una ventana duplicada detrás)
  if (window.__ucDirectoresListo) return;
  window.__ucDirectoresListo = true;
  const ING = 'Ingenierías', NEG = 'Negocios', SOC = 'Sociales y salud', GEN = 'Estudios Generales';
  const DIRECTORES = [
    { nombres: 'Carla Gisela', apellidos: 'Cubas Vergara', correo: 'ccubas@continental.edu.pe', area: SOC, carreras: ['Psicología'] },
    { nombres: 'Ronal', apellidos: 'Bolívar Huanca', correo: 'rbolivar@continental.edu.pe', area: SOC, carreras: ['Educación con especialidad en innovación y aprendizaje digital'] },
    { nombres: 'Manuel Alejandro', apellidos: 'Armaza Armaza', correo: 'marmaza@continental.edu.pe', area: SOC, carreras: ['Derecho'] },
    { nombres: 'Herbert Antonio', apellidos: 'Vílchez Baca', correo: 'hvilchez@continental.edu.pe', area: ING, carreras: ['Ingeniería Industrial'] },
    { nombres: 'Elena', apellidos: 'Espinoza Ríos', correo: 'eespinozar@continental.edu.pe', area: ING, carreras: ['Ingeniería de Sistemas e Informática', 'Ingeniería Empresarial'] },
    { nombres: 'Pedro Yuri', apellidos: 'Márquez Solís', correo: 'ymarquez@continental.edu.pe', area: ING, carreras: ['Ciencia de la Computación'] },
    { nombres: 'Karolina Reyna', apellidos: 'Sarmiento Tapia', correo: 'ksarmiento@continental.edu.pe', area: ING, carreras: ['Ingeniería Ambiental'] },
    { nombres: 'Gleyzi', apellidos: 'Manrique Florez', correo: 'gmanrique@continental.edu.pe', area: NEG, carreras: ['Contabilidad y Finanzas'] },
    { nombres: 'Noriza Sintia', apellidos: 'Turín Meza', correo: 'nturin@continental.edu.pe', area: NEG, carreras: ['Administración'] },
    { nombres: 'Marco Antonio', apellidos: 'Ledesma Munive', correo: 'mledesma@continental.edu.pe', area: NEG, carreras: ['Administración y Gestión Pública', 'Administración y Gestión del Talento Humano'] },
    { nombres: 'Paddy Reiza', apellidos: 'Verde Fasil', correo: 'pverde@continental.edu.pe', area: NEG, carreras: ['Administración y Negocios Internacionales', 'Administración y Marketing', 'Administración y Negocios Digitales'] },
    { nombres: 'Walter Omar', apellidos: 'Goicochea Villavicencio', correo: 'wgoicochea@continental.edu.pe', area: GEN, carreras: ['Estudios Generales · Humanidades'] },
    { nombres: 'Karla Suhey', apellidos: 'Núñez Alberca', correo: 'knunez@continental.edu.pe', area: GEN, carreras: ['Estudios Generales · Ciencias'] },
    // CONFIRMAR: director de esta carrera (no estaba en la lista recibida)
    { nombres: '', apellidos: '', correo: '', area: NEG, carreras: ['Administración y Finanzas'] }
  ];
  const AREAS = [ING, NEG, SOC, GEN];
  const AV = { [ING]: 'av0', [NEG]: 'av2', [SOC]: 'av1', [GEN]: 'av3' };
  // Lista plana por carrera (compatibilidad con otros scripts)
  const CARRERAS = [];
  DIRECTORES.forEach((d) => d.carreras.forEach((c) => CARRERAS.push({ carrera: c, director: (d.nombres + ' ' + d.apellidos).trim(), correo: d.correo })));

  window.UCP = window.UCP || {};
  const sinTilde = (s) => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
  const esc = (s) => String(s || '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const nombre = (d) => (d.nombres + ' ' + d.apellidos).trim();
  const inicial = (d) => ((d.nombres[0] || '') + (d.apellidos[0] || '')).toUpperCase();
  const esTuya = (d, tuya) => !!tuya && d.carreras.some((c) => sinTilde(c) === sinTilde(tuya));
  const I = {
    mail: '<svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/></svg>',
    copiar: '<svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="9" y="9" width="11" height="11" rx="2.5"/><path d="M5 15V6.5A2.5 2.5 0 0 1 7.5 4H15"/></svg>',
    ok: '<svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m5 12.5 4.5 4.5L19 7.5"/></svg>',
    buscar: '<svg viewBox="0 0 24 24" width="19" height="19" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>'
  };

  const css = document.createElement('style');
  css.textContent = `
  .ucd-fondo{position:fixed;inset:0;z-index:100000;background:rgba(20,0,40,.55);backdrop-filter:blur(3px);display:flex;align-items:center;justify-content:center;padding:16px;opacity:0;transition:opacity .15s ease-out}
  .ucd-fondo.on{opacity:1}
  .ucd{width:100%;max-width:720px;max-height:min(88vh,800px);max-height:min(88dvh,800px);display:flex;flex-direction:column;background:#fff;border-radius:28px;overflow:hidden;box-shadow:0 30px 80px rgba(20,0,40,.4);font-family:'DM Sans',system-ui,sans-serif;color:#000;transform:translateY(16px) scale(.98);transition:transform .25s cubic-bezier(.23,1,.32,1)}
  .ucd-fondo.on .ucd{transform:none}
  .ucd header{position:relative;background:linear-gradient(135deg,#5A00AA 0%,#2B0057 100%);color:#fff;padding:18px 22px 16px;display:flex;flex-direction:column;gap:12px;flex:none}
  .ucd .tope{display:flex;justify-content:space-between;align-items:flex-start;gap:12px}
  .ucd .eti{font-size:11.5px;font-weight:700;letter-spacing:.1em;color:#B9E1FF}
  .ucd h2{margin:3px 0 2px;font:700 21px/1.2 Sora,sans-serif;color:#fff}
  .ucd header p{margin:0;font-size:13.5px;color:#E3D5F5;max-width:52ch}
  .ucd .cerrar{width:40px;height:40px;flex:none;border-radius:99px;border:0;background:rgba(255,255,255,.16);color:#fff;font-size:18px;cursor:pointer;transition:background .15s,transform .14s cubic-bezier(.23,1,.32,1);touch-action:manipulation;-webkit-tap-highlight-color:transparent}
  .ucd .cerrar:active{transform:scale(.94)}
  @media (hover:hover) and (pointer:fine){.ucd .cerrar:hover{background:rgba(255,255,255,.3)}}
  .ucd .buscar{position:relative;display:flex;align-items:center;gap:10px;background:#fff;border-radius:999px;padding:0 16px;min-height:46px;color:#5A00AA}
  .ucd .buscar svg{flex:none}
  .ucd .buscar input{flex:1;min-width:0;border:0;outline:none;font:500 16px 'DM Sans',sans-serif;background:transparent;color:#000}
  .ucd .buscar:focus-within{outline:3px solid #B9E1FF}
  .ucd .filtros{display:flex;gap:6px;overflow-x:auto;scrollbar-width:none;margin:0 -22px;padding:0 22px}
  .ucd .filtros::-webkit-scrollbar{display:none}
  .ucd .filtros button{flex:none;min-height:34px;padding:0 14px;border-radius:999px;border:1px solid rgba(255,255,255,.28);background:rgba(255,255,255,.1);color:#fff;font:700 13px 'DM Sans',sans-serif;cursor:pointer;white-space:nowrap;transition:background .15s,color .15s,transform .14s cubic-bezier(.23,1,.32,1);touch-action:manipulation;-webkit-tap-highlight-color:transparent}
  .ucd .filtros button:active{transform:scale(.96)}
  .ucd .filtros button[aria-pressed="true"]{background:#fff;color:#5A00AA;border-color:#fff}
  @media (hover:hover) and (pointer:fine){.ucd .filtros button:not([aria-pressed="true"]):hover{background:rgba(255,255,255,.2)}}
  .ucd .lista{overflow:auto;overscroll-behavior:contain;padding:12px 14px 16px;display:flex;flex-direction:column;gap:8px;background:#F6F3FA;min-height:0}
  .ucd .item{display:grid;grid-template-columns:48px minmax(0,1fr) auto;gap:6px 14px;align-items:center;background:#fff;border:1px solid #E6E0EE;border-radius:18px;padding:11px 14px 11px 11px;transition:border-color .15s,box-shadow .15s}
  .ucd .ent .item{animation:ucdIn .34s cubic-bezier(.23,1,.32,1) both;animation-delay:calc(var(--i,0)*28ms)}
  @keyframes ucdIn{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:none}}
  @media (hover:hover) and (pointer:fine){.ucd .item:hover{border-color:#5A00AA;box-shadow:0 8px 20px -8px rgba(90,0,170,.3)}}
  .ucd .item.tuya{border:2px solid #5A00AA;background:#FBF8FF}
  .ucd .avatar{width:48px;height:48px;border-radius:50%;display:flex;align-items:center;justify-content:center;font:700 16px Sora,sans-serif;letter-spacing:.02em}
  .ucd .av0{background:linear-gradient(135deg,#6A10BC,#3D0075);color:#fff}
  .ucd .av1{background:#B9E1FF;color:#16395E}
  .ucd .av2{background:#EDE3F8;color:#5A00AA}
  .ucd .av3{background:#1F1B2E;color:#B9E1FF}
  .ucd .item.pend .avatar{background:#F0F0F0;color:#777}
  .ucd .quien{min-width:0}
  .ucd .nom{font:700 15px/1.3 Sora,sans-serif}
  .ucd .tag{display:inline-block;margin-left:8px;padding:2px 9px;border-radius:999px;background:#5A00AA;color:#fff;font:700 11px 'DM Sans',sans-serif;vertical-align:2px;white-space:nowrap}
  .ucd .chips{display:flex;flex-wrap:wrap;gap:5px;margin:5px 0 4px}
  .ucd .chip{font-size:12px;font-weight:600;color:#3D0075;background:#F0E8FA;border-radius:999px;padding:2px 9px;line-height:1.35}
  .ucd .mail{display:flex;align-items:center;gap:6px;font-size:13px;color:#555;overflow-wrap:anywhere}
  .ucd .mail svg{width:14px;height:14px;flex:none;color:#8A6BB0}
  .ucd .acc{display:flex;gap:6px;align-items:center}
  .ucd .acc a,.ucd .acc button{min-height:42px;border-radius:999px;display:inline-flex;align-items:center;justify-content:center;gap:7px;font:700 13.5px 'DM Sans',sans-serif;text-decoration:none;cursor:pointer;white-space:nowrap;transition:transform .14s cubic-bezier(.23,1,.32,1),background .15s,color .15s,border-color .15s;touch-action:manipulation;-webkit-tap-highlight-color:transparent;user-select:none;-webkit-user-select:none}
  .ucd .acc a{padding:0 18px;background:#5A00AA;color:#fff;border:0}
  .ucd .acc button{width:42px;padding:0;background:#fff;color:#5A00AA;border:1.5px solid #D9C9EE}
  .ucd .acc button.hecho{background:#E7F7EE;color:#14793F;border-color:#9ADBB5}
  .ucd .acc a:active,.ucd .acc button:active{transform:scale(.95)}
  @media (hover:hover) and (pointer:fine){.ucd .acc a:hover{background:#3D0075;color:#fff}.ucd .acc button:not(.hecho):hover{background:#F2EBFA;border-color:#5A00AA}}
  .ucd .acc a:focus-visible,.ucd .acc button:focus-visible,.ucd .cerrar:focus-visible,.ucd .filtros button:focus-visible{outline:3px solid #B9E1FF;outline-offset:2px}
  .ucd .pendtxt{font-size:12.5px;font-weight:700;color:#555;padding:6px 12px;border-radius:999px;background:#F2F2F2;white-space:nowrap}
  .ucd .vacio{text-align:center;color:#555;padding:32px 10px;font-size:14.5px}
  .ucd footer{flex:none;padding:12px 22px calc(12px + env(safe-area-inset-bottom, 0px));font-size:12.5px;color:#3A3A3A;border-top:1px solid #EFEFEF;background:#fff}
  @media (max-width:640px){
    .ucd-fondo{align-items:flex-end;padding:0}
    .ucd{border-radius:26px 26px 0 0;max-height:92vh;max-height:92dvh}
    .ucd header{padding:16px 18px 14px}
    .ucd .filtros{margin:0 -18px;padding:0 18px}
    .ucd .item{grid-template-columns:44px minmax(0,1fr)}
    .ucd .avatar{width:44px;height:44px;font-size:15px}
    .ucd .acc{grid-column:1 / -1}
    .ucd .acc a{flex:1}
  }
  @media (prefers-reduced-motion: reduce){.ucd-fondo,.ucd,.ucd .cerrar,.ucd .acc a,.ucd .acc button,.ucd .filtros button{transition:none}.ucd .ent .item{animation:none}}`;
  document.head.appendChild(css);

  let capa = null, previo = null;
  function cerrar() { const todas = document.querySelectorAll('.ucd-fondo'); if (!capa && !todas.length) return; capa = null; todas.forEach((c) => { c.classList.remove('on'); setTimeout(() => c.remove(), 150); }); document.removeEventListener('keydown', tecla); previo && previo.focus && previo.focus(); }
  function tecla(e) { if (e.key === 'Escape') cerrar(); }

  function pintar(q, area, tuya, solo) {
    const n = sinTilde(q);
    let L = DIRECTORES.filter((d) => solo ? esTuya(d, tuya) : ((!area || d.area === area) && (!n || sinTilde(nombre(d) + ' ' + d.carreras.join(' ') + ' ' + d.area).includes(n))));
    L = L.map((d, i) => ({ d, i })).sort((a, b) => (esTuya(b.d, tuya) - esTuya(a.d, tuya)) || (!a.d.correo - !b.d.correo) || (a.i - b.i)).map((x) => x.d);
    return L.length ? L.map((d, k) => {
      const es = esTuya(d, tuya), pend = !d.correo;
      const chips = d.carreras.map((c) => `<span class="chip">${esc(c)}</span>`).join('');
      const acc = pend
        ? '<span class="pendtxt">Por confirmar</span>'
        : `<div class="acc"><a href="mailto:${esc(d.correo)}?subject=${encodeURIComponent('Consulta sobre cursos de verano · ' + d.carreras[0])}">${I.mail}Escribir</a><button type="button" data-copiar="${esc(d.correo)}" aria-label="Copiar correo de ${esc(nombre(d))}" title="Copiar correo">${I.copiar}</button></div>`;
      return `<div class="item${es ? ' tuya' : ''}${pend ? ' pend' : ''}" role="listitem" style="--i:${Math.min(k, 10)}">
        <div class="avatar ${AV[d.area] || 'av2'}" aria-hidden="true">${pend ? '?' : esc(inicial(d))}</div>
        <div class="quien"><div class="nom">${pend ? 'Director por confirmar' : esc(nombre(d))}${es ? '<span class="tag">Tu carrera</span>' : ''}</div>
        <div class="chips">${chips}</div>
        ${pend ? '' : `<div class="mail">${I.mail}${esc(d.correo)}</div>`}</div>
        ${acc}</div>`;
    }).join('') : '<p class="vacio">No encontramos esa carrera ni ese director. Revisa cómo lo escribiste.</p>';
  }

  function abrir(tuya, solo) {
    if (capa || document.querySelector('.ucd-fondo')) return;
    solo = !!(solo && tuya && DIRECTORES.some((d) => esTuya(d, tuya)));
    previo = document.activeElement;
    let area = '';
    capa = document.createElement('div'); capa.className = 'ucd-fondo';
    capa.innerHTML = `<div class="ucd" role="dialog" aria-modal="true" aria-labelledby="ucd-t">
      <header><div class="tope"><div><span class="eti">MODALIDAD A DISTANCIA</span><h2 id="ucd-t">${solo ? 'Tu director de programa' : 'Directores de programa'}</h2><p>${solo ? esc(tuya) : 'Tus dudas sobre tus asignaturas y tu ruta, a tu director de programa.'}</p></div><button type="button" class="cerrar" aria-label="Cerrar">✕</button></div>
      ${solo ? '' : `<label class="buscar">${I.buscar}<span style="position:absolute;left:-9999px">Buscar carrera o director</span><input type="search" placeholder="Busca tu carrera o director" autocomplete="off"></label>
      <div class="filtros" role="group" aria-label="Filtrar por área"><button type="button" data-area="" aria-pressed="true">Todos</button>${AREAS.map((a) => `<button type="button" data-area="${esc(a)}" aria-pressed="false">${esc(a)}</button>`).join('')}</div>`}</header>
      <div class="lista ent" role="list">${pintar('', '', tuya, solo)}</div>
      <footer>${solo ? 'Escríbele desde tu correo institucional @continental.edu.pe. Indica tu nombre y tu código de estudiante.' : DIRECTORES.filter((d) => d.correo).length + ' directores · Escríbeles desde tu correo institucional @continental.edu.pe.'}</footer></div>`;
    document.body.appendChild(capa);
    const lista = capa.querySelector('.lista'), inp = capa.querySelector('input');
    setTimeout(() => lista.classList.remove('ent'), 700);
    const repintar = () => { lista.innerHTML = pintar(inp ? inp.value : '', area, tuya, solo); lista.scrollTop = 0; };
    inp && inp.addEventListener('input', repintar);
    capa.addEventListener('click', (e) => {
      if (e.target === capa || e.target.closest('.cerrar')) return cerrar();
      const f = e.target.closest('[data-area]');
      if (f) { area = f.dataset.area; capa.querySelectorAll('[data-area]').forEach((b) => b.setAttribute('aria-pressed', String(b === f))); return repintar(); }
      const b = e.target.closest('[data-copiar]');
      if (b) { const t = b.dataset.copiar; (navigator.clipboard ? navigator.clipboard.writeText(t) : Promise.reject()).then(() => { b.innerHTML = I.ok; b.classList.add('hecho'); b.title = 'Copiado'; setTimeout(() => { b.innerHTML = I.copiar; b.classList.remove('hecho'); b.title = 'Copiar correo'; }, 1600); }).catch(() => {}); }
    });
    document.addEventListener('keydown', tecla);
    requestAnimationFrame(() => { capa && capa.classList.add('on'); (inp || capa.querySelector('.cerrar')).focus(); });
  }
  UCP.directores = { lista: CARRERAS, directores: DIRECTORES, abrir };
  document.addEventListener('click', (e) => {
    const a = e.target.closest && e.target.closest('a[href$="#directores"],[data-directores]');
    if (!a) return;
    e.preventDefault();
    abrir(a.dataset.carrera || (UCP.carreraActual || ''), a.dataset.solo === '1');
  }, true);
})();
