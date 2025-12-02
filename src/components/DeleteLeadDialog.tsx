import { useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { Lead } from "@/types/crm";
import { dataRepository } from "@/lib/DataRepository";
import { toast } from "@/hooks/use-toast";

interface DeleteLeadDialogProps {
  lead: Lead;
  onLeadDeleted: () => void;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export const DeleteLeadDialog = ({ 
  lead, 
  onLeadDeleted,
  open: externalOpen,
  onOpenChange: externalOnOpenChange 
}: DeleteLeadDialogProps) => {
  const [internalOpen, setInternalOpen] = useState(false);
  const [confirmText, setConfirmText] = useState("");

  // Use external control if provided, otherwise use internal state
  const open = externalOpen !== undefined ? externalOpen : internalOpen;
  const baseSetOpen = externalOnOpenChange || setInternalOpen;

  const handleDelete = async () => {
    if (confirmText !== "Eliminar") {
      toast({
        title: "Error",
        description: "Debes escribir 'Eliminar' para confirmar",
        variant: "destructive"
      });
      return;
    }

    await dataRepository.deleteLead(lead.id);

    toast({
      title: "Lead eliminado",
      description: `${lead.name} y todas sus interacciones fueron eliminados exitosamente`
    });

    setConfirmText("");
    baseSetOpen(false);
    onLeadDeleted();
  };

  const handleOpenChange = (newOpen: boolean) => {
    baseSetOpen(newOpen);
    if (!newOpen) {
      setConfirmText("");
    }
  };

  const isConfirmValid = confirmText === "Eliminar";

  return (
    <AlertDialog open={open} onOpenChange={handleOpenChange}>
      <AlertDialogTrigger asChild>
        <Button variant="destructive" size="sm">
          <Trash2 className="h-4 w-4" />
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>¿Estás completamente seguro?</AlertDialogTitle>
          <AlertDialogDescription className="space-y-3">
            <p>
              Esta acción <strong>no se puede deshacer</strong>. Esto eliminará permanentemente
              el lead <strong>{lead.name}</strong> y todas sus interacciones asociadas.
            </p>
            <div className="space-y-2 pt-2">
              <Label htmlFor="confirm-text" className="text-foreground">
                Para confirmar, escribe <strong>Eliminar</strong> en el campo de abajo:
              </Label>
              <Input
                id="confirm-text"
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                placeholder="Escribir: Eliminar"
                className="font-mono"
              />
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={!isConfirmValid}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            Eliminar permanentemente
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
