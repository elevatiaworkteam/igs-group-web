'use strict';
const PDFDocument = require('pdfkit');
const path = require('path');
const fs = require('fs');
const { t } = require('./textos');

const FONTS = {
  H: path.join(__dirname, '..', 'fonts', 'Montserrat-700.ttf'),
  HS: path.join(__dirname, '..', 'fonts', 'Montserrat-600.ttf'),
  B: path.join(__dirname, '..', 'fonts', 'Inter-400.ttf'),
  BM: path.join(__dirname, '..', 'fonts', 'Inter-500.ttf'),
  BB: path.join(__dirname, '..', 'fonts', 'Inter-600.ttf')
};
const LOGO = path.join(__dirname, '..', 'public', 'assets', 'img', 'logo-igs.png');
const C = { red: '#ED1C24', black: '#000000', steel: '#626970', light: '#F3F4F5', line: '#D9DCE0', white: '#FFFFFF' };
const PAGE = { w: 612, h: 792, m: 50 };
const W = PAGE.w - PAGE.m * 2;

function money(n, moneda) { return (moneda === 'USD' ? 'US$ ' : moneda + ' ') + Math.round(n).toLocaleString('en-US'); }
function fmtNum(n, unit) { return n === null || n === undefined ? '—' : (Number(n).toLocaleString('en-US') + (unit ? ' ' + unit : '')); }
function fecha(d, lang) {
  const dt = d instanceof Date ? d : new Date(d);
  return dt.toLocaleDateString(lang === 'en' ? 'en-US' : 'es-DO', { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'America/Santo_Domingo' });
}

