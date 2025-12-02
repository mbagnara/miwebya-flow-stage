import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Lead } from "@/types/crm";
import { getPipelineState } from "@/lib/pipeline";
import { getTemperatureColor, getTemperatureLabel } from "@/lib/temperature";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { CreateLeadDialog } from "@/components/CreateLeadDialog";
import { DeleteLeadDialog } from "@/components/DeleteLeadDialog";
import { PipelineProgress } from "@/components/PipelineProgress";
import { Pencil } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useState } from "react";

interface LeadsTableProps {
  leads: Lead[];
  onLeadUpdated: () => void;
}

export const LeadsTable = ({ leads, onLeadUpdated }: LeadsTableProps) => {
  const navigate = useNavigate();
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);

  const getStateBadgeVariant = (stateId: string) => {
    if (stateId === "cierreGanado") return "default";
    if (stateId === "cierrePerdido") return "destructive";
    if (stateId === "nuevo") return "secondary";
    return "outline";
  };

  return (
    <Card>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nombre</TableHead>
              <TableHead>Teléfono</TableHead>
              <TableHead>Ciudad</TableHead>
              <TableHead>Rubro</TableHead>
              <TableHead>Temperatura</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>Creado</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {leads.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center text-muted-foreground">
                  No hay leads aún. Crea el primero!
                </TableCell>
              </TableRow>
            ) : (
              leads.map((lead) => {
                const state = getPipelineState(lead.pipelineState);
                return (
                  <TableRow key={lead.id}>
                    <TableCell className="font-medium">{lead.name}</TableCell>
                    <TableCell>{lead.phone}</TableCell>
                    <TableCell>{lead.city || "-"}</TableCell>
                    <TableCell>{lead.businessType || "-"}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={getTemperatureColor(lead.temperature)}>
                        {getTemperatureLabel(lead.temperature)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={getStateBadgeVariant(lead.pipelineState)}>
                        {state?.name || lead.pipelineState}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {format(new Date(lead.createdAt), "dd MMM yyyy", { locale: es })}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <CreateLeadDialog
                          lead={lead}
                          onLeadCreated={onLeadUpdated}
                          trigger={
                            <Button variant="outline" size="sm">
                              <Pencil className="h-4 w-4" />
                            </Button>
                          }
                        />
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setSelectedLead(lead)}
                        >
                          Ver Pipeline
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => navigate(`/lead/${lead.id}`)}
                        >
                          Ver Lead
                        </Button>
                        <DeleteLeadDialog
                          lead={lead}
                          onLeadDeleted={onLeadUpdated}
                        />
                      </div>
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
    </Card>
  );
};
