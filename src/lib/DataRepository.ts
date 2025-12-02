import { Lead, Interaction } from "@/types/crm";

const LEADS_KEY = "miwebya_leads";
const INTERACTIONS_KEY = "miwebya_interactions";

export class DataRepository {
  // LEADS
  async getLeads(): Promise<Lead[]> {
    const data = localStorage.getItem(LEADS_KEY);
    return data ? JSON.parse(data) : [];
  }

  async getLeadById(id: string): Promise<Lead | null> {
    const leads = await this.getLeads();
    return leads.find(lead => lead.id === id) || null;
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
    // Eliminar el lead
    const leads = await this.getLeads();
    const filteredLeads = leads.filter(lead => lead.id !== leadId);
    localStorage.setItem(LEADS_KEY, JSON.stringify(filteredLeads));

    // Eliminar todas las interacciones asociadas
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
    // Borrar todos los datos existentes
    localStorage.removeItem(LEADS_KEY);
    localStorage.removeItem(INTERACTIONS_KEY);

    // Importar los nuevos datos
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
        pipelineState: "respondio",
        createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        temperature: "warm",
        temperatureManual: false
      },
      {
        id: "lead-2",
        name: "Juan Pérez",
        phone: "+54 11 3456-7890",
        city: "Córdoba",
        businessType: "Tienda de ropa",
        pipelineState: "videoEnviado",
        createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
        temperature: "warm",
        temperatureManual: false
      },
      {
        id: "lead-3",
        name: "Ana Martínez",
        phone: "+54 11 4567-8901",
        city: "Rosario",
        businessType: "Consultora",
        pipelineState: "nuevo",
        createdAt: new Date().toISOString(),
        temperature: "cold",
        temperatureManual: false
      }
    ];

    for (const lead of fakeLeads) {
      await this.saveLead(lead);
    }

    // Agregar algunas interacciones fake
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
