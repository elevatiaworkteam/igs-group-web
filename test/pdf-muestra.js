// Genera los dos PDF con un caso de ejemplo para revisarlos visualmente.
const fs = require('fs');
const { clasificar, normalizar } = require('../lib/clasificador');
const { pdfCliente, pdfInterno } = require('../lib/pdf');
const out = process.argv[2] || '.';
const casos = {
  industrial: { idioma: 'es', empresa: 'Distribuidora del Caribe SRL', proyecto: 'Centro de distribución Haina', ubicacion: 'Haina, San Cristóbal', contacto: 'Juan Pérez', telefono: '+1 809 555 0134', correo: 'jperez@ejemplo.com', uso: 'logistica', largo_m: 60, ancho_m: 30, altura_libre_m: 10, niveles: 1, mezzanine: 'no', aislamiento: 'si', cerramiento: 'panel_aislado', puertas: 4, docks: 3, grandes_luces: 'no', cargas: 'no', proceso_especial: 'no', areas_admin: 'si', areas_desc: 'Oficinas administrativas de 150 m²', alcance: 'cerramientos', condicion: 'CIF', llave_en_mano: 'no', lugar_entrega: 'Puerto de Haina', observaciones: 'Necesitamos la nave operativa para el segundo trimestre de 2027.' },
  especializada_en: { idioma: 'en', empresa: 'Caribbean Metals Inc.', proyecto: 'Fabrication workshop', ubicacion: 'Santiago, DR', contacto: 'Mary Johnson', telefono: '+1 305 555 0199', correo: 'mjohnson@example.com', uso: 'taller', area_m2: 1200, altura_libre_m: 9, mezzanine: 'pd', aislamiento: 'no', cerramiento: 'basico', puertas: 2, docks: 0, grandes_luces: 'si', luz_libre_m: 32, cargas: 'si', cargas_tipos: ['puente_grua', 'maquinaria'], cargas_desc: '10-ton overhead crane, CNC machinery', proceso_especial: 'no', areas_admin: 'no', alcance: 'completa', condicion: 'nd', llave_en_mano: 'si', trabajos_llave: 'Foundations, erection and electrical', lugar_entrega: 'Santiago' },
  pendiente: { idioma: 'es', empresa: 'Agro Norte', contacto: 'Ana Gómez', telefono: '809 555 0100', uso: 'agroindustria', area_m2: 900, mezzanine: 'pd', aislamiento: 'pd', cerramiento: 'pd', grandes_luces: 'pd', cargas: 'pd', proceso_especial: 'pd', areas_admin: 'pd', alcance: 'pd', condicion: 'nd' }
};
(async () => {
  for (const [k, c] of Object.entries(casos)) {
    const f = normalizar(c); const r = clasificar(f); const ref = 'IGS-261009-TEST';
    const emp = { nombre: 'IGS Group USA', correo: 'sfernandez@igsgroupusa.com', whatsapp: '', responsable: 'Samuel Fernández' };
    fs.writeFileSync(`${out}/cliente-${k}.pdf`, await pdfCliente({ ficha: f, resultado: r, ref, fecha: new Date(), empresa: emp }));
    fs.writeFileSync(`${out}/interno-${k}.pdf`, await pdfInterno({ ficha: f, resultado: r, ref, fecha: new Date(), empresa: emp }));
    console.log(k, '→', r.etiqueta, r.puntos, 'pts', r.estimado ? `${r.estimado.min}-${r.estimado.max}` : 'sin estimado');
  }
})();
