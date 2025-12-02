import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Lead } from "@/types/crm";
import { getPipelineState } from "@/lib/pipeline";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface LeadsTableProps {
  leads: Lead[];
}

export const LeadsTable = ({ leads }: LeadsTableProps) => {
  const navigate = useNavigate();

  const getStateBadgeVariant = (stateId: string) => {
    if (stateId === "cierreGanado") return "default";
    if (stateId === "cierrePerdido") return "destructive";
    if (stateId === "nuevo") return "secondary";
    return "outline";
  };

  return (
    <div className="border rounded-lg">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nombre</TableHead>
            <TableHead>Teléfono</TableHead>
            <TableHead>Ciudad</TableHead>
            <TableHead>Rubro</TableHead>
            <TableHead>Estado</TableHead>
            <TableHead>Creado</TableHead>
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
              return (
                <TableRow key={lead.id}>
                  <TableCell className="font-medium">{lead.name}</TableCell>
                  <TableCell>{lead.phone}</TableCell>
                  <TableCell>{lead.city || "-"}</TableCell>
                  <TableCell>{lead.businessType || "-"}</TableCell>
                  <TableCell>
                    <Badge variant={getStateBadgeVariant(lead.pipelineState)}>
                      {state?.name || lead.pipelineState}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {format(new Date(lead.createdAt), "dd MMM yyyy", { locale: es })}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => navigate(`/lead/${lead.id}`)}
                    >
                      Ver Lead
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })
          )}
        </TableBody>
      </Table>
    </div>
  );
};
