/* Flujo de "Simula tu verano": pasos con candados, siguiente acción, estado de la solicitud
   y precarga desde la ruta de estudios. Sin dependencias de la interfaz (se prueba con Node). */
window.UCP = window.UCP || {};
(function () {
  const F = {};
  const cursos = (n) => `${n} ${n === 1 ? 'curso' : 'cursos'}`;

  // Qué falta para poder enviar. El turno solo se exige en la fase de solicitudes y en cursos sin horario publicado.
  F.pendientes = function ({ fase, items, creditos, max }) {
    return {
      vacio: !items.length,
      sinTurno: fase === 'solicitudes' ? items.filter((i) => !i.conSecciones && !i.turno).length : 0,
      sinSeccion: items.filter((i) => i.conSecciones && !i.seccion).length,
      excede: creditos > max
    };
  };

  const motivoPaso1 = (p, max) => p.vacio ? 'Completa el paso ①: elige al menos un curso'
    : p.excede ? `Quita cursos hasta quedar en ${max} créditos`
    : p.sinTurno ? `Completa el paso ①: elige el turno de ${cursos(p.sinTurno)}` : '';

  // Pasos de "Simula tu verano" según la fase. Los ids coinciden con state.paso de app.html.
  F.pasos = function ({ fase, items, creditos, max }) {
    const p = F.pendientes({ fase, items, creditos, max });
    if (fase === 'solicitudes') {
      const m = motivoPaso1(p, max);
      return [{ id: 'verano', n: 1, t: 'Elige tus cursos y turno', bloqueado: false, motivo: '' },
        { id: 'solicitud', n: 2, t: 'Revisa y envía', bloqueado: !!m, motivo: m }];
    }
    if (fase === 'horarios') {
      const m = p.vacio ? 'Completa el paso ①: elige al menos un curso' : p.excede ? `Quita cursos hasta quedar en ${max} créditos` : '';
      return [{ id: 'verano', n: 1, t: 'Elige tus cursos', bloqueado: false, motivo: '' },
        { id: 'horario', n: 2, t: 'Elige tu sección y revisa tu horario', bloqueado: p.vacio, motivo: p.vacio ? m : '' },
        { id: 'solicitud', n: 3, t: 'Revisa y envía', bloqueado: !!m, motivo: m }];
    }
    return []; // evaluacion: solo lectura
  };

  // Un único botón principal que dice lo que falta o lo que sigue.
  F.siguienteAccion = function ({ fase, paso, items, creditos, max, estado }) {
    const p = F.pendientes({ fase, items, creditos, max });
    if (estado === 'enviada') return { t: 'Ver mi solicitud', accion: 'ir_solicitud', activo: true };
    if (p.vacio) return { t: 'Elige al menos un curso', accion: 'ninguna', activo: false };
    if (p.excede) return { t: `Quita cursos hasta ${max} créditos`, accion: 'ninguna', activo: false };
    if (p.sinTurno) return { t: `Elige el turno de ${cursos(p.sinTurno)}`, accion: 'turno', activo: true };
    if (fase === 'horarios') return paso === 'verano' ? { t: 'Ir a ② Elige tu sección', accion: 'ir_horario', activo: true } : { t: 'Ir a ③ Revisa y envía', accion: 'ir_solicitud', activo: true };
    return { t: 'Ir a ② Revisa y envía', accion: 'ir_solicitud', activo: true };
  };

  // Huella de una selección (código, sección y turno) para saber si hay cambios sin enviar.
  F.firma = (lista) => (lista || []).map((c) => `${c.codigo}:${c.seccion || ''}:${c.seccion ? '' : c.turno || ''}`).sort().join('|');

  F.diasRestantes = function (hoyIso, cierreIso) {
    const d = (s) => Date.UTC(+s.slice(0, 4), +s.slice(5, 7) - 1, +s.slice(8, 10));
    return Math.round((d(cierreIso) - d(hoyIso)) / 86400000);
  };

  // Chip de estado bajo el saludo.
  F.estado = function ({ fase, items, solicitud, hoyIso, cierreIso, fCierre, fHor }) {
    if (fase === 'evaluacion') return { clave: 'cerrada', t: `Solicitudes cerradas · horarios el ${fHor}`, tono: 'neutro' };
    if (solicitud) return F.firma(items) === F.firma(solicitud.cursos)
      ? { clave: 'enviada', t: `✓ Solicitud enviada · ${solicitud.id}`, tono: 'verde' }
      : { clave: 'cambios', t: '✎ Cambios sin enviar', tono: 'ambar' };
    let plazo = '';
    if (fase === 'solicitudes' && hoyIso && cierreIso) {
      const n = F.diasRestantes(hoyIso, cierreIso);
      plazo = n <= 0 ? ' · Último día para enviar' : ` · ${n === 1 ? 'Queda 1 día' : `Quedan ${n} días`} (cierra el ${fCierre})`;
    }
    return items.length
      ? { clave: 'borrador', t: '📝 Borrador sin enviar' + plazo, tono: 'ambar' }
      : { clave: 'vacio', t: 'Aún no eliges cursos' + plazo, tono: 'neutro' };
  };

  // Cursos del primer verano de la ruta que el estudiante puede solicitar hoy (hasta el tope de créditos).
  F.precarga = function ({ ruta, elegibles, max, explicar }) {
    const verano = (ruta || []).find((p) => p.tipo === 'verano');
    if (!verano) return { cursos: [], noSolicitables: [], sinVerano: true };
    const out = [], no = [];
    let cr = 0;
    verano.cursos.forEach((c) => {
      if (!elegibles.has(c.codigo)) no.push({ codigo: c.codigo, nombre: c.nombre, motivo: explicar(c.codigo) });
      else if (cr + c.creditos <= max) { out.push(c.codigo); cr += c.creditos; }
    });
    return { cursos: out, noSolicitables: no, sinVerano: false };
  };

  // Celular del Perú: 9 dígitos que empiezan con 9; +51 / 51 / 0051 opcional. Se guarda como +51XXXXXXXXX.
  F.validarCelular = function (texto, obligatorio) {
    const crudo = String(texto || '').trim();
    if (!crudo) return obligatorio ? { ok: false, normalizado: '', mostrar: '', error: 'Escribe tu celular para que podamos contactarte.' } : { ok: true, normalizado: '', mostrar: '', error: '' };
    if (/[^\d\s+()\-.]/.test(crudo)) return { ok: false, normalizado: '', mostrar: '', error: 'El celular debe tener 9 dígitos, solo números (por ejemplo, 987 654 321).' };
    let d = crudo.replace(/\D/g, '');
    if (d.length === 13 && d.startsWith('0051')) d = d.slice(4); else if (d.length === 11 && d.startsWith('51')) d = d.slice(2);
    if (d.length !== 9) return { ok: false, normalizado: '', mostrar: '', error: 'El celular debe tener 9 dígitos (por ejemplo, 987 654 321).' };
    if (d[0] !== '9') return { ok: false, normalizado: '', mostrar: '', error: 'Un celular del Perú debe empezar con 9.' };
    return { ok: true, normalizado: '+51' + d, mostrar: `+51 ${d.slice(0, 3)} ${d.slice(3, 6)} ${d.slice(6)}`, error: '' };
  };

  // El correo sale del login de Google (servidor); aquí solo se confirma que sea institucional.
  F.validarCorreo = function (correo) {
    const c = String(correo || '').trim().toLowerCase();
    return /^[^\s@]+@continental\.edu\.pe$/.test(c) ? { ok: true, normalizado: c, error: '' } : { ok: false, normalizado: '', error: 'Tu correo debe ser institucional (@continental.edu.pe).' };
  };

  // Texto para confirmar cómo se contactará al estudiante
  F.textoContacto = function (pref, celular, correo, alterno) {
    const correos = alterno ? `${correo} y ${alterno}` : correo, a = alterno ? 'a tus correos' : 'a tu correo';
    if (pref === 'whatsapp' && celular) return `por WhatsApp al ${celular} y ${a} ${correos}`;
    if (pref === 'llamada' && celular) return `por llamada al ${celular} y ${a} ${correos}`;
    return `por correo a ${correos}`;
  };

  // Correo adicional opcional (por ejemplo, personal): formato válido y distinto del institucional.
  F.validarCorreoAlterno = function (texto, institucional) {
    const c = String(texto || '').trim().toLowerCase();
    if (!c) return { ok: true, normalizado: '', error: '' };
    if (!/^[^\s@]+@[^\s@]+\.[a-z]{2,}$/.test(c)) return { ok: false, normalizado: '', error: 'Escribe un correo válido (por ejemplo, nombre@gmail.com).' };
    if (c === String(institucional || '').trim().toLowerCase()) return { ok: false, normalizado: '', error: 'Ese ya es tu correo institucional: escribe otro o deja el campo vacío.' };
    return { ok: true, normalizado: c, error: '' };
  };

  UCP.flujo = F;
})();
