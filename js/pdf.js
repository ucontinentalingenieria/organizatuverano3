/* PDF del portal (A4): "Resumen de tu simulación" (solicitud de apertura, con su horario si ya hay secciones)
   y "Mi ruta para culminar mis estudios". Sin información económica. Herramienta para revisarlos: herramientas/vista-pdf.html */
window.UCP = window.UCP || {};
(function () {
  // Paleta del Brand Book 2025: Negro, Blanco y Morado UC (#5A00AA); secundarios Lila (#9169FF), Celeste (#B9E1FF)
  // y Rosado (#FAAAFA). Grises neutros para texto secundario y líneas; verde y rojo solo para estados.
  const C = {
    tinta: [0, 0, 0], texto: [58, 58, 58], gris: [90, 90, 90], linea: [227, 227, 227],
    morado: [90, 0, 170], moradoOsc: [90, 0, 170], lila: [242, 242, 242], lilaTxt: [185, 225, 255],
    noche: [0, 0, 0], amarillo: [185, 225, 255], crema: [185, 225, 255], cafe: [0, 0, 0],
    verde: [20, 92, 52], verdeFondo: [232, 245, 236], rojo: [179, 38, 30]
  };
  // Colores de los cursos en el horario: combinaciones permitidas por el Brand Book (p. 27)
  const PALETA = [{ bg: [90, 0, 170], fg: [255, 255, 255] }, { bg: [0, 0, 0], fg: [255, 255, 255] }, { bg: [145, 105, 255], fg: [255, 255, 255] },
    { bg: [185, 225, 255], fg: [0, 0, 0] }, { bg: [250, 170, 250], fg: [0, 0, 0] }];
  const DIAS = ['', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
  const PEQUENAS = new Set(['de', 'del', 'la', 'las', 'el', 'los', 'y', 'e', 'o', 'u', 'en', 'a', 'al', 'para', 'con', 'por', 'sin']);
  const ROMANOS = /^(i|ii|iii|iv|v|vi|vii|viii|ix|x)$/i;

  // La fuente estándar del PDF solo tiene caracteres latinos: se reemplazan guiones largos, comillas tipográficas y emojis
  const L = (s) => String(s == null ? '' : s).replace(/[–—]/g, '-').replace(/[“”]/g, '"').replace(/[‘’]/g, "'").replace(/…/g, '...')
    .replace(/[^\x20-\x7E\xA0-\xFF]/g, '').replace(/\s+/g, ' ').trim();
  // Nombres de curso: si vienen en MAYÚSCULAS se pasan a título (conectores en minúscula); en todos los casos
  // los números romanos van en mayúscula ("Comportamiento Ii" → "Comportamiento II")
  const nombre = (s) => {
    const t = L(s), mayus = t === t.toUpperCase();
    return t.split(' ').map((w, i) => {
      if (i > 0 && ROMANOS.test(w.replace(/[^\p{L}]/gu, ''))) return w.toUpperCase();
      if (!mayus) return i === 0 ? w.charAt(0).toUpperCase() + w.slice(1) : w;
      const min = w.toLowerCase();
      return i > 0 && PEQUENAS.has(min) ? min : min.charAt(0).toUpperCase() + min.slice(1);
    }).join(' ');
  };
  // Fechas y horas según el Brand Book (pp. 83-84), con las mismas funciones del portal
  const fecha = (iso) => UCP.campana.fechaLarga(iso);
  const hora = (hhmm) => UCP.campana.hora(hhmm);
  const hoy = () => fecha(new Date().toISOString());
  const plural = (n, uno, varios) => `${n} ${n === 1 ? uno : varios}`;
  const verano = (periodo) => { const m = /^(\d{4})/.exec(String(periodo || '')); return m ? `Verano ${m[1]}` : 'Cursos de verano'; };

  // ---------- Base común: márgenes, tipografía, saltos de página y pie ----------
  function crear(orientacion) {
    const doc = new window.jspdf.jsPDF({ unit: 'mm', format: 'a4', orientation: orientacion || 'p' });
    const D = { doc, MX: 16, y: 0 };
    D.ancho = () => doc.internal.pageSize.getWidth();
    D.alto = () => doc.internal.pageSize.getHeight();
    D.util = () => D.ancho() - 2 * D.MX;
    D.limite = () => D.alto() - 22; // espacio reservado para el pie
    D.fuente = (tam, estilo, color) => { doc.setFont('helvetica', estilo || 'normal'); doc.setFontSize(tam); doc.setTextColor(...(color || C.texto)); };
    // Corta el texto al ancho con el tamaño y estilo con que se va a escribir
    D.lineas = (texto, ancho, tam = 9.5, estilo = 'normal') => { doc.setFont('helvetica', estilo); doc.setFontSize(tam); return doc.splitTextToSize(L(texto), ancho); };
    D.interlinea = (tam) => tam * 0.42;

    // Encabezado de la primera página: banda oscura con título, subtítulo y dato destacado a la derecha
    D.portada = function ({ titulo, subtitulo, etiquetaDer, valorDer, notaDer }) {
      const w = D.ancho();
      doc.setFillColor(...C.noche); doc.rect(0, 0, w, 36, 'F');
      doc.setFillColor(...C.morado); doc.rect(0, 36, w, 1.4, 'F');
      D.fuente(7.5, 'bold', C.lilaTxt); doc.text('UNIVERSIDAD CONTINENTAL  ·  MODALIDAD A DISTANCIA', D.MX, 11);
      D.fuente(18, 'bold', [255, 255, 255]); doc.text(L(titulo), D.MX, 21);
      D.fuente(9.5, 'normal', C.lilaTxt); doc.text(L(subtitulo), D.MX, 28.5);
      if (valorDer) {
        const x = w - D.MX;
        D.fuente(7.5, 'normal', C.lilaTxt); doc.text(L(etiquetaDer), x, 15, { align: 'right' });
        D.fuente(11.5, 'bold', C.amarillo); doc.text(L(valorDer), x, 21.5, { align: 'right' });
        if (notaDer) { D.fuente(8, 'normal', C.lilaTxt); doc.text(L(notaDer), x, 28.5, { align: 'right' }); }
      }
      D.tituloCorto = titulo; D.y = 46;
    };
    // Páginas siguientes: banda delgada para no perder el contexto
    D.nuevaPagina = function (orient) {
      doc.addPage('a4', orient || orientacion || 'p');
      doc.setFillColor(...C.noche); doc.rect(0, 0, D.ancho(), 13, 'F');
      doc.setFillColor(...C.morado); doc.rect(0, 13, D.ancho(), 0.9, 'F');
      D.fuente(9, 'bold', [255, 255, 255]); doc.text(L(D.tituloCorto), D.MX, 8.6);
      D.fuente(7.5, 'normal', C.lilaTxt); doc.text('Simulación de cursos de verano · Documento referencial', D.ancho() - D.MX, 8.6, { align: 'right' });
      D.y = 22;
    };
    D.asegurar = (alto) => { if (D.y + alto > D.limite()) D.nuevaPagina(); };

    D.seccion = function (titulo, ayuda) {
      D.asegurar(ayuda ? 22 : 16);
      D.y += 3;
      D.fuente(12, 'bold', C.moradoOsc); doc.text(L(titulo), D.MX, D.y);
      doc.setDrawColor(...C.linea); doc.setLineWidth(0.3); doc.line(D.MX, D.y + 2, D.MX + D.util(), D.y + 2);
      D.y += 7;
      if (ayuda) { D.fuente(8.5, 'normal', C.gris); D.lineas(ayuda, D.util(), 8.5).forEach((l) => { doc.text(l, D.MX, D.y); D.y += 3.8; }); D.y += 1.5; }
    };
    D.parrafo = function (texto, { tam = 9.5, estilo = 'normal', color = C.texto, sangria = 0, despues = 1.5 } = {}) {
      D.fuente(tam, estilo, color);
      D.lineas(texto, D.util() - sangria, tam, estilo).forEach((l) => { D.asegurar(D.interlinea(tam) + 1); doc.text(l, D.MX + sangria, D.y); D.y += D.interlinea(tam) + 0.6; });
      D.y += despues;
    };
    // Recuadro de aviso con título en negrita y texto ajustado al ancho
    D.aviso = function (titulo, texto, { fondo = C.crema, borde = C.morado, color = C.cafe } = {}) {
      const w = D.util(), cuerpo = D.lineas(texto, w - 10, 9), alto = 8 + cuerpo.length * 4.1 + 3;
      D.asegurar(alto + 2);
      doc.setFillColor(...fondo); doc.setDrawColor(...borde); doc.setLineWidth(0.6); doc.roundedRect(D.MX, D.y, w, alto, 2, 2, 'FD');
      doc.setFillColor(...borde); doc.rect(D.MX, D.y + 0.3, 1.6, alto - 0.6, 'F');
      D.fuente(10, 'bold', color); doc.text(L(titulo), D.MX + 6, D.y + 6.2);
      D.fuente(9, 'normal', color); cuerpo.forEach((l, i) => doc.text(l, D.MX + 6, D.y + 11.2 + i * 4.1));
      D.y += alto + 5;
    };
    // Pares etiqueta/valor en una columna (devuelve la altura usada)
    D.datos = function (pares, x, ancho, yIni) {
      let yy = yIni;
      pares.filter((p) => p && p[1]).forEach(([et, val]) => {
        D.fuente(7.5, 'normal', C.gris); doc.text(L(et).toUpperCase(), x, yy);
        D.fuente(9.5, 'normal', C.tinta);
        const ls = D.lineas(val, ancho, 9.5); D.fuente(9.5, 'normal', C.tinta); ls.forEach((l, i) => doc.text(l, x, yy + 4.3 + i * 4.1));
        yy += 4.3 + ls.length * 4.1 + 2.4;
      });
      return yy - yIni;
    };
    // Dos tarjetas lado a lado con título y pares etiqueta/valor
    D.tarjetas = function (izq, der) {
      const g = 6, w = (D.util() - g) / 2, xs = [D.MX, D.MX + w + g];
      const medir = (t) => 9 + t.pares.filter((p) => p && p[1]).reduce((s, [, v]) => s + 4.3 + D.lineas(v, w - 10, 9.5).length * 4.1 + 2.4, 0);
      const alto = Math.max(medir(izq), der ? medir(der) : 0) + 2;
      D.asegurar(alto + 3);
      [izq, der].forEach((t, i) => {
        if (!t) return;
        doc.setFillColor(...C.lila); doc.setDrawColor(...C.linea); doc.setLineWidth(0.3); doc.roundedRect(xs[i], D.y, w, alto, 2, 2, 'FD');
        D.fuente(8.5, 'bold', C.moradoOsc); doc.text(L(t.titulo), xs[i] + 5, D.y + 6);
        D.datos(t.pares, xs[i] + 5, w - 10, D.y + 11.5);
      });
      D.y += alto + 5;
    };
    D.barra = function (x, y, ancho, proporcion, alto = 3) {
      doc.setFillColor(...C.linea); doc.roundedRect(x, y, ancho, alto, alto / 2, alto / 2, 'F');
      const p = Math.max(0, Math.min(1, proporcion || 0));
      if (p > 0) { doc.setFillColor(...C.morado); doc.roundedRect(x, y, Math.max(alto, ancho * p), alto, alto / 2, alto / 2, 'F'); }
    };
    // Tabla con columnas de ancho fijo; cada celda puede tener texto principal y una segunda línea en gris
    // seccion: [título, ayuda] que se dibuja junto a la tabla para que no quede sola al final de una página
    D.tabla = function (columnas, filas, { resaltar = () => null, total, seccion } = {}) {
      const xs = []; let x = D.MX; columnas.forEach((c) => { xs.push(x); x += c.ancho; });
      const cabecera = () => {
        doc.setFillColor(...C.morado); doc.rect(D.MX, D.y, D.util(), 7.5, 'F');
        D.fuente(8, 'bold', [255, 255, 255]);
        columnas.forEach((c, i) => doc.text(L(c.titulo), c.alinear === 'right' ? xs[i] + c.ancho - 2.5 : xs[i] + 2.5, D.y + 5, { align: c.alinear === 'right' ? 'right' : 'left' }));
        D.y += 7.5;
      };
      const medidas = filas.map((f) => {
        const celdas = columnas.map((c, i) => {
          const v = f[i] || {}, principal = D.lineas(v.texto != null ? v.texto : v, c.ancho - 5, 9.2, v.negrita ? 'bold' : 'normal');
          return { principal, extra: v.extra ? D.lineas(v.extra, c.ancho - 5, 7.8) : [], negrita: v.negrita, color: v.color };
        });
        return { celdas, alto: Math.max(...celdas.map((c) => c.principal.length * 4.1 + c.extra.length * 3.6)) + 4.4 };
      });
      // Si la tabla completa cabe en una página, no se parte
      const altoSeccion = seccion ? 10 + (seccion[1] ? D.lineas(seccion[1], D.util(), 8.5).length * 3.8 + 1.5 : 0) : 0;
      const total_ = altoSeccion + 7.5 + medidas.reduce((s, m) => s + m.alto, 0) + (total ? 8 : 0);
      if (D.y + total_ > D.limite() && total_ < D.limite() - 30) D.nuevaPagina();
      if (seccion) D.seccion(...seccion);
      D.asegurar(18); cabecera();
      medidas.forEach(({ celdas, alto }, n) => {
        const f = filas[n];
        if (D.y + alto > D.limite()) { D.nuevaPagina(); cabecera(); }
        const fondo = resaltar(f, n) || (n % 2 ? C.lila : null);
        if (fondo) { doc.setFillColor(...fondo); doc.rect(D.MX, D.y, D.util(), alto, 'F'); }
        celdas.forEach((c, i) => {
          const col = columnas[i], xx = col.alinear === 'right' ? xs[i] + col.ancho - 2.5 : xs[i] + 2.5, op = { align: col.alinear === 'right' ? 'right' : 'left' };
          let yy = D.y + 4.9;
          D.fuente(9.2, c.negrita ? 'bold' : 'normal', c.color || C.tinta);
          c.principal.forEach((l) => { doc.text(l, xx, yy, op); yy += 4.1; });
          D.fuente(7.8, 'normal', C.gris);
          c.extra.forEach((l) => { doc.text(l, xx, yy - 0.4, op); yy += 3.6; });
        });
        doc.setDrawColor(...C.linea); doc.setLineWidth(0.2); doc.line(D.MX, D.y + alto, D.MX + D.util(), D.y + alto);
        D.y += alto;
      });
      if (total) {
        D.asegurar(9);
        doc.setFillColor(...C.lila); doc.rect(D.MX, D.y, D.util(), 8, 'F');
        D.fuente(9.5, 'bold', C.tinta); doc.text(L(total[0]), D.MX + 2.5, D.y + 5.4);
        doc.text(L(total[1]), D.MX + D.util() - 2.5, D.y + 5.4, { align: 'right' });
        D.y += 8;
      }
      D.y += 4;
    };
    // Línea de tiempo: fecha a la izquierda, paso a la derecha
    D.pasos = function (pasos) {
      const colF = 38, ancho = D.util() - colF - 8;
      pasos.forEach((p, i) => {
        const tit = D.lineas(p.titulo, ancho, 9.5, 'bold'), det = p.detalle ? D.lineas(p.detalle, ancho, 8.8) : [];
        const alto = tit.length * 4.3 + det.length * 3.9 + 4;
        D.asegurar(alto);
        const cx = D.MX + colF + 2.5;
        if (i < pasos.length - 1) { doc.setDrawColor(...C.linea); doc.setLineWidth(0.6); doc.line(cx, D.y + 1, cx, D.y + alto + 0.5); }
        doc.setFillColor(...(p.clave ? C.tinta : C.morado)); doc.circle(cx, D.y - 0.6, 1.6, 'F');
        D.fuente(8.5, 'bold', p.clave ? C.cafe : C.moradoOsc);
        D.lineas(p.fecha || '', colF - 3, 8.5, 'bold').forEach((l, k) => doc.text(l, D.MX, D.y + k * 3.8));
        D.fuente(9.5, 'bold', C.tinta); tit.forEach((l, k) => doc.text(l, cx + 5, D.y + k * 4.3));
        D.fuente(8.8, 'normal', C.texto); det.forEach((l, k) => doc.text(l, cx + 5, D.y + tit.length * 4.3 + k * 3.9));
        D.y += alto;
      });
      D.y += 2;
    };
    // Lista con viñetas
    D.vinetas = function (lista) {
      lista.filter(Boolean).forEach((t) => { D.asegurar(8); doc.setFillColor(...C.morado); doc.circle(D.MX + 1.2, D.y - 1.2, 0.7, 'F'); D.parrafo(t, { tam: 8.8, sangria: 4, despues: 1 }); });
      D.y += 2;
    };
    // Pie en todas las páginas: aviso, origen y numeración
    D.cerrar = function (aviso, archivo) {
      const n = doc.getNumberOfPages();
      for (let i = 1; i <= n; i++) {
        doc.setPage(i);
        const w = D.ancho(), h = D.alto();
        doc.setDrawColor(...C.linea); doc.setLineWidth(0.3); doc.line(D.MX, h - 15, w - D.MX, h - 15);
        D.fuente(7.5, 'normal', C.gris);
        doc.text(L(aviso), D.MX, h - 10.5);
        doc.text(`Organiza tu verano · Generado el ${hoy()}`, D.MX, h - 6.5);
        doc.text(`Página ${i} de ${n}`, w - D.MX, h - 6.5, { align: 'right' });
      }
      doc.save(archivo);
    };
    return D;
  }

  const disponible = () => { if (window.jspdf && window.jspdf.jsPDF) return true; alert('No se pudo cargar el generador de PDF. Revisa tu conexión e inténtalo otra vez.'); return false; };
  const datosEstudiante = (perfil) => [
    ['Estudiante', nombre(`${perfil.nombres} ${perfil.apellidos}`)],
    ['Correo institucional', perfil.correo],
    ['Carrera', perfil.carrera && perfil.carrera.nombre],
    ['Plan de estudios', perfil.plan && perfil.plan.nombre]
  ];
  // Tabla comparativa de escenarios de culminación de estudios
  function tablaEscenarios(D, escenarios, elegido, seccion) {
    D.tabla([{ titulo: 'Escenario', ancho: 50 }, { titulo: 'Culminación estimada', ancho: 42 }, { titulo: 'Qué significa', ancho: D.util() - 92 }],
      escenarios.map((e) => [
        { texto: e.etiqueta, negrita: true, extra: e === elegido ? 'El que elegiste en el portal' : '' },
        { texto: e.termina, negrita: !!e.acorta, color: e.acorta ? C.verde : C.tinta },
        { texto: (e.nota || '').replace(/\.$/, '') + '.' }
      ]), { resaltar: (f, n) => (escenarios[n] === elegido ? C.crema : null), seccion });
  }
  function bloqueAvance(D, avance) {
    if (!avance || !avance.total) return;
    const p = avance.aprobados / avance.total, w = D.util();
    D.asegurar(24);
    D.fuente(9.5, 'normal', C.tinta);
    D.doc.text(`${avance.aprobados} de ${avance.total} créditos aprobados`, D.MX, D.y);
    D.fuente(9.5, 'bold', C.moradoOsc); D.doc.text(`${Math.round(p * 100)} %`, D.MX + w, D.y, { align: 'right' });
    D.barra(D.MX, D.y + 2.5, w, p, 3.2);
    D.y += 10;
    const extra = [`Te faltan ${Math.max(0, avance.total - avance.aprobados)} créditos para culminar tus estudios`];
    if (avance.ciclo) extra.push(`${avance.ciclo}.° periodo del plan`);
    if (avance.porRecuperar) extra.push(plural(avance.porRecuperar, 'asignatura por recuperar', 'asignaturas por recuperar'));
    D.parrafo(extra.join(' · ') + '.', { tam: 8.8, color: C.gris, despues: 3 });
  }

  // =====================================================================
  // Resumen de tu simulación (solicitud de apertura)
  // =====================================================================
  UCP.pdfConstancia = function ({ perfil, solicitud, calendario, parametros, escenarios, campana, avance }) {
    if (!disponible()) return;
    const D = crear('p'), doc = D.doc, cp = campana || {}, max = parametros.creditos_max_verano;
    const ev = (k) => ((calendario && calendario.eventos) || []).find((e) => e.evento === k) || {};
    const TURNOS = (UCP.campana && UCP.campana.TURNOS) || {}, RANGO = (UCP.campana && UCP.campana.TURNO_RANGO) || {};
    const fase = cp.fase === 'horarios' ? 'horarios' : 'solicitudes';
    const cursos = solicitud.cursos || [], conSesiones = cursos.some((c) => (c.sesiones || []).length);

    D.portada({ titulo: 'Resumen de tu simulación', subtitulo: `Simulación de cursos de verano · ${verano(solicitud.periodo)} · Solicitud de apertura`,
      etiquetaDer: 'N.° de solicitud', valorDer: solicitud.id, notaDer: `Enviada el ${fecha(solicitud.fecha)}` });

    D.aviso('Este documento no es una matrícula',
      'Resume tu simulación y tu solicitud de apertura: no reserva vacante ni garantiza que el curso se abra. Cuando se confirmen los cursos, realiza tu matrícula oficial en el Portal del Estudiante, en las fechas del calendario académico.');

    const pref = ({ whatsapp: 'WhatsApp', llamada: 'Llamada telefónica', correo: 'Correo electrónico' })[(solicitud.contacto || {}).preferencia];
    D.tarjetas({ titulo: 'Tus datos', pares: datosEstudiante(perfil) },
      { titulo: 'Cómo te contactaremos', pares: [['Medio preferido', pref], ['Celular', (solicitud.contacto || {}).celular], ['Otro correo', (solicitud.contacto || {}).correo_alterno], ['También por', 'Tu correo institucional']] });

    D.tabla([
      { titulo: 'Curso', ancho: 86 }, { titulo: 'Créditos', ancho: 18, alinear: 'right' },
      { titulo: 'Turno o sección', ancho: 40 }, { titulo: 'Estado', ancho: D.util() - 144 }
    ], cursos.map((c) => {
      // Días con el mismo horario juntos: "Lun, Mié y Vie · 7:00 a. m. a 10:00 a. m."
      const grupos = new Map(); (c.sesiones || []).forEach((s) => { const k = `${hora(s.hora_inicio)} a ${hora(s.hora_fin)}`; if (!grupos.has(k)) grupos.set(k, []); grupos.get(k).push(DIAS[s.dia].slice(0, 3)); });
      const ses = [...grupos].map(([k, ds]) => `${ds.length > 1 ? ds.slice(0, -1).join(', ') + ' y ' + ds[ds.length - 1] : ds[0]} · ${k}`).join('; ');
      const turno = c.seccion ? { texto: `Sección ${c.seccion}`, extra: ses || 'Horario por publicar' }
        : TURNOS[c.turno] ? { texto: `Turno ${TURNOS[c.turno].toLowerCase()}`, extra: L(RANGO[c.turno] || '') } : { texto: 'Sin turno' };
      const abierto = c.estado === 'ofertado' || !!c.seccion;
      return [{ texto: nombre(c.nombre), negrita: true, extra: c.codigo }, { texto: String(c.creditos) }, turno,
        { texto: abierto ? 'Curso abierto' : 'Apertura solicitada', color: abierto ? C.verde : C.tinta }];
    }), { total: ['Total', `${solicitud.creditos} de ${max} créditos permitidos en verano`], seccion: ['Cursos de tu solicitud', fase === 'solicitudes'
      ? 'El turno es tu preferencia para la apertura: el horario final se publica después y ahí eliges tu sección.'
      : 'En los cursos abiertos figura la sección que elegiste; los demás siguen como solicitud de apertura.'] });


    const matricula = UCP.campana.rangoFechas(cp.matInicio, cp.matFin);
    const pasos = fase === 'horarios'
      ? [{ fecha: 'Ahora', titulo: 'Revisa tus cursos abiertos', detalle: 'En el portal verás qué cursos se abrieron y la sección que elegiste.' },
         { fecha: 'Antes de matricularte', titulo: 'Revisa tus pagos', detalle: 'Si tienes algún pendiente, regularízalo con Acompañamiento al estudiante.' },
         { fecha: matricula, titulo: 'Matrícula oficial en el Portal del Estudiante', detalle: 'Con estos cursos y secciones.', clave: true }]
      : [{ fecha: `Hasta el ${fecha(cp.cierre)}`, titulo: 'Puedes modificar o retirar tu solicitud', detalle: 'Desde el portal "Organiza tu verano". La mesa de ayuda podrá contactarte para orientarte.' },
         { fecha: fecha(cp.horarios), titulo: 'Publicación de horarios', detalle: 'Te avisaremos por correo qué cursos se abren. En esos cursos eliges tu sección en el portal.' },
         { fecha: matricula, titulo: 'Matrícula oficial en el Portal del Estudiante', detalle: 'En las fechas del calendario académico.', clave: true }];
    if (ev('inicio_clases').inicio) pasos.push({ fecha: fecha(ev('inicio_clases').inicio), titulo: 'Inicio de clases de los cursos de verano', detalle: ev('fin_clases').inicio ? `Hasta el ${fecha(ev('fin_clases').inicio)}.` : '' });
    D.asegurar(Math.min(80, 14 + pasos.length * 13));
    D.seccion('Qué sigue y fechas clave');
    D.pasos(pasos);

    if (avance) { D.asegurar(40); D.seccion('Tu avance'); bloqueAvance(D, avance); }
    if (escenarios && escenarios.length) {
      tablaEscenarios(D, escenarios, null, ['¿Cuándo podrías culminar tus estudios?', 'Estimación referencial: supone que apruebas cada periodo y depende de la oferta de cada verano. No es la fecha de titulación.'
        + (escenarios.some((e) => e.termina === 'Por confirmar') ? ' "Por confirmar": alguna asignatura de tu plan tiene requisitos por confirmar con la universidad.' : '')]);
    }
    D.asegurar(40); D.seccion('Ten en cuenta');
    D.vinetas([
      fase === 'solicitudes' ? 'Un curso de verano se abre si alcanza el mínimo de estudiantes: tu solicitud ayuda a decidir qué cursos abrir.' : '',
      `En verano puedes llevar hasta ${max} créditos, solo de asignaturas hasta el 6.° periodo de tu plan.`,
      'Las sesiones en vivo quedan grabadas: si dos de tus cursos coinciden en horario, igual puedes llevarlos.',
      `El costo de tus cursos lo ves en el simulador de costos del Portal del Estudiante${UCP.config && UCP.config.simuladorCostos ? ` (${UCP.config.simuladorCostos})` : ''}.`
    ]);
    if (conSesiones) horario(D, cursos);
    D.cerrar('Simulación de cursos de verano · Documento referencial: no reserva vacante ni confirma tu matrícula.', `resumen-simulacion-verano-${solicitud.id}.pdf`);
  };

  // Horario semanal (página horizontal), un color por curso
  function horario(D, cursos) {
    const doc = D.doc;
    D.nuevaPagina('l');
    D.fuente(14, 'bold', C.moradoOsc); doc.text('Mi horario de verano', D.MX, D.y + 2);
    D.fuente(8.8, 'normal', C.gris); doc.text('Sesiones en vivo de los cursos con sección elegida. Las sesiones quedan grabadas: una coincidencia no te impide llevar ambos cursos.', D.MX, D.y + 7.5);
    const conSes = cursos.filter((c) => (c.sesiones || []).length);
    const min = (s) => { const [a, b] = s.split(':').map(Number); return a + b / 60; };
    const todas = conSes.flatMap((c) => c.sesiones);
    const H0 = Math.max(0, Math.floor(Math.min(...todas.map((s) => min(s.hora_inicio))))), H1 = Math.min(24, Math.ceil(Math.max(...todas.map((s) => min(s.hora_fin)))));
    const ultimoDia = Math.max(6, ...todas.map((s) => s.dia)), nd = ultimoDia;
    const x0 = D.MX + 13, y0 = D.y + 18, w = (D.ancho() - x0 - D.MX) / nd, leyenda = 8 + Math.ceil(conSes.length / 2) * 6;
    const alto = (D.alto() - y0 - 24 - leyenda) / (H1 - H0);
    for (let d = 1; d <= nd; d++) {
      doc.setFillColor(...C.morado); doc.rect(x0 + (d - 1) * w, y0 - 7, w - 0.4, 7, 'F');
      D.fuente(8.5, 'bold', [255, 255, 255]); doc.text(DIAS[d], x0 + (d - 1) * w + w / 2, y0 - 2.4, { align: 'center' });
    }
    doc.setDrawColor(...C.linea); doc.setLineWidth(0.2);
    for (let h = H0; h <= H1; h++) {
      const yy = y0 + (h - H0) * alto; doc.line(x0, yy, x0 + nd * w, yy);
      D.fuente(7.5, 'normal', C.gris); doc.text(`${String(h).padStart(2, '0')}:00`, x0 - 2, yy + 1.2, { align: 'right' });
    }
    for (let d = 0; d <= nd; d++) doc.line(x0 + d * w, y0, x0 + d * w, y0 + (H1 - H0) * alto);
    conSes.forEach((c, i) => c.sesiones.forEach((s) => {
      const color = PALETA[i % PALETA.length];
      const bx = x0 + (s.dia - 1) * w + 0.7, by = y0 + (min(s.hora_inicio) - H0) * alto + 0.4, bh = (min(s.hora_fin) - min(s.hora_inicio)) * alto - 0.8;
      doc.setFillColor(...color.bg); doc.roundedRect(bx, by, w - 1.4, bh, 1.2, 1.2, 'F');
      D.fuente(7.5, 'bold', color.fg);
      const ls = D.lineas(nombre(c.nombre), w - 4, 7.5, 'bold').slice(0, Math.max(1, Math.floor((bh - 5) / 3.4)));
      ls.forEach((l, k) => doc.text(l, bx + 1.6, by + 3.8 + k * 3.4));
      D.fuente(7, 'normal', color.fg); if (bh > 8) doc.text(L(`${hora(s.hora_inicio)} a ${hora(s.hora_fin)}`), bx + 1.6, by + bh - 1.8);
    }));
    // Leyenda: color, curso, sección y créditos
    let ly = y0 + (H1 - H0) * alto + 7;
    const colW = (D.ancho() - 2 * D.MX) / 2;
    conSes.forEach((c, i) => {
      const lx = D.MX + (i % 2) * colW, yy = ly + Math.floor(i / 2) * 6;
      doc.setFillColor(...PALETA[i % PALETA.length].bg); doc.setDrawColor(...C.linea); doc.roundedRect(lx, yy - 3, 4, 4, 0.8, 0.8, 'FD');
      D.fuente(8.8, 'bold', C.tinta); doc.text(L(nombre(c.nombre)), lx + 6, yy);
      const wN = doc.getTextWidth(L(nombre(c.nombre)));
      D.fuente(8.5, 'normal', C.gris); doc.text(`  Sección ${c.seccion} · ${c.creditos} créditos`, lx + 6 + wN, yy);
    });
    const sinH = cursos.filter((c) => !(c.sesiones || []).length);
    if (sinH.length) { D.fuente(8.5, 'normal', C.texto); doc.text(L('Aún sin horario (solicitud de apertura): ' + sinH.map((c) => nombre(c.nombre)).join(', ') + '.'), D.MX, ly + Math.ceil(conSes.length / 2) * 6 + 1); }
  }

  // =====================================================================
  // Mi ruta para culminar mis estudios
  // =====================================================================
  UCP.pdfRuta = function ({ perfil, escenario, escenarios, nota, avance, maxVerano = 11 }) {
    if (!disponible()) return;
    const D = crear('p'), doc = D.doc, ruta = escenario.ruta || [];
    const veranos = ruta.filter((p) => p.tipo === 'verano').length, regulares = ruta.length - veranos;
    // Cursos pendientes que la proyección no pudo ubicar (por ejemplo, requisitos por confirmar)
    const enRuta = new Set(ruta.flatMap((p) => p.cursos.map((c) => c.codigo)));
    const sinUbicar = ((avance && avance.pendientes) || []).filter((c) => !enRuta.has(c.codigo));
    const egresa = escenario.termina !== 'Por confirmar' && !sinUbicar.length;
    D.portada({ titulo: 'Mi ruta para culminar mis estudios', subtitulo: `Simulación de cursos de verano · ${escenario.etiqueta}`, etiquetaDer: 'Culminación estimada', valorDer: escenario.termina });

    D.tarjetas({ titulo: 'Tus datos', pares: datosEstudiante(perfil) },
      { titulo: 'Tu escenario', pares: [['Escenario elegido', escenario.etiqueta], ['Culminación estimada', escenario.termina],
        ['Te faltan', `${sinUbicar.length ? 'Al menos ' : ''}${plural(regulares, 'periodo académico', 'periodos académicos')}${veranos ? ` y ${plural(veranos, 'verano', 'veranos')}` : ''}`],
        ['En resumen', (escenario.nota || '').replace(/\.$/, '')]] });

    if (sinUbicar.length) {
      D.aviso('La culminación de tus estudios está por confirmar',
        `${sinUbicar.length === 1 ? 'Esta asignatura no se pudo ubicar' : 'Estas asignaturas no se pudieron ubicar'} en tu ruta porque sus requisitos están por confirmar con la universidad: ${sinUbicar.map((c) => nombre(c.nombre)).join(', ')}. La ruta muestra el resto de tus asignaturas.`);
    }
    if (avance) { D.seccion('Tu avance'); bloqueAvance(D, avance); }
    if (escenarios && escenarios.length > 1) {
      tablaEscenarios(D, escenarios, escenarios.find((e) => e.n === escenario.n) || escenario, ['Compara tus escenarios', 'Con y sin cursos de verano, respetando los requisitos de cada curso.']);
    }

    D.seccion('Tu ruta periodo por periodo', 'Los cursos de verano dependen de la oferta y del mínimo de estudiantes de cada curso.');
    ruta.forEach((p, i) => {
      const ultimo = egresa && i === ruta.length - 1, esVerano = p.tipo === 'verano';
      const filas = p.cursos.map((c) => ({ n: D.lineas(nombre(c.nombre), D.util() - 52, 9.2), c }));
      const alto = 9 + filas.reduce((s, f) => s + f.n.length * 4.2 + 1, 0) + 2;
      D.asegurar(Math.min(alto, 60));
      const yIni = D.y;
      doc.setFillColor(...(esVerano ? C.crema : C.lila)); doc.setDrawColor(...(esVerano ? C.morado : C.linea)); doc.setLineWidth(0.4);
      doc.roundedRect(D.MX, D.y, D.util(), 8, 1.5, 1.5, 'FD');
      D.fuente(10, 'bold', esVerano ? C.cafe : C.moradoOsc); doc.text(L(p.etiqueta), D.MX + 3, D.y + 5.4);
      const etW = doc.getTextWidth(L(p.etiqueta));
      D.fuente(8.2, 'normal', C.gris); doc.text(esVerano ? `Cursos de verano (hasta ${maxVerano} créditos)` : 'Periodo académico', D.MX + 6 + etW, D.y + 5.4);
      if (ultimo) { D.fuente(8.5, 'bold', C.verde); doc.text('Culminas tus estudios', D.MX + D.util() - 28, D.y + 5.4, { align: 'right' }); }
      D.fuente(9, 'bold', C.tinta); doc.text(`${p.creditos} créditos`, D.MX + D.util() - 3, D.y + 5.4, { align: 'right' });
      D.y += 12;
      filas.forEach(({ n, c }) => {
        if (D.y + n.length * 4.2 > D.limite()) D.nuevaPagina();
        doc.setFillColor(...(esVerano ? C.tinta : C.morado)); doc.circle(D.MX + 4, D.y - 1.2, 0.8, 'F');
        D.fuente(9.2, 'normal', C.tinta); n.forEach((l, k) => doc.text(l, D.MX + 7.5, D.y + k * 4.2));
        D.fuente(7.8, 'normal', C.gris); doc.text(L(c.codigo), D.MX + D.util() - 20, D.y, { align: 'right' });
        D.fuente(9, 'normal', C.tinta); doc.text(String(c.creditos), D.MX + D.util() - 3, D.y, { align: 'right' });
        D.y += n.length * 4.2 + 1;
      });
      D.y += 3;
      if (D.y < yIni) D.y = yIni + alto;
    });

    const notas = [L(nota)];
    if (ruta.some((p) => p.cursos.some((c) => /por elegir/i.test(c.nombre)))) notas.push('Electivo (por elegir): eliges la asignatura del catálogo de electivos de tu plan.');
    notas.push('Las asignaturas son referenciales: podrían cambiar según la apertura de cursos de verano y tu avance en el plan de estudios. Tus dudas, consúltalas con tu director de programa.');
    notas.push('Para llevar un curso de verano debes tener aprobados todos sus requisitos. La matrícula oficial se realiza en el Portal del Estudiante.');
    D.asegurar(30); D.seccion('Ten en cuenta');
    D.vinetas(notas);

    D.cerrar('Simulación de cursos de verano · Documento referencial: no es la fecha de titulación ni una matrícula.', `ruta-culminacion-${escenario.n}-veranos-${new Date().toISOString().slice(0, 10)}.pdf`);
  };
})();
