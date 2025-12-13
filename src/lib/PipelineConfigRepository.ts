export interface PipelineConfigStage {
  id: string;
  orden: number;
  nombre: string;
  objetivo: string;
  accion: string;
  avanzaCuando: string;
}

const STORAGE_KEY = 'pipelineConfig';
const MIGRATION_FLAG = 'pipeline_migrated_v4';

// Pipeline V4: 5 etapas principales + 1 auxiliar + 2 terminales
const DEFAULT_PIPELINE_CONFIG: PipelineConfigStage[] = [
  {
    id: "nuevo",
    orden: 1,
    nombre: "Nuevo / Sin Contactar",
    objetivo: "Preparar y enviar el primer mensaje al lead.",
    accion: "Revisar información del lead y enviar primer contacto.",
    avanzaCuando: "Se envía el primer mensaje al lead."
  },
  {
    id: "contacto_inicial",
    orden: 2,
    nombre: "Contacto Inicial",
    objetivo: "Obtener la primera respuesta del lead.",
    accion: "Enviar primer mensaje personalizado ofreciendo valor.",
    avanzaCuando: "El lead responde mostrando interés."
  },
  {
    id: "valor_entregado",
    orden: 3,
    nombre: "Valor Entregado",
    objetivo: "Entregar valor tangible (video, análisis, recurso).",
    accion: "Enviar video personalizado o recurso de valor.",
    avanzaCuando: "El lead consume el contenido y responde."
  },
  {
    id: "interaccion_activa",
    orden: 4,
    nombre: "Interacción Activa",
    objetivo: "Mantener conversación activa y avanzar hacia demo.",
    accion: "Proponer llamada/demo basándose en el interés mostrado.",
    avanzaCuando: "Se agenda o realiza una demo/llamada."
  },
  {
    id: "demo_evaluacion",
    orden: 5,
    nombre: "Demo / Evaluación",
    objetivo: "Presentar propuesta y obtener decisión.",
    accion: "Realizar demo, enviar propuesta y hacer seguimiento.",
    avanzaCuando: "El lead acepta (Win) o rechaza (Lost)."
  },
  {
    id: "follow_up",
    orden: 6,
    nombre: "Follow Up",
    objetivo: "Reactivar leads que dejaron de responder.",
    accion: "Enviar mensaje de seguimiento sin ser invasivo.",
    avanzaCuando: "El lead retoma la conversación (vuelve a etapa anterior)."
  },
  {
    id: "win",
    orden: 7,
    nombre: "Cliente",
    objetivo: "Formalizar inicio del proyecto.",
    accion: "Enviar bienvenida y próximos pasos.",
    avanzaCuando: "Proyecto iniciado - Estado final."
  },
  {
    id: "lost",
    orden: 8,
    nombre: "Perdido / No Ahora",
    objetivo: "Cerrar el ciclo de forma profesional.",
    accion: "Enviar mensaje de despedida dejando puerta abierta.",
    avanzaCuando: "Lead archivado - Estado final."
  }
];

class PipelineConfigRepository {
  /**
   * Obtiene la configuración del pipeline desde localStorage.
   * Si no existe o necesita migración, inicializa con la configuración V3.
   */
  getPipelineConfig(): PipelineConfigStage[] {
    try {
      const migrated = localStorage.getItem(MIGRATION_FLAG);
      
      // Si no se ha migrado a V3, forzar nueva configuración
      if (!migrated) {
        this.savePipelineConfig(DEFAULT_PIPELINE_CONFIG);
        localStorage.setItem(MIGRATION_FLAG, 'true');
        return DEFAULT_PIPELINE_CONFIG;
      }
      
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) {
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
   * Restablece la configuración a los valores por defecto V3.
   */
  resetToDefault(): void {
    this.savePipelineConfig(DEFAULT_PIPELINE_CONFIG);
    localStorage.setItem(MIGRATION_FLAG, 'true');
  }
}

export const pipelineConfigRepository = new PipelineConfigRepository();
