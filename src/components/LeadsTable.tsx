import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Lead, SmsContactStatus } from "@/types/crm";
import { getPipelineState } from "@/lib/pipeline";
import { getTemperatureColor, getTemperatureLabel } from "@/lib/temperature";
import { useNavigate } from "react-router-dom";
import { CreateLeadDialog } from "@/components/CreateLeadDialog";
import { DeleteLeadDialog } from "@/components/DeleteLeadDialog";
import { PipelineProgress } from "@/components/PipelineProgress";
import { ChangeSmsStatusModal } from "@/components/ChangeSmsStatusModal";
import { MoreVertical, Pencil, Eye, GitBranch, Trash2, MessageSquare, MessageSquareOff } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useState, useEffect } from "react";
import { pipelineConfigRepository, PipelineConfigStage } from "@/lib/PipelineConfigRepository";
import { dataRepository } from "@/lib/DataRepository";
import { useToast } from "@/hooks/use-toast";

interface LeadsTableProps {
  leads: Lead[];
  onLeadUpdated: () => void;
}

export const LeadsTable = ({ leads, onLeadUpdated }: LeadsTableProps) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [pipelineConfig, setPipelineConfig] = useState<PipelineConfigStage[]>([]);
  const [editingLead, setEditingLead] = useState<Lead | null>(null);
  const [deletingLead, setDeletingLead] = useState<Lead | null>(null);
  const [smsChangingLead, setSmsChangingLead] = useState<Lead | null>(null);

  useEffect(() => {
    const config = pipelineConfigRepository.getPipelineConfig();
    setPipelineConfig(config);
  }, []);

  const getNextStep = (pipelineStateId: string) => {
    const stage = pipelineConfig.find(s => s.id === pipelineStateId);
    return stage?.accion || "-";
  };

  const getStageTooltip = (pipelineStateId: string) => {
    const stage = pipelineConfig.find(s => s.id === pipelineStateId);
    if (!stage) return null;
    return {
      objetivo: stage.objetivo,
      avanzaCuando: stage.avanzaCuando
    };
  };

  const getStateBadgeVariant = (stateId: string): "default" | "secondary" | "destructive" | "outline" => {
    switch (stateId) {
      case "win":
        return "default";
      case "lost":
        return "destructive";
      case "follow_up":
        return "secondary";
      case "contacto_inicial":
        return "outline";
      default:
        return "outline";
    }
  };

  const getStateBadgeClassName = (stateId: string): string => {
    switch (stateId) {
      case "win":
        return "bg-green-500 hover:bg-green-500/80 text-white border-green-500";
      case "follow_up":
        return "bg-yellow-500 hover:bg-yellow-500/80 text-white border-yellow-500";
      default:
        return "";
    }
  };

  const handleSmsStatusChange = (newStatus: SmsContactStatus, note: string) => {
    if (!smsChangingLead) return;
    
    const interaction = {
      id: crypto.randomUUID(),
      leadId: smsChangingLead.id,
      message: `Estado SMS cambiado a: ${newStatus === "activo" ? "Activo" : "Bloqueado"}${note ? ` - ${note}` : ""}`,
      createdAt: new Date().toISOString(),
    };
    dataRepository.addInteraction(interaction);
    
    const updatedLead = { ...smsChangingLead, smsContactStatus: newStatus };
    dataRepository.updateLead(updatedLead);
    
    toast({
      title: newStatus === "activo" ? "SMS Activado" : "SMS Bloqueado",
      description: `El canal SMS del lead "${smsChangingLead.name}" ha sido ${newStatus === "activo" ? "activado" : "bloqueado"}.`,
    });
    
    onLeadUpdated();
    setSmsChangingLead(null);
  };

  return (
    <Card>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nombre</TableHead>
              <TableHead>Teléfono</TableHead>
              <TableHead>Temperatura</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>Estado SMS</TableHead>
              <TableHead>Próximo Paso</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {leads.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground">
                  No hay leads aún. Crea el primero!
                </TableCell>
              </TableRow>
            ) : (
              leads.map((lead) => {
                const state = getPipelineState(lead.pipelineState);
                const nextStep = getNextStep(lead.pipelineState);
                const tooltip = getStageTooltip(lead.pipelineState);
                
                return (
                  <TableRow key={lead.id}>
                    <TableCell className="font-medium">{lead.name}</TableCell>
                    <TableCell>{lead.phone}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={getTemperatureColor(lead.temperature)}>
                        {getTemperatureLabel(lead.temperature)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant={getStateBadgeVariant(lead.pipelineState)}
                        className={getStateBadgeClassName(lead.pipelineState)}
                      >
                        {state?.name || lead.pipelineState}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant="outline" 
                        className={lead.smsContactStatus === "activo" 
                          ? "bg-green-500/10 text-green-600 border-green-500/30" 
                          : "bg-destructive/10 text-destructive border-destructive/30"
                        }
                      >
                        {lead.smsContactStatus === "activo" ? (
                          <span className="flex items-center gap-1">
                            <MessageSquare className="h-3 w-3" /> Activo
                          </span>
                        ) : (
                          <span className="flex items-center gap-1">
                            <MessageSquareOff className="h-3 w-3" /> Bloqueado
                          </span>
                        )}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {tooltip ? (
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <span className="text-sm text-muted-foreground cursor-help">
                                {nextStep}
                              </span>
                            </TooltipTrigger>
                            <TooltipContent className="max-w-xs">
                              <div className="space-y-2">
                                <div>
                                  <p className="font-semibold text-xs">Objetivo:</p>
                                  <p className="text-xs">{tooltip.objetivo}</p>
                                </div>
                                <div>
                                  <p className="font-semibold text-xs">Avanza cuando:</p>
                                  <p className="text-xs">{tooltip.avanzaCuando}</p>
                                </div>
                              </div>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      ) : (
                        <span className="text-sm text-muted-foreground">{nextStep}</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="outline" size="sm">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                          <DropdownMenuItem onClick={() => setEditingLead(lead)}>
                            <Pencil className="h-4 w-4 mr-2" />
                            Editar Lead
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => setSelectedLead(lead)}>
                            <GitBranch className="h-4 w-4 mr-2" />
                            Ver Pipeline
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => navigate(`/lead/${lead.id}`)}>
                            <Eye className="h-4 w-4 mr-2" />
                            Ver Lead
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => setSmsChangingLead(lead)}>
                            {lead.smsContactStatus === "activo" ? (
                              <>
                                <MessageSquareOff className="h-4 w-4 mr-2" />
                                Bloquear SMS
                              </>
                            ) : (
                              <>
                                <MessageSquare className="h-4 w-4 mr-2" />
                                Activar SMS
                              </>
                            )}
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => setDeletingLead(lead)}
                            className="text-destructive focus:text-destructive"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Eliminar Lead
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </CardContent>

      {/* Pipeline Dialog */}
      <Dialog open={!!selectedLead} onOpenChange={() => setSelectedLead(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Pipeline de {selectedLead?.name}</DialogTitle>
          </DialogHeader>
          {selectedLead && (
            <div className="space-y-4">
              <PipelineProgress currentStateId={selectedLead.pipelineState} />
              <div className="flex justify-end gap-2 pt-4">
                <Button 
                  variant="outline" 
                  onClick={() => setSelectedLead(null)}
                >
                  Cerrar
                </Button>
                <Button 
                  onClick={() => {
                    navigate(`/lead/${selectedLead.id}`);
                    setSelectedLead(null);
                  }}
                >
                  Ver Detalles Completos
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Lead Dialog */}
      {editingLead && (
        <CreateLeadDialog
          lead={editingLead}
          onLeadCreated={() => {
            onLeadUpdated();
            setEditingLead(null);
          }}
          open={!!editingLead}
          onOpenChange={(open) => !open && setEditingLead(null)}
        />
      )}

      {/* Delete Lead Dialog */}
      {deletingLead && (
        <DeleteLeadDialog
          lead={deletingLead}
          onLeadDeleted={() => {
            onLeadUpdated();
            setDeletingLead(null);
          }}
          open={!!deletingLead}
          onOpenChange={(open) => !open && setDeletingLead(null)}
        />
      )}

      {/* SMS Status Modal */}
      {smsChangingLead && (
        <ChangeSmsStatusModal
          isOpen={!!smsChangingLead}
          onClose={() => setSmsChangingLead(null)}
          onSave={handleSmsStatusChange}
          currentStatus={smsChangingLead.smsContactStatus}
        />
      )}
    </Card>
  );
};
