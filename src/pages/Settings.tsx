import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Plus, Trash2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { optionsRepository } from "@/lib/OptionsRepository";
import { toast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const Settings = () => {
  const navigate = useNavigate();
  const [cities, setCities] = useState<string[]>([]);
  const [businessTypes, setBusinessTypes] = useState<string[]>([]);
  const [newCity, setNewCity] = useState("");
  const [newBusinessType, setNewBusinessType] = useState("");
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; type: "city" | "businessType" | null; value: string }>({
    open: false,
    type: null,
    value: ""
  });

  const loadData = async () => {
    await optionsRepository.seedDefaultOptions();
    const loadedCities = await optionsRepository.getCities();
    const loadedBusinessTypes = await optionsRepository.getBusinessTypes();
    setCities(loadedCities);
    setBusinessTypes(loadedBusinessTypes);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleAddCity = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCity.trim()) return;

    await optionsRepository.saveCity(newCity);
    setNewCity("");
    await loadData();
    
    toast({
      title: "Ciudad agregada",
      description: `"${newCity}" fue agregada exitosamente`
    });
  };

  const handleAddBusinessType = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBusinessType.trim()) return;

    await optionsRepository.saveBusinessType(newBusinessType);
    setNewBusinessType("");
    await loadData();
    
    toast({
      title: "Rubro agregado",
      description: `"${newBusinessType}" fue agregado exitosamente`
    });
  };

  const handleDelete = async () => {
    if (!deleteDialog.type || !deleteDialog.value) return;

    if (deleteDialog.type === "city") {
      await optionsRepository.deleteCity(deleteDialog.value);
      toast({
        title: "Ciudad eliminada",
        description: `"${deleteDialog.value}" fue eliminada`
      });
    } else {
      await optionsRepository.deleteBusinessType(deleteDialog.value);
      toast({
        title: "Rubro eliminado",
        description: `"${deleteDialog.value}" fue eliminado`
      });
    }

    setDeleteDialog({ open: false, type: null, value: "" });
    await loadData();
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-8 px-4">
        <div className="flex items-center gap-4 mb-8">
          <Button variant="ghost" size="icon" onClick={() => navigate("/")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-foreground">Configuración</h1>
            <p className="text-muted-foreground mt-1">Gestiona ciudades y rubros disponibles</p>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Ciudades */}
          <Card>
            <CardHeader>
              <CardTitle>Ciudades</CardTitle>
              <CardDescription>
                Gestiona las ciudades disponibles para tus leads
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <form onSubmit={handleAddCity} className="flex gap-2">
                <div className="flex-1 space-y-2">
                  <Label htmlFor="new-city">Nueva Ciudad</Label>
                  <Input
                    id="new-city"
                    value={newCity}
                    onChange={(e) => setNewCity(e.target.value)}
                    placeholder="Ej: Buenos Aires"
                  />
                </div>
                <Button type="submit" className="mt-8" size="icon">
                  <Plus className="h-4 w-4" />
                </Button>
              </form>

              <div className="space-y-2">
                {cities.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No hay ciudades registradas
                  </p>
                ) : (
                  cities.map((city) => (
                    <div
                      key={city}
                      className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                    >
                      <span className="text-sm">{city}</span>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setDeleteDialog({ open: true, type: "city", value: city })}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          {/* Rubros */}
          <Card>
            <CardHeader>
              <CardTitle>Rubros</CardTitle>
              <CardDescription>
                Gestiona los rubros de negocio disponibles
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <form onSubmit={handleAddBusinessType} className="flex gap-2">
                <div className="flex-1 space-y-2">
                  <Label htmlFor="new-business-type">Nuevo Rubro</Label>
                  <Input
                    id="new-business-type"
                    value={newBusinessType}
                    onChange={(e) => setNewBusinessType(e.target.value)}
                    placeholder="Ej: Restaurante"
                  />
                </div>
                <Button type="submit" className="mt-8" size="icon">
                  <Plus className="h-4 w-4" />
                </Button>
              </form>

              <div className="space-y-2">
                {businessTypes.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No hay rubros registrados
                  </p>
                ) : (
                  businessTypes.map((businessType) => (
                    <div
                      key={businessType}
                      className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                    >
                      <span className="text-sm">{businessType}</span>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setDeleteDialog({ open: true, type: "businessType", value: businessType })}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialog.open} onOpenChange={(open) => setDeleteDialog({ ...deleteDialog, open })}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción eliminará "{deleteDialog.value}" de forma permanente.
              Los leads existentes no se verán afectados.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Eliminar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Settings;
