export type LeadTemperature = "cold" | "cold-warm" | "warm" | "warm-hot" | "hot";

export interface Lead {
  id: string;
  name: string;
  phone: string;
  city?: string;
  businessType?: string;
  pipelineState: string;
  createdAt: string;
  temperature: LeadTemperature;
  temperatureManual: boolean;
  nextContactDate?: string;
  nextActionNote?: string;
}

export interface PipelineState {
  id: string;
  name: string;
  nextStateId?: string;
  recommendedMessage: string;
  objective?: string;
  action?: string;
  advanceCriteria?: string;
}

export interface Interaction {
  id: string;
  leadId: string;
  message: string;
  createdAt: string;
  direction?: "incoming" | "outgoing";
}
