import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { FileUp, Upload, AlertCircle, CheckCircle2, XCircle } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { dataRepository } from "@/lib/DataRepository";
import { Lead } from "@/types/crm";

interface ImportCSVDialogProps {
  onImportComplete: () => void;
  trigger?: React.ReactNode;
}

interface ImportResult {
  total: number;
  created: number;
  duplicates: number;
  errors: number;
}

const REQUIRED_HEADERS = ["Nombre", "Telefono", "Rubro"];

// Normaliza el teléfono eliminando todos los caracteres no numéricos
const normalizePhone = (phone: string): string => {
  return phone.replace(/[^\d]/g, "");
};

export function ImportCSVDialog({ onImportComplete, trigger }: ImportCSVDialogProps) {
  const [open, setOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [previewData, setPreviewData] = useState<string[][] | null>(null);
  const [headerError, setHeaderError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const resetState = () => {
    setFile(null);
    setResult(null);
    setPreviewData(null);
    setHeaderError(null);
    setIsProcessing(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    if (!newOpen) {
      resetState();
    }
  };

  const parseCSV = (text: string): string[][] => {
    const lines = text.split(/\r?\n/).filter(line => line.trim() !== "");
    return lines.map(line => {
      const values: string[] = [];
      let current = "";
      let inQuotes = false;
      
      for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '"') {
          inQuotes = !inQuotes;
        } else if (char === "," && !inQuotes) {
          values.push(current.trim());
          current = "";
        } else {
          current += char;
        }
      }
      values.push(current.trim());
      return values;
    });
  };

  const validateHeaders = (headers: string[]): boolean => {
    const normalizedHeaders = headers.map(h => h.trim().toLowerCase());
    const requiredNormalized = REQUIRED_HEADERS.map(h => h.toLowerCase());
    
    return requiredNormalized.every((req, index) => 
      normalizedHeaders[index] === req
    );
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (!selectedFile) return;

    setFile(selectedFile);
    setResult(null);
    setHeaderError(null);

    try {
      const text = await selectedFile.text();
      const rows = parseCSV(text);
      
      if (rows.length === 0) {
        setHeaderError("El archivo está vacío");
        return;
      }

      const headers = rows[0];
      if (!validateHeaders(headers)) {
        setHeaderError(`La cabecera debe ser exactamente: ${REQUIRED_HEADERS.join(",")}`);
        setPreviewData(null);
        return;
      }

      // Mostrar preview de las primeras 5 filas
      setPreviewData(rows.slice(0, 6));
    } catch (error) {
      setHeaderError("Error al leer el archivo");
    }
  };

  const handleImport = async () => {
    if (!file) return;

    setIsProcessing(true);
    setResult(null);

    try {
      const text = await file.text();
      const rows = parseCSV(text);
      
      if (rows.length < 2) {
        toast({
          title: "Archivo vacío",
          description: "El archivo no contiene datos para importar",
          variant: "destructive"
        });
        setIsProcessing(false);
        return;
      }

      // Obtener leads existentes para verificar duplicados
      const existingLeads = await dataRepository.getLeads();
      const existingPhones = new Set(
        existingLeads.map(lead => normalizePhone(lead.phone))
      );

      // Set para rastrear teléfonos procesados en este CSV
      const processedPhones = new Set<string>();

      const importResult: ImportResult = {
        total: rows.length - 1, // Excluir cabecera
        created: 0,
        duplicates: 0,
        errors: 0
      };

      // Procesar cada fila (saltando la cabecera)
      for (let i = 1; i < rows.length; i++) {
        const row = rows[i];
        
        // Validar que tenga todas las columnas
        if (row.length < 3) {
          importResult.errors++;
          continue;
        }

        const [nombre, telefono, rubro] = row;

        // Validar campos obligatorios
        if (!nombre || nombre.trim() === "") {
          importResult.errors++;
          continue;
        }
        if (!telefono || telefono.trim() === "") {
          importResult.errors++;
          continue;
        }
        if (!rubro || rubro.trim() === "") {
          importResult.errors++;
          continue;
        }

        // Normalizar teléfono
        const normalizedPhone = normalizePhone(telefono);
        
        if (!normalizedPhone) {
          importResult.errors++;
          continue;
        }

        // Verificar duplicados (tanto en existentes como en este CSV)
        if (existingPhones.has(normalizedPhone) || processedPhones.has(normalizedPhone)) {
          importResult.duplicates++;
          continue;
        }

        // Marcar como procesado
        processedPhones.add(normalizedPhone);

        // Crear el lead usando la misma lógica que CreateLeadDialog
        const newLead: Lead = {
          id: `lead-${Date.now()}-${i}`,
          name: nombre.trim(),
          phone: normalizedPhone,
          city: "",
          businessType: rubro.trim(),
          pipelineState: "nuevo",
          createdAt: new Date().toISOString(),
          temperature: "cold",
          temperatureManual: false
        };

        try {
          await dataRepository.saveLead(newLead);
          importResult.created++;
        } catch (error) {
          importResult.errors++;
        }
      }

      setResult(importResult);

      if (importResult.created > 0) {
        toast({
          title: "Importación completada",
          description: `Se crearon ${importResult.created} leads nuevos`
        });
        onImportComplete();
      }
    } catch (error) {
      toast({
        title: "Error en la importación",
        description: "Ocurrió un error al procesar el archivo",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline">
            <FileUp className="h-4 w-4 mr-2" />
            Importar New Leads
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Importar Leads desde CSV</DialogTitle>
          <DialogDescription>
            Carga un archivo CSV para crear múltiples leads de forma masiva.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Instrucciones */}
          <div className="rounded-lg border bg-muted/50 p-4 text-sm">
            <p className="font-medium mb-2">Formato requerido del CSV:</p>
            <code className="block bg-background rounded px-2 py-1 text-xs mb-2">
              Nombre,Telefono,Rubro
            </code>
            <ul className="text-muted-foreground space-y-1 text-xs">
              <li>• Todos los campos son obligatorios</li>
              <li>• Los teléfonos se normalizan automáticamente</li>
              <li>• Los duplicados se detectan por teléfono</li>
              <li>• Los leads se crean en estado "Nuevo / Sin Contactar" y temperatura "Cold"</li>
            </ul>
          </div>

          {/* Input de archivo */}
          <div className="space-y-2">
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,text/csv"
              onChange={handleFileSelect}
              className="hidden"
              id="csv-file-input"
            />
            <Button
              variant="outline"
              className="w-full"
              onClick={() => fileInputRef.current?.click()}
              disabled={isProcessing}
            >
              <Upload className="h-4 w-4 mr-2" />
              {file ? file.name : "Seleccionar archivo CSV"}
            </Button>
          </div>

          {/* Error de cabecera */}
          {headerError && (
            <div className="flex items-center gap-2 text-destructive text-sm p-3 rounded-lg bg-destructive/10">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              <span>{headerError}</span>
            </div>
          )}

          {/* Preview de datos */}
          {previewData && !headerError && (
            <div className="rounded-lg border overflow-hidden">
              <div className="bg-muted px-3 py-2 text-xs font-medium">
                Vista previa ({previewData.length - 1} filas mostradas)
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-muted/50">
                      {previewData[0].map((header, i) => (
                        <th key={i} className="px-3 py-2 text-left font-medium">
                          {header}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {previewData.slice(1, 5).map((row, i) => (
                      <tr key={i} className="border-t">
                        {row.map((cell, j) => (
                          <td key={j} className="px-3 py-2 truncate max-w-[150px]">
                            {cell}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Resultados de la importación */}
          {result && (
            <div className="rounded-lg border p-4 space-y-3">
              <div className="flex items-center gap-2 text-lg font-medium">
                <CheckCircle2 className="h-5 w-5 text-green-500" />
                Importación completada
              </div>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="flex items-center justify-between p-2 rounded bg-muted/50">
                  <span className="text-muted-foreground">Filas procesadas:</span>
                  <span className="font-medium">{result.total}</span>
                </div>
                <div className="flex items-center justify-between p-2 rounded bg-green-500/10">
                  <span className="text-green-700">Leads creados:</span>
                  <span className="font-medium text-green-700">{result.created}</span>
                </div>
                <div className="flex items-center justify-between p-2 rounded bg-yellow-500/10">
                  <span className="text-yellow-700">Duplicados:</span>
                  <span className="font-medium text-yellow-700">{result.duplicates}</span>
                </div>
                <div className="flex items-center justify-between p-2 rounded bg-red-500/10">
                  <span className="text-red-700">Errores:</span>
                  <span className="font-medium text-red-700">{result.errors}</span>
                </div>
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => handleOpenChange(false)}>
            {result ? "Cerrar" : "Cancelar"}
          </Button>
          {!result && (
            <Button
              onClick={handleImport}
              disabled={!file || !!headerError || isProcessing}
            >
              {isProcessing ? "Importando..." : "Importar leads"}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}