class Doc {
  constructor(opts) {
    this.lang = opts.lang || 'es';
    this.doc = new PDFDocument({ size: 'LETTER', margins: { top: 96, bottom: 70, left: PAGE.m, right: PAGE.m }, bufferPages: true, info: { Title: opts.title, Author: 'IGS Group USA', Subject: opts.subject || '' } });
    for (const k of Object.keys(FONTS)) if (fs.existsSync(FONTS[k])) this.doc.registerFont(k, FONTS[k]);
    this.hasFonts = fs.existsSync(FONTS.H);
    this.headRight = opts.headRight || [];
    this.footerNote = opts.footerNote || '';
    this.footerLeft = opts.footerLeft || 'IGS Group USA';
    this.chunks = [];
    this.doc.on('data', c => this.chunks.push(c));
    this.doc.on('pageAdded', () => this.header());
    this.header();
  }
  f(k) { return this.hasFonts ? k : ({ H: 'Helvetica-Bold', HS: 'Helvetica-Bold', B: 'Helvetica', BM: 'Helvetica', BB: 'Helvetica-Bold' })[k]; }
  header() {
    const d = this.doc;
    if (fs.existsSync(LOGO)) d.image(LOGO, PAGE.m, 34, { height: 36 });
    let y = 36;
    this.headRight.forEach((line, i) => {
      d.font(this.f(i === 0 ? 'HS' : 'B')).fontSize(i === 0 ? 8.5 : 8.5).fillColor(i === 0 ? C.black : C.steel)
        .text(line, PAGE.m + 200, y, { width: W - 200, align: 'right', characterSpacing: i === 0 ? 1.2 : 0 });
      y += 12;
    });
    d.rect(PAGE.m, 80, W, 1.5).fill(C.red);
    d.fillColor(C.black);
    d.y = 96;
  }
  ensure(h) { if (this.doc.y + h > PAGE.h - 70) this.doc.addPage(); }
  title(text, sub) {
    const d = this.doc;
    d.font(this.f('H')).fontSize(20).fillColor(C.black).text(text, PAGE.m, d.y, { width: W });
    if (sub) d.moveDown(0.25).font(this.f('B')).fontSize(10.5).fillColor(C.steel).text(sub, { width: W });
    d.moveDown(0.8);
  }
  section(text) {
    const d = this.doc; this.ensure(40);
    d.moveDown(0.4);
    d.font(this.f('HS')).fontSize(9).fillColor(C.red).text(text.toUpperCase(), PAGE.m, d.y, { width: W, characterSpacing: 1.4 });
    d.rect(PAGE.m, d.y + 4, W, 0.6).fill(C.line);
    d.y += 12; d.fillColor(C.black);
  }
  para(text, opts) {
    const d = this.doc; const o = Object.assign({ size: 10, color: C.black, font: 'B', width: W, x: PAGE.m }, opts || {});
    d.font(this.f(o.font)).fontSize(o.size).fillColor(o.color);
    this.ensure(d.heightOfString(text, { width: o.width }) + 4);
    d.text(text, o.x, d.y, { width: o.width, lineGap: 2 }); d.moveDown(0.5);
  }
  bullets(items, opts) {
    const d = this.doc; const o = Object.assign({ size: 10, color: C.black, width: W, x: PAGE.m }, opts || {});
    d.font(this.f('B')).fontSize(o.size).fillColor(o.color);
    items.forEach(it => {
      const h = d.heightOfString(it, { width: o.width - 14 }) + 3; this.ensure(h);
      d.circle(o.x + 3, d.y + 5, 1.6).fill(C.red).fillColor(o.color);
      d.text(it, o.x + 14, d.y, { width: o.width - 14, lineGap: 1.5 }); d.y += 3;
    });
    d.moveDown(0.3);
  }
  // Caja destacada con barra roja (categoría)
  badge(label, sub, explain) {
    const d = this.doc;
    d.font(this.f('H')).fontSize(17); const h1 = d.heightOfString(label, { width: W - 40 });
    d.font(this.f('B')).fontSize(9.5); const h3 = explain ? d.heightOfString(explain, { width: W - 40 }) : 0;
    const h = 16 + h1 + (sub ? 16 : 0) + (explain ? h3 + 8 : 0) + 14; this.ensure(h);
    const y0 = d.y;
    d.rect(PAGE.m, y0, W, h).fill(C.light); d.rect(PAGE.m, y0, 5, h).fill(C.red);
    d.font(this.f('H')).fontSize(17).fillColor(C.black).text(label, PAGE.m + 22, y0 + 14, { width: W - 40 });
    let y = y0 + 14 + h1 + 4;
    if (sub) { d.font(this.f('BB')).fontSize(9).fillColor(C.steel).text(sub.toUpperCase(), PAGE.m + 22, y, { width: W - 40, characterSpacing: 1 }); y += 16; }
    if (explain) { d.font(this.f('B')).fontSize(9.5).fillColor(C.black).text(explain, PAGE.m + 22, y + 2, { width: W - 40, lineGap: 1.5 }); }
    d.y = y0 + h + 10; d.fillColor(C.black);
  }
  // Tabla clave/valor en dos columnas
  kv(pairs, cols) {
    const d = this.doc; cols = cols || 2;
    const colW = (W - (cols - 1) * 16) / cols;
    const rows = []; for (let i = 0; i < pairs.length; i += cols) rows.push(pairs.slice(i, i + cols));
    rows.forEach(row => {
      d.font(this.f('B')).fontSize(9.5);
      const hs = row.map(p => d.heightOfString(String(p[1] || '—'), { width: colW }));
      const h = Math.max(...hs) + 14; this.ensure(h + 2);
      const y = d.y;
      row.forEach((p, i) => {
        const x = PAGE.m + i * (colW + 16);
        d.font(this.f('BB')).fontSize(7.5).fillColor(C.steel).text(String(p[0]).toUpperCase(), x, y, { width: colW, characterSpacing: 0.6 });
        d.font(this.f('B')).fontSize(9.5).fillColor(C.black).text(String(p[1] || '—'), x, y + 10, { width: colW, lineGap: 1 });
      });
      d.rect(PAGE.m, y + h - 3, W, 0.5).fill(C.line); d.fillColor(C.black);
      d.y = y + h + 2;
    });
    d.moveDown(0.3);
  }
  // Tabla simple con encabezados
  table(headers, rows, widths) {
    const d = this.doc;
    const total = widths.reduce((a, b) => a + b, 0); const ws = widths.map(w => w / total * W);
    const drawRow = (cells, isHead) => {
      d.font(this.f(isHead ? 'BB' : 'B')).fontSize(isHead ? 7.5 : 9.2);
      const hs = cells.map((c, i) => d.heightOfString(String(c), { width: ws[i] - 10 }));
      const h = Math.max(...hs) + 10; this.ensure(h);
      const y = d.y; let x = PAGE.m;
      if (isHead) d.rect(PAGE.m, y, W, h).fill(C.light);
      cells.forEach((c, i) => { d.fillColor(isHead ? C.steel : C.black).text(isHead ? String(c).toUpperCase() : String(c), x + 5, y + 5, { width: ws[i] - 10, characterSpacing: isHead ? 0.6 : 0, lineGap: 1 }); x += ws[i]; });
      if (!isHead) d.rect(PAGE.m, y + h, W, 0.5).fill(C.line);
      d.y = y + h + (isHead ? 0 : 1); d.fillColor(C.black);
    };
    drawRow(headers, true); rows.forEach(r => drawRow(r, false)); d.moveDown(0.5);
  }
  note(text) {
    const d = this.doc; d.font(this.f('B')).fontSize(9);
    const h = d.heightOfString(text, { width: W - 32 }) + 20; this.ensure(h);
    const y = d.y; d.rect(PAGE.m, y, W, h).fill(C.light); d.rect(PAGE.m, y, 3, h).fill(C.steel);
    d.fillColor(C.black).text(text, PAGE.m + 16, y + 10, { width: W - 32, lineGap: 1.5 }); d.y = y + h + 10;
  }
  bigRange(text, sub) {
    const d = this.doc; this.ensure(60);
    d.font(this.f('H')).fontSize(22).fillColor(C.black).text(text, PAGE.m, d.y, { width: W });
    if (sub) d.font(this.f('B')).fontSize(9.5).fillColor(C.steel).text(sub, { width: W });
    d.moveDown(0.6); d.fillColor(C.black);
  }
  finish() {
    const d = this.doc; const range = d.bufferedPageRange();
    for (let i = range.start; i < range.start + range.count; i++) {
      d.switchToPage(i);
      d.page.margins.bottom = 0; // el pie se escribe dentro del margen inferior sin crear páginas nuevas
      const y = PAGE.h - 50;
      d.rect(PAGE.m, y - 8, W, 0.5).fill(C.line);
      d.font(this.f('B')).fontSize(7.5).fillColor(C.steel).text(this.footerNote, PAGE.m, y, { width: W - 60, lineGap: 1 });
      d.font(this.f('BB')).fontSize(7.5).fillColor(C.steel).text(`${i + 1} / ${range.count}`, PAGE.m + W - 60, y, { width: 60, align: 'right' });
    }
    return new Promise((resolve, reject) => { d.on('end', () => resolve(Buffer.concat(this.chunks))); d.on('error', reject); d.end(); });
  }
}

