/* Configuración. En "prototipo" los datos salen de datos-prototipo.js;
   en "api" se consultan al backend Laravel, que a su vez llama a la API de TI. */
window.UCP = window.UCP || {};
UCP.config = {
  modo: 'prototipo',                 // 'prototipo' | 'api'
  backendBase: '/api/portal',        // rutas del backend Laravel cuando modo = 'api'
  logo: 'https://adistancia.ucontinental.edu.pe/assets/img/logo.svg',
  logoPie: 'https://ucontinental.edu.pe/site/wp-content/themes/salient-child/img/logo.svg',
  iconos: 'https://adistancia.ucontinental.edu.pe/assets/img/',
  fotos: {
    portada: 'https://ucontinental.edu.pe/site/wp-content/themes/salient-child/img/home-img-1.webp',
    estudio: 'https://adistancia.ucontinental.edu.pe/assets/img/ciencias-de-la-computacion-sm.webp',
    cierre: 'https://ucontinental.edu.pe/site/wp-content/themes/salient-child/img/tu-futuro-es-global.webp'
  },
  // CONFIRMAR: enlace oficial a los directores por programa (dónde el estudiante resuelve sus dudas)
  fechaCorreoAsignaturas: '', // ← CONFIRMAR: fecha del correo con las asignaturas de verano, ej. '2026-11-10'
  directoresPrograma: '#directores', // abre la ventana de directores (js/directores.js). Para usar una página externa, pon aquí su enlace.
  intranet: 'https://estudiantes.ucontinental.edu.pe/',                 // Portal del Estudiante (matrícula oficial)
  simuladorCostos: 'https://estudiantes.ucontinental.edu.pe/',          // Simulador de costos del Portal del Estudiante: enlace oficial por confirmar con TI y Tesorería   // matrícula oficial
  cargaReferencialSemestre: 25                              // carga máxima oficial por semestre, usada en la proyección
};
