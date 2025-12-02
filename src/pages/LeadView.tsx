import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Lead, Interaction } from "@/types/crm";
import { dataRepository } from "@/lib/DataRepository";
import { getPipelineState, getNextState } from "@/lib/pipeline";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { LeadTimeline } from "@/components/LeadTimeline";
import { ArrowLeft, ArrowRight, User, Phone, MapPin, Briefcase } from "lucide-react";
import { toast } from "@/hooks/use-toast";

const LeadView = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [lead, setLead] = useState<Lead | null>(null);
  const [interactions, setInteractions] = useState<Interaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [editableMessage, setEditableMessage] = useState("");
  const [incomingMessage, setIncomingMessage] = useState("");

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
    }
  }, [lead]);

  const handleResetMessage = () => {
    const currentState = getPipelineState(lead?.pipelineState || "");
    setEditableMessage(currentState?.recommendedMessage || "");
  };

  const handleSaveIncomingMessage = async () => {
    if (!lead || !incomingMessage.trim()) return;

    const newInteraction: Interaction = {
      id: `int-${Date.now()}`,
      leadId: lead.id,
      message: incomingMessage.trim(),
      createdAt: new Date().toISOString(),
      direction: "incoming"
    };
    await dataRepository.addInteraction(newInteraction);

    toast({
      title: "Respuesta guardada",
      description: "La respuesta del lead ha sido registrada"
    });

    setIncomingMessage("");
    loadLeadData();
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

    // Registrar interacción con el mensaje del textarea (puede ser editado)
    const newInteraction: Interaction = {
      id: `int-${Date.now()}`,
      leadId: lead.id,
      message: editableMessage,
      createdAt: new Date().toISOString(),
      direction: "outgoing"
    };
    await dataRepository.addInteraction(newInteraction);

    // Actualizar estado del lead
    const updatedLead = { ...lead, pipelineState: nextState.id };
    await dataRepository.updateLead(updatedLead);

    toast({
      title: "Acción aplicada",
      description: `Lead avanzado a: ${nextState.name}`
    });

    // Recargar datos
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
  const canAdvance = nextState !== undefined;

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-8 px-4 max-w-6xl">
        <Button 
          variant="ghost" 
          className="mb-6 gap-2"
          onClick={() => navigate("/")}
        >
          <ArrowLeft className="h-4 w-4" />
          Volver al Dashboard
        </Button>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Columna izquierda: Datos del lead */}
          <div className="space-y-6">
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
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Estado del Pipeline</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Estado actual</p>
                  <Badge className="text-base px-3 py-1">
                    {currentState?.name || lead.pipelineState}
                  </Badge>
                </div>

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

                <Button 
                  className="w-full gap-2"
                  onClick={handleAdvanceState}
                  disabled={!canAdvance}
                >
                  {canAdvance ? (
                    <>
                      Aplicar acción y avanzar
                      <ArrowRight className="h-4 w-4" />
                    </>
                  ) : (
                    "Estado final alcanzado"
                  )}
                </Button>

                {nextState && (
                  <p className="text-xs text-center text-muted-foreground">
                    Siguiente estado: {nextState.name}
                  </p>
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
                <LeadTimeline interactions={interactions} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Registrar respuesta del lead</CardTitle>
                <CardDescription>
                  Escribe aquí la respuesta del lead o una nota rápida
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
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
                  Guardar respuesta
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LeadView;
