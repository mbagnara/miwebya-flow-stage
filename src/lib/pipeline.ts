import { PipelineState } from "@/types/crm";

export const PIPELINE_STATES: PipelineState[] = [
  {
    id: "nuevo",
    name: "Nuevo",
    recommendedMessage: "¡Hola! Vi que te interesa tener una web profesional. ¿Te gustaría que te cuente cómo podemos ayudarte?",
    nextStateId: "respondio"
  },
  {
    id: "respondio",
    name: "Respondió",
    recommendedMessage: "Genial! Te mando un video corto (2 min) explicando cómo funciona nuestra propuesta y qué incluye.",
    nextStateId: "videoEnviado"
  },
  {
    id: "videoEnviado",
    name: "Video Enviado",
    recommendedMessage: "¿Qué te pareció el video? Si querés, podemos agendar una demo de 15 minutos para mostrarte ejemplos en vivo.",
    nextStateId: "demoOfrecida"
  },
  {
    id: "demoOfrecida",
    name: "Demo Ofrecida",
    recommendedMessage: "Perfecto! ¿Qué día y horario te viene bien para la demo? Tengo disponibilidad mañana o pasado.",
    nextStateId: "demoAgendada"
  },
  {
    id: "demoAgendada",
    name: "Demo Agendada",
    recommendedMessage: "¡Listo! Te confirmo la demo agendada para [fecha/hora]. Te voy a enviar el link de reunión.",
    nextStateId: "demoRealizada"
  },
  {
    id: "demoRealizada",
    name: "Demo Realizada",
    recommendedMessage: "Gracias por tu tiempo en la demo! Te envío la propuesta formal con precios y tiempos de entrega.",
    nextStateId: "ofertaEnviada"
  },
  {
    id: "ofertaEnviada",
    name: "Oferta Enviada",
    recommendedMessage: "¿Pudiste revisar la propuesta? Estoy disponible para cualquier consulta o ajuste que necesites.",
    nextStateId: "cierreGanado"
  },
  {
    id: "cierreGanado",
    name: "Cierre Ganado",
    recommendedMessage: "¡Excelente! Bienvenido a MiWebYa. Vamos a empezar con el proyecto de inmediato.",
  },
  {
    id: "cierrePerdido",
    name: "Cierre Perdido",
    recommendedMessage: "Entiendo. De todas formas quedamos en contacto por si en el futuro necesitas nuestros servicios.",
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
