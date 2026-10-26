/* Reglas de cursos que no se dictan en verano (configurables por Coordinación en el panel).
   Misma lógica que app/Verano/ReglasVerano.php. Sin dependencias de la interfaz (se prueba con Node). */
window.UCP = window.UCP || {};
(function () {
  const R = {};

  // Tipos: nombre_contiene (valor: textos separados por coma) · tipo_curso (electivo | obligatorio) · codigo (códigos separados por coma)
  // · periodo_mayor_a (asignaturas de periodos del plan posteriores al valor; la oferta de verano llega hasta el 6.° periodo)
  R.POR_DEFECTO = {
    reglas: [
      { id: 'ingles', tipo: 'nombre_contiene', valor: 'ENGLISH, INGLÉS', motivo: 'Los cursos de inglés no se dictan en verano', activa: true },
      { id: 'talleres', tipo: 'nombre_contiene', valor: 'TALLER', motivo: 'Los talleres no se dictan en verano', activa: true },
      { id: 'electivos', tipo: 'tipo_curso', valor: 'electivo', motivo: 'Los cursos electivos no se dictan en verano', activa: true },
      { id: 'hasta6', tipo: 'periodo_mayor_a', valor: '6', motivo: 'En verano solo se ofrecen asignaturas hasta el 6.° periodo del plan', activa: true }
    ],
    excepciones: [] // códigos que sí pueden dictarse en verano aunque cumplan una regla
  };
  R.TIPOS = { nombre_contiene: 'El nombre contiene', tipo_curso: 'Tipo de curso', codigo: 'Candado manual por código', periodo_mayor_a: 'Periodo del plan mayor a' };

  // Mayúsculas y sin tildes, para comparar "Inglés" con "INGLES"
  R.normalizar = (t) => String(t || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toUpperCase().trim();
  const lista = (valor) => String(valor || '').split(',').map(R.normalizar).filter(Boolean);

  const cumple = (regla, curso) => {
    if (regla.tipo === 'nombre_contiene') { const n = R.normalizar(curso.nombre); return lista(regla.valor).some((v) => n.includes(v)); }
    if (regla.tipo === 'tipo_curso') return R.normalizar(curso.caracter) === R.normalizar(regla.valor);
    if (regla.tipo === 'codigo') return lista(regla.valor).includes(R.normalizar(curso.codigo));
    if (regla.tipo === 'periodo_mayor_a') return (+curso.ciclo || 0) > (parseInt(regla.valor, 10) || 0);
    return false;
  };

  // Motivo de la primera regla activa que cumple el curso (null si puede dictarse en verano)
  R.motivo = function (curso, config) {
    const cfg = config || R.POR_DEFECTO;
    if ((cfg.excepciones || []).map(R.normalizar).includes(R.normalizar(curso.codigo))) return null;
    const regla = (cfg.reglas || []).find((r) => r.activa !== false && cumple(r, curso));
    return regla ? regla.motivo : null;
  };

  // Marca en la malla los cursos que no se dictan en verano (con su motivo) y los quita de la oferta.
  // Las casillas electivas conservan su propio mensaje. No modifica los datos originales.
  R.aplicar = function (malla, oferta, config) {
    const cursos = malla.cursos.map((c) => {
      if (c.es_casilla) return c;
      const m = R.motivo(c, config);
      return m ? Object.assign({}, c, { se_dicta_en_verano: false, motivo_no_verano: m }) : c;
    });
    const fuera = new Set(cursos.filter((c) => c.motivo_no_verano).map((c) => c.codigo));
    return { malla: Object.assign({}, malla, { cursos }), oferta: Object.assign({}, oferta, { cursos: (oferta.cursos || []).filter((o) => !fuera.has(o.codigo)) }) };
  };

  UCP.reglasVerano = R;
})();
