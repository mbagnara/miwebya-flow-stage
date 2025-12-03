import { Check, Pause, Trophy, XCircle } from "lucide-react";
import { MAIN_PIPELINE_STATES, getPipelineState, isTerminalState, isAuxiliaryState } from "@/lib/pipeline";
import { cn } from "@/lib/utils";

interface PipelineProgressProps {
  currentStateId: string;
  variant?: "full" | "compact";
}

export const PipelineProgress = ({ currentStateId, variant = "full" }: PipelineProgressProps) => {
  const currentState = getPipelineState(currentStateId);
  const currentIndex = MAIN_PIPELINE_STATES.findIndex(state => state.id === currentStateId);
  
  const isTerminal = isTerminalState(currentStateId);
  const isAuxiliary = isAuxiliaryState(currentStateId);
  const isWin = currentStateId === "win";
  const isLost = currentStateId === "lost";
  const isFollowUp = currentStateId === "follow_up";
  
  // Calculate progress percentage
  const progressPercentage = isTerminal 
    ? 100 
    : isAuxiliary 
      ? 50 // Follow up shows 50% as it's a "pause" state
      : ((currentIndex + 1) / MAIN_PIPELINE_STATES.length) * 100;

  if (variant === "compact") {
    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Progreso del Pipeline</span>
          <span className="font-semibold">{Math.round(progressPercentage)}%</span>
        </div>
        <div className="h-2 bg-muted rounded-full overflow-hidden">
          <div 
            className={cn(
              "h-full transition-all duration-500 ease-out",
              isWin && "bg-green-500",
              isLost && "bg-destructive",
              isFollowUp && "bg-yellow-500",
              !isTerminal && !isAuxiliary && "bg-primary"
            )}
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
          <span className={cn(
            "font-semibold",
            isWin && "text-green-500",
            isLost && "text-destructive",
            isFollowUp && "text-yellow-500",
            !isTerminal && !isAuxiliary && "text-primary"
          )}>
            {Math.round(progressPercentage)}%
          </span>
        </div>
        <div className="h-3 bg-muted rounded-full overflow-hidden">
          <div 
            className={cn(
              "h-full transition-all duration-500 ease-out",
              isWin && "bg-gradient-to-r from-green-500 to-green-400",
              isLost && "bg-gradient-to-r from-destructive to-destructive/80",
              isFollowUp && "bg-gradient-to-r from-yellow-500 to-yellow-400",
              !isTerminal && !isAuxiliary && "bg-gradient-to-r from-primary to-primary/80"
            )}
            style={{ width: `${progressPercentage}%` }}
          />
        </div>
      </div>

      {/* Pipeline stages - Desktop: horizontal, Mobile: vertical */}
      <div className="space-y-4">
        {/* Desktop view - horizontal */}
        <div className="hidden md:flex items-start justify-between gap-2">
          {MAIN_PIPELINE_STATES.map((state, index) => {
            const isCompleted = !isAuxiliary && (isTerminal || index < currentIndex);
            const isCurrent = state.id === currentStateId;
            const isPending = !isTerminal && !isAuxiliary && index > currentIndex;

            return (
              <div key={state.id} className="flex-1 relative">
                {/* Connector line */}
                {index < MAIN_PIPELINE_STATES.length - 1 && (
                  <div 
                    className={cn(
                      "absolute top-5 left-[60%] w-[calc(100%-20px)] h-0.5 transition-colors",
                      isCompleted || (isTerminal && index < MAIN_PIPELINE_STATES.length - 1) ? "bg-primary" : "bg-muted"
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
          {MAIN_PIPELINE_STATES.map((state, index) => {
            const isCompleted = !isAuxiliary && (isTerminal || index < currentIndex);
            const isCurrent = state.id === currentStateId;
            const isPending = !isTerminal && !isAuxiliary && index > currentIndex;

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
                  {index < MAIN_PIPELINE_STATES.length - 1 && (
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

        {/* Special states indicator */}
        {isFollowUp && (
          <div className="mt-4 p-3 rounded-lg border-2 border-yellow-500 bg-yellow-500/10 animate-fade-in">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-yellow-500 text-white flex items-center justify-center">
                <Pause className="h-5 w-5" />
              </div>
              <div>
                <p className="font-semibold text-foreground">Follow Up</p>
                <p className="text-xs text-muted-foreground">En seguimiento - esperando respuesta</p>
              </div>
            </div>
          </div>
        )}

        {isWin && (
          <div className="mt-4 p-3 rounded-lg border-2 border-green-500 bg-green-500/10 animate-fade-in">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-green-500 text-white flex items-center justify-center">
                <Trophy className="h-5 w-5" />
              </div>
              <div>
                <p className="font-semibold text-foreground">¡Cliente Ganado!</p>
                <p className="text-xs text-muted-foreground">Pipeline completado exitosamente</p>
              </div>
            </div>
          </div>
        )}

        {isLost && (
          <div className="mt-4 p-3 rounded-lg border-2 border-destructive bg-destructive/10 animate-fade-in">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center">
                <XCircle className="h-5 w-5" />
              </div>
              <div>
                <p className="font-semibold text-foreground">Perdido / No Ahora</p>
                <p className="text-xs text-muted-foreground">Lead archivado</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
