/* =====================================================================
   Campaña de verano y registro de solicitudes.
   PROTOTIPO: se guarda en el navegador (localStorage), compartido entre el
   portal del estudiante y el panel. En el piloto, estas mismas funciones
   llamarán al backend (Supabase / Laravel).
   ===================================================================== */
window.UCP = window.UCP || {};
(function () {
  const KC = 'uc_proto_campana', KS = 'uc_proto_solicitudes';
  const C = {};
  C.FASES = {
    solicitudes: { t: 'Solicitudes abiertas', d: 'Los estudiantes solicitan la apertura de cursos. Aún no hay horarios.' },
    evaluacion: { t: 'Solicitudes cerradas · en evaluación', d: 'Coordinación decide qué cursos abrir y programa los horarios.' },
    horarios: { t: 'Horarios publicados', d: 'Los estudiantes eligen sección y luego realizan su matrícula oficial en el Portal del Estudiante.' }
  };
  C.ESTADOS_CURSO = { por_decidir: 'Por decidir', abierto: 'Abierto', no_abierto: 'No abierto' };
  C.SEGUIMIENTO = { pendiente: 'Pendiente', contactado: 'Contactado', orientado: 'Orientado', matriculado: 'Matriculado' };
  C.PREFERENCIAS = { whatsapp: 'WhatsApp', llamada: 'Llamada', correo: 'Correo' };
  // Horario tentativo que el estudiante prefiere para cada curso de su solicitud de apertura
  C.TURNOS = { manana: 'Mañana', tarde: 'Tarde', noche: 'Noche' };
  // Fechas y horas como indica el Brand Book 2025 (pp. 83-84): "13 de noviembre de 2026", "7:00 p. m."
  C.MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
  const partes = (iso) => String(iso).slice(0, 10).split('-').map(Number);
  C.fechaLarga = (iso, conAnio = true) => { if (!iso) return 'Por anunciar'; const [y, m, d] = partes(iso); return `${d} de ${C.MESES[m - 1]}${conAnio ? ' de ' + y : ''}`; };
  C.rangoFechas = (a, b) => {
    if (!a || !b) return 'Por anunciar';
    const [ya, ma, da] = partes(a), [yb, mb, db] = partes(b);
    if (ya === yb && ma === mb) return `${da} al ${db} de ${C.MESES[mb - 1]} de ${yb}`;
    return ya === yb ? `${da} de ${C.MESES[ma - 1]} al ${db} de ${C.MESES[mb - 1]} de ${yb}` : `${C.fechaLarga(a)} al ${C.fechaLarga(b)}`;
  };
  C.hora = (hhmm) => { const [h, m] = String(hhmm).split(':').map(Number); return `${h % 12 || 12}:${String(m || 0).padStart(2, '0')} ${h < 12 ? 'a. m.' : 'p. m.'}`; };
  C.rangoHoras = (a, b) => `${C.hora(a)} a ${C.hora(b)}`;
  // CONFIRMAR: rangos horarios de cada turno con Coordinación académica
  C.TURNO_RANGO = { manana: C.rangoHoras('08:00', '12:00'), tarde: C.rangoHoras('14:00', '18:00'), noche: C.rangoHoras('19:00', '22:00') };
  // Borrador de la selección (solo en este navegador): se recupera al volver y se borra al enviar o retirar
  const KB = (estId) => 'uc_proto_borrador_' + estId;
  C.leerBorrador = (estId) => { try { const v = JSON.parse(localStorage.getItem(KB(estId)) || 'null'); return Array.isArray(v) ? v : null; } catch (e) { return null; } };
  C.guardarBorrador = (estId, items) => { try { localStorage.setItem(KB(estId), JSON.stringify(items.map((i) => ({ codigo: i.codigo, seccion: i.seccion || null, turno: i.turno || null })))); } catch (e) {} };
  C.borrarBorrador = (estId) => { try { localStorage.removeItem(KB(estId)); } catch (e) {} };
  // Estudiantes que ingresaron y no tenían cursos de verano posibles (regla del periodo máximo). En el sistema real lo
  // registra el backend al armar el portal; aquí, en el navegador. Sin datos personales: código, programa y periodo.
  const KSO = 'uc_proto_sin_oferta';
  C.sinOferta = () => { try { return JSON.parse(localStorage.getItem(KSO) || '{}'); } catch (e) { return {}; } };
  C.registrarSinOferta = (perfil, completo) => { try { const t = C.sinOferta(); t[perfil.id] = { programa: (perfil.carrera || {}).nombre || '', periodo: perfil.ciclo_relativo, completo: !!completo, fecha: hoy() }; localStorage.setItem(KSO, JSON.stringify(t)); } catch (e) {} };
  C.SEGMENTOS = { egresar: 'Culminación anticipada', critico: 'Asignatura crítica pendiente', balancear: 'Puede balancear su carga', reincorporado: 'Reincorporado' };

  const DEF = () => ({ fase: 'solicitudes', inicio: '2026-10-26', cierre: '2026-11-13', horarios: '2026-11-20', matInicio: '2026-12-01', matFin: '2026-12-15', minimoDefecto: 15, carga: null, minimos: {}, cursos: {} });
  const hoy = () => new Date().toISOString();

  C.leer = () => { try { const d = DEF(), g = JSON.parse(localStorage.getItem(KC) || '{}'); return Object.assign(d, g); } catch (e) { return DEF(); } };
  C.guardar = (c) => localStorage.setItem(KC, JSON.stringify(c));
  // Carga por ciclo para los escenarios: la definida por Coordinación o, por defecto, el máximo del plan
  C.cargaPlan = (malla) => { const t = {}; malla.cursos.forEach((x) => { t[x.ciclo] = (t[x.ciclo] || 0) + x.creditos; }); return Math.max(...Object.values(t)); };
  C.carga = (c, malla) => c.carga || C.cargaPlan(malla);
  // Reglas de cursos que no se dictan en verano (inglés, talleres, electivos, candados manuales) y excepciones
  C.reglasVerano = (c) => JSON.parse(JSON.stringify(c.reglasVerano || UCP.reglasVerano.POR_DEFECTO));
  C.minimo = (c, codigo) => (c.minimos[codigo] != null ? c.minimos[codigo] : c.minimoDefecto);
  C.estadoCurso = (c, codigo) => (c.cursos[codigo] && c.cursos[codigo].estado) || 'por_decidir';
  C.seccionesCurso = (c, codigo) => (c.cursos[codigo] && c.cursos[codigo].secciones) || [];
  // Un curso abierto muestra su horario si la fase es "horarios" o si Coordinación lo publicó antes
  C.horarioPublicado = (c, codigo) => C.estadoCurso(c, codigo) === 'abierto' && C.seccionesCurso(c, codigo).length > 0 && (c.fase === 'horarios' || !!(c.cursos[codigo] && c.cursos[codigo].publicado));
  C.guardarSecciones = (codigo, secciones) => { const c = C.leer(); c.cursos[codigo] = Object.assign({ estado: 'por_decidir' }, c.cursos[codigo], { secciones }); if (!secciones.length) c.cursos[codigo].publicado = false; C.guardar(c); };

  // ---------- Solicitudes ----------
  C.solicitudes = function () {
    let s = null;
    try { s = JSON.parse(localStorage.getItem(KS) || 'null'); } catch (e) { s = null; }
    if (!s) { s = semilla(); localStorage.setItem(KS, JSON.stringify(s)); }
    return s;
  };
  const guardarTodas = (s) => localStorage.setItem(KS, JSON.stringify(s));
  C.vigentes = () => C.solicitudes().filter((x) => x.estado === 'vigente');
  C.solicitudDe = (estId) => C.vigentes().find((x) => x.estudiante.id === estId) || null;

  C.guardarSolicitud = function (datos) {
    const todas = C.solicitudes();
    const i = todas.findIndex((x) => x.estudiante.id === datos.estudiante.id && x.estado === 'vigente');
    const previa = i >= 0 ? todas[i] : null;
    const reg = Object.assign({}, previa || {}, datos, {
      id: previa ? previa.id : 'SV-2027-' + String(Math.floor(100000 + Math.random() * 899999)),
      fecha: hoy(), estado: 'vigente',
      seguimiento: previa ? previa.seguimiento : { estado: 'pendiente', notas: '', historial: [] }
    });
    reg.seguimiento.historial = reg.seguimiento.historial.concat([{ fecha: hoy(), accion: previa ? 'Solicitud de apertura modificada por el estudiante' : 'Solicitud de apertura recibida', usuario: 'Estudiante' }]);
    if (i >= 0) todas[i] = reg; else todas.push(reg);
    guardarTodas(todas);
    return { ok: true, id: reg.id, fecha: reg.fecha };
  };
  C.retirar = function (estId) {
    const todas = C.solicitudes(), r = todas.find((x) => x.estudiante.id === estId && x.estado === 'vigente');
    if (r) { r.estado = 'retirada'; r.seguimiento.historial.push({ fecha: hoy(), accion: 'Solicitud retirada por el estudiante', usuario: 'Estudiante' }); guardarTodas(todas); }
  };
  C.actualizarSeguimiento = function (id, cambios, usuario, accion) {
    const todas = C.solicitudes(), r = todas.find((x) => x.id === id); if (!r) return;
    Object.assign(r.seguimiento, cambios);
    if (accion) r.seguimiento.historial.push({ fecha: hoy(), accion, usuario });
    guardarTodas(todas);
  };

  // Demanda por curso (solicitudes vigentes)
  C.demanda = function () {
    const d = {}; C.vigentes().forEach((s) => s.cursos.forEach((c) => { d[c.codigo] = (d[c.codigo] || 0) + 1; })); return d;
  };
  // Turno preferido por curso (mañana, tarde, noche; "sin" = eligió sección o no indicó turno), para programar secciones.
  // Acepta la lista ya filtrada por facultad o programa; por defecto, todas las vigentes.
  C.demandaPorTurno = function (lista) {
    const d = {};
    (lista || C.vigentes()).filter((s) => s.estado === 'vigente').forEach((s) => s.cursos.forEach((c) => {
      const t = d[c.codigo] || (d[c.codigo] = { manana: 0, tarde: 0, noche: 0, sin: 0 });
      t[C.TURNOS[c.turno] ? c.turno : 'sin']++;
    }));
    return d;
  };

  // Coordinación cambia el estado de un curso: se registra el correo automático a los solicitantes
  C.decidirCurso = function (codigo, estado, secciones, usuario) {
    const c = C.leer(); c.cursos[codigo] = Object.assign({}, c.cursos[codigo], { estado, secciones: secciones || C.seccionesCurso(c, codigo) }); if (estado !== 'abierto') c.cursos[codigo].publicado = false; C.guardar(c);
    if (estado === 'por_decidir') return 0;
    const todas = C.solicitudes(); let n = 0;
    todas.filter((s) => s.estado === 'vigente' && s.cursos.some((x) => x.codigo === codigo)).forEach((s) => {
      const nombre = (s.cursos.find((x) => x.codigo === codigo) || {}).nombre || codigo;
      s.seguimiento.historial.push({ fecha: hoy(), accion: `Correo automático: ${nombre} ${estado === 'abierto' ? 'se abrió' : 'no se abrió'}`, usuario: 'Sistema' }); n++;
    });
    guardarTodas(todas); return n;
  };

  // Publicar (o despublicar) el horario de un curso antes de la fase de horarios
  C.publicarHorario = function (codigo, publicar) {
    const c = C.leer(), cur = c.cursos[codigo];
    if (!cur || cur.estado !== 'abierto' || !(cur.secciones || []).length) return -1;
    cur.publicado = !!publicar; C.guardar(c);
    if (!publicar) return 0;
    const todas = C.solicitudes(); let n = 0;
    todas.filter((s) => s.estado === 'vigente' && s.cursos.some((x) => x.codigo === codigo)).forEach((s) => {
      const nombre = (s.cursos.find((x) => x.codigo === codigo) || {}).nombre || codigo;
      s.seguimiento.historial.push({ fecha: hoy(), accion: `Correo automático: se publicó el horario de ${nombre}`, usuario: 'Sistema' }); n++;
    });
    guardarTodas(todas); return n;
  };

  // Catálogo de cursos (plan de ejemplo + cursos de Administración del panel)
  let _cat = null;
  C.curso = (k) => { if (!_cat) { _cat = {}; ((window.UC_PROTO && UC_PROTO.malla.cursos) || []).concat((window.UC_PANEL && UC_PANEL.cursosExtra) || []).forEach((x) => { _cat[x.codigo] = x; }); } return _cat[k] || { codigo: k, nombre: k, creditos: 0, ciclo: '-' }; };
  C.programaDe = (s) => s.estudiante.programa || s.estudiante.carrera || '';
  C.facultadDe = (s) => { const p = window.UC_PANEL && UC_PANEL.programas.find((x) => x.nombre === C.programaDe(s)); return p ? p.facultad : ''; };

  // Asignación y actualización masiva (mesa de ayuda)
  C.actualizarVarios = function (ids, cambios, usuario, accion) {
    const todas = C.solicitudes(), set = new Set(ids); let n = 0;
    todas.forEach((r) => { if (set.has(r.id)) { Object.assign(r.seguimiento, cambios); if (accion) r.seguimiento.historial.push({ fecha: hoy(), accion, usuario }); n++; } });
    guardarTodas(todas); return n;
  };

  C.reiniciar = function () { localStorage.removeItem(KC); localStorage.removeItem(KS); const claves = []; for (let i = 0; i < localStorage.length; i++) claves.push(localStorage.key(i)); claves.filter((k) => k && (k.startsWith('uc_proto_solicitud_') || k.startsWith('uc_proto_borrador_'))).forEach((k) => localStorage.removeItem(k)); };

  // ---------- Solicitudes ficticias para la demostración (por facultad y programa) ----------
  function semilla() {
    const P = window.UC_PROTO, X = window.UC_PANEL; if (!P || !X) return [];
    let r = 20271;
    const azar = () => { r = (r * 16807) % 2147483647; return r / 2147483647; };
    const elegirPeso = (lista, peso) => { const t = lista.reduce((a, x, i) => a + peso(x, i), 0); let v = azar() * t; for (let i = 0; i < lista.length; i++) { v -= peso(lista[i], i); if (v <= 0) return lista[i]; } return lista[0]; };
    const N = ['ANA', 'LUIS', 'CARLA', 'JORGE', 'ROSA', 'DIEGO', 'LUCÍA', 'MARCO', 'PAOLA', 'RAÚL', 'SOFÍA', 'IVÁN', 'ELENA', 'HUGO', 'NORA', 'PABLO', 'VALERIA', 'ÓSCAR', 'GIULIANA', 'RENZO', 'FIORELLA', 'KEVIN', 'MILAGROS', 'ALONSO', 'CAMILA', 'FRANCO', 'JIMENA', 'GERSON'];
    const A = ['QUISPE', 'MAMANI', 'FLORES', 'TORRES', 'ROJAS', 'HUAMÁN', 'CHÁVEZ', 'VARGAS', 'MENDOZA', 'RAMOS', 'CASTILLO', 'PAREDES', 'SALAZAR', 'GUTIÉRREZ', 'CÁRDENAS', 'POMA', 'ESPINOZA', 'NÚÑEZ', 'CAMPOS', 'LEÓN'];
    const prefs = ['whatsapp', 'whatsapp', 'whatsapp', 'whatsapp', 'llamada', 'correo'];
    const segs = ['pendiente', 'pendiente', 'pendiente', 'pendiente', 'pendiente', 'pendiente', 'contactado', 'contactado', 'orientado', 'orientado'];
    const agentes = [null, null, null, 'Ana Torres', 'Rosa Vega', 'Miguel Paz'];
    const out = [];
    for (let k = 1; k <= 520; k++) {
      const prog = elegirPeso(X.programas, (p) => p.peso);
      const nom = N[Math.floor(azar() * N.length)], ap = A[Math.floor(azar() * A.length)] + ' ' + A[Math.floor(azar() * A.length)];
      const cursos = new Map(), n = 1 + Math.floor(azar() * 3); let cr = 0;
      for (let j = 0; j < 12 && cursos.size < n; j++) {
        const cod = elegirPeso(prog.cursos, (x, i) => 1 / (1 + i * 0.35)), c = C.curso(cod);
        if (!cursos.has(cod) && cr + c.creditos <= 11) { cursos.set(cod, { codigo: cod, nombre: c.nombre, creditos: c.creditos, seccion: null, sesiones: [], turno: ['noche', 'noche', 'tarde', 'manana', 'noche'][(k * 7 + j) % 5] }); cr += c.creditos; }
      }
      const d = Math.floor(azar() * 19), dia = 26 + d, fecha = dia <= 31 ? `2026-10-${dia}T${String(8 + Math.floor(azar() * 14)).padStart(2, '0')}:00:00Z` : `2026-11-${String(dia - 31).padStart(2, '0')}T${String(8 + Math.floor(azar() * 14)).padStart(2, '0')}:00:00Z`;
      const reinc = azar() < 0.08, segmento = reinc ? 'reincorporado' : elegirPeso([['egresar', 40], ['critico', 25], ['balancear', 27]], (x) => x[1])[0];
      const seg = segs[Math.floor(azar() * segs.length)], asignado = seg === 'pendiente' ? agentes[Math.floor(azar() * agentes.length)] : agentes[3 + Math.floor(azar() * 3)];
      const hist = [{ fecha, accion: 'Solicitud de apertura recibida', usuario: 'Estudiante' }];
      if (asignado) hist.push({ fecha, accion: `Asignado a ${asignado}`, usuario: 'Coordinación' });
      if (seg !== 'pendiente') hist.push({ fecha, accion: 'Contacto por WhatsApp', usuario: asignado || 'Mesa de ayuda' });
      out.push({
        id: 'SV-2027-' + String(400000 + k * 731), fecha, estado: 'vigente', autorizacion_datos: true,
        estudiante: { id: 'DEMO-' + String(k).padStart(4, '0'), nombres: nom, apellidos: ap, correo: `estudiante${String(k).padStart(4, '0')}.demo@continental.edu.pe`, carrera: prog.nombre, programa: prog.nombre, facultad: prog.facultad, ciclo: 2 + Math.floor(azar() * 8), reincorporado: reinc, segmento },
        contacto: { celular: '51 9' + String(10 + Math.floor(azar() * 89)) + ' ' + String(100 + Math.floor(azar() * 899)) + ' ' + String(100 + Math.floor(azar() * 899)), preferencia: prefs[Math.floor(azar() * prefs.length)] },
        cursos: [...cursos.values()], creditos: cr,
        seguimiento: { estado: seg, notas: '', asignado, historial: hist }
      });
    }
    return out;
  }

  // Celular de ejemplo para los 3 estudiantes del portal
  C.celularDemo = (estId) => ({ E0000001: '51 987 654 321', E0000002: '51 912 345 678', E0000003: '51 945 678 123', E0000004: '51 956 321 478' }[estId] || '');

  UCP.campana = C;
})();
