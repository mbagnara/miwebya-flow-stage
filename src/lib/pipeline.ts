import { PipelineState } from "@/types/crm";

export const PIPELINE_STATES: PipelineState[] = [
  {
    id: "nuevo",
    name: "Nuevo",
    recommendedMessage: "Hola, ¿como estas? Soy Mario.\nVi tu negocio y note varias oportunidades para mejorar tu presencia en Google y que mas personas te encuentren.\nSi quieres, te grabo un video corto explicandolo de forma sencilla.\n¿Te lo mando?",
    nextStateId: "respondio",
    objective: "Obtener la primera respuesta del lead.",
    action: "Enviar el primer mensaje base ofreciendo el video corto.",
    advanceCriteria: "El lead responde cualquier mensaje (cualquier tipo de respuesta)."
  },
  {
    id: "respondio",
    name: "Respondió",
    recommendedMessage: "Genial! Te mando un video corto (2 min) explicando cómo funciona nuestra propuesta y qué incluye.",
    nextStateId: "videoEnviado",
    objective: "Transformar la respuesta en algo concreto (video o demo).",
    action: "Ofrecer explícitamente enviar un video o una mini demo.",
    advanceCriteria: "Se envía el video al lead."
  },
  {
    id: "videoEnviado",
    name: "Video Enviado",
    recommendedMessage: "¿Qué te pareció el video? Si querés, podemos agendar una demo de 15 minutos para mostrarte ejemplos en vivo.",
    nextStateId: "demoOfrecida",
    objective: "Conseguir que vea el video y abra la conversación hacia una demo.",
    action: "Enviar mensaje corto de seguimiento preguntando si lo vio y ofreciendo una demo de 5 minutos.",
    advanceCriteria: "Se ofrece formalmente la demo (mensaje enviado desde el CRM)."
  },
  {
    id: "demoOfrecida",
    name: "Demo Ofrecida",
    recommendedMessage: "Perfecto! ¿Qué día y horario te viene bien para la demo? Tengo disponibilidad mañana o pasado.",
    nextStateId: "demoAgendada",
    objective: "Cerrar una fecha y hora para la demo.",
    action: "Preguntar qué día/hora le acomoda más (opción entre hoy/mañana).",
    advanceCriteria: "El lead confirma un horario y se agenda la demo."
  },
  {
    id: "demoAgendada",
    name: "Demo Agendada",
    recommendedMessage: "¡Listo! Te confirmo la demo agendada para [fecha/hora]. Te voy a enviar el link de reunión.",
    nextStateId: "demoRealizada",
    objective: "Que la demo efectivamente ocurra.",
    action: "Enviar recordatorio el mismo día y tener el demo listo.",
    advanceCriteria: "La demo se realiza (aunque sea breve)."
  },
  {
    id: "demoRealizada",
    name: "Demo Realizada",
    recommendedMessage: "Gracias por tu tiempo en la demo! Te envío la propuesta formal con precios y tiempos de entrega.",
    nextStateId: "ofertaEnviada",
    objective: "Convertir el interés del lead en una oferta clara.",
    action: "Enviar resumen de lo visto y la oferta (plan + precio + CTA).",
    advanceCriteria: "Se envía la oferta formal."
  },
  {
    id: "ofertaEnviada",
    name: "Oferta Enviada",
    recommendedMessage: "¿Pudiste revisar la propuesta? Estoy disponible para cualquier consulta o ajuste que necesites.",
    nextStateId: "cierreGanado",
    objective: "Obtener sí / no / cuándo.",
    action: "Enviar follow-up corto preguntando qué le pareció la propuesta y si quiere avanzar esta semana.",
    advanceCriteria: "Cierre Ganado → Acepta o paga. Cierre Perdido → Dice que no o no responde después de varios intentos."
  },
  {
    id: "cierreGanado",
    name: "Cierre Ganado",
    recommendedMessage: "¡Excelente! Bienvenido a MiWebYa. Vamos a empezar con el proyecto de inmediato.",
    objective: "Formalizar inicio y entregar rápido.",
    action: "Enviar bienvenida + siguiente paso claro (formulario, datos, fecha de entrega).",
    advanceCriteria: "Proyecto iniciado."
  },
  {
    id: "cierrePerdido",
    name: "Cierre Perdido",
    recommendedMessage: "Entiendo. De todas formas quedamos en contacto por si en el futuro necesitas nuestros servicios.",
    objective: "Cerrar el ciclo sin fricción.",
    action: "Enviar mensaje de agradecimiento dejando abierta la puerta para el futuro.",
    advanceCriteria: "Lead archivado sin fricción."
  }
];

export const getPipelineState = (stateId: string): PipelineState | undefined => {
  return PIPELINE_STATES.find(state => state.id === stateId);
};

export const getNextState = (currentStateId: string): PipelineState | undefined => {
  const currentState = getPipelineState(currentStateId);
  if (!currentState?.nextStateId) return undefined;
  return getPipelineState(currentState.nextStateId);
};

export const getPreviousState = (currentStateId: string): PipelineState | undefined => {
  return PIPELINE_STATES.find(state => state.nextStateId === currentStateId);
};
