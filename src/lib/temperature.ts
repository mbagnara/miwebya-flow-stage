import { Lead, Interaction, LeadTemperature } from "@/types/crm";

/**
 * Calcula la temperatura automática de un lead basado en su estado del pipeline
 * y las interacciones que tiene
 */
export const calculateAutoTemperature = (
  lead: Lead,
  interactions: Interaction[]
): LeadTemperature => {
  const { pipelineState } = lead;
  
  // Hot states
  if (
    pipelineState === "demoAgendada" ||
    pipelineState === "demoRealizada" ||
    pipelineState === "ofertaEnviada"
  ) {
    return "hot";
  }
  
  // Warm states
  if (pipelineState === "respondio") {
    return "warm";
  }
  
  if (pipelineState === "demoOfrecida") {
    return "warm";
  }
  
  // VideoEnviado puede ser Cold o Warm según las interacciones
  if (pipelineState === "videoEnviado") {
    const hasIncomingInteractions = interactions.some(
      (interaction) => interaction.direction === "incoming"
    );
    return hasIncomingInteractions ? "warm" : "cold";
  }
  
  // Cold states (nuevo y cualquier otro)
  return "cold";
};

/**
 * Actualiza la temperatura de un lead si no ha sido modificada manualmente
 */
export const updateLeadTemperature = (
  lead: Lead,
  interactions: Interaction[]
): Lead => {
  if (lead.temperatureManual) {
    return lead;
  }
  
  const newTemperature = calculateAutoTemperature(lead, interactions);
  
  return {
    ...lead,
    temperature: newTemperature
  };
};

export const getTemperatureColor = (temperature: LeadTemperature): string => {
  switch (temperature) {
    case "cold":
      return "bg-blue-500/10 text-blue-600 border-blue-500/20";
    case "cold-warm":
      return "bg-cyan-500/10 text-cyan-600 border-cyan-500/20";
    case "warm":
      return "bg-yellow-500/10 text-yellow-600 border-yellow-500/20";
    case "warm-hot":
      return "bg-orange-500/10 text-orange-600 border-orange-500/20";
    case "hot":
      return "bg-red-500/10 text-red-600 border-red-500/20";
  }
};

export const getTemperatureLabel = (temperature: LeadTemperature): string => {
  switch (temperature) {
    case "cold":
      return "Cold";
    case "cold-warm":
      return "Cold-Warm";
    case "warm":
      return "Warm";
    case "warm-hot":
      return "Warm-Hot";
    case "hot":
      return "Hot";
  }
};
