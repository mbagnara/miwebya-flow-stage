import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Lead } from "@/types/crm";
import { getPipelineState } from "@/lib/pipeline";
import { getTemperatureColor, getTemperatureLabel } from "@/lib/temperature";
import { getLeadUrgency, getUrgencyConfig, formatShortDate } from "@/lib/urgency";
import { useNavigate } from "react-router-dom";
import { Pencil, CheckCircle, AlertTriangle } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface ActionTableProps {
  leads: Lead[];
}

export const ActionTable = ({ leads }: ActionTableProps) => {
  const navigate = useNavigate();

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
              <TableHead className="w-[80px]">Temp.</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {leads.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
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
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-7 w-7 p-0"
                                onClick={() => navigate(`/lead/${lead.id}`)}
                              >
                                <Pencil className="h-3 w-3" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Registrar interacción</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
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
                              <p>Completar acción</p>
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

                    {/* Columna 7: Temperatura */}
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
    </Card>
  );
};
