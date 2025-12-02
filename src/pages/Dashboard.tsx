import { useEffect, useState } from "react";
import { Lead, LeadTemperature } from "@/types/crm";
import { dataRepository } from "@/lib/DataRepository";
import { PIPELINE_STATES } from "@/lib/pipeline";
import { CreateLeadDialog } from "@/components/CreateLeadDialog";
import { LeadsTable } from "@/components/LeadsTable";
import { PipelineProgress } from "@/components/PipelineProgress";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Settings, GitBranch } from "lucide-react";
import { useNavigate } from "react-router-dom";

const Dashboard = () => {
  const navigate = useNavigate();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [temperatureFilter, setTemperatureFilter] = useState<LeadTemperature | "all">("all");

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

        {loading ? (
          <div className="text-center py-12 text-muted-foreground">
            Cargando leads...
          </div>
        ) : (
          <LeadsTable leads={filteredLeads} onLeadUpdated={loadLeads} />
        )}
      </div>
    </div>
  );
};

export default Dashboard;
