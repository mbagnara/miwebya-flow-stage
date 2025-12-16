import { Lead } from "@/types/crm";
import { startOfDay, isSameDay, addDays, format } from "date-fns";
import { es } from "date-fns/locale";

export type UrgencyType = "overdue" | "today" | "upcoming" | "no-action";

/**
 * Calcula la urgencia de un lead basado en su nextContactDate
 * Nota: Leads con SMS bloqueado NO cuentan como "no-action"
 */
export const getLeadUrgency = (lead: Lead): UrgencyType => {
  // Si no tiene nextContactDate Y tiene SMS activo → no-action
  // Si no tiene nextContactDate Y tiene SMS bloqueado → no cuenta (return "upcoming" como fallback neutro)
  if (!lead.nextContactDate) {
    // Leads bloqueados no cuentan como "sin acción" para evitar alertas
    if (lead.smsContactStatus === "bloqueado") return "upcoming";
    return "no-action";
  }
  
  const contactDate = new Date(lead.nextContactDate);
  const today = startOfDay(new Date());
  const contactDay = startOfDay(contactDate);
  
  if (contactDay < today) return "overdue";
  if (isSameDay(contactDay, today)) return "today";
  return "upcoming";
};

/**
 * Retorna el ícono/color de urgencia
 */
export const getUrgencyConfig = (urgency: UrgencyType) => {
  switch (urgency) {
    case "overdue":
      return {
        color: "text-red-600",
        bgColor: "bg-red-500/10",
        borderColor: "border-red-500/20",
        icon: "🔴",
        label: "Vencido"
      };
    case "today":
      return {
        color: "text-orange-600",
        bgColor: "bg-orange-500/10",
        borderColor: "border-orange-500/20",
        icon: "🟠",
        label: "Hoy"
      };
    case "upcoming":
      return {
        color: "text-green-600",
        bgColor: "bg-green-500/10",
        borderColor: "border-green-500/20",
        icon: "🟢",
        label: "Futuro"
      };
    case "no-action":
      return {
        color: "text-muted-foreground",
        bgColor: "bg-muted",
        borderColor: "border-border",
        icon: "⚫",
        label: "Sin acción"
      };
  }
};

/**
 * Formatea la fecha en formato corto (Hoy, Mañana, 12 Dic)
 */
export const formatShortDate = (dateString?: string): string => {
  if (!dateString) return "—";
  
  const date = new Date(dateString);
  const today = new Date();
  
  if (isSameDay(date, today)) return "Hoy";
  if (isSameDay(date, addDays(today, 1))) return "Mañana";
  
  return format(date, "d MMM", { locale: es });
};

/**
 * Cuenta leads por tipo de urgencia
 */
export const countLeadsByUrgency = (leads: Lead[]) => {
  return leads.reduce(
    (acc, lead) => {
      const urgency = getLeadUrgency(lead);
      acc[urgency]++;
      return acc;
    },
    { overdue: 0, today: 0, upcoming: 0, "no-action": 0 }
  );
};

/**
 * Cuenta leads con SMS bloqueado
 */
export const countSmsBlocked = (leads: Lead[]): number => {
  return leads.filter(lead => lead.smsContactStatus === "bloqueado").length;
};
