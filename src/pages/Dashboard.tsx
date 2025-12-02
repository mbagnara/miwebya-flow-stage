import { useEffect, useState } from "react";
import { Lead } from "@/types/crm";
import { dataRepository } from "@/lib/DataRepository";
import { CreateLeadDialog } from "@/components/CreateLeadDialog";
import { LeadsTable } from "@/components/LeadsTable";

const Dashboard = () => {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);

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

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-8 px-4">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground">MiWebYa CRM</h1>
            <p className="text-muted-foreground mt-1">Gestiona tus leads y pipeline de ventas</p>
          </div>
          <CreateLeadDialog onLeadCreated={loadLeads} />
        </div>

        {loading ? (
          <div className="text-center py-12 text-muted-foreground">
            Cargando leads...
          </div>
        ) : (
          <LeadsTable leads={leads} />
        )}
      </div>
    </div>
  );
};

export default Dashboard;
