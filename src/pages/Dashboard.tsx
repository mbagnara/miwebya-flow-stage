import { useEffect, useState } from "react";
import { Lead, LeadTemperature } from "@/types/crm";
import { dataRepository } from "@/lib/DataRepository";
import { PIPELINE_STATES } from "@/lib/pipeline";
import { CreateLeadDialog } from "@/components/CreateLeadDialog";
import { LeadsTable } from "@/components/LeadsTable";
import { PipelineProgress } from "@/components/PipelineProgress";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Settings, GitBranch, Download, Upload } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "@/hooks/use-toast";
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

const Dashboard = () => {
  const navigate = useNavigate();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [temperatureFilter, setTemperatureFilter] = useState<LeadTemperature | "all">("all");
  const [itemsPerPage, setItemsPerPage] = useState<number>(20);
  const [currentPage, setCurrentPage] = useState(1);
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);

  const loadLeads = async () => {
    setLoading(true);
    await dataRepository.seedFakeData();
    const allLeads = await dataRepository.getLeads();
    setLeads(allLeads.sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    ));
    setLoading(false);
  };

  useEffect(() => {
    loadLeads();
  }, []);

  const filteredLeads = temperatureFilter === "all"
    ? leads
    : leads.filter(lead => lead.temperature === temperatureFilter);

  // Paginación
  const totalLeads = filteredLeads.length;
  const totalPages = itemsPerPage === -1 ? 1 : Math.ceil(totalLeads / itemsPerPage);
  const startIndex = itemsPerPage === -1 ? 0 : (currentPage - 1) * itemsPerPage;
  const endIndex = itemsPerPage === -1 ? totalLeads : startIndex + itemsPerPage;
  const paginatedLeads = filteredLeads.slice(startIndex, endIndex);

  // Reset a página 1 cuando cambia el filtro
  useEffect(() => {
    setCurrentPage(1);
  }, [temperatureFilter, itemsPerPage]);

  const handleExportLeads = async () => {
    try {
      const data = await dataRepository.exportAllData();
      const jsonString = JSON.stringify(data, null, 2);
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `miwebya-leads-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast({
        title: "Exportación exitosa",
        description: `Se exportaron ${data.leads.length} leads con sus interacciones`
      });
    } catch (error) {
      toast({
        title: "Error al exportar",
        description: "No se pudo exportar los datos",
        variant: "destructive"
      });
    }
  };

  const handleImportLeads = async () => {
    if (!importFile) return;

    try {
      const text = await importFile.text();
      const data = JSON.parse(text);

      if (!data.leads || !Array.isArray(data.leads)) {
        toast({
          title: "Error en el archivo",
          description: "El archivo no tiene el formato correcto",
          variant: "destructive"
        });
        return;
      }

      await dataRepository.importAllData(data);
      await loadLeads();
      
      setShowImportDialog(false);
      setImportFile(null);

      toast({
        title: "Importación exitosa",
        description: `Se importaron ${data.leads.length} leads correctamente`
      });
    } catch (error) {
      toast({
        title: "Error al importar",
        description: "No se pudo leer el archivo o el formato es incorrecto",
        variant: "destructive"
      });
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setImportFile(file);
      setShowImportDialog(true);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-8 px-4">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground">MiWebYa CRM</h1>
            <p className="text-muted-foreground mt-1">Gestiona tus leads y pipeline de ventas</p>
          </div>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={handleExportLeads}
              className="hidden sm:flex"
            >
              <Download className="h-4 w-4 mr-2" />
              Exportar
            </Button>
            <Button 
              variant="outline" 
              onClick={() => document.getElementById('import-file-input')?.click()}
              className="hidden sm:flex"
            >
              <Upload className="h-4 w-4 mr-2" />
              Importar
            </Button>
            <input
              id="import-file-input"
              type="file"
              accept=".json"
              onChange={handleFileSelect}
              className="hidden"
            />
            <Button 
              variant="outline" 
              size="icon"
              onClick={handleExportLeads}
              className="sm:hidden"
              title="Exportar leads"
            >
              <Download className="h-4 w-4" />
            </Button>
            <Button 
              variant="outline" 
              size="icon"
              onClick={() => document.getElementById('import-file-input')?.click()}
              className="sm:hidden"
              title="Importar leads"
            >
              <Upload className="h-4 w-4" />
            </Button>
            <Button 
              variant="outline" 
              onClick={() => navigate("/config/pipeline")}
              className="hidden sm:flex"
            >
              <GitBranch className="h-4 w-4 mr-2" />
              Ver Configuración del Pipeline
            </Button>
            <Button 
              variant="outline" 
              size="icon" 
              onClick={() => navigate("/config/pipeline")}
              className="sm:hidden"
            >
              <GitBranch className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon" onClick={() => navigate("/settings")}>
              <Settings className="h-4 w-4" />
            </Button>
            <CreateLeadDialog onLeadCreated={loadLeads} />
          </div>
        </div>

        {/* Pipeline Overview Card */}
        {!loading && leads.length > 0 && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Vista General del Pipeline</CardTitle>
              <CardDescription>
                Distribución de tus {leads.length} leads en las diferentes etapas
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
                {PIPELINE_STATES.filter(
                  state => state.id !== "cierreGanado" && state.id !== "cierrePerdido"
                ).map(state => {
                  const count = leads.filter(lead => lead.pipelineState === state.id).length;
                  return (
                    <div 
                      key={state.id} 
                      className="p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                    >
                      <p className="text-2xl font-bold text-primary mb-1">{count}</p>
                      <p className="text-xs text-muted-foreground leading-tight">{state.name}</p>
                    </div>
                  );
                })}
              </div>
              <div className="grid grid-cols-2 gap-3 mt-3">
                <div className="p-4 rounded-lg border bg-green-500/10 border-green-500/20">
                  <p className="text-2xl font-bold text-green-600 mb-1">
                    {leads.filter(l => l.pipelineState === "cierreGanado").length}
                  </p>
                  <p className="text-xs text-green-700 leading-tight">Cierre Ganado</p>
                </div>
                <div className="p-4 rounded-lg border bg-red-500/10 border-red-500/20">
                  <p className="text-2xl font-bold text-red-600 mb-1">
                    {leads.filter(l => l.pipelineState === "cierrePerdido").length}
                  </p>
                  <p className="text-xs text-red-700 leading-tight">Cierre Perdido</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="flex gap-2 mb-6">
          <Button
            variant={temperatureFilter === "all" ? "default" : "outline"}
            onClick={() => setTemperatureFilter("all")}
          >
            Todos
          </Button>
          <Button
            variant={temperatureFilter === "cold" ? "default" : "outline"}
            onClick={() => setTemperatureFilter("cold")}
          >
            Cold
          </Button>
          <Button
            variant={temperatureFilter === "warm" ? "default" : "outline"}
            onClick={() => setTemperatureFilter("warm")}
          >
            Warm
          </Button>
          <Button
            variant={temperatureFilter === "hot" ? "default" : "outline"}
            onClick={() => setTemperatureFilter("hot")}
          >
            Hot
          </Button>
        </div>

        {/* Contador y selector de paginación */}
        <div className="flex items-center justify-between mb-4">
          <div className="text-sm text-muted-foreground">
            Mostrando <span className="font-semibold text-foreground">{paginatedLeads.length}</span> de{" "}
            <span className="font-semibold text-foreground">{totalLeads}</span> leads
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Mostrar:</span>
            <Select
              value={itemsPerPage.toString()}
              onValueChange={(value) => setItemsPerPage(Number(value))}
            >
              <SelectTrigger className="w-[100px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="10">10</SelectItem>
                <SelectItem value="20">20</SelectItem>
                <SelectItem value="50">50</SelectItem>
                <SelectItem value="100">100</SelectItem>
                <SelectItem value="-1">Todos</SelectItem>
              </SelectContent>
            </Select>
            {totalPages > 1 && (
              <>
                <span className="text-sm text-muted-foreground mx-2">|</span>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                  >
                    Anterior
                  </Button>
                  <span className="text-sm text-muted-foreground">
                    Página {currentPage} de {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                  >
                    Siguiente
                  </Button>
                </div>
              </>
            )}
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12 text-muted-foreground">
            Cargando leads...
          </div>
        ) : (
          <LeadsTable leads={paginatedLeads} onLeadUpdated={loadLeads} />
        )}
      </div>

      {/* Import Confirmation Dialog */}
      <AlertDialog open={showImportDialog} onOpenChange={setShowImportDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Confirmar importación?</AlertDialogTitle>
            <AlertDialogDescription className="space-y-3">
              <p>
                Esta acción <strong>eliminará todos los leads existentes</strong> y sus datos
                (interacciones, timeline, etc.) y los reemplazará con los datos del archivo:
              </p>
              <p className="font-semibold text-foreground">
                {importFile?.name}
              </p>
              <p className="text-destructive">
                ⚠️ Esta acción no se puede deshacer. Asegúrate de haber exportado tus datos
                actuales antes de continuar.
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => {
              setImportFile(null);
              setShowImportDialog(false);
            }}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleImportLeads}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Importar y reemplazar todo
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Dashboard;
