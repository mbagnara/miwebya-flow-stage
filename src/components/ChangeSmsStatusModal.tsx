import { useState } from "react";
import { SmsContactStatus } from "@/types/crm";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { MessageSquareOff, MessageSquare } from "lucide-react";

interface ChangeSmsStatusModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (newStatus: SmsContactStatus, note: string) => void;
  currentStatus: SmsContactStatus;
}

const DEFAULT_BLOCK_NOTE = `Se envió 1 SMS frío sin consentimiento.
No hubo respuesta.
Canal SMS bloqueado por compliance.`;

export const ChangeSmsStatusModal = ({
  isOpen,
  onClose,
  onSave,
  currentStatus,
}: ChangeSmsStatusModalProps) => {
  const [selectedStatus, setSelectedStatus] = useState<SmsContactStatus>(
    currentStatus === "activo" ? "bloqueado" : "activo"
  );
  const [note, setNote] = useState(
    currentStatus === "activo" ? DEFAULT_BLOCK_NOTE : "Canal SMS reactivado."
  );

  const handleSave = () => {
    onSave(selectedStatus, note);
    onClose();
  };

  const handleStatusChange = (value: SmsContactStatus) => {
    setSelectedStatus(value);
    if (value === "bloqueado") {
      setNote(DEFAULT_BLOCK_NOTE);
    } else {
      setNote("Canal SMS reactivado.");
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {selectedStatus === "bloqueado" ? (
              <MessageSquareOff className="h-5 w-5 text-destructive" />
            ) : (
              <MessageSquare className="h-5 w-5 text-green-600" />
            )}
            Cambiar Estado SMS
          </DialogTitle>
          <DialogDescription>
            Gestiona el estado del canal SMS para este lead por razones de compliance.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-3">
            <Label>Estado del canal SMS</Label>
            <RadioGroup
              value={selectedStatus}
              onValueChange={(value) => handleStatusChange(value as SmsContactStatus)}
              className="flex flex-col gap-3"
            >
              <div className="flex items-center space-x-3 p-3 rounded-lg border border-green-500/30 bg-green-500/5">
                <RadioGroupItem value="activo" id="activo" />
                <Label htmlFor="activo" className="flex items-center gap-2 cursor-pointer font-normal flex-1">
                  <MessageSquare className="h-4 w-4 text-green-600" />
                  <div>
                    <span className="font-medium text-green-600">SMS Activo</span>
                    <p className="text-xs text-muted-foreground">Se pueden enviar mensajes SMS</p>
                  </div>
                </Label>
              </div>
              <div className="flex items-center space-x-3 p-3 rounded-lg border border-destructive/30 bg-destructive/5">
                <RadioGroupItem value="bloqueado" id="bloqueado" />
                <Label htmlFor="bloqueado" className="flex items-center gap-2 cursor-pointer font-normal flex-1">
                  <MessageSquareOff className="h-4 w-4 text-destructive" />
                  <div>
                    <span className="font-medium text-destructive">SMS Bloqueado</span>
                    <p className="text-xs text-muted-foreground">Canal SMS no disponible por compliance</p>
                  </div>
                </Label>
              </div>
            </RadioGroup>
          </div>

          <div className="space-y-2">
            <Label htmlFor="note">Nota de auditoría</Label>
            <Textarea
              id="note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Describe la razón del cambio..."
              className="min-h-[100px] resize-none"
            />
            <p className="text-xs text-muted-foreground">
              Esta nota quedará registrada en el historial del lead.
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button
            onClick={handleSave}
            variant={selectedStatus === "bloqueado" ? "destructive" : "default"}
          >
            {selectedStatus === "bloqueado" ? "Bloquear SMS" : "Activar SMS"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
