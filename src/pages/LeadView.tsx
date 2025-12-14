import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Lead, Interaction, LeadTemperature } from "@/types/crm";
import { dataRepository } from "@/lib/DataRepository";
import { getPipelineState, getNextState, getPreviousState, isTerminalState, isAuxiliaryState, MAIN_PIPELINE_STATES } from "@/lib/pipeline";
import { updateLeadTemperature } from "@/lib/temperature";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LeadTimeline } from "@/components/LeadTimeline";
import { PipelineProgress } from "@/components/PipelineProgress";
import { ScheduleNextContactModal } from "@/components/ScheduleNextContactModal";
import { ArrowLeft, ArrowRight, User, Phone, MapPin, Briefcase, Thermometer, Pause, Trophy, XCircle, RotateCcw, Download, CalendarClock } from "lucide-react";
import { downloadLeadJSONL } from "@/lib/leadExporter";
import { toast } from "@/hooks/use-toast";

const LeadView = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [lead, setLead] = useState<Lead | null>(null);
  const [interactions, setInteractions] = useState<Interaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [editableMessage, setEditableMessage] = useState("");
  const [incomingMessage, setIncomingMessage] = useState("");
  const [interactionSource, setInteractionSource] = useState<"lead" | "yo">("lead");
  const [previousMainState, setPreviousMainState] = useState<string | null>(null);
  const [showNextContactModal, setShowNextContactModal] = useState(false);

  const loadLeadData = async () => {
    if (!id) return;
    
    setLoading(true);
    const leadData = await dataRepository.getLeadById(id);
    const interactionsData = await dataRepository.getInteractionsForLead(id);
    
    setLead(leadData);
    setInteractions(interactionsData.sort((a, b) => 
      new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    ));
    setLoading(false);
  };

  useEffect(() => {
    loadLeadData();
  }, [id]);

  useEffect(() => {
    if (lead) {
      const currentState = getPipelineState(lead.pipelineState);
      setEditableMessage(currentState?.recommendedMessage || "");
      
      // Si está en follow_up, intentar recuperar el estado anterior
      if (isAuxiliaryState(lead.pipelineState) && !previousMainState) {
        // Buscar el estado desde el que se movió a Follow Up
        // Ordenar interacciones por fecha descendente para encontrar la más reciente
        const sortedInteractions = [...interactions].sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        
        // Buscar la interacción donde se movió a Follow Up y ver qué estado tenía antes
        for (const interaction of sortedInteractions) {
          if (interaction.message === "Movido a: Follow Up") {
            // Buscar la interacción anterior que indica el estado
            const followUpIndex = interactions.findIndex(i => i.id === interaction.id);
            // Buscar hacia atrás un estado principal
            for (let i = followUpIndex - 1; i >= 0; i--) {
              const msg = interactions[i].message;
              const matchedState = MAIN_PIPELINE_STATES.find(s => 
                msg.includes(`Movido a: ${s.name}`) || 
                msg.includes(`avanzado a: ${s.name}`) ||
                msg.includes(`volvió a: ${s.name}`)
              );
              if (matchedState) {
                setPreviousMainState(matchedState.id);
                break;
              }
            }
            break;
          }
        }
        
        // Si no encontramos por interacciones, usar el primer estado como fallback
        if (!previousMainState && MAIN_PIPELINE_STATES.length > 0) {
          setPreviousMainState(MAIN_PIPELINE_STATES[0].id);
        }
      }
    }
  }, [lead, interactions]);

  const handleResetMessage = () => {
    const currentState = getPipelineState(lead?.pipelineState || "");
    setEditableMessage(currentState?.recommendedMessage || "");
  };

  const handleSaveIncomingMessage = async () => {
    if (!lead || !incomingMessage.trim()) return;

    const direction = interactionSource === "lead" ? "incoming" : "outgoing";

    const newInteraction: Interaction = {
      id: `int-${Date.now()}`,
      leadId: lead.id,
      message: incomingMessage.trim(),
      createdAt: new Date().toISOString(),
      direction
    };
    await dataRepository.addInteraction(newInteraction);

    toast({
      title: "Interacción guardada",
      description: `La interacción ha sido registrada`
    });

    setIncomingMessage("");
    setInteractionSource("lead");
    await loadLeadData();

    // Abrir modal para programar próximo contacto
    setShowNextContactModal(true);
  };

  const handleSaveNextContact = async (nextActionNote: string, nextContactDate: string) => {
    if (!lead) return;

    // 1. Actualizar el objeto LEAD con los nuevos campos
    const updatedLead: Lead = {
      ...lead,
      nextActionNote,
      nextContactDate
    };
    await dataRepository.updateLead(updatedLead);
    setLead(updatedLead);

    // 2. Agregar línea de auditoría al timeline
    const formattedDate = format(new Date(nextContactDate), "yyyy-MM-dd");
    const auditInteraction: Interaction = {
      id: `int-audit-${Date.now()}`,
      leadId: lead.id,
      message: `Se programó próxima acción para ${formattedDate}: "${nextActionNote}"`,
      createdAt: new Date().toISOString(),
      direction: "outgoing"
    };
    await dataRepository.addInteraction(auditInteraction);

    // 3. Cerrar modal y refrescar
    setShowNextContactModal(false);
    await loadLeadData();

    toast({
      title: "Próximo contacto programado",
      description: `Programado para ${format(new Date(nextContactDate), "PPP", { locale: es })}`
    });
  };

  const handleCloseNextContactModal = () => {
    setShowNextContactModal(false);
  };

  const handleTemperatureChange = async (newTemperature: LeadTemperature) => {
    if (!lead) return;

    const updatedLead: Lead = {
      ...lead,
      temperature: newTemperature,
      temperatureManual: true
    };

    await dataRepository.updateLead(updatedLead);
    setLead(updatedLead);

    toast({
      title: "Temperatura actualizada",
      description: `El lead ahora es ${newTemperature.toUpperCase()}`
    });
  };

  const handleAdvanceState = async () => {
    if (!lead) return;

    const nextState = getNextState(lead.pipelineState);

    if (!nextState) {
      toast({
        title: "Estado final",
        description: "Este lead ya está en un estado final del pipeline",
        variant: "destructive"
      });
      return;
    }

    // Registrar interacción con el mensaje del textarea
    const newInteraction: Interaction = {
      id: `int-${Date.now()}`,
      leadId: lead.id,
      message: editableMessage,
      createdAt: new Date().toISOString(),
      direction: "outgoing"
    };
    await dataRepository.addInteraction(newInteraction);

    // Actualizar estado del lead y temperatura automática
    let updatedLead = { ...lead, pipelineState: nextState.id };
    
    const allInteractions = [...interactions, newInteraction];
    updatedLead = updateLeadTemperature(updatedLead, allInteractions);
    
    await dataRepository.updateLead(updatedLead);

    toast({
      title: "Acción aplicada",
      description: `Lead avanzado a: ${nextState.name}`
    });

    loadLeadData();
  };

  const handleMoveToState = async (newStateId: string, stateName: string) => {
    if (!lead) return;

    // Guardar el estado actual antes de mover a follow_up
    if (newStateId === "follow_up" && !isAuxiliaryState(lead.pipelineState) && !isTerminalState(lead.pipelineState)) {
      setPreviousMainState(lead.pipelineState);
    }

    const newInteraction: Interaction = {
      id: `int-${Date.now()}`,
      leadId: lead.id,
      message: `Movido a: ${stateName}`,
      createdAt: new Date().toISOString(),
      direction: "outgoing"
    };
    await dataRepository.addInteraction(newInteraction);

    const updatedLead: Lead = { ...lead, pipelineState: newStateId };
    await dataRepository.updateLead(updatedLead);

    toast({
      title: "Estado actualizado",
      description: `Lead movido a: ${stateName}`
    });

    loadLeadData();
  };

  const handleReturnFromFollowUp = async () => {
    if (!lead || !previousMainState) return;

    const previousState = getPipelineState(previousMainState);
    if (!previousState) return;

    const newInteraction: Interaction = {
      id: `int-${Date.now()}`,
      leadId: lead.id,
      message: `Retomado desde Follow Up a: ${previousState.name}`,
      createdAt: new Date().toISOString(),
      direction: "outgoing"
    };
    await dataRepository.addInteraction(newInteraction);

    const updatedLead: Lead = { ...lead, pipelineState: previousMainState };
    await dataRepository.updateLead(updatedLead);

    toast({
      title: "Lead retomado",
      description: `Lead volvió a: ${previousState.name}`
    });

    setPreviousMainState(null);
    loadLeadData();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Cargando lead...</p>
      </div>
    );
  }

  if (!lead) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">Lead no encontrado</p>
          <Button onClick={() => navigate("/")}>Volver al Dashboard</Button>
        </div>
      </div>
    );
  }

  const currentState = getPipelineState(lead.pipelineState);
  const nextState = getNextState(lead.pipelineState);
  const previousState = getPreviousState(lead.pipelineState);
  const isTerminal = isTerminalState(lead.pipelineState);
  const isAuxiliary = isAuxiliaryState(lead.pipelineState);
  const canAdvance = nextState !== undefined && !isTerminal && !isAuxiliary;

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-8 px-4 max-w-6xl">
        <div className="flex items-center justify-between mb-6">
          <Button 
            variant="ghost" 
            className="gap-2"
            onClick={() => navigate("/")}
          >
            <ArrowLeft className="h-4 w-4" />
            Volver al Dashboard
          </Button>
          <Button 
            variant="outline" 
            className="gap-2"
            onClick={() => downloadLeadJSONL(lead, interactions)}
          >
            <Download className="h-4 w-4" />
            Exportar Lead
          </Button>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Columna izquierda: Datos del lead */}
          <div className="space-y-6">
            {/* Pipeline Progress Card */}
            <Card>
              <CardHeader>
                <CardTitle>Pipeline Visual</CardTitle>
                <CardDescription>
                  Seguimiento completo del proceso de venta
                </CardDescription>
              </CardHeader>
              <CardContent>
                <PipelineProgress currentStateId={lead.pipelineState} previousStateId={previousMainState} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Información del Lead
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground">Nombre</p>
                  <p className="text-lg font-semibold">{lead.name}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <p>{lead.phone}</p>
                </div>
                {lead.city && (
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <p>{lead.city}</p>
                  </div>
                )}
                {lead.businessType && (
                  <div className="flex items-center gap-2">
                    <Briefcase className="h-4 w-4 text-muted-foreground" />
                    <p>{lead.businessType}</p>
                  </div>
                )}
                <div className="pt-4 border-t">
                  <Label htmlFor="temperature" className="flex items-center gap-2 mb-2">
                    <Thermometer className="h-4 w-4" />
                    Temperatura del Lead
                  </Label>
                  <Select
                    value={lead.temperature}
                    onValueChange={(value) => handleTemperatureChange(value as LeadTemperature)}
                  >
                    <SelectTrigger id="temperature">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cold">Cold</SelectItem>
                      <SelectItem value="cold-warm">Cold-Warm</SelectItem>
                      <SelectItem value="warm">Warm</SelectItem>
                      <SelectItem value="warm-hot">Warm-Hot</SelectItem>
                      <SelectItem value="hot">Hot</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {/* Próxima acción - con indicador de urgencia */}
                <div className="pt-4 border-t">
                  <div className="flex items-center gap-2 mb-2">
                    <CalendarClock className="h-4 w-4 text-primary" />
                    <span className="text-sm font-medium">Acción comprometida</span>
                  </div>
                  {lead.nextActionNote || lead.nextContactDate ? (
                    <>
                      <p className="text-sm">{lead.nextActionNote || "—"}</p>
                      <p className={`text-xs mt-1 ${
                        lead.nextContactDate && new Date(lead.nextContactDate) < new Date() 
                          ? "text-red-600 font-medium" 
                          : "text-muted-foreground"
                      }`}>
                        Fecha: {lead.nextContactDate 
                          ? format(new Date(lead.nextContactDate), "PPP", { locale: es }) 
                          : "—"}
                        {lead.nextContactDate && new Date(lead.nextContactDate) < new Date() && " (Vencido)"}
                      </p>
                    </>
                  ) : (
                    <p className="text-sm text-destructive flex items-center gap-1">
                      ⚠️ Sin acción definida
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Estado del Pipeline</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Pipeline Flow Visualization */}
                <div className="flex items-center justify-between gap-2 p-4 bg-muted/50 rounded-lg">
                  <div className="flex-1 text-center">
                    {previousState ? (
                      <>
                        <p className="text-xs text-muted-foreground mb-1">Anterior</p>
                        <Badge variant="outline" className="text-xs">
                          {previousState.name}
                        </Badge>
                      </>
                    ) : (
                      <div className="text-xs text-muted-foreground">—</div>
                    )}
                  </div>
                  
                  <ArrowRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  
                  <div className="flex-1 text-center">
                    <p className="text-xs text-muted-foreground mb-1">Estado actual</p>
                    <Badge className="text-sm px-3 py-1">
                      {currentState?.name || lead.pipelineState}
                    </Badge>
                  </div>
                  
                  <ArrowRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  
                  <div className="flex-1 text-center">
                    {nextState && !isTerminal && !isAuxiliary ? (
                      <>
                        <p className="text-xs text-muted-foreground mb-1">Siguiente</p>
                        <Badge variant="outline" className="text-xs">
                          {nextState.name}
                        </Badge>
                      </>
                    ) : (
                      <div className="text-xs text-muted-foreground">
                        {isTerminal ? "Estado final" : isAuxiliary ? "En seguimiento" : "—"}
                      </div>
                    )}
                  </div>
                </div>

                {/* Mensaje recomendado y acción principal */}
                {!isTerminal && (
                  <>
                    <div className="space-y-3">
                      <div>
                        <label className="text-sm font-medium mb-2 block">
                          Mensaje recomendado:
                        </label>
                        <Textarea
                          value={editableMessage}
                          onChange={(e) => setEditableMessage(e.target.value)}
                          className="min-h-[100px] resize-none"
                        />
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleResetMessage}
                        className="w-full"
                      >
                        Restablecer mensaje
                      </Button>
                    </div>

                    {/* Botón principal de avance */}
                    {canAdvance && (
                      <Button
                        className="w-full gap-2"
                        onClick={handleAdvanceState}
                      >
                        Aplicar acción y avanzar
                        <ArrowRight className="h-4 w-4" />
                      </Button>
                    )}

                    {/* Botón para volver desde Follow Up */}
                    {isAuxiliary && previousMainState && (
                      <Button
                        className="w-full gap-2"
                        variant="outline"
                        onClick={handleReturnFromFollowUp}
                      >
                        <RotateCcw className="h-4 w-4" />
                        Retomar conversación
                      </Button>
                    )}
                  </>
                )}

                {/* Acciones especiales */}
                {!isTerminal && !isAuxiliary && (
                  <div className="pt-4 border-t space-y-3">
                    <p className="text-sm font-medium text-muted-foreground">Acciones especiales:</p>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="gap-2 border-yellow-500 text-yellow-600 hover:bg-yellow-500/10"
                        onClick={() => handleMoveToState("follow_up", "Follow Up")}
                      >
                        <Pause className="h-4 w-4" />
                        Follow Up
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="gap-2 border-green-500 text-green-600 hover:bg-green-500/10"
                        onClick={() => handleMoveToState("win", "Cliente")}
                      >
                        <Trophy className="h-4 w-4" />
                        Marcar como Win
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="gap-2 border-destructive text-destructive hover:bg-destructive/10"
                        onClick={() => handleMoveToState("lost", "Perdido")}
                      >
                        <XCircle className="h-4 w-4" />
                        Marcar como Lost
                      </Button>
                    </div>
                  </div>
                )}

                {/* Estado terminal alcanzado */}
                {isTerminal && (
                  <div className="text-center py-4">
                    <p className="text-muted-foreground">
                      Este lead ha alcanzado un estado final.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Columna derecha: Timeline y respuestas */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Timeline de Interacciones</CardTitle>
                <CardDescription>
                  Historial de mensajes y acciones registradas
                </CardDescription>
              </CardHeader>
              <CardContent>
                <LeadTimeline interactions={interactions} onInteractionUpdated={loadLeadData} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Registrar interacción</CardTitle>
                <CardDescription>
                  Escribe aquí la respuesta del lead o una nota rápida
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-2">
                  <Label>¿Quién envía el mensaje?</Label>
                  <RadioGroup
                    value={interactionSource}
                    onValueChange={(value) => setInteractionSource(value as "lead" | "yo")}
                    className="flex gap-4"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="lead" id="lead" />
                      <Label htmlFor="lead" className="cursor-pointer font-normal">Lead</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="yo" id="yo" />
                      <Label htmlFor="yo" className="cursor-pointer font-normal">Yo</Label>
                    </div>
                  </RadioGroup>
                </div>
                <Textarea
                  value={incomingMessage}
                  onChange={(e) => setIncomingMessage(e.target.value)}
                  placeholder="Escribe aquí la respuesta del lead o una nota rápida..."
                  className="min-h-[80px] resize-none"
                />
                <Button
                  onClick={handleSaveIncomingMessage}
                  className="w-full"
                  disabled={!incomingMessage.trim()}
                >
                  Guardar interacción
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Modal para programar próximo contacto */}
      <ScheduleNextContactModal
        isOpen={showNextContactModal}
        onClose={handleCloseNextContactModal}
        onSave={handleSaveNextContact}
      />
    </div>
  );
};

export default LeadView;
