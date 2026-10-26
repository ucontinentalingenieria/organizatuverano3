/* Adaptador: respuesta de la API de TI "Plan de estudios · Vida académica" → modelo del prototipo.
   Replica en JavaScript lo que hace el backend (app/PlanEstudios/PlanEstudiosNormalizer.php y RequisitoParser.php),
   para revisar en pantalla cómo encajan los datos de api-ejemplo/*.json.
   Agrega al selector de ingreso un estudiante por cada ejemplo de API (js/datos-api-ejemplo.js). */
window.UCP = window.UCP || {};
(function () {
  // Códigos de curso de cualquier plan: ASUC01113 (201910), 24UC00012 (202410), 309RMK103…
  const PATRON_CURSO = /^(?=[A-Z0-9]*\d)(?=[A-Z0-9]*[A-Z])[A-Z0-9]{6,12}$/;
  // Casillas electivas (no son cursos): ELECT ESP2, ELEC GEN 4, ELECT ESP1, ELEC04…
  const PATRON_CASILLA = /^ELECT?\s*(GEN|ESP)?\s*\d+$/i;
  const esCasilla = (codigo) => PATRON_CASILLA.test(codigo) || !PATRON_CURSO.test(codigo);
  const PATRON_CREDITOS = /^(\d+)\s*Cr[ée]d\.?\s*Aprobados$/iu;

  // CONFIRMAR: qué cursos del plan 201910 se dictan en verano lo carga Coordinación (tabla cursos_campana).
  // Supuesto de la sección 7.6 del contexto: Capital Humano y Tecnología Disruptiva sí; Proyecto Final no.
  // Dirección Estratégica y Conversation Class se marcan "sí" para mostrar sus candados por otros motivos.
  // Plan 202410 (todas las carreras usan los mismos códigos): cursos elegidos para mostrar cada caso de las capturas
  // (curso por recuperar, falta de créditos, requisito en curso, talleres, más créditos que el máximo…).
  // Plan 199820: sin prerrequisitos en la vista de TI, así que todo curso pendiente parece disponible.
  const CATALOGOS_VERANO = {
    201910: ['ASUC00414', 'ASUC01597', 'ASUC00226', 'ASUC01203'],
    202410: ['24UC00397', '24UC00398', '24UC00480', '24UC00758', '24UC00895',
      '24UC00301', '24UC00302', '24UC00501', '24UC00310', '24UC00263', '24UC00957', '24UC00013', '24UC00062', '24UC00079', // Derecho
      '24UC00417', '24UC00679', '24UC00770', '24UC00862', '24UC00865', '24UC00055', '24UC00075', // Psicología
      '24UC00294', '24UC00414', '24UC00678', '24UC00702', '24UC00069', '24UC00084', // Administración y Finanzas
      '24UC00118', '24UC00344', '24UC00458', '24UC00457', // Administración
      '24UC00058', '24UC00052', '24UC00063', '24UC00044', '24UC00080', // Ing. Empresarial
      '24UC00306', '24UC00365', '24UC00748'], // estudiantes de 7.° a 10.° periodo (asignaturas por recuperar o atrasadas)
    199820: ['309RMK101', '309RMK102', '309RMK110', '309RMK216', '309RMK218']
  };

  const PEQUENAS = new Set(['de', 'del', 'la', 'las', 'el', 'los', 'y', 'e', 'en', 'a', 'para', 'con', 'por']);
  // Conectores en minúscula y números romanos en mayúscula ("Derecho Constitucional II")
  const titulo = (s) => String(s || '').toLowerCase().split(/\s+/).map((w, i) => (i > 0 && /^(i|ii|iii|iv|v|vi|vii|viii|ix|x)$/.test(w) ? w.toUpperCase() : i > 0 && PEQUENAS.has(w) ? w : w.charAt(0).toUpperCase() + w.slice(1))).join(' ');

  // Mismas reglas que RequisitoParser.php (sección 7.3): todo es conjunción (Y).
  const parsearRequisitos = function (texto) {
    const r = { cursos: [], creditos_min: null, certificados: [], no_reconocidos: [] };
    // Se ignoran las partes sin letras ni números (en pantalla, la casilla electiva muestra un ícono)
    String(texto || '').split(';').map((x) => x.trim()).filter((x) => /[\p{L}\p{N}]/u.test(x)).forEach((parte) => {
      const m = PATRON_CREDITOS.exec(parte);
      if (PATRON_CURSO.test(parte)) { if (!r.cursos.includes(parte)) r.cursos.push(parte); }
      else if (m) r.creditos_min = Math.max(r.creditos_min || 0, +m[1]);
      else if (/^Certificado\b/iu.test(parte)) { if (!r.certificados.includes(parte)) r.certificados.push(parte); }
      else r.no_reconocidos.push(parte);
    });
    return r;
  };

  const adaptar = function (api) {
    const est = api.estudiante || {}, cr = api.creditos || {};
    const faltaElectivo = (k) => Math.max(0, ((cr[k] || {}).requeridos || 0) - ((cr[k] || {}).aprobados || 0));
    const catalogo = CATALOGOS_VERANO[String(api.plan_de_estudios)] || [];
    // Las casillas llegan con 0 créditos: los que faltan de cada tipo se reparten entre sus casillas en el orden
    // del plan (CONFIRMAR con la pestaña "Asignaturas electivas"). Misma regla que DatosMotor::desdePlan (PHP).
    const tipoCasilla = (k) => (/ESP/i.test(k) ? 'electivos_especialidad' : 'electivos_general');
    const casillas = { electivos_general: [], electivos_especialidad: [] };
    (api.periodos || []).forEach((per) => (per.asignaturas || []).forEach((a) => { const k = String(a.codigo).trim(); if (esCasilla(k)) casillas[tipoCasilla(k)].push(k); }));
    const creditosCasilla = (k) => { const lista = casillas[tipoCasilla(k)], n = lista.length, f = faltaElectivo(tipoCasilla(k)), i = lista.indexOf(k); return Math.floor(f / n) + (i < f % n ? 1 : 0); };
    const cursos = [], historial = [];
    let ultimoAprobado = 0;
    (api.periodos || []).forEach((per) => (per.asignaturas || []).forEach((a) => {
      const codigo = String(a.codigo).trim(), casilla = esCasilla(codigo), estado = String(a.estado || '').toLowerCase();
      const requisitos = casilla ? parsearRequisitos('') : parsearRequisitos(a.prerrequisito);
      const creditos = casilla ? creditosCasilla(codigo) : +a.creditos || 0;
      cursos.push({
        codigo, nombre: casilla ? (/ESP/i.test(codigo) ? 'Electivo de especialidad (por elegir)' : 'Electivo general (por elegir)') : titulo(a.asignatura),
        creditos, ciclo: +per.periodo_academico, caracter: String(a.tipo || '').toLowerCase() === 'electivo' ? 'electivo' : 'obligatorio',
        es_casilla: casilla, se_dicta_en_verano: !casilla && catalogo.includes(codigo), curso_clave: false,
        prerrequisitos: requisitos.cursos.map((k) => [k]), correquisitos: [], requisitos_especiales: [], requisitos
      });
      // La nota no se usa ni se guarda (sección 9.7).
      const h = (e) => historial.push({ codigo, nombre: titulo(a.asignatura), creditos, periodo: '', estado: e, numero_matricula: +a.veces_llevado || 0 });
      if (estado === 'aprobado' || estado === 'convalidado') { h('aprobado'); ultimoAprobado = Math.max(ultimoAprobado, +per.periodo_academico); }
      else if (estado === 'matriculado') h('matriculado');
      else if (estado === 'desaprobado' || (estado === 'pendiente' && +a.veces_llevado > 0)) h('desaprobado'); // CONFIRMAR: cómo muestra TI un desaprobado
    }));
    const ciclos = (api.periodos || []).length;
    const malla = { plan_id: String(api.plan_de_estudios), carrera_id: 'API', nombre: `Plan ${api.plan_de_estudios} · ${est.programa || ''}`, ciclos, creditos_totales: (cr.totales || {}).requeridos || 0, cursos };
    const oferta = { periodo: '2027-00', tipo: 'verano', publicacion: null,
      cursos: cursos.filter((c) => c.se_dicta_en_verano).map((c) => ({ codigo: c.codigo, nombre: c.nombre, creditos: c.creditos, estado: 'por_confirmar', aforo_minimo: 15, secciones: [] })) };
    const habilitacion = { habilitado: !!(est.habilitacion && est.habilitacion.habilitado), motivos: (est.habilitacion && est.habilitacion.motivos) || [], mensaje: null };
    const perfil = {
      id: est.codigo, correo: est.correo, nombres: est.nombres, apellidos: est.apellidos, estado: est.estado, modalidad: est.modalidad,
      carrera: { id: 'API', nombre: est.programa }, plan: { id: String(api.plan_de_estudios), nombre: 'Plan ' + api.plan_de_estudios },
      periodo_actual: est.periodo_actual,
      // CONFIRMAR: ciclo relativo (sección 16, pregunta 7). Supuesto: el siguiente al último con cursos aprobados.
      ciclo_relativo: est.ciclo_relativo || Math.max(1, Math.min(ultimoAprobado + 1, ciclos)),
      reincorporado: !!est.reincorporado,
      grado: api.grado_a_obtener, titulo: api.titulo_a_obtener, creditos: cr
    };
    const demo = api._demo || {};
    return { clave: demo.clave || 'api', titulo: demo.titulo || `Datos de la API de TI (ejemplo) · ${perfil.ciclo_relativo}.° periodo`, perfil, historial, habilitacion, malla, oferta };
  };

  UCP.adaptadorApi = { adaptar, parsearRequisitos, esCasilla, CATALOGOS_VERANO };
  const ejemplos = window.UC_API_EJEMPLOS || (window.UC_API_EJEMPLO ? [window.UC_API_EJEMPLO] : []);
  if (window.UC_PROTO) ejemplos.forEach((api) => { const p = adaptar(api); if (!UC_PROTO.perfiles.some((x) => x.clave === p.clave)) UC_PROTO.perfiles.push(p); });
})();
