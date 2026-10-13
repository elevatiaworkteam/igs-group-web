/* Precalificador de naves IGS Group USA — formulario en 4 pasos (ES/EN) que envía a /api/precalificar */
(function () {
  const lang = document.documentElement.lang === 'en' ? 'en' : 'es';
  const S = window.SITE || {};
  const I = {
    es: {
      steps: ['Datos del proyecto', 'Características técnicas', 'Alcance y condición', 'Sus datos'],
      next: 'Siguiente', back: 'Atrás', submit: 'Obtener precalificación', sending: 'Procesando…', pd: 'Por definir', si: 'Sí', no: 'No',
      required: 'El campo Cliente o empresa es obligatorio.', needArea: 'Indique el área aproximada o el largo y el ancho.', needContact: 'Indique un teléfono o un correo.', needName: 'Indique la persona de contacto.',
      intro: 'Si un dato aún no está disponible, marque «Por definir» o deje el campo vacío. Con los datos confirmados le indicamos la categoría preliminar de su nave.',
      f: {
        empresa: 'Cliente o empresa *', proyecto: 'Nombre del proyecto', ubicacion: 'Ubicación del proyecto', uso: 'Uso principal de la nave', uso_otro: 'Especifique el uso',
        area_m2: 'Área aproximada (m²)', largo_m: 'Largo (m)', ancho_m: 'Ancho (m)', dims_hint: 'Si no conoce el área, indique largo y ancho.',
        altura_libre_m: 'Altura libre requerida (m)', altura_hint: 'Deje vacío si está por definir.', niveles: 'Número de niveles',
        mezzanine: '¿Necesita mezzanine o entrepiso?', aislamiento: '¿Necesita aislamiento térmico?', cerramiento: 'Tipo de cerramiento',
        puertas: 'Puertas de acceso', docks: 'Docks de carga y descarga', docks_hint: 'Puertas a nivel no son docks.',
        grandes_luces: '¿Requiere grandes luces libres sin columnas interiores?', luz_libre_m: 'Luz libre aproximada requerida (m)',
        cargas: '¿Tendrá cargas especiales o equipos que debamos considerar?', cargas_tipos: 'Marque los que apliquen', cargas_desc: 'Describa los equipos y las cargas o capacidades conocidas',
        proceso_especial: '¿Requiere refrigeración, control de temperatura, higiene o un ambiente especial?', proceso_hint: 'El aislamiento térmico por sí solo no cuenta aquí.', proceso_desc: 'Describa la condición requerida',
        areas_admin: '¿Necesita áreas administrativas integradas?', areas_desc: 'Área aproximada y requerimientos',
        alcance: 'Marque la opción que mejor describa el alcance esperado', condicion: 'Condición comercial deseada', llave_en_mano: 'Solicito alcance llave en mano',
        lugar_entrega: 'Lugar de entrega o destino previsto', trabajos_llave: 'Si solicita llave en mano, indique los trabajos que espera incluir', observaciones: 'Observaciones o requerimientos adicionales',
        contacto: 'Persona de contacto *', telefono: 'Teléfono o WhatsApp', correo: 'Correo electrónico', privacidad: 'Sus datos se usan únicamente para evaluar su proyecto y contactarle. No se comparten con terceros.'
      },
      usos: { almacen: 'Almacén', manufactura: 'Manufactura', logistica: 'Logística', taller: 'Taller', agroindustria: 'Agroindustria', otro: 'Otro' },
      cerr: { basico: 'Básico', panel_aislado: 'Panel aislado', mixto: 'Mixto', pd: 'Por definir' },
      cargasT: { equipos_pesados: 'Equipos pesados', racks_altos: 'Racks altos', puente_grua: 'Puente grúa', maquinaria: 'Maquinaria' },
      alc: { estructura: ['Solo estructura metálica', 'Columnas, vigas, pórticos, cerchas, correas y arriostramientos.'], cubierta: ['Estructura + cubierta', 'Incluye el sistema de cubierta.'], cerramientos: ['Estructura + cubierta + cerramientos', 'Incluye cubierta y cerramientos laterales.'], completa: ['Nave completa', 'Estructura, envolvente y complementos.'], pd: ['Aún por definir', 'Lo definimos juntos.'] },
      cond: { EXW: 'EXW', FOB: 'FOB', CIF: 'CIF', nd: 'No definido' },
      r: { title: 'Resultado de su precalificación', ref: 'Referencia', conf: 'Requisitos identificados', pend: 'Datos por confirmar', none: 'Sin requisitos adicionales identificados.', nonePend: 'Ninguno. La información está completa para esta etapa.', est: 'Estimado referencial', perM2: 'por m²', area: 'Área considerada', pdf: 'Descargar resumen en PDF', wa: 'Escribir por WhatsApp', mail: 'Escribir por correo', again: 'Nueva ficha', sent: 'IGS Group USA recibió su ficha y le contactará para confirmar el alcance. Guarde su referencia.', error: 'No pudimos procesar la ficha. Intente de nuevo o escríbanos a ' }
    },
    en: {
      steps: ['Project data', 'Technical characteristics', 'Scope and terms', 'Your details'],
      next: 'Next', back: 'Back', submit: 'Get prequalification', sending: 'Processing…', pd: 'To be defined', si: 'Yes', no: 'No',
      required: 'Client or company is required.', needArea: 'Enter the approximate area or the length and width.', needContact: 'Enter a phone number or an email.', needName: 'Enter the contact person.',
      intro: 'If a piece of data is not available yet, select "To be defined" or leave the field empty. With the confirmed data we will indicate the preliminary category of your building.',
      f: {
        empresa: 'Client or company *', proyecto: 'Project name', ubicacion: 'Project location', uso: 'Main use of the building', uso_otro: 'Specify the use',
        area_m2: 'Approximate area (m²)', largo_m: 'Length (m)', ancho_m: 'Width (m)', dims_hint: 'If you do not know the area, enter length and width.',
        altura_libre_m: 'Required clear height (m)', altura_hint: 'Leave empty if not defined yet.', niveles: 'Number of levels',
        mezzanine: 'Do you need a mezzanine or intermediate floor?', aislamiento: 'Do you need thermal insulation?', cerramiento: 'Cladding type',
        puertas: 'Access doors', docks: 'Loading docks', docks_hint: 'Ground-level doors are not docks.',
        grandes_luces: 'Do you require large clear spans without interior columns?', luz_libre_m: 'Approximate required clear span (m)',
        cargas: 'Will there be special loads or equipment we should consider?', cargas_tipos: 'Check all that apply', cargas_desc: 'Describe the equipment and the known loads or capacities',
        proceso_especial: 'Do you require refrigeration, temperature control, hygiene or a special environment?', proceso_hint: 'Thermal insulation alone does not count here.', proceso_desc: 'Describe the required condition',
        areas_admin: 'Do you need integrated office areas?', areas_desc: 'Approximate area and requirements',
        alcance: 'Select the option that best describes the expected scope', condicion: 'Desired commercial terms', llave_en_mano: 'I request a turnkey scope',
        lugar_entrega: 'Delivery location or intended destination', trabajos_llave: 'If you request turnkey, indicate the works you expect to include', observaciones: 'Remarks or additional requirements',
        contacto: 'Contact person *', telefono: 'Phone or WhatsApp', correo: 'Email', privacidad: 'Your data is used only to evaluate your project and contact you. It is not shared with third parties.'
      },
      usos: { almacen: 'Warehouse', manufactura: 'Manufacturing', logistica: 'Logistics', taller: 'Workshop', agroindustria: 'Agro-industry', otro: 'Other' },
      cerr: { basico: 'Basic', panel_aislado: 'Insulated panel', mixto: 'Mixed', pd: 'To be defined' },
      cargasT: { equipos_pesados: 'Heavy equipment', racks_altos: 'High racks', puente_grua: 'Overhead crane', maquinaria: 'Machinery' },
      alc: { estructura: ['Steel structure only', 'Columns, beams, frames, trusses, purlins and bracing.'], cubierta: ['Structure + roofing', 'Includes the roofing system.'], cerramientos: ['Structure + roofing + cladding', 'Includes roofing and side cladding.'], completa: ['Complete building', 'Structure, envelope and complements.'], pd: ['To be defined', 'We define it together.'] },
      cond: { EXW: 'EXW', FOB: 'FOB', CIF: 'CIF', nd: 'Not defined' },
      r: { title: 'Your prequalification result', ref: 'Reference', conf: 'Identified requirements', pend: 'Data to confirm', none: 'No additional requirements identified.', nonePend: 'None. The information is complete for this stage.', est: 'Reference estimate', perM2: 'per m²', area: 'Area considered', pdf: 'Download PDF summary', wa: 'Write on WhatsApp', mail: 'Write by email', again: 'New form', sent: 'IGS Group USA has received your form and will contact you to confirm the scope. Keep your reference.', error: 'We could not process the form. Please try again or write to ' }
    }
  }[lang];

  const root = document.getElementById('pre'); if (!root) return;
  const KEY = 'igs_pre_' + lang;
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
  const tri = (name, label, hint) => `<div><label>${label}${hint ? `<span class="hint">${hint}</span>` : ''}</label><div class="chips">${[['si', I.si], ['no', I.no], ['pd', I.pd]].map(([v, l]) => `<label class="chip"><input type="radio" name="${name}" value="${v}"><span>${l}</span></label>`).join('')}</div></div>`;
  const chips = (name, label, opts, type) => `<div><label>${label}</label><div class="chips">${Object.entries(opts).map(([v, l]) => `<label class="chip"><input type="${type || 'radio'}" name="${name}" value="${v}"><span>${l}</span></label>`).join('')}</div></div>`;
  const input = (name, label, type, hint, attrs) => `<div><label for="f_${name}">${label}${hint ? `<span class="hint">${hint}</span>` : ''}</label><input id="f_${name}" name="${name}" type="${type || 'text'}" ${attrs || ''}></div>`;
  const area = (name, label, hint) => `<div><label for="f_${name}">${label}${hint ? `<span class="hint">${hint}</span>` : ''}</label><textarea id="f_${name}" name="${name}"></textarea></div>`;
  const cond = (dep, html) => `<div data-dep="${dep}" style="display:none">${html}</div>`;

  const steps = [
    `<div class="form">
      ${input('empresa', I.f.empresa, 'text', '', 'autocomplete="organization" required')}
      <div class="row">${input('proyecto', I.f.proyecto)}${input('ubicacion', I.f.ubicacion)}</div>
      ${chips('uso', I.f.uso, I.usos)}
      ${cond('uso=otro', input('uso_otro', I.f.uso_otro))}
      <div class="row three">${input('area_m2', I.f.area_m2, 'number', '', 'min="0" step="any" inputmode="decimal"')}${input('largo_m', I.f.largo_m, 'number', '', 'min="0" step="any" inputmode="decimal"')}${input('ancho_m', I.f.ancho_m, 'number', I.f.dims_hint, 'min="0" step="any" inputmode="decimal"')}</div>
    </div>`,
    `<div class="form">
      <div class="row">${input('altura_libre_m', I.f.altura_libre_m, 'number', I.f.altura_hint, 'min="0" step="any" inputmode="decimal"')}${input('niveles', I.f.niveles, 'number', '', 'min="1" step="1" inputmode="numeric"')}</div>
      ${tri('mezzanine', I.f.mezzanine)}
      ${tri('aislamiento', I.f.aislamiento)}
      ${chips('cerramiento', I.f.cerramiento, I.cerr)}
      <div class="row">${input('puertas', I.f.puertas, 'number', '', 'min="0" step="1" inputmode="numeric"')}${input('docks', I.f.docks, 'number', I.f.docks_hint, 'min="0" step="1" inputmode="numeric"')}</div>
      ${tri('grandes_luces', I.f.grandes_luces)}
      ${cond('grandes_luces=si', input('luz_libre_m', I.f.luz_libre_m, 'number', '', 'min="0" step="any" inputmode="decimal"'))}
      ${tri('cargas', I.f.cargas)}
      ${cond('cargas=si', `<div class="form">${chips('cargas_tipos', I.f.cargas_tipos, I.cargasT, 'checkbox')}${area('cargas_desc', I.f.cargas_desc)}</div>`)}
      ${tri('proceso_especial', I.f.proceso_especial, I.f.proceso_hint)}
      ${cond('proceso_especial=si', input('proceso_desc', I.f.proceso_desc))}
      ${tri('areas_admin', I.f.areas_admin)}
      ${cond('areas_admin=si', input('areas_desc', I.f.areas_desc))}
    </div>`,
    `<div class="form">
      <div><label>${I.f.alcance}</label><div class="checks">${Object.entries(I.alc).map(([v, [l, d]]) => `<label class="check"><input type="radio" name="alcance" value="${v}"><span><strong>${l}</strong><br><span class="muted small">${d}</span></span></label>`).join('')}</div></div>
      ${chips('condicion', I.f.condicion, I.cond)}
      <label class="check"><input type="checkbox" name="llave_en_mano" value="si"><span>${I.f.llave_en_mano}</span></label>
      ${input('lugar_entrega', I.f.lugar_entrega)}
      ${cond('llave_en_mano=si', area('trabajos_llave', I.f.trabajos_llave))}
      ${area('observaciones', I.f.observaciones)}
    </div>`,
    `<div class="form">
      ${input('contacto', I.f.contacto, 'text', '', 'autocomplete="name" required')}
      <div class="row">${input('telefono', I.f.telefono, 'tel', '', 'autocomplete="tel"')}${input('correo', I.f.correo, 'email', '', 'autocomplete="email"')}</div>
      <input type="text" name="website" class="sr" tabindex="-1" autocomplete="off">
      <p class="field-note">${I.f.privacidad}</p>
    </div>`
  ];

  let cur = 0;
  root.innerHTML = `<p class="lead" style="font-size:1.02rem">${I.intro}</p><div class="stepper">${I.steps.map((s, i) => `<div data-i="${i}">${i + 1}. ${s}</div>`).join('')}</div>
    <form id="preForm" novalidate>${steps.map((h, i) => `<fieldset class="panel" data-step="${i}" style="display:none"><legend>${I.steps[i]}</legend>${h}<p class="error" data-err></p>
    <div class="panel-foot"><button type="button" class="btn btn-ghost" data-back>${I.back}</button>${i < steps.length - 1 ? `<button type="button" class="btn" data-next>${I.next}</button>` : `<button type="submit" class="btn">${I.submit}</button>`}</div></fieldset>`).join('')}</form><div id="preResult"></div>`;
  const form = root.querySelector('#preForm');

  // Dependencias (mostrar campos según respuesta)
  function refreshDeps() {
    root.querySelectorAll('[data-dep]').forEach(el => {
      const [n, v] = el.dataset.dep.split('='); const ins = form.querySelectorAll(`[name="${n}"]`);
      let val = ''; ins.forEach(i => { if ((i.type === 'radio' || i.type === 'checkbox') ? i.checked : true) val = i.value; });
      el.style.display = val === v ? '' : 'none';
    });
  }
  function show(i) {
    cur = i; root.querySelectorAll('[data-step]').forEach(fs => fs.style.display = +fs.dataset.step === i ? '' : 'none');
    root.querySelectorAll('.stepper div').forEach(d => { d.classList.toggle('active', +d.dataset.i === i); d.classList.toggle('done', +d.dataset.i < i); });
    root.querySelector(`[data-step="${i}"] [data-back]`).style.visibility = i === 0 ? 'hidden' : 'visible';
    window.scrollTo({ top: root.offsetTop - 90, behavior: 'smooth' });
  }
  function data() {
    const d = {}; new FormData(form).forEach((v, k) => { if (k === 'cargas_tipos') (d[k] = d[k] || []).push(v); else d[k] = v; });
    d.idioma = lang; return d;
  }
  function validate(i) {
    const fs = root.querySelector(`[data-step="${i}"]`); const err = fs.querySelector('[data-err]'); err.textContent = '';
    const d = data();
    if (i === 0) { if (!d.empresa) return err.textContent = I.required, false; if (!(+d.area_m2 > 0) && !(+d.largo_m > 0 && +d.ancho_m > 0)) return err.textContent = I.needArea, false; }
    if (i === 3) { if (!d.contacto) return err.textContent = I.needName, false; if (!d.telefono && !d.correo) return err.textContent = I.needContact, false; }
    return true;
  }
  root.querySelectorAll('[data-next]').forEach(b => b.addEventListener('click', () => { if (validate(cur)) show(cur + 1); }));
  root.querySelectorAll('[data-back]').forEach(b => b.addEventListener('click', () => show(Math.max(0, cur - 1))));
  form.addEventListener('input', () => { refreshDeps(); try { localStorage.setItem(KEY, JSON.stringify(data())); } catch (e) {} });
  form.addEventListener('change', refreshDeps);
  // Restaurar borrador
  try { const saved = JSON.parse(localStorage.getItem(KEY) || 'null'); if (saved) Object.entries(saved).forEach(([k, v]) => { form.querySelectorAll(`[name="${k}"]`).forEach(el => { if (el.type === 'radio' || el.type === 'checkbox') el.checked = Array.isArray(v) ? v.includes(el.value) : el.value === v; else el.value = v; }); }); } catch (e) {}
  refreshDeps(); show(0);

  const money = (n, m) => (m === 'USD' ? 'US$ ' : m + ' ') + Math.round(n).toLocaleString('en-US');
  const num = n => Number(n).toLocaleString('en-US');
  form.addEventListener('submit', async (e) => {
    e.preventDefault(); if (!validate(3)) return;
    const btn = form.querySelector('button[type=submit]'); btn.disabled = true; btn.innerHTML = `<span class="spinner"></span> ${I.sending}`;
    try {
      const r = await fetch('/api/precalificar', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(data()) });
      const j = await r.json(); if (!r.ok || !j.ok) throw new Error(j.error || 'error');
      try { localStorage.removeItem(KEY); } catch (e) {}
      render(j); if (window.fbq) fbq('track', 'Lead', { content_name: 'precalificacion' });
    } catch (err) {
      const el = form.querySelector('[data-step="3"] [data-err]'); el.textContent = (err.message && err.message !== 'error' ? err.message + ' ' : '') + I.r.error + S.email + '.';
      btn.disabled = false; btn.textContent = I.submit;
    }
  });
  function render(j) {
    form.style.display = 'none'; root.querySelector('.stepper').style.display = 'none'; root.querySelector('.lead').style.display = 'none';
    const R = I.r; const e = j.estimado;
    const waText = encodeURIComponent((lang === 'en' ? `Hello, I completed the prequalification form. Reference ${j.ref}.` : `Hola, completé la ficha de precalificación. Referencia ${j.ref}.`));
    root.querySelector('#preResult').innerHTML = `
      <h2>${R.title}</h2><p class="muted">${R.ref}: <strong>${esc(j.ref)}</strong></p>
      <div class="result-badge"><p class="cat">${esc(j.etiqueta_texto)}</p><p class="state">${esc(j.estado_texto)}</p><p style="margin:0">${esc(j.explicacion)}</p></div>
      <div class="result-cols"><div><h4>${R.conf}</h4><ul class="list">${j.confirmados.length ? j.confirmados.map(x => `<li>${esc(x.nombre)}</li>`).join('') : `<li>${R.none}</li>`}</ul></div>
      <div><h4>${R.pend}</h4><ul class="list">${j.pendientes.length ? j.pendientes.map(x => `<li>${esc(x.nombre)}</li>`).join('') : `<li>${R.nonePend}</li>`}</ul></div></div>
      <div class="estimate"><h4 style="margin:0 0 4px">${R.est}</h4>${e ? `<p class="range">${money(e.min, e.moneda)} – ${money(e.max, e.moneda)}</p><p class="sub">${num(e.area_m2)} m² × ${money(e.por_m2_min, e.moneda)}–${money(e.por_m2_max, e.moneda)} ${R.perM2} · ${esc(e.paquete)} · ${esc(e.condicion)}</p><div class="note">${esc(e.nota)}</div>` : `<p style="margin:0">${esc(j.motivo_sin_estimado || '')}</p>`}</div>
      <p class="alert">${R.sent}</p>
      <div class="actions"><a class="btn" href="${esc(j.pdf_url)}" target="_blank" rel="noopener">${R.pdf}</a>${S.whatsapp ? `<a class="btn btn-wa" href="https://wa.me/${S.whatsapp}?text=${waText}" target="_blank" rel="noopener">${R.wa}</a>` : ''}<a class="btn btn-outline" href="mailto:${esc(S.email)}?subject=${encodeURIComponent((lang === 'en' ? 'Prequalification ' : 'Precalificación ') + j.ref)}">${R.mail}</a><button type="button" class="btn btn-ghost" onclick="location.reload()">${R.again}</button></div>`;
    window.scrollTo({ top: root.offsetTop - 90, behavior: 'smooth' });
  }
})();
