import { Lead, Interaction } from "@/types/crm";

const LEADS_KEY = "miwebya_leads";
const INTERACTIONS_KEY = "miwebya_interactions";
const MIGRATION_FLAG = "leads_migrated_v3";

// Mapeo de estados antiguos a nuevos
const STATE_MIGRATION_MAP: Record<string, string> = {
  // Estados principales
  "nuevo": "contacto_inicial",
  "respondio": "valor_entregado",
  "videoEnviado": "valor_entregado",
  "video_enviado": "valor_entregado",
  "demoOfrecida": "interaccion_activa",
  "demo_ofrecida": "interaccion_activa",
  "demoAgendada": "demo_evaluacion",
  "demo_agendada": "demo_evaluacion",
  "demoRealizada": "demo_evaluacion",
  "demo_realizada": "demo_evaluacion",
  "ofertaEnviada": "demo_evaluacion",
  "oferta_enviada": "demo_evaluacion",
  // Estados terminales
  "cierreGanado": "win",
  "cierre_ganado": "win",
  "cierrePerdido": "lost",
  "cierre_perdido": "lost"
};

export class DataRepository {
  constructor() {
    // Ejecutar migración automática al inicializar
    this.migrateLeadsToV3();
  }

  /**
   * Migra los leads existentes al nuevo sistema de estados V3
   */
  private migrateLeadsToV3(): void {
    const alreadyMigrated = localStorage.getItem(MIGRATION_FLAG);
    if (alreadyMigrated) return;

    try {
      const leadsData = localStorage.getItem(LEADS_KEY);
      if (!leadsData) {
        localStorage.setItem(MIGRATION_FLAG, 'true');
        return;
      }

      const leads: Lead[] = JSON.parse(leadsData);
      let migratedCount = 0;

      const migratedLeads = leads.map(lead => {
        const newState = STATE_MIGRATION_MAP[lead.pipelineState];
        if (newState) {
          migratedCount++;
          return { ...lead, pipelineState: newState };
        }
        return lead;
      });

      if (migratedCount > 0) {
        localStorage.setItem(LEADS_KEY, JSON.stringify(migratedLeads));
        console.log(`Migración V3 completada: ${migratedCount} leads actualizados`);
      }

      localStorage.setItem(MIGRATION_FLAG, 'true');
    } catch (error) {
      console.error("Error durante migración V3:", error);
    }
  }

  // LEADS
  async getLeads(): Promise<Lead[]> {
    const data = localStorage.getItem(LEADS_KEY);
    const leads: Lead[] = data ? JSON.parse(data) : [];
    // Migración: agregar smsContactStatus si no existe
    return leads.map(lead => ({
      ...lead,
      smsContactStatus: lead.smsContactStatus || "activo"
    }));
  }

  async getLeadById(id: string): Promise<Lead | null> {
    const leads = await this.getLeads();
    const lead = leads.find(lead => lead.id === id);
    if (!lead) return null;
    // Migración: agregar smsContactStatus si no existe
    return {
      ...lead,
      smsContactStatus: lead.smsContactStatus || "activo"
    };
  }

  async saveLead(lead: Lead): Promise<void> {
    const leads = await this.getLeads();
    leads.push(lead);
    localStorage.setItem(LEADS_KEY, JSON.stringify(leads));
  }

  async updateLead(updatedLead: Lead): Promise<void> {
    const leads = await this.getLeads();
    const index = leads.findIndex(lead => lead.id === updatedLead.id);
    if (index !== -1) {
      leads[index] = updatedLead;
      localStorage.setItem(LEADS_KEY, JSON.stringify(leads));
    }
  }

  async deleteLead(leadId: string): Promise<void> {
    const leads = await this.getLeads();
    const filteredLeads = leads.filter(lead => lead.id !== leadId);
    localStorage.setItem(LEADS_KEY, JSON.stringify(filteredLeads));

    const allInteractions = await this.getAllInteractions();
    const filteredInteractions = allInteractions.filter(interaction => interaction.leadId !== leadId);
    localStorage.setItem(INTERACTIONS_KEY, JSON.stringify(filteredInteractions));
  }

  // INTERACTIONS
  async addInteraction(interaction: Interaction): Promise<void> {
    const interactions = await this.getInteractionsForLead(interaction.leadId);
    interactions.push(interaction);
    
    const allInteractions = await this.getAllInteractions();
    const otherInteractions = allInteractions.filter(i => i.leadId !== interaction.leadId);
    localStorage.setItem(INTERACTIONS_KEY, JSON.stringify([...otherInteractions, ...interactions]));
  }

