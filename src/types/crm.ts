export type LeadTemperature = "cold" | "warm" | "hot";

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
}

export interface PipelineState {
  id: string;
  name: string;
  nextStateId?: string;
  recommendedMessage: string;
}

export interface Interaction {
  id: string;
  leadId: string;
  message: string;
  createdAt: string;
  direction?: "incoming" | "outgoing";
}
