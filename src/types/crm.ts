export interface Lead {
  id: string;
  name: string;
  phone: string;
  city?: string;
  businessType?: string;
  pipelineState: string;
  createdAt: string;
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
}
