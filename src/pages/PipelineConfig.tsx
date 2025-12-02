import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Target, Zap, CheckCircle2, Edit, Save, X, RotateCcw } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { pipelineConfigRepository, PipelineConfigStage } from "@/lib/PipelineConfigRepository";
import { useToast } from "@/hooks/use-toast";
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

const PipelineConfig = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [stages, setStages] = useState<PipelineConfigStage[]>([]);
  const [editingStageId, setEditingStageId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({
    nombre: "",
    objetivo: "",
    accion: "",
    avanzaCuando: ""
  });

  useEffect(() => {
    loadPipelineConfig();
  }, []);

  const loadPipelineConfig = () => {
    const config = pipelineConfigRepository.getPipelineConfig();
    setStages(config);
  };

  const handleEdit = (stage: PipelineConfigStage) => {
    setEditingStageId(stage.id);
    setEditForm({
      nombre: stage.nombre,
      objetivo: stage.objetivo,
      accion: stage.accion,
      avanzaCuando: stage.avanzaCuando
    });
  };

  const handleSave = () => {
    if (!editingStageId) return;

    try {
      pipelineConfigRepository.updateStage(editingStageId, editForm);
      loadPipelineConfig();
      setEditingStageId(null);
      toast({
        title: "Cambios guardados",
        description: "La configuración de la etapa se actualizó correctamente.",
      });
    } catch (error) {
      toast({
        title: "Error al guardar",
        description: "No se pudieron guardar los cambios. Intenta nuevamente.",
        variant: "destructive",
      });
    }
  };

  const handleCancel = () => {
    setEditingStageId(null);
    setEditForm({
      nombre: "",
      objetivo: "",
      accion: "",
      avanzaCuando: ""
    });
  };

  const handleReset = () => {
    pipelineConfigRepository.resetToDefault();
    loadPipelineConfig();
    setEditingStageId(null);
    toast({
      title: "Configuración restablecida",
      description: "Se restauraron los valores por defecto del pipeline.",
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-8 px-4 max-w-6xl">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate("/")}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-foreground">Configuración del Pipeline</h1>
              <p className="text-muted-foreground mt-1">
                Definiciones completas de cada etapa del pipeline de ventas
              </p>
            </div>
          </div>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" size="sm">
                <RotateCcw className="h-4 w-4 mr-2" />
                Restablecer
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>¿Restablecer configuración?</AlertDialogTitle>
                <AlertDialogDescription>
                  Esto restaurará todos los valores por defecto del pipeline. Los cambios que hayas
                  realizado se perderán. Esta acción no se puede deshacer.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction onClick={handleReset}>Restablecer</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>

        <div className="grid gap-6">
          {stages.map((stage, index) => {
            const isEditing = editingStageId === stage.id;

            return (
              <Card key={stage.id} className="overflow-hidden">
                <CardHeader className="bg-muted/50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary text-primary-foreground font-bold">
                        {stage.orden}
                      </div>
                      <div>
                        {isEditing ? (
                          <input
                            type="text"
                            value={editForm.nombre}
                            onChange={(e) => setEditForm({ ...editForm, nombre: e.target.value })}
                            className="text-xl font-semibold bg-background border rounded px-2 py-1"
                          />
                        ) : (
                          <CardTitle className="text-xl">{stage.nombre}</CardTitle>
                        )}
                      </div>
                    </div>
                    {!isEditing ? (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(stage)}
                      >
                        <Edit className="h-4 w-4 mr-2" />
                        Editar
                      </Button>
                    ) : (
                      <div className="flex gap-2">
                        <Button
                          variant="default"
                          size="sm"
                          onClick={handleSave}
                        >
                          <Save className="h-4 w-4 mr-2" />
                          Guardar
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={handleCancel}
                        >
                          <X className="h-4 w-4 mr-2" />
                          Cancelar
                        </Button>
                      </div>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="pt-6 space-y-4">
                  <div className="flex gap-3">
                    <div className="flex-shrink-0 mt-1">
                      <Target className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1">
                      <Label className="font-semibold text-sm mb-1 text-foreground">
                        Objetivo de la Etapa
                      </Label>
                      {isEditing ? (
                        <Textarea
                          value={editForm.objetivo}
                          onChange={(e) => setEditForm({ ...editForm, objetivo: e.target.value })}
                          className="mt-2"
                          rows={2}
                        />
                      ) : (
                        <p className="text-sm text-muted-foreground mt-1">{stage.objetivo}</p>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <div className="flex-shrink-0 mt-1">
                      <Zap className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1">
                      <Label className="font-semibold text-sm mb-1 text-foreground">
                        Acción Recomendada
                      </Label>
                      {isEditing ? (
                        <Textarea
                          value={editForm.accion}
                          onChange={(e) => setEditForm({ ...editForm, accion: e.target.value })}
                          className="mt-2"
                          rows={2}
                        />
                      ) : (
                        <p className="text-sm text-muted-foreground mt-1">{stage.accion}</p>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <div className="flex-shrink-0 mt-1">
                      <CheckCircle2 className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1">
                      <Label className="font-semibold text-sm mb-1 text-foreground">
                        Criterio de Avance
                      </Label>
                      {isEditing ? (
                        <Textarea
                          value={editForm.avanzaCuando}
                          onChange={(e) => setEditForm({ ...editForm, avanzaCuando: e.target.value })}
                          className="mt-2"
                          rows={2}
                        />
                      ) : (
                        <p className="text-sm text-muted-foreground mt-1">{stage.avanzaCuando}</p>
                      )}
                    </div>
                  </div>

                  {index < stages.length - 2 && (
                    <div className="pt-2 border-t">
                      <p className="text-xs text-muted-foreground">
                        Siguiente etapa:{" "}
                        <span className="font-medium text-foreground">
                          {stages[index + 1]?.nombre}
                        </span>
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="mt-8 flex justify-center">
          <Button onClick={() => navigate("/")} size="lg">
            Volver al Dashboard
          </Button>
        </div>
      </div>
    </div>
  );
};

export default PipelineConfig;
