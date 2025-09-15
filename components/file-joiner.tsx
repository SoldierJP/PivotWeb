"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Download, Database, FileText, Loader2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface DatabaseFile {
  id: number
  filename: string
}

export function FileJoiner() {
  const [availableFiles, setAvailableFiles] = useState<DatabaseFile[]>([])
  const [selectedFileIds, setSelectedFileIds] = useState<number[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isJoining, setIsJoining] = useState(false)
  const { toast } = useToast()

  const fetchDatabaseFiles = async () => {
    setIsLoading(true)
    try {
      const response = await fetch("http://localhost:8000/files")
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
        description: "No se pudo conectar con la base de datos PostgreSQL. Verifica que el backend esté ejecutándose.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchDatabaseFiles()
  }, [])

  const toggleFileSelection = (fileId: number) => {
    setSelectedFileIds((prev) =>
      prev.includes(fileId) ? prev.filter((id) => id !== fileId) : [...prev, fileId]
    )
  }

  const unifyAndDownload = async () => {
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
      const ids = selectedFileIds.join(",")
      const response = await fetch(`http://localhost:8000/files/unify?ids=${ids}`)
      if (!response.ok) {
        throw new Error("Error unificando archivos")
      }
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `archivos-unificados-${Date.now()}.xlsx`
      a.click()

      toast({
        title: "Archivos unidos exitosamente",
        description: `Se descargó un archivo Excel unificado con ${selectedFileIds.length} archivos.`,
      })
    } catch (error) {
      toast({
        title: "Error al unir archivos",
        description: "Hubo un error procesando los archivos desde el backend.",
        variant: "destructive",
      })
    } finally {
      setIsJoining(false)
    }
  }

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
                      <p className="text-sm font-medium">{file.filename}</p>
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
            <p className="text-sm">Verifica que el backend FastAPI esté corriendo en el puerto 8000</p>
          </div>
        )}
      </div>

      <Button onClick={unifyAndDownload} disabled={selectedFileIds.length === 0 || isJoining} className="w-full">
        <Download className="w-4 h-4 mr-2" />
        {isJoining ? "Uniendo Archivos..." : "Unir y Descargar"}
      </Button>

      {selectedFileIds.length > 0 && (
        <div className="flex items-center justify-center space-x-2 text-sm text-muted-foreground">
          <Badge variant="secondary">
            {selectedFileIds.length} archivo{selectedFileIds.length !== 1 ? "s" : ""} seleccionado
          </Badge>
        </div>
      )}
    </div>
  )
}
