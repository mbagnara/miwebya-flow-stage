import { useState, useRef, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { OptionCombobox } from "@/components/OptionCombobox";
import { dataRepository } from "@/lib/DataRepository";
import { optionsRepository } from "@/lib/OptionsRepository";
import { Lead, Interaction } from "@/types/crm";
import { toast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { 
  MessageSquareText, 
  CalendarIcon, 
  Plus, 
  Trash2, 
  Image as ImageIcon,
  ClipboardPaste,
  X
} from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

interface MessageEntry {
  id: string;
  content: string;
  direction: "incoming" | "outgoing";
  date: Date | undefined;
  time: string;
}

interface ImportWhatsAppDialogProps {
  onLeadCreated: () => void;
}

const MAX_NOTE_LENGTH = 140;

export const ImportWhatsAppDialog = ({ onLeadCreated }: ImportWhatsAppDialogProps) => {
  const [open, setOpen] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Lead data
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [city, setCity] = useState("");
  const [businessType, setBusinessType] = useState("");

  // Next contact (optional)
  const [nextActionNote, setNextActionNote] = useState("");
  const [nextContactDate, setNextContactDate] = useState<Date | undefined>(undefined);

  // Messages
  const [messages, setMessages] = useState<MessageEntry[]>([]);

  // Options from repository
  const [cities, setCities] = useState<string[]>([]);
  const [businessTypes, setBusinessTypes] = useState<string[]>([]);

  // Load options
  useEffect(() => {
    const loadOptions = async () => {
      await optionsRepository.seedDefaultOptions();
      const [loadedCities, loadedBusinessTypes] = await Promise.all([
        optionsRepository.getCities(),
        optionsRepository.getBusinessTypes()
      ]);
      setCities(loadedCities);
      setBusinessTypes(loadedBusinessTypes);
    };
    if (open) loadOptions();
  }, [open]);

  // Reset form on close
  const resetForm = () => {
    setImagePreview(null);
    setName("");
    setPhone("");
    setCity("");
    setBusinessType("");
    setNextActionNote("");
    setNextContactDate(undefined);
    setMessages([]);
  };

  const handleClose = () => {
    resetForm();
    setOpen(false);
  };

  // Image handling
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (event) => setImagePreview(event.target?.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    const items = e.clipboardData.items;
    for (const item of Array.from(items)) {
      if (item.type.startsWith('image/')) {
        e.preventDefault();
        const file = item.getAsFile();
        if (file) {
          const reader = new FileReader();
          reader.onload = (event) => setImagePreview(event.target?.result as string);
          reader.readAsDataURL(file);
        }
        break;
      }
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (event) => setImagePreview(event.target?.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  // Message handling
  const addMessage = () => {
    const newMessage: MessageEntry = {
      id: `msg-${Date.now()}`,
      content: "",
      direction: "outgoing",
      date: undefined,
      time: ""
    };
    setMessages([...messages, newMessage]);
  };

  const updateMessage = (id: string, updates: Partial<MessageEntry>) => {
    setMessages(messages.map(msg => 
      msg.id === id ? { ...msg, ...updates } : msg
    ));
  };

  const removeMessage = (id: string) => {
    setMessages(messages.filter(msg => msg.id !== id));
  };

  // Save logic
  const handleSave = async () => {
    // Validate required fields
    if (!name.trim()) {
      toast({ title: "Error", description: "El nombre es requerido", variant: "destructive" });
      return;
    }
    if (!phone.trim()) {
      toast({ title: "Error", description: "El teléfono es requerido", variant: "destructive" });
      return;
    }

    // Validate next contact: if one is filled, both are required
    if ((nextActionNote && !nextContactDate) || (!nextActionNote && nextContactDate)) {
      toast({ 
        title: "Error", 
        description: "Si programas próximo contacto, debes completar ambos campos", 
        variant: "destructive" 
      });
      return;
    }

    // Validate messages have required fields if they have content
    const validMessages = messages.filter(m => m.content.trim());
    for (const msg of validMessages) {
      if (!msg.date || !msg.time) {
        toast({ 
          title: "Error", 
          description: "Cada mensaje debe tener fecha y hora", 
          variant: "destructive" 
        });
        return;
      }
    }

    try {
      // Save city and businessType if new
      if (city.trim()) await optionsRepository.saveCity(city.trim());
      if (businessType.trim()) await optionsRepository.saveBusinessType(businessType.trim());

      // Create lead
      const newLead: Lead = {
        id: `lead-${Date.now()}`,
        name: name.trim(),
        phone: phone.trim(),
        city: city.trim() || undefined,
        businessType: businessType.trim() || undefined,
        pipelineState: "nuevo",
        createdAt: new Date().toISOString(),
        temperature: "cold",
        temperatureManual: false,
        smsContactStatus: "activo",
        nextActionNote: nextActionNote.trim() || undefined,
        nextContactDate: nextContactDate?.toISOString() || undefined
      };

      await dataRepository.saveLead(newLead);

      // Create interactions for messages
      for (let i = 0; i < validMessages.length; i++) {
        const msg = validMessages[i];
        const [hours, minutes] = msg.time.split(":").map(Number);
        const timestamp = new Date(msg.date!);
        timestamp.setHours(hours, minutes, 0, 0);

        const interaction: Interaction = {
          id: `interaction-${Date.now()}-${i}`,
          leadId: newLead.id,
          message: msg.content.trim(),
          createdAt: timestamp.toISOString(),
          direction: msg.direction
        };
        await dataRepository.addInteraction(interaction);
      }

      // Add audit entry if next contact was scheduled
      if (nextActionNote && nextContactDate) {
        const auditInteraction: Interaction = {
          id: `interaction-audit-${Date.now()}`,
          leadId: newLead.id,
          message: `Se programó próxima acción para ${format(nextContactDate, "dd/MM/yyyy", { locale: es })}: "${nextActionNote.trim()}"`,
          createdAt: new Date().toISOString(),
          direction: undefined
        };
        await dataRepository.addInteraction(auditInteraction);
      }

      toast({
        title: "Lead importado",
        description: `${newLead.name} fue creado con ${validMessages.length} mensaje(s)`
      });

      handleClose();
      onLeadCreated();
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo importar el lead",
        variant: "destructive"
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => isOpen ? setOpen(true) : handleClose()}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <MessageSquareText className="h-4 w-4" />
          <span className="hidden sm:inline">Importar WhatsApp</span>
        </Button>
      </DialogTrigger>
      <DialogContent 
        className="max-w-4xl max-h-[90vh] overflow-hidden"
        onPaste={handlePaste}
      >
        <DialogHeader>
          <DialogTitle>Importar Lead desde WhatsApp</DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
          {/* Left Panel: Image */}
          <div className="space-y-4">
            <Label>Screenshot de referencia</Label>
            <div
              ref={containerRef}
              onClick={() => fileInputRef.current?.click()}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              className={cn(
                "border-2 border-dashed rounded-lg cursor-pointer transition-colors",
                "hover:border-primary hover:bg-primary/5",
                "flex items-center justify-center min-h-[300px]",
                imagePreview ? "p-2" : "p-8"
              )}
            >
              {imagePreview ? (
                <div className="relative w-full">
                  <ScrollArea className="h-[400px]">
                    <img 
                      src={imagePreview} 
                      alt="Screenshot" 
                      className="w-full rounded"
                    />
                  </ScrollArea>
                  <Button
                    variant="destructive"
                    size="icon"
                    className="absolute top-2 right-2 h-8 w-8"
                    onClick={(e) => {
                      e.stopPropagation();
                      setImagePreview(null);
                    }}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <div className="text-center text-muted-foreground">
                  <ImageIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p className="font-medium">Click para subir imagen</p>
                  <p className="text-sm mt-1">o arrastra y suelta</p>
                  <div className="flex items-center justify-center gap-2 mt-4 text-xs">
                    <ClipboardPaste className="h-4 w-4" />
                    <span>También puedes pegar con Ctrl+V</span>
                  </div>
                </div>
              )}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
            />
          </div>

          {/* Right Panel: Form */}
          <ScrollArea className="h-[500px] pr-4">
            <div className="space-y-6">
              {/* Lead Data */}
              <div className="space-y-4">
                <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
                  Datos del Lead
                </h3>
                <div className="space-y-3">
                  <div>
                    <Label htmlFor="name">Nombre *</Label>
                    <Input
                      id="name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Nombre del lead"
                    />
                  </div>
                  <div>
                    <Label htmlFor="phone">Teléfono *</Label>
                    <Input
                      id="phone"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+54 9 11 1234-5678"
                    />
                  </div>
                  <div>
                    <Label>Ciudad</Label>
                    <OptionCombobox
                      options={cities}
                      value={city}
                      onValueChange={setCity}
                      placeholder="Seleccionar ciudad"
                      emptyText="Agregar nueva ciudad"
                    />
                  </div>
                  <div>
                    <Label>Rubro</Label>
                    <OptionCombobox
                      options={businessTypes}
                      value={businessType}
                      onValueChange={setBusinessType}
                      placeholder="Seleccionar rubro"
                      emptyText="Agregar nuevo rubro"
                    />
                  </div>
                </div>
              </div>

              {/* Next Contact (Optional) */}
              <div className="space-y-4 border-t pt-4">
                <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
                  Próximo Contacto (opcional)
                </h3>
                <div className="space-y-3">
                  <div>
                    <Label htmlFor="nextAction">Próxima acción</Label>
                    <Input
                      id="nextAction"
                      value={nextActionNote}
                      onChange={(e) => setNextActionNote(e.target.value.slice(0, MAX_NOTE_LENGTH))}
                      placeholder="Ej: Llamar para hacer seguimiento"
                      maxLength={MAX_NOTE_LENGTH}
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      {nextActionNote.length}/{MAX_NOTE_LENGTH}
                    </p>
                  </div>
                  <div>
                    <Label>Fecha próximo contacto</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal",
                            !nextContactDate && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {nextContactDate 
                            ? format(nextContactDate, "dd/MM/yyyy", { locale: es }) 
                            : "Seleccionar fecha"
                          }
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={nextContactDate}
                          onSelect={setNextContactDate}
                          initialFocus
                          className="p-3 pointer-events-auto"
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>
              </div>

              {/* Messages */}
              <div className="space-y-4 border-t pt-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
                    Mensajes de la conversación
                  </h3>
                  <Button variant="outline" size="sm" onClick={addMessage}>
                    <Plus className="h-4 w-4 mr-1" />
                    Agregar
                  </Button>
                </div>

                {messages.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No hay mensajes. Click en "Agregar" para añadir mensajes.
                  </p>
                ) : (
                  <div className="space-y-4">
                    {messages.map((msg, index) => (
                      <div key={msg.id} className="border rounded-lg p-3 space-y-3 bg-muted/30">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">Mensaje {index + 1}</span>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-destructive hover:text-destructive"
                            onClick={() => removeMessage(msg.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>

                        <Textarea
                          value={msg.content}
                          onChange={(e) => updateMessage(msg.id, { content: e.target.value })}
                          placeholder="Texto del mensaje..."
                          className="min-h-[60px]"
                        />

                        <div className="grid grid-cols-3 gap-2">
                          <div>
                            <Label className="text-xs">Dirección</Label>
                            <Select
                              value={msg.direction}
                              onValueChange={(val) => updateMessage(msg.id, { direction: val as "incoming" | "outgoing" })}
                            >
                              <SelectTrigger className="h-9">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="outgoing">Enviado</SelectItem>
                                <SelectItem value="incoming">Recibido</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <Label className="text-xs">Fecha</Label>
                            <Popover>
                              <PopoverTrigger asChild>
                                <Button
                                  variant="outline"
                                  className={cn(
                                    "w-full h-9 justify-start text-left font-normal text-xs",
                                    !msg.date && "text-muted-foreground"
                                  )}
                                >
                                  <CalendarIcon className="mr-1 h-3 w-3" />
                                  {msg.date 
                                    ? format(msg.date, "dd/MM/yy", { locale: es }) 
                                    : "Fecha"
                                  }
                                </Button>
                              </PopoverTrigger>
                              <PopoverContent className="w-auto p-0" align="start">
                                <Calendar
                                  mode="single"
                                  selected={msg.date}
                                  onSelect={(date) => updateMessage(msg.id, { date })}
                                  initialFocus
                                  className="p-3 pointer-events-auto"
                                />
                              </PopoverContent>
                            </Popover>
                          </div>
                          <div>
                            <Label className="text-xs">Hora</Label>
                            <Input
                              type="time"
                              value={msg.time}
                              onChange={(e) => updateMessage(msg.id, { time: e.target.value })}
                              className="h-9 text-xs"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </ScrollArea>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={handleClose}>
            Cancelar
          </Button>
          <Button onClick={handleSave}>
            Importar Lead
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