function labelCategoria(r, L) {
  if (r.etiqueta === 'Al menos Industrial') return L.etiqueta['Al menos Industrial'];
  if (r.categoria === 'Pendiente') return L.categoria.Pendiente;
  return L.categoria[r.categoria];
}
function nombreCat(cat, L) { return L.categoria[cat] || cat; }

function datosProyecto(f, L) {
  const dims = (f.largo_m && f.ancho_m) ? `${fmtNum(f.largo_m)} × ${fmtNum(f.ancho_m)} m` : '—';
  const uso = f.uso === 'otro' && f.uso_otro ? `${L.usos.otro}: ${f.uso_otro}` : (L.usos[f.uso] || f.uso);
  const cargas = f.cargas === 'si' ? [L.tri.si, f.cargas_tipos.map(x => L.cargas_tipos[x] || x).join(', '), f.cargas_desc].filter(Boolean).join(' · ') : L.tri[f.cargas];
  const es = L === t('es');
  const k = es ? {
    empresa: 'Cliente o empresa', proyecto: 'Proyecto', ubicacion: 'Ubicación', contacto: 'Contacto', uso: 'Uso principal', area: 'Área aproximada', dims: 'Largo × ancho', altura: 'Altura libre requerida', niveles: 'Número de niveles', mezz: 'Mezzanine o entrepiso', aisl: 'Aislamiento térmico', cerr: 'Tipo de cerramiento', puertas: 'Puertas de acceso', docks: 'Docks de carga', luz: 'Grandes luces libres / luz requerida', cargas: 'Cargas especiales o equipos', proceso: 'Refrigeración o proceso especial', areas: 'Áreas administrativas integradas', alcance: 'Alcance requerido', cond: 'Condición comercial', llave: 'Llave en mano', lugar: 'Lugar de entrega', trabajos: 'Trabajos esperados (llave en mano)', obs: 'Observaciones'
  } : {
    empresa: 'Client or company', proyecto: 'Project', ubicacion: 'Location', contacto: 'Contact', uso: 'Main use', area: 'Approximate area', dims: 'Length × width', altura: 'Required clear height', niveles: 'Number of levels', mezz: 'Mezzanine or intermediate floor', aisl: 'Thermal insulation', cerr: 'Cladding type', puertas: 'Access doors', docks: 'Loading docks', luz: 'Large clear spans / required span', cargas: 'Special loads or equipment', proceso: 'Refrigeration or special process', areas: 'Integrated office areas', alcance: 'Required scope', cond: 'Commercial terms', llave: 'Turnkey', lugar: 'Delivery location', trabajos: 'Expected works (turnkey)', obs: 'Remarks'
  };
  const pairs = [
    [k.empresa, f.empresa], [k.proyecto, f.proyecto], [k.ubicacion, f.ubicacion], [k.contacto, [f.contacto, f.telefono, f.correo].filter(Boolean).join(' · ')],
    [k.uso, uso], [k.area, f.area_m2 ? fmtNum(f.area_m2, 'm²') : '—'], [k.dims, dims], [k.altura, f.altura_libre_m ? fmtNum(f.altura_libre_m, 'm') : L.tri.pd],
    [k.niveles, f.niveles ? fmtNum(f.niveles) : L.tri.pd], [k.mezz, L.tri[f.mezzanine]], [k.aisl, L.tri[f.aislamiento]], [k.cerr, L.cerramientos[f.cerramiento] || f.cerramiento],
    [k.puertas, f.puertas === null ? L.tri.pd : fmtNum(f.puertas)], [k.docks, f.docks === null ? L.tri.pd : fmtNum(f.docks)], [k.luz, f.luz_libre_m ? fmtNum(f.luz_libre_m, 'm') : (f.grandes_luces === 'si' ? L.tri.si : L.tri[f.grandes_luces])], [k.cargas, cargas],
    [k.proceso, f.proceso_especial === 'si' ? [L.tri.si, f.proceso_desc].filter(Boolean).join(' · ') : L.tri[f.proceso_especial]], [k.areas, f.areas_admin === 'si' ? [L.tri.si, f.areas_desc].filter(Boolean).join(' · ') : L.tri[f.areas_admin]],
    [k.alcance, L.alcances[f.alcance] || f.alcance], [k.cond, L.condiciones[f.condicion] || f.condicion], [k.llave, f.llave_en_mano ? L.tri.si : L.tri.no], [k.lugar, f.lugar_entrega]
  ];
  if (f.llave_en_mano && f.trabajos_llave) pairs.push([k.trabajos, f.trabajos_llave]);
  if (f.observaciones) pairs.push([k.obs, f.observaciones]);
  return pairs;
}

