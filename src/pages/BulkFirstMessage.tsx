import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, MessageSquarePlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { Lead, Interaction } from "@/types/crm";
import { DataRepository } from "@/lib/DataRepository";
import { updateLeadTemperature } from "@/lib/temperature";
import { format } from "date-fns";
import { es } from "date-fns/locale";

const dataRepository = new DataRepository();

const BulkFirstMessage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [stateFilter, setStateFilter] = useState<"contacto_inicial" | "all">("contacto_inicial");
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedLeadIds, setSelectedLeadIds] = useState<Set<string>>(new Set());
  const [message, setMessage] = useState("");
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  const loadLeads = async () => {
    setLoading(true);
    const allLeads = await dataRepository.getLeads();
    setLeads(allLeads);
    setLoading(false);
  };

  useEffect(() => {
    loadLeads();
  }, []);

  // Filtrar leads según el estado seleccionado
  const filteredLeads = stateFilter === "contacto_inicial"
    ? leads.filter(lead => lead.pipelineState === "contacto_inicial")
    : leads;

  // Manejar selección individual
  const handleSelectLead = (leadId: string, checked: boolean) => {
    const newSelected = new Set(selectedLeadIds);
    if (checked) {
      newSelected.add(leadId);
    } else {
      newSelected.delete(leadId);
    }
    setSelectedLeadIds(newSelected);
  };

  // Manejar seleccionar todos
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedLeadIds(new Set(filteredLeads.map(lead => lead.id)));
    } else {
      setSelectedLeadIds(new Set());
    }
  };

  const allSelected = filteredLeads.length > 0 && filteredLeads.every(lead => selectedLeadIds.has(lead.id));
  const someSelected = filteredLeads.some(lead => selectedLeadIds.has(lead.id));

  // Abrir modal de confirmación
  const handleOpenConfirmDialog = () => {
    if (selectedLeadIds.size === 0) {
      toast({
        title: "Sin selección",
        description: "Debes seleccionar al menos un lead.",
        variant: "destructive",
      });
      return;
    }

    if (!message.trim()) {
      toast({
        title: "Mensaje vacío",
        description: "Debes escribir un mensaje antes de grabar.",
        variant: "destructive",
      });
      return;
    }

    setConfirmText("");
    setShowConfirmDialog(true);
  };

  // Procesar grabación masiva
  const handleBulkRecord = async () => {
    setIsProcessing(true);
    let successCount = 0;
    let errorCount = 0;

    for (const leadId of selectedLeadIds) {
      try {
        // 1. Crear nueva interacción
        const newInteraction: Interaction = {
          id: `int-${Date.now()}-${leadId}-${Math.random().toString(36).substr(2, 9)}`,
          leadId: leadId,
          message: message.trim(),
          createdAt: new Date().toISOString(),
          direction: "outgoing",
        };
        await dataRepository.addInteraction(newInteraction);

        // 2. Obtener el lead y actualizar estado si está en contacto_inicial
        const lead = await dataRepository.getLeadById(leadId);
        if (lead && lead.pipelineState === "contacto_inicial") {
          // Obtener todas las interacciones del lead para calcular temperatura
          const allInteractions = await dataRepository.getInteractionsForLead(leadId);
          
          // Actualizar estado al siguiente (valor_entregado)
          let updatedLead: Lead = {
            ...lead,
            pipelineState: "valor_entregado",
          };
          
          // Actualizar temperatura automáticamente
          updatedLead = updateLeadTemperature(updatedLead, [...allInteractions, newInteraction]);
          
          await dataRepository.updateLead(updatedLead);
        }

        successCount++;
      } catch (error) {
        errorCount++;
        console.error(`Error procesando lead ${leadId}:`, error);
      }
    }

    // Mostrar resultado
    toast({
      title: "Proceso completado",
      description: `Primer mensaje registrado para ${successCount} contactos.${errorCount > 0 ? ` (${errorCount} errores)` : ""}`,
    });

    // Limpiar estado
    setMessage("");
    setSelectedLeadIds(new Set());
    setConfirmText("");
    setShowConfirmDialog(false);
    setIsProcessing(false);

    // Recargar leads
    loadLeads();
  };

  // Limpiar selección cuando cambia el filtro
  useEffect(() => {
    setSelectedLeadIds(new Set());
  }, [stateFilter]);

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-6 max-w-5xl">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button variant="ghost" size="icon" onClick={() => navigate("/")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex items-center gap-2">
            <MessageSquarePlus className="h-6 w-6 text-primary" />
            <h1 className="text-2xl font-bold">Agregar Primer Mensaje</h1>
          </div>
        </div>

        {/* Filtro de estado */}
        <div className="mb-6">
          <label className="text-sm font-medium mb-2 block">Filtrar por estado:</label>
          <Select
            value={stateFilter}
            onValueChange={(value: "contacto_inicial" | "all") => setStateFilter(value)}
          >
            <SelectTrigger className="w-[250px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="contacto_inicial">Contacto Inicial</SelectItem>
              <SelectItem value="all">Todos los estados</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Textarea para mensaje */}
        <div className="mb-6">
          <label className="text-sm font-medium mb-2 block">Mensaje a grabar:</label>
          <Textarea
            placeholder="Escribe aquí el primer mensaje..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="min-h-[120px]"
          />
        </div>

        {/* Botón de grabar */}
        <div className="mb-6">
          <Button
            onClick={handleOpenConfirmDialog}
            disabled={selectedLeadIds.size === 0 || !message.trim()}
            className="w-full sm:w-auto"
          >
            <MessageSquarePlus className="h-4 w-4 mr-2" />
            Grabar Primer Mensaje ({selectedLeadIds.size} seleccionados)
          </Button>
        </div>

        {/* Tabla de leads */}
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[50px]">
                  <Checkbox
                    checked={allSelected}
                    onCheckedChange={handleSelectAll}
                    aria-label="Seleccionar todos"
                    {...(someSelected && !allSelected ? { "data-state": "indeterminate" } : {})}
                  />
                </TableHead>
                <TableHead>Nombre</TableHead>
                <TableHead>Teléfono</TableHead>
                <TableHead>Fecha de creación</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                    Cargando leads...
                  </TableCell>
                </TableRow>
              ) : filteredLeads.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                    No hay leads con el filtro seleccionado.
                  </TableCell>
                </TableRow>
              ) : (
                filteredLeads.map((lead) => (
                  <TableRow key={lead.id}>
                    <TableCell>
                      <Checkbox
                        checked={selectedLeadIds.has(lead.id)}
                        onCheckedChange={(checked) => handleSelectLead(lead.id, checked as boolean)}
                        aria-label={`Seleccionar ${lead.name}`}
                      />
                    </TableCell>
                    <TableCell className="font-medium">{lead.name}</TableCell>
                    <TableCell>{lead.phone}</TableCell>
                    <TableCell>
                      {format(new Date(lead.createdAt), "dd/MM/yyyy HH:mm", { locale: es })}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Modal de confirmación */}
        <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirmar grabación masiva</AlertDialogTitle>
              <AlertDialogDescription className="space-y-3">
                <p>
                  ¿Confirmas grabar este mensaje para <strong>{selectedLeadIds.size}</strong> leads seleccionados?
                </p>
                <p>
                  Para continuar escribe: <strong>GRABAR</strong>
                </p>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <Input
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder="Escribe GRABAR para confirmar"
              className="mt-2"
            />
            <AlertDialogFooter>
              <AlertDialogCancel disabled={isProcessing}>Cancelar</AlertDialogCancel>
              <AlertDialogAction
                disabled={confirmText !== "GRABAR" || isProcessing}
                onClick={handleBulkRecord}
              >
                {isProcessing ? "Procesando..." : "Confirmar"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
};

export default BulkFirstMessage;
