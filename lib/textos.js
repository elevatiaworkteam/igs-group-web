'use strict';
// Textos ES/EN usados por los PDFs y la respuesta de la API.
const T = {
  es: {
    categoria: { Esencial: 'Esencial', Industrial: 'Industrial', Especializada: 'Especializada', Pendiente: 'Pendiente de clasificar' },
    etiqueta: { 'Al menos Industrial': 'Al menos Industrial', 'Pendiente de clasificar': 'Pendiente de clasificar' },
    estado: { preliminar_completa: 'Preliminar completa', preliminar_con_pendientes: 'Preliminar con datos pendientes', provisional: 'Provisional por datos pendientes', pendiente: 'Pendiente de clasificar' },
    explica: {
      Esencial: 'Almacenamiento u operación sencilla, sin requisitos especiales identificados. Configuración dentro de una referencia básica comparable.',
      Industrial: 'Operación con exigencias adicionales de acceso, distribución, altura o equipamiento. Requiere detallar los adicionales antes de definir precio.',
      Especializada: 'Proyecto que requiere una solución particular por sus equipos, cargas o condiciones de operación. Se cotiza de forma específica tras revisión técnica.',
      Pendiente: 'Faltan datos que determinan la categoría. Con la información pendiente podremos clasificar su proyecto.'
    },
    factores: { mezzanine: 'Mezzanine o entrepiso', aislamiento: 'Aislamiento térmico', docks: 'Docks de carga múltiples', luz: 'Grandes luces libres', puente_grua: 'Puente grúa', cargas: 'Cargas especiales', altura: 'Altura superior a referencia', areas: 'Varias áreas funcionales', proceso: 'Refrigeración o proceso especial' },
    reglas: { especializada: 'Especializada directa', min_industrial: 'Mínimo Industrial' },
    usos: { almacen: 'Almacén', manufactura: 'Manufactura', logistica: 'Logística', taller: 'Taller', agroindustria: 'Agroindustria', otro: 'Otro', pd: 'Por definir' },
    alcances: { estructura: 'Solo estructura metálica', cubierta: 'Estructura + cubierta', cerramientos: 'Estructura + cubierta + cerramientos', completa: 'Nave completa', pd: 'Por definir' },
    cerramientos: { basico: 'Básico', panel_aislado: 'Panel aislado', mixto: 'Mixto', pd: 'Por definir' },
    condiciones: { EXW: 'EXW', FOB: 'FOB', CIF: 'CIF', nd: 'No definida' },
    tri: { si: 'Sí', no: 'No', pd: 'Por definir' },
    cargas_tipos: { equipos_pesados: 'Equipos pesados', racks_altos: 'Racks altos', puente_grua: 'Puente grúa', maquinaria: 'Maquinaria' },
    bandas: { lamina: 'Lámina sin aislamiento', aislado: 'Aislado y galvanizado' },
    sin_estimado: {
      especializada: 'Su proyecto requiere una solución particular; IGS lo cotiza de forma específica tras una revisión técnica.',
      pendiente: 'Para ofrecer un estimado referencial necesitamos completar los datos pendientes.',
      provisional: 'La categoría es provisional; el estimado se emitirá al completar los datos pendientes.',
      sin_area: 'Indique el área aproximada o el largo y ancho de la nave para calcular un estimado referencial.',
      aislamiento_pendiente: 'Indique si requiere aislamiento térmico para seleccionar la referencia de precio.',
      alcance: 'El alcance seleccionado no tiene una referencia de precio por m²; IGS lo cotiza de forma específica.'
    },
    siguiente: {
      esencial: 'Buscar una referencia básica comparable y preparar propuesta de suministro.',
      industrial: 'Detallar los adicionales confirmados antes de pedir precio al proveedor.',
      especializada: 'Solicitar revisión específica del proveedor o técnico antes de cualquier rango de precio.',
      provisional: 'Cerrar los datos pendientes que afectan la categoría antes de buscar un rango comparable.',
      pendiente: 'Solicitar la información pendiente antes de clasificar; no asignar Esencial por defecto.'
    },
    nota_estimado: 'Este estimado es referencial y no representa un precio definitivo hasta contar con los planos del proyecto. Corresponde a suministro {condicion} de estructura, cubierta y cerramientos según la categoría preliminar; no incluye obra civil, montaje, permisos ni ejecución local. Vigencia de referencia: {dias} días.',
    nota_general: 'Documento preliminar generado a partir de la información suministrada por el cliente. No constituye oferta, diseño estructural ni garantía de precio.'
  },
  en: {
    categoria: { Esencial: 'Essential', Industrial: 'Industrial', Especializada: 'Specialized', Pendiente: 'Pending classification' },
    etiqueta: { 'Al menos Industrial': 'At least Industrial', 'Pendiente de clasificar': 'Pending classification' },
    estado: { preliminar_completa: 'Preliminary, complete', preliminar_con_pendientes: 'Preliminary, with pending data', provisional: 'Provisional, pending data', pendiente: 'Pending classification' },
    explica: {
      Esencial: 'Storage or simple operation with no special requirements identified. Configuration within a comparable basic reference.',
      Industrial: 'Operation with additional requirements for access, layout, height or equipment. The add-ons must be detailed before pricing.',
      Especializada: 'Project that requires a particular solution due to its equipment, loads or operating conditions. Quoted specifically after technical review.',
      Pendiente: 'Data that determines the category is missing. With the pending information we will be able to classify your project.'
    },
    factores: { mezzanine: 'Mezzanine or intermediate floor', aislamiento: 'Thermal insulation', docks: 'Multiple loading docks', luz: 'Large clear spans', puente_grua: 'Overhead crane', cargas: 'Special loads', altura: 'Height above reference', areas: 'Several functional areas', proceso: 'Refrigeration or special process' },
    reglas: { especializada: 'Direct Specialized', min_industrial: 'Minimum Industrial' },
    usos: { almacen: 'Warehouse', manufactura: 'Manufacturing', logistica: 'Logistics', taller: 'Workshop', agroindustria: 'Agro-industry', otro: 'Other', pd: 'To be defined' },
    alcances: { estructura: 'Steel structure only', cubierta: 'Structure + roofing', cerramientos: 'Structure + roofing + cladding', completa: 'Complete building', pd: 'To be defined' },
    cerramientos: { basico: 'Basic', panel_aislado: 'Insulated panel', mixto: 'Mixed', pd: 'To be defined' },
    condiciones: { EXW: 'EXW', FOB: 'FOB', CIF: 'CIF', nd: 'Not defined' },
    tri: { si: 'Yes', no: 'No', pd: 'To be defined' },
    cargas_tipos: { equipos_pesados: 'Heavy equipment', racks_altos: 'High racks', puente_grua: 'Overhead crane', maquinaria: 'Machinery' },
    bandas: { lamina: 'Sheet cladding, no insulation', aislado: 'Insulated and galvanized' },
    sin_estimado: {
      especializada: 'Your project requires a particular solution; IGS quotes it specifically after a technical review.',
      pendiente: 'To provide a reference estimate we need to complete the pending data.',
      provisional: 'The category is provisional; the estimate will be issued once the pending data is completed.',
      sin_area: 'Provide the approximate area or the length and width of the building to calculate a reference estimate.',
      aislamiento_pendiente: 'Indicate whether thermal insulation is required to select the price reference.',
      alcance: 'The selected scope has no per-m² price reference; IGS quotes it specifically.'
    },
    siguiente: {
      esencial: 'Find a comparable basic reference and prepare a supply proposal.',
      industrial: 'Detail the confirmed add-ons before requesting a supplier price.',
      especializada: 'Request a specific review from the supplier or engineer before any price range.',
      provisional: 'Close the pending data that affects the category before looking for a comparable range.',
      pendiente: 'Request the pending information before classifying; do not assign Essential by default.'
    },
    nota_estimado: 'This estimate is for reference only and does not represent a final price until the project drawings are available. It corresponds to {condicion} supply of structure, roofing and cladding according to the preliminary category; it does not include civil works, erection, permits or local execution. Reference validity: {dias} days.',
    nota_general: 'Preliminary document generated from the information provided by the client. It does not constitute an offer, a structural design or a price guarantee.'
  }
};
function t(lang) { return T[lang === 'en' ? 'en' : 'es']; }
module.exports = { T, t };
