export interface PipelineConfigStage {
  id: string;
  orden: number;
  nombre: string;
  objetivo: string;
  accion: string;
  avanzaCuando: string;
}

const STORAGE_KEY = 'pipelineConfig';

const DEFAULT_PIPELINE_CONFIG: PipelineConfigStage[] = [
  {
    id: "nuevo",
    orden: 1,
    nombre: "Nuevo",
    objetivo: "Obtener la primera respuesta del lead.",
    accion: "Enviar el primer mensaje base ofreciendo el video corto.",
    avanzaCuando: "El lead responde cualquier mensaje (cualquier tipo de respuesta)."
  },
  {
    id: "respondio",
    orden: 2,
    nombre: "Respondió",
    objetivo: "Transformar la respuesta en algo concreto (video o demo).",
    accion: "Ofrecer explícitamente enviar un video o una mini demo.",
    avanzaCuando: "Se envía el video al lead."
  },
  {
    id: "video_enviado",
    orden: 3,
    nombre: "Video Enviado",
    objetivo: "Conseguir que vea el video y abra la conversación hacia una demo.",
    accion: "Enviar mensaje corto de seguimiento preguntando si lo vio y ofreciendo una demo de 5 minutos.",
    avanzaCuando: "Se ofrece formalmente la demo mediante un mensaje enviado desde el CRM."
  },
  {
    id: "demo_ofrecida",
    orden: 4,
    nombre: "Demo Ofrecida",
    objetivo: "Cerrar una fecha y hora para la demo.",
    accion: "Preguntar qué día/hora le acomoda más para la demo.",
    avanzaCuando: "El lead confirma un horario y se agenda la demo."
  },
  {
    id: "demo_agendada",
    orden: 5,
    nombre: "Demo Agendada",
    objetivo: "Que la demo efectivamente ocurra.",
    accion: "Enviar recordatorio el mismo día y tener el demo listo.",
    avanzaCuando: "La demo se realiza, aunque sea breve."
  },
  {
    id: "demo_realizada",
    orden: 6,
    nombre: "Demo Realizada",
    objetivo: "Convertir el interés del lead en una oferta clara.",
    accion: "Enviar resumen de lo visto y la oferta (plan + precio + CTA).",
    avanzaCuando: "Se envía la oferta formal al lead."
  },
  {
    id: "oferta_enviada",
    orden: 7,
    nombre: "Oferta Enviada",
    objetivo: "Obtener sí / no / cuándo.",
    accion: "Enviar follow-up corto preguntando qué le pareció la propuesta y si quiere avanzar esta semana.",
    avanzaCuando: "Pasa a Cierre Ganado cuando acepta o paga; pasa a Cierre Perdido cuando dice que no o no responde después de varios intentos."
  },
  {
    id: "cierre_ganado",
    orden: 8,
    nombre: "Cierre Ganado",
    objetivo: "Formalizar inicio y entregar rápido.",
    accion: "Enviar mensaje de bienvenida con los siguientes pasos (formulario, datos, fecha de entrega).",
    avanzaCuando: "No avanza; es estado final de éxito."
  },
  {
    id: "cierre_perdido",
    orden: 9,
    nombre: "Cierre Perdido",
    objetivo: "Cerrar el ciclo sin fricción.",
    accion: "Enviar mensaje de agradecimiento dejando abierta la puerta para el futuro.",
    avanzaCuando: "No avanza; es estado final de cierre."
  }
];

class PipelineConfigRepository {
  /**
   * Obtiene la configuración del pipeline desde localStorage.
   * Si no existe, inicializa con la configuración por defecto.
   */
  getPipelineConfig(): PipelineConfigStage[] {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) {
        // Primera vez - guardar configuración por defecto
        this.savePipelineConfig(DEFAULT_PIPELINE_CONFIG);
        return DEFAULT_PIPELINE_CONFIG;
      }
      return JSON.parse(stored);
    } catch (error) {
      console.error("Error al cargar configuración del pipeline:", error);
      return DEFAULT_PIPELINE_CONFIG;
    }
  }

  /**
   * Guarda la configuración completa del pipeline en localStorage.
   */
  savePipelineConfig(config: PipelineConfigStage[]): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
    } catch (error) {
      console.error("Error al guardar configuración del pipeline:", error);
      throw error;
    }
  }

  /**
   * Obtiene una etapa específica por su ID.
   */
  getStageById(stageId: string): PipelineConfigStage | undefined {
    const config = this.getPipelineConfig();
    return config.find(stage => stage.id === stageId);
  }

  /**
   * Actualiza una etapa específica del pipeline.
   */
  updateStage(stageId: string, updates: Partial<Omit<PipelineConfigStage, 'id' | 'orden'>>): void {
    const config = this.getPipelineConfig();
    const index = config.findIndex(stage => stage.id === stageId);
    
    if (index === -1) {
      throw new Error(`Etapa con id "${stageId}" no encontrada`);
    }

    config[index] = {
      ...config[index],
      ...updates
    };

    this.savePipelineConfig(config);
  }

  /**
   * Restablece la configuración a los valores por defecto.
   */
  resetToDefault(): void {
    this.savePipelineConfig(DEFAULT_PIPELINE_CONFIG);
  }
}

export const pipelineConfigRepository = new PipelineConfigRepository();
