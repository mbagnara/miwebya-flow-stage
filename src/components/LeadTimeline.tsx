import { Interaction } from "@/types/crm";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { MessageSquare } from "lucide-react";

interface LeadTimelineProps {
  interactions: Interaction[];
}

export const LeadTimeline = ({ interactions }: LeadTimelineProps) => {
  if (interactions.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No hay interacciones registradas aún
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {interactions.map((interaction, index) => (
        <div key={interaction.id} className="flex gap-4">
          <div className="flex flex-col items-center">
            <div className="rounded-full bg-primary p-2">
              <MessageSquare className="h-4 w-4 text-primary-foreground" />
            </div>
            {index < interactions.length - 1 && (
              <div className="w-px h-full bg-border mt-2" />
            )}
          </div>
          <div className="flex-1 pb-8">
            <div className="text-sm text-muted-foreground mb-1">
              {format(new Date(interaction.createdAt), "dd MMM yyyy 'a las' HH:mm", { locale: es })}
            </div>
            <div className="bg-card border rounded-lg p-4">
              <p className="text-sm text-card-foreground">{interaction.message}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};
