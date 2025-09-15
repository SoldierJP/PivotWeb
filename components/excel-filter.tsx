"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { Upload, Download, FileSpreadsheet, Filter, Eye } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { downloadCSV } from "@/lib/download-utils"

interface ExcelData {
  headers: string[]
  rows: string[][]
}

interface FilterState {
  [key: string]: boolean
}

export function ExcelFilter() {
  const [excelData, setExcelData] = useState<ExcelData | null>(null)
  const [selectedColumns, setSelectedColumns] = useState<FilterState>({})
  const [filteredData, setFilteredData] = useState<ExcelData | null>(null)
  const [fileName, setFileName] = useState("")
  const [isProcessing, setIsProcessing] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }

    if (!file.name.endsWith(".csv") && !file.name.endsWith(".xlsx") && !file.name.endsWith(".xls")) {
      toast({
        title: "Tipo de archivo inválido",
        description: "Por favor sube un archivo CSV o Excel (.csv, .xlsx, .xls)",
        variant: "destructive",
      })
      return
    }

    setIsProcessing(true)
    setFileName(file.name)

    try {
      const text = await file.text()
      const lines = text.split("\n").filter((line) => line.trim())

      if (lines.length === 0) {
        throw new Error("Archivo vacío")
      }

      const headers = lines[0].split(",").map((h) => h.trim().replace(/"/g, ""))
      const rows = lines.slice(1).map((line) => line.split(",").map((cell) => cell.trim().replace(/"/g, "")))

      const data: ExcelData = { headers, rows }
      setExcelData(data)

      const initialSelection: FilterState = {}
      headers.forEach((header) => {
        initialSelection[header] = true
      })
      setSelectedColumns(initialSelection)
      setFilteredData(data)

      toast({
        title: "Archivo cargado exitosamente",
        description: `Se cargaron ${rows.length} filas con ${headers.length} columnas`,
      })
    } catch (error) {
      toast({
        title: "Error procesando archivo",
        description: "Hubo un error procesando tu archivo. Verifica que sea un CSV válido.",
        variant: "destructive",
      })
    } finally {
      setIsProcessing(false)
    }
  }

  const handleColumnToggle = (column: string, checked: boolean) => {
    const newSelection = { ...selectedColumns, [column]: checked }
    setSelectedColumns(newSelection)

    if (excelData) {
      const selectedColumnNames = Object.keys(newSelection).filter((col) => newSelection[col])
      const selectedIndices = selectedColumnNames.map((col) => excelData.headers.indexOf(col))

      const filteredHeaders = selectedColumnNames
      const filteredRows = excelData.rows.map((row) => selectedIndices.map((index) => row[index] || ""))

      setFilteredData({ headers: filteredHeaders, rows: filteredRows })
    }
  }

  const downloadFilteredData = () => {
    if (!filteredData) return

    const baseFileName = fileName.replace(/\.[^/.]+$/, "")

    const csvData = [filteredData.headers, ...filteredData.rows]
    downloadCSV(csvData, `filtrado_${baseFileName}.csv`)

    toast({
      title: "Descarga iniciada",
      description: `Tus datos filtrados han sido descargados como archivo CSV.`,
    })
  }

  const selectedCount = Object.values(selectedColumns).filter(Boolean).length
  const totalColumns = excelData?.headers.length || 0

  return (
    <div className="space-y-6">
      {/* File Upload */}
      <div className="space-y-4">
        <div>
          <Label>Subir Archivo Excel/CSV para Filtrar</Label>
          <div className="mt-2">
            <Input
              id="excel-input"
              type="file"
              accept=".csv,.xlsx,.xls"
              ref={fileInputRef}
              onChange={handleFileUpload}
              className="hidden"
            />
            <Button
              onClick={() => {
                console.log("[v0] Button clicked, triggering file input")
                fileInputRef.current?.click()
              }}
              variant="outline"
              className="w-full hover:bg-accent cursor-pointer"
              disabled={isProcessing}
            >
              <Upload className="w-4 h-4 mr-2" />
              {isProcessing ? "Procesando..." : "Elegir Archivo Excel/CSV"}
            </Button>
          </div>
          <p className="text-sm text-muted-foreground mt-2">
            El archivo se procesará localmente y no se guardará en la base de datos
          </p>
        </div>

        {fileName && (
          <div className="flex items-center space-x-2">
            <FileSpreadsheet className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">{fileName}</span>
          </div>
        )}
      </div>

      {/* Column Selection */}
      {excelData && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Filter className="w-4 h-4" />
              <span>Seleccionar Columnas a Incluir</span>
              <Badge variant="secondary">
                {selectedCount} de {totalColumns} seleccionadas
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {excelData.headers.map((header) => (
                <div key={header} className="flex items-center space-x-2">
                  <Checkbox
                    id={header}
                    checked={selectedColumns[header] || false}
                    onCheckedChange={(checked) => handleColumnToggle(header, checked as boolean)}
                  />
                  <Label className="text-sm font-medium truncate" title={header}>
                    {header}
                  </Label>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Data Preview */}
      {filteredData && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Eye className="w-4 h-4" />
              <span>Vista Previa de Datos Filtrados</span>
              <Badge variant="secondary">
                {filteredData.rows.length} filas × {filteredData.headers.length} columnas
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse border border-border">
                <thead>
                  <tr className="bg-muted">
                    {filteredData.headers.map((header, index) => (
                      <th key={index} className="border border-border p-2 text-left text-sm font-medium">
                        {header}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredData.rows.slice(0, 10).map((row, rowIndex) => (
                    <tr key={rowIndex} className="hover:bg-muted/50">
                      {row.map((cell, cellIndex) => (
                        <td key={cellIndex} className="border border-border p-2 text-sm">
                          {cell}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
              {filteredData.rows.length > 10 && (
                <p className="text-sm text-muted-foreground mt-2 text-center">
                  Mostrando las primeras 10 filas de {filteredData.rows.length} filas totales
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Download Button */}
      {filteredData && selectedCount > 0 && (
        <Button onClick={downloadFilteredData} className="w-full">
          <Download className="w-4 h-4 mr-2" />
          Descargar como CSV ({selectedCount} columnas)
        </Button>
      )}
    </div>
  )
}
