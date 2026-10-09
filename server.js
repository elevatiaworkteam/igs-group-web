'use strict';
const express = require('express');
const path = require('path');
const { clasificar, normalizar, DEFAULT_CONFIG } = require('./lib/clasificador');
const { pdfCliente, pdfInterno } = require('./lib/pdf');
const { t } = require('./lib/textos');

const PORT = process.env.PORT || 3000;
const WEBHOOK_URL = process.env.WEBHOOK_URL || 'https://n8n.elevatia.do/webhook/igs-web';
const CONFIG_URL = process.env.CONFIG_URL || 'https://n8n.elevatia.do/webhook/igs-config';
const WEBHOOK_TOKEN = process.env.WEBHOOK_TOKEN || '';
const EMPRESA = {
  nombre: process.env.EMPRESA_NOMBRE || 'IGS Group USA',
  correo: process.env.EMPRESA_CORREO || 'sfernandez@igsgroupusa.com',
  whatsapp: process.env.EMPRESA_WHATSAPP || '',          // se llena cuando exista el número de Miami
  responsable: process.env.EMPRESA_RESPONSABLE || 'Samuel Fernández',
  direccion: process.env.EMPRESA_DIRECCION || '10115 Costa del Sol Blvd, Doral, FL 33178, USA'
};

const app = express();
app.set('trust proxy', true);
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// ---- Configuración viva (bandas y umbrales) desde n8n/Google Sheets, con caché y respaldo ----
let configCache = { at: 0, data: null };
async function getConfig() {
  if (configCache.data && Date.now() - configCache.at < 10 * 60 * 1000) return configCache.data;
  try {
    const ctrl = new AbortController(); const to = setTimeout(() => ctrl.abort(), 6000);
    const res = await fetch(CONFIG_URL, { signal: ctrl.signal, headers: WEBHOOK_TOKEN ? { 'x-igs-token': WEBHOOK_TOKEN } : {} });
    clearTimeout(to);
    if (res.ok) {
      const j = await res.json();
      const raw = Array.isArray(j) ? j[0] : j; const cfg = {};
      for (const k of Object.keys(DEFAULT_CONFIG)) {
        if (raw && raw[k] !== undefined && raw[k] !== '') {
          const v = raw[k];
          cfg[k] = typeof DEFAULT_CONFIG[k] === 'number' ? parseFloat(String(v).replace(',', '.')) : typeof DEFAULT_CONFIG[k] === 'boolean' ? ['si', 'sí', 'yes', 'true', '1', true].includes(typeof v === 'string' ? v.toLowerCase() : v) : String(v);
          if (typeof DEFAULT_CONFIG[k] === 'number' && !Number.isFinite(cfg[k])) delete cfg[k];
        }
      }
      configCache = { at: Date.now(), data: Object.assign({}, DEFAULT_CONFIG, cfg) };
      return configCache.data;
    }
  } catch (e) { console.warn('config remota no disponible:', String(e.message || e)); }
  if (!configCache.data) configCache = { at: Date.now() - 9 * 60 * 1000, data: Object.assign({}, DEFAULT_CONFIG) };
  return configCache.data;
}

// ---- Registro en n8n (hoja + Drive + correo + WhatsApp). No bloquea la respuesta al cliente. ----
async function enviarAn8n(payload) {
  try {
    const ctrl = new AbortController(); const to = setTimeout(() => ctrl.abort(), 25000);
    const res = await fetch(WEBHOOK_URL, { method: 'POST', signal: ctrl.signal, headers: Object.assign({ 'content-type': 'application/json' }, WEBHOOK_TOKEN ? { 'x-igs-token': WEBHOOK_TOKEN } : {}), body: JSON.stringify(payload) });
    clearTimeout(to);
    console.log(`n8n ${payload.tipo} ${payload.ref || ''} → ${res.status}`);
    return res.ok;
  } catch (e) { console.error('n8n no respondió:', String(e.message || e)); return false; }
}

// ---- PDFs en memoria por referencia (24 h) ----
const PDFS = new Map();
function guardarPDF(ref, buf, nombre) { PDFS.set(ref, { buf, nombre, at: Date.now() }); }
setInterval(() => { const lim = Date.now() - 24 * 3600 * 1000; for (const [k, v] of PDFS) if (v.at < lim) PDFS.delete(k); }, 30 * 60 * 1000).unref();

// ---- Límite simple por IP (protección básica) ----
const HITS = new Map();
function limitar(req, res, next) {
  const ip = req.ip || 'x'; const now = Date.now();
  const h = (HITS.get(ip) || []).filter(ts => now - ts < 3600 * 1000);
  if (h.length >= 30) return res.status(429).json({ ok: false, error: 'Demasiadas solicitudes. Intente más tarde.' });
  h.push(now); HITS.set(ip, h); next();
}
function ref() {
  const d = new Date(); const ymd = d.toISOString().slice(2, 10).replace(/-/g, '');
  const r = Math.random().toString(36).slice(2, 6).toUpperCase().replace(/[0OIL1]/g, 'X');
  return `IGS-${ymd}-${r}`;
}
function limpiarSalida(f, r, L) {
  return {
    categoria: r.categoria, etiqueta: r.etiqueta, etiqueta_texto: r.etiqueta === 'Al menos Industrial' ? L.etiqueta['Al menos Industrial'] : (L.categoria[r.categoria] || r.categoria),
    estado: r.estado, estado_texto: L.estado[r.estado], explicacion: L.explica[r.categoria], puntos: r.puntos, puntos_max: r.puntos_max,
    confirmados: r.factores.filter(x => x.estado === 'confirmado').map(x => ({ clave: x.clave, nombre: L.factores[x.clave], puntos: x.puntos })),
    pendientes: r.pendientes.map(k => ({ clave: k, nombre: L.factores[k] || k })),
    estimado: r.estimado ? Object.assign({}, r.estimado, { paquete: L.bandas[r.banda.paquete], nota: L.nota_estimado.replace('{condicion}', r.estimado.condicion).replace('{dias}', r.estimado.vigencia_dias) }) : null,
    motivo_sin_estimado: r.estimado ? null : (L.sin_estimado[r.motivo_sin_estimado] || null)
  };
}

