'use strict';
/**
 * Motor de clasificación de naves — IGS Group USA
 * Implementa la "Guía de clasificación de naves" versión 1.1 (septiembre 2026):
 *  - matriz de puntuación (cada factor suma una sola vez)
 *  - reglas de prioridad (Especializada directa / mínimo Industrial)
 *  - manejo de datos "por definir" (no equivalen a "no": categoría provisional o pendiente)
 *  - bandas de venta preliminares por paquete comparable (editables en la hoja de configuración)
 */

const DEFAULT_CONFIG = {
  umbral_altura_m: 8,          // altura libre "de referencia": por encima suma 1 punto y activa mínimo Industrial
  umbral_luz_m: 30,            // luz libre "de referencia": por encima suma 2 puntos y activa mínimo Industrial
  banda_lamina_min: 91,        // US$/m² lámina sin aislamiento (similar a Suárez)
  banda_lamina_max: 100,
  banda_aislado_min: 132,      // US$/m² aislado y galvanizado (similar a Buenavista V2)
  banda_aislado_max: 145,
  moneda: 'USD',
  condicion: 'CIF Caucedo',
  vigencia_dias: 15,
  estimado_en_provisional: true,                 // mostrar estimado cuando la categoría es "al menos Industrial"
  estimado_alcances: 'cerramientos,completa,pd', // alcances con banda comparable
  redondeo: 500
};

const CAT = { Esencial: 1, Industrial: 2, Especializada: 3 };
const CAT_NAME = { 1: 'Esencial', 2: 'Industrial', 3: 'Especializada' };

function num(v) {
  if (v === null || v === undefined || v === '') return null;
  const n = typeof v === 'number' ? v : parseFloat(String(v).replace(',', '.'));
  return Number.isFinite(n) ? n : null;
}
function tri(v) { // 'si' | 'no' | 'pd'
  const s = String(v || '').toLowerCase().trim();
  if (['si', 'sí', 'yes', 'true', '1'].includes(s)) return 'si';
  if (['no', 'false', '0'].includes(s)) return 'no';
  return 'pd';
}
function catFromPoints(p) { return p <= 2 ? 1 : p <= 6 ? 2 : 3; }
function roundTo(n, step) { return Math.round(n / step) * step; }

function normalizar(input) {
  const i = input || {};
  const tipos = Array.isArray(i.cargas_tipos) ? i.cargas_tipos : String(i.cargas_tipos || '').split(',').map(s => s.trim()).filter(Boolean);
  const largo = num(i.largo_m), ancho = num(i.ancho_m);
  let area = num(i.area_m2);
  if (!area && largo && ancho) area = +(largo * ancho).toFixed(1);
  return {
    idioma: i.idioma === 'en' ? 'en' : 'es',
    empresa: str(i.empresa, 120), proyecto: str(i.proyecto, 160), ubicacion: str(i.ubicacion, 120),
    contacto: str(i.contacto, 80), telefono: str(i.telefono, 40), correo: str(i.correo, 120),
    uso: str(i.uso, 30) || 'pd', uso_otro: str(i.uso_otro, 80),
    area_m2: area, largo_m: largo, ancho_m: ancho,
    altura_libre_m: num(i.altura_libre_m), niveles: num(i.niveles),
    mezzanine: tri(i.mezzanine), aislamiento: tri(i.aislamiento),
    cerramiento: str(i.cerramiento, 20) || 'pd',
    puertas: num(i.puertas), docks: num(i.docks),
    grandes_luces: tri(i.grandes_luces), luz_libre_m: num(i.luz_libre_m),
    cargas: tri(i.cargas), cargas_tipos: tipos, cargas_desc: str(i.cargas_desc, 600),
    proceso_especial: tri(i.proceso_especial), proceso_desc: str(i.proceso_desc, 400),
    areas_admin: tri(i.areas_admin), areas_desc: str(i.areas_desc, 400),
    alcance: str(i.alcance, 20) || 'pd',
    condicion: str(i.condicion, 10) || 'nd', llave_en_mano: tri(i.llave_en_mano) === 'si',
    lugar_entrega: str(i.lugar_entrega, 160), trabajos_llave: str(i.trabajos_llave, 600),
    observaciones: str(i.observaciones, 1000)
  };
}
function str(v, max) { return String(v == null ? '' : v).replace(/[\u0000-\u001f]+/g, ' ').trim().slice(0, max); }

/**
 * Clasifica una ficha normalizada. Devuelve un objeto con factores, reglas, categoría, estado, banda y estimado.
 */
