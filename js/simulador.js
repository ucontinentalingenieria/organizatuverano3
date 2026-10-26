/* Reglas del simulador (sección "Reglas del simulador" del contrato de API). */
window.UCP = window.UCP || {};
(function () {
  const S = {};
  S.preparar = function ({ malla, historial, oferta, parametros }) {
    const cursos = {}; malla.cursos.forEach((c) => { cursos[c.codigo] = c; });
    const aprob = new Set(), enCurso = new Set(), desap = new Set();
    historial.cursos.forEach((h) => {
      if (h.estado === 'aprobado' || h.estado === 'convalidado') aprob.add(h.codigo);
      else if (h.estado === 'matriculado') enCurso.add(h.codigo);
      else if (h.estado === 'desaprobado') desap.add(h.codigo);
    });
    aprob.forEach((k) => desap.delete(k));
    const credAprob = [...aprob].reduce((s, k) => s + (cursos[k] ? cursos[k].creditos : 0), 0);
    const credEnCurso = [...enCurso].reduce((s, k) => s + (cursos[k] ? cursos[k].creditos : 0), 0);
    return { malla, cursos, oferta, parametros, aprob, enCurso, desap, credAprob, credEnCurso, credFaltan: malla.creditos_totales - credAprob };
  };
  S.estadoCurso = (M, k) => M.aprob.has(k) ? 'aprobado' : M.enCurso.has(k) ? 'en_curso' : M.desap.has(k) ? 'desaprobado' : 'pendiente';
  S.dependientes = function (M, k) {
    const hijos = {}; M.malla.cursos.forEach((c) => (c.prerrequisitos || []).flat().forEach((p) => { (hijos[p] ||= new Set()).add(c.codigo); }));
    const v = new Set(), st = [k]; while (st.length) { const x = st.pop(); (hijos[x] || []).forEach((h) => { if (!v.has(h)) { v.add(h); st.push(h); } }); }
    return v.size;
  };
  // Disponibilidad de un curso de verano: disponible | condicional | bloqueado
  // Además de los cursos prerrequisito, considera los requisitos interpretados de la API de TI:
  // créditos aprobados mínimos, certificados y textos no reconocidos (estos nunca se ofrecen).
  // Requisito "uno de estos" (21/10/2026, CONFIRMAR con TI): si alguno de los cursos que pide no está en el plan
  // del estudiante (electivos del catálogo, como en Investigación académica), basta con aprobar uno. En la ruta
  // también lo cumple una casilla de electivo general ya ubicada: el estudiante elegirá uno de esos electivos.
  S.esUnoDeEstos = (M, c) => (c.prerrequisitos || []).flat().some((k) => !M.cursos[k]);
  S.cumpleCursos = function (M, c, hechos) {
    const req = (c.prerrequisitos || []).flat();
    if (!S.esUnoDeEstos(M, c)) return req.every((k) => hechos.has(k));
    return req.some((k) => hechos.has(k)) || [...hechos].some((k) => M.cursos[k] && M.cursos[k].es_casilla && !/ESP/i.test(k));
  };
  S.disponibilidad = function (M, codigo) {
    const c = M.cursos[codigo]; if (!c) return { tipo: 'bloqueado', faltan: [], motivos: ['No está en tu plan de estudios'] };
    const req = (c.prerrequisitos || []).flat(), unoDeEstos = S.esUnoDeEstos(M, c);
    const faltan = unoDeEstos ? [] : req.filter((p) => !M.aprob.has(p));
    const rq = c.requisitos || {}, motivos = [];
    if (unoDeEstos && !S.cumpleCursos(M, c, M.aprob)) motivos.push(`Necesitas aprobar uno de estos cursos: ${req.map((k) => (M.cursos[k] ? M.cursos[k].nombre : k)).join(', ')}`);
    if (rq.creditos_min && M.credAprob < rq.creditos_min) motivos.push(`Necesitas ${rq.creditos_min} créditos aprobados (tienes ${M.credAprob})`);
    (rq.certificados || []).filter((x) => !(M.certificados && M.certificados.has(x))).forEach((x) => motivos.push(`Requiere ${x} (no podemos verificarlo aquí)`));
    (rq.no_reconocidos || []).forEach((x) => motivos.push(`Requisito por revisar con tu coordinación: ${x}`));
    if (!faltan.length && !motivos.length) return { tipo: 'disponible', faltan: [], motivos };
    if (faltan.length && !motivos.length && faltan.every((p) => M.enCurso.has(p))) return { tipo: 'condicional', faltan, motivos };
    return { tipo: 'bloqueado', faltan, motivos };
  };
  S.clasificarOferta = function (M) {
    return M.oferta.cursos.filter((o) => !M.aprob.has(o.codigo) && !M.enCurso.has(o.codigo)).map((o) => {
      const c = M.cursos[o.codigo] || {}, d = S.disponibilidad(M, o.codigo);
      const prioridad = M.desap.has(o.codigo) ? 0 : c.curso_clave ? 1 : 2;
      return Object.assign({}, o, { ciclo: c.ciclo, curso_clave: !!c.curso_clave, recuperacion: M.desap.has(o.codigo), disponibilidad: d, prioridad });
    }).sort((a, b) => a.prioridad - b.prioridad || a.ciclo - b.ciclo || a.nombre.localeCompare(b.nombre));
  };
  const minutos = (h) => { const [a, b] = h.split(':').map(Number); return a * 60 + b; };
  S.cruces = function (items) {
    const ses = []; items.forEach((i) => (i.sesiones || []).forEach((s) => ses.push({ i, s })));
    const out = [];
    for (let a = 0; a < ses.length; a++) for (let b = a + 1; b < ses.length; b++) {
      const x = ses[a], y = ses[b];
      if (x.i.codigo !== y.i.codigo && x.s.dia === y.s.dia && minutos(x.s.hora_inicio) < minutos(y.s.hora_fin) && minutos(y.s.hora_inicio) < minutos(x.s.hora_fin))
        out.push([x.i.codigo, y.i.codigo, x.s.dia]);
    }
    return out;
  };
  // Agrupa los cruces por par de cursos: [{a, b, dias:[1,3,5]}]
  S.paresCruce = function (cruces) {
    const m = new Map();
    cruces.forEach(([a, b, d]) => { const k = [a, b].sort().join('|'); if (!m.has(k)) m.set(k, { a, b, dias: [] }); if (!m.get(k).dias.includes(d)) m.get(k).dias.push(d); });
    return [...m.values()];
  };
  // Validaciones de la selección. Los cruces de horario NO bloquean: en la modalidad
  // a distancia las sesiones en vivo se graban y la asistencia no es obligatoria.
  S.validar = function (M, sel, habilitacion, fase) {
    const items = [...sel.values()];
    const creditos = items.reduce((s, i) => s + i.creditos, 0), max = M.parametros.creditos_max_verano;
    const cruces = S.cruces(items), pares = S.paresCruce(cruces);
    const conSec = items.filter((i) => i.conSecciones), sinPub = items.filter((i) => !i.conSecciones), sinSeccion = conSec.filter((i) => !i.seccion);
    // En la fase de solicitudes, cada curso sin horario publicado lleva un turno tentativo (mañana, tarde o noche)
    const sinTurno = fase === 'solicitudes' ? sinPub.filter((i) => !i.turno) : [];
    const v = [
      { ok: items.length > 0, texto: items.length ? `${items.length} ${items.length === 1 ? 'curso' : 'cursos'} en tu solicitud` : 'Elige al menos un curso', bloquea: !items.length },
      { ok: creditos <= max, texto: `${creditos} de ${max} créditos permitidos en verano`, bloquea: creditos > max },
      { ok: true, texto: 'Cumples los prerrequisitos de todos tus cursos' },
      conSec.length ? { ok: true, aviso: sinSeccion.length > 0, texto: sinSeccion.length ? `Falta elegir sección en ${sinSeccion.length} ${sinSeccion.length === 1 ? 'curso' : 'cursos'} con horario publicado` : 'Elegiste sección en tus cursos con horario publicado' } : null,
      fase === 'solicitudes' && sinPub.length ? { ok: !sinTurno.length, texto: sinTurno.length ? `Elige el turno tentativo (mañana, tarde o noche) en ${sinTurno.length} ${sinTurno.length === 1 ? 'curso' : 'cursos'}` : 'Elegiste el turno tentativo de tus cursos', bloquea: sinTurno.length > 0 } : null,
      sinPub.length ? { ok: true, aviso: true, texto: fase === 'horarios' ? `${sinPub.length} ${sinPub.length === 1 ? 'curso no tiene' : 'cursos no tienen'} horario publicado` : `${sinPub.length} ${sinPub.length === 1 ? 'curso tiene' : 'cursos tienen'} el horario por publicar` } : null,
      pares.length ? { ok: true, aviso: true, texto: `${pares.length} ${pares.length === 1 ? 'coincidencia' : 'coincidencias'} de sesiones en vivo: quedan grabadas` } : null,
      { ok: habilitacion.habilitado, texto: habilitacion.habilitado ? 'Estás habilitado para matricularte' : 'Tienes un impedimento de matrícula', bloquea: !habilitacion.habilitado }
    ].filter(Boolean);
    return { creditos, max, cruces, pares, validaciones: v, puedeEnviar: !v.some((x) => x.bloquea) };
  };

  // Escenarios de culminación de estudios con 0, 1, 2… veranos consecutivos desde el próximo: todos los que sirvan para terminar la carrera.
  S.ANIOS_PROYECCION = 10;
  // Supone que aprueba cada periodo; respeta prerrequisitos; hasta `carga` créditos
  // por ciclo y `maxVerano` por verano (solo cursos que pueden dictarse en verano).
  S.escenarios = function (M, opciones) {
    const carga = opciones.carga || 21, maxV = M.parametros.creditos_max_verano, cicloAct = opciones.cicloActual, anio0 = opciones.anio || 2027;
    const cursos = M.malla.cursos.slice().sort((a, b) => a.ciclo - b.ciclo || a.codigo.localeCompare(b.codigo));
    const proyectar = (nVeranos) => {
      const hechos = new Set([...M.aprob, ...M.enCurso]);
      let pend = cursos.filter((c) => !hechos.has(c.codigo));
      // ciclo = último periodo del plan ya cursado (con el periodo cerrado, el relativo es el siguiente que llevará)
      let ciclo = cicloAct - 1, usados = 0, credReg = [], fin = null;
      const ruta = [];
      for (let a = anio0; a < anio0 + S.ANIOS_PROYECCION && pend.length; a++) {
        for (const tipo of ['verano', 'I', 'II']) {
          if (!pend.length) break;
          if (tipo === 'verano' && (a - anio0) >= nVeranos) continue;
          const cap = tipo === 'verano' ? maxV : carga, previos = new Set(hechos), tom = []; let u = 0;
          const credPrev = [...previos].reduce((s, k) => s + (M.cursos[k] ? M.cursos[k].creditos : 0), 0);
          for (const c of pend) {
            // Verano de la campaña actual: solo la oferta de Coordinación. Veranos siguientes (su oferta aún no existe):
            // cualquier curso del plan que no excluyan las reglas de verano. Supuesto referencial (18/10/2026).
            if (tipo === 'verano' && !(a === anio0 ? c.se_dicta_en_verano : !c.es_casilla && !c.motivo_no_verano)) continue;
            // En verano no se proyecta un curso con certificado que no podemos verificar (no podría solicitarlo)
            if (tipo === 'verano' && ((c.requisitos && c.requisitos.certificados) || []).some((x) => !(M.certificados && M.certificados.has(x)))) continue;
            if (!S.cumpleCursos(M, c, previos)) continue;
            if (c.requisitos && c.requisitos.creditos_min && credPrev < c.requisitos.creditos_min) continue;
            if (u + c.creditos > cap) continue;
            tom.push(c); u += c.creditos;
          }
          tom.forEach((c) => hechos.add(c.codigo)); pend = pend.filter((c) => !tom.includes(c));
          if (tom.length) ruta.push({ tipo, anio: a, etiqueta: tipo === 'verano' ? 'Verano ' + a : S.codigoPeriodo(a, tipo), cursos: tom.map((c) => ({ codigo: c.codigo, nombre: c.nombre, creditos: c.creditos })), creditos: u });
          if (tipo === 'verano') { if (tom.length) usados++; } else { ciclo++; credReg.push(u); }
          if (!pend.length) fin = tipo === 'verano' ? { tipo, anio: a, ciclo } : { tipo, anio: a, ciclo, periodo: S.codigoPeriodo(a, tipo) };
        }
      }
      return { fin, usados, ruta, ciclosRestantes: credReg.length, promedio: credReg.length ? Math.round(credReg.reduce((x, y) => x + y, 0) / credReg.length) : 0 };
    };
    const out = [];
    // Tantos veranos como sirvan para terminar la carrera (decisión del 18/10/2026), dentro del horizonte
    for (let n = 0; n <= S.ANIOS_PROYECCION; n++) {
      const r = proyectar(n);
      if (n > 0 && r.usados < n) break;               // ese verano ya no haría falta
      const base = out[0];
      const etiqueta = n === 0 ? 'Sin veranos' : `Con ${n} ${n === 1 ? 'verano' : 'veranos'} (${n === 1 ? anio0 : n === 2 ? `${anio0} y ${anio0 + 1}` : `${anio0} a ${anio0 + n - 1}`})`;
      const termina = !r.fin ? 'Por confirmar' : r.fin.tipo === 'verano' ? `Verano ${r.fin.anio} · tras el ${r.fin.ciclo}.° periodo` : `${r.fin.periodo} · ${r.fin.ciclo}.° periodo`;
      const ahorro = base ? base.ciclosRestantes - r.ciclosRestantes : 0;
      const previo = out[out.length - 1];
      let nota = '';
      if (n === 0) nota = `${r.ciclosRestantes} ${r.ciclosRestantes === 1 ? 'periodo' : 'periodos'} más, unos ${r.promedio} créditos por periodo`;
      else if (previo && r.ciclosRestantes === previo.ciclosRestantes) nota = `${n === 1 ? 'No adelanta la culminación de tus estudios' : 'No la adelanta más'}, pero tus periodos serían más livianos (unos ${r.promedio} créditos)`;
      else nota = `Culminación anticipada: ${ahorro} ${ahorro === 1 ? 'periodo' : 'periodos'} antes`;
      out.push({ n, etiqueta, termina, ciclosRestantes: r.ciclosRestantes, promedio: r.promedio, ahorro, nota, acorta: n > 0 && previo && r.ciclosRestantes < previo.ciclosRestantes, ruta: r.ruta });
    }
    return out;
  };

  // Código del periodo académico: 2027-10 (marzo a julio) y 2027-20 (agosto a diciembre); cada uno tiene bloques A y B
  S.codigoPeriodo = (anio, tipo) => `${anio}-${tipo === 'I' ? '10' : '20'}`;

  // Escenario que se muestra por defecto en "Mi ruta de estudios": el que más acorta
  // (en empate, el de menos veranos); si ninguno acorta, el de 1 verano.
  S.escenarioPorDefecto = function (E) {
    let mejor = -1;
    E.forEach((e, i) => { if (e.ahorro > 0 && (mejor < 0 || e.ahorro > E[mejor].ahorro)) mejor = i; });
    if (mejor >= 0) return mejor;
    const uno = E.findIndex((e) => e.n === 1);
    return uno >= 0 ? uno : 0;
  };

  // Proyección referencial: créditos pendientes tras el ciclo actual, repartidos en semestres de carga referencial
  S.proyeccion = function (M, creditosVerano) {
    const carga = UCP.config.cargaReferencialSemestre;
    const pend = Math.max(0, M.credFaltan - M.credEnCurso);
    const semestres = (c) => Math.ceil(Math.max(0, c) / carga);
    const periodo = (n) => S.codigoPeriodo(2027 + Math.floor((n - 1) / 2), n % 2 ? 'I' : 'II');
    const sin = semestres(pend), con = semestres(pend - creditosVerano);
    return { pendientes: pend, sinVerano: sin ? periodo(sin) : 'Al cerrar el periodo 2026-20', conVerano: con ? periodo(con) : 'Al terminar el verano 2027', ahorro: sin - con };
  };
  // Mensaje según el caso del estudiante (segmentación). Orden de prioridad:
  // reincorporado → asignatura crítica por recuperar → culminación anticipada → puede balancear su carga.
  S.segmentos = function (M, E, oferta, perfil) {
    const fuera = [], nom = (k) => (M.cursos[k] || {}).nombre || k;
    const rec = oferta.filter((o) => o.recuperacion);
    const clave = oferta.filter((o) => o.curso_clave && !o.recuperacion);
    const acorta = E.find((e) => e.acorta), primero = E[1];
    if (perfil && perfil.reincorporado) fuera.push({ clave: 'reincorporado', tag: 'Estudiante reincorporado', t: 'Qué bueno tenerte de vuelta',
      d: `Retomaste tus estudios en ${perfil.periodo_reincorporacion || 'este periodo'}. Los cursos de verano te ayudan a recuperar ritmo y tiempo${rec.length ? `: empieza por ${rec[0].nombre}` : ''}.` });
    if (rec.length || clave.length) { const c = rec[0] || clave[0]; fuera.push({ clave: 'critico', tag: rec.length ? 'Asignatura por recuperar' : 'Asignatura clave pendiente', t: `${rec.length ? 'Recupera' : 'Adelanta'} ${c.nombre} este verano`,
      d: rec.length ? 'Es un buen momento para aprobarla: así las asignaturas que dependen de ella no se retrasan y mantienes tu plazo.' : 'Habilita varias asignaturas de los siguientes periodos. Llevarla a tiempo te ayuda a mantener tu avance.' }); }
    if (acorta) fuera.push({ clave: 'egresar', tag: 'Culminación anticipada de estudios', t: 'Puedes culminar tus estudios antes',
      d: `${acorta.etiqueta} podrías culminar tus estudios en ${acorta.termina.replace(' · ', ' (')})${acorta.ahorro ? `, ${acorta.ahorro} ${acorta.ahorro === 1 ? 'periodo' : 'periodos'} antes` : ''}. Es una estimación referencial.` });
    if (primero && !primero.acorta) fuera.push({ clave: 'balancear', tag: 'Balancea tu carga', t: 'Aligera tus próximos periodos',
      d: `Un verano no adelanta la culminación de tus estudios, pero tus siguientes periodos serían más livianos (unos ${primero.promedio} créditos por periodo). Ideal si trabajas o tienes otras responsabilidades.` });
    return fuera;
  };
  S.NOMBRE_SEGMENTO = { reincorporado: 'Reincorporado', critico: 'Asignatura crítica pendiente', egresar: 'Culminación anticipada', balancear: 'Puede balancear su carga' };

  UCP.sim = S;
})();
