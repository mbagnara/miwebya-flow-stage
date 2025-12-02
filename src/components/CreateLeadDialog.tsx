import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Pencil } from "lucide-react";
import { Lead } from "@/types/crm";
import { dataRepository } from "@/lib/DataRepository";
import { toast } from "@/hooks/use-toast";

interface CreateLeadDialogProps {
  onLeadCreated: () => void;
  lead?: Lead;
  trigger?: React.ReactNode;
}

export const CreateLeadDialog = ({ onLeadCreated, lead, trigger }: CreateLeadDialogProps) => {
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    city: "",
    businessType: ""
  });

  const isEditMode = !!lead;

  useEffect(() => {
    if (lead) {
      setFormData({
        name: lead.name,
        phone: lead.phone,
        city: lead.city || "",
        businessType: lead.businessType || ""
      });
    }
  }, [lead]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.phone) {
      toast({
        title: "Error",
        description: "Nombre y teléfono son obligatorios",
        variant: "destructive"
      });
      return;
    }

    if (isEditMode && lead) {
      // Modo edición: actualizar lead existente
      const updatedLead: Lead = {
        ...lead,
        name: formData.name,
        phone: formData.phone,
        city: formData.city,
        businessType: formData.businessType
      };

      await dataRepository.updateLead(updatedLead);
      
      toast({
        title: "Lead actualizado",
        description: `${updatedLead.name} fue actualizado exitosamente`
      });
    } else {
      // Modo creación: crear nuevo lead
      const newLead: Lead = {
        id: `lead-${Date.now()}`,
        name: formData.name,
        phone: formData.phone,
        city: formData.city,
        businessType: formData.businessType,
        pipelineState: "nuevo",
        createdAt: new Date().toISOString()
      };

      await dataRepository.saveLead(newLead);
      
      toast({
        title: "Lead creado",
        description: `${newLead.name} fue agregado exitosamente`
      });
    }

    setFormData({ name: "", phone: "", city: "", businessType: "" });
    setOpen(false);
    onLeadCreated();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            Crear Lead
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEditMode ? "Editar Lead" : "Crear Nuevo Lead"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nombre *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Nombre del lead"
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="phone">Teléfono *</Label>
            <Input
              id="phone"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              placeholder="+54 11 1234-5678"
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="city">Ciudad</Label>
            <Input
              id="city"
              value={formData.city}
              onChange={(e) => setFormData({ ...formData, city: e.target.value })}
              placeholder="Ej: Buenos Aires"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="businessType">Rubro</Label>
            <Input
              id="businessType"
              value={formData.businessType}
              onChange={(e) => setFormData({ ...formData, businessType: e.target.value })}
              placeholder="Ej: Restaurante, Tienda, etc"
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="secondary" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit">{isEditMode ? "Guardar cambios" : "Crear Lead"}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
