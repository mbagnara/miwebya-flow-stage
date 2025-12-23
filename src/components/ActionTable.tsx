import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Lead, SmsContactStatus } from "@/types/crm";
import { getPipelineState } from "@/lib/pipeline";
import { getTemperatureColor, getTemperatureLabel } from "@/lib/temperature";
import { getLeadUrgency, getUrgencyConfig, formatShortDate } from "@/lib/urgency";
import { useNavigate } from "react-router-dom";
import { Pencil, CheckCircle, AlertTriangle, MessageSquare, MessageSquareOff, UserPen, Trash2 } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { ChangeSmsStatusModal } from "@/components/ChangeSmsStatusModal";
import { CreateLeadDialog } from "@/components/CreateLeadDialog";
import { DeleteLeadDialog } from "@/components/DeleteLeadDialog";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";
import { dataRepository } from "@/lib/DataRepository";
import { useToast } from "@/hooks/use-toast";

interface ActionTableProps {
  leads: Lead[];
  onLeadUpdated: () => void;
}

export const ActionTable = ({ leads, onLeadUpdated }: ActionTableProps) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [smsChangingLead, setSmsChangingLead] = useState<Lead | null>(null);
  const [editingLead, setEditingLead] = useState<Lead | null>(null);
  const [deletingLead, setDeletingLead] = useState<Lead | null>(null);

  const handleSmsStatusChange = async (newStatus: SmsContactStatus, note: string) => {
    if (!smsChangingLead) return;

    const updatedLead: Lead = {
      ...smsChangingLead,
      smsContactStatus: newStatus,
    };

    dataRepository.updateLead(updatedLead);

    dataRepository.addInteraction({
      id: crypto.randomUUID(),
      leadId: smsChangingLead.id,
      message: `Estado SMS cambiado a: ${newStatus === "activo" ? "Activo" : "Bloqueado"}. ${note}`,
      createdAt: new Date().toISOString(),
    });

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
              <TableHead className="w-[60px]">Urgencia</TableHead>
              <TableHead>Lead</TableHead>
              <TableHead>Acción comprometida</TableHead>
              <TableHead className="w-[100px]">Fecha</TableHead>
              <TableHead className="w-[120px]">Acción rápida</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead className="w-[100px]">SMS</TableHead>
              <TableHead className="w-[80px]">Temp.</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {leads.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                  No hay acciones pendientes
                </TableCell>
              </TableRow>
            ) : (
              leads.map((lead) => {
                const urgency = getLeadUrgency(lead);
                const urgencyConfig = getUrgencyConfig(urgency);
                const state = getPipelineState(lead.pipelineState);

                return (
                  <TableRow key={lead.id} className="hover:bg-muted/50">
                    {/* Columna 1: Urgencia visual */}
                    <TableCell>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger>
                            <span className="text-lg">{urgencyConfig.icon}</span>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>{urgencyConfig.label}</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </TableCell>

                    {/* Columna 2: Lead (nombre + teléfono) */}
                    <TableCell>
                      <button
                        onClick={() => navigate(`/lead/${lead.id}`)}
                        className="text-left hover:underline"
                      >
                        <p className="font-medium text-foreground">{lead.name}</p>
                        <p className="text-xs text-muted-foreground">{lead.phone}</p>
                      </button>
                    </TableCell>

                    {/* Columna 3: Próxima acción */}
                    <TableCell>
                      {lead.nextActionNote ? (
                        <p className="text-sm text-foreground truncate max-w-[200px]" title={lead.nextActionNote}>
                          {lead.nextActionNote}
                        </p>
                      ) : (
                        <span className="flex items-center gap-1 text-sm text-destructive">
                          <AlertTriangle className="h-3 w-3" />
                          Sin acción definida
                        </span>
                      )}
                    </TableCell>

                    {/* Columna 4: Fecha */}
                    <TableCell>
                      <span className={`text-sm ${urgencyConfig.color}`}>
                        {formatShortDate(lead.nextContactDate)}
                      </span>
                    </TableCell>

                    {/* Columna 5: Acción rápida */}
                    <TableCell>
                      <div className="flex gap-1">
                        <DropdownMenu>
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <DropdownMenuTrigger asChild>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="h-7 w-7 p-0"
                                  >
                                    <Pencil className="h-3 w-3" />
                                  </Button>
                                </DropdownMenuTrigger>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Editar / Eliminar lead</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                          <DropdownMenuContent align="start" className="bg-popover">
                            <DropdownMenuItem onClick={() => setEditingLead(lead)}>
                              <UserPen className="h-4 w-4 mr-2" />
                              Editar datos del lead
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem 
                              className="text-destructive focus:text-destructive"
                              onClick={() => setDeletingLead(lead)}
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Eliminar lead
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-7 w-7 p-0"
                                onClick={() => navigate(`/lead/${lead.id}`)}
                              >
                                <CheckCircle className="h-3 w-3" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Ver lead / Completar acción</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                    </TableCell>

                    {/* Columna 6: Estado */}
                    <TableCell>
                      <Badge variant="outline" className="text-xs">
                        {state?.name || lead.pipelineState}
                      </Badge>
                    </TableCell>

                    {/* Columna 7: SMS */}
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Badge 
                          variant="outline" 
                          className={`text-xs ${
                            lead.smsContactStatus === "activo" 
                              ? "bg-green-500/10 text-green-600 border-green-500/30" 
                              : "bg-destructive/10 text-destructive border-destructive/30"
                          }`}
                        >
                          {lead.smsContactStatus === "activo" ? (
                            <><MessageSquare className="h-3 w-3 mr-1" />Activo</>
                          ) : (
                            <><MessageSquareOff className="h-3 w-3 mr-1" />Bloq.</>
                          )}
                        </Badge>
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 w-6 p-0"
                                onClick={() => setSmsChangingLead(lead)}
                              >
                                {lead.smsContactStatus === "activo" ? (
                                  <MessageSquareOff className="h-3 w-3 text-muted-foreground" />
                                ) : (
                                  <MessageSquare className="h-3 w-3 text-muted-foreground" />
                                )}
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>{lead.smsContactStatus === "activo" ? "Bloquear SMS" : "Activar SMS"}</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                    </TableCell>

                    {/* Columna 8: Temperatura */}
                    <TableCell>
                      <Badge variant="outline" className={`text-xs ${getTemperatureColor(lead.temperature)}`}>
                        {getTemperatureLabel(lead.temperature)}
                      </Badge>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </CardContent>

      {smsChangingLead && (
        <ChangeSmsStatusModal
          isOpen={!!smsChangingLead}
          onClose={() => setSmsChangingLead(null)}
          onSave={handleSmsStatusChange}
          currentStatus={smsChangingLead.smsContactStatus}
        />
      )}

      {editingLead && (
        <CreateLeadDialog
          lead={editingLead}
          open={!!editingLead}
          onOpenChange={(open) => !open && setEditingLead(null)}
          onLeadCreated={() => {
            setEditingLead(null);
            onLeadUpdated();
          }}
        />
      )}

      {deletingLead && (
        <DeleteLeadDialog
          lead={deletingLead}
          open={!!deletingLead}
          onOpenChange={(open) => !open && setDeletingLead(null)}
          onLeadDeleted={() => {
            setDeletingLead(null);
            onLeadUpdated();
          }}
        />
      )}
    </Card>
  );
};
