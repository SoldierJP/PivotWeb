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

  const detectEncoding = (buffer: ArrayBuffer): string => {
    const uint8Array = new Uint8Array(buffer)

    // Check for BOM markers
    if (uint8Array.length >= 3 && uint8Array[0] === 0xef && uint8Array[1] === 0xbb && uint8Array[2] === 0xbf) {
      return "utf-8"
    }
    if (uint8Array.length >= 2 && uint8Array[0] === 0xff && uint8Array[1] === 0xfe) {
      return "utf-16le"
    }
    if (uint8Array.length >= 2 && uint8Array[0] === 0xfe && uint8Array[1] === 0xff) {
      return "utf-16be"
    }

    // Default to UTF-8
    return "utf-8"
  }

  const parseCSVLine = (line: string): string[] => {
    const result: string[] = []
    let current = ""
    let inQuotes = false
    let i = 0

    while (i < line.length) {
      const char = line[i]

      if (char === '"') {
        if (inQuotes && line[i + 1] === '"') {
          // Escaped quote
          current += '"'
          i += 2
        } else {
          // Toggle quote state
          inQuotes = !inQuotes
          i++
        }
      } else if (char === "," && !inQuotes) {
        // Field separator
        result.push(current.trim())
        current = ""
        i++
      } else {
        current += char
        i++
      }
    }

    result.push(current.trim())
    return result
  }

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }

    if (!file.name.endsWith(".csv")) {
      toast({
        title: "Formato no soportado completamente",
        description:
          "Para archivos Excel (.xlsx, .xls), por favor conviértelos a CSV primero. Solo archivos CSV son completamente compatibles.",
        variant: "destructive",
      })
      setIsProcessing(false)
      return
    }

    setIsProcessing(true)
    setFileName(file.name)

    try {
      let text: string

      if (file.name.endsWith(".csv")) {
        const buffer = await file.arrayBuffer()
        const encoding = detectEncoding(buffer)
        const decoder = new TextDecoder(encoding)
        text = decoder.decode(buffer)
      } else {
        toast({
          title: "Formato no soportado completamente",
          description:
            "Para archivos Excel (.xlsx, .xls), por favor conviértelos a CSV primero. Solo archivos CSV son completamente compatibles.",
          variant: "destructive",
        })
        setIsProcessing(false)
        return
      }

      const lines = text.split(/\r?\n/).filter((line) => line.trim())

      if (lines.length === 0) {
        throw new Error("Archivo vacío")
      }

      const headers = parseCSVLine(lines[0])
      const rows = lines.slice(1).map((line) => parseCSVLine(line))

      // Filter out empty rows
      const validRows = rows.filter((row) => row.some((cell) => cell.trim() !== ""))

      const data: ExcelData = { headers, rows: validRows }
      setExcelData(data)

      const initialSelection: FilterState = {}
      headers.forEach((header) => {
        initialSelection[header] = true
      })
      setSelectedColumns(initialSelection)
      setFilteredData(data)

      toast({
        title: "Archivo cargado exitosamente",
        description: `Se cargaron ${validRows.length} filas con ${headers.length} columnas`,
      })
    } catch (error) {
      console.error("Error processing file:", error)
      toast({
        title: "Error procesando archivo",
        description: "Hubo un error procesando tu archivo. Verifica que sea un CSV válido con codificación UTF-8.",
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
          <Label>Subir Archivo CSV para Filtrar</Label>
          <div className="mt-2">
            <Input
              id="excel-input"
              type="file"
              accept=".csv"
              ref={fileInputRef}
              onChange={handleFileUpload}
              className="sr-only"
            />
            <Button
              onClick={() => fileInputRef.current?.click()}
              variant="outline"
              className="w-full hover:bg-accent cursor-pointer"
              disabled={isProcessing}
            >
              <Upload className="w-4 h-4 mr-2" />
              {isProcessing ? "Procesando..." : "Elegir Archivo CSV"}
            </Button>
          </div>
          <p className="text-sm text-muted-foreground mt-2">
            El archivo se procesará localmente y no se guardará en la base de datos. Para archivos Excel, conviértelos a
            CSV primero.
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
