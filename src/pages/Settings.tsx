import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Plus, Trash2, Phone, CheckCircle2, AlertTriangle, Wrench, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { optionsRepository } from "@/lib/OptionsRepository";
import { dataRepository } from "@/lib/DataRepository";
import { formatUSPhone, PhoneAnalysisResult } from "@/lib/phoneFormatter";
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
import { ScrollArea } from "@/components/ui/scroll-area";

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

  // Phone formatting state
  const [phoneAnalysis, setPhoneAnalysis] = useState<PhoneAnalysisResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isFormatting, setIsFormatting] = useState(false);

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

  const handleAnalyzePhones = async () => {
    setIsAnalyzing(true);
    try {
      const leads = await dataRepository.getLeads();
      
      const result: PhoneAnalysisResult = {
        alreadyFormatted: 0,
        toFormat: 0,
        invalid: 0,
        changes: [],
        invalidLeads: []
      };

      for (const lead of leads) {
        const formatResult = formatUSPhone(lead.phone);
        
        if (formatResult.wasAlreadyFormatted) {
          result.alreadyFormatted++;
        } else if (formatResult.isValid && formatResult.formatted) {
          result.toFormat++;
          result.changes.push({
            leadId: lead.id,
            leadName: lead.name,
            currentPhone: lead.phone,
            newPhone: formatResult.formatted
          });
        } else {
          result.invalid++;
          result.invalidLeads.push({
            leadId: lead.id,
            leadName: lead.name,
            phone: lead.phone
          });
        }
      }

      setPhoneAnalysis(result);
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo analizar los teléfonos",
        variant: "destructive"
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleFormatPhones = async () => {
    if (!phoneAnalysis || phoneAnalysis.changes.length === 0) return;

    setIsFormatting(true);
    try {
      const updates = phoneAnalysis.changes.map(change => ({
        leadId: change.leadId,
        data: { phone: change.newPhone }
      }));

      const count = await dataRepository.updateMultipleLeads(updates);

      toast({
        title: "Teléfonos formateados",
        description: `Se actualizaron ${count} teléfonos correctamente`
      });

      // Reset analysis
      setPhoneAnalysis(null);
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudieron formatear los teléfonos",
        variant: "destructive"
      });
    } finally {
      setIsFormatting(false);
    }
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

        {/* Phone Formatting Card */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Phone className="h-5 w-5" />
              Formatear Teléfonos
            </CardTitle>
            <CardDescription>
              Normaliza todos los números de teléfono al formato US estándar: +1 (XXX) XXX-XXXX
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button 
              onClick={handleAnalyzePhones} 
              disabled={isAnalyzing}
              variant="outline"
              className="w-full"
            >
              {isAnalyzing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Analizando...
                </>
              ) : (
                <>
                  <Wrench className="h-4 w-4 mr-2" />
                  Analizar Teléfonos
                </>
              )}
            </Button>

            {phoneAnalysis && (
              <div className="space-y-4">
                {/* Statistics */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-3 text-center">
                    <CheckCircle2 className="h-5 w-5 text-green-600 mx-auto mb-1" />
                    <p className="text-2xl font-bold text-green-700">{phoneAnalysis.alreadyFormatted}</p>
                    <p className="text-xs text-muted-foreground">Ya formateados</p>
                  </div>
                  <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3 text-center">
                    <Wrench className="h-5 w-5 text-blue-600 mx-auto mb-1" />
                    <p className="text-2xl font-bold text-blue-700">{phoneAnalysis.toFormat}</p>
                    <p className="text-xs text-muted-foreground">A formatear</p>
                  </div>
                  <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-3 text-center">
                    <AlertTriangle className="h-5 w-5 text-amber-600 mx-auto mb-1" />
                    <p className="text-2xl font-bold text-amber-700">{phoneAnalysis.invalid}</p>
                    <p className="text-xs text-muted-foreground">Inválidos</p>
                  </div>
                </div>

                {/* Changes Preview */}
                {phoneAnalysis.changes.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Vista previa de cambios:</p>
                    <ScrollArea className="h-48 rounded-lg border p-3">
                      <div className="space-y-2">
                        {phoneAnalysis.changes.map((change) => (
                          <div key={change.leadId} className="flex items-center gap-2 text-sm">
                            <span className="font-medium truncate max-w-[120px]">{change.leadName}:</span>
                            <span className="text-muted-foreground font-mono text-xs">{change.currentPhone}</span>
                            <span className="text-muted-foreground">→</span>
                            <span className="text-green-600 font-mono text-xs">{change.newPhone}</span>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  </div>
                )}

                {/* Invalid Phones */}
                {phoneAnalysis.invalidLeads.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-amber-700">Teléfonos con formato inválido (no se modificarán):</p>
                    <ScrollArea className="h-32 rounded-lg border border-amber-500/30 bg-amber-500/5 p-3">
                      <div className="space-y-1">
                        {phoneAnalysis.invalidLeads.map((lead) => (
                          <div key={lead.leadId} className="flex items-center gap-2 text-sm">
                            <span className="font-medium truncate max-w-[120px]">{lead.leadName}:</span>
                            <span className="text-amber-700 font-mono text-xs">{lead.phone}</span>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  </div>
                )}

                {/* Apply Button */}
                {phoneAnalysis.toFormat > 0 && (
                  <Button 
                    onClick={handleFormatPhones}
                    disabled={isFormatting}
                    className="w-full"
                  >
                    {isFormatting ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Formateando...
                      </>
                    ) : (
                      <>
                        Aplicar Formato a {phoneAnalysis.toFormat} Leads
                      </>
                    )}
                  </Button>
                )}

                {phoneAnalysis.toFormat === 0 && phoneAnalysis.invalid === 0 && (
                  <p className="text-center text-sm text-green-600 py-2">
                    ✓ Todos los teléfonos ya están formateados correctamente
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>

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