/** PDF para el cliente: resumen de precalificación (idioma de la ficha). */
async function pdfCliente({ ficha: f, resultado: r, ref, fecha: fch, empresa }) {
  const lang = f.idioma; const L = t(lang); const es = lang !== 'en';
  const doc = new Doc({
    lang, title: (es ? 'Resumen de precalificación ' : 'Prequalification summary ') + ref,
    headRight: [es ? 'PRECALIFICACIÓN DE NAVE' : 'BUILDING PREQUALIFICATION', `Ref. ${ref}`, fecha(fch, lang)],
    footerNote: L.nota_general + '  ·  ' + empresa.nombre + ' · ' + empresa.correo + (empresa.whatsapp ? ' · WhatsApp ' + empresa.whatsapp : '')
  });
  doc.title(es ? 'Resumen de precalificación' : 'Prequalification summary', [f.proyecto, f.empresa, f.ubicacion].filter(Boolean).join(' · '));

  doc.section(es ? 'Clasificación preliminar' : 'Preliminary classification');
  doc.badge(labelCategoria(r, L), r.estado === 'pendiente' ? (es ? 'Faltan datos esenciales' : 'Essential data missing') : L.estado[r.estado], L.explica[r.categoria]);
  const conf = r.factores.filter(x => x.estado === 'confirmado').map(x => `${L.factores[x.clave]}${x.detalle !== undefined && x.detalle !== '' && x.clave !== 'cargas' ? ' (' + fmtNum(x.detalle, x.clave === 'luz' || x.clave === 'altura' ? 'm' : '') + ')' : ''}`);
  const pend = r.pendientes.map(k => L.factores[k] || k);
  const half = (W - 16) / 2; const y0 = doc.doc.y;
  doc.doc.font(doc.f('BB')).fontSize(7.5).fillColor(C.steel).text((es ? 'Requisitos identificados' : 'Identified requirements').toUpperCase(), PAGE.m, y0, { width: half, characterSpacing: 0.6 });
  doc.doc.text((es ? 'Datos por confirmar' : 'Data to confirm').toUpperCase(), PAGE.m + half + 16, y0, { width: half, characterSpacing: 0.6 });
  doc.doc.y = y0 + 12;
  const yA = doc.doc.y;
  doc.bullets(conf.length ? conf : [es ? 'Sin requisitos adicionales identificados.' : 'No additional requirements identified.'], { width: half, x: PAGE.m, size: 9.5 });
  const yEndA = doc.doc.y; doc.doc.y = yA;
  doc.bullets(pend.length ? pend : [es ? 'Ninguno. La información está completa para esta etapa.' : 'None. The information is complete for this stage.'], { width: half, x: PAGE.m + half + 16, size: 9.5 });
  doc.doc.y = Math.max(yEndA, doc.doc.y);

  doc.section(es ? 'Estimado referencial' : 'Reference estimate');
  if (r.estimado) {
    const e = r.estimado;
    doc.bigRange(`${money(e.min, e.moneda)} – ${money(e.max, e.moneda)}`, es
      ? `${fmtNum(e.area_m2, 'm²')} × ${money(e.por_m2_min, e.moneda)}–${money(e.por_m2_max, e.moneda)} por m² · ${L.bandas[r.banda.paquete]} · ${e.condicion}${e.provisional ? ' · ' + (es ? 'sujeto a la categoría definitiva' : 'subject to final category') : ''}`
      : `${fmtNum(e.area_m2, 'm²')} × ${money(e.por_m2_min, e.moneda)}–${money(e.por_m2_max, e.moneda)} per m² · ${L.bandas[r.banda.paquete]} · ${e.condicion}${e.provisional ? ' · subject to final category' : ''}`);
    doc.note(L.nota_estimado.replace('{condicion}', e.condicion).replace('{dias}', e.vigencia_dias));
  } else {
    doc.para(L.sin_estimado[r.motivo_sin_estimado] || L.sin_estimado.pendiente, { size: 10 });
  }

  doc.section(es ? 'Próximos pasos' : 'Next steps');
  doc.bullets(es ? [
    `${empresa.nombre} revisará esta precalificación y se pondrá en contacto con usted para confirmar el alcance.`,
    'Para avanzar hacia una propuesta, comparta los planos o croquis disponibles, el uso detallado del espacio y la fecha estimada del proyecto.',
    `Escríbanos a ${empresa.correo}${empresa.whatsapp ? ' o por WhatsApp al ' + empresa.whatsapp : ''} citando la referencia ${ref}.`
  ] : [
    `${empresa.nombre} will review this prequalification and contact you to confirm the scope.`,
    'To move towards a proposal, share any available drawings or sketches, the detailed use of the space and the estimated project date.',
    `Write to ${empresa.correo}${empresa.whatsapp ? ' or WhatsApp ' + empresa.whatsapp : ''} quoting reference ${ref}.`
  ]);

  doc.section(es ? 'Datos del proyecto' : 'Project data');
  doc.kv(datosProyecto(f, L), 2);
  return doc.finish();
}

