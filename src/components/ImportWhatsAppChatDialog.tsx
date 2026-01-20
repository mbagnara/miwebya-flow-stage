import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MessageSquare, Phone, Calendar, User, ArrowDownLeft, ArrowUpRight, AlertCircle, CheckCircle2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { dataRepository } from "@/lib/DataRepository";
import { parseWhatsAppChat, normalizePhone, ParsedChat } from "@/lib/whatsappParser";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { Lead } from "@/types/crm";

interface ImportWhatsAppChatDialogProps {
  onImportComplete: () => void;
  trigger?: React.ReactNode;
}

export function ImportWhatsAppChatDialog({ onImportComplete, trigger }: ImportWhatsAppChatDialogProps) {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [chatText, setChatText] = useState("");
  const [leadName, setLeadName] = useState("");
  const [businessType, setBusinessType] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [existingLead, setExistingLead] = useState<Lead | null>(null);

  const parsedChat = useMemo(() => {
    if (!chatText.trim()) return null;
    return parseWhatsAppChat(chatText);
  }, [chatText]);

  // Check if lead already exists when we have a parsed phone
  useMemo(() => {
    const checkExistingLead = async () => {
      if (!parsedChat?.leadPhone) {
        setExistingLead(null);
        return;
      }
      
      const normalizedParsedPhone = normalizePhone(parsedChat.leadPhone);
      const allLeads = await dataRepository.getLeads();
      const existing = allLeads.find(lead => 
        normalizePhone(lead.phone) === normalizedParsedPhone
      );
      setExistingLead(existing || null);
    };
    checkExistingLead();
  }, [parsedChat?.leadPhone]);

  const handleImport = async () => {
    if (!parsedChat) return;

    setIsSubmitting(true);
    try {
      let leadId: string;
      
      if (existingLead) {
        // Use existing lead
        leadId = existingLead.id;
        toast({
          title: "Lead existente encontrado",
          description: `Se agregarán ${parsedChat.messages.length} interacciones a "${existingLead.name}"`
        });
      } else {
        // Create new lead
        const newLead: Lead = {
          id: crypto.randomUUID(),
          name: leadName.trim() || parsedChat.leadPhone,
          phone: parsedChat.leadPhone,
          businessType: businessType.trim() || undefined,
          pipelineState: "nuevo",
          createdAt: parsedChat.dateRange.from.toISOString(),
          temperature: "cold",
          temperatureManual: false,
          smsContactStatus: "activo"
        };
        
        await dataRepository.saveLead(newLead);
        leadId = newLead.id;
      }

      // Create all interactions
      for (const msg of parsedChat.messages) {
        await dataRepository.addInteraction({
          id: crypto.randomUUID(),
          leadId,
          message: msg.message,
          createdAt: msg.timestamp.toISOString(),
          direction: msg.isFromLead ? "incoming" : "outgoing"
        });
      }

      toast({
        title: "Importación exitosa",
        description: `Se ${existingLead ? 'agregaron' : 'creó el lead con'} ${parsedChat.messages.length} interacciones`
      });

      // Reset and close
      setChatText("");
      setLeadName("");
      setBusinessType("");
      setOpen(false);
      onImportComplete();
      
      // Navigate to the lead page
      navigate(`/lead/${leadId}`);
    } catch (error) {
      console.error("Error importing WhatsApp chat:", error);
      toast({
        title: "Error al importar",
        description: "No se pudo completar la importación",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    if (!newOpen) {
      setChatText("");
      setLeadName("");
      setBusinessType("");
      setExistingLead(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline">
            <MessageSquare className="h-4 w-4 mr-2" />
            Importar Chat WhatsApp
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Importar Chat de WhatsApp
          </DialogTitle>
          <DialogDescription>
            Pega el texto copiado de WhatsApp para crear un lead con todo su historial de mensajes.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-hidden flex flex-col gap-4">
          {/* Text input area */}
          <div className="space-y-2">
            <Label htmlFor="chat-text">Chat de WhatsApp</Label>
            <Textarea
              id="chat-text"
              placeholder={`Pega aquí el chat copiado de WhatsApp...

Ejemplo:
[2:55 PM, 1/18/2026] +1 (714) 438-9132: Hola, quiero información
[2:56 PM, 1/18/2026] Miwebya: ¡Hola! Con gusto te ayudo...`}
              value={chatText}
              onChange={(e) => setChatText(e.target.value)}
              className="min-h-[150px] font-mono text-sm"
            />
          </div>

          {/* Preview section */}
          {parsedChat && (
            <div className="border rounded-lg p-4 bg-muted/30 space-y-4">
              <h4 className="font-medium flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                Chat parseado correctamente
              </h4>

              {/* Lead info */}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">Teléfono:</span>
                  <span>{parsedChat.leadPhone}</span>
                </div>
                <div className="flex items-center gap-2">
                  <MessageSquare className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">Mensajes:</span>
                  <span>{parsedChat.messages.length} ({parsedChat.leadMessageCount} del lead, {parsedChat.myMessageCount} míos)</span>
                </div>
                <div className="flex items-center gap-2 col-span-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">Período:</span>
                  <span>
                    {format(parsedChat.dateRange.from, "d MMM yyyy HH:mm", { locale: es })} → {format(parsedChat.dateRange.to, "d MMM yyyy HH:mm", { locale: es })}
                  </span>
                </div>
              </div>

              {/* Existing lead warning */}
              {existingLead && (
                <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-3 flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 text-amber-600 mt-0.5" />
                  <div className="text-sm">
                    <p className="font-medium text-amber-700">Lead existente encontrado</p>
                    <p className="text-muted-foreground">
                      "{existingLead.name}" ya tiene este teléfono. Las interacciones se agregarán a este lead.
                    </p>
                  </div>
                </div>
              )}

              {/* Optional lead details (only show if no existing lead) */}
              {!existingLead && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="lead-name">Nombre del lead (opcional)</Label>
                    <Input
                      id="lead-name"
                      placeholder="Nombre del contacto"
                      value={leadName}
                      onChange={(e) => setLeadName(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="business-type">Rubro (opcional)</Label>
                    <Input
                      id="business-type"
                      placeholder="Ej: Restaurante, Tienda..."
                      value={businessType}
                      onChange={(e) => setBusinessType(e.target.value)}
                    />
                  </div>
                </div>
              )}

              {/* Messages preview */}
              <div className="space-y-2">
                <Label>Vista previa de mensajes</Label>
                <ScrollArea className="h-[200px] border rounded-md p-2 bg-background">
                  <div className="space-y-2">
                    {parsedChat.messages.map((msg, index) => (
                      <div
                        key={index}
                        className={cn(
                          "flex items-start gap-2 text-sm p-2 rounded-lg",
                          msg.isFromLead ? "bg-muted/50" : "bg-primary/10"
                        )}
                      >
                        {msg.isFromLead ? (
                          <ArrowDownLeft className="h-3 w-3 text-green-600 mt-1 flex-shrink-0" />
                        ) : (
                          <ArrowUpRight className="h-3 w-3 text-blue-600 mt-1 flex-shrink-0" />
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium text-xs">
                              {msg.isFromLead ? "Lead" : "Yo"}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {format(msg.timestamp, "d/MM HH:mm", { locale: es })}
                            </span>
                          </div>
                          <p className="text-sm whitespace-pre-wrap break-words">{msg.message}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </div>
            </div>
          )}

          {/* Error state */}
          {chatText.trim() && !parsedChat && (
            <div className="border border-destructive/50 rounded-lg p-4 bg-destructive/10 flex items-start gap-2">
              <AlertCircle className="h-4 w-4 text-destructive mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-destructive">No se pudo parsear el chat</p>
                <p className="text-muted-foreground">
                  Asegúrate de copiar el formato correcto de WhatsApp: [Hora, Fecha] Remitente: Mensaje
                </p>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => handleOpenChange(false)}>
            Cancelar
          </Button>
          <Button
            onClick={handleImport}
            disabled={!parsedChat || isSubmitting}
          >
            {isSubmitting ? "Importando..." : existingLead ? "Agregar Interacciones" : "Crear Lead"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
