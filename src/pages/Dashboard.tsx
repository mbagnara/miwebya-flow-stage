import { useEffect, useState, useMemo } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Lead, LeadTemperature } from "@/types/crm";
import { dataRepository } from "@/lib/DataRepository";
import { MAIN_PIPELINE_STATES, PIPELINE_STATES } from "@/lib/pipeline";
import { CreateLeadDialog } from "@/components/CreateLeadDialog";
import { ImportCSVDialog } from "@/components/ImportCSVDialog";
import { ActionTable } from "@/components/ActionTable";
import { PendingActionsCards } from "@/components/PendingActionsCards";
import { PipelineProgress } from "@/components/PipelineProgress";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Settings, GitBranch, Download, Upload, MessageSquarePlus, CalendarIcon, FileUp, Flame, CalendarCheck, AlertTriangle, Search, X, Phone, MessageSquareOff } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useNavigate } from "react-router-dom";
import { toast } from "@/hooks/use-toast";
import { format, startOfDay, endOfDay, isWithinInterval, isSameDay } from "date-fns";
import { es } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { getLeadUrgency, UrgencyType } from "@/lib/urgency";
import { FilterType } from "@/components/PendingActionsCards";
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

type DateFilterMode = "today" | "range" | "all";

const Dashboard = () => {
  const navigate = useNavigate();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [temperatureFilter, setTemperatureFilter] = useState<LeadTemperature | "all">("all");
  const [stateFilter, setStateFilter] = useState<string>("all");
  const [actionFilter, setActionFilter] = useState<FilterType>("all");
  const [itemsPerPage, setItemsPerPage] = useState<number>(20);
  const [currentPage, setCurrentPage] = useState(1);
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  
  // Estado del filtro de fecha
  const [dateFilterMode, setDateFilterMode] = useState<DateFilterMode>("all");
  const [dateFrom, setDateFrom] = useState<Date | undefined>(undefined);
  const [dateTo, setDateTo] = useState<Date | undefined>(undefined);
  
  // Estado del filtro por teléfono (prioridad máxima)
  const [phoneSearch, setPhoneSearch] = useState("");
  
  // Estado para excluir leads bloqueados (por defecto activado)
  const [excludeBlockedLeads, setExcludeBlockedLeads] = useState(true);

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

  // Primero aplicar filtro de leads bloqueados (excepto cuando el filtro es sms-blocked)
  const blockedFilteredLeads = useMemo(() => {
    // Si el filtro activo es "sms-blocked", no excluir bloqueados
    if (actionFilter === "sms-blocked") return leads;
    
    // Si el checkbox está activo, excluir bloqueados
    if (excludeBlockedLeads) {
      return leads.filter(lead => lead.smsContactStatus !== "bloqueado");
    }
    return leads;
  }, [leads, excludeBlockedLeads, actionFilter]);

  // Filtrar por urgencia de acción
  const actionFilteredLeads = useMemo(() => {
    if (actionFilter === "all") return blockedFilteredLeads;
    
    if (actionFilter === "sms-blocked") {
      return leads.filter(lead => lead.smsContactStatus === "bloqueado");
    }
    
    return blockedFilteredLeads.filter(lead => {
      const urgency = getLeadUrgency(lead);
      return urgency === actionFilter;
    });
  }, [blockedFilteredLeads, leads, actionFilter]);

  // Filtrar por fecha
  const dateFilteredLeads = useMemo(() => {
    const today = new Date();
    
    return actionFilteredLeads.filter(lead => {
      const leadDate = new Date(lead.createdAt);
      
      if (dateFilterMode === "today") {
        return isSameDay(leadDate, today);
      }
      
      if (dateFilterMode === "range") {
        if (!dateFrom && !dateTo) return false;
        
        if (dateFrom && !dateTo) {
          return leadDate >= startOfDay(dateFrom) && leadDate <= endOfDay(today);
        }
        
        if (!dateFrom && dateTo) {
          return leadDate <= endOfDay(dateTo);
        }
        
        if (dateFrom && dateTo) {
          return isWithinInterval(leadDate, {
            start: startOfDay(dateFrom),
            end: endOfDay(dateTo)
          });
        }
      }
      
      return true;
    });
  }, [actionFilteredLeads, dateFilterMode, dateFrom, dateTo]);

  // Luego aplicar filtros de temperatura y estado
  const filteredLeads = useMemo(() => {
    return dateFilteredLeads.filter(lead => {
      const matchesTemperature = temperatureFilter === "all" || lead.temperature === temperatureFilter;
      const matchesState = stateFilter === "all" || lead.pipelineState === stateFilter;
      return matchesTemperature && matchesState;
    });
  }, [dateFilteredLeads, temperatureFilter, stateFilter]);

  // Filtro por teléfono (PRIORIDAD MÁXIMA - ignora todos los demás filtros)
  const phoneFilteredLeads = useMemo(() => {
    if (!phoneSearch.trim()) return null;
    
    const normalizedSearch = phoneSearch.replace(/\D/g, '');
    if (!normalizedSearch) return null;
    
    return leads.filter(lead => {
      if (!lead.phone) return false;
      const normalizedPhone = lead.phone.replace(/\D/g, '');
      return normalizedPhone.includes(normalizedSearch);
    });
  }, [leads, phoneSearch]);

  // Leads finales: teléfono tiene prioridad sobre otros filtros
  const finalLeads = useMemo(() => {
    if (phoneFilteredLeads !== null) {
      return phoneFilteredLeads;
    }
    return filteredLeads;
  }, [phoneFilteredLeads, filteredLeads]);

  // Paginación
  const totalLeads = finalLeads.length;
  const totalLeadsWithoutDateFilter = leads.filter(lead => {
    const matchesTemperature = temperatureFilter === "all" || lead.temperature === temperatureFilter;
    const matchesState = stateFilter === "all" || lead.pipelineState === stateFilter;
    return matchesTemperature && matchesState;
  }).length;
  const totalPages = itemsPerPage === -1 ? 1 : Math.ceil(totalLeads / itemsPerPage);
  const startIndex = itemsPerPage === -1 ? 0 : (currentPage - 1) * itemsPerPage;
  const endIndex = itemsPerPage === -1 ? totalLeads : startIndex + itemsPerPage;
  const paginatedLeads = finalLeads.slice(startIndex, endIndex);

  // Reset a página 1 cuando cambia el filtro
  useEffect(() => {
    setCurrentPage(1);
  }, [temperatureFilter, stateFilter, actionFilter, itemsPerPage, dateFilterMode, dateFrom, dateTo, phoneSearch]);

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
        {/* Header con botones - SIN CAMBIOS */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground">MiWebYa CRM</h1>
            <p className="text-muted-foreground mt-1">Tu día de ventas</p>
          </div>
          <div className="flex gap-2">
            <Button 
              variant="default" 
              onClick={() => navigate("/bulk-first-message")}
              className="hidden sm:flex"
            >
              <MessageSquarePlus className="h-4 w-4 mr-2" />
              Agregar Primer Mensaje
            </Button>
            <Button 
              variant="default" 
              size="icon"
              onClick={() => navigate("/bulk-first-message")}
              className="sm:hidden"
              title="Agregar Primer Mensaje"
            >
              <MessageSquarePlus className="h-4 w-4" />
            </Button>
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
            <ImportCSVDialog 
              onImportComplete={loadLeads}
              trigger={
                <Button variant="outline" className="hidden sm:flex">
                  <FileUp className="h-4 w-4 mr-2" />
                  Importar New Leads
                </Button>
              }
            />
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
            <ImportCSVDialog 
              onImportComplete={loadLeads}
              trigger={
                <Button variant="outline" size="icon" className="sm:hidden" title="Importar New Leads">
                  <FileUp className="h-4 w-4" />
                </Button>
              }
            />
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

        {/* CAPA 1: Bloque Acciones Pendientes */}
        {!loading && leads.length > 0 && (
          <PendingActionsCards 
            leads={blockedFilteredLeads}
            allLeads={leads}
            activeFilter={actionFilter}
            onFilterChange={setActionFilter}
          />
        )}

        {/* CAPA 3: Filtros orientados a ejecución */}
        <div className="bg-muted/30 rounded-lg border p-4 mb-6">
          {/* Búsqueda rápida por teléfono */}
          <div className="flex items-center gap-2 mb-4 pb-4 border-b border-border/50">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Buscar por teléfono..."
              value={phoneSearch}
              onChange={(e) => setPhoneSearch(e.target.value)}
              className="max-w-xs"
            />
            {phoneSearch && (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setPhoneSearch("")}
                className="gap-1"
              >
                <X className="h-4 w-4" />
                Limpiar
              </Button>
            )}
          </div>

          {/* Indicador cuando búsqueda por teléfono está activa */}
          {phoneSearch && (
            <div className="bg-primary/10 border border-primary/20 rounded-lg p-2 mb-4 flex items-center gap-2">
              <Phone className="h-4 w-4 text-primary" />
              <span className="text-sm text-primary">
                Buscando por teléfono: "{phoneSearch}" — Los demás filtros están desactivados
              </span>
            </div>
          )}

          {/* Filtros prioritarios */}
          <div className="flex flex-wrap gap-2 mb-4">
            <Button
              variant={actionFilter === "overdue" ? "default" : "outline"}
              size="sm"
              onClick={() => setActionFilter(actionFilter === "overdue" ? "all" : "overdue")}
              className="gap-1"
            >
              <Flame className="h-3 w-3" />
              Solo vencidas
            </Button>
            <Button
              variant={actionFilter === "today" ? "default" : "outline"}
              size="sm"
              onClick={() => setActionFilter(actionFilter === "today" ? "all" : "today")}
              className="gap-1"
            >
              <CalendarCheck className="h-3 w-3" />
              Acciones de hoy
            </Button>
            <Button
              variant={actionFilter === "no-action" ? "destructive" : "outline"}
              size="sm"
              onClick={() => setActionFilter(actionFilter === "no-action" ? "all" : "no-action")}
              className="gap-1"
            >
              <AlertTriangle className="h-3 w-3" />
              Sin próxima acción
            </Button>
            <Button
              variant={actionFilter === "sms-blocked" ? "secondary" : "outline"}
              size="sm"
              onClick={() => {
                if (actionFilter === "sms-blocked") {
                  setActionFilter("all");
                } else {
                  setActionFilter("sms-blocked");
                }
              }}
              className="gap-1"
            >
              <MessageSquareOff className="h-3 w-3" />
              SMS Bloqueados
            </Button>
            
            {/* Checkbox para excluir leads bloqueados */}
            <div className="flex items-center space-x-2 ml-4 border-l pl-4">
              <Checkbox 
                id="exclude-blocked" 
                checked={excludeBlockedLeads}
                onCheckedChange={(checked) => setExcludeBlockedLeads(checked === true)}
                disabled={actionFilter === "sms-blocked"}
              />
              <Label 
                htmlFor="exclude-blocked" 
                className={cn(
                  "text-sm font-medium cursor-pointer",
                  actionFilter === "sms-blocked" && "text-muted-foreground/50"
                )}
              >
                No incluir Leads bloqueados
              </Label>
            </div>
          </div>

          {/* Filtros secundarios */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Filtro de fecha */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">Fecha de creación</label>
              <ToggleGroup
                type="single"
                value={dateFilterMode}
                onValueChange={(value) => {
                  if (value) {
                    setDateFilterMode(value as DateFilterMode);
                    if (value !== "range") {
                      setDateFrom(undefined);
                      setDateTo(undefined);
                    }
                  }
                }}
                className="justify-start"
              >
                <ToggleGroupItem value="today" size="sm" className="px-3">
                  Hoy
                </ToggleGroupItem>
                <ToggleGroupItem value="range" size="sm" className="px-3">
                  Rango
                </ToggleGroupItem>
                <ToggleGroupItem value="all" size="sm" className="px-3">
                  Todo
                </ToggleGroupItem>
              </ToggleGroup>
            </div>

            {/* Filtro por temperatura */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">Temperatura</label>
              <Select value={temperatureFilter} onValueChange={(value) => setTemperatureFilter(value as LeadTemperature | "all")}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Todas las temperaturas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas las temperaturas</SelectItem>
                  <SelectItem value="cold">Cold</SelectItem>
                  <SelectItem value="cold-warm">Cold-Warm</SelectItem>
                  <SelectItem value="warm">Warm</SelectItem>
                  <SelectItem value="warm-hot">Warm-Hot</SelectItem>
                  <SelectItem value="hot">Hot</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Filtro por estado del pipeline */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">Estado</label>
              <Select value={stateFilter} onValueChange={setStateFilter}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Todos los estados" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los estados</SelectItem>
                  {PIPELINE_STATES.map(state => (
                    <SelectItem key={state.id} value={state.id}>
                      {state.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Date pickers para modo Rango */}
          {dateFilterMode === "range" && (
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 mt-4 pt-4 border-t border-border/50">
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className={cn(
                      "w-full sm:w-[160px] justify-start text-left font-normal",
                      !dateFrom && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dateFrom ? format(dateFrom, "dd/MM/yyyy") : "Desde"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={dateFrom}
                    onSelect={setDateFrom}
                    initialFocus
                    locale={es}
                    className="pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className={cn(
                      "w-full sm:w-[160px] justify-start text-left font-normal",
                      !dateTo && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dateTo ? format(dateTo, "dd/MM/yyyy") : "Hasta"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={dateTo}
                    onSelect={setDateTo}
                    initialFocus
                    locale={es}
                    className="pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>
          )}
        </div>

        {/* Contador y selector de paginación */}
        <div className="flex items-center justify-between mb-4">
          <div className="text-sm text-muted-foreground">
            Mostrando <span className="font-semibold text-foreground">{paginatedLeads.length}</span> de{" "}
            <span className="font-semibold text-foreground">{totalLeads}</span> acciones pendientes
            {(dateFilterMode !== "all" || actionFilter !== "all") && (
              <span className="text-muted-foreground"> ({totalLeadsWithoutDateFilter} total)</span>
            )}
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

        {/* CAPA 2: Tabla de Acciones */}
        {loading ? (
          <div className="text-center py-12 text-muted-foreground">
            Cargando acciones pendientes...
          </div>
        ) : (
          <ActionTable leads={paginatedLeads} onLeadUpdated={loadLeads} />
        )}

        {/* CAPA 4: Pipeline Overview (movido abajo) */}
        {!loading && leads.length > 0 && (
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Visión general del pipeline</CardTitle>
              <CardDescription>
                Distribución de tus {dateFilteredLeads.length} leads en las diferentes etapas
                {dateFilterMode === "today" && " (hoy)"}
                {dateFilterMode === "range" && dateFrom && dateTo && ` (${format(dateFrom, "dd/MM/yyyy")} - ${format(dateTo, "dd/MM/yyyy")})`}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {MAIN_PIPELINE_STATES.map(state => {
                  const count = dateFilteredLeads.filter(lead => lead.pipelineState === state.id).length;
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
              <div className="grid grid-cols-3 gap-3 mt-3">
                <div className="p-4 rounded-lg border bg-yellow-500/10 border-yellow-500/20">
                  <p className="text-2xl font-bold text-yellow-600 mb-1">
                    {dateFilteredLeads.filter(l => l.pipelineState === "follow_up").length}
                  </p>
                  <p className="text-xs text-yellow-700 leading-tight">Acción vencida</p>
                </div>
                <div className="p-4 rounded-lg border bg-green-500/10 border-green-500/20">
                  <p className="text-2xl font-bold text-green-600 mb-1">
                    {dateFilteredLeads.filter(l => l.pipelineState === "win").length}
                  </p>
                  <p className="text-xs text-green-700 leading-tight">Cliente (Win)</p>
                </div>
                <div className="p-4 rounded-lg border bg-red-500/10 border-red-500/20">
                  <p className="text-2xl font-bold text-red-600 mb-1">
                    {dateFilteredLeads.filter(l => l.pipelineState === "lost").length}
                  </p>
                  <p className="text-xs text-red-700 leading-tight">Perdido (Lost)</p>
                </div>
              </div>
            </CardContent>
          </Card>
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
