import { useState } from "react";
import { format, addDays } from "date-fns";
import { es } from "date-fns/locale";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface ScheduleNextContactModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (nextActionNote: string, nextContactDate: string) => void;
}

const MAX_NOTE_LENGTH = 140;

export function ScheduleNextContactModal({
  isOpen,
  onClose,
  onSave,
}: ScheduleNextContactModalProps) {
  const [nextActionNote, setNextActionNote] = useState("");
  const [nextContactDate, setNextContactDate] = useState<Date | undefined>(
    addDays(new Date(), 2)
  );
  const [noteError, setNoteError] = useState("");
  const [dateError, setDateError] = useState("");

  const resetForm = () => {
    setNextActionNote("");
    setNextContactDate(addDays(new Date(), 2));
    setNoteError("");
    setDateError("");
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleSave = () => {
    let hasError = false;

    // Validate note
    if (!nextActionNote.trim()) {
      setNoteError("La próxima acción es requerida");
      hasError = true;
    } else if (nextActionNote.length > MAX_NOTE_LENGTH) {
      setNoteError(`Máximo ${MAX_NOTE_LENGTH} caracteres`);
      hasError = true;
    } else {
      setNoteError("");
    }

    // Validate date
    if (!nextContactDate) {
      setDateError("La fecha es requerida");
      hasError = true;
    } else {
      setDateError("");
    }

    if (hasError) return;

    onSave(nextActionNote.trim(), nextContactDate!.toISOString());
    resetForm();
  };

  const handleNoteChange = (value: string) => {
    setNextActionNote(value);
    if (value.length > MAX_NOTE_LENGTH) {
      setNoteError(`Máximo ${MAX_NOTE_LENGTH} caracteres`);
    } else {
      setNoteError("");
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Programar próximo contacto</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Campo: Próxima acción */}
          <div className="space-y-2">
            <Label htmlFor="nextAction">Próxima acción</Label>
            <Input
              id="nextAction"
              value={nextActionNote}
              onChange={(e) => handleNoteChange(e.target.value)}
              placeholder="Ej: Enviar video de demo"
              maxLength={MAX_NOTE_LENGTH + 10} // Allow typing a bit over to show error
              className={cn(noteError && "border-destructive")}
            />
            <div className="flex justify-between text-sm">
              <span className={cn("text-destructive", !noteError && "invisible")}>
                {noteError || "placeholder"}
              </span>
              <span
                className={cn(
                  "text-muted-foreground",
                  nextActionNote.length > MAX_NOTE_LENGTH && "text-destructive"
                )}
              >
                {nextActionNote.length}/{MAX_NOTE_LENGTH}
              </span>
            </div>
          </div>

          {/* Campo: Fecha próximo contacto */}
          <div className="space-y-2">
            <Label>Fecha próximo contacto</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !nextContactDate && "text-muted-foreground",
                    dateError && "border-destructive"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {nextContactDate ? (
                    format(nextContactDate, "PPP", { locale: es })
                  ) : (
                    <span>Seleccionar fecha</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={nextContactDate}
                  onSelect={(date) => {
                    setNextContactDate(date);
                    setDateError("");
                  }}
                  initialFocus
                  className="pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
            {dateError && (
              <span className="text-sm text-destructive">{dateError}</span>
            )}
          </div>
        </div>

        {/* Botones */}
        <div className="flex flex-col-reverse sm:flex-row gap-2">
          <Button variant="outline" onClick={handleClose} className="flex-1">
            No programar
          </Button>
          <Button onClick={handleSave} className="flex-1">
            Guardar próximo contacto
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