  async updateInteraction(updatedInteraction: Interaction): Promise<void> {
    const allInteractions = await this.getAllInteractions();
    const index = allInteractions.findIndex(i => i.id === updatedInteraction.id);
    if (index !== -1) {
      allInteractions[index] = updatedInteraction;
      localStorage.setItem(INTERACTIONS_KEY, JSON.stringify(allInteractions));
    }
  }

  async deleteInteraction(interactionId: string): Promise<void> {
    const allInteractions = await this.getAllInteractions();
    const filteredInteractions = allInteractions.filter(i => i.id !== interactionId);
    localStorage.setItem(INTERACTIONS_KEY, JSON.stringify(filteredInteractions));
  }

  async getInteractionsForLead(leadId: string): Promise<Interaction[]> {
    const data = localStorage.getItem(INTERACTIONS_KEY);
    const allInteractions: Interaction[] = data ? JSON.parse(data) : [];
    return allInteractions.filter(interaction => interaction.leadId === leadId);
  }

  private async getAllInteractions(): Promise<Interaction[]> {
    const data = localStorage.getItem(INTERACTIONS_KEY);
    return data ? JSON.parse(data) : [];
  }

  // EXPORT / IMPORT
  async exportAllData(): Promise<{ leads: Lead[]; interactions: Interaction[]; exportDate: string }> {
    const leads = await this.getLeads();
    const interactions = await this.getAllInteractions();
    return {
      leads,
      interactions,
      exportDate: new Date().toISOString()
    };
  }

  async importAllData(data: { leads: Lead[]; interactions: Interaction[] }): Promise<void> {
    localStorage.removeItem(LEADS_KEY);
    localStorage.removeItem(INTERACTIONS_KEY);

    if (data.leads && data.leads.length > 0) {
      localStorage.setItem(LEADS_KEY, JSON.stringify(data.leads));
    }
    if (data.interactions && data.interactions.length > 0) {
      localStorage.setItem(INTERACTIONS_KEY, JSON.stringify(data.interactions));
    }
  }

  async clearAllData(): Promise<void> {
    localStorage.removeItem(LEADS_KEY);
    localStorage.removeItem(INTERACTIONS_KEY);
  }

  // SEED DATA
  async seedFakeData(): Promise<void> {
    const existingLeads = await this.getLeads();
    if (existingLeads.length > 0) return;

    const fakeLeads: Lead[] = [
      {
        id: "lead-1",
        name: "María González",
        phone: "+54 11 2345-6789",
        city: "Buenos Aires",
        businessType: "Restaurante",
        pipelineState: "valor_entregado",
        createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        temperature: "warm",
        temperatureManual: false,
        smsContactStatus: "activo"
      },
      {
        id: "lead-2",
        name: "Juan Pérez",
        phone: "+54 11 3456-7890",
        city: "Córdoba",
        businessType: "Tienda de ropa",
        pipelineState: "interaccion_activa",
        createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
        temperature: "warm",
        temperatureManual: false,
        smsContactStatus: "activo"
      },
      {
        id: "lead-3",
        name: "Ana Martínez",
        phone: "+54 11 4567-8901",
        city: "Rosario",
        businessType: "Consultora",
        pipelineState: "contacto_inicial",
        createdAt: new Date().toISOString(),
        temperature: "cold",
        temperatureManual: false,
        smsContactStatus: "activo"
      }
    ];

    for (const lead of fakeLeads) {
      await this.saveLead(lead);
    }

    await this.addInteraction({
      id: "int-1",
      leadId: "lead-1",
      message: "¡Hola! Vi que te interesa tener una web profesional. ¿Te gustaría que te cuente cómo podemos ayudarte?",
      createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
    });

    await this.addInteraction({
      id: "int-2",
      leadId: "lead-2",
      message: "¡Hola! Vi que te interesa tener una web profesional. ¿Te gustaría que te cuente cómo podemos ayudarte?",
      createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()
    });

    await this.addInteraction({
      id: "int-3",
      leadId: "lead-2",
      message: "Genial! Te mando un video corto (2 min) explicando cómo funciona nuestra propuesta y qué incluye.",
      createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000 + 3600000).toISOString()
    });
  }
}

export const dataRepository = new DataRepository();
