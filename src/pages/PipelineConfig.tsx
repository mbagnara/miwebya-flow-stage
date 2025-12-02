import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PIPELINE_STATES } from "@/lib/pipeline";
import { ArrowLeft, Target, Zap, CheckCircle2 } from "lucide-react";
import { useNavigate } from "react-router-dom";

const PipelineConfig = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-8 px-4 max-w-6xl">
        <div className="flex items-center gap-4 mb-8">
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

        <div className="grid gap-6">
          {PIPELINE_STATES.map((state, index) => (
            <Card key={state.id} className="overflow-hidden">
              <CardHeader className="bg-muted/50">
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary text-primary-foreground font-bold">
                    {index + 1}
                  </div>
                  <div>
                    <CardTitle className="text-xl">{state.name}</CardTitle>
                    {state.objective && (
                      <CardDescription className="mt-1">{state.objective}</CardDescription>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-6 space-y-4">
                {state.action && (
                  <div className="flex gap-3">
                    <div className="flex-shrink-0 mt-1">
                      <Zap className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-sm mb-1 text-foreground">Acción Recomendada</h4>
                      <p className="text-sm text-muted-foreground">{state.action}</p>
                    </div>
                  </div>
                )}

                <div className="flex gap-3">
                  <div className="flex-shrink-0 mt-1">
                    <Target className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-sm mb-1 text-foreground">Mensaje Base</h4>
                    <p className="text-sm text-muted-foreground whitespace-pre-line">
                      {state.recommendedMessage}
                    </p>
                  </div>
                </div>

                {state.advanceCriteria && (
                  <div className="flex gap-3">
                    <div className="flex-shrink-0 mt-1">
                      <CheckCircle2 className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-sm mb-1 text-foreground">
                        Criterio de Avance
                      </h4>
                      <p className="text-sm text-muted-foreground">{state.advanceCriteria}</p>
                    </div>
                  </div>
                )}

                {state.nextStateId && (
                  <div className="pt-2 border-t">
                    <p className="text-xs text-muted-foreground">
                      Siguiente etapa:{" "}
                      <span className="font-medium text-foreground">
                        {PIPELINE_STATES.find(s => s.id === state.nextStateId)?.name}
                      </span>
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
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