function clasificar(ficha, config) {
  const cfg = Object.assign({}, DEFAULT_CONFIG, config || {});
  const f = ficha;
  const factores = [];   // {clave, puntos, estado: confirmado|pendiente|no, max, detalle}
  const reglas = [];     // {clave, efecto: especializada|min_industrial, estado: confirmada|pendiente}
  const pend = (clave, max, regla) => { factores.push({ clave, puntos: 0, max, estado: 'pendiente' }); if (regla) reglas.push({ clave, efecto: regla, estado: 'pendiente' }); };

  // 1. Mezzanine o más de un nivel estructural (2) → mínimo Industrial
  if (f.mezzanine === 'si' || (f.niveles !== null && f.niveles >= 2)) {
    factores.push({ clave: 'mezzanine', puntos: 2, max: 2, estado: 'confirmado' });
    reglas.push({ clave: 'mezzanine', efecto: 'min_industrial', estado: 'confirmada' });
  } else if (f.mezzanine === 'pd') pend('mezzanine', 2, 'min_industrial');
  else factores.push({ clave: 'mezzanine', puntos: 0, max: 2, estado: 'no' });

  // 2. Aislamiento térmico (1) — incluido panel aislado; no se suma dos veces
  const aisladoConfirmado = f.aislamiento === 'si' || f.cerramiento === 'panel_aislado';
  if (aisladoConfirmado) factores.push({ clave: 'aislamiento', puntos: 1, max: 1, estado: 'confirmado' });
  else if (f.aislamiento === 'pd') pend('aislamiento', 1);
  else factores.push({ clave: 'aislamiento', puntos: 0, max: 1, estado: 'no' });

  // 3. Docks múltiples (1) — dos o más docks; puertas a nivel no son docks
  if (f.docks === null) pend('docks', 1);
  else if (f.docks >= 2) factores.push({ clave: 'docks', puntos: 1, max: 1, estado: 'confirmado', detalle: f.docks });
  else factores.push({ clave: 'docks', puntos: 0, max: 1, estado: 'no', detalle: f.docks });

  // 4. Grandes luces libres (2) → mínimo Industrial, cuando supera la luz de referencia
  if (f.luz_libre_m !== null) {
    if (f.luz_libre_m > cfg.umbral_luz_m) {
      factores.push({ clave: 'luz', puntos: 2, max: 2, estado: 'confirmado', detalle: f.luz_libre_m });
      reglas.push({ clave: 'luz', efecto: 'min_industrial', estado: 'confirmada' });
    } else factores.push({ clave: 'luz', puntos: 0, max: 2, estado: 'no', detalle: f.luz_libre_m });
  } else if (f.grandes_luces === 'no') factores.push({ clave: 'luz', puntos: 0, max: 2, estado: 'no' });
  else pend('luz', 2, 'min_industrial'); // "sí" sin medida, o por definir

  // 5. Puente grúa (3) → Especializada directa   6. Cargas especiales (2) → Especializada directa
  const tieneGrua = f.cargas === 'si' && f.cargas_tipos.includes('puente_grua');
  const otrasCargas = f.cargas === 'si' && (f.cargas_tipos.some(t => t !== 'puente_grua') || !!f.cargas_desc);
  if (tieneGrua) { factores.push({ clave: 'puente_grua', puntos: 3, max: 3, estado: 'confirmado' }); reglas.push({ clave: 'puente_grua', efecto: 'especializada', estado: 'confirmada' }); }
  else factores.push({ clave: 'puente_grua', puntos: 0, max: 3, estado: f.cargas === 'pd' ? 'pendiente' : 'no' });
  if (otrasCargas) { factores.push({ clave: 'cargas', puntos: 2, max: 2, estado: 'confirmado', detalle: f.cargas_tipos.filter(t => t !== 'puente_grua').join(', ') }); reglas.push({ clave: 'cargas', efecto: 'especializada', estado: 'confirmada' }); }
  else if (f.cargas === 'pd') { factores.push({ clave: 'cargas', puntos: 0, max: 2, estado: 'pendiente' }); reglas.push({ clave: 'cargas', efecto: 'especializada', estado: 'pendiente' }); }
  else factores.push({ clave: 'cargas', puntos: 0, max: 2, estado: 'no' });

  // 7. Altura superior a referencia (1) → mínimo Industrial
  if (f.altura_libre_m !== null) {
    if (f.altura_libre_m > cfg.umbral_altura_m) { factores.push({ clave: 'altura', puntos: 1, max: 1, estado: 'confirmado', detalle: f.altura_libre_m }); reglas.push({ clave: 'altura', efecto: 'min_industrial', estado: 'confirmada' }); }
    else factores.push({ clave: 'altura', puntos: 0, max: 1, estado: 'no', detalle: f.altura_libre_m });
  } else pend('altura', 1, 'min_industrial');

  // 8. Varias áreas funcionales (1) — p. ej. almacén + oficinas integradas
  if (f.areas_admin === 'si') factores.push({ clave: 'areas', puntos: 1, max: 1, estado: 'confirmado' });
  else if (f.areas_admin === 'pd') pend('areas', 1);
  else factores.push({ clave: 'areas', puntos: 0, max: 1, estado: 'no' });

  // 9. Refrigeración o condiciones de proceso específicas → Especializada directa (sin puntos)
  if (f.proceso_especial === 'si') reglas.push({ clave: 'proceso', efecto: 'especializada', estado: 'confirmada' });
  else if (f.proceso_especial === 'pd') reglas.push({ clave: 'proceso', efecto: 'especializada', estado: 'pendiente' });

  // Puntos confirmados y máximos posibles
  const puntos = factores.filter(x => x.estado === 'confirmado').reduce((s, x) => s + x.puntos, 0);
  const puntosMax = puntos + factores.filter(x => x.estado === 'pendiente').reduce((s, x) => s + x.max, 0);
  const pendientes = Array.from(new Set(factores.filter(x => x.estado === 'pendiente').map(x => x.clave).concat(reglas.filter(r => r.estado === 'pendiente').map(r => r.clave))));

  const reglaCat = (estado) => {
    const rs = reglas.filter(r => r.estado === estado);
    if (rs.some(r => r.efecto === 'especializada')) return 3;
    if (rs.some(r => r.efecto === 'min_industrial')) return 2;
    return 1;
  };
  const catMin = Math.max(catFromPoints(puntos), reglaCat('confirmada'));
  const catMax = Math.max(catFromPoints(puntosMax), reglaCat('confirmada'), reglaCat('pendiente'));

  let categoria, estado, etiqueta;
  if (catMin === 3) { categoria = 'Especializada'; estado = pendientes.length ? 'preliminar_con_pendientes' : 'preliminar_completa'; etiqueta = 'Especializada'; }
  else if (catMin === catMax) { categoria = CAT_NAME[catMin]; estado = 'preliminar_completa'; etiqueta = categoria; }
  else if (catMin === 2) { categoria = 'Industrial'; estado = 'provisional'; etiqueta = 'Al menos Industrial'; }
  else { categoria = 'Pendiente'; estado = 'pendiente'; etiqueta = 'Pendiente de clasificar'; }

  // Banda de venta preliminar por paquete comparable
  let banda = { paquete: null, min: null, max: null, aplicable: false, motivo: null };
  if (aisladoConfirmado) banda = { paquete: 'aislado', min: +cfg.banda_aislado_min, max: +cfg.banda_aislado_max, aplicable: true };
  else if (f.aislamiento === 'no') banda = { paquete: 'lamina', min: +cfg.banda_lamina_min, max: +cfg.banda_lamina_max, aplicable: true };
  else banda.motivo = 'aislamiento_pendiente';

  // Estimado referencial (solo Esencial / Industrial)
  const alcancesOk = String(cfg.estimado_alcances).split(',').map(s => s.trim());
  let estimado = null, motivo_sin_estimado = null;
  if (categoria === 'Especializada') motivo_sin_estimado = 'especializada';
  else if (categoria === 'Pendiente') motivo_sin_estimado = 'pendiente';
  else if (estado === 'provisional' && !cfg.estimado_en_provisional) motivo_sin_estimado = 'provisional';
  else if (!f.area_m2) motivo_sin_estimado = 'sin_area';
  else if (!banda.aplicable) motivo_sin_estimado = banda.motivo;
  else if (!alcancesOk.includes(f.alcance)) motivo_sin_estimado = 'alcance';
  else {
    const step = +cfg.redondeo || 500;
    estimado = { area_m2: f.area_m2, min: roundTo(f.area_m2 * banda.min, step), max: roundTo(f.area_m2 * banda.max, step), moneda: cfg.moneda, condicion: cfg.condicion, vigencia_dias: +cfg.vigencia_dias, por_m2_min: banda.min, por_m2_max: banda.max, provisional: estado === 'provisional' };
  }

  const siguiente = categoria === 'Especializada' ? 'especializada' : categoria === 'Pendiente' ? 'pendiente' : estado === 'provisional' ? 'provisional' : categoria === 'Industrial' ? 'industrial' : 'esencial';

  return {
    puntos, puntos_max: puntosMax, factores, reglas, pendientes,
    categoria, estado, etiqueta, categoria_min: CAT_NAME[catMin], categoria_max: CAT_NAME[catMax],
    banda, estimado, motivo_sin_estimado, siguiente_accion: siguiente,
    config_usada: { umbral_altura_m: cfg.umbral_altura_m, umbral_luz_m: cfg.umbral_luz_m }
  };
}

module.exports = { clasificar, normalizar, DEFAULT_CONFIG };
