import { Card, CardContent } from "@/components/ui/card";
import { Lead } from "@/types/crm";
import { countLeadsByUrgency, countSmsBlocked, UrgencyType } from "@/lib/urgency";
import { AlertCircle, CalendarCheck, CalendarClock, AlertTriangle, MessageSquareOff } from "lucide-react";

export type FilterType = UrgencyType | "sms-blocked" | "all";

interface PendingActionsCardsProps {
  leads: Lead[];
  allLeads?: Lead[];  // Para contador de SMS bloqueados (siempre muestra total real)
  activeFilter: FilterType;
  onFilterChange: (filter: FilterType) => void;
}

export const PendingActionsCards = ({ leads, allLeads, activeFilter, onFilterChange }: PendingActionsCardsProps) => {
  const counts = countLeadsByUrgency(leads);
  // El contador de SMS bloqueados siempre usa allLeads para mostrar el total real
  const smsBlockedCount = countSmsBlocked(allLeads || leads);

  const cards = [
    {
      id: "overdue" as FilterType,
      title: "Acciones vencidas",
      subtitle: "Requieren acción inmediata",
      count: counts.overdue,
      icon: AlertCircle,
      bgColor: "bg-red-500/10",
      borderColor: "border-red-500/30",
      textColor: "text-red-600",
      iconColor: "text-red-500"
    },
    {
      id: "today" as FilterType,
      title: "Acciones de hoy",
      subtitle: "Compromisos para hoy",
      count: counts.today,
      icon: CalendarCheck,
      bgColor: "bg-orange-500/10",
      borderColor: "border-orange-500/30",
      textColor: "text-orange-600",
      iconColor: "text-orange-500"
    },
    {
      id: "upcoming" as FilterType,
      title: "Próximas acciones",
      subtitle: "Acciones planificadas",
      count: counts.upcoming,
      icon: CalendarClock,
      bgColor: "bg-green-500/10",
      borderColor: "border-green-500/30",
      textColor: "text-green-600",
      iconColor: "text-green-500"
    },
    {
      id: "no-action" as FilterType,
      title: "Sin próxima acción",
      subtitle: "Leads sin seguimiento definido",
      count: counts["no-action"],
      icon: AlertTriangle,
      bgColor: "bg-destructive/10",
      borderColor: "border-destructive/30",
      textColor: "text-destructive",
      iconColor: "text-destructive"
    },
    {
      id: "sms-blocked" as FilterType,
      title: "SMS Bloqueados",
      subtitle: "Canal SMS no disponible",
      count: smsBlockedCount,
      icon: MessageSquareOff,
      bgColor: "bg-muted",
      borderColor: "border-border",
      textColor: "text-muted-foreground",
      iconColor: "text-muted-foreground"
    }
  ];

  return (
    <div className="mb-6">
      <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
        🔥 Acciones Pendientes
      </h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {cards.map((card) => {
          const isActive = activeFilter === card.id;
          const Icon = card.icon;
          
          return (
            <Card
              key={card.id}
              className={`cursor-pointer transition-all hover:scale-[1.02] ${
                isActive 
                  ? `${card.bgColor} ${card.borderColor} border-2 ring-2 ring-offset-2 ring-${card.id === 'no-action' ? 'destructive' : card.id === 'overdue' ? 'red-500' : card.id === 'today' ? 'orange-500' : 'green-500'}/20`
                  : 'hover:bg-muted/50'
              }`}
              onClick={() => onFilterChange(isActive ? "all" : card.id)}
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <p className={`text-3xl font-bold ${card.textColor}`}>
                      {card.count}
                    </p>
                    <p className="text-sm font-medium mt-1">{card.title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{card.subtitle}</p>
                  </div>
                  <Icon className={`h-5 w-5 ${card.iconColor}`} />
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};