app.get('/health', (req, res) => res.json({ ok: true, pdfs: PDFS.size, config_at: configCache.at ? new Date(configCache.at).toISOString() : null }));

app.post('/api/precalificar', limitar, async (req, res) => {
  try {
    const b = req.body || {};
    if (b.website) return res.json({ ok: true, ref: ref() }); // honeypot
    const f = normalizar(b);
    const L = t(f.idioma); const es = f.idioma !== 'en';
    const faltan = [];
    if (!f.contacto && !f.empresa) faltan.push(es ? 'nombre o empresa' : 'name or company');
    if (!f.telefono && !f.correo) faltan.push(es ? 'teléfono o correo' : 'phone or email');
    if (faltan.length) return res.status(400).json({ ok: false, error: (es ? 'Faltan datos: ' : 'Missing data: ') + faltan.join(', ') });
    const cfg = await getConfig();
    const r = clasificar(f, cfg);
    const id = ref(); const fecha = new Date();
    const [pc, pi] = await Promise.all([pdfCliente({ ficha: f, resultado: r, ref: id, fecha, empresa: EMPRESA }), pdfInterno({ ficha: f, resultado: r, ref: id, fecha, empresa: EMPRESA })]);
    const nombreCliente = (es ? 'Precalificacion-' : 'Prequalification-') + id + '.pdf';
    guardarPDF(id, pc, nombreCliente);
    const salida = limpiarSalida(f, r, L);
    enviarAn8n({
      tipo: 'precalificacion', ref: id, fecha: fecha.toISOString(), idioma: f.idioma, ficha: f, resultado: r, resumen: salida,
      etiqueta: r.etiqueta, categoria: r.categoria, estado: r.estado, puntos: r.puntos,
      estimado_min: r.estimado ? r.estimado.min : '', estimado_max: r.estimado ? r.estimado.max : '',
      pendientes: r.pendientes.map(k => L.factores[k] || k).join(', '),
      confirmados: salida.confirmados.map(x => `${x.nombre} (${x.puntos})`).join(', '),
      pdf_cliente_nombre: nombreCliente, pdf_cliente_b64: pc.toString('base64'),
      pdf_interno_nombre: 'Registro-' + id + '.pdf', pdf_interno_b64: pi.toString('base64')
    });
    res.json(Object.assign({ ok: true, ref: id, pdf_url: `/api/precalificacion/${id}.pdf`, pdf_nombre: nombreCliente }, salida));
  } catch (e) {
    console.error('precalificar:', e);
    res.status(500).json({ ok: false, error: 'No se pudo procesar la ficha. Intente de nuevo.' });
  }
});

app.get('/api/precalificacion/:ref.pdf', (req, res) => {
  const p = PDFS.get(String(req.params.ref || '').toUpperCase());
  if (!p) return res.status(404).send('PDF no disponible. Solicite una copia citando su referencia.');
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `inline; filename="${p.nombre}"`);
  res.end(p.buf);
});

// Solicitud de suministros industriales y contacto general → n8n
app.post('/api/solicitud', limitar, async (req, res) => {
  const b = req.body || {};
  if (b.website) return res.json({ ok: true });
  const tipo = ['suministros', 'contacto'].includes(b.tipo) ? b.tipo : 'contacto';
  const s = (k, m) => String(b[k] == null ? '' : b[k]).trim().slice(0, m || 200);
  const datos = { tipo, ref: ref(), fecha: new Date().toISOString(), idioma: b.idioma === 'en' ? 'en' : 'es', nombre: s('nombre', 80), empresa: s('empresa', 120), telefono: s('telefono', 40), correo: s('correo', 120), producto: s('producto', 200), aplicacion: s('aplicacion', 300), especificacion: s('especificacion', 300), cantidad: s('cantidad', 60), destino: s('destino', 160), fecha_requerida: s('fecha_requerida', 60), mensaje: s('mensaje', 1500) };
  if (!datos.nombre && !datos.empresa) return res.status(400).json({ ok: false, error: datos.idioma === 'en' ? 'Name or company is required.' : 'Indique su nombre o empresa.' });
  if (!datos.telefono && !datos.correo) return res.status(400).json({ ok: false, error: datos.idioma === 'en' ? 'Phone or email is required.' : 'Indique un teléfono o un correo.' });
  const ok = await enviarAn8n(datos);
  res.json({ ok: true, ref: datos.ref, entregado: ok });
});

// Sitio estático (landing ES/EN + formularios)
app.use(express.static(path.join(__dirname, 'public'), { extensions: ['html'], maxAge: process.env.NODE_ENV === 'production' ? '1h' : 0, etag: true }));
app.use((req, res) => res.status(404).sendFile(path.join(__dirname, 'public', '404.html')));

app.listen(PORT, () => console.log(`IGS Group web · puerto ${PORT}`));
