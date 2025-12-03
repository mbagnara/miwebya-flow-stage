import { Lead, Interaction } from "@/types/crm";
import { getPipelineState, getNextState, getPreviousState, MAIN_PIPELINE_STATES } from "@/lib/pipeline";
import { getTemperatureLabel } from "@/lib/temperature";
import { format } from "date-fns";

interface LeadInfo {
  type: "lead_info";
  name: string;
  phone: string;
  city: string;
  industry: string;
  temperature: string;
}

interface PipelineStatus {
  type: "pipeline_status";
  previous_stage: string;
  current_stage: string;
  next_stage: string;
  progress: string;
}

interface PipelineVisual {
  type: "pipeline_visual";
  stages: string[];
}

interface TimelineEvent {
  timestamp: string;
  actor: string;
  text: string;
}

interface Timeline {
  type: "timeline";
  events: TimelineEvent[];
}

export function exportLeadToJSONL(lead: Lead, interactions: Interaction[]): string {
  const currentState = getPipelineState(lead.pipelineState);
  const previousState = getPreviousState(lead.pipelineState);
  const nextState = getNextState(lead.pipelineState);

  // Calculate progress
  const currentIndex = MAIN_PIPELINE_STATES.findIndex(s => s.id === lead.pipelineState);
  const progress = currentIndex >= 0 
    ? `${Math.round(((currentIndex + 1) / MAIN_PIPELINE_STATES.length) * 100)}%`
    : lead.pipelineState === "win" ? "100%" : "0%";

  // Build lead_info
  const leadInfo: LeadInfo = {
    type: "lead_info",
    name: lead.name,
    phone: lead.phone,
    city: lead.city || "",
    industry: lead.businessType || "",
    temperature: getTemperatureLabel(lead.temperature)
  };

  // Build pipeline_status
  const pipelineStatus: PipelineStatus = {
    type: "pipeline_status",
    previous_stage: previousState?.name || "",
    current_stage: currentState?.name || lead.pipelineState,
    next_stage: nextState?.name || "",
    progress
  };

  // Build pipeline_visual
  const pipelineVisual: PipelineVisual = {
    type: "pipeline_visual",
    stages: [...MAIN_PIPELINE_STATES.map(s => s.name), "Cliente"]
  };

  // Build timeline
  const sortedInteractions = [...interactions].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  );

  const timeline: Timeline = {
    type: "timeline",
    events: sortedInteractions.map(interaction => ({
      timestamp: format(new Date(interaction.createdAt), "yyyy-MM-dd HH:mm"),
      actor: interaction.direction === "incoming" ? "Lead" : "Yo",
      text: interaction.message
    }))
  };

  // Build JSONL (4 lines)
  const lines = [
    JSON.stringify(leadInfo),
    JSON.stringify(pipelineStatus),
    JSON.stringify(pipelineVisual),
    JSON.stringify(timeline)
  ];

  return lines.join("\n");
}

export function downloadLeadJSONL(lead: Lead, interactions: Interaction[]): void {
  const jsonlContent = exportLeadToJSONL(lead, interactions);
  const blob = new Blob([jsonlContent], { type: "application/jsonl" });
  const url = URL.createObjectURL(blob);
  
  const a = document.createElement("a");
  a.href = url;
  a.download = `lead_${lead.name.replace(/\s+/g, "_").toLowerCase()}_export.jsonl`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