/** PDF interno para IGS: registro de clasificación (siempre en español). */
async function pdfInterno({ ficha: f, resultado: r, ref, fecha: fch, empresa }) {
  const L = t('es'); const Lc = t(f.idioma);
  const doc = new Doc({
    lang: 'es', title: 'Registro de clasificación ' + ref,
    headRight: ['USO INTERNO · REGISTRO DE CLASIFICACIÓN', `Ref. ${ref}`, fecha(fch, 'es')],
    footerNote: 'Clasificación comercial preliminar según la Guía de clasificación de naves v1.1. No es una certificación, un diseño estructural ni una garantía de precio. Ninguna categoría genera automáticamente un precio.'
  });
  doc.title('Registro de clasificación', [f.empresa, f.proyecto, f.ubicacion].filter(Boolean).join(' · ') + ` · formulario web (${f.idioma === 'en' ? 'inglés' : 'español'})`);

  const reglasConf = r.reglas.filter(x => x.estado === 'confirmada');
  const reglasPend = r.reglas.filter(x => x.estado === 'pendiente');
  const alcanceTxt = L.alcances[f.alcance] || f.alcance;
  const condTxt = (L.condiciones[f.condicion] || f.condicion) + (f.llave_en_mano ? ' · llave en mano solicitada' : '');
  const lineaRegistro = `${r.etiqueta} | ${alcanceTxt} | ${L.condiciones[f.condicion] || f.condicion} | ${L.estado[r.estado]}`;

  doc.section('Resultado');
  doc.badge(r.etiqueta, `${L.estado[r.estado]} · ${r.puntos} punto${r.puntos === 1 ? '' : 's'} confirmado${r.puntos === 1 ? '' : 's'}${r.puntos_max !== r.puntos ? ' (hasta ' + r.puntos_max + ' con los pendientes)' : ''}`, lineaRegistro);

  doc.section('Cliente y contacto');
  doc.kv([
    ['Cliente o empresa', f.empresa], ['Proyecto', f.proyecto], ['Ubicación', f.ubicacion], ['Persona de contacto', f.contacto],
    ['Teléfono', f.telefono], ['Correo', f.correo], ['Fecha y canal', `${fecha(fch, 'es')} · formulario web`], ['Responsable comercial', empresa.responsable || '—']
  ], 2);

  doc.section('Referencia básica utilizada');
  doc.kv([
    ['Altura libre de referencia', fmtNum(r.config_usada.umbral_altura_m, 'm')], ['Altura libre solicitada', f.altura_libre_m ? fmtNum(f.altura_libre_m, 'm') : 'Por definir'],
    ['Luz libre de referencia', fmtNum(r.config_usada.umbral_luz_m, 'm')], ['Luz libre solicitada', f.luz_libre_m ? fmtNum(f.luz_libre_m, 'm') : (f.grandes_luces === 'si' ? 'Sí, sin medida' : L.tri[f.grandes_luces])]
  ], 2);

  doc.section('Factores y puntos');
  doc.table(['Factor', 'Puntos', 'Estado', 'Detalle'], r.factores.map(x => [
    L.factores[x.clave], x.estado === 'confirmado' ? String(x.puntos) : (x.estado === 'pendiente' ? `0 (hasta ${x.max})` : '0'),
    x.estado === 'confirmado' ? 'Confirmado' : x.estado === 'pendiente' ? 'Por definir' : 'No aplica',
    x.detalle !== undefined && x.detalle !== '' ? (x.clave === 'cargas' ? String(x.detalle).split(', ').map(k => L.cargas_tipos[k] || k).join(', ') : fmtNum(x.detalle, x.clave === 'luz' || x.clave === 'altura' ? 'm' : '')) : ''
  ]), [3, 1.2, 1.4, 3]);

  doc.section('Reglas de prioridad');
  if (reglasConf.length) doc.bullets(reglasConf.map(x => `${L.factores[x.clave]} → ${L.reglas[x.efecto]}`));
  else doc.para('Ninguna regla de prioridad confirmada.', { color: C.steel });
  if (reglasPend.length) doc.para('Podrían activarse al cerrar pendientes: ' + reglasPend.map(x => `${L.factores[x.clave]} (${L.reglas[x.efecto]})`).join('; ') + '.', { size: 9.5, color: C.steel });

  doc.section('Alcance, condición y pendientes');
  doc.kv([
    ['Alcance requerido', alcanceTxt], ['Condición y entrega', condTxt], ['Lugar de entrega', f.lugar_entrega], ['Trabajos esperados (llave en mano)', f.llave_en_mano ? (f.trabajos_llave || 'No detallados') : 'No aplica'],
    ['Datos pendientes', r.pendientes.length ? r.pendientes.map(k => L.factores[k] || k).join(', ') : 'Ninguno'], ['Responsable de obtenerlos', r.pendientes.length ? (empresa.responsable || 'IGS') : '—']
  ], 2);

  doc.section('Banda de referencia y estimado comunicado');
  if (r.estimado) {
    const e = r.estimado;
    doc.kv([
      ['Paquete comparable', L.bandas[r.banda.paquete]], ['Banda de venta', `${money(e.por_m2_min, e.moneda)} – ${money(e.por_m2_max, e.moneda)} / m² · ${e.condicion}`],
      ['Área considerada', fmtNum(e.area_m2, 'm²')], ['Estimado mostrado al cliente', `${money(e.min, e.moneda)} – ${money(e.max, e.moneda)}${e.provisional ? ' (categoría provisional)' : ''}`]
    ], 2);
  } else {
    doc.kv([['Paquete comparable', r.banda.paquete ? L.bandas[r.banda.paquete] : 'No determinado'], ['Estimado mostrado al cliente', 'No se mostró: ' + (L.sin_estimado[r.motivo_sin_estimado] || '')]], 2);
  }

  doc.section('Siguiente acción');
  doc.note(L.siguiente[r.siguiente_accion]);

  doc.section('Ficha completa del cliente');
  doc.kv(datosProyecto(f, L), 2);
  if (f.idioma === 'en') doc.para('El cliente completó la ficha en inglés; su resumen en PDF fue generado en inglés.', { size: 9, color: C.steel });
  return doc.finish();
}

module.exports = { pdfCliente, pdfInterno };
