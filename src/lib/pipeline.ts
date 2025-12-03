import { PipelineState } from "@/types/crm";

// Pipeline V3: 4 etapas principales + 1 auxiliar + 2 terminales
export const PIPELINE_STATES: PipelineState[] = [
  {
    id: "contacto_inicial",
    name: "Contacto Inicial",
    recommendedMessage: "Hola, ¿cómo estás? Soy Mario de MiWebYa.\nVi tu negocio y noté varias oportunidades para mejorar tu presencia en Google.\n¿Te gustaría que te muestre cómo podemos ayudarte?",
    nextStateId: "valor_entregado",
    objective: "Obtener la primera respuesta del lead.",
    action: "Enviar primer mensaje personalizado ofreciendo valor.",
    advanceCriteria: "El lead responde mostrando interés."
  },
  {
    id: "valor_entregado",
    name: "Valor Entregado",
    recommendedMessage: "Genial! Te preparé un video corto (2 min) mostrando exactamente qué mejoraríamos en tu presencia online.\n¿Te lo mando?",
    nextStateId: "interaccion_activa",
    objective: "Entregar valor tangible (video, análisis, recurso).",
    action: "Enviar video personalizado o recurso de valor.",
    advanceCriteria: "El lead consume el contenido y responde."
  },
  {
    id: "interaccion_activa",
    name: "Interacción Activa",
    recommendedMessage: "¿Qué te pareció? Si quieres, podemos agendar una llamada de 15 min para mostrarte ejemplos en vivo y responder tus dudas.",
    nextStateId: "demo_evaluacion",
    objective: "Mantener conversación activa y avanzar hacia demo.",
    action: "Proponer llamada/demo basándose en el interés mostrado.",
    advanceCriteria: "Se agenda o realiza una demo/llamada."
  },
  {
    id: "demo_evaluacion",
    name: "Demo / Evaluación",
    recommendedMessage: "Gracias por tu tiempo en la llamada! Te envío la propuesta con los detalles que conversamos.\n¿Cuándo podemos confirmar para arrancar?",
    nextStateId: "win",
    objective: "Presentar propuesta y obtener decisión.",
    action: "Realizar demo, enviar propuesta y hacer seguimiento.",
    advanceCriteria: "El lead acepta (Win) o rechaza (Lost)."
  },
  {
    id: "follow_up",
    name: "Follow Up",
    recommendedMessage: "Hola! ¿Cómo va todo? Quería hacer seguimiento de nuestra conversación anterior.\n¿Tuviste tiempo de pensarlo?",
    objective: "Reactivar leads que dejaron de responder.",
    action: "Enviar mensaje de seguimiento sin ser invasivo.",
    advanceCriteria: "El lead retoma la conversación (vuelve a etapa anterior)."
  },
  {
    id: "win",
    name: "Cliente",
    recommendedMessage: "¡Excelente! Bienvenido a MiWebYa. Te envío los próximos pasos para arrancar con tu proyecto.",
    objective: "Formalizar inicio del proyecto.",
    action: "Enviar bienvenida y próximos pasos.",
    advanceCriteria: "Proyecto iniciado - Estado final."
  },
  {
    id: "lost",
    name: "Perdido / No Ahora",
    recommendedMessage: "Entiendo perfectamente. Quedamos en contacto por si en el futuro necesitas nuestros servicios. ¡Éxitos!",
    objective: "Cerrar el ciclo de forma profesional.",
    action: "Enviar mensaje de despedida dejando puerta abierta.",
    advanceCriteria: "Lead archivado - Estado final."
  }
];

// Estados principales del pipeline (excluyendo auxiliares y terminales)
export const MAIN_PIPELINE_STATES = PIPELINE_STATES.filter(
  state => !["follow_up", "win", "lost"].includes(state.id)
);

// Estados terminales
export const TERMINAL_STATES = ["win", "lost"];

// Estado auxiliar
export const AUXILIARY_STATE = "follow_up";

export const getPipelineState = (stateId: string): PipelineState | undefined => {
  return PIPELINE_STATES.find(state => state.id === stateId);
};

export const getNextState = (currentStateId: string): PipelineState | undefined => {
  // Estados terminales y auxiliares no tienen siguiente estado lineal
  if (TERMINAL_STATES.includes(currentStateId) || currentStateId === AUXILIARY_STATE) {
    return undefined;
  }
  const currentState = getPipelineState(currentStateId);
  if (!currentState?.nextStateId) return undefined;
  return getPipelineState(currentState.nextStateId);
};

export const getPreviousState = (currentStateId: string): PipelineState | undefined => {
  // Para estados no lineales, no hay anterior directo
  if (TERMINAL_STATES.includes(currentStateId) || currentStateId === AUXILIARY_STATE) {
    return undefined;
  }
  return MAIN_PIPELINE_STATES.find(state => state.nextStateId === currentStateId);
};

export const isTerminalState = (stateId: string): boolean => {
  return TERMINAL_STATES.includes(stateId);
};

export const isAuxiliaryState = (stateId: string): boolean => {
  return stateId === AUXILIARY_STATE;
};
