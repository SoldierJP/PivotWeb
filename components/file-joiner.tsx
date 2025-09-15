"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Download, Database, FileText, Loader2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { downloadText, formatFileSize } from "@/lib/download-utils"

interface DatabaseFile {
  id: string
  name: string
  size: number
  content: string
}

type JoinMethod = "concatenate" | "merge-lines"

export function FileJoiner() {
  const [availableFiles, setAvailableFiles] = useState<DatabaseFile[]>([])
  const [selectedFileIds, setSelectedFileIds] = useState<string[]>([])
  const [joinMethod, setJoinMethod] = useState<JoinMethod>("concatenate")
  const [isLoading, setIsLoading] = useState(false)
  const [isJoining, setIsJoining] = useState(false)
  const { toast } = useToast()

  const fetchDatabaseFiles = async () => {
    setIsLoading(true)
    try {
      const response = await fetch("/api/database-files")
      if (!response.ok) {
        throw new Error("Error al conectar con la base de datos")
      }
      const files = await response.json()
      setAvailableFiles(files)

      toast({
        title: "Archivos cargados",
        description: `Se encontraron ${files.length} archivos en la base de datos`,
      })
    } catch (error) {
      toast({
        title: "Error de conexión",
        description: "No se pudo conectar con la base de datos PostgreSQL. Verifica que esté ejecutándose.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchDatabaseFiles()
  }, [])

  const toggleFileSelection = (fileId: string) => {
    setSelectedFileIds((prev) => (prev.includes(fileId) ? prev.filter((id) => id !== fileId) : [...prev, fileId]))
  }

  const joinAndDownload = async () => {
    if (selectedFileIds.length === 0) {
      toast({
        title: "Sin archivos seleccionados",
        description: "Por favor selecciona al menos un archivo para unir.",
        variant: "destructive",
      })
      return
    }

    setIsJoining(true)
    try {
      const selectedFiles = availableFiles.filter((file) => selectedFileIds.includes(file.id))
      let joinedContent = ""

      switch (joinMethod) {
        case "concatenate":
          joinedContent = selectedFiles.map((file) => `\n--- ${file.name} ---\n${file.content}\n`).join("")
          break

        case "merge-lines":
          const allLines = selectedFiles.flatMap((file) => file.content.split("\n"))
          joinedContent = allLines.join("\n")
          break
      }

      downloadText(joinedContent, {
        filename: `archivos-unidos-${Date.now()}.txt`,
        type: "text/plain",
      })

      toast({
        title: "Archivos unidos exitosamente",
        description: `Se descargaron ${selectedFiles.length} archivos combinados usando el método ${joinMethod === "concatenate" ? "concatenar" : "unir líneas"}.`,
      })
    } catch (error) {
      toast({
        title: "Error al unir archivos",
        description: "Hubo un error procesando los archivos.",
        variant: "destructive",
      })
    } finally {
      setIsJoining(false)
    }
  }

  const selectedFiles = availableFiles.filter((file) => selectedFileIds.includes(file.id))

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Label>Archivos en Base de Datos PostgreSQL</Label>
          <Button onClick={fetchDatabaseFiles} disabled={isLoading} variant="outline" size="sm">
            <Database className="w-4 h-4 mr-2" />
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Actualizar"}
          </Button>
        </div>

        {/* Available Files Display */}
        {availableFiles.length > 0 && (
          <div className="space-y-2">
            <Label>Archivos Disponibles ({availableFiles.length})</Label>
            <div className="grid gap-2 max-h-60 overflow-y-auto">
              {availableFiles.map((file) => (
                <Card
                  key={file.id}
                  className={`p-3 cursor-pointer transition-colors ${
                    selectedFileIds.includes(file.id) ? "bg-primary/10 border-primary" : "hover:bg-muted/50"
                  }`}
                  onClick={() => toggleFileSelection(file.id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <FileText className="w-4 h-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">{file.name}</p>
                        <p className="text-xs text-muted-foreground">{formatFileSize(file.size)}</p>
                      </div>
                    </div>
                    {selectedFileIds.includes(file.id) && <Badge variant="default">Seleccionado</Badge>}
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

        {availableFiles.length === 0 && !isLoading && (
          <div className="text-center py-8 text-muted-foreground">
            <Database className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No se encontraron archivos en la base de datos</p>
            <p className="text-sm">Verifica que la base de datos esté ejecutándose en el puerto 5433</p>
          </div>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="join-method">Método de Unión</Label>
        <Select value={joinMethod} onValueChange={(value: JoinMethod) => setJoinMethod(value)}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="concatenate">Concatenar con separadores</SelectItem>
            <SelectItem value="merge-lines">Unir todas las líneas</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Join and Download Button */}
      <Button onClick={joinAndDownload} disabled={selectedFileIds.length === 0 || isJoining} className="w-full">
        <Download className="w-4 h-4 mr-2" />
        {isJoining ? "Uniendo Archivos..." : "Unir y Descargar"}
      </Button>

      {selectedFiles.length > 0 && (
        <div className="flex items-center justify-center space-x-2 text-sm text-muted-foreground">
          <Badge variant="secondary">
            {selectedFiles.length} archivo{selectedFiles.length !== 1 ? "s" : ""} seleccionado
            {selectedFiles.length !== 1 ? "s" : ""}
          </Badge>
          <Badge variant="secondary">
            Tamaño total: {formatFileSize(selectedFiles.reduce((acc, f) => acc + f.size, 0))}
          </Badge>
        </div>
      )}
    </div>
  )
}
