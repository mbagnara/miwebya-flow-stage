import { Check } from "lucide-react";
import { PIPELINE_STATES, getPipelineState } from "@/lib/pipeline";
import { cn } from "@/lib/utils";

interface PipelineProgressProps {
  currentStateId: string;
  variant?: "full" | "compact";
}

export const PipelineProgress = ({ currentStateId, variant = "full" }: PipelineProgressProps) => {
  // Filter out final states for the main pipeline flow
  const mainPipelineStates = PIPELINE_STATES.filter(
    state => state.id !== "cierreGanado" && state.id !== "cierrePerdido"
  );
  
  const currentState = getPipelineState(currentStateId);
  const currentIndex = mainPipelineStates.findIndex(state => state.id === currentStateId);
  
  // Handle final states
  const isFinalState = currentStateId === "cierreGanado" || currentStateId === "cierrePerdido";
  const progressPercentage = isFinalState 
    ? 100 
    : ((currentIndex + 1) / mainPipelineStates.length) * 100;

  if (variant === "compact") {
    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Progreso del Pipeline</span>
          <span className="font-semibold">{Math.round(progressPercentage)}%</span>
        </div>
        <div className="h-2 bg-muted rounded-full overflow-hidden">
          <div 
            className="h-full bg-primary transition-all duration-500 ease-out"
            style={{ width: `${progressPercentage}%` }}
          />
        </div>
        <p className="text-xs text-muted-foreground text-center">
          {currentState?.name || currentStateId}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Progress bar */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Progreso</span>
          <span className="font-semibold text-primary">{Math.round(progressPercentage)}%</span>
        </div>
        <div className="h-3 bg-muted rounded-full overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-primary to-primary/80 transition-all duration-500 ease-out"
            style={{ width: `${progressPercentage}%` }}
          />
        </div>
      </div>

      {/* Pipeline stages - Desktop: horizontal, Mobile: vertical */}
      <div className="space-y-4">
        {/* Desktop view - horizontal */}
        <div className="hidden md:flex items-start justify-between gap-2">
          {mainPipelineStates.map((state, index) => {
            const isCompleted = index < currentIndex;
            const isCurrent = state.id === currentStateId;
            const isPending = index > currentIndex;

            return (
              <div key={state.id} className="flex-1 relative">
                {/* Connector line */}
                {index < mainPipelineStates.length - 1 && (
                  <div 
                    className={cn(
                      "absolute top-5 left-[60%] w-[calc(100%-20px)] h-0.5 transition-colors",
                      isCompleted ? "bg-primary" : "bg-muted"
                    )}
                  />
                )}
                
                {/* Stage indicator */}
                <div className="flex flex-col items-center gap-2 relative z-10">
                  <div
                    className={cn(
                      "w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-300",
                      isCurrent && "border-primary bg-primary text-primary-foreground scale-110 shadow-lg",
                      isCompleted && "border-primary bg-primary text-primary-foreground",
                      isPending && "border-muted bg-background text-muted-foreground"
                    )}
                  >
                    {isCompleted ? (
                      <Check className="h-5 w-5" />
                    ) : (
                      <span className="text-sm font-semibold">{index + 1}</span>
                    )}
                  </div>
                  <div className="text-center">
                    <p
                      className={cn(
                        "text-xs font-medium transition-colors",
                        isCurrent && "text-foreground font-semibold",
                        isCompleted && "text-muted-foreground",
                        isPending && "text-muted-foreground"
                      )}
                    >
                      {state.name}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Mobile view - vertical */}
        <div className="md:hidden space-y-3">
          {mainPipelineStates.map((state, index) => {
            const isCompleted = index < currentIndex;
            const isCurrent = state.id === currentStateId;
            const isPending = index > currentIndex;

            return (
              <div key={state.id} className="flex items-start gap-3">
                {/* Stage indicator */}
                <div className="relative">
                  <div
                    className={cn(
                      "w-9 h-9 rounded-full flex items-center justify-center border-2 transition-all duration-300 flex-shrink-0",
                      isCurrent && "border-primary bg-primary text-primary-foreground scale-110 shadow-lg",
                      isCompleted && "border-primary bg-primary text-primary-foreground",
                      isPending && "border-muted bg-background text-muted-foreground"
                    )}
                  >
                    {isCompleted ? (
                      <Check className="h-4 w-4" />
                    ) : (
                      <span className="text-sm font-semibold">{index + 1}</span>
                    )}
                  </div>
                  
                  {/* Connector line */}
                  {index < mainPipelineStates.length - 1 && (
                    <div 
                      className={cn(
                        "absolute top-9 left-1/2 -translate-x-1/2 w-0.5 h-6 transition-colors",
                        isCompleted ? "bg-primary" : "bg-muted"
                      )}
                    />
                  )}
                </div>

                {/* Stage info */}
                <div className="flex-1 pt-1">
                  <p
                    className={cn(
                      "text-sm font-medium transition-colors",
                      isCurrent && "text-foreground font-semibold text-base",
                      isCompleted && "text-muted-foreground",
                      isPending && "text-muted-foreground"
                    )}
                  >
                    {state.name}
                  </p>
                  {isCurrent && (
                    <p className="text-xs text-primary mt-1">Estado actual</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Final states indicator */}
        {isFinalState && (
          <div className="mt-4 p-3 rounded-lg border-2 border-primary bg-primary/10 animate-fade-in">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center">
                <Check className="h-5 w-5" />
              </div>
              <div>
                <p className="font-semibold text-foreground">
                  {currentState?.name}
                </p>
                <p className="text-xs text-muted-foreground">Pipeline completado</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
