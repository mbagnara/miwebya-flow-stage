import { Interaction } from "@/types/crm";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { MessageSquare, UserCircle, Pencil, Check, X, CalendarIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useState } from "react";
import { dataRepository } from "@/lib/DataRepository";
import { cn } from "@/lib/utils";

interface LeadTimelineProps {
  interactions: Interaction[];
  onInteractionUpdated?: () => void;
}

export const LeadTimeline = ({ interactions, onInteractionUpdated }: LeadTimelineProps) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editMessage, setEditMessage] = useState("");
  const [editDate, setEditDate] = useState<Date | undefined>(undefined);
  const [editTime, setEditTime] = useState("");

  const startEditing = (interaction: Interaction) => {
    const date = new Date(interaction.createdAt);
    setEditingId(interaction.id);
    setEditMessage(interaction.message);
    setEditDate(date);
    setEditTime(format(date, "HH:mm"));
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditMessage("");
    setEditDate(undefined);
    setEditTime("");
  };

  const saveEditing = async (interaction: Interaction) => {
    if (!editDate || !editTime) return;

    const [hours, minutes] = editTime.split(":").map(Number);
    const newDate = new Date(editDate);
    newDate.setHours(hours, minutes, 0, 0);

    const updatedInteraction: Interaction = {
      ...interaction,
      message: editMessage,
      createdAt: newDate.toISOString(),
    };

    await dataRepository.updateInteraction(updatedInteraction);
    cancelEditing();
    onInteractionUpdated?.();
  };

  if (interactions.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No hay interacciones registradas aún
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {interactions.map((interaction, index) => {
        const direction = interaction.direction || "outgoing";
        const isIncoming = direction === "incoming";
        const isEditing = editingId === interaction.id;

        return (
          <div key={interaction.id} className="flex gap-4">
            <div className="flex flex-col items-center">
              <div className={`rounded-full p-2 ${
                isIncoming 
                  ? "bg-secondary" 
                  : "bg-primary"
              }`}>
                {isIncoming ? (
                  <UserCircle className="h-4 w-4 text-secondary-foreground" />
                ) : (
                  <MessageSquare className="h-4 w-4 text-primary-foreground" />
                )}
              </div>
              {index < interactions.length - 1 && (
                <div className="w-px h-full bg-border mt-2" />
              )}
            </div>
            <div className="flex-1 pb-8">
              {isEditing ? (
                <div className={`border rounded-lg p-4 space-y-4 ${
                  isIncoming 
                    ? "bg-secondary/10 border-secondary" 
                    : "bg-card"
                }`}>
                  <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                    <Pencil className="h-4 w-4" />
                    Editando interacción
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Mensaje</label>
                    <Textarea
                      value={editMessage}
                      onChange={(e) => setEditMessage(e.target.value)}
                      className="min-h-[100px]"
                      placeholder="Escribe el mensaje..."
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Fecha</label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full justify-start text-left font-normal",
                              !editDate && "text-muted-foreground"
                            )}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {editDate ? format(editDate, "dd/MM/yyyy", { locale: es }) : "Seleccionar"}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={editDate}
                            onSelect={setEditDate}
                            initialFocus
                            className="p-3 pointer-events-auto"
                          />
                        </PopoverContent>
                      </Popover>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium">Hora</label>
                      <Input
                        type="time"
                        value={editTime}
                        onChange={(e) => setEditTime(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="flex justify-end gap-2">
                    <Button variant="outline" size="sm" onClick={cancelEditing}>
                      <X className="h-4 w-4 mr-1" />
                      Cancelar
                    </Button>
                    <Button size="sm" onClick={() => saveEditing(interaction)}>
                      <Check className="h-4 w-4 mr-1" />
                      Guardar
                    </Button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-2 mb-1">
                    <div className="text-sm text-muted-foreground">
                      {format(new Date(interaction.createdAt), "dd MMM yyyy 'a las' HH:mm", { locale: es })}
                    </div>
                    {isIncoming && (
                      <Badge variant="secondary" className="text-xs">
                        Lead
                      </Badge>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0 ml-auto"
                      onClick={() => startEditing(interaction)}
                    >
                      <Pencil className="h-3 w-3" />
                    </Button>
                  </div>
                  <div className={`border rounded-lg p-4 ${
                    isIncoming 
                      ? "bg-secondary/10 border-secondary" 
                      : "bg-card"
                  }`}>
                    <p className="text-sm text-card-foreground whitespace-pre-wrap">{interaction.message}</p>
                  </div>
                </>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};